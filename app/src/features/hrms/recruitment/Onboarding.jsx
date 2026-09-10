import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../../components/hrms/Button";

export default function Onboarding() {
  const candidates = useRecruitmentStore((s) => s.candidates);
  const showToast = useAppStore((s) => s.showToast);
  const hired = candidates.filter((c) => c.stage === "Hired");
  const steps = ["Offer Accepted", "Documents Pending", "Documents Verified", "Joining Scheduled", "Onboarding Complete"];
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-[22px] font-bold">Job Onboarding</h1><p className="text-[13px] text-muted">{hired.length} hired candidates in onboarding</p></div>
      {hired.length === 0 ? (
        <div className="bg-white border border-bdr rounded-xl p-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-off border border-bdr grid place-items-center mx-auto text-muted"><span className="material-symbols-outlined">person_check</span></div>
          <div className="font-medium mt-3">No hired candidates</div><div className="text-[13px] text-muted">When a candidate is marked Hired, they appear here.</div>
          <Button size="sm" onClick={() => showToast("Go to Candidates to mark Hired")} className="mt-3">View Candidates</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {hired.map((c) => (
            <div key={c.id} className="bg-white border border-bdr rounded-xl p-5 shadow-sm">
              <div className="flex gap-3 items-center"><img src={c.avatar} alt="" className="w-10 h-10 rounded-full" /><div><div className="font-semibold">{c.name}</div><div className="text-[13px] text-muted">{c.position} • {c.experience}</div></div><span className="ml-auto px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] text-emerald-700">Hired</span></div>
              <div className="mt-4 flex flex-wrap gap-2">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-[12px]">
                    <span className={`w-7 h-7 rounded-full grid place-items-center border text-[11px] ${i === 1 ? "bg-amber-500 border-amber-500 text-white" : i === 0 ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-bdr text-muted"}`}>{i === 0 ? "✓" : i + 1}</span>
                    <span className={i === 1 ? "font-medium text-amber-700" : "text-muted"}>{s}</span>
                    {i < steps.length - 1 && <span className="material-symbols-outlined text-[16px] text-muted">arrow_forward</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => showToast("Documents verified for " + c.name)}>Verify Documents</Button>
                <Button size="sm" onClick={() => showToast("Onboarding completed for " + c.name)}>Complete Onboarding</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}