import { useState, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
import { useCalendarStore } from "../../../stores/calendarStore";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import { Badge } from "../../../components/hrms/Badge";
import Modal from "../../../components/ui/Modal";
import {
  Calendar,
  Search,
  AlertTriangle,
  Info,
  Check,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Plane,
  HeartPulse,
  Coffee,
  X,
} from "lucide-react";

export default function Leave() {
  const {
    leaves = [],
    approveLeave,
    rejectLeave,
    addLeave,
    showToast,
    employees = [],
    currentUser,
  } = useAppStore();

  const calendarEvents = useCalendarStore((s) => s.events || []);
  const addCalendarEvent = useCalendarStore((s) => s.addEvent);
  const updateAttendanceRecord = useAttendanceStore((s) => s.updateRecord);

  const [tab, setTab] = useState("assigned");

  // Approval filters
  const [approvalSearch, setApprovalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Modal states
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveToReject, setSelectedLeaveToReject] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [detailModalLeave, setDetailModalLeave] = useState(null);

  const [form, setForm] = useState({
    employeeName: "Ayesha Khan",
    type: "Annual Leave",
    from: "2024-10-20",
    to: "2024-10-24",
    reason: "",
    delegateSearch: "",
    delegate: "Priya Patel",
    handover: "",
  });
  const [delegateSelect, setDelegateSelect] = useState({});

  // Dynamic leave balances
  const leaveBalances = useMemo(() => {
    const defaultBalances = {
      annual: { total: 18, used: 4, label: "Annual Leave", icon: Plane },
      sick: { total: 10, used: 2, label: "Sick Leave", icon: HeartPulse },
      casual: { total: 7, used: 1, label: "Casual Leave", icon: Coffee },
      floating: { total: 3, used: 0, label: "Floating Holiday", icon: Sparkles },
    };

    const activeEmpLeaves = leaves.filter(
      (l) =>
        (l.employee?.toLowerCase() === form.employeeName.toLowerCase() ||
          l.employee?.toLowerCase() === "ayesha khan") &&
        l.status !== "Rejected"
    );

    activeEmpLeaves.forEach((l) => {
      const days = Number(l.days) || 1;
      if (l.type?.includes("Annual")) defaultBalances.annual.used = Math.min(defaultBalances.annual.total, defaultBalances.annual.used + days);
      else if (l.type?.includes("Sick")) defaultBalances.sick.used = Math.min(defaultBalances.sick.total, defaultBalances.sick.used + days);
      else if (l.type?.includes("Casual")) defaultBalances.casual.used = Math.min(defaultBalances.casual.total, defaultBalances.casual.used + days);
    });

    return defaultBalances;
  }, [leaves, form.employeeName]);

  const filteredEmployees = useMemo(() => {
    if (!form.delegateSearch) return [];
    return employees
      .filter((e) =>
        e.name.toLowerCase().includes(form.delegateSearch.toLowerCase()) &&
        e.name.toLowerCase() !== form.employeeName.toLowerCase()
      )
      .slice(0, 5);
  }, [employees, form.delegateSearch, form.employeeName]);

  // Check if requested leave interval overlaps with official holidays
  const holidayOverlap = useMemo(() => {
    if (!form.from || !form.to) return [];
    return calendarEvents.filter((ev) => {
      if (ev.type !== "Holiday") return false;
      const hDate = ev.startDate || ev.date;
      return hDate >= form.from && hDate <= form.to;
    });
  }, [calendarEvents, form.from, form.to]);

  const calculatedDays = useMemo(() => {
    if (!form.from || !form.to) return 0;
    const start = new Date(form.from);
    const end = new Date(form.to);
    if (end < start) return 0;
    const diffTime = Math.abs(end - start);
    const raw = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, raw - holidayOverlap.length);
  }, [form.from, form.to, holidayOverlap.length]);

  function submitLeave() {
    if (!form.reason.trim()) return showToast("Reason required for leave application");
    if (new Date(form.to) < new Date(form.from)) return showToast("To Date cannot be before From Date");

    const netDeductedDays = calculatedDays;
    const chosenDelegate = form.delegate || "Priya Patel";
    const chosenDelegateEmp = employees.find((e) => e.name === chosenDelegate);

    addLeave({
      id: "LV-" + Date.now().toString().slice(-4),
      employee: form.employeeName,
      avatar: `https://i.pravatar.cc/100?u=${encodeURIComponent(form.employeeName)}`,
      type: form.type,
      from: form.from,
      to: form.to,
      days: netDeductedDays,
      reason: form.reason,
      delegate: chosenDelegate,
      delegateAvatar: chosenDelegateEmp?.avatar || `https://i.pravatar.cc/100?u=${encodeURIComponent(chosenDelegate)}`,
      status: "Pending Review",
      handover: form.handover || "General coverage of active tasks.",
      submittedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    });

    if (addCalendarEvent) {
      addCalendarEvent({
        title: `${form.type} (${form.employeeName})`,
        startDate: form.from,
        endDate: form.to,
        type: "Leave",
        time: "Full Day",
        location: "Out of Office",
        dept: "General",
        organizer: form.employeeName,
        description: `Coverage delegate: ${chosenDelegate}. Reason: ${form.reason}`,
      });
    }

    if (holidayOverlap.length > 0) {
      showToast(
        `Leave applied (${netDeductedDays} days deducted). ${holidayOverlap.length} holiday(s) excluded: ${holidayOverlap.map((h) => h.title).join(", ")}`
      );
    } else {
      showToast("Leave applied — manager & delegate notified");
    }

    setForm({ ...form, reason: "", handover: "", delegateSearch: "" });
    setApplyModalOpen(false);
  }

  function handleApprove(leaveItem) {
    const chosenDelegate = delegateSelect[leaveItem.id] ?? leaveItem.delegate;
    approveLeave(leaveItem.id, chosenDelegate);

    const matchingEmp = employees.find(
      (e) => e.name.toLowerCase() === leaveItem.employee.toLowerCase()
    );
    if (matchingEmp && updateAttendanceRecord) {
      updateAttendanceRecord(matchingEmp.id, { status: "On Leave" });
    }

    showToast(`Leave approved for ${leaveItem.employee} with delegate ${chosenDelegate}.`);
  }

  function handleOpenReject(leaveItem) {
    setSelectedLeaveToReject(leaveItem);
    setRejectReasonInput("");
    setRejectModalOpen(true);
  }

  function handleConfirmReject() {
    if (!selectedLeaveToReject) return;
    if (rejectLeave) {
      rejectLeave(selectedLeaveToReject.id, rejectReasonInput || "Scheduling conflict / insufficient coverage.");
    }
    showToast(`Leave request for ${selectedLeaveToReject.employee} has been rejected.`);
    setRejectModalOpen(false);
    setSelectedLeaveToReject(null);
  }

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const matchSearch =
        l.employee?.toLowerCase().includes(approvalSearch.toLowerCase()) ||
        l.reason?.toLowerCase().includes(approvalSearch.toLowerCase()) ||
        l.id?.toLowerCase().includes(approvalSearch.toLowerCase());
      const matchStatus = statusFilter === "All" || l.status === statusFilter;
      const matchType = typeFilter === "All" || l.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [leaves, approvalSearch, statusFilter, typeFilter]);

  const userDelegations = useMemo(() => {
    const currentUserName = currentUser?.name || "Ayesha Khan";

    const assigned = leaves
      .filter((l) => l.delegate?.toLowerCase() === currentUserName.toLowerCase() || l.delegate === "Priya Patel")
      .map((l) => ({
        id: l.id,
        emp: l.employee,
        avatar: l.avatar,
        dates: `${l.from} – ${l.to}`,
        note: l.handover || l.reason || "Handover of ongoing deliverables and client communications.",
        status: l.status === "Approved" ? "Active" : l.status === "Rejected" ? "Declined" : "Upcoming",
        type: l.type,
      }));

    const mine = leaves
      .filter((l) => l.employee?.toLowerCase() === currentUserName.toLowerCase())
      .map((l) => ({
        id: l.id,
        emp: l.delegate || "Assigned Colleague",
        avatar: l.delegateAvatar || `https://i.pravatar.cc/100?u=${encodeURIComponent(l.delegate || "delegate")}`,
        dates: `${l.from} – ${l.to}`,
        note: l.handover || l.reason || "Client coordination and urgent ticket escalation coverage.",
        status: l.status === "Approved" ? "Active" : l.status === "Rejected" ? "Declined" : "Upcoming",
        type: l.type,
      }));

    return {
      assigned: assigned.length > 0 ? assigned : [
        {
          id: "DLG-101",
          emp: "Liam Cooper",
          avatar: "https://i.pravatar.cc/100?img=20",
          dates: "Oct 20 - 24, 2024",
          note: "Handle client demo + push release v2.3 to staging.",
          status: "Upcoming",
          type: "Annual Leave",
        },
        {
          id: "DLG-102",
          emp: "David Park",
          avatar: "https://i.pravatar.cc/100?img=11",
          dates: "Oct 02 - 14, 2024",
          note: "Payroll verification & DevOps infrastructure signoff.",
          status: "Active",
          type: "Annual Leave",
        },
      ],
      mine: mine.length > 0 ? mine : [
        {
          id: "DLG-103",
          emp: "Priya Patel",
          avatar: "https://i.pravatar.cc/100?img=15",
          dates: "Oct 12 - 13, 2024",
          note: "Q3 report draft in shared team drive.",
          status: "Active",
          type: "Casual Leave",
        },
      ],
    };
  }, [leaves, currentUser]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Leave Management</h1>
          <p className="text-[13px] text-muted">Apply, approve, monitor leave quotas, and track team delegations</p>
        </div>
        <button
          type="button"
          onClick={() => setApplyModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium shadow-xs hover:bg-navy/90 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Apply Leave
        </button>
      </div>

      {/* ── Leave Quota Balance Cards Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(leaveBalances).map(([key, item]) => {
          const remaining = Math.max(0, item.total - item.used);
          const percent = Math.round((remaining / item.total) * 100);
          const IconComp = item.icon;

          return (
            <div
              key={key}
              className="bg-white border border-bdr rounded-2xl p-4.5 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-slate-600 uppercase tracking-wide">
                  {item.label}
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <IconComp size={16} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">
                    {remaining}
                  </span>
                  <span className="text-[12px] text-muted font-medium">/ {item.total} days left</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {item.used} used
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-navy rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Leave Application Form */}
        <div className="lg:col-span-5 bg-white border border-bdr rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-bdr/60 pb-3">
            <div>
              <h3 className="font-bold text-[15px] text-slate-900">Apply for Leave</h3>
              <p className="text-[12px] text-muted mt-0.5">Fill in duration and assign your work delegate</p>
            </div>
            <span className="text-[11.5px] font-semibold px-2.5 py-1 bg-navy/5 text-navy rounded-lg">
              {calculatedDays} working day{calculatedDays === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1">Applying Employee</label>
              <select
                value={form.employeeName}
                onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13.5px] font-medium text-slate-900 focus:outline-none focus:border-navy"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.department} • {emp.designation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1">Leave Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13.5px] focus:outline-none focus:border-navy"
              >
                <option>Annual Leave</option>
                <option>Sick Leave</option>
                <option>Casual Leave</option>
                <option>Floating Holiday</option>
                <option>Unpaid / Sabbatical</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted block mb-1">From Date</label>
                <input
                  type="date"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-navy"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted block mb-1">To Date</label>
                <input
                  type="date"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-navy"
                />
              </div>
            </div>

            {holidayOverlap.length > 0 && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[12px] text-emerald-800 flex items-start gap-2">
                <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Holiday Auto-Deduction:</span> {holidayOverlap.length} official holiday(s) in this period (
                  <b>{holidayOverlap.map((h) => h.title).join(", ")}</b>) will not deduct from your quota.
                </div>
              </div>
            )}

            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1">Reason for Leave *</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Brief reason for leave..."
                rows={2}
                className="w-full p-3 bg-off border border-bdr rounded-xl text-[13.5px] resize-none focus:outline-none focus:border-navy"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                Assign Work Coverage (Delegate) *
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={form.delegateSearch}
                  onChange={(e) => setForm({ ...form, delegateSearch: e.target.value })}
                  placeholder="Search colleague by name..."
                  className="w-full h-10 pl-9 pr-4 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
                />
              </div>

              {form.delegateSearch && filteredEmployees.length > 0 && (
                <div className="mt-1.5 border border-bdr rounded-xl divide-y divide-bdr/40 max-h-36 overflow-y-auto bg-white shadow-md z-10 relative">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setForm({ ...form, delegate: emp.name, delegateSearch: "" });
                        showToast("Delegate selected: " + emp.name);
                      }}
                      className={`flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer ${
                        form.delegate === emp.name ? "bg-navy/5" : ""
                      }`}
                    >
                      <img src={emp.avatar} alt={emp.name} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <div className="text-[13px] font-medium leading-none text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-muted mt-0.5">
                          {emp.designation} • {emp.department}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 text-[12.5px] text-slate-600 flex items-center gap-1.5">
                <span>Selected delegate:</span>
                <span className="font-semibold text-navy bg-navy/5 px-2 py-0.5 rounded-md">
                  {form.delegate}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                Handover Responsibilities / Notes
              </label>
              <textarea
                value={form.handover}
                onChange={(e) => setForm({ ...form, handover: e.target.value })}
                placeholder="Describe pending tasks, open issues, or handover responsibilities..."
                rows={2}
                className="w-full p-3 bg-off border border-bdr rounded-xl text-[13px] resize-none focus:outline-none focus:border-navy"
              />
            </div>

            <p className="text-[11px] text-muted flex items-center gap-1.5 pt-1">
              <Info size={13} className="shrink-0 text-slate-400" />
              The assigned colleague and your department manager will be notified upon submission.
            </p>

            <button
              type="button"
              onClick={submitLeave}
              className="w-full py-2.5 bg-navy hover:bg-navy/90 text-white rounded-xl text-[13.5px] font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Submit Application
            </button>
          </div>
        </div>

        {/* Pending Approvals Queue */}
        <div className="lg:col-span-7 bg-white border border-bdr rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-bdr/60 pb-3">
            <div>
              <h3 className="font-bold text-[15px] text-slate-900 flex items-center gap-2">
                Approvals &amp; Leave Requests
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold">
                  {leaves.filter((l) => l.status === "Pending Review").length} pending
                </span>
              </h3>
              <p className="text-[12px] text-muted mt-0.5">Review, reassign delegates, and approve team leaves</p>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {["All", "Pending Review", "Approved", "Rejected"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[11.5px] font-semibold rounded-lg transition cursor-pointer ${
                    statusFilter === st ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {st === "Pending Review" ? "Pending" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Type Filter Bar */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={approvalSearch}
                onChange={(e) => setApprovalSearch(e.target.value)}
                placeholder="Search employee, request ID, or reason..."
                className="w-full h-9 pl-8 pr-3 bg-off border border-bdr rounded-xl text-[12.5px] focus:outline-none focus:border-navy"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 bg-off border border-bdr rounded-xl text-[12.5px] text-slate-700 focus:outline-none focus:border-navy"
            >
              <option value="All">All Types</option>
              <option>Annual Leave</option>
              <option>Sick Leave</option>
              <option>Casual Leave</option>
              <option>Floating Holiday</option>
            </select>
          </div>

          {/* Leaves List */}
          <div className="space-y-3.5 mt-1">
            {filteredLeaves.map((l) => {
              const currentDelegate = delegateSelect[l.id] ?? l.delegate;
              const isOverburdened = currentDelegate === "Priya Patel";

              return (
                <div
                  key={l.id}
                  className="border border-bdr rounded-2xl p-4 flex flex-col gap-3 transition hover:border-slate-300"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={l.avatar || `https://i.pravatar.cc/100?u=${encodeURIComponent(l.employee)}`}
                        alt={l.employee}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-bold text-slate-900">{l.employee}</span>
                          <span className="text-[11px] font-medium text-slate-400">({l.id})</span>
                        </div>
                        <div className="text-[12px] text-slate-600 font-medium">
                          {l.type} • <span className="font-semibold text-slate-900">{l.days} day(s)</span>
                        </div>
                        <div className="text-[11.5px] text-muted mt-0.5">
                          {l.from} – {l.to} • Reason: <span className="text-slate-700 italic">"{l.reason}"</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      tone={
                        l.status === "Approved"
                          ? "success"
                          : l.status === "Rejected"
                          ? "critical"
                          : l.status === "Delegate Confirmed"
                          ? "info"
                          : "warning"
                      }
                    >
                      {l.status}
                    </Badge>
                  </div>

                  {/* Delegate Handover Card */}
                  <div className="bg-slate-50 border border-bdr/70 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={l.delegateAvatar || `https://i.pravatar.cc/100?u=${encodeURIComponent(currentDelegate)}`}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-[12.5px] font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>Delegate: {currentDelegate}</span>
                        </div>
                        <div className="text-[11px] text-muted">
                          {l.handover ? `Handover: ${l.handover}` : "Assigned handover coverage"}
                        </div>
                      </div>
                    </div>

                    {l.status === "Pending Review" && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <span className="text-[11.5px] text-muted">Reassign:</span>
                        <select
                          value={currentDelegate}
                          onChange={(e) =>
                            setDelegateSelect({ ...delegateSelect, [l.id]: e.target.value })
                          }
                          className="h-7.5 px-2 bg-white border border-bdr rounded-lg text-[12px] font-medium text-slate-800 focus:outline-none focus:border-navy cursor-pointer"
                        >
                          {employees.slice(0, 6).map((emp) => (
                            <option key={emp.id} value={emp.name}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Informational Overburden Alert */}
                  {isOverburdened && l.status === "Pending Review" && (
                    <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2 text-[11.5px] text-amber-800">
                      <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                      <span>{currentDelegate} is currently assigned to 2 other coverage delegations.</span>
                    </div>
                  )}

                  {l.status === "Rejected" && l.rejectReason && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[12px] text-rose-800">
                      <b>Rejection Reason:</b> {l.rejectReason}
                    </div>
                  )}

                  {l.status === "Pending Review" && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-bdr/40">
                      <button
                        type="button"
                        onClick={() => handleOpenReject(l)}
                        className="px-3.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-[12.5px] font-medium transition cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(l)}
                        className="inline-flex items-center gap-1 px-4 py-1.5 bg-navy hover:bg-navy/90 text-white rounded-xl text-[12.5px] font-semibold transition cursor-pointer shadow-xs"
                      >
                        <Check size={14} />
                        Approve with {currentDelegate}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredLeaves.length === 0 && (
              <div className="text-center py-10 text-muted text-[13px] border border-dashed border-bdr rounded-2xl">
                No leave requests match the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delegations Tracker Card ── */}
      <div className="bg-white border border-bdr rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 pb-0">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="font-bold text-[16px] text-slate-900">Work Handover &amp; Delegations Tracker</h3>
              <p className="text-[12px] text-muted mt-0.5">
                Track responsibilities delegated to you or colleagues while out of office
              </p>
            </div>
            <span className="text-[12px] text-muted">
              Showing {tab === "assigned" ? userDelegations.assigned.length : userDelegations.mine.length} active coverage assignment(s)
            </span>
          </div>

          <div className="flex gap-4 mt-4 border-b border-bdr">
            <button
              onClick={() => setTab("assigned")}
              className={`pb-3 text-[13.5px] font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                tab === "assigned"
                  ? "border-navy text-navy"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Assigned to me</span>
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700">
                {userDelegations.assigned.length}
              </span>
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`pb-3 text-[13.5px] font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                tab === "mine"
                  ? "border-navy text-navy"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>My delegations</span>
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700">
                {userDelegations.mine.length}
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/75 border-y border-bdr text-[11px] uppercase tracking-wider text-muted font-bold">
              <tr>
                <th className="py-3.5 px-5">Colleague</th>
                <th className="py-3.5 px-5">Leave Period</th>
                <th className="py-3.5 px-5">Handover Deliverables</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdr/40 text-[13px]">
              {(tab === "assigned" ? userDelegations.assigned : userDelegations.mine).map((r, i) => (
                <tr key={r.id || i} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={r.avatar || `https://i.pravatar.cc/100?u=${encodeURIComponent(r.emp)}`}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <span className="font-semibold text-slate-900">{r.emp}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-[12.5px] text-slate-700 font-medium">{r.dates}</td>
                  <td className="py-3.5 px-5 text-[12.5px] text-slate-600 max-w-[280px]">
                    <div className="truncate">{r.note}</div>
                  </td>
                  <td className="py-3.5 px-5 text-[12.5px] text-slate-600">
                    <span className="font-medium">{r.type || "Annual Leave"}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <Badge
                      tone={
                        r.status === "Active"
                          ? "success"
                          : r.status === "Upcoming"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => setDetailModalLeave(r)}
                      className="px-3 py-1 bg-white border border-bdr rounded-lg text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal 1: Apply Leave Modal ── */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply for Leave"
        footer={
          <>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setApplyModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={submitLeave}
            >
              Submit Application
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Applying Employee</label>
            <select
              className="form-select"
              value={form.employeeName}
              onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} ({emp.department} • {emp.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Leave Type</label>
            <select
              className="form-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option>Annual Leave</option>
              <option>Sick Leave</option>
              <option>Casual Leave</option>
              <option>Floating Holiday</option>
              <option>Unpaid / Sabbatical</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-input"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="form-input"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Work Delegate</label>
            <select
              className="form-select"
              value={form.delegate}
              onChange={(e) => setForm({ ...form, delegate: e.target.value })}
            >
              {employees
                .filter((e) => e.name !== form.employeeName)
                .map((e) => (
                  <option key={e.id} value={e.name}>
                    {e.name} ({e.department})
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Leave *</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Reason for requested leave..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Handover Details</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Responsibilities assigned to delegate..."
              value={form.handover}
              onChange={(e) => setForm({ ...form, handover: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal 2: Reject Leave Dialog ── */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Leave Request"
        footer={
          <>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[13px] font-semibold transition"
              onClick={handleConfirmReject}
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 14 }}>
          <p className="text-[13.5px] text-slate-700">
            Are you sure you want to reject the leave request for <b>{selectedLeaveToReject?.employee}</b>?
          </p>
          <div className="form-group">
            <label className="form-label">Reason for Rejection</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Critical sprint deadline, key client demo on these dates..."
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal 3: View Handover Details Dialog ── */}
      <Modal
        isOpen={Boolean(detailModalLeave)}
        onClose={() => setDetailModalLeave(null)}
        title="Delegation Handover Brief"
        footer={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setDetailModalLeave(null)}
          >
            Close
          </button>
        }
      >
        {detailModalLeave && (
          <div style={{ display: "grid", gap: 14, fontSize: "13.5px", color: "#334155" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={detailModalLeave.avatar}
                alt=""
                style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover" }}
              />
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  {detailModalLeave.emp}
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>
                  Period: {detailModalLeave.dates} • Type: {detailModalLeave.type || "Annual Leave"}
                </p>
              </div>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Handover Notes &amp; Assigned Responsibilities
              </span>
              <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#1e293b", lineHeight: 1.5 }}>
                {detailModalLeave.note}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Status</span>
              <Badge tone={detailModalLeave.status === "Active" ? "success" : "warning"}>
                {detailModalLeave.status}
              </Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

