import React, { useEffect, useMemo, useState } from 'react';
import { Plus, AlertCircle, User, Calendar, Flag, Building2, Percent } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { usePmsStore } from '../../../../stores/pmsStore';

const fieldClass =
  'w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
const labelClass = 'block text-[11px] font-semibold text-slate-600 mb-1.5';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function todayLocalDate(offsetDays = 0) {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function CreateTaskModal({ isOpen, onClose, project, initialStageId = null, onAdded }) {
  const departments = usePmsStore((s) => s.departments);
  const employees = usePmsStore((s) => s.employees);
  const addTask = usePmsStore((s) => s.addTask);
  const showToast = usePmsStore((s) => s.showToast);

  const stages = useMemo(() => {
    return [...(project?.stages ?? [])].sort((a, b) => a.sequence - b.sequence);
  }, [project]);

  const [stageId, setStageId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [weightPct, setWeightPct] = useState(100);
  const [departmentId, setDepartmentId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [startDate, setStartDate] = useState(todayLocalDate(0));
  const [dueDate, setDueDate] = useState(todayLocalDate(3));
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const selectedStage = stages.find((s) => s.id === stageId) ?? null;

  const existingTasksWeight = useMemo(() => {
    return (selectedStage?.tasks ?? []).reduce(
      (sum, t) => sum + (Number(t.weightPct ?? t.weight) || 0),
      0
    );
  }, [selectedStage]);

  function computeDefaultWeight(stage) {
    const tasks = stage?.tasks ?? [];
    if (tasks.length === 0) return 100;
    const existing = tasks.reduce((sum, t) => sum + (Number(t.weightPct ?? t.weight) || 0), 0);
    const rem = Math.max(0, 100 - existing);
    if (rem > 0) return rem;
    return Math.max(5, Math.round(100 / (tasks.length + 1)));
  }

  useEffect(() => {
    if (!isOpen) return;

    // Pick initial stage
    const defaultStage =
      stages.find((s) => s.id === initialStageId) ??
      stages.find((s) => s.status === 'In Progress' || s.status === 'Assigned') ??
      stages.find((s) => s.status !== 'Completed') ??
      stages[0];

    const currentStageId = defaultStage?.id ?? '';
    setStageId(currentStageId);

    // Auto-match department with default stage
    const deptMatch = departments.find(
      (d) => d.name === defaultStage?.department || d.id === defaultStage?.departmentId
    );
    setDepartmentId(deptMatch?.id ?? departments[0]?.id ?? '');

    setTaskName('');
    setDescription('');
    setWeightPct(computeDefaultWeight(defaultStage));
    setAssignedUserId(defaultStage?.assignedUser?.id ?? '');
    setPriority('Medium');
    setStartDate(todayLocalDate(0));
    setDueDate(todayLocalDate(3));
    setShowAllStaff(false);
    setErrors({});
    setIsSaving(false);
  }, [isOpen, initialStageId, stages, departments]);

  // When stage changes, update department, assignee, and suggested weight
  function handleStageChange(newStageId) {
    setStageId(newStageId);
    const target = stages.find((s) => s.id === newStageId);
    if (target) {
      const deptMatch = departments.find(
        (d) => d.name === target.department || d.id === target.departmentId
      );
      if (deptMatch) setDepartmentId(deptMatch.id);
      if (target.assignedUser?.id) setAssignedUserId(target.assignedUser.id);
      setWeightPct(computeDefaultWeight(target));
    }
  }

  // Filter candidates by department if available
  const selectedDeptObj = departments.find((d) => d.id === departmentId);
  const candidates = useMemo(() => {
    if (showAllStaff || !selectedDeptObj) return employees;
    const inDept = employees.filter(
      (e) => e.department === selectedDeptObj.name || e.departmentId === selectedDeptObj.id
    );
    return inDept.length > 0 ? inDept : employees;
  }, [employees, selectedDeptObj, showAllStaff]);

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!stageId) found.stage = 'Select a stage for this task.';
    if (!taskName.trim()) found.taskName = 'Task name is required.';
    const w = Number(weightPct);
    if (!Number.isFinite(w) || w < 0 || w > 100) {
      found.weightPct = 'Task weight must be between 0% and 100%.';
    }
    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      found.dueDate = 'Due date cannot be before start date.';
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const assignedEmp = employees.find((emp) => emp.id === assignedUserId) ?? null;
    const deptObj = departments.find((d) => d.id === departmentId) ?? null;

    const taskPayload = {
      taskName: taskName.trim(),
      description: description.trim() || null,
      assignedUserId: assignedEmp?.id ?? null,
      assignedUser: assignedEmp ? { id: assignedEmp.id, name: assignedEmp.name } : null,
      departmentId: deptObj?.id ?? null,
      department: deptObj?.name ?? selectedStage?.department ?? null,
      weightPct: Number(weightPct) || 0,
      priority,
      status: 'Not Started',
      completionPct: 0,
      startDate: startDate || null,
      dueDate: dueDate || null,
    };

    setIsSaving(true);
    try {
      await addTask(project.id, stageId, taskPayload);
      showToast?.(`Task "${taskName.trim()}" (${weightPct}% weight) added to ${selectedStage?.name ?? 'stage'}.`, 'success');
      onAdded?.(taskPayload);
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to add task.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Task"
      subtitle={`Create an actionable sub-task for ${project?.code || project?.id || 'this project'}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Stage selection */}
        <div>
          <label className={labelClass}>Target Stage *</label>
          <select
            value={stageId}
            onChange={(e) => handleStageChange(e.target.value)}
            className={fieldClass}
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                Stage {s.sequence}: {s.name} ({s.weightPct ?? s.percentage ?? 0}% project weight) · {s.status}
              </option>
            ))}
          </select>
          {errors.stage && <p className="text-[11px] text-rose-500 mt-1">{errors.stage}</p>}
        </div>

        {/* Task Name */}
        <div>
          <label className={labelClass}>Task Name *</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="e.g. Inspect Raw Material Test Certificates"
            className={fieldClass}
            autoFocus
          />
          {errors.taskName && <p className="text-[11px] text-rose-500 mt-1">{errors.taskName}</p>}
        </div>

        {/* Task Weight in Stage */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <label className="text-[11px] font-bold text-slate-700 inline-flex items-center gap-1">
              <Percent size={12} className="text-blue-600" /> Task Weight in Stage (%) *
            </label>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
              Stage Weight: {selectedStage?.weightPct ?? selectedStage?.percentage ?? 0}% of Project
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={weightPct}
              onChange={(e) => setWeightPct(e.target.value === '' ? '' : Math.max(0, Math.min(100, Number(e.target.value))))}
              className={`${fieldClass} max-w-[120px] font-semibold text-blue-800`}
              placeholder="e.g. 50"
            />
            <span className="text-xs text-slate-600">
              % of {selectedStage?.name || 'this stage'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            This task contributes {weightPct || 0}% towards completing {selectedStage?.name || 'the stage'}.
            {existingTasksWeight > 0 && ` (Existing tasks in this stage: ${existingTasksWeight}%)`}
          </p>
          {errors.weightPct && <p className="text-[11px] text-rose-500 mt-1">{errors.weightPct}</p>}
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description / Instructions (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide specific guidelines, acceptance criteria, or checklist steps..."
            rows={2}
            className={fieldClass}
          />
        </div>

        {/* Department & Assignee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} className="text-slate-400" /> Department
              </span>
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-600 inline-flex items-center gap-1">
                <User size={12} className="text-slate-400" /> Assignee
              </label>
              <button
                type="button"
                onClick={() => setShowAllStaff(!showAllStaff)}
                className="text-[10px] text-blue-600 hover:underline"
              >
                {showAllStaff ? 'Filter by Dept' : 'Show All'}
              </button>
            </div>
            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Unassigned</option>
              {candidates.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.role ? `(${emp.role})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority & Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1">
                <Flag size={12} className="text-slate-400" /> Priority
              </span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={fieldClass}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" /> Start Date
              </span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" /> Due Date
              </span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={fieldClass}
            />
            {errors.dueDate && <p className="text-[11px] text-rose-500 mt-1">{errors.dueDate}</p>}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" size="sm" icon={Plus} disabled={isSaving}>
            {isSaving ? 'Adding...' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateTaskModal;
