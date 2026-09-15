import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, Clock, TrendingUp, TrendingDown, DollarSign, Search, Phone, Mail, CalendarDays, FileText, ClipboardList, Video, Send } from "lucide-react";
import { leads, initials } from "../../../data/crm/mockLeads";
import { useERP } from "../../../context/ERPContext";
import { useAppStore } from "../../../stores/appStore";
import { CRM_TEAM_MEMBERS } from "../../../services/leadStageAutomation";
import { completeTaskWithOutcome, resolveLeadForTask, NEXT_ACTION_LABELS } from "../../../services/taskCompletionService";
import CompleteTaskModal from "../tasks/CompleteTaskModal";
import CreateLeadModal from "../leads/CreateLeadModal";
import { runLeadStageAutomation, LEADS_STORAGE_KEY } from "../../../services/leadStageAutomation";
const DEAL_STORAGE_KEY = "crm-deals-v1";
const TASK_STORAGE_KEY = "crm-tasks-v1";
const DEAL_STAGES = ["Draft", "Sent", "Open", "Revised", "Declined"];
const SOURCE_COLORS = ["#2f6fed", "#7c3aed", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#64748b"];
const AVATAR_COLORS = ["#2f6fed", "#7c3aed", "#059669", "#ea580c", "#db2777", "#0891b2", "#4f46e5"];
const PIPELINE_BG = ["#eef4ff", "#f5f0ff", "#fff7e8", "#eef4ff", "#ecfdf5"];
const PIPELINE_FG = ["#2f6fed", "#7c3aed", "#b45309", "#2f6fed", "#059669"];
function seedDeals() {
  return [
    { id: "dl-1", name: "amitbhai_001", phone: "+919876543210", price: 100000, client: "Amit Bhai", product: "Product A", stage: "Draft", source: "Website", assignedUser: "Mr. Kamlesh Dhumadiya", pipeline: "Sales", labels: [], notes: "", tasks: "0/0", items: 0, users: 0, createdAt: "2026-05-10T10:00:00" },
    { id: "dl-2", name: "Rohit", phone: "+919876543211", price: 500000, client: "Rohit Sharma", product: "Product B", stage: "Draft", source: "Referral", assignedUser: "Jayesh Nair", pipeline: "Sales", labels: [], notes: "", tasks: "0/0", items: 0, users: 0, createdAt: "2026-05-12T10:00:00" },
    { id: "dl-3", name: "Deal Alpha", phone: "+919876543212", price: 750000, client: "Alpha Corp", product: "Product A", stage: "Draft", source: "Cold Call", assignedUser: "Anuska", pipeline: "Sales", labels: [], notes: "", tasks: "1/3", items: 2, users: 1, createdAt: "2026-04-08T10:00:00" },
    { id: "dl-4", name: "Deal Beta", phone: "+919876543213", price: 1200000, client: "Beta Ltd", product: "Service C", stage: "Draft", source: "Website", assignedUser: "Mr. Kamlesh Dhumadiya", pipeline: "Sales", labels: [], notes: "", tasks: "2/5", items: 1, users: 2, createdAt: "2026-03-15T10:00:00" },
    { id: "dl-5", name: "Deal Gamma", phone: "+919876543214", price: 1500000, client: "Gamma Inc", product: "Product B", stage: "Draft", source: "Referral", assignedUser: "Jayesh Nair", pipeline: "Sales", labels: [], notes: "", tasks: "0/2", items: 0, users: 0, createdAt: "2026-02-20T10:00:00" },
    { id: "dl-6", name: "Deal Delta", phone: "+919876543215", price: 11123, client: "Delta Co", product: "Product A", stage: "Draft", source: "Website", assignedUser: "Anuska", pipeline: "Sales", labels: [], notes: "", tasks: "0/0", items: 0, users: 0, createdAt: "2026-01-11T10:00:00" }
  ];
}
function loadDeals() {
  try {
    const raw = localStorage.getItem(DEAL_STORAGE_KEY);
    if (!raw) return seedDeals();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return seedDeals();
    return parsed.map((d) => ({ labels: [], pipeline: "Sales", notes: "", ...d }));
  } catch {
    return seedDeals();
  }
}
function splitLeadName(full) {
  const text = full || "";
  const open = text.indexOf("(");
  const close = text.indexOf(")");
  if (open > 0 && close > open) {
    return { lead: text.slice(0, open).trim(), company: text.slice(open + 1, close).trim() };
  }
  return { lead: text, company: "" };
}
function normalizeTask(t) {
  const parts = splitLeadName(t.lead);
  return {
    id: t.id,
    title: t.title,
    lead: parts.lead || t.lead,
    company: parts.company,
    due: t.dueDate,
    dueDate: t.dueDate,
    priority: t.priority,
    status: t.status,
    owner: t.owner
  };
}
function baseTasks() {
  return [
    { id: "TSK-001", title: "Follow up on Enterprise Quote", lead: "Sarah Jenkins (Acme Corp)", owner: "Alex Rivera", dueDate: "2026-09-12", priority: "High", status: "In Progress" },
    { id: "TSK-002", title: "Schedule product demo call", lead: "Michael Chang (TechFlow)", owner: "Elena Rostova", dueDate: "2026-09-10", priority: "Urgent", status: "Open" },
    { id: "TSK-003", title: "Send revised contract terms", lead: "David Ross (Global Logistics)", owner: "Alex Rivera", dueDate: "2026-09-15", priority: "Medium", status: "Waiting" },
    { id: "TSK-004", title: "Prepare onboarding requirements", lead: "Amanda Lee (Apex Innovations)", owner: "Sarah Chen", dueDate: "2026-09-08", priority: "High", status: "Completed" },
    { id: "TSK-005", title: "Review custom billing setup", lead: "Robert Miller (Vanguard Systems)", owner: "Elena Rostova", dueDate: "2026-09-18", priority: "Low", status: "Open" }
  ];
}
function loadTasks() {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
  }
  return baseTasks().map(normalizeTask);
}
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
function formatShortINR(value) {
  const n = Number(value) || 0;
  if (n >= 10000000) return "Rs " + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "Rs " + (n / 100000).toFixed(2) + " L";
  if (n >= 1000) return "Rs " + (n / 1000).toFixed(1) + "k";
  return "Rs " + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}
export default function DashboardView() {
  const { invoices, quotations, salesOrders, paymentIns, formatCurrency, getInvoiceOutstanding } = useERP();
  const currentUser = useAppStore((s) => s.currentUser);
  const [deals, setDeals] = useState(loadDeals);
  const [tasks, setTasks] = useState(loadTasks);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [completeTarget, setCompleteTarget] = useState(null);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);

  function handleCreateLead(data) {
    try {
      const raw = localStorage.getItem(LEADS_STORAGE_KEY);
      const current = raw ? JSON.parse(raw) : leads;
      const nextId = current.reduce((max, l) => Math.max(max, Number(l.id) || 0), 0) + 1;
      const count = String(nextId + 184).padStart(8, '0');
      const newLead = {
        id: nextId,
        name: data.leadName || 'Untitled Lead',
        company: data.company || '',
        phone: data.phone || '',
        email: data.email || '',
        status: 'New',
        source: data.source || 'Website',
        owner: data.owner || 'Drashti Evenmore',
        createdOn: data.createdOn ? new Date(data.createdOn).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
        jobTitle: data.titleValue || '',
        industry: data.industry || '',
        products: data.products || [],
        assignedUsers: data.leadUsers || [],
        photo: data.photoPreview || '',
        leadCode: `LD-${count}`,
      };
      const updated = [newLead, ...current];
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
      try {
        runLeadStageAutomation(newLead, 'New');
      } catch (err) {
        console.error(err);
      }
    } catch (e) {
      console.error('Error creating lead:', e);
    }
    setIsCreateLeadOpen(false);
  }
  const firstName = (currentUser?.name || "Hiti").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const todayStr = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const todayISO = new Date().toISOString().slice(0, 10);
  useEffect(() => {
    const syncDeals = () => setDeals(loadDeals());
    window.addEventListener("storage", syncDeals);
    window.addEventListener("focus", syncDeals);
    return () => {
      window.removeEventListener("storage", syncDeals);
      window.removeEventListener("focus", syncDeals);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
    }
  }, [tasks]);
  const totalLeads = leads.length;
  const activeLeads = leads.filter((l) => l.status !== "Lost Lead").length;
  const newLeads = leads.filter((l) => l.status === "New").length;
  const pendingTasks = tasks.filter((t) => t.status !== "Completed").length;
  const activeDeals = deals.filter((d) => d.stage !== "Declined");
  const pipelineDeals = activeDeals.length;
  const dealsTotal = deals.reduce((a, d) => a + (Number(d.price) || 0), 0);
  const invoicesTotal = invoices.reduce((a, i) => a + (i.total || 0), 0);
  const quotationsTotal = quotations.reduce((a, q) => a + (q.amount || q.total || 0), 0);
  const ordersTotal = salesOrders.reduce((a, o) => a + (o.total || o.amount || 0), 0);
  const collectedTotal = paymentIns.reduce((a, p) => a + (p.amount || 0), 0);
  const outstandingTotal = invoices.reduce((a, i) => {
    const r = getInvoiceOutstanding(i.id || i.invoiceNumber);
    return a + (r.balanceDue || 0);
  }, 0);
  const revenueExpected = dealsTotal + invoicesTotal + quotationsTotal;
  const kpis = [
    { label: "Total Active Leads", value: String(activeLeads), icon: Users, bg: "#eef4ff", fg: "#2f6fed", trend: "12%", up: true, note: "vs last week" },
    { label: "New Leads", value: String(newLeads), icon: UserPlus, bg: "#ecfdf5", fg: "#10b981", trend: "2%", up: true, note: "vs last week" },
    { label: "Pending Tasks", value: String(pendingTasks), icon: Clock, bg: "#fff7e8", fg: "#f59e0b", trend: "4%", up: false, note: "vs last week" },
    { label: "Deals in Pipeline", value: String(pipelineDeals), icon: TrendingUp, bg: "#f5efff", fg: "#8b5cf6", trend: "15%", up: true, note: formatShortINR(dealsTotal) },
    { label: "Total Revenue Expected", value: formatCurrency(revenueExpected), icon: DollarSign, bg: "#ffeef4", fg: "#f43f5e", trend: "22%", up: true, note: formatCurrency(outstandingTotal) + " due" }
  ];
  const pipeline = DEAL_STAGES.map((stage, i) => ({
    label: stage,
    value: deals.filter((d) => d.stage === stage).length,
    total: deals.filter((d) => d.stage === stage).reduce((a, d) => a + (Number(d.price) || 0), 0),
    bg: PIPELINE_BG[i % PIPELINE_BG.length],
    fg: PIPELINE_FG[i % PIPELINE_FG.length]
  }));
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
      color: SOURCE_COLORS[i % SOURCE_COLORS.length]
    }));
  }, [totalLeads]);
  let acc = 0;
  const donut = sourceGroups.map((s) => {
    const a0 = (acc / (totalLeads || 1)) * 360;
    acc += s.count;
    const a1 = (acc / (totalLeads || 1)) * 360;
    return { ...s, path: describeArc(90, 90, 62, a0, a1 >= 360 ? 359.9 : a1) };
  });
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
    Upcoming: tasks.filter((t) => bucket(t) === "Upcoming").length
  };
  const filtered = tasks.filter((t) => {
    const okTab = tab === "All" || bucket(t) === tab;
    const q = query.trim().toLowerCase();
    const okQ = !q || t.title.toLowerCase().includes(q) || t.lead.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q);
    return okTab && okQ;
  });
  const completeTask = (t) => {
    if (t.status === "Completed") return;
    setCompleteTarget(t);
  };
  async function handleComplete(outcome, nextAction) {
    if (!completeTarget) return { ok: false, message: "No task selected." };
    const lead = resolveLeadForTask(completeTarget);
    const completedBy = currentUser?.name || CRM_TEAM_MEMBERS[0]?.name || "CRM User";
    const result = completeTaskWithOutcome({
      task: completeTarget,
      lead,
      outcome,
      nextAction,
      completedBy,
    });
    const targetId = completeTarget.id;
    setTasks((p) => {
      const updated = p.map((t) =>
        t.id === targetId
          ? {
              ...t,
              status: "Completed",
              completionOutcome: outcome,
              nextAction,
              completedAt: new Date().toISOString().slice(0, 10),
              completedBy,
            }
          : t
      );
      if (result.ok && result.createdTask && !updated.some((t) => String(t.id) === String(result.createdTask.id))) {
        updated.unshift({
          id: result.createdTask.id,
          title: result.createdTask.title,
          lead: result.createdTask.lead,
          company: "",
          due: result.createdTask.dueDate || result.createdTask.dueAt || "",
          dueDate: result.createdTask.dueDate || result.createdTask.dueAt || "",
          priority: result.createdTask.priority || "Medium",
          status: result.createdTask.status || "Open",
          owner: result.createdTask.owner,
        });
      }
      return updated;
    });
    return result;
  }
  const handleCompleteSuccess = () => setCompleteTarget(null);
  const recent = leads.slice(0, 5);
  const todayTasks = tasks.filter((t) => t.dueDate === todayISO).slice(0, 2);
  const nextOrder = salesOrders[0];
  const nextQuote = quotations[0];
  const calendar = [
    ...todayTasks.map((t) => ({ time: "10:00 AM", title: t.title + " - " + t.lead, sub: t.company || t.owner, color: "#2f6fed" })),
    { time: "11:00 AM", title: "Team Meeting", sub: "Sales review " + collectedTotal.toLocaleString("en-IN") + " collected", color: "#8b5cf6" },
    { time: "02:00 PM", title: "Demo - " + (leads[2]?.name || "Lead"), sub: (leads[2]?.company || "") + (nextOrder ? " | " + nextOrder.orderNumber : ""), color: "#10b981" },
    { time: "05:00 PM", title: "Send Quotations", sub: (nextQuote ? nextQuote.quoteNumber + " " + formatCurrency(nextQuote.amount || 0) : quotationsTotal + " pipeline"), color: "#f59e0b" }
  ].slice(0, 4);
  return (
    <div style={{ display: "grid", gap: 14, padding: "16px 14px", background: "#f6f9ff", minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f1f3d" }}>{greet}, {firstName}!</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Here is what is happening with your CRM today. {ordersTotal > 0 ? formatCurrency(ordersTotal) + " orders" : ""} {paymentIns.length > 0 ? paymentIns.length + " payments" : ""}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#334155" }}>
            <CalendarDays size={15} color="#64748b" /> {todayStr}
          </div>
        </div>
      </div>
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
                <strong style={{ display: "block", fontSize: 18, fontWeight: 800, color: "#0f1f3d", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.value}</strong>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: k.up ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                  <Trend size={13} /> {k.trend} <em style={{ fontStyle: "normal", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.note}</em>
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(280px,1fr)", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #e6edf7", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f1f3d" }}>Sales Pipeline</h3>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>Deals by stage from Manage Deals | {formatShortINR(dealsTotal)} total</p>
            </div>
            <Link to="/crm/deals" style={{ fontSize: 12, fontWeight: 700, color: "#2f6fed" }}>View Pipeline</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 6, marginTop: 12 }}>
            {pipeline.map((p, i) => (
              <div key={p.label} title={p.label + ": " + p.value + " deals " + formatShortINR(p.total)} style={{ position: "relative", background: p.bg, color: p.fg, borderRadius: 8, padding: "10px 6px", textAlign: "center", clipPath: i === 0 ? "polygon(0 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,0 100%)" : i === pipeline.length - 1 ? "polygon(10px 0,100% 0,100% 100%,10px 100%,0 50%)" : "polygon(10px 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,10px 100%,0 50%)" }}>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{p.value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formatShortINR(p.total)}</div>
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
          </div>
        </div>
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
                <th style={{ padding: "8px" }}>Task</th>
                <th style={{ padding: "8px" }}>Related Lead</th>
                <th style={{ padding: "8px" }}>Due Date</th>
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
                const pColor = t.priority === "High" || t.priority === "Urgent" ? "#ef4444" : t.priority === "Medium" ? "#f59e0b" : "#10b981";
                const sBg = t.status === "Completed" ? "#dcfce7" : overdue ? "#fee2e2" : b === "Today" ? "#fef3c7" : "#eef4ff";
                const sFg = t.status === "Completed" ? "#15803d" : overdue ? "#b91c1c" : b === "Today" ? "#b45309" : "#2f6fed";
                return (
                  <tr key={t.id} style={{ borderTop: "1px solid #eef2f7" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 700, color: "#0f1f3d" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: "#eef4ff", display: "grid", placeItems: "center", color: "#2f6fed" }}>
                          <Phone size={14} />
                        </span> {t.title}
                      </span>
                      {t.status === "Completed" && (t.completionOutcome || t.nextAction || t.completedBy) && (
                        <span style={{ display: "block", fontSize: 10, color: "#15803d", fontWeight: 700, marginTop: 3 }}>
                          {t.completionOutcome ? "Outcome: " + t.completionOutcome : ""}
                          {t.nextAction ? " · Next: " + (NEXT_ACTION_LABELS[t.nextAction] || t.nextAction) : ""}
                          {t.completedBy ? " · by " + t.completedBy : ""}
                        </span>
                      )}
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
                      <button type="button" onClick={() => completeTask(t)} style={{ border: "1px solid #2f6fed", color: "#2f6fed", background: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 800 }}>
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
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{l.createdOn} | {l.source} | {formatCurrency(l.amount || 0)}</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e6edf7", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f1f3d" }}>Today Calendar</h3>
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
          <p style={{ margin: "2px 0 12px", fontSize: 11, color: "#64748b" }}>Perform tasks with one click | {deals.length} deals {invoices.length} invoices</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, textAlign: "center" }}>
            <button type="button" onClick={() => setIsCreateLeadOpen(true)} style={{ display: "grid", gap: 6, placeItems: "center", border: "1px solid #eef2f7", borderRadius: 12, padding: "12px 6px", fontSize: 11, fontWeight: 700, color: "#334155", background: "none", cursor: "pointer", width: "100%" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: "#eef4ff", color: "#2f6fed", display: "grid", placeItems: "center" }}><UserPlus size={17} /></span> Add Lead
            </button>
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
      <CompleteTaskModal
        open={Boolean(completeTarget)}
        task={completeTarget ? { ...completeTarget, stage: completeTarget.stage || 'New Lead', dueAt: completeTarget.dueDate || completeTarget.due || '', assignee: completeTarget.owner || 'Unassigned' } : null}
        lead={resolveLeadForTask(completeTarget)}
        onCancel={handleCompleteSuccess}
        onComplete={handleComplete}
        onSuccess={handleCompleteSuccess}
      />
    </div>
  );
}
