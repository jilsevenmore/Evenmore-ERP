import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  ShieldCheck,
  Bell,
  Users,
  Tag,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button';
import { usePmsStore, computeNavBadges } from '../../../stores/pmsStore';
import { PmsToast } from '../components/PmsToast';

import { GeneralSlaTab } from './components/GeneralSlaTab';
import { ApprovalPoliciesTab } from './components/ApprovalPoliciesTab';
import { NotificationsTab } from './components/NotificationsTab';
import { DepartmentsTab } from './components/DepartmentsTab';
import { DelayCategoriesTab } from './components/DelayCategoriesTab';

const TABS = [
  { id: 'sla', label: 'SLA & Delay Engine', icon: Sliders },
  { id: 'policies', label: 'Approval & Quality Gates', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
  { id: 'departments', label: 'Departments & Capacity', icon: Users },
  { id: 'delay_categories', label: 'Delay Root Causes', icon: Tag },
];

export default function PMSSettingsPage() {
  const settings = usePmsStore((s) => s.settings);
  const projects = usePmsStore((s) => s.projects);
  const currentUserId = usePmsStore((s) => s.currentUserId);
  const updateSettings = usePmsStore((s) => s.updateSettings);
  const resetSettings = usePmsStore((s) => s.resetSettings);
  const showToast = usePmsStore((s) => s.showToast);

  // Active Tab
  const [activeTab, setActiveTab] = useState('sla');

  // Local draft state
  const [draft, setDraft] = useState(() => ({ ...settings }));
  const [saving, setSaving] = useState(false);

  // Synchronize draft when settings arrive from server, unless user is actively editing
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setDraft((prev) => {
        // If draft is pristine or equal to empty defaults, take new settings
        if (JSON.stringify(prev) === JSON.stringify(settings)) return prev;
        return { ...settings, ...prev };
      });
    }
  }, [settings]);

  // Is dirty calculation
  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(settings);
  }, [draft, settings]);

  // Live sidebar nav counter stats
  const badges = useMemo(
    () => computeNavBadges(projects, currentUserId),
    [projects, currentUserId]
  );

  const stats = [
    { label: 'Projects', value: projects.length },
    { label: 'Active', value: badges.pmsActiveCount },
    { label: 'Delayed', value: badges.pmsDelayedCount },
    { label: 'My open tasks', value: badges.pmsMyTasksPending },
  ];

  const handlePatchDraft = (patch) => {
    setDraft((cur) => ({ ...cur, ...patch }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettings(draft);
      if (res?.ok === false) {
        showToast(res.error || 'Failed to save PMS settings.', 'error');
      } else {
        showToast('PMS settings updated successfully.', 'success');
      }
    } catch (err) {
      showToast(err?.message || 'Error saving settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    await resetSettings();
    setDraft({ ...settings });
    showToast('Changes discarded; reloaded tenant settings.', 'info');
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      {isDirty && (
        <Button
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onClick={handleDiscard}
          disabled={saving}
        >
          Discard
        </Button>
      )}
      <Button
        variant="primary"
        size="sm"
        icon={saving ? Loader2 : Save}
        onClick={handleSave}
        disabled={saving || !isDirty}
        className={saving ? 'animate-pulse' : ''}
      >
        {saving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="PMS Settings"
        subtitle="At-risk thresholds, approval policies and notification defaults."
        actions={headerActions}
      />

      {/* Live Context KPI Readout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs"
          >
            <div className="text-xs font-medium text-slate-500">{s.label}</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#dce5f4] bg-white rounded-xl p-1.5 shadow-2xs">
        <nav className="flex flex-wrap gap-1.5" aria-label="Settings Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50 shadow-2xs text-xs text-amber-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>You have unsaved changes in PMS Settings.</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDiscard}
              className="text-amber-800 hover:underline font-semibold px-2 py-1 cursor-pointer"
            >
              Discard
            </button>
            <Button
              variant="primary"
              size="sm"
              icon={saving ? Loader2 : CheckCircle2}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {/* Active Tab Panel */}
      <main>
        {activeTab === 'sla' && (
          <GeneralSlaTab
            draft={draft}
            onChange={handlePatchDraft}
            projects={projects}
          />
        )}

        {activeTab === 'policies' && (
          <ApprovalPoliciesTab
            draft={draft}
            onChange={handlePatchDraft}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab
            draft={draft}
            onChange={handlePatchDraft}
          />
        )}

        {activeTab === 'departments' && (
          <DepartmentsTab
            draft={draft}
            onChange={handlePatchDraft}
          />
        )}

        {activeTab === 'delay_categories' && (
          <DelayCategoriesTab
            draft={draft}
            onChange={handlePatchDraft}
          />
        )}
      </main>

      {/* Persistent Toast Anchor for PMS */}
      <PmsToast />
    </div>
  );
}
