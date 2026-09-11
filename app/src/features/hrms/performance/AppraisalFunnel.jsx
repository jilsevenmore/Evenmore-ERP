import { AlertTriangle, Check } from "lucide-react";

const stages = [
  { label: "Draft", count: 12, pct: 100, color: "bg-slate-400" },
  { label: "Assigned", count: 38, pct: 92, color: "bg-[#16233a]" },
  { label: "Self Review", count: 32, pct: 76, color: "bg-[#16233a]" },
  { label: "Manager Review", count: 24, pct: 48, color: "bg-[#f59e0b]", bottleneck: true },
  { label: "Calibration", count: 18, pct: 32, color: "bg-[#16233a]" },
  { label: "Completed", count: 12, pct: 18, color: "bg-[#10b981]" },
];

export default function AppraisalFunnel() {
  const max = stages[0].count;

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-0.5">
        <div className="text-[12px] font-medium text-slate-400 flex items-center gap-1">
          <span>Home</span>
          <span>&gt;</span>
          <span className="text-slate-600">Performance / Appraisal Funnel</span>
        </div>
        <div className="mt-1">
          <h1 className="text-[22px] font-bold text-slate-800">Appraisal Funnel</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Visual workflow from draft to completed.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Chart */}
        <div className="lg:col-span-8 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col gap-3.5">
            {stages.map((s, i) => {
              const isDraft = s.label === "Draft";
              const isBottleneck = s.bottleneck;
              const isCompleted = s.label === "Completed";

              let barColor = "bg-[#131b2e]";
              if (isDraft) barColor = "bg-[#f4f6fa]";
              else if (isBottleneck) barColor = "bg-[#f59e0b]";
              else if (isCompleted) barColor = "bg-[#10b981]";

              return (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-28 text-[13px] font-medium text-slate-700">
                    {String(i + 1).padStart(2, "0")} {s.label}
                  </div>
                  <div className="flex-1 h-9 rounded-full overflow-hidden relative bg-transparent">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all flex items-center justify-center`}
                      style={{ width: `${(s.count / max) * 100}%` }}
                    >
                      <span
                        className={`text-[12px] font-medium ${
                          isDraft ? "text-[#94a3b8]" : "text-white font-semibold"
                        }`}
                      >
                        {s.count} • {s.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-10 text-right text-[12px] text-slate-400 font-medium">{s.pct}%</div>
                  {s.bottleneck ? (
                    <div className="w-24">
                      <span className="px-2.5 py-1 bg-[#fffbeb] border border-[#fef08a] text-[#b45309] rounded-full text-[11px] font-medium flex items-center gap-1">
                        <AlertTriangle size={12} className="text-[#b45309]" />
                        Bottleneck
                      </span>
                    </div>
                  ) : (
                    <div className="w-24" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-2 text-[12px]">
            <span className="px-3.5 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-full text-slate-500 font-medium">
              Draft → Completed: 18% conversion
            </span>
            <span className="px-3.5 py-1.5 bg-[#fef2f2] border border-[#fee2e2] text-[#dc2626] rounded-full font-medium">
              24 pending in Manager Review
            </span>
          </div>
        </div>

        {/* Right Column Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs flex flex-col gap-3">
            <h3 className="font-bold text-[15px] text-slate-800 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-[#f59e0b]" />
              Bottleneck Callout
            </h3>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              <strong className="text-slate-700 font-semibold">Manager Review</strong> has 24 pending appraisals — highest drop-off. Avg wait 3.2 days. Suggested: nudge reviewers.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-[#fffbeb] border border-[#fef08a] text-[#b45309] rounded-full text-[12px] font-medium">
                24 pending
              </span>
              <span className="px-3 py-1 bg-[#f8fafc] border border-[#e2e8f0] text-slate-600 rounded-full text-[12px] font-medium">
                48% of flow
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs flex flex-col gap-3">
            <h3 className="font-bold text-[15px] text-slate-800">Stage Breakdown</h3>
            <div className="mt-1 space-y-2.5 text-[13px]">
              {stages.map((s) => (
                <div key={s.label} className="flex justify-between items-center text-slate-700">
                  <span>{s.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{s.count}</span>
                    <span className="text-slate-400 text-[12px]">{s.pct}%</span>
                    {s.label === "Completed" && <Check size={14} className="text-emerald-600 ml-0.5" />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
