import { useState } from "react";
import {
  ShieldCheck,
  Users,
  Settings,
  Sliders,
  CheckCircle2,
  Clock,
  Building,
  KeyRound,
  FileCheck,
  Plus,
  Edit,
  Trash2,
  Mail,
  AlertCircle,
  ExternalLink,
  UserMinus,
  UserX,
  MessageSquareWarning,
  Calendar,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";

// ── Initial Mock Data ──────────────────────────────────────────

const INITIAL_TEAMS = [
  { id: "T-01", name: "Engineering Leads", lead: "David Park", members: 18, approver: "Sarah Mitchell", dept: "Engineering" },
  { id: "T-02", name: "People Operations & Talent", lead: "Ayesha Khan", members: 6, approver: "Ayesha Khan", dept: "HR" },
  { id: "T-03", name: "Finance & Accounting", lead: "James Wilson", members: 8, approver: "James Wilson", dept: "Finance" },
  { id: "T-04", name: "Product & UI/UX", lead: "Marcus Chen", members: 12, approver: "David Park", dept: "Design" },
];

const INITIAL_APPROVAL_CHAINS = [
  { id: "AC-01", module: "Leave Management", tier1: "Direct Line Manager", tier2: "HR Operations Lead", tier3: "HR Director", autoEscalateDays: 3, status: "Active" },
  { id: "AC-02", module: "Attendance Regularization", tier1: "Immediate Supervisor", tier2: "Department Head", tier3: "—", autoEscalateDays: 2, status: "Active" },
  { id: "AC-03", module: "Asset Allocation", tier1: "IT Stock Manager", tier2: "Operations Lead", tier3: "Finance Approver", autoEscalateDays: 4, status: "Active" },
  { id: "AC-04", module: "Payroll & Compensation Revisions", tier1: "HR Director", tier2: "Chief Financial Officer (CFO)", tier3: "Managing Director", autoEscalateDays: 5, status: "Active" },
];

const INITIAL_TERMINATIONS = [
  {
    id: "TRM-101",
    employee: "Vikram Malhotra",
    employeeId: "EMP-1088",
    dept: "Engineering",
    role: "Backend Engineer",
    terminationType: "Involuntary (Performance)",
    noticeDate: "2024-09-15",
    exitDate: "2024-10-15",
    severance: "1 Month Gross",
    status: "In Exit Clearance",
    reason: "Consistent shortfall in quarterly KPI goals following PIP.",
  },
  {
    id: "TRM-102",
    employee: "Ananya Deshmukh",
    employeeId: "EMP-1052",
    dept: "Sales & Marketing",
    role: "Senior Account Exec",
    terminationType: "Contract Non-Renewal",
    noticeDate: "2024-09-01",
    exitDate: "2024-09-30",
    severance: "Standard Terms",
    status: "Completed",
    reason: "End of 1-year enterprise regional expansion contract.",
  },
  {
    id: "TRM-103",
    employee: "Rahul Mehra",
    employeeId: "EMP-1077",
    dept: "Operations",
    role: "Logistics Coordinator",
    terminationType: "Disciplinary / Breach",
    noticeDate: "2024-10-02",
    exitDate: "2024-10-05",
    severance: "None (Cause)",
    status: "Completed",
    reason: "Gross violation of data confidentiality and NDA policy.",
  },
];

const INITIAL_RESIGNATIONS = [
  {
    id: "RSG-201",
    employee: "Rohan Varma",
    employeeId: "EMP-1044",
    dept: "Design",
    role: "Senior UI Designer",
    submittedDate: "2024-10-01",
    lastWorkingDay: "2024-11-30",
    noticePeriod: "60 Days",
    handoverTo: "Marcus Chen",
    reason: "Pursuing higher education / Master's degree overseas.",
    status: "Approved & Serving Notice",
  },
  {
    id: "RSG-202",
    employee: "Pooja Hegde",
    employeeId: "EMP-1061",
    dept: "HR",
    role: "Talent Recruiter",
    submittedDate: "2024-10-08",
    lastWorkingDay: "2024-12-08",
    noticePeriod: "60 Days",
    handoverTo: "Ayesha Khan",
    reason: "Relocation to family residence in Pune.",
    status: "Pending Manager Review",
  },
  {
    id: "RSG-203",
    employee: "Devansh Nair",
    employeeId: "EMP-1039",
    dept: "Engineering",
    role: "DevOps Engineer",
    submittedDate: "2024-09-10",
    lastWorkingDay: "2024-10-10",
    noticePeriod: "30 Days (Waived 30d)",
    handoverTo: "Liam Cooper",
    reason: "Accepted role closer to home with shorter commute.",
    status: "Clearance in Progress",
  },
];

const INITIAL_COMPLAINTS = [
  {
    id: "CMP-301",
    complainant: "Confidential (Anonymous)",
    against: "Engineering Lead",
    category: "Workplace Harassment / POSH",
    priority: "High",
    filedOn: "2024-10-04",
    assignedInvestigator: "Ayesha Khan (HR Director)",
    status: "Under Investigation",
    summary: "Hostile communication and unfair allocation of sprint workloads during team syncs.",
  },
  {
    id: "CMP-302",
    complainant: "Siddharth Rao",
    against: "Finance Operations Team",
    category: "Reimbursement & Payroll Delay",
    priority: "Medium",
    filedOn: "2024-10-07",
    assignedInvestigator: "James Wilson (CFO)",
    status: "Resolved",
    summary: "Q3 client travel allowance claim delayed past standard 14-day SLA cutoff.",
  },
  {
    id: "CMP-303",
    complainant: "Neha Sharma",
    against: "Facilities / IT Infrastructure",
    category: "Physical Workplace Environment",
    priority: "Low",
    filedOn: "2024-10-09",
    assignedInvestigator: "Adarsh Gupta",
    status: "Open",
    summary: "Ergonomic chair and dual-monitor setup requisition pending for 3 weeks.",
  },
];

const INITIAL_HOLIDAYS = [
  { id: "HOL-01", name: "New Year's Day", date: "2024-01-01", day: "Monday", type: "National Gazetted", appliesTo: "All Locations", status: "Past" },
  { id: "HOL-02", name: "Republic Day", date: "2024-01-26", day: "Friday", type: "National Gazetted", appliesTo: "India Hubs", status: "Past" },
  { id: "HOL-03", name: "Holi (Festival of Colours)", date: "2024-03-25", day: "Monday", type: "Restricted / Optional", appliesTo: "India Hubs", status: "Past" },
  { id: "HOL-04", name: "Independence Day", date: "2024-08-15", day: "Thursday", type: "National Gazetted", appliesTo: "India Hubs", status: "Past" },
  { id: "HOL-05", name: "Gandhi Jayanti", date: "2024-10-02", day: "Wednesday", type: "National Gazetted", appliesTo: "All Locations", status: "Past" },
  { id: "HOL-06", name: "Dussehra (Vijayadashami)", date: "2024-10-12", day: "Saturday", type: "Regional Holiday", appliesTo: "India Hubs", status: "Upcoming" },
  { id: "HOL-07", name: "Diwali / Deepavali", date: "2024-10-31", day: "Thursday", type: "National Gazetted", appliesTo: "All Locations", status: "Upcoming" },
  { id: "HOL-08", name: "Guru Nanak Jayanti", date: "2024-11-15", day: "Friday", type: "Restricted / Optional", appliesTo: "India Hubs", status: "Upcoming" },
  { id: "HOL-09", name: "Christmas Day", date: "2024-12-25", day: "Wednesday", type: "National Gazetted", appliesTo: "All Locations", status: "Upcoming" },
];

export default function HRAdminPage({ defaultTab }) {
  const showToast = useAppStore((s) => s.showToast);
  const [activeTab, setActiveTab] = useState(defaultTab || "teams");

  // Core Data Lists
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [approvalChains, setApprovalChains] = useState(INITIAL_APPROVAL_CHAINS);
  const [terminations, setTerminations] = useState(INITIAL_TERMINATIONS);
  const [resignations, setResignations] = useState(INITIAL_RESIGNATIONS);
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [holidays, setHolidays] = useState(INITIAL_HOLIDAYS);

  // Search & Filter
  const [search, setSearch] = useState("");

  // Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", lead: "", members: 1, approver: "", dept: "Engineering" });

  const [isChainModalOpen, setIsChainModalOpen] = useState(false);
  const [newChain, setNewChain] = useState({ module: "Leave Management", tier1: "", tier2: "", tier3: "—", autoEscalateDays: 3 });

  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);
  const [newTermination, setNewTermination] = useState({
    employee: "",
    employeeId: "",
    dept: "Engineering",
    role: "",
    terminationType: "Involuntary (Performance)",
    noticeDate: "2024-10-11",
    exitDate: "2024-11-11",
    severance: "1 Month Gross",
    reason: "",
  });

  const [isResignationModalOpen, setIsResignationModalOpen] = useState(false);
  const [newResignation, setNewResignation] = useState({
    employee: "",
    employeeId: "",
    dept: "Engineering",
    role: "",
    submittedDate: "2024-10-11",
    lastWorkingDay: "2024-12-11",
    noticePeriod: "60 Days",
    handoverTo: "",
    reason: "",
  });

  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    complainant: "",
    against: "",
    category: "Workplace Harassment / POSH",
    priority: "High",
    assignedInvestigator: "Ayesha Khan (HR Director)",
    summary: "",
  });

  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "2024-11-01",
    day: "Friday",
    type: "National Gazetted",
    appliesTo: "All Locations",
  });

  // Org Settings State
  const [orgSettings, setOrgSettings] = useState({
    companyName: "Evenmore Infotech Ltd.",
    workWeek: "Monday - Friday (5 Days)",
    timezone: "IST (UTC +05:30) — Asia/Kolkata",
    fiscalYearStart: "April 01",
    probationPeriod: "90 Days (3 Months)",
    noticePeriod: "60 Days (2 Months)",
    allowEmployeeDelegation: true,
    requireTwoFactorForAdmin: true,
  });

  // Handlers
  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (!newTeam.name) return;
    const created = { id: `T-0${teams.length + 1}`, ...newTeam, members: Number(newTeam.members) || 1 };
    setTeams([...teams, created]);
    setIsTeamModalOpen(false);
    setNewTeam({ name: "", lead: "", members: 1, approver: "", dept: "Engineering" });
    showToast(`Team "${created.name}" created`);
  };

  const handleCreateChain = (e) => {
    e.preventDefault();
    if (!newChain.tier1) return;
    const created = { id: `AC-0${approvalChains.length + 1}`, ...newChain, status: "Active" };
    setApprovalChains([...approvalChains, created]);
    setIsChainModalOpen(false);
    setNewChain({ module: "Leave Management", tier1: "", tier2: "", tier3: "—", autoEscalateDays: 3 });
    showToast(`Approval Chain for ${created.module} configured`);
  };

  const handleCreateTermination = (e) => {
    e.preventDefault();
    if (!newTermination.employee) return;
    const created = {
      id: `TRM-${100 + terminations.length + 1}`,
      ...newTermination,
      status: "In Exit Clearance",
    };
    setTerminations([created, ...terminations]);
    setIsTerminationModalOpen(false);
    setNewTermination({
      employee: "",
      employeeId: "",
      dept: "Engineering",
      role: "",
      terminationType: "Involuntary (Performance)",
      noticeDate: "2024-10-11",
      exitDate: "2024-11-11",
      severance: "1 Month Gross",
      reason: "",
    });
    showToast(`Termination order logged for ${created.employee}`);
  };

  const handleCreateResignation = (e) => {
    e.preventDefault();
    if (!newResignation.employee) return;
    const created = {
      id: `RSG-${200 + resignations.length + 1}`,
      ...newResignation,
      status: "Pending Manager Review",
    };
    setResignations([created, ...resignations]);
    setIsResignationModalOpen(false);
    setNewResignation({
      employee: "",
      employeeId: "",
      dept: "Engineering",
      role: "",
      submittedDate: "2024-10-11",
      lastWorkingDay: "2024-12-11",
      noticePeriod: "60 Days",
      handoverTo: "",
      reason: "",
    });
    showToast(`Resignation recorded for ${created.employee}`);
  };

  const handleCreateComplaint = (e) => {
    e.preventDefault();
    if (!newComplaint.summary) return;
    const created = {
      id: `CMP-${300 + complaints.length + 1}`,
      ...newComplaint,
      complainant: newComplaint.complainant || "Anonymous",
      filedOn: "2024-10-11",
      status: "Open",
    };
    setComplaints([created, ...complaints]);
    setIsComplaintModalOpen(false);
    setNewComplaint({
      complainant: "",
      against: "",
      category: "Workplace Harassment / POSH",
      priority: "High",
      assignedInvestigator: "Ayesha Khan (HR Director)",
      summary: "",
    });
    showToast(`Grievance ticket ${created.id} registered`);
  };

  const handleCreateHoliday = (e) => {
    e.preventDefault();
    if (!newHoliday.name) return;
    const created = {
      id: `HOL-0${holidays.length + 1}`,
      ...newHoliday,
      status: "Upcoming",
    };
    setHolidays([...holidays, created]);
    setIsHolidayModalOpen(false);
    setNewHoliday({ name: "", date: "2024-11-01", day: "Friday", type: "National Gazetted", appliesTo: "All Locations" });
    showToast(`Holiday "${created.name}" added to calendar`);
  };

  const handleSaveOrgSettings = (e) => {
    e.preventDefault();
    showToast("Organization configuration updated successfully");
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900">HR Admin Setup &amp; Governance</h1>
          <p className="text-[13px] text-muted">
            Configure organization settings, exits &amp; resignations, grievances, and holiday calendars.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "teams" && (
            <button
              type="button"
              onClick={() => setIsTeamModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium hover:bg-navy/90 transition shadow-xs"
            >
              <Plus size={16} /> Add Team
            </button>
          )}
          {activeTab === "approvals" && (
            <button
              type="button"
              onClick={() => setIsChainModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium hover:bg-navy/90 transition shadow-xs"
            >
              <Plus size={16} /> New Approval Chain
            </button>
          )}
          {activeTab === "terminations" && (
            <button
              type="button"
              onClick={() => setIsTerminationModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-700 text-white rounded-xl text-[13.5px] font-medium hover:bg-red-800 transition shadow-xs"
            >
              <UserX size={16} /> Record Termination
            </button>
          )}
          {activeTab === "resignations" && (
            <button
              type="button"
              onClick={() => setIsResignationModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium hover:bg-navy/90 transition shadow-xs"
            >
              <UserMinus size={16} /> Submit Resignation
            </button>
          )}
          {activeTab === "complaints" && (
            <button
              type="button"
              onClick={() => setIsComplaintModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 text-white rounded-xl text-[13.5px] font-medium hover:bg-amber-800 transition shadow-xs"
            >
              <MessageSquareWarning size={16} /> File Grievance / Complaint
            </button>
          )}
          {activeTab === "holidays" && (
            <button
              type="button"
              onClick={() => setIsHolidayModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium hover:bg-navy/90 transition shadow-xs"
            >
              <Calendar size={16} /> Add Holiday
            </button>
          )}
          {activeTab === "settings" && (
            <button
              type="button"
              onClick={handleSaveOrgSettings}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium hover:bg-navy/90 transition shadow-xs"
            >
              <CheckCircle2 size={16} /> Save Configuration
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
        <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
          <div className="text-[11.5px] text-muted flex items-center justify-between">
            <span>Teams</span>
            <Users size={15} className="text-[#1e3a8a]" />
          </div>
          <div className="text-[20px] font-bold mt-1 text-slate-900">{teams.length}</div>
          <div className="text-[10.5px] text-muted">Across 4 depts</div>
        </div>
        <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
          <div className="text-[11.5px] text-muted flex items-center justify-between">
            <span>Workflows</span>
            <ShieldCheck size={15} className="text-emerald-600" />
          </div>
          <div className="text-[20px] font-bold mt-1 text-slate-900">{approvalChains.length}</div>
          <div className="text-[10.5px] text-muted">Multi-tier active</div>
        </div>
        <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
          <div className="text-[11.5px] text-muted flex items-center justify-between">
            <span>Terminations</span>
            <UserX size={15} className="text-red-600" />
          </div>
          <div className="text-[20px] font-bold mt-1 text-red-600">{terminations.length}</div>
          <div className="text-[10.5px] text-muted">Exits recorded</div>
        </div>
        <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
          <div className="text-[11.5px] text-muted flex items-center justify-between">
            <span>Resignations</span>
            <UserMinus size={15} className="text-amber-600" />
          </div>
          <div className="text-[20px] font-bold mt-1 text-slate-900">{resignations.length}</div>
          <div className="text-[10.5px] text-muted">Serving notice</div>
        </div>
        <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
          <div className="text-[11.5px] text-muted flex items-center justify-between">
            <span>Grievances</span>
            <MessageSquareWarning size={15} className="text-purple-600" />
          </div>
          <div className="text-[20px] font-bold mt-1 text-slate-900">{complaints.length}</div>
          <div className="text-[10.5px] text-muted">Active tickets</div>
        </div>
        <div className="bg-white border border-bdr rounded-xl p-3.5 shadow-xs">
          <div className="text-[11.5px] text-muted flex items-center justify-between">
            <span>Holidays (2024)</span>
            <Calendar size={15} className="text-blue-600" />
          </div>
          <div className="text-[20px] font-bold mt-1 text-slate-900">{holidays.length}</div>
          <div className="text-[10.5px] text-muted">Gazetted &amp; opt</div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-bdr gap-2 sm:gap-6 text-[13.5px] font-semibold overflow-x-auto no-scrollbar">
        {[
          { id: "teams", label: "Teams & Squads" },
          { id: "approvals", label: "Approval Chains" },
          { id: "terminations", label: `Termination List (${terminations.length})` },
          { id: "resignations", label: `Resignation List (${resignations.length})` },
          { id: "complaints", label: `Complaint & Grievance List (${complaints.length})` },
          { id: "holidays", label: `Holidays Calendar Setup (${holidays.length})` },
          { id: "settings", label: "Org Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setSearch("");
            }}
            className={`pb-3 whitespace-nowrap relative transition ${
              activeTab === tab.id ? "text-slate-900 font-bold" : "text-muted hover:text-slate-900"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy" />}
          </button>
        ))}
      </div>

      {/* ── TAB 1: TEAMS & SQUADS ── */}
      {activeTab === "teams" && (
        <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                <tr>
                  <th className="py-3 px-5">Team Name</th>
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Department</th>
                  <th className="py-3 px-5">Team Lead</th>
                  <th className="py-3 px-5">Headcount</th>
                  <th className="py-3 px-5">Default Approver</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bdr/40">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-off/60 transition">
                    <td className="py-4 px-5 font-semibold text-slate-900">{t.name}</td>
                    <td className="py-4 px-5 text-muted font-mono text-[12px]">{t.id}</td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 bg-off border border-bdr rounded-full text-[11px]">
                        {t.dept}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-800">{t.lead}</td>
                    <td className="py-4 px-5 text-slate-700">{t.members} members</td>
                    <td className="py-4 px-5 text-slate-700">{t.approver}</td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => showToast(`Edit ${t.name}`)}
                        className="p-1.5 hover:bg-off rounded-lg text-muted hover:text-slate-900"
                        title="Edit Team"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: APPROVAL CHAINS ── */}
      {activeTab === "approvals" && (
        <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                <tr>
                  <th className="py-3 px-5">Module</th>
                  <th className="py-3 px-5">Tier 1 (First Line)</th>
                  <th className="py-3 px-5">Tier 2 (Managerial)</th>
                  <th className="py-3 px-5">Tier 3 (Final Authority)</th>
                  <th className="py-3 px-5">SLA Escalation</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bdr/40">
                {approvalChains.map((c) => (
                  <tr key={c.id} className="hover:bg-off/60 transition">
                    <td className="py-4 px-5 font-semibold text-slate-900">{c.module}</td>
                    <td className="py-4 px-5 text-slate-800">{c.tier1}</td>
                    <td className="py-4 px-5 text-slate-800">{c.tier2}</td>
                    <td className="py-4 px-5 text-slate-600">{c.tier3}</td>
                    <td className="py-4 px-5 text-slate-700">{c.autoEscalateDays} days</td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px]">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => showToast(`Edit chain ${c.module}`)}
                        className="p-1.5 hover:bg-off rounded-lg text-muted hover:text-slate-900"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: TERMINATION LIST ── */}
      {activeTab === "terminations" && (
        <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-bdr flex flex-wrap items-center justify-between gap-3 bg-off/50">
            <span className="text-[13px] font-semibold text-slate-800">
              Involuntary Exits &amp; Disciplinary Records
            </span>
            <span className="text-[12px] text-muted">Legal compliance and exit clearance status</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                <tr>
                  <th className="py-3 px-5">Employee &amp; ID</th>
                  <th className="py-3 px-5">Department &amp; Role</th>
                  <th className="py-3 px-5">Termination Type</th>
                  <th className="py-3 px-5">Notice &amp; Exit Date</th>
                  <th className="py-3 px-5">Severance Terms</th>
                  <th className="py-3 px-5">Clearance Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bdr/40">
                {terminations.map((t) => (
                  <tr key={t.id} className="hover:bg-off/60 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{t.employee}</div>
                      <div className="text-[11px] font-mono text-muted">{t.employeeId} • {t.id}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-800 font-medium">{t.role}</div>
                      <div className="text-[11px] text-muted">{t.dept}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                        {t.terminationType}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-800">Exit: <b>{t.exitDate}</b></div>
                      <div className="text-[11px] text-muted">Notice: {t.noticeDate}</div>
                    </td>
                    <td className="py-4 px-5 text-slate-700">{t.severance}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          t.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => showToast(`Reason: ${t.reason}`)}
                        className="p-1.5 hover:bg-off rounded-lg text-muted hover:text-slate-900"
                        title="View Reason"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: RESIGNATION LIST ── */}
      {activeTab === "resignations" && (
        <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-bdr flex flex-wrap items-center justify-between gap-3 bg-off/50">
            <span className="text-[13px] font-semibold text-slate-800">
              Voluntary Resignations &amp; Notice Period Tracker
            </span>
            <span className="text-[12px] text-muted">Knowledge transfer and handover coordination</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                <tr>
                  <th className="py-3 px-5">Employee &amp; ID</th>
                  <th className="py-3 px-5">Role &amp; Department</th>
                  <th className="py-3 px-5">Submission Date</th>
                  <th className="py-3 px-5">Last Working Day</th>
                  <th className="py-3 px-5">Handover Assignee</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bdr/40">
                {resignations.map((r) => (
                  <tr key={r.id} className="hover:bg-off/60 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{r.employee}</div>
                      <div className="text-[11px] font-mono text-muted">{r.employeeId} • {r.id}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-800 font-medium">{r.role}</div>
                      <div className="text-[11px] text-muted">{r.dept}</div>
                    </td>
                    <td className="py-4 px-5 text-slate-700">{r.submittedDate}</td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{r.lastWorkingDay}</div>
                      <div className="text-[11px] text-muted">Notice: {r.noticePeriod}</div>
                    </td>
                    <td className="py-4 px-5 text-slate-800">{r.handoverTo}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          r.status.includes("Approved")
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : r.status.includes("Clearance")
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => showToast(`Resignation Reason: ${r.reason}`)}
                        className="p-1.5 hover:bg-off rounded-lg text-muted hover:text-slate-900"
                        title="View Reason"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: COMPLAINT & GRIEVANCE LIST ── */}
      {activeTab === "complaints" && (
        <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-bdr flex flex-wrap items-center justify-between gap-3 bg-off/50">
            <span className="text-[13px] font-semibold text-slate-800">
              Employee Grievances, POSH &amp; Compliance Inquiries
            </span>
            <span className="text-[12px] text-muted">Confidential investigation and resolution records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                <tr>
                  <th className="py-3 px-5">Ticket &amp; Filed On</th>
                  <th className="py-3 px-5">Complainant / Against</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Priority</th>
                  <th className="py-3 px-5">Assigned Investigator</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bdr/40">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-off/60 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{c.id}</div>
                      <div className="text-[11px] text-muted">{c.filedOn}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-900 font-medium">By: {c.complainant}</div>
                      <div className="text-[11px] text-muted">Target: {c.against}</div>
                    </td>
                    <td className="py-4 px-5 text-slate-800 font-medium">{c.category}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                          c.priority === "High"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : c.priority === "Medium"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-800">{c.assignedInvestigator}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          c.status === "Resolved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : c.status === "Under Investigation"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => showToast(`Grievance: ${c.summary}`)}
                        className="p-1.5 hover:bg-off rounded-lg text-muted hover:text-slate-900"
                        title="View Summary"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 6: HOLIDAYS SETUP CALENDAR ── */}
      {activeTab === "holidays" && (
        <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-bdr flex flex-wrap items-center justify-between gap-3 bg-off/50">
            <span className="text-[13px] font-semibold text-slate-800">
              Annual Enterprise Holiday Schedule (2024–2025)
            </span>
            <span className="text-[12px] text-muted">Synchronized across Personal Calendar &amp; Attendance modules</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
                <tr>
                  <th className="py-3 px-5">Holiday Name</th>
                  <th className="py-3 px-5">Date &amp; Day</th>
                  <th className="py-3 px-5">Classification</th>
                  <th className="py-3 px-5">Applies To</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bdr/40">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-off/60 transition">
                    <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2">
                      <Calendar size={15} className="text-navy" />
                      {h.name}
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-900 font-medium">{h.date}</div>
                      <div className="text-[11px] text-muted">{h.day}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-off border border-bdr text-slate-700">
                        {h.type}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-800">{h.appliesTo}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          h.status === "Upcoming"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => showToast(`Edit holiday ${h.name}`)}
                        className="p-1.5 hover:bg-off rounded-lg text-muted hover:text-slate-900"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 7: GENERAL ORGANIZATION SETTINGS ── */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveOrgSettings} className="bg-white border border-bdr rounded-2xl p-6 shadow-xs flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Legal Company Name</label>
              <input
                type="text"
                value={orgSettings.companyName}
                onChange={(e) => setOrgSettings({ ...orgSettings, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Default Work Week</label>
              <select
                value={orgSettings.workWeek}
                onChange={(e) => setOrgSettings({ ...orgSettings, workWeek: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer"
              >
                <option>Monday - Friday (5 Days)</option>
                <option>Monday - Saturday (6 Days)</option>
                <option>Alternate Saturdays Off (5.5 Days)</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Primary Office Timezone</label>
              <select
                value={orgSettings.timezone}
                onChange={(e) => setOrgSettings({ ...orgSettings, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer"
              >
                <option>IST (UTC +05:30) — Asia/Kolkata</option>
                <option>EST (UTC -05:00) — America/New_York</option>
                <option>GMT (UTC +00:00) — Europe/London</option>
                <option>GST (UTC +04:00) — Asia/Dubai</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Fiscal Year Start</label>
              <select
                value={orgSettings.fiscalYearStart}
                onChange={(e) => setOrgSettings({ ...orgSettings, fiscalYearStart: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy cursor-pointer"
              >
                <option>April 01 (Indian Standard Fiscal Cycle)</option>
                <option>January 01 (Calendar Year)</option>
                <option>July 01</option>
                <option>October 01</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Standard Probation Period</label>
              <input
                type="text"
                value={orgSettings.probationPeriod}
                onChange={(e) => setOrgSettings({ ...orgSettings, probationPeriod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Standard Notice Period</label>
              <input
                type="text"
                value={orgSettings.noticePeriod}
                onChange={(e) => setOrgSettings({ ...orgSettings, noticePeriod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-bdr flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={orgSettings.allowEmployeeDelegation}
                onChange={(e) => setOrgSettings({ ...orgSettings, allowEmployeeDelegation: e.target.checked })}
                className="w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer"
              />
              <span className="text-[13px] text-slate-800">
                Allow team members to designate peer delegates during planned leaves
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={orgSettings.requireTwoFactorForAdmin}
                onChange={(e) => setOrgSettings({ ...orgSettings, requireTwoFactorForAdmin: e.target.checked })}
                className="w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer"
              />
              <span className="text-[13px] text-slate-800">
                Enforce mandatory 2-Factor Authentication (2FA) for HR and Operations Admin accounts
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium hover:bg-navy/90 transition shadow-xs"
            >
              Save Organization Settings
            </button>
          </div>
        </form>
      )}

      {/* ── Modal: Add Team ── */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <h3 className="font-bold text-[16px] text-slate-900">Create New Team</h3>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-off grid place-items-center text-muted hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Engineering Squad"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Department</label>
                  <select
                    value={newTeam.dept}
                    onChange={(e) => setNewTeam({ ...newTeam, dept: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option>Engineering</option>
                    <option>HR</option>
                    <option>Finance</option>
                    <option>Design</option>
                    <option>Marketing</option>
                    <option>Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Headcount</label>
                  <input
                    type="number"
                    min="1"
                    value={newTeam.members}
                    onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Team Lead</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Cooper"
                  value={newTeam.lead}
                  onChange={(e) => setNewTeam({ ...newTeam, lead: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Default Approver</label>
                <input
                  type="text"
                  placeholder="e.g. David Park"
                  value={newTeam.approver}
                  onChange={(e) => setNewTeam({ ...newTeam, approver: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 border border-bdr rounded-xl text-[13px] hover:bg-off font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-xl text-[13px] font-medium hover:bg-navy/90"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Approval Chain ── */}
      {isChainModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <h3 className="font-bold text-[16px] text-slate-900">New Approval Chain</h3>
              <button
                type="button"
                onClick={() => setIsChainModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-off grid place-items-center text-muted hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateChain} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Target Module</label>
                <select
                  value={newChain.module}
                  onChange={(e) => setNewChain({ ...newChain, module: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                >
                  <option>Leave Management</option>
                  <option>Attendance Regularization</option>
                  <option>Asset Allocation</option>
                  <option>Payroll Revisions</option>
                  <option>Expense Reimbursement</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Tier 1 Approver</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Line Manager"
                  value={newChain.tier1}
                  onChange={(e) => setNewChain({ ...newChain, tier1: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Tier 2 Approver</label>
                <input
                  type="text"
                  placeholder="e.g. Department Head"
                  value={newChain.tier2}
                  onChange={(e) => setNewChain({ ...newChain, tier2: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Tier 3 (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. HR Director"
                    value={newChain.tier3}
                    onChange={(e) => setNewChain({ ...newChain, tier3: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">SLA Escalation</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={newChain.autoEscalateDays}
                    onChange={(e) => setNewChain({ ...newChain, autoEscalateDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsChainModalOpen(false)}
                  className="px-4 py-2 border border-bdr rounded-xl text-[13px] hover:bg-off font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-xl text-[13px] font-medium hover:bg-navy/90"
                >
                  Save Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Record Termination ── */}
      {isTerminationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <h3 className="font-bold text-[16px] text-slate-900">Record Employee Termination</h3>
              <button
                type="button"
                onClick={() => setIsTerminationModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-off grid place-items-center text-muted hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTermination} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Employee Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sameer Dixit"
                    value={newTermination.employee}
                    onChange={(e) => setNewTermination({ ...newTermination, employee: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-1099"
                    value={newTermination.employeeId}
                    onChange={(e) => setNewTermination({ ...newTermination, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Department</label>
                  <select
                    value={newTermination.dept}
                    onChange={(e) => setNewTermination({ ...newTermination, dept: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option>Engineering</option>
                    <option>Sales & Marketing</option>
                    <option>Operations</option>
                    <option>HR</option>
                    <option>Finance</option>
                    <option>Design</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Designation / Role</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Staff Architect"
                    value={newTermination.role}
                    onChange={(e) => setNewTermination({ ...newTermination, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Termination Type</label>
                  <select
                    value={newTermination.terminationType}
                    onChange={(e) => setNewTermination({ ...newTermination, terminationType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option>Involuntary (Performance)</option>
                    <option>Disciplinary / Breach</option>
                    <option>Redundancy / Restructuring</option>
                    <option>Contract Non-Renewal</option>
                    <option>Probation Failure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Severance Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Months Gross"
                    value={newTermination.severance}
                    onChange={(e) => setNewTermination({ ...newTermination, severance: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Notice Served Date</label>
                  <input
                    type="date"
                    value={newTermination.noticeDate}
                    onChange={(e) => setNewTermination({ ...newTermination, noticeDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Exit Date</label>
                  <input
                    type="date"
                    value={newTermination.exitDate}
                    onChange={(e) => setNewTermination({ ...newTermination, exitDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Reason &amp; Legal Context</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize the background, review documents, and justification..."
                  value={newTermination.reason}
                  onChange={(e) => setNewTermination({ ...newTermination, reason: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsTerminationModalOpen(false)}
                  className="px-4 py-2 border border-bdr rounded-xl text-[13px] hover:bg-off font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 text-white rounded-xl text-[13px] font-medium hover:bg-red-800"
                >
                  Confirm Termination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Submit Resignation ── */}
      {isResignationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <h3 className="font-bold text-[16px] text-slate-900">Log Voluntary Resignation</h3>
              <button
                type="button"
                onClick={() => setIsResignationModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-off grid place-items-center text-muted hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateResignation} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Employee Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shalini Roy"
                    value={newResignation.employee}
                    onChange={(e) => setNewResignation({ ...newResignation, employee: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-1045"
                    value={newResignation.employeeId}
                    onChange={(e) => setNewResignation({ ...newResignation, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Department</label>
                  <select
                    value={newResignation.dept}
                    onChange={(e) => setNewResignation({ ...newResignation, dept: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option>Engineering</option>
                    <option>Design</option>
                    <option>Product</option>
                    <option>HR</option>
                    <option>Finance</option>
                    <option>Sales & Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Designation / Role</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Product Analyst"
                    value={newResignation.role}
                    onChange={(e) => setNewResignation({ ...newResignation, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Submission Date</label>
                  <input
                    type="date"
                    value={newResignation.submittedDate}
                    onChange={(e) => setNewResignation({ ...newResignation, submittedDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Last Working Day</label>
                  <input
                    type="date"
                    value={newResignation.lastWorkingDay}
                    onChange={(e) => setNewResignation({ ...newResignation, lastWorkingDay: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Notice Period</label>
                  <input
                    type="text"
                    placeholder="e.g. 60 Days (Full)"
                    value={newResignation.noticePeriod}
                    onChange={(e) => setNewResignation({ ...newResignation, noticePeriod: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Handover Assigned To</label>
                  <input
                    type="text"
                    placeholder="e.g. David Park"
                    value={newResignation.handoverTo}
                    onChange={(e) => setNewResignation({ ...newResignation, handoverTo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Stated Reason for Leaving</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Career growth, higher education, personal relocation..."
                  value={newResignation.reason}
                  onChange={(e) => setNewResignation({ ...newResignation, reason: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsResignationModalOpen(false)}
                  className="px-4 py-2 border border-bdr rounded-xl text-[13px] hover:bg-off font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-xl text-[13px] font-medium hover:bg-navy/90"
                >
                  Record Resignation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: File Complaint / Grievance ── */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <h3 className="font-bold text-[16px] text-slate-900">Register Grievance / Complaint</h3>
              <button
                type="button"
                onClick={() => setIsComplaintModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-off grid place-items-center text-muted hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateComplaint} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Complainant (or Anonymous)</label>
                  <input
                    type="text"
                    placeholder="Leave blank for Anonymous"
                    value={newComplaint.complainant}
                    onChange={(e) => setNewComplaint({ ...newComplaint, complainant: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Target Individual / Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT Helpdesk or Team Lead"
                    value={newComplaint.against}
                    onChange={(e) => setNewComplaint({ ...newComplaint, against: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={newComplaint.category}
                    onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option>Workplace Harassment / POSH</option>
                    <option>Reimbursement & Payroll Delay</option>
                    <option>Physical Workplace Environment</option>
                    <option>Management / Discrimination</option>
                    <option>Ethics & Compliance Violation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Priority Level</label>
                  <select
                    value={newComplaint.priority}
                    onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Assign Lead Investigator</label>
                <input
                  type="text"
                  required
                  value={newComplaint.assignedInvestigator}
                  onChange={(e) => setNewComplaint({ ...newComplaint, assignedInvestigator: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Summary of Grievance</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed description of incidents, dates, and impact..."
                  value={newComplaint.summary}
                  onChange={(e) => setNewComplaint({ ...newComplaint, summary: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="px-4 py-2 border border-bdr rounded-xl text-[13px] hover:bg-off font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 text-white rounded-xl text-[13px] font-medium hover:bg-amber-800"
                >
                  File Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Holiday ── */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <h3 className="font-bold text-[16px] text-slate-900">Add Holiday to Calendar</h3>
              <button
                type="button"
                onClick={() => setIsHolidayModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-off grid place-items-center text-muted hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateHoliday} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eid-ul-Fitr"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Holiday Date</label>
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Day of Week</label>
                  <input
                    type="text"
                    placeholder="e.g. Friday"
                    value={newHoliday.day}
                    onChange={(e) => setNewHoliday({ ...newHoliday, day: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Classification</label>
                  <select
                    value={newHoliday.type}
                    onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option>National Gazetted</option>
                    <option>Regional Holiday</option>
                    <option>Restricted / Optional</option>
                    <option>Company Milestone Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Applies To</label>
                  <input
                    type="text"
                    value={newHoliday.appliesTo}
                    onChange={(e) => setNewHoliday({ ...newHoliday, appliesTo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-4 py-2 border border-bdr rounded-xl text-[13px] hover:bg-off font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-xl text-[13px] font-medium hover:bg-navy/90"
                >
                  Add Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
