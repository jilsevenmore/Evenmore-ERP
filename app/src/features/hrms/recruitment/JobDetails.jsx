import { useParams, useNavigate } from "react-router-dom";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { Button } from "../../../components/hrms/Button";
export default function JobDetails() {
  const { id } = useParams();
  const jobs = useRecruitmentStore((s) => s.jobs);
  const candidates = useRecruitmentStore((s) => s.candidates);
  const navigate = useNavigate();
  const job = jobs.find((j) => j.id === id);
  if (!job) return <div className="py-10 text-center">Job not found <Button variant="secondary" onClick={() => navigate("/hrms/recruitment/jobs")}>Back</Button></div>;
  const applicants = candidates.filter((c) => c.jobId === job.id);
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div><h1 className="text-[22px] font-bold">{job.title}</h1><p className="text-[13px] text-muted">{job.department} • {job.branch} • {job.employmentType} • {job.workMode} • {job.experience} • {job.openings} openings • Recruiter: {job.recruiter} • Hiring Manager: {job.hiringManager}</p><span className={`mt-2 inline-flex px-2 py-1 rounded-full text-[11px] border ${job.status === "Open" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-bdr"}`}>{job.status}</span></div>
        <Button onClick={() => navigate("/hrms/recruitment/applications")}>View Applicants</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Job Description</h3><p className="text-[13px] text-muted mt-2">{job.description}</p><h4 className="font-medium mt-3 text-[13px]">Responsibilities</h4><p className="text-[13px] text-muted">{job.responsibilities}</p><h4 className="font-medium mt-3 text-[13px]">Required Skills</h4><p className="text-[13px] text-muted">{job.requiredSkills}</p></div>
        <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold">Recruitment Statistics</h3>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[12px]">
            {[
    { k: "Applicants", v: job.applicants },
    { k: "Screening", v: applicants.filter((a) => a.stage === "Screening").length },
    { k: "Interviews", v: job.interviews },
    { k: "Shortlisted", v: applicants.filter((a) => a.stage === "Shortlisted").length },
    { k: "Offers", v: applicants.filter((a) => a.stage === "Offer").length },
    { k: "Hired", v: applicants.filter((a) => a.stage === "Hired").length }
  ].map((s) => <div key={s.k} className="bg-off border border-bdr rounded-xl p-3"><div className="text-muted">{s.k}</div><div className="font-bold text-[16px]">{s.v}</div></div>)}
          </div>
          <h4 className="font-medium mt-4 text-[13px]">Recruitment Timeline</h4>
          <div className="mt-2 space-y-2 text-[12px] text-muted">
            <div>• Job Created — {job.createdAt}</div>
            <div>• Applications Started — {job.startDate}</div>
            <div>• First Interview — 10 Sep 2024</div>
            <div>• Candidate Shortlisted — 12 Sep 2024</div>
            <div>• Offer Sent — 02 Sep 2024</div>
            <div>• Candidate Hired — 08 Sep 2024</div>
          </div>
        </div>
      </div>
    </div>;
}
