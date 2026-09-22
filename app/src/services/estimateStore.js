import { useSyncExternalStore } from 'react';

const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error('[Estimates] subscriber failed:', err);
    }
  });
}

/**
 * Estimates are an ERP collection (`/sales/estimates/`), held in ERPContext and
 * kept current by its persist helpers. This module is the small view of them
 * the CRM screens import — it exists so those screens do not each have to reach
 * into the ERP context.
 */
export function getEstimates() {
  return erpBridge.estimates;
}

export function setEstimates() {
  // Estimates are written through ERPContext, which owns the API round-trip.
  console.warn('[Estimates] setEstimates is a no-op: use the ERP context helpers.');
}

export function addEstimate(entry) {
  return erpBridge.addEstimate?.(entry);
}

export function updateEstimate(id, updates) {
  return erpBridge.updateEstimate?.(id, updates);
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

/**
 * ERPContext publishes its estimate collection and helpers here on mount, which
 * keeps this module free of a React dependency on the provider.
 */
const erpBridge = { estimates: [], addEstimate: null, updateEstimate: null };

export function publishEstimates(estimates, helpers = {}) {
  erpBridge.estimates = Array.isArray(estimates) ? estimates : [];
  erpBridge.addEstimate = helpers.addEstimate || null;
  erpBridge.updateEstimate = helpers.updateEstimate || null;
  emit();
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
