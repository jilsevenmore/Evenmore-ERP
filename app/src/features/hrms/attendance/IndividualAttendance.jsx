import { useState, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
import { attendanceEmployees, monthlyRecords } from "../../../data/hrms/mocks/attendanceExtended";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { EmptyState } from "../../../components/hrms/Shared";
export default function IndividualAttendance() {
  const showToast = useAppStore((s) => s.showToast);
  const [employeeId, setEmployeeId] = useState("EMP1024");
  const [month, setMonth] = useState("October");
  const [year, setYear] = useState("2024");
  const [view, setView] = useState("table");
  const [detailDate, setDetailDate] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const emp = useMemo(() => attendanceEmployees.find((e) => e.id === employeeId), [employeeId]);
  const records = useMemo(() => monthlyRecords(employeeId), [employeeId]);
  const stats = {
    present: records.filter((r) => r.status === "Present").length,
    absent: records.filter((r) => r.status === "Absent").length,
    late: records.filter((r) => r.status === "Late").length,
    leave: records.filter((r) => r.status === "On Leave").length,
    wfh: records.filter((r) => r.status === "WFH").length,
    overtime: "6h"
  };
  return <div className="flex flex-col gap-5">
      <div><h1 className="text-[24px] font-bold">Individual Attendance</h1><p className="text-[13px] text-muted">View and manage per-employee attendance history.</p></div>

      <div className="bg-white border border-bdr rounded-xl p-4 shadow-subtle flex flex-wrap gap-3">
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px] min-w-[180px]">
          {attendanceEmployees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.id}</option>)}
        </select>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>October</option><option>September</option><option>August</option></select>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>2024</option><option>2023</option></select>
        <div className="ml-auto flex p-1 bg-off border border-bdr rounded-xl">
          <button onClick={() => setView("table")} className={`px-3 py-1.5 rounded-lg text-[12px] ${view === "table" ? "bg-white border border-bdr shadow-sm font-medium" : ""}`}>Table View</button>
          <button onClick={() => setView("calendar")} className={`px-3 py-1.5 rounded-lg text-[12px] ${view === "calendar" ? "bg-white border border-bdr shadow-sm font-medium" : ""}`}>Calendar View</button>
        </div>
      </div>

      <div className="bg-white border border-bdr rounded-xl p-5 shadow-subtle flex gap-4 items-center">
        <img src={emp.avatar} className="w-14 h-14 rounded-full border border-bdr" alt="av" />
        <div className="flex-1">
          <div className="font-semibold">{emp.name} <span className="text-muted font-normal text-[12px]">{emp.id}</span></div>
          <div className="text-[13px] text-muted">{emp.designation} • {emp.dept} • Manager: {emp.manager} • <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px]">{emp.status}</span></div>
        </div>
        <button onClick={() => showToast("View Employee Profile \u2014 " + emp.name)} className="px-3 py-1.5 bg-white border border-bdr rounded-xl text-[12px] hidden sm:block">View Employee</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
    { k: "Present Days", v: stats.present },
    { k: "Absent Days", v: stats.absent },
    { k: "Late Days", v: stats.late },
    { k: "Leave Days", v: stats.leave },
    { k: "WFH Days", v: stats.wfh },
    { k: "Overtime Hours", v: stats.overtime }
  ].map((x) => <div key={x.k} className="bg-white border border-bdr rounded-xl p-4 shadow-subtle text-center"><div className="text-[11px] tracking-widest uppercase text-muted">{x.k}</div><div className="text-[20px] font-bold mt-1">{x.v}</div></div>)}
      </div>

      {view === "table" ? <div className="bg-white border border-bdr rounded-xl shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-5">Date</th><th className="py-3 px-5">Day</th><th className="py-3 px-5">Check In</th><th className="py-3 px-5">Check Out</th><th className="py-3 px-5">Work Hours</th><th className="py-3 px-5">Shift</th><th className="py-3 px-5">Status</th><th className="py-3 px-5">Remarks</th><th className="py-3 px-5">Actions</th></tr></thead>
              <tbody className="divide-y divide-bdr/60 text-[13px]">
                {records.map((r, i) => <tr key={i} className="hover:bg-off/60">
                    <td className="py-3 px-5 font-mono text-[12px]">{r.date}</td><td className="py-3 px-5">{r.day}</td><td className="py-3 px-5">{r.checkIn}</td><td className="py-3 px-5">{r.checkOut}</td><td className="py-3 px-5">{r.workHours}</td><td className="py-3 px-5">{r.shift}</td><td className="py-3 px-5"><StatusBadge status={r.status} /></td><td className="py-3 px-5 text-muted">{r.remarks || "\u2014"}</td>
                    <td className="py-3 px-5"><button onClick={() => setEditRow(r)} className="px-2 py-1 bg-white border border-bdr rounded-lg text-[11px] hover:bg-off">Edit</button></td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          {records.length === 0 && <EmptyState title="No attendance data for this period." desc="Try another month or year." />}
        </div> : <div className="bg-white border border-bdr rounded-xl p-5 shadow-subtle">
          <div className="grid grid-cols-7 gap-px bg-bdr border border-bdr rounded-xl overflow-hidden text-center text-[12px]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-off py-2 font-medium text-muted">{d}</div>)}
            {records.slice(0, 31).map((r, i) => <button key={i} onClick={() => setDetailDate(r.date)} className={`bg-white h-20 sm:h-24 p-1.5 text-left hover:bg-off/60 flex flex-col justify-between border border-transparent hover:border-navy/20 ${r.status === "Present" ? "" : "opacity-90"}`}>
                <span className="text-[11px] font-medium">{i + 1}</span>
                <span className={`inline-flex self-start px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${r.status === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : r.status === "Late" ? "bg-amber-50 text-amber-700 border-amber-200" : r.status === "Absent" ? "bg-red-50 text-red-700 border-red-200" : r.status === "On Leave" ? "bg-blue-50 text-blue-700 border-blue-200" : r.status === "WFH" ? "bg-slate-50 text-slate-600 border-bdr" : "bg-purple-50 text-purple-700 border-purple-200"}`}>{r.status}</span>
              </button>)}
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-[11px]"><span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full">Present</span><span className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-full">Late</span><span className="px-2 py-1 bg-red-50 border border-red-200 rounded-full">Absent</span><span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-full">Leave</span><span className="px-2 py-1 bg-slate-50 border border-bdr rounded-full">WFH</span><span className="px-2 py-1 bg-purple-50 border border-purple-200 rounded-full">Half Day</span></div>
          {detailDate && <div className="mt-4 p-4 bg-off border border-bdr rounded-xl">
              <div className="flex justify-between"><span className="font-medium text-[13px]">{detailDate} — {records.find((r) => r.date === detailDate)?.status}</span><button onClick={() => setDetailDate(null)} className="text-[12px] text-navy">Close</button></div>
              <div className="text-[12px] text-muted mt-1">Check In: {records.find((r) => r.date === detailDate)?.checkIn} • Check Out: {records.find((r) => r.date === detailDate)?.checkOut} • Work Hours: {records.find((r) => r.date === detailDate)?.workHours}</div>
            </div>}
        </div>}

      {editRow && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditRow(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-3">
            <h3 className="font-semibold">Edit Attendance — {editRow.date}</h3>
            <input value={editRow.checkIn} onChange={(e) => setEditRow({ ...editRow, checkIn: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="Check In" />
            <input value={editRow.checkOut} onChange={(e) => setEditRow({ ...editRow, checkOut: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="Check Out" />
            <div className="flex justify-end gap-2"><button onClick={() => setEditRow(null)} className="px-4 py-2 bg-white border border-bdr rounded-xl text-[13px]">Cancel</button><button onClick={() => {
    showToast("Attendance updated");
    setEditRow(null);
  }} className="px-4 py-2 bg-navy text-white rounded-xl text-[13px]">Save</button></div>
          </div>
        </div>}
    </div>;
}
