import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Layers, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Search,
  User
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { fetchCrossProjectCalendar } from '../../../services/upgradeService';
import { usePmsStore } from '../../../stores/pmsStore';

const calendarGuide = {
  title: 'Cross-Project Task Calendar & Multi-Schedule View',
  subtitle: 'Unified enterprise schedule tracking delivery milestones and workload across all active projects.',
  purpose: 'Provides executive leadership, project managers, and department heads with a unified visual timeline of all task deadlines, active sprints, and stage deliverables across the entire project portfolio.',
  keyTerms: [
    { term: 'Cross-Project Schedule', definition: 'Synchronized view of task milestones regardless of which client project they belong to.' },
    { term: 'Milestone Gate', definition: 'Critical delivery checkpoint that blocks downstream manufacturing or customer signoff.' },
    { term: 'Critical Path', definition: 'Sequential tasks where any delay directly impacts overall project delivery dates.' },
  ],
  tips: [
    'Filter by department or project to isolate workload bottlenecks.',
    'Tasks highlighted in amber/red are nearing or past their commitment dates.',
  ],
  workflow: ['Schedule Tasks across PMS', 'Aggregate Enterprise Timeline', 'Identify Critical Dependencies', 'Adjust Resource Allocation'],
};

export const TaskCalendarPage = () => {
  const storeProjects = usePmsStore((s) => s.projects || []);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadCalendarTasks = async () => {
    setLoading(true);
    try {
      const res = await fetchCrossProjectCalendar().catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        setTasks(res.data);
      } else if (Array.isArray(res)) {
        setTasks(res);
      } else {
        // Fallback to store tasks across all projects
        const fallback = storeProjects.flatMap((p) =>
          (p.stages || []).flatMap((s) =>
            (s.tasks || []).map((t) => ({
              id: t.id,
              task_name: t.taskName || t.name,
              project_id: p.id,
              project_name: p.title || p.name || p.customerName,
              stage_name: s.name,
              assigned_to: t.assignedUser?.name || 'Unassigned',
              status: t.status || 'Not Started',
              due_date: t.dueDate || p.targetDate,
              priority: t.priority || 'Medium',
            }))
          )
        );
        setTasks(fallback);
      }
    } catch (err) {
      console.error('Failed to load cross-project calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarTasks();
  }, [storeProjects]);

  const filteredTasks = tasks.filter((t) => {
    if (selectedProject !== 'ALL' && t.project_id !== selectedProject && t.project_name !== selectedProject) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = (t.task_name || '').toLowerCase().includes(q) ||
                    (t.project_name || '').toLowerCase().includes(q) ||
                    (t.assigned_to || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // KPIs
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress' || t.status === 'In Review').length;
  const criticalCount = tasks.filter((t) => t.priority === 'Critical' || t.priority === 'High').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cross-Project Task Calendar"
        subtitle="Unified enterprise timeline tracking all active sprint deliverables, technician tasks, and stage milestones across all projects."
        guide={calendarGuide}
        actions={
          <Button variant="outline" icon={RefreshCw} onClick={loadCalendarTasks}>
            Refresh Schedule
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Scheduled Tasks"
          value={`${tasks.length} Deliverables`}
          icon={CalendarIcon}
          subtext="Enterprise portfolio backlog"
        />
        <StatCard
          label="In Flight / Active"
          value={`${inProgressCount} Tasks`}
          icon={Clock}
          highlight={inProgressCount > 0}
          trend={{ positive: true, text: 'Under active execution' }}
        />
        <StatCard
          label="High Priority / Critical"
          value={`${criticalCount} Deliverables`}
          icon={AlertTriangle}
          highlight={criticalCount > 0}
          trend={{ positive: false, text: 'Requires milestone focus' }}
        />
        <StatCard
          label="Successfully Completed"
          value={`${completedCount} Tasks`}
          icon={CheckCircle2}
          trend={{ positive: true, text: 'Finished deliverables' }}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search task, project, technician..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-800 w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Filter Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
            >
              <option value="ALL">All Active Projects ({storeProjects.length})</option>
              {storeProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.title || p.name || p.customerName}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="font-mono text-slate-500 font-semibold">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Timeline Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Task Deliverable</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Assigned Member</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    {loading ? 'Loading cross-project schedule...' : 'No tasks match the filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{t.task_name}</td>
                    <td className="py-3 px-4 font-medium text-primary">{t.project_name || 'Project'}</td>
                    <td className="py-3 px-4 text-slate-600">{t.stage_name || 'Stage'}</td>
                    <td className="py-3 px-4 text-slate-700 flex items-center gap-1.5">
                      <User size={13} className="text-slate-400" />
                      <span>{t.assigned_to}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                        t.priority === 'High' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskCalendarPage;
