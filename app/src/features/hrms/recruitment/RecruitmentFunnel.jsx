import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useNavigate } from "react-router-dom";
import { funnelData } from "../../../data/hrms/data/recruitmentData";
import { ArrowLeft } from "lucide-react";

export default function RecruitmentFunnel() {
  const candidates = useRecruitmentStore((s) => s.candidates);
  const navigate = useNavigate();
  const counts = {
    Applications: candidates.length,
    Screening: candidates.filter((c) => ["Screening", "Interview", "Shortlisted", "Offer", "Hired"].includes(c.stage)).length,
    Interview: candidates.filter((c) => ["Interview", "Shortlisted", "Offer", "Hired"].includes(c.stage)).length,
    Shortlisted: candidates.filter((c) => ["Shortlisted", "Offer", "Hired"].includes(c.stage)).length,
    Offer: candidates.filter((c) => ["Offer", "Hired"].includes(c.stage)).length,
    Hired: candidates.filter((c) => c.stage === "Hired").length,
  };
  const max = counts.Applications || 1;
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate("/hrms/recruitment")}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 hover:text-navy transition w-fit cursor-pointer group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Recruitment Setup</span>
      </button>

      <div><h1 className="text-[22px] font-bold">Recruitment Funnel</h1><p className="text-[13px] text-muted">Applications → Hired conversion, drop-off and avg processing time.</p></div>
      <div className="bg-white border border-bdr rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          {funnelData.map((s, i) => {
            const count = counts[s.stage] ?? s.count;
            const pct = Math.round((count / max) * 100);
            const prev = i > 0 ? funnelData[i - 1] : null;
            const drop = prev ? (counts[prev.stage] ?? prev.count) - count : 0;
            return (
              <button key={s.stage} onClick={() => navigate("/hrms/recruitment/candidates")} className="flex items-center gap-3 text-left hover:bg-off rounded-xl p-2">
                <div className="w-24 text-[12px] font-medium">{s.stage}</div>
                <div className="flex-1 h-8 bg-off border border-bdr rounded-xl overflow-hidden relative">
                  <div className={`h-full ${s.stage === "Hired" ? "bg-emerald-500" : "bg-navy"} rounded-xl`} style={{ width: `${pct}%` }}></div>
                  <span className="absolute inset-0 grid place-items-center text-[11px] font-medium text-white">{count} • {pct}%</span>
                </div>
                <div className="w-20 text-right text-[11px] text-muted">{drop > 0 ? `-${drop} drop` : "—"}</div>
                <div className="w-24 text-[11px] text-muted">Avg 3.2 days</div>
              </button>
            );
          })}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-[12px]">
          <div className="bg-off border border-bdr rounded-xl p-3"><div className="text-muted">Conversion Hired</div><div className="font-bold text-[16px]">{Math.round((counts.Hired / max) * 100)}%</div></div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3"><div className="text-red-700">Largest Drop</div><div className="font-bold">Screening → Interview</div></div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><div className="text-emerald-700">Hired</div><div className="font-bold">{counts.Hired}</div></div>
        </div>
        <p className="text-[11px] text-muted mt-3">Click a stage to filter candidates to that stage (navigates to Candidates).</p>
      </div>
    </div>
  );
}