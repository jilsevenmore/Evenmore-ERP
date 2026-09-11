import { useState } from "react";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../../components/hrms/Button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Onboarding() {
  const { candidates, offers } = useRecruitmentStore();
  const { showToast, addEmployee, employees } = useAppStore();
  const navigate = useNavigate();
  const [completedMap, setCompletedMap] = useState({});
  const hired = candidates.filter((c) => c.stage === "Hired");
  const steps = ["Offer Accepted", "Documents Pending", "Documents Verified", "Joining Scheduled", "Onboarding Complete"];

  function handleCompleteOnboarding(c) {
    const isAlreadyEmployee = employees.some(
      (e) => e.email?.toLowerCase() === c.email?.toLowerCase() || e.name?.toLowerCase() === c.name?.toLowerCase()
    );

    if (!isAlreadyEmployee) {
      const matchingOffer = offers.find((o) => o.candidateId === c.id);
      const newEmp = {
        id: `EMP${1035 + (employees.length % 50)}`,
        name: c.name,
        email: c.email || `${c.name.toLowerCase().replace(/\s+/g, ".")}@company.com`,
        avatar: c.avatar || "https://i.pravatar.cc/100?img=15",
        img: c.avatar || "https://i.pravatar.cc/100?img=15",
        designation: c.position || "Software Engineer",
        department: c.position?.includes("Design") ? "Design" : c.position?.includes("HR") ? "HR" : "Engineering",
        manager: matchingOffer?.reportingManager || "David Park",
        location: c.location || "New York",
        joining: matchingOffer?.joiningDate || new Date().toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" }),
        status: "Active",
      };
      addEmployee(newEmp);
    }

    setCompletedMap((prev) => ({ ...prev, [c.id]: true }));
    showToast(`Onboarding completed & ${c.name} added to Employee Directory!`);
  }

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">Job Onboarding</h1>
          <p className="text-[13px] text-muted">{hired.length} hired candidates in onboarding</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => navigate("/hrms/employees")}>
          View Employee Directory
        </Button>
      </div>
      {hired.length === 0 ? (
        <div className="bg-white border border-bdr rounded-xl p-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-off border border-bdr grid place-items-center mx-auto text-muted"><span className="material-symbols-outlined">person_check</span></div>
          <div className="font-medium mt-3">No hired candidates</div><div className="text-[13px] text-muted">When a candidate is marked Hired, they appear here.</div>
          <Button size="sm" onClick={() => navigate("/hrms/recruitment/candidates")} className="mt-3">View Candidates</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {hired.map((c) => {
            const isDone = completedMap[c.id];
            return (
              <div key={c.id} className="bg-white border border-bdr rounded-xl p-5 shadow-sm">
                <div className="flex gap-3 items-center">
                  <img src={c.avatar} alt="" className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-[13px] text-muted">{c.position} • {c.experience}</div>
                  </div>
                  <span className="ml-auto px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] text-emerald-700 font-medium">
                    {isDone ? "Onboarded as Employee" : "Hired"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {steps.map((s, i) => {
                    const activeStepIndex = isDone ? 4 : 1;
                    const isStepComplete = isDone ? true : i === 0;
                    return (
                      <div key={s} className="flex items-center gap-2 text-[12px]">
                        <span
                          className={`w-7 h-7 rounded-full grid place-items-center border text-[11px] font-medium ${
                            isStepComplete
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : i === activeStepIndex
                              ? "bg-amber-500 border-amber-500 text-white"
                              : "bg-white border-bdr text-muted"
                          }`}
                        >
                          {isStepComplete ? "✓" : i + 1}
                        </span>
                        <span className={i === activeStepIndex && !isDone ? "font-medium text-amber-700" : isStepComplete ? "font-medium text-emerald-800" : "text-muted"}>
                          {s}
                        </span>
                        {i < steps.length - 1 && <span className="material-symbols-outlined text-[16px] text-muted">arrow_forward</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => showToast("Documents verified for " + c.name)}>
                    Verify Documents
                  </Button>
                  <Button
                    size="sm"
                    disabled={isDone}
                    onClick={() => handleCompleteOnboarding(c)}
                    className={isDone ? "opacity-60 cursor-not-allowed" : ""}
                  >
                    {isDone ? "Onboarding Complete ✓" : "Complete Onboarding"}
                  </Button>
                  {isDone && (
                    <Button size="sm" variant="secondary" onClick={() => navigate("/hrms/employees")}>
                      Open in Directory
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}