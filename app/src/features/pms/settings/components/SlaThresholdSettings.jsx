import React from 'react';
import { Gauge, AlertCircle, Info } from 'lucide-react';

/**
 * SlaThresholdSettings — the at-risk trigger.
 *
 * This is the live input to the delay engine: a stage is flagged At Risk once
 * this share of its planned window has elapsed *and* completion is still under
 * 50%. Saving re-derives every project immediately, so the preview shows what
 * the change will actually do before it is applied.
 */

const labelClass = 'block text-[11px] font-semibold text-slate-600 mb-1.5';

export function SlaThresholdSettings({ draft, errors, onChange, impact }) {
  const pct = Number(draft.atRiskThresholdPct);

  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs">
      <header className="flex items-center gap-2 mb-1">
        <Gauge size={14} className="text-slate-400" />
        <h3 className="text-sm font-bold text-slate-800">At-Risk Threshold</h3>
      </header>
      <p className="text-[11px] text-slate-500 mb-4">
        When a running stage is flagged as at risk.
      </p>

      <label className={labelClass} htmlFor="sla-threshold">
        Elapsed window before flagging — {Number.isFinite(pct) ? `${pct}%` : '—'}
      </label>
      <div className="flex items-center gap-3">
        <input
          id="sla-threshold"
          type="range"
          min={10}
          max={100}
          step={5}
          value={Number.isFinite(pct) ? pct : 70}
          onChange={(e) => onChange({ atRiskThresholdPct: Number(e.target.value) })}
          className="flex-1 accent-blue-600"
        />
        <input
          type="number"
          min={10}
          max={100}
          value={draft.atRiskThresholdPct}
          onChange={(e) => onChange({ atRiskThresholdPct: e.target.value })}
          aria-label="At-risk threshold percentage"
          className="w-20 text-xs rounded-lg border border-[#dce5f4] px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {errors.atRiskThresholdPct && (
        <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
          <AlertCircle size={11} /> {errors.atRiskThresholdPct}
        </p>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-[#dce5f4] bg-[#f6f9ff] px-3 py-2.5 mt-4">
        <Info size={12} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-600">
          A stage is flagged <strong>At Risk</strong> once{' '}
          <strong>{Number.isFinite(pct) ? pct : '—'}%</strong> of its planned window has elapsed
          and completion is still under 50%. Past the expected completion it becomes{' '}
          <strong>Delayed</strong> regardless.
        </p>
      </div>

      {impact && (
        <dl className="grid grid-cols-3 gap-3 mt-3" data-test="sla-impact">
          {[
            ['At-risk stages now', impact.current],
            ['With this setting', impact.preview],
            ['Change', impact.preview === impact.current ? 'none' : `${impact.preview > impact.current ? '+' : ''}${impact.preview - impact.current}`],
          ].map(([k, v], i) => (
            <div key={k} className="min-w-0">
              <dt className="text-[10px] text-slate-500">{k}</dt>
              <dd
                className="text-sm font-bold tabular-nums"
                style={{ color: i === 2 && impact.preview !== impact.current ? '#9a3412' : '#334155' }}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export default SlaThresholdSettings;
