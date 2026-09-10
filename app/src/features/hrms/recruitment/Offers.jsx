import { useState, useMemo } from "react";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { DataTable } from "../../../components/hrms/DataTable";
import { Drawer } from "../../../components/hrms/Drawer";
import { Modal } from "../../../components/hrms/Modal";
import { Button } from "../../../components/hrms/Button";
import { StatusBadge } from "../../../components/hrms/StatusBadge";

export default function Offers() {
  const { offers, addOffer, updateOffer, candidates } = useRecruitmentStore();
  const showToast = useAppStore((s) => s.showToast);
  const [filter, setFilter] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ candidateId: "CAND-005", job: "HR Manager", salary: "$95,000", joiningDate: "01 Oct 2024", expiry: "15 Sep 2024", benefits: "Health, 401k", notes: "" });

  const summary = {
    Pending: offers.filter((o) => o.status === "Pending").length,
    Accepted: offers.filter((o) => o.status === "Accepted").length,
    Rejected: offers.filter((o) => o.status === "Rejected").length,
    Expired: offers.filter((o) => o.status === "Expired").length,
  };

  const filtered = useMemo(() => (filter === "All" ? offers : offers.filter((o) => o.status === filter)), [offers, filter]);

  function openCreate() {
    setEditing(null);
    setForm({ candidateId: "CAND-005", job: "HR Manager", salary: "$95,000", joiningDate: "01 Oct 2024", expiry: "15 Sep 2024", benefits: "Health, 401k", notes: "" });
    setDrawerOpen(true);
  }
  function save(send) {
    const cand = candidates.find((c) => c.id === form.candidateId);
    if (!cand) { showToast("Candidate required"); return; }
    if (!form.salary.trim() || !form.joiningDate.trim()) { showToast("Salary and Joining Date required"); return; }
    if (editing) {
      updateOffer(editing, { candidateId: form.candidateId, candidateName: cand.name, position: form.job, salary: form.salary, joiningDate: form.joiningDate, expiry: form.expiry, status: "Pending" });
      showToast(send ? "Offer sent" : "Draft saved");
      setDrawerOpen(false);
    } else {
      addOffer({ id: `OFF-${String(offers.length + 1).padStart(3, "0")}`, candidateId: form.candidateId, candidateName: cand.name, avatar: cand.avatar, position: form.job, salary: form.salary, sentDate: "09 Sep 2026", joiningDate: form.joiningDate, status: "Pending", expiry: form.expiry });
      showToast(send ? "Offer created successfully." : "Draft saved");
      setDrawerOpen(false);
    }
  }

  const cols = [
    { key: "candidateName", header: "Candidate", sortable: true, render: (r) => <div className="flex items-center gap-2"><img src={r.avatar} alt="" className="w-7 h-7 rounded-full" />{r.candidateName}</div> },
    { key: "position", header: "Position" },
    { key: "salary", header: "Offered Salary", sortable: true },
    { key: "sentDate", header: "Sent Date" },
    { key: "joiningDate", header: "Joining Date", sortable: true },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status === "Pending" ? "Pending" : r.status === "Accepted" ? "Active" : r.status === "Rejected" ? "Cancelled" : "Draft"} /> },
    { key: "actions", header: "Actions", render: (r) => (
      <div className="flex gap-1">
        <button onClick={() => { setForm({ candidateId: r.candidateId, job: r.position, salary: r.salary, joiningDate: r.joiningDate, expiry: r.expiry, benefits: "", notes: "" }); setEditing(r.id); setDrawerOpen(true); }} className="text-[11px] border border-bdr rounded-lg px-2">Edit</button>
        <button onClick={() => { updateOffer(r.id, { status: "Pending" }); showToast("Offer sent"); }} className="text-[11px] bg-navy text-white rounded-lg px-2">Send</button>
        <button onClick={() => setDeleteId(r.id)} className="text-[11px] text-red-600">Withdraw</button>
      </div>
    ) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-[22px] font-bold">Offers</h1><p className="text-[13px] text-muted">{offers.length} offers</p></div><Button onClick={openCreate}>+ Create Offer</Button></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { k: "Pending", v: summary.Pending, color: "bg-amber-50 border-amber-200 text-amber-700" },
          { k: "Accepted", v: summary.Accepted, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { k: "Rejected", v: summary.Rejected, color: "bg-red-50 border-red-200 text-red-600" },
          { k: "Expired", v: summary.Expired, color: "bg-gray-50 border-bdr text-slate" },
        ].map((x) => (
          <button key={x.k} onClick={() => setFilter(x.k)} className={`border rounded-xl p-4 text-left ${x.color} ${filter === x.k ? "ring-2 ring-navy/20" : ""}`}>
            <div className="text-[11px] tracking-widest uppercase font-semibold">{x.k}</div><div className="text-[20px] font-bold mt-1">{x.v}</div>
          </button>
        ))}
        <button onClick={() => setFilter("All")} className={`border rounded-xl p-4 text-left bg-white border-bdr ${filter === "All" ? "ring-2 ring-navy/20" : ""}`}><div className="text-[11px] tracking-widest uppercase text-muted">All</div><div className="text-[20px] font-bold">{offers.length}</div></button>
      </div>
      <DataTable columns={cols} data={filtered} emptyTitle="No offers found" emptyDesc="Create an offer to get started." emptyAction={<Button onClick={openCreate}>+ Create Offer</Button>} />

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Offer" : "Create Offer"} subtitle="Candidate, job, salary and joining details"
        footer={<><Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button><Button variant="secondary" onClick={() => save(false)}>Save Draft</Button><Button onClick={() => save(true)}>Send Offer</Button></>}>
        <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Candidate *</span><select value={form.candidateId} onChange={(e) => setForm({ ...form, candidateId: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl"><option value="">Select</option>{candidates.slice(0, 8).map((c) => <option key={c.id} value={c.id}>{c.name} — {c.position}</option>)}</select></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Job *</span><input value={form.job} onChange={(e) => setForm({ ...form, job: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Offered Salary *</span><input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" placeholder="$95,000" /></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Joining Date *</span><input value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Offer Expiry</span><input value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" /></label>
          <label className="sm:col-span-2 flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Benefits</span><input value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl" placeholder="Health, 401k" /></label>
          <label className="sm:col-span-2 flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Notes</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="p-3 bg-white border border-bdr rounded-xl resize-none" /></label>
        </div>
      </Drawer>
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Withdraw Offer?" footer={<><Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (deleteId) updateOffer(deleteId, { status: "Expired" }); setDeleteId(null); showToast("Offer withdrawn"); }}>Withdraw</Button></>}><p className="text-[13px] text-muted">Withdraw this offer? Candidate will be notified.</p></Modal>
    </div>
  );
}