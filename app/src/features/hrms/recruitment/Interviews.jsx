import { useState, useMemo, useEffect } from "react";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { useNavigate, useLocation } from "react-router-dom";
import { DataTable } from "../../../components/hrms/DataTable";
import { FilterBar } from "../../../components/hrms/FilterBar";
import { Drawer } from "../../../components/hrms/Drawer";
import { Button } from "../../../components/hrms/Button";
import { ArrowLeft } from "lucide-react";
export default function Interviews() {
  const { interviews, addInterview, candidates, jobs } = useRecruitmentStore();
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [view, setView] = useState("List");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openSchedule) {
      setDrawerOpen(true);
    }
  }, [location.state]);
  const [form, setForm] = useState({ candidateId: "CAND-001", job: "Senior Backend Developer", type: "Technical Interview", interviewer: "Rahul Mehta", date: "10 Sep 2026", start: "10:30 AM", end: "11:30 AM", mode: "Video Call", meetingLink: "https://meet.google.com/abc", notes: "" });
  const filtered = useMemo(() => interviews.filter((i) => {
    if (search && !`${i.candidateName} ${i.job} ${i.interviewer}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [interviews, search]);
  const todays = interviews.filter((i) => i.status === "Scheduled").length;
  function schedule() {
    if (!form.candidateId) {
      showToast("Candidate required");
      return;
    }
    const cand = candidates.find((c) => c.id === form.candidateId);
    addInterview({ id: `INT-${Date.now()}`, candidateId: form.candidateId, candidateName: cand?.name || "Candidate", avatar: cand?.avatar || "https://i.pravatar.cc/100?img=15", job: form.job, type: form.type, date: form.date, start: form.start, end: form.end, duration: "60m", interviewer: form.interviewer, mode: form.mode, location: form.mode === "Video Call" ? form.meetingLink : "Office", status: "Scheduled", meetingLink: form.meetingLink });
    showToast("Interview scheduled successfully.");
    setDrawerOpen(false);
  }
  const cols = [
    { key: "candidateName", header: "Candidate", sortable: true, render: (r) => <div className="flex items-center gap-2"><img src={r.avatar} alt="" className="w-7 h-7 rounded-full" />{r.candidateName}</div> },
    { key: "job", header: "Job" },
    { key: "type", header: "Interview Type" },
    { key: "date", header: "Date", sortable: true, render: (r) => `${r.date} ${r.start}` },
    { key: "interviewer", header: "Interviewer" },
    { key: "mode", header: "Mode" },
    { key: "status", header: "Status", render: (r) => <span className={`px-2 py-1 rounded-full text-[11px] border ${r.status === "Completed" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : r.status === "Cancelled" ? "bg-red-50 border-red-200 text-red-600" : "bg-amber-50 border-amber-200 text-amber-700"}`}>{r.status}</span> },
    { key: "actions", header: "Actions", render: (r) => <div className="flex gap-1">
        <button onClick={() => navigate(`/hrms/recruitment/interviews/${r.id}`)} className="text-navy text-[12px] underline">View</button>
        <button onClick={() => window.open(r.meetingLink || "#", "_blank")} className="text-[11px] border border-bdr rounded-lg px-2">Join</button>
      </div> }
  ];
  return <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate("/hrms/recruitment")}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 hover:text-navy transition w-fit cursor-pointer group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Recruitment Setup</span>
      </button>

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div><h1 className="text-[22px] font-bold">Interviews</h1><p className="text-[13px] text-muted">Schedule and manage interviews.</p></div>
        <Button onClick={() => setDrawerOpen(true)}>+ Schedule Interview</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
    { k: "Today's Interviews", v: todays },
    { k: "Upcoming", v: interviews.filter((i) => i.status === "Scheduled").length },
    { k: "Completed", v: interviews.filter((i) => i.status === "Completed").length },
    { k: "Cancelled", v: interviews.filter((i) => i.status === "Cancelled").length }
  ].map((x) => <div key={x.k} className="bg-white border border-bdr rounded-xl p-4 shadow-sm"><div className="text-[11px] tracking-widest uppercase text-muted">{x.k}</div><div className="text-[20px] font-bold mt-1">{x.v}</div></div>)}
      </div>
      <div className="flex gap-2">
        <div className="flex p-1 bg-off border border-bdr rounded-xl"><button onClick={() => setView("List")} className={`px-3 py-1.5 rounded-lg text-[12px] ${view === "List" ? "bg-white border border-bdr shadow-sm font-medium" : ""}`}>List View</button><button onClick={() => setView("Calendar")} className={`px-3 py-1.5 rounded-lg text-[12px] ${view === "Calendar" ? "bg-white border border-bdr shadow-sm font-medium" : ""}`}>Calendar View</button></div>
        <FilterBar search={search} onSearch={setSearch} selects={[]} onClear={() => setSearch("")} />
      </div>
      {view === "List" ? <DataTable columns={cols} data={filtered} /> : <div className="bg-white border border-bdr rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-7 gap-px bg-bdr border border-bdr rounded-xl overflow-hidden text-center text-[11px]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-off py-2 font-medium text-muted">{d}</div>)}
            {Array.from({ length: 28 }).map((_, i) => {
    const day = interviews.find((iv) => iv.date.includes(String(i + 1).padStart(2, "0")));
    return <div key={i} className="bg-white h-20 p-1 text-left"><span className="text-[11px]">{i + 1}</span>{day && <div onClick={() => navigate(`/hrms/recruitment/interviews/${day.id}`)} className="mt-1 px-1 py-0.5 bg-navy text-white rounded text-[10px] truncate cursor-pointer">{day.start} {day.candidateName}</div>}</div>;
  })}
          </div>
        </div>}

      <Drawer
    isOpen={drawerOpen}
    onClose={() => setDrawerOpen(false)}
    title="Schedule Interview"
    subtitle="Candidate, job, type, interviewer and time"
    footer={<><Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button><Button onClick={schedule}>Schedule Interview</Button></>}
  >
        <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Candidate *</span><select value={form.candidateId} onChange={(e) => setForm({ ...form, candidateId: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl"><option value="">Select</option>{candidates.slice(0, 8).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Job *</span><select value={form.job} onChange={(e) => setForm({ ...form, job: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl"><option>Senior Backend Developer</option><option>Product Designer</option><option>HR Manager</option></select></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Interview Type *</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl"><option>HR Interview</option><option>Technical Interview</option><option>Manager Interview</option><option>Final Interview</option><option>Assessment</option></select></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Interviewer *</span><input value={form.interviewer} onChange={(e) => setForm({ ...form, interviewer: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" placeholder="Rahul Mehta" /></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Date *</span><input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Start Time *</span><input value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" placeholder="10:30 AM" /></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">End Time *</span><input value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" placeholder="11:30 AM" /></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Interview Mode *</span><select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl"><option>Video Call</option><option>In Person</option><option>Phone</option></select></label>
          <label className="sm:col-span-2 flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Meeting Link / Location</span><input value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" placeholder="https://meet.google.com/..." /></label>
        </div>
      </Drawer>
    </div>;
}
