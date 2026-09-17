import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/sales/quotations');
  await page.waitForFunction(() => localStorage.getItem('horizon_erp_v2_state'));
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('horizon_erp_v2_state'));
    state.quotations.unshift({ id: 'local-test', quoteNumber: 'LOCAL-TEST', customer: 'Local Customer', date: '17/09/2026', amount: 42, status: 'Draft', items: [{ name: 'Local product', qty: 1, rate: 42, amount: 42 }] });
    localStorage.setItem('horizon_erp_v2_state', JSON.stringify(state));
  });
  await page.reload();
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'LOCAL-TEST'));
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'LOCAL-TEST').click());
  await page.evaluate(() => {
    window.copiedQuotationLink = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedQuotationLink = text; } } });
  });
  assert.equal(await page.$eval('[aria-label="Copy Link"]', button => button.disabled), false);
  await page.click('[aria-label="Copy Link"]');
  await page.waitForFunction(() => window.copiedQuotationLink.includes('/quote/LOCAL-TEST/local-'));
  const copied = await page.evaluate(() => window.copiedQuotationLink);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('horizon_erp_v2_state')).quotations.find(q => q.id === 'local-test').status), 'Draft');
  await page.click('[aria-label="Copy Link"]');
  await page.waitForFunction(() => !document.querySelector('[aria-label="Copy Link"]').disabled);
  assert.equal(await page.evaluate(() => window.copiedQuotationLink), copied);
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Clipboard denied'); }; });
  await page.click('[aria-label="Copy Link"]');
  await page.waitForFunction(() => document.body.textContent.includes('Your browser blocked clipboard access'));

  await page.waitForSelector('img[alt="Scan to open this quotation"]');
  const link = await page.$eval('[role="dialog"] input[readonly]', input => input.value);
  assert.ok(link.includes('/quote/LOCAL-TEST/local-'));
  assert.equal(link, copied);
  assert.ok(await page.evaluate(() => document.body.textContent.includes('Preview link works in this browser only')));
  await page.goto(link);
  await page.waitForSelector('.printable-document');
  assert.ok(await page.evaluate(() => document.body.textContent.includes('Local Customer')));
  const context = await browser.createBrowserContext();
  const other = await context.newPage();
  await other.goto(link);
  await other.waitForFunction(() => document.body.textContent.includes('This preview opens only in the browser'));
  assert.deepEqual(errors, []);
  console.log('PASS: direct Copy Link generates and copies, repeat copy reuses link, clipboard denial shows manual copy, quotation stays Draft, preview opens correctly.');
} finally { await browser.close(); }
