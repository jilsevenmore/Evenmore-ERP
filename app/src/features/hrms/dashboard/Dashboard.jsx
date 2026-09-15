import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  CheckCircle2,
  Plane,
  Briefcase,
  ShieldCheck,
  UserPlus,
  ClipboardCheck,
  CalendarDays,
  Calendar as CalendarIcon,
  Download,
  X,
  Zap,
  ChevronRight,
  Plus,
  FileText,
  Check,
  Bell,
  CheckCheck,
  Search,
  Trash2,
  RefreshCw,
  Settings,
  Laptop,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Modal from "../../../components/ui/Modal";
import { useAppStore } from "../../../stores/appStore";
import { useAssetStore } from "../../../stores/assetStore";
import AnalyticsVolumeChart from "./AnalyticsVolumeChart";

const TOP_STATS = [
  {
    label: "Total Employees",
    value: "1,248",
    badge: "+4.2%",
    badgeTone: "green",
    sub: "32 joined this quarter",
    Icon: Users,
  },
  {
    label: "Present Today",
    value: "1,102",
    badge: "94.2%",
    badgeTone: "green",
    sub: "Active on-site & remote",
    Icon: CheckCircle2,
  },
  {
    label: "On Leave",
    value: "34",
    badge: "4 pending",
    badgeTone: "amber",
    sub: "Across teams",
    Icon: Plane,
  },
  {
    label: "Open Positions",
    value: "24",
    badge: "4 closing soon",
    badgeTone: "blue",
    sub: "142 active candidates",
    Icon: Briefcase,
  },
];

const BOTTOM_STATS = [
  { label: "Active Employees", value: "1,102", sub: "94% active", Icon: ShieldCheck },
  { label: "New Joiners", value: "32", sub: "This month", Icon: UserPlus },
  { label: "Pending Approvals", value: "12", sub: "Awaiting action", Icon: ClipboardCheck },
  { label: "Upcoming Events", value: "6", sub: "This week", Icon: CalendarDays },
];

const INITIAL_SCHEDULE = [
  {
    time: "09:30 AM",
    name: "Marcus Chen",
    dept: "Core Infrastructure",
    event: "Technical Interview",
    category: "Interviews",
    status: "Confirmed",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    time: "11:00 AM",
    name: "Elena Rostova",
    dept: "Global Marketing",
    event: "First Day Onboarding",
    category: "Onboarding",
    status: "In Progress",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    time: "02:15 PM",
    name: "Tariq Al-Mansoor",
    dept: "People Ops",
    event: "Quarterly Performance",
    category: "Reviews",
    status: "Scheduled",
    img: "https://randomuser.me/api/portraits/men/54.jpg",
  },
  {
    time: "04:00 PM",
    name: "Sophia Lindqvist",
    dept: "Design System",
    event: "Role Realignment",
    category: "Reviews",
    status: "Confirmed",
    img: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

const ACTIVITY_KEY = "hrms_recent_activity_v1";

const MODULE_META = {
  "Leave Management": { Icon: Plane, bg: "#fef3c7", fg: "#b45309" },
  Performance: { Icon: ClipboardCheck, bg: "#dcfce7", fg: "#15803d" },
  "HR Admin": { Icon: UserPlus, bg: "#dbeafe", fg: "#1d4ed8" },
  "Payroll Core": { Icon: Briefcase, bg: "#f3e8ff", fg: "#7c3aed" },
  Schedule: { Icon: CalendarDays, bg: "#e0f2fe", fg: "#0369a1" },
  "Asset & IT": { Icon: Laptop, bg: "#e0e7ff", fg: "#4338ca" },
  System: { Icon: Zap, bg: "#f1f5f9", fg: "#475569" },
};

const REQUEST_TYPES_KEY = "hrms_quick_request_types_v2";

const DEFAULT_REQUEST_TYPES = [
  "Casual Leave",
  "Sick / Medical Leave",
  "Annual / Earned Leave",
  "Work From Home (WFH)",
  "Attendance Regularization",
  "Asset Request (Hardware / Laptop / Accessories)",
  "Software & Tool License Request",
  "Expense Reimbursement",
  "Travel & Conveyance Request",
  "Document & Bonafide Certificate",
  "Shift Change Request",
  "Overtime Approval",
  "Training & Upskilling Request",
  "HR Grievance / Query",
  "Resignation / Separation Request",
];

function loadRequestTypes() {
  try {
    const raw = localStorage.getItem(REQUEST_TYPES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_REQUEST_TYPES;
}

function timeAgo(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function seedActivities() {
  const now = Date.now();
  const min = 60 * 1000;
  return [
    { id: "a1", actor: "Priya Patel", action: "requested 3 days annual leave.", module: "Leave Management", ts: now - 12 * min, read: false },
    { id: "a2", actor: "Liam Cooper", action: "submitted Q3 evaluation.", module: "Performance", ts: now - 45 * min, read: false },
    { id: "a3", actor: "Samantha Reed", action: "New hire badge created.", module: "HR Admin", ts: now - 2 * 60 * min, read: true },
    { id: "a4", actor: "Financial Ops", action: "Payroll batch verified.", module: "Payroll Core", ts: now - 3 * 60 * min, read: true },
  ];
}

function loadActivities() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  return seedActivities();
}

const ACTIVITY = seedActivities().map((a) => ({
  name: a.actor,
  text: a.action,
  when: `${timeAgo(a.ts)} · ${a.module}`,
}));

const badgeStyles = {
  green: { background: "#dcfce7", color: "#15803d" },
  amber: { background: "#fef3c7", color: "#b45309" },
  blue: { background: "#dbeafe", color: "#1d4ed8" },
};

const statusStyles = {
  Confirmed: { background: "#e6f4ea", color: "#15803d", border: "#a7f3d0" },
  "In Progress": { background: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Scheduled: { background: "#fef3c7", color: "#b45309", border: "#fde68a" },
};

function StatCard({ label, value, badge, badgeTone, sub, Icon }) {
  return (
    <div className="hrms-stat-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12.5, color: "#6b7a90", fontWeight: 500 }}>{label}</span>
        {Icon && <Icon size={17} style={{ color: "#5b6b82" }} strokeWidth={1.8} />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <strong style={{ fontSize: 26, fontWeight: 800, color: "#111f36", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {value}
        </strong>
        {badge && (
          <span className="hrms-pill" style={{ ...badgeStyles[badgeTone] }}>
            {badge}
          </span>
        )}
      </div>
      <p style={{ margin: "7px 0 0", fontSize: 12, color: "#6b7a90" }}>{sub}</p>
    </div>
  );
}

export default function HRMSDashboard() {
  const setToast = useAppStore((s) => s.setToast);

  const [filter, setFilter] = useState("All");
  const [showNotice, setShowNotice] = useState(true);
  const [scheduleItems, setScheduleItems] = useState(INITIAL_SCHEDULE);

  // Date range filter state
  const [dateRangeLabel, setDateRangeLabel] = useState("Oct 1 – Oct 31, 2024");
  const [showDateModal, setShowDateModal] = useState(false);
  const [customStart, setCustomStart] = useState("2024-10-01");
  const [customEnd, setCustomEnd] = useState("2024-10-31");

  // Add record state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    name: "",
    dept: "Core Infrastructure",
    event: "",
    category: "Interviews",
    time: "05:00 PM",
    status: "Confirmed",
  });

  // Handover notes state
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  // Quick request form & configurable types
  const [requestTypes, setRequestTypes] = useState(loadRequestTypes);
  const [showManageTypesModal, setShowManageTypesModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [leaveType, setLeaveType] = useState(() => {
    const list = loadRequestTypes();
    return list[0] || "Casual Leave";
  });
  const [leaveDate, setLeaveDate] = useState("2024-10-15");
  const [leaveNote, setLeaveNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(REQUEST_TYPES_KEY, JSON.stringify(requestTypes));
    } catch {}
  }, [requestTypes]);

  // Recent Activity — working, minimal, user-friendly
  const [activities, setActivities] = useState(loadActivities);
  const [activityTab, setActivityTab] = useState("All");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [activityQuery, setActivityQuery] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities.slice(0, 50)));
    } catch {}
  }, [activities]);

  // Re-render relative timestamps every minute
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const pushActivity = (actor, action, module) => {
    setActivities((prev) =>
      [{ id: `a${Date.now()}`, actor, action, module, ts: Date.now(), read: false }, ...prev].slice(0, 50)
    );
  };

  const activityModules = useMemo(
    () => ["All", ...Array.from(new Set(activities.map((a) => a.module)))],
    [activities]
  );
  const unreadCount = activities.filter((a) => !a.read).length;
  const visibleActivities = useMemo(() => {
    return activities.slice(0, 5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, tick]);
  const modalActivities = useMemo(() => {
    const q = activityQuery.trim().toLowerCase();
    return activities.filter((a) => {
      const matchTab = activityTab === "All" || a.module === activityTab;
      const matchQ = !q || `${a.actor} ${a.action} ${a.module}`.toLowerCase().includes(q);
      return matchTab && matchQ;
    });
  }, [activities, activityTab, activityQuery]);

  const markAllRead = () => setActivities((prev) => prev.map((a) => ({ ...a, read: true })));
  const markOneRead = (id) => setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  const removeActivity = (id) => setActivities((prev) => prev.filter((a) => a.id !== id));
  const clearActivities = () => setActivities([]);
  const resetActivities = () => {
    const seed = seedActivities();
    setActivities(seed);
    setActivityTab("All");
    setActivityQuery("");
  };

  const handleAddRequestType = (e) => {
    e?.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) {
      return setToast("Please enter a request type name.", "error");
    }
    if (requestTypes.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      return setToast("This request type already exists.", "error");
    }
    setRequestTypes((prev) => [...prev, trimmed]);
    setLeaveType(trimmed);
    setNewTypeName("");
    setToast(`Added "${trimmed}" to request types.`);
  };

  const handleRemoveRequestType = (typeToRemove) => {
    if (requestTypes.length <= 1) {
      return setToast("You must keep at least one request type.", "error");
    }
    const updated = requestTypes.filter((t) => t !== typeToRemove);
    setRequestTypes(updated);
    if (leaveType === typeToRemove) {
      setLeaveType(updated[0] || "");
    }
    setToast(`Removed "${typeToRemove}".`);
  };

  const handleResetRequestTypes = () => {
    setRequestTypes(DEFAULT_REQUEST_TYPES);
    setLeaveType(DEFAULT_REQUEST_TYPES[0]);
    setToast("Request types reset to default list.");
  };

  const handleSelectRequestType = (e) => {
    const val = e.target.value;
    if (val === "__manage__") {
      setShowManageTypesModal(true);
      return;
    }
    setLeaveType(val);
  };

  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const [lastSubmittedAssetReqId, setLastSubmittedAssetReqId] = useState(null);

  const handleQuickRequest = () => {
    if (!leaveDate) return setToast("Please pick a date for your request.", "error");
    if (!leaveType) return setToast("Please select a request type.", "error");
    setSubmitted(true);
    const lower = leaveType.toLowerCase();
    const isAsset =
      lower.includes("asset") ||
      lower.includes("software") ||
      lower.includes("hardware") ||
      lower.includes("laptop") ||
      lower.includes("monitor") ||
      lower.includes("equipment") ||
      lower.includes("tool") ||
      lower.includes("peripherals");

    const mod = lower.includes("leave") || lower.includes("wfh") || lower.includes("attendance")
      ? "Leave Management"
      : isAsset
      ? "Asset & IT"
      : lower.includes("expense") || lower.includes("payroll") || lower.includes("reimburse")
      ? "Payroll Core"
      : "HR Admin";

    // If it's an asset-related request, register it directly in useAssetStore
    if (isAsset) {
      const category =
        lower.includes("laptop") ? "Laptop"
        : lower.includes("monitor") ? "Monitor"
        : lower.includes("software") || lower.includes("license") ? "Software / License"
        : lower.includes("phone") || lower.includes("mobile") ? "Mobile"
        : lower.includes("headphone") || lower.includes("peripheral") ? "Audio / Peripherals"
        : "Workstation";

      const newReq = useAssetStore.getState().addRequest({
        employeeName: currentUser?.name || "Adarsh Gupta",
        employeeId: "EMP-USR",
        dept: "Operations",
        category,
        assetName: leaveType,
        reason: leaveNote.trim() || `Submitted via HRMS Dashboard Quick Request for ${leaveDate}.`,
        priority: "Medium",
        requestedDate: leaveDate,
        source: "HRMS Dashboard",
        notes: `Quick Request submitted on ${leaveDate}`,
      });
      setLastSubmittedAssetReqId(newReq.id);
    } else {
      setLastSubmittedAssetReqId(null);
    }

    pushActivity("You", `requested ${leaveType} for ${leaveDate.split("-").reverse().join("-")}.`, mod);
    setToast(`${leaveType} request submitted for approval!`);
    setLeaveNote("");
    setTimeout(() => {
      setSubmitted(false);
      setLastSubmittedAssetReqId(null);
    }, 5000);
  };

  const TABS = ["All", "Interviews", "Onboarding", "Reviews"];
  const filtered = filter === "All" ? scheduleItems : scheduleItems.filter((r) => r.category === filter);

  const handleExport = () => {
    const header = "Time,Name,Department,Event,Status";
    const rows = filtered.map((r) =>
      [r.time, r.name, r.dept, r.event, r.status].map((v) => `"${v}"`).join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedule.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Schedule exported as CSV.");
  };

  const handleAddRecordSubmit = () => {
    if (!newRecord.name || !newRecord.event) {
      return setToast("Please fill in candidate/employee name and event type.", "error");
    }
    const created = {
      time: newRecord.time || "05:00 PM",
      name: newRecord.name,
      dept: newRecord.dept,
      event: newRecord.event,
      category: newRecord.category,
      status: newRecord.status,
      img: `https://randomuser.me/api/portraits/${scheduleItems.length % 2 === 0 ? "women" : "men"}/${(scheduleItems.length * 9) % 80}.jpg`,
    };
    setScheduleItems((prev) => [created, ...prev]);
    pushActivity("You", `scheduled "${created.event}" with ${created.name}.`, "Schedule");
    setToast(`Record for ${newRecord.name} added to schedule!`);
    setShowAddModal(false);
    setNewRecord({
      name: "",
      dept: "Core Infrastructure",
      event: "",
      category: "Interviews",
      time: "05:00 PM",
      status: "Confirmed",
    });
  };

  const handleApplyDateRange = (label) => {
    setDateRangeLabel(label);
    setShowDateModal(false);
    setToast(`Dashboard filter updated: ${label}`);
  };

  return (
    <div className="hrms-dash">
      {/* Breadcrumb */}
      <nav className="hrms-crumb">
        <span style={{ cursor: "pointer" }}>Home</span>
        <ChevronRight size={13} style={{ color: "#9aa7bd" }} />
        <span style={{ color: "#111f36", fontWeight: 600 }}>Dashboard</span>
      </nav>

      {/* Title row */}
      <div className="hrms-title-row">
        <h1 className="hrms-title">Dashboard Overview</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowDateModal(true)}
            className="hrms-date-btn"
            title="Click to select date range"
          >
            <CalendarIcon size={15} style={{ color: "#475569" }} />
            {dateRangeLabel}
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="hrms-add-btn"
          >
            + Add Record
          </button>
        </div>
      </div>

      {/* Delegation notice */}
      {showNotice && (
        <div className="hrms-notice">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <UserCheck size={17} style={{ color: "#475569" }} />
            <span>
              <strong>Delegation Notice:</strong> You&apos;re covering for Ayesha Khan until Oct 14 —{" "}
              <u
                style={{ cursor: "pointer", fontWeight: 600 }}
                onClick={() => setShowHandoverModal(true)}
              >
                View handover notes →
              </u>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowNotice(false)}
            aria-label="Dismiss notice"
            className="hrms-notice-x"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Stat grids */}
      <div className="hrms-stat-grid">
        {TOP_STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
      <div className="hrms-stat-grid" style={{ marginBottom: 18 }}>
        {BOTTOM_STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Analytics Volume Chart (Workforce, Attendance, Leave, Payroll, etc.) */}
      <AnalyticsVolumeChart />

      {/* Main grid */}
      <div className="hrms-main-grid">
        {/* Schedule */}
        <div className="hrms-card" style={{ overflow: "hidden", minHeight: 560 }}>
          <div className="hrms-card-head">
            <div>
              <h3 className="hrms-h3">Today&apos;s Schedule &amp; Meetings</h3>
              <p className="hrms-sub">8 sessions scheduled for Wednesday, Oct 11</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div className="hrms-tabs">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilter(t)}
                    className={filter === t ? "hrms-tab active" : "hrms-tab"}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button type="button" onClick={handleExport} className="hrms-export">
                <Download size={14} /> Export
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="hrms-table">
              <thead>
                <tr>
                  {["TIME", "CANDIDATE / EMPLOYEE", "DEPARTMENT", "EVENT TYPE", "STATUS"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.name}>
                    <td className="hrms-time">{row.time}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src={row.img}
                          alt={row.name}
                          width={30}
                          height={30}
                          className="hrms-avatar"
                          loading="lazy"
                        />
                        <span style={{ fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap" }}>{row.name}</span>
                      </div>
                    </td>
                    <td className="hrms-dept">{row.dept}</td>
                    <td>
                      <span className="hrms-event">{row.event}</span>
                    </td>
                    <td>
                      <span className="hrms-status" style={{ ...statusStyles[row.status] }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          {/* Recent Activity — live, minimal */}
          <div className="hrms-card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 className="hrms-h3" style={{ fontSize: 15.5, display: "flex", alignItems: "center", gap: 8 }}>
                Recent Activity
                {unreadCount > 0 && <span className="hrms-unread">{unreadCount} new</span>}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {unreadCount > 0 && (
                  <button type="button" className="hrms-iconbtn" title="Mark all as read" onClick={markAllRead}>
                    <CheckCheck size={15} />
                  </button>
                )}
                <button type="button" className="hrms-viewall" onClick={() => setShowAllActivity(true)}>
                  View All
                </button>
              </div>
            </div>

            <div style={{ position: "relative", paddingLeft: 2, marginTop: 6 }}>
              <div className="hrms-timeline-line" />
              <div style={{ display: "grid", gap: 14 }}>
                {visibleActivities.length === 0 && (
                  <div className="hrms-aempty">
                    <Bell size={18} style={{ color: "#94a3b8" }} />
                    <p>No activity yet. New leave requests, schedules and updates will appear here.</p>
                    <button type="button" className="hrms-export" onClick={resetActivities}>
                      <RefreshCw size={13} /> Restore sample
                    </button>
                  </div>
                )}
                {visibleActivities.map((a) => {
                  const meta = MODULE_META[a.module] || MODULE_META.System;
                  const MIcon = meta.Icon;
                  return (
                    <div
                      key={a.id}
                      className="hrms-arow"
                      onClick={() => {
                        markOneRead(a.id);
                        if (a.module === "Asset & IT") {
                          navigate("/hrms/assets?tab=requests");
                        }
                      }}
                      title={a.module === "Asset & IT" ? "Click to view Asset Requests" : "Click to mark as read"}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="hrms-aicon" style={{ background: meta.bg, color: meta.fg }}>
                        <MIcon size={14} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.45 }}>
                          <strong style={{ color: "#16233a" }}>{a.actor}</strong> {a.action}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#7b8aa0", display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{timeAgo(a.ts)} · {a.module}</span>
                          {!a.read && <span className="hrms-bluedot" />}
                          {a.module === "Asset & IT" && (
                            <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>→ View</span>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="hrms-ax"
                        aria-label="Dismiss"
                        onClick={(e) => { e.stopPropagation(); removeActivity(a.id); }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            {activities.length > 5 && (
              <button type="button" className="hrms-afull" onClick={() => setShowAllActivity(true)}>
                View all {activities.length} updates →
              </button>
            )}
          </div>

          {/* Quick Request */}
          <div className="hrms-card" style={{ padding: "18px 20px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 className="hrms-h3" style={{ fontSize: 15.5, display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={16} style={{ color: "#334155" }} /> Quick Request
              </h3>
              <button
                type="button"
                onClick={() => setShowManageTypesModal(true)}
                className="hrms-manage-pill-btn"
                title="HR Admin: Add or remove request types"
              >
                <Settings size={12} /> Manage Types
              </button>
            </div>
            <select
              value={leaveType}
              onChange={handleSelectRequestType}
              className="hrms-input hrms-select"
              aria-label="Select request type"
            >
              {requestTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              <option value="__manage__" style={{ color: "#2563eb", fontWeight: 600 }}>
                ⚙ + Manage / Edit Types (HR)...
              </option>
            </select>
            <div className="hrms-input hrms-date-wrap">
              <span>{leaveDate.split("-").reverse().join(" - ").replaceAll(" - ", "-")}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 0, position: "relative" }}>
                <CalendarIcon size={14} style={{ color: "#334155", pointerEvents: "none" }} />
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => e.target.value && setLeaveDate(e.target.value)}
                  className="hrms-date-native"
                  aria-label="Select date"
                />
              </span>
            </div>
            <textarea
              value={leaveNote}
              onChange={(e) => setLeaveNote(e.target.value)}
              placeholder="Provide brief context..."
              rows={4}
              className="hrms-input hrms-area"
            />
            <button type="button" onClick={handleQuickRequest} className="hrms-submit">
              {submitted ? "Request Submitted ✓" : "Submit Request"}
            </button>
            {submitted && (
              <div style={{ margin: "8px 0 0", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#059669", fontWeight: 500 }}>
                  {leaveType} for {leaveDate} sent for approval.
                </p>
                {lastSubmittedAssetReqId && (
                  <Link
                    to="/hrms/assets?tab=requests"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 4,
                      fontSize: 11.5,
                      color: "#2563eb",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    View in Asset Setup & Requests ({lastSubmittedAssetReqId}) →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Range Modal */}
      <Modal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        title="Select Date Range"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setShowDateModal(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleApplyDateRange(`${customStart} – ${customEnd}`)}
            >
              Apply Custom Range
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 16 }}>
          <label className="form-label">Preset Ranges:</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: 13, textAlign: "left", justifyContent: "flex-start" }}
              onClick={() => handleApplyDateRange("Oct 1 – Oct 31, 2024")}
            >
              Oct 1 – Oct 31, 2024 (This Month)
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: 13, textAlign: "left", justifyContent: "flex-start" }}
              onClick={() => handleApplyDateRange("Sep 1 – Sep 30, 2024")}
            >
              Sep 1 – Sep 30, 2024 (Last Month)
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: 13, textAlign: "left", justifyContent: "flex-start" }}
              onClick={() => handleApplyDateRange("Q4 2024 (Oct – Dec)")}
            >
              Q4 2024 (Oct – Dec)
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: 13, textAlign: "left", justifyContent: "flex-start" }}
              onClick={() => handleApplyDateRange("Year 2024")}
            >
              Year 2024
            </button>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "4px 0" }} />

          <label className="form-label">Custom Range:</label>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Record Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Schedule / Meeting Record"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleAddRecordSubmit}>
              + Add Record
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Candidate / Employee Name <span className="required">*</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. Marcus Chen"
                value={newRecord.name}
                onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={newRecord.dept}
                onChange={(e) => setNewRecord({ ...newRecord, dept: e.target.value })}
              >
                <option>Core Infrastructure</option>
                <option>Global Marketing</option>
                <option>People Ops</option>
                <option>Design System</option>
                <option>Engineering</option>
                <option>Finance</option>
                <option>HR</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Event Type <span className="required">*</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. Technical Interview"
                value={newRecord.event}
                onChange={(e) => setNewRecord({ ...newRecord, event: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category Filter</label>
              <select
                className="form-select"
                value={newRecord.category}
                onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
              >
                <option>Interviews</option>
                <option>Onboarding</option>
                <option>Reviews</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                className="form-input"
                placeholder="e.g. 05:00 PM"
                value={newRecord.time}
                onChange={(e) => setNewRecord({ ...newRecord, time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={newRecord.status}
                onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
              >
                <option>Confirmed</option>
                <option>In Progress</option>
                <option>Scheduled</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Handover Notes Modal */}
      <Modal
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        title="Delegation Handover Notes — Ayesha Khan"
        footer={
          <button type="button" className="btn-primary" onClick={() => setShowHandoverModal(false)}>
            Acknowledge &amp; Close
          </button>
        }
      >
        <div style={{ display: "grid", gap: 14, fontSize: "13.5px", color: "#334155" }}>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 12 }}>
            <strong style={{ color: "#1e40af" }}>Delegation Period:</strong> Oct 1, 2024 – Oct 14, 2024
            <br />
            <span style={{ fontSize: 12.5, color: "#3b82f6" }}>
              Covering Manager: Current User (HR Ops Lead)
            </span>
          </div>

          <div>
            <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Key Responsibilities Delegated:
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
              <li>Approve pending annual &amp; casual leave requests for People Ops team.</li>
              <li>Conduct final round onboarding reviews for Q4 new joiners.</li>
              <li>Verify attendance regularization requests prior to payroll cutoff (Oct 12).</li>
              <li>Escalate critical grievances directly to Head of HR.</li>
            </ul>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
            <strong style={{ color: "#111827" }}>Emergency Contact:</strong>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              Email: ayesha.k@evenmore.in | Slack: @ayesha_hr (Urgent escalations only)
            </p>
          </div>
        </div>
      </Modal>

      {/* Recent Activity — View All */}
      <Modal
        isOpen={showAllActivity}
        onClose={() => setShowAllActivity(false)}
        title={`Recent Activity (${modalActivities.length})`}
        footer={
          <>
            <button type="button" className="btn-outline" onClick={clearActivities} disabled={activities.length === 0}>
              Clear all
            </button>
            <button type="button" className="btn-primary" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all read
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "#94a3b8" }} />
              <input
                className="form-input"
                style={{ paddingLeft: 30 }}
                placeholder="Search activity…"
                value={activityQuery}
                onChange={(e) => setActivityQuery(e.target.value)}
              />
            </div>
            <select className="form-select" style={{ maxWidth: 160 }} value={activityTab} onChange={(e) => setActivityTab(e.target.value)}>
              {activityModules.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gap: 10, maxHeight: 380, overflowY: "auto" }}>
            {modalActivities.length === 0 && (
              <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: 16 }}>
                No matching activity.
              </p>
            )}
            {modalActivities.map((a) => {
              const meta = MODULE_META[a.module] || MODULE_META.System;
              const MIcon = meta.Icon;
              return (
                <div
                  key={a.id}
                  className="hrms-arow"
                  style={{ background: a.read ? "#fff" : "#f8fafc", cursor: "pointer" }}
                  onClick={() => {
                    markOneRead(a.id);
                    if (a.module === "Asset & IT") {
                      setShowAllActivity(false);
                      navigate("/hrms/assets?tab=requests");
                    }
                  }}
                  title={a.module === "Asset & IT" ? "Click to view Asset Requests" : "Click to mark as read"}
                >
                  <span className="hrms-aicon" style={{ background: meta.bg, color: meta.fg }}>
                    <MIcon size={14} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
                      <strong style={{ color: "#16233a" }}>{a.actor}</strong> {a.action}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#7b8aa0" }}>
                      {timeAgo(a.ts)} · {a.module} {!a.read && "· Unread"}
                      {a.module === "Asset & IT" && (
                        <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600, marginLeft: 6 }}>→ View</span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="hrms-ax"
                    aria-label="Remove"
                    onClick={(e) => { e.stopPropagation(); removeActivity(a.id); }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Manage Request Types Modal (HR) */}
      <Modal
        isOpen={showManageTypesModal}
        onClose={() => setShowManageTypesModal(false)}
        title="Manage Quick Request Types (HR)"
        footer={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: 12.5 }}
              onClick={handleResetRequestTypes}
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowManageTypesModal(false)}
            >
              Done
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
            Customize the list of requests available to employees and managers. You can add new custom request types or remove existing ones.
          </p>

          {/* Add New Type Form */}
          <form
            onSubmit={handleAddRequestType}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="e.g. Relocation Assistance, Maternity / Paternity Leave..."
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ whiteSpace: "nowrap", padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Plus size={15} /> Add Type
            </button>
          </form>

          {/* List of Types */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Configured Request Types ({requestTypes.length})
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gap: 6,
                maxHeight: 280,
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: 8,
                background: "#f8fafc",
              }}
            >
              {requestTypes.map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "8px 12px",
                    background: "#ffffff",
                    border: "1px solid #edf2f7",
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequestType(t)}
                    title={`Delete "${t}"`}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: 4,
                      borderRadius: 6,
                      display: "grid",
                      placeItems: "center",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                      e.currentTarget.style.backgroundColor = "#fee2e2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#94a3b8";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        .hrms-dash { background: #f7f9fc; margin: -24px -28px -40px; padding: 18px 26px 28px; min-height: calc(100vh - 62px); }
        .hrms-manage-pill-btn { display: inline-flex; align-items: center; gap: 5px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 999px; padding: 4px 10px; font-size: 11.5px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.15s ease; }
        .hrms-manage-pill-btn:hover { background: #e2e8f0; color: #0f172a; border-color: #cbd5e1; }
        .hrms-crumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7a90; margin-bottom: 10px; }
        .hrms-title-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
        .hrms-title { margin: 0; font-size: 24px; font-weight: 800; color: #16233a; letter-spacing: -0.01em; }
        .hrms-date-btn { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 500; color: #334155; box-shadow: 0 1px 2px rgba(16,24,40,0.05); cursor: pointer; }
        .hrms-add-btn { background: #1b2b4a; color: #fff; border: none; border-radius: 10px; padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer; }
        .hrms-notice { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #eef1f6; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; font-size: 13.5px; color: #1e293b; margin-bottom: 16px; }
        .hrms-notice-x { border: 0; background: transparent; display: grid; place-items: center; color: #334155; cursor: pointer; }
        .hrms-stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; margin-bottom: 14px; }
        .hrms-stat-card { background: #fff; border: 1px solid #e8edf3; border-radius: 14px; padding: 16px 18px; box-shadow: 0 1px 2px rgba(16,24,40,0.03); }
        .hrms-pill { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
        .hrms-main-grid { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 16px; align-items: start; }
        .hrms-card { background: #fff; border: 1px solid #e8edf3; border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,0.03); }
        .hrms-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 18px 20px 14px; flex-wrap: wrap; }
        .hrms-h3 { margin: 0; font-size: 16px; font-weight: 750; color: #111827; }
        .hrms-sub { margin: 4px 0 0; font-size: 12.5px; color: #6b7280; }
        .hrms-tabs { display: inline-flex; align-items: center; gap: 3px; background: #f4f4f6; border: 1px solid #e5e7eb; border-radius: 999px; padding: 3px 4px; }
        .hrms-tab { border: 1.5px solid transparent; border-radius: 999px; padding: 4px 14px; font-size: 12.5px; font-weight: 500; color: #8e9baa; background: transparent; cursor: pointer; transition: all 0.15s ease; }
        .hrms-tab.active { font-weight: 600; color: #000000; background: #ffffff; border-color: #000000; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
        .hrms-export { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #d1d5db; border-radius: 9px; padding: 6px 14px; font-size: 12.5px; font-weight: 600; color: #374151; cursor: pointer; transition: background 0.15s ease; }
        .hrms-export:hover { background: #f9fafb; }
        .hrms-table { width: 100%; border-collapse: collapse; min-width: 640px; font-size: 13.5px; }
        .hrms-table thead tr { background: #ffffff; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #e2e8f0; }
        .hrms-table th { text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #7b8aa0; padding: 12px 16px; white-space: nowrap; }
        .hrms-table tbody tr { border-bottom: 1px solid #f1f5f9; }
        .hrms-table td { padding: 13px 16px; }
        .hrms-time { font-family: inherit; font-size: 12.5px; font-weight: 600; color: #334155; white-space: nowrap; }
        .hrms-dept { color: #64748b; white-space: nowrap; }
        .hrms-avatar { width: 30px; height: 30px; border-radius: 999px; object-fit: cover; }
        .hrms-event { display: inline-block; font-size: 12px; font-weight: 500; color: #374151; background: #f3f4f6; border: none; border-radius: 999px; padding: 4px 13px; white-space: nowrap; }
        .hrms-status { display: inline-block; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 4px 13px; border: 1px solid; white-space: nowrap; }
        .hrms-viewall { border: 0; background: transparent; font-size: 12.5px; font-weight: 600; color: #475569; cursor: pointer; }
        .hrms-viewall:hover { color: #111827; }
        .hrms-timeline-line { position: absolute; left: 20px; top: 10px; bottom: 10px; width: 1.5px; background: #e2e8f0; }
        .hrms-unread { font-size: 10.5px; font-weight: 700; background: #1b2b4a; color: #fff; border-radius: 999px; padding: 2px 8px; }
        .hrms-iconbtn { border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; width: 26px; height: 26px; display: grid; place-items: center; color: #475569; cursor: pointer; }
        .hrms-iconbtn:hover { background: #f8fafc; color: #111827; }
        .hrms-afilter { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
        .hrms-achip { border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b; font-size: 11.5px; font-weight: 600; border-radius: 999px; padding: 4px 11px; cursor: pointer; }
        .hrms-achip.active { background: #111f36; border-color: #111f36; color: #fff; }
        .hrms-arow { display: flex; gap: 10px; position: relative; align-items: flex-start; border: 1px solid transparent; border-radius: 10px; padding: 6px; margin: 0 -6px; cursor: pointer; }
        .hrms-arow:hover { background: #f8fafc; border-color: #f1f5f9; }
        .hrms-arow:hover .hrms-ax { opacity: 1; }
        .hrms-aicon { width: 30px; height: 30px; border-radius: 999px; display: grid; place-items: center; flex-shrink: 0; z-index: 1; }
        .hrms-bluedot { width: 7px; height: 7px; border-radius: 999px; background: #2563eb; display: inline-block; }
        .hrms-ax { border: 0; background: transparent; color: #94a3b8; cursor: pointer; opacity: 0; padding: 4px; border-radius: 6px; }
        .hrms-ax:hover { color: #ef4444; background: #fef2f2; opacity: 1; }
        .hrms-aempty { text-align: center; padding: 18px 10px; display: grid; gap: 8px; justify-items: center; }
        .hrms-aempty p { margin: 0; font-size: 12.5px; color: #64748b; line-height: 1.5; }
        .hrms-afull { margin-top: 12px; width: 100%; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 10px; padding: 8px; font-size: 12.5px; font-weight: 600; color: #334155; cursor: pointer; }
        .hrms-afull:hover { background: #eef2f7; }
        .hrms-input { width: 100%; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 10px; padding: 10px 12px; font-size: 13px; color: #334155; margin-bottom: 10px; outline: none; box-sizing: border-box; transition: all 0.15s ease; }
        .hrms-input:focus { border-color: #94a3b8; background: #fff; }
        .hrms-area { resize: none; margin-bottom: 12px; color: #334155; }
        .hrms-submit { width: 100%; background: #19273c; color: #fff; border: 0; border-radius: 10px; padding: 12px; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: background 0.15s ease; }
        .hrms-submit:hover { background: #0f172a; }
        .hrms-date-wrap { display: flex; align-items: center; justify-content: space-between; }
        .hrms-date-native { position: absolute; right: -6px; top: -6px; width: 32px; height: 28px; opacity: 0; cursor: pointer; }
        .hrms-date-native::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 1; }
        .hrms-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230f172a' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 13px; padding-right: 32px; }
        .hrms-select:focus { border-color: #94a3b8; background-color: #fff; }
        .hrms-select option { padding: 8px 12px; font-size: 13px; color: #1e293b; }
        .hrms-select option:checked { background: #2563eb; color: #fff; }
        @media (max-width: 1100px) {
          .hrms-stat-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .hrms-main-grid { grid-template-columns: minmax(0,1fr); }
        }
        @media (max-width: 640px) {
          .hrms-stat-grid { grid-template-columns: minmax(0,1fr); }
          .hrms-dash { padding: 14px 14px 22px; }
        }
      `}</style>
    </div>
  );
}
