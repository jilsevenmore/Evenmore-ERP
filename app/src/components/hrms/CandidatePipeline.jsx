import { useRecruitmentStore } from "../../stores/recruitmentStore";
import { useAppStore } from "../../stores/appStore";
const stages = ["Applied", "Screening", "Interview", "Shortlisted", "Offer", "Hired", "Rejected"];
export function CandidatePipeline() {
  const candidates = useRecruitmentStore((s) => s.candidates);
  const changeStage = useRecruitmentStore((s) => s.changeStage);
  const showToast = useAppStore((s) => s.showToast);
  return <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-slate">Candidate Pipeline</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
        {stages.map((st) => <div key={st} className={`rounded-xl border p-3 ${st === "Rejected" ? "bg-red-50 border-red-200" : "bg-off border-bdr"}`}>
            <div className={`text-[11px] font-semibold uppercase ${st === "Rejected" ? "text-red-600" : "text-muted"}`}>{st} ({candidates.filter((c) => c.stage === st).length})</div>
            <div className="mt-2 space-y-2">
              {candidates.filter((c) => c.stage === st).map((c) => <div key={c.id} className="bg-white border border-bdr rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <img src={c.avatar} alt="" className="w-7 h-7 rounded-full" />
                    <div><div className="text-[13px] font-medium leading-none">{c.name}</div><div className="text-[11px] text-muted truncate">{c.position}</div><div className="text-[11px] text-muted">{c.experience}</div></div>
                  </div>
                  <select value={c.stage} onChange={(e) => {
    changeStage(c.id, e.target.value);
    showToast(`${c.name} moved to ${e.target.value}`);
  }} className="mt-2 w-full h-7 bg-off border border-bdr rounded-lg text-[11px]">
                    {stages.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>)}
              {candidates.filter((c) => c.stage === st).length === 0 && <div className="text-[11px] text-muted text-center py-3">No candidates</div>}
            </div>
          </div>)}
      </div>
    </div>;
}
