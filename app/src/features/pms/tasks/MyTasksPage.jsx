import React, { useMemo, useState, useEffect } from 'react';
import { CalendarClock, Loader, CalendarDays, CheckCircle2, Share2, Plus, Check, X, Ban, ListChecks } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyStatePms } from '../components/EmptyStatePms';
import { usePmsStore, groupMyTasks } from '../../../stores/pmsStore';
import { useAppStore } from '../../../stores/appStore';
import { TaskFilterBar } from './components/TaskFilterBar';
import { TaskCardItem } from './components/TaskCardItem';
import { TaskDetailModal } from './components/TaskDetailModal';
import { PmsToast } from '../components/PmsToast';
import { 
  fetchDelegatedTasks, 
  delegateTask, 
  acceptDelegatedTask, 
  rejectDelegatedTask, 
  completeDelegatedTask 
} from '../../../services/upgradeService';

/**
 * MyTasksPage (/pms/my-tasks) — the individual contributor workbench.
 *
 * Every task assigned to the current user across every project, bucketed by
 * urgency, plus formal peer Delegated Tasks.
 */

const GROUPS = [
  { key: 'dueToday', label: 'Due Today', icon: CalendarClock, tone: '#9a3412' },
  { key: 'inProgress', label: 'In Progress', icon: Loader, tone: '#3730a3' },
  { key: 'upcoming', label: 'Upcoming', icon: CalendarDays, tone: '#0369a1' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, tone: '#065f46' },
];

const EMPTY = { search: '', projectId: 'all', stageName: 'all', priority: 'all', status: 'all' };

export default function MyTasksPage() {
  const projects = usePmsStore((s) => s.projects);
  const currentUserId = usePmsStore((s) => s.currentUserId);
  const employees = usePmsStore((s) => s.employees);
  const updateTask = usePmsStore((s) => s.updateTask);
  const appUser = useAppStore((s) => s.currentUser);

  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'delegated'
  const [filters, setFilters] = useState(EMPTY);
  const [openTask, setOpenTask] = useState(null);

  // Delegated Tasks State
  const [delegatedTasks, setDelegatedTasks] = useState([]);
  const [loadingDelegated, setLoadingDelegated] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [delegateForm, setDelegateForm] = useState({
    title: '',
    description: '',
    delegated_to: '',
    due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    priority: 'Medium',
  });

  const loadDelegated = async () => {
    setLoadingDelegated(true);
    try {
      const res = await fetchDelegatedTasks().catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        setDelegatedTasks(res.data);
      } else if (Array.isArray(res)) {
        setDelegatedTasks(res);
      }
    } catch (err) {
      console.error('Failed to load delegated tasks:', err);
    } finally {
      setLoadingDelegated(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'delegated') {
      loadDelegated();
    }
  }, [activeTab]);

  const handleDelegateSubmit = async (e) => {
    e.preventDefault();
    try {
      await delegateTask(delegateForm);
      setShowDelegateModal(false);
      setDelegateForm({
        title: '',
        description: '',
        delegated_to: '',
        due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        priority: 'Medium',
      });
      loadDelegated();
    } catch (err) {
      alert('Failed to delegate task: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptDelegatedTask(id);
      loadDelegated();
    } catch (err) {
      alert('Failed to accept task: ' + (err.message || 'Unknown error'));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide a reason for rejecting this delegated task:');
    if (!reason) return;
    try {
      await rejectDelegatedTask(id, reason);
      loadDelegated();
    } catch (err) {
      alert('Failed to reject task: ' + (err.message || 'Unknown error'));
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeDelegatedTask(id);
      loadDelegated();
    } catch (err) {
      alert('Failed to complete task: ' + (err.message || 'Unknown error'));
    }
  };

  const currentUser = employees.find((e) => e.id === currentUserId) ?? appUser ?? null;

  // Flatten this user's tasks with the project/stage context each card needs.
  const myTasks = useMemo(
    () =>
      projects.flatMap((p) =>
        (p.stages ?? []).flatMap((stage) =>
          (stage.tasks ?? [])
            .filter((t) => {
              const uid = String(t.assignedUser?.id || '');
              const uname = String(t.assignedUser?.name || '').trim().toLowerCase();
              const myId = String(currentUserId || '');
              const appUserId = String(appUser?.id || '');
              const appUserName = String(appUser?.name || '').trim().toLowerCase();
              return (
                (myId && uid === myId) ||
                (appUserId && uid === appUserId) ||
                (appUserName && uname === appUserName)
              );
            })
            .map((t) => ({
              ...t,
              stageId: stage.id,
              stageName: stage.name,
              department: t.department ?? stage.department,
              projectId: p.id,
              projectCustomer: p.customerName,
            }))
        )
      ),
    [projects, currentUserId, appUser]
  );

  const options = useMemo(() => {
    const byProject = new Map();
    const stageNames = new Set();
    for (const t of myTasks) {
      byProject.set(t.projectId, t.projectCustomer ?? t.projectId);
      if (t.stageName) stageNames.add(t.stageName);
    }
    return {
      projects: [...byProject.entries()].map(([id, label]) => ({ id, label })),
      stageNames: [...stageNames].sort((a, b) => a.localeCompare(b)),
    };
  }, [myTasks]);

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return myTasks.filter((t) => {
      if (q && ![t.taskName, t.projectId, t.stageName, t.projectCustomer]
        .filter(Boolean).join(' ').toLowerCase().includes(q)) return false;
      if (filters.projectId !== 'all' && t.projectId !== filters.projectId) return false;
      if (filters.stageName !== 'all' && t.stageName !== filters.stageName) return false;
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      return true;
    });
  }, [myTasks, filters]);

  const groups = useMemo(() => groupMyTasks(visible), [visible]);

  function handleProgress(task, pct) {
    updateTask(task.projectId, task.stageId, task.id, { completionPct: pct });
  }
  function handleCycle(task, nextStatus) {
    updateTask(task.projectId, task.stageId, task.id, { status: nextStatus });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Tasks & Delegations"
        subtitle={
          currentUser
            ? `Everything assigned to ${currentUser?.name} across all active projects, plus peer task delegations.`
            : 'Your tasks across all active projects and delegated assignments.'
        }
        actions={
          activeTab === 'delegated' && (
            <button
              onClick={() => setShowDelegateModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary-hover transition cursor-pointer"
            >
              <Plus size={14} /> Delegate Task
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'assigned'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListChecks size={14} /> Assigned Project Tasks ({myTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('delegated')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'delegated'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Share2 size={14} /> Peer Delegated Tasks ({delegatedTasks.length})
        </button>
      </div>

      {activeTab === 'assigned' ? (
        <>
          <TaskFilterBar
            filters={filters}
            options={options}
            onChange={setFilters}
            onReset={() => setFilters(EMPTY)}
            resultCount={visible.length}
            totalCount={myTasks.length}
          />

          {myTasks.length === 0 ? (
            <div className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs">
              <EmptyStatePms variant="tasks" />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {GROUPS.map((group) => {
                const items = groups[group.key] ?? [];
                const Icon = group.icon;

                return (
                  <section key={group.key} data-test={`group-${group.key}`}>
                    <header className="flex items-center gap-2 mb-2.5">
                      <Icon size={14} style={{ color: group.tone }} />
                      <h3 className="text-sm font-bold text-slate-800">{group.label}</h3>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${group.tone}1a`, color: group.tone }}
                      >
                        {items.length}
                      </span>
                    </header>

                    {items.length === 0 ? (
                      <p className="text-[11px] text-slate-400 rounded-xl border border-dashed border-[#dce5f4] px-4 py-6 text-center">
                        Nothing here.
                      </p>
                    ) : (
                      <ul className="space-y-2.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {items.map((task) => (
                          <TaskCardItem
                            key={task.id}
                            task={task}
                            onProgress={handleProgress}
                            onCycleStatus={handleCycle}
                            onOpen={setOpenTask}
                          />
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Delegated Tasks Inbox & Outbox */
        <div className="space-y-4">
          {delegatedTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
              {loadingDelegated ? 'Loading delegated tasks...' : 'No delegated tasks found. Click "Delegate Task" to assign a peer responsibility.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {delegatedTasks.map((t) => {
                const isIncoming = t.delegated_to === currentUserId || t.delegated_to_name === currentUser?.name;
                const canAcceptOrReject = isIncoming && t.status === 'Pending Acceptance';
                const canComplete = isIncoming && t.status === 'Accepted';

                return (
                  <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === 'High' ? 'bg-red-50 text-red-700' :
                            t.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t.priority || 'Medium'}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">
                          From: <strong>{t.delegated_by_name || 'Colleague'}</strong> → To: <strong>{t.delegated_to_name || 'You'}</strong>
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.status === 'Accepted' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        t.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    {t.description && (
                      <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg text-xs leading-relaxed">
                        {t.description}
                      </p>
                    )}

                    {t.rejection_reason && (
                      <p className="text-rose-700 bg-rose-50 p-2 rounded-lg text-[11px]">
                        Rejection Reason: {t.rejection_reason}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date'}</span>

                      <div className="flex items-center gap-1.5">
                        {canAcceptOrReject && (
                          <>
                            <button
                              onClick={() => handleReject(t.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold transition"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAccept(t.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold transition"
                            >
                              Accept
                            </button>
                          </>
                        )}
                        {canComplete && (
                          <button
                            onClick={() => handleComplete(t.id)}
                            className="px-3 py-1 bg-primary hover:bg-primary-hover text-white rounded font-semibold transition flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} /> Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delegate Task Modal */}
      {showDelegateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A] flex items-center gap-2">
                <Share2 className="text-primary" size={16} /> Delegate Task to Colleague
              </h3>
              <button onClick={() => setShowDelegateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDelegateSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete wire harness inspection report"
                  value={delegateForm.title}
                  onChange={(e) => setDelegateForm({ ...delegateForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delegatee Colleague *</label>
                <select
                  required
                  value={delegateForm.delegated_to}
                  onChange={(e) => setDelegateForm({ ...delegateForm, delegated_to: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                >
                  <option value="">Select Team Member...</option>
                  {(employees || []).filter(e => e.id !== currentUserId).map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.designation || 'Team'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={delegateForm.due_date}
                    onChange={(e) => setDelegateForm({ ...delegateForm, due_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={delegateForm.priority}
                    onChange={(e) => setDelegateForm({ ...delegateForm, priority: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Instructions / Scope</label>
                <textarea
                  rows={3}
                  placeholder="Specific requirements, files needed, or acceptance criteria..."
                  value={delegateForm.description}
                  onChange={(e) => setDelegateForm({ ...delegateForm, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDelegateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold shadow-xs"
                >
                  Send Delegation Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TaskDetailModal
        isOpen={openTask !== null}
        task={openTask}
        onClose={() => setOpenTask(null)}
      />
      <PmsToast />
    </div>
  );
}
