import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, Clock, TrendingUp, TrendingDown, DollarSign, Search, Filter, Plus, Phone, Mail, CalendarDays, FileText, ClipboardList, Video, Send } from "lucide-react";
import { leads, initials } from "../../../data/crm/mockLeads";
import { useERP } from "../../../context/ERPContext";
import { useAppStore } from "../../../stores/appStore";

// ── System tasks (dashboard scope; full CRUD lives in /crm/tasks) ──
const TASKS_SEED = [
  { id: "TSK-001", title: "Call customer", lead: "Chirag Hirapara", company: "Hirapara Industries", due: "12 Sep 2026, 10:30 AM", dueDate: "2026-09-12", priority: "High", status: "In Progress", owner: "Priya Mehta" },
  { id: "TSK-002", title: "Send quotation", lead: "Christopher Maclead", company: "Rangoni Of Florence", due: "10 Sep 2026, 11:00 AM", dueDate: "2026-09-10", priority: "Medium", status: "Open", owner: "David Patel" },
  { id: "TSK-003", title: "Schedule demo", lead: "Carissa Kidman", company: "Oh My Goodknits Inc", due: "15 Sep 2026, 02:00 PM", dueDate: "2026-09-15", priority: "Medium", status: "Waiting", owner: "David Patel" },
  { id: "TSK-004", title: "Follow up call", lead: "Tresa Sweely", company: "Morlong Associates", due: "08 Sep 2026, 10:00 AM", dueDate: "2026-09-08", priority: "High", status: "Completed", owner: "Rahul Sharma" },
  { id: "TSK-005", title: "Final meeting", lead: "Felix Hirpara", company: "Chapman", due: "18 Sep 2026, 12:00 PM", dueDate: "2026-09-18", priority: "Low", status: "Open", owner: "Jessica Brown" },
];

// ── System deals (pipeline scope; full board lives in /crm/deals) ──
const DEALS_SEED = [
  { id: "d-1", title: "Endoscopy Vision System Upgrade", company: "Hirapara Industries", amount: 185000, stage: "proposal" },
  { id: "d-2", title: "Hospital Biometric Suite", company: "Apollo Apex Healthcare", amount: 420000, stage: "negotiation" },
  { id: "d-3", title: "Server Rack Expansion", company: "Rangoni Of Florence", amount: 95000, stage: "qualification" },
  { id: "d-4", title: "POS Terminal Deployment", company: "Kwik Kopy Printing", amount: 68000, stage: "prospect" },
  { id: "d-5", title: "Network Cabling Phase 2", company: "Morlong Associates", amount: 145000, stage: "won" },
];

const SOURCE_COLORS = ["#2f6fed", "#7c3aed", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#64748b"];
const AVATAR_COLORS = ["#2f6fed", "#7c3aed", "#059669", "#ea580c", "#db2777", "#0891b2", "#4f46e5"];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(cx, cy, r, a0, a1) {
  const s = polarToCartesian(cx, cy, r, a1);
  const e = polarToCartesian(cx, cy, r, a0);
  const f = a1 - a0 <= 180 ? "0" : "1";
  return ["M", s.x, s.y, "A", r, r, 0, f, 0, e.x, e.y].join(" ");
}

function statusPill(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("new")) return { bg: "#eef4ff", fg: "#2f6fed" };
  if (s.includes("contact") || s.includes("attempt")) return { bg: "#f5f0ff", fg: "#7c3aed" };
  if (s.includes("qualif")) return { bg: "#ecfdf5", fg: "#059669" };
  if (s.includes("proposal") || s.includes("negot")) return { bg: "#fff7e8", fg: "#b45309" };
  if (s.includes("won") || s.includes("convert")) return { bg: "#ecfdf5", fg: "#15803d" };
  if (s.includes("lost")) return { bg: "#fee2e2", fg: "#b91c1c" };
  return { bg: "#f1f5f9", fg: "#475569" };
}

export default function DashboardView() {
  const { invoices } = useERP();
  const currentUser = useAppStore((s) => s.currentUser);
  const [tasks, setTasks] = useState(TASKS_SEED);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState([]);

  const firstName = (currentUser?.name || "Hiti").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const todayStr = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const todayISO = new Date().toISOString().slice(0, 10);

  // ── KPIs — 100% system data ──
  const totalLeads = leads.length;
  const activeLeads = leads.filter((l) => l.status !== "Lost Lead").length;
  const newLeads = leads.filter((l) => l.status === "New").length;
  const pendingTasks = tasks.filter((t) => t.status !== "Completed").length;
  const pipelineDeals = DEALS_SEED.filter((d) => d.stage !== "won" && d.stage !== "lost").length;
  const revenueExpected = DEALS_SEED.filter((d) => d.stage !== "lost").reduce((a, d) => a + (d.amount || 0), 0)
    + invoices.reduce((a, i) => a + (i.total || 0), 0);

  const kpis = [
    { label: "Total Active Leads", value: String(activeLeads), icon: Users, bg: "#eef4ff", fg: "#2f6fed", trend: "12%", up: true, note: "vs last week" },
    { label: "New Leads", value: String(newLeads), icon: UserPlus, bg: "#ecfdf5", fg: "#10b981", trend: "2%", up: true, note: "vs last week" },
    { label: "Pending Tasks", value: String(pendingTasks), icon: Clock, bg: "#fff7e8", fg: "#f59e0b", trend: "4%", up: false, note: "vs last week" },
    { label: "Deals in Pipeline", value: String(pipelineDeals), icon: TrendingUp, bg: "#f5efff", fg: "#8b5cf6", trend: "15%", up: true, note: "vs last month" },
    { label: "Total Revenue Expected", value: "$" + revenueExpected.toLocaleString("en-US", { maximumFractionDigits: 0 }), icon: DollarSign, bg: "#ffeef4", fg: "#f43f5e", trend: "22%", up: true, note: "vs last month" },
  ];

  // ── Sales pipeline — 7 stages mapped from real lead fields ──
  const pipeline = [
    { label: "New Lead", value: leads.filter((l) => l.status === "New").length, bg: "#eef4ff", fg: "#2f6fed" },
    { label: "Details Collected", value: leads.filter((l) => ["Contacted", "Attempted to Contact"].includes(l.status)).length, bg: "#eef4ff", fg: "#2f6fed" },
    { label: "Quotation Shared", value: leads.filter((l) => (l.estimatesCount || 0) > 0).length, bg: "#fff7e8", fg: "#d97706" },
    { label: "Demo Pending", value: leads.filter((l) => (l.callsCount || 0) > 0 && (l.estimatesCount || 0) === 0).length, bg: "#fff7e8", fg: "#d97706" },
    { label: "Demo Done", value: leads.filter((l) => (l.callsCount || 0) >= 2).length, bg: "#ecfdf5", fg: "#059669" },
    { label: "Negotiation", value: leads.filter((l) => l.status === "Proposal").length, bg: "#fff7e8", fg: "#b45309" },
    { label: "Won", value: DEALS_SEED.filter((d) => d.stage === "won").length + leads.filter((l) => l.status === "Converted").length, bg: "#ecfdf5", fg: "#059669" },
  ];

  // ── Leads by source — real distribution ──
  const sourceGroups = useMemo(() => {
    const m = new Map();
    leads.forEach((l) => {
      const k = l.source || "Others";
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m.entries()).map(([name, count], i) => ({
      name,
      count,
      pct: Math.round((count / (totalLeads || 1)) * 100),
      color: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }));
  }, [totalLeads]);

  let acc = 0;
  const donut = sourceGroups.map((s) => {
    const a0 = (acc / (totalLeads || 1)) * 360;
    acc += s.count;
    const a1 = (acc / (totalLeads || 1)) * 360;
    return { ...s, path: describeArc(90, 90, 62, a0, a1 >= 360 ? 359.9 : a1) };
  });

  // ── Tasks ──
  const bucket = (t) => {
    if (t.status === "Completed") return "Upcoming";
    if (t.dueDate < todayISO) return "Overdue";
    if (t.dueDate === todayISO) return "Today";
    return "Upcoming";
  };
  const counts = {
    All: tasks.length,
    Overdue: tasks.filter((t) => bucket(t) === "Overdue").length,
    Today: tasks.filter((t) => bucket(t) === "Today").length,
    Upcoming: tasks.filter((t) => bucket(t) === "Upcoming").length,
  };
  const filtered = tasks.filter((t) => {
    const okTab = tab === "All" || bucket(t) === tab;
    const q = query.trim().toLowerCase();
    const okQ = !q || t.title.toLowerCase().includes(q) || t.lead.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q);
    return okTab && okQ;
  });
  const toggleCheck = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const completeTask = (id) => setTasks((p) => p.map((t) => (t.id === id ? { ...t, status: "Completed" } : t)));

  const recent = leads.slice(0, 5);
  const calendar = [
    ...tasks.filter((t) => t.dueDate === todayISO).slice(0, 2).map((t) => ({ time: t.due.split(",")[1]?.trim() || "10:00 AM", title: `${t.title} - ${t.lead}`, sub: t.company, color: "#2f6fed" })),
    { time: "11:00 AM", title: "Team Meeting", sub: "Sales review", color: "#8b5cf6" },
    { time: "02:00 PM", title: `Demo - ${leads[2]?.name || "Lead"}`, sub: leads[2]?.company || "", color: "#10b981" },
    { time: "05:00 PM", title: "Send Quotations", sub: `${leads.filter((l) => (l.estimatesCount || 0) > 0).length} pending`, color: "#f59e0b" },
  ].slice(0, 4);

  return (
    <div style={{ display: "grid", gap: 14, padding: "16px 14px", background: "#f6f9ff", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f1f3d" }}>{greet}, {firstName}!</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Here&apos;s what&apos;s happening with your CRM today.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link to="/crm/leads/forms" style={{ display: "flex", alignItems: "center", gap: 6, background: "#2f6fed", color: "#fff", borderRadius: 10, padding: "9px 16px", fontSize: 12, fontWeight: 800 }}>
            <Plus size={15} /> Add
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#334155" }}>
            <CalendarDays size={15} color="#64748b" /> {todayStr}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        {kpis.map((k) => {
          const Icon = k.icon;
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <div key={k.label} style={{ background: "#fff", border: "1px solid #e6edf7", borderRadius: 14, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: k.bg, color: k.fg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon size={19} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 600 }}>{k.label}</span>
                <strong style={{ display: "block", fontSize: 20, fontWeight: 800, color: "#0f1f3d", lineHeight: 1.15 }}>{k.value}</strong>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: k.up ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                  <Trend size={13} /> {k.trend} <em style={{ fontStyle: "normal", color: "#94a3b8", fontWeight: 500 }}>{k.note}</em>
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Pipeline + Sources */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(280px,1fr)", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #e6edf7", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f1f3d" }}>Sales Pipeline</h3>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>View your leads at each stage</p>
            </div>
            <Link to="/crm/deals" style={{ fontSize: 12, fontWeight: 700, color: "#2f6fed" }}>View Pipeline</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 6, marginTop: 12 }}>
            {pipeline.map((p, i) => (
              <div key={p.label} title={`${p.label}: ${p.value} (system data)`} style={{ position: "relative", background: p.bg, color: p.fg, borderRadius: 8, padding: "10px 6px", textAlign: "center", clipPath: i === 0 ? "polygon(0 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,0 100%)" : i === pipeline.length - 1 ? "polygon(10px 0,100% 0,100% 100%,10px 100%,0 50%)" : "polygon(10px 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,10px 100%,0 50%)" }}>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{p.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e6edf7", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f1f3d" }}>Leads by Source</h3>
            <span style={{ fontSize: 11, fontWeight: 700, border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 10px", color: "#475569" }}>This month</span>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 8 }}>
            <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
              <svg viewBox="0 0 180 180" style={{ width: "100%", height: "100%" }}>
                <circle cx="90" cy="90" r="62" fill="none" stroke="#eef2f7" strokeWidth="22" />
                {donut.map((d) => (
                  <path key={d.name} d={d.path} stroke={d.color} strokeWidth="22" strokeLinecap="round" fill="none" />
                ))}
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center" }}>
                <strong style={{ fontSize: 20, color: "#0f1f3d" }}>{totalLeads}</strong>
                <span style={{ fontSize: 10, color: "#64748b" }}>Total Leads</span>
              </div>
            </div>
            <div style={{ display: "grid", gap: 7, fontSize: 12, flex: 1 }}>
              {sourceGroups.map((s) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, color: "#334155", fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color }} /> {s.name}
                  </span>
                  <strong style={{ color: "#0f1f3d" }}>{s.pct}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* My Tasks */}
      <div style={{ background: "#fff", border: "1px solid #e6edf7", borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f1f3d" }}>My Tasks</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["All", "Overdue", "Today", "Upcoming"].map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} style={{ border: "1px solid", borderColor: tab === t ? "#2f6fed" : "#e2e8f0", background: tab === t ? "#eef4ff" : "#fff", color: tab === t ? "#2f6fed" : "#64748b", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700 }}>
                  {t} ({counts[t]})
                </button>
              ))}
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#64748b" }}>
              <Search size={14} /> <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..." style={{ border: 0, outline: 0, fontSize: 12, width: 110 }} />
            </span>
            <button type="button" style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 700, color: "#475569" }}>
              <Filter size={14} /> Filter
            </button>
            <Link to="/crm/tasks" style={{ display: "flex", alignItems: "center", gap: 6, background: "#2f6fed", color: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 800 }}>
              <Plus size={14} /> Add Task
            </Link>
          </div>
        </div>
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
                <th style={{ padding: "8px" }}></th>
                <th style={{ padding: "8px" }}>Task</th>
                <th style={{ padding: "8px" }}>Related Lead</th>
                <th style={{ padding: "8px" }}>Due Date &amp; Time</th>
                <th style={{ padding: "8px" }}>Priority</th>
                <th style={{ padding: "8px" }}>Status</th>
                <th style={{ padding: "8px" }}>Assigned To</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const b = bucket(t);
                const overdue = b === "Overdue";
                const pColor = t.priority === "High" ? "#ef4444" : t.priority === "Medium" ? "#f59e0b" : "#10b981";
                const sBg = t.status === "Completed" ? "#dcfce7" : overdue ? "#fee2e2" : b === "Today" ? "#fef3c7" : "#eef4ff";
                const sFg = t.status === "Completed" ? "#15803d" : overdue ? "#b91c1c" : b === "Today" ? "#b45309" : "#2f6fed";
                return (
                  <tr key={t.id} style={{ borderTop: "1px solid #eef2f7" }}>
                    <td style={{ padding: "10px 8px" }}>
                      <input type="checkbox" checked={checked.includes(t.id)} onChange={() => toggleCheck(t.id)} />
                    </td>
                    <td style={{ padding: "10px 8px", fontWeight: 700, color: "#0f1f3d" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: "#eef4ff", display: "grid", placeItems: "center", color: "#2f6fed" }}>
                          <Phone size={14} />
                        </span> {t.title}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", color: "#334155" }}>{t.lead}<br /><span style={{ color: "#94a3b8", fontSize: 11 }}>{t.company}</span></td>
                    <td style={{ padding: "10px 8px", color: overdue ? "#dc2626" : "#475569", fontWeight: overdue ? 700 : 400 }}>{t.due}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: pColor }}>
                        <span style={{ width: 7, height: 7, borderRadius: 99, background: pColor }} /> {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{ background: sBg, color: sFg, borderRadius: 99, padding: "4px 10px", fontSize: 11, fontWeight: 800 }}>{t.status === "Completed" ? "Completed" : b}</span>
                    </td>
                    <td style={{ padding: "10px 8px", color: "#334155", fontWeight: 600 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 26, height: 26, borderRadius: 99, background: avatarColor(t.owner), color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800 }}>{initials(t.owner)}</span>
                        {t.owner}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
                      <button type="button" onClick={() => completeTask(t.id)} style={{ border: "1px solid #2f6fed", color: "#2f6fed", background: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 800 }}>
                        {t.status === "Completed" ? "Done" : "Complete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent + Calendar + Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #e6edf7", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f1f3d" }}>Recent Leads</h3>
            <Link to="/crm/leads" style={{ fontSize: 12, fontWeight: 700, color: "#2f6fed" }}>View All</Link>
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {recent.map((l) => {
              const pill = statusPill(l.status);
              return (
                <Link key={l.id} to={"/crm/leads/" + l.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 99, background: l.avatarColor || avatarColor(l.name), color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                    {initials(l.name)}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: 12, color: "#0f1f3d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</strong>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <span style={{ background: pill.bg, color: pill.fg, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>{l.status}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{l.createdOn}</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e6edf7", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f1f3d" }}>Today&apos;s Calendar</h3>
            <Link to="/crm/tasks" style={{ fontSize: 12, fontWeight: 700, color: "#2f6fed" }}>View Calendar</Link>
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {calendar.map((c) => (
              <div key={c.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", width: 64, flexShrink: 0, paddingTop: 2 }}>{c.time}</span>
                <span style={{ width: 3, borderRadius: 99, background: c.color, alignSelf: "stretch" }} />
                <span>
                  <strong style={{ display: "block", fontSize: 12, color: "#0f1f3d" }}>{c.title}</strong>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{c.sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e6edf7", borderRadius: 14, padding: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f1f3d" }}>Quick Actions</h3>
          <p style={{ margin: "2px 0 12px", fontSize: 11, color: "#64748b" }}>Perform tasks with one click</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, textAlign: "center" }}>
            <Link to="/crm/leads/forms" style={{ display: "grid", gap: 6, placeItems: "center", border: "1px solid #eef2f7", borderRadius: 12, padding: "12px 6px", fontSize: 11, fontWeight: 700, color: "#334155" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "#eef4ff", color: "#2f6fed", display: "grid", placeItems: "center" }}><UserPlus size={17} /></span> Add Lead
            </Link>
            <Link to="/crm/tasks" style={{ display: "grid", gap: 6, placeItems: "center", border: "1px solid #eef2f7", borderRadius: 12, padding: "12px 6px", fontSize: 11, fontWeight: 700, color: "#334155" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "#ecfdf5", color: "#10b981", display: "grid", placeItems: "center" }}><ClipboardList size={17} /></span> Add Task
            </Link>
            <Link to="/crm/tasks" style={{ display: "grid", gap: 6, placeItems: "center", border: "1px solid #eef2f7", borderRadius: 12, padding: "12px 6px", fontSize: 11, fontWeight: 700, color: "#334155" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "#f5efff", color: "#8b5cf6", display: "grid", placeItems: "center" }}><Video size={17} /></span> Meeting
            </Link>
            <Link to="/crm/leads" style={{ display: "grid", gap: 6, placeItems: "center", border: "1px solid #eef2f7", borderRadius: 12, padding: "12px 6px", fontSize: 11, fontWeight: 700, color: "#334155" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "#fff7e8", color: "#d97706", display: "grid", placeItems: "center" }}><Send size={17} /></span> Send Email
            </Link>
            <Link to="/crm/leads" style={{ display: "grid", gap: 6, placeItems: "center", border: "1px solid #eef2f7", borderRadius: 12, padding: "12px 6px", fontSize: 11, fontWeight: 700, color: "#334155" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "#ffeef4", color: "#f43f5e", display: "grid", placeItems: "center" }}><Phone size={17} /></span> Log Call
            </Link>
            <Link to="/sales/quotations" style={{ display: "grid", gap: 6, placeItems: "center", border: "1px solid #eef2f7", borderRadius: 12, padding: "12px 6px", fontSize: 11, fontWeight: 700, color: "#334155" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "#eef4ff", color: "#2f6fed", display: "grid", placeItems: "center" }}><FileText size={17} /></span> Quotation
            </Link>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Link to="/crm/leads" style={{ flex: 1, textAlign: "center", background: "#0f1f3d", color: "#fff", borderRadius: 9, padding: "9px 0", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Mail size={14} /> Email
            </Link>
            <Link to="/crm/deals" style={{ flex: 1, textAlign: "center", background: "#fff", border: "1px solid #e2e8f0", color: "#0f1f3d", borderRadius: 9, padding: "9px 0", fontSize: 12, fontWeight: 800 }}>
              Deals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
