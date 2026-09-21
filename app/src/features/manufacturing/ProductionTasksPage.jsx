import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  Play,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { usePmsStore } from '../../stores/pmsStore';
import { useManufacturingStore } from '../../stores/manufacturingStore';
import { getManufacturingStatusStyle } from '../../utils/manufacturingUtils';

export default function ProductionTasksPage() {
  const navigate = useNavigate();
  const projects = usePmsStore((s) => s.projects);
  const updateTask = usePmsStore((s) => s.updateTask);

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Extract all production stage tasks across projects
  const allTasks = useMemo(() => {
    const list = [];
    projects.forEach((proj) => {
      (proj.stages || []).forEach((stg) => {
        (stg.tasks || []).forEach((t) => {
          list.push({
            ...t,
            projectId: proj.id,
            projectName: proj.name,
            customerName: proj.customerName,
            stageId: stg.id,
            stageName: stg.name,
            department: stg.department || 'Production',
          });
        });
      });
    });
    return list;
  }, [projects]);

  const filteredTasks = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    const df = (deptFilter || '').toLowerCase().trim();
    const sf = (statusFilter || '').toLowerCase().trim();
    return allTasks.filter((t) => {
      const matchSearch =
        !q ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.projectName || '').toLowerCase().includes(q) ||
        (t.assignedTo || '').toLowerCase().includes(q);

      const matchDept = df === 'all' || (t.department || '').toLowerCase() === df;
      const matchStatus = sf === 'all' || (t.status || '').toLowerCase() === sf;

      return matchSearch && matchDept && matchStatus;
    });
  }, [allTasks, searchTerm, deptFilter, statusFilter]);

  function handleToggleStatus(task) {
    const nextStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
    updateTask(task.projectId, task.stageId, task.id, {
      status: nextStatus,
      completionPct: nextStatus === 'Completed' ? 100 : task.completionPct,
    });
  }

  function handleProgressChange(task, pct) {
    updateTask(task.projectId, task.stageId, task.id, {
      completionPct: pct,
      status: pct === 100 ? 'Completed' : 'In Progress',
    });
  }

  const completedCount = allTasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = allTasks.filter((t) => t.status === 'In Progress').length;
  const pendingCount = allTasks.filter((t) => t.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Work Orders & Stage Tasks"
        subtitle="Manage shopfloor operations, work station assignments, machine job cards, and task completions."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Total Work Orders</span>
          <p className="text-2xl font-bold text-[#0f172a] mt-1">{allTasks.length}</p>
          <span className="text-[11px] text-[#64748b]">Across all active projects</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">In Progress on Floor</span>
          <p className="text-2xl font-bold text-[#eab308] mt-1">{inProgressCount}</p>
          <span className="text-[11px] text-[#64748b]">Active machining & assembly</span>
        </div>

        <div className="bg-white border border-[#dce5f4] rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-[#64748b]">Completed Work Orders</span>
          <p className="text-2xl font-bold text-[#10b981] mt-1">{completedCount}</p>
          <span className="text-[11px] text-[#64748b]">Inspected & passed</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-[#dce5f4] p-4 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search task, project, technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#1f6bff] text-[#0f172a]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#64748b] font-medium">Department:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs border border-[#cbd5e1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1f6bff] text-[#0f172a] bg-white"
            >
              <option value="All">All Departments</option>
              <option value="Fabrication">Fabrication</option>
              <option value="Assembly">Assembly</option>
              <option value="Electrical">Electrical</option>
              <option value="Quality">Quality</option>
              <option value="Design">Design</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#64748b] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-[#cbd5e1] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1f6bff] text-[#0f172a] bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white border border-[#dce5f4] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#dce5f4] font-semibold">
              <tr>
                <th className="py-3 px-4">Work Order / Task</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Stage & Dept</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 min-w-[140px]">Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredTasks.map((t) => {
                const statusStyle = getManufacturingStatusStyle(t.status);
                const isComplete = t.status === 'Completed';
                return (
                  <tr key={`${t.projectId}-${t.id}`} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#0f172a]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isComplete ? 'bg-[#10b981] border-[#10b981] text-white' : 'border-[#cbd5e1] hover:border-[#1f6bff]'
                          }`}
                        >
                          {isComplete && <CheckCircle2 size={12} />}
                        </button>
                        <span className={isComplete ? 'line-through text-[#94a3b8]' : 'text-[#0f172a]'}>
                          {t.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => navigate(`/pms/projects/${t.projectId}`)}
                        className="font-medium text-[#1f6bff] hover:underline cursor-pointer"
                      >
                        {t.projectName}
                      </div>
                      <div className="text-[11px] text-[#64748b]">{t.customerName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="font-semibold text-[#334155]">{t.stageName}</div>
                      <span className="text-[#64748b]">{t.department}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#334155]">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-[#94a3b8]" />
                        {t.assignedTo || 'Unassigned'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={t.completionPct || 0}
                          onChange={(e) => handleProgressChange(t, parseInt(e.target.value, 10))}
                          className="w-24 accent-[#1f6bff] cursor-pointer"
                        />
                        <span className="font-bold text-[11px] text-[#0f172a] w-8">
                          {t.completionPct || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                        style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.color ? `${statusStyle.color}40` : '#e2e8f0' }}
                      >
                        {statusStyle.label || t.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleToggleStatus(t)}
                      >
                        {isComplete ? 'Reopen' : 'Mark Done'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
