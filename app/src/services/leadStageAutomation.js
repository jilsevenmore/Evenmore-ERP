import { convertLeadToDealIfNeeded } from './leadDealConversion.js';
import { useAppStore } from '../stores/appStore';
import { seedDemoDealTasks } from '../data/crm/mockDealTasks.js';
import { emitCrmEvent, CRM_EVENT_TYPES } from './crmEventNotifications.js';

/**
 * leadStageAutomation.js — CRM Lead Stage Task Automation Engine
 *
 * Connects Lead Stage + Master Lead Task + Lead Stage Task + Employee Assignment + Task List
 * into an automated, idempotent workflow.
 */

export const CRM_TASKS_STORAGE_KEY = 'evenmore-crm-tasks-v1';
export const LEAD_STAGE_TASKS_KEY = 'leadStageTasksV1';
export const MASTER_TASKS_KEY = 'leadMasterTasksV1';
export const LEADS_STORAGE_KEY = 'evenmore-crm-leads-v1';
export const LEAD_DETAIL_STORAGE_KEY = 'evenmore-crm-lead-details-v1';
export const CRM_EVENT = 'crm:data-updated';

export const TASK_SOURCE_AUTOMATION = 'Created by Lead Stage Automation';
export const TASK_SOURCE_MANUAL = 'Manual';

// Standard fallback stages if not configured in localStorage
export const DEFAULT_INITIAL_STAGES = [
  {
    id: "new",
    name: "New Lead",
    tasks: [
      {
        id: 1,
        name: "Call",
        description: "Initial call to understand requirements",
        role: "Tele Caller Executive",
        department: "Sales",
        order: 0,
        required: true,
        autoCreate: true,
        repeats: 14,
        dueIn: 0,
        priority: "High",
      },
    ],
  },
  {
    id: "details",
    name: "Details Collected",
    tasks: [
      {
        id: 2,
        name: "Send email",
        description: "Share company brochure and details",
        role: "Sales Support Executive",
        department: "Sales",
        order: 1,
        required: true,
        autoCreate: true,
        repeats: 6,
        dueIn: 0,
        priority: "Medium",
      },
    ],
  },
  {
    id: "quotation",
    name: "Quotation Shared",
    tasks: [
      {
        id: 3,
        name: "Send quotation",
        description: "Share quotation with client",
        role: "BDE",
        department: "Sales",
        order: 1,
        required: true,
        autoCreate: true,
        repeats: 10,
        dueIn: 1,
        priority: "Medium",
      },
      {
        id: 4,
        name: "Schedule demo",
        description: "Arrange product demo",
        role: "Area Sales Manager",
        department: "Sales",
        order: 2,
        required: true,
        autoCreate: true,
        repeats: 6,
        dueIn: 2,
        priority: "Medium",
      },
    ],
  },
  {
    id: "demo",
    name: "Demo Pending",
    tasks: [
      {
        id: 5,
        name: "Client meeting",
        description: "Meeting at client office",
        role: "Sales Support Executive",
        department: "Sales",
        order: 1,
        required: false,
        autoCreate: true,
        repeats: 6,
        dueIn: 3,
        priority: "Medium",
      },
    ],
  },
  {
    id: "done",
    name: "Demo Done",
    tasks: [],
  },
  {
    id: "negotiation",
    name: "Negotiation",
    tasks: [
      {
        id: 6,
        name: "Negotiate pricing",
        description: "Confirm commercial terms",
        role: "BDE",
        department: "Sales",
        order: 1,
        required: true,
        autoCreate: false,
        repeats: 3,
        dueIn: 2,
        priority: "High",
      },
    ],
  },
  {
    id: "won",
    name: "Won",
    tasks: [],
  },
  {
    id: "lost",
    name: "Lost",
    tasks: [],
  },
];

export const DEFAULT_MASTER_TASKS = [
  { id: 'mt-1', order: 1, name: 'Call', stages: ['New Lead', 'Details Collected'], role: 'Tele Caller Executive', department: 'Sales', priority: 'High', dueIn: 0, status: 'Active' },
  { id: 'mt-2', order: 2, name: 'Demo completed', stages: ['Demo Done', 'Won'], role: 'Sales Support Executive', department: 'Sales', priority: 'Medium', dueIn: 1, status: 'Active' },
  { id: 'mt-3', order: 3, name: 'Demo pending', stages: ['Demo Pending', 'Negotiation'], role: 'Sales Support Executive', department: 'Sales', priority: 'Medium', dueIn: 2, status: 'Active' },
  { id: 'mt-4', order: 4, name: 'Final Meeting', stages: ['Negotiation', 'Won'], role: 'Area Sales Manager', department: 'Sales', priority: 'High', dueIn: 3, status: 'Active' },
  { id: 'mt-5', order: 5, name: 'Formal meeting', stages: ['Negotiation'], role: 'BDE', department: 'Sales', priority: 'Medium', dueIn: 3, status: 'Active' },
  { id: 'mt-6', order: 6, name: 'Quotation', stages: ['Quotation Shared', 'Negotiation'], role: 'BDE', department: 'Sales', priority: 'Low', dueIn: 1, status: 'Active' },
  { id: 'mt-7', order: 7, name: 'Send email', stages: ['Details Collected'], role: 'Sales Support Executive', department: 'Sales', priority: 'Medium', dueIn: 0, status: 'Active' },
  { id: 'mt-8', order: 8, name: 'Send quotation', stages: ['Quotation Shared'], role: 'BDE', department: 'Sales', priority: 'Medium', dueIn: 1, status: 'Active' },
  { id: 'mt-9', order: 9, name: 'Schedule demo', stages: ['Quotation Shared', 'Demo Pending'], role: 'Area Sales Manager', department: 'Sales', priority: 'Medium', dueIn: 2, status: 'Active' },
  { id: 'mt-10', order: 10, name: 'Client meeting', stages: ['Demo Pending'], role: 'Sales Support Executive', department: 'Sales', priority: 'Medium', dueIn: 3, status: 'Active' },
  { id: 'mt-11', order: 11, name: 'Negotiate pricing', stages: ['Negotiation'], role: 'BDE', department: 'Sales', priority: 'High', dueIn: 2, status: 'Active' },
];

export const DEFAULT_INITIAL_TASKS = [
  { id: 'TSK-001', title: 'Follow up on Enterprise Quote', lead: 'Sarah Jenkins (Acme Corp)', owner: 'Alex Rivera', dueDate: '2026-09-12', priority: 'High', status: 'In Progress', source: TASK_SOURCE_MANUAL },
  { id: 'TSK-002', title: 'Schedule product demo call', lead: 'Michael Chang (TechFlow)', owner: 'Elena Rostova', dueDate: '2026-09-10', priority: 'Urgent', status: 'Open', source: TASK_SOURCE_MANUAL },
  { id: 'TSK-003', title: 'Send revised contract terms', lead: 'David Ross (Global Logistics)', owner: 'Alex Rivera', dueDate: '2026-09-15', priority: 'Medium', status: 'Waiting', source: TASK_SOURCE_MANUAL },
  { id: 'TSK-004', title: 'Prepare onboarding requirements', lead: 'Amanda Lee (Apex Innovations)', owner: 'Sarah Chen', dueDate: '2026-09-08', priority: 'High', status: 'Completed', source: TASK_SOURCE_MANUAL },
  { id: 'TSK-005', title: 'Review custom billing setup', lead: 'Robert Miller (Vanguard Systems)', owner: 'Elena Rostova', dueDate: '2026-09-18', priority: 'Low', status: 'Open', source: TASK_SOURCE_MANUAL },
];

// Eligible CRM team members with their supported roles and departments
export const CRM_TEAM_MEMBERS = [
  {
    name: 'Priya Mehta',
    roles: ['Tele Caller Executive', 'Telecaller', 'Sales Executive', 'Enterprise Accounts Executive'],
    department: 'Sales',
    email: 'priya@evenmore.io',
    phone: '+91 98455 33445',
  },
  {
    name: 'Sarah Chen',
    roles: ['Sales Support Executive', 'Customer Support', 'Support Specialist'],
    department: 'Support',
    email: 'sarah@evenmore.io',
  },
  {
    name: 'Alex Rivera',
    roles: ['BDE', 'Business Development Executive', 'Sales Executive'],
    department: 'Sales',
    email: 'alex@evenmore.io',
  },
  {
    name: 'David Patel',
    roles: ['Area Sales Manager', 'Senior Sales Account Manager', 'Account Owner'],
    department: 'Sales',
    email: 'david@evenmore.io',
  },
  {
    name: 'Rohit Sharma',
    roles: ['Technical Lead', 'Technical Pre-Sales Specialist'],
    department: 'Sales',
    email: 'rohit@evenmore.io',
  },
  {
    name: 'Ananya Deshmukh',
    roles: ['Customer Success & Inbound Leads', 'Sales Support Executive'],
    department: 'Support',
    email: 'ananya@evenmore.io',
  },
];

/**
 * Normalizes stage names for robust matching (e.g. 'new' / 'New' -> 'New Lead')
 */
export function normalizeStageName(rawStage) {
  if (!rawStage) return 'New Lead';
  const s = String(rawStage).trim().toLowerCase();
  if (s === 'new' || s === 'new lead' || s === 'new leads' || s === 'lead captured') return 'New Lead';
  if (s === 'details' || s === 'details collected' || s === 'contacted' || s === 'detail collected') return 'Details Collected';
  if (s === 'quotation' || s === 'quotation shared' || s === 'proposal') return 'Quotation Shared';
  if (s === 'demo' || s === 'demo pending') return 'Demo Pending';
  if (s === 'done' || s === 'demo done') return 'Demo Done';
  if (s === 'negotiation' || s === 'negotiating') return 'Negotiation';
  if (s === 'won' || s === 'converted' || s === 'customer') return 'Won';
  if (s === 'lost' || s === 'lost lead') return 'Lost';
  return String(rawStage).trim();
}

/**
 * Read JSON safely from localStorage
 */
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

/**
 * Write JSON safely to localStorage
 */
function writeJson(key, value) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load configured Lead Stage Tasks
 */
export function loadLeadStageTasksConfig() {
  const stored = readJson(LEAD_STAGE_TASKS_KEY, null);
  if (Array.isArray(stored) && stored.length > 0) return stored;
  return DEFAULT_INITIAL_STAGES;
}

/**
 * Load configured Master Tasks
 */
export function loadMasterTasksConfig() {
  const stored = readJson(MASTER_TASKS_KEY, null);
  if (Array.isArray(stored) && stored.length > 0) return stored;
  return DEFAULT_MASTER_TASKS;
}

/**
 * Load tasks for Task List (/crm/tasks)
 */
export function loadCrmTasks() {
  if (typeof localStorage === 'undefined') return DEFAULT_INITIAL_TASKS;
  let tasks = DEFAULT_INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(CRM_TASKS_STORAGE_KEY);
    if (raw !== null) {
      const stored = JSON.parse(raw);
      if (!Array.isArray(stored)) return DEFAULT_INITIAL_TASKS;
      tasks = stored;
    }
    return seedDemoDealTasks(tasks);
  } catch {
    return tasks;
  }
}

/**
 * Save tasks to Task List
 */
export function saveCrmTasks(tasks) {
  const previousIds = new Set((loadCrmTasks() || []).map((entry) => String(entry?.id)));
  const success = writeJson(CRM_TASKS_STORAGE_KEY, tasks);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CRM_EVENT));
  }
  if (success) {
    (tasks || [])
      .filter((entry) => entry && !previousIds.has(String(entry.id)))
      .forEach((entry) => emitCrmEvent({
        type: CRM_EVENT_TYPES.TASK_CREATED,
        entityType: 'task',
        entityId: entry.id,
        payload: {
          title: entry.title,
          ownerName: entry.owner,
          leadName: entry.lead,
          leadId: entry.leadId,
          path: '/crm/tasks',
        },
      }));
  }
  return success;
}

/**
 * Find eligible employee based on role and department
 */
export function findEligibleEmployee(taskRole, department) {
  if (!taskRole) return null;
  const targetRole = String(taskRole).trim().toLowerCase().replace(/[\s-_]+/g, '');
  const targetDept = department && department !== 'Any' ? String(department).trim().toLowerCase() : null;

  // 1. Try to find an exact or fuzzy role match in CRM_TEAM_MEMBERS
  const matchingMembers = CRM_TEAM_MEMBERS.filter((member) => {
    const roleMatch = member.roles.some((r) => {
      const normalized = String(r).toLowerCase().replace(/[\s-_]+/g, '');
      return normalized === targetRole || normalized.includes(targetRole) || targetRole.includes(normalized);
    });

    if (!roleMatch) return false;
    if (targetDept && member.department) {
      return member.department.toLowerCase().includes(targetDept) || targetDept.includes(member.department.toLowerCase());
    }
    return true;
  });

  if (matchingMembers.length > 0) {
    return matchingMembers[0];
  }

  // 2. Check allocation tasks store if present
  const allocationEmployees = readJson('crm-task-allocation-v1-employees', null);
  if (Array.isArray(allocationEmployees)) {
    const allocMatch = allocationEmployees.find((e) => {
      const eRole = String(e.role || e.designation || '').toLowerCase().replace(/[\s-_]+/g, '');
      return eRole === targetRole || eRole.includes(targetRole);
    });
    if (allocMatch) return allocMatch;
  }

  return null;
}

/**
 * Calculate due date based on stage task dueIn or master task dueIn
 */
export function calculateDueDate(stageTask, masterTask) {
  let dueInDays = 0;
  if (stageTask?.dueIn !== undefined && stageTask?.dueIn !== null && stageTask?.dueIn !== '') {
    const n = Number(stageTask.dueIn);
    if (!Number.isNaN(n) && n >= 0) dueInDays = n;
  } else if (masterTask?.dueIn !== undefined && masterTask?.dueIn !== null && masterTask?.dueIn !== '') {
    const n = Number(masterTask.dueIn);
    if (!Number.isNaN(n) && n >= 0) dueInDays = n;
  }

  const date = new Date();
  date.setDate(date.getDate() + dueInDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;

  const dueAt = date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return { isoDate, dueAt, dueInDays };
}

/**
 * Resolve priority: stageTask.priority > masterTask.priority > 'Medium'
 */
export function resolveTaskPriority(stageTask, masterTask) {
  const stageP = stageTask?.priority;
  if (stageP && ['Low', 'Medium', 'High', 'Urgent'].includes(stageP)) return stageP;

  const masterP = masterTask?.priority;
  if (masterP && ['Low', 'Medium', 'High', 'Urgent'].includes(masterP)) return masterP;

  return 'Medium';
}

/**
 * Main automation engine: Creates automatic tasks when a lead enters a stage.
 *
 * Fully idempotent:
 * - Checks existing open/pending tasks for (leadId, normalizedStage, taskName)
 * - If lead was edited without changing stage, does not duplicate
 * - Safely handles missing fields, inactive tasks, unassigned employees
 *
 * @param {Object} lead - Lead object ({ id, name, company, ... })
 * @param {string} targetStage - Target stage name (e.g. 'New Lead', 'Details Collected')
 * @param {Object} [options]
 * @param {string} [options.previousStage] - Previous stage if this was a stage change
 * @returns {Array<Object>} Newly created task objects
 */
export function runLeadStageAutomation(lead, targetStage, options = {}) {
  if (!lead || !lead.id) {
    console.warn('[CRM Automation] Ignored: Lead or Lead ID is missing.');
    return [];
  }

  const normalizedStage = normalizeStageName(targetStage || lead.status);
  const normalizedPrevStage = options.previousStage ? normalizeStageName(options.previousStage) : null;

  try {
    convertLeadToDealIfNeeded(lead, { targetStage: targetStage || lead.status, stages: loadLeadStageTasksConfig() });
  } catch (error) {
    console.error('[CRM Conversion] Lead conversion failed:', lead.id, error);
    useAppStore.getState().showToast(`Lead could not be converted to a Deal: ${error.message}`);
  }

  // If stage didn't change and previousStage was passed, ignore
  if (normalizedPrevStage && normalizedStage === normalizedPrevStage) {
    return [];
  }

  try {
    const allStages = loadLeadStageTasksConfig();
    const allMasterTasks = loadMasterTasksConfig();

    // Locate the stage configuration
    const matchedStageConfig = allStages.find((s) => normalizeStageName(s.name) === normalizedStage || s.id === normalizedStage.toLowerCase());
    if (!matchedStageConfig || !Array.isArray(matchedStageConfig.tasks) || matchedStageConfig.tasks.length === 0) {
      // Stage has no configured tasks
      return [];
    }

    // Filter for active, autoCreate tasks, sorted by order
    const eligibleTasks = matchedStageConfig.tasks
      .filter((t) => t && t.autoCreate === true)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    if (eligibleTasks.length === 0) {
      return [];
    }

    // Load existing tasks to guarantee idempotency and prevent duplicates
    const currentCrmTasks = loadCrmTasks();
    const leadDetailMap = readJson(LEAD_DETAIL_STORAGE_KEY, {});
    const leadDetail = leadDetailMap[String(lead.id)] || {};
    const leadDetailTasks = Array.isArray(leadDetail.tasks) ? leadDetail.tasks : [];

    const createdTasks = [];
    const leadDisplayName = `${lead.name || 'Untitled Lead'}${lead.company ? ` (${lead.company})` : ''}`;

    eligibleTasks.forEach((stageTask, index) => {
      const taskName = String(stageTask.name || '').trim();
      if (!taskName) return;

      // Find matching master task if any
      const masterTask = allMasterTasks.find(
        (m) => String(m.name).trim().toLowerCase() === taskName.toLowerCase()
      );

      // Check if task is inactive
      if (masterTask && masterTask.status === 'Inactive') {
        return;
      }

      // Check duplicate in currentCrmTasks
      const duplicateInCrmTasks = currentCrmTasks.some((existing) => {
        if (existing.status === 'Completed') return false;
        const matchesLead = String(existing.leadId) === String(lead.id) || existing.lead === leadDisplayName;
        const matchesTitle = String(existing.title || '').trim().toLowerCase() === taskName.toLowerCase();
        const matchesStage = normalizeStageName(existing.stage || '') === normalizedStage;
        return matchesLead && matchesTitle && matchesStage;
      });

      // Check duplicate in leadDetailTasks
      const duplicateInDetailTasks = leadDetailTasks.some((existing) => {
        if (existing.status === 'Completed') return false;
        const matchesTitle = String(existing.title || '').trim().toLowerCase() === taskName.toLowerCase();
        const matchesStage = normalizeStageName(existing.stage || '') === normalizedStage;
        return matchesTitle && matchesStage;
      });

      if (duplicateInCrmTasks || duplicateInDetailTasks) {
        // Idempotent guard: already created for this lead in this stage and still open
        return;
      }

      // Resolve employee assignment
      const configuredRole = stageTask.role || masterTask?.role || 'Tele Caller Executive';
      const configuredDept = stageTask.department || masterTask?.department || 'Any';
      const assignedEmployee = findEligibleEmployee(configuredRole, configuredDept);

      // Due date & priority
      const { isoDate, dueAt } = calculateDueDate(stageTask, masterTask);
      const priority = resolveTaskPriority(stageTask, masterTask);

      const taskId = `TSK-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`;
      const leadTaskId = `lt-auto-${Date.now()}-${index}`;

      const ownerName = assignedEmployee ? assignedEmployee.name : 'Unassigned';
      const warningMessage = assignedEmployee
        ? null
        : `No eligible employee found for role "${configuredRole}". Task is created as Unassigned.`;

      // 1. Task record for CRM Task List (/crm/tasks) & Dashboard
      const crmTaskRecord = {
        id: taskId,
        title: taskName,
        lead: leadDisplayName,
        leadId: lead.id,
        owner: ownerName,
        dueDate: isoDate,
        dueAt,
        priority,
        status: 'Open',
        stage: normalizedStage,
        department: stageTask.department || (assignedEmployee?.department || 'Sales'),
        source: TASK_SOURCE_AUTOMATION,
        warning: warningMessage,
        required: Boolean(stageTask.required),
        order: stageTask.order ?? index,
        createdAt: new Date().toISOString(),
      };

      // 2. Task record for Lead Detail View (/crm/leads/:id -> Tasks Tab)
      const leadDetailTaskRecord = {
        id: leadTaskId,
        title: taskName,
        stage: normalizedStage,
        status: 'Due',
        priority,
        dueAt,
        dueDate: isoDate,
        process: 'Not Started',
        attempt: 1,
        assignee: ownerName,
        description: stageTask.description || masterTask?.description || `${taskName} for ${leadDisplayName}`,
        source: TASK_SOURCE_AUTOMATION,
        warning: warningMessage,
        defaultTask: masterTask?.id || 'custom',
        crmTaskId: taskId,
      };

      createdTasks.push({ crmTaskRecord, leadDetailTaskRecord });
    });

    if (createdTasks.length === 0) {
      return [];
    }

    // Persist to CRM tasks store
    const nextCrmTasks = [
      ...createdTasks.map((t) => t.crmTaskRecord),
      ...currentCrmTasks,
    ];
    saveCrmTasks(nextCrmTasks);

    // Persist to Lead Detail store
    const nextDetailTasks = [
      ...createdTasks.map((t) => t.leadDetailTaskRecord),
      ...leadDetailTasks,
    ];

    // Activity log entry
    const existingActivities = Array.isArray(leadDetail.activities) ? leadDetail.activities : [];
    const newActivities = createdTasks.map((t) => ({
      id: `act-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `Automatic task created: "${t.crmTaskRecord.title}" (${t.crmTaskRecord.owner})`,
      time: 'Just now',
      color: '#1d6bff',
    }));

    leadDetailMap[String(lead.id)] = {
      ...leadDetail,
      tasks: nextDetailTasks,
      activities: [...newActivities, ...existingActivities],
    };
    writeJson(LEAD_DETAIL_STORAGE_KEY, leadDetailMap);

    // Update open tasks count on lead if possible
    const currentLeads = readJson(LEADS_STORAGE_KEY, []);
    if (Array.isArray(currentLeads)) {
      const openCount = nextDetailTasks.filter((t) => t.status !== 'Completed').length;
      const updatedLeads = currentLeads.map((l) =>
        String(l.id) === String(lead.id) ? { ...l, openTasksCount: openCount } : l
      );
      writeJson(LEADS_STORAGE_KEY, updatedLeads);
    }

    // Dispatch system-wide CRM event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(CRM_EVENT));
    }

    return createdTasks.map((t) => t.crmTaskRecord);
  } catch (error) {
    // Error handling: Safe failure, does not crash lead creation or stage change
    console.error('[CRM Automation] Error generating stage tasks:', error);
    return [];
  }
}
