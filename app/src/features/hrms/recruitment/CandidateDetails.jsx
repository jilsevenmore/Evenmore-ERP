import { useParams, useNavigate } from "react-router-dom";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../../components/hrms/Button";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
export default function CandidateDetails() {
  const { id } = useParams();
  const candidates = useRecruitmentStore((s) => s.candidates);
  const interviews = useRecruitmentStore((s) => s.interviews);
  const changeStage = useRecruitmentStore((s) => s.changeStage);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const c = candidates.find((x) => x.id === id);
  if (!c) return <div className="py-10 text-center">Candidate not found <Button variant="secondary" onClick={() => navigate("/recruitment/candidates")}>Back</Button></div>;
  const history = interviews.filter((i) => i.candidateId === c.id);
  return <div className="flex flex-col gap-6">
      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm flex flex-wrap gap-4 items-center">
        <img src={c.avatar} alt="" className="w-14 h-14 rounded-full" />
        <div><div className="font-bold text-[18px]">{c.name}</div><div className="text-[13px] text-muted">{c.position} • {c.stage} • <StatusBadge status={c.stage === "Hired" ? "Active" : c.stage === "Rejected" ? "Cancelled" : c.stage} /></div></div>
        <div className="ml-auto flex flex-wrap gap-2">
          <select value={c.stage} onChange={(e) => {
    changeStage(c.id, e.target.value);
    showToast("Stage changed to " + e.target.value);
  }} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>Applied</option><option>Screening</option><option>Interview</option><option>Shortlisted</option><option>Offer</option><option>Hired</option><option>Rejected</option></select>
          <Button size="sm" onClick={() => navigate("/recruitment/interviews")}>Schedule Interview</Button>
          <Button size="sm" variant="secondary" onClick={() => {
    changeStage(c.id, "Shortlisted");
    showToast("Shortlisted");
  }}>Shortlist</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate("/recruitment/offers")}>Create Offer</Button>
          <Button size="sm" variant="danger" onClick={() => {
    changeStage(c.id, "Rejected");
    showToast("Rejected");
  }}>Reject</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Personal Information</h3><div className="text-[13px] text-muted mt-2 space-y-1"><div>Email: {c.email}</div><div>Phone: {c.phone}</div><div>Location: {c.location}</div></div></div>
        <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Professional Information</h3><div className="text-[13px] text-muted mt-2 space-y-1"><div>Position: {c.position}</div><div>Experience: {c.experience}</div><div>Skills: {c.skills}</div><div>Recruiter: {c.recruiter}</div><div>Source: {c.source}</div></div></div>
      </div>

      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Resume</h3><div className="mt-2 border border-dashed border-bdr rounded-xl p-4 bg-off text-[13px] text-muted flex items-center gap-2"><span className="material-symbols-outlined">description</span>Resume file UI (mock) — {c.name}_Resume.pdf <Button size="sm" variant="secondary" onClick={() => showToast("Download started")}>Download</Button></div></div>

      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Interview History & Scores</h3>
        {history.length === 0 ? <div className="text-[13px] text-muted mt-2">No interviews yet</div> : <div className="mt-2 space-y-2">
            {history.map((h) => <div key={h.id} className="border border-bdr rounded-xl p-3 bg-off/30">
                <div className="text-[13px] font-medium">{h.type} — {h.date} {h.start}-{h.end} • {h.interviewer} • {h.mode}</div>
                {h.score && <div className="text-[12px] mt-1">Score: <b>{h.score}</b> • Feedback: {h.feedback}</div>}
              </div>)}
          </div>}
        {c.technicalScore ? <div className="mt-3 text-[13px]">Technical: <b>{c.technicalScore}%</b> • HR: <b>{c.hrScore}%</b> • <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700">{c.recommendation}</span></div> : null}
      </div>

      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Candidate Timeline</h3>
        <div className="mt-3 relative pl-6 border-l border-bdr space-y-3 text-[13px]">
          {["Applied", "Screening", "Interview Scheduled", "Interview Completed", "Shortlisted", "Offer", "Hired"].map((s, i) => <div key={s} className="relative"><span className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 ${["Applied", "Screening"].includes(c.stage) || i === 0 ? "bg-navy border-navy" : "bg-white border-bdr"}`} /><div className={`${s === c.stage ? "font-semibold text-navy" : "text-muted"}`}>{s} {s === c.stage && "\u2022 Current"}</div></div>)}
        </div>
      </div>
    </div>;
}
