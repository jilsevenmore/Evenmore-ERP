import { useState, useMemo } from "react";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { useNavigate } from "react-router-dom";
import { DataTable } from "../../../components/hrms/DataTable";
import { Drawer } from "../../../components/hrms/Drawer";
import { Modal } from "../../../components/hrms/Modal";
import { Button } from "../../../components/hrms/Button";
import { Search, Eye, Pencil, Trash2, Copy, Users } from "lucide-react";

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
  const [form, setForm] = useState({
    title: "",
    code: "",
    department: "Engineering",
    branch: "New York",
    employmentType: "Full-time",
    experience: "3-5 years",
    openings: 1,
    description: "",
    responsibilities: "",
    requiredSkills: "",
    location: "New York",
    workMode: "Hybrid",
    recruiter: "Ayesha Khan",
    hiringManager: "David Park",
    startDate: "01 Oct 2024",
  });

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (search && !`${j.title} ${j.code}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (dept !== "All" && j.department !== dept) return false;
      if (branch !== "All" && j.branch !== branch) return false;
      if (status !== "All") {
        if (status === "Open" && !(j.status === "Open" || j.status === "Active")) return false;
        if (status === "Draft" && j.status !== "Draft") return false;
        if (status === "Closed" && !(j.status === "Closed" || j.status === "Cancelled")) return false;
      }
      if (workMode !== "All" && j.workMode !== workMode) return false;
      return true;
    });
  }, [jobs, search, dept, branch, status, workMode]);

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      code: "",
      department: "Engineering",
      branch: "New York",
      employmentType: "Full-time",
      experience: "3-5 years",
      openings: 1,
      description: "",
      responsibilities: "",
      requiredSkills: "",
      location: "New York",
      workMode: "Hybrid",
      recruiter: "Ayesha Khan",
      hiringManager: "David Park",
      startDate: "01 Oct 2024",
    });
    setDrawerOpen(true);
  }

  function openEdit(j) {
    setEditing(j.id);
    setForm({
      title: j.title,
      code: j.code,
      department: j.department,
      branch: j.branch,
      employmentType: j.employmentType,
      experience: j.experience,
      openings: j.openings,
      description: j.description,
      responsibilities: j.responsibilities,
      requiredSkills: j.requiredSkills,
      location: j.location,
      workMode: j.workMode,
      recruiter: j.recruiter,
      hiringManager: j.hiringManager,
      startDate: j.startDate,
    });
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
      updateJob(editing, {
        title: form.title,
        code: form.code || `CODE-${Date.now()}`,
        department: form.department,
        branch: form.branch,
        employmentType: form.employmentType,
        experience: form.experience,
        openings: Number(form.openings),
        description: form.description,
        responsibilities: form.responsibilities,
        requiredSkills: form.requiredSkills,
        location: form.location,
        workMode: form.workMode,
        recruiter: form.recruiter,
        hiringManager: form.hiringManager,
        status: publish ? "Open" : "Draft",
      });
      showToast(publish ? "Job published" : "Draft saved");
    } else {
      addJob({
        id: `JOB-${String(jobs.length + 1).padStart(3, "0")}`,
        title: form.title,
        code: form.code || `JOB-${Date.now()}`,
        department: form.department,
        branch: form.branch,
        employmentType: form.employmentType,
        experience: form.experience,
        openings: Number(form.openings),
        applicants: 0,
        interviews: 0,
        startDate: form.startDate,
        createdAt: "09 Sep 2026",
        status: publish ? "Open" : "Draft",
        recruiter: form.recruiter,
        hiringManager: form.hiringManager,
        description: form.description,
        responsibilities: form.responsibilities,
        requiredSkills: form.requiredSkills,
        salaryRange: "$80k",
        location: form.location,
      });
      showToast(publish ? "Job opening created successfully." : "Draft saved");
    }
    setDrawerOpen(false);
  }

  const cols = [
    {
      key: "title",
      header: "JOB —",
      sortable: true,
      render: (r) => (
        <button
          onClick={() => navigate(`/hrms/recruitment/jobs/${r.id}`)}
          className="font-medium text-[#1e3a8a] underline hover:text-[#2563eb] text-left transition"
        >
          {r.title}
        </button>
      ),
    },
    { key: "department", header: "DEPARTMENT —", sortable: true },
    { key: "branch", header: "BRANCH" },
    { key: "openings", header: "OPENINGS" },
    { key: "applicants", header: "APPLICANTS —", sortable: true },
    { key: "startDate", header: "START DATE" },
    {
      key: "status",
      header: "STATUS",
      render: (r) => {
        const st = r.status === "Open" || r.status === "Active" ? "Active" : r.status === "Closed" || r.status === "Cancelled" ? "Cancelled" : "Draft";
        if (st === "Active") {
          return <span className="px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#e6f4ea] text-[#15803d] border border-[#a7f3d0]">Active</span>;
        }
        if (st === "Cancelled") {
          return <span className="px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]">Cancelled</span>;
        }
        return <span className="px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]">Draft</span>;
      },
    },
    { key: "createdAt", header: "CREATED AT" },
    {
      key: "actions",
      header: "ACTIONS",
      render: (r) => (
        <div className="flex items-center gap-1.5 text-slate-500">
          <button aria-label="View" onClick={() => navigate(`/hrms/recruitment/jobs/${r.id}`)} className="p-1 hover:text-slate-800 transition">
            <Eye size={15} />
          </button>
          <button aria-label="Edit" onClick={() => openEdit(r)} className="p-1 hover:text-slate-800 transition">
            <Pencil size={15} />
          </button>
          <button aria-label="Applicants" onClick={() => navigate(`/hrms/recruitment/applications`)} className="p-1 hover:text-slate-800 transition">
            <Users size={15} />
          </button>
          <button
            aria-label="Duplicate"
            onClick={() => {
              addJob({ ...r, id: `JOB-${Date.now()}`, title: r.title + " Copy" });
              showToast("Job duplicated");
            }}
            className="p-1 hover:text-slate-800 transition"
          >
            <Copy size={15} />
          </button>
          <button aria-label="Delete" onClick={() => setDeleteId(r.id)} className="p-1 text-red-500 hover:text-red-700 transition">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-0.5">
        <div className="text-[12px] font-medium text-slate-400 flex items-center gap-1">
          <span>Home</span>
          <span>&gt;</span>
          <span className="text-slate-600">Recruitment / Jobs</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-[22px] font-bold text-slate-800">Jobs</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {jobs.length} total • {jobs.filter((j) => j.status === "Open" || j.status === "Active").length} open
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-[#1e3a8a] text-white px-4 py-2 rounded-xl text-[13px] font-medium hover:bg-[#1e40af] transition flex items-center gap-1.5 shadow-xs"
          >
            + Create Job
          </button>
        </div>
      </div>

      {/* Filter Bar Card */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 flex flex-wrap items-center gap-2.5 shadow-2xs">
        <div className="relative flex-1 min-w-[200px] max-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full h-9 pl-9 pr-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
          />
        </div>

        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="h-9 pl-3.5 pr-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_10px_center] bg-no-repeat cursor-pointer focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
        >
          <option value="All">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Design">Design</option>
          <option value="HR">HR</option>
          <option value="Marketing">Marketing</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
        </select>

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="h-9 pl-3.5 pr-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_10px_center] bg-no-repeat cursor-pointer focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
        >
          <option value="All">All Branches</option>
          <option value="New York">New York</option>
          <option value="London">London</option>
          <option value="Dubai">Dubai</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 pl-3.5 pr-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_10px_center] bg-no-repeat cursor-pointer focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
        >
          <option value="All">All Status</option>
          <option value="Open">Active</option>
          <option value="Draft">Draft</option>
          <option value="Closed">Cancelled</option>
        </select>

        <select
          value={workMode}
          onChange={(e) => setWorkMode(e.target.value)}
          className="h-9 pl-3.5 pr-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[right_10px_center] bg-no-repeat cursor-pointer focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
        >
          <option value="All">All Work Mode</option>
          <option value="On-site">On-site</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Remote">Remote</option>
        </select>

        <button
          onClick={() => {
            setSearch("");
            setDept("All");
            setBranch("All");
            setStatus("All");
            setWorkMode("All");
          }}
          className="h-9 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-medium text-slate-700 hover:bg-[#f8fafc] transition shadow-2xs"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={cols}
        data={filtered}
        emptyTitle="No active jobs"
        emptyDesc="Create your first job opening."
        emptyAction={<Button onClick={openCreate}>+ Create Job</Button>}
      />

      {/* Create / Edit Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Job" : "Create Job Opening"}
        subtitle={editing ? "Update job details" : "Basic information, details, location and timeline"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => save(false)}>
              Save Draft
            </Button>
            <Button onClick={() => save(true)}>{editing ? "Update Job" : "Publish Job"}</Button>
          </>
        }
      >
        <div className="space-y-6 text-[13px]">
          <div>
            <h4 className="font-semibold">Basic Information</h4>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Job Title *</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                  placeholder="Senior Backend Developer"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Job Code</span>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                  placeholder="ENG-BE-001"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Department *</span>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                >
                  <option>Engineering</option>
                  <option>Design</option>
                  <option>HR</option>
                  <option>Finance</option>
                  <option>Marketing</option>
                  <option>Operations</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Employment Type *</span>
                <select
                  value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Experience Required</span>
                <input
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Number of Openings *</span>
                <input
                  type="number"
                  value={form.openings}
                  onChange={(e) => setForm({ ...form, openings: Number(e.target.value) })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                />
              </label>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Job Details</h4>
            <div className="grid gap-3 mt-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Job Description *</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="p-3 bg-white border border-bdr rounded-xl resize-none"
                  placeholder="Build scalable backend..."
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Responsibilities *</span>
                <textarea
                  value={form.responsibilities}
                  onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                  rows={2}
                  className="p-3 bg-white border border-bdr rounded-xl resize-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Required Skills *</span>
                <input
                  value={form.requiredSkills}
                  onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                  placeholder="Node.js, PostgreSQL"
                />
              </label>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Location</h4>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Work Mode</span>
                <select
                  value={form.workMode}
                  onChange={(e) => setForm({ ...form, workMode: e.target.value })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                >
                  <option>On-site</option>
                  <option>Hybrid</option>
                  <option>Remote</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Location</span>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                />
              </label>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Assignees</h4>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Recruiter</span>
                <input
                  value={form.recruiter}
                  onChange={(e) => setForm({ ...form, recruiter: e.target.value })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted">Hiring Manager</span>
                <input
                  value={form.hiringManager}
                  onChange={(e) => setForm({ ...form, hiringManager: e.target.value })}
                  className="h-9 px-3 bg-white border border-bdr rounded-xl"
                />
              </label>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Job?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteId) deleteJob(deleteId);
                setDeleteId(null);
                showToast("Job deleted");
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-muted">Delete this job? This cannot be undone.</p>
      </Modal>
    </div>
  );
}
