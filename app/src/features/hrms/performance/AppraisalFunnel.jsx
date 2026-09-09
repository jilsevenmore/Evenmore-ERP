import { AlertTriangle, Check } from "lucide-react";
const stages = [
  { label: "Draft", count: 12, pct: 100, color: "bg-slate-400" },
  { label: "Assigned", count: 38, pct: 92, color: "bg-navy" },
  { label: "Self Review", count: 32, pct: 76, color: "bg-navy" },
  { label: "Manager Review", count: 24, pct: 48, color: "bg-amber-500", bottleneck: true },
  { label: "Calibration", count: 18, pct: 32, color: "bg-navy" },
  { label: "Completed", count: 12, pct: 18, color: "bg-emerald-500" }
];
export default function AppraisalFunnel() {
  const max = stages[0].count;
  return <div className="flex flex-col gap-6">
      <div><h1 className="text-[22px] font-bold">Appraisal Funnel</h1><p className="text-[13px] text-muted">Visual workflow from draft to completed.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white border border-bdr rounded-xl p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            {stages.map((s, i) => <div key={s.label} className="flex items-center gap-3">
                <div className="w-28 text-[12px] font-medium text-slate">{String(i + 1).padStart(2, "0")} {s.label}</div>
                <div className="flex-1 h-8 bg-off border border-bdr rounded-xl overflow-hidden relative">
                  <div className={`h-full ${s.color} rounded-xl transition-all`} style={{ width: `${s.count / max * 100}%` }} />
                  <span className="absolute inset-0 grid place-items-center text-[11px] font-medium text-white drop-shadow">{s.count} • {s.pct}%</span>
                </div>
                <div className="w-14 text-right text-[12px] text-muted">{s.pct}%</div>
                {s.bottleneck && <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[11px] flex items-center gap-1"><AlertTriangle size={12} />Bottleneck</span>}
              </div>)}
          </div>
          <div className="mt-6 flex gap-2 text-[11px] text-muted">
            <span className="px-2 py-1 bg-off border border-bdr rounded-full">Draft → Completed: 18% conversion</span>
            <span className="px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full">24 pending in Manager Review</span>
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" />Bottleneck Callout</h3>
            <p className="text-[13px] text-muted mt-2"><b>Manager Review</b> has 24 pending appraisals — highest drop-off. Avg wait 3.2 days. Suggested: nudge reviewers.</p>
            <div className="mt-3 flex gap-2">
              <span className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px]">24 pending</span>
              <span className="px-2 py-1 bg-off border border-bdr rounded-full text-[11px]">48% of flow</span>
            </div>
          </div>
          <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold">Stage Breakdown</h3>
            <div className="mt-3 space-y-2 text-[13px]">
              {stages.map((s) => <div key={s.label} className="flex justify-between items-center">
                  <span>{s.label}</span><span className="flex items-center gap-2"><span className="font-medium">{s.count}</span><span className="text-muted">{s.pct}%</span>{s.label === "Completed" && <Check size={12} className="text-emerald-600" />}</span>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
}
