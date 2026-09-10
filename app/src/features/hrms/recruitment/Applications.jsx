import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { DataTable } from "../../../components/hrms/DataTable";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../../stores/appStore";
export default function Applications() {
  const candidates = useRecruitmentStore((s) => s.candidates);
  const changeStage = useRecruitmentStore((s) => s.changeStage);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const cols = [
    { key: "name", header: "Candidate", sortable: true, render: (r) => <div className="flex items-center gap-2"><img src={r.avatar} alt="" className="w-7 h-7 rounded-full" />{r.name}</div> },
    { key: "position", header: "Job", sortable: true },
    { key: "appliedDate", header: "Application Date", sortable: true },
    { key: "source", header: "Source" },
    { key: "stage", header: "Stage" },
    { key: "recruiter", header: "Recruiter" },
    { key: "interviewStatus", header: "Interview" },
    { key: "actions", header: "Action", render: (r) => <div className="flex gap-1 text-[11px]">
        <button onClick={() => navigate(`/hrms/recruitment/candidates/${r.id}`)} className="px-2 py-1 bg-white border border-bdr rounded-lg">View</button>
        <select value={r.stage} onChange={(e) => {
      changeStage(r.id, e.target.value);
      showToast("Moved to " + e.target.value);
    }} className="h-7 px-1 bg-off border border-bdr rounded-lg"><option>Applied</option><option>Screening</option><option>Interview</option><option>Shortlisted</option><option>Offer</option><option>Hired</option><option>Rejected</option></select>
      </div> }
  ];
  return <div className="flex flex-col gap-5">
      <div><h1 className="text-[22px] font-bold">Job Applications</h1><p className="text-[13px] text-muted">{candidates.length} applications</p></div>
      <DataTable columns={cols} data={candidates} />
    </div>;
}
