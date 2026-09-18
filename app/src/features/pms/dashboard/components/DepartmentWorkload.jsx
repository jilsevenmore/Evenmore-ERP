import React from 'react';
import { Users, Ban } from 'lucide-react';
import { EmptyStatePms } from '../../components/EmptyStatePms';

/**
 * DepartmentWorkload — open task load per department against its capacity.
 *
 * Capacity is the concurrent open-task ceiling configured in PMS settings
 * (settings.departmentCapacity), so utilisation is a real ratio rather than a
 * decorative percentage. Bars turn amber past 65% and red past 90%.
 */

const LOAD_TONES = {
  Low: { bar: '#1bb878', chip: '#d1fae5', chipFg: '#065f46' },
  Medium: { bar: '#ef9b06', chip: '#fef3c7', chipFg: '#92400e' },
  High: { bar: '#f43f5e', chip: '#ffe4e6', chipFg: '#9f1239' },
};

export function DepartmentWorkload({ rows = [] }) {
  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs h-full">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Department Workload &amp; Active Tasks</h3>
        <Users size={15} className="text-slate-300" />
      </header>

      {rows.length === 0 ? (
        <EmptyStatePms
          variant="tasks"
          title="No open tasks"
          description="Task load per department appears here once stages are assigned."
        />
      ) : (
        <ul className="space-y-4" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row) => {
            const tone = LOAD_TONES[row.load] ?? LOAD_TONES.Low;
            const fillPct = Math.min(100, row.utilisationPct);

            return (
              <li key={row.department}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {row.department}
                    </span>
                    {row.blockedTasks > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fee2e2', color: '#991b1b' }}
                        title={`${row.blockedTasks} blocked`}
                      >
                        <Ban size={9} strokeWidth={2.5} />
                        {row.blockedTasks}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-medium text-slate-500">
                      {row.openTasks}/{row.capacity} tasks
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: tone.chip, color: tone.chipFg }}
                    >
                      {row.utilisationPct}%
                    </span>
                  </div>
                </div>
                <div
                  className="w-full overflow-hidden"
                  style={{ height: 8, borderRadius: 4, background: '#eef2f8' }}
                >
                  <div
                    style={{
                      width: `${fillPct}%`,
                      height: '100%',
                      borderRadius: 4,
                      background: tone.bar,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default DepartmentWorkload;
