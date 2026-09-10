import { useParams, useNavigate } from "react-router-dom";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../../components/hrms/Button";
export default function InterviewDetails() {
  const { id } = useParams();
  const interviews = useRecruitmentStore((s) => s.interviews);
  const updateInterview = useRecruitmentStore((s) => s.updateInterview);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const it = interviews.find((i) => i.id === id);
  if (!it) return <div className="py-10 text-center">Interview not found <Button variant="secondary" onClick={() => navigate("/hrms/recruitment/interviews")}>Back</Button></div>;
  return <div className="flex flex-col gap-6">
      <div className="bg-white border border-bdr rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 justify-between">
          <div><h1 className="text-[20px] font-bold">{it.candidateName} — {it.job}</h1><p className="text-[13px] text-muted">{it.type} • {it.date} • {it.start} - {it.end} ({it.duration}) • Interviewer: {it.interviewer} • {it.mode} • <span className="px-2 py-1 bg-off border border-bdr rounded-full text-[11px]">{it.status}</span></p><p className="text-[12px] text-muted mt-1">{it.mode === "Video Call" ? <a href={it.meetingLink} target="_blank" className="text-navy underline">{it.meetingLink}</a> : it.location}</p></div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => window.open(it.meetingLink || "#", "_blank")}>Join Meeting</Button>
            <Button size="sm" variant="secondary" onClick={() => showToast("Edit interview")}>Edit</Button>
            <Button size="sm" variant="secondary" onClick={() => showToast("Rescheduled")}>Reschedule</Button>
            <Button size="sm" variant="danger" onClick={() => {
    updateInterview(it.id, { status: "Cancelled" });
    showToast("Interview cancelled");
  }}>Cancel</Button>
            <Button size="sm" onClick={() => {
    updateInterview(it.id, { status: "Completed", score: 88, feedback: "Good fit" });
    showToast("Marked completed");
  }}>Mark Completed</Button>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/hrms/recruitment/candidates/${it.candidateId}`)}>View Candidate</Button>
          </div>
        </div>
        {it.status === "Completed" && <div className="mt-6 grid md:grid-cols-3 gap-3 text-center">
            <div className="bg-off border border-bdr rounded-xl p-4"><div className="text-[11px] text-muted uppercase">Technical Score</div><div className="text-[20px] font-bold">{it.score ?? 88}%</div></div>
            <div className="bg-off border border-bdr rounded-xl p-4"><div className="text-[11px] text-muted uppercase">HR Score</div><div className="text-[20px] font-bold">91%</div></div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"><div className="text-[11px] text-emerald-700 uppercase">Overall</div><div className="text-[20px] font-bold text-emerald-700">89%</div><div className="text-[12px] text-muted">{it.feedback}</div><div className="text-[11px] px-2 py-1 bg-white border border-bdr rounded-full w-fit mx-auto mt-1">Recommended</div></div>
          </div>}
      </div>
    </div>;
}
