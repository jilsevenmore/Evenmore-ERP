import { useEffect, useState } from 'react';
import {
  X,
  Phone,
  PhoneMissed,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  PhoneCall,
  CalendarClock,
  Send,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { TASK_OUTCOMES, NEXT_ACTIONS, NEXT_ACTION_LABELS } from '../../../services/taskCompletionService';

const OUTCOME_ICONS = {
  Connected: Phone,
  'No Answer': PhoneMissed,
  Interested: ThumbsUp,
  'Not Interested': ThumbsDown,
  'Follow-up Required': RefreshCw,
};

const NEXT_ACTION_ICONS = {
  'call-again': PhoneCall,
  'schedule-demo': CalendarClock,
  'send-quotation': Send,
  'move-next-stage': ArrowRight,
  finish: CheckCircle2,
};

function OptionCard({ icon: Icon, label, description, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full text-left rounded-xl border p-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
        selected
          ? 'border-[#1d6bff] bg-[#eef4ff] ring-1 ring-[#1d6bff]'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
      }`}
    >
      <span className="flex items-start gap-2.5">
        <span
          className={`w-8 h-8 shrink-0 rounded-lg grid place-items-center transition ${
            selected ? 'bg-[#1d6bff] text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Icon size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-[13px] font-semibold ${selected ? 'text-[#0f3f8f]' : 'text-slate-800'}`}>
            {label}
          </span>
          <span className="block text-[11px] text-slate-500 mt-0.5">{description}</span>
        </span>
        {selected && (
          <span className="w-5 h-5 shrink-0 rounded-full bg-[#1d6bff] text-white grid place-items-center mt-0.5">
            <Check size={12} strokeWidth={3} />
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * CompleteTaskModal — reusable CRM modal for completing a task with:
 *   - Task information summary
 *   - "What Happened?" outcome selection (required)
 *   - "What's Next?" next-action selection (required)
 *   - Complete Task / Cancel footer
 *
 * Props:
 *  - open       {boolean}
 *  - task       {Object} task record (title, owner/assignee, dueDate/dueAt, priority, stage, lead)
 *  - lead       {Object|null} resolved lead
 *  - onCancel   {() => void}
 *  - onComplete {(outcome, nextAction) => Promise<{ok, message, warnings}>}
 *  - onSuccess  {() => void} called after the success screen is shown
 */
export default function CompleteTaskModal({ open, task, lead, onCancel, onComplete, onSuccess }) {
  const [outcome, setOutcome] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [phase, setPhase] = useState('form'); // 'form' | 'success'
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (open) {
      setOutcome('');
      setNextAction('');
      setSubmitting(false);
      setFormError('');
      setPhase('form');
      setWarnings([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape' && phase === 'form') onCancel?.();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, phase, onCancel]);

  if (!open) return null;

  const valid = Boolean(outcome && nextAction);
  const currentStage = task?.stage || lead?.status || '—';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!outcome) {
      setFormError('Please select what happened.');
      return;
    }
    if (!nextAction) {
      setFormError("Please select what's next.");
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const result = (await onComplete?.(outcome, nextAction)) || {};
      if (result.ok === false) {
        setFormError(result.message || 'Could not complete the task.');
        setSubmitting(false);
        return;
      }
      setWarnings(result.warnings || []);
      setPhase('success');
      window.setTimeout(() => onSuccess?.(), 1600);
    } catch (err) {
      setFormError(err?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
      onClick={() => { if (!submitting && phase === 'form') onCancel?.(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Complete Task"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Complete Task</h2>
            <span className="text-[11px] text-slate-400">{task?.id}</span>
          </div>
          <button
            type="button"
            onClick={() => { if (!submitting && phase === 'form') onCancel?.(); }}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Close"
            disabled={submitting}
          >
            <X size={18} />
          </button>
        </div>

        {phase === 'success' ? (
          <div className="overflow-y-auto">
            <div className="px-6 py-10 flex flex-col items-center text-center">
              <span className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 grid place-items-center">
                <CheckCircle2 size={30} />
              </span>
              <h3 className="text-[15px] font-bold text-slate-900 mt-4">Task completed successfully.</h3>
              <p className="text-xs text-slate-500 mt-1">
                Outcome: <strong className="text-slate-700">{outcome}</strong>
                <span className="mx-1">•</span>
                Next: <strong className="text-slate-700">{NEXT_ACTION_LABELS[nextAction] || nextAction}</strong>
              </p>
              {warnings.length > 0 && (
                <div className="w-full mt-4 space-y-2 text-left">
                  {warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-2 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto">
            <div className="px-5 py-4 space-y-4">
              {/* Task information */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">{task?.title}</p>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-2.5 text-[11px]">
                  <div>
                    <dt className="text-slate-400 font-medium">Lead</dt>
                    <dd className="text-slate-700 font-semibold truncate" title={lead?.name || task?.lead}>
                      {lead?.name || task?.lead || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Current Stage</dt>
                    <dd className="text-slate-700 font-semibold">{currentStage}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Assigned</dt>
                    <dd className="text-slate-700 font-semibold">{task?.owner || task?.assignee || lead?.owner || 'Unassigned'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Due Date</dt>
                    <dd className="text-slate-700 font-semibold">{task?.dueDate || task?.dueAt || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Priority</dt>
                    <dd className={`font-semibold ${task?.priority === 'Urgent' ? 'text-rose-600' : task?.priority === 'High' ? 'text-orange-600' : task?.priority === 'Low' ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {task?.priority || '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* What Happened? */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13px] font-semibold text-slate-800" id="outcome-label">
                    What Happened?
                  </label>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 text-slate-500">Required</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TASK_OUTCOMES.map((option) => (
                    <OptionCard
                      key={option.value}
                      icon={OUTCOME_ICONS[option.value] || RefreshCw}
                      label={option.label}
                      description={option.description}
                      selected={outcome === option.value}
                      onSelect={() => setOutcome(option.value)}
                    />
                  ))}
                </div>
                {formError === 'Please select what happened.' && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1.5">{formError}</p>
                )}
              </div>

              {/* What's Next? */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13px] font-semibold text-slate-800" id="next-action-label">
                    What's Next?
                  </label>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 text-slate-500">Required</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {NEXT_ACTIONS.map((option) => (
                    <OptionCard
                      key={option.value}
                      icon={NEXT_ACTION_ICONS[option.value] || ArrowRight}
                      label={option.label}
                      description={option.description}
                      selected={nextAction === option.value}
                      onSelect={() => setNextAction(option.value)}
                    />
                  ))}
                </div>
                {formError === "Please select what's next." && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1.5">{formError}</p>
                )}
              </div>

              {!valid && (
                <p className="text-[11px] text-slate-400 font-medium">
                  Select what happened and what's next to enable Complete Task.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="h-10 px-5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold border border-slate-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!valid || submitting}
                className="h-10 px-5 rounded-lg bg-[#1d6bff] hover:bg-[#1456d9] text-white text-[13px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Complete Task'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}