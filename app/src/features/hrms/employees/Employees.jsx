import { useState, useMemo } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/ui/DataTable";
import Modal from "../../../components/ui/Modal";
import { useAppStore } from "../../../stores/appStore";
import { getInitial, safeString } from "../../../utils/stringUtils";

const MOCK_EMPLOYEES = [
  { id: "EMP1001", name: "Rohan Sharma", email: "rohan@evenmore.in", designation: "Senior React Developer", department: "Engineering", location: "Bangalore", joining: "Mar 15, 2022", status: "Active", manager: "Priya Nair" },
  { id: "EMP1002", name: "Priya Nair", email: "priya@evenmore.in", designation: "Engineering Manager", department: "Engineering", location: "Bangalore", joining: "Jan 10, 2021", status: "Active", manager: "Rajesh Kumar" },
  { id: "EMP1003", name: "Amit Joshi", email: "amit@evenmore.in", designation: "Product Designer", department: "Design", location: "Mumbai", joining: "Jun 01, 2023", status: "Active", manager: "Priya Nair" },
  { id: "EMP1004", name: "Sneha Reddy", email: "sneha@evenmore.in", designation: "HR Specialist", department: "HR", location: "Hyderabad", joining: "Aug 20, 2022", status: "Active", manager: "Kavita Rao" },
  { id: "EMP1005", name: "Vikram Malhotra", email: "vikram@evenmore.in", designation: "Sales Director", department: "Sales", location: "Delhi", joining: "Feb 14, 2020", status: "Active", manager: "Rajesh Kumar" },
  { id: "EMP1006", name: "Pooja Hegde", email: "pooja@evenmore.in", designation: "Financial Analyst", department: "Finance", location: "Mumbai", joining: "Nov 05, 2023", status: "On Leave", manager: "Suresh Iyer" },
  { id: "EMP1007", name: "Karan Patel", email: "karan@evenmore.in", designation: "DevOps Engineer", department: "Engineering", location: "Bangalore", joining: "Jul 18, 2023", status: "Probation", manager: "Priya Nair" },
  { id: "EMP1008", name: "Anjali Verma", email: "anjali@evenmore.in", designation: "Marketing Head", department: "Marketing", location: "Delhi", joining: "Jan 03, 2020", status: "Active", manager: "David Patel" }
];
const DEPARTMENTS = ["All", "Engineering", "HR", "Sales", "Finance", "Operations", "Design", "Marketing"];
const STATUSES = ["All", "Active", "On Leave", "Probation"];
const COLUMNS = [
  {
    key: "name",
    label: "Employee",
    sortable: true,
    render: (val, row) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
      className="profile-avatar"
      style={{ width: 32, height: 32, fontSize: "0.75rem", background: "#1f6bff" }}
    >
          {getInitial(val, 'E')}
        </span>
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#173562" }}>{safeString(val, 'Unnamed Employee')}</div>
          <div style={{ fontSize: "0.78rem", color: "#7184a3" }}>{safeString(row?.email, '—')}</div>
        </div>
      </div>
  },
  { key: "id", label: "Employee ID" },
  { key: "designation", label: "Designation", sortable: true },
  { key: "department", label: "Department", sortable: true },
  { key: "location", label: "Location" },
  { key: "joining", label: "Joining Date", sortable: true },
  {
    key: "status",
    label: "Status",
    render: (val) => <StatusBadge status={val} />
  }
];
export default function Employees() {
  const setToast = useAppStore((s) => s.setToast);
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
  const [form, setForm] = useState({ name: "", email: "", designation: "Senior Engineer", dept: "Engineering", location: "Mumbai" });
  const filtered = useMemo(
    () => employees.filter(
      (e) => (dept === "All" || e.department === dept) && (status === "All" || e.status === status)
    ),
    [employees, dept, status]
  );
  function handleAdd() {
    if (!form.name || !form.email) return setToast("Name and email are required.", "error");
    const next = {
      id: `EMP${1e3 + employees.length + 1}`,
      name: form.name,
      email: form.email,
      designation: form.designation,
      department: form.dept,
      location: form.location,
      joining: (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" }),
      status: "Active",
      manager: "David Patel"
    };
    setEmployees((prev) => [...prev, next]);
    setToast("Employee added successfully.");
    setShowForm(false);
    setForm({ name: "", email: "", designation: "Senior Engineer", dept: "Engineering", location: "Mumbai" });
  }
  return <>
      <PageHeader
    title="Employee Directory"
    subtitle={`${filtered.length} employees across ${DEPARTMENTS.length - 1} departments`}
    breadcrumb={[{ label: "HRMS" }, { label: "Employees" }]}
    actions={<>
            <button type="button" className="btn-outline btn-sm">Export</button>
            <button type="button" className="btn-primary btn-sm" onClick={() => setShowForm(true)}>
              + Add Employee
            </button>
          </>}
  />

      <div className="section-wrap">
        {
    /* Filters */
  }
        <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.84rem", color: "#294364", fontWeight: 600 }}>Department:</label>
          <select
    className="form-select"
    style={{ width: 160, height: 34 }}
    value={dept}
    onChange={(e) => setDept(e.target.value)}
  >
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <label style={{ fontSize: "0.84rem", color: "#294364", fontWeight: 600 }}>Status:</label>
          <select
    className="form-select"
    style={{ width: 140, height: 34 }}
    value={status}
    onChange={(e) => setStatus(e.target.value)}
  >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {
    /* Table */
  }
        <DataTable
    columns={COLUMNS}
    data={filtered}
    rowKey="id"
    selectable
    searchable
    searchPlaceholder="Search employees..."
    emptyMessage="No employees match the current filters."
    pageSize={10}
  />
      </div>

      {
    /* Add Employee Modal */
  }
      <Modal
    isOpen={showForm}
    onClose={() => setShowForm(false)}
    title="Add Employee"
    footer={<>
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleAdd}>Add Employee</button>
          </>}
  >
        <div style={{ display: "grid", gap: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input className="form-input" placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="required">*</span></label>
              <input className="form-input" type="email" placeholder="Enter email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>
                {DEPARTMENTS.slice(1).map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>;
}
