/**
 * taskCompletionService.js — CRM Task Completion engine (Outcome + Next Action)
 *
 * Wiring: Task → Lead → Lead Stage → Next Action.
 *
 * Reuses the existing CRM systems instead of inventing new ones:
 *  - `evenmore-crm-tasks-v1`       (Task List store via loadCrmTasks / saveCrmTasks)
 *  - `evenmore-crm-lead-details-v1`(Lead Detail store: tasks, activities)
 *  - `evenmore-crm-leads-v1`       (Lead rows)
 *  - `leadStageTasksV1`            (Lead Stage Task configuration)
 *  - `leadMasterTasksV1`           (Master Lead Task templates)
 *  - `evenmore-crm-stages-v1`      (Lead Stage configuration + order)
 *  - `findEligibleEmployee`        (existing assignment logic)
 *  - `calculateDueDate` / `resolveTaskPriority`
 *  - `runLeadStageAutomation`      (existing stage automation)
 *  - `crm:data-updated` event      (system-wide sync)
 */

import {
  CRM_EVENT,
  LEADS_STORAGE_KEY,
  LEAD_DETAIL_STORAGE_KEY,
  CRM_TASKS_STORAGE_KEY,
  TASK_SOURCE_AUTOMATION,
  normalizeStageName,
  loadCrmTasks,
  saveCrmTasks,
  findEligibleEmployee,
  calculateDueDate,
  resolveTaskPriority,
  runLeadStageAutomation,
  loadLeadStageTasksConfig,
  loadMasterTasksConfig,
} from './leadStageAutomation';

/* ── Outcome options for "What Happened?" ───────────────────── */
export const TASK_OUTCOMES = [
  { value: 'Connected', label: 'Connected', description: 'Successfully reached the contact.' },
  { value: 'No Answer', label: 'No Answer', description: 'Contact did not answer the call.' },
  { value: 'Interested', label: 'Interested', description: 'Contact showed interest in the offering.' },
  { value: 'Not Interested', label: 'Not Interested', description: 'Contact declined the offering.' },
  { value: 'Follow-up Required', label: 'Follow-up Required', description: 'Needs another touch point later.' },
];

/* ── Next action options for "What's Next?" ─────────────────── */
export const NEXT_ACTIONS = [
  { value: 'call-again', label: 'Call Again', description: 'Creates a follow-up call task for this lead.' },
  { value: 'schedule-demo', label: 'Schedule Demo', description: 'Creates the demo task for this lead.' },
  { value: 'send-quotation', label: 'Send Quotation', description: 'Creates the quotation task for this lead.' },
  { value: 'move-next-stage', label: 'Move to Next Stage', description: 'Moves the lead to its next configured stage.' },
  { value: 'finish', label: 'Finish', description: 'Only completes the current task.' },
];

export const NEXT_ACTION_LABELS = NEXT_ACTIONS.reduce((map, item) => {
  map[item.value] = item.label;
  return map;
}, {});

export const NEXT_ACTION_TITLES = {
  'call-again': 'Follow-up Call',
  'schedule-demo': 'Schedule Demo',
  'send-quotation': 'Send Quotation',
};

export const NEXT_ACTION_FALLBACK_ROLE = {
  'call-again': 'Tele Caller Executive',
  'schedule-demo': 'Area Sales Manager',
  'send-quotation': 'BDE',
};

export const NEXT_ACTION_FALLBACK_DUE_IN = {
  'call-again': 1,
  'schedule-demo': 2,
  'send-quotation': 1,
};

const STAGE_TITLE_PATTERNS = {
  'call-again': [/call/i, /follow[\s-]?up/i, /followup/i, /follow/i],
  'schedule-demo': [/demo/i, /meeting/i],
  'send-quotation': [/quotation/i, /quote/i],
};

export const DEFAULT_STAGE_ORDER = [
  'New Lead',
  'Details Collected',
  'Quotation Shared',
  'Demo Pending',
  'Demo Done',
  'Negotiation',
  'Won',
  'Lost',
];

/* ── Low level storage helpers ───────────────────────────────── */
function readJson(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function notifyAll() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CRM_EVENT));
}

function makeTaskId() {
  return `TSK-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`;
}

function makeActivityId() {
  return `act-complete-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatStamp(date) {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/* ── Lead helpers ────────────────────────────────────────────── */
export function buildLeadDisplay(lead) {
  if (!lead) return '';
  return `${lead.name || 'Untitled Lead'}${lead.company ? ` (${lead.company})` : ''}`;
}

export function loadLeadRows() {
  const stored = readJson(LEADS_STORAGE_KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export function loadLeadDetailMap() {
  const stored = readJson(LEAD_DETAIL_STORAGE_KEY, {});
  return stored && typeof stored === 'object' ? stored : {};
}

/**
 * Resolve the Lead related to a Task List record.
 * Matches by `leadId` first, then by the display name "(Name (Company))".
 */
export function resolveLeadForTask(task) {
  const rows = loadLeadRows();
  if (!Array.isArray(rows) || rows.length === 0) return null;

  if (task?.leadId) {
    const byId = rows.find((l) => String(l.id) === String(task.leadId));
    if (byId) return byId;
  }

  const display = String(task?.lead || '').trim().toLowerCase();
  if (!display) return null;

  return rows.find((l) => {
    const full = buildLeadDisplay(l).toLowerCase();
    if (display === full) return true;
    const name = String(l.name || '').toLowerCase();
    const company = String(l.company || '').toLowerCase();
    return name && company && display.includes(name) && display.includes(company);
  }) || null;
}

/* ── Lead Stage helpers ──────────────────────────────────────── */
/**
 * Return the configured lead stage order (admin config first).
 * 1. evenmore-crm-stages-v1 → active lead stage names in their configured order
 * 2. leadStageTasksV1       → stage names in their configured order
 * 3. DEFAULT_STAGE_ORDER
 */
export function getLeadStageOrder() {
  const config = readJson('evenmore-crm-stages-v1', null);
  if (config && Array.isArray(config.leadStages)) {
    const order = config.leadStages
      .filter((s) => !s || s.status !== 'Inactive')
      .map((s) => s.name)
      .filter(Boolean);
    if (order.length > 0) return order;
  }

  const stageTasks = loadLeadStageTasksConfig();
  if (Array.isArray(stageTasks) && stageTasks.length > 0) {
    const order = stageTasks.map((s) => s.name).filter(Boolean);
    if (order.length > 0) return order;
  }

  return DEFAULT_STAGE_ORDER;
}

/**
 * Returns the next configured lead stage for `currentStage`, or null when
 * there is no next stage (e.g. last stage or unknown stage).
 */
export function getNextStageName(currentStage) {
  const order = getLeadStageOrder();
  const normalized = normalizeStageName(currentStage);
  const index = order.findIndex((name) => normalizeStageName(name) === normalized);
  if (index === -1 || index >= order.length - 1) return null;
  return order[index + 1];
}

/* ── Task template helpers (existing Master / Stage config) ──── */
function findTemplateInStageTasks(actionType, stageName) {
  const patterns = STAGE_TITLE_PATTERNS[actionType] || [];
  const stages = loadLeadStageTasksConfig();
  const stage = stages.find((s) => normalizeStageName(s?.name) === normalizeStageName(stageName));
  const tasks = stage?.tasks || [];
  return tasks.find((t) => t && patterns.some((p) => p.test(String(t.name || '')))) || null;
}

function findTemplateInMasterTasks(actionType) {
  const patterns = STAGE_TITLE_PATTERNS[actionType] || [];
  const masters = loadMasterTasksConfig();
  return masters.find((m) => m && patterns.some((p) => p.test(String(m.name || '')))) || null;
}

/**
 * Resolve the most appropriate task template (Lead Stage Task or Master Task)
 * for creating the "next" task of the given action type.
 */
export function findTaskTemplateForAction(actionType, stageName) {
  return findTemplateInStageTasks(actionType, stageName) || findTemplateInMasterTasks(actionType) || null;
}

function buildTemplateFallback(actionType) {
  return {
    name: NEXT_ACTION_TITLES[actionType] || 'Task',
    role: NEXT_ACTION_FALLBACK_ROLE[actionType] || 'Sales Executive',
    department: 'Sales',
    priority: 'Medium',
    dueIn: NEXT_ACTION_FALLBACK_DUE_IN[actionType] ?? 1,
  };
}

function resolveTaskAssignment(role, department) {
  const employee = findEligibleEmployee(role, department);
  const owner = employee?.name || 'Unassigned';
  const warning = employee
    ? null
    : `No eligible employee is available for role "${role}". Task is created as Unassigned.`;
  return { owner, warning };
}

/**
 * Create a follow-up / next task for the lead using the EXISTING CRM task system:
 * writes into `evenmore-crm-tasks-v1` (Task List) and `evenmore-crm-lead-details-v1`
 * (Lead Detail Tasks), with automatic employee assignment and duplicate protection.
 *
 * @param {Object} params
 * @param {Object|null} params.lead
 * @param {'call-again'|'schedule-demo'|'send-quotation'} params.actionType
 * @param {Object} [params.baseTask]      - The task being completed (for context/linking)
 * @param {string} [params.completedBy]
 * @param {string} [params.stageName]     - Stage the follow-up belongs to (defaults to lead stage)
 * @returns {{ok: boolean, duplicate?: boolean, message?: string, createdTask?: Object, createdDetailTask?: Object, warnings?: string[]}}
 */
export function createFollowUpTask({ lead, actionType, baseTask = {}, completedBy, stageName }) {
  if (!lead) {
    return {
      ok: false,
      duplicate: false,
      message: 'Task could not be created because no related lead was found.',
    };
  }

  const stage = normalizeStageName(stageName || lead.status || baseTask.stage || 'New Lead');
  const template = findTaskTemplateForAction(actionType, stage) || buildTemplateFallback(actionType);
  const title = String(template.name || NEXT_ACTION_TITLES[actionType] || 'Task').trim();
  const display = buildLeadDisplay(lead);

  // Duplicate protection: skip if an open task with the same title already
  // exists for this lead in this stage (mirrors runLeadStageAutomation's guard).
  const currentCrmTasks = loadCrmTasks();
  const detailMap = loadLeadDetailMap();
  const leadDetail = detailMap[String(lead.id)] || {};
  const detailTasks = Array.isArray(leadDetail.tasks) ? leadDetail.tasks : [];

  const duplicateInCrm = currentCrmTasks.some((existing) => {
    if (existing.status === 'Completed') return false;
    const matchesLead =
      String(existing.leadId || '') === String(lead.id) ||
      (existing.lead || '') === display;
    const matchesTitle = String(existing.title || '').trim().toLowerCase() === title.toLowerCase();
    const matchesStage = normalizeStageName(existing.stage || '') === stage;
    return matchesLead && matchesTitle && matchesStage;
  });

  const duplicateInDetail = detailTasks.some((existing) => {
    if (existing.status === 'Completed') return false;
    const matchesTitle = String(existing.title || '').trim().toLowerCase() === title.toLowerCase();
    const matchesStage = normalizeStageName(existing.stage || '') === stage;
    return matchesTitle && matchesStage;
  });

  if (duplicateInCrm || duplicateInDetail) {
    return {
      ok: false,
      duplicate: true,
      message: `A "${title}" task for this lead is already pending. No duplicate was created.`,
    };
  }

  const role = template.role || NEXT_ACTION_FALLBACK_ROLE[actionType] || 'Sales Executive';
  const department = template.department || 'Sales';
  const { owner, warning } = resolveTaskAssignment(role, department);
  const { isoDate, dueAt } = calculateDueDate(template, null);
  const priority = resolveTaskPriority(template, null);
  const nowIso = new Date().toISOString();

  const crmTaskId = makeTaskId();
  const crmTaskRecord = {
    id: crmTaskId,
    title,
    lead: display,
    leadId: lead.id,
    owner,
    dueDate: isoDate,
    dueAt,
    priority,
    status: 'Open',
    stage,
    department: department || (owner !== 'Unassigned' ? 'Sales' : 'Sales'),
    source: TASK_SOURCE_AUTOMATION,
    warning,
    required: false,
    followUpFrom: baseTask?.id || baseTask?.crmTaskId || null,
    createdAt: nowIso,
  };

  const leadDetailTaskRecord = {
    id: `lt-auto-${Date.now()}`,
    title,
    stage,
    status: 'Due',
    priority,
    dueAt,
    dueDate: isoDate,
    process: 'Not Started',
    attempt: 1,
    assignee: owner,
    description: `${title} for ${display}`,
    source: TASK_SOURCE_AUTOMATION,
    warning,
    defaultTask: template.id || 'custom',
    crmTaskId,
  };

  // 1. Task List store
  saveCrmTasks([crmTaskRecord, ...currentCrmTasks]);

  // 2. Lead Detail store (+ activity + counters)
  const activityEntry = {
    id: makeActivityId(),
    title: `Next task created: "${title}"${owner !== 'Unassigned' ? ` (${owner})` : ' (Unassigned)'}`,
    time: 'Just now',
    color: '#1d6bff',
  };
  const existingActivities = Array.isArray(leadDetail.activities) ? leadDetail.activities : [];
  const nextDetailTasks = [leadDetailTaskRecord, ...detailTasks];
  const openCount = nextDetailTasks.filter((t) => t.status !== 'Completed').length;

  detailMap[String(lead.id)] = {
    ...leadDetail,
    tasks: nextDetailTasks,
    activities: [activityEntry, ...existingActivities],
  };
  writeJson(LEAD_DETAIL_STORAGE_KEY, detailMap);

  // 3. Keep the lead row open-task counter in sync
  const leadRows = loadLeadRows();
  const updatedRows = leadRows.map((l) =>
    String(l.id) === String(lead.id) ? { ...l, openTasksCount: openCount } : l
  );
  writeJson(LEADS_STORAGE_KEY, updatedRows);

  notifyAll();

  return {
    ok: true,
    createdTask: crmTaskRecord,
    createdDetailTask: leadDetailTaskRecord,
    warnings: warning ? [warning] : [],
  };
}

function moveLeadToNextStage(lead) {
  const nextStage = getNextStageName(lead?.status);
  if (!nextStage) {
    return { ok: false, message: 'No next stage is configured for this lead. Stage was not changed.' };
  }

  const previousStage = lead.status;
  const leadRows = loadLeadRows();
  const nextRows = leadRows.map((l) =>
    String(l.id) === String(lead.id) ? { ...l, status: nextStage } : l
  );
  writeJson(LEADS_STORAGE_KEY, nextRows);

  try {
    runLeadStageAutomation({ ...lead, status: nextStage }, nextStage, { previousStage });
  } catch (error) {
    console.error('[CRM Completion] Error running stage automation:', error);
  }

  return { ok: true, nextStage };
}

/* ── Main orchestration ──────────────────────────────────────── */
/**
 * Complete a CRM task with a mandatory outcome + next action.
 *
 * 1. Saves the selected outcome / next action onto the task.
 * 2. Marks the current task as completed (Task List + Lead Detail).
 * 3. Updates the related Lead (activity, counters, stage when required).
 * 4. Executes the selected next action:
 *      call-again / schedule-demo / send-quotation → create follow-up task
 *      move-next-stage                            → advance lead stage + run automation
 *      finish                                     → nothing further
 *
 * @param {Object} params
 * @param {Object|null}  params.task            - Task List record (from evenmore-crm-tasks-v1)
 * @param {Object|null}  params.lead            - Resolved Lead row
 * @param {string}       params.outcome         - One of TASK_OUTCOMES[].value
 * @param {string}       params.nextAction      - One of NEXT_ACTIONS[].value
 * @param {string}       [params.completedBy]
 * @param {Object|null}  [params.leadDetailTask]- Lead Detail task record (from evenmore-crm-lead-details-v1)
 * @returns {{
 *   ok: boolean,
 *   message: string,
 *   warnings: string[],
 *   createdTask: Object|null,
 *   createdDetailTask: Object|null,
 *   nextLeadStage: string|null,
 *   leadDetailTasks: Array|null,
 *   activities: Array|null,
 * }}
 */
export function completeTaskWithOutcome({ task, lead, outcome, nextAction, completedBy, leadDetailTask }) {
  const warnings = [];
  const completedAt = new Date().toISOString();
  const completedAtDisplay = formatStamp(new Date());
  const actionLabel = NEXT_ACTION_LABELS[nextAction] || nextAction || '';
  const taskTitle = task?.title || leadDetailTask?.title || 'Task';
  const actor = String(completedBy || lead?.owner || '').trim() || 'CRM User';

  // 1. Update the Task List store (evenmore-crm-tasks-v1)
  if (task?.id) {
    const currentCrmTasks = loadCrmTasks();
    const nextCrmTasks = currentCrmTasks.map((t) =>
      String(t.id) === String(task.id)
        ? {
            ...t,
            status: 'Completed',
            completionOutcome: outcome,
            nextAction,
            completedAt,
            completedBy: actor,
          }
        : t
    );
    saveCrmTasks(nextCrmTasks);
  } else {
    saveCrmTasks(loadCrmTasks());
  }

  // 2. Update the Lead Detail store (evenmore-crm-lead-details-v1)
  let leadDetailTasks = null;
  let activities = null;
  if (lead?.id) {
    const detailMap = loadLeadDetailMap();
    const key = String(lead.id);
    const leadDetail = detailMap[key] || {};
    const detailTasks = Array.isArray(leadDetail.tasks) ? leadDetail.tasks : [];

    const nextDetailTasks = detailTasks.map((t) => {
      const isMatch =
        (leadDetailTask?.id && String(t.id) === String(leadDetailTask.id)) ||
        (task?.id && String(t.crmTaskId) === String(task.id));
      if (!isMatch) return t;
      return {
        ...t,
        status: 'Completed',
        process: 'Done',
        completionOutcome: outcome,
        nextAction,
        completedAt,
        completedBy: actor,
      };
    });

    const activityEntry = {
      id: makeActivityId(),
      title: `Task "${taskTitle}" completed`,
      outcome,
      nextAction: actionLabel,
      employee: actor,
      time: completedAtDisplay,
      color: '#16a34a',
    };
    const existingActivities = Array.isArray(leadDetail.activities) ? leadDetail.activities : [];
    activities = [activityEntry, ...existingActivities];
    leadDetailTasks = nextDetailTasks;

    detailMap[key] = {
      ...leadDetail,
      tasks: nextDetailTasks,
      activities,
    };
    writeJson(LEAD_DETAIL_STORAGE_KEY, detailMap);

    // Keep the lead row open-task counter in sync
    const openCount = nextDetailTasks.filter((t) => t.status !== 'Completed').length;
    const leadRows = loadLeadRows();
    const updatedRows = leadRows.map((l) =>
      String(l.id) === String(lead.id) ? { ...l, openTasksCount: openCount } : l
    );
    writeJson(LEADS_STORAGE_KEY, updatedRows);
  }

  // 3. Execute the selected next action
  let nextLeadStage = null;
  let createdTask = null;
  let createdDetailTask = null;

  if (nextAction === 'call-again' || nextAction === 'schedule-demo' || nextAction === 'send-quotation') {
    const followUp = createFollowUpTask({
      lead,
      actionType: nextAction,
      baseTask: task || leadDetailTask,
      completedBy: actor,
      stageName: leadDetailTask?.stage || task?.stage || lead?.status,
    });

    if (followUp.ok) {
      createdTask = followUp.createdTask;
      createdDetailTask = followUp.createdDetailTask;
      warnings.push(...(followUp.warnings || []));
    } else if (followUp.duplicate) {
      warnings.push(followUp.message);
    } else {
      warnings.push(followUp.message);
    }
  } else if (nextAction === 'move-next-stage') {
    const move = moveLeadToNextStage(lead);
    if (move.ok) {
      nextLeadStage = move.nextStage;
    } else {
      warnings.push(move.message);
    }
  }

  // 4. Re-read Lead Detail tasks so callers get authoritative state
  if (lead?.id) {
    const detailMap = loadLeadDetailMap();
    const leadDetail = detailMap[String(lead.id)] || {};
    if (Array.isArray(leadDetail.tasks)) {
      leadDetailTasks = leadDetail.tasks;
    }
    if (Array.isArray(leadDetail.activities)) {
      activities = leadDetail.activities;
    }
  }

  notifyAll();

  return {
    ok: true,
    message: 'Task completed successfully.',
    warnings,
    createdTask,
    createdDetailTask,
    nextLeadStage,
    leadDetailTasks,
    activities,
  };
}