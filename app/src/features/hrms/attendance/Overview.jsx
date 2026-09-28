import { useState, useMemo } from "react";
import { Download, ChevronRight, ChevronDown, Search, Calendar as CalendarIcon, MoreHorizontal, X, Check, Clock, Plus, ShieldCheck } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { useAppStore } from "../../../stores/appStore";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import { PageInfoButton } from "../../../components/common/PageInfoButton";
import { hrmsGuides } from "../../../data/hrms/hrmsGuides";
import { pullPunchTimeline, submitPunchCorrection, pullTracked } from "../../../services/hrmsSync";
import { toISODate } from "../../../utils/dateUtils";

const todayISO = () => new Date().toISOString().slice(0, 10);

function minutesOf(value) {
  const m = /(\d{1,2}):(\d{2})/.exec(String(value || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function workedMinutes(r) {
  const a = minutesOf(r.checkIn);
  const b = minutesOf(r.checkOut);
  return a !== null && b !== null && b > a ? b - a : 0;
}

function formatMinutes(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

function formatPunchTime(val) {
  if (!val || val === "—") return "—";
  if (typeof val === "string" && val.includes("T")) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      let hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, "0")}:${mins} ${ampm}`;
    }
  }
  if (typeof val === "string" && /^\d{1,2}:\d{2}$/.test(val)) {
    const [h, m] = val.split(":");
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? "PM" : "AM";
    const hr12 = hr % 12 || 12;
    return `${String(hr12).padStart(2, "0")}:${m} ${ampm}`;
  }
  return String(val);
}

const STATUSES = ["All", "Present", "Late", "Absent", "WFH", "Half Day", "On Leave"];
const SHIFTS = ["All", "General", "Flexible", "Night"];

const statusStyles = {
  Present: { background: "#e6f4ea", color: "#15803d", border: "#a7f3d0" },
  Late: { background: "#fef3c7", color: "#b45309", border: "#fde68a" },
  Absent: { background: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  WFH: { background: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  "Half Day": { background: "#f3e8ff", color: "#7e22ce", border: "#d8b4fe" },
  "On Leave": { background: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
};

export default function AttendanceOverview() {
  const setToast = useAppStore((s) => s.setToast || s.showToast);
  const storeEmployees = useAppStore((s) => s.employees || []);
  const storeRecords = useAttendanceStore((s) => s.records);
  const addAttendanceRequest = useAttendanceStore((s) => s.addRequest);
  const updateStoreRecord = useAttendanceStore((s) => s.updateRecord);

  const [search, setSearch] = useState("");
  const [dateVal, setDateVal] = useState(todayISO);
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [locFilter, setLocFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const [showRegModal, setShowRegModal] = useState(false);
  const [regEmp, setRegEmp] = useState("");
  const [regDate, setRegDate] = useState(todayISO);
  const [regReason, setRegReason] = useState("");
  const [regIn, setRegIn] = useState("09:00");
  const [regOut, setRegOut] = useState("18:00");

  // Punch timeline modal state
  const [selectedTimelineRow, setSelectedTimelineRow] = useState(null);
  const [timelinePunches, setTimelinePunches] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [corrType, setCorrType] = useState("OUT");
  const [corrTime, setCorrTime] = useState("18:00");
  const [corrReason, setCorrReason] = useState("");
  const [submittingCorr, setSubmittingCorr] = useState(false);

  // Normalize attendance records for table display
  const combinedAttendance = useMemo(() => {
    if (storeRecords && storeRecords.length > 0) {
      return storeRecords.map((r) => {
        const empName = r.name || r.employeeName || r.employee || "Employee";
        const empCode = r.employeeCode || r.empId || (r.id && !String(r.id).includes("-") ? r.id : "—");
        const dept = r.dept || r.department || "General";
        const firstPunchVal = r.firstPunch || r.first_punch || r.checkIn;
        const lastPunchVal = r.lastPunch || r.last_punch || (r.status !== "Absent" ? r.checkOut : null);
        const firstPunchDisplay = formatPunchTime(firstPunchVal);
        const lastPunchDisplay = formatPunchTime(lastPunchVal);
        const workingHoursVal =
          r.workingHours !== undefined && r.workingHours !== null
            ? Number(r.workingHours)
            : workedMinutes(r)
            ? workedMinutes(r) / 60
            : 0;
        const workingHoursDisplay =
          r.formattedWorkingHours ||
          (workingHoursVal > 0
            ? `${Math.floor(workingHoursVal)}h ${String(Math.round((workingHoursVal % 1) * 60)).padStart(2, "0")}m`
            : r.workHours || "—");
        const lateMins =
          r.lateMinutes !== undefined && r.lateMinutes !== null ? Number(r.lateMinutes) : 0;
        const overtimeHrs =
          r.overtimeHours !== undefined && r.overtimeHours !== null ? Number(r.overtimeHours) : 0;

        return {
          ...r,
          id: r.id,
          name: empName,
          dept: dept,
          employeeCode: empCode,
          empId: empCode,
          employeeId: r.employeeId || r.empId || r.id,
          firstPunchDisplay,
          lastPunchDisplay,
          workingHoursVal,
          workingHoursDisplay,
          lateMins,
          overtimeHrs,
          img: r.avatar || r.img || `https://i.pravatar.cc/100?u=${r.employeeId || r.name}`,
          workHours: workingHoursDisplay,
          shift: r.shift || "General",
          location: r.location || (r.status === "WFH" ? "Remote" : "On-Site"),
          role: r.role || r.jobType || "Full-Time",
        };
      });
    }
    return [];
  }, [storeRecords]);

  const DEPARTMENTS = useMemo(
    () => ["All", ...new Set(combinedAttendance.map((r) => r.dept).filter(Boolean))],
    [combinedAttendance]
  );

  const regEmployees = useMemo(() => {
    if (storeEmployees.length > 0) {
      return storeEmployees.map((e) => ({ id: e.empId || e.id, name: e.name }));
    }
    return combinedAttendance.map((r) => ({ id: r.empId || r.id, name: r.name }));
  }, [storeEmployees, combinedAttendance]);

  const filtered = useMemo(() => {
    return combinedAttendance.filter((item) => {
      const itemIso = toISODate(item.rawDate || item.date);
      const matchDate = !dateVal || itemIso === dateVal || item.date === dateVal;
      const matchSearch =
        String(item.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        String(item.employeeCode ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (item.id && String(item.id ?? "").toLowerCase().includes(search.toLowerCase()));
      const matchDept = deptFilter === "All" || item.dept === deptFilter;
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      const matchShift = shiftFilter === "All" || item.shift === shiftFilter;
      const matchLoc = locFilter === "All" || item.location === locFilter;
      const matchRole = roleFilter === "All" || item.role === roleFilter;
      return matchDate && matchSearch && matchDept && matchStatus && matchShift && matchLoc && matchRole;
    });
  }, [combinedAttendance, search, dateVal, deptFilter, statusFilter, shiftFilter, locFilter, roleFilter]);

  // Dynamic live STATS
  const statsData = useMemo(() => {
    const total = combinedAttendance.length || 1;
    const presentCount = combinedAttendance.filter((r) => r.status === "Present").length;
    const absentCount = combinedAttendance.filter((r) => r.status === "Absent").length;
    const lateCount = combinedAttendance.filter(
      (r) => r.status === "Late" || (r.lateMins && r.lateMins > 0)
    ).length;
    const leaveCount = combinedAttendance.filter((r) => r.status === "On Leave").length;
    const wfhCount = combinedAttendance.filter((r) => r.status === "WFH").length;
    const percent = Math.round((presentCount / total) * 100);
    const overtimeTotalHours = combinedAttendance.reduce(
      (sum, r) => sum + (r.overtimeHrs || 0),
      0
    );

    return [
      { label: "PRESENT", val: String(presentCount), sub: `${percent}% of staff`, dotColor: "#22c55e" },
      { label: "ABSENT", val: String(absentCount), sub: "Needs review", dotColor: "#ef4444" },
      { label: "LATE", val: String(lateCount), sub: "Grace 10 min", dotColor: "#f59e0b" },
      { label: "ON LEAVE", val: String(leaveCount), sub: "Approved leave", dotColor: "#3b82f6" },
      { label: "WFH", val: String(wfhCount), sub: "Remote active", dotColor: null },
      {
        label: "OVERTIME",
        val: `${Math.round(overtimeTotalHours * 10) / 10}h`,
        sub: "Today",
        dotColor: "#22c55e",
      },
    ];
  }, [combinedAttendance]);

  const handleClearFilters = () => {
    setSearch("");
    setDateVal(todayISO());
    setDeptFilter("All");
    setStatusFilter("All");
    setShiftFilter("All");
    setLocFilter("All");
    setRoleFilter("All");
  };

  const handleExport = () => {
    const header = "Employee ID,Name,Department,Check In,Check Out,Work Hours,Shift,Status";
    const rows = filtered.map(
      (r) => `"${r.id}","${r.name}","${r.dept}","${r.checkIn}","${r.checkOut}","${r.workHours}","${r.shift}","${r.status}"`
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${dateVal}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRegularizeSubmit = () => {
    if (!regEmp) return setToast("Please select an employee.", "error");
    if (!regReason.trim()) return setToast("Please provide a reason for regularization.", "error");
    addAttendanceRequest({
      employee: regEmp,
      type: "Regularization",
      date: regDate,
      requestedIn: regIn,
      requestedOut: regOut,
      reason: regReason,
      requestedBy: regEmp,
    });
    setToast(`Attendance regularization request for ${regEmp} submitted successfully.`);
    setShowRegModal(false);
    setRegReason("");
  };

  const handleQuickStatus = (row) => {
    const cycle = ["Present", "Late", "Half Day", "WFH", "On Leave", "Absent"];
    const currIdx = cycle.indexOf(row.status);
    const nextStatus = cycle[(currIdx + 1) % cycle.length];
    updateStoreRecord(row.id, {
      status: nextStatus,
      checkIn: nextStatus === "Absent" || nextStatus === "On Leave" ? "—" : row.checkIn === "—" ? "09:00" : row.checkIn,
      checkOut: nextStatus === "Absent" || nextStatus === "On Leave" ? "—" : row.checkOut === "—" ? "18:00" : row.checkOut,
    });
    setToast(`${row.name}'s status updated to ${nextStatus}.`);
  };

  const handleOpenTimeline = async (row) => {
    setSelectedTimelineRow(row);
    setShowCorrectionForm(false);
    setCorrReason("");
    setLoadingTimeline(true);
    try {
      const targetEmp = row.employeeId || row.empId || row.id;
      const targetDate = toISODate(row.rawDate || row.date) || dateVal;
      const data = await pullPunchTimeline(targetEmp, targetDate);
      const list = Array.isArray(data) ? data : data?.results || data?.data || [];
      setTimelinePunches(list);
    } catch {
      setTimelinePunches(row.punches || []);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleSubmitCorrection = async () => {
    if (!corrTime) return setToast("Please select punch time.", "error");
    if (!corrReason.trim()) return setToast("Please provide a reason for punch correction.", "error");
    setSubmittingCorr(true);
    try {
      const targetEmp = selectedTimelineRow.employeeId || selectedTimelineRow.empId || selectedTimelineRow.id;
      const targetDate = toISODate(selectedTimelineRow.rawDate || selectedTimelineRow.date) || dateVal;
      await submitPunchCorrection({
        employeeId: targetEmp,
        date: targetDate,
        punchType: corrType,
        punchTime: corrTime,
        reason: corrReason,
      });
      setToast(`Punch correction recorded successfully.`);
      setShowCorrectionForm(false);
      setCorrReason("");
      // Refresh timeline
      const freshData = await pullPunchTimeline(targetEmp, targetDate);
      const list = Array.isArray(freshData) ? freshData : freshData?.results || freshData?.data || [];
      setTimelinePunches(list);
      // Refresh attendance records
      await useAttendanceStore.getState().refreshAttendance();
    } catch (err) {
      setToast(err?.message || "Failed to submit punch correction.", "error");
    } finally {
      setSubmittingCorr(false);
    }
  };

  return (
    <div className="att-mgmt-page">
      {/* Breadcrumb */}
      <nav className="att-crumb">
        <span style={{ cursor: "pointer" }}>Home</span>
        <ChevronRight size={13} style={{ color: "#9aa7bd" }} />
        <span style={{ color: "#111f36", fontWeight: 600 }}>Attendance / Overview</span>
      </nav>

      {/* Header Row */}
      <div className="att-title-row">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="att-title">Attendance Management</h1>
            <PageInfoButton guide={hrmsGuides.attendanceOverview} />
          </div>
          <p className="att-sub">Daily tracking, attendance status, regularization, shifts and overtime.</p>
        </div>
        <div className="flex-wrap lg:flex-nowrap" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={handleExport} className="att-export-btn">
            <Download size={15} /> Export
          </button>
          <button type="button" onClick={() => setShowRegModal(true)} className="att-reg-btn">
            Regularize Attendance
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="att-stats-grid">
        {statsData.map((s) => (
          <div key={s.label} className="att-stat-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="att-stat-label">{s.label}</span>
              {s.dotColor && (
                <span className="att-stat-dot" style={{ backgroundColor: s.dotColor }} />
              )}
            </div>
            <div className="att-stat-val">{s.val}</div>
            <div className="att-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar Card */}
      <div className="att-card att-filter-card">
        <div className="att-filter-left">
          {/* Search Box */}
          <div className="att-search-wrap">
            <Search size={15} style={{ color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="att-search-input"
            />
          </div>

          {/* Date Picker */}
          <div className="att-date-wrap">
            <span>{dateVal}</span>
            <CalendarIcon size={14} style={{ color: "#64748b" }} />
            <input
              type="date"
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              className="att-date-native"
            />
          </div>

          {/* Dropdown Filters */}
          <div className={`att-filter-dropdown ${deptFilter !== "All" ? "active" : ""}`}>
            <span className="att-filter-text">
              {deptFilter === "All" ? "Department" : deptFilter}
            </span>
            <ChevronDown size={13} className="att-filter-arrow" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="att-filter-native-select"
              aria-label="Department Filter"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className={`att-filter-dropdown ${statusFilter !== "All" ? "active" : ""}`}>
            <span className="att-filter-text">
              {statusFilter === "All" ? "Status" : statusFilter}
            </span>
            <ChevronDown size={13} className="att-filter-arrow" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="att-filter-native-select"
              aria-label="Status Filter"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className={`att-filter-dropdown ${shiftFilter !== "All" ? "active" : ""}`}>
            <span className="att-filter-text">
              {shiftFilter === "All" ? "Shift" : shiftFilter}
            </span>
            <ChevronDown size={13} className="att-filter-arrow" />
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="att-filter-native-select"
              aria-label="Shift Filter"
            >
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className={`att-filter-dropdown ${locFilter !== "All" ? "active" : ""}`}>
            <span className="att-filter-text">
              {locFilter === "All" ? "Location" : locFilter}
            </span>
            <ChevronDown size={13} className="att-filter-arrow" />
            <select
              value={locFilter}
              onChange={(e) => setLocFilter(e.target.value)}
              className="att-filter-native-select"
              aria-label="Location Filter"
            >
              <option value="All">All</option>
              <option value="On-Site">On-Site</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div className={`att-filter-dropdown ${roleFilter !== "All" ? "active" : ""}`}>
            <span className="att-filter-text">
              {roleFilter === "All" ? "Job Type" : roleFilter}
            </span>
            <ChevronDown size={13} className="att-filter-arrow" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="att-filter-native-select"
              aria-label="Job Type Filter"
            >
              <option value="All">All</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
        </div>

        <div className="att-filter-right">
          <button type="button" onClick={handleClearFilters} className="att-btn-outline">
            Clear Filters
          </button>
          <button type="button" onClick={handleExport} className="att-btn-outline">
            Export
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="att-card att-main-card">
        <div style={{ overflowX: "auto" }}>
          <table className="att-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DATE</th>
                <th>FIRST PUNCH</th>
                <th>LAST PUNCH</th>
                <th>WORKING HOURS</th>
                <th>LATE</th>
                <th>OVERTIME</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={row.img} alt={row.name} className="att-avatar" loading="lazy" />
                      <div>
                        <span style={{ fontWeight: 600, color: "#111827", display: "block", whiteSpace: "nowrap" }}>
                          {row.name}
                        </span>
                        <span style={{ fontSize: 11.5, color: "#6b7280" }}>
                          {row.employeeCode || row.empId || (row.id && !String(row.id).includes("-") ? row.id : "—")} • {row.dept || "General"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="att-date-col">{row.date || dateVal}</td>
                  <td className="att-time">{row.firstPunchDisplay}</td>
                  <td className="att-time">{row.lastPunchDisplay}</td>
                  <td
                    className="att-time"
                    style={{ fontWeight: 600, color: row.workingHoursVal > 0 ? "#111827" : "#64748b" }}
                  >
                    {row.workingHoursDisplay}
                  </td>
                  <td>
                    {row.lateMins > 0 ? (
                      <span className="att-late-pill">{row.lateMins} min late</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td>
                    {row.overtimeHrs > 0 ? (
                      <span className="att-ot-pill">+{row.overtimeHrs}h</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className="att-status" style={{ ...statusStyles[row.status] }}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        className="att-action-btn"
                        onClick={() => handleOpenTimeline(row)}
                        title="View Punch Timeline"
                      >
                        <Clock size={15} />
                      </button>
                      <button
                        type="button"
                        className="att-dots-btn"
                        onClick={() => handleQuickStatus(row)}
                        title="Toggle / update attendance status"
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>
                    No attendance records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regularize Attendance Modal */}
      <Modal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        title="Regularize Attendance"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setShowRegModal(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleRegularizeSubmit}>
              Submit Regularization
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Select Employee</label>
            <select
              className="form-select"
              value={regEmp}
              onChange={(e) => setRegEmp(e.target.value)}
            >
              <option value="">Select employee</option>
              {regEmployees.map((e) => (
                <option key={e.id} value={e.name}>
                  {e.name} ({e.id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={regDate}
              onChange={(e) => setRegDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Check In Time</label>
              <input
                type="time"
                className="form-input"
                value={regIn}
                onChange={(e) => setRegIn(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Check Out Time</label>
              <input
                type="time"
                className="form-input"
                value={regOut}
                onChange={(e) => setRegOut(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason / Context</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Explain miss check-in or correction reason..."
              value={regReason}
              onChange={(e) => setRegReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Punch Timeline & Audit Modal */}
      <Modal
        isOpen={Boolean(selectedTimelineRow)}
        onClose={() => setSelectedTimelineRow(null)}
        title={`Punch Timeline — ${selectedTimelineRow?.name || "Employee"}`}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowCorrectionForm(!showCorrectionForm)}
            >
              {showCorrectionForm ? "Hide Correction" : "+ Add Punch Correction"}
            </button>
            <button type="button" className="btn-primary" onClick={() => setSelectedTimelineRow(null)}>
              Close
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 16 }}>
          {/* Employee & Date Summary Banner */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                  {selectedTimelineRow?.name}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  ID: {selectedTimelineRow?.id} • Date: {selectedTimelineRow?.date || dateVal}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="att-status" style={{ ...statusStyles[selectedTimelineRow?.status] }}>
                  {selectedTimelineRow?.status}
                </span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 12, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>First Punch</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedTimelineRow?.firstPunchDisplay || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Last Punch</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedTimelineRow?.lastPunchDisplay || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Working Time</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0284c7", marginTop: 2 }}>{selectedTimelineRow?.workingHoursDisplay || "00h 00m"}</div>
              </div>
            </div>
          </div>

          {/* Timeline list */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={15} style={{ color: "#64748b" }} /> Recorded Punches
            </div>

            {loadingTimeline ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                Loading punch timeline...
              </div>
            ) : timelinePunches.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: 13, background: "#f8fafc", borderRadius: 10 }}>
                No punches recorded for this date.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {timelinePunches.map((punch, idx) => {
                  const isPunchIn = punch.punchType === "IN";
                  return (
                    <div
                      key={punch.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: isPunchIn ? "#e6f4ea" : "#e0f2fe",
                            color: isPunchIn ? "#166534" : "#0369a1",
                          }}
                        >
                          {punch.punchType}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                            {punch.timeDisplay || formatPunchTime(punch.punchTime)}
                          </div>
                          {punch.remark && (
                            <div style={{ fontSize: 11.5, color: "#64748b" }}>
                              {punch.remark}
                            </div>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>
                        {punch.source || "web"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Audit Correction Form (Collapsible) */}
          {showCorrectionForm && (
            <div style={{ background: "#fdf8f6", border: "1px solid #fed7aa", borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#9a3412", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={16} /> Manual Punch Correction (Audit Trail)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12 }}>Punch Type</label>
                  <select
                    className="form-select"
                    value={corrType}
                    onChange={(e) => setCorrType(e.target.value)}
                  >
                    <option value="IN">IN (Punch In)</option>
                    <option value="OUT">OUT (Punch Out)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 12 }}>Punch Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={corrTime}
                    onChange={(e) => setCorrTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Reason / Context</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Forgot punch out before leaving"
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowCorrectionForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmitCorrection}
                  disabled={submittingCorr}
                >
                  {submittingCorr ? "Saving..." : "Save Correction"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <style>{`
        .att-mgmt-page { background: #f8fafc; margin: -24px -28px -40px; padding: 18px 26px 28px; min-height: calc(100vh - 62px); }
        .att-crumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7a90; margin-bottom: 10px; }
        .att-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
        .att-title { margin: 0; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.01em; }
        .att-sub { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
        .att-export-btn { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #d1d5db; border-radius: 10px; padding: 8px 16px; font-size: 13.5px; font-weight: 600; color: #374151; cursor: pointer; transition: background 0.15s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .att-export-btn:hover { background: #f9fafb; }
        .att-reg-btn { background: #16233a; color: #fff; border: none; border-radius: 10px; padding: 9px 18px; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: background 0.15s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .att-reg-btn:hover { background: #0f172a; }

        .att-stats-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
        .att-stat-card { background: #fff; border: 1px solid #e8edf3; border-radius: 14px; padding: 14px 16px; box-shadow: 0 1px 2px rgba(16,24,40,0.03); }
        .att-stat-label { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #6b7280; text-transform: uppercase; }
        .att-stat-dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; }
        .att-stat-val { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.02em; margin-top: 6px; line-height: 1.1; }
        .att-stat-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }

        .att-card { background: #fff; border: 1px solid #e8edf3; border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,0.03); }
        .att-filter-card { border: none; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
        .att-filter-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .att-filter-right { display: flex; align-items: center; gap: 8px; }

        .att-search-wrap { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 7px 12px; min-width: 180px; }
        .att-search-input { border: none; background: transparent; font-size: 13px; color: #1e293b; outline: none; width: 100%; }
        
        .att-date-wrap { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 7px 14px; font-size: 13px; color: #374151; min-width: 110px; cursor: pointer; }
        .att-date-native { position: absolute; right: 0; top: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

        .att-select { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 7px 32px 7px 14px; font-size: 13px; color: #374151; font-weight: 500; outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230f172a' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 12px; min-width: 80px; }
        .att-select:focus { border-color: #94a3b8; background-color: #fff; }
        .att-select-active { border-color: #3b82f6 !important; background-color: #eff6ff !important; color: #1d4ed8 !important; font-weight: 600 !important; }

        .att-filter-dropdown { position: relative; display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 12px; height: 35px; cursor: pointer; transition: all 0.15s ease; box-sizing: border-box; }
        .att-filter-dropdown:hover { border-color: #cbd5e1; background: #f1f5f9; }
        .att-filter-dropdown.active { border-color: #3b82f6; background: #eff6ff; }
        .att-filter-text { font-size: 13px; color: #374151; font-weight: 500; white-space: nowrap; user-select: none; }
        .att-filter-dropdown.active .att-filter-text { color: #1d4ed8; font-weight: 600; }
        .att-filter-arrow { color: #64748b; flex-shrink: 0; pointer-events: none; }
        .att-filter-dropdown.active .att-filter-arrow { color: #2563eb; }
        .att-filter-native-select { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

        .att-btn-outline { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 7px 14px; font-size: 13px; font-weight: 500; color: #475569; cursor: pointer; transition: all 0.15s ease; }
        .att-btn-outline:hover { background: #f8fafc; color: #111827; }

        .att-main-card { overflow: hidden; }
        .att-table { width: 100%; border-collapse: collapse; min-width: 800px; font-size: 13.5px; }
        .att-table thead tr { background: #ffffff; border-bottom: 1px solid #e2e8f0; }
        .att-table th { text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #7b8aa0; padding: 14px 20px; white-space: nowrap; }
        .att-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.12s ease; }
        .att-table tbody tr:hover { background: #f8fafc; }
        .att-table td { padding: 14px 20px; vertical-align: middle; }

        .att-avatar { width: 32px; height: 32px; border-radius: 999px; object-fit: cover; }
        .att-id { font-family: inherit; font-size: 12.5px; color: #6b7280; white-space: nowrap; }
        .att-time { font-family: inherit; font-size: 13px; font-weight: 500; color: #334155; white-space: nowrap; }
        .att-date-col { font-size: 12.5px; color: #4b5563; font-weight: 500; white-space: nowrap; }
        .att-shift-pill { display: inline-block; font-size: 12px; font-weight: 500; color: #374151; background: #f3f4f6; border-radius: 999px; padding: 3px 12px; white-space: nowrap; }
        .att-status { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 4px 13px; border: 1px solid; white-space: nowrap; }
        .att-late-pill { display: inline-block; font-size: 11.5px; font-weight: 600; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; border-radius: 999px; padding: 2px 9px; white-space: nowrap; }
        .att-ot-pill { display: inline-block; font-size: 11.5px; font-weight: 600; color: #047857; background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 999px; padding: 2px 9px; white-space: nowrap; }
        .att-action-btn { border: 1px solid #e2e8f0; background: #fff; color: #475569; cursor: pointer; padding: 5px 7px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s ease; }
        .att-action-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        .att-dots-btn { border: none; background: transparent; color: #6b7280; cursor: pointer; padding: 4px; border-radius: 6px; display: grid; place-items: center; }
        .att-dots-btn:hover { color: #111827; background: #f1f5f9; }

        @media (max-width: 1200px) {
          .att-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 1023px) {
          .att-mgmt-page { margin: -16px -20px -24px; }
        }
        @media (max-width: 767px) {
          .att-mgmt-page { margin: -12px -14px -20px; }
        }
        @media (max-width: 640px) {
          .att-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .att-mgmt-page { padding: 14px 14px 22px; }
          .att-filter-card { padding: 12px 14px; }
          .att-filter-left { width: 100%; }
          .att-search-wrap { flex: 1 1 100%; min-width: 0; }
          .att-filter-right { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
