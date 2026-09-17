import { loadDeals, DEALS_STORAGE_KEY } from './dealService.js';

export const PROJECTS_STORAGE_KEY = 'evenmore-crm-projects-v1';
const DETAILS_KEY = 'evenmore-crm-lead-details-v1';
const sameId = (a, b) => a != null && b != null && String(a) === String(b);

export function loadProjects(storage = localStorage) {
  const value = JSON.parse(storage.getItem(PROJECTS_STORAGE_KEY) || '[]');
  if (!Array.isArray(value)) throw new Error('Saved project data is invalid.');
  let sequence = Math.max(0, ...value.map((project) => Number(/^P-(\d+)$/.exec(project.projectNumber || '')?.[1]) || 0));
  let changed = false;
  const numbered = [...value].reverse().map((project) => {
    if (project.projectNumber) return project;
    changed = true;
    return { ...project, projectNumber: `P-${String(++sequence).padStart(6, '0')}` };
  }).reverse();
  if (changed) storage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(numbered));
  return numbered;
}

export function findDealProject(deal, storage = localStorage) {
  const projects = loadProjects(storage);
  const byDeal = projects.find((project) => sameId(project.sourceDealId, deal?.id));
  if (deal?.projectId != null) {
    const linked = projects.find((project) => sameId(project.id, deal.projectId));
    if (!linked || !sameId(linked.sourceDealId, deal.id) || (byDeal && !sameId(byDeal.id, linked.id))) {
      throw new Error('The linked project reference is invalid.');
    }
    return linked;
  }
  return byDeal || null;
}

export function projectDefaults(deal) {
  return {
    name: deal.name || '', customer: deal.client || deal.company || '',
    owner: deal.assignedUser || deal.owner || '', team: deal.team || '',
    projectType: deal.projectType || '', startDate: '', expectedEndDate: '',
    description: deal.description || deal.notes || `Created from Deal ${deal.id}`,
  };
}

export function createProjectFromDeal(dealId, input = {}, { storage = localStorage, actor = 'CRM User' } = {}) {
  if (dealId == null || dealId === '') throw new Error('Deal ID is required.');
  const deals = loadDeals(storage);
  const deal = deals.find((item) => sameId(item.id, dealId));
  if (!deal) throw new Error('Deal was not found.');
  const existing = findDealProject(deal, storage);
  if (existing && sameId(deal.projectId, existing.id)) return { project: existing, created: false };
  if (deal.stage !== 'Won') throw new Error('Only a Won deal can create a project.');
  const defaults = projectDefaults(deal);
  if (!defaults.customer && !deal.customerId && !deal.partyId) throw new Error('Customer is missing. Update the deal first.');
  if (!defaults.owner && !deal.ownerId) throw new Error('Owner is missing. Update the deal first.');
  const name = String(input.name ?? defaults.name).trim();
  if (!name) throw new Error('Project name is required.');
  const startDate = input.startDate || '';
  if (!existing && !startDate) throw new Error('Start date is required.');
  const expectedEndDate = input.expectedEndDate || '';
  for (const date of [startDate, expectedEndDate]) {
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new Error('Enter valid project dates.');
  }
  if (startDate && expectedEndDate && startDate > expectedEndDate) throw new Error('Expected end date must be on or after start date.');
  const references = {};
  for (const field of ['customerId', 'partyId', 'ownerId', 'teamId', 'productId', 'products', 'product', 'quantity', 'price', 'source', 'sourceId', 'contactPerson', 'email', 'phone', 'company', 'files', 'attachments']) {
    if (deal[field] !== undefined) references[field] = deal[field];
  }
  for (const field of ['customerId', 'partyId', 'ownerId', 'teamId']) {
    if (references[field] != null && !['string', 'number'].includes(typeof references[field])) throw new Error(`Invalid ${field}.`);
  }
  const projects = loadProjects(storage);
  const nextNumber = Math.max(0, ...projects.map((item) => Number(/^P-(\d+)$/.exec(item.projectNumber || '')?.[1]) || 0)) + 1;
  const timestamp = new Date().toISOString();
  const project = existing || {
    ...references, ...defaults, id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectNumber: `P-${String(nextNumber).padStart(6, '0')}`,
    sourceDealId: deal.id, name, startDate, expectedEndDate,
    projectType: String(input.projectType ?? defaults.projectType).trim(),
    description: String(input.description ?? defaults.description), status: 'Active', createdAt: timestamp,
  };
  const activity = {
    id: `deal-project-${project.id}`, title: `Project ${project.projectNumber} created from Deal ${deal.id}`,
    time: timestamp, timestamp, actor, color: '#10b981', type: 'project-created', dealId: deal.id, projectId: project.id,
  };
  const append = (entries = []) => {
    if (!Array.isArray(entries)) throw new Error('Saved activity data is invalid.');
    return entries.some((item) => item.id === activity.id) ? entries : [activity, ...entries];
  };
  const updatedDeal = { ...deal, projectId: project.id, activities: append(deal.activities) };
  const writes = [];
  if (!existing) writes.push([PROJECTS_STORAGE_KEY, JSON.stringify([project, ...projects])]);
  if (deal.leadId != null) {
    const details = JSON.parse(storage.getItem(DETAILS_KEY) || '{}');
    if (!details || typeof details !== 'object' || Array.isArray(details)) throw new Error('Saved lead details are invalid.');
    const detail = details[String(deal.leadId)] || {};
    writes.push([DETAILS_KEY, JSON.stringify({ ...details, [String(deal.leadId)]: { ...detail, activities: append(detail.activities) } })]);
  }
  writes.push([DEALS_STORAGE_KEY, JSON.stringify(deals.map((item) => sameId(item.id, deal.id) ? updatedDeal : item))]);
  const previous = writes.map(([key]) => [key, storage.getItem(key)]);
  let written = 0;
  try {
    for (const [key, value] of writes) { storage.setItem(key, value); written += 1; }
  } catch (error) {
    for (const [key, value] of previous.slice(0, written).reverse()) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); }
      catch (rollbackError) { console.error('[CRM Project] Rollback failed:', key, rollbackError); }
    }
    throw error;
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:data-updated'));
  return { project, created: !existing };
}
