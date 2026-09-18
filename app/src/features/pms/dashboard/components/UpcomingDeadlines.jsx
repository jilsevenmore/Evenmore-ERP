import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { DynamicProgressBar } from '../../components/DynamicProgressBar';
import { EmptyStatePms } from '../../components/EmptyStatePms';

/**
 * UpcomingDeadlines — countdown cards for projects landing within the window.
 *
 * Sorted soonest-first, including anything already past due so a slipped
 * deadline cannot quietly drop off the list.
 */

function countdownLabel(daysRemaining) {
  if (daysRemaining == null) return { text: '—', tone: '#64748b' };
  if (daysRemaining < 0) {
    const d = Math.ceil(Math.abs(daysRemaining));
    return { text: `${d}d overdue`, tone: '#9f1239' };
  }
  if (daysRemaining < 1) {
    const hours = Math.max(1, Math.round(daysRemaining * 24));
    return { text: `${hours}h left`, tone: '#9a3412' };
  }
  const d = Math.floor(daysRemaining);
  return { text: `${d}d left`, tone: d <= 2 ? '#9a3412' : '#0369a1' };
}

export function UpcomingDeadlines({ rows = [], windowDays = 7 }) {
  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs h-full">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Upcoming Deadlines</h3>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <CalendarClock size={13} />
          next {windowDays} days
        </span>
      </header>

      {rows.length === 0 ? (
        <EmptyStatePms
          variant="projects"
          title="No deadlines this week"
          description={`No in-flight project is due within the next ${windowDays} days.`}
        />
      ) : (
        <ul className="space-y-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row) => {
            const countdown = countdownLabel(row.daysRemaining);
            return (
              <li
                key={row.id}
                className="rounded-lg border border-slate-200 p-3 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/pms/projects/${row.id}`}
                      className="text-xs font-bold text-slate-800 hover:text-blue-600 hover:underline"
                    >
                      {row.id}
                    </Link>
                    <div className="text-[11px] text-slate-500 truncate" title={row.productName}>
                      {row.customerName} · {row.productName}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${countdown.tone}1a`, color: countdown.tone }}
                  >
                    {countdown.text}
                  </span>
                </div>

                <div className="mt-2.5">
                  <DynamicProgressBar
                    value={row.completionPct}
                    status={row.status}
                    timing={{ isOverdue: row.isOverdue, elapsedPct: 0, remainingMs: 0, delayMs: 0 }}
                    showLabel={false}
                    height={6}
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

export default UpcomingDeadlines;
