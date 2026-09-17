import assert from 'node:assert/strict';
import { convertLeadToDealIfNeeded, isWonLeadStage } from '../src/services/leadDealConversion.js';
import { DEALS_STORAGE_KEY, loadDeals, buildDeal } from '../src/services/dealService.js';

const DETAIL = 'evenmore-crm-lead-details-v1';
function memory() {
  const map = new Map();
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) };
}
const stages = [{ id: 'negotiation', name: 'Negotiation' }, { id: 'won', name: 'Won' }];
const lead = { id: 42, name: 'Prospect', company: 'Company', phone: '123456789', status: 'Won', amount: 1234, owner: 'Amit', ownerId: 'emp-1', teamId: 'team-1', customerId: 'customer-1', source: 'Referral', expectedCloseDate: '2026-10-03', products: [{ id: 'product-1', name: 'Machine', qty: 3, price: 411 }] };
const storage = memory();
storage.setItem(DEALS_STORAGE_KEY, '[]');
storage.setItem(DETAIL, JSON.stringify({42: {activities: [{id: 'old', title: 'Called'}], tasks: [{id: 'task-1'}]}}));
const convert = (value = lead, extra = {}) => convertLeadToDealIfNeeded(value, {stages, storage, ...extra});
assert.equal(convert({...lead, status: 'Negotiation'}), null);
const deal = convert();
assert.equal(deal.stage, buildDeal({name:'Manual',client:'Client',phone:'123'}).stage);
for (const key of ['ownerId','teamId','customerId','source','expectedCloseDate']) assert.equal(deal[key], lead[key]);
assert.equal(deal.assignedUser, 'Amit');
assert.equal(deal.price, 1234);
assert.deepEqual(deal.products, lead.products);
assert.equal(deal.date, lead.expectedCloseDate);
assert.equal(convert().id, deal.id);
assert.equal(convert({...lead, id: '42', name:'Edited'}).id, deal.id);
assert.equal(loadDeals(storage).length, 1);
let detail = JSON.parse(storage.getItem(DETAIL))['42'];
assert.equal(detail.convertedDealId, deal.id);
assert.equal(detail.activities.length, 2);
assert.equal(detail.tasks.length, 1);
// Reload and repair a missing reverse link without another deal or activity.
detail.convertedDealId = null;
storage.setItem(DETAIL, JSON.stringify({42: detail}));
convert();
assert.equal(loadDeals(storage).length, 1);
assert.equal(JSON.parse(storage.getItem(DETAIL))['42'].activities.length, 2);
assert.throws(() => convert({name:'Missing ID'}), /Lead ID/);
assert.throws(() => convert({...lead,id:43,phone:''}), /required/);
assert.throws(() => convert({...lead,id:43,customerId:{}}), /Invalid customerId/);
assert.throws(() => convert({...lead,id:43,products:[null]}), /Invalid lead products/);
assert.equal(loadDeals(storage).length, 1);
storage.setItem('evenmore-crm-stages-v1', JSON.stringify({leadStages:[{id:'ld-7',name:'Order Confirmed',status:'Active'}]}));
assert.equal(isWonLeadStage('Order Confirmed',stages,storage), true);
assert.equal(isWonLeadStage('Won',stages,storage), false);
storage.setItem('evenmore-crm-stages-v1', JSON.stringify({leadStages:[]}));
assert.equal(isWonLeadStage('Won',stages,storage), false);
// A failure on either write must leave both stores byte-for-byte unchanged.
for (const failedKey of [DETAIL, DEALS_STORAGE_KEY]) {
  const failing = memory();
  failing.setItem(DEALS_STORAGE_KEY, '[]');
  failing.setItem(DETAIL, JSON.stringify({42:{notes:'Keep me'}}));
  const before = [failing.getItem(DETAIL), failing.getItem(DEALS_STORAGE_KEY)];
  const write = failing.setItem;
  failing.setItem = (key, value) => { if (key === failedKey) throw new Error('Quota exceeded'); write(key,value); };
  assert.throws(() => convert(lead,{storage:failing}), /Quota exceeded/);
  assert.deepEqual([failing.getItem(DETAIL),failing.getItem(DEALS_STORAGE_KEY)], before);
}
console.log('Lead conversion checks passed: mapping, defaults, repeated calls/reload, reverse-link repair, stage configuration, validation, and write rollback.');

// Exercise the actual shared entry point and task-completion progression using Vite's module loader.
const { createServer } = await import('vite');
globalThis.localStorage = memory();
globalThis.document = { documentElement: { setAttribute() {}, classList: { add() {}, remove() {} } } };
globalThis.window = new EventTarget();
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const engine = await server.ssrLoadModule('/src/services/leadStageAutomation.js');
  const completion = await server.ssrLoadModule('/src/services/taskCompletionService.js');
  const stageConfig = [
    {id:'negotiation',name:'Negotiation',tasks:[{id:'task-template',name:'Call',autoCreate:true,required:true,role:'BDE',repeats:3}]},
    {id:'won',name:'Won',tasks:[]},
  ];
  localStorage.setItem('leadStageTasksV1',JSON.stringify(stageConfig));
  localStorage.setItem(DEALS_STORAGE_KEY,'[]');
  localStorage.setItem(engine.CRM_TASKS_STORAGE_KEY,'[]');
  const negotiating = {...lead,status:'Negotiation'};
  localStorage.setItem(engine.LEADS_STORAGE_KEY,JSON.stringify([negotiating]));
  const tasks = engine.runLeadStageAutomation(negotiating,'Negotiation',{previousStage:'New Lead'});
  assert.equal(tasks.length,1);
  assert.equal(engine.runLeadStageAutomation(negotiating,'Negotiation').length,0);
  const result = completion.completeTaskWithOutcome({task:tasks[0],lead:negotiating,outcome:'Successful',nextAction:'move-next-stage',completedBy:'Amit'});
  assert.equal(result.ok,true);
  assert.equal(result.nextLeadStage,'Won');
  assert.equal(loadDeals().length,1);
  assert.equal(engine.loadCrmTasks()[0].status,'Completed');
  engine.runLeadStageAutomation(lead,'Won',{previousStage:'Negotiation'});
  engine.runLeadStageAutomation({...lead,name:'Edited'},'Won',{previousStage:'Won'});
  assert.equal(loadDeals().length,1);
  const events = JSON.parse(localStorage.getItem(DETAIL))['42'].activities;
  assert.equal(events.filter((event)=>event.type==='lead-converted').length,1);
  assert.ok(events.some((event)=>event.title.includes('completed')));
  console.log('Shared automation and task completion checks passed.');
} finally { await server.close(); }
