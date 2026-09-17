import { useSyncExternalStore } from 'react';

const KEY = 'evenmore-estimates-v1';

const SEED = [
  {
    id: 'est-1',
    estimateNumber: 'EST-2026-001',
    customerId: '',
    customer: 'Acme Corp',
    leadId: '',
    leadName: '',
    date: 'Oct 20, 2026',
    validUntil: '15 Days',
    amount: 4800,
    status: 'Sent',
    items: [{ id: 'li-1', description: 'Discovery & site survey', qty: 1, rate: 4800, amount: 4800 }],
  },
  {
    id: 'est-2',
    estimateNumber: 'EST-2026-002',
    customerId: '',
    customer: 'Globex Ltd',
    leadId: '',
    leadName: '',
    date: 'Oct 22, 2026',
    validUntil: '15 Days',
    amount: 12500,
    status: 'Draft',
    items: [{ id: 'li-2', description: 'Pilot hardware bundle', qty: 1, rate: 12500, amount: 12500 }],
  },
];

function readStored() {
  try {
    if (typeof localStorage === 'undefined') return SEED;
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED;
  } catch {
    return SEED;
  }
}

let cache = readStored();
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      return;
    }
  });
}

export function getEstimates() {
  return cache;
}

export function setEstimates(next) {
  cache = Array.isArray(next) ? next : [];
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    return;
  }
  emit();
}

export function addEstimate(entry) {
  setEstimates([entry, ...getEstimates()]);
}

export function updateEstimate(id, updates) {
  setEstimates(getEstimates().map((e) => (e.id === id ? { ...e, ...updates } : e)));
}

export function subscribeEstimates(fn) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useEstimates() {
  return useSyncExternalStore(subscribeEstimates, getEstimates);
}

export function estimateMatchesLead(estimate, lead) {
  if (!estimate || !lead) return false;
  if (estimate.leadId && String(estimate.leadId) === String(lead.id)) return true;
  const company = String(lead.company || '').trim().toLowerCase();
  const customer = String(estimate.customer || '').trim().toLowerCase();
  if (company && customer && (customer === company || customer.includes(company) || company.includes(customer))) return true;
  const leadName = String(lead.name || '').trim().toLowerCase();
  const entryLead = String(estimate.leadName || '').trim().toLowerCase();
  if (leadName && entryLead && entryLead === leadName) return true;
  return false;
}
