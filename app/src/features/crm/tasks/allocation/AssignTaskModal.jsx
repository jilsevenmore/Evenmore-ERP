import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { DEPARTMENTS, EMPLOYEES, PRIORITIES } from './taskAllocationStore';

const EMPTY = {
  title: '',
  department: 'Any',
  assignee: '',
  priority: 'Medium',
  deadline: '',
  description: '',
  fileName: '',
};

export default function AssignTaskModal({ isOpen, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    title: initial?.title ?? '',
    department: initial?.department ?? 'Any',
    assignee: initial?.assignee ?? '',
    priority: initial?.priority ?? 'Medium',
    deadline: initial?.deadline ? toInputValue(initial.deadline) : '',
    description: initial?.description ?? '',
    fileName: initial?.fileName ?? '',
  }));
  const [error, setError] = useState('');

  const assigneeOptions = useMemo(() => {
    if (!form.department || form.department === 'Any') return EMPLOYEES;
    return EMPLOYEES.filter((e) => e.department === form.department);
  }, [form.department]);

  if (!isOpen) return null;

  function toInputValue(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!form.assignee) {
      setError('Please select an employee.');
      return;
    }
    setError('');
    onSubmit({
      title: form.title.trim(),
      department: form.department === 'Any' ? assigneeDept(form.assignee) : form.department,
      assignee: form.assignee,
      priority: form.priority,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      description: form.description.trim(),
      fileName: form.fileName,
    });
  }

  function assigneeDept(name) {
    return EMPLOYEES.find((e) => e.name === name)?.department ?? 'Sales and Marketing';
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Assign task"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-900">{initial ? 'Edit Task' : 'Assign Task'}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Task Title<span className="text-rose-500">*</span></label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Market Analysis Report"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department</label>
              <select
                value={form.department}
                onChange={(e) => update('department', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Any">Any</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Filters the assignee list below.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assign To<span className="text-rose-500">*</span></label>
              <select
                value={form.assignee}
                onChange={(e) => update('assignee', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select employee</option>
                {assigneeOptions.map((e) => (
                  <option key={e.name} value={e.name}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority<span className="text-rose-500">*</span></label>
              <select
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deadline</label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => update('deadline', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="What needs doing?"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Relevant File</label>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <label className="px-4 py-2.5 bg-slate-50 border-r border-slate-200 text-[13px] font-medium text-slate-600 cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                Choose File
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => update('fileName', e.target.files?.[0]?.name ?? '')}
                />
              </label>
              <span className="px-3.5 py-2.5 text-[13px] text-slate-500 truncate">{form.fileName || 'No file chosen'}</span>
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-500 hover:bg-slate-600 text-white text-[13px] font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1d4a79] hover:bg-[#163a61] text-white text-[13px] font-semibold rounded-lg transition"
            >
              {initial ? 'Save Changes' : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
