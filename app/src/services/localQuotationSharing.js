import { publicQuotation } from '../utils/quotationDocument';

const storageKey = 'evenmore_quotation_previews_v1';
const dataPrefix = 'd-';
const maxUrlLength = 6000;
const read = () => JSON.parse(localStorage.getItem(storageKey) || '{}');

function toBase64Url(value) {
  return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(normalized + '='.repeat((4 - (normalized.length % 4)) % 4))));
}

export function encodeDataToken(quotation, expiryDays) {
  const payload = { v: 1, exp: new Date(Date.now() + expiryDays * 86400000).toISOString(), dl: quotation.allowDownload !== false, q: quotation };
  return `${dataPrefix}${toBase64Url(JSON.stringify(payload))}`;
}

export function decodeDataToken(token) {
  const payload = JSON.parse(fromBase64Url(token.slice(dataPrefix.length)));
  if (!payload || payload.v !== 1 || !payload.q || typeof payload.q.quoteNumber !== 'string' || !Array.isArray(payload.q.items)) throw new Error('Invalid link.');
  if (Date.parse(payload.exp) <= Date.now()) throw new Error('Expired link.');
  return payload;
}

export function isPortableToken(token) {
  return typeof token === 'string' && token.startsWith(dataPrefix);
}

export function localShare(id, data) {
  const records = read();
  if (data) {
    const days = Number(data.expiryDays ?? 30);
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('Please select an expiry between 1 and 365 days.');
    const quotation = publicQuotation(data.quotation, data.quotation.currency || 'USD');
    const token = encodeDataToken({ ...quotation, allowDownload: data.allowDownload !== false }, days);
    const url = `${window.location.origin}/quote/${encodeURIComponent(quotation.quoteNumber)}/${token}`;
    if (url.length > maxUrlLength) throw new Error('This quotation is too large for a link. Please download the PDF and share it directly.');
    records[id] = {
      token,
      quotation,
      url,
      expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
      allowDownload: data.allowDownload !== false,
      allowAcceptance: false,
      localOnly: false,
      events: [{ id: crypto.randomUUID(), quotationId: id, type: 'Preview link generated', timestamp: new Date().toISOString() }],
    };
    localStorage.setItem(storageKey, JSON.stringify(records));
  }
  return records[id] || null;
}

export function localQuote(number, token, action) {
  if (isPortableToken(token)) {
    let payload;
    try { payload = decodeDataToken(token); }
    catch { throw new Error('This quotation link is invalid or has expired. Please contact the sender.'); }
    if (payload.q.quoteNumber !== number) throw new Error('This quotation link is invalid or has expired. Please contact the sender.');
    if (action) {
      if (action !== 'view' && !(action === 'download' && payload.dl)) throw new Error('Downloading is disabled for this quotation.');
      return { ok: true };
    }
    return { quotation: payload.q, allowDownload: payload.dl, allowAcceptance: false, localOnly: false };
  }
  const record = Object.values(read()).find(value => value.token === token && value.quotation.quoteNumber === number);
  if (!record || Date.parse(record.expiresAt) <= Date.now()) throw new Error('This quotation link is invalid or has expired. Please contact the sender.');
  if (action) {
    if (action !== 'view' && !(action === 'download' && record.allowDownload)) throw new Error('Downloading is disabled for this quotation.');
    return { ok: true };
  }
  return { quotation: record.quotation, allowDownload: record.allowDownload, allowAcceptance: false, localOnly: true };
}
