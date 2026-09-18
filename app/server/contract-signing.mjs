import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { contractDocument, validateSignature } from '../src/utils/contractSigning.js';

// Runs inside the existing sharing server's serialized request queue.
export async function createContractSigningHandler({ file, adminToken, publicOrigin }) {
  let records = {};
  try { records = JSON.parse(await readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const hash = value => createHash('sha256').update(value).digest('hex');
  const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
  return async (req, res) => {
    const path = new URL(req.url, 'http://server').pathname;
    if (!path.startsWith('/api/v1/contract-signing/') && !path.startsWith('/api/v1/public-contracts/')) return false;
    const reply = (status, data) => { res.writeHead(status); res.end(JSON.stringify(data)); return true; };
    try {
      const admin = path.match(/^\/api\/v1\/contract-signing\/([a-zA-Z0-9_-]{1,128})(?:\/(send|resend|revoke|company-sign))?$/);
      const customer = path.match(/^\/api\/v1\/public-contracts\/([a-f0-9]{64})(?:\/(view|sign))?$/);
      if (!admin && !customer) return reply(404, { message: 'Invalid signing link.' });
      if (admin) {
        const supplied = Buffer.from(req.headers.authorization?.replace(/^Bearer /, '') || '');
        const expected = Buffer.from(adminToken);
        if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return reply(401, { message: 'Configure the sharing server administrator token to manage signing.' });
        if (['__proto__', 'constructor', 'prototype'].includes(admin[1])) return reply(400, { message: 'Invalid contract.' });
      }
      let body = {};
      if (req.method === 'POST') {
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 1000000) return reply(413, { message: 'Contract or signature is too large.' }); }
        try { body = JSON.parse(raw || '{}'); } catch { return reply(400, { message: 'Invalid request.' }); }
      }
      const id = admin?.[1] || Object.keys(records).find(key => records[key].tokenHash === hash(customer[1]));
      let record = id && records[id] ? structuredClone(records[id]) : null;
      const action = admin?.[2] || customer?.[2];
      if (req.method !== (action ? 'POST' : 'GET')) return reply(405, { message: 'Method not allowed.' });
      const now = new Date().toISOString();
      const actor = admin ? String(body.actor || 'CRM User').slice(0, 200) : 'Customer';
      const event = (activityType, nextStatus, signer = actor) => {
        record.events.push({ id: randomBytes(16).toString('hex'), contractId: id, type: 'contract', activityType, title: `${record.document.contractNumber}: ${activityType}`, actor: signer, timestamp: now, previousStatus: record.status, newStatus: nextStatus });
        record.status = nextStatus;
      };
      if (admin && action === 'send') {
        if (record && (!record.revoked || record.customerSignature)) fail('This contract already has a signing request. Refresh its status.', 409);
        const doc = contractDocument(body.contract || {});
        if (Object.entries(doc).some(([key, value]) => key !== 'amount' && typeof value !== 'string')) fail('Enter valid contract information.');
        if (!String(doc.customer).trim()) fail('Customer is required.');
        if (!doc.contractNumber || !doc.contractType || !String(doc.terms).trim() || !doc.startDate || !doc.endDate || !Number.isFinite(Number(doc.amount)) || Number(doc.amount) < 0) fail('Contract number, type, value, dates and terms are required.');
        for (const date of [doc.startDate, doc.endDate]) if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) fail('Enter valid contract dates.');
        if (doc.endDate < doc.startDate || doc.endDate < now.slice(0, 10)) fail('The contract dates are invalid or expired.');
        if (!['Draft', 'Active', 'Sent'].includes(body.contract.status || 'Draft')) fail('This contract cannot be sent for signing.');
        record = { id, document: doc, documentHash: hash(JSON.stringify(doc)), events: record?.events || [], status: 'Draft', revoked: false };
        const token = randomBytes(32).toString('hex');
        record.tokenHash = hash(token);
        record.url = `${new URL(publicOrigin).origin}/contracts/sign/${token}`;
        record.expiresAt = new Date(Math.min(Date.now() + 30 * 86400000, Date.parse(doc.endDate + 'T23:59:59.999Z'))).toISOString();
        record.sentAt = now;
        event('Sent to Customer', 'Sent');
      } else {
        if (!record) return reply(404, { message: 'Contract signing request not found.' });
        if (customer && (record.revoked || Date.parse(record.expiresAt) <= Date.now())) return reply(410, { message: 'This signing link has expired or was revoked. Please contact the sender.' });
        if (action === 'resend') {
          if (record.revoked || !['Sent', 'Viewed'].includes(record.status)) fail('This request cannot be resent.', 409);
          if (record.document.endDate < now.slice(0, 10)) fail('The contract has expired.');
          record.sentAt = now;
          record.expiresAt = new Date(Math.min(Date.now() + 30 * 86400000, Date.parse(record.document.endDate + 'T23:59:59.999Z'))).toISOString();
          event('Resent to Customer', record.status);
        } else if (action === 'revoke') {
          if (record.customerSignature || record.revoked) fail('Only an unsigned active request can be revoked.', 409);
          record.revoked = true;
          event('Signing Link Revoked', 'Draft');
        } else if (action === 'view' && record.status === 'Sent') {
          record.viewedAt = now;
          event('Customer Viewed', 'Viewed');
        } else if (action === 'sign' || action === 'company-sign') {
          const company = action === 'company-sign';
          if (record.revoked || (company ? !record.customerSignature || record.companySignature : record.customerSignature || !['Sent', 'Viewed'].includes(record.status))) fail('A signature already exists or this contract cannot be signed.', 409);
          let signature;
          try { signature = validateSignature(body.signature); } catch (error) { fail(error.message); }
          signature = { ...signature, signedAt: now, contractId: id, documentHash: record.documentHash, signerType: company ? 'company' : 'customer' };
          record[company ? 'companySignature' : 'customerSignature'] = signature;
          if (!company && record.status === 'Sent') event('Customer Viewed', 'Viewed', signature.name);
          event(company ? 'Company Signed' : 'Customer Signed', company ? 'Company Signed' : 'Customer Signed', signature.name);
          if (company) event('Contract Accepted', 'Accepted', signature.name);
        }
      }
      if (action) {
        // Commit to memory only after the atomic disk write succeeds.
        const next = { ...records, [id]: record };
        await mkdir(dirname(file), { recursive: true });
        await writeFile(`${file}.tmp`, JSON.stringify(next), { mode: 0o600 });
        await rename(`${file}.tmp`, file);
        records = next;
      }
      if (admin) return reply(200, { ...record, emailAvailable: false });
      const signature = record.customerSignature;
      return reply(200, { contract: record.document, status: record.status, customerSignature: signature ? { name: signature.name, role: signature.role, signedAt: signature.signedAt, strokes: signature.strokes } : null, companySigned: Boolean(record.companySignature) });
    } catch (error) { return reply(error.status || 500, { message: error.status ? error.message : 'Unable to save the signing request. Please try again.' }); }
  };
}
