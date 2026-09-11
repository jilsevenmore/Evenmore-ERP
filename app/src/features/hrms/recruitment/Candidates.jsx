import { useState, useMemo, useEffect } from "react";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { useNavigate, useLocation } from "react-router-dom";
import { DataTable } from "../../../components/hrms/DataTable";
import { FilterBar } from "../../../components/hrms/FilterBar";
import { Drawer } from "../../../components/hrms/Drawer";
import { Modal } from "../../../components/hrms/Modal";
import { Button } from "../../../components/hrms/Button";
import { ArrowLeft, FileText } from "lucide-react";
import OfferLetterModal from "../organization/OfferLetterModal";

export default function Candidates() {
  const { candidates, addCandidate, updateCandidate, deleteCandidate, offers, addOffer, updateOffer, changeStage } = useRecruitmentStore();
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [job, setJob] = useState("All");
  const [stage, setStage] = useState("All");
  const [exp, setExp] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", location: "New York", position: "Senior Backend Developer", experience: "5 years", skills: "Node.js", jobId: "JOB-001", stage: "Applied", recruiter: "Ayesha Khan" });

  useEffect(() => {
    if (location.state?.openAdd) {
      openAdd();
    }
  }, [location.state]);
  const filtered = useMemo(() => candidates.filter((c) => {
    if (search && !`${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (job !== "All" && c.position !== job) return false;
    if (stage !== "All" && c.stage !== stage) return false;
    if (exp !== "All" && c.experience !== exp) return false;
    return true;
  }), [candidates, search, job, stage, exp]);
  function openAdd() {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", location: "New York", position: "Senior Backend Developer", experience: "5 years", skills: "Node.js", jobId: "JOB-001", stage: "Applied", recruiter: "Ayesha Khan" });
    setDrawerOpen(true);
  }
  function save() {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      showToast("Name, Email, Phone required");
      return;
    }
    if (editing) {
      updateCandidate(editing, { name: form.name, email: form.email, phone: form.phone, location: form.location, position: form.position, experience: form.experience, skills: form.skills, jobId: form.jobId, stage: form.stage, recruiter: form.recruiter });
      showToast("Candidate updated");
      setDrawerOpen(false);
    } else {
      addCandidate({ id: `CAND-${String(candidates.length + 1).padStart(3, "0")}`, name: form.name, avatar: `https://i.pravatar.cc/100?img=${15 + candidates.length % 50}`, email: form.email, phone: form.phone, location: form.location, position: form.position, jobId: form.jobId, experience: form.experience, appliedDate: "09 Sep 2026", stage: form.stage, recruiter: form.recruiter, source: "Career Page", skills: form.skills, interviewStatus: "Not Scheduled" });
      showToast("Candidate added successfully.");
      setDrawerOpen(false);
    }
  }
  const handleOpenOffer = (cand) => {
    const existing = offers.find((o) => o.candidateId === cand.id);
    if (existing) {
      setActiveOffer(existing);
    } else {
      setActiveOffer({
        id: `OFF-${Math.floor(100 + Math.random() * 900)}`,
        candidateId: cand.id,
        candidateName: cand.name,
        email: cand.email,
        position: cand.position,
        jobType: "Full-time",
        dept: cand.position?.includes("Design") ? "Design" : cand.position?.includes("HR") ? "HR" : "Engineering",
        salary: "$95,000 / annum",
        location: cand.location || "New York HQ",
        workMode: "Hybrid",
        sentDate: new Date().toISOString().split("T")[0],
        joiningDate: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
        reportingManager: "David Park (CTO)",
        probationPeriod: "3 Months",
        status: cand.stage === "Offer" || cand.stage === "Hired" ? "Confirmed" : "Draft",
      });
    }
    setIsOfferModalOpen(true);
  };

  const handleConfirmOffer = (offerData) => {
    const existingIndex = offers.findIndex((o) => o.id === offerData.id || o.candidateId === offerData.candidateId);
    if (existingIndex >= 0) {
      updateOffer(offers[existingIndex].id, { ...offerData, status: "Pending" });
    } else {
      addOffer({ ...offerData, status: "Pending" });
    }
    changeStage(offerData.candidateId, "Offer");
    showToast(`Offer letter confirmed and generated for ${offerData.candidateName}`);
  };

  const handleUpdateOffer = (offerData) => {
    updateOffer(offerData.id, offerData);
    showToast(`Offer letter updated for ${offerData.candidateName}`);
  };

  const cols = [
    { key: "name", header: "Candidate", sortable: true, render: (r) => <div className="flex items-center gap-2"><img src={r.avatar} alt="" className="w-7 h-7 rounded-full" />{r.name}</div> },
    { key: "position", header: "Applied Position", sortable: true },
    { key: "experience", header: "Experience" },
    { key: "appliedDate", header: "Applied Date", sortable: true },
    { key: "stage", header: "Stage", render: (r) => <span className="px-2 py-1 bg-off border border-bdr rounded-full text-[11px]">{r.stage}</span> },
    { key: "interviewStatus", header: "Interview" },
    { key: "recruiter", header: "Recruiter" },
    { key: "actions", header: "Actions", render: (r) => <div className="flex items-center gap-1.5">
        <button onClick={() => navigate(`/hrms/recruitment/candidates/${r.id}`)} className="text-navy text-[12px] underline font-medium">View</button>
        <button
          onClick={() => handleOpenOffer(r)}
          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border font-medium transition ${
            r.stage === "Offer" || r.stage === "Hired" || offers.some((o) => o.candidateId === r.id)
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
          title="Open Offer Letter (Preview / Edit / Confirm)"
        >
          <FileText size={12} />
          <span>Offer</span>
        </button>
        <button onClick={() => {
      setForm({ name: r.name, email: r.email, phone: r.phone, location: r.location, position: r.position, experience: r.experience, skills: r.skills, jobId: r.jobId, stage: r.stage, recruiter: r.recruiter });
      setEditing(r.id);
      setDrawerOpen(true);
    }} className="text-[11px] border border-bdr rounded-lg px-2">Edit</button>
        <button onClick={() => setDeleteId(r.id)} className="text-red-600 text-[11px]">Delete</button>
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
        <div><h1 className="text-[22px] font-bold">Candidates</h1><p className="text-[13px] text-muted">{candidates.length} total</p></div>
        <Button onClick={openAdd}>+ Add Candidate</Button>
      </div>
      <FilterBar
    search={search}
    onSearch={setSearch}
    selects={[
      { label: "Job", value: job, onChange: setJob, options: [{ value: "All", label: "All Jobs" }, { value: "Senior Backend Developer", label: "Senior Backend Developer" }, { value: "Product Designer", label: "Product Designer" }, { value: "Frontend Developer", label: "Frontend Developer" }] },
      { label: "Stage", value: stage, onChange: setStage, options: [{ value: "All", label: "All Stages" }, { value: "Applied", label: "Applied" }, { value: "Screening", label: "Screening" }, { value: "Interview", label: "Interview" }, { value: "Shortlisted", label: "Shortlisted" }, { value: "Offer", label: "Offer" }, { value: "Hired", label: "Hired" }, { value: "Rejected", label: "Rejected" }] },
      { label: "Experience", value: exp, onChange: setExp, options: [{ value: "All", label: "All Experience" }, { value: "5 years", label: "5 years" }, { value: "4 years", label: "4 years" }, { value: "3 years", label: "3 years" }] }
    ]}
    onClear={() => {
      setSearch("");
      setJob("All");
      setStage("All");
      setExp("All");
    }}
  />
      <DataTable columns={cols} data={filtered} emptyTitle="No candidates found" emptyDesc="Add a candidate to get started." emptyAction={<Button onClick={openAdd}>+ Add Candidate</Button>} />

      <Drawer
    isOpen={drawerOpen}
    onClose={() => setDrawerOpen(false)}
    title={editing ? "Edit Candidate" : "Add Candidate"}
    subtitle="Personal, professional and application information"
    footer={<><Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button><Button onClick={save}>{editing ? "Update" : "Save Candidate"}</Button></>}
  >
        <div className="space-y-6 text-[13px]">
          <div><h4 className="font-semibold">Personal Information</h4><div className="grid sm:grid-cols-2 gap-3 mt-2">
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Full Name *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Email *</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Phone *</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Location</span><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
          </div></div>
          <div><h4 className="font-semibold">Application Information</h4><div className="grid sm:grid-cols-2 gap-3 mt-2">
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Applied Position *</span><select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl"><option>Senior Backend Developer</option><option>Product Designer</option><option>Frontend Developer</option><option>HR Manager</option></select></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Experience</span><input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Skills</span><input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
            <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Current Stage</span><select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl"><option>Applied</option><option>Screening</option><option>Interview</option><option>Shortlisted</option><option>Offer</option><option>Hired</option><option>Rejected</option></select></label>
          </div></div>
          <div className="border border-dashed border-bdr rounded-xl p-4 bg-off flex items-center gap-2 text-muted"><span className="material-symbols-outlined">upload</span>Resume file UI (mock)</div>
        </div>
      </Drawer>
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Candidate?" footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" onClick={() => {
    if (deleteId) deleteCandidate(deleteId);
    setDeleteId(null);
    showToast("Candidate deleted");
  }}>Delete</Button></>}><p className="text-[13px] text-muted">Delete this candidate?</p></Modal>

      <OfferLetterModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        offer={activeOffer}
        onConfirmOffer={handleConfirmOffer}
        onUpdateOffer={handleUpdateOffer}
      />
    </div>;
}
