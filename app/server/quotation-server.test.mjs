import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createQuotationServer } from './quotation-server.mjs';
import { quotationTotals } from '../src/utils/quotationDocument.js';

test('secure sharing: authentication, projection, tracking, rotation, download policy, persistence and expiry', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'quotation-test-'));
  const file = join(directory, 'shares.json');
  const adminToken = 'test-only-credential-'.repeat(3);
  const options = { file, adminToken, publicOrigin: 'https://quotes.example.com' };
  let server;
  let base;
  const start = async () => { server = await createQuotationServer(options); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}/api/v1`; };
  const stop = () => new Promise(resolve => server.close(resolve));
  const request = (path, data, auth = true) => fetch(base + path, { method: data ? 'POST' : 'GET', headers: { ...(auth ? { Authorization: `Bearer ${adminToken}` } : {}), 'Content-Type': 'application/json' }, ...(data ? { body: JSON.stringify(data) } : {}) });
  const payload = { quotation: { quoteNumber: 'Q-123', customer: 'Real Customer', amount: 0, notes: 'PRIVATE CRM', items: [{ name: 'Product', qty: 0, rate: 10, amount: 0, costPrice: 3 }] }, expiryDays: 30, allowDownload: true };
  try {
    await start();
    assert.equal((await request('/quotation-sharing/q-1', payload, false)).status, 401);
    let response = await request('/quotation-sharing/q-1', payload);
    assert.equal(response.status, 200);
    const share = await response.json();
    const path = new URL(share.url).pathname.replace('/quote/', '/public-quotations/');
    assert.equal(share.events.length, 1);
    response = await request(path, null, false);
    const shared = await response.json();
    assert.equal(shared.quotation.customer, 'Real Customer');
    assert.equal(shared.quotation.notes, undefined);
    assert.equal(shared.quotation.items[0].costPrice, undefined);
    assert.equal(shared.quotation.amount, 0);
    assert.equal((await request(path + '/view', {}, false)).status, 200);
    assert.equal((await request(path + '/download', {}, false)).status, 200);
    const activity = await (await request('/quotation-sharing/q-1')).json();
    assert.deepEqual(activity.events.map(event => event.type), ['Share link created', 'Quotation Viewed', 'PDF print requested']);
    const rotated = await (await request('/quotation-sharing/q-1', { ...payload, allowDownload: false })).json();
    const rotatedPath = new URL(rotated.url).pathname.replace('/quote/', '/public-quotations/');
    assert.equal((await request(path, null, false)).status, 404);
    assert.equal((await request(rotatedPath + '/download', {}, false)).status, 403);
    assert.equal((await request(rotatedPath.replace('Q-123', 'Q-456'), null, false)).status, 404);
    assert.equal((await request(rotatedPath + '/accept', {}, false)).status, 403);
    const responseEnabled = await (await request('/quotation-sharing/q-2', { ...payload, allowAcceptance: true })).json();
    const responsePath = new URL(responseEnabled.url).pathname.replace('/quote/', '/public-quotations/');
    assert.equal((await request(responsePath + '/accept', {}, false)).status, 200);
    assert.equal((await request(responsePath + '/accept', {}, false)).status, 200);
    assert.equal((await request(responsePath + '/reject', {}, false)).status, 409);
    const responseRecord = await (await request('/quotation-sharing/q-2')).json();
    assert.equal(responseRecord.decision, 'Accepted');
    assert.equal(responseRecord.events.filter(e => e.type === 'Quotation Accepted').length, 1);
    await stop();
    await start();
    assert.equal((await request(rotatedPath, null, false)).status, 200);
    await stop();
    const records = JSON.parse(await readFile(file, 'utf8'));
    records['q-1'].expiresAt = '2000-01-01T00:00:00Z';
    await writeFile(file, JSON.stringify(records));
    await start();
    assert.equal((await request(rotatedPath, null, false)).status, 404);
    assert.equal((await request(rotatedPath + '/view', {}, false)).status, 404);
  } finally { if (server?.listening) await stop(); await rm(directory, { recursive: true, force: true }); }
});

test('document preserves stored totals, zero quantities and line discounts/taxes', () => {
  assert.deepEqual(quotationTotals({ items: [{ qty: 2, rate: 100, discount: 10, tax: 20 }], freight: 5 }), { subtotal: 200, discount: 20, tax: 36, freight: 5, total: 221 });
  assert.equal(quotationTotals({ amount: 0, items: [{ qty: 0, rate: 100 }] }).total, 0);
});
