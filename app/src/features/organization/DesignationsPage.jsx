import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import Modal from '../../components/ui/Modal';
import PageInfoButton from '../../components/common/PageInfoButton';
import { hrmsGuides } from '../../data/hrms/hrmsGuides';
import { Plus, Award, Search, Edit2, Trash2 } from 'lucide-react';
import { useOrgCollection, useConfirmDelete } from './useOrgCollection';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const LEVELS = [
  ['L1', 'Associate'],
  ['L2', 'Junior'],
  ['L3', 'Mid-Level'],
  ['L4', 'Senior'],
  ['L5', 'Staff / Lead'],
  ['L6', 'Director / Head'],
  ['L7', 'Executive'],
];
const EMPTY = { title: '', level: 'L4', departmentId: '' };
const inputCls = 'w-full h-9 px-3.5 bg-white border border-bdr rounded-xl text-xs focus:outline-none focus:border-navy';

function levelStyle(level) {
  if (level === 'L7' || level === 'L6') return 'bg-navy text-white border-navy';
  if (level === 'L5') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-off border-bdr text-slate-700';
}

export function DesignationsPage() {
  const showToast = useAppStore((s) => s.showToast);
  const { rows: designations, loading, failed, save, remove } = useOrgCollection('designations', 'Designation');
  const { rows: departments } = useOrgCollection('departments', 'Department');
  const del = useConfirmDelete(remove, showToast, 'Designation');
  const [q, setQ] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const term = q.trim().toLowerCase();
  const filtered = designations.filter((d) =>
    (!deptFilter || String(d.departmentId) === deptFilter) &&
    (!term || [d.title, d.department, d.level].some((v) => String(v ?? '').toLowerCase().includes(term)))
  );

  function openForm(row) {
    setEditing(row || {});
    setForm(row ? { title: row.title, level: row.level || '', departmentId: row.departmentId || '' } : EMPTY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || saving) return;
    setSaving(true);
    const saved = await save(editing?.id, { title: form.title, level: form.level || null, departmentId: form.departmentId });
    setSaving(false);
    if (!saved) return;
    showToast(`Designation "${form.title.trim()}" ${editing?.id ? 'updated' : 'created'}`);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold tracking-tight">Designations</h1>
            <PageInfoButton guide={hrmsGuides.designations} />
          </div>
          <p className="text-[13px] text-muted">
            Define job roles, the leveling framework, and which department each belongs to
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} /> Add Designation
        </button>
      </div>

      <div className="bg-white border border-bdr rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, level, or department..."
            className="pl-9 pr-4 h-9 w-full sm:w-72 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
          />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px] w-full sm:w-auto" aria-label="Department filter">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] lg:min-w-0 text-left">
            <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
              <tr>
                <th className="py-3 px-5">Job Title</th>
                <th className="py-3 px-5">Level</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Assigned Employees</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdr/40 text-[13px]">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 px-5 text-center text-muted text-[13px]">
                    {loading
                      ? 'Loading designations…'
                      : failed ? 'Couldn’t load designations. Refresh the page to try again.'
                      : designations.length === 0 ? 'No designations yet. Add your first designation.' : 'No designations match your filters.'}
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-off/60 transition-colors">
                  <td className="py-4 px-5 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Award size={15} className="text-navy shrink-0" />
                      {r.title}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {r.level ? (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${levelStyle(r.level)}`}>{r.level}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-slate-700">{r.department || '—'}</td>
                  <td className="py-4 px-5 font-medium text-slate-700">{r.employees} members</td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openForm(r)} className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted transition-colors cursor-pointer" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button type="button" onClick={() => del.ask({ id: r.id, name: r.title })} className="w-8 h-8 rounded-xl hover:bg-red-50 text-muted hover:text-red-600 grid place-items-center transition-colors cursor-pointer" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Designation' : 'Create Designation'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Designation Title <span className="text-red-500">*</span>
            </label>
            <input type="text" required placeholder="e.g. Production Supervisor" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full h-9 px-3.5 bg-off border border-bdr rounded-xl text-xs focus:outline-none focus:border-navy" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Level Framework</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputCls}>
                <option value="">No level</option>
                {LEVELS.map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Department</label>
              <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className={inputCls}>
                <option value="">Any department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-bdr">
            <button type="button" onClick={() => setEditing(null)} className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Designation'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal target={del.target} noun="Designation" onCancel={del.cancel} onConfirm={del.confirm} />
    </div>
  );
}

export default DesignationsPage;
