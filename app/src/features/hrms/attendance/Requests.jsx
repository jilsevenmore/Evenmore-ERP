import { useState, useMemo } from "react";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import { useAppStore } from "../../../stores/appStore";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { EmptyState, ConfirmModal } from "../../../components/hrms/Shared";
export default function Requests() {
  const requests = useAttendanceStore((s) => s.requests);
  const setRequestStatus = useAttendanceStore((s) => s.setRequestStatus);
  const addRequest = useAttendanceStore((s) => s.addRequest);
  const role = useAttendanceStore((s) => s.role);
  const showToast = useAppStore((s) => s.showToast);
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [approveConfirm, setApproveConfirm] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [earlyOpen, setEarlyOpen] = useState(false);
  const [regOpen, setRegOpen] = useState(false);
  const [earlyForm, setEarlyForm] = useState({ employee: "Marcus Chen", date: "11 Oct 2024", curIn: "09:18", curOut: "18:30", reqOut: "16:30", reason: "" });
  const [regForm, setRegForm] = useState({ employee: "Priya Patel", date: "10 Oct 2024", curIn: "09:15", curOut: "17:45", reqIn: "09:30", reqOut: "18:30", reason: "", type: "Missing Check-In" });
  const canApprove = role === "Manager" || role === "HR" || role === "Admin";
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (tab !== "All" && r.type !== tab) return false;
      if (search && !(r.employee.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()))) return false;
      if (dept !== "All" && r.dept !== dept) return false;
      if (typeFilter !== "All" && r.type !== typeFilter) return false;
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (date && r.date !== date) return false;
      return true;
    });
  }, [requests, tab, search, dept, typeFilter, statusFilter, date]);
  function approve(id) {
    setRequestStatus(id, "Approved", { reviewer: "Ayesha Khan", reviewedAt: "11 Oct 11:20" });
    showToast("Attendance request approved");
    setApproveConfirm(null);
    if (selected?.id === id) setSelected({ ...selected, status: "Approved", reviewer: "Ayesha Khan" });
  }
  function reject() {
    if (!rejectId || !rejectReason.trim()) return;
    setRequestStatus(rejectId, "Rejected", { rejectReason, reviewer: "Ayesha Khan" });
    showToast("Request rejected");
    setRejectId(null);
    setRejectReason("");
    if (selected?.id === rejectId) setSelected({ ...selected, status: "Rejected" });
  }
  return <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div><h1 className="text-[24px] font-bold">Attendance Requests</h1><p className="text-[13px] text-muted">Single request management for regularization & early clock-out.</p></div>
        <div className="flex gap-2">
          <button onClick={() => setRegOpen(true)} className="px-4 py-2 bg-white border border-bdr rounded-xl text-[13px] font-medium">Regularize</button>
          <button onClick={() => setEarlyOpen(true)} className="px-4 py-2 bg-navy text-white rounded-xl text-[13px] font-medium">Early Clock-Out Request</button>
        </div>
      </div>

      <div className="bg-white border border-bdr rounded-xl shadow-subtle p-2 flex gap-1 w-fit">
        {["All", "Regularization", "Early Clock-Out"].map((t) => <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-xl text-[13px] font-medium ${tab === t ? "bg-navy text-white" : "text-muted hover:bg-off"}`}>{t} ({t === "All" ? requests.length : requests.filter((r) => r.type === t).length})</button>)}
      </div>

      <div className="bg-white border border-bdr rounded-xl p-4 shadow-subtle flex flex-wrap gap-2">
        <div className="relative"><span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-[16px]">search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="pl-8 h-9 w-40 bg-off border border-bdr rounded-xl text-[13px]" /></div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>Engineering</option><option>Design</option><option>Marketing</option><option>HR</option><option>Finance</option><option>Operations</option></select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>Regularization</option><option>Early Clock-Out</option></select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option><option>Cancelled</option></select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]" />
        <button onClick={() => {
    setSearch("");
    setDept("All");
    setTypeFilter("All");
    setStatusFilter("All");
    setDate("");
  }} className="px-3 py-1.5 bg-white border border-bdr rounded-xl text-[13px]">Clear Filters</button>
        {!canApprove && <span className="ml-auto text-[11px] px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">View-only ({role}) — cannot approve</span>}
      </div>

      <div className="bg-white border border-bdr rounded-xl shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1100px]">
            <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-4">Request ID</th><th className="py-3 px-4">Employee</th><th className="py-3 px-4">Request Type</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Current Attendance</th><th className="py-3 px-4">Requested Attendance</th><th className="py-3 px-4">Reason</th><th className="py-3 px-4">Requested By</th><th className="py-3 px-4">Submitted</th><th className="py-3 px-4">Status</th><th className="py-3 px-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-bdr/60 text-[13px]">
              {filtered.length === 0 ? <tr><td colSpan={11}><EmptyState icon="inbox" title="No attendance requests found." desc="Try changing tab or filters." action={<button onClick={() => {
    setTab("All");
    setStatusFilter("All");
  }} className="px-4 py-2 bg-navy text-white rounded-xl text-[12px]">Clear Filters</button>} /></td></tr> : filtered.map((r) => <tr key={r.id} className="hover:bg-off/60">
                  <td className="py-3 px-4 font-mono text-[12px]"><button onClick={() => setSelected(r)} className="text-navy underline">{r.id}</button></td>
                  <td className="py-3 px-4"><div className="flex items-center gap-2"><img src={r.avatar} className="w-7 h-7 rounded-full" />{r.employee}<span className="text-[11px] text-muted hidden lg:inline">{r.dept}</span></div></td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-[11px] border ${r.type === "Regularization" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>{r.type}</span></td>
                  <td className="py-3 px-4">{r.date}</td>
                  <td className="py-3 px-4 font-mono text-[12px]">{r.currentIn}–{r.currentOut}</td>
                  <td className="py-3 px-4 font-mono text-[12px]">{r.requestedIn}–{r.requestedOut}</td>
                  <td className="py-3 px-4 max-w-[160px] truncate" title={r.reason}>{r.reason}</td>
                  <td className="py-3 px-4">{r.requestedBy}</td>
                  <td className="py-3 px-4 text-muted">{r.submitted}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3 px-4">
                    {r.status === "Pending" && canApprove ? <div className="flex gap-1">
                        <button onClick={() => setApproveConfirm(r.id)} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[11px]">Approve</button>
                        <button onClick={() => setRejectId(r.id)} className="px-2 py-1 bg-white border border-bdr rounded-lg text-[11px]">Reject</button>
                      </div> : <button onClick={() => setSelected(r)} className="px-2 py-1 bg-white border border-bdr rounded-lg text-[11px]">View</button>}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {
    /* Detail Drawer */
  }
      {selected && <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-[520px] bg-white h-full overflow-y-auto shadow-xl flex flex-col">
            <div className="p-6 border-b border-bdr flex justify-between">
              <div><div className="font-semibold">{selected.id} — {selected.type}</div><div className="text-[12px] text-muted">{selected.employee} • {selected.dept} • {selected.date}</div></div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full hover:bg-off grid place-items-center"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 flex flex-col gap-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-off border border-bdr rounded-xl p-3"><div className="text-[11px] text-muted uppercase">Current Attendance</div><div className="font-mono font-medium mt-1">{selected.currentIn} – {selected.currentOut}</div></div>
                <div className="bg-off border border-bdr rounded-xl p-3"><div className="text-[11px] text-muted uppercase">Requested Attendance</div><div className="font-mono font-medium mt-1">{selected.requestedIn} – {selected.requestedOut}</div></div>
              </div>
              <div><div className="text-[11px] text-muted uppercase">Reason</div><div className="mt-1 p-3 bg-white border border-bdr rounded-xl">{selected.reason}</div></div>
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>Requested By: <b>{selected.requestedBy}</b></div><div>Submitted: {selected.submitted}</div><div>Status: <StatusBadge status={selected.status} /></div>{selected.reviewer && <div>Reviewer: {selected.reviewer}</div>}
              </div>
              {selected.rejectReason && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[13px]"><b>Rejection Reason:</b> {selected.rejectReason}</div>}
              <div className="border-t border-bdr pt-4">
                <div className="font-medium text-[13px]">Approval history</div>
                <div className="mt-2 space-y-2 text-[12px]">
                  <div className="flex gap-2"><span className="w-2 h-2 rounded-full bg-navy mt-1.5" /><div><div className="font-medium">Submitted by {selected.requestedBy}</div><div className="text-muted">{selected.submitted}</div></div></div>
                  {selected.status !== "Pending" && <div className="flex gap-2"><span className={`w-2 h-2 rounded-full mt-1.5 ${selected.status === "Approved" ? "bg-emerald-500" : "bg-red-500"}`} /><div><div className="font-medium">{selected.status} by {selected.reviewer || "Ayesha Khan"}</div><div className="text-muted">{selected.reviewedAt || "11 Oct 11:20"}</div></div></div>}
                  {selected.status === "Pending" && <div className="text-muted">Awaiting review</div>}
                </div>
              </div>
              {selected.status === "Pending" && canApprove && <div className="flex gap-2">
                  <button onClick={() => setApproveConfirm(selected.id)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-[13px] font-medium">Approve</button>
                  <button onClick={() => setRejectId(selected.id)} className="flex-1 py-2 bg-white border border-bdr rounded-xl text-[13px]">Reject</button>
                </div>}
            </div>
          </div>
        </div>}

      {
    /* Early Clock-Out Modal */
  }
      {earlyOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEarlyOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex justify-between"><h3 className="font-semibold">Early Clock-Out Request</h3><button onClick={() => setEarlyOpen(false)} className="w-7 h-7 rounded-full hover:bg-off grid place-items-center"><span className="material-symbols-outlined">close</span></button></div>
            <select value={earlyForm.employee} onChange={(e) => setEarlyForm({ ...earlyForm, employee: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"><option>Marcus Chen</option><option>Priya Patel</option><option>Sarah Wilson</option></select>
            <div className="grid grid-cols-2 gap-3"><input value={earlyForm.curIn} onChange={(e) => setEarlyForm({ ...earlyForm, curIn: e.target.value })} placeholder="Current In" className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]" /><input value={earlyForm.curOut} onChange={(e) => setEarlyForm({ ...earlyForm, curOut: e.target.value })} placeholder="Current Out" className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]" /></div>
            <input value={earlyForm.reqOut} onChange={(e) => setEarlyForm({ ...earlyForm, reqOut: e.target.value })} placeholder="Requested Check Out" className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" />
            <textarea value={earlyForm.reason} onChange={(e) => setEarlyForm({ ...earlyForm, reason: e.target.value })} placeholder="Reason" rows={2} className="p-3 bg-white border border-bdr rounded-xl text-[13px] resize-none" />
            <div className="flex justify-end gap-2"><button onClick={() => setEarlyOpen(false)} className="px-4 py-2 bg-white border border-bdr rounded-xl text-[13px]">Cancel</button><button onClick={() => {
    if (!earlyForm.reason) {
      showToast("Reason required");
      return;
    }
    addRequest({ id: "REQ-" + Date.now().toString().slice(-4), employee: earlyForm.employee, employeeId: "EMP1025", avatar: "https://i.pravatar.cc/100?img=16", dept: "Design", type: "Early Clock-Out", date: earlyForm.date, currentIn: earlyForm.curIn, currentOut: earlyForm.curOut, requestedIn: earlyForm.curIn, requestedOut: earlyForm.reqOut, reason: earlyForm.reason, requestedBy: earlyForm.employee, submitted: "11 Oct", status: "Pending" });
    showToast("Early clock-out request submitted");
    setEarlyOpen(false);
    setEarlyForm({ ...earlyForm, reason: "" });
  }} className="px-5 py-2 bg-navy text-white rounded-xl text-[13px] font-medium">Submit Request</button></div>
          </div>
        </div>}

      {
    /* Regularize Modal duplicate for Requests page */
  }
      {regOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRegOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <h3 className="font-semibold">Regularize Attendance</h3>
            <select value={regForm.type} onChange={(e) => setRegForm({ ...regForm, type: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]"><option>Missing Check-In</option><option>Missing Check-Out</option><option>Incorrect Check-In</option><option>Incorrect Check-Out</option><option>Incorrect Status</option></select>
            <div className="grid grid-cols-2 gap-3"><input value={regForm.curIn} onChange={(e) => setRegForm({ ...regForm, curIn: e.target.value })} placeholder="Current In" className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]" /><input value={regForm.curOut} onChange={(e) => setRegForm({ ...regForm, curOut: e.target.value })} placeholder="Current Out" className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]" /></div>
            <div className="grid grid-cols-2 gap-3"><input value={regForm.reqIn} onChange={(e) => setRegForm({ ...regForm, reqIn: e.target.value })} placeholder="Req In" className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /><input value={regForm.reqOut} onChange={(e) => setRegForm({ ...regForm, reqOut: e.target.value })} placeholder="Req Out" className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" /></div>
            <textarea value={regForm.reason} onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })} placeholder="Reason for Correction" rows={2} className="p-3 bg-white border border-bdr rounded-xl text-[13px] resize-none" />
            <div className="flex justify-end gap-2"><button onClick={() => setRegOpen(false)} className="px-4 py-2 bg-white border border-bdr rounded-xl text-[13px]">Cancel</button><button onClick={() => {
    if (!regForm.reason) {
      showToast("Reason required");
      return;
    }
    addRequest({ id: "REQ-" + Date.now().toString().slice(-4), employee: regForm.employee, employeeId: "EMP1024", avatar: "https://i.pravatar.cc/100?img=15", dept: "Engineering", type: "Regularization", date: regForm.date, currentIn: regForm.curIn, currentOut: regForm.curOut, requestedIn: regForm.reqIn, requestedOut: regForm.reqOut, reason: regForm.reason, requestedBy: regForm.employee, submitted: "11 Oct", status: "Pending" });
    showToast("Regularization submitted");
    setRegOpen(false);
  }} className="px-5 py-2 bg-navy text-white rounded-xl text-[13px] font-medium">Submit Request</button></div>
          </div>
        </div>}

      <ConfirmModal open={!!approveConfirm} title="Approve this attendance request?" desc="This will change status to Approved and notify the employee." confirmLabel="Approve" onClose={() => setApproveConfirm(null)} onConfirm={() => approve(approveConfirm)} />
      <ConfirmModal open={!!rejectId} title="Reject Request" desc="Please provide a rejection reason." confirmLabel="Reject Request" danger onClose={() => {
    setRejectId(null);
    setRejectReason("");
  }} onConfirm={reject} requireReason reason={rejectReason} setReason={setRejectReason} />
    </div>;
}
