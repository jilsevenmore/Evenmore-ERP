import React, { useMemo } from 'react';
import { Sliders, AlertTriangle, Clock, RefreshCw, Palette, ShieldAlert } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Default Crimson', hex: '#d03b3b' },
  { name: 'Rose Red', hex: '#e11d48' },
  { name: 'Vibrant Red', hex: '#dc2626' },
  { name: 'Dark Amber', hex: '#d97706' },
  { name: 'Deep Purple', hex: '#7c3aed' },
];

export function GeneralSlaTab({ draft, onChange, projects = [] }) {
  const threshold = Number(draft.atRiskThresholdPct ?? 70);
  const overdueColor = draft.statusColors?.overdue || '#d03b3b';

  // Real-time project impact preview
  const impact = useMemo(() => {
    let atRiskCount = 0;
    let delayedCount = 0;
    let onTrackCount = 0;

    projects.forEach((p) => {
      if (p.status === 'Completed' || p.status === 'Draft') return;
      if (p.status === 'Delayed') {
        delayedCount++;
      } else if (p.status === 'At Risk') {
        atRiskCount++;
      } else {
        onTrackCount++;
      }
    });

    return { atRiskCount, delayedCount, onTrackCount };
  }, [projects]);

  const handleThresholdChange = (val) => {
    const num = Math.min(100, Math.max(1, Number(val) || 1));
    onChange({ atRiskThresholdPct: num });
  };

  const handleColorChange = (hex) => {
    onChange({
      statusColors: {
        ...(draft.statusColors || {}),
        overdue: hex,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* SLA & Delay Threshold Card */}
      <section className="rounded-xl border border-[#dce5f4] bg-white p-6 shadow-2xs">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#dce5f4]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">At-Risk Threshold &amp; SLA Delay Engine</h3>
              <p className="text-xs text-slate-500">
                Controls when in-flight project stages are flagged as at-risk before slipping past due.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
            <AlertTriangle size={13} />
            Current: {threshold}%
          </span>
        </header>

        <div className="mt-6 space-y-6">
          {/* Interactive Slider & Number Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                Elapsed Window Threshold (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={threshold}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  className="w-20 px-2.5 py-1 text-center font-bold text-xs rounded-lg border border-[#dce5f4] bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                <span className="text-xs font-semibold text-slate-400">%</span>
              </div>
            </div>

            <input
              type="range"
              min="10"
              max="95"
              step="1"
              value={threshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #1f6bff 0%, #1f6bff ${threshold}%, #e2e8f0 ${threshold}%, #e2e8f0 100%)`,
              }}
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>10% (Early Warning)</span>
              <span className="font-semibold text-slate-600">50%</span>
              <span className="font-semibold text-blue-600">70% (Standard)</span>
              <span>95% (High Tolerance)</span>
            </div>
          </div>

          {/* Visual Gauge Bar */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Stage Life-Cycle Risk Evaluation</span>
              <span className="text-[11px] font-normal text-slate-500">Dual-condition gate</span>
            </div>

            <div className="h-4 rounded-full overflow-hidden flex bg-slate-200 p-0.5 gap-0.5">
              <div
                style={{ width: `${threshold}%` }}
                className="bg-emerald-500 rounded-l-full transition-all flex items-center justify-center text-[9px] font-bold text-white tracking-wider"
                title={`On Track: 0% to ${threshold}%`}
              >
                ON TRACK
              </div>
              <div
                style={{ width: `${Math.max(5, 100 - threshold)}%` }}
                className="bg-amber-500 rounded-r-full transition-all flex items-center justify-center text-[9px] font-bold text-white tracking-wider"
                title={`At Risk: ${threshold}% to 100% when progress < 50%`}
              >
                AT RISK
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>0% – {threshold}%:</strong> Normal execution</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span><strong>&ge; {threshold}%:</strong> At-Risk if completion &lt; 50%</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span><strong>&gt; 100%:</strong> Delayed (Past due date)</span>
              </div>
            </div>
          </div>

          {/* Real-time Project Breakdown Callout */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-blue-100 bg-[#f6f9ff]">
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-blue-600 shrink-0" />
              <div className="text-xs text-slate-700">
                <strong className="text-slate-900">Current Project Portfolio Status:</strong>{' '}
                {impact.onTrackCount} on-track · {impact.atRiskCount} at-risk · {impact.delayedCount} delayed
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              Threshold recalculates across all projects upon save
            </div>
          </div>
        </div>
      </section>

      {/* Overdue Reserved State Color */}
      <section className="rounded-xl border border-[#dce5f4] bg-white p-6 shadow-2xs">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#dce5f4]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Palette size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Reserved Overdue State Colour</h3>
              <p className="text-xs text-slate-500">
                Identity colour for overdue stages across Gantt charts, delay badges, and the Delay Center.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleColorChange('#d03b3b')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw size={12} />
            Reset to default (#d03b3b)
          </button>
        </header>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Overdue Accent Hex
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={overdueColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-10 h-10 p-0.5 rounded-lg border border-[#dce5f4] cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={overdueColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-32 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-[#dce5f4] bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 uppercase"
                  placeholder="#d03b3b"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleColorChange(c.hex)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      overdueColor.toLowerCase() === c.hex.toLowerCase()
                        ? 'border-slate-800 bg-slate-50 shadow-2xs font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-slate-700">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Sample Preview */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">Preview in PMS Timeline &amp; Badges:</span>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                style={{ backgroundColor: overdueColor }}
              >
                <ShieldAlert size={12} />
                Delayed / Overdue
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border"
                style={{
                  borderColor: overdueColor,
                  color: overdueColor,
                  backgroundColor: `${overdueColor}15`,
                }}
              >
                +4 days overdue
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              In accordance with PMS design specifications, <code>overdue</code> is the reserved
              state colour. It can be recoloured to match tenant branding, but the state itself
              cannot be deleted.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default GeneralSlaTab;
