import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, RotateCcw, Eye, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import AssignTaskModal from './AssignTaskModal';
import { loadAllocationTasks, saveAllocationTasks, formatDeadline, EMPLOYEES, DEPARTMENTS, STATUSES } from './taskAllocationStore';

function priorityPill(priority) {
  if (priority === 'High') return 'bg-rose-500 text-white';
  if (priority === 'Low') return 'bg-emerald-500 text-white';
  return 'bg-orange-400 text-white';
}

function statusPill(status) {
  if (status === 'Completed') return 'bg-lime-500 text-white';
  if (status === 'In Progress') return 'bg-cyan-500/80 text-white';
  return 'bg-slate-500 text-white';
}

export default function TaskAllocationPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(loadAllocationTasks);
  const [statusFilter, setStatusFilter] = useState('Any');
  const [assigneeFilter, setAssigneeFilter] = useState('Anyone');
  const [deptFilter, setDeptFilter] = useState('Any');
  const [draftStatus, setDraftStatus] = useState('Any');
  const [draftAssignee, setDraftAssignee] = useState('Anyone');
  const [draftDept, setDraftDept] = useState('Any');
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    saveAllocationTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, assigneeFilter, deptFilter, search, perPage]);

  const assigneeOptions = useMemo(() => [...new Set([...EMPLOYEES.map((e) => e.name), ...tasks.map((t) => t.assignee)])], [tasks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = tasks.filter((t) => {
      if (statusFilter !== 'Any' && t.status !== statusFilter) return false;
      if (assigneeFilter !== 'Anyone' && t.assignee !== assigneeFilter) return false;
      if (deptFilter !== 'Any' && t.department !== deptFilter) return false;
      if (q && !`${t.title} ${t.assignee} ${t.assignedBy} ${t.department}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (!sortKey) return out;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...out].sort((a, b) => {
      const av = String(a[sortKey] ?? '').toLowerCase();
      const bv = String(b[sortKey] ?? '').toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [tasks, statusFilter, assigneeFilter, deptFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  function toggleSort(key) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
      return;
    }
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  function sortIcon(key) {
    if (sortKey !== key) return <ChevronsUpDown size={12} className="text-slate-300" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  function applyFilters() {
    setStatusFilter(draftStatus);
    setAssigneeFilter(draftAssignee);
    setDeptFilter(draftDept);
  }

  function resetFilters() {
    setDraftStatus('Any');
    setDraftAssignee('Anyone');
    setDraftDept('Any');
    setStatusFilter('Any');
    setAssigneeFilter('Anyone');
    setDeptFilter('Any');
    setSearch('');
  }

  function handleCreate(data) {
    setTasks((prev) => {
      const now = new Date().toISOString();
      return [
        ...prev,
        {
          id: `ta-${Date.now()}`,
          assignedBy: 'company',
          status: 'Pending',
          audit: [{ text: `company assigned this to ${data.assignee}`, at: now }],
          ...data,
        },
      ];
    });
    setIsModalOpen(false);
  }

  function confirmDelete() {
    if (!deleteId) return;
    setTasks((prev) => prev.filter((t) => t.id !== deleteId));
    setDeleteId(null);
  }

  function openDetail(id) {
    navigate(`/crm/tasks/allocation/${id}`);
  }

  return (
    <section className="w-full max-w-7xl mx-auto py-4 px-1 sm:px-2">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Task Allocation</h1>
          <div className="text-xs mt-1 flex items-center gap-1.5">
            <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Task Allocation</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Assign task"
          className="w-9 h-9 grid place-items-center bg-[#1d3f6e] hover:bg-[#16325a] text-white rounded-md shadow-xs transition"
        >
          <Plus size={17} />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 items-end">
          <div>
            <label className="block text-[13px] font-medium text-slate-600 mb-1.5">Status</label>
            <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-blue-400">
              <option value="Any">Any</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-600 mb-1.5">Assignee</label>
            <select value={draftAssignee} onChange={(e) => setDraftAssignee(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-blue-400">
              <option value="Anyone">Anyone</option>
              {assigneeOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-600 mb-1.5">Department</label>
            <select value={draftDept} onChange={(e) => setDraftDept(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-blue-400">
              <option value="Any">Any</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={applyFilters} aria-label="Search" className="h-[42px] px-5 grid place-items-center bg-[#1d4a79] hover:bg-[#163a61] text-white rounded-lg transition">
            <Search size={16} />
          </button>
          <button type="button" onClick={resetFilters} aria-label="Reset" className="h-[42px] px-4 grid place-items-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none">
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>entries per page</span>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full sm:w-56 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-50/80 border-y border-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                <th className="px-5 py-3">
                  <button type="button" onClick={() => toggleSort('title')} className="inline-flex items-center gap-1.5 hover:text-slate-900">Task {sortIcon('title')}</button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => toggleSort('assignee')} className="inline-flex items-center gap-1.5 hover:text-slate-900">Assignee {sortIcon('assignee')}</button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => toggleSort('assignedBy')} className="inline-flex items-center gap-1.5 hover:text-slate-900">Assigned By {sortIcon('assignedBy')}</button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => toggleSort('priority')} className="inline-flex items-center gap-1.5 hover:text-slate-900">Priority {sortIcon('priority')}</button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => toggleSort('deadline')} className="inline-flex items-center gap-1.5 hover:text-slate-900">Deadline {sortIcon('deadline')}</button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-1.5 hover:text-slate-900">Status {sortIcon('status')}</button>
                </th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5">
                    <button type="button" onClick={() => openDetail(t.id)} className="text-left">
                      <span className="block font-bold text-slate-800 hover:text-blue-700 text-[13px]">{t.title}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">{t.department}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{t.assignee}</td>
                  <td className="px-4 py-3.5 text-slate-600">{t.assignedBy}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${priorityPill(t.priority)}`}>{t.priority}</span>
                  </td>
                  <td className={`px-4 py-3.5 whitespace-nowrap ${t.status === 'Pending' && t.deadline ? 'text-rose-600 font-medium' : t.deadline ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                    {t.deadline ? formatDeadline(t.deadline) : 'No deadline'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusPill(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => openDetail(t.id)} title="View" className="w-8 h-8 grid place-items-center bg-[#3a9ab5] hover:bg-[#2f8299] text-white rounded-md transition">
                        <Eye size={14} />
                      </button>
                      <button type="button" onClick={() => setDeleteId(t.id)} title="Delete" className="w-8 h-8 grid place-items-center bg-rose-600 hover:bg-rose-700 text-white rounded-md transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500 text-[13px]">No tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing {pageItems.length} of {filtered.length} tasks</span>
          <div className="flex items-center gap-1.5">
            <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Prev</button>
            <span className="font-bold text-slate-700">{safePage} / {totalPages}</span>
            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      <AssignTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />

      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[70] p-4" onClick={() => setDeleteId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-900">Delete this task?</h2>
            <p className="text-xs text-slate-500 mt-1">This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button type="button" onClick={() => setDeleteId(null)} className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">Cancel</button>
              <button type="button" onClick={confirmDelete} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
