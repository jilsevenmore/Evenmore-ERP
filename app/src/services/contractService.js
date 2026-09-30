export { formatContractMoney, formatContractDate } from '../utils/contractFormatting.js';
import { useCrmStore } from '../stores/crmStore';
import { pushDealActivity } from './crmSync';
import { emitCrmEvent, CRM_EVENT_TYPES } from './crmEventNotifications.js';

/**
 * Contracts, at `/crm/contracts/`.
 *
 * They used to be stored inside each deal (`deal.contracts[]`) and written back
 * through the deal, whose API has no such field -- so a contract vanished as
 * soon as the deal save returned. They are now the CRM store's `contracts`
 * collection. The server issues the `CON-…` number, resolves the customer from
 * the deal and logs the creation on the deal's activity feed.
 */

export const CONTRACT_TYPES = [
  'Supply Agreement',
  'Service Contract',
  'AMC',
  'Purchase Agreement',
  'NDA',
  'Maintenance Contract',
  'Consulting Agreement',
  'Other',
];

export const CONTRACT_STATUSES = ['Draft', 'Active', 'Closed', 'Cancelled'];

export const CONTRACT_TEMPLATES = [
  'Standard Supply Agreement',
  'Standard Service Contract',
  'Standard AMC',
  'Standard NDA',
  'Custom',
];

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

function toDay(value) {
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value || '') ? `${value}T00:00:00` : value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function notifyUpdated() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:data-updated'));
}

function isValidCalendarDate(value) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!parts) return false;
  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function assertContractDates(startDate, endDate) {
  for (const date of [startDate, endDate]) {
    if (date && !isValidCalendarDate(date)) throw new Error('Enter valid contract dates.');
  }
  if (startDate && endDate && startDate >= endDate) throw new Error('End date must be after the start date.');
}

export function getContractDisplayStatus(contract, today = new Date()) {
  const stored = contract.status || 'Draft';
  if (/^(cancelled|closed)$/i.test(stored)) return stored.charAt(0).toUpperCase() + stored.slice(1).toLowerCase();
  const end = toDay(contract.endDate);
  if (end) {
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (end < base) return 'Expired';
    const daysLeft = Math.round((end - base) / 86400000);
    if (daysLeft <= 30) return 'Expiring Soon';
  }
  if (/^draft$/i.test(stored)) return 'Draft';
  return 'Active';
}

/** The deal-side labels the contract screens show next to a contract. */
function enrich(contract, deals = useCrmStore.getState().deals) {
  const deal = deals.find((item) => sameId(item.id, contract.dealId)) || null;
  return {
    ...contract,
    dealName: contract.dealName || deal?.name || '',
    dealNumber: contract.dealNumber || deal?.dealNumber || '',
    client: contract.customer || deal?.client || '',
    leadId: contract.leadId || deal?.leadId || null,
    projectId: contract.projectId || deal?.projectId || null,
  };
}

export function loadContracts() {
  const { contracts, deals } = useCrmStore.getState();
  return contracts
    .map((contract) => enrich(contract, deals))
    .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
}

export function findContract(contractId) {
  const { contracts, deals } = useCrmStore.getState();
  const contract = contracts.find((item) => sameId(item.id, contractId));
  if (!contract) return { contract: null, deal: null };
  return {
    contract: enrich(contract, deals),
    deal: deals.find((item) => sameId(item.id, contract.dealId)) || null,
  };
}

function cleanAmount(value) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Enter a valid contract value.');
  return amount;
}

export async function createContract(input = {}) {
  const deal = useCrmStore.getState().deals.find((item) => sameId(item.id, input.dealId));
  if (!deal) throw new Error('Select a deal for this contract.');
  const customer = String(input.customer ?? deal.client ?? '').trim();
  if (!customer) throw new Error('Customer is required.');
  const customerId = input.customerId || deal.customerId;
  if (!customerId) throw new Error('Link this deal to a customer record before creating a contract.');
  const contractType = String(input.contractType ?? '').trim();
  if (!contractType) throw new Error('Select a contract type.');
  const amount = cleanAmount(input.amount);
  const startDate = input.startDate || '';
  const endDate = input.endDate || '';
  if (!startDate || !endDate) throw new Error('Start date and end date are required.');
  assertContractDates(startDate, endDate);
  const saved = await useCrmStore.getState().createRecord('contracts', {
    dealId: deal.id,
    customerId,
    customer,
    contractType,
    amount,
    startDate,
    endDate,
    description: String(input.description ?? '').trim(),
    terms: String(input.terms ?? '').trim(),
    template: String(input.template ?? '').trim(),
    status: input.status || 'Active',
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    notifyCustomer: Boolean(input.notifyCustomer),
  });
  if (!saved) throw new Error('Sign in to save contracts.');
  notifyUpdated();
  return enrich(saved);
}

export async function updateContract(dealId, contractId, patch = {}) {
  const current = useCrmStore.getState().contracts.find((item) => sameId(item.id, contractId));
  if (!current) throw new Error('Contract was not found.');
  const updates = {};
  for (const field of ['customer', 'contractType', 'description', 'terms', 'template', 'status']) {
    if (patch[field] !== undefined) updates[field] = typeof patch[field] === 'string' ? patch[field].trim() : patch[field];
  }
  if (patch.amount !== undefined) updates.amount = cleanAmount(patch.amount);
  if (patch.startDate !== undefined) updates.startDate = patch.startDate || '';
  if (patch.endDate !== undefined) updates.endDate = patch.endDate || '';
  if (patch.attachments !== undefined) updates.attachments = patch.attachments;
  if (patch.notifyCustomer !== undefined) updates.notifyCustomer = Boolean(patch.notifyCustomer);
  const next = { ...current, ...updates };
  if (!next.customer) throw new Error('Customer is required.');
  if (!next.contractType) throw new Error('Select a contract type.');
  assertContractDates(next.startDate, next.endDate);
  const saved = await useCrmStore.getState().updateRecord('contracts', contractId, updates);
  const updated = enrich(saved || next);
  if (current.status !== 'Active' && updated.status === 'Active') {
    const deal = useCrmStore.getState().deals.find((item) => sameId(item.id, updated.dealId || dealId));
    emitCrmEvent({
      type: CRM_EVENT_TYPES.CONTRACT_SIGNED,
      entityType: 'contract',
      entityId: updated.id,
      payload: {
        contractRef: updated.contractNumber,
        customerName: updated.customer,
        ownerName: deal?.assignedUser || deal?.owner,
        path: `/crm/contracts/${updated.id}`,
      },
    });
  }
  notifyUpdated();
  return updated;
}

export async function deleteContract(dealId, contractId) {
  const removed = useCrmStore.getState().contracts.find((item) => sameId(item.id, contractId));
  if (!removed) throw new Error('Contract was not found.');
  await useCrmStore.getState().deleteRecord('contracts', contractId);
  notifyUpdated();
  return removed;
}

/** A one-line entry on the deal's activity feed (`/crm/deals/{id}/activities/`). */
export async function appendDealActivity(dealId, title) {
  if (!dealId || !title) return null;
  try {
    return await pushDealActivity(dealId, { type: 'contract', title });
  } catch (err) {
    console.warn('[CRM] deal activity not saved:', err?.message || err);
    return null;
  }
}

/** A logged activity (call, meeting, note…) with its own type and details. */
export async function addDealActivity(dealId, entry = {}) {
  if (!useCrmStore.getState().deals.some((item) => sameId(item.id, dealId))) throw new Error('Deal was not found.');
  return pushDealActivity(dealId, {
    type: entry.activityType || entry.type || 'activity',
    title: entry.title || '',
    description: entry.description || '',
  });
}
