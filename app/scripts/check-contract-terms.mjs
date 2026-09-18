import assert from 'node:assert/strict';
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';

const server = await createServer({ server: { port: 5194, strictPort: true, host: '127.0.0.1' } });
await server.listen();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5194');
  await page.evaluate(() => localStorage.setItem('evenmore_crm_deals_v2', JSON.stringify([{ id: 'terms-deal', name: 'Supply Agreement', client: 'Sunrise Industries Pvt. Ltd.', contracts: [{ id: 'terms-contract', contractNumber: 'CN-00012', contractType: 'Supply Agreement', customer: 'Sunrise Industries Pvt. Ltd.', status: 'Active', startDate: '2026-09-01', endDate: '2027-09-01', amount: 1200000, terms: 'Payment Terms: 50% advance payment and 50% on delivery.\nDelivery Terms: Delivery within 8–10 weeks from the date of purchase order.\nWarranty: 12 months warranty from the date of installation.\nSupport / SLA: Support as per agreed SLA.\nCancellation: Any cancellation must be notified in writing 30 days in advance.' }] }])));
  await page.goto('http://127.0.0.1:5194/crm/contracts/terms-contract');
  await page.waitForSelector('.contract-term-row');
  assert.equal(await page.$$eval('.contract-term-row', (rows) => rows.length), 5);
  assert.equal(await page.$$eval('.contract-term-row[aria-expanded="true"]', (rows) => rows.length), 0);
  assert.ok((await page.$eval('.contract-term-summary', (element) => element.textContent)).includes('50% advance'));
  await page.screenshot({ path: `${process.env.TEMP}/contract-terms.png`, fullPage: true });
  await page.click('.contract-term-row');
  await page.waitForSelector('#contract-clause-0');
  assert.ok((await page.$eval('#contract-clause-0', (element) => element.textContent)).includes('50% advance'));
  await page.$$eval('section button', (buttons) => buttons.find((button) => button.textContent.trim() === 'Edit').click());
  await page.waitForSelector('.contract-terms-form');
  await page.$eval('.contract-terms-form textarea', (input) => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, '40% advance and balance on delivery.\nNote: Confirm schedule before dispatch.'); input.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('.contract-terms-form button[type="submit"]');
  await page.waitForFunction(() => !document.querySelector('.contract-terms-form'));
  await page.reload();
  await page.waitForSelector('.contract-term-row');
  assert.equal(await page.$$eval('.contract-term-row', (rows) => rows.length), 5);
  await page.click('.contract-term-row');
  assert.ok((await page.$eval('#contract-clause-0', (element) => element.textContent)).includes('Note: Confirm schedule'));
  assert.deepEqual(errors, []);
  console.log('Contract terms: five visible summaries, accordion expansion, editing, multiline terms, and reload persistence passed.');
} finally {
  if (browser) await browser.close();
  await server.close();
}
