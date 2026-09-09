import { useState, useMemo } from "react";
import { trainersMock } from "../../../data/hrms/data/performanceMockData";
import { DataTable } from "../../../components/hrms/DataTable";
import { FilterBar } from "../../../components/hrms/FilterBar";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { Modal } from "../../../components/hrms/Modal";
import { Drawer } from "../../../components/hrms/Drawer";
import { Button } from "../../../components/hrms/Button";
import { useAppStore } from "../../../stores/appStore";
import { Eye, Pencil, Trash2 } from "lucide-react";
export default function Trainers() {
  const showToast = useAppStore((s) => s.showToast);
  const [data, setData] = useState(trainersMock);
  const [search, setSearch] = useState("");
  const [spec, setSpec] = useState("All");
  const [status, setStatus] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState({ name: "", specialization: "Leadership", email: "", phone: "", programs: 1, status: "Active" });
  const filtered = useMemo(() => data.filter((r) => {
    if (search && !`${r.name} ${r.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (spec !== "All" && r.specialization !== spec) return false;
    if (status !== "All" && r.status !== status) return false;
    return true;
  }), [data, search, spec, status]);
  function save() {
    if (!form.name.trim() || !form.email.trim()) {
      showToast("Name and Email required");
      return;
    }
    if (editRow) {
      setData((d) => d.map((x) => x.id === editRow.id ? { ...x, ...form, programs: Number(form.programs) } : x));
      showToast("Trainer updated successfully.");
      setEditRow(null);
    } else {
      setData((d) => [{ id: `TRNR-${String(d.length + 1).padStart(2, "0")}`, name: form.name, avatar: "https://i.pravatar.cc/100?img=8", specialization: form.specialization, email: form.email, phone: form.phone, programs: Number(form.programs), status: form.status }, ...d]);
      showToast("Trainer created successfully.");
      setAddOpen(false);
    }
  }
  const cols = [
    { key: "name", header: "Trainer Name", sortable: true, render: (r) => <div className="flex items-center gap-2"><img src={r.avatar} alt="" className="w-7 h-7 rounded-full" />{r.name}</div> },
    { key: "specialization", header: "Specialization", sortable: true },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "programs", header: "Training Programs", sortable: true },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "Actions", render: (r) => <div className="flex gap-1">
        <button onClick={() => setViewRow(r)} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Eye size={14} /></button>
        <button onClick={() => {
      setForm({ name: r.name, specialization: r.specialization, email: r.email, phone: r.phone, programs: r.programs, status: r.status });
      setEditRow(r);
    }} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Pencil size={14} /></button>
        <button onClick={() => setDeleteRow(r)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600 grid place-items-center"><Trash2 size={14} /></button>
      </div> }
  ];
  function FormFields() {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2 flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Trainer Name *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="Sarah Mitchell" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Specialization</span><select value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"><option>Leadership</option><option>Engineering</option><option>Design</option><option>Marketing</option><option>Finance</option><option>Operations</option></select></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"><option>Active</option><option>Inactive</option><option>On Leave</option></select></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Email *</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="sarah.m@company.com" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="+1 212..." /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Training Programs</span><input type="number" value={form.programs} onChange={(e) => setForm({ ...form, programs: Number(e.target.value) })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></label>
      </div>;
  }
  return <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-[22px] font-bold">Trainer Directory</h1><p className="text-[13px] text-muted">Manage trainers and their programs.</p></div><Button onClick={() => {
    setForm({ name: "", specialization: "Leadership", email: "", phone: "", programs: 1, status: "Active" });
    setAddOpen(true);
  }}>+ Add Trainer</Button></div>
      <FilterBar
    search={search}
    onSearch={setSearch}
    selects={[
      { label: "Specialization", value: spec, onChange: setSpec, options: [{ value: "All", label: "All Specializations" }, { value: "Leadership", label: "Leadership" }, { value: "Engineering", label: "Engineering" }, { value: "Design", label: "Design" }, { value: "Marketing", label: "Marketing" }] },
      { label: "Status", value: status, onChange: setStatus, options: [{ value: "All", label: "All Status" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, { value: "On Leave", label: "On Leave" }] }
    ]}
    onClear={() => {
      setSearch("");
      setSpec("All");
      setStatus("All");
    }}
  />
      <DataTable columns={cols} data={filtered} emptyTitle="No trainers" emptyDesc="Add a trainer to get started." emptyAction={<Button onClick={() => setAddOpen(true)}>+ Add Trainer</Button>} />
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Trainer" footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={save}>Save Trainer</Button></>}><FormFields /></Modal>
      <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Trainer" footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={save}>Save Trainer</Button></>}><FormFields /></Modal>
      <Drawer open={!!viewRow} onClose={() => setViewRow(null)} title={viewRow?.name ?? ""} subtitle={`${viewRow?.specialization} \u2022 ${viewRow?.email}`} actions={<Button variant="secondary" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && <div className="space-y-2 text-[13px]"><div>Phone: {viewRow.phone}</div><div>Programs: {viewRow.programs}</div><div>Status: <StatusBadge status={viewRow.status} /></div></div>}
      </Drawer>
      <Modal open={!!deleteRow} onClose={() => setDeleteRow(null)} title="Delete Trainer?" footer={<><Button variant="secondary" onClick={() => setDeleteRow(null)}>Cancel</Button><Button variant="danger" onClick={() => {
    if (deleteRow) setData((d) => d.filter((x) => x.id !== deleteRow.id));
    setDeleteRow(null);
    showToast("Trainer deleted successfully.");
  }}>Delete Trainer</Button></>}><p className="text-[13px] text-muted">Delete <b>{deleteRow?.name}</b>?</p></Modal>
    </div>;
}
