import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { usePmsStore } from '../../../../stores/pmsStore';

/**
 * NotificationDefaults — which confirmations surface as toasts.
 *
 * Wired to the same flags PmsToast consults, so unticking a category silences
 * that confirmation everywhere in the module rather than only on this page.
 */

const CATEGORIES = [
  { key: 'onAssignment', label: 'Assignments & handoffs', detail: 'When a stage is assigned or handed to another department.' },
  { key: 'onApproval', label: 'Proofs & approvals', detail: 'When a version is uploaded, circulated or decided.' },
  { key: 'onDelay', label: 'Delays', detail: 'When a delay is logged, replanned or resolved.' },
  { key: 'onCompletion', label: 'Project sign-off', detail: 'When a project is signed off and closed.' },
];

export function NotificationDefaults({ draft, onChange }) {
  const showToast = usePmsStore((s) => s.showToast);
  const notifications = draft.notifications ?? {};
  const masterOn = notifications.enabled !== false;

  const setFlag = (key, value) =>
    onChange({ notifications: { ...notifications, [key]: value } });

  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs">
      <header className="flex items-center gap-2 mb-1">
        {masterOn ? <Bell size={14} className="text-slate-400" /> : <BellOff size={14} className="text-slate-400" />}
        <h3 className="text-sm font-bold text-slate-800">Notification Defaults</h3>
      </header>
      <p className="text-[11px] text-slate-500 mb-4">
        In-app confirmations shown after a PMS action.
      </p>

      <label
        htmlFor="notify-master"
        className="flex items-center justify-between gap-3 rounded-lg border border-[#dce5f4] px-3 py-2.5 cursor-pointer mb-3"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-bold text-slate-700">Show confirmations</span>
          <span className="block text-[10px] text-slate-500">Turning this off silences every category.</span>
        </span>
        <button
          id="notify-master"
          type="button"
          role="switch"
          aria-checked={masterOn}
          aria-label="Show confirmations"
          onClick={() => setFlag('enabled', !masterOn)}
          className="relative inline-flex items-center rounded-full transition-colors shrink-0"
          style={{ width: 34, height: 18, background: masterOn ? '#1bb878' : '#cbd5e1' }}
        >
          <span
            className="absolute rounded-full bg-white shadow-sm transition-all"
            style={{ width: 14, height: 14, left: masterOn ? 18 : 2 }}
          />
        </button>
      </label>

      <div className={`space-y-2 ${masterOn ? '' : 'opacity-50 pointer-events-none'}`}>
        {CATEGORIES.map((c) => (
          <label
            key={c.key}
            htmlFor={`notify-${c.key}`}
            className="flex items-start gap-2.5 rounded-lg border border-[#dce5f4] px-3 py-2 cursor-pointer hover:bg-slate-50"
          >
            <input
              id={`notify-${c.key}`}
              type="checkbox"
              checked={notifications[c.key] !== false}
              onChange={(e) => setFlag(c.key, e.target.checked)}
              disabled={!masterOn}
              className="accent-blue-600 mt-0.5"
            />
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-slate-700">{c.label}</span>
              <span className="block text-[10px] text-slate-500">{c.detail}</span>
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={() => showToast('This is how a PMS confirmation looks.', 'info')}
        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline mt-3"
      >
        Preview a notification
      </button>
    </section>
  );
}

export default NotificationDefaults;
