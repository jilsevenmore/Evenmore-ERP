/**
 * CRM project cards, at `/crm/projects/`.
 *
 * These used to live in a `localStorage` blob (`evenmore-crm-projects-v2`), so a
 * project existed only in the browser that created it. They are now the CRM
 * store's `projects` collection: reads come from the store, writes are
 * requests, and creating one from a Won deal goes through
 * `POST /crm/deals/{id}/create-project/` so the server links the deal and logs
 * the activity in one transaction. The server also issues the `P-000001` code.
 */
import { useCrmStore } from '../stores/crmStore';
import { createDealProject } from './crmSync';

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

function notifyUpdated() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:data-updated'));
}

/** The project cards the CRM store is holding, as the server returned them. */
export function loadProjects() {
  return useCrmStore.getState().projects;
}

export function findDealProject(deal) {
  if (!deal) return null;
  const projects = loadProjects();
  return projects.find((project) => sameId(project.id, deal.projectId))
    || projects.find((project) => sameId(project.sourceDealId, deal.id))
    || null;
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

function assertValidDates(startDate, expectedEndDate) {
  for (const date of [startDate, expectedEndDate]) {
    if (date && !isValidCalendarDate(date)) throw new Error('Enter valid project dates.');
  }
  if (startDate && expectedEndDate && startDate > expectedEndDate) throw new Error('Expected end date must be on or after start date.');
}

/** The team member whose name was typed as project manager, if there is one. */
function ownerIdFor(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!key) return undefined;
  const member = useCrmStore.getState().teamMembers.find((m) => String(m.name || '').trim().toLowerCase() === key);
  return member?.id;
}

export function projectDefaults(deal) {
  return {
    name: deal.name || '', customer: deal.client || deal.company || '',
    owner: deal.assignedUser || deal.owner || '', team: deal.team || '',
    projectType: deal.projectType || '', startDate: '', expectedEndDate: '',
    description: deal.description || deal.notes || `Created from Deal ${deal.dealNumber || deal.id}`,
  };
}

/** Validate a project form, returning the trimmed fields to save. */
function cleanProject(input, { requireCustomer = true } = {}) {
  const name = String(input.name ?? '').trim();
  if (!name) throw new Error('Project name is required.');
  const customer = String(input.customer ?? input.client ?? '').trim();
  if (requireCustomer && !customer && !input.customerId) throw new Error('Customer is required.');
  const owner = String(input.owner ?? '').trim();
  if (!owner && !input.ownerId) throw new Error('Project manager is required.');
  const startDate = input.startDate || '';
  if (!startDate) throw new Error('Start date is required.');
  const expectedEndDate = input.expectedEndDate || '';
  assertValidDates(startDate, expectedEndDate);
  return {
    name,
    customer,
    customerId: input.customerId || undefined,
    owner,
    ownerId: input.ownerId || ownerIdFor(owner),
    team: String(input.team ?? '').trim(),
    projectType: String(input.projectType ?? '').trim(),
    startDate,
    expectedEndDate,
    description: String(input.description ?? ''),
    status: input.status || 'Active',
  };
}

export async function createProjectFromDeal(dealId, input = {}) {
  if (dealId == null || dealId === '') throw new Error('Deal ID is required.');
  const store = useCrmStore.getState();
  const deal = store.deals.find((item) => sameId(item.id, dealId));
  if (!deal) throw new Error('Deal was not found.');
  const existing = findDealProject(deal);
  if (existing) return { project: existing, created: false };
  if (deal.stage !== 'Won') throw new Error('Only a Won deal can create a project.');
  const defaults = projectDefaults(deal);
  const fields = cleanProject({
    ...defaults,
    ...input,
    customerId: input.customerId || deal.customerId,
    owner: input.owner ?? defaults.owner,
  }, { requireCustomer: false });
  const project = await createDealProject(deal.id, fields);
  useCrmStore.setState((s) => ({ projects: [project, ...(s.projects || [])] }));
  await store.refresh('deals');
  notifyUpdated();
  return { project, created: true };
}

export async function createStandaloneProject(input = {}) {
  const fields = cleanProject(input);
  const project = await useCrmStore.getState().createRecord('projects', {
    ...fields,
    sourceDealId: input.sourceDealId || undefined,
  });
  if (!project) throw new Error('Sign in to save projects.');
  notifyUpdated();
  return project;
}

export async function updateProject(projectId, patch = {}) {
  const current = loadProjects().find((item) => sameId(item.id, projectId));
  if (!current) throw new Error('Project was not found.');
  const fields = cleanProject({
    ...current,
    ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
    ownerId: patch.owner !== undefined && patch.owner !== current.owner ? undefined : current.ownerId,
  });
  const saved = await useCrmStore.getState().updateRecord('projects', projectId, fields);
  notifyUpdated();
  return saved || { ...current, ...fields };
}

export async function deleteProject(projectId) {
  const project = loadProjects().find((item) => sameId(item.id, projectId));
  if (!project) throw new Error('Project was not found.');
  const store = useCrmStore.getState();
  await store.deleteRecord('projects', projectId);
  // The server unlinks the deal; re-read so the deal can start a new project.
  if (project.sourceDealId) await store.refresh('deals');
  notifyUpdated();
  return project;
}
