import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ChevronRight, ChevronDown, Search, Calendar as CalendarIcon, MoreHorizontal, X, Check, Clock, Eye, Pencil, UserCheck, UserX, FileText, FileSpreadsheet, FileDown } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { useAppStore } from "../../../stores/appStore";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import { attendanceEmployees } from "../../../data/hrms/mocks/attendanceExtended";
import { PageInfoButton } from "../../../components/common/PageInfoButton";
import { hrmsGuides } from "../../../data/hrms/hrmsGuides";
import Pagination from "../../../components/ui/Pagination";

const PAGE_SIZE = 8;

function formatClock(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

function durationLabel(minutes) {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

const MOCK_ATTENDANCE = [
  {
    id: "EMP1024",
    name: "Priya Patel",
    dept: "Engineering",
    checkIn: "09:02",
    checkOut: "18:04",
    workHours: "08:32",
    shift: "General",
    status: "Present",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "EMP1025",
    name: "Marcus Chen",
    dept: "Design",
    checkIn: "09:18",
    checkOut: "18:30",
    workHours: "08:42",
    shift: "General",
    status: "Late",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "EMP1026",
    name: "Liam Cooper",
    dept: "Engineering",
    checkIn: "—",
    checkOut: "—",
    workHours: "—",
    shift: "General",
    status: "Absent",
    img: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    id: "EMP1027",
    name: "Sarah Wilson",
    dept: "Marketing",
    checkIn: "09:00",
    checkOut: "17:55",
    workHours: "08:25",
    shift: "Flexible",
    status: "WFH",
    img: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    id: "EMP1028",
    name: "James Wilson",
    dept: "Finance",
    checkIn: "09:42",
    checkOut: "13:30",
    workHours: "03:48",
    shift: "General",
    status: "Half Day",
    img: "https://randomuser.me/api/portraits/men/54.jpg",
  },
  {
    id: "EMP1029",
    name: "Ayesha Khan",
    dept: "HR",
    checkIn: "—",
    checkOut: "—",
    workHours: "—",
    shift: "General",
    status: "On Leave",
    img: "https://randomuser.me/api/portraits/women/24.jpg",
  },
  {
    id: "EMP1030",
    name: "David Park",
    dept: "Engineering",
    checkIn: "09:05",
    checkOut: "18:10",
    workHours: "08:35",
    shift: "General",
    status: "Present",
    img: "https://randomuser.me/api/portraits/men/46.jpg",
  },
  {
    id: "EMP1031",
    name: "Chen Li",
    dept: "Operations",
    checkIn: "09:22",
    checkOut: "18:00",
    workHours: "08:08",
    shift: "Night",
    status: "Late",
    img: "https://randomuser.me/api/portraits/women/33.jpg",
  },
];

const DEPARTMENTS = ["All", "Engineering", "Design", "Marketing", "Finance", "HR", "Operations"];
const STATUSES = ["All", "Present", "Late", "Absent", "WFH", "Half Day", "On Leave"];
const SHIFTS = ["All", "General", "Flexible", "Night"];

const statusStyles = {
  Present: { background: "#e6f4ea", color: "#15803d", border: "#a7f3d0" },
  Late: { background: "#fef3c7", color: "#b45309", border: "#fde68a" },
  Absent: { background: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  WFH: { background: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  "Half Day": { background: "#f3e8ff", color: "#7e22ce", border: "#d8b4fe" },
  "On Leave": { background: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  "Early Out": { background: "#f3e8ff", color: "#7e22ce", border: "#d8b4fe" },
};

export default function AttendanceOverview() {
  const navigate = useNavigate();
  const setToast = useAppStore((s) => s.setToast || s.showToast);
  const storeEmployees = useAppStore((s) => s.employees || []);
  const storeRecords = useAttendanceStore((s) => s.records);
  const storePunchRecords = useAttendanceStore((s) => s.punchRecords);
  const addAttendanceRequest = useAttendanceStore((s) => s.addRequest);
  const updateStoreRecord = useAttendanceStore((s) => s.updateRecord);

  const [search, setSearch] = useState("");
  const [dateVal, setDateVal] = useState("2024-10-11");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [locFilter, setLocFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const [showRegModal, setShowRegModal] = useState(false);
  const [regEmp, setRegEmp] = useState("Priya Patel");
  const [regDate, setRegDate] = useState("2024-10-11");
  const [regReason, setRegReason] = useState("");
  const [regIn, setRegIn] = useState("09:00");
  const [regOut, setRegOut] = useState("18:00");

  // Actions dropdown state
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const menuRef = useRef(null);

  // Export format dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Close menus on outside click / Escape
  useEffect(() => {
    if (!openMenuId && !showExportMenu) return;
    const onDocClick = (e) => {
      const inRowMenu = menuRef.current && menuRef.current.contains(e.target);
      const inExportMenu = exportRef.current && exportRef.current.contains(e.target);
      if (!inRowMenu && !inExportMenu) {
        setOpenMenuId(null);
        setShowExportMenu(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenMenuId(null);
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId, showExportMenu]);

  // Normalize attendance records for table display
  const combinedAttendance = useMemo(() => {
    const base = storeRecords && storeRecords.length > 0
      ? storeRecords.map((r) => ({
          ...r,
          img: r.avatar || r.img || `https://i.pravatar.cc/100?u=${r.id || r.name}`,
          workHours: r.workHours || (r.checkIn && r.checkOut && r.checkIn !== "—" ? "08:30" : "—"),
          shift: r.shift || "General",
          location: r.location || (r.status === "WFH" ? "Remote" : "On-Site"),
          role: r.role || r.jobType || "Full-Time",
        }))
      : MOCK_ATTENDANCE.map((r) => ({
          ...r,
          location: r.location || (r.status === "WFH" ? "Remote" : "On-Site"),
          role: r.role || r.jobType || "Full-Time",
        }));

    const rowsById = new Map(base.map((r) => [r.id, { ...r }]));
    (storePunchRecords || []).forEach((p) => {
      if (!p.employeeId || !p.punchIn) return;
      const existing = rowsById.get(p.employeeId) || {
        id: p.employeeId,
        name: p.employeeName,
        dept: attendanceEmployees.find((e) => e.id === p.employeeId)?.dept || "General",
        img: attendanceEmployees.find((e) => e.id === p.employeeId)?.avatar || `https://i.pravatar.cc/100?u=${p.employeeId}`,
        location: p.branch || "On-Site",
        role: "Full-Time",
      };
      Object.assign(existing, {
        checkIn: formatClock(p.punchIn),
        checkOut: p.punchOut ? formatClock(p.punchOut) : "Ongoing",
        workHours: p.punchOut ? durationLabel(p.workingMinutes) : "Ongoing",
        shift: p.shift || existing.shift || "General",
        status: p.earlyOutMinutes > 0 ? "Early Out" : p.status,
      });
      rowsById.set(existing.id, existing);
    });
    return [...rowsById.values()];
  }, [storeRecords, storePunchRecords]);

  const filtered = useMemo(() => {
    return combinedAttendance.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.id && item.id.toLowerCase().includes(search.toLowerCase()));
      const matchDept = deptFilter === "All" || item.dept === deptFilter;
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      const matchShift = shiftFilter === "All" || item.shift === shiftFilter;
      const matchLoc = locFilter === "All" || item.location === locFilter;
      const matchRole = roleFilter === "All" || item.role === roleFilter;
      return matchSearch && matchDept && matchStatus && matchShift && matchLoc && matchRole;
    });
  }, [combinedAttendance, search, deptFilter, statusFilter, shiftFilter, locFilter, roleFilter]);

  // Reset to first page when filters/data change; clamp if list shrinks
  useEffect(() => {
    setPage(1);
  }, [search, deptFilter, statusFilter, shiftFilter, locFilter, roleFilter, combinedAttendance.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Dynamic live STATS
  const statsData = useMemo(() => {
    const total = combinedAttendance.length || 1;
    const presentCount = combinedAttendance.filter((r) => ["Present", "WFH", "Early Out"].includes(r.status)).length;
    const absentCount = combinedAttendance.filter((r) => r.status === "Absent").length;
    const lateCount = combinedAttendance.filter((r) => r.status === "Late").length;
    const leaveCount = combinedAttendance.filter((r) => r.status === "On Leave").length;
    const wfhCount = combinedAttendance.filter((r) => r.status === "WFH").length;
    const percent = Math.round((presentCount / total) * 100);
    const otMinutes = (storePunchRecords || []).reduce((acc, p) => acc + (p.overtimeMinutes || 0), 0);

    return [
      { label: "PRESENT", val: String(presentCount), sub: `${percent}% of staff`, dotColor: "#22c55e" },
      { label: "ABSENT", val: String(absentCount), sub: "Needs review", dotColor: "#ef4444" },
      { label: "LATE", val: String(lateCount), sub: "Grace 10 min", dotColor: "#f59e0b" },
      { label: "ON LEAVE", val: String(leaveCount), sub: "Approved leave", dotColor: "#3b82f6" },
      { label: "WFH", val: String(wfhCount), sub: "Remote active", dotColor: null },
      { label: "OVERTIME", val: durationLabel(otMinutes), sub: "Web tracked", dotColor: "#22c55e" },
    ];
  }, [combinedAttendance, storePunchRecords]);

  const handleClearFilters = () => {
    setSearch("");
    setDateVal("2024-10-11");
    setDeptFilter("All");
    setStatusFilter("All");
    setShiftFilter("All");
    setLocFilter("All");
    setRoleFilter("All");
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const escCsv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const handleExportCsv = () => {
    const header = ["Employee ID", "Name", "Department", "Check In", "Check Out", "Work Hours", "Shift", "Status"];
    const lines = [
      header.map(escCsv).join(","),
      ...filtered.map((r) =>
        [r.id, r.name, r.dept, r.checkIn, r.checkOut, r.workHours, r.shift, r.status].map(escCsv).join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `attendance-${dateVal}.csv`);
    setToast(`Attendance exported as CSV (${filtered.length} rows).`);
  };

  const handleExportExcel = () => {
    const escHtml = (v) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const cols = ["Employee ID", "Name", "Department", "Check In", "Check Out", "Work Hours", "Shift", "Status"];
    const bodyRows = filtered
      .map(
        (r) =>
          `<tr>${[r.id, r.name, r.dept, r.checkIn, r.checkOut, r.workHours, r.shift, r.status]
            .map((c) => `<td>${escHtml(c)}</td>`)
            .join("")}</tr>`
      )
      .join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${cols
      .map((c) => `<th>${escHtml(c)}</th>`)
      .join("")}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
    const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel" });
    downloadBlob(blob, `attendance-${dateVal}.xls`);
    setToast(`Attendance exported as Excel (${filtered.length} rows).`);
  };

  const pdfEscape = (v) => String(v ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const handleExportPdf = () => {
    // Minimal pure-JS PDF writer (no dependencies): A4 landscape, Helvetica, auto-paginated.
    const cols = [
      { label: "Employee ID", x: 40, w: 80 },
      { label: "Name", x: 120, w: 120 },
      { label: "Department", x: 240, w: 90 },
      { label: "Check In", x: 330, w: 60 },
      { label: "Check Out", x: 390, w: 65 },
      { label: "Work Hours", x: 455, w: 70 },
      { label: "Shift", x: 525, w: 70 },
      { label: "Status", x: 595, w: 90 },
    ];
    const pageW = 842;
    const pageH = 595;
    const topY = 545;
    const rowH = 18;
    const rowsPerPage = 24;
    const pages = [];
    for (let i = 0; i < Math.max(filtered.length, 1); i += rowsPerPage) {
      pages.push(filtered.slice(i, i + rowsPerPage));
    }
    const cellText = (t, x, y, size, bold) =>
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfEscape(t).slice(0, 60)}) Tj ET`;
    const contentStreams = pages.map((pageRows, pi) => {
      let s = "";
      s += `${cellText(`Attendance - ${dateVal}  (Page ${pi + 1}/${pages.length})`, 40, 570, 12, true)}\n`;
      cols.forEach((c) => {
        s += `${cellText(c.label, c.x, topY, 9, true)}\n`;
      });
      s += `0.8 0.8 0.8 RG 1 w 40 ${topY - 6} m 760 ${topY - 6} l S\n`;
      pageRows.forEach((r, ri) => {
        const y = topY - 22 - ri * rowH;
        const vals = [r.id, r.name, r.dept, r.checkIn, r.checkOut, r.workHours, r.shift, r.status];
        vals.forEach((v, ci) => {
          s += `${cellText(v, cols[ci].x, y, 8, false)}\n`;
        });
      });
      if (pageRows.length === 0) {
        s += `${cellText("No attendance records found matching filters.", 40, topY - 24, 9, false)}\n`;
      }
      return s;
    });

    // Build PDF objects: catalog(1) pages(2) font(3,4) + per-page page+content objects
    const objects = [];
    objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
    objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
    objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;
    let nextId = 5;
    const pageIds = [];
    const contentIds = [];
    contentStreams.forEach(() => {
      pageIds.push(nextId++);
      contentIds.push(nextId++);
    });
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    contentStreams.forEach((stream, i) => {
      const len = new TextEncoder().encode(stream).length;
      objects[contentIds[i]] = `<< /Length ${len} >>\nstream\n${stream}endstream`;
      objects[pageIds[i]] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentIds[i]} 0 R >>`;
    });
    const maxId = nextId - 1;
    let pdf = `%PDF-1.4\n`;
    const offsets = [0];
    for (let id = 1; id <= maxId; id++) {
      offsets[id] = new TextEncoder().encode(pdf).length;
      pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xrefPos = new TextEncoder().encode(pdf).length;
    pdf += `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= maxId; id++) {
      pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
    const blob = new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
    downloadBlob(blob, `attendance-${dateVal}.pdf`);
    setToast(`Attendance exported as PDF (${filtered.length} rows).`);
  };

  const handleExport = (format) => {
    if (format === "excel") return handleExportExcel();
    if (format === "pdf") return handleExportPdf();
    return handleExportCsv();
  };

  const handleRegularizeSubmit = () => {
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

  const handleQuickStatus = (row, nextStatus) => {
    // Explicit status set from the Actions menu. Falls back to cycling when no target given.
    const cycle = ["Present", "Late", "Half Day", "WFH", "On Leave", "Absent"];
    let target = nextStatus;
    if (!target) {
      const currIdx = cycle.indexOf(row.status);
      target = cycle[(currIdx + 1) % cycle.length];
    }
    updateStoreRecord(row.id, {
      status: target,
      checkIn: target === "Absent" || target === "On Leave" ? "—" : row.checkIn === "—" ? "09:00" : row.checkIn,
      checkOut: target === "Absent" || target === "On Leave" ? "—" : row.checkOut === "—" ? "18:00" : row.checkOut,
      workHours:
        target === "Absent" || target === "On Leave"
          ? "—"
          : row.workHours === "—"
            ? "08:30"
            : row.workHours,
    });
    setToast(`${row.name}'s status updated to ${target}.`);
    setOpenMenuId(null);
  };

  const handleRegularizeFor = (row) => {
    setRegEmp(row.name);
    setRegDate(dateVal);
    setOpenMenuId(null);
    setShowRegModal(true);
  };

  const handleViewDetails = (row) => {
    setViewRow(row);
    setOpenMenuId(null);
  };

  const handleEmployeeClick = (row) => {
    navigate(`/hrms/attendance/individual?emp=${encodeURIComponent(row.id)}`);
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="att-actions-wrap" ref={showExportMenu ? exportRef : null}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowExportMenu(!showExportMenu);
              }}
              className="att-export-btn"
              aria-haspopup="menu"
              aria-expanded={showExportMenu}
            >
              <Download size={15} /> Export <ChevronDown size={14} />
            </button>
            {showExportMenu && (
              <div className="att-menu att-export-menu" role="menu">
                <button
                  type="button"
                  className="att-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExport("csv");
                  }}
                >
                  <FileText size={14} /> CSV (.csv)
                </button>
                <button
                  type="button"
                  className="att-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExport("excel");
                  }}
                >
                  <FileSpreadsheet size={14} /> Excel (.xls)
                </button>
                <button
                  type="button"
                  className="att-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExport("pdf");
                  }}
                >
                  <FileDown size={14} /> PDF (.pdf)
                </button>
              </div>
            )}
          </div>
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
        </div>
      </div>

      {/* Main Table Card */}
      <div className="att-card att-main-card">
        <div style={{ overflowX: "auto" }}>
          <table className="att-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>EMPLOYEE ID</th>
                <th>DEPARTMENT</th>
                <th>CHECK IN</th>
                <th>CHECK OUT</th>
                <th>WORK HOURS</th>
                <th>SHIFT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img
                        src={row.img}
                        alt={row.name}
                        className="att-avatar att-avatar-clickable"
                        loading="lazy"
                        onClick={() => handleEmployeeClick(row)}
                        title={`View ${row.name}'s attendance`}
                      />
                      <button
                        type="button"
                        className="att-emp-link"
                        onClick={() => handleEmployeeClick(row)}
                        title={`View ${row.name}'s attendance`}
                      >
                        {row.name}
                      </button>
                    </div>
                  </td>
                  <td className="att-id">{row.id}</td>
                  <td style={{ color: "#374151" }}>{row.dept}</td>
                  <td className="att-time">{row.checkIn}</td>
                  <td className="att-time">{row.checkOut}</td>
                  <td className="att-time">{row.workHours}</td>
                  <td>
                    <span className="att-shift-pill">{row.shift}</span>
                  </td>
                  <td>
                    <span className="att-status" style={{ ...statusStyles[row.status] }}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div
                      className="att-actions-wrap"
                      ref={openMenuId === row.id ? menuRef : null}
                    >
                      <button
                        type="button"
                        className="att-dots-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === row.id ? null : row.id);
                        }}
                        title="Row actions"
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === row.id}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                      {openMenuId === row.id && (
                        <div className="att-menu" role="menu">
                          <button type="button" className="att-menu-item" onClick={() => handleViewDetails(row)} role="menuitem">
                            <Eye size={14} /> View Details
                          </button>
                          <button type="button" className="att-menu-item" onClick={() => handleRegularizeFor(row)} role="menuitem">
                            <Pencil size={14} /> Regularize
                          </button>
                          <div className="att-menu-sep" />
                          <button type="button" className="att-menu-item" onClick={() => handleQuickStatus(row, "Present")} role="menuitem">
                            <UserCheck size={14} /> Mark Present
                          </button>
                          <button type="button" className="att-menu-item" onClick={() => handleQuickStatus(row, "Late")} role="menuitem">
                            <Clock size={14} /> Mark Late
                          </button>
                          <button type="button" className="att-menu-item" onClick={() => handleQuickStatus(row, "WFH")} role="menuitem">
                            <Check size={14} /> Mark WFH
                          </button>
                          <button type="button" className="att-menu-item att-menu-danger" onClick={() => handleQuickStatus(row, "Absent")} role="menuitem">
                            <UserX size={14} /> Mark Absent
                          </button>
                        </div>
                      )}
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
        <div className="att-pagination-footer">
          <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
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
              {combinedAttendance.map((e) => (
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

      {/* View Details Modal */}
      <Modal
        isOpen={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        title={viewRow ? `Attendance — ${viewRow.name}` : "Attendance Details"}
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setViewRow(null)}>
              Close
            </button>
            {viewRow && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const row = viewRow;
                  setViewRow(null);
                  handleRegularizeFor(row);
                }}
              >
                Regularize
              </button>
            )}
          </>
        }
      >
        {viewRow && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={viewRow.img} alt={viewRow.name} style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover" }} />
              <div>
                <div style={{ fontWeight: 700, color: "#111827" }}>{viewRow.name}</div>
                <div style={{ fontSize: 12.5, color: "#6b7280" }}>{viewRow.id} • {viewRow.dept}</div>
              </div>
              <span className="att-status" style={{ marginLeft: "auto", ...statusStyles[viewRow.status] }}>
                {viewRow.status}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, color: "#334155" }}>
              <div><strong>Check In:</strong> {viewRow.checkIn}</div>
              <div><strong>Check Out:</strong> {viewRow.checkOut}</div>
              <div><strong>Work Hours:</strong> {viewRow.workHours}</div>
              <div><strong>Shift:</strong> {viewRow.shift}</div>
              <div><strong>Date:</strong> {dateVal}</div>
              <div><strong>Location:</strong> {viewRow.location || "—"}</div>
            </div>
          </div>
        )}
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
        .att-avatar-clickable { cursor: pointer; }
        .att-avatar-clickable:hover { opacity: 0.85; }
        .att-emp-link { border: none; background: transparent; padding: 0; font-weight: 600; color: #111827; white-space: nowrap; font-size: 13.5px; cursor: pointer; }
        .att-emp-link:hover { color: #1d4ed8; text-decoration: underline; }
        .att-id { font-family: inherit; font-size: 12.5px; color: #6b7280; white-space: nowrap; }
        .att-time { font-family: inherit; font-size: 13px; font-weight: 500; color: #334155; white-space: nowrap; }
        .att-shift-pill { display: inline-block; font-size: 12px; font-weight: 500; color: #374151; background: #f3f4f6; border-radius: 999px; padding: 3px 12px; white-space: nowrap; }
        .att-status { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 4px 13px; border: 1px solid; white-space: nowrap; }
        .att-dots-btn { border: 1px solid transparent; background: #f8fafc; color: #6b7280; cursor: pointer; padding: 5px 7px; border-radius: 8px; display: grid; place-items: center; }
        .att-dots-btn:hover { color: #111827; background: #eef2f7; border-color: #e2e8f0; }
        .att-actions-wrap { position: relative; display: inline-block; }
        .att-menu { position: absolute; right: 0; top: calc(100% + 6px); min-width: 180px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 12px 28px rgba(15,23,42,0.12); padding: 6px; z-index: 50; }
        .att-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; border: none; background: transparent; text-align: left; font-size: 13px; font-weight: 500; color: #334155; padding: 8px 10px; border-radius: 8px; cursor: pointer; white-space: nowrap; }
        .att-menu-item:hover { background: #f1f5f9; color: #0f172a; }
        .att-menu-danger { color: #dc2626; }
        .att-menu-danger:hover { background: #fef2f2; color: #b91c1c; }
        .att-menu-sep { height: 1px; background: #f1f5f9; margin: 5px 4px; }
        .att-pagination-footer { border-top: 1px solid #f1f5f9; padding: 6px 20px 6px 8px; background: #fff; }

        @media (max-width: 1200px) {
          .att-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .att-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .att-mgmt-page { padding: 14px 14px 22px; }
        }
      `}</style>
    </div>
  );
}
