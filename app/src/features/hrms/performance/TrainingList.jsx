import { useState, useMemo } from "react";
import { trainingsMock } from "../../../data/hrms/data/performanceMockData";
import { DataTable } from "../../../components/hrms/DataTable";
import { FilterBar } from "../../../components/hrms/FilterBar";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { Modal } from "../../../components/hrms/Modal";
import { Drawer } from "../../../components/hrms/Drawer";
import { Button } from "../../../components/hrms/Button";
import { useAppStore } from "../../../stores/appStore";
import { Eye, Pencil, Trash2 } from "lucide-react";
export default function TrainingList() {
  const showToast = useAppStore((s) => s.showToast);
  const [data, setData] = useState(trainingsMock);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState({ name: "", trainer: "", department: "HR", type: "Leadership", participants: 10, start: "18 Oct 2024", end: "19 Oct 2024", status: "Planned" });
  const filtered = useMemo(() => data.filter((r) => {
    if (search && !`${r.name} ${r.trainer}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (dept !== "All" && r.department !== dept) return false;
    if (type !== "All" && r.type !== type) return false;
    if (status !== "All" && r.status !== status) return false;
    return true;
  }), [data, search, dept, type, status]);
  function save() {
    if (!form.name.trim() || !form.trainer.trim()) {
      showToast("Training Name and Trainer required");
      return;
    }
    if (editRow) {
      setData((d) => d.map((x) => x.id === editRow.id ? { ...x, ...form, participants: Number(form.participants) } : x));
      showToast("Training updated successfully.");
      setEditRow(null);
    } else {
      setData((d) => [{ id: `TRN-${String(d.length + 1).padStart(3, "0")}`, name: form.name, trainer: form.trainer, avatar: "https://i.pravatar.cc/100?img=8", department: form.department, type: form.type, participants: Number(form.participants), start: form.start, end: form.end, status: form.status }, ...d]);
      showToast("Training created successfully.");
      setAddOpen(false);
    }
  }
  const cols = [
    { key: "name", header: "Training Name", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "trainer", header: "Trainer", render: (r) => <div className="flex items-center gap-2"><img src={r.avatar} alt="" className="w-7 h-7 rounded-full" />{r.trainer}</div> },
    { key: "department", header: "Department" },
    { key: "participants", header: "Participants", sortable: true },
    { key: "start", header: "Start Date", sortable: true },
    { key: "end", header: "End Date" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "Actions", render: (r) => <div className="flex gap-1">
        <button onClick={() => setViewRow(r)} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Eye size={14} /></button>
        <button onClick={() => {
      setForm({ name: r.name, trainer: r.trainer, department: r.department, type: r.type, participants: r.participants, start: r.start, end: r.end, status: r.status });
      setEditRow(r);
    }} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Pencil size={14} /></button>
        <button onClick={() => setDeleteRow(r)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600 grid place-items-center"><Trash2 size={14} /></button>
      </div> }
  ];
  function FormFields() {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2 flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Training Name *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="Leadership Essentials" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Trainer *</span><input value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="Sarah Mitchell" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Department</span><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Training Type</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"><option>Leadership</option><option>Technical</option><option>Design</option><option>Workshop</option><option>Operations</option></select></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Participants</span><input type="number" value={form.participants} onChange={(e) => setForm({ ...form, participants: Number(e.target.value) })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Start Date</span><input value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">End Date</span><input value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"><option>Planned</option><option>Registered</option><option>In Progress</option><option>Completed</option><option>Cancelled</option></select></label>
      </div>;
  }
  return <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-[22px] font-bold">Training Programs</h1><p className="text-[13px] text-muted">Manage training programs linked to performance.</p></div><Button onClick={() => {
    setForm({ name: "", trainer: "", department: "HR", type: "Leadership", participants: 10, start: "18 Oct 2024", end: "19 Oct 2024", status: "Planned" });
    setAddOpen(true);
  }}>+ Add Training</Button></div>
      <FilterBar
    search={search}
    onSearch={setSearch}
    selects={[
      { label: "Department", value: dept, onChange: setDept, options: [{ value: "All", label: "All Departments" }, { value: "HR", label: "HR" }, { value: "Engineering", label: "Engineering" }, { value: "Design", label: "Design" }] },
      { label: "Type", value: type, onChange: setType, options: [{ value: "All", label: "All Types" }, { value: "Leadership", label: "Leadership" }, { value: "Technical", label: "Technical" }, { value: "Design", label: "Design" }] },
      { label: "Status", value: status, onChange: setStatus, options: [{ value: "All", label: "All Status" }, { value: "Planned", label: "Planned" }, { value: "In Progress", label: "In Progress" }, { value: "Completed", label: "Completed" }] }
    ]}
    onClear={() => {
      setSearch("");
      setDept("All");
      setType("All");
      setStatus("All");
    }}
  />
      <DataTable columns={cols} data={filtered} emptyTitle="No trainings" emptyDesc="Add a training program to get started." emptyAction={<Button onClick={() => setAddOpen(true)}>+ Add Training</Button>} />
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Training" footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={save}>Save Training</Button></>}><FormFields /></Modal>
      <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Training" footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={save}>Save Training</Button></>}><FormFields /></Modal>
      <Drawer open={!!viewRow} onClose={() => setViewRow(null)} title={viewRow?.name ?? ""} subtitle={`${viewRow?.trainer} \u2022 ${viewRow?.department}`} actions={<Button variant="secondary" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && <div className="space-y-2 text-[13px]"><div>Participants: {viewRow.participants}</div><div>{viewRow.start} – {viewRow.end}</div><div>Status: <StatusBadge status={viewRow.status} /></div></div>}
      </Drawer>
      <Modal open={!!deleteRow} onClose={() => setDeleteRow(null)} title="Delete Training?" footer={<><Button variant="secondary" onClick={() => setDeleteRow(null)}>Cancel</Button><Button variant="danger" onClick={() => {
    if (deleteRow) setData((d) => d.filter((x) => x.id !== deleteRow.id));
    setDeleteRow(null);
    showToast("Training deleted successfully.");
  }}>Delete Training</Button></>}><p className="text-[13px] text-muted">Delete <b>{deleteRow?.name}</b>?</p></Modal>
    </div>;
}
