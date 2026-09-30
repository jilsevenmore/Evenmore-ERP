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

/**
 * The screens toggle `status` ('Active' / 'Inactive'); the API stores
 * `isActive`. The status wins when present, because a toggled row still
 * carries the `isActive` it was loaded with.
 */
/** "Max repeats" as typed (text or number) -> a count, or null when blank. */
function maxRepeatsOut(value) {
  if (value === undefined) return undefined;
  if (value === '' || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

function activeFlag(row) {
  if (row?.status === 'Active') return true;
  if (row?.status === 'Inactive') return false;
  return row?.isActive ?? undefined;
}

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

function leadFromApi(raw) {
  // PATCH answers `{ lead, createdTasks }` (the stage automation's output);
  // every other read is the lead itself.
  const row = raw && raw.lead && Array.isArray(raw.createdTasks) ? raw.lead : raw;
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
    industry: lead.industry || undefined,
    party: lead.partyId || lead.party || undefined,
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
    ...asText(row, ['title', 'name', 'notes', 'stage', 'product', 'tag']),
    id: row.id,
    dealNumber: row.dealNumber || '',
    name: row.title || row.name,
    title: row.title || row.name,
    client: row.clientName || row.customerName || '',
    customerId: row.customerId || undefined,
    phone: row.contactPhone || '',
    source: row.sourceLabel || '',
    assignedUser: row.ownerName || '',
    projectId: row.projectId || null,
    products: Array.isArray(row.lineItems) ? row.lineItems : [],
    discount: num(row.discount),
    taxRate: num(row.taxRate),
    description: row.description || '',
    documents: Array.isArray(row.documents) ? row.documents : [],
    stage: row.stage || 'Draft',
    price: num(row.value ?? row.amount),
    value: num(row.value ?? row.amount),
    expectedCloseDate: displayIn(row.expectedCloseDate || row.expected_close_date),
    date: displayIn(row.expectedCloseDate || row.expected_close_date || row.created_at),
    _synced: true,
  };
}

function dealToApi(deal) {
  return compact({
    title: deal.title || deal.name,
    leadId: deal.leadId || undefined,
    customerId: deal.customerId || deal.partyId || undefined,
    stage: deal.stage || undefined,
    ownerId: deal.ownerId || undefined,
    value: deal.value !== undefined ? num(deal.value) : (deal.price !== undefined ? num(deal.price) : undefined),
    probability: deal.probability !== undefined ? num(deal.probability) : undefined,
    expectedCloseDate: isoOut(deal.expectedCloseDate || deal.date),
    lostReasonId: deal.lostReasonId || undefined,
    clientName: deal.client ?? undefined,
    contactPhone: deal.phone ?? undefined,
    product: deal.product ?? undefined,
    sourceLabel: deal.source ?? undefined,
    tag: deal.tag ?? undefined,
    notes: deal.notes ?? undefined,
    lineItems: Array.isArray(deal.products) ? deal.products : undefined,
    discount: deal.discount !== undefined && deal.discount !== '' ? num(deal.discount) : undefined,
    taxRate: deal.taxRate !== undefined && deal.taxRate !== '' ? num(deal.taxRate) : undefined,
    description: deal.description ?? undefined,
    // The signed `url` is minted per read; only the file ref is stored.
    documents: Array.isArray(deal.documents) ? deal.documents.map(({ url: _url, data: _data, ...ref }) => ref) : undefined,
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
    // Screen-level extras (due time, stage, task-form answers, linked documents).
    extra: task.extra && typeof task.extra === 'object' ? task.extra : undefined,
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

// ── forms ───────────────────────────────────────────────────────────────────
//
// The API stores a form as `name` + `kind` + a free `schema`. Everything the
// builders design (sections, fields, description, icon…) rides in `schema`, and
// the id the builder minted before the server answered is kept as `clientId`
// so a builder opened on that id still finds the form (crmForms.findForm).

const FORM_COLUMNS = ['id', 'name', 'kind', 'isPublished', 'publishedAt', 'slug', 'schema', 'createdAt', 'updatedAt', '_synced', '_pending'];

function formToApi(form) {
  const design = Object.fromEntries(
    Object.entries(form).filter(([key]) => !FORM_COLUMNS.includes(key)),
  );
  const clientId = form.clientId || (form.id && !isServerId(form.id) ? String(form.id) : undefined);
  return compact({
    name: form.name || form.title || 'Untitled form',
    kind: form.kind || undefined,
    isPublished: form.isPublished ?? undefined,
    schema: compact({ ...design, clientId }),
  });
}

function formFromApi(row) {
  const { schema, ...columns } = row;
  const design = schema && typeof schema === 'object' ? schema : {};
  return { ...design, ...columns, title: design.title || row.name, _synced: true };
}

// ── CRM projects ────────────────────────────────────────────────────────────
//
// The project card reads `customer`/`owner` as text, `projectNumber` and
// `expectedEndDate`; the API links `customerId`/`ownerId` and keeps the typed
// names beside them. Dates stay ISO -- the card's inputs are `type="date"`.

function projectToApi(p) {
  return compact({
    name: p.name,
    dealId: p.sourceDealId ?? p.dealId ?? undefined,
    customerId: p.customerId || p.partyId || undefined,
    customerName: p.customer ?? undefined,
    ownerId: p.ownerId || undefined,
    managerName: p.owner ?? undefined,
    team: p.team ?? undefined,
    projectType: p.projectType ?? undefined,
    status: p.status || undefined,
    startDate: isoOut(p.startDate),
    endDate: isoOut(p.expectedEndDate ?? p.endDate),
    value: p.value !== undefined && p.value !== '' ? num(p.value) : undefined,
    description: p.description ?? undefined,
  });
}

function projectFromApi(row) {
  return {
    ...row,
    projectNumber: row.code || '',
    customer: row.customerName || '',
    owner: row.ownerName || row.managerName || '',
    team: row.team || '',
    projectType: row.projectType || '',
    description: row.description || '',
    sourceDealId: row.dealId || row.deal || null,
    startDate: row.startDate || '',
    expectedEndDate: row.endDate || '',
    _synced: true,
  };
}

// ── contracts ───────────────────────────────────────────────────────────────

function contractToApi(c) {
  return compact({
    title: c.title || undefined,
    dealId: c.dealId || undefined,
    customerId: c.customerId || undefined,
    customerName: c.customer ?? undefined,
    contractType: c.contractType ?? undefined,
    value: c.amount !== undefined && c.amount !== '' ? num(c.amount) : undefined,
    startDate: isoOut(c.startDate),
    endDate: isoOut(c.endDate),
    description: c.description ?? undefined,
    terms: c.terms ?? undefined,
    templateKey: c.template ?? undefined,
    status: c.status || undefined,
    // The signed `url` is minted per read; only the file ref is stored.
    attachments: Array.isArray(c.attachments) ? c.attachments.map(({ url: _url, ...ref }) => ref) : undefined,
    notifyCustomer: c.notifyCustomer ?? undefined,
  });
}

function contractFromApi(row) {
  return {
    ...row,
    contractNumber: row.contractNumber || '',
    customer: row.customerName || '',
    client: row.customerName || '',
    contractType: row.contractType || '',
    amount: num(row.value),
    template: row.templateKey || '',
    description: row.description || '',
    terms: row.terms || '',
    dealId: row.dealId || row.deal || null,
    dealName: row.dealTitle || '',
    dealNumber: row.dealNumber || '',
    createdBy: row.createdByName || '',
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    _synced: true,
  };
}

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
      isActive: activeFlag(s),
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
      title: t.title || t.name,
      description: t.description || undefined,
      role: t.role || t.assigneeRole || undefined,
      department: t.department || undefined,
      priority: t.priority || undefined,
      dueIn: t.dueIn ?? t.offsetDays ?? undefined,
      order: t.order ?? undefined,
      isActive: activeFlag(t),
      // Stage ids: the server keeps one linked stage task per stage.
      stages: Array.isArray(t.stages) ? t.stages.filter(isServerId) : undefined,
      formId: t.formId === '' ? null : (isServerId(t.formId) ? t.formId : undefined),
    }),
    fromApi: (row) => ({
      ...asText(row, ['description', 'role', 'department', 'priority']),
      name: row.title || row.name || '',
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
      // The Tasks Master row it was picked from, and the form its tasks open.
      masterTaskId: t.masterTaskId === null ? null : (isServerId(t.masterTaskId) ? t.masterTaskId : undefined),
      formId: t.formId === '' || t.formId === null ? null : (isServerId(t.formId) ? t.formId : undefined),
      required: t.required ?? undefined,
      autoCreate: t.autoCreate ?? undefined,
      // The screen's "Max repeats" number; blank means once per lead.
      maxRepeats: maxRepeatsOut(t.repeats),
    }),
    fromApi: (row) => ({
      ...asText(row, ['name', 'description', 'role', 'department', 'priority', 'stageName']),
      title: row.title || row.name || '',
      // The screen edits "Max repeats" as `repeats`; the API's yes/no flag stays behind it.
      repeats: row.maxRepeats ?? '',
      formId: row.formId || '',
      _synced: true,
    }),
  },

  // Internal work handed to a team member (api.md §9.3) — not a lead task.
  // The server writes the audit trail; `note` only annotates the next line.
  // Every key is optional so a PATCH carries just what changed: an assignee
  // may only send `status` and `note`.
  taskAllocations: {
    path: '/crm/task-allocations/',
    toApi: (a) => compact({
      title: a.title ?? undefined,
      description: a.description ?? undefined,
      department: a.department ?? undefined,
      assigneeId: a.assigneeId !== undefined ? (a.assigneeId || null) : undefined,
      priority: a.priority ?? undefined,
      deadline: a.deadline !== undefined ? (a.deadline || null) : undefined,
      status: a.status ?? undefined,
      fileName: a.fileName ?? undefined,
      note: a.note || undefined,
    }),
    fromApi: (row) => ({
      ...row,
      assignee: row.assignee || 'Unassigned',
      assignedBy: row.assignedBy || '',
      // The detail page lists the newest activity first.
      audit: [...(row.audit || [])].reverse(),
      _synced: true,
    }),
  },

  // Hidden: User Tracking out of scope; backend route commented out -- restore by uncommenting this entry.
  // userAllocations: {
  //   path: '/crm/user-allocations/',
  //   toApi: (a) => compact({
  //     userId: a.userId || a.assigneeId,
  //     role: a.role || undefined,
  //     department: a.department || undefined,
  //     stageId: a.stageId || undefined,
  //     isActive: a.isActive ?? undefined,
  //   }),
  //   fromApi: (row) => ({ ...row, _synced: true }),
  // },

  forms: {
    path: '/crm/forms/',
    toApi: formToApi,
    fromApi: formFromApi,
  },

  projects: { path: '/crm/projects/', toApi: projectToApi, fromApi: projectFromApi },

  contracts: { path: '/crm/contracts/', toApi: contractToApi, fromApi: contractFromApi },
};

export const crmSync = createSync(CRM_RESOURCES, { label: 'crmSync' });

/** Everything the CRM shell needs on sign-in, in dependency order. */
export const CRM_PULL_ORDER = [
  'stages', 'dealStages', 'sources', 'industries', 'lostReasons',
  'leads', 'deals', 'tasks', 'masterTasks', 'stageTasks',
  'taskAllocations', /* 'userAllocations', -- hidden: out of scope */ 'forms', 'projects', 'contracts',
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

/** Edit or remove one row in a lead's sub-collection (`/crm/leads/{id}/{section}/{rowId}/`). */
export async function updateLeadDetailRow(leadId, section, rowId, payload) {
  if (!isBackendEnabled() || !isServerId(leadId) || !isServerId(rowId)) return null;
  return api.patch(`/crm/leads/${leadId}/${section}/${rowId}/`, payload);
}

export async function deleteLeadDetailRow(leadId, section, rowId) {
  if (!isBackendEnabled() || !isServerId(leadId) || !isServerId(rowId)) return null;
  await api.delete(`/crm/leads/${leadId}/${section}/${rowId}/`);
  return true;
}

export const updateLeadNote = (leadId, noteId, payload) => updateLeadDetailRow(leadId, 'notes', noteId, payload);
export const deleteLeadNote = (leadId, noteId) => deleteLeadDetailRow(leadId, 'notes', noteId);

// ── deal activity log and deal → project ────────────────────────────────────

/** A server activity row as the deal / contract timelines render it. */
function dealActivityFromApi(row) {
  const [title, ...rest] = String(row.description || '').split('\n');
  return {
    id: row.id,
    type: row.type,
    activityType: row.type,
    title: title || row.type,
    description: rest.join('\n'),
    actor: row.actorName || 'System',
    timestamp: row.createdAt,
    time: row.createdAt,
  };
}

/** `GET /crm/deals/{id}/activities/`. */
export async function pullDealActivities(dealId) {
  if (!isBackendEnabled() || !isServerId(dealId)) return [];
  try {
    const body = await api.get(`/crm/deals/${dealId}/activities/`);
    return (Array.isArray(body) ? body : (body?.results || [])).map(dealActivityFromApi);
  } catch (err) {
    console.warn('[crmSync] pull deal activities failed:', err?.message || err);
    return [];
  }
}

/** `POST /crm/deals/{id}/activities/` -- `{ type, title, description }`. */
export async function pushDealActivity(dealId, { type = 'activity', title = '', description = '' } = {}) {
  if (!isBackendEnabled() || !isServerId(dealId)) return null;
  const text = [title, description].filter(Boolean).join('\n');
  const row = await api.post(`/crm/deals/${dealId}/activities/`, { type, description: text });
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('crm:data-updated'));
  return dealActivityFromApi(row);
}

/** `POST /crm/deals/{id}/create-project/` -- the server links the deal and logs it. */
export async function createDealProject(dealId, project) {
  const row = await api.post(`/crm/deals/${dealId}/create-project/`, projectToApi(project));
  return projectFromApi(row);
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
  return api.post('/crm/stages/reorder/', { order: orderedIds });
}

export async function bulkDeleteLeads(ids) {
  if (!isBackendEnabled()) return null;
  return api.post('/crm/leads/bulk-delete/', { ids });
}

export default crmSync;
