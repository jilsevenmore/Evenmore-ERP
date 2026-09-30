import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import AssignTaskModal from './AssignTaskModal';
import { useAppStore } from '../../../../stores/appStore';
import { describeError } from '../../../../services/crmSync';
import {
  useAllocationTasks,
  useAllocationsLoaded,
  useCanManageAllocations,
  updateAllocation,
  formatDeadline,
  formatAuditDate,
  STATUSES,
  EMPLOYEES,
} from './taskAllocationStore';

export default function TaskAllocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tasks = useAllocationTasks();
  const loaded = useAllocationsLoaded();
  const canManage = useCanManageAllocations();
  const showToast = useAppStore((s) => s.showToast);
  const [statusDraft, setStatusDraft] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [reassignTo, setReassignTo] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const task = tasks.find((t) => String(t.id) === String(id));

  useEffect(() => {
    if (task) {
      setStatusDraft(task.status);
      setReassignTo(task.assigneeId || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, task?.status, task?.assigneeId]);

  if (!task && !loaded) {
    return (
      <section className="w-full max-w-5xl mx-auto py-8 text-center">
        <p className="text-sm text-slate-500">Loading task…</p>
      </section>
    );
  }

  if (!task) {
    return (
      <section className="w-full max-w-5xl mx-auto py-8 text-center">
        <p className="text-sm font-bold text-slate-800">Task not found</p>
        <button type="button" onClick={() => navigate('/crm/tasks/allocation')} className="mt-3 px-4 py-2 bg-[#1d4a79] text-white text-xs font-semibold rounded-lg">Back to Task Allocation</button>
      </section>
    );
  }

  // The server writes each audit line from the change itself; the note or
  // reason typed here is appended to that line.
  async function save(updates, failure) {
    try {
      await updateAllocation(task.id, updates);
      return true;
    } catch (err) {
      showToast?.(`${failure} — ${describeError(err)}`);
      return false;
    }
  }

  async function handleSaveStatus() {
    if (!statusDraft || statusDraft === task.status) return;
    if (await save({ status: statusDraft, note: statusNote.trim() }, 'Status not saved')) setStatusNote('');
  }

  async function handleReassign() {
    if (!reassignTo || reassignTo === task.assigneeId) return;
    if (await save({ assigneeId: reassignTo, note: reassignReason.trim() }, 'Task not reassigned')) setReassignReason('');
  }

  async function handleEditSubmit(data) {
    setIsEditOpen(false);
    await save(data, 'Task not saved');
  }

  return (
    <section className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="min-w-0 lg:min-w-auto">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight break-words">{task.title}</h1>
          <div className="text-xs mt-1 flex flex-wrap lg:flex-nowrap items-center gap-1.5">
            <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
            <span className="text-slate-400">&gt;</span>
            <Link to="/crm/tasks/allocation" className="text-blue-600 hover:underline">Task Allocation</Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">{task.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {canManage && (
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1d4a79] hover:bg-[#163a61] text-white text-xs font-semibold rounded-md transition"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
          <button type="button" onClick={() => navigate('/crm/tasks/allocation')} className="text-[13px] font-medium text-slate-700 hover:text-slate-900">
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
            <h2 className="text-[15px] font-bold text-slate-900">{task.title}</h2>
            <p className="text-[13px] text-slate-400 mt-1">{task.description || 'No description.'}</p>
            {task.fileName && <p className="text-xs text-slate-500 mt-2">File: {task.fileName}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5 mt-6">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Assignee</p>
                <p className="text-[13px] text-slate-700 mt-1">{task.assignee}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Assigned By</p>
                <p className="text-[13px] text-slate-700 mt-1">{task.assignedBy}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Department</p>
                <p className="text-[13px] text-slate-700 mt-1">{task.department}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Priority</p>
                <p className="text-[13px] text-slate-700 mt-1">{task.priority}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Deadline</p>
                <p className="text-[13px] text-slate-700 mt-1">{task.deadline ? formatDeadline(task.deadline) : 'No deadline'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Status</p>
                <p className="text-[13px] text-slate-700 mt-1">{task.status}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-slate-900 mb-3">Update Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-blue-400">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Note (optional)" className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400" />
              <button type="button" onClick={handleSaveStatus} className="px-5 py-2.5 bg-[#1d4a79] hover:bg-[#163a61] text-white text-[13px] font-semibold rounded-lg transition">Save</button>
            </div>
          </div>

          {canManage && (
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-slate-900 mb-3">Reassign</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-blue-400">
                {!task.assigneeId && <option value="">Select employee</option>}
                {EMPLOYEES.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <input value={reassignReason} onChange={(e) => setReassignReason(e.target.value)} placeholder="Reason (optional)" className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400" />
              <button type="button" onClick={handleReassign} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#1d4a79] text-[13px] font-medium rounded-lg border border-[#1d4a79] transition">Reassign</button>
            </div>
          </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-slate-900 mb-4">Audit Log</h3>
            <div className="relative pl-4 border-l border-slate-200 space-y-5">
              {(task.audit || []).map((a, i) => (
                <div key={a.id || i} className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-white shadow" />
                  <p className="text-[13px] text-slate-700">{a.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatAuditDate(a.at)}</p>
                </div>
              ))}
              {(!task.audit || task.audit.length === 0) && <p className="text-xs text-slate-400">No activity yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Keyed so each opening starts from the task as it is now. */}
      <AssignTaskModal key={isEditOpen ? 'open' : 'closed'} isOpen={isEditOpen} initial={task} onClose={() => setIsEditOpen(false)} onSubmit={handleEditSubmit} />
    </section>
  );
}
