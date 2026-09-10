import { useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import { Badge } from "../../../components/hrms/Badge";
import { Calendar, Search, AlertTriangle, Info, Check, UserCheck } from "lucide-react";

export default function Leave() {
  const { leaves, approveLeave, addLeave, showToast, employees } = useAppStore();
  const [tab, setTab] = useState("assigned");
  const [form, setForm] = useState({
    type: "Annual Leave",
    from: "2024-10-20",
    to: "2024-10-24",
    reason: "",
    delegateSearch: "",
    delegate: "Priya Patel",
    handover: "",
  });
  const [delegateSelect, setDelegateSelect] = useState({});

  const filteredEmployees = employees
    .filter((e) => e.name.toLowerCase().includes(form.delegateSearch.toLowerCase()))
    .slice(0, 4);

  function submitLeave() {
    if (!form.reason.trim()) return showToast("Reason required");
    const days = 4;
    addLeave({
      id: "LV-" + Date.now(),
      employee: "Ayesha Khan",
      avatar: "https://i.pravatar.cc/100?img=5",
      type: form.type,
      from: form.from,
      to: form.to,
      days,
      reason: form.reason,
      delegate: form.delegate,
      delegateAvatar: "https://i.pravatar.cc/100?img=15",
      status: "Pending Review",
    });
    showToast("Leave applied — manager notified");
    setForm({ ...form, reason: "", handover: "" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">Leave Management</h1>
          <p className="text-[13px] text-muted">Apply, approve and track delegations</p>
        </div>
        <button
          onClick={submitLeave}
          className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium shadow-xs hover:bg-navy/90 transition-colors cursor-pointer"
        >
          Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leave Application Form */}
        <div className="lg:col-span-5 bg-white border border-bdr rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="font-semibold text-slate-900">Leave Application</h3>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="h-10 px-3 bg-off border border-bdr rounded-xl text-[13.5px] focus:outline-none focus:border-navy"
          >
            <option>Annual Leave</option>
            <option>Sick Leave</option>
            <option>Casual Leave</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted block mb-1">From Date</label>
              <input
                type="date"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted block mb-1">To Date</label>
              <input
                type="date"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                className="w-full h-10 px-3 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
              />
            </div>
          </div>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Brief reason for leave..."
            rows={2}
            className="p-3 bg-off border border-bdr rounded-xl text-[13.5px] resize-none focus:outline-none focus:border-navy"
          />

          <div>
            <label className="text-[12px] font-medium text-slate-700 block mb-1">
              Assign work to (Delegate) *
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={form.delegateSearch}
                onChange={(e) => setForm({ ...form, delegateSearch: e.target.value })}
                placeholder="Search colleague by name"
                className="w-full h-10 pl-9 pr-4 bg-off border border-bdr rounded-xl text-[13.5px] focus:outline-none focus:border-navy"
              />
            </div>
            {form.delegateSearch && (
              <div className="mt-2 border border-bdr rounded-xl divide-y divide-bdr/40 max-h-36 overflow-y-auto bg-white shadow-sm">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setForm({ ...form, delegate: emp.name, delegateSearch: "" });
                      showToast("Delegate selected: " + emp.name);
                    }}
                    className={`flex items-center gap-3 p-2.5 hover:bg-off cursor-pointer ${
                      form.delegate === emp.name ? "bg-navy/5" : ""
                    }`}
                  >
                    <img src={emp.avatar} alt={emp.name} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <div className="text-[13px] font-medium leading-none text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-muted mt-0.5">{emp.designation} • {emp.department}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 text-[12px] text-slate-600">
              Selected delegate: <b className="text-navy">{form.delegate}</b>
            </div>
          </div>

          <textarea
            value={form.handover}
            onChange={(e) => setForm({ ...form, handover: e.target.value })}
            placeholder="Describe pending tasks, handover responsibilities..."
            rows={3}
            className="p-3 bg-off border border-bdr rounded-xl text-[13.5px] resize-none focus:outline-none focus:border-navy"
          />

          <p className="text-[11px] text-muted flex items-center gap-1.5">
            <Info size={13} className="shrink-0" />
            The assigned colleague and your department manager will be notified upon submission.
          </p>

          <button
            type="button"
            onClick={submitLeave}
            className="py-2.5 bg-navy hover:bg-navy/90 text-white rounded-xl text-[13.5px] font-medium transition-colors cursor-pointer"
          >
            Submit Application
          </button>
        </div>

        {/* Pending Approvals Queue */}
        <div className="lg:col-span-7 bg-white border border-bdr rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">
              Pending Approvals
              <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-medium">
                {leaves.filter((l) => l.status === "Pending Review").length}
              </span>
            </h3>
          </div>

          <div className="space-y-4">
            {leaves.map((l) => (
              <div key={l.id} className="border border-bdr rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <img src={l.avatar} alt={l.employee} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <div className="text-[13px] font-semibold text-slate-900">
                        {l.employee} • {l.type}
                      </div>
                      <div className="text-[11px] text-muted">
                        {l.from} – {l.to} • {l.days} days • {l.reason}
                      </div>
                    </div>
                  </div>
                  <Badge
                    tone={
                      l.status === "Approved"
                        ? "success"
                        : l.status === "Delegate Confirmed"
                        ? "success"
                        : "warning"
                    }
                  >
                    {l.status}
                  </Badge>
                </div>

                <div className="bg-off border border-bdr rounded-xl p-3 flex items-center gap-3">
                  <img src={l.delegateAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  <div>
                    <div className="text-[13px] font-medium text-slate-900">
                      {delegateSelect[l.id] ?? l.delegate}
                    </div>
                    <div className="text-[11px] text-muted">Suggested handover delegate</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted whitespace-nowrap">Change delegate:</span>
                  <select
                    value={delegateSelect[l.id] ?? l.delegate}
                    onChange={(e) =>
                      setDelegateSelect({ ...delegateSelect, [l.id]: e.target.value })
                    }
                    className="h-8 px-2 bg-white border border-bdr rounded-lg text-[12.5px] flex-1 focus:outline-none focus:border-navy"
                  >
                    {employees.slice(0, 5).map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>

                {(delegateSelect[l.id] ?? l.delegate) === "Priya Patel" && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-[12px] text-amber-800">
                    <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                    <span>Priya is already covering 2 delegations (informational, non-blocking).</span>
                  </div>
                )}

                {delegateSelect[l.id] && delegateSelect[l.id] !== l.delegate && (
                  <div className="text-[11px] text-muted">
                    Modified: {l.delegate} → {delegateSelect[l.id]} by manager
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    approveLeave(l.id, delegateSelect[l.id] ?? l.delegate);
                    showToast("Approved leave with delegate: " + (delegateSelect[l.id] ?? l.delegate));
                  }}
                  className="py-2 bg-navy hover:bg-navy/90 text-white rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Approve with this delegate
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delegations Tracker */}
      <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 pb-0">
          <h3 className="font-semibold text-slate-900">Delegations Tracker</h3>
          <div className="flex gap-2 mt-3 border-b border-bdr">
            <button
              onClick={() => setTab("assigned")}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                tab === "assigned"
                  ? "border-navy text-navy font-semibold"
                  : "border-transparent text-muted hover:text-slate-700"
              }`}
            >
              Assigned to me (2)
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                tab === "mine"
                  ? "border-navy text-navy font-semibold"
                  : "border-transparent text-muted hover:text-slate-700"
              }`}
            >
              My delegations (1)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-off border-y border-bdr text-[11px] uppercase text-muted">
              <tr>
                <th className="py-3 px-5">Employee</th>
                <th className="py-3 px-5">Leave dates</th>
                <th className="py-3 px-5">Handover notes</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdr/40 text-[13px]">
              {(tab === "assigned"
                ? [
                    {
                      emp: "Liam Cooper",
                      avatar: "https://i.pravatar.cc/100?img=20",
                      dates: "Oct 20 - 24",
                      note: "Handle client demo + push release v2.3",
                      status: "Upcoming",
                    },
                    {
                      emp: "Ayesha Khan",
                      avatar: "https://i.pravatar.cc/100?img=5",
                      dates: "Oct 02 - 14",
                      note: "Payroll verification & onboarding",
                      status: "Active",
                    },
                  ]
                : [
                    {
                      emp: "Sophia Lindqvist",
                      avatar: "https://i.pravatar.cc/100?img=21",
                      dates: "Oct 12 - 13",
                      note: "Q3 report draft in Drive",
                      status: "Completed",
                    },
                  ]
              ).map((r, i) => (
                <tr key={i} className="hover:bg-off/60">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <img src={r.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      <span className="font-medium text-slate-800">{r.emp}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-[12px] text-slate-700">{r.dates}</td>
                  <td className="py-3 px-5 text-[12px] text-muted truncate max-w-[260px]">
                    {r.note}{" "}
                    <button
                      type="button"
                      onClick={() => showToast(r.note)}
                      className="text-navy underline ml-1 cursor-pointer"
                    >
                      Expand
                    </button>
                  </td>
                  <td className="py-3 px-5">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

