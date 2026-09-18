import React, { useMemo, useState } from 'react';
import { Layers, Plus, Pencil, Trash2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { usePmsStore, findColorClashes, normaliseHex } from '../../../../stores/pmsStore';
import { DepartmentEditorModal } from './DepartmentEditorModal';
import { DeleteDepartmentModal } from './DeleteDepartmentModal';

/**
 * DepartmentDirectorySettings — the department catalogue behind every chart.
 *
 * What this card holds is exactly what the timeline legend renders, so it shows
 * the legend as it will appear rather than describing it. Overdue sits in the
 * same preview but is a reserved state, not an identity: recolourable, never
 * renamed or removed, and always carrying its hatch so the warning is never on
 * colour alone.
 *
 * These edits commit immediately (a rename has to carry live stages with it),
 * which is why the card stands apart from the drafted settings around it.
 */

export function DepartmentDirectorySettings() {
  const departments = usePmsStore((s) => s.departments);
  const statusColors = usePmsStore((s) => s.statusColors);
  const projects = usePmsStore((s) => s.projects);
  const stageConfigs = usePmsStore((s) => s.stageConfigs);
  const setStatusColor = usePmsStore((s) => s.setStatusColor);
  const resetDepartments = usePmsStore((s) => s.resetDepartments);
  const showToast = usePmsStore((s) => s.showToast);

  const [editing, setEditing] = useState(null); // department | 'new'
  const [deleting, setDeleting] = useState(null);
  const [resetError, setResetError] = useState(null);

  const clashes = useMemo(
    () => findColorClashes(departments, statusColors),
    [departments, statusColors]
  );

  // Stage and template counts per department, so a row says what it is holding.
  const usage = useMemo(() => {
    const counts = {};
    const bump = (name, key) => {
      if (!name) return;
      counts[name] = counts[name] ?? { stages: 0, templates: 0 };
      counts[name][key] += 1;
    };
    for (const c of stageConfigs) bump(c.department, 'templates');
    for (const p of projects) for (const stage of p.stages ?? []) bump(stage.department, 'stages');
    return counts;
  }, [projects, stageConfigs]);

  function handleReset() {
    const result = resetDepartments();
    if (!result.ok) {
      setResetError(
        `${result.stranded.join(', ')} still hold${result.stranded.length === 1 ? 's' : ''} live work — reassign or remove ${result.stranded.length === 1 ? 'it' : 'them'} first.`
      );
      return;
    }
    setResetError(null);
    showToast('Default departments and colours restored.');
  }

  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs lg:col-span-2">
      <header className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800">Departments &amp; Chart Colours</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleReset}>
            Restore Defaults
          </Button>
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add Department
          </Button>
        </div>
      </header>
      <p className="text-[11px] text-slate-500 mb-4">
        The list every stage, filter and chart works from. Each colour is the department&apos;s
        identity on the timeline and the pipeline — edits apply immediately, including to work
        already in flight.
      </p>

      {/* The timeline legend, exactly as it will render. */}
      <div
        className="rounded-lg border border-[#dce5f4] bg-[#f6f9ff] px-3 py-2.5 mb-4"
        data-test="legend-preview"
      >
        <span className="block text-[10px] font-semibold text-slate-500 mb-2">
          Timeline legend preview
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {departments.map((dept) => (
            <span key={dept.id} className="inline-flex items-center gap-1.5 text-[10px] text-slate-600">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: normaliseHex(dept.color) ?? '#94a3b8',
                }}
              />
              {dept.name}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-600">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: statusColors.overdue,
                backgroundImage:
                  'repeating-linear-gradient(45deg, rgba(255,255,255,.55) 0 2px, transparent 2px 4px)',
              }}
            />
            Overdue
          </span>
        </div>
      </div>

      <ul
        className="rounded-lg border border-[#dce5f4] divide-y divide-slate-100"
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        {departments.map((dept) => {
          const clash = clashes[dept.id];
          const counts = usage[dept.name] ?? { stages: 0, templates: 0 };

          return (
            <li key={dept.id} className="flex items-center gap-3 px-3 py-2">
              <span
                className="shrink-0"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: normaliseHex(dept.color) ?? '#94a3b8',
                  boxShadow: '0 0 0 1px rgba(15,23,42,.1)',
                }}
              />

              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold text-slate-700 truncate">
                  {dept.name}
                </span>
                <span className="block text-[10px] text-slate-400 truncate">
                  {counts.stages} stage{counts.stages === 1 ? '' : 's'} · {counts.templates} template
                  {counts.templates === 1 ? '' : 's'} · {normaliseHex(dept.color) ?? dept.color}
                </span>
              </span>

              {clash && (
                <span
                  className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0"
                  title={`Perceptual separation ${clash.distance} — under 10 these read as the same colour on a thin bar.`}
                >
                  <AlertCircle size={10} /> Close to {clash.with}
                </span>
              )}

              <span className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditing(dept)}
                  aria-label={`Edit ${dept.name}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(dept)}
                  aria-label={`Remove ${dept.name}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </li>
          );
        })}

        {/* Reserved state — recolour only. */}
        <li className="flex items-center gap-3 px-3 py-2 bg-slate-50/60">
          <span
            className="shrink-0"
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: statusColors.overdue,
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,.55) 0 2px, transparent 2px 4px)',
              boxShadow: '0 0 0 1px rgba(15,23,42,.1)',
            }}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-slate-700">
              Overdue <span className="font-medium text-slate-400">· reserved state</span>
            </span>
            <span className="block text-[10px] text-slate-400">
              Derived from the dates, not assignable. Always drawn with a hatch so the warning
              never rests on colour alone.
            </span>
          </span>
          <input
            type="color"
            value={statusColors.overdue}
            onChange={(e) => setStatusColor('overdue', e.target.value)}
            aria-label="Overdue colour"
            className="shrink-0"
            style={{ width: 34, height: 28, borderRadius: 8, border: '1px solid #dce5f4', padding: 2, background: '#fff' }}
          />
        </li>
      </ul>

      {resetError && (
        <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-2">
          <AlertCircle size={11} /> {resetError}
        </p>
      )}

      <p className="text-[10px] text-slate-400 mt-2.5">
        Renaming a department carries its stages, tasks, delay attribution, templates and capacity
        setting with it. Removing one asks where its work should go.
      </p>

      <DepartmentEditorModal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        department={editing === 'new' ? null : editing}
      />
      <DeleteDepartmentModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        department={deleting}
      />
    </section>
  );
}

export default DepartmentDirectorySettings;
