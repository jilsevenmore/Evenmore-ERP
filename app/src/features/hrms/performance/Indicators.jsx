import { useState, useMemo } from "react";
import { indicatorsMock } from "../../../data/hrms/data/performanceMockData";
import { DataTable } from "../../../components/hrms/DataTable";
import { FilterBar } from "../../../components/hrms/FilterBar";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { Modal } from "../../../components/hrms/Modal";
import { Drawer } from "../../../components/hrms/Drawer";
import { Button } from "../../../components/hrms/Button";
import { useAppStore } from "../../../stores/appStore";
import { Eye, Pencil, Trash2, Star } from "lucide-react";
export default function Indicators() {
  const showToast = useAppStore((s) => s.showToast);
  const [data, setData] = useState(indicatorsMock);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All");
  const [dept, setDept] = useState("All");
  const [desig, setDesig] = useState("All");
  const [rating, setRating] = useState("All");
  const [status, setStatus] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState({ name: "", branch: "New York", department: "Engineering", designation: "Senior Engineer", description: "", weight: 10, status: "Active" });
  const [errors, setErrors] = useState({});
  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (search && !`${r.name} ${r.department} ${r.designation}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (branch !== "All" && r.branch !== branch) return false;
      if (dept !== "All" && r.department !== dept) return false;
      if (desig !== "All" && r.designation !== desig) return false;
      if (status !== "All" && r.status !== status) return false;
      if (rating !== "All") {
        const v = Number(rating);
        if (Math.floor(r.rating) !== v) return false;
      }
      return true;
    });
  }, [data, search, branch, dept, desig, status, rating]);
  function validate(f) {
    const e = {};
    if (!f.branch) e.branch = "Required";
    if (!f.department) e.department = "Required";
    if (!f.designation) e.designation = "Required";
    if (!f.name.trim()) e.name = "Required";
    if (!String(f.weight).trim() || isNaN(Number(f.weight))) e.weight = "Required";
    if (!f.status) e.status = "Required";
    return e;
  }
  function openAdd() {
    setForm({ name: "", branch: "New York", department: "Engineering", designation: "Senior Engineer", description: "", weight: 10, status: "Active" });
    setErrors({});
    setAddOpen(true);
  }
  function openEdit(r) {
    setEditRow(r);
    setForm({ name: r.name, branch: r.branch, department: r.department, designation: r.designation, description: r.description, weight: r.weight, status: r.status });
    setErrors({});
  }
  function save() {
    const e = validate(form);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    if (editRow) {
      setData((d) => d.map((x) => x.id === editRow.id ? { ...x, ...form, updatedAt: "09 Sep 2026" } : x));
      showToast("Indicator updated successfully.");
      setEditRow(null);
    } else {
      const now = (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      setData((d) => [{ id: `IND-${String(d.length + 1).padStart(3, "0")}`, name: form.name, branch: form.branch, department: form.department, designation: form.designation, description: form.description, weight: Number(form.weight), rating: 4.2, status: form.status, addedBy: "Ayesha Khan", createdAt: now, updatedAt: now }, ...d]);
      showToast("Indicator created successfully.");
      setAddOpen(false);
    }
  }
  const cols = [
    { key: "name", header: "Indicator", sortable: true, render: (r) => <span className="font-medium text-slate">{r.name}</span> },
    { key: "branch", header: "Branch", sortable: true },
    { key: "department", header: "Department", sortable: true },
    { key: "designation", header: "Designation", sortable: true },
    { key: "rating", header: "Overall Rating", sortable: true, render: (r) => <span className="inline-flex items-center gap-1"><Star size={12} className="text-amber-500" />{r.rating.toFixed(1)}</span> },
    { key: "addedBy", header: "Added By" },
    { key: "createdAt", header: "Created At", sortable: true },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "actions", header: "Actions", render: (r) => <div className="flex items-center gap-1">
        <button aria-label={`View ${r.name}`} onClick={() => setViewRow(r)} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center focus:outline-none focus:ring-2 focus:ring-navy/10"><Eye size={14} /></button>
        <button aria-label={`Edit ${r.name}`} onClick={() => openEdit(r)} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Pencil size={14} /></button>
        <button aria-label={`Delete ${r.name}`} onClick={() => setDeleteRow(r)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600 grid place-items-center"><Trash2 size={14} /></button>
      </div> }
  ];
  const branchOpts = [{ value: "All", label: "All Branches" }, { value: "New York", label: "New York" }, { value: "London", label: "London" }, { value: "Dubai", label: "Dubai" }];
  const deptOpts = [{ value: "All", label: "All Departments" }, { value: "Engineering", label: "Engineering" }, { value: "Design", label: "Design" }, { value: "Marketing", label: "Marketing" }, { value: "HR", label: "HR" }, { value: "Finance", label: "Finance" }, { value: "Operations", label: "Operations" }];
  const desigOpts = [{ value: "All", label: "All Designations" }, { value: "Senior Engineer", label: "Senior Engineer" }, { value: "Tech Lead", label: "Tech Lead" }, { value: "Product Designer", label: "Product Designer" }, { value: "Analyst", label: "Analyst" }];
  const ratingOpts = [{ value: "All", label: "All Ratings" }, { value: "4", label: "4\u2605 & up" }, { value: "3", label: "3\u2605 & up" }];
  const statusOpts = [{ value: "All", label: "All Status" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, { value: "Draft", label: "Draft" }];
  function FormFields() {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Branch *</span>
          <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]">{branchOpts.slice(1).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          {errors.branch && <span className="text-[11px] text-red-600">{errors.branch}</span>}
        </label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Department *</span>
          <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]">{deptOpts.slice(1).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          {errors.department && <span className="text-[11px] text-red-600">{errors.department}</span>}
        </label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Designation *</span>
          <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="Senior Engineer" />
          {errors.designation && <span className="text-[11px] text-red-600">{errors.designation}</span>}
        </label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Weight *</span>
          <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" />
          {errors.weight && <span className="text-[11px] text-red-600">{errors.weight}</span>}
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2"><span className="text-[11px] font-medium text-muted">Indicator Name *</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="e.g. Code Quality & Review Discipline" />
          {errors.name && <span className="text-[11px] text-red-600">{errors.name}</span>}
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2"><span className="text-[11px] font-medium text-muted">Description</span>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="p-3 bg-white border border-bdr rounded-xl text-[13px] resize-none" placeholder="Describe expected outcome..." />
        </label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Status *</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"><option>Active</option><option>Inactive</option><option>Draft</option></select>
          {errors.status && <span className="text-[11px] text-red-600">{errors.status}</span>}
        </label>
      </div>;
  }
  return <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate">Manage Indicators</h1>
          <p className="text-[13px] text-muted">Define and manage performance indicators by branch, department and designation.</p>
        </div>
        <Button onClick={openAdd}>+ Add Indicator</Button>
      </div>

      <FilterBar
    search={search}
    onSearch={setSearch}
    selects={[
      { label: "Branch", value: branch, onChange: setBranch, options: branchOpts },
      { label: "Department", value: dept, onChange: setDept, options: deptOpts },
      { label: "Designation", value: desig, onChange: setDesig, options: desigOpts },
      { label: "Rating", value: rating, onChange: setRating, options: ratingOpts },
      { label: "Status", value: status, onChange: setStatus, options: statusOpts }
    ]}
    onClear={() => {
      setSearch("");
      setBranch("All");
      setDept("All");
      setDesig("All");
      setRating("All");
      setStatus("All");
    }}
  />

      <DataTable
    columns={cols}
    data={filtered}
    emptyTitle={search || branch !== "All" ? "No results match your current filters." : "No indicators found"}
    emptyDesc={search || branch !== "All" ? "Try adjusting search or filters." : "Create your first performance indicator to get started."}
    emptyAction={search || branch !== "All" ? <Button variant="secondary" onClick={() => {
      setSearch("");
      setBranch("All");
      setDept("All");
      setDesig("All");
      setRating("All");
      setStatus("All");
    }}>Clear Filters</Button> : <Button onClick={openAdd}>+ Add Indicator</Button>}
  />

      {
    /* Add Modal */
  }
      <Modal
    open={addOpen}
    onClose={() => setAddOpen(false)}
    title="Add Indicator"
    footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={save}>Save Indicator</Button></>}
  >
        <FormFields />
      </Modal>

      {
    /* Edit Modal */
  }
      <Modal
    open={!!editRow}
    onClose={() => setEditRow(null)}
    title="Edit Indicator"
    footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={save}>Save Indicator</Button></>}
  >
        <FormFields />
      </Modal>

      {
    /* View Drawer */
  }
      <Drawer
    open={!!viewRow}
    onClose={() => setViewRow(null)}
    title={viewRow?.name ?? ""}
    subtitle={`${viewRow?.branch} \u2022 ${viewRow?.department} \u2022 ${viewRow?.designation}`}
    actions={<><Button variant="secondary" onClick={() => setViewRow(null)}>Close</Button><Button onClick={() => {
      if (viewRow) openEdit(viewRow);
      setViewRow(null);
    }}>Edit</Button></>}
  >
        {viewRow && <div className="flex flex-col gap-4 text-[13px]">
            <p className="text-muted">{viewRow.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-off border border-bdr rounded-xl p-3"><div className="text-[11px] text-muted uppercase">Weight</div><div className="font-semibold">{viewRow.weight}</div></div>
              <div className="bg-off border border-bdr rounded-xl p-3"><div className="text-[11px] text-muted uppercase">Overall Rating</div><div className="font-semibold flex items-center gap-1"><Star size={14} className="text-amber-500" />{viewRow.rating}</div></div>
              <div className="bg-off border border-bdr rounded-xl p-3"><div className="text-[11px] text-muted uppercase">Status</div><div className="mt-1"><span className={`px-2 py-1 rounded-full text-[11px] border ${viewRow.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-bdr text-slate"}`}>{viewRow.status}</span></div></div>
              <div className="bg-off border border-bdr rounded-xl p-3"><div className="text-[11px] text-muted uppercase">Added By</div><div>{viewRow.addedBy}</div></div>
              <div className="bg-off border border-bdr rounded-xl p-3"><div className="text-[11px] text-muted uppercase">Created At</div><div>{viewRow.createdAt}</div></div>
              <div className="bg-off border border-bdr rounded-xl p-3"><div className="text-[11px] text-muted uppercase">Last Updated</div><div>{viewRow.updatedAt}</div></div>
            </div>
          </div>}
      </Drawer>

      {
    /* Delete confirm */
  }
      <Modal
    open={!!deleteRow}
    onClose={() => setDeleteRow(null)}
    title="Delete Indicator?"
    footer={<><Button variant="secondary" onClick={() => setDeleteRow(null)}>Cancel</Button><Button variant="danger" onClick={() => {
      if (deleteRow) setData((d) => d.filter((x) => x.id !== deleteRow.id));
      setDeleteRow(null);
      showToast("Indicator deleted successfully.");
    }}>Delete Indicator</Button></>}
  >
        <p className="text-[13px] text-muted">Are you sure you want to delete <b>{deleteRow?.name}</b>? This action cannot be undone.</p>
      </Modal>
    </div>;
}
