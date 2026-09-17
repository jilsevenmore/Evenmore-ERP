import { publicQuotation } from '../utils/quotationDocument';

const storageKey = 'evenmore_quotation_previews_v1';
const read = () => JSON.parse(localStorage.getItem(storageKey) || '{}');

export function localShare(id, data) {
  const records = read();
  if (data) {
    const days = Number(data.expiryDays ?? 30);
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('Choose an expiry between 1 and 365 days.');
    const token = `local-${Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('')}`;
    records[id] = {
      token,
      quotation: publicQuotation(data.quotation, data.quotation.currency || 'USD'),
      url: `${window.location.origin}/quote/${encodeURIComponent(data.quotation.quoteNumber)}/${token}`,
      expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
      allowDownload: data.allowDownload !== false,
      allowAcceptance: false,
      localOnly: true,
      events: [{ id: crypto.randomUUID(), quotationId: id, type: 'Preview link generated', timestamp: new Date().toISOString() }],
    };
    localStorage.setItem(storageKey, JSON.stringify(records));
  }
  return records[id] || null;
}

export function localQuote(number, token, action) {
  const record = Object.values(read()).find(value => value.token === token && value.quotation.quoteNumber === number);
  if (!record || Date.parse(record.expiresAt) <= Date.now()) throw new Error('This preview link is unavailable or expired. Open it in the browser where it was created.');
  if (action) {
    if (action !== 'view' && !(action === 'download' && record.allowDownload)) throw new Error('This action is unavailable in the preview.');
    return { ok: true };
  }
  return { quotation: record.quotation, allowDownload: record.allowDownload, allowAcceptance: false, localOnly: true };
}
