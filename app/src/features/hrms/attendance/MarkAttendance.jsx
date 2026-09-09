import { useState, useMemo } from "react";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import { useAppStore } from "../../../stores/appStore";
import { attendanceEmployees } from "../../../data/hrms/mocks/attendanceExtended";
import { ConfirmModal } from "../../../components/hrms/Shared";
export default function MarkAttendance() {
  const showToast = useAppStore((s) => s.showToast);
  const role = useAttendanceStore((s) => s.role);
  const canEdit = role === "HR" || role === "Admin";
  const [date, setDate] = useState("2024-10-11");
  const [dept, setDept] = useState("All");
  const [location, setLocation] = useState("All");
  const [shift, setShift] = useState("All");
  const [initialRows] = useState(() => attendanceEmployees.slice(0, 12).map((e, i) => ({ id: e.id, name: e.name, avatar: e.avatar, dept: e.dept, checkIn: "09:02", checkOut: "18:04", status: ["Present", "Present", "Late", "Absent", "WFH", "On Leave"][i % 6], remarks: "", checked: false })));
  const [rows, setRows] = useState(initialRows);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const filtered = useMemo(() => rows.filter((r) => {
    if (dept !== "All" && r.dept !== dept) return false;
    return true;
  }), [rows, dept]);
  const selectedCount = rows.filter((r) => r.checked).length;
  function toggleAll(v) {
    setRows(rows.map((r) => filtered.some((f) => f.id === r.id) ? { ...r, checked: v } : r));
  }
  function update(id, patch) {
    setRows(rows.map((r) => r.id === id ? { ...r, ...patch } : r));
  }
  function save() {
    if (!canEdit) {
      showToast("Only HR/Admin can save");
      return;
    }
    if (selectedCount > 10) {
      setConfirmOpen(true);
      return;
    }
    showToast(`Attendance saved for ${filtered.length} employees on ${date}`);
  }
  if (!canEdit) {
    return <div className="flex flex-col gap-4">
        <h1 className="text-[24px] font-bold">Mark Attendance</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[13px] text-amber-800">Your role ({role}) cannot mark attendance. Switch to HR/Admin via top bar role selector.</div>
      </div>;
  }
  return <div className="flex flex-col gap-5">
      <div><h1 className="text-[24px] font-bold">Mark Attendance</h1><p className="text-[13px] text-muted">Record daily employee attendance.</p></div>
      <div className="bg-white border border-bdr rounded-xl p-4 shadow-subtle flex flex-wrap gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]" />
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>Engineering</option><option>Design</option><option>Marketing</option><option>HR</option><option>Finance</option><option>Operations</option></select>
        <select value={location} onChange={(e) => setLocation(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>New York</option><option>London</option><option>Dubai</option></select>
        <select value={shift} onChange={(e) => setShift(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>General</option><option>Flexible</option><option>Night</option></select>
        <span className="ml-auto text-[12px] text-muted self-center">{selectedCount} selected</span>
      </div>

      <div className="bg-white border border-bdr rounded-xl shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-4"><input type="checkbox" checked={filtered.length > 0 && filtered.every((r) => r.checked)} onChange={(e) => toggleAll(e.target.checked)} /></th><th className="py-3 px-3">Employee</th><th className="py-3 px-3">Employee ID</th><th className="py-3 px-3">Department</th><th className="py-3 px-3">Check In</th><th className="py-3 px-3">Check Out</th><th className="py-3 px-3">Status</th><th className="py-3 px-3">Remarks</th></tr></thead>
            <tbody className="divide-y divide-bdr/60 text-[13px]">
              {filtered.map((r) => <tr key={r.id} className="hover:bg-off/60">
                  <td className="py-2 px-4"><input type="checkbox" checked={r.checked} onChange={(e) => update(r.id, { checked: e.target.checked })} /></td>
                  <td className="py-2 px-3"><div className="flex items-center gap-2"><img src={r.avatar} className="w-7 h-7 rounded-full" />{r.name}</div></td>
                  <td className="py-2 px-3 text-muted text-[12px]">{r.id}</td>
                  <td className="py-2 px-3">{r.dept}</td>
                  <td className="py-2 px-3"><input value={r.checkIn} onChange={(e) => update(r.id, { checkIn: e.target.value })} className="w-20 h-7 px-2 bg-white border border-bdr rounded-lg text-[13px] focus:outline-none focus:border-navy" /></td>
                  <td className="py-2 px-3"><input value={r.checkOut} onChange={(e) => update(r.id, { checkOut: e.target.value })} className="w-20 h-7 px-2 bg-white border border-bdr rounded-lg text-[13px] focus:outline-none focus:border-navy" /></td>
                  <td className="py-2 px-3"><select value={r.status} onChange={(e) => update(r.id, { status: e.target.value })} className="h-7 px-2 bg-white border border-bdr rounded-lg text-[12px]"><option>Present</option><option>Absent</option><option>Late</option><option>Half Day</option><option>WFH</option><option>On Leave</option></select></td>
                  <td className="py-2 px-3"><input value={r.remarks} onChange={(e) => update(r.id, { remarks: e.target.value })} placeholder="—" className="w-28 h-7 px-2 bg-white border border-bdr rounded-lg text-[12px]" /></td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-bdr flex justify-end gap-2 bg-off">
          <button onClick={() => setRows(initialRows)} className="px-4 py-2 bg-white border border-bdr rounded-xl text-[13.5px]">Cancel</button>
          <button onClick={save} className="px-6 py-2 bg-navy text-white rounded-xl text-[13.5px] font-medium">Save Attendance</button>
        </div>
      </div>

      <ConfirmModal open={confirmOpen} title="Confirm bulk update?" desc={`You are about to update attendance for ${selectedCount} employees on ${date}. This will overwrite previous records.`} confirmLabel="Confirm Update" onClose={() => setConfirmOpen(false)} onConfirm={() => {
    setConfirmOpen(false);
    showToast("Attendance saved for " + selectedCount + " employees");
  }} />
    </div>;
}
