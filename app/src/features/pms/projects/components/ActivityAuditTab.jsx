import React from 'react';
import { History } from 'lucide-react';
import { ActivityTimeline } from '../../components/ActivityTimeline';

/**
 * ActivityAuditTab — the project's chronological audit trail.
 *
 * Thin wrapper over the Stage 3 ActivityTimeline: every store mutation that
 * matters appends an entry, so this tab needs no logic of its own.
 */
export function ActivityAuditTab({ project }) {
  const entries = project.activityLog ?? [];

  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs">
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <History size={14} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800">Activity &amp; Audit Trail</h3>
        </div>
        <span className="text-[11px] text-slate-400">
          {entries.length} {entries.length === 1 ? 'event' : 'events'}
        </span>
      </header>

      <ActivityTimeline entries={entries} />
    </section>
  );
}

export default ActivityAuditTab;
