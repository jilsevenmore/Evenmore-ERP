import { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCrmStore } from '../../../stores/crmStore';
import { getNextStageName } from '../../../services/taskCompletionService';

/** Task statuses still to be worked -- the ones that block "Ready to move on". */
const OPEN_STATUSES = ['Open', 'In Progress', 'Waiting'];

/** The form's three choices, as the `nextAction` the server's complete endpoint reads. */
const CHOICES = {
  another: { nextAction: 'call-again', label: 'Needs another attempt' },
  moveOn: { nextAction: 'move-next-stage', label: 'Ready to move on' },
  finished: { nextAction: 'finish', label: 'Finished with this lead' },
};

/** Tomorrow at 10:00, as a `datetime-local` value. */
function defaultFollowUp() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T10:00`;
}

/** The stage rows in the order the pipeline runs. */
function orderedStages(rows) {
  return (rows || [])
    .slice()
    .sort((a, b) => (Number(a.order ?? a.sequence) || 0) - (Number(b.order ?? b.sequence) || 0));
}

/** The id of `name` among the stage rows, or null. */
function nextStageIdByName(rows, name) {
  if (!name) return null;
  const wanted = String(name).trim().toLowerCase();
  return orderedStages(rows).find((s) => String(s.name || '').trim().toLowerCase() === wanted)?.id ?? null;
}

export default function CompleteTaskModal({ open, task, lead, onCancel, onComplete, onSuccess }) {
  const [note, setNote] = useState('');
  const [choice, setChoice] = useState('another');
  const [followUpAt, setFollowUpAt] = useState(defaultFollowUp);
  const [pickedStageId, setPickedStageId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [phase, setPhase] = useState('form');
  const [warnings, setWarnings] = useState([]);

  const crmTasks = useCrmStore((s) => s.tasks);
  const stageTasks = useCrmStore((s) => s.stageTasks);
  const stages = useCrmStore((s) => s.stages);
  const leads = useCrmStore((s) => s.leads);

  useEffect(() => {
    if (open) {
      setNote('');
      setChoice('another');
      setFollowUpAt(defaultFollowUp());
      setPickedStageId('');
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

  // The lead's stage, the stage after it, and the required tasks of this stage
  // still open -- the server refuses a move while any of those are left.
  const context = useMemo(() => {
    // The lead tab hands over its own row, which points at the CRM task.
    const crmTaskId = task?.crmTaskId || task?.id;
    const crmTask = crmTasks.find((t) => String(t.id) === String(crmTaskId)) || null;
    const leadId = crmTask?.leadId || task?.leadId || lead?.id;
    const leadRow = leads.find((l) => String(l.id) === String(leadId)) || lead || null;
    const stage = stages.find((s) => String(s.id) === String(leadRow?.stageId)) || null;
    const stageName = stage?.name || task?.stage || crmTask?.extra?.stage || leadRow?.status || '-';
    const requiredIds = new Set(
      stageTasks
        .filter((st) => stage && String(st.stageId) === String(stage.id) && st.required)
        .map((st) => String(st.id))
    );
    const blocking = [
      ...new Set(
        crmTasks
          .filter(
            (t) =>
              String(t.leadId) === String(leadId) &&
              String(t.id) !== String(crmTaskId) &&
              OPEN_STATUSES.includes(t.status) &&
              requiredIds.has(String(t.stageTaskId))
          )
          .map((t) => t.title)
      ),
    ];
    const nextStage = getNextStageName(stageName);
    return {
      stageName,
      nextStage,
      nextStageId: nextStageIdByName(stages, nextStage),
      // Every stage the lead could be moved to: the whole pipeline, minus the
      // one it is already in. A lead that skipped ahead or was lost lands
      // somewhere other than the next stage, so the form offers the lot.
      stageOptions: orderedStages(stages).filter(
        (s) => s.isActive !== false && String(s.id) !== String(stage?.id)
      ),
      blocking,
      attempt: Number(crmTask?.extra?.attempt || task?.attempt || task?.attemptNumber || 1),
    };
  }, [task, lead, crmTasks, stageTasks, stages, leads]);

  if (!open) return null;

  const { stageName, nextStage, nextStageId, stageOptions, blocking, attempt } = context;
  const moveOnDisabled = !nextStage || blocking.length > 0;
  /** The stage the lead lands on: the suggested next one until it is changed. */
  const targetStageId = pickedStageId || nextStageId || '';
  const targetStageName = stageOptions.find((s) => String(s.id) === String(targetStageId))?.name
    || nextStage
    || '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (choice === 'another' && !followUpAt) {
      setFormError('Please pick the next follow-up date & time.');
      return;
    }
    if (choice === 'moveOn' && moveOnDisabled) {
      setFormError(blocking.length
        ? `Complete these first: ${blocking.join(', ')}.`
        : 'This lead is already in the last stage.');
      return;
    }
    if (choice === 'moveOn' && !targetStageId) {
      setFormError('Please pick the stage to move the lead to.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    const options = choice === 'another'
      ? { followUpAt }
      : choice === 'finished'
        ? { closeOpenTasks: true }
        // The stage picked in the form, and the date its tasks are due on.
        : { targetStageId, followUpAt };
    try {
      // No outcome dropdown any more: what happened is the note.
      const result = (await onComplete?.(null, CHOICES[choice].nextAction, note.trim(), options)) || {};
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

  const descriptions = {
    another: `Creates attempt ${attempt + 1} in this same stage.`,
    moveOn: targetStageName
      ? `Moves the lead to ${targetStageName} and creates that stage's task.`
      : 'This lead is already in the last stage.',
    finished: 'Closes every open task on it. The lead stays in its current stage.',
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/50 p-2 sm:p-4 backdrop-blur-xs"
      onClick={() => { if (!submitting && phase === 'form') onCancel?.(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Complete Task"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-[15px] font-bold text-slate-900">Complete Task</h2>
          <button
            type="button"
            onClick={() => { if (!submitting && phase === 'form') onCancel?.(); }}
            className="p-1 text-slate-400 hover:text-slate-600"
            aria-label="Close"
            disabled={submitting}
          >
            <X size={18} />
          </button>
        </div>

        {phase === 'success' ? (
          <div className="overflow-y-auto">
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={30} />
              </span>
              <h3 className="mt-4 text-[15px] font-bold text-slate-900">Task completed successfully.</h3>
              <p className="mt-1 text-xs text-slate-500">
                Next: <strong className="text-slate-700">{CHOICES[choice].label}</strong>
              </p>
              {note && (
                <p className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] text-slate-600">
                  {note}
                </p>
              )}
              {warnings.length > 0 && (
                <div className="mt-4 w-full space-y-2 text-left">
                  {warnings.map((warning, index) => (
                    <p key={index} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto">
            <div className="space-y-4 px-5 py-4">
              <div>
                <p className="text-[14px] font-medium text-slate-700">{task?.title || 'Task'}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Attempt {attempt} · Stage: {stageName}
                </p>
              </div>

              <div>
                <label htmlFor="complete-task-note" className="mb-2 block text-[13px] font-semibold text-slate-800">
                  What happened?
                </label>
                <textarea
                  id="complete-task-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Outcome of the call, visit or demo"
                  className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-[#1d6bff]"
                />
              </div>

              <fieldset>
                <legend className="mb-2 block text-[13px] font-semibold text-slate-800">
                  What next?
                </legend>
                <div className="space-y-2.5">
                  {Object.entries(CHOICES).map(([key, option]) => {
                    const disabled = key === 'moveOn' && moveOnDisabled;
                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <input
                          type="radio"
                          name="complete-task-next"
                          value={key}
                          checked={choice === key}
                          disabled={disabled}
                          onChange={() => { setChoice(key); setFormError(''); }}
                          className="mt-1 h-4 w-4 accent-[#1d4a79]"
                        />
                        <span className="min-w-0">
                          <span className={`block text-[13px] font-semibold ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>
                            {option.label}
                          </span>
                          <span className="block text-[11px] text-slate-500">{descriptions[key]}</span>
                          {key === 'moveOn' && blocking.length > 0 && (
                            <span className="block text-[11px] font-medium text-rose-600">
                              Blocked until these are completed: {blocking.join(', ')}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {choice === 'moveOn' && (
                <div>
                  <label htmlFor="complete-task-stage" className="mb-2 block text-[13px] font-semibold text-slate-800">
                    Move to stage
                  </label>
                  <select
                    id="complete-task-stage"
                    value={targetStageId}
                    onChange={(e) => setPickedStageId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[#1d6bff] cursor-pointer"
                  >
                    {stageOptions.map((stage) => (
                      <option key={stage.id} value={stage.id}>{stage.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Leave as suggested unless the lead skipped ahead or was lost.
                  </p>
                </div>
              )}

              {(choice === 'another' || choice === 'moveOn') && (
                <div>
                  <label htmlFor="complete-task-follow-up" className="mb-2 block text-[13px] font-semibold text-slate-800">
                    Next follow-up date &amp; time
                  </label>
                  <input
                    id="complete-task-follow-up"
                    type="datetime-local"
                    value={followUpAt}
                    onChange={(e) => setFollowUpAt(e.target.value)}
                    required
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-[#1d6bff]"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    {choice === 'moveOn'
                      ? 'The next stage task is scheduled for this date and time.'
                      : 'The next attempt is scheduled for this date and time.'}
                  </p>
                </div>
              )}

              {formError && (
                <p className="text-[11px] font-semibold text-rose-600" role="alert">{formError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex h-9 items-center gap-2 px-4 rounded-xl text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
