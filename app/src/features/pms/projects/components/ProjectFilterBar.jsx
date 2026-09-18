import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

/**
 * ProjectFilterBar — the directory's multi-facet filter controls.
 *
 * Purely presentational: it renders the current filter object and reports
 * changes upward. The matching logic lives in filterProjects() in the store,
 * so filtering stays testable without mounting any of this.
 */

const STATUS_PILLS = ['In Progress', 'Delayed', 'At Risk', 'Completed', 'Draft'];

const selectClass =
  'text-xs rounded-lg border border-[#dce5f4] bg-white px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';

export function ProjectFilterBar({
  filters,
  options,
  onChange,
  onReset,
  isFiltered = false,
  resultCount = 0,
  totalCount = 0,
}) {
  const set = (patch) => onChange({ ...filters, ...patch });

  const toggleStatus = (status) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    set({ statuses: next });
  };

  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-4 shadow-2xs space-y-3">
      {/* Row 1 — search + dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search project ID, customer, order or product…"
            aria-label="Search projects"
            className="w-full text-xs rounded-lg border border-[#dce5f4] bg-white pl-9 pr-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>

        <select
          className={selectClass}
          value={filters.customer}
          onChange={(e) => set({ customer: e.target.value })}
          aria-label="Filter by customer"
        >
          <option value="all">All customers</option>
          {options.customers.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filters.projectManagerId}
          onChange={(e) => set({ projectManagerId: e.target.value })}
          aria-label="Filter by project manager"
        >
          <option value="all">All managers</option>
          {options.managers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filters.department}
          onChange={(e) => set({ department: e.target.value })}
          aria-label="Filter by department"
        >
          <option value="all">All departments</option>
          {options.departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filters.stageName}
          onChange={(e) => set({ stageName: e.target.value })}
          aria-label="Filter by stage"
        >
          <option value="all">All stages</option>
          {options.stageNames.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Row 2 — status pills, delayed toggle, date range */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter by status">
          <button
            type="button"
            onClick={() => set({ statuses: [] })}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors"
            style={
              filters.statuses.length === 0
                ? { background: '#1f6bff', color: '#fff', borderColor: '#1f6bff' }
                : { background: '#fff', color: '#475569', borderColor: '#dce5f4' }
            }
            aria-pressed={filters.statuses.length === 0}
          >
            All
          </button>
          {STATUS_PILLS.map((status) => {
            const active = filters.statuses.includes(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                aria-pressed={active}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors"
                style={
                  active
                    ? { background: '#1f6bff', color: '#fff', borderColor: '#1f6bff' }
                    : { background: '#fff', color: '#475569', borderColor: '#dce5f4' }
                }
              >
                {status}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer ml-1">
          <input
            type="checkbox"
            checked={filters.delayedOnly}
            onChange={(e) => set({ delayedOnly: e.target.checked })}
            className="accent-rose-500"
          />
          Delayed only
        </label>

        <div className="flex items-center gap-1.5 ml-auto">
          <select
            className={selectClass}
            value={filters.dateField}
            onChange={(e) => set({ dateField: e.target.value })}
            aria-label="Date field to filter on"
          >
            <option value="startDate">Start date</option>
            <option value="expectedCompletionDate">Expected end</option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set({ dateFrom: e.target.value })}
            aria-label="From date"
            className={selectClass}
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set({ dateTo: e.target.value })}
            aria-label="To date"
            className={selectClass}
          />
        </div>
      </div>

      {/* Row 3 — result summary */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <SlidersHorizontal size={12} className="text-slate-300" />
          Showing <strong className="text-slate-700">{resultCount}</strong> of {totalCount} projects
        </span>
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600"
          >
            <X size={12} />
            Clear filters
          </button>
        )}
      </div>
    </section>
  );
}

export default ProjectFilterBar;
