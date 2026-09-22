import { buildDeal, loadDeals, DEALS_STORAGE_KEY } from './dealService.js';
import { crmStorage } from './crmStorage.js';

const DETAIL_KEY = 'evenmore-crm-lead-details-v1';
const normalize = (value) => String(value ?? '').trim().toLowerCase();
const sameId = (a, b) => a != null && b != null && String(a) === String(b);

// The setup screen identifies its built-in Won stage by ld-7; stage tasks use won.
// Keep that identity when an administrator renames the stage.
export function isWonLeadStage(targetStage, fallbackStages, storage = crmStorage) {
  const config = JSON.parse(storage.getItem('evenmore-crm-stages-v1') || 'null');
  const stages = Array.isArray(config?.leadStages) ? config.leadStages : fallbackStages;
  const stage = stages.find((item) => item && item.status !== 'Inactive' &&
    (normalize(item.id) === normalize(targetStage) || normalize(item.name) === normalize(targetStage)));
  return Boolean(stage && (['won', 'ld-7'].includes(stage.id) || normalize(stage.name) === 'won'));
}

// Synchronous read/check/write keeps repeated automation calls idempotent in this app.
// Relationship and activity live in the existing per-lead detail record.
export function convertLeadToDealIfNeeded(lead, { targetStage = lead?.status, stages = [], storage = crmStorage } = {}) {
  if (!lead || lead.id == null || lead.id === '') throw new Error('Lead ID is required for conversion.');
  if (!isWonLeadStage(targetStage, stages, storage)) return null;
  const deals = loadDeals(storage);
  const details = JSON.parse(storage.getItem(DETAIL_KEY) || '{}');
  if (!details || typeof details !== 'object' || Array.isArray(details)) throw new Error('Invalid lead details.');
  const detail = details[String(lead.id)] || {};
  const existing = deals.find((deal) => sameId(deal.leadId, lead.id));
  if (existing && sameId(detail.convertedDealId, existing.id)) return existing;
  const products = detail.products ?? lead.products ?? [];
  if (!Array.isArray(products) || products.some((product) => !product || !['string', 'object'].includes(typeof product))) {
    throw new Error('Invalid lead products.');
  }
  for (const field of ['customerId', 'partyId', 'productId', 'ownerId', 'teamId']) {
    if (lead[field] != null && !['string', 'number'].includes(typeof lead[field])) throw new Error(`Invalid ${field}.`);
  }
  const product = products[0];
  const references = {};
  for (const field of ['customerId', 'partyId', 'productId', 'ownerId', 'teamId', 'team', 'email', 'company', 'contactPerson', 'sourceId', 'quantity', 'category', 'notes', 'description', 'attachments', 'expectedCloseDate', 'targetCloseDate', 'leadNumber']) {
    if (lead[field] !== undefined) references[field] = lead[field];
  }
  const deal = existing || buildDeal({
    ...references, leadId: lead.id, name: lead.title || lead.name,
    client: lead.contactPerson || lead.name || lead.company, phone: lead.phone,
    price: lead.amount ?? lead.value ?? 0, assignedUser: lead.owner || '',
    source: lead.source || '', product: typeof product === 'string' ? product : product?.name || lead.product || '',
    products, files: detail.files ?? lead.files ?? [],
    date: lead.expectedCloseDate ?? lead.targetCloseDate ?? '',
  }, `dl-lead-${encodeURIComponent(String(lead.id))}`);
  const timestamp = new Date().toISOString();
  const activities = detail.activities || [];
  if (!Array.isArray(activities)) throw new Error('Invalid lead activity data.');
  const eventId = `lead-deal-${deal.id}`;
  const nextDetail = { ...detail, convertedDealId: deal.id, activities: activities.some((item) => item.id === eventId) ? activities : [{
    id: eventId, title: `Lead automatically converted to Deal ${deal.id}`,
    time: timestamp, timestamp, color: '#10b981', actor: 'System', type: 'lead-converted', dealId: deal.id,
  }, ...activities] };
  const writes = [[DETAIL_KEY, JSON.stringify({ ...details, [String(lead.id)]: nextDetail })]];
  if (!existing) writes.push([DEALS_STORAGE_KEY, JSON.stringify([deal, ...deals])]);
  const previous = writes.map(([key]) => [key, storage.getItem(key)]);
  let written = 0;
  try {
    for (const [key, value] of writes) { storage.setItem(key, value); written += 1; }
  } catch (error) {
    for (const [key, value] of previous.slice(0, written).reverse()) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); }
      catch (rollbackError) { console.error('[CRM Conversion] Rollback failed:', key, rollbackError); }
    }
    throw error;
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:data-updated'));
  return deal;
}
