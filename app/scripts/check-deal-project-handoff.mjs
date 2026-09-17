import assert from 'node:assert/strict';
import { createProjectFromDeal, loadProjects, findDealProject, PROJECTS_STORAGE_KEY, projectDefaults } from '../src/services/dealProjectService.js';
import { DEALS_STORAGE_KEY, loadDeals } from '../src/services/dealService.js';

const DETAILS = 'evenmore-crm-lead-details-v1';
function memory() {
  const map = new Map();
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) };
}
const deal = { id: 'dl-test', name: 'Automation Line', client: 'Sunrise', customerId: 'cust-1', assignedUser: 'Amit', ownerId: 'emp-1', team: 'Sales', teamId: 'team-1', stage: 'Won', price: 1200000, leadId: 42, phone: '123456', product: 'Machine', products: [{id:'product-1',qty:2}], date:'2026-10-01' };
function setup(value = deal) {
  const storage = memory();
  storage.setItem(DEALS_STORAGE_KEY, JSON.stringify([value]));
  storage.setItem(DETAILS, JSON.stringify({42:{convertedDealId:deal.id,activities:[{id:'lead-conversion',title:'Converted'}]}}));
  return storage;
}
const storage = setup();
assert.equal(projectDefaults(deal).startDate, '');
assert.equal(projectDefaults(deal).expectedEndDate, '');
const result = createProjectFromDeal(deal.id, {name:'Plant Installation',startDate:'2026-10-03',expectedEndDate:'2026-10-10',projectType:'Installation'}, {storage});
assert.equal(result.created,true);
assert.equal(result.project.projectType,'Installation');
assert.throws(()=>createProjectFromDeal(deal.id,{}, {storage:setup()}),/Start date is required/);
assert.equal(result.project.sourceDealId,deal.id);
for (const key of ['customerId','ownerId','teamId','price']) assert.equal(result.project[key],deal[key]);
assert.equal(result.project.customer,deal.client);
assert.equal(result.project.owner,deal.assignedUser);
assert.equal(result.project.team,deal.team);
assert.deepEqual(result.project.products,deal.products);
const savedDeal = loadDeals(storage)[0];
for (const [key,value] of Object.entries(deal)) assert.deepEqual(savedDeal[key],value);
assert.equal(savedDeal.projectId,result.project.id);
assert.equal(findDealProject(savedDeal,storage).id,result.project.id);
assert.equal(createProjectFromDeal(deal.id,{}, {storage}).created,false);
assert.equal(loadProjects(storage).length,1);
assert.equal(loadDeals(storage)[0].activities.length,1);
const detail=JSON.parse(storage.getItem(DETAILS))['42'];
assert.equal(detail.convertedDealId,deal.id);
assert.equal(detail.activities.length,2);
assert.equal(detail.activities[0].projectId,result.project.id);
assert.throws(()=>createProjectFromDeal(null,{}, {storage}),/ID/);
assert.throws(()=>createProjectFromDeal('missing',{}, {storage}),/not found/);
for (const invalid of [{...deal,stage:'Draft'},{...deal,customerId:null,client:''},{...deal,ownerId:null,assignedUser:''},{...deal,projectId:'missing'}]) {
  const sample=setup(invalid);
  const before=sample.getItem(DEALS_STORAGE_KEY);
  assert.throws(()=>createProjectFromDeal(deal.id,{}, {storage:sample}));
  assert.equal(sample.getItem(DEALS_STORAGE_KEY),before);
  assert.equal(loadProjects(sample).length,0);
}
for (const dates of [{startDate:'2026-02-30'},{startDate:'2026-12-01',expectedEndDate:'2026-11-01'}]) assert.throws(()=>createProjectFromDeal(deal.id,dates,{storage:setup()}));
for (const failedKey of [PROJECTS_STORAGE_KEY,DETAILS,DEALS_STORAGE_KEY]) {
  const sample=setup();
  const keys=[PROJECTS_STORAGE_KEY,DETAILS,DEALS_STORAGE_KEY];
  const before=keys.map((key)=>sample.getItem(key));
  const write=sample.setItem;
  sample.setItem=(key,value)=>{if(key===failedKey) throw new Error('Quota exceeded');write(key,value);};
  assert.throws(()=>createProjectFromDeal(deal.id,{startDate:'2026-10-03'}, {storage:sample}),/Quota/);
  assert.deepEqual(keys.map((key)=>sample.getItem(key)),before);
}
const orphan=setup();
orphan.setItem(PROJECTS_STORAGE_KEY,JSON.stringify([result.project]));
assert.equal(createProjectFromDeal(deal.id,{}, {storage:orphan}).created,false);
assert.equal(loadProjects(orphan).length,1);
assert.equal(loadDeals(orphan)[0].projectId,result.project.id);
const legacy = setup();
legacy.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([{ ...result.project, projectNumber: undefined }]));
const numbered = loadProjects(legacy)[0];
assert.match(numbered.projectNumber, /^P-\d{6}$/);
assert.equal(numbered.id, result.project.id);
assert.equal(loadProjects(legacy)[0].projectNumber, numbered.projectNumber);
assert.equal(JSON.parse(legacy.getItem(PROJECTS_STORAGE_KEY))[0].projectNumber, numbered.projectNumber);
assert.equal(result.project.projectNumber, 'P-000001');
const anotherDeal = { ...deal, id: 'dl-second', leadId: undefined };
legacy.setItem(DEALS_STORAGE_KEY, JSON.stringify([anotherDeal]));
const second = createProjectFromDeal(anotherDeal.id, {startDate:'2026-10-03'}, { storage: legacy });
assert.equal(second.project.projectNumber, 'P-000002');
assert.equal(loadProjects(legacy).find((item) => item.id === numbered.id).projectNumber, numbered.projectNumber);
console.log('Project hand-off service and numbering checks passed.');

if (process.argv.includes('--browser')) {
  const {createServer}=await import('vite');
  const {default:puppeteer}=await import('puppeteer-core');
  const server=await createServer({server:{port:5189,strictPort:true,host:'127.0.0.1'}});
  await server.listen();
  let browser;
  try {
    browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-first-run']});
    const page=await browser.newPage();
    await page.setViewport({width:1440,height:1100});
    const errors=[];
    page.on('pageerror',(error)=>errors.push(error.message));
    await page.goto('http://127.0.0.1:5189');
    await page.evaluate((value)=>localStorage.setItem('evenmore_crm_deals_v2',JSON.stringify([value])),deal);
    await page.goto('http://127.0.0.1:5189/crm/deals?deal=dl-test');
    async function clickText(text) {
      const element=await page.waitForSelector(`::-p-text(${text})`);
      await element.click();
    }
    await clickText('Create Project');
    await page.waitForSelector('[role="dialog"]');
    const values=await page.$$eval('[role="dialog"] input:not([type="checkbox"])',(inputs)=>inputs.map((input)=>input.value));
    assert.deepEqual(values,['Automation Line','Sunrise','Amit','Sales','','','']);
    assert.equal(await page.$eval('[role="dialog"] input[type="checkbox"]', (input) => input.checked), true);
    await page.click('[role="dialog"] button[type="submit"]');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('evenmore-crm-projects-v1')||'[]').length),0);
    await page.$eval('[role="dialog"] input[type="date"][required]', (input) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '2026-10-03');
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.dispatchEvent(new Event('change', {bubbles:true}));
    });
    await page.screenshot({path:'scripts/project-create-modal.png', fullPage:true});
    await page.click('[role="dialog"] button[type="submit"]');
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('evenmore-crm-projects-v1')||'[]').length===1);
    await page.waitForSelector('[role="dialog"] a');
    assert.ok((await page.$eval('[role="dialog"]',(dialog)=>dialog.innerText)).includes('Customer transferred'));
    await page.screenshot({path:'scripts/project-create-success.png', fullPage:true});
    await page.click('[role="dialog"] a');
    await page.waitForFunction(()=>location.pathname.startsWith('/crm/projects/'));
    await page.waitForFunction(()=>document.body.innerText.includes('Source Deal:'));
    assert.ok((await page.$eval('body',(body)=>body.innerText)).includes('dl-test'));
    await page.waitForFunction(()=>document.body.innerText.includes('CRM Relationship'));
    const projectText = await page.$eval('body', (body) => body.innerText);
    for (const title of ['P-000001', 'Project Information', 'Deal Information', 'Project Description', 'Project Created from Deal']) assert.ok(projectText.includes(title));
    await page.screenshot({path:'scripts/project-detail-desktop.png', fullPage:true});
    await page.setViewport({width:390,height:844});
    await page.waitForFunction(()=>document.documentElement.scrollWidth <= window.innerWidth);
    await page.screenshot({path:'scripts/project-detail-mobile.png', fullPage:true});
    await page.click('[aria-label="Open navigation"]');
    await page.waitForSelector('[data-navigation-open="true"]');
    await page.keyboard.press('Escape');
    await page.waitForSelector('[data-navigation-open="false"]');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth),false);
    await page.setViewport({width:1440,height:1100});
    await page.reload();
    await page.waitForFunction(()=>document.body.innerText.includes('Source Deal:'));
    await clickText('Back to Deal');
    await page.waitForSelector('::-p-text(View Project)');
    await page.reload();
    await page.waitForSelector('::-p-text(View Project)');
    const persisted=await page.evaluate(()=>({deals:JSON.parse(localStorage.getItem('evenmore_crm_deals_v2')),projects:JSON.parse(localStorage.getItem('evenmore-crm-projects-v1'))}));
    assert.equal(persisted.projects.length,1);
    assert.equal(persisted.projects[0].startDate,'2026-10-03');
    assert.ok((await page.$eval('body',body=>body.innerText)).includes('Project Linked'));
    assert.ok((await page.$eval('body',body=>body.innerText)).includes('Created On'));
    assert.equal(persisted.deals[0].stage,'Won');
    assert.equal(persisted.deals[0].projectId,persisted.projects[0].id);
    assert.deepEqual(errors,[]);
    console.log('Browser hand-off, prefill, project navigation, return link, and reload checks passed.');
  } finally {if(browser) await browser.close();await server.close();}
}
