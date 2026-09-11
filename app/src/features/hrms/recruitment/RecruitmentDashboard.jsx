import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { useNavigate } from "react-router-dom";
import { CandidatePipeline } from "../../../components/hrms/CandidatePipeline";
import { Users, Briefcase, Calendar, Award, UserCheck, Clock } from "lucide-react";
import { Button } from "../../../components/hrms/Button";
export default function RecruitmentDashboard() {
  const { jobs, candidates, interviews, offers } = useRecruitmentStore();
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const kpis = [
    { label: "Open Positions", value: String(jobs.filter((j) => j.status === "Open").length), sub: "+8.2%", to: "/hrms/recruitment/jobs", icon: Briefcase },
    { label: "New Candidates", value: "142", sub: "+12.5%", to: "/hrms/recruitment/candidates", icon: Users },
    { label: "Interviews", value: "38", sub: "Today: 6", to: "/hrms/recruitment/interviews", icon: Calendar },
    { label: "Offers", value: String(offers.filter((o) => o.status === "Pending").length), sub: "Pending: 4", to: "/hrms/recruitment/offers", icon: Award },
    { label: "Hired", value: String(candidates.filter((c) => c.stage === "Hired").length), sub: "This Month", to: "/hrms/recruitment/onboarding", icon: UserCheck },
    { label: "Time to Hire", value: "22 days", sub: "-3 days", to: "/hrms/recruitment/funnel", icon: Clock }
  ];
  const todays = interviews.filter((i) => i.date === "09 Sep 2026").slice(0, 1);
  const upcoming = interviews.filter((i) => i.status === "Scheduled").slice(0, 3);
  const shortlisted = candidates.filter((c) => c.stage === "Shortlisted").slice(0, 3);
  const recent = candidates.slice(0, 5);
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div><h1 className="text-[22px] font-bold">Recruitment Setup</h1><p className="text-[13px] text-muted">Pipeline, interviews and hiring overview.</p></div>
        <Button onClick={() => navigate("/hrms/recruitment/jobs", { state: { openCreate: true } })}>+ Create Job Opening</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => <button key={k.label} onClick={() => navigate(k.to)} className="bg-white border border-[#e8edf3] rounded-2xl p-4 shadow-sm text-left hover:shadow-subtle transition">
            <div className="flex justify-between items-start"><span className="text-[11px] font-semibold tracking-widest uppercase text-muted">{k.label}</span><k.icon size={14} className="text-muted" /></div>
            <div className="text-[22px] font-bold mt-2">{k.value}</div>
            <div className="text-[11px] text-emerald-600">{k.sub}</div>
          </button>)}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => navigate("/hrms/recruitment/jobs", { state: { openCreate: true } })}>+ Create Job Opening</Button>
        <Button size="sm" variant="secondary" onClick={() => navigate("/hrms/recruitment/candidates", { state: { openAdd: true } })}>+ Add Candidate</Button>
        <Button size="sm" variant="secondary" onClick={() => navigate("/hrms/recruitment/interviews", { state: { openSchedule: true } })}>+ Schedule Interview</Button>
        <Button size="sm" variant="secondary" onClick={() => navigate("/hrms/recruitment/offers", { state: { openCreate: true } })}>+ Create Offer</Button>
        <Button size="sm" variant="secondary" onClick={() => navigate("/hrms/recruitment/candidates")}>View Candidates</Button>
        <Button size="sm" variant="secondary" onClick={() => navigate("/hrms/recruitment/interviews")}>View Interviews</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-[#111827]">Today's Interviews</h3>
          {todays.length === 0 ? <div className="text-[13px] text-muted mt-3">No interviews today</div> : todays.map((it) => <div key={it.id} className="mt-3 rounded-xl p-4 bg-[#f8fafc] border border-[#f1f5f9]">
              <div className="text-[12px] font-medium text-navy">{it.start} - {it.end} • {it.date} • {it.duration} • {it.mode}</div>
              <div className="flex gap-3 mt-2">
                <img src={it.avatar} alt="" className="w-10 h-10 rounded-full" />
                <div><div className="font-semibold text-[#111827]">{it.candidateName}</div><div className="text-[13px] text-muted">{it.job}</div><div className="text-[12px] text-muted">{it.type} • Interviewer: {it.interviewer}</div></div>
              </div>
              <div className="text-[12px] mt-2">{it.mode === "Video Call" ? <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700">Google Meet</span> : it.location}</div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => window.open(it.meetingLink || "#", "_blank")}>Join Interview</Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/hrms/recruitment/candidates/${it.candidateId}`)}>View Candidate</Button>
              </div>
            </div>)}
        </div>
        <div className="lg:col-span-4 bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-[#111827]">Upcoming Interviews</h3>
          <div className="mt-3 space-y-3">
            <div className="text-[11px] font-semibold text-muted uppercase">Today</div>
            {upcoming.map((it) => <button key={it.id} onClick={() => navigate(`/hrms/recruitment/interviews/${it.id}`)} className="w-full text-left rounded-xl p-3 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#f1f5f9] transition">
                <div className="text-[12px] font-medium text-[#111827]">{it.start} • {it.candidateName}</div><div className="text-[11px] text-muted">{it.type} • {it.interviewer}</div>
              </button>)}
            <div className="text-[11px] font-semibold text-muted uppercase mt-2">Tomorrow • 2:00 PM Chen Li • Manager Interview • Amit Patel</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-[#111827]">Requires Your Attention</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-[13px]">
          {[
    { t: "3 interviews today", to: "/hrms/recruitment/interviews" },
    { t: "5 candidates waiting for screening", to: "/hrms/recruitment/candidates" },
    { t: "2 shortlisted candidates waiting for final interview", to: "/hrms/recruitment/candidates" },
    { t: `${offers.filter((o) => o.status === "Pending").length} offers pending`, to: "/hrms/recruitment/offers" },
    { t: "2 jobs closing soon", to: "/hrms/recruitment/jobs" },
    { t: "3 candidates awaiting recruiter action", to: "/hrms/recruitment/applications" }
  ].map((x) => <div key={x.t} className="flex justify-between items-center rounded-xl px-4 py-3 bg-[#f8fafc] border border-[#f1f5f9]"><span>{x.t}</span><Button size="sm" variant="secondary" onClick={() => navigate(x.to)}>View</Button></div>)}
        </div>
      </div>

      <CandidatePipeline />

      <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-sm overflow-x-auto">
        <div className="flex justify-between items-center"><h3 className="font-semibold text-[#111827]">Recent Candidates</h3><Button size="sm" variant="secondary" onClick={() => navigate("/hrms/recruitment/candidates")}>View All</Button></div>
        <table className="w-full text-left mt-3 min-w-[800px]">
          <thead className="bg-[#f8fafc] border-y border-[#e2e8f0] text-[11px] uppercase text-muted"><tr><th className="py-2.5 px-3">Candidate</th><th className="py-2.5 px-3">Position</th><th className="py-2.5 px-3">Experience</th><th className="py-2.5 px-3">Applied Date</th><th className="py-2.5 px-3">Stage</th><th className="py-2.5 px-3">Recruiter</th><th className="py-2.5 px-3">Action</th></tr></thead>
          <tbody className="divide-y divide-[#f1f5f9] text-[13px]">
            {recent.map((c) => <tr key={c.id}><td className="py-2.5 px-3"><div className="flex items-center gap-2"><img src={c.avatar} alt="" className="w-7 h-7 rounded-full" />{c.name}</div></td><td className="py-2.5 px-3">{c.position}</td><td className="py-2.5 px-3">{c.experience}</td><td className="py-2.5 px-3">{c.appliedDate}</td><td className="py-2.5 px-3"><span className="px-2 py-1 bg-[#f1f5f9] border border-[#cbd5e1] rounded-full text-[11px]">{c.stage}</span></td><td className="py-2.5 px-3">{c.recruiter}</td><td className="py-2.5 px-3"><button onClick={() => navigate(`/hrms/recruitment/candidates/${c.id}`)} className="text-navy text-[12px] underline">View</button></td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-[#111827]">Shortlisted / Selected Candidates</h3>
        {shortlisted.length === 0 ? <div className="text-[13px] text-muted mt-2">No shortlisted candidates</div> : <div className="grid md:grid-cols-3 gap-3 mt-3">
            {shortlisted.map((c) => <div key={c.id} className="rounded-xl p-4 bg-[#f8fafc] border border-[#f1f5f9]">
                <div className="flex items-center gap-2"><img src={c.avatar} alt="" className="w-8 h-8 rounded-full" /><div><div className="font-medium text-[13px]">{c.name}</div><div className="text-[11px] text-muted">{c.position}</div></div></div>
                <div className="text-[12px] mt-2">Technical: <b>{c.technicalScore}%</b> • HR: <b>{c.hrScore}%</b></div>
                <div className="text-[11px] px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full w-fit mt-2 text-emerald-700">{c.recommendation}</div>
                <div className="text-[12px] text-muted mt-2">Next: Final Interview • <span className="px-2 py-0.5 bg-[#f1f5f9] border border-[#cbd5e1] rounded-full">{c.stage}</span></div>
                <div className="flex gap-1 mt-3"><Button size="sm" variant="secondary" onClick={() => navigate(`/hrms/recruitment/candidates/${c.id}`)}>View</Button><Button size="sm" onClick={() => {
    const s = useRecruitmentStore.getState();
    s.changeStage(c.id, "Offer");
    showToast("Moved to Offer");
  }}>Move to Offer</Button></div>
              </div>)}
          </div>}
      </div>

      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm overflow-x-auto">
        <div className="flex justify-between"><h3 className="font-semibold">Active Job Openings</h3><Button size="sm" variant="secondary" onClick={() => navigate("/hrms/recruitment/jobs")}>View All</Button></div>
        <table className="w-full text-left mt-3 min-w-[900px]">
          <thead className="bg-off border-y border-bdr text-[11px] uppercase text-muted"><tr><th className="py-2 px-3">Job</th><th className="py-2 px-3">Department</th><th className="py-2 px-3">Branch</th><th className="py-2 px-3">Openings</th><th className="py-2 px-3">Applicants</th><th className="py-2 px-3">Interviews</th><th className="py-2 px-3">Start Date</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Action</th></tr></thead>
          <tbody className="divide-y divide-bdr/60 text-[13px]">
            {jobs.filter((j) => j.status === "Open").slice(0, 5).map((j) => <tr key={j.id}><td className="py-2 px-3 font-medium">{j.title}</td><td className="py-2 px-3">{j.department}</td><td className="py-2 px-3">{j.branch}</td><td className="py-2 px-3">{j.openings}</td><td className="py-2 px-3">{j.applicants}</td><td className="py-2 px-3">{j.interviews}</td><td className="py-2 px-3">{j.startDate}</td><td className="py-2 px-3"><span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] text-emerald-700">{j.status}</span></td><td className="py-2 px-3"><button onClick={() => navigate(`/hrms/recruitment/jobs/${j.id}`)} className="text-navy text-[12px] underline">View</button></td></tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}
