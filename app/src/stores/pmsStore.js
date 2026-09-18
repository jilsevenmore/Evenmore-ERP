/**
 * PMS Module — Centralized State (Stage 1)
 *
 * Single source of truth for the Project Management System: projects, their
 * runtime stage instances, tasks, design documents, approvals and the audit
 * trail. Zustand + localStorage, matching the convention used by the other
 * HRMS/ERP stores in this folder.
 *
 * The recalculation helpers at the top are exported as pure functions so
 * presentation layers (later stages) can derive timings without pulling the
 * whole store in.
 */

import { create } from "zustand";
import {
  projectsMock,
  stageConfigsMock,
  pmsEmployeesMock,
  pmsSettingsMock,
} from "../data/mockPmsData";

const LS = "pms_store_v1";

// ─── Time Primitives ─────────────────────────────────────────────────

export const MS_PER_HOUR = 60 * 60 * 1000;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Parse anything date-ish into a valid Date, or null. */
export function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Convert a planned duration + unit into milliseconds. */
export function durationToMs(duration, unit = "Days") {
  const n = Number(duration);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return unit === "Hours" ? n * MS_PER_HOUR : n * MS_PER_DAY;
}

// ─── Core Formulas ───────────────────────────────────────────────────
//
//   Expected Completion = Start + Planned Duration
//   Remaining Time      = max(0, Expected Completion − Now)
//   Delay Duration      = max(0, (Actual ?? Now) − Expected Completion)
//   Stage Completion %  = mean(task %) when tasks exist, else the stage's own %
//   Project Completion% = mean(stage completion %)

/** Start + planned duration → ISO string (null when the stage has not started). */
export function computeExpectedCompletion(startDateTime, plannedDuration, durationUnit) {
  const start = toDate(startDateTime);
  if (!start) return null;
  const ms = durationToMs(plannedDuration, durationUnit);
  return new Date(start.getTime() + ms).toISOString();
}

/** Milliseconds left before the expected completion; never negative. */
export function computeRemainingMs(expectedCompletionDateTime, now = Date.now()) {
  const expected = toDate(expectedCompletionDateTime);
  if (!expected) return 0;
  return Math.max(0, expected.getTime() - now);
}

/** Milliseconds overdue, measured against the actual completion or now. */
export function computeDelayMs(
  expectedCompletionDateTime,
  actualCompletionDateTime = null,
  now = Date.now()
) {
  const expected = toDate(expectedCompletionDateTime);
  if (!expected) return 0;
  const actual = toDate(actualCompletionDateTime);
  const reference = actual ? actual.getTime() : now;
  return Math.max(0, reference - expected.getTime());
}

/** Share of the planned window already consumed, 0–100+ (can exceed 100). */
export function computeElapsedPct(stage, now = Date.now()) {
  const start = toDate(stage?.startDateTime);
  const total = durationToMs(stage?.plannedDuration, stage?.durationUnit);
  if (!start || total <= 0) return 0;
  return ((now - start.getTime()) / total) * 100;
}

/** Stage completion: mean of its task percentages, else its own value. */
export function computeStageCompletionPct(stage) {
  const tasks = stage?.tasks ?? [];
  if (tasks.length === 0) return clampPct(stage?.completionPct ?? 0);
  const sum = tasks.reduce((acc, t) => acc + clampPct(t.completionPct ?? 0), 0);
  return clampPct(sum / tasks.length);
}

/** Project completion: mean of all stage completion percentages. */
export function computeProjectCompletionPct(stages = []) {
  if (stages.length === 0) return 0;
  const sum = stages.reduce((acc, s) => acc + computeStageCompletionPct(s), 0);
  return clampPct(sum / stages.length);
}

/** Project start + the sum of every stage's planned duration. */
export function computeProjectExpectedCompletion(startDate, stages = []) {
  const start = toDate(startDate);
  if (!start || stages.length === 0) return null;
  const totalMs = stages.reduce(
    (acc, s) => acc + durationToMs(s.plannedDuration, s.durationUnit),
    0
  );
  if (totalMs <= 0) return null;
  return new Date(start.getTime() + totalMs).toISOString();
}

function clampPct(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

/** Humanize a millisecond span as "3d 4h" / "5h 30m" / "—". */
export function formatDuration(ms) {
  const v = Number(ms);
  if (!Number.isFinite(v) || v <= 0) return "—";
  const days = Math.floor(v / MS_PER_DAY);
  const hours = Math.floor((v % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((v % MS_PER_HOUR) / (60 * 1000));
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

// ─── Derived Status ──────────────────────────────────────────────────

// Statuses the delay engine may overwrite. Anything else (Submitted, Under
// Review, Approved, Completed, Blocked, …) was set deliberately by a human and
// is left untouched.
const AUTO_STATUSES = new Set(["Assigned", "In Progress", "At Risk", "Delayed"]);

/**
 * Re-derive a stage's status from the clock. Returns the existing status
 * unchanged unless the stage is in an auto-managed state.
 */
export function deriveStageStatus(stage, now = Date.now(), atRiskThresholdPct = 80) {
  const current = stage?.status;
  if (!AUTO_STATUSES.has(current)) return current;
  if (stage?.delayDetails?.isDelayed) return "Delayed";

  const expected = toDate(stage?.expectedCompletionDateTime);
  if (!expected) return current;

  if (now > expected.getTime()) return "Delayed";
  if (computeElapsedPct(stage, now) >= atRiskThresholdPct) return "At Risk";
  return current === "At Risk" || current === "Delayed" ? "In Progress" : current;
}

/** Roll stage-level signals up into the project status. */
export function deriveProjectStatus(project, now = Date.now(), atRiskThresholdPct = 80) {
  // On Hold is a deliberate pause and only a human clears it.
  if (project?.status === "On Hold") return project.status;

  // An explicit sign-off stamps actualCompletionDate and is terminal — a later
  // stage edit must not quietly reopen a closed project.
  if (project?.actualCompletionDate) return "Completed";

  const stages = project?.stages ?? [];
  if (stages.length === 0) return project?.status ?? "Draft";

  const statuses = stages.map((s) => deriveStageStatus(s, now, atRiskThresholdPct));

  // Draft is derived, not sticky: a project stays Draft only while no stage has
  // been picked up. Assigning the first stage moves it on by itself.
  if (statuses.every((s) => s === "Not Started")) return "Draft";
  if (statuses.every((s) => s === "Completed")) return "Completed";
  if (statuses.includes("Delayed")) return "Delayed";
  if (statuses.includes("At Risk")) return "At Risk";
  return "In Progress";
}

// ─── Recalculation ───────────────────────────────────────────────────

/** Recompute one stage's derived fields (dates, %, status). */
export function recalcStage(stage, now = Date.now(), atRiskThresholdPct = 80) {
  const completionPct = computeStageCompletionPct(stage);
  const expectedCompletionDateTime =
    computeExpectedCompletion(
      stage.startDateTime,
      stage.plannedDuration,
      stage.durationUnit
    ) ?? stage.expectedCompletionDateTime ?? null;

  const next = { ...stage, completionPct, expectedCompletionDateTime };
  next.status = deriveStageStatus(next, now, atRiskThresholdPct);
  return next;
}

/** Recompute a whole project: every stage, then the project rollups. */
export function recalcProject(project, now = Date.now(), atRiskThresholdPct = 80) {
  const stages = (project.stages ?? []).map((s) =>
    recalcStage(s, now, atRiskThresholdPct)
  );
  const next = {
    ...project,
    stages,
    overallCompletionPct: computeProjectCompletionPct(stages),
    expectedCompletionDate:
      computeProjectExpectedCompletion(project.startDate, stages) ??
      project.expectedCompletionDate ??
      null,
  };
  next.status = deriveProjectStatus(next, now, atRiskThresholdPct);
  return next;
}

/**
 * Sidebar nav counters, derived purely so components can memoize on the raw
 * slices rather than on a fresh object handed back by a store selector.
 */
export function computeNavBadges(projects = [], currentUserId = null) {
  let pmsActiveCount = 0;
  let pmsDelayedCount = 0;
  let pmsMyTasksPending = 0;

  for (const p of projects) {
    if (p.status === "Delayed") pmsDelayedCount += 1;
    if (p.status !== "Completed" && p.status !== "Draft") pmsActiveCount += 1;

    for (const stage of p.stages ?? []) {
      for (const task of stage.tasks ?? []) {
        if (task.assignedUser?.id === currentUserId && task.status !== "Completed") {
          pmsMyTasksPending += 1;
        }
      }
    }
  }

  return { pmsActiveCount, pmsDelayedCount, pmsMyTasksPending };
}

// ─── Stage 4 Dashboard Derivations ───────────────────────────
//
// These follow the dashboard spec's own definitions, which are deliberately
// stricter than the store's general-purpose getKpis(): "active" excludes On
// Hold, "delayed" also counts projects whose stages have run past due, and
// "at risk" is measured per stage at a 70%/50% cut rather than via
// settings.atRiskThresholdPct.

export const DASHBOARD_AT_RISK_ELAPSED_PCT = 70;
export const DASHBOARD_AT_RISK_COMPLETION_PCT = 50;

const ACTIVE_STATUSES = new Set(["In Progress", "At Risk", "Delayed"]);

/** A stage still open and already past its expected completion. */
export function isStageOverdue(stage, now = Date.now()) {
  if (!stage || stage.status === "Completed") return false;
  const expected = toDate(stage.expectedCompletionDateTime);
  return Boolean(expected) && now > expected.getTime();
}

/** A started, unfinished stage burning its window faster than its progress. */
export function isStageAtRisk(stage, now = Date.now()) {
  if (!stage || stage.status === "Completed" || !stage.startDateTime) return false;
  return (
    computeElapsedPct(stage, now) > DASHBOARD_AT_RISK_ELAPSED_PCT &&
    computeStageCompletionPct(stage) < DASHBOARD_AT_RISK_COMPLETION_PCT
  );
}

/** Days from now until `iso`, or null. Negative means already past. */
function daysUntil(iso, now = Date.now()) {
  const d = toDate(iso);
  if (!d) return null;
  return (d.getTime() - now) / MS_PER_DAY;
}

/** The seven headline dashboard metrics. */
export function computeDashboardMetrics(projects = [], now = Date.now()) {
  let activeProjects = 0;
  let completedProjects = 0;
  let delayedProjects = 0;
  let atRiskStages = 0;
  let dueTodayCount = 0;
  let dueThisWeekCount = 0;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = startOfToday.getTime() + MS_PER_DAY;

  for (const p of projects) {
    if (ACTIVE_STATUSES.has(p.status)) activeProjects += 1;
    if (p.status === "Completed") completedProjects += 1;

    const stages = p.stages ?? [];
    if (p.status === "Delayed" || stages.some((s) => isStageOverdue(s, now))) {
      delayedProjects += 1;
    }
    for (const stage of stages) {
      if (isStageAtRisk(stage, now)) atRiskStages += 1;
    }

    // Deadline counters only make sense for work still in flight.
    if (p.status !== "Completed" && p.expectedCompletionDate) {
      const due = toDate(p.expectedCompletionDate)?.getTime();
      if (due != null) {
        if (due >= startOfToday.getTime() && due < endOfToday) dueTodayCount += 1;
        if (due >= now && due <= now + 7 * MS_PER_DAY) dueThisWeekCount += 1;
      }
    }
  }

  return {
    totalProjects: projects.length,
    activeProjects,
    completedProjects,
    delayedProjects,
    atRiskStages,
    dueTodayCount,
    dueThisWeekCount,
  };
}

/** Project counts bucketed by the department currently holding the work. */
export function computePipelineByDepartment(projects = []) {
  const buckets = new Map();
  for (const p of projects) {
    if (p.status === "Completed" || p.status === "Draft") continue;
    const current = p.stages?.find((s) => s.id === p.currentStageId);
    const dept = current?.department ?? p.currentDepartment ?? "Unassigned";
    const entry = buckets.get(dept) ?? { department: dept, count: 0, projects: [] };
    entry.count += 1;
    entry.projects.push(p.id);
    buckets.set(dept, entry);
  }
  const rows = [...buckets.values()].sort((a, b) => b.count - a.count);
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  return rows.map((r) => ({ ...r, sharePct: max > 0 ? Math.round((r.count / max) * 100) : 0 }));
}

/** Open task load per department against its configured capacity. */
export function computeDepartmentWorkload(projects = [], capacityPerDept = {}, defaultCapacity = 20) {
  const buckets = new Map();

  for (const p of projects) {
    for (const stage of p.stages ?? []) {
      for (const task of stage.tasks ?? []) {
        if (task.status === "Completed") continue;
        const dept = task.department ?? stage.department ?? "Unassigned";
        const entry = buckets.get(dept) ?? { department: dept, openTasks: 0, blockedTasks: 0 };
        entry.openTasks += 1;
        if (task.status === "Blocked") entry.blockedTasks += 1;
        buckets.set(dept, entry);
      }
    }
  }

  return [...buckets.values()]
    .map((entry) => {
      const capacity = capacityPerDept[entry.department] ?? defaultCapacity;
      const utilisationPct = capacity > 0 ? Math.round((entry.openTasks / capacity) * 100) : 0;
      return {
        ...entry,
        capacity,
        utilisationPct,
        load: utilisationPct >= 90 ? "High" : utilisationPct >= 65 ? "Medium" : "Low",
      };
    })
    .sort((a, b) => b.utilisationPct - a.utilisationPct);
}

/** Every stage that is overdue or explicitly delayed, with project context. */
export function computeDelayWatchlist(projects = [], now = Date.now()) {
  const rows = [];
  for (const p of projects) {
    for (const stage of p.stages ?? []) {
      const flagged = stage.delayDetails?.isDelayed || stage.status === "Delayed";
      const overdue = isStageOverdue(stage, now);
      if (!flagged && !overdue) continue;

      const timing = getStageTiming(stage, now);
      rows.push({
        id: `${p.id}:${stage.id}`,
        projectId: p.id,
        customerName: p.customerName,
        productName: p.productDetails?.productName ?? "",
        priority: p.priority,
        stageName: stage.name,
        department: stage.department,
        status: stage.status,
        owner: stage.assignedUser?.name ?? stage.assignedTeam ?? "Unassigned",
        reason: stage.delayDetails?.reason ?? "",
        expectedRecoveryDate: stage.delayDetails?.expectedRecoveryDate ?? null,
        delayMs: timing.delayMs,
        delayLabel: timing.delayLabel,
        timing,
      });
    }
  }
  return rows.sort((a, b) => b.delayMs - a.delayMs);
}

/** In-flight projects due within `days`, soonest first. */
export function computeUpcomingDeadlines(projects = [], days = 7, now = Date.now()) {
  return projects
    .filter((p) => p.status !== "Completed" && p.status !== "Draft" && p.expectedCompletionDate)
    .map((p) => {
      const remaining = daysUntil(p.expectedCompletionDate, now);
      return {
        id: p.id,
        customerName: p.customerName,
        productName: p.productDetails?.productName ?? "",
        priority: p.priority,
        status: p.status,
        completionPct: p.overallCompletionPct ?? 0,
        expectedCompletionDate: p.expectedCompletionDate,
        daysRemaining: remaining,
        isOverdue: remaining != null && remaining < 0,
      };
    })
    .filter((row) => row.daysRemaining != null && row.daysRemaining <= days)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

// ─── Stage 9 Design Proofing ─────────────────────────────────

export const PROOF_DECISIONS = ["Approved", "Need Improvement"];

/**
 * Validate a client/PM decision on a proof.
 *
 * A "Need Improvement" verdict without a reason is useless to the designer who
 * has to act on it, so the reason is mandatory and enforced here rather than
 * only in the dialog.
 */
export function validateApprovalDecision(decision, { revisionReason = "", approverName = "" } = {}) {
  const errors = {};
  if (!PROOF_DECISIONS.includes(decision)) {
    errors.decision = "Choose Approve or Need Improvement.";
  }
  if (!approverName.trim()) {
    errors.approverName = "Signer name is required.";
  }
  if (decision === "Need Improvement" && !revisionReason.trim()) {
    errors.revisionReason = "A revision reason is required so the designer knows what to change.";
  }
  return errors;
}

/** The newest proof on a stage, or null. */
export function getLatestDocument(stage) {
  const docs = stage?.documents ?? [];
  if (docs.length === 0) return null;
  return docs.reduce((latest, d) => ((d.version ?? 0) > (latest.version ?? 0) ? d : latest), docs[0]);
}

/**
 * Where a stage sits in the proofing chain:
 * upload → PM review → sent to client → client decision.
 */
export function getProofWorkflowState(stage) {
  const latest = getLatestDocument(stage);
  const approvals = stage?.approvals ?? [];
  const pending = approvals.find(
    (a) => a.status === "Pending" && (!latest || a.documentId === latest.id)
  );
  const decided = latest
    ? approvals.filter((a) => a.documentId === latest.id && a.status !== "Pending")
    : [];

  let step = "awaiting-upload";
  if (latest) {
    if (latest.approvalStatus === "Approved") step = "approved";
    else if (latest.approvalStatus === "Need Improvement") step = "needs-revision";
    else if (pending) step = "with-client";
    else step = "pm-review";
  }

  return {
    latest,
    versionCount: (stage?.documents ?? []).length,
    pendingApproval: pending ?? null,
    decisions: decided,
    step,
    canUpload: true,
    canSendToClient: Boolean(latest) && step === "pm-review",
    canDecide: Boolean(latest) && step === "with-client",
    isApproved: step === "approved",
    needsRevision: step === "needs-revision",
  };
}

// ─── Stage 8 Handoff Gates ───────────────────────────────────

/**
 * Pre-conditions a stage must satisfy before it can be handed off.
 *
 * Returns one entry per unmet gate, each with the reason and whether it is
 * hard (config-mandated) or advisory, so the dialog can explain precisely why
 * the confirm button is disabled instead of just greying it out.
 */
export function validateStageHandoff(stage, config, now = Date.now()) {
  const blockers = [];
  if (!stage) return [{ code: "NO_STAGE", label: "Stage not found.", hard: true }];

  if (stage.status === "Completed") {
    blockers.push({ code: "ALREADY_DONE", label: "This stage is already completed.", hard: true });
  }

  if (stage.status === "Not Started" || !stage.startDateTime) {
    blockers.push({ code: "NOT_STARTED", label: "Stage has not been started yet.", hard: true });
  }

  const completion = computeStageCompletionPct(stage);
  if (completion < 100) {
    blockers.push({
      code: "INCOMPLETE",
      label: `Stage is at ${completion}% — finish the work before handing off.`,
      hard: false,
    });
  }

  const blockedTasks = (stage.tasks ?? []).filter((t) => t.status === "Blocked");
  if (blockedTasks.length > 0) {
    blockers.push({
      code: "BLOCKED_TASKS",
      label: `${blockedTasks.length} task${blockedTasks.length === 1 ? " is" : "s are"} still blocked.`,
      hard: true,
    });
  }

  if (stage.delayDetails?.isDelayed) {
    blockers.push({
      code: "OPEN_DELAY",
      label: "An open delay is logged against this stage — resolve it first.",
      hard: true,
    });
  }

  if (config?.requiredDocument && (stage.documents ?? []).length === 0) {
    blockers.push({
      code: "NEEDS_DOCUMENT",
      label: "This stage requires a document upload before handoff.",
      hard: true,
    });
  }

  if (config?.requiredApproval) {
    const approved = (stage.approvals ?? []).some((a) => a.status === "Approved");
    if (!approved) {
      blockers.push({
        code: "NEEDS_APPROVAL",
        label: "This stage requires an approved sign-off before handoff.",
        hard: true,
      });
    }
  }

  void now;
  return blockers;
}

/** A completed stage's headline numbers, for the handoff summary panel. */
export function summariseStageForHandoff(stage, now = Date.now()) {
  const timing = getStageTiming(stage, now);
  const start = toDate(stage?.startDateTime);
  const takenMs = start ? Math.max(0, now - start.getTime()) : 0;
  const plannedMs = durationToMs(stage?.plannedDuration, stage?.durationUnit);

  return {
    plannedLabel: `${stage?.plannedDuration ?? 0} ${stage?.durationUnit ?? "Days"}`,
    takenLabel: formatDuration(takenMs),
    delayLabel: timing.delayMs > 0 ? timing.delayLabel : "On time",
    isOverdue: timing.delayMs > 0,
    overrunPct: plannedMs > 0 ? Math.round((takenMs / plannedMs) * 100) : 0,
    completionPct: computeStageCompletionPct(stage),
    taskCount: (stage?.tasks ?? []).length,
    doneTaskCount: (stage?.tasks ?? []).filter((t) => t.status === "Completed").length,
  };
}

// ─── Stage 6 Configurator Derivations ────────────────────────

/**
 * How many live projects and stage instances were spun up from a template.
 *
 * Instances copy the template's name, department and duration at creation, so
 * removing a template never rewrites history — but an administrator should
 * still see what a template is currently driving before deleting it.
 */
export function computeStageConfigUsage(projects = [], configId) {
  let projectCount = 0;
  let stageCount = 0;
  let activeStageCount = 0;

  for (const p of projects) {
    let usedHere = 0;
    for (const stage of p.stages ?? []) {
      if (stage.stageConfigId !== configId) continue;
      usedHere += 1;
      if (stage.status !== "Completed" && stage.status !== "Not Started") {
        activeStageCount += 1;
      }
    }
    if (usedHere > 0) {
      projectCount += 1;
      stageCount += usedHere;
    }
  }

  return { projectCount, stageCount, activeStageCount };
}

/** Validate a stage template before it reaches the store. */
export function validateStageConfig(draft = {}, existing = [], editingId = null) {
  const errors = {};
  const name = (draft.name ?? "").trim();

  if (!name) {
    errors.name = "Stage name is required.";
  } else if (
    existing.some(
      (c) => c.id !== editingId && (c.name ?? "").trim().toLowerCase() === name.toLowerCase()
    )
  ) {
    errors.name = "Another stage already uses this name.";
  }

  if (!draft.department) errors.department = "Choose a responsible department.";

  const duration = Number(draft.defaultDuration);
  if (!Number.isFinite(duration) || duration <= 0) {
    errors.defaultDuration = "Duration must be greater than zero.";
  } else if (!Number.isInteger(duration)) {
    errors.defaultDuration = "Duration must be a whole number.";
  }

  if (!["Hours", "Days"].includes(draft.durationUnit)) {
    errors.durationUnit = "Unit must be Hours or Days.";
  }

  return errors;
}

// ─── Stage 5 Directory Derivations ───────────────────────────

/** Next sequential project code for a year, e.g. "PRJ-2026-006". */
export function nextProjectId(projects = [], year = new Date().getFullYear()) {
  const prefix = `PRJ-${year}-`;
  const highest = projects.reduce((max, p) => {
    if (typeof p?.id !== "string" || !p.id.startsWith(prefix)) return max;
    const n = Number.parseInt(p.id.slice(prefix.length), 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

/**
 * Per-row display data for the project directory: which stage is live, where
 * it sits in the sequence, and how the schedule is tracking.
 */
export function getProjectRowMeta(project, now = Date.now()) {
  const stages = project?.stages ?? [];
  const ordered = [...stages].sort((a, b) => a.sequence - b.sequence);
  const current =
    ordered.find((s) => s.id === project?.currentStageId) ??
    ordered.find((s) => s.status !== "Completed") ??
    null;

  const index = current ? ordered.findIndex((s) => s.id === current.id) + 1 : 0;
  const timing = current ? getStageTiming(current, now) : null;

  // Project-level delay measures the promised end date, not the live stage.
  const projectDelayMs = computeDelayMs(
    project?.expectedCompletionDate,
    project?.actualCompletionDate,
    now
  );
  const remainingMs = computeRemainingMs(project?.expectedCompletionDate, now);

  return {
    currentStage: current,
    sequenceLabel: current ? `Stage ${index}/${ordered.length}: ${current.name}` : "No stages",
    stageIndex: index,
    stageCount: ordered.length,
    department: current?.department ?? project?.currentDepartment ?? "—",
    timing,
    projectDelayMs,
    projectDelayLabel: formatDuration(projectDelayMs),
    isOverdue: projectDelayMs > 0 && project?.status !== "Completed",
    remainingMs,
    remainingLabel: remainingMs > 0 ? `In ${formatDuration(remainingMs)}` : "Overdue",
  };
}

const EMPTY_FILTERS = {
  search: "",
  customer: "all",
  projectManagerId: "all",
  department: "all",
  stageName: "all",
  statuses: [],
  delayedOnly: false,
  dateField: "startDate",
  dateFrom: "",
  dateTo: "",
};

/** The blank filter set, for a page's initial state and its Reset action. */
export function emptyProjectFilters() {
  return { ...EMPTY_FILTERS, statuses: [] };
}

/** True when anything is actually narrowing the list. */
export function hasActiveFilters(filters = {}) {
  const f = { ...EMPTY_FILTERS, ...filters };
  return Boolean(
    f.search.trim() ||
      f.customer !== "all" ||
      f.projectManagerId !== "all" ||
      f.department !== "all" ||
      f.stageName !== "all" ||
      (f.statuses?.length ?? 0) > 0 ||
      f.delayedOnly ||
      f.dateFrom ||
      f.dateTo
  );
}

/** Apply the directory's multi-facet filter bar to a project list. */
export function filterProjects(projects = [], filters = {}, now = Date.now()) {
  const f = { ...EMPTY_FILTERS, ...filters };
  const q = f.search.trim().toLowerCase();

  return projects.filter((p) => {
    // Global search spans project code, customer, order id and product name.
    if (q) {
      const haystack = [
        p.id,
        p.customerName,
        p.crmOrderId,
        p.productDetails?.productName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (f.customer !== "all" && p.customerName !== f.customer) return false;
    if (f.projectManagerId !== "all" && p.projectManager?.id !== f.projectManagerId) {
      return false;
    }
    if (f.statuses?.length > 0 && !f.statuses.includes(p.status)) return false;

    const meta = getProjectRowMeta(p, now);
    if (f.department !== "all" && meta.department !== f.department) return false;
    if (f.stageName !== "all" && meta.currentStage?.name !== f.stageName) return false;

    if (f.delayedOnly) {
      const overdueStage = (p.stages ?? []).some((s) => isStageOverdue(s, now));
      if (p.status !== "Delayed" && !meta.isOverdue && !overdueStage) return false;
    }

    if (f.dateFrom || f.dateTo) {
      const value = toDate(p[f.dateField]);
      if (!value) return false;
      if (f.dateFrom && value.getTime() < new Date(f.dateFrom).setHours(0, 0, 0, 0)) {
        return false;
      }
      if (f.dateTo && value.getTime() > new Date(f.dateTo).setHours(23, 59, 59, 999)) {
        return false;
      }
    }

    return true;
  });
}

/** Distinct dropdown options derived from the projects themselves. */
export function getProjectFilterOptions(projects = []) {
  const customers = new Set();
  const departments = new Set();
  const stageNames = new Set();
  const managers = new Map();

  for (const p of projects) {
    if (p.customerName) customers.add(p.customerName);
    if (p.projectManager?.id) managers.set(p.projectManager.id, p.projectManager);
    for (const stage of p.stages ?? []) {
      if (stage.department) departments.add(stage.department);
      if (stage.name) stageNames.add(stage.name);
    }
  }

  const sorted = (set) => [...set].sort((a, b) => a.localeCompare(b));
  return {
    customers: sorted(customers),
    departments: sorted(departments),
    stageNames: sorted(stageNames),
    managers: [...managers.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** Per-stage timing summary for timeline / card rendering. */
export function getStageTiming(stage, now = Date.now()) {
  const expected = stage?.expectedCompletionDateTime ?? null;
  const remainingMs = computeRemainingMs(expected, now);
  const delayMs = computeDelayMs(expected, stage?.actualCompletionDateTime, now);
  return {
    expectedCompletionDateTime: expected,
    remainingMs,
    remainingLabel: formatDuration(remainingMs),
    delayMs,
    delayLabel: formatDuration(delayMs),
    isOverdue: delayMs > 0,
    elapsedPct: Math.round(computeElapsedPct(stage, now)),
  };
}

// ─── Persistence ─────────────────────────────────────────────────────

function load() {
  try {
    const v = localStorage.getItem(LS);
    if (v) return JSON.parse(v);
  } catch {
    /* corrupt or unavailable storage — fall back to seed data */
  }
  return null;
}

function persist(state) {
  try {
    localStorage.setItem(
      LS,
      JSON.stringify({
        projects: state.projects,
        stageConfigs: state.stageConfigs,
        employees: state.employees,
        settings: state.settings,
        currentUserId: state.currentUserId,
      })
    );
  } catch {
    /* quota or private mode — state stays in memory only */
  }
}

// Demo persona backing the "My Projects" / "My Tasks" workspaces until real
// auth is wired in. Swap via setCurrentUserId.
const DEFAULT_CURRENT_USER_ID = "EMP-PM-01";

const s = load();

// ─── ID & Log Helpers ────────────────────────────────────────────────

const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function makeActivity(action, entityType, entityId, description, actor) {
  return {
    id: uid("ACT"),
    timestamp: new Date().toISOString(),
    actor: actor ?? { id: "SYSTEM", name: "System" },
    action,
    entityType,
    entityId,
    description,
  };
}

/**
 * Apply `mutator` to one project, recalculate it, optionally append an audit
 * entry, then persist. Every mutating action funnels through here so derived
 * fields can never drift from the raw data.
 */
function applyToProject(state, projectId, mutator, activity) {
  const threshold = state.settings.atRiskThresholdPct;
  const now = Date.now();
  const projects = state.projects.map((p) => {
    if (p.id !== projectId) return p;
    const mutated = mutator(p);
    const withLog = activity
      ? { ...mutated, activityLog: [...(mutated.activityLog ?? []), activity] }
      : mutated;
    return recalcProject(withLog, now, threshold);
  });
  persist({ ...state, projects });
  return { projects };
}

// ─── Store ───────────────────────────────────────────────────────────

const seededProjects = (s?.projects ?? projectsMock).map((p) =>
  recalcProject(p, Date.now(), (s?.settings ?? pmsSettingsMock).atRiskThresholdPct)
);

export const usePmsStore = create((set, get) => ({
  // ── State ──
  projects: seededProjects,
  stageConfigs: s?.stageConfigs ?? stageConfigsMock,
  employees: s?.employees ?? pmsEmployeesMock,
  settings: s?.settings ?? pmsSettingsMock,
  currentUserId: s?.currentUserId ?? DEFAULT_CURRENT_USER_ID,

  setCurrentUserId: (userId) =>
    set((st) => {
      persist({ ...st, currentUserId: userId });
      return { currentUserId: userId };
    }),

  // Transient UI state (not persisted)
  toast: null,
  showToast: (msg) => set({ toast: { msg, id: Date.now().toString() } }),
  clearToast: () => set({ toast: null }),

  // ── Global recalculation ──

  /** Re-derive every project against the current clock. */
  recalcAll: () =>
    set((st) => {
      const threshold = st.settings.atRiskThresholdPct;
      const now = Date.now();
      const projects = st.projects.map((p) => recalcProject(p, now, threshold));
      persist({ ...st, projects });
      return { projects };
    }),

  /** Discard local changes and reload the seed data. */
  resetPmsData: () =>
    set((st) => {
      const next = {
        projects: projectsMock.map((p) =>
          recalcProject(p, Date.now(), pmsSettingsMock.atRiskThresholdPct)
        ),
        stageConfigs: stageConfigsMock,
        employees: pmsEmployeesMock,
        settings: pmsSettingsMock,
      };
      persist({ ...st, ...next });
      return next;
    }),

  // ── Settings ──

  updateSettings: (patch) =>
    set((st) => {
      const settings = { ...st.settings, ...patch };
      const projects = st.projects.map((p) =>
        recalcProject(p, Date.now(), settings.atRiskThresholdPct)
      );
      persist({ ...st, settings, projects });
      return { settings, projects };
    }),

  // ── Stage configuration templates ──

  addStageConfig: (config) =>
    set((st) => {
      // Append after the highest existing sequence rather than counting rows,
      // so an add can never collide with an existing position.
      const highest = st.stageConfigs.reduce(
        (max, c) => Math.max(max, Number(c.sequence) || 0),
        0
      );
      const stageConfigs = [
        ...st.stageConfigs,
        {
          id: uid("stage-cfg"),
          description: "",
          assignedRole: "",
          durationUnit: "Days",
          requiredApproval: false,
          requiredDocument: false,
          isActive: true,
          ...config,
          sequence: highest + 1,
        },
      ];
      persist({ ...st, stageConfigs });
      return { stageConfigs };
    }),

  updateStageConfig: (id, patch) =>
    set((st) => {
      const stageConfigs = st.stageConfigs.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      );
      persist({ ...st, stageConfigs });
      return { stageConfigs };
    }),

  deleteStageConfig: (id) =>
    set((st) => {
      const stageConfigs = st.stageConfigs
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, sequence: i + 1 }));
      persist({ ...st, stageConfigs });
      return { stageConfigs };
    }),

  /** Flip a template between Active and Inactive. */
  toggleStageConfigActive: (id) =>
    set((st) => {
      const stageConfigs = st.stageConfigs.map((c) =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      );
      persist({ ...st, stageConfigs });
      return { stageConfigs };
    }),

  /** What a template is currently driving, for the delete confirmation. */
  getStageConfigUsage: (id) => computeStageConfigUsage(get().projects, id),

  /** Move a template up (-1) or down (+1) in the execution order. */
  reorderStageConfig: (id, direction) =>
    set((st) => {
      const ordered = [...st.stageConfigs].sort((a, b) => a.sequence - b.sequence);
      const idx = ordered.findIndex((c) => c.id === id);
      const target = idx + direction;
      if (idx === -1 || target < 0 || target >= ordered.length) return {};
      [ordered[idx], ordered[target]] = [ordered[target], ordered[idx]];
      const stageConfigs = ordered.map((c, i) => ({ ...c, sequence: i + 1 }));
      persist({ ...st, stageConfigs });
      return { stageConfigs };
    }),

  // ── Projects ──

  addProject: (project) =>
    set((st) => {
      const id = project.id ?? uid("PRJ");
      const created = recalcProject(
        {
          overallCompletionPct: 0,
          actualCompletionDate: null,
          status: "Draft",
          priority: "Medium",
          currentStageId: null,
          stages: [],
          activityLog: [],
          ...project,
          id,
        },
        Date.now(),
        st.settings.atRiskThresholdPct
      );
      created.activityLog = [
        ...created.activityLog,
        makeActivity(
          "PROJECT_CREATED",
          "Project",
          id,
          `Project created${project.crmOrderId ? ` from sales order ${project.crmOrderId}` : ""}.`,
          project.projectManager
        ),
      ];
      const projects = [created, ...st.projects];
      persist({ ...st, projects });
      return { projects };
    }),

  /**
   * Create a project from a CRM sales order — the Stage 5 creation workflow.
   *
   * Does the whole thing in one write: allocates the next sequential code,
   * copies the order's commercial detail, initialises every chosen active
   * stage template in "Not Started", and logs the Project Created audit entry.
   * Returns the new project id so the caller can navigate to it.
   */
  createProjectFromOrder: ({
    order,
    projectManager,
    priority = "Medium",
    startDate,
    stageConfigIds = null,
    specifications = "",
  }) => {
    if (!order) throw new Error("A CRM order is required to create a project.");
    if (!projectManager) throw new Error("A project manager is required.");

    const state = get();
    const id = nextProjectId(state.projects);
    const start = startDate || new Date().toISOString();

    const configs = state.stageConfigs
      .filter((c) => c.isActive && (!stageConfigIds || stageConfigIds.includes(c.id)))
      .sort((a, b) => a.sequence - b.sequence);

    const stages = configs.map((c, i) => ({
      id: uid("stg-inst"),
      stageConfigId: c.id,
      name: c.name,
      sequence: i + 1,
      department: c.department,
      assignedTeam: null,
      assignedUser: null,
      completionPct: 0,
      plannedDuration: c.defaultDuration,
      durationUnit: c.durationUnit,
      startDateTime: null,
      expectedCompletionDateTime: null,
      actualCompletionDateTime: null,
      status: "Not Started",
      tasks: [],
      documents: [],
      approvals: [],
    }));

    const project = recalcProject(
      {
        id,
        crmOrderId: order.orderNumber ?? order.id,
        crmCustomerId: order.customerId ?? null,
        customerName: order.customer ?? "",
        productDetails: {
          productName: order.items?.[0]?.description ?? order.customer ?? "Order items",
          orderValue: order.total ?? order.amount ?? 0,
          quantity: order.itemsCount ?? order.items?.length ?? 1,
          specifications,
        },
        projectManager,
        currentStageId: stages[0]?.id ?? null,
        currentDepartment: stages[0]?.department ?? "Design",
        priority,
        overallCompletionPct: 0,
        startDate: start,
        expectedCompletionDate: null,
        actualCompletionDate: null,
        status: "Draft",
        stages,
        activityLog: [
          makeActivity(
            "PROJECT_CREATED",
            "Project",
            id,
            `Project created from sales order ${order.orderNumber ?? order.id} for ${order.customer ?? "customer"}.`,
            projectManager
          ),
        ],
      },
      Date.now(),
      state.settings.atRiskThresholdPct
    );

    set((st) => {
      const projects = [project, ...st.projects];
      persist({ ...st, projects });
      return { projects };
    });

    return id;
  },

  updateProject: (projectId, patch) =>
    set((st) => applyToProject(st, projectId, (p) => ({ ...p, ...patch }))),

  deleteProject: (projectId) =>
    set((st) => {
      const projects = st.projects.filter((p) => p.id !== projectId);
      persist({ ...st, projects });
      return { projects };
    }),

  /** Build a project's runtime stages from the active templates. */
  applyStageTemplate: (projectId, configIds = null) =>
    set((st) => {
      const configs = st.stageConfigs
        .filter((c) => c.isActive && (!configIds || configIds.includes(c.id)))
        .sort((a, b) => a.sequence - b.sequence);

      return applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          stages: configs.map((c, i) => ({
            id: uid("stg-inst"),
            stageConfigId: c.id,
            name: c.name,
            sequence: i + 1,
            department: c.department,
            assignedTeam: null,
            assignedUser: null,
            completionPct: 0,
            plannedDuration: c.defaultDuration,
            durationUnit: c.durationUnit,
            startDateTime: null,
            expectedCompletionDateTime: null,
            actualCompletionDateTime: null,
            status: "Not Started",
            tasks: [],
            documents: [],
            approvals: [],
          })),
        }),
        makeActivity(
          "STAGES_CONFIGURED",
          "Project",
          projectId,
          `${configs.length} stages applied from the template library.`
        )
      );
    }),

  /** Mark a project complete and stamp the actual completion date. */
  completeProject: (projectId, actor) =>
    set((st) =>
      applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          status: "Completed",
          actualCompletionDate: new Date().toISOString(),
        }),
        makeActivity(
          "PROJECT_COMPLETED",
          "Project",
          projectId,
          "Project signed off and marked completed.",
          actor
        )
      )
    ),

  // ── Stage instances ──

  /**
   * Assign a stage to a department, team and employee — the Stage 8 workflow.
   *
   * Stamps the start time, lets the expected completion recalculate from the
   * (possibly overridden) duration, and injects an actionable task for the
   * assignee so the work shows up in their /pms/my-tasks list. The audit entry
   * records who assigned what to whom.
   */
  assignStage: (
    projectId,
    stageId,
    {
      assignedUser,
      assignedTeam,
      department,
      plannedDuration,
      durationUnit,
      startDateTime,
      status = "Assigned",
      notes = "",
      actor = null,
      injectTask = true,
    } = {}
  ) =>
    set((st) => {
      const project = st.projects.find((p) => p.id === projectId);
      const target = project?.stages.find((s2) => s2.id === stageId);
      const stageName = target?.name ?? "stage";
      const nextDepartment = department ?? target?.department;

      const assignment = makeActivity(
        "STAGE_ASSIGNED",
        "Stage",
        stageId,
        `${actor?.name ?? "PM"} assigned Stage ${target?.sequence ?? "?"} (${stageName}) to ${
          assignedUser?.name ?? assignedTeam ?? "the team"
        }${nextDepartment ? ` in ${nextDepartment}` : ""}.`,
        actor
      );
      assignment.from = target?.assignedUser?.name ?? "Unassigned";
      assignment.to = assignedUser?.name ?? assignedTeam ?? "Team";
      if (notes) assignment.comments = notes;

      return applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          currentStageId: stageId,
          currentDepartment: nextDepartment ?? p.currentDepartment,
          stages: p.stages.map((stage) => {
            if (stage.id !== stageId) return stage;

            const start = startDateTime ?? stage.startDateTime ?? new Date().toISOString();
            const duration = plannedDuration ?? stage.plannedDuration;
            const unit = durationUnit ?? stage.durationUnit;

            const next = {
              ...stage,
              assignedUser: assignedUser ?? stage.assignedUser,
              assignedTeam: assignedTeam ?? stage.assignedTeam,
              department: nextDepartment ?? stage.department,
              plannedDuration: duration,
              durationUnit: unit,
              startDateTime: start,
              status,
            };

            // Give the assignee something actionable. A stage with no tasks
            // tracks its own percentage, so the injected task inherits it and
            // the rollup does not jump backwards.
            if (injectTask && assignedUser?.id) {
              const alreadyHasOne = (stage.tasks ?? []).some(
                (t) => t.assignedUser?.id === assignedUser.id && t.status !== "Completed"
              );
              if (!alreadyHasOne) {
                next.tasks = [
                  ...(stage.tasks ?? []),
                  {
                    id: uid("TSK"),
                    stageId,
                    projectId,
                    taskName: `${stageName} — ${nextDepartment ?? "work"}`,
                    description:
                      notes || `Complete the ${stageName} stage and submit it for review.`,
                    assignedUser: { id: assignedUser.id, name: assignedUser.name },
                    department: nextDepartment ?? stage.department,
                    startDate: start,
                    dueDate:
                      computeExpectedCompletion(start, duration, unit) ?? start,
                    completionPct:
                      (stage.tasks ?? []).length === 0 ? clampPct(stage.completionPct ?? 0) : 0,
                    priority: p.priority ?? "Medium",
                    status: status === "In Progress" ? "In Progress" : "Not Started",
                  },
                ];
              }
            }

            return next;
          }),
        }),
        assignment
      );
    }),

  /**
   * Start a stage: stamps the start time (first start only) and moves it to
   * In Progress, which is what makes the expected-completion clock run.
   */
  startStage: (projectId, stageId, actor) =>
    set((st) =>
      applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          currentStageId: stageId,
          currentDepartment:
            p.stages.find((s2) => s2.id === stageId)?.department ?? p.currentDepartment,
          stages: p.stages.map((stage) =>
            stage.id !== stageId
              ? stage
              : {
                  ...stage,
                  startDateTime: stage.startDateTime ?? new Date().toISOString(),
                  status: "In Progress",
                }
          ),
        }),
        makeActivity("STAGE_STARTED", "Stage", stageId, "Stage started.", actor)
      )
    ),

  updateStage: (projectId, stageId, patch) =>
    set((st) =>
      applyToProject(st, projectId, (p) => ({
        ...p,
        stages: p.stages.map((stage) =>
          stage.id === stageId ? { ...stage, ...patch } : stage
        ),
      }))
    ),

  /** Set a stage's own progress. Ignored once the stage has tasks driving it. */
  setStageProgress: (projectId, stageId, pct) =>
    set((st) =>
      applyToProject(st, projectId, (p) => ({
        ...p,
        stages: p.stages.map((stage) =>
          stage.id === stageId ? { ...stage, completionPct: clampPct(pct) } : stage
        ),
      }))
    ),

  setStageStatus: (projectId, stageId, status, actor) =>
    set((st) =>
      applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          stages: p.stages.map((stage) =>
            stage.id !== stageId
              ? stage
              : {
                  ...stage,
                  status,
                  actualCompletionDateTime:
                    status === "Completed"
                      ? stage.actualCompletionDateTime ?? new Date().toISOString()
                      : stage.actualCompletionDateTime,
                }
          ),
        }),
        makeActivity("STAGE_STATUS_CHANGED", "Stage", stageId, `Stage marked ${status}.`, actor)
      )
    ),

  /** Complete a stage and advance the project pointer to the next one. */
  completeStageAndAdvance: (projectId, stageId, actor) =>
    set((st) =>
      applyToProject(
        st,
        projectId,
        (p) => {
          const ordered = [...p.stages].sort((a, b) => a.sequence - b.sequence);
          const idx = ordered.findIndex((s2) => s2.id === stageId);
          const next = idx >= 0 ? ordered[idx + 1] : undefined;
          const nowIso = new Date().toISOString();

          return {
            ...p,
            currentStageId: next?.id ?? stageId,
            currentDepartment: next?.department ?? p.currentDepartment,
            stages: p.stages.map((stage) => {
              if (stage.id === stageId) {
                return {
                  ...stage,
                  status: "Completed",
                  completionPct: 100,
                  actualCompletionDateTime: stage.actualCompletionDateTime ?? nowIso,
                  tasks: stage.tasks.map((t) => ({
                    ...t,
                    completionPct: 100,
                    status: "Completed",
                  })),
                };
              }
              if (next && stage.id === next.id) {
                return { ...stage, status: "Assigned", startDateTime: nowIso };
              }
              return stage;
            }),
          };
        },
        makeActivity(
          "STAGE_HANDOFF",
          "Stage",
          stageId,
          "Stage completed and handed off to the next department.",
          actor
        )
      )
    ),

  /**
   * Hand a completed stage to the next department — the Stage 8 protocol:
   * current department completes → PM review → next department starts.
   *
   * Closes the current stage with its actual completion time, unlocks and
   * assigns the next stage in sequence, and writes a handoff record carrying
   * From User → To User and From Dept → To Dept with the handover notes.
   */
  handoffStage: (
    projectId,
    stageId,
    { recipient, recipientTeam, notes = "", checklist = [], actor = null, force = false } = {}
  ) => {
    const state = get();
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Unknown project ${projectId}`);

    const ordered = [...(project.stages ?? [])].sort((a, b) => a.sequence - b.sequence);
    const index = ordered.findIndex((s) => s.id === stageId);
    const stage = ordered[index];
    if (!stage) throw new Error(`Unknown stage ${stageId}`);

    const config = state.stageConfigs.find((c) => c.id === stage.stageConfigId);
    const blockers = validateStageHandoff(stage, config);
    const hardBlockers = blockers.filter((b) => b.hard);
    if (hardBlockers.length > 0 && !force) {
      const err = new Error(hardBlockers.map((b) => b.label).join(" "));
      err.blockers = hardBlockers;
      throw err;
    }

    const nextStage = ordered[index + 1] ?? null;
    const nowIso = new Date().toISOString();

    const handoff = makeActivity(
      "STAGE_HANDOFF",
      "Stage",
      stageId,
      nextStage
        ? `${stage.name} completed and handed off to ${nextStage.name}.`
        : `${stage.name} completed — final stage in the pipeline.`,
      actor
    );
    handoff.from = `${stage.assignedUser?.name ?? "Unassigned"} · ${stage.department}`;
    handoff.to = nextStage
      ? `${recipient?.name ?? "Unassigned"} · ${nextStage.department}`
      : "Project close-out";
    if (notes) handoff.comments = notes;
    if (checklist.length > 0) handoff.checklist = checklist;

    set((st) =>
      applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          currentStageId: nextStage?.id ?? stageId,
          currentDepartment: nextStage?.department ?? p.currentDepartment,
          stages: p.stages.map((s2) => {
            if (s2.id === stageId) {
              return {
                ...s2,
                status: "Completed",
                completionPct: 100,
                actualCompletionDateTime: s2.actualCompletionDateTime ?? nowIso,
                tasks: (s2.tasks ?? []).map((t) => ({
                  ...t,
                  completionPct: 100,
                  status: "Completed",
                })),
              };
            }
            if (nextStage && s2.id === nextStage.id) {
              return {
                ...s2,
                assignedUser: recipient ?? s2.assignedUser,
                assignedTeam: recipientTeam ?? s2.assignedTeam,
                startDateTime: s2.startDateTime ?? nowIso,
                status: "Assigned",
              };
            }
            return s2;
          }),
        }),
        handoff
      )
    );

    return nextStage?.id ?? null;
  },

  // ── Delay tracking ──

  logDelay: (projectId, stageId, delayDetails, actor) =>
    set((st) =>
      applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          stages: p.stages.map((stage) =>
            stage.id !== stageId
              ? stage
              : {
                  ...stage,
                  status: "Delayed",
                  delayDetails: {
                    isDelayed: true,
                    reason: "",
                    responsibleDepartment: stage.department,
                    responsibleUser: stage.assignedUser?.name ?? "",
                    delayStartDateTime: new Date().toISOString(),
                    expectedRecoveryDate: null,
                    resolutionNotes: "",
                    ...delayDetails,
                  },
                }
          ),
        }),
        makeActivity(
          "DELAY_LOGGED",
          "Stage",
          stageId,
          `Delay logged: ${delayDetails?.reason ?? "reason not stated"}.`,
          actor
        )
      )
    ),

  resolveDelay: (projectId, stageId, resolutionNotes, actor) =>
    set((st) =>
      applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          stages: p.stages.map((stage) =>
            stage.id !== stageId
              ? stage
              : {
                  ...stage,
                  status: "In Progress",
                  delayDetails: {
                    ...stage.delayDetails,
                    isDelayed: false,
                    resolutionNotes: resolutionNotes ?? "",
                  },
                }
          ),
        }),
        makeActivity("DELAY_RESOLVED", "Stage", stageId, "Delay resolved.", actor)
      )
    ),

  // ── Tasks ──

  addTask: (projectId, stageId, task) =>
    set((st) =>
      applyToProject(st, projectId, (p) => ({
        ...p,
        stages: p.stages.map((stage) =>
          stage.id !== stageId
            ? stage
            : {
                ...stage,
                tasks: [
                  ...stage.tasks,
                  {
                    id: uid("TSK"),
                    stageId,
                    projectId,
                    completionPct: 0,
                    priority: "Medium",
                    status: "Not Started",
                    department: stage.department,
                    ...task,
                  },
                ],
              }
        ),
      }))
    ),

  updateTask: (projectId, stageId, taskId, patch) =>
    set((st) =>
      applyToProject(st, projectId, (p) => ({
        ...p,
        stages: p.stages.map((stage) =>
          stage.id !== stageId
            ? stage
            : {
                ...stage,
                // Progress and status are kept consistent in both directions:
                // 100% means Completed, and reopening a task must drop it below
                // 100% or the stage average would still count it as finished.
                tasks: stage.tasks.map((t) => {
                  if (t.id !== taskId) return t;
                  const next = { ...t, ...patch };
                  if (patch.completionPct !== undefined) {
                    next.completionPct = clampPct(patch.completionPct);
                    if (next.completionPct === 100) next.status = "Completed";
                    else if (next.status === "Completed") next.status = "In Progress";
                  }
                  if (patch.status === "Completed") {
                    next.completionPct = 100;
                  } else if (patch.status !== undefined && next.completionPct === 100) {
                    next.completionPct = 99;
                  }
                  return next;
                }),
              }
        ),
      }))
    ),

  deleteTask: (projectId, stageId, taskId) =>
    set((st) =>
      applyToProject(st, projectId, (p) => ({
        ...p,
        stages: p.stages.map((stage) =>
          stage.id !== stageId
            ? stage
            : { ...stage, tasks: stage.tasks.filter((t) => t.id !== taskId) }
        ),
      }))
    ),

  // ── Design documents & versioning ──

  /** Upload a proof. Version auto-increments from the stage's existing stack. */
  addDocument: (projectId, stageId, doc, actor) =>
    set((st) =>
      applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          stages: p.stages.map((stage) => {
            if (stage.id !== stageId) return stage;
            const nextVersion =
              stage.documents.reduce((max, d) => Math.max(max, d.version ?? 0), 0) + 1;
            return {
              ...stage,
              documents: [
                ...stage.documents,
                {
                  id: uid("DOC"),
                  version: nextVersion,
                  fileSize: "—",
                  previewUrl: "",
                  uploadedAt: new Date().toISOString(),
                  comments: "",
                  approvalStatus: "Pending",
                  ...doc,
                },
              ],
            };
          }),
        }),
        makeActivity(
          "DOCUMENT_UPLOADED",
          "Stage",
          stageId,
          `Design proof uploaded: ${doc?.fileName ?? "document"}.`,
          actor
        )
      )
    ),

  /**
   * Send a proof out for sign-off — the "Send to Client" step.
   *
   * Opens a Pending approval record against the document and parks the stage in
   * Under Review, so the proofing centre can tell "not circulated yet" apart
   * from "waiting on the client".
   */
  requestApproval: (projectId, stageId, documentId, { approverType = "Client", approverName, actor = null } = {}) =>
    set((st) => {
      const project = st.projects.find((p) => p.id === projectId);
      const stage = project?.stages.find((s2) => s2.id === stageId);
      const doc = stage?.documents.find((d) => d.id === documentId);

      return applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          stages: p.stages.map((s2) =>
            s2.id !== stageId
              ? s2
              : {
                  ...s2,
                  status: "Under Review",
                  approvals: [
                    ...(s2.approvals ?? []),
                    {
                      id: uid("APR"),
                      documentId,
                      approverType,
                      approverName: approverName ?? p.customerName ?? "Client",
                      requestedBy: actor,
                      requestedAt: new Date().toISOString(),
                      status: "Pending",
                      decisionAt: null,
                      comments: "",
                    },
                  ],
                }
          ),
        }),
        makeActivity(
          "APPROVAL_REQUESTED",
          "Document",
          documentId,
          `${doc?.fileName ?? "Proof"} sent to ${approverName ?? project?.customerName ?? "the client"} for approval.`,
          actor
        )
      );
    }),

  /**
   * Record a decision on a proof.
   *
   * Resolves the open Pending request for that document rather than stacking a
   * second record beside it, so the approvals list reads as one thread per
   * circulation. Past versions are never touched.
   */
  decideDocument: (
    projectId,
    stageId,
    documentId,
    decision,
    { comments = "", revisionReason = "", approverName = "", approverType = "Client" } = {},
    actor = null
  ) => {
    const errors = validateApprovalDecision(decision, { revisionReason, approverName });
    if (Object.keys(errors).length > 0) {
      const err = new Error(Object.values(errors).join(" "));
      err.fieldErrors = errors;
      throw err;
    }

    const nowIso = new Date().toISOString();
    const isRevision = decision === "Need Improvement";

    set((st) =>
      applyToProject(
        st,
        projectId,
        (p) => ({
          ...p,
          stages: p.stages.map((stage) => {
            if (stage.id !== stageId) return stage;

            const approvals = stage.approvals ?? [];
            const openIndex = approvals.findIndex(
              (a) => a.documentId === documentId && a.status === "Pending"
            );

            const resolved = {
              id: openIndex >= 0 ? approvals[openIndex].id : uid("APR"),
              documentId,
              approverType,
              approverName,
              requestedBy: openIndex >= 0 ? approvals[openIndex].requestedBy : actor,
              requestedAt: openIndex >= 0 ? approvals[openIndex].requestedAt : nowIso,
              status: decision,
              decisionAt: nowIso,
              comments,
              ...(isRevision ? { revisionReason } : {}),
            };

            return {
              ...stage,
              status: isRevision ? "Need Improvement" : "Approved",
              // Only the addressed version changes; earlier versions are frozen.
              documents: stage.documents.map((d) =>
                d.id !== documentId
                  ? d
                  : {
                      ...d,
                      approvalStatus: decision,
                      comments: comments || d.comments,
                      ...(isRevision ? { revisionReason } : {}),
                    }
              ),
              approvals:
                openIndex >= 0
                  ? approvals.map((a, i) => (i === openIndex ? resolved : a))
                  : [...approvals, resolved],
            };
          }),
        }),
        (() => {
          const entry = makeActivity(
            isRevision ? "REVISION_REQUESTED" : "DOCUMENT_APPROVED",
            "Document",
            documentId,
            isRevision
              ? `${approverName} requested a revision.`
              : `${approverName} approved the proof.`,
            actor
          );
          entry.from = "Pending";
          entry.to = decision;
          if (isRevision) entry.comments = revisionReason;
          else if (comments) entry.comments = comments;
          return entry;
        })()
      )
    );
  },

  // ── Audit trail ──

  logActivity: (projectId, action, entityType, entityId, description, actor) =>
    set((st) =>
      applyToProject(
        st,
        projectId,
        (p) => p,
        makeActivity(action, entityType, entityId, description, actor)
      )
    ),

  // ── Selectors ──

  getProjectById: (projectId) => get().projects.find((p) => p.id === projectId) ?? null,

  getStage: (projectId, stageId) => {
    const project = get().projects.find((p) => p.id === projectId);
    return project?.stages.find((s2) => s2.id === stageId) ?? null;
  },

  getCurrentStage: (projectId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return null;
    return project.stages.find((s2) => s2.id === project.currentStageId) ?? null;
  },

  getProjectsByStatus: (status) =>
    status && status !== "all"
      ? get().projects.filter((p) => p.status === status)
      : get().projects,

  /** Every stage currently flagged Delayed, flattened with project context. */
  getDelayedStages: () =>
    get().projects.flatMap((p) =>
      p.stages
        .filter((s2) => s2.status === "Delayed" || s2.delayDetails?.isDelayed)
        .map((s2) => ({
          projectId: p.id,
          projectCustomer: p.customerName,
          projectPriority: p.priority,
          stage: s2,
          timing: getStageTiming(s2),
        }))
    ),

  /** Every task assigned to one user across all projects. */
  getTasksForUser: (userId) =>
    get().projects.flatMap((p) =>
      p.stages.flatMap((s2) =>
        s2.tasks
          .filter((t) => t.assignedUser?.id === userId)
          .map((t) => ({
            ...t,
            projectId: p.id,
            projectCustomer: p.customerName,
            stageName: s2.name,
          }))
      )
    ),

  getCurrentUser: () => {
    const { employees, currentUserId } = get();
    return employees.find((e) => e.id === currentUserId) ?? null;
  },

  /** Projects managed by the current user — backs /pms/my-projects. */
  getMyProjects: () => {
    const { projects, currentUserId } = get();
    return projects.filter((p) => p.projectManager?.id === currentUserId);
  },

  /** Unfinished tasks assigned to the current user — backs /pms/my-tasks. */
  getMyPendingTasks: () => {
    const { currentUserId } = get();
    return get()
      .getTasksForUser(currentUserId)
      .filter((t) => t.status !== "Completed");
  },

  /** Live counters for the sidebar nav badges. */
  getNavBadges: () => computeNavBadges(get().projects, get().currentUserId),

  // ── Stage 4 dashboard selectors ──

  getDashboardMetrics: () => computeDashboardMetrics(get().projects),

  getPipelineByDepartment: () => computePipelineByDepartment(get().projects),

  getDepartmentWorkload: () => {
    const { projects, settings } = get();
    return computeDepartmentWorkload(
      projects,
      settings.departmentCapacity ?? {},
      settings.defaultDepartmentCapacity ?? 20
    );
  },

  getDelayWatchlist: () => computeDelayWatchlist(get().projects),

  getUpcomingDeadlines: (days = 7) => computeUpcomingDeadlines(get().projects, days),

  /** Merged, newest-first audit feed across every project. */
  getRecentActivity: (limit = 20) =>
    get()
      .projects.flatMap((p) =>
        (p.activityLog ?? []).map((a) => ({
          ...a,
          projectId: p.id,
          projectCustomer: p.customerName,
        }))
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit),

  /** Headline metrics for the executive dashboard. */
  getKpis: () => {
    const projects = get().projects;
    const active = projects.filter(
      (p) => p.status !== "Completed" && p.status !== "Draft"
    );
    const delayed = projects.filter((p) => p.status === "Delayed");
    const atRisk = projects.filter((p) => p.status === "At Risk");
    const completed = projects.filter((p) => p.status === "Completed");
    const avgCompletion = projects.length
      ? Math.round(
          projects.reduce((acc, p) => acc + (p.overallCompletionPct ?? 0), 0) /
            projects.length
        )
      : 0;
    const orderValue = projects.reduce(
      (acc, p) => acc + (p.productDetails?.orderValue ?? 0),
      0
    );
    return {
      totalProjects: projects.length,
      activeProjects: active.length,
      delayedProjects: delayed.length,
      atRiskProjects: atRisk.length,
      completedProjects: completed.length,
      avgCompletionPct: avgCompletion,
      totalOrderValue: orderValue,
    };
  },
}));
