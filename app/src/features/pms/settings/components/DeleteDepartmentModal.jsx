import React, { useEffect, useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { usePmsStore } from '../../../../stores/pmsStore';

/**
 * DeleteDepartmentModal — removing a department, with its work accounted for.
 *
 * A department holding live stages cannot simply vanish: the stages would keep
 * a name no chart, filter or capacity figure recognises. So the dialog states
 * exactly what it is holding and requires somewhere for that work to go.
 */

const fieldClass =
  'w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';

export function DeleteDepartmentModal({ isOpen, onClose, department = null }) {
  const departments = usePmsStore((s) => s.departments);
  const deleteDepartment = usePmsStore((s) => s.deleteDepartment);
  const getDepartmentUsage = usePmsStore((s) => s.getDepartmentUsage);
  const showToast = usePmsStore((s) => s.showToast);

  const alternatives = departments.filter((d) => d.id !== department?.id);
  const [reassignTo, setReassignTo] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setReassignTo(alternatives[0]?.name ?? '');
    setError(null);
    // alternatives is derived from departments; re-running on open is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, department]);

  if (!department) return null;

  const usage = getDepartmentUsage(department.name);
  const isLast = departments.length <= 1;

  function handleDelete() {
    const result = deleteDepartment(department.id, {
      reassignTo: usage.inUse ? reassignTo : null,
    });

    if (!result.ok) {
      setError(
        result.reason === 'LAST_ONE'
          ? 'At least one department has to remain.'
          : result.reason === 'BAD_TARGET'
            ? 'Choose a department for the existing work.'
            : 'This department is still holding work.'
      );
      return;
    }

    showToast(
      result.reassignedTo
        ? `${department.name} removed — its work moved to ${result.reassignedTo}.`
        : `${department.name} removed.`
    );
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Remove ${department.name}?`}
      subtitle={usage.inUse ? 'This department is holding live work' : 'Not currently in use'}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" type="button" icon={Trash2} onClick={handleDelete} disabled={isLast}>
            {usage.inUse ? 'Reassign & Remove' : 'Remove Department'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {usage.inUse ? (
          <>
            <ul className="text-[11px] text-slate-600 rounded-lg border border-[#dce5f4] bg-[#f6f9ff] px-3 py-2 space-y-1" style={{ listStyle: 'none', margin: 0 }}>
              <li>
                <strong className="text-slate-800 tabular-nums">{usage.stageCount}</strong> stage
                {usage.stageCount === 1 ? '' : 's'} across{' '}
                <strong className="text-slate-800 tabular-nums">{usage.projectCount}</strong> project
                {usage.projectCount === 1 ? '' : 's'}
                {usage.activeStageCount > 0 && (
                  <span className="text-amber-700"> · {usage.activeStageCount} still open</span>
                )}
              </li>
              <li>
                <strong className="text-slate-800 tabular-nums">{usage.openTaskCount}</strong> open task
                {usage.openTaskCount === 1 ? '' : 's'}
              </li>
              <li>
                <strong className="text-slate-800 tabular-nums">{usage.templateCount}</strong> stage template
                {usage.templateCount === 1 ? '' : 's'}
              </li>
            </ul>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5" htmlFor="reassign-to">
                Move that work to
              </label>
              <select
                id="reassign-to"
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
                className={fieldClass}
              >
                {alternatives.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Stages, tasks, delay attribution and stage templates are rewritten to this
                department. History already written to the audit trail keeps the old name.
              </p>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-600">
            Nothing currently references {department.name}, so removing it only takes it out of
            the charts, filters and the department dropdowns.
          </p>
        )}

        {isLast && (
          <p className="flex items-center gap-1 text-[11px] text-rose-600">
            <AlertCircle size={11} /> At least one department has to remain.
          </p>
        )}
        {error && (
          <p className="flex items-center gap-1 text-[11px] text-rose-600">
            <AlertCircle size={11} /> {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

export default DeleteDepartmentModal;
