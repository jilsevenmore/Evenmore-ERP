import { useState, useMemo } from "react";
import { kpisMock } from "../../../data/hrms/data/performanceMockData";
import { DataTable } from "../../../components/hrms/DataTable";
import { FilterBar } from "../../../components/hrms/FilterBar";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { Modal } from "../../../components/hrms/Modal";
import { Drawer } from "../../../components/hrms/Drawer";
import { Button } from "../../../components/hrms/Button";
import { useAppStore } from "../../../stores/appStore";
import { Eye, Pencil, Trash2 } from "lucide-react";
export default function KpiData() {
  const showToast = useAppStore((s) => s.showToast);
  const [data, setData] = useState(kpisMock);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [desig, setDesig] = useState("All");
  const [status, setStatus] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState({ name: "", department: "Engineering", designation: "Senior Engineer", target: "", weight: 10, status: "Active" });
  const filtered = useMemo(() => data.filter((r) => {
    if (search && !`${r.name} ${r.department}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (dept !== "All" && r.department !== dept) return false;
    if (desig !== "All" && r.designation !== desig) return false;
    if (status !== "All" && r.status !== status) return false;
    return true;
  }), [data, search, dept, desig, status]);
  function save() {
    if (!form.name.trim() || !form.target.trim()) {
      showToast("Name and Target required");
      return;
    }
    if (editRow) {
      setData((d) => d.map((x) => x.id === editRow.id ? { ...x, ...form, weight: Number(form.weight) } : x));
      showToast("KPI updated successfully.");
      setEditRow(null);
    } else {
      setData((d) => [{ id: `KPI-${d.length + 101}`, name: form.name, department: form.department, designation: form.designation, target: form.target, weight: Number(form.weight), status: form.status, createdAt: "09 Sep 2026" }, ...d]);
      showToast("KPI created successfully.");
      setAddOpen(false);
    }
  }
  const cols = [
    { key: "name", header: "KPI Name", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "department", header: "Department", sortable: true },
    { key: "designation", header: "Designation" },
    { key: "target", header: "Target" },
    { key: "weight", header: "Weight", sortable: true },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt", header: "Created At", sortable: true },
    { key: "actions", header: "Actions", render: (r) => <div className="flex gap-1">
        <button aria-label="View" onClick={() => setViewRow(r)} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Eye size={14} /></button>
        <button aria-label="Edit" onClick={() => {
      setForm({ name: r.name, department: r.department, designation: r.designation, target: r.target, weight: r.weight, status: r.status });
      setEditRow(r);
    }} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Pencil size={14} /></button>
        <button aria-label="Delete" onClick={() => setDeleteRow(r)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600 grid place-items-center"><Trash2 size={14} /></button>
      </div> }
  ];
  function FormFields() {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2 flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">KPI Name *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="e.g. Sprint Velocity" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Department</span><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Designation</span><input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Target *</span><input value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="≥ 42 pts" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Weight</span><input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"><option>Active</option><option>Inactive</option><option>Draft</option></select></label>
      </div>;
  }
  return <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-[22px] font-bold">KPI Data</h1><p className="text-[13px] text-muted">Manage KPI definitions and targets.</p></div><Button onClick={() => {
    setForm({ name: "", department: "Engineering", designation: "Senior Engineer", target: "", weight: 10, status: "Active" });
    setAddOpen(true);
  }}>+ Add KPI</Button></div>
      <FilterBar
    search={search}
    onSearch={setSearch}
    selects={[
      { label: "Department", value: dept, onChange: setDept, options: [{ value: "All", label: "All Departments" }, { value: "Engineering", label: "Engineering" }, { value: "Design", label: "Design" }, { value: "Marketing", label: "Marketing" }, { value: "Finance", label: "Finance" }, { value: "HR", label: "HR" }] },
      { label: "Designation", value: desig, onChange: setDesig, options: [{ value: "All", label: "All Designations" }, { value: "Senior Engineer", label: "Senior Engineer" }, { value: "Product Designer", label: "Product Designer" }, { value: "Analyst", label: "Analyst" }] },
      { label: "Status", value: status, onChange: setStatus, options: [{ value: "All", label: "All Status" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, { value: "Draft", label: "Draft" }] }
    ]}
    onClear={() => {
      setSearch("");
      setDept("All");
      setDesig("All");
      setStatus("All");
    }}
  />
      <DataTable columns={cols} data={filtered} emptyTitle="No KPI data" emptyDesc="Add your first KPI to get started." emptyAction={<Button onClick={() => setAddOpen(true)}>+ Add KPI</Button>} />
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add KPI" footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={save}>Save KPI</Button></>}><FormFields /></Modal>
      <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit KPI" footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={save}>Save KPI</Button></>}><FormFields /></Modal>
      <Drawer open={!!viewRow} onClose={() => setViewRow(null)} title={viewRow?.name ?? ""} subtitle={`${viewRow?.department} \u2022 ${viewRow?.designation}`} actions={<Button variant="secondary" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && <div className="space-y-3 text-[13px]"><div><b>Target:</b> {viewRow.target}</div><div><b>Weight:</b> {viewRow.weight}</div><div><b>Status:</b> <StatusBadge status={viewRow.status} /></div><div><b>Created:</b> {viewRow.createdAt}</div></div>}
      </Drawer>
      <Modal open={!!deleteRow} onClose={() => setDeleteRow(null)} title="Delete KPI?" footer={<><Button variant="secondary" onClick={() => setDeleteRow(null)}>Cancel</Button><Button variant="danger" onClick={() => {
    if (deleteRow) setData((d) => d.filter((x) => x.id !== deleteRow.id));
    setDeleteRow(null);
    showToast("KPI deleted successfully.");
  }}>Delete KPI</Button></>}><p className="text-[13px] text-muted">Delete <b>{deleteRow?.name}</b>? This cannot be undone.</p></Modal>
    </div>;
}
