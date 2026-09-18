import React, { useEffect, useState } from 'react';
import { AlertCircle, Save, Wand2 } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import {
  usePmsStore,
  validateDepartment,
  suggestDepartmentColor,
  colorDistance,
  normaliseHex,
  COLOR_CLASH_DISTANCE,
  DEPARTMENT_COLOR_POOL,
} from '../../../../stores/pmsStore';

/**
 * DepartmentEditorModal — add or rename/recolour one department.
 *
 * The colour is a categorical identity, so the dialog measures the pick against
 * every colour already in play and says so before it is saved, rather than
 * letting two departments end up as two indistinguishable bars on the Gantt.
 */

const fieldClass =
  'w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
const labelClass = 'block text-[11px] font-semibold text-slate-600 mb-1.5';

export function DepartmentEditorModal({ isOpen, onClose, department = null }) {
  const departments = usePmsStore((s) => s.departments);
  const statusColors = usePmsStore((s) => s.statusColors);
  const addDepartment = usePmsStore((s) => s.addDepartment);
  const updateDepartment = usePmsStore((s) => s.updateDepartment);
  const getDepartmentUsage = usePmsStore((s) => s.getDepartmentUsage);
  const showToast = usePmsStore((s) => s.showToast);

  const isEdit = Boolean(department);
  const [draft, setDraft] = useState({ name: '', color: '#2563eb' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setDraft(
      department
        ? { name: department.name, color: department.color }
        : { name: '', color: suggestDepartmentColor(departments, statusColors) }
    );
    setErrors({});
  }, [isOpen, department, departments, statusColors]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  // Nearest colour already in use — the reason a pick would be a bad one.
  const others = [
    ...departments.filter((d) => d.id !== department?.id).map((d) => ({ name: d.name, color: d.color })),
    { name: 'Overdue', color: statusColors.overdue },
  ];
  let nearest = null;
  for (const other of others) {
    const distance = colorDistance(draft.color, other.color);
    if (!nearest || distance < nearest.distance) nearest = { ...other, distance };
  }
  const clashes = nearest && nearest.distance < COLOR_CLASH_DISTANCE;

  const usage = isEdit ? getDepartmentUsage(department.name) : null;
  const willRename = isEdit && draft.name.trim() !== department.name;

  function handleSubmit(e) {
    e.preventDefault();
    const found = validateDepartment(draft, departments, department?.id ?? null);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const result = isEdit
      ? updateDepartment(department.id, draft)
      : addDepartment(draft);

    if (!result.ok) {
      setErrors(result.errors ?? {});
      return;
    }

    showToast(
      isEdit
        ? result.renamed
          ? `Renamed to ${draft.name.trim()} — every stage, task and template followed.`
          : `${draft.name.trim()} recoloured.`
        : `${draft.name.trim()} added.`
    );
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit ${department.name}` : 'Add department'}
      subtitle="Name and chart colour"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={Save} type="submit" form="pms-department-form">
            {isEdit ? 'Save Department' : 'Add Department'}
          </Button>
        </>
      }
    >
      <form id="pms-department-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="dept-name">
            Department name
          </label>
          <input
            id="dept-name"
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Finishing"
            className={fieldClass}
            aria-invalid={Boolean(errors.name)}
            autoFocus
          />
          {errors.name && (
            <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
              <AlertCircle size={11} /> {errors.name}
            </p>
          )}
        </div>

        <div>
          <span className={labelClass}>Chart colour</span>

          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {DEPARTMENT_COLOR_POOL.map((hex) => {
              const selected = normaliseHex(draft.color) === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => set({ color: hex })}
                  aria-label={hex}
                  aria-pressed={selected}
                  title={hex}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: hex,
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    boxShadow: selected ? '0 0 0 2px #fff, 0 0 0 4px #1f6bff' : '0 0 0 1px rgba(15,23,42,.12)',
                  }}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normaliseHex(draft.color) ?? '#2563eb'}
              onChange={(e) => set({ color: e.target.value })}
              aria-label="Pick a custom colour"
              style={{ width: 38, height: 32, borderRadius: 8, border: '1px solid #dce5f4', padding: 2, background: '#fff' }}
            />
            <input
              value={draft.color}
              onChange={(e) => set({ color: e.target.value })}
              aria-label="Colour hex value"
              className={fieldClass}
              style={{ maxWidth: 120 }}
            />
            <Button
              variant="secondary"
              type="button"
              icon={Wand2}
              onClick={() => set({ color: suggestDepartmentColor(departments, statusColors, department?.id ?? null) })}
            >
              Most distinct
            </Button>
          </div>

          {errors.color && (
            <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
              <AlertCircle size={11} /> {errors.color}
            </p>
          )}

          {!errors.color && nearest && (
            <p
              className={`flex items-start gap-1.5 text-[11px] mt-2 rounded-lg px-2.5 py-1.5 ${
                clashes
                  ? 'text-amber-800 bg-amber-50 border border-amber-200'
                  : 'text-slate-500'
              }`}
              data-test="colour-separation"
            >
              {clashes && <AlertCircle size={11} className="shrink-0 mt-0.5" />}
              <span>
                {clashes
                  ? `Hard to tell apart from ${nearest.name} on a Gantt bar (separation ${nearest.distance.toFixed(0)}, under ${COLOR_CLASH_DISTANCE}). Saving is allowed — the chart will just be harder to read.`
                  : `Clearly separable from every other colour in use (nearest: ${nearest.name}).`}
              </span>
            </p>
          )}
        </div>

        {willRename && usage?.inUse && (
          <p className="text-[11px] text-slate-600 bg-[#f6f9ff] border border-[#dce5f4] rounded-lg px-2.5 py-2">
            Renaming moves {usage.stageCount} stage{usage.stageCount === 1 ? '' : 's'}
            {usage.templateCount > 0 && ` and ${usage.templateCount} stage template${usage.templateCount === 1 ? '' : 's'}`}
            {' '}onto the new name, along with its capacity setting and delay attribution.
          </p>
        )}
      </form>
    </Modal>
  );
}

export default DepartmentEditorModal;
