import { useState, useMemo } from "react";
import { appraisalsMock } from "../../../data/hrms/data/performanceMockData";
import { DataTable } from "../../../components/hrms/DataTable";
import { FilterBar } from "../../../components/hrms/FilterBar";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { Modal } from "../../../components/hrms/Modal";
import { Drawer } from "../../../components/hrms/Drawer";
import { Button } from "../../../components/hrms/Button";
import { useAppStore } from "../../../stores/appStore";
import { Eye, Pencil, Trash2 } from "lucide-react";
export default function Appraisal() {
  const { showToast, employees, updateEmployee } = useAppStore();
  const [data, setData] = useState(appraisalsMock);
  const [search, setSearch] = useState("");
  const [cycle, setCycle] = useState("All");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState({ employee: "", cycle: "Q4 2024", reviewer: "", rating: 4, status: "Draft", due: "16 Oct 2024", department: "Engineering" });
  const filtered = useMemo(() => data.filter((r) => {
    if (search && !`${r.employee} ${r.cycle}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (cycle !== "All" && r.cycle !== cycle) return false;
    if (dept !== "All" && r.department !== dept) return false;
    if (status !== "All" && r.status !== status) return false;
    return true;
  }), [data, search, cycle, dept, status]);

  function handleSyncToProfile(r) {
    const target = employees.find((e) => e.name.toLowerCase() === r.employee.toLowerCase());
    if (target) {
      updateEmployee(target.id, { performanceRating: `${r.rating.toFixed(1)} / 5` });
    }
    showToast(`Appraisal rating (${r.rating.toFixed(1)}/5) synced to ${r.employee}'s employee profile & bonus record!`);
  }

  function save() {
    if (!form.employee.trim() || !form.reviewer.trim()) {
      showToast("Employee and Reviewer required");
      return;
    }
    if (editRow) {
      setData((d) => d.map((x) => x.id === editRow.id ? { ...x, ...form } : x));
      if (form.status === "Completed") {
        const target = employees.find((e) => e.name.toLowerCase() === form.employee.toLowerCase());
        if (target) {
          updateEmployee(target.id, { performanceRating: `${Number(form.rating).toFixed(1)} / 5` });
        }
      }
      showToast("Appraisal updated successfully.");
      setEditRow(null);
    } else {
      const created = { id: `APR-${String(data.length + 1).padStart(3, "0")}`, employee: form.employee, avatar: "https://i.pravatar.cc/100?img=15", cycle: form.cycle, reviewer: form.reviewer, rating: Number(form.rating), status: form.status, due: form.due, department: form.department };
      setData((d) => [created, ...d]);
      if (form.status === "Completed") {
        const target = employees.find((e) => e.name.toLowerCase() === form.employee.toLowerCase());
        if (target) {
          updateEmployee(target.id, { performanceRating: `${Number(form.rating).toFixed(1)} / 5` });
        }
      }
      showToast("Appraisal created successfully.");
      setAddOpen(false);
    }
  }
  const cols = [
    { key: "employee", header: "Employee", sortable: true, render: (r) => <div className="flex items-center gap-2"><img src={r.avatar} alt="" className="w-7 h-7 rounded-full" />{r.employee}</div> },
    { key: "cycle", header: "Review Cycle", sortable: true },
    { key: "reviewer", header: "Reviewer" },
    { key: "rating", header: "Overall Rating", sortable: true, render: (r) => <span className="font-semibold text-slate-900">{r.rating.toFixed(1)} / 5</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "due", header: "Due Date", sortable: true },
    { key: "actions", header: "Actions", render: (r) => <div className="flex items-center gap-1">
        <button
          onClick={() => handleSyncToProfile(r)}
          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-medium border border-blue-200 transition"
          title="Sync Rating to Employee Profile & Bonus Record"
        >
          Sync Rating
        </button>
        <button onClick={() => setViewRow(r)} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Eye size={14} /></button>
        <button onClick={() => {
      setForm({ employee: r.employee, cycle: r.cycle, reviewer: r.reviewer, rating: r.rating, status: r.status, due: r.due, department: r.department });
      setEditRow(r);
    }} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Pencil size={14} /></button>
        <button onClick={() => setDeleteRow(r)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600 grid place-items-center"><Trash2 size={14} /></button>
      </div> }
  ];
  function FormFields() {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Employee *</span>
          <select
            value={form.employee}
            onChange={(e) => {
              const emp = employees.find((x) => x.name === e.target.value);
              setForm({
                ...form,
                employee: e.target.value,
                department: emp?.department || form.department,
              });
            }}
            className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"
          >
            <option value="">Select Employee</option>
            {employees.map((e) => (
              <option key={e.id || e.name} value={e.name}>
                {e.name} ({e.department || e.designation})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Review Cycle</span><select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"><option>Q4 2024</option><option>Q3 2024</option><option>Q2 2024</option></select></label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Reviewer *</span>
          <select
            value={form.reviewer}
            onChange={(e) => setForm({ ...form, reviewer: e.target.value })}
            className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"
          >
            <option value="">Select Reviewer</option>
            {employees.map((e) => (
              <option key={e.id || e.name} value={e.name}>
                {e.name} ({e.designation})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Rating</span><input type="number" step={0.1} min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"><option>Draft</option><option>Pending</option><option>In Review</option><option>Completed</option></select></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Due Date</span><input value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></label>
      </div>;
  }
  return <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-[22px] font-bold">Appraisal</h1><p className="text-[13px] text-muted">Manage performance appraisals by cycle.</p></div><Button onClick={() => {
    setForm({ employee: "", cycle: "Q4 2024", reviewer: "", rating: 4, status: "Draft", due: "16 Oct 2024", department: "Engineering" });
    setAddOpen(true);
  }}>+ Add Appraisal</Button></div>
      <FilterBar
    search={search}
    onSearch={setSearch}
    selects={[
      { label: "Cycle", value: cycle, onChange: setCycle, options: [{ value: "All", label: "All Cycles" }, { value: "Q4 2024", label: "Q4 2024" }, { value: "Q3 2024", label: "Q3 2024" }, { value: "Q2 2024", label: "Q2 2024" }] },
      { label: "Department", value: dept, onChange: setDept, options: [{ value: "All", label: "All Departments" }, { value: "Engineering", label: "Engineering" }, { value: "Design", label: "Design" }, { value: "Marketing", label: "Marketing" }] },
      { label: "Status", value: status, onChange: setStatus, options: [{ value: "All", label: "All Status" }, { value: "Draft", label: "Draft" }, { value: "Pending", label: "Pending" }, { value: "In Review", label: "In Review" }, { value: "Completed", label: "Completed" }] }
    ]}
    onClear={() => {
      setSearch("");
      setCycle("All");
      setDept("All");
      setStatus("All");
    }}
  />
      <DataTable columns={cols} data={filtered} emptyTitle="No appraisals" emptyDesc="Add your first appraisal to get started." emptyAction={<Button onClick={() => setAddOpen(true)}>+ Add Appraisal</Button>} />
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Appraisal" footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={save}>Save Appraisal</Button></>}><FormFields /></Modal>
      <Modal isOpen={!!editRow} onClose={() => setEditRow(null)} title="Edit Appraisal" footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={save}>Save Appraisal</Button></>}><FormFields /></Modal>
      <Drawer isOpen={!!viewRow} onClose={() => setViewRow(null)} title={viewRow?.employee ?? ""} subtitle={`${viewRow?.cycle} \u2022 Reviewer: ${viewRow?.reviewer}`} footer={<Button variant="secondary" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && <div className="space-y-2 text-[13px]"><div>Rating: {viewRow.rating} / 5</div><div>Status: <StatusBadge status={viewRow.status} /></div><div>Due: {viewRow.due}</div></div>}
      </Drawer>
      <Modal isOpen={!!deleteRow} onClose={() => setDeleteRow(null)} title="Delete Appraisal?" footer={<><Button variant="secondary" onClick={() => setDeleteRow(null)}>Cancel</Button><Button variant="danger" onClick={() => {
    if (deleteRow) setData((d) => d.filter((x) => x.id !== deleteRow.id));
    setDeleteRow(null);
    showToast("Appraisal deleted successfully.");
  }}>Delete Appraisal</Button></>}><p className="text-[13px] text-muted">Delete appraisal for <b>{deleteRow?.employee}</b>?</p></Modal>
    </div>;
}
