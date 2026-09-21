import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  X,
  RotateCcw,
  CheckCircle2,
  Check,
  Save,
  Clock,
  Users,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import Pagination from "../../../components/ui/Pagination";
import { PageInfoButton } from "../../../components/common/PageInfoButton";
import { hrmsGuides } from "../../../data/hrms/hrmsGuides";

const INITIAL_EMPLOYEES = [
  {
    id: "EMP1024",
    name: "Priya Patel",
    dept: "Engineering",
    checkIn: "09:00",
    checkOut: "18:00",
    status: "Present",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "EMP1025",
    name: "Marcus Chen",
    dept: "Design",
    checkIn: "09:18",
    checkOut: "16:30",
    status: "Late",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "EMP1026",
    name: "Liam Cooper",
    dept: "Engineering",
    checkIn: "—",
    checkOut: "—",
    status: "Present",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    id: "EMP1027",
    name: "Sarah Wilson",
    dept: "Marketing",
    checkIn: "09:00",
    checkOut: "17:55",
    status: "WFH",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    id: "EMP1028",
    name: "James Wilson",
    dept: "Finance",
    checkIn: "09:42",
    checkOut: "13:30",
    status: "Half Day",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/men/54.jpg",
  },
  {
    id: "EMP1029",
    name: "Ayesha Khan",
    dept: "HR",
    checkIn: "—",
    checkOut: "—",
    status: "On Leave",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/women/24.jpg",
  },
  {
    id: "EMP1030",
    name: "David Park",
    dept: "Engineering",
    checkIn: "09:05",
    checkOut: "18:10",
    status: "Present",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
  },
  {
    id: "EMP1031",
    name: "Chen Li",
    dept: "Operations",
    checkIn: "09:22",
    checkOut: "18:00",
    status: "Late",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
  },
  {
    id: "EMP1032",
    name: "Rahul Verma",
    dept: "Design",
    checkIn: "09:00",
    checkOut: "18:00",
    status: "Present",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/men/62.jpg",
  },
  {
    id: "EMP1033",
    name: "Ana Silva",
    dept: "Marketing",
    checkIn: "09:05",
    checkOut: "18:00",
    status: "WFH",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
  },
  {
    id: "EMP1034",
    name: "Tariq Al-Mansoor",
    dept: "HR",
    checkIn: "09:18",
    checkOut: "18:04",
    status: "Present",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/men/17.jpg",
  },
  {
    id: "EMP1035",
    name: "Sofia Reyes",
    dept: "Finance",
    checkIn: "—",
    checkOut: "—",
    status: "On Leave",
    remarks: "",
    avatar: "https://randomuser.me/api/portraits/women/26.jpg",
  },
];

const DEPARTMENTS = ["All", "Engineering", "Design", "Marketing", "Finance", "HR", "Operations"];
const STATUSES = ["Present", "Late", "Absent", "WFH", "Half Day", "On Leave"];

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

export default function MarkAttendance() {
  const setToast = useAppStore((s) => s.setToast || s.showToast);
  const storeRecords = useAttendanceStore((s) => s.records);
  const saveDailyAttendance = useAttendanceStore((s) => s.saveDailyAttendance);

  const [date, setDate] = useState("2024-10-11");
  const [dept, setDept] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [localBanner, setLocalBanner] = useState(null);
  const dateInputRef = useRef(null);

  const [rows, setRows] = useState(() => {
    if (storeRecords && storeRecords.length > 0) {
      return storeRecords.map((r) => ({
        ...r,
        avatar: r.avatar || r.img || `https://i.pravatar.cc/100?u=${r.id || r.name}`,
        remarks: r.remarks || "",
        checkIn: r.checkIn || (r.status === "Absent" || r.status === "On Leave" ? "—" : "09:00"),
        checkOut: r.checkOut || (r.status === "Absent" || r.status === "On Leave" ? "—" : "18:00"),
      }));
    }
    return INITIAL_EMPLOYEES;
  });

  // Sync rows if store records change externally
  useEffect(() => {
    if (storeRecords && storeRecords.length > 0) {
      setRows((prev) => {
        return storeRecords.map((r) => {
          const existing = prev.find((p) => p.id === r.id);
          return {
            ...r,
            avatar: r.avatar || r.img || `https://i.pravatar.cc/100?u=${r.id || r.name}`,
            remarks: existing ? existing.remarks : r.remarks || "",
            checkIn: existing ? existing.checkIn : r.checkIn || (r.status === "Absent" || r.status === "On Leave" ? "—" : "09:00"),
            checkOut: existing ? existing.checkOut : r.checkOut || (r.status === "Absent" || r.status === "On Leave" ? "—" : "18:00"),
            status: existing ? existing.status : r.status || "Present",
          };
        });
      });
    }
  }, [storeRecords]);

  // Live status summary counts
  const statusCounts = useMemo(() => {
    const counts = { All: rows.length, Present: 0, Late: 0, Absent: 0, "Half Day": 0, WFH: 0, "On Leave": 0 };
    rows.forEach((r) => {
      if (counts[r.status] !== undefined) {
        counts[r.status] += 1;
      }
    });
    return counts;
  }, [rows]);

  // Working filters: Department, Status, Search
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (dept !== "All" && r.dept !== dept) return false;
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.name?.toLowerCase().includes(q);
        const matchId = r.id?.toLowerCase().includes(q);
        const matchDept = r.dept?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDept) return false;
      }
      return true;
    });
  }, [rows, dept, statusFilter, searchQuery]);

  const MARK_PAGE_SIZE = 8;
  const [markPage, setMarkPage] = useState(1);

  useEffect(() => {
    setMarkPage(1);
  }, [dept, statusFilter, searchQuery]);

  const markTotalPages = Math.max(1, Math.ceil(filtered.length / MARK_PAGE_SIZE));
  useEffect(() => {
    if (markPage > markTotalPages) setMarkPage(markTotalPages);
  }, [markPage, markTotalPages]);

  const paginatedRows = useMemo(() => {
    const start = (markPage - 1) * MARK_PAGE_SIZE;
    return filtered.slice(start, start + MARK_PAGE_SIZE);
  }, [filtered, markPage]);

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

  // Row updates
  function updateRow(id, patch) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        // Smart time adjustments based on status
        if (patch.status) {
          if (patch.status === "Absent" || patch.status === "On Leave") {
            updated.checkIn = "—";
            updated.checkOut = "—";
          } else if (r.checkIn === "—" || !r.checkIn) {
            updated.checkIn = "09:00";
            updated.checkOut = "18:00";
          }
        }
        return updated;
      })
    );
  }

  // Fast 1-click Preset: Mark all visible as Present
  function handleMarkAllPresent() {
    setRows((prev) =>
      prev.map((r) => {
        const isMatch = filtered.some((f) => f.id === r.id);
        if (!isMatch) return r;
        return {
          ...r,
          status: "Present",
          checkIn: r.checkIn === "—" || !r.checkIn ? "09:00" : r.checkIn,
          checkOut: r.checkOut === "—" || !r.checkOut ? "18:00" : r.checkOut,
        };
      })
    );
    notify(`Marked all ${filtered.length} visible employee(s) as Present.`);
  }

  function handleSave() {
    saveDailyAttendance(date, rows);
    notify(`✓ Attendance saved for ${rows.length} employees on ${formatDateDisplay(date)}.`);
  }

  const isFiltered = dept !== "All" || statusFilter !== "All" || searchQuery.trim() !== "";

  return (
    <div className="mark-att-page">
      {/* Breadcrumb */}
      <nav className="mark-crumb">
        <span style={{ cursor: "pointer" }}>Home</span>
        <ChevronRight size={13} style={{ color: "#9aa7bd" }} />
        <span style={{ color: "#111f36", fontWeight: 600 }}>Attendance / Mark Attendance</span>
      </nav>

      {/* Header Row */}
      <div className="mark-title-row">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="mark-title">Mark Attendance</h1>
            <PageInfoButton guide={hrmsGuides.attendanceMark} />
          </div>
          <p className="mark-sub">Record and verify daily employee attendance, work hours, and check-in/out times.</p>
        </div>

        {/* Header Action Buttons (Similar to Attendance Requests) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="mark-btn-outline"
            title="Set all visible records to Present"
          >
            <Check size={14} className="text-emerald-600" />
            <span>Mark All Present</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="mark-btn-primary"
          >
            <Save size={14} />
            <span>Save Attendance</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Pills with Counts (Identical pattern to Attendance Requests) */}
      <div className="mark-tabs-wrap">
        <button
          type="button"
          onClick={() => setStatusFilter("All")}
          className={`mark-tab-pill ${statusFilter === "All" ? "active" : ""}`}
        >
          <span>All</span>
          <span className="mark-tab-count">{statusCounts.All}</span>
        </button>

        {STATUSES.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(statusFilter === st ? "All" : st)}
            className={`mark-tab-pill ${statusFilter === st ? "active" : ""}`}
            style={{
              borderColor: statusFilter === st ? statusStyles[st]?.color : undefined,
              color: statusFilter === st ? statusStyles[st]?.color : undefined,
              background: statusFilter === st ? statusStyles[st]?.background : undefined,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusStyles[st]?.color }}
            />
            <span>{st}</span>
            <span className="mark-tab-count" style={{ color: statusStyles[st]?.color }}>
              {statusCounts[st] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Local Notification Banner */}
      {localBanner && (
        <div className="mark-banner animate-in fade-in slide-in-from-top-1 duration-150">
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

      {/* Single Unified Filter Bar Card */}
      <div className="mark-card mark-filter-card">
        <div className="mark-filter-flex">
          {/* Fully Functional Date Picker */}
          <div className="mark-filter-item">
            <label className="mark-field-label">Date</label>
            <div className="flex items-center gap-1.5">
              <div
                className="mark-date-container"
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
                  className="mark-date-field"
                  aria-label="Attendance Date"
                />
              </div>

              {/* Quick Day Shift Buttons */}
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
          <div className="mark-filter-item flex-1 min-w-[220px]">
            <label className="mark-field-label">Search Employee</label>
            <div className="mark-search-box">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, EMP ID, or department..."
                className="mark-search-input"
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
          <div className="mark-filter-item">
            <label className="mark-field-label">Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="mark-select"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.filter((d) => d !== "All").map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="mark-filter-item">
            <label className="mark-field-label">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mark-select"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {isFiltered && (
            <div className="mark-filter-item self-end">
              <button
                type="button"
                onClick={() => {
                  setDept("All");
                  setStatusFilter("All");
                  setSearchQuery("");
                }}
                className="mark-btn-reset"
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Card (Clean, No Checkboxes) */}
      <div className="mark-card mark-main-card">
        <div style={{ overflowX: "auto" }}>
          <table className="mark-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 22 }}>EMPLOYEE</th>
                <th>EMPLOYEE ID</th>
                <th>DEPARTMENT</th>
                <th style={{ width: 110 }}>CHECK IN</th>
                <th style={{ width: 110 }}>CHECK OUT</th>
                <th style={{ width: 140 }}>STATUS</th>
                <th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((r) => (
                <tr key={r.id} className="mark-row">
                  <td style={{ paddingLeft: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={r.avatar} alt={r.name} className="mark-avatar" loading="lazy" />
                      <span style={{ fontWeight: 600, color: "#111827", display: "block" }}>
                        {r.name}
                      </span>
                    </div>
                  </td>
                  <td className="mark-id">{r.id}</td>
                  <td style={{ color: "#374151", fontWeight: 500 }}>{r.dept}</td>
                  <td>
                    <input
                      type="text"
                      value={r.checkIn}
                      onChange={(e) => updateRow(r.id, { checkIn: e.target.value })}
                      placeholder="09:00"
                      className="mark-input mark-input-time"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={r.checkOut}
                      onChange={(e) => updateRow(r.id, { checkOut: e.target.value })}
                      placeholder="18:00"
                      className="mark-input mark-input-time"
                    />
                  </td>
                  <td>
                    <select
                      value={r.status}
                      onChange={(e) => updateRow(r.id, { status: e.target.value })}
                      className="mark-select-status"
                      style={{ ...statusStyles[r.status] }}
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={r.remarks}
                      onChange={(e) => updateRow(r.id, { remarks: e.target.value })}
                      placeholder="Add note..."
                      className="mark-input mark-input-remarks"
                    />
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#64748b", padding: "48px 20px" }}>
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

        {/* Footer with Summary & Actions */}
        <div className="mark-footer">
          <div className="text-xs text-slate-500">
            Showing{" "}
            <strong>
              {filtered.length > 0
                ? `${(markPage - 1) * MARK_PAGE_SIZE + 1}–${Math.min(markPage * MARK_PAGE_SIZE, filtered.length)}`
                : 0}
            </strong>{" "}
            of <strong>{filtered.length}</strong> employee records
          </div>

          <div className="flex items-center gap-3">
            <Pagination
              total={filtered.length}
              page={markPage}
              pageSize={MARK_PAGE_SIZE}
              onChange={setMarkPage}
            />

            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setRows(INITIAL_EMPLOYEES)}
                className="mark-btn-cancel"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="mark-btn-save"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .mark-att-page {
          background: #f8fafc;
          margin: -24px -28px -40px;
          padding: 20px 28px 36px;
          min-height: calc(100vh - 62px);
        }
        .mark-crumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 10px;
        }
        .mark-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .mark-title {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .mark-sub {
          margin: 4px 0 0;
          font-size: 13px;
          color: #64748b;
        }

        /* Action Buttons in Header */
        .mark-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .mark-btn-outline:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          transform: translateY(-1px);
        }
        .mark-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #0f172a;
          border: 1px solid #0f172a;
          color: #ffffff;
          padding: 8px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.15);
        }
        .mark-btn-primary:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        /* Filter Tabs */
        .mark-tabs-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .mark-tab-pill {
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
        .mark-tab-pill:hover {
          border-color: #94a3b8;
          color: #0f172a;
          transform: translateY(-1px);
        }
        .mark-tab-pill.active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }
        .mark-tab-pill.active .mark-tab-count {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }
        .mark-tab-count {
          background: #f1f5f9;
          color: #475569;
          padding: 1px 6px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }

        /* Notification Banner */
        .mark-banner {
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
        .mark-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        /* Unified Filter Card */
        .mark-filter-card {
          padding: 14px 18px;
          margin-bottom: 14px;
        }
        .mark-filter-flex {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }
        .mark-filter-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mark-field-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Date Input */
        .mark-date-container {
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
        .mark-date-container:hover,
        .mark-date-container:focus-within {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .mark-date-field {
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          outline: none;
          cursor: pointer;
        }

        /* Search Box */
        .mark-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 6.5px 12px;
          transition: border-color 0.15s ease;
        }
        .mark-search-box:focus-within {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .mark-search-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13px;
          color: #0f172a;
        }
        .mark-search-input::placeholder {
          color: #94a3b8;
        }

        /* Dropdowns */
        .mark-select {
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
        .mark-select:focus {
          border-color: #3b82f6;
          background-color: #ffffff;
        }

        .mark-btn-reset {
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
        .mark-btn-reset:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* Main Table */
        .mark-main-card {
          overflow: hidden;
        }
        .mark-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 860px;
          font-size: 13.5px;
        }
        .mark-table thead tr {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }
        .mark-table th {
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #64748b;
          padding: 14px 18px;
          white-space: nowrap;
        }
        .mark-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.12s ease;
        }
        .mark-row:hover {
          background: #f8fafc;
        }
        .mark-table td {
          padding: 12px 18px;
          vertical-align: middle;
        }

        .mark-avatar {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          object-fit: cover;
          border: 1px solid #e2e8f0;
        }
        .mark-id {
          font-size: 12.5px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
        }

        /* Inputs in Table */
        .mark-input {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          outline: none;
          transition: all 0.15s ease;
        }
        .mark-input:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .mark-input-time {
          width: 82px;
          text-align: center;
        }
        .mark-input-remarks {
          width: 100%;
          min-width: 120px;
          font-weight: 400;
        }

        /* Status Select in Table */
        .mark-select-status {
          border: 1px solid;
          border-radius: 999px;
          padding: 4px 28px 4px 12px;
          font-size: 12px;
          font-weight: 700;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 12px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23334155' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          min-width: 112px;
          transition: transform 0.15s ease;
        }
        .mark-select-status:hover {
          transform: translateY(-1px);
        }

        /* Footer */
        .mark-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 22px;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
          flex-wrap: wrap;
          gap: 12px;
        }
        .mark-btn-cancel {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 7px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .mark-btn-cancel:hover {
          background: #f8fafc;
          color: #0f172a;
        }
        .mark-btn-save {
          background: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 7px 18px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .mark-btn-save:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
