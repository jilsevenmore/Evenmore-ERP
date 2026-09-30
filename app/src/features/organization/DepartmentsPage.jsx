import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Badge } from '../../components/hrms/Badge';
import Modal from '../../components/ui/Modal';
import PageInfoButton from '../../components/common/PageInfoButton';
import { hrmsGuides } from '../../data/hrms/hrmsGuides';
import { formatCurrency } from '../../utils/currencyUtils';
import { Building2, Plus, Search, LayoutList, LayoutGrid, Edit2, Trash2 } from 'lucide-react';
import { useOrgCollection, useEmployeeOptions, useConfirmDelete } from './useOrgCollection';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const EMPTY = { name: '', code: '', headEmployeeId: '', parentId: '', budget: '', status: 'Active', description: '' };
const inputCls = 'w-full h-9 px-3.5 bg-off border border-bdr rounded-xl text-xs focus:outline-none focus:border-navy';

function formFor(dept) {
  if (!dept) return EMPTY;
  return {
    name: dept.name || '',
    code: dept.code || '',
    headEmployeeId: dept.headEmployeeId || '',
    parentId: dept.parentId || '',
    budget: dept.budget ?? '',
    status: dept.status || 'Active',
    description: dept.description || '',
  };
}

function budgetText(value) {
  return value === null || value === undefined || value === '' ? '—' : formatCurrency(value);
}

function HeadCell({ dept, small = false }) {
  return (
    <div className="flex items-center gap-2">
      {dept.headAvatar && (
        <img src={dept.headAvatar} alt="" className={`${small ? 'w-6 h-6' : 'w-7 h-7'} rounded-full object-cover`} />
      )}
      <span className="font-medium text-slate-800">{dept.head || '—'}</span>
    </div>
  );
}

export function DepartmentsPage() {
  const showToast = useAppStore((s) => s.showToast);
  const { rows: departments, loading, failed, save, remove } = useOrgCollection('departments', 'Department');
  const employees = useEmployeeOptions();
  const del = useConfirmDelete(remove, showToast, 'Department');
  const [q, setQ] = useState('');
  const [view, setView] = useState('table');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, row = edit
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const term = q.trim().toLowerCase();
  const filtered = departments.filter((d) =>
    !term || [d.name, d.code, d.head].some((v) => String(v ?? '').toLowerCase().includes(term))
  );

  function openForm(dept) {
    setEditing(dept || {});
    setForm(formFor(dept));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const saved = await save(editing?.id, form);
    setSaving(false);
    if (!saved) return;
    showToast(`Department "${form.name.trim()}" ${editing?.id ? 'updated' : 'created'}`);
    setEditing(null);
  }

  const actions = (d) => (
    <div className="flex justify-end gap-1">
      <button type="button" onClick={() => openForm(d)} title="Edit" className="w-8 h-8 rounded-xl hover:bg-off grid place-items-center text-muted transition-colors cursor-pointer">
        <Edit2 size={14} />
      </button>
      <button type="button" onClick={() => del.ask(d)} title="Delete" className="w-8 h-8 rounded-xl hover:bg-red-50 text-muted hover:text-red-600 grid place-items-center transition-colors cursor-pointer">
        <Trash2 size={14} />
      </button>
    </div>
  );

  const emptyText = loading
    ? 'Loading departments…'
    : failed ? 'Couldn’t load departments. Refresh the page to try again.'
    : departments.length === 0 ? 'No departments yet. Add your first department.' : 'No departments match your search.';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold tracking-tight">Departments</h1>
            <PageInfoButton guide={hrmsGuides.departments} />
          </div>
          <p className="text-[13px] text-muted">
            Manage organizational structure, operational units, and leadership
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div className="bg-white border border-bdr rounded-xl p-4 shadow-xs flex flex-wrap justify-between items-center gap-3">
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search department, code or head..."
            className="pl-9 pr-4 h-9 w-full sm:w-64 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
          />
        </div>
        <div className="flex p-1 bg-off border border-bdr rounded-xl">
          {[['table', LayoutList, 'List'], ['grid', LayoutGrid, 'Grid']].map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={`h-8 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                view === mode ? 'bg-white border border-bdr shadow-xs font-semibold text-slate-900' : 'text-muted hover:text-slate-700'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'table' ? (
        <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] lg:min-w-0 text-left">
              <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                <tr>
                  <th className="py-3 px-5">Department</th>
                  <th className="py-3 px-5">Head</th>
                  <th className="py-3 px-5">Teams</th>
                  <th className="py-3 px-5">Employees</th>
                  <th className="py-3 px-5">Open Roles</th>
                  <th className="py-3 px-5">Budget</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bdr/40 text-[13px]">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 px-5 text-center text-muted text-[13px]">{emptyText}</td>
                  </tr>
                )}
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-off/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 size={16} className="text-navy shrink-0" />
                        {d.name}
                      </div>
                      {d.code && <div className="text-[11px] text-muted ml-6">{d.code}</div>}
                    </td>
                    <td className="py-4 px-5"><HeadCell dept={d} /></td>
                    <td className="py-4 px-5 text-slate-700">{d.teams} teams</td>
                    <td className="py-4 px-5 text-slate-700">{d.employees} members</td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-medium">
                        {d.openRoles} open
                      </span>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-700">{budgetText(d.budget)}</td>
                    <td className="py-4 px-5">
                      <Badge tone={d.status === 'Active' ? 'success' : 'warning'}>{d.status}</Badge>
                    </td>
                    <td className="py-4 px-5">{actions(d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-full bg-white border border-bdr rounded-xl p-8 text-center text-muted text-[13px]">{emptyText}</div>
          )}
          {filtered.map((d) => (
            <div key={d.id} className="bg-white border border-bdr rounded-xl p-5 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-[15px] text-slate-900">{d.name}</h3>
                  <Badge tone={d.status === 'Active' ? 'success' : 'warning'}>{d.status}</Badge>
                </div>
                <div className="text-[12.5px] text-muted flex items-center gap-2 mt-2.5">
                  <span>Head:</span> <HeadCell dept={d} small />
                </div>
                <div className="text-[12.5px] text-muted mt-1.5">Budget: <b className="text-slate-800 font-medium">{budgetText(d.budget)}</b></div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-bdr/60 text-[11px]">
                <span className="px-2.5 py-1 bg-off border border-bdr rounded-full text-slate-700 font-medium">{d.teams} teams</span>
                <span className="px-2.5 py-1 bg-off border border-bdr rounded-full text-slate-700 font-medium">{d.employees} employees</span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">{d.openRoles} open roles</span>
                <div className="ml-auto">{actions(d)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Department' : 'Create Department'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input type="text" required placeholder="e.g. Production" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Code</label>
              <input type="text" placeholder="e.g. PRD" value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Department Head</label>
              <select value={form.headEmployeeId} onChange={(e) => setForm({ ...form, headEmployeeId: e.target.value })}
                className={`${inputCls} bg-white`}>
                <option value="">Not assigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}{emp.designation ? ` (${emp.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Parent Department</label>
              <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className={`${inputCls} bg-white`}>
                <option value="">None (top level)</option>
                {departments.filter((d) => d.id !== editing?.id).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Annual Budget</label>
              <input type="number" min="0" step="1" placeholder="e.g. 3500000" value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={`${inputCls} bg-white`}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2 bg-off border border-bdr rounded-xl text-xs focus:outline-none focus:border-navy resize-y" />
          </div>
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-bdr">
            <button type="button" onClick={() => setEditing(null)} className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Department'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal target={del.target} noun="Department" onCancel={del.cancel} onConfirm={del.confirm} />
    </div>
  );
}

export default DepartmentsPage;
