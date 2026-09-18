import http from 'node:http';
import { createContractSigningHandler } from './contract-signing.mjs';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { publicQuotation } from '../src/utils/quotationDocument.js';

export async function createQuotationServer({ file, adminToken, publicOrigin }) {
  if (!adminToken || adminToken.length < 32) throw new Error('QUOTATION_ADMIN_TOKEN must contain at least 32 characters.');
  const origin = new URL(publicOrigin);
  if (origin.protocol !== 'https:' || /^(localhost|127\.|\[::1\])/.test(origin.hostname)) throw new Error('QUOTATION_PUBLIC_ORIGIN must be a public HTTPS origin.');
  const handleContractSigning = await createContractSigningHandler({ file: `${file}.contracts.json`, adminToken, publicOrigin });
  let records = Object.create(null);
  try { records = JSON.parse(await readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  let queue = Promise.resolve();
  const hash = token => createHash('sha256').update(token).digest('hex');
  const event = (record, type) => { record.events.push({ id: randomBytes(16).toString('hex'), type, quotationId: record.id, timestamp: new Date().toISOString() }); };
  const save = async () => { await mkdir(dirname(file), { recursive: true }); await writeFile(`${file}.tmp`, JSON.stringify(records), { mode: 0o600 }); await rename(`${file}.tmp`, file); };
  return http.createServer((req, res) => {
    const run = async () => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Referrer-Policy', 'no-referrer');
      const reply = (status, data) => { res.writeHead(status); res.end(JSON.stringify(data)); };
      try {
        if (await handleContractSigning(req, res)) return;
        const path = new URL(req.url, 'http://server').pathname;
        const admin = path.match(/^\/api\/v1\/quotation-sharing\/([^/]+)$/);
        const shared = path.match(/^\/api\/v1\/public-quotations\/([^/]+)\/([a-f0-9]{64})(?:\/(view|download|accept|reject))?$/);
        if (!admin && !shared) return reply(404, { message: 'Not found' });
        if (admin) {
          const supplied = Buffer.from(req.headers.authorization?.replace(/^Bearer /, '') || '');
          const expected = Buffer.from(adminToken);
          if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return reply(401, { message: 'Sharing server authentication required. Configure your administrator session token.' });
        }
        let body = {};
        if (req.method === 'POST') {
          let raw = '';
          for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 512000) return reply(413, { message: 'Quotation is too large.' }); }
          try { body = JSON.parse(raw || '{}'); } catch { return reply(400, { message: 'Invalid JSON' }); }
        }
        if (admin) {
          const id = decodeURIComponent(admin[1]);
          if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id)) return reply(400, { message: 'Invalid quotation identifier.' });
          let record = records[id];
          if (req.method === 'POST') {
            if (!body.quotation?.quoteNumber || !Array.isArray(body.quotation.items) || body.quotation.items.length > 1000) return reply(400, { message: 'A real quotation with line items is required.' });
            const days = Number(body.expiryDays ?? 30);
            if (!Number.isInteger(days) || days < 1 || days > 365) return reply(400, { message: 'Expiry must be 1–365 days.' });
            record ||= { id, events: [] };
            const token = randomBytes(32).toString('hex');
            record.tokenHash = hash(token);
            record.quotation = publicQuotation(body.quotation, body.quotation.currency || 'USD');
            record.expiresAt = new Date(Date.now() + days * 86400000).toISOString();
            record.allowDownload = body.allowDownload !== false;
            record.allowAcceptance = body.allowAcceptance === true;
            record.url = `${origin.origin}/quote/${encodeURIComponent(record.quotation.quoteNumber)}/${token}`;
            event(record, 'Share link created');
            records[id] = record;
            await save();
          } else if (req.method !== 'GET') return reply(405, { message: 'Method not allowed' });
          if (!record) return reply(404, { message: 'No share link has been published.' });
          return reply(200, { url: record.url, expiresAt: record.expiresAt, allowDownload: record.allowDownload, allowAcceptance: record.allowAcceptance, decision: record.decision, events: record.events, emailAvailable: false });
        }
        const [, number, token, action] = shared;
        const record = Object.values(records).find(item => item.tokenHash === hash(token) && item.quotation.quoteNumber === decodeURIComponent(number));
        if (!record || Date.parse(record.expiresAt) <= Date.now()) return reply(404, { message: 'This quotation link is invalid or expired.' });
        if (req.method === 'POST' && action) {
          if (action === 'download' && !record.allowDownload) return reply(403, { message: 'Downloads are disabled for this quotation.' });
          if (action === 'accept' || action === 'reject') {
            if (!record.allowAcceptance) return reply(403, { message: 'Customer responses are disabled for this quotation.' });
            const decision = action === 'accept' ? 'Accepted' : 'Rejected';
            if (record.decision && record.decision !== decision) return reply(409, { message: 'A response has already been recorded. Contact the sender to change it.' });
            if (!record.decision) { record.decision = decision; event(record, `Quotation ${decision}`); }
          } else event(record, action === 'view' ? 'Quotation Viewed' : 'PDF print requested');
          await save();
          return reply(200, { ok: true, decision: record.decision });
        }
        if (req.method !== 'GET' || action) return reply(405, { message: 'Method not allowed' });
        return reply(200, { quotation: record.quotation, allowDownload: record.allowDownload, allowAcceptance: record.allowAcceptance, decision: record.decision });
      } catch { if (!res.headersSent) reply(500, { message: 'Quotation service could not complete the request.' }); }
    };
    queue = queue.then(run, run);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = await createQuotationServer({ file: resolve(process.env.QUOTATION_DATA_FILE || 'server/data/quotation-shares.json'), adminToken: process.env.QUOTATION_ADMIN_TOKEN, publicOrigin: process.env.QUOTATION_PUBLIC_ORIGIN });
  server.listen(Number(process.env.QUOTATION_PORT || 8787), '127.0.0.1', () => console.log('Quotation sharing API listening on loopback port ' + (process.env.QUOTATION_PORT || 8787)));
}
