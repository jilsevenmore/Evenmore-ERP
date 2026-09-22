/**
 * crmSync — the CRM half of the API contract (api.md §9).
 *
 * The CRM endpoints already answer in the shape the screens read: a lead comes
 * back with `company`, `owner`, `amount` and the `…Count` badges already on it.
 * So most readers here only translate the two things that genuinely differ:
 *
 *   dates   — the API speaks `YYYY-MM-DD`, the tables render `DD/MM/YYYY`
 *   labels  — a lead carries `sourceId`/`stageId`; the filters show names
 *
 * Everything else passes through untouched, which is why these mappers are
 * short: the contract was written against these components.
 */
import { createSync, compact, asText, isServerId, describeError, isBackendEnabled } from './resourceSync';
import { api } from './api';
import { formatDateDDMMYYYY, toISODate } from '../utils/dateUtils';

export { isServerId, describeError, isBackendEnabled };

/** `DD/MM/YYYY`, `Today`, a Date or an ISO string → `YYYY-MM-DD` for the API. */
function isoOut(value) {
  if (!value) return undefined;
  return toISODate(value) || undefined;
}

/** `YYYY-MM-DD` → the `DD/MM/YYYY` the tables render. */
function displayIn(value) {
  return value ? formatDateDDMMYYYY(value) : value;
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Two-letter monogram for the avatar chips, from the API's `name`. */
export function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/** Stable per-lead avatar tint when the server has not stored one. */
const AVATAR_PALETTE = [
  '#2F6FED', '#7C3AED', '#059669', '#EA580C', '#DB2777',
  '#0891B2', '#4F46E5', '#65A30D', '#9333EA', '#0D9488',
];

export function avatarColorFor(seed) {
  const key = String(seed || '');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

// ── leads ───────────────────────────────────────────────────────────────────

function leadFromApi(row) {
  return {
    ...asText(row, [
      'name', 'company', 'phone', 'email', 'owner', 'city', 'state',
      'country', 'jobTitle', 'industry', 'source',
    ]),
    createdOn: displayIn(row.createdOn),
    // The list groups by stage name; the record stores the id.
    status: row.status || row.stageName || '',
    avatarColor: row.avatarColor || avatarColorFor(row.id || row.name),
    amount: num(row.amount),
    _synced: true,
  };
}

function leadToApi(lead) {
  return compact({
    name: lead.name,
    company: lead.company || undefined,
    phone: lead.phone || undefined,
    email: lead.email || undefined,
    stageId: lead.stageId || undefined,
    status: lead.status || undefined,
    ownerId: lead.ownerId || undefined,
    sourceId: lead.sourceId || undefined,
    industryId: lead.industryId || undefined,
    partyId: lead.partyId || undefined,
    jobTitle: lead.jobTitle || undefined,
    city: lead.city || undefined,
    state: lead.state || undefined,
    country: lead.country || undefined,
    amount: lead.amount !== undefined ? num(lead.amount) : undefined,
    latitude: lead.latitude ?? undefined,
    longitude: lead.longitude ?? undefined,
    createdOn: isoOut(lead.createdOn),
    customValues: lead.customValues || undefined,
  });
}

// ── deals ───────────────────────────────────────────────────────────────────

function dealFromApi(row) {
  return {
<<<<<<< Updated upstream
    ...asText(row, ['title', 'name', 'client', 'phone', 'status', 'source', 'assignedUser', 'notes', 'stage']),
    id: row.id,
    name: row.title || row.name,
    title: row.title || row.name,
    client: row.customerName || row.client || '',
    customerId: row.customerId || undefined,
    stage: row.stage || 'Draft',
    price: num(row.value ?? row.amount),
    value: num(row.value ?? row.amount),
    expectedCloseDate: displayIn(row.expectedCloseDate || row.expected_close_date),
    date: displayIn(row.expectedCloseDate || row.expected_close_date || row.created_at),
=======
    ...asText(row, ['title', 'name', 'client', 'phone', 'status', 'source', 'assignedUser', 'notes']),
    expectedCloseDate: displayIn(row.expectedCloseDate),
    value: num(row.value ?? row.amount),
>>>>>>> Stashed changes
    _synced: true,
  };
}

function dealToApi(deal) {
  return compact({
    title: deal.title || deal.name,
    leadId: deal.leadId || undefined,
<<<<<<< Updated upstream
    customerId: deal.customerId || deal.partyId || undefined,
    stage: deal.stage || undefined,
    ownerId: deal.ownerId || undefined,
    value: deal.value !== undefined ? num(deal.value) : (deal.price !== undefined ? num(deal.price) : undefined),
    currency: deal.currency || undefined,
    probability: deal.probability !== undefined ? num(deal.probability) : undefined,
    expectedCloseDate: isoOut(deal.expectedCloseDate || deal.date),
=======
    partyId: deal.partyId || deal.customerId || undefined,
    stageId: deal.stageId || undefined,
    ownerId: deal.ownerId || undefined,
    value: deal.value !== undefined ? num(deal.value) : undefined,
    currency: deal.currency || undefined,
    probability: deal.probability !== undefined ? num(deal.probability) : undefined,
    expectedCloseDate: isoOut(deal.expectedCloseDate),
>>>>>>> Stashed changes
    status: deal.status || undefined,
    lostReasonId: deal.lostReasonId || undefined,
    notes: deal.notes || undefined,
  });
}

// ── tasks ───────────────────────────────────────────────────────────────────

function taskFromApi(row) {
  return {
    ...asText(row, [
      'title', 'description', 'assigneeName', 'assigneeRole',
      'department', 'priority', 'status', 'source',
    ]),
    dueDate: displayIn(row.dueDate),
    // The task tables read `lead` and `owner` as plain labels; the API names
    // them `leadName` and `assigneeName`. Both have to be present, because a
    // column whose value is `undefined` falls back to rendering the whole row.
    lead: row.leadName || '',
    owner: row.assigneeName || 'Unassigned',
    due: displayIn(row.dueDate),
    completionOutcome: row.outcome || '',
    completedBy: typeof row.completedBy === 'object'
      ? (row.completedBy?.name || '')
      : (row.completedBy || ''),
    // A nested task would otherwise be handed to a cell renderer as a value.
    followUpTaskId: row.followUpTask?.id || row.followUpTask || null,
    followUpTask: undefined,
    _synced: true,
  };
}

function taskToApi(task) {
  return compact({
    title: task.title || task.name,
    description: task.description || undefined,
    leadId: task.leadId || undefined,
    dealId: task.dealId || undefined,
    assigneeId: task.assigneeId || undefined,
    assigneeRole: task.assigneeRole || task.role || undefined,
    department: task.department || undefined,
    dueDate: isoOut(task.dueDate),
    priority: task.priority || undefined,
    status: task.status || undefined,
    outcome: task.outcome || undefined,
    nextAction: task.nextAction || undefined,
  });
}

/** A named record with nothing but a label — sources, industries, reasons. */
const lookup = (path) => ({
  path,
  toApi: (row) => compact({
    name: row.name || row.label,
    isActive: row.isActive ?? undefined,
    color: row.color || undefined,
  }),
  fromApi: (row) => ({ ...row, label: row.name, _synced: true }),
});

export const CRM_RESOURCES = {
  leads: { path: '/crm/leads/', toApi: leadToApi, fromApi: leadFromApi },
  deals: { path: '/crm/deals/', toApi: dealToApi, fromApi: dealFromApi },
  tasks: { path: '/crm/tasks/', toApi: taskToApi, fromApi: taskFromApi },

  stages: {
    path: '/crm/stages/',
    toApi: (s) => compact({
      name: s.name,
      order: s.order ?? s.sequence,
      color: s.color || undefined,
      icon: s.icon || undefined,
      bg: s.bg || undefined,
      fg: s.fg || undefined,
      isWon: s.isWon ?? undefined,
      isLost: s.isLost ?? undefined,
      isActive: s.isActive ?? undefined,
    }),
    fromApi: (row) => ({ ...row, _synced: true }),
  },

  dealStages: {
    path: '/crm/deal-stages/',
    toApi: (s) => compact({
      name: s.name,
      order: s.order ?? s.sequence,
      color: s.color || undefined,
      isWon: s.isWon ?? undefined,
      isLost: s.isLost ?? undefined,
    }),
    fromApi: (row) => ({ ...row, _synced: true }),
  },

  sources: lookup('/crm/sources/'),
  industries: lookup('/crm/industries/'),
  lostReasons: lookup('/crm/lost-reasons/'),

  masterTasks: {
    path: '/crm/master-tasks/',
    toApi: (t) => compact({
      name: t.name || t.title,
      description: t.description || undefined,
      role: t.role || t.assigneeRole || undefined,
      department: t.department || undefined,
      priority: t.priority || undefined,
      dueIn: t.dueIn ?? t.offsetDays ?? undefined,
      isActive: t.isActive ?? undefined,
    }),
    fromApi: (row) => ({
      ...asText(row, ['name', 'description', 'role', 'department', 'priority']),
      title: row.title || row.name || '',
      _synced: true,
    }),
  },

  stageTasks: {
    path: '/crm/stage-tasks/',
    toApi: (t) => compact({
      stageId: t.stageId,
      name: t.name || t.title,
      description: t.description || undefined,
      role: t.role || t.assigneeRole || undefined,
      department: t.department || undefined,
      order: t.order ?? t.sortOrder ?? undefined,
      dueIn: t.dueIn ?? t.offsetDays ?? undefined,
      priority: t.priority || undefined,
      isActive: t.isActive ?? undefined,
    }),
    fromApi: (row) => ({
      ...asText(row, ['name', 'description', 'role', 'department', 'priority', 'stageName']),
      title: row.title || row.name || '',
      _synced: true,
    }),
  },

  taskAllocations: {
    path: '/crm/task-allocations/',
    toApi: (a) => compact({
      taskId: a.taskId || undefined,
      masterTaskId: a.masterTaskId || undefined,
      assigneeId: a.assigneeId || undefined,
      role: a.role || undefined,
      department: a.department || undefined,
      status: a.status || undefined,
      dueDate: isoOut(a.dueDate),
    }),
    fromApi: (row) => ({ ...row, dueDate: displayIn(row.dueDate), _synced: true }),
  },

  userAllocations: {
    path: '/crm/user-allocations/',
    toApi: (a) => compact({
      userId: a.userId || a.assigneeId,
      role: a.role || undefined,
      department: a.department || undefined,
      stageId: a.stageId || undefined,
      isActive: a.isActive ?? undefined,
    }),
    fromApi: (row) => ({ ...row, _synced: true }),
  },

  forms: {
    path: '/crm/forms/',
    toApi: (f) => compact({
      name: f.name || f.title,
      description: f.description || undefined,
      fields: f.fields || undefined,
      isPublished: f.isPublished ?? undefined,
    }),
    fromApi: (row) => ({ ...row, _synced: true }),
  },

  projects: {
    path: '/crm/projects/',
    toApi: (p) => compact({
      name: p.name || p.title,
      dealId: p.dealId || undefined,
      partyId: p.partyId || p.customerId || undefined,
      ownerId: p.ownerId || undefined,
      status: p.status || undefined,
      startDate: isoOut(p.startDate),
      endDate: isoOut(p.endDate),
      value: p.value !== undefined ? num(p.value) : undefined,
      notes: p.notes || undefined,
    }),
    fromApi: (row) => ({
      ...row,
      startDate: displayIn(row.startDate),
      endDate: displayIn(row.endDate),
      _synced: true,
    }),
  },

  contracts: {
    path: '/crm/contracts/',
    toApi: (c) => compact({
      title: c.title || c.name,
      dealId: c.dealId || undefined,
      partyId: c.partyId || c.customerId || undefined,
      projectId: c.projectId || undefined,
      templateId: c.templateId || undefined,
      status: c.status || undefined,
      value: c.value !== undefined ? num(c.value) : undefined,
      startDate: isoOut(c.startDate),
      endDate: isoOut(c.endDate),
      body: c.body || c.content || undefined,
      terms: c.terms || undefined,
    }),
    fromApi: (row) => ({
      ...row,
      startDate: displayIn(row.startDate),
      endDate: displayIn(row.endDate),
      _synced: true,
    }),
  },
};

export const crmSync = createSync(CRM_RESOURCES, { label: 'crmSync' });

/** Everything the CRM shell needs on sign-in, in dependency order. */
export const CRM_PULL_ORDER = [
  'stages', 'dealStages', 'sources', 'industries', 'lostReasons',
  'leads', 'deals', 'tasks', 'masterTasks', 'stageTasks',
  'taskAllocations', 'userAllocations', 'forms', 'projects', 'contracts',
];

// ── endpoints that are not plain collections ────────────────────────────────

/** `GET /crm/team-roster/` — who can be assigned, grouped by role. */
export async function pullTeamRoster() {
  if (!isBackendEnabled()) return null;
  try {
    const body = await api.get('/crm/team-roster/');
    const roster = body?.roster || body || {};
    const members = [];
    Object.entries(roster).forEach(([role, people]) => {
      (people || []).forEach((person) => members.push({ ...person, role }));
    });
    return { roster, members };
  } catch (err) {
    console.warn('[crmSync] pull team roster failed:', err?.message || err);
    return null;
  }
}

/** `GET /crm/dashboard/` — the tiles, computed server-side. */
export async function pullDashboard(query = {}) {
  if (!isBackendEnabled()) return null;
  try {
    return await api.get('/crm/dashboard/', { query });
  } catch (err) {
    console.warn('[crmSync] pull dashboard failed:', err?.message || err);
    return null;
  }
}

/** `GET /crm/leads/stats/` — the tab counts above the list. */
export async function pullLeadStats(query = {}) {
  if (!isBackendEnabled()) return null;
  try {
    return await api.get('/crm/leads/stats/', { query });
  } catch (err) {
    console.warn('[crmSync] pull lead stats failed:', err?.message || err);
    return null;
  }
}

/** `GET /crm/reports/{key}/` — one report, already aggregated. */
export async function pullReport(reportKey, query = {}) {
  if (!isBackendEnabled()) return null;
  try {
    return await api.get(`/crm/reports/${reportKey}/`, { query });
  } catch (err) {
    console.warn(`[crmSync] pull report ${reportKey} failed:`, err?.message || err);
    return null;
  }
}

/** The lead detail drawer's sub-collections (`/crm/leads/{id}/notes/`, …). */
export async function pullLeadDetail(leadId, section) {
  if (!isBackendEnabled() || !isServerId(leadId)) return null;
  try {
    const body = await api.get(`/crm/leads/${leadId}/${section}/`);
    return Array.isArray(body) ? body : (body?.results || body || []);
  } catch (err) {
    console.warn(`[crmSync] pull lead ${section} failed:`, err?.message || err);
    return null;
  }
}

export async function pushLeadDetail(leadId, section, payload) {
  if (!isBackendEnabled() || !isServerId(leadId)) return null;
  return api.post(`/crm/leads/${leadId}/${section}/`, payload);
}

/** Edit or remove one row in a lead's sub-collection. */
export async function updateLeadNote(leadId, noteId, payload) {
  if (!isBackendEnabled() || !isServerId(leadId) || !isServerId(noteId)) return null;
  return api.patch(`/crm/leads/${leadId}/notes/${noteId}/`, payload);
}

export async function deleteLeadNote(leadId, noteId) {
  if (!isBackendEnabled() || !isServerId(leadId) || !isServerId(noteId)) return null;
  await api.delete(`/crm/leads/${leadId}/notes/${noteId}/`);
  return true;
}

/** `POST /crm/leads/{id}/convert/` — the lead becomes a party and/or a deal. */
export async function convertLead(leadId, payload = {}) {
  return crmSync.act('leads', leadId, 'convert', payload, { raw: true });
}

export async function setLeadPinned(leadId, pinned) {
  return crmSync.act('leads', leadId, pinned ? 'pin' : 'unpin', {}, { raw: true });
}

export async function completeTask(taskId, payload = {}) {
  return crmSync.act('tasks', taskId, 'complete', payload);
}

export async function reorderStages(orderedIds) {
  if (!isBackendEnabled()) return null;
  return api.post('/crm/stages/reorder/', { ids: orderedIds });
}

export async function bulkDeleteLeads(ids) {
  if (!isBackendEnabled()) return null;
  return api.post('/crm/leads/bulk-delete/', { ids });
}

export default crmSync;
