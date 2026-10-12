import React from 'react';
import {
  Bell,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Flag,
  Send,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { usePmsStore } from '../../../../stores/pmsStore';
import { ToggleSwitch } from './ToggleSwitch';

export function NotificationsTab({ draft, onChange }) {
  const showToast = usePmsStore((s) => s.showToast);

  const notifications = draft.notifications || {
    enabled: true,
    onAssignment: true,
    onApproval: true,
    onDelay: true,
    onCompletion: true,
  };

  const isMasterEnabled = Boolean(notifications.enabled ?? true);

  const handleToggle = (key) => {
    const next = {
      ...notifications,
      [key]: !Boolean(notifications[key]),
    };
    onChange({ notifications: next });
  };

  const triggerTestToast = (tone) => {
    if (!isMasterEnabled) {
      showToast('Notifications are currently disabled in settings.', 'info');
      return;
    }
    if (tone === 'success') {
      showToast('Design proof sign-off approved by Acme Corp!', 'success');
    } else if (tone === 'error') {
      showToast('Stage 2 (Assembly) breached SLA threshold: flagged At-Risk', 'error');
    } else {
      showToast('New stage task assigned to your queue', 'info');
    }
  };

  const events = [
    {
      key: 'onAssignment',
      title: 'Task & Stage Assignment',
      desc: 'Send in-app alerts when an employee is assigned to a stage or new task.',
      icon: UserCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      key: 'onApproval',
      title: 'Approval Requests & Decisions',
      desc: 'Notify managers when client proofs are submitted, approved, or rejected.',
      icon: CheckCircle,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      key: 'onDelay',
      title: 'SLA At-Risk & Delay Triggers',
      desc: 'Immediate high-priority alert when a project or stage crosses the at-risk threshold.',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      key: 'onCompletion',
      title: 'Stage Handoff & Project Closure',
      desc: 'Alert stakeholders when stages complete handoffs or projects achieve sign-off.',
      icon: Flag,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Master Toggle Card */}
      <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                isMasterEnabled
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Global PMS Notifications Master Switch</h3>
              <p className="text-xs text-slate-500">
                Controls all in-app toasts, banner banners, and event broadcasts for PMS.
              </p>
            </div>
          </div>

          <ToggleSwitch
            checked={isMasterEnabled}
            onChange={() => handleToggle('enabled')}
            ariaLabel="Global PMS Notifications Master Switch"
            activeColor="#1f6bff"
            className="self-start sm:self-auto"
          />
        </div>
      </section>

      {/* Granular Event Triggers */}
      <section
        className={`rounded-xl border border-[#dce5f4] bg-white p-6 shadow-2xs transition-opacity ${
          !isMasterEnabled ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <header className="pb-4 mb-4 border-b border-[#dce5f4]">
          <h3 className="text-sm font-bold text-slate-800">Event-Specific Notification Triggers</h3>
          <p className="text-xs text-slate-500">
            Select which milestone events produce toasts and dashboard alerts.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev) => {
            const Icon = ev.icon;
            const checked = Boolean(notifications[ev.key] ?? true);

            return (
              <div
                key={ev.key}
                onClick={() => handleToggle(ev.key)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                  checked
                    ? 'border-blue-200 bg-blue-50/20 hover:bg-blue-50/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${ev.color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-800">{ev.title}</h4>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}} // handled by parent onClick
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {ev.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Toast Tester */}
      <section className="rounded-xl border border-[#dce5f4] bg-white p-6 shadow-2xs">
        <header className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-amber-500" />
          <h3 className="text-sm font-bold text-slate-800">Live Toast &amp; Alert Preferences Test</h3>
        </header>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Verify how transient feedback toasts render on screen. PMS uses an auto-dismissing (4s) non-intrusive bottom toast.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => triggerTestToast('success')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
          >
            <CheckCircle2 size={14} />
            Test Success Toast
          </button>
          <button
            type="button"
            onClick={() => triggerTestToast('error')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs"
          >
            <AlertTriangle size={14} />
            Test At-Risk Warning Toast
          </button>
          <button
            type="button"
            onClick={() => triggerTestToast('info')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer shadow-2xs"
          >
            <Info size={14} />
            Test Assignment Info Toast
          </button>
        </div>
      </section>
    </div>
  );
}

export default NotificationsTab;
