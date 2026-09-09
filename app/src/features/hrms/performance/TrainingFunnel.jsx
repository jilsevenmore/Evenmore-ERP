import { Users } from "lucide-react";
const stages = [
  { label: "Planned", count: 86, pct: 100, participants: 86 },
  { label: "Nominated", count: 72, pct: 83, participants: 72 },
  { label: "Registered", count: 64, pct: 74, participants: 64 },
  { label: "In Progress", count: 42, pct: 48, participants: 42 },
  { label: "Completed", count: 34, pct: 39, participants: 34 }
];
export default function TrainingFunnel() {
  const max = stages[0].count;
  return <div className="flex flex-col gap-6">
      <div><h1 className="text-[22px] font-bold">Training Funnel</h1><p className="text-[13px] text-muted">Planned to completed — participants and drop-off.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white border border-bdr rounded-xl p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            {stages.map((s) => <div key={s.label} className="flex items-center gap-3">
                <div className="w-24 text-[12px] font-medium">{s.label}</div>
                <div className="flex-1 h-8 bg-off border border-bdr rounded-xl overflow-hidden relative">
                  <div className={`h-full ${s.label === "Completed" ? "bg-emerald-500" : "bg-navy"} rounded-xl`} style={{ width: `${s.count / max * 100}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center gap-2 text-[11px] font-medium text-white"><Users size={12} />{s.participants} participants • {s.pct}%</span>
                </div>
                <div className="w-10 text-right text-[11px] text-muted">{max - s.count} drop</div>
              </div>)}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
            <span className="px-3 py-1 bg-off border border-bdr rounded-full">Completion: 39%</span>
            <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full">22 drop-off after Registered</span>
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full">34 completed</span>
          </div>
        </div>
        <div className="lg:col-span-4 bg-white border border-bdr rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold">Conversion</h3>
          <div className="mt-3 space-y-2 text-[13px]">
            {stages.map((s, i) => i > 0 && <div key={s.label} className="flex justify-between"><span>{stages[i - 1].label} → {s.label}</span><span className="font-medium">{s.pct}%</span></div>)}
          </div>
          <div className="mt-4 p-3 bg-off border border-bdr rounded-xl text-[12px] text-muted">Largest drop: Registered → In Progress (22 participants). Suggest reminder nudges.</div>
        </div>
      </div>
    </div>;
}
