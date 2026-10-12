import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import AssignTaskModal from './AssignTaskModal';
import { useAppStore } from '../../../../stores/appStore';
import { useCrmStore } from '../../../../stores/crmStore';
import { api, ApiError } from '../../../../services/api';
import { crmSync, describeError } from '../../../../services/crmSync';
import {
  useCanManageAllocations,
  updateAllocation,
  formatDeadline,
  formatAuditDate,
  STATUSES,
  EMPLOYEES,
} from './taskAllocationStore';

/** Task Allocation lists lead tasks beside allocations as `lead-task-<id>`. */
const LEAD_TASK_PREFIX = 'lead-task-';
/** A lead task's statuses (`/crm/tasks/`), as opposed to an allocation's. */
const LEAD_TASK_STATUSES = ['Open', 'In Progress', 'Waiting', 'Completed', 'Cancelled'];

/** Read one record from the server and put the fresh copy in the CRM store. */
async function fetchFresh(key, id) {
  const resource = crmSync.registry[key];
  const body = await api.get(`${resource.path}${encodeURIComponent(id)}/`);
  const row = resource.fromApi ? resource.fromApi(body) : body;
  useCrmStore.setState((state) => {
    const rows = state[key] || [];
    const exists = rows.some((r) => String(r.id) === String(row.id));
    return { [key]: exists ? rows.map((r) => (String(r.id) === String(row.id) ? row : r)) : [row, ...rows] };
  });
  return row;
}

function formatCreated(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return formatAuditDate(value);
}

/** A lead task in the shape this page renders an allocation in. */
function leadTaskView(task) {
  const extra = task.extra || {};
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    assignee: task.assigneeName || 'Unassigned',
    assigneeId: task.assigneeId || '',
    assignedBy: task.createdByName || (task.source === 'Created by Lead Stage Automation' ? 'Lead Stage Automation' : '—'),
    department: task.department || '—',
    priority: task.priority || 'Medium',
    deadline: extra.dueAt || task.dueDate || '',
    status: task.status,
    createdAt: task.createdAt || task.created_at,
    leadId: task.leadId,
    leadName: task.leadName || task.lead,
    leadNumber: task.leadNumber,
  };
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="text-[13px] text-slate-700 mt-1">{children}</div>
    </div>
  );
}

/**
 * One detail screen for every row of Task Allocation -- opened by the task
 * name and by the eye icon alike. An allocation (`/crm/task-allocations/`) and
 * a lead task (`/crm/tasks/`) render the same sections; each is re-read from
 * the server on open, and its audit log is the history the server recorded.
 */
export default function TaskAllocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLeadTask = String(id).startsWith(LEAD_TASK_PREFIX);
  const recordId = isLeadTask ? String(id).slice(LEAD_TASK_PREFIX.length) : id;
  const storeKey = isLeadTask ? 'tasks' : 'taskAllocations';

  const record = useCrmStore((s) => (s[storeKey] || []).find((t) => String(t.id) === String(recordId)));
  const canManage = useCanManageAllocations();
  const showToast = useAppStore((s) => s.showToast);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | notFound | error
  const [loadError, setLoadError] = useState('');
  const [history, setHistory] = useState([]);
  const [statusDraft, setStatusDraft] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [reassignTo, setReassignTo] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [busy, setBusy] = useState(''); // 'status' | 'reassign' | 'edit' while a save is in flight

  const task = record ? (isLeadTask ? leadTaskView(record) : record) : null;
  const statuses = isLeadTask ? LEAD_TASK_STATUSES : STATUSES;

  const loadHistory = useCallback(async () => {
    if (!isLeadTask) return;
    try {
      const body = await api.get(`/crm/tasks/${encodeURIComponent(recordId)}/history/`);
      setHistory(body?.results || []);
    } catch {
      setHistory([]);
    }
  }, [isLeadTask, recordId]);

  const load = useCallback(async () => {
    setLoadState('loading');
    setLoadError('');
    try {
      await fetchFresh(storeKey, recordId);
      await loadHistory();
      setLoadState('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setLoadState('notFound');
      } else {
        setLoadError(describeError(err));
        setLoadState('error');
      }
    }
  }, [storeKey, recordId, loadHistory]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (task) {
      setStatusDraft(task.status);
      setReassignTo(task.assigneeId || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, task?.status, task?.assigneeId]);

  // Back keeps the list's search, filters and page (the list restores them).
  function goBack() {
    navigate('/crm/tasks/allocation');
  }

  if (!task && loadState === 'loading') {
    return (
      <section className="w-full max-w-5xl mx-auto py-8 text-center">
        <p className="text-sm text-slate-500">Loading task…</p>
      </section>
    );
  }

  if (!task && (loadState === 'notFound' || loadState === 'ready')) {
    return (
      <section className="w-full max-w-5xl mx-auto py-8 text-center">
        <p className="text-sm font-bold text-slate-800">Task not found</p>
        <p className="text-xs text-slate-500 mt-1">It may have been deleted, or it is not assigned to or by you.</p>
        <button type="button" onClick={goBack} className="mt-3 px-4 py-2 bg-[#1d4a79] text-white text-xs font-semibold rounded-lg">Back to Task Allocation</button>
      </section>
    );
  }

  if (!task && loadState === 'error') {
    return (
      <section className="w-full max-w-5xl mx-auto py-8 text-center">
        <p className="text-sm font-bold text-rose-600">Could not load this task</p>
        <p className="text-xs text-slate-500 mt-1">{loadError}</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button type="button" onClick={load} className="px-4 py-2 bg-[#1d4a79] text-white text-xs font-semibold rounded-lg">Try again</button>
          <button type="button" onClick={goBack} className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg">Back</button>
        </div>
      </section>
    );
  }

  /** One save at a time; the note or reason rides on that change's audit line. */
  async function save(kind, updates, failure) {
    if (busy) return false;
    setBusy(kind);
    try {
      if (isLeadTask) {
        await useCrmStore.getState().updateTask(recordId, updates);
        await fetchFresh('tasks', recordId);
        await loadHistory();
      } else {
        await updateAllocation(recordId, updates);
      }
      return true;
    } catch (err) {
      showToast?.(`${failure} — ${describeError(err)}`);
      return false;
    } finally {
      setBusy('');
    }
  }

  async function handleSaveStatus() {
    if (!statusDraft || statusDraft === task.status) return;
    if (await save('status', { status: statusDraft, note: statusNote.trim() }, 'Status not saved')) {
      setStatusNote('');
      showToast?.('Status updated.');
    }
  }

  async function handleReassign() {
    if (!reassignTo || reassignTo === task.assigneeId) return;
    if (await save('reassign', { assigneeId: reassignTo, note: reassignReason.trim() }, 'Task not reassigned')) {
      setReassignReason('');
      showToast?.('Task reassigned.');
    }
  }

  async function handleEditSubmit(data) {
    setIsEditOpen(false);
    await save('edit', data, 'Task not saved');
  }

  // A lead task is edited where it lives: its lead's Tasks tab.
  function handleEdit() {
    if (isLeadTask) {
      navigate(`/crm/leads/${encodeURIComponent(task.leadId)}`);
      return;
    }
    setIsEditOpen(true);
  }

  const auditLines = isLeadTask ? history : (task.audit || []);

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
          {(canManage || isLeadTask) && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1d4a79] hover:bg-[#163a61] text-white text-xs font-semibold rounded-md transition"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
          <button type="button" onClick={goBack} className="text-[13px] font-medium text-slate-700 hover:text-slate-900">
            Back
          </button>
        </div>
      </div>

      {loadState === 'error' && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Showing the last loaded copy — the latest could not be fetched ({loadError}).{' '}
          <button type="button" onClick={load} className="font-semibold underline">Retry</button>
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
            <h2 className="text-[15px] font-bold text-slate-900">{task.title}</h2>
            <p className="text-[13px] text-slate-400 mt-1">{task.description || 'No description.'}</p>
            {task.fileName && <p className="text-xs text-slate-500 mt-2">File: {task.fileName}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5 mt-6">
              <Field label="Assignee">{task.assignee}</Field>
              <Field label="Assigned By">{task.assignedBy}</Field>
              <Field label="Department">{task.department}</Field>
              <Field label="Priority">{task.priority}</Field>
              <Field label="Deadline">{task.deadline ? formatDeadline(task.deadline) : 'No deadline'}</Field>
              <Field label="Status">{task.status}</Field>
              {task.createdAt && <Field label="Created">{formatCreated(task.createdAt)}</Field>}
              {isLeadTask && task.leadId && (
                <Field label="Related Lead">
                  <Link to={`/crm/leads/${encodeURIComponent(task.leadId)}`} className="text-blue-600 hover:underline font-semibold">
                    {task.leadNumber ? `${task.leadNumber} · ` : ''}{task.leadName || 'Open lead'}
                  </Link>
                </Field>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-slate-900 mb-3">Update Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} disabled={Boolean(busy)} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-blue-400">
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} disabled={Boolean(busy)} placeholder="Note (optional)" className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400" />
              <button type="button" onClick={handleSaveStatus} disabled={Boolean(busy) || statusDraft === task.status} className="px-5 py-2.5 bg-[#1d4a79] hover:bg-[#163a61] text-white text-[13px] font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                {busy === 'status' ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {canManage && (
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-slate-900 mb-3">Reassign</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} disabled={Boolean(busy)} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-blue-400">
                {!task.assigneeId && <option value="">Select employee</option>}
                {EMPLOYEES.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <input value={reassignReason} onChange={(e) => setReassignReason(e.target.value)} disabled={Boolean(busy)} placeholder="Reason (optional)" className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400" />
              <button type="button" onClick={handleReassign} disabled={Boolean(busy) || !reassignTo || reassignTo === task.assigneeId} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#1d4a79] text-[13px] font-medium rounded-lg border border-[#1d4a79] transition disabled:opacity-50 disabled:cursor-not-allowed">
                {busy === 'reassign' ? 'Reassigning…' : 'Reassign'}
              </button>
            </div>
          </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-slate-900 mb-4">Audit Log</h3>
            <div className="relative pl-4 border-l border-slate-200 space-y-5">
              {auditLines.map((a, i) => (
                <div key={a.id || i} className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-white shadow" />
                  <p className="text-[13px] text-slate-700">{a.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatAuditDate(a.at)}</p>
                </div>
              ))}
              {auditLines.length === 0 && <p className="text-xs text-slate-400">No activity yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Keyed so each opening starts from the task as it is now. */}
      {!isLeadTask && (
        <AssignTaskModal key={isEditOpen ? 'open' : 'closed'} isOpen={isEditOpen} initial={task} onClose={() => setIsEditOpen(false)} onSubmit={handleEditSubmit} />
      )}
    </section>
  );
}
