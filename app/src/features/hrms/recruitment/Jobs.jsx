import { useState, useMemo } from "react";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { useNavigate } from "react-router-dom";
import { DataTable } from "../../../components/hrms/DataTable";
import { FilterBar } from "../../../components/hrms/FilterBar";
import { Drawer } from "../../../components/hrms/Drawer";
import { Modal } from "../../../components/hrms/Modal";
import { Button } from "../../../components/hrms/Button";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { Eye, Pencil, Trash2, Copy, Users } from "lucide-react";
export default function Jobs() {
  const { jobs, addJob, updateJob, deleteJob } = useRecruitmentStore();
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [branch, setBranch] = useState("All");
  const [status, setStatus] = useState("All");
  const [workMode, setWorkMode] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ title: "", code: "", department: "Engineering", branch: "New York", employmentType: "Full-time", experience: "3-5 years", openings: 1, description: "", responsibilities: "", requiredSkills: "", location: "New York", workMode: "Hybrid", recruiter: "Ayesha Khan", hiringManager: "David Park", startDate: "01 Oct 2024" });
  const filtered = useMemo(() => jobs.filter((j) => {
    if (search && !`${j.title} ${j.code}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (dept !== "All" && j.department !== dept) return false;
    if (branch !== "All" && j.branch !== branch) return false;
    if (status !== "All" && j.status !== status) return false;
    if (workMode !== "All" && j.workMode !== workMode) return false;
    return true;
  }), [jobs, search, dept, branch, status, workMode]);
  function openCreate() {
    setEditing(null);
    setForm({ title: "", code: "", department: "Engineering", branch: "New York", employmentType: "Full-time", experience: "3-5 years", openings: 1, description: "", responsibilities: "", requiredSkills: "", location: "New York", workMode: "Hybrid", recruiter: "Ayesha Khan", hiringManager: "David Park", startDate: "01 Oct 2024" });
    setDrawerOpen(true);
  }
  function openEdit(j) {
    setEditing(j.id);
    setForm({ title: j.title, code: j.code, department: j.department, branch: j.branch, employmentType: j.employmentType, experience: j.experience, openings: j.openings, description: j.description, responsibilities: j.responsibilities, requiredSkills: j.requiredSkills, location: j.location, workMode: j.workMode, recruiter: j.recruiter, hiringManager: j.hiringManager, startDate: j.startDate });
    setDrawerOpen(true);
  }
  function save(publish) {
    if (!form.title.trim()) {
      showToast("Job Title required");
      return;
    }
    if (!form.department) {
      showToast("Department required");
      return;
    }
    if (editing) {
      updateJob(editing, { title: form.title, code: form.code || `CODE-${Date.now()}`, department: form.department, branch: form.branch, employmentType: form.employmentType, experience: form.experience, openings: Number(form.openings), description: form.description, responsibilities: form.responsibilities, requiredSkills: form.requiredSkills, location: form.location, workMode: form.workMode, recruiter: form.recruiter, hiringManager: form.hiringManager, status: publish ? "Open" : "Draft" });
      showToast(publish ? "Job published" : "Draft saved");
    } else {
      addJob({ id: `JOB-${String(jobs.length + 1).padStart(3, "0")}`, title: form.title, code: form.code || `JOB-${Date.now()}`, department: form.department, branch: form.branch, employmentType: form.employmentType, experience: form.experience, openings: Number(form.openings), applicants: 0, interviews: 0, startDate: form.startDate, createdAt: "09 Sep 2026", status: publish ? "Open" : "Draft", recruiter: form.recruiter, hiringManager: form.hiringManager, description: form.description, responsibilities: form.responsibilities, requiredSkills: form.requiredSkills, salaryRange: "$80k", location: form.location });
      showToast(publish ? "Job opening created successfully." : "Draft saved");
    }
    setDrawerOpen(false);
  }
  const cols = [
    { key: "title", header: "Job", sortable: true, render: (r) => <button onClick={() => navigate(`/recruitment/jobs/${r.id}`)} className="font-medium text-navy underline">{r.title}</button> },
    { key: "department", header: "Department", sortable: true },
    { key: "branch", header: "Branch" },
    { key: "openings", header: "Openings" },
    { key: "applicants", header: "Applicants", sortable: true },
    { key: "startDate", header: "Start Date" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status === "Open" ? "Active" : r.status === "Closed" ? "Cancelled" : "Draft"} /> },
    { key: "createdAt", header: "Created At" },
    { key: "actions", header: "Actions", render: (r) => <div className="flex gap-1">
        <button aria-label="View" onClick={() => navigate(`/recruitment/jobs/${r.id}`)} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Eye size={14} /></button>
        <button aria-label="Edit" onClick={() => openEdit(r)} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Pencil size={14} /></button>
        <button aria-label="Applicants" onClick={() => navigate(`/recruitment/applications`)} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Users size={14} /></button>
        <button aria-label="Duplicate" onClick={() => {
      addJob({ ...r, id: `JOB-${Date.now()}`, title: r.title + " Copy" });
      showToast("Job duplicated");
    }} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Copy size={14} /></button>
        <button aria-label="Delete" onClick={() => setDeleteId(r.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600 grid place-items-center"><Trash2 size={14} /></button>
      </div> }
  ];
  return <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-[22px] font-bold">Jobs</h1><p className="text-[13px] text-muted">{jobs.length} total • {jobs.filter((j) => j.status === "Open").length} open</p></div><Button onClick={openCreate}>+ Create Job</Button></div>
      <FilterBar
    search={search}
    onSearch={setSearch}
    selects={[
      { label: "Department", value: dept, onChange: setDept, options: [{ value: "All", label: "All Departments" }, { value: "Engineering", label: "Engineering" }, { value: "Design", label: "Design" }, { value: "HR", label: "HR" }, { value: "Finance", label: "Finance" }] },
      { label: "Branch", value: branch, onChange: setBranch, options: [{ value: "All", label: "All Branches" }, { value: "New York", label: "New York" }, { value: "London", label: "London" }, { value: "Dubai", label: "Dubai" }] },
      { label: "Status", value: status, onChange: setStatus, options: [{ value: "All", label: "All Status" }, { value: "Open", label: "Open" }, { value: "Draft", label: "Draft" }, { value: "Closed", label: "Closed" }] },
      { label: "Work Mode", value: workMode, onChange: setWorkMode, options: [{ value: "All", label: "All Work Mode" }, { value: "On-site", label: "On-site" }, { value: "Hybrid", label: "Hybrid" }, { value: "Remote", label: "Remote" }] }
    ]}
    onClear={() => {
      setSearch("");
      setDept("All");
      setBranch("All");
      setStatus("All");
      setWorkMode("All");
    }}
  />
      <DataTable columns={cols} data={filtered} emptyTitle="No active jobs" emptyDesc="Create your first job opening." emptyAction={<Button onClick={openCreate}>+ Create Job</Button>} />

      <Drawer
    open={drawerOpen}
    onClose={() => setDrawerOpen(false)}
    title={editing ? "Edit Job" : "Create Job Opening"}
    subtitle={editing ? "Update job details" : "Basic information, details, location and timeline"}
    actions={<><Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button><Button variant="secondary" onClick={() => save(false)}>Save Draft</Button><Button onClick={() => save(true)}>{editing ? "Update Job" : "Publish Job"}</Button></>}
  >
        <div className="space-y-6 text-[13px]">
          <div><h4 className="font-semibold">Basic Information</h4><div className="grid sm:grid-cols-2 gap-3 mt-2">
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Job Title *</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" placeholder="Senior Backend Developer" /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Job Code</span><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" placeholder="ENG-BE-001" /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Department *</span><select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl"><option>Engineering</option><option>Design</option><option>HR</option><option>Finance</option><option>Marketing</option></select></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Employment Type *</span><select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl"><option>Full-time</option><option>Part-time</option><option>Contract</option></select></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Experience Required</span><input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Number of Openings *</span><input type="number" value={form.openings} onChange={(e) => setForm({ ...form, openings: Number(e.target.value) })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
          </div></div>
          <div><h4 className="font-semibold">Job Details</h4><div className="grid gap-3 mt-2">
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Job Description *</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="p-3 bg-white border border-bdr rounded-xl resize-none" placeholder="Build scalable backend..." /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Responsibilities *</span><textarea value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} rows={2} className="p-3 bg-white border border-bdr rounded-xl resize-none" /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Required Skills *</span><input value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" placeholder="Node.js, PostgreSQL" /></label>
          </div></div>
          <div><h4 className="font-semibold">Location</h4><div className="grid sm:grid-cols-2 gap-3 mt-2">
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Work Mode</span><select value={form.workMode} onChange={(e) => setForm({ ...form, workMode: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl"><option>On-site</option><option>Hybrid</option><option>Remote</option></select></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Location</span><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
          </div></div>
          <div><h4 className="font-semibold">Assignees</h4><div className="grid sm:grid-cols-2 gap-3 mt-2">
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Recruiter</span><input value={form.recruiter} onChange={(e) => setForm({ ...form, recruiter: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Hiring Manager</span><input value={form.hiringManager} onChange={(e) => setForm({ ...form, hiringManager: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
          </div></div>
        </div>
      </Drawer>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Job?" footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" onClick={() => {
    if (deleteId) deleteJob(deleteId);
    setDeleteId(null);
    showToast("Job deleted");
  }}>Delete</Button></>}><p className="text-[13px] text-muted">Delete this job? This cannot be undone.</p></Modal>
    </div>;
}
