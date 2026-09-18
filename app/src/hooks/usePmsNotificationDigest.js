import { useMemo } from 'react';
import {
  usePmsStore,
  computeDelayWatchlist,
  computeUpcomingDeadlines,
  computeDashboardMetrics,
  getProofWorkflowState,
} from '../stores/pmsStore';

/**
 * Project alerts for the topbar bell. Mirrors the CRM digest contract
 * ({ items, counts }) so Topbar can render every module the same way.
 *
 * Tones map onto the same weights the CRM digest uses: overdue → red,
 * today → amber, upcoming/info → neutral.
 */
function buildPmsDigest({ projects, currentUserId, now }) {
  const items = [];

  const delays = computeDelayWatchlist(projects, now);
  if (delays.length > 0) {
    const worst = delays[0];
    items.push({
      id: 'pms-delayed-stages',
      title: `${delays.length} delayed stage${delays.length > 1 ? 's' : ''}`,
      subtitle: worst.customerName || 'Project',
      desc: `${worst.stageName} • ${worst.department || 'Unassigned'} is ${worst.delayLabel} behind schedule.`,
      time: 'Delayed',
      tone: 'overdue',
      unread: true,
      path: '/pms/delays',
    });
  }

  // Overdue stages nobody has attributed yet — the delay centre needs a reason
  // logged before it can report on them.
  const unlogged = delays.filter((row) => !row.isLogged);
  if (unlogged.length > 0) {
    items.push({
      id: 'pms-unlogged-delays',
      title: `${unlogged.length} delay${unlogged.length > 1 ? 's' : ''} need a reason logged`,
      subtitle: 'Delay Center',
      desc: `${unlogged[0].stageName} ran past due without a recorded delay reason.`,
      time: 'Action needed',
      tone: 'today',
      unread: true,
      path: '/pms/delays',
    });
  }

  const metrics = computeDashboardMetrics(projects, now);
  if (metrics.atRiskStages > 0) {
    items.push({
      id: 'pms-at-risk-stages',
      title: `${metrics.atRiskStages} stage${metrics.atRiskStages > 1 ? 's' : ''} at risk`,
      subtitle: 'Stage SLA',
      desc: 'Elapsed time has outrun completion progress on these stages.',
      time: 'At Risk',
      tone: 'today',
      unread: true,
      path: '/pms/timeline',
    });
  }

  const deadlines = computeUpcomingDeadlines(projects, 7, now).filter((row) => !row.isOverdue);
  deadlines.slice(0, 3).forEach((row) => {
    items.push({
      id: `pms-deadline-${row.id}`,
      title: `${row.customerName || row.id} due in ${row.daysRemaining}d`,
      subtitle: row.productName || 'Project delivery',
      desc: `${row.completionPct}% complete • ${row.priority || 'Normal'} priority`,
      time: row.daysRemaining === 0 ? 'Today' : `${row.daysRemaining}d left`,
      tone: row.daysRemaining <= 1 ? 'today' : 'upcoming',
      unread: row.daysRemaining <= 1,
      path: `/pms/projects/${row.id}`,
    });
  });

  // Proofs sitting with the client block the stage from advancing.
  let pendingApprovals = 0;
  let firstApprovalProject = null;
  for (const project of projects || []) {
    for (const stage of project.stages ?? []) {
      if (getProofWorkflowState(stage).pendingApproval) {
        pendingApprovals += 1;
        if (!firstApprovalProject) firstApprovalProject = { project, stage };
      }
    }
  }
  if (pendingApprovals > 0) {
    items.push({
      id: 'pms-pending-approvals',
      title: `${pendingApprovals} client approval${pendingApprovals > 1 ? 's' : ''} pending`,
      subtitle: firstApprovalProject?.project?.customerName || 'Client review',
      desc: `${firstApprovalProject?.stage?.name || 'A stage'} is waiting on a client decision.`,
      time: 'With client',
      tone: 'upcoming',
      unread: true,
      path: firstApprovalProject ? `/pms/projects/${firstApprovalProject.project.id}` : '/pms/projects',
    });
  }

  if (currentUserId) {
    let myTasks = 0;
    for (const project of projects || []) {
      for (const stage of project.stages ?? []) {
        for (const task of stage.tasks ?? []) {
          if (task.assignedUser?.id === currentUserId && task.status !== 'Completed') myTasks += 1;
        }
      }
    }
    if (myTasks > 0) {
      items.push({
        id: 'pms-my-tasks',
        title: `${myTasks} task${myTasks > 1 ? 's' : ''} assigned to you`,
        subtitle: 'My Tasks',
        desc: 'Stage tasks still open against your name across active projects.',
        time: 'Assigned',
        tone: 'info',
        unread: false,
        path: '/pms/my-tasks',
      });
    }
  }

  const overdue = items.filter((i) => i.tone === 'overdue').length;
  const today = items.filter((i) => i.tone === 'today').length;

  return {
    items,
    counts: {
      unread: items.filter((i) => i.unread).length,
      urgent: overdue + today,
      overdue,
      today,
      total: items.length,
    },
  };
}

export function usePmsNotificationDigest() {
  const projects = usePmsStore((s) => s.projects);
  const currentUserId = usePmsStore((s) => s.currentUserId);

  return useMemo(
    () => buildPmsDigest({ projects: projects || [], currentUserId, now: Date.now() }),
    [projects, currentUserId]
  );
}
