import React, { useEffect, useMemo, useState } from 'react';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { PmsToast } from '../components/PmsToast';
import {
  usePmsStore,
  validateSettings,
  computeElapsedPct,
  computeStageCompletionPct,
  DASHBOARD_AT_RISK_COMPLETION_PCT,
} from '../../../stores/pmsStore';
import { DepartmentDirectorySettings } from './components/DepartmentDirectorySettings';
import { SlaThresholdSettings } from './components/SlaThresholdSettings';
import { ApprovalWorkflowRules } from './components/ApprovalWorkflowRules';
import { DepartmentCapacitySettings } from './components/DepartmentCapacitySettings';
import { NotificationDefaults } from './components/NotificationDefaults';

/**
 * PMSSettingsPage (/pms/settings) — module configuration.
 *
 * Edits are held in a local draft and only committed on Save, so a half-typed
 * threshold never re-derives every project mid-keystroke. Saving recalculates
 * the whole portfolio against the new values.
 */

/** Count stages that would be at risk at a given threshold. */
function countAtRisk(projects, thresholdPct, now = Date.now()) {
  let n = 0;
  for (const p of projects) {
    for (const stage of p.stages ?? []) {
      if (stage.status === 'Completed' || !stage.startDateTime) continue;
      if (
        computeElapsedPct(stage, now) > thresholdPct &&
        computeStageCompletionPct(stage) < DASHBOARD_AT_RISK_COMPLETION_PCT
      ) {
        n += 1;
      }
    }
  }
  return n;
}

export default function PMSSettingsPage() {
  const settings = usePmsStore((s) => s.settings);
  const projects = usePmsStore((s) => s.projects);
  const updateSettings = usePmsStore((s) => s.updateSettings);
  const resetSettings = usePmsStore((s) => s.resetSettings);
  const showToast = usePmsStore((s) => s.showToast);

  const [draft, setDraft] = useState(settings);
  const [errors, setErrors] = useState({});
  const [confirmReset, setConfirmReset] = useState(false);

  // Adopt external changes (e.g. a reset) while leaving local edits alone.
  useEffect(() => { setDraft(settings); }, [settings]);

  const change = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings]
  );

  // Open tasks per department, so capacity edits show real load.
  const load = useMemo(() => {
    const counts = {};
    for (const p of projects) {
      for (const stage of p.stages ?? []) {
        for (const task of stage.tasks ?? []) {
          if (task.status === 'Completed') continue;
          const dept = task.department ?? stage.department ?? 'Unassigned';
          counts[dept] = (counts[dept] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [projects]);

  const impact = useMemo(() => {
    const next = Number(draft.atRiskThresholdPct);
    return {
      current: countAtRisk(projects, Number(settings.atRiskThresholdPct)),
      preview: Number.isFinite(next) ? countAtRisk(projects, next) : 0,
    };
  }, [projects, settings.atRiskThresholdPct, draft.atRiskThresholdPct]);

  function handleSave() {
    const found = validateSettings(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Normalise the typed numbers before they reach the store.
    const capacity = {};
    for (const [dept, value] of Object.entries(draft.departmentCapacity ?? {})) {
      if (value === undefined || value === '') continue;
      capacity[dept] = Number(value);
    }

    updateSettings({
      ...draft,
      atRiskThresholdPct: Number(draft.atRiskThresholdPct),
      defaultDepartmentCapacity: Number(draft.defaultDepartmentCapacity),
      departmentCapacity: capacity,
    });

    showToast('PMS settings saved — projects re-evaluated.');
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="PMS Settings"
        subtitle="Delivery thresholds, sign-off policy, department capacity and notification defaults."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RotateCcw} onClick={() => setConfirmReset(true)}>
              Reset
            </Button>
            <Button icon={Save} onClick={handleSave} disabled={!isDirty}>
              {isDirty ? 'Save Changes' : 'Saved'}
            </Button>
          </div>
        }
      />

      {isDirty && (
        <p
          className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
          data-test="settings-dirty"
        >
          <AlertCircle size={12} className="shrink-0" />
          Unsaved changes. Saving re-evaluates every project against the new values.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DepartmentDirectorySettings />
        <SlaThresholdSettings draft={draft} errors={errors} onChange={change} impact={impact} />
        <ApprovalWorkflowRules draft={draft} onChange={change} />
        <DepartmentCapacitySettings draft={draft} errors={errors} onChange={change} load={load} />
        <NotificationDefaults draft={draft} onChange={change} />
      </div>

      <Modal
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset PMS settings?"
        subtitle="Thresholds, policy, capacity and notifications"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                resetSettings();
                setErrors({});
                setConfirmReset(false);
                showToast('PMS settings restored to defaults.');
              }}
            >
              Reset Settings
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          This restores the shipped defaults and re-evaluates every project against them.
          Projects, stages and their history are not touched.
        </p>
      </Modal>

      <PmsToast />
    </div>
  );
}
