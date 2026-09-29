import React, { useState } from 'react';
import { CheckCircle2, Circle, Ban, Loader, Plus, Filter, Check } from 'lucide-react';
import { StageStatusBadge } from '../../components/StageStatusBadge';
import { EmptyStatePms } from '../../components/EmptyStatePms';
import { Button } from '../../../../components/ui/Button';

/**
 * StageTasksTab — the stage-wise task checklist.
 *
 * Task progress is the input the store averages into stage completion, which
 * in turn averages into project completion, so editing here moves the gauges
 * everywhere else on the page.
 */

const TASK_TONES = {
  Completed: { icon: CheckCircle2, fg: '#065f46', bg: '#d1fae5' },
  'In Progress': { icon: Loader, fg: '#3730a3', bg: '#e0e7ff' },
  Blocked: { icon: Ban, fg: '#991b1b', bg: '#fee2e2' },
  'Not Started': { icon: Circle, fg: '#64748b', bg: '#f1f5f9' },
};

const PRIORITY_TONES = {
  Urgent: { bg: '#ffe4e6', fg: '#9f1239' },
  High: { bg: '#ffedd5', fg: '#9a3412' },
  Medium: { bg: '#e0f2fe', fg: '#0369a1' },
  Low: { bg: '#f1f5f9', fg: '#475569' },
};

function shortDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function TaskRow({ task, onToggle, readOnly }) {
  const tone = TASK_TONES[task.status] ?? TASK_TONES['Not Started'];
  const Icon = tone.icon;
  const priority = PRIORITY_TONES[task.priority] ?? PRIORITY_TONES.Low;
  const done = task.status === 'Completed';

  return (
    <li className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggle?.(task)}
          disabled={readOnly}
          aria-label={done ? `Reopen ${task.taskName}` : `Complete ${task.taskName}`}
          title={done ? 'Mark as not done' : 'Mark as done'}
          className="shrink-0 mt-0.5 rounded-full p-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95"
          style={{ color: done ? '#059669' : tone.fg }}
        >
          <Icon size={18} strokeWidth={2.2} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {task.taskName}
            </span>
            {Number(task.weightPct ?? task.weight) > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200" title={`Weight: ${task.weightPct ?? task.weight}% of this stage`}>
                {task.weightPct ?? task.weight}% stage weight
              </span>
            )}
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: priority.bg, color: priority.fg }}
            >
              {task.priority}
            </span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: done ? '#d1fae5' : tone.bg, color: done ? '#065f46' : tone.fg }}
            >
              {done ? 'Completed' : task.status}
            </span>
          </div>

          {task.description && (
            <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[10px] text-slate-400">
              {task.assignedUser?.name ?? 'Unassigned'} · due {shortDate(task.dueDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Done Button */}
      <div className="shrink-0 ml-2">
        <button
          type="button"
          onClick={() => onToggle?.(task)}
          disabled={readOnly}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
            done
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
              : 'border border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 shadow-2xs'
          }`}
          title={done ? 'Click to mark as pending' : 'Click to mark task as done (100%)'}
        >
          {done ? (
            <>
              <CheckCircle2 size={14} strokeWidth={2.5} /> Done
            </>
          ) : (
            <>
              <Check size={14} strokeWidth={2.2} /> Done
            </>
          )}
        </button>
      </div>
    </li>
  );
}

export function StageTasksTab({ project, onToggleTask, onTaskProgress, focusStageId, onAddTask }) {
  const [showAllStages, setShowAllStages] = useState(true);
  const ordered = [...(project.stages ?? [])].sort((a, b) => a.sequence - b.sequence);
  const readOnly = project.status === 'Completed';

  const totalTasks = ordered.reduce((sum, s) => sum + (s.tasks?.length ?? 0), 0);
  const completedTasks = ordered.reduce(
    (sum, s) => sum + (s.tasks ?? []).filter((t) => t.status === 'Completed').length,
    0
  );

  const displayedStages = showAllStages
    ? ordered
    : ordered.filter((s) => (s.tasks ?? []).length > 0);

  if (ordered.length === 0) {
    return (
      <div className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs">
        <EmptyStatePms
          variant="stages"
          title="No stages configured"
          description="Configure stages for this project first before adding tasks."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header bar with Add Task button and stats */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#dce5f4] shadow-2xs flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Tasks Checklist</h3>
          <p className="text-xs text-slate-500">
            {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'} across {ordered.length} stages ({completedTasks} completed)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalTasks > 0 && (
            <button
              type="button"
              onClick={() => setShowAllStages(!showAllStages)}
              className="btn-outline btn-sm inline-flex items-center gap-1"
            >
              <Filter size={12} />
              {showAllStages ? 'Stages with tasks only' : 'Show all stages'}
            </button>
          )}

          {!readOnly && (
            <Button
              size="sm"
              icon={Plus}
              onClick={() => onAddTask?.()}
            >
              Add Task
            </Button>
          )}
        </div>
      </div>

      {displayedStages.length === 0 ? (
        <div className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs">
          <EmptyStatePms
            variant="tasks"
            title="No tasks yet"
            description="Tasks appear here once they are added to a stage. You can add a task to any stage."
            action={
              !readOnly && (
                <Button size="sm" icon={Plus} onClick={() => onAddTask?.()}>
                  Add Task
                </Button>
              )
            }
          />
        </div>
      ) : (
        displayedStages.map((stage) => {
          const tasks = stage.tasks ?? [];
          const done = tasks.filter((t) => t.status === 'Completed').length;
          const isFocused = stage.id === focusStageId;

          return (
            <section
              key={stage.id}
              id={`stage-tasks-${stage.id}`}
              className="rounded-xl border bg-white p-5 shadow-2xs transition-all"
              style={{ borderColor: isFocused ? '#3b82f6' : '#dce5f4' }}
            >
              <header className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-slate-100 text-[11px] font-bold text-slate-600 flex items-center justify-center shrink-0">
                    {stage.sequence}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 truncate">{stage.name}</h3>
                  {Number(stage.weightPct ?? stage.percentage) > 0 && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {stage.weightPct ?? stage.percentage}% project weight
                    </span>
                  )}
                  <StageStatusBadge status={stage.status} size="sm" />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {tasks.length > 0
                      ? `${done}/${tasks.length} done · stage ${stage.completionPct}% done`
                      : `Stage progress: ${stage.completionPct}% done`}
                  </span>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => onAddTask?.(stage.id)}
                      className="btn-outline btn-sm inline-flex items-center gap-1"
                      title={`Add a task to ${stage.name}`}
                    >
                      <Plus size={12} /> Add Task
                    </button>
                  )}
                </div>
              </header>

              {tasks.length === 0 ? (
                <div className="py-3 px-4 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-xs text-slate-400">No tasks in this stage yet.</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => onAddTask?.(stage.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <Plus size={12} /> Add Task
                    </button>
                  )}
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      readOnly={readOnly}
                      onToggle={(t) => onToggleTask?.(stage.id, t)}
                      onProgress={(t, pct) => onTaskProgress?.(stage.id, t, pct)}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

export default StageTasksTab;
