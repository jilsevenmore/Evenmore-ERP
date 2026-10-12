import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
  Building,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePmsStore, computeDepartmentUsage } from '../../../../stores/pmsStore';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';

const CURATED_PALETTE = [
  '#1f6bff', // Brand blue
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#059669', // Emerald (identity only)
  '#8b5cf6', // Purple
  '#6366f1', // Indigo
  '#d946ef', // Fuchsia
  '#0284c7', // Cyan
  '#475569', // Slate
  '#ea580c', // Orange
];

export function DepartmentsTab({ draft, onChange }) {
  const departments = usePmsStore((s) => s.departments);
  const projects = usePmsStore((s) => s.projects);
  const stageConfigs = usePmsStore((s) => s.stageConfigs);
  const addDepartment = usePmsStore((s) => s.addDepartment);
  const updateDepartment = usePmsStore((s) => s.updateDepartment);
  const deleteDepartment = usePmsStore((s) => s.deleteDepartment);
  const showToast = usePmsStore((s) => s.showToast);

  const defaultCapacity = Number(draft.defaultDepartmentCapacity ?? 20);
  const capacities = draft.departmentCapacity || {};

  // Department modal state
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingDept, setEditingDept] = useState(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#1f6bff');
  const [formCapacity, setFormCapacity] = useState(20);
  const [formErrors, setFormErrors] = useState({});

  // Delete modal state
  const [pendingDelete, setPendingDelete] = useState(null);
  const [reassignTarget, setReassignTarget] = useState('');

  // Live workload tasks count per department
  const workloadByDept = useMemo(() => {
    const counts = {};
    for (const p of projects) {
      for (const stage of p.stages ?? []) {
        for (const task of stage.tasks ?? []) {
          if (task.status === 'Completed') continue;
          const dept = task.department ?? stage.department ?? 'Unassigned';
          counts[dept] = (counts[dept] || 0) + 1;
        }
      }
    }
    return counts;
  }, [projects]);

  const handleDefaultCapacityChange = (val) => {
    const num = Math.max(1, Number(val) || 1);
    onChange({ defaultDepartmentCapacity: num });
  };

  const handleDeptCapacityChange = (deptName, val) => {
    const num = Math.max(1, Number(val) || 1);
    onChange({
      departmentCapacity: {
        ...capacities,
        [deptName]: num,
      },
    });
  };

  // Open Add modal
  const openAdd = () => {
    setFormName('');
    setFormColor(CURATED_PALETTE[departments.length % CURATED_PALETTE.length]);
    setFormCapacity(defaultCapacity);
    setFormErrors({});
    setEditingDept(null);
    setModalMode('add');
  };

  // Open Edit modal
  const openEdit = (dept) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormColor(dept.color || '#1f6bff');
    setFormCapacity(capacities[dept.name] ?? defaultCapacity);
    setFormErrors({});
    setModalMode('edit');
  };

  // Submit Add or Edit
  const handleSubmitDept = (e) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormErrors({ name: 'Department name is required.' });
      return;
    }

    if (modalMode === 'add') {
      const res = addDepartment({ name: trimmed, color: formColor });
      if (!res.ok) {
        setFormErrors(res.errors || {});
        return;
      }
      // Update capacity in draft
      onChange({
        departmentCapacity: {
          ...capacities,
          [trimmed]: Number(formCapacity) || defaultCapacity,
        },
      });
      showToast(`Department "${trimmed}" added successfully.`);
      setModalMode(null);
    } else if (modalMode === 'edit' && editingDept) {
      const res = updateDepartment(editingDept.id, { name: trimmed, color: formColor });
      if (!res.ok) {
        setFormErrors(res.errors || {});
        return;
      }
      // If renamed, move capacity key
      const nextCaps = { ...capacities };
      if (trimmed !== editingDept.name) {
        delete nextCaps[editingDept.name];
      }
      nextCaps[trimmed] = Number(formCapacity) || defaultCapacity;
      onChange({ departmentCapacity: nextCaps });
      showToast(`Department "${trimmed}" updated.`);
      setModalMode(null);
    }
  };

  // Open Delete dialog
  const promptDelete = (dept) => {
    const usage = computeDepartmentUsage(projects, stageConfigs, dept.name);
    const availableTargets = departments.filter((d) => d.id !== dept.id);
    setPendingDelete({ dept, usage, availableTargets });
    setReassignTarget(availableTargets[0]?.name || '');
  };

  // Execute Delete
  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    const { dept, usage } = pendingDelete;
    const res = deleteDepartment(dept.id, {
      reassignTo: usage.inUse ? reassignTarget : null,
    });
    if (!res.ok) {
      showToast(res.reason === 'LAST_ONE' ? 'Cannot delete the only remaining department.' : 'Failed to delete department.', 'error');
    } else {
      showToast(`Department "${dept.name}" removed.`);
    }
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Global Default Capacity Card */}
      <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Building size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Standard Department Task Capacity</h3>
              <p className="text-xs text-slate-500">
                Default concurrent open-task ceiling driving the PMS Dashboard workload utilization widget.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label className="text-xs font-semibold text-slate-600">Default Tasks:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={defaultCapacity}
              onChange={(e) => handleDefaultCapacityChange(e.target.value)}
              className="w-20 px-2.5 py-1.5 text-center text-xs font-bold rounded-lg border border-[#dce5f4] bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Department Catalogue & Capacity Matrix */}
      <section className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs overflow-hidden">
        <header className="p-5 border-b border-[#dce5f4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Department Catalogue &amp; Capacity Matrix</h3>
            <p className="text-xs text-slate-500">
              Manage departments, Gantt identity colours, and customized capacity ceilings.
            </p>
          </div>
          <Button icon={Plus} size="sm" onClick={openAdd}>
            Add Department
          </Button>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-[#dce5f4]">
              <tr>
                <th className="py-3 px-4">Department &amp; Identity Colour</th>
                <th className="py-3 px-4">Active Open Tasks</th>
                <th className="py-3 px-4">Configured Capacity</th>
                <th className="py-3 px-4">Workload Utilisation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No departments found. Click "Add Department" to create one.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => {
                  const openTasks = workloadByDept[dept.name] || 0;
                  const cap = capacities[dept.name] ?? defaultCapacity;
                  const utilPct = cap > 0 ? Math.round((openTasks / cap) * 100) : 0;
                  const isHigh = utilPct >= 90;
                  const isMed = utilPct >= 65 && utilPct < 90;

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
                            style={{ backgroundColor: dept.color || '#1f6bff' }}
                          />
                          <span className="font-bold text-slate-800">{dept.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">
                          {openTasks} tasks
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={capacities[dept.name] ?? defaultCapacity}
                            onChange={(e) => handleDeptCapacityChange(dept.name, e.target.value)}
                            className="w-16 px-2 py-1 text-center font-bold text-xs rounded-md border border-[#dce5f4] bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-[11px] text-slate-400">ceiling</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold">
                            <span className={isHigh ? 'text-rose-600' : isMed ? 'text-amber-600' : 'text-emerald-600'}>
                              {utilPct}%
                            </span>
                            <span className="text-slate-400">{openTasks}/{cap}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, utilPct)}%` }}
                              className={`h-full rounded-full transition-all ${
                                isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(dept)}
                            title="Edit department"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDelete(dept)}
                            title="Delete department"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === 'add' ? 'Add New Department' : `Edit Department: ${editingDept?.name}`}
        subtitle="Department names and colours drive stage assignments and workload graphs."
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" type="button" onClick={() => setModalMode(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={handleSubmitDept}>
              {modalMode === 'add' ? 'Create Department' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitDept} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (formErrors.name) setFormErrors({});
              }}
              placeholder="e.g. Electrical Engineering"
              className="w-full px-3 py-2 rounded-lg border border-[#dce5f4] bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            {formErrors.name && (
              <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Identity Colour
            </label>
            <div className="flex items-center gap-3 mb-2">
              <input
                type="color"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="w-9 h-9 p-0.5 rounded-lg border border-[#dce5f4] cursor-pointer"
              />
              <span className="font-mono text-slate-600 font-semibold">{formColor}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CURATED_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setFormColor(hex)}
                  className={`w-6 h-6 rounded-full border border-black/10 transition-transform cursor-pointer ${
                    formColor.toLowerCase() === hex.toLowerCase() ? 'scale-125 ring-2 ring-blue-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Concurrent Task Capacity
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={formCapacity}
              onChange={(e) => setFormCapacity(e.target.value)}
              className="w-32 px-3 py-2 rounded-lg border border-[#dce5f4] bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Maximum concurrent open tasks before utilization turns red (>90%).
            </p>
          </div>
        </form>
      </Modal>

      {/* Delete / Reassign Modal */}
      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={`Delete Department: ${pendingDelete?.dept?.name}?`}
        subtitle="Ensure existing projects and tasks have a valid destination."
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" type="button" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" type="button" onClick={handleConfirmDelete}>
              Confirm Deletion
            </Button>
          </div>
        }
      >
        {pendingDelete && (
          <div className="space-y-4 text-xs text-slate-600">
            {pendingDelete.usage.inUse ? (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle size={15} />
                  <span>This department is driving live work</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Currently associated with <strong>{pendingDelete.usage.projects} projects</strong>,{' '}
                  <strong>{pendingDelete.usage.stages} stages</strong>, and{' '}
                  <strong>{pendingDelete.usage.templates} stage templates</strong>.
                </p>
                <div className="pt-2 border-t border-amber-200/60">
                  <label className="font-bold text-slate-800 block mb-1">
                    Reassign all active work to:
                  </label>
                  <select
                    value={reassignTarget}
                    onChange={(e) => setReassignTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#dce5f4] bg-white text-slate-800 font-semibold"
                  >
                    {pendingDelete.availableTargets.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p>
                This department is not referenced by any running projects or stage templates. It can be safely removed.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DepartmentsTab;
