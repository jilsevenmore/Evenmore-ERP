import React, { useState } from 'react';
import { Play, ListChecks, Send, FileText, ShieldCheck, Check, Clock, ArrowRightLeft, Percent, Plus, MessageSquare, Edit3, AlertTriangle } from 'lucide-react';
import { StageStatusBadge } from '../../components/StageStatusBadge';
import { DynamicProgressBar } from '../../components/DynamicProgressBar';
import { EmptyStatePms } from '../../components/EmptyStatePms';
import {
  getStageTiming,
  formatDuration,
  durationToMs,
  MS_PER_HOUR,
  isProjectCreator,
} from '../../../../stores/pmsStore';
import { useAppStore } from '../../../../stores/appStore';
import { ConfigureStagePercentagesModal } from './ConfigureStagePercentagesModal';
import { AddDynamicStageModal } from './AddDynamicStageModal';
import { EditPlannedDurationModal } from './EditPlannedDurationModal';

/**
 * StageTimelineTab — the sequential, interactive stage pipeline.
 *
 * Every figure in the analytics grid is computed live from the store's timing
 * helpers rather than stored on the stage, so the remaining/overdue tickers
 * stay honest as the clock moves.
 */

const DEPARTMENT_TONES = {
  Design: { bg: '#eef2ff', fg: '#4338ca' },
  Production: { bg: '#eff6ff', fg: '#1d4ed8' },
  Quality: { bg: '#f0fdfa', fg: '#0f766e' },
  Packaging: { bg: '#faf5ff', fg: '#7e22ce' },
  Installation: { bg: '#fff7ed', fg: '#c2410c' },
  Logistics: { bg: '#ecfeff', fg: '#0e7490' },
  Management: { bg: '#fdf2f8', fg: '#be185d' },
  Procurement: { bg: '#f7fee7', fg: '#4d7c0f' },
};

function stamp(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function Metric({ label, value, tone }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] text-slate-400 font-medium">{label}</dt>
      <dd
        className="text-[11px] font-semibold truncate"
        style={{ color: tone ?? '#334155' }}
        title={String(value)}
      >
        {value}
      </dd>
    </div>
  );
}

function GateBadge({ required, satisfied, label, icon: Icon }) {
  if (!required) return null;
  const tone = satisfied
    ? { bg: '#d1fae5', fg: '#065f46' }
    : { bg: '#fef3c7', fg: '#92400e' };
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: tone.bg, color: tone.fg }}
    >
      {satisfied ? <Check size={10} strokeWidth={3} /> : <Icon size={10} strokeWidth={2.5} />}
      {label}
    </span>
  );
}

function StageCard({ stage, config, isLast, isCurrent, onStart, onManageTasks, onAddTask, onSubmit, onHandoff, onChat, chatUnread = 0, readOnly }) {
  const timing = getStageTiming(stage);
  const tone = DEPARTMENT_TONES[stage.department] ?? { bg: '#f1f5f9', fg: '#475569' };

  const tasks = stage.tasks ?? [];
  const doneTasks = tasks.filter((t) => t.status === 'Completed').length;

  const plannedHours = stage.plannedDuration
    ? Math.round(durationToMs(stage.plannedDuration, stage.durationUnit || 'Days') / MS_PER_HOUR)
    : 0;
  const plannedLabel = stage.plannedDuration
    ? `${stage.plannedDuration} ${stage.durationUnit || 'Days'} (${plannedHours} Hours)`
    : '—';

  const isDone = stage.status === 'Completed' || stage.status === 'Approved';
  const isSubmitted = stage.status === 'Submitted';
  const notStarted = stage.status === 'Not Started' || stage.status === 'Assigned';
  const isStarted = stage.status === 'In Progress' || stage.status === 'At Risk' || stage.status === 'Delayed';
  const canSubmit = isStarted && !isDone && !isSubmitted;

  // Remaining / overdue ticker
  let ticker = { text: '—', tone: '#64748b' };
  if (isDone) {
    ticker = { text: 'Finished', tone: '#065f46' };
  } else if (isSubmitted) {
    ticker = { text: 'Submitted', tone: '#7c3aed' };
  } else if (timing.isOverdue) {
    ticker = { text: `+${timing.delayLabel} Overdue`, tone: '#9f1239' };
  } else if (timing.remainingMs > 0) {
    ticker = { text: `${timing.remainingLabel} Remaining`, tone: '#065f46' };
  } else if (notStarted) {
    ticker = { text: 'Not started', tone: '#94a3b8' };
  }

  const hasDocument = (stage.documents ?? []).length > 0;
  const approvalDone = (stage.approvals ?? []).some((a) => a.status === 'Approved');

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast && (
        <span
          aria-hidden="true"
          style={{ position: 'absolute', left: 15, top: 34, bottom: 0, width: 2, background: '#e2e8f0' }}
        />
      )}

      <span
        className="relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2"
        style={
          isDone
            ? { background: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' }
            : isCurrent
              ? { background: '#fff', color: '#1f6bff', borderColor: '#1f6bff' }
              : { background: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' }
        }
      >
        {isDone ? <Check size={14} strokeWidth={3} /> : stage.sequence}
      </span>

      <div
        className="flex-1 min-w-0 rounded-xl border bg-white p-4"
        style={{ borderColor: isCurrent ? '#bfdbfe' : '#e8eef8' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-800 truncate">{stage.name}</h4>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: tone.bg, color: tone.fg }}
              >
                {stage.department}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {stage.percentage ?? stage.weightPct ?? 0}% weight
              </span>
              <StageStatusBadge status={stage.status} size="sm" />
            </div>
            {stage.assignedUser ? (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-500 flex items-center justify-center">
                  {stage.assignedUser.name?.slice(0, 1)}
                </span>
                <span className="text-[11px] text-slate-500">
                  {stage.assignedUser.name}
                  {stage.assignedTeam ? ` · ${stage.assignedTeam}` : ''}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1.5">Unassigned</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <GateBadge
              required={config?.requiredDocument}
              satisfied={hasDocument}
              label={hasDocument ? 'PDF Uploaded' : 'Requires PDF Upload'}
              icon={FileText}
            />
            <GateBadge
              required={config?.requiredApproval}
              satisfied={approvalDone}
              label={approvalDone ? 'Approved' : 'Requires Client Approval'}
              icon={ShieldCheck}
            />
          </div>
        </div>

        {/* Time analytics */}
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 rounded-lg bg-[#f6f9ff] px-3 py-2.5 mb-3">
          <Metric label="Planned Duration" value={plannedLabel} />
          <Metric label="Start Time" value={stamp(stage.startDateTime)} />
          <Metric label="Expected Completion" value={stamp(stage.expectedCompletionDateTime)} />
          <Metric label="Actual Completion" value={stamp(stage.actualCompletionDateTime)} />
          <Metric label="Remaining / Overdue" value={ticker.text} tone={ticker.tone} />
        </dl>

        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <DynamicProgressBar
              value={stage.completionPct}
              status={stage.status}
              timing={timing}
              plannedDuration={stage.plannedDuration}
              durationUnit={stage.durationUnit}
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap shrink-0">
            {tasks.length > 0 ? `${doneTasks}/${tasks.length} tasks done` : 'No tasks'}
          </span>
        </div>

        {/* Delay note */}
        {stage.delayDetails?.isDelayed && stage.delayDetails.reason && (
          <p className="mt-3 text-[11px] text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-2">
            <strong>Delay:</strong> {stage.delayDetails.reason}
            {stage.delayDetails.expectedRecoveryDate && (
              <> · Recovery expected {stamp(stage.delayDetails.expectedRecoveryDate)}</>
            )}
          </p>
        )}

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
            <button
              type="button"
              onClick={() => onStart?.(stage)}
              disabled={!notStarted && stage.status !== 'Assigned'}
              className="btn-outline btn-sm inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={12} /> Start Stage
            </button>
            <button
              type="button"
              onClick={() => onManageTasks?.(stage)}
              className="btn-outline btn-sm inline-flex items-center gap-1.5"
            >
              <ListChecks size={12} /> Manage Tasks
            </button>
            <button
              type="button"
              onClick={() => onAddTask?.(stage)}
              className="btn-outline btn-sm inline-flex items-center gap-1.5"
            >
              <Plus size={12} /> Add Task
            </button>
            <button
              type="button"
              onClick={() => onSubmit?.(stage)}
              disabled={!canSubmit}
              title={
                !isStarted
                  ? 'Start the stage first before submitting'
                  : isSubmitted
                  ? 'Stage already submitted'
                  : isDone
                  ? 'Stage completed'
                  : 'Submit stage (marks all stage tasks as completed)'
              }
              className="btn-outline btn-sm inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={12} /> {isSubmitted ? 'Stage Submitted' : 'Submit Stage'}
            </button>
            <button
              type="button"
              onClick={() => onHandoff?.(stage)}
              disabled={isDone || notStarted}
              title="Hand off to the next department"
              className="btn-outline btn-sm inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowRightLeft size={12} /> Hand Off
            </button>
            {onChat && stage.department && (
              <button
                type="button"
                onClick={() => onChat(stage)}
                title={`Open the ${stage.department} team chat`}
                className="btn-outline btn-sm inline-flex items-center gap-1.5"
              >
                <MessageSquare size={12} /> Chat
                {chatUnread > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                    {chatUnread}
                  </span>
                )}
              </button>
            )}
            {isCurrent && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 ml-auto">
                <Clock size={11} /> Active stage
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function StageTimelineTab({ project, stageConfigs = [], onStart, onManageTasks, onAddTask, onSubmit, onHandoff, onChat, chatUnread = {} }) {
  const [isPercentagesOpen, setPercentagesOpen] = useState(false);
  const [isAddDynamicOpen, setAddDynamicOpen] = useState(false);
  const [isDurationOpen, setDurationOpen] = useState(false);

  const currentUser = useAppStore((s) => s.currentUser);
  const isCreator = isProjectCreator(project, currentUser);
  const canEditDuration = (isCreator || currentUser?.isSuperuser || (project?.projectManager?.id && String(project.projectManager.id) === String(currentUser?.id))) && project.status !== 'Completed';

  const ordered = [...(project.stages ?? [])].sort((a, b) => a.sequence - b.sequence);
  const configById = new Map(stageConfigs.map((c) => [c.id, c]));

  const totalWeight = ordered.reduce(
    (acc, s) => acc + (Number(s.percentage ?? s.weightPct ?? s.weight) || 0),
    0
  );

  const nowMs = Date.now();
  const isDelayed = project.status === 'Delayed';
  const isOverdue = project.expectedCompletionDate && new Date(project.expectedCompletionDate).getTime() < nowMs && project.status !== 'Completed';
  const remainingMs = project.expectedCompletionDate ? new Date(project.expectedCompletionDate).getTime() - nowMs : null;
  const isDueSoon = remainingMs && remainingMs > 0 && remainingMs <= 3 * 24 * 3600 * 1000 && !isDelayed && !isOverdue;

  return (
    <div className="space-y-4">
      {/* Prominent Planned Duration & Timeline Summary Banner */}
      <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border shadow-2xs flex-wrap ${
        isDelayed || isOverdue
          ? 'border-rose-200 bg-gradient-to-r from-rose-50/70 via-white to-slate-50/50'
          : isDueSoon
          ? 'border-amber-200 bg-gradient-to-r from-amber-50/70 via-white to-slate-50/50'
          : 'border-blue-100 bg-gradient-to-r from-blue-50/70 via-white to-slate-50/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs ${
            isDelayed || isOverdue ? 'bg-rose-600' : isDueSoon ? 'bg-amber-600' : 'bg-blue-600'
          }`}>
            {isDelayed || isOverdue ? <AlertTriangle size={20} strokeWidth={2.2} /> : <Clock size={20} strokeWidth={2.2} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                isDelayed || isOverdue ? 'text-rose-700' : isDueSoon ? 'text-amber-700' : 'text-blue-700'
              }`}>
                Planned Duration
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-800">
                {project.durationUnit || 'Days'}
              </span>
              {(isDelayed || isOverdue) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertTriangle size={10} /> Delayed Alert
                </span>
              )}
              {isDueSoon && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock size={10} /> Deadline Near
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-slate-800">
                {project.plannedDuration ? `${project.plannedDuration} ${project.durationUnit || 'Days'}` : 'Not Configured'}
              </span>
              {project.startDate && (
                <span className="text-xs text-slate-500 font-medium">
                  · Start: {stamp(project.startDate)}
                </span>
              )}
              {project.expectedCompletionDate && (
                <span className="text-xs text-slate-500 font-medium">
                  · Expected End: {stamp(project.expectedCompletionDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {canEditDuration && (
          <button
            type="button"
            onClick={() => setDurationOpen(true)}
            className="btn-outline btn-sm inline-flex items-center gap-1.5 bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:text-blue-600 shadow-2xs"
            title="Edit Planned Duration for this project"
          >
            <Edit3 size={13} /> Edit Planned Duration
          </button>
        )}
      </div>

      {/* Top action toolbar for stage management */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Project Stage Pipeline</span>
          {ordered.length > 0 && (
            <span className="text-[11px] text-slate-400">
              ({ordered.length} stages · {Math.round(totalWeight * 100) / 100}% total weight)
            </span>
          )}
        </div>

        {isCreator && project.status !== 'Completed' && (
          <div className="flex items-center gap-2">
            {ordered.length > 0 && (
              <button
                type="button"
                onClick={() => setPercentagesOpen(true)}
                className="btn-outline inline-flex items-center gap-1.5"
                title="Configure stage percentage weights"
              >
                <Percent size={13} /> Stage Weights
              </button>
            )}
            <button
              type="button"
              onClick={() => setAddDynamicOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-2xs"
              title="Add a dynamic stage to this project"
            >
              <Plus size={13} /> Add Dynamic Stage
            </button>
          </div>
        )}
      </div>

      {ordered.length === 0 ? (
        <div className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs">
          <EmptyStatePms
            variant="stages"
            title="No stages configured"
            description="This project has no stage pipeline yet. Add a dynamic stage to get started."
            action={
              isCreator && project.status !== 'Completed' ? (
                <button
                  type="button"
                  onClick={() => setAddDynamicOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus size={13} /> Add Dynamic Stage
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {ordered.map((stage, idx) => (
            <StageCard
              key={stage.id}
              stage={stage}
              config={configById.get(stage.stageConfigId)}
              isLast={idx === ordered.length - 1}
              isCurrent={stage.id === project.currentStageId}
              readOnly={project.status === 'Completed'}
              onStart={onStart}
              onManageTasks={onManageTasks}
              onAddTask={onAddTask}
              onSubmit={onSubmit}
              onHandoff={onHandoff}
              onChat={onChat}
              chatUnread={chatUnread[stage.department] ?? 0}
            />
          ))}
        </ol>
      )}

      <ConfigureStagePercentagesModal
        isOpen={isPercentagesOpen}
        project={project}
        onClose={() => setPercentagesOpen(false)}
      />

      <AddDynamicStageModal
        isOpen={isAddDynamicOpen}
        project={project}
        onClose={() => setAddDynamicOpen(false)}
      />

      <EditPlannedDurationModal
        isOpen={isDurationOpen}
        project={project}
        onClose={() => setDurationOpen(false)}
      />
    </div>
  );
}

export default StageTimelineTab;
