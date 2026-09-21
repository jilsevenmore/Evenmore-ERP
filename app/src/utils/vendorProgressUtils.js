/**
 * Vendor Progress & Calculation Utilities
 * 
 * Provides:
 * - computeOrderProgress: Weighted progress calculation based on stage weights and stage-level completion/approval
 * - computeOrderRiskStatus: Identifies Delayed, At Risk, On Track, and Completed orders
 * - Helper formatting functions for dates, percentages, and status badges
 */

import { toISODate, getCurrentISODate } from './dateUtils';

/**
 * Weighted progress calculation
 * Formula: Sum of (stage.weight * (stageProgress / 100))
 * 
 * Stages that are 'Approved' or 'Completed' contribute 100% of their weight.
 * Stages that are 'Submitted' or 'In Progress' contribute partial weight based on their partial progress or quantity.
 * Stages that are 'Rejected' or 'Not Started' contribute 0%.
 */
export function computeOrderProgress(stages = [], orderQuantity = 1) {
  if (!Array.isArray(stages) || stages.length === 0) return 0;

  let totalWeightedScore = 0;

  for (const stage of stages) {
    const weight = Number(stage.weight) || 0;
    const status = (stage.status || '').toLowerCase();

    let stageRatio = 0;
    if (status === 'approved' || status === 'completed') {
      stageRatio = 1.0;
    } else if (status === 'submitted') {
      // Stage submitted awaiting approval: counts partial or full stage progress based on stage.progress
      const stagePct = typeof stage.progress === 'number' ? stage.progress : 100;
      stageRatio = Math.min(1.0, Math.max(0, stagePct / 100));
    } else if (status === 'in progress' || status === 'started') {
      if (typeof stage.progress === 'number') {
        stageRatio = Math.min(1.0, Math.max(0, stage.progress / 100));
      } else if (stage.quantityCompleted && orderQuantity > 0) {
        stageRatio = Math.min(1.0, Math.max(0, stage.quantityCompleted / orderQuantity));
      } else {
        stageRatio = 0.25; // Default minimal start progress
      }
    } else {
      stageRatio = 0;
    }

    totalWeightedScore += weight * stageRatio;
  }

  return Math.min(100, Math.max(0, Math.round(totalWeightedScore * 10) / 10));
}

/**
 * Calculates risk status:
 * - 'Completed': Order is 100% complete and all stages approved
 * - 'Delayed': Today is past expected end date and order not completed, or a stage is overdue
 * - 'At Risk': Expected end date is within 3 days and progress is lagging significantly (< 70%)
 * - 'On Track': Schedule and progress are healthy
 */
export function computeOrderRiskStatus(order) {
  if (!order) return 'On Track';
  
  const status = (order.status || '').toLowerCase();
  if (status === 'completed') return 'Completed';

  const todayStr = getCurrentISODate();
  const today = new Date(`${todayStr}T00:00:00`);

  const endStr = toISODate(order.expectedEndDate || order.dueDate);
  if (endStr) {
    const dueDate = new Date(`${endStr}T00:00:00`);
    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Delayed';
    }

    const progress = typeof order.overallProgress === 'number' 
      ? order.overallProgress 
      : computeOrderProgress(order.stages, order.quantity);

    if (diffDays <= 3 && progress < 70) {
      return 'At Risk';
    }

    // Check if any specific active stage is overdue
    if (Array.isArray(order.stages)) {
      const anyStageDelayed = order.stages.some((s) => (s.status || '').toLowerCase() === 'delayed');
      if (anyStageDelayed) return 'Delayed';
    }
  }

  if (status === 'delayed') return 'Delayed';
  if (status === 'at risk') return 'At Risk';

  return 'On Track';
}

/**
 * Format status badges styling mapping
 */
export const VENDOR_STATUS_CONFIG = {
  'New': { label: 'New', color: 'badge-blue', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Accepted': { label: 'Accepted', color: 'badge-cyan', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'In Progress': { label: 'In Progress', color: 'badge-blue', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  'Started': { label: 'Started', color: 'badge-blue', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  'Submitted': { label: 'Submitted', color: 'badge-purple', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Pending Approval': { label: 'Pending Approval', color: 'badge-yellow', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Awaiting Approval': { label: 'Awaiting Approval', color: 'badge-yellow', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Approved': { label: 'Approved', color: 'badge-green', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Rejected': { label: 'Rejected', color: 'badge-red', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Partially Completed': { label: 'Partially Completed', color: 'badge-yellow', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Completed': { label: 'Completed', color: 'badge-green', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Delayed': { label: 'Delayed', color: 'badge-red', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  'At Risk': { label: 'At Risk', color: 'badge-orange', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  'On Track': { label: 'On Track', color: 'badge-green', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Shared': { label: 'Shared', color: 'badge-blue', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'Unshared': { label: 'Unshared', color: 'badge-gray', bg: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export function getVendorStatusClass(status) {
  return VENDOR_STATUS_CONFIG[status]?.bg || 'bg-slate-100 text-slate-700 border-slate-200';
}
