import { useState, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import { attendanceEmployees } from "../../../data/hrms/mocks/attendanceExtended";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { ConfirmModal } from "../../../components/hrms/Shared";
export default function BulkAttendance() {
  const showToast = useAppStore((s) => s.showToast);
  const bulkUpdate = useAttendanceStore((s) => s.bulkUpdate);
  const role = useAttendanceStore((s) => s.role);
  const [date, setDate] = useState("2024-10-11");
  const [dept, setDept] = useState("All");
  const [location, setLocation] = useState("All");
  const [shift, setShift] = useState("All");
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [bulkStatus, setBulkStatus] = useState("Present");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const filtered = useMemo(() => attendanceEmployees.filter((e) => {
    if (dept !== "All" && e.dept !== dept) return false;
    return true;
  }), [dept]);
  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));
  function toggleAll(v) {
    const ns = new Set(selected);
    filtered.forEach((e) => v ? ns.add(e.id) : ns.delete(e.id));
    setSelected(ns);
  }
  function toggle(id) {
    const ns = new Set(selected);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelected(ns);
  }
  function apply() {
    if (selected.size === 0) {
      showToast("Select at least one employee");
      return;
    }
    if (role === "Employee") {
      showToast("Only HR/Admin can bulk update");
      return;
    }
    setConfirmOpen(true);
  }
  function confirm() {
    bulkUpdate(Array.from(selected), bulkStatus);
    showToast(`Bulk attendance updated for ${selected.size} employees \u2014 ${bulkStatus} on ${date}`);
    setConfirmOpen(false);
    setSelected(/* @__PURE__ */ new Set());
  }
  return <div className="flex flex-col gap-5">
      <div><h1 className="text-[24px] font-bold">Bulk Attendance</h1><p className="text-[13px] text-muted">Update attendance for multiple employees at once.</p></div>

      <div className="bg-white border border-bdr rounded-xl p-4 shadow-subtle flex flex-wrap gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]" />
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>Engineering</option><option>Design</option><option>Marketing</option><option>HR</option><option>Finance</option><option>Operations</option></select>
        <select value={location} onChange={(e) => setLocation(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>New York</option><option>London</option><option>Dubai</option></select>
        <select value={shift} onChange={(e) => setShift(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>General</option><option>Flexible</option><option>Night</option></select>
      </div>

      <div className="bg-white border border-bdr rounded-xl p-4 shadow-subtle flex flex-wrap gap-2 items-center">
        <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} /> Select All ({selected.size} selected)</label>
        <div className="flex gap-1 ml-auto flex-wrap">
          {["Present", "Absent", "Late", "Half Day", "WFH", "On Leave"].map((s) => <button key={s} onClick={() => setBulkStatus(s)} className={`px-3 py-1.5 rounded-xl border text-[12px] font-medium ${bulkStatus === s ? "bg-navy text-white border-navy" : "bg-white border-bdr hover:bg-off"}`}>{s}</button>)}
        </div>
        <button onClick={apply} className="px-6 py-2 bg-navy text-white rounded-xl text-[13.5px] font-medium">Save Attendance</button>
      </div>

      <div className="bg-white border border-bdr rounded-xl shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-4"><input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} /></th><th className="py-3 px-3">Employee</th><th className="py-3 px-3">Employee ID</th><th className="py-3 px-3">Department</th><th className="py-3 px-3">Current Status</th></tr></thead>
            <tbody className="divide-y divide-bdr/60 text-[13px]">
              {filtered.map((e) => <tr key={e.id} className="hover:bg-off/60">
                  <td className="py-3 px-4"><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} /></td>
                  <td className="py-3 px-3"><div className="flex items-center gap-2"><img src={e.avatar} className="w-7 h-7 rounded-full" />{e.name}</div></td>
                  <td className="py-3 px-3 text-muted text-[12px]">{e.id}</td>
                  <td className="py-3 px-3">{e.dept}</td>
                  <td className="py-3 px-3"><StatusBadge status={e.id === "EMP1026" ? "Absent" : e.id === "EMP1024" ? "Present" : "WFH"} /></td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal open={confirmOpen} title="Confirm bulk update?" desc={`Update attendance for ${selected.size} employees to "${bulkStatus}" on ${date}?`} confirmLabel="Confirm Update" onClose={() => setConfirmOpen(false)} onConfirm={confirm} />
    </div>;
}
