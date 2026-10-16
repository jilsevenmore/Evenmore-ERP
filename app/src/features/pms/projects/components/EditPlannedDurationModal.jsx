import React, { useEffect, useState, useMemo } from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { usePmsStore } from '../../../../stores/pmsStore';
import * as pmsApi from '../../../../services/pmsSync';
import { StageStatusBadge } from '../../components/StageStatusBadge';

function formatExpectedDate(d) {
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function EditPlannedDurationModal({ isOpen, onClose, project }) {
  const updateProject = usePmsStore((s) => s.updateProject);
  const showToast = usePmsStore((s) => s.showToast);

  const [stageDurations, setStageDurations] = useState({});
  const [stageDurationUnits, setStageDurationUnits] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const stages = useMemo(() => {
    return [...(project?.stages || [])].sort((a, b) => a.sequence - b.sequence);
  }, [project]);

  useEffect(() => {
    if (!isOpen || !project) return;
    const durMap = {};
    const unitMap = {};
    for (const s of project.stages || []) {
      durMap[s.id] = s.plannedDuration !== undefined && s.plannedDuration !== null ? s.plannedDuration : 1;
      unitMap[s.id] = s.durationUnit || 'Days';
    }
    setStageDurations(durMap);
    setStageDurationUnits(unitMap);
    setError('');
    setIsSaving(false);
  }, [isOpen, project]);

  const { totalPlannedDays, finalExpectedCompletionDate } = useMemo(() => {
    let days = 0;
    if (stages.length > 0) {
      for (const s of stages) {
        const val = stageDurations[s.id] !== undefined ? stageDurations[s.id] : s.plannedDuration;
        const dur = Number(val) || 0;
        const unit = stageDurationUnits[s.id] || s.durationUnit || 'Days';
        days += unit === 'Hours' ? dur / 24 : dur;
      }
    } else {
      const dur = Number(project?.plannedDuration) || 0;
      const unit = project?.durationUnit || 'Days';
      days = unit === 'Hours' ? dur / 24 : dur;
    }
    const roundedDays = Math.round(days * 100) / 100;
    let expected = null;
    if (project?.startDate) {
      const dt = new Date(project.startDate);
      if (!isNaN(dt.getTime())) {
        dt.setTime(dt.getTime() + roundedDays * 24 * 60 * 60 * 1000);
        expected = dt;
      }
    }
    return {
      totalPlannedDays: roundedDays,
      finalExpectedCompletionDate: expected,
    };
  }, [stages, stageDurations, stageDurationUnits, project]);

  if (!isOpen || !project) return null;

  function handleStageDurationChange(stageId, val) {
    setStageDurations((prev) => ({
      ...prev,
      [stageId]: val,
    }));
    if (error) setError('');
  }

  function handleStageUnitChange(stageId, unit) {
    setStageDurationUnits((prev) => ({
      ...prev,
      [stageId]: unit,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (stages.length > 0) {
      for (const s of stages) {
        const isClosed = s.status === 'Completed' || s.status === 'Approved';
        if (!isClosed) {
          const val = stageDurations[s.id];
          if (val === undefined || String(val).trim() === '' || isNaN(Number(val)) || Number(val) <= 0) {
            setError(`Planned duration for stage '${s.name}' must be greater than zero.`);
            return;
          }
        }
      }
    }

    setIsSaving(true);
    try {
      if (stages.length > 0) {
        // Update stages via pmsApi from-order sync or patch
        await pmsApi.createProjectFromOrder({
          salesOrderId: project.crmOrderId || project.salesOrderId || project.id,
          stageDurations,
          stageDurationUnits,
          plannedDuration: totalPlannedDays,
          durationUnit: 'Days',
        });
      } else {
        await updateProject(project.id, {
          plannedDuration: totalPlannedDays,
          durationUnit: 'Days',
        });
      }

      showToast(`Planned durations updated for ${project.code}. Final due date recalculated.`, 'success');
      onClose();
    } catch (err) {
      console.error('[EditPlannedDurationModal] Save failed:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to save stage durations.');
      showToast('Failed to update stage durations.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Planned Durations & Final Due Date"
      subtitle={`Configure stage durations for ${project.code}. Downstream stages and project final due date automatically recalculate.`}
      icon={Clock}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-planned-duration-form"
            loading={isSaving}
            disabled={isSaving}
            icon={CheckCircle2}
          >
            {isSaving ? 'Saving...' : 'Save Stage Durations'}
          </Button>
        </div>
      }
    >
      <form id="edit-planned-duration-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Live Timeline Summary Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 border border-blue-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Calculated Final Due Date</div>
              <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                <span className="text-sm font-extrabold text-slate-800">
                  Total Duration: {totalPlannedDays} {totalPlannedDays === 1 ? 'Day' : 'Days'}
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  · Final Due Date: <strong className="text-blue-900 font-bold">{formatExpectedDate(finalExpectedCompletionDate)}</strong>
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
            Sequential stage pipeline
          </span>
        </div>

        {/* Stages List */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Stage-Wise Durations
          </label>
          <div className="rounded-lg border border-[#dce5f4] divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white">
            {stages.map((s) => {
              const isClosed = s.status === 'Completed' || s.status === 'Approved';
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50/80 flex-wrap"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {s.sequence}. {s.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                      {s.department}
                    </span>
                    <StageStatusBadge status={s.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-medium">Duration:</span>
                      {isClosed ? (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {stageDurations[s.id] ?? s.plannedDuration} {stageDurationUnits[s.id] || s.durationUnit || 'Days'} (Completed)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={stageDurations[s.id] !== undefined ? stageDurations[s.id] : s.plannedDuration ?? 1}
                            onChange={(e) => handleStageDurationChange(s.id, e.target.value)}
                            disabled={isSaving}
                            className="w-16 text-right text-xs rounded-md border border-[#dce5f4] px-1.5 py-1 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                          />
                          <select
                            value={stageDurationUnits[s.id] || s.durationUnit || 'Days'}
                            onChange={(e) => handleStageUnitChange(s.id, e.target.value)}
                            disabled={isSaving}
                            className="text-[10px] text-slate-600 bg-white border border-[#dce5f4] rounded px-1.5 py-1 focus:outline-none"
                          >
                            <option value="Days">Days</option>
                            <option value="Hours">Hours</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Changing any stage's duration shifts subsequent uncompleted stages and recalculates the final expected completion date.
          </p>
        </div>
      </form>
    </Modal>
  );
}

export default EditPlannedDurationModal;
