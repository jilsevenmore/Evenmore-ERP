import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Download, ChevronRight, ChevronLeft, ChevronDown, Trash2, Award, TrendingUp, AlertTriangle, ArrowRightLeft, Plus, X, Calendar, FileText, Briefcase, Search, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { useAppStore } from "../../../stores/appStore";
import { useRecruitmentStore, syncCandidateToEmployee } from "../../../stores/recruitmentStore";
import { PageInfoButton } from "../../../components/common/PageInfoButton";
import UserInitials from "../../../components/common/UserInitials";
import { hrmsGuides } from "../../../data/hrms/hrmsGuides";
import { hrmsSync } from "../../../services/hrmsSync";
import {
  fetchEmployeeTransfers,
  createEmployeeTransfer,
  fetchEmployeePromotions,
  createEmployeePromotion,
  fetchEmployeeWarnings,
  createEmployeeWarning,
  fetchEmployeeAwards,
  createEmployeeAward,
  confirmEmployeeProbation,
  extendEmployeeProbation,
  evaluateEmployeeLifecycle,
} from "../../../services/upgradeService";
import PerformanceReportModal from "../performance/PerformanceReportModal";

const EMPTY_FORM = { name: "", email: "", designation: "", dept: "", location: "", createUserAccount: true, password: "" };

const STATUSES = ["All Active", "Active", "On Leave", "Probation", "Notice Period", "Resigned", "Terminated", "All Records"];

/** The employee's Administration login, kept in step with this record. */
function LoginBadge({ login }) {
  if (!login) return <span className="emp-login emp-login-none">No login</span>;
  const inactive = login.status !== "Active";
  return (
    <span className={`emp-login ${inactive ? "emp-login-off" : ""}`} title={login.role ? `${login.email} • ${login.role}` : login.email}>
      {login.role || "User"}{inactive ? ` • ${login.status}` : ""}
    </span>
  );
}

const statusStyles = {
  Active: { background: "#e6f4ea", color: "#15803d", border: "#a7f3d0" },
  "On Leave": { background: "#fef3c7", color: "#b45309", border: "#fde68a" },
  Probation: { background: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Notice Period": { background: "#fff7ed", color: "#c2410c", border: "#ffedd5" },
  Resigned: { background: "#f3f4f6", color: "#4b5563", border: "#e5e7eb" },
  Terminated: { background: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
};

const confirmationBadgeStyles = {
  "On Probation": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Due for Confirmation": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
  Confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Extended: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300" },
};

export default function Employees() {
  const location = useLocation();
  const storeEmployees = useAppStore((s) => s.employees || []);
  const addStoreEmployee = useAppStore((s) => s.addEmployee);
  const deleteStoreEmployee = useAppStore((s) => s.deleteEmployee);
  const refreshHrms = useAppStore((s) => s.refreshHrms);
  const setToast = useAppStore((s) => s.setToast || s.showToast);

  const candidates = useRecruitmentStore((s) => s.candidates || []);
  const offers = useRecruitmentStore((s) => s.offers || []);
  const jobs = useRecruitmentStore((s) => s.jobs || []);

  const [search, setSearch] = useState(location.state?.search || "");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("All");
  const [viewMode, setViewMode] = useState("Table");
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Performance Report Modal State
  const [perfReportOpen, setPerfReportOpen] = useState(false);
  const [selectedPerfEmp, setSelectedPerfEmp] = useState(null);

  // Sync search state if navigating from Candidate page with a search query
  useEffect(() => {
    if (location.state?.search) {
      setSearch(location.state.search);
      setCurrentPage(1);
    }
  }, [location.state]);

  // Ensure any hired candidates from recruitment pipeline are synced to Employee directory
  useEffect(() => {
    candidates.forEach((cand) => {
      if (cand.stage === "Hired") {
        syncCandidateToEmployee(cand, offers, jobs);
      }
    });
  }, [candidates, offers, jobs]);

  // Use store employees, normalized with img/avatar
  const employees = useMemo(() => {
    return storeEmployees.map((e) => ({
      ...e,
      img: e.img || e.avatar || `https://i.pravatar.cc/100?u=${e.id || e.name}`,
    }));
  }, [storeEmployees]);

  const [form, setForm] = useState(EMPTY_FORM);

  const [departmentsList, setDepartmentsList] = useState([]);
  const [designationsList, setDesignationsList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);

  // Lifecycle State
  const [selectedLifecycleEmp, setSelectedLifecycleEmp] = useState(null);
  const [lifecycleTab, setLifecycleTab] = useState("probation"); // 'probation' | 'transfers' | 'promotions' | 'warnings' | 'awards'
  const [transfers, setTransfers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [awards, setAwards] = useState([]);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [evaluatingLifecycle, setEvaluatingLifecycle] = useState(false);

  // Sub-forms for creating lifecycle events
  const [showEventCreateModal, setShowEventCreateModal] = useState(false);
  const [probationAction, setProbationAction] = useState(null); // null | 'confirm' | 'extend'
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmForm, setConfirmForm] = useState({ effective_date: new Date().toISOString().slice(0, 10), remarks: '' });
  const [extendForm, setExtendForm] = useState({ extension_days: '30', reason: '' });
  const [transferForm, setTransferForm] = useState({ to_department: '', to_branch: '', effective_date: new Date().toISOString().slice(0, 10), reason: '' });
  const [promotionForm, setPromotionForm] = useState({ new_designation: '', previous_salary: '', new_salary: '', effective_date: new Date().toISOString().slice(0, 10), notes: '' });
  const [warningForm, setWarningForm] = useState({ warning_level: 'Medium', title: '', explanation: '', warning_date: new Date().toISOString().slice(0, 10) });
  const [awardForm, setAwardForm] = useState({ award_name: '', citation: '', cash_reward: '', presentation_date: new Date().toISOString().slice(0, 10) });

  const handleEvaluateLifecycle = async () => {
    setEvaluatingLifecycle(true);
    try {
      const res = await evaluateEmployeeLifecycle();
      await refreshHrms?.("employees");
      const data = res?.data || res;
      setToast(
        data?.message ||
        `Lifecycle evaluated: ${data?.probation_due_count ?? 0} due for confirmation, ${data?.probation_confirmed_count ?? 0} confirmed, ${data?.exits_processed ?? 0} exit(s) processed.`
      );
    } catch (err) {
      setToast("Failed to evaluate lifecycle: " + (err?.message || "Server error"), "error");
    } finally {
      setEvaluatingLifecycle(false);
    }
  };

  const handleConfirmProbationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLifecycleEmp) return;
    setActionLoading(true);
    try {
      const res = await confirmEmployeeProbation(selectedLifecycleEmp.id, {
        effective_date: confirmForm.effective_date,
        remarks: confirmForm.remarks,
      });
      setToast("Employee probation confirmed successfully.");
      setProbationAction(null);
      await refreshHrms?.("employees");
      const updated = res?.data || res;
      setSelectedLifecycleEmp((prev) => ({
        ...prev,
        status: updated.status || "Active",
        confirmationStatus: updated.confirmationStatus || updated.confirmation_status || "Confirmed",
        confirmationDate: updated.confirmationDate || updated.confirmation_date || confirmForm.effective_date,
        confirmationRemarks: updated.confirmationRemarks || updated.confirmation_remarks || confirmForm.remarks,
        probationHistory: updated.probationHistory || updated.probation_history || prev?.probationHistory || [],
      }));
    } catch (err) {
      setToast("Failed to confirm probation: " + (err?.message || "Server error"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendProbationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLifecycleEmp) return;
    if (!extendForm.reason.trim()) {
      setToast("Reason for probation extension is required.", "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await extendEmployeeProbation(selectedLifecycleEmp.id, {
        extension_days: parseInt(extendForm.extension_days, 10),
        reason: extendForm.reason,
      });
      setToast("Employee probation extended successfully.");
      setProbationAction(null);
      await refreshHrms?.("employees");
      const updated = res?.data || res;
      setSelectedLifecycleEmp((prev) => ({
        ...prev,
        confirmationStatus: updated.confirmationStatus || updated.confirmation_status || "Extended",
        probationEndDate: updated.probationEndDate || updated.probation_end_date || prev?.probationEndDate,
        probationPeriod: updated.probationPeriod || updated.probation_period || prev?.probationPeriod,
        probationHistory: updated.probationHistory || updated.probation_history || prev?.probationHistory || [],
      }));
    } catch (err) {
      setToast("Failed to extend probation: " + (err?.message || "Server error"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const loadLifecycleData = async (empId) => {
    setLifecycleLoading(true);
    try {
      const [tRes, pRes, wRes, aRes] = await Promise.all([
        fetchEmployeeTransfers(empId).catch(() => []),
        fetchEmployeePromotions(empId).catch(() => []),
        fetchEmployeeWarnings(empId).catch(() => []),
        fetchEmployeeAwards(empId).catch(() => []),
      ]);
      setTransfers(Array.isArray(tRes?.data) ? tRes.data : Array.isArray(tRes) ? tRes : []);
      setPromotions(Array.isArray(pRes?.data) ? pRes.data : Array.isArray(pRes) ? pRes : []);
      setWarnings(Array.isArray(wRes?.data) ? wRes.data : Array.isArray(wRes) ? wRes : []);
      setAwards(Array.isArray(aRes?.data) ? aRes.data : Array.isArray(aRes) ? aRes : []);
    } catch (err) {
      console.error('Failed to load employee lifecycle:', err);
    } finally {
      setLifecycleLoading(false);
    }
  };

  const handleOpenLifecycle = (emp, initialTab = 'probation') => {
    setSelectedLifecycleEmp(emp);
    setLifecycleTab(initialTab);
    setShowEventCreateModal(false);
    setProbationAction(null);
    setConfirmForm({ effective_date: new Date().toISOString().slice(0, 10), remarks: '' });
    setExtendForm({ extension_days: '30', reason: '' });
    setTransferForm({ to_department: '', to_branch: '', effective_date: new Date().toISOString().slice(0, 10), reason: '' });
    setPromotionForm({ new_designation: '', previous_salary: emp.standardSalary || emp.standard_salary || '', new_salary: '', effective_date: new Date().toISOString().slice(0, 10), notes: '' });
    setWarningForm({ warning_level: 'First Written', title: '', explanation: '', warning_date: new Date().toISOString().slice(0, 10) });
    setAwardForm({ award_name: '', citation: '', cash_reward: '', presentation_date: new Date().toISOString().slice(0, 10), category: 'Excellence' });
    loadLifecycleData(emp.id);
  };

  useEffect(() => {
    let cancelled = false;
    refreshHrms?.("employees");
    Promise.all([
      hrmsSync.pull("departments"),
      hrmsSync.pull("designations"),
      hrmsSync.pull("locations"),
    ]).then(([deps, desigs, locs]) => {
      if (cancelled) return;
      if (deps) setDepartmentsList(deps);
      if (desigs) setDesignationsList(desigs);
      if (locs) setLocationsList(locs);
    });
    return () => { cancelled = true; };
  }, [refreshHrms]);

  const DEPARTMENTS = useMemo(
    () => ["All", ...new Set([...departmentsList.map((d) => d.name).filter(Boolean), ...employees.map((e) => e.department).filter(Boolean)])],
    [departmentsList, employees]
  );

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (dept !== "All" && e.department !== dept) return false;
      if (status === "All Active") {
        if (["Resigned", "Terminated"].includes(e.status)) return false;
      } else if (status === "All Records") {
        // Show everything including historical records
      } else if (status !== "All") {
        if (e.status !== status) return false;
      } else {
        // Default "All" excludes exited employees
        if (["Resigned", "Terminated"].includes(e.status)) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${e.name || ""} ${e.email || ""} ${e.designation || ""} ${e.department || ""} ${e.employeeCode || e.empId || e.id || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [employees, dept, status, search]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  async function handleAdd() {
    if (!form.name || !form.email) return setToast("Name and email are required.", "error");

    const matchedDept = departmentsList.find((d) => d.name?.toLowerCase() === form.dept?.trim().toLowerCase());
    const matchedDesig = designationsList.find((d) => d.name?.toLowerCase() === form.designation?.trim().toLowerCase());
    const matchedLoc = locationsList.find((l) => l.name?.toLowerCase() === form.location?.trim().toLowerCase());

    const next = {
      name: form.name.trim(),
      email: form.email.trim(),
      designation: form.designation?.trim() || "",
      designationId: matchedDesig?.id || undefined,
      department: form.dept?.trim() || "",
      departmentId: matchedDept?.id || undefined,
      location: form.location?.trim() || "",
      locationId: matchedLoc?.id || undefined,
      joining: new Date().toISOString().split("T")[0],
      joiningDate: new Date().toISOString().split("T")[0],
      status: "Active",
      createUserAccount: form.createUserAccount !== false,
      password: form.password?.trim() || undefined,
    };

    try {
      await addStoreEmployee(next);
      setToast("Employee added successfully.");
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch {
      // toast is displayed by store
    }
  }

  function handleDelete(id, name) {
    deleteStoreEmployee(id);
    setToast(`Employee ${name} removed.`);
  }

  const handleExport = () => {
    const header = "ID,Name,Email,Designation,Department,Status";
    const rows = filtered.map((e) => `"${e.employeeCode || e.empId || e.id}","${e.name}","${e.email}","${e.designation}","${e.department}","${e.status}"`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee-directory.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="emp-dir-page">
      {/* Breadcrumb */}
      <nav className="emp-crumb">
        <span style={{ cursor: "pointer" }}>Home</span>
        <ChevronRight size={13} style={{ color: "#9aa7bd" }} />
        <span style={{ color: "#111f36", fontWeight: 600 }}>Employee Setup</span>
      </nav>

      {/* Header Row */}
      <div className="emp-title-row">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="emp-title">Employee Directory</h1>
            <PageInfoButton guide={hrmsGuides.employees} />
          </div>
          <p className="emp-sub">
            {filtered.length} employee{filtered.length === 1 ? "" : "s"} • {Math.max(DEPARTMENTS.length - 1, 0)} department{DEPARTMENTS.length - 1 === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex-wrap lg:flex-nowrap" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            disabled={evaluatingLifecycle}
            onClick={handleEvaluateLifecycle}
            className="emp-export-btn"
            style={{ borderColor: "#cbd5e1", color: "#334155", background: "#f8fafc" }}
            title="Evaluate probation confirmations and notice periods across all employees"
          >
            <Clock size={15} className={evaluatingLifecycle ? "animate-spin text-blue-600" : "text-slate-600"} />
            {evaluatingLifecycle ? "Evaluating..." : "Evaluate Lifecycle"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPerfEmp(filtered[0] || employees[0] || null);
              setPerfReportOpen(true);
            }}
            className="emp-export-btn"
            style={{ borderColor: "#93c5fd", color: "#1d4ed8", background: "#eff6ff" }}
            title="Generate Performance & Appraisal Report for Employees"
          >
            <FileText size={15} /> Performance Report
          </button>
          <button type="button" onClick={handleExport} className="emp-export-btn">
            <Download size={15} /> Export
          </button>
          <button type="button" onClick={() => setShowForm(true)} className="emp-add-btn">
            Add Employee
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="emp-card emp-filter-card">
        <div className="flex-wrap lg:flex-nowrap" style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          {/* Search Bar */}
          <div className="relative flex items-center min-w-[220px] max-w-[340px] flex-1">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employee by name, role, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setCurrentPage(1); }}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
              >
                ×
              </button>
            )}
          </div>

          <div className={`emp-filter-dropdown ${dept !== "All" ? "active" : ""}`}>
            <span className="emp-filter-text">
              {dept === "All" ? "Department" : dept}
            </span>
            <ChevronDown size={13} className="emp-filter-arrow" />
            <select
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                setCurrentPage(1);
              }}
              className="emp-filter-native-select"
              aria-label="Department Filter"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className={`emp-filter-dropdown ${status !== "All" ? "active" : ""}`}>
            <span className="emp-filter-text">
              {status === "All" ? "Status" : status}
            </span>
            <ChevronDown size={13} className="emp-filter-arrow" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="emp-filter-native-select"
              aria-label="Status Filter"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {(dept !== "All" || status !== "All" || search.trim() !== "") && (
            <button
              type="button"
              onClick={() => {
                setDept("All");
                setStatus("All");
                setSearch("");
                setCurrentPage(1);
              }}
              className="emp-btn-clear"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Table / Grid Toggle */}
        <div className="emp-tabs">
          <button
            type="button"
            onClick={() => setViewMode("Table")}
            className={viewMode === "Table" ? "emp-tab active" : "emp-tab"}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("Grid")}
            className={viewMode === "Grid" ? "emp-tab active" : "emp-tab"}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Main Table / Grid Card */}
      <div className="emp-card emp-main-card">
        {viewMode === "Table" ? (
          <div style={{ overflowX: "auto" }}>
            <table className="emp-table">
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>ID</th>
                  <th>DESIGNATION</th>
                  <th>DEPARTMENT</th>
                  <th>STATUS</th>
                  <th>LOGIN</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <UserInitials name={row.name} className="w-[34px] h-[34px] text-xs" />
                        <div>
                          <span style={{ fontWeight: 600, color: "#111827", display: "inline-block", marginRight: 8 }}>
                            {row.name}
                          </span>
                          <span style={{ fontSize: "12.5px", color: "#6b7280" }}>{row.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="emp-id">{row.employeeCode || row.empId || row.id}</td>
                    <td style={{ color: "#374151" }}>{row.designation}</td>
                    <td style={{ color: "#374151" }}>{row.department}</td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span className="emp-status" style={{ ...statusStyles[row.status] }}>
                          {row.status}
                        </span>
                        {row.confirmationStatus && row.confirmationStatus !== "Confirmed" && (
                          <span
                            onClick={() => handleOpenLifecycle(row, "probation")}
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-80 transition ${
                              row.confirmationStatus === "Due for Confirmation"
                                ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                                : row.confirmationStatus === "Extended"
                                ? "bg-purple-100 text-purple-800 border-purple-300"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                            title={`Click to review probation: ${row.confirmationStatus}${row.probationEndDate ? ` (Due ${row.probationEndDate})` : ""}`}
                          >
                            {row.confirmationStatus}
                            {row.probationEndDate ? ` • Due ${row.probationEndDate}` : ""}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <LoginBadge login={row.login} />
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenLifecycle(row, "probation")}
                        className="emp-trash-btn inline-block mr-1"
                        style={{ color: row.confirmationStatus === "Due for Confirmation" ? "#b45309" : "#0284c7" }}
                        title="Probation & Notice Lifecycle"
                      >
                        <Clock size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPerfEmp(row);
                          setPerfReportOpen(true);
                        }}
                        className="emp-trash-btn inline-block mr-1"
                        style={{ color: "#059669" }}
                        title="Generate Performance Report"
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenLifecycle(row, "transfers")}
                        className="emp-trash-btn inline-block mr-1"
                        style={{ color: "#2563eb" }}
                        title="Employee Lifecycle (Transfers, Promotions, Warnings, Awards)"
                      >
                        <Award size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id, row.name)}
                        className="emp-trash-btn inline-block"
                        title="Delete employee"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedEmployees.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>
                      No employees match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="emp-grid-view">
            {paginatedEmployees.map((row) => (
              <div key={row.id} className="emp-grid-item">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <UserInitials name={row.name} className="w-[44px] h-[44px] text-sm" iconSize={20} />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPerfEmp(row);
                        setPerfReportOpen(true);
                      }}
                      className="emp-trash-btn inline-block"
                      style={{ color: "#059669" }}
                      title="Performance Report"
                    >
                      <FileText size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenLifecycle(row, "probation")}
                      className="emp-trash-btn inline-block"
                      style={{ color: row.confirmationStatus === "Due for Confirmation" ? "#b45309" : "#0284c7" }}
                      title="Probation & Notice Lifecycle"
                    >
                      <Clock size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenLifecycle(row, "transfers")}
                      className="emp-trash-btn inline-block"
                      style={{ color: "#2563eb" }}
                      title="Employee Lifecycle"
                    >
                      <Award size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id, row.name)}
                      className="emp-trash-btn"
                      title="Delete employee"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h3 style={{ margin: "10px 0 2px", fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                  {row.name}
                </h3>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#6b7280" }}>{row.email}</p>
                <div style={{ margin: "12px 0 10px", fontSize: "13px", color: "#374151" }}>
                  <strong>{row.designation}</strong> • {row.department}
                </div>
                <LoginBadge login={row.login} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span className="emp-id">{row.employeeCode || row.empId || row.id}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="emp-status" style={{ ...statusStyles[row.status] }}>
                      {row.status}
                    </span>
                    {row.confirmationStatus && row.confirmationStatus !== "Confirmed" && (
                      <span
                        onClick={() => handleOpenLifecycle(row, "probation")}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-80 transition ${
                          row.confirmationStatus === "Due for Confirmation"
                            ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                            : row.confirmationStatus === "Extended"
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                        title={`Click to review probation: ${row.confirmationStatus}${row.probationEndDate ? ` (Due ${row.probationEndDate})` : ""}`}
                      >
                        {row.confirmationStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        <div className="emp-footer">
          <span style={{ fontSize: "13px", color: "#6b7280" }}>
            Showing {paginatedEmployees.length} of {filtered.length}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="emp-page-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="emp-page-indicator">
              {currentPage}/{totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="emp-page-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Employee"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleAdd}>
              Add Employee
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                className="form-input"
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Email <span className="required">*</span>
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="Enter email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                className="form-input"
                list="emp-dept-options"
                placeholder="Enter department"
                value={form.dept}
                onChange={(e) => setForm({ ...form, dept: e.target.value })}
              />
              <datalist id="emp-dept-options">
                {DEPARTMENTS.slice(1).map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input
                className="form-input"
                list="emp-desig-options"
                placeholder="Enter designation"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
              <datalist id="emp-desig-options">
                {designationsList.map((d) => (
                  <option key={d.id || d.name} value={d.name} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              className="form-input"
              list="emp-loc-options"
              placeholder="Enter location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <datalist id="emp-loc-options">
              {locationsList.map((l) => (
                <option key={l.id || l.name} value={l.name} />
              ))}
            </datalist>
          </div>
          <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "13.5px", fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.createUserAccount !== false}
                onChange={(e) => setForm({ ...form, createUserAccount: e.target.checked })}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              Create Administration Login Account for this Employee
            </label>
            <p style={{ margin: "4px 0 0 25px", fontSize: "12px", color: "#64748b" }}>
              Connects with Administration Users so this employee can log into the ERP. Name, email, phone, department, location and manager stay in step between the two.
            </p>
            {form.createUserAccount !== false && (
              <div style={{ marginTop: 10, marginLeft: 25 }}>
                <label className="form-label" style={{ fontSize: "12px", marginBottom: 4 }}>
                  Initial Password <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Leave empty to email the employee an activation link"
                  value={form.password || ""}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ maxWidth: 320, fontSize: "13px" }}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Employee Lifecycle Management Modal */}
      {selectedLifecycleEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <UserInitials name={selectedLifecycleEmp.name} className="w-10 h-10 text-sm" iconSize={18} />
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    {selectedLifecycleEmp.name}
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {selectedLifecycleEmp.employeeCode || selectedLifecycleEmp.empId || selectedLifecycleEmp.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedLifecycleEmp.designation} • {selectedLifecycleEmp.department}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLifecycleEmp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lifecycle Tabs */}
            <div className="flex border-b border-slate-200 px-6 pt-2 bg-white overflow-x-auto">
              <button
                onClick={() => { setLifecycleTab("probation"); setShowEventCreateModal(false); }}
                className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                  lifecycleTab === "probation" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock size={14} /> Probation & Notice
                {selectedLifecycleEmp.confirmationStatus && (
                  <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    selectedLifecycleEmp.confirmationStatus === "Due for Confirmation"
                      ? "bg-amber-100 text-amber-800"
                      : selectedLifecycleEmp.confirmationStatus === "Confirmed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {selectedLifecycleEmp.confirmationStatus}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setLifecycleTab("transfers"); setShowEventCreateModal(false); }}
                className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                  lifecycleTab === "transfers" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ArrowRightLeft size={14} /> Transfers ({transfers.length})
              </button>
              <button
                onClick={() => { setLifecycleTab("promotions"); setShowEventCreateModal(false); }}
                className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                  lifecycleTab === "promotions" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <TrendingUp size={14} /> Promotions ({promotions.length})
              </button>
              <button
                onClick={() => { setLifecycleTab("warnings"); setShowEventCreateModal(false); }}
                className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                  lifecycleTab === "warnings" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <AlertTriangle size={14} /> Disciplinary ({warnings.length})
              </button>
              <button
                onClick={() => { setLifecycleTab("awards"); setShowEventCreateModal(false); }}
                className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                  lifecycleTab === "awards" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Award size={14} /> Awards ({awards.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-700">
                  {lifecycleTab === "probation" && "Probation Period & Employment Confirmation Lifecycle"}
                  {lifecycleTab === "transfers" && "Department & Location Transfer History"}
                  {lifecycleTab === "promotions" && "Career Progression & Salary Revisions"}
                  {lifecycleTab === "warnings" && "Formal Performance & Conduct Notices"}
                  {lifecycleTab === "awards" && "Excellence Awards & Spot Recognition"}
                </p>
                {lifecycleTab !== "probation" && (
                  <button
                    type="button"
                    onClick={() => setShowEventCreateModal(!showEventCreateModal)}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg font-semibold flex items-center gap-1 hover:bg-primary/90 transition"
                  >
                    <Plus size={13} /> {showEventCreateModal ? "Close Form" : `Record ${lifecycleTab.slice(0, -1)}`}
                  </button>
                )}
              </div>

              {/* Event Creation Forms */}
              {showEventCreateModal && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-slate-800">
                    Add New {lifecycleTab.slice(0, 1).toUpperCase() + lifecycleTab.slice(1, -1)} Record
                  </h4>
                  {lifecycleTab === "transfers" && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await createEmployeeTransfer({
                            employeeId: selectedLifecycleEmp.id,
                            from_department: selectedLifecycleEmp.department,
                            to_department: transferForm.to_department,
                            effective_date: transferForm.effective_date,
                            reason: transferForm.reason,
                          });
                          setToast("Transfer recorded successfully.");
                          setShowEventCreateModal(false);
                          setSelectedLifecycleEmp((prev) => prev ? { ...prev, department: transferForm.to_department } : prev);
                          await loadLifecycleData(selectedLifecycleEmp.id);
                          refreshHrms?.("employees");
                        } catch (err) {
                          setToast("Failed to record transfer: " + (err?.message || "Server error"), "error");
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Target Department *</label>
                          <input
                            type="text"
                            required
                            list="department-options"
                            placeholder="Select or enter department"
                            value={transferForm.to_department}
                            onChange={(e) => setTransferForm({ ...transferForm, to_department: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          />
                          <datalist id="department-options">
                            {departmentsList.map((d) => (
                              <option key={d.id} value={d.name} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Effective Date *</label>
                          <input
                            type="date"
                            required
                            value={transferForm.effective_date}
                            onChange={(e) => setTransferForm({ ...transferForm, effective_date: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Transfer Justification</label>
                        <textarea
                          rows={2}
                          value={transferForm.reason}
                          onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          placeholder="Operational requirement or employee request..."
                        />
                      </div>
                      <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-95">
                        Confirm Transfer
                      </button>
                    </form>
                  )}

                  {lifecycleTab === "promotions" && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await createEmployeePromotion({
                            employeeId: selectedLifecycleEmp.id,
                            previous_designation: selectedLifecycleEmp.designation,
                            new_designation: promotionForm.new_designation,
                            previous_salary: parseFloat(promotionForm.previous_salary) || 0,
                            new_salary: parseFloat(promotionForm.new_salary) || 0,
                            effective_date: promotionForm.effective_date,
                            notes: promotionForm.notes,
                          });
                          setToast("Promotion confirmed successfully.");
                          setShowEventCreateModal(false);
                          setSelectedLifecycleEmp((prev) => prev ? { ...prev, designation: promotionForm.new_designation, standardSalary: promotionForm.new_salary } : prev);
                          await loadLifecycleData(selectedLifecycleEmp.id);
                          refreshHrms?.("employees");
                        } catch (err) {
                          setToast("Failed to confirm promotion: " + (err?.message || "Server error"), "error");
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Promoted Designation *</label>
                          <input
                            type="text"
                            required
                            list="designation-options"
                            placeholder="Select or enter designation"
                            value={promotionForm.new_designation}
                            onChange={(e) => setPromotionForm({ ...promotionForm, new_designation: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          />
                          <datalist id="designation-options">
                            {designationsList.map((d) => (
                              <option key={d.id} value={d.title || d.name} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Effective Date *</label>
                          <input
                            type="date"
                            required
                            value={promotionForm.effective_date}
                            onChange={(e) => setPromotionForm({ ...promotionForm, effective_date: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Previous CTC (Rs)</label>
                          <input
                            type="number"
                            value={promotionForm.previous_salary}
                            onChange={(e) => setPromotionForm({ ...promotionForm, previous_salary: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Revised CTC (Rs)</label>
                          <input
                            type="number"
                            value={promotionForm.new_salary}
                            onChange={(e) => setPromotionForm({ ...promotionForm, new_salary: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Promotion Notes / Justification</label>
                        <textarea
                          rows={2}
                          value={promotionForm.notes}
                          onChange={(e) => setPromotionForm({ ...promotionForm, notes: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          placeholder="Reason for promotion and revised role responsibilities..."
                        />
                      </div>
                      <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:opacity-95">
                        Confirm Promotion
                      </button>
                    </form>
                  )}

                  {lifecycleTab === "warnings" && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await createEmployeeWarning({
                            employeeId: selectedLifecycleEmp.id,
                            severity: warningForm.warning_level,
                            subject: warningForm.title,
                            description: warningForm.explanation,
                            issue_date: warningForm.warning_date,
                          });
                          setToast("Disciplinary notice issued successfully.");
                          setShowEventCreateModal(false);
                          await loadLifecycleData(selectedLifecycleEmp.id);
                        } catch (err) {
                          setToast("Failed to issue warning: " + (err?.message || "Server error"), "error");
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Notice Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Unexcused Absence / Conduct Violation"
                            value={warningForm.title}
                            onChange={(e) => setWarningForm({ ...warningForm, title: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Severity Level</label>
                          <select
                            value={warningForm.warning_level}
                            onChange={(e) => setWarningForm({ ...warningForm, warning_level: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                          >
                            <option value="Verbal">Verbal (Informal Counseling)</option>
                            <option value="First Written">First Written (Official Warning)</option>
                            <option value="Final Written">Final Written (Final Notice / PIP)</option>
                            <option value="Suspension">Suspension (Formal Action)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Notice Explanation</label>
                        <textarea
                          rows={2}
                          value={warningForm.explanation}
                          onChange={(e) => setWarningForm({ ...warningForm, explanation: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          placeholder="Details of the infraction and corrective measures required..."
                        />
                      </div>
                      <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:opacity-95">
                        Issue Warning Notice
                      </button>
                    </form>
                  )}

                  {lifecycleTab === "awards" && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await createEmployeeAward({
                            employeeId: selectedLifecycleEmp.id,
                            award_name: awardForm.award_name,
                            category: awardForm.category || "Excellence",
                            citation: awardForm.citation,
                            gift_amount: parseFloat(awardForm.cash_reward) || 0,
                            award_date: awardForm.presentation_date,
                          });
                          setToast("Award recorded and presented.");
                          setShowEventCreateModal(false);
                          await loadLifecycleData(selectedLifecycleEmp.id);
                        } catch (err) {
                          setToast("Failed to record award: " + (err?.message || "Server error"), "error");
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="font-semibold text-slate-700 block mb-1">Award Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Star Performer of Quarter"
                            value={awardForm.award_name}
                            onChange={(e) => setAwardForm({ ...awardForm, award_name: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Category</label>
                          <select
                            value={awardForm.category || "Excellence"}
                            onChange={(e) => setAwardForm({ ...awardForm, category: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                          >
                            <option value="Excellence">Excellence</option>
                            <option value="Star Performer">Star Performer</option>
                            <option value="Innovation">Innovation</option>
                            <option value="Customer Hero">Customer Hero</option>
                            <option value="Leadership">Leadership</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Cash Reward (Rs)</label>
                          <input
                            type="number"
                            placeholder="e.g. 10000"
                            value={awardForm.cash_reward}
                            onChange={(e) => setAwardForm({ ...awardForm, cash_reward: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Citation / Accomplishment</label>
                        <textarea
                          rows={2}
                          value={awardForm.citation}
                          onChange={(e) => setAwardForm({ ...awardForm, citation: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          placeholder="Key milestone or client feedback leading to this recognition..."
                        />
                      </div>
                      <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:opacity-95">
                        Present Award
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Data Tables */}
              {lifecycleTab === "probation" && (
                <div className="space-y-4">
                  {/* Status & Timing Overview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">Lifecycle Status:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${
                          selectedLifecycleEmp.confirmationStatus === "Due for Confirmation"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : selectedLifecycleEmp.confirmationStatus === "Confirmed"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : selectedLifecycleEmp.confirmationStatus === "Extended"
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : "bg-blue-100 text-blue-800 border-blue-300"
                        }`}>
                          {selectedLifecycleEmp.confirmationStatus === "Confirmed" && <CheckCircle2 size={13} />}
                          {selectedLifecycleEmp.confirmationStatus === "Due for Confirmation" && <AlertCircle size={13} />}
                          {selectedLifecycleEmp.confirmationStatus || "On Probation"}
                        </span>
                      </div>
                      {selectedLifecycleEmp.confirmationStatus !== "Confirmed" && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setProbationAction(probationAction === 'confirm' ? null : 'confirm')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <CheckCircle2 size={13} /> Confirm Employee
                          </button>
                          <button
                            type="button"
                            onClick={() => setProbationAction(probationAction === 'extend' ? null : 'extend')}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <Clock size={13} /> Extend Probation
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="text-slate-400 font-medium">Probation Period</div>
                        <div className="font-bold text-slate-800 mt-0.5">{selectedLifecycleEmp.probationPeriod || "90 Days (3 Months)"}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="text-slate-400 font-medium">Probation Start</div>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedLifecycleEmp.probationStartDate || selectedLifecycleEmp.joining || selectedLifecycleEmp.doj || "—"}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="text-slate-400 font-medium">Scheduled End Date</div>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedLifecycleEmp.probationEndDate || "—"}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="text-slate-400 font-medium">Standard Notice Period</div>
                        <div className="font-bold text-slate-800 mt-0.5">{selectedLifecycleEmp.noticePeriod || `${selectedLifecycleEmp.noticePeriodDays || 60} Days`}</div>
                      </div>
                    </div>

                    {selectedLifecycleEmp.confirmationStatus === "Confirmed" && (
                      <div className="mt-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs">
                        <span className="font-bold text-emerald-800">Confirmed on: </span>
                        <span className="font-mono text-emerald-900">{selectedLifecycleEmp.confirmationDate || "—"}</span>
                        {selectedLifecycleEmp.confirmationRemarks && (
                          <p className="text-emerald-700 mt-1 italic">"{selectedLifecycleEmp.confirmationRemarks}"</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline Confirmation Action Form */}
                  {probationAction === 'confirm' && (
                    <form onSubmit={handleConfirmProbationSubmit} className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 size={16} className="text-emerald-600" /> Confirm Employee Probation
                        </h4>
                        <button type="button" onClick={() => setProbationAction(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600">
                        Confirming marks the employee as Confirmed, transitions their status to Active, and records an official confirmation audit entry.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Effective Confirmation Date *</label>
                          <input
                            type="date"
                            required
                            value={confirmForm.effective_date}
                            onChange={(e) => setConfirmForm({ ...confirmForm, effective_date: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Confirmation Remarks / Appraisal Notes</label>
                          <input
                            type="text"
                            placeholder="e.g. Satisfactory completion of probation period and performance goals."
                            value={confirmForm.remarks}
                            onChange={(e) => setConfirmForm({ ...confirmForm, remarks: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setProbationAction(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer">
                          Cancel
                        </button>
                        <button type="submit" disabled={actionLoading} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition cursor-pointer">
                          {actionLoading ? "Confirming..." : "Confirm Probation"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Inline Extension Action Form */}
                  {probationAction === 'extend' && (
                    <form onSubmit={handleExtendProbationSubmit} className="p-4 bg-purple-50/40 border border-purple-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
                          <Clock size={16} className="text-purple-600" /> Extend Employee Probation
                        </h4>
                        <button type="button" onClick={() => setProbationAction(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600">
                        Extending probation recalculates the end date, marks the status as Extended, and stores the reason in the employee's audit log.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Extension Duration *</label>
                          <select
                            value={extendForm.extension_days}
                            onChange={(e) => setExtendForm({ ...extendForm, extension_days: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                          >
                            <option value="30">30 Days (1 Month)</option>
                            <option value="60">60 Days (2 Months)</option>
                            <option value="90">90 Days (3 Months)</option>
                            <option value="180">180 Days (6 Months)</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="font-semibold text-slate-700 block mb-1">Reason for Extension *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Additional performance review required for project deliveries."
                            value={extendForm.reason}
                            onChange={(e) => setExtendForm({ ...extendForm, reason: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setProbationAction(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer">
                          Cancel
                        </button>
                        <button type="submit" disabled={actionLoading} className="px-4 py-1.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition cursor-pointer">
                          {actionLoading ? "Extending..." : "Confirm Extension"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Probation History Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                      Probation & Lifecycle History
                    </div>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Event</th>
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Details / Remarks</th>
                          <th className="py-2.5 px-4 text-right">Updated By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!selectedLifecycleEmp.probationHistory || selectedLifecycleEmp.probationHistory.length === 0) ? (
                          <tr><td colSpan={4} className="py-6 text-center text-slate-400">No probation history events logged yet.</td></tr>
                        ) : (
                          selectedLifecycleEmp.probationHistory.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5 px-4 font-semibold text-slate-800">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  (item.action || item.event) === "Confirmed" ? "bg-emerald-100 text-emerald-800" :
                                  (item.action || item.event) === "Extended" ? "bg-purple-100 text-purple-800" :
                                  "bg-blue-100 text-blue-800"
                                }`}>
                                  {item.action || item.event || "Lifecycle Event"}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-600">{item.date || item.effective_date || item.timestamp || "—"}</td>
                              <td className="py-2.5 px-4 text-slate-700">
                                {item.remarks || item.reason || (item.new_end_date ? `End date set to ${item.new_end_date}` : "—")}
                              </td>
                              <td className="py-2.5 px-4 text-right text-slate-500 font-mono">{item.changed_by || item.user || "System"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {lifecycleTab === "transfers" && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">From Department</th>
                        <th className="py-2.5 px-4">To Department</th>
                        <th className="py-2.5 px-4">Effective Date</th>
                        <th className="py-2.5 px-4">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transfers.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-slate-400">No transfers recorded for this employee.</td></tr>
                      ) : (
                        transfers.map((t, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-4 text-slate-600">{t.fromDepartmentName || t.from_department || "—"}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-800">{t.toDepartmentName || t.to_department || "—"}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-600">{t.effective_date || t.effectiveDate || "—"}</td>
                            <td className="py-2.5 px-4 text-slate-600">{t.reason || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {lifecycleTab === "promotions" && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Previous Role</th>
                        <th className="py-2.5 px-4">Promoted Role</th>
                        <th className="py-2.5 px-4">Effective Date</th>
                        <th className="py-2.5 px-4 text-right">Revised Salary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {promotions.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-slate-400">No promotions recorded for this employee.</td></tr>
                      ) : (
                        promotions.map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-4 text-slate-600">{p.fromDesignationTitle || p.previous_designation || "—"}</td>
                            <td className="py-2.5 px-4 font-semibold text-emerald-700">{p.toDesignationTitle || p.new_designation || "—"}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-600">{p.effective_date || p.effectiveDate || "—"}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                              {p.new_salary ? `Rs ${Number(p.new_salary).toLocaleString("en-IN")}` : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {lifecycleTab === "warnings" && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Notice Title</th>
                        <th className="py-2.5 px-4">Severity</th>
                        <th className="py-2.5 px-4">Date Issued</th>
                        <th className="py-2.5 px-4">Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {warnings.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-slate-400">No disciplinary warnings on file.</td></tr>
                      ) : (
                        warnings.map((w, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-4 font-semibold text-slate-800">{w.subject || w.title || "—"}</td>
                            <td className="py-2.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                (w.severity || w.warning_level) === "Severe" || (w.severity || w.warning_level) === "Final Written" || (w.severity || w.warning_level) === "Suspension" ? "bg-rose-100 text-rose-800" :
                                (w.severity || w.warning_level) === "Medium" || (w.severity || w.warning_level) === "First Written" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                              }`}>
                                {w.severity || w.warning_level || "Notice"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-600">{w.issue_date || w.warning_date || "—"}</td>
                            <td className="py-2.5 px-4 text-slate-600">{w.description || w.explanation || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {lifecycleTab === "awards" && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Award Title</th>
                        <th className="py-2.5 px-4">Date Presented</th>
                        <th className="py-2.5 px-4 text-right">Cash Prize</th>
                        <th className="py-2.5 px-4">Citation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {awards.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-slate-400">No awards recorded.</td></tr>
                      ) : (
                        awards.map((a, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-4 font-semibold text-amber-800 flex items-center gap-1.5">
                              <Award size={14} className="text-amber-600" /> {a.award_name || a.title || "—"}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-600">{a.award_date || a.presentation_date || "—"}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                              {(a.gift_amount || a.cash_reward) ? `Rs ${Number(a.gift_amount || a.cash_reward).toLocaleString("en-IN")}` : "—"}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">{a.citation || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedLifecycleEmp(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance & Appraisal Report Modal */}
      <PerformanceReportModal
        isOpen={perfReportOpen}
        onClose={() => setPerfReportOpen(false)}
        employee={selectedPerfEmp}
      />

      <style>{`
        .emp-dir-page { background: #f8fafc; margin: -16px -24px -24px; padding: 18px 24px 28px; min-height: calc(100vh - 62px); }
        .emp-crumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7a90; margin-bottom: 10px; }
        .emp-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
        .emp-title { margin: 0; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.01em; }
        .emp-sub { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
        .emp-export-btn { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #d1d5db; border-radius: 10px; padding: 8px 16px; font-size: 13.5px; font-weight: 600; color: #374151; cursor: pointer; transition: background 0.15s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .emp-export-btn:hover { background: #f9fafb; }
        .emp-add-btn { background: #16233a; color: #fff; border: none; border-radius: 10px; padding: 9px 18px; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: background 0.15s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .emp-add-btn:hover { background: #0f172a; }
        
        .emp-card { background: #fff; border: 1px solid #e8edf3; border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,0.03); }
        .emp-filter-card { border: none; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
        
        .emp-select { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 7px 34px 7px 16px; font-size: 13.5px; color: #1e293b; font-weight: 500; outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230f172a' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 13px; min-width: 110px; transition: border-color 0.15s ease; }
        .emp-select:focus { border-color: #94a3b8; }

        .emp-filter-dropdown { position: relative; display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 14px; height: 36px; min-width: 130px; cursor: pointer; transition: all 0.15s ease; box-sizing: border-box; }
        .emp-filter-dropdown:hover { border-color: #cbd5e1; background: #f8fafc; }
        .emp-filter-dropdown.active { border-color: #3b82f6; background: #eff6ff; }
        .emp-filter-text { font-size: 13.5px; color: #1e293b; font-weight: 500; white-space: nowrap; user-select: none; }
        .emp-filter-dropdown.active .emp-filter-text { color: #1d4ed8; font-weight: 600; }
        .emp-filter-arrow { color: #64748b; flex-shrink: 0; pointer-events: none; }
        .emp-filter-dropdown.active .emp-filter-arrow { color: #2563eb; }
        .emp-filter-native-select { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        .emp-btn-clear { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #475569; cursor: pointer; transition: all 0.15s ease; }
        .emp-btn-clear:hover { background: #f8fafc; color: #111827; }
        
        .emp-tabs { display: inline-flex; align-items: center; gap: 3px; background: #f4f4f6; border: 1px solid #e5e7eb; border-radius: 999px; padding: 3px 4px; }
        .emp-tab { border: 1.5px solid transparent; border-radius: 999px; padding: 4px 16px; font-size: 13px; font-weight: 500; color: #8e9baa; background: transparent; cursor: pointer; transition: all 0.15s ease; }
        .emp-tab.active { font-weight: 600; color: #000000; background: #ffffff; border-color: #000000; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
        
        .emp-main-card { overflow: hidden; }
        .emp-table { width: 100%; border-collapse: collapse; min-width: 720px; font-size: 13.5px; }
        .emp-table thead tr { background: #ffffff; border-bottom: 1px solid #e2e8f0; }
        .emp-table th { text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #7b8aa0; padding: 14px 20px; white-space: nowrap; }
        .emp-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.12s ease; }
        .emp-table tbody tr:hover { background: #f8fafc; }
        .emp-table td { padding: 14px 20px; vertical-align: middle; }
        
        .emp-avatar { width: 34px; height: 34px; border-radius: 999px; object-fit: cover; }
        .emp-avatar-large { width: 44px; height: 44px; border-radius: 999px; object-fit: cover; }
        .emp-id { font-family: inherit; font-size: 12.5px; color: #6b7280; white-space: nowrap; }
        .emp-status { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 4px 13px; border: 1px solid; white-space: nowrap; }
        .emp-login { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 3px 11px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; white-space: nowrap; }
        .emp-login-off { background: #f1f5f9; color: #64748b; border-color: #cbd5e1; }
        .emp-login-none { background: transparent; color: #94a3b8; border-color: transparent; padding-left: 0; font-weight: 500; }
        .emp-trash-btn { border: none; background: transparent; color: #9ca3af; cursor: pointer; padding: 4px; border-radius: 6px; display: grid; place-items: center; transition: color 0.15s ease; }
        .emp-trash-btn:hover { color: #ef4444; background: #fee2e2; }
        
        .emp-grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; padding: 18px 20px; }
        .emp-grid-item { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #fff; }
        
        .emp-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #ffffff; border-top: 1px solid #f1f5f9; }
        .emp-page-btn { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #4b5563; cursor: pointer; transition: all 0.15s ease; }
        .emp-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .emp-page-btn:not(:disabled):hover { background: #f9fafb; border-color: #d1d5db; }
        .emp-page-indicator { display: inline-flex; align-items: center; justify-content: center; background: #16233a; color: #fff; font-size: 12px; font-weight: 700; border-radius: 999px; padding: 4px 12px; height: 26px; }
        @media (max-width: 1023px) {
          .emp-dir-page { margin: -16px -20px -24px; }
        }
        @media (max-width: 767px) {
          .emp-dir-page { margin: -12px -14px -20px; }
        }
        @media (max-width: 640px) {
          .emp-dir-page { padding: 14px 14px 22px; }
          .emp-filter-card { padding: 12px 14px; }
          .emp-grid-view { grid-template-columns: minmax(0, 1fr); padding: 14px; }
          .emp-footer { flex-wrap: wrap; gap: 10px; padding: 12px 14px; }
          .emp-tabs { max-width: 100%; overflow-x: auto; scrollbar-width: none; }
          .emp-tab { flex-shrink: 0; white-space: nowrap; }
        }
      `}</style>
    </div>
  );
}
