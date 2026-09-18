import React from 'react';
import { Users, AlertCircle } from 'lucide-react';
import { usePmsStore, normaliseHex } from '../../../../stores/pmsStore';

/**
 * DepartmentCapacitySettings — the denominator behind every utilisation figure.
 *
 * These numbers are what the dashboard's workload cards and the Department
 * Capacity report divide open tasks by, so a department left at the default is
 * shown as such rather than silently inheriting a number nobody chose.
 */

const labelClass = 'block text-[11px] font-semibold text-slate-600 mb-1.5';
const fieldClass =
  'w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';

export function DepartmentCapacitySettings({ draft, errors, onChange, load = {} }) {
  const departments = usePmsStore((s) => s.departments);
  const capacities = draft.departmentCapacity ?? {};
  const fallback = draft.defaultDepartmentCapacity;

  const setCapacity = (dept, value) =>
    onChange({ departmentCapacity: { ...capacities, [dept]: value } });

  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs">
      <header className="flex items-center gap-2 mb-1">
        <Users size={14} className="text-slate-400" />
        <h3 className="text-sm font-bold text-slate-800">Department Capacity</h3>
      </header>
      <p className="text-[11px] text-slate-500 mb-4">
        Concurrent open tasks each department can absorb — the denominator for every
        utilisation figure on the dashboard and reports.
      </p>

      <div className="mb-4">
        <label className={labelClass} htmlFor="capacity-default">
          Default for unconfigured departments
        </label>
        <input
          id="capacity-default"
          type="number"
          min={1}
          value={fallback}
          onChange={(e) => onChange({ defaultDepartmentCapacity: e.target.value })}
          className={fieldClass}
          style={{ maxWidth: 140 }}
        />
        {errors.defaultDepartmentCapacity && (
          <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
            <AlertCircle size={11} /> {errors.defaultDepartmentCapacity}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-[#dce5f4] divide-y divide-slate-100">
        {departments.map(({ id, name: dept, color }) => {
          const configured = capacities[dept] !== undefined;
          const value = configured ? capacities[dept] : '';
          const open = load[dept] ?? 0;
          const effective = Number(configured ? capacities[dept] : fallback) || 1;
          const pct = Math.round((open / effective) * 100);
          const err = errors[`capacity.${dept}`];

          return (
            <div key={id} className="flex items-center gap-3 px-3 py-2">
              <span
                className="shrink-0"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: normaliseHex(color) ?? '#94a3b8',
                }}
              />
              <span className="text-[11px] font-semibold text-slate-700 flex-1 min-w-0 truncate">
                {dept}
              </span>

              <span className="text-[10px] text-slate-400 tabular-nums shrink-0" title="Open tasks now">
                {open} open
              </span>

              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums"
                style={
                  pct >= 90
                    ? { background: '#ffe4e6', color: '#9f1239' }
                    : pct >= 65
                      ? { background: '#fef3c7', color: '#92400e' }
                      : { background: '#d1fae5', color: '#065f46' }
                }
              >
                {pct}%
              </span>

              <input
                type="number"
                min={1}
                value={value}
                placeholder={String(fallback)}
                onChange={(e) =>
                  setCapacity(dept, e.target.value === '' ? undefined : e.target.value)
                }
                aria-label={`${dept} capacity`}
                aria-invalid={Boolean(err)}
                className={fieldClass + ' shrink-0'}
                style={{ width: 84 }}
              />
            </div>
          );
        })}
      </div>

      {Object.keys(errors).some((k) => k.startsWith('capacity.')) && (
        <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-2">
          <AlertCircle size={11} />
          {Object.entries(errors).find(([k]) => k.startsWith('capacity.'))[1]}
        </p>
      )}

      <p className="text-[10px] text-slate-400 mt-2.5">
        Leave a field blank to use the default. Percentages show current load against the
        capacity as it would be after saving.
      </p>
    </section>
  );
}

export default DepartmentCapacitySettings;
