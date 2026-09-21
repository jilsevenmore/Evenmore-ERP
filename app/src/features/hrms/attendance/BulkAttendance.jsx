import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  X,
  RotateCcw,
  CheckCircle2,
  Users,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import Pagination from "../../../components/ui/Pagination";
import { PageInfoButton } from "../../../components/common/PageInfoButton";
import { hrmsGuides } from "../../../data/hrms/hrmsGuides";

const INITIAL_EMPLOYEES = [
  { id: "EMP1024", name: "Priya Patel", dept: "Engineering", status: "Present", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: "EMP1025", name: "Marcus Chen", dept: "Design", status: "Late", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: "EMP1026", name: "Liam Cooper", dept: "Engineering", status: "Absent", avatar: "https://randomuser.me/api/portraits/men/75.jpg" },
  { id: "EMP1027", name: "Sarah Wilson", dept: "Marketing", status: "WFH", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
  { id: "EMP1028", name: "James Wilson", dept: "Finance", status: "Half Day", avatar: "https://randomuser.me/api/portraits/men/54.jpg" },
  { id: "EMP1029", name: "Ayesha Khan", dept: "HR", status: "On Leave", avatar: "https://randomuser.me/api/portraits/women/24.jpg" },
  { id: "EMP1030", name: "David Park", dept: "Engineering", status: "Present", avatar: "https://randomuser.me/api/portraits/men/46.jpg" },
  { id: "EMP1031", name: "Chen Li", dept: "Operations", status: "Late", avatar: "https://randomuser.me/api/portraits/women/33.jpg" },
  { id: "EMP1032", name: "Rahul Verma", dept: "Design", status: "Present", avatar: "https://randomuser.me/api/portraits/men/62.jpg" },
  { id: "EMP1033", name: "Ana Silva", dept: "Marketing", status: "WFH", avatar: "https://randomuser.me/api/portraits/women/32.jpg" },
  { id: "EMP1034", name: "Tariq Al-Mansoor", dept: "HR", status: "Present", avatar: "https://randomuser.me/api/portraits/men/17.jpg" },
  { id: "EMP1035", name: "Sofia Reyes", dept: "Finance", status: "On Leave", avatar: "https://randomuser.me/api/portraits/women/26.jpg" },
];

const DEPARTMENTS = ["All", "Engineering", "Design", "Marketing", "Finance", "HR", "Operations"];

const STATUS_OPTIONS = [
  { label: "Present", color: "#15803d", bg: "#e6f4ea", border: "#a7f3d0" },
  { label: "Absent", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  { label: "Late", color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  { label: "Half Day", color: "#7e22ce", bg: "#f3e8ff", border: "#d8b4fe" },
  { label: "WFH", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
  { label: "On Leave", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
];

const statusStyles = {
  Present: { background: "#e6f4ea", color: "#15803d", borderColor: "#a7f3d0" },
  Late: { background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" },
  Absent: { background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" },
  WFH: { background: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" },
  "Half Day": { background: "#f3e8ff", color: "#7e22ce", borderColor: "#d8b4fe" },
  "On Leave": { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" },
};

function formatDateDisplay(iso) {
  if (!iso) return "";
  try {
    const [y, m, d] = iso.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${d} ${monthName} ${y}`;
  } catch {
    return iso;
  }
}

export default function BulkAttendance() {
  const setToast = useAppStore((s) => s.setToast || s.showToast);
  const storeRecords = useAttendanceStore((s) => s.records);
  const bulkUpdateStore = useAttendanceStore((s) => s.bulkUpdate);
  const updateRecordStore = useAttendanceStore((s) => s.updateRecord);

  const [date, setDate] = useState("2024-10-11");
  const [dept, setDept] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [localBanner, setLocalBanner] = useState(null);
  const dateInputRef = useRef(null);

  const [employees, setEmployees] = useState(() => {
    if (storeRecords && storeRecords.length > 0) {
      return storeRecords.map((r) => ({
        id: r.id,
        name: r.name,
        dept: r.dept || "General",
        status: r.status || "Present",
        avatar: r.avatar || r.img || `https://i.pravatar.cc/100?u=${r.id || r.name}`,
      }));
    }
    return INITIAL_EMPLOYEES;
  });

  useEffect(() => {
    if (storeRecords && storeRecords.length > 0) {
      setEmployees(
        storeRecords.map((r) => ({
          id: r.id,
          name: r.name,
          dept: r.dept || "General",
          status: r.status || "Present",
          avatar: r.avatar || r.img || `https://i.pravatar.cc/100?u=${r.id || r.name}`,
        }))
      );
    }
  }, [storeRecords]);

  // Live status summary counts
  const statusCounts = useMemo(() => {
    const counts = { All: employees.length, Present: 0, Late: 0, Absent: 0, "Half Day": 0, WFH: 0, "On Leave": 0 };
    employees.forEach((e) => {
      if (counts[e.status] !== undefined) {
        counts[e.status] += 1;
      }
    });
    return counts;
  }, [employees]);

  // Working filters: Department, Status, Search
  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (dept !== "All" && e.dept !== dept) return false;
      if (statusFilter !== "All" && e.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = e.name?.toLowerCase().includes(q);
        const matchId = e.id?.toLowerCase().includes(q);
        const matchDept = e.dept?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDept) return false;
      }
      return true;
    });
  }, [employees, dept, statusFilter, searchQuery]);

  const BULK_PAGE_SIZE = 8;
  const [bulkPage, setBulkPage] = useState(1);

  useEffect(() => {
    setBulkPage(1);
  }, [dept, statusFilter, searchQuery]);

  const bulkTotalPages = Math.max(1, Math.ceil(filtered.length / BULK_PAGE_SIZE));
  useEffect(() => {
    if (bulkPage > bulkTotalPages) setBulkPage(bulkTotalPages);
  }, [bulkPage, bulkTotalPages]);

  const paginatedEmployees = useMemo(() => {
    const start = (bulkPage - 1) * BULK_PAGE_SIZE;
    return filtered.slice(start, start + BULK_PAGE_SIZE);
  }, [filtered, bulkPage]);

  function notify(msg) {
    if (setToast) setToast(msg);
    setLocalBanner(msg);
    setTimeout(() => {
      setLocalBanner((curr) => (curr === msg ? null : curr));
    }, 4000);
  }

  // Date Navigation Handlers
  function handleDateChange(newDateVal) {
    if (!newDateVal) return;
    setDate(newDateVal);
    notify(`Selected Date: ${formatDateDisplay(newDateVal)}`);
  }

  function handlePrevDay() {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    const iso = d.toISOString().split("T")[0];
    setDate(iso);
    notify(`Selected Date: ${formatDateDisplay(iso)}`);
  }

  function handleNextDay() {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    const iso = d.toISOString().split("T")[0];
    setDate(iso);
    notify(`Selected Date: ${formatDateDisplay(iso)}`);
  }

  function handleToday() {
    const iso = new Date().toISOString().split("T")[0];
    setDate(iso);
    notify(`Selected Date: Today (${formatDateDisplay(iso)})`);
  }

  // Bulk Apply to all filtered records
  function handleBulkApplyAll(newStatus) {
    if (filtered.length === 0) {
      notify("No employees match the current filters to update.");
      return;
    }
    const idsArray = filtered.map((e) => e.id);
    setEmployees((prev) =>
      prev.map((e) => (idsArray.includes(e.id) ? { ...e, status: newStatus } : e))
    );
    bulkUpdateStore(idsArray, newStatus);
    notify(`Updated all ${idsArray.length} employee(s) to "${newStatus}" for ${formatDateDisplay(date)}.`);
  }

  // Individual row status change
  function handleSingleStatusChange(id, newStatus) {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
    );
    if (updateRecordStore) {
      updateRecordStore(id, { status: newStatus });
    } else {
      bulkUpdateStore([id], newStatus);
    }
    const emp = employees.find((e) => e.id === id);
    notify(`Updated ${emp?.name || id} to "${newStatus}".`);
  }

  const isFiltered = dept !== "All" || statusFilter !== "All" || searchQuery.trim() !== "";

  return (
    <div className="bulk-att-page">
      {/* Breadcrumb */}
      <nav className="bulk-crumb">
        <span style={{ cursor: "pointer" }}>Home</span>
        <ChevronRight size={13} style={{ color: "#9aa7bd" }} />
        <span style={{ color: "#111f36", fontWeight: 600 }}>Attendance / Bulk Attendance</span>
      </nav>

      {/* Header Row */}
      <div className="bulk-title-row">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="bulk-title">Bulk Attendance</h1>
            <PageInfoButton guide={hrmsGuides.attendanceBulk} />
          </div>
          <p className="bulk-sub">Quickly update and verify attendance for multiple employees simultaneously.</p>
        </div>

        {/* Global Summary Stats Chips (One-click quick filters) */}
        <div className="bulk-stat-chips-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter("All")}
            className={`bulk-stat-chip ${statusFilter === "All" ? "active" : ""}`}
            title="Show all employees"
          >
            <span>All</span>
            <span className="bulk-stat-count">{statusCounts.All}</span>
          </button>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st.label}
              type="button"
              onClick={() => setStatusFilter(statusFilter === st.label ? "All" : st.label)}
              className={`bulk-stat-chip ${statusFilter === st.label ? "active" : ""}`}
              style={{
                borderColor: statusFilter === st.label ? st.color : undefined,
                color: statusFilter === st.label ? st.color : undefined,
                background: statusFilter === st.label ? st.bg : undefined,
              }}
              title={`Filter by ${st.label}`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
              <span>{st.label}</span>
              <span className="bulk-stat-count" style={{ color: st.color }}>
                {statusCounts[st.label] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Local Notification Banner */}
      {localBanner && (
        <div className="bulk-banner animate-in fade-in slide-in-from-top-1 duration-150">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-emerald-900">{localBanner}</span>
          <button
            type="button"
            onClick={() => setLocalBanner(null)}
            className="ml-auto text-emerald-700 hover:text-emerald-950"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Single Unified Filter Bar */}
      <div className="bulk-card bulk-unified-filter-card">
        <div className="bulk-filter-flex">
          {/* Fully Functional Working Date Picker */}
          <div className="bulk-filter-item">
            <label className="bulk-field-label">Date</label>
            <div className="flex items-center gap-1.5">
              <div
                className="bulk-date-container"
                onClick={() => {
                  try {
                    dateInputRef.current?.showPicker?.();
                  } catch {}
                  dateInputRef.current?.focus();
                }}
                title="Click to open calendar"
              >
                <CalendarIcon size={15} className="text-slate-500 shrink-0" />
                <input
                  ref={dateInputRef}
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bulk-date-field"
                  aria-label="Attendance Date"
                />
              </div>

              {/* Quick Date Shift Buttons */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="px-2 py-1 text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-white rounded-lg transition"
                  title="Previous Day"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-950 hover:bg-white rounded-lg transition"
                  title="Jump to Today"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleNextDay}
                  className="px-2 py-1 text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-white rounded-lg transition"
                  title="Next Day"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="bulk-filter-item flex-1 min-w-[220px]">
            <label className="bulk-field-label">Search Employee</label>
            <div className="bulk-search-box">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, EMP ID, or department..."
                className="bulk-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Department Filter */}
          <div className="bulk-filter-item">
            <label className="bulk-field-label">Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="bulk-select"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.filter((d) => d !== "All").map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="bulk-filter-item">
            <label className="bulk-field-label">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bulk-select"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st.label} value={st.label}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {isFiltered && (
            <div className="bulk-filter-item self-end">
              <button
                type="button"
                onClick={() => {
                  setDept("All");
                  setStatusFilter("All");
                  setSearchQuery("");
                }}
                className="bulk-btn-reset"
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bulk-card bulk-main-card">
        {/* Bulk Action Bar (Without Checkboxes) */}
        <div className="bulk-action-bar">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-700">
              Bulk Update:
            </span>
            <span className="text-xs text-slate-500">
              Set status for all <strong>{filtered.length}</strong> filtered employee(s):
            </span>
          </div>

          {/* Direct Bulk Status Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st.label}
                type="button"
                onClick={() => handleBulkApplyAll(st.label)}
                className="bulk-status-btn"
                style={{
                  "--btn-bg": st.bg,
                  "--btn-color": st.color,
                  "--btn-border": st.border,
                }}
                title={`Mark all ${filtered.length} employees as ${st.label}`}
              >
                Mark All {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employee List Table (No Checkboxes) */}
        <div style={{ overflowX: "auto" }}>
          <table className="bulk-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 22 }}>EMPLOYEE</th>
                <th>EMPLOYEE ID</th>
                <th>DEPARTMENT</th>
                <th>CURRENT STATUS</th>
                <th style={{ textAlign: "right", paddingRight: 24 }}>UPDATE STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map((e) => (
                <tr key={e.id} className="bulk-row">
                  <td style={{ paddingLeft: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={e.avatar} alt={e.name} className="bulk-avatar" loading="lazy" />
                      <span style={{ fontWeight: 600, color: "#111827", display: "block" }}>
                        {e.name}
                      </span>
                    </div>
                  </td>
                  <td className="bulk-id">{e.id}</td>
                  <td style={{ color: "#374151", fontWeight: 500 }}>{e.dept}</td>
                  <td>
                    <span className="bulk-status-badge" style={{ ...statusStyles[e.status] }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", paddingRight: 24 }}>
                    <select
                      value={e.status}
                      onChange={(ev) => handleSingleStatusChange(e.id, ev.target.value)}
                      className="bulk-row-select"
                      title={`Change status for ${e.name}`}
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st.label} value={st.label}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "48px 20px" }}>
                    <p className="text-sm font-semibold text-slate-700 mb-1">No employees match your filters</p>
                    <p className="text-xs text-slate-500 mb-3">
                      Try clearing the search query or changing the department and status filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDept("All");
                        setStatusFilter("All");
                        setSearchQuery("");
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div className="bulk-footer">
            <span className="text-xs text-slate-500">
              Showing{" "}
              <strong>
                {Math.min((bulkPage - 1) * BULK_PAGE_SIZE + 1, filtered.length)}–
                {Math.min(bulkPage * BULK_PAGE_SIZE, filtered.length)}
              </strong>{" "}
              of <strong>{filtered.length}</strong> employee records
            </span>
            <Pagination
              total={filtered.length}
              page={bulkPage}
              pageSize={BULK_PAGE_SIZE}
              onChange={setBulkPage}
            />
          </div>
        )}
      </div>

      <style>{`
        .bulk-att-page {
          background: #f8fafc;
          margin: -24px -28px -40px;
          padding: 20px 28px 36px;
          min-height: calc(100vh - 62px);
        }
        .bulk-crumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 10px;
        }
        .bulk-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .bulk-title {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .bulk-sub {
          margin: 4px 0 0;
          font-size: 13px;
          color: #64748b;
        }

        /* Stat Quick Filter Chips */
        .bulk-stat-chips-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .bulk-stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .bulk-stat-chip:hover {
          border-color: #94a3b8;
          color: #0f172a;
          transform: translateY(-1px);
        }
        .bulk-stat-chip.active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }
        .bulk-stat-chip.active .bulk-stat-count {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }
        .bulk-stat-count {
          background: #f1f5f9;
          color: #475569;
          padding: 1px 6px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }

        /* Notification Banner */
        .bulk-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 12px;
          padding: 10px 16px;
          margin-bottom: 14px;
        }

        /* Cards */
        .bulk-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        /* Unified Filter Card */
        .bulk-unified-filter-card {
          padding: 14px 18px;
          margin-bottom: 14px;
        }
        .bulk-filter-flex {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }
        .bulk-filter-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bulk-field-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Date Container & Input */
        .bulk-date-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 5.5px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .bulk-date-container:hover,
        .bulk-date-container:focus-within {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .bulk-date-field {
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          outline: none;
          cursor: pointer;
        }

        /* Search Box */
        .bulk-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 6.5px 12px;
          transition: border-color 0.15s ease;
        }
        .bulk-search-box:focus-within {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .bulk-search-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13px;
          color: #0f172a;
        }
        .bulk-search-input::placeholder {
          color: #94a3b8;
        }

        /* Dropdowns */
        .bulk-select {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 6.5px 32px 6.5px 12px;
          font-size: 13px;
          color: #1e293b;
          font-weight: 500;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 14px;
          min-width: 150px;
        }
        .bulk-select:focus {
          border-color: #3b82f6;
          background-color: #ffffff;
        }

        .bulk-btn-reset {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 6.5px 14px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .bulk-btn-reset:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* Main Card & Table */
        .bulk-main-card {
          overflow: hidden;
        }

        /* Bulk Action Strip */
        .bulk-action-bar {
          padding: 12px 22px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        /* Status Action Buttons */
        .bulk-status-btn {
          background: var(--btn-bg, #f1f5f9);
          color: var(--btn-color, #1e293b);
          border: 1px solid var(--btn-border, #cbd5e1);
          border-radius: 8px;
          padding: 5.5px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .bulk-status-btn:hover {
          transform: translateY(-1px);
          filter: brightness(0.95);
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        }

        /* Table */
        .bulk-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
          font-size: 13.5px;
        }
        .bulk-table thead tr {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }
        .bulk-table th {
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #64748b;
          padding: 14px 18px;
          white-space: nowrap;
        }
        .bulk-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.12s ease;
        }
        .bulk-row:hover {
          background: #f8fafc;
        }
        .bulk-table td {
          padding: 13px 18px;
          vertical-align: middle;
        }

        .bulk-avatar {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          object-fit: cover;
          border: 1px solid #e2e8f0;
        }
        .bulk-id {
          font-size: 12.5px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
        }
        .bulk-status-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          border-radius: 999px;
          padding: 3.5px 12px;
          border: 1px solid;
          white-space: nowrap;
        }
        .bulk-row-select {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .bulk-row-select:focus {
          border-color: #3b82f6;
          background: #ffffff;
        }

        /* Footer */
        .bulk-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 22px;
          border-top: 1px solid #f1f5f9;
          background: #ffffff;
          flex-wrap: wrap;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
