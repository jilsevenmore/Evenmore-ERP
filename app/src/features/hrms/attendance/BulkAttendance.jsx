import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Calendar as CalendarIcon,
  Search,
  X,
  RotateCcw,
  Building2,
  MapPin,
  Clock,
  Filter,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import { ConfirmModal } from "../../../components/hrms/Shared";
import { PageInfoButton } from "../../../components/common/PageInfoButton";
import { hrmsGuides } from "../../../data/hrms/hrmsGuides";
import { bulkAttendance, isBackendEnabled, hrmsSync } from "../../../services/hrmsSync";
import { UserInitials } from "../../../components/common/UserInitials";

const STATUS_OPTIONS = ["Present", "Absent", "Late", "Half Day", "WFH", "On Leave"];

const statusStyles = {
  Present: { background: "#e6f4ea", color: "#15803d", border: "#a7f3d0" },
  Late: { background: "#fef3c7", color: "#b45309", border: "#fde68a" },
  Absent: { background: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  WFH: { background: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  "Half Day": { background: "#f3e8ff", color: "#7e22ce", border: "#d8b4fe" },
  "On Leave": { background: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  "Not Marked": { background: "#f8fafc", color: "#64748b", border: "#cbd5e1" },
};

function getTodayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDate(isoDate, deltaDays) {
  if (!isoDate) return getTodayISO();
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, "0");
  const nd = String(dt.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

function formatDateDisplay(isoDate) {
  if (!isoDate) return "";
  return isoDate.split("-").reverse().join("-");
}

export default function BulkAttendance() {
  const setToast = useAppStore((s) => s.setToast || s.showToast);
  const storeEmployees = useAppStore((s) => s.employees || []);
  const todayISO = getTodayISO();

  const [date, setDate] = useState(todayISO);
  const [dept, setDept] = useState("All");
  const [location, setLocation] = useState("All");
  const [shift, setShift] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [employees, setEmployees] = useState(() => {
    if (storeEmployees && storeEmployees.length > 0) {
      const map = new Map();
      storeEmployees.forEach((e) => {
        const name = (e.name || "").trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: e.id || e.empId,
            empId: e.empId || e.employeeCode || e.id || "",
            name: e.name || "Employee",
            dept: e.department || e.dept || "",
            location: e.location || e.workLocation || "",
            shift: e.shift || "General",
            status: "Not Marked",
            avatar: e.avatar || `https://i.pravatar.cc/100?u=${e.id || e.name}`,
          });
        }
      });
      return Array.from(map.values());
    }
    return [];
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("Present");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Load attendance data whenever selected date changes
  const loadAttendanceForDate = useCallback(async (selectedDate) => {
    try {
      // 1. Fetch server attendance for selectedDate
      let attList = [];
      try {
        attList = (await hrmsSync.pull("attendance", { date: selectedDate })) || [];
      } catch (err) {
        console.warn("[BulkAttendance] pull attendance:", err);
      }

      // 2. Fetch local records from attendance store for selectedDate
      const localRecords = useAttendanceStore.getState().records || [];
      const matchingLocal = localRecords.filter((r) => {
        const rDate = r.rawDate || r.date;
        if (!rDate) return false;
        return (
          rDate === selectedDate ||
          rDate.split("-").reverse().join("-") === selectedDate ||
          selectedDate.split("-").reverse().join("-") === rDate
        );
      });

      // 3. Build lookup map by employee id, empId, name
      const byEmp = new Map();
      attList.forEach((r) => {
        if (r.employeeId) byEmp.set(String(r.employeeId), r);
        if (r.empId) byEmp.set(String(r.empId), r);
        if (r.id) byEmp.set(String(r.id), r);
        if (r.name) byEmp.set(String(r.name).toLowerCase(), r);
      });
      matchingLocal.forEach((r) => {
        if (r.employeeId) byEmp.set(String(r.employeeId), r);
        if (r.empId) byEmp.set(String(r.empId), r);
        if (r.id) byEmp.set(String(r.id), r);
        if (r.name) byEmp.set(String(r.name).toLowerCase(), r);
      });

      // 4. Fallback pull of employees if storeEmployees is empty
      let emps = storeEmployees;
      if (!emps || emps.length === 0) {
        try {
          emps = (await hrmsSync.pull("employees")) || [];
        } catch {}
      }

      const allEmps = emps && emps.length > 0 ? emps : [];
      if (allEmps.length > 0) {
        const uniqueEmpsMap = new Map();
        allEmps.forEach((emp) => {
          const name = (emp.name || "").trim();
          if (!name) return;
          const key = name.toLowerCase();
          if (!uniqueEmpsMap.has(key)) {
            uniqueEmpsMap.set(key, emp);
          }
        });
        const dedupedEmps = Array.from(uniqueEmpsMap.values());

        setEmployees(
          dedupedEmps.map((emp) => {
            const att =
              byEmp.get(String(emp.id)) ||
              byEmp.get(String(emp.empId)) ||
              byEmp.get(String(emp.employeeCode)) ||
              byEmp.get(String(emp.name).toLowerCase());

            return {
              id: emp.id || emp.empId,
              empId: emp.empId || emp.employeeCode || emp.id || "",
              name: emp.name || "Employee",
              dept: emp.department || emp.dept || "",
              location: emp.location || emp.workLocation || "",
              shift: emp.shift || "General",
              status: att?.status || "Not Marked",
              avatar: emp.avatar || `https://i.pravatar.cc/100?u=${emp.id || emp.name}`,
            };
          })
        );
      }
    } catch (err) {
      console.error("[BulkAttendance] error loading attendance:", err);
    }
  }, [storeEmployees]);

  useEffect(() => {
    loadAttendanceForDate(date);
  }, [date, loadAttendanceForDate]);

  // Dynamic filter option lists
  const DEPARTMENTS = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => {
      const d = (e.dept || "").trim();
      if (d && d !== "—") set.add(d);
    });
    (storeEmployees || []).forEach((e) => {
      const d = (e.department || e.dept || "").trim();
      if (d && d !== "—") set.add(d);
    });
    return ["All", ...Array.from(set).sort()];
  }, [employees, storeEmployees]);

  const LOCATIONS = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => {
      const l = (e.location || "").trim();
      if (l && l !== "—") set.add(l);
    });
    (storeEmployees || []).forEach((e) => {
      const l = (e.location || e.workLocation || "").trim();
      if (l && l !== "—") set.add(l);
    });
    return ["All", ...Array.from(set).sort()];
  }, [employees, storeEmployees]);

  const SHIFTS_LIST = useMemo(() => {
    const set = new Set(["General", "Flexible", "Night"]);
    employees.forEach((e) => {
      const s = (e.shift || "").trim();
      if (s) set.add(s);
    });
    (storeEmployees || []).forEach((e) => {
      const s = (e.shift || "").trim();
      if (s) set.add(s);
    });
    return ["All", ...Array.from(set)];
  }, [employees, storeEmployees]);

  // Status counters for dropdown display and live badges
  const statusCounts = useMemo(() => {
    const counts = { All: employees.length, "Not Marked": 0 };
    STATUS_OPTIONS.forEach((st) => { counts[st] = 0; });
    employees.forEach((e) => {
      const st = e.status || "Not Marked";
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [employees]);

  const hasActiveFilters =
    dept !== "All" ||
    location !== "All" ||
    shift !== "All" ||
    statusFilter !== "All" ||
    Boolean(searchQuery.trim());

  function resetFilters() {
    setDept("All");
    setLocation("All");
    setShift("All");
    setStatusFilter("All");
    setSearchQuery("");
  }

  // Filter evaluation logic
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return employees.filter((e) => {
      // 1. Department filter
      if (dept !== "All") {
        const empDept = String(e.dept || "").trim().toLowerCase();
        const targetDept = String(dept).trim().toLowerCase();
        if (empDept !== targetDept) return false;
      }

      // 2. Location filter
      if (location !== "All") {
        const empLoc = String(e.location || "").trim().toLowerCase();
        const targetLoc = String(location).trim().toLowerCase();
        if (empLoc !== targetLoc) return false;
      }

      // 3. Shift filter
      if (shift !== "All") {
        const empShift = String(e.shift || "General").trim().toLowerCase();
        const targetShift = String(shift).trim().toLowerCase();
        if (empShift !== targetShift) return false;
      }

      // 4. Status filter
      if (statusFilter !== "All") {
        const empStatus = String(e.status || "Not Marked").trim().toLowerCase();
        const targetStatus = String(statusFilter).trim().toLowerCase();
        if (targetStatus === "not marked") {
          if (empStatus && empStatus !== "not marked" && empStatus !== "—") return false;
        } else {
          if (empStatus !== targetStatus) return false;
        }
      }

      // 5. Search query (matches name, code, dept, location, status)
      if (q) {
        const name = String(e.name || "").toLowerCase();
        const id = String(e.id || "").toLowerCase();
        const code = String(e.empId || "").toLowerCase();
        const d = String(e.dept || "").toLowerCase();
        const loc = String(e.location || "").toLowerCase();
        const sh = String(e.shift || "").toLowerCase();
        const st = String(e.status || "").toLowerCase();
        if (
          !name.includes(q) &&
          !id.includes(q) &&
          !code.includes(q) &&
          !d.includes(q) &&
          !loc.includes(q) &&
          !sh.includes(q) &&
          !st.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [employees, dept, location, shift, statusFilter, searchQuery]);

  const allSelected = filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id));

  function toggleAll(v) {
    const next = new Set(selectedIds);
    filtered.forEach((e) => (v ? next.add(e.id) : next.delete(e.id)));
    setSelectedIds(next);
  }

  function toggleOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  // Handle clicking a status pill in the action bar
  function handlePillClick(st) {
    setBulkStatus(st);
    if (selectedIds.size > 0) {
      const idsArray = Array.from(selectedIds);
      setEmployees((prev) =>
        prev.map((e) => (selectedIds.has(e.id) ? { ...e, status: st } : e))
      );
      const recordsToSave = idsArray.map((id) => {
        const emp =
          employees.find((e) => e.id === id) ||
          (storeEmployees || []).find((e) => e.id === id || e.empId === id);
        return {
          id: `att-${id}-${date}`,
          employeeId: emp?.id || id,
          empId: emp?.empId || id,
          name: emp?.name || "Employee",
          dept: emp?.dept || emp?.department || "",
          date,
          rawDate: date,
          status: st,
          checkIn: `${date}T09:00:00`,
          checkOut: `${date}T18:00:00`,
        };
      });
      useAttendanceStore.getState().saveDailyAttendance(date, recordsToSave);
      setToast(`Updated ${idsArray.length} employee(s) to "${st}". Click "Save Attendance" to commit.`);
    } else {
      setToast(`Status "${st}" chosen. Check employee boxes and click "Save Attendance" to apply.`);
    }
  }

  function handleSaveClick() {
    if (selectedIds.size === 0) {
      return setToast("Please select at least one employee using checkboxes or check 'Select All'.", "error");
    }
    setConfirmOpen(true);
  }

  async function handleConfirmSave() {
    const idsArray = Array.from(selectedIds);
    if (!idsArray.length) return;

    // 1. Update component state immediately
    setEmployees((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, status: bulkStatus } : e))
    );

    // 2. Prepare standardized attendance records
    const recordsToSave = idsArray.map((id) => {
      const emp =
        employees.find((e) => e.id === id) ||
        (storeEmployees || []).find((e) => e.id === id || e.empId === id);
      return {
        id: `att-${id}-${date}`,
        employeeId: emp?.id || id,
        empId: emp?.empId || id,
        name: emp?.name || "Employee",
        dept: emp?.dept || emp?.department || "",
        date,
        rawDate: date,
        status: bulkStatus,
        checkIn: `${date}T09:00:00`,
        checkOut: `${date}T18:00:00`,
      };
    });

    // 3. Save to attendance store
    useAttendanceStore.getState().saveDailyAttendance(date, recordsToSave);

    // 4. Push to backend if enabled
    if (isBackendEnabled()) {
      try {
        await bulkAttendance(
          recordsToSave.map((r) => ({
            employeeId: r.employeeId,
            date: r.date,
            status: r.status,
            checkIn: r.checkIn,
            checkOut: r.checkOut,
          }))
        );
        await useAttendanceStore.getState().refreshAttendance();
      } catch (err) {
        console.warn("[BulkAttendance] Failed to push bulk records to server:", err);
      }
    }

    setToast(`Bulk attendance saved as "${bulkStatus}" for ${idsArray.length} employee(s) on ${date}`);
    setConfirmOpen(false);
    setSelectedIds(new Set());
  }

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
          <p className="bulk-sub">Update and verify attendance for multiple employees simultaneously.</p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bulk-card bulk-filter-card">
        <div className="bulk-filters-container">
          {/* Search Input */}
          <div className="bulk-search-wrap">
            <Search size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search employee or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bulk-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="bulk-clear-btn"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Date Picker Cluster */}
          <div className="bulk-date-cluster">
            <button
              type="button"
              title="Previous Day"
              onClick={() => setDate((d) => shiftDate(d, -1))}
              className="bulk-date-nav-btn"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="bulk-date-wrap">
              <span className="font-semibold text-xs text-slate-800">{formatDateDisplay(date)}</span>
              <CalendarIcon size={14} style={{ color: "#2563eb", flexShrink: 0 }} />
              <input
                type="date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="bulk-date-native"
                aria-label="Select date"
              />
            </div>

            <button
              type="button"
              title="Next Day"
              onClick={() => setDate((d) => shiftDate(d, 1))}
              className="bulk-date-nav-btn"
            >
              <ChevronRight size={15} />
            </button>

            {date !== todayISO && (
              <button
                type="button"
                onClick={() => setDate(todayISO)}
                className="bulk-today-btn"
              >
                Today
              </button>
            )}
          </div>

          {/* Department Filter Dropdown */}
          <div className={`bulk-filter-dropdown ${dept !== "All" ? "active" : ""}`}>
            <Building2 size={13} className="bulk-filter-icon" />
            <span className="bulk-filter-text">
              {dept === "All" ? "All Departments" : dept}
            </span>
            <ChevronDown size={13} className="bulk-filter-arrow" />
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="bulk-filter-native-select"
              aria-label="Department Filter"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? "All Departments" : d}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter Dropdown */}
          <div className={`bulk-filter-dropdown ${location !== "All" ? "active" : ""}`}>
            <MapPin size={13} className="bulk-filter-icon" />
            <span className="bulk-filter-text">
              {location === "All" ? "All Locations" : location}
            </span>
            <ChevronDown size={13} className="bulk-filter-arrow" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bulk-filter-native-select"
              aria-label="Location Filter"
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l === "All" ? "All Locations" : l}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter Dropdown */}
          <div className={`bulk-filter-dropdown ${shift !== "All" ? "active" : ""}`}>
            <Clock size={13} className="bulk-filter-icon" />
            <span className="bulk-filter-text">
              {shift === "All" ? "All Shifts" : shift}
            </span>
            <ChevronDown size={13} className="bulk-filter-arrow" />
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="bulk-filter-native-select"
              aria-label="Shift Filter"
            >
              {SHIFTS_LIST.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Shifts" : s}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className={`bulk-filter-dropdown ${statusFilter !== "All" ? "active" : ""}`}>
            <Filter size={13} className="bulk-filter-icon" />
            <span className="bulk-filter-text">
              {statusFilter === "All"
                ? `All Statuses (${employees.length})`
                : `${statusFilter} (${statusCounts[statusFilter] ?? 0})`}
            </span>
            <ChevronDown size={13} className="bulk-filter-arrow" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bulk-filter-native-select"
              aria-label="Status Filter"
            >
              <option value="All">All Statuses ({employees.length})</option>
              <option value="Not Marked">Not Marked ({statusCounts["Not Marked"] || 0})</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st} ({statusCounts[st] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="bulk-reset-btn"
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Action & Selection Bar Card */}
      <div className="bulk-card bulk-action-card">
        <div className="bulk-action-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#475569" }}>
              Mark selected as:
            </span>
            <div className="bulk-pills-group">
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handlePillClick(st)}
                  className={bulkStatus === st ? "bulk-pill active" : "bulk-pill"}
                  title={`Set status to ${st}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {selectedIds.size > 0 && (
              <span className="bulk-selected-badge">
                {selectedIds.size} of {filtered.length} selected
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={selectedIds.size === 0}
              className="bulk-btn-save"
            >
              Save Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="bulk-card bulk-main-card">
        <div style={{ overflowX: "auto" }}>
          <table className="bulk-table">
            <thead>
              <tr>
                <th style={{ width: 40, paddingLeft: 20 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="bulk-checkbox"
                    aria-label="Select all"
                  />
                </th>
                <th>EMPLOYEE</th>
                <th>EMPLOYEE ID</th>
                <th>DEPARTMENT</th>
                <th>LOCATION</th>
                <th>SHIFT</th>
                <th>CURRENT STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(e.id)}
                      onChange={() => toggleOne(e.id)}
                      className="bulk-checkbox"
                      aria-label={`Select ${e.name}`}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <UserInitials name={e.name} className="w-8 h-8 text-xs" />
                      <span style={{ fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>
                        {e.name}
                      </span>
                    </div>
                  </td>
                  <td className="bulk-id">{e.empId || e.id}</td>
                  <td style={{ color: "#374151" }}>{e.dept || "—"}</td>
                  <td style={{ color: "#64748b", fontSize: "13px" }}>{e.location || "—"}</td>
                  <td style={{ color: "#64748b", fontSize: "13px" }}>{e.shift || "General"}</td>
                  <td>
                    <span className="bulk-status" style={{ ...statusStyles[e.status] }}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#6b7280", padding: "40px 20px" }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: "14px", color: "#374151" }}>
                      No employees match the selected filters.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        style={{
                          marginTop: 10,
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          color: "#1e293b",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Clear All Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm bulk update?"
        desc={`Update attendance status to "${bulkStatus}" for ${selectedIds.size} selected employees on ${date}?`}
        confirmLabel="Confirm Update"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSave}
      />

      <style>{`
        .bulk-att-page { background: #f8fafc; margin: -16px -24px -24px; padding: 18px 24px 28px; min-height: calc(100vh - 62px); }
        .bulk-crumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7a90; margin-bottom: 10px; }
        .bulk-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
        .bulk-title { margin: 0; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.01em; }
        .bulk-sub { margin: 4px 0 0; font-size: 13px; color: #6b7280; }

        .bulk-card { background: #fff; border: 1px solid #e8edf3; border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,0.03); }
        .bulk-filter-card { border: none; padding: 14px 18px; margin-bottom: 16px; }
        .bulk-filters-container { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .bulk-search-wrap { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 12px; height: 36px; min-width: 190px; flex: 1; max-width: 260px; box-sizing: border-box; }
        .bulk-search-input { border: none; outline: none; background: transparent; font-size: 13px; color: #1e293b; width: 100%; }
        .bulk-search-input::placeholder { color: #94a3b8; }
        .bulk-clear-btn { background: none; border: none; padding: 2px; color: #94a3b8; cursor: pointer; display: flex; align-items: center; }
        .bulk-clear-btn:hover { color: #475569; }

        .bulk-date-cluster { display: inline-flex; align-items: center; gap: 3px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2px 4px; height: 36px; box-sizing: border-box; }
        .bulk-date-nav-btn { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: #475569; cursor: pointer; transition: all 0.15s ease; }
        .bulk-date-nav-btn:hover { background: #ffffff; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .bulk-date-wrap { position: relative; display: flex; align-items: center; gap: 6px; padding: 0 6px; height: 28px; cursor: pointer; }
        .bulk-date-native { position: absolute; right: 0; top: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        .bulk-today-btn { height: 24px; padding: 0 8px; font-size: 11px; font-weight: 700; border-radius: 6px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; cursor: pointer; margin-left: 2px; }
        .bulk-today-btn:hover { background: #dbeafe; }

        .bulk-filter-dropdown { position: relative; display: inline-flex; align-items: center; justify-content: space-between; gap: 7px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 12px; height: 36px; min-width: 140px; cursor: pointer; transition: all 0.15s ease; box-sizing: border-box; }
        .bulk-filter-dropdown:hover { border-color: #cbd5e1; background: #ffffff; }
        .bulk-filter-dropdown.active { border-color: #3b82f6; background: #eff6ff; }
        .bulk-filter-icon { color: #64748b; flex-shrink: 0; pointer-events: none; }
        .bulk-filter-dropdown.active .bulk-filter-icon { color: #2563eb; }
        .bulk-filter-text { font-size: 13px; color: #1e293b; font-weight: 500; white-space: nowrap; user-select: none; overflow: hidden; text-overflow: ellipsis; max-width: 170px; }
        .bulk-filter-dropdown.active .bulk-filter-text { color: #1d4ed8; font-weight: 600; }
        .bulk-filter-arrow { color: #64748b; flex-shrink: 0; pointer-events: none; margin-left: auto; }
        .bulk-filter-dropdown.active .bulk-filter-arrow { color: #2563eb; }
        .bulk-filter-native-select { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

        .bulk-reset-btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; transition: all 0.15s ease; }
        .bulk-reset-btn:hover { background: #e2e8f0; color: #0f172a; }

        .bulk-action-card { border: none; padding: 14px 18px; margin-bottom: 16px; }
        .bulk-action-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; width: 100%; }
        .bulk-checkbox { width: 16px; height: 16px; border-radius: 4px; accent-color: #16233a; cursor: pointer; }

        .bulk-pills-group { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .bulk-pill { display: inline-flex; align-items: center; justify-content: center; height: 32px; padding: 0 12px; border-radius: 10px; font-size: 12.5px; font-weight: 600; white-space: nowrap; cursor: pointer; transition: all 0.15s ease; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .bulk-pill:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        .bulk-pill.active { background: #1e293b; color: #fff; border-color: #1e293b; box-shadow: 0 2px 4px rgba(15,23,42,0.15); }

        .bulk-selected-badge { font-size: 12px; font-weight: 700; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; padding: 5px 12px; border-radius: 999px; white-space: nowrap; }
        .bulk-btn-save { display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0 18px; border-radius: 12px; font-size: 13px; font-weight: 700; white-space: nowrap; cursor: pointer; transition: all 0.15s ease; background: #16233a; color: #fff; border: none; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .bulk-btn-save:hover:not(:disabled) { background: #0f172a; }
        .bulk-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

        .bulk-main-card { overflow: hidden; }
        .bulk-table { width: 100%; border-collapse: collapse; min-width: 700px; font-size: 13.5px; }
        .bulk-table thead tr { background: #ffffff; border-bottom: 1px solid #e2e8f0; }
        .bulk-table th { text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #7b8aa0; padding: 14px 20px; white-space: nowrap; }
        .bulk-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.12s ease; }
        .bulk-table tbody tr:hover { background: #f8fafc; }
        .bulk-table td { padding: 14px 20px; vertical-align: middle; }

        .bulk-id { font-family: inherit; font-size: 12.5px; color: #6b7280; white-space: nowrap; }
        .bulk-status { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 4px 13px; border: 1px solid; white-space: nowrap; }

        @media (max-width: 1023px) {
          .bulk-att-page { margin: -16px -20px -24px; }
        }
        @media (max-width: 767px) {
          .bulk-att-page { margin: -12px -14px -20px; }
          .bulk-filters-container { flex-direction: column; align-items: stretch; }
          .bulk-filter-dropdown, .bulk-search-wrap, .bulk-date-cluster { width: 100%; max-width: none; }
        }
        @media (max-width: 640px) {
          .bulk-att-page { padding: 14px 14px 22px; }
          .bulk-filter-card, .bulk-action-card { padding: 12px 14px; }
        }
      `}</style>
    </div>
  );
}
