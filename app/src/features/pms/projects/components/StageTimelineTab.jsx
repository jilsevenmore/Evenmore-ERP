import React, { useState } from 'react';
import { Play, ListChecks, Send, FileText, ShieldCheck, Check, Clock, ArrowRightLeft, Percent, Plus } from 'lucide-react';
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

function StageCard({ stage, config, isLast, isCurrent, onStart, onManageTasks, onSubmit, onHandoff, readOnly }) {
  const timing = getStageTiming(stage);
  const tone = DEPARTMENT_TONES[stage.department] ?? { bg: '#f1f5f9', fg: '#475569' };

  const tasks = stage.tasks ?? [];
  const doneTasks = tasks.filter((t) => t.status === 'Completed').length;

  const plannedHours = Math.round(durationToMs(stage.plannedDuration, stage.durationUnit) / MS_PER_HOUR);
  const plannedLabel = `${stage.plannedDuration} ${stage.durationUnit} (${plannedHours} Hours)`;

  const isDone = stage.status === 'Completed';
  const notStarted = stage.status === 'Not Started';

  // Remaining / overdue ticker
  let ticker = { text: '—', tone: '#64748b' };
  if (isDone) {
    ticker = { text: 'Finished', tone: '#065f46' };
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
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#dce5f4] text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:border-[#dce5f4] disabled:cursor-not-allowed"
            >
              <Play size={12} /> Start Stage
            </button>
            <button
              type="button"
              onClick={() => onManageTasks?.(stage)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#dce5f4] text-slate-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50"
            >
              <ListChecks size={12} /> Manage Tasks
            </button>
            <button
              type="button"
              onClick={() => onSubmit?.(stage)}
              disabled={isDone || notStarted}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#dce5f4] text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:border-[#dce5f4] disabled:cursor-not-allowed"
            >
              <Send size={12} /> Submit Stage
            </button>
            <button
              type="button"
              onClick={() => onHandoff?.(stage)}
              disabled={isDone || notStarted}
              title="Hand off to the next department"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#dce5f4] text-slate-600 hover:text-violet-700 hover:border-violet-300 hover:bg-violet-50 disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:hover:border-[#dce5f4] disabled:cursor-not-allowed"
            >
              <ArrowRightLeft size={12} /> Hand Off
            </button>
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

export function StageTimelineTab({ project, stageConfigs = [], onStart, onManageTasks, onSubmit, onHandoff }) {
  const [isPercentagesOpen, setPercentagesOpen] = useState(false);
  const [isAddDynamicOpen, setAddDynamicOpen] = useState(false);

  const currentUser = useAppStore((s) => s.currentUser);
  const isCreator = isProjectCreator(project, currentUser);

  const ordered = [...(project.stages ?? [])].sort((a, b) => a.sequence - b.sequence);
  const configById = new Map(stageConfigs.map((c) => [c.id, c]));

  const totalWeight = ordered.reduce(
    (acc, s) => acc + (Number(s.percentage ?? s.weightPct ?? s.weight) || 0),
    0
  );

  return (
    <div className="space-y-4">
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
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#dce5f4] bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
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
              onSubmit={onSubmit}
              onHandoff={onHandoff}
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
    </div>
  );
}

export default StageTimelineTab;
