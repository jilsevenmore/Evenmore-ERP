import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  PackageCheck,
  ChevronRight,
  X,
  BellRing,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { usePmsStore, getProjectRowMeta, computeUpcomingDeadlines } from '../../../stores/pmsStore';

/**
 * PMSNotificationAlerts — active notification alerts for all PMS sections.
 *
 * Displays live, actionable alerts for:
 * 1. Newly arrived projects awaiting stage setup/execution.
 * 2. Delayed projects requiring corrective action.
 * 3. Approaching project deadlines (within 3 days).
 *
 * Can be used globally across PMS pages (ProjectsPage, MyProjectsPage)
 * or scoped to a single project (ProjectDetailPage).
 */
export function PMSNotificationAlerts({ project = null, onFilterDelayed = null, className = '' }) {
  const navigate = useNavigate();
  const allProjects = usePmsStore((s) => s.projects) || [];

  const [dismissed, setDismissed] = useState({});

  const now = Date.now();

  // If scoped to a single project, only evaluate that project
  const projectsToInspect = useMemo(() => {
    if (project) return [project];
    return allProjects.filter((p) => p.status !== 'Completed');
  }, [project, allProjects]);

  // Compute the 3 notification categories
  const { delayedList, dueSoonList, newArrivedList } = useMemo(() => {
    const delayed = [];
    const dueSoon = [];
    const newArrived = [];

    for (const p of projectsToInspect) {
      if (p.status === 'Completed') continue;

      const meta = getProjectRowMeta(p, now);
      const code = p.code || p.id;

      // 1. Delayed check
      if (p.status === 'Delayed' || meta.projectDelayMs > 0) {
        delayed.push({
          id: p.id,
          code,
          customerName: p.customerName || 'Customer',
          currentStage: meta.currentStage?.name || 'In Progress',
          delayLabel: meta.projectDelayLabel || 'Overdue',
          path: `/pms/projects/${code}`,
        });
      }

      // 2. Deadline approaching check (due in <= 3 days and not already delayed)
      if (
        meta.remainingMs > 0 &&
        meta.remainingMs <= 3 * 24 * 60 * 60 * 1000 &&
        p.status !== 'Delayed' &&
        meta.projectDelayMs <= 0
      ) {
        dueSoon.push({
          id: p.id,
          code,
          customerName: p.customerName || 'Customer',
          remainingLabel: meta.remainingLabel || 'Due soon',
          expectedDate: p.expectedCompletionDate,
          path: `/pms/projects/${code}`,
        });
      }

      // 3. New project arrived check (in Draft status or created in last 3 days)
      const isRecent =
        p.createdAt && now - new Date(p.createdAt).getTime() <= 3 * 24 * 60 * 60 * 1000;
      if (p.status === 'Draft' || isRecent) {
        newArrived.push({
          id: p.id,
          code,
          customerName: p.customerName || 'Customer',
          productName: p.productDetails?.productName || 'Order item',
          status: p.status,
          path: `/pms/projects/${code}`,
        });
      }
    }

    return {
      delayedList: delayed,
      dueSoonList: dueSoon,
      newArrivedList: newArrived,
    };
  }, [projectsToInspect, now]);

  const hasAnyAlert =
    (delayedList.length > 0 && !dismissed['delayed']) ||
    (dueSoonList.length > 0 && !dismissed['dueSoon']) ||
    (newArrivedList.length > 0 && !dismissed['newArrived']);

  if (!hasAnyAlert) return null;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* 1. Delayed Projects Notification Alert */}
      {delayedList.length > 0 && !dismissed['delayed'] && (
        <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-rose-50 via-rose-50/70 to-white border border-rose-200/90 shadow-2xs">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle size={16} strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-rose-900">
                  {delayedList.length === 1
                    ? `Project Delayed: ${delayedList[0].code}`
                    : `${delayedList.length} Projects Currently Delayed`}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-0.5">
                {delayedList.length === 1 ? (
                  <>
                    <strong>{delayedList[0].customerName}</strong> project is tracking behind schedule (
                    {delayedList[0].delayLabel}) on stage: <em>{delayedList[0].currentStage}</em>.
                  </>
                ) : (
                  <>
                    The following projects have exceeded their planned timeline:{' '}
                    <span className="font-semibold">
                      {delayedList.slice(0, 3).map((d) => d.code).join(', ')}
                      {delayedList.length > 3 ? ` and ${delayedList.length - 3} more` : ''}
                    </span>
                    .
                  </>
                )}
              </p>

              {/* Action pills */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {delayedList.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => navigate(d.path)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-800 hover:bg-rose-100/60 transition shadow-2xs"
                  >
                    {d.code} · {d.delayLabel} <ChevronRight size={12} />
                  </button>
                ))}
                {onFilterDelayed && delayedList.length > 1 && (
                  <button
                    type="button"
                    onClick={onFilterDelayed}
                    className="text-[11px] font-bold text-rose-700 hover:underline px-1 py-1"
                  >
                    Filter All Delayed ({delayedList.length}) →
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissed((prev) => ({ ...prev, delayed: true }))}
            className="text-rose-400 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100/50 transition shrink-0"
            title="Dismiss alert"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 2. Deadline Approaching Notification Alert */}
      {dueSoonList.length > 0 && !dismissed['dueSoon'] && (
        <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/70 to-white border border-amber-200/90 shadow-2xs">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Clock size={16} strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-900">
                  {dueSoonList.length === 1
                    ? `Deadline Approaching: ${dueSoonList[0].code}`
                    : `${dueSoonList.length} Projects Due Within 3 Days`}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Approaching
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-0.5">
                {dueSoonList.length === 1 ? (
                  <>
                    <strong>{dueSoonList[0].customerName}</strong> project is scheduled for completion{' '}
                    <strong>{dueSoonList[0].remainingLabel}</strong>.
                  </>
                ) : (
                  <>
                    Upcoming project delivery deadlines:{' '}
                    <span className="font-semibold">
                      {dueSoonList.slice(0, 3).map((d) => `${d.code} (${d.remainingLabel})`).join(', ')}
                      {dueSoonList.length > 3 ? ` and ${dueSoonList.length - 3} more` : ''}
                    </span>
                    .
                  </>
                )}
              </p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {dueSoonList.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => navigate(d.path)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-white border border-amber-200 text-amber-800 hover:bg-amber-100/60 transition shadow-2xs"
                  >
                    {d.code} · {d.remainingLabel} <ChevronRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissed((prev) => ({ ...prev, dueSoon: true }))}
            className="text-amber-400 hover:text-amber-700 p-1 rounded-lg hover:bg-amber-100/50 transition shrink-0"
            title="Dismiss alert"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 3. New Project Arrived Alert */}
      {newArrivedList.length > 0 && !dismissed['newArrived'] && (
        <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-blue-50 via-blue-50/70 to-white border border-blue-200/90 shadow-2xs">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Sparkles size={16} strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-blue-900">
                  {newArrivedList.length === 1
                    ? `New Project Arrived: ${newArrivedList[0].code}`
                    : `${newArrivedList.length} New Projects Arrived`}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  New Arrival
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-0.5">
                {newArrivedList.length === 1 ? (
                  <>
                    Project for <strong>{newArrivedList[0].customerName}</strong> (
                    {newArrivedList[0].productName}) is active and ready for stage pipeline execution.
                  </>
                ) : (
                  <>
                    Recent project orders ready for execution:{' '}
                    <span className="font-semibold">
                      {newArrivedList.slice(0, 3).map((d) => d.code).join(', ')}
                      {newArrivedList.length > 3 ? ` and ${newArrivedList.length - 3} more` : ''}
                    </span>
                    .
                  </>
                )}
              </p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {newArrivedList.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => navigate(d.path)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-white border border-blue-200 text-blue-800 hover:bg-blue-100/60 transition shadow-2xs"
                  >
                    Open {d.code} <ArrowRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissed((prev) => ({ ...prev, newArrived: true }))}
            className="text-blue-400 hover:text-blue-700 p-1 rounded-lg hover:bg-blue-100/50 transition shrink-0"
            title="Dismiss alert"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default PMSNotificationAlerts;
