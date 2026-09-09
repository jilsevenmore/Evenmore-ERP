import { useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import { Badge } from "../../../components/hrms/Badge";
export function Locations() {
  const showToast = useAppStore((s) => s.showToast);
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[24px] font-bold">Locations</h1><p className="text-[13px] text-muted">6 offices across 3 regions</p></div><button onClick={() => showToast("Add location")} className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Add Location</button></div>
      <div className="grid md:grid-cols-2 gap-5">
        {[
    { name: "Headquarters \u2014 New York", addr: "350 5th Avenue, New York, NY 10118", tz: "EST \u2022 UTC-5", count: 342 },
    { name: "London Office", addr: "1 Canada Square, London E14 5AB", tz: "GMT \u2022 UTC+0", count: 128 },
    { name: "Dubai Hub", addr: "DIFC, Level 12, Dubai, UAE", tz: "GST \u2022 UTC+4", count: 84 },
    { name: "Remote \u2014 Global", addr: "Distributed workforce", tz: "Multiple zones", count: 694 }
  ].map((l) => <div key={l.name} className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><div className="flex justify-between"><h3 className="font-semibold">{l.name}</h3><button onClick={() => showToast("Edit " + l.name)} className="w-8 h-8 border border-bdr rounded-lg grid place-items-center hover:bg-off"><span className="material-symbols-outlined text-[16px] text-muted">edit</span></button></div><div className="text-[13px] text-muted flex items-center gap-1 mt-2"><span className="material-symbols-outlined text-[16px]">location_on</span>{l.addr}</div><div className="flex gap-2 mt-3 text-[11px]"><span className="px-2.5 py-1 bg-off border border-bdr rounded-full">{l.tz}</span><span className="px-2.5 py-1 bg-off border border-bdr rounded-full">{l.count} employees</span></div></div>)}
      </div>
    </div>;
}
export function Designations() {
  const showToast = useAppStore((s) => s.showToast);
  const [rows, setRows] = useState([
    { title: "Senior Software Engineer", level: "L4", dept: "Engineering", count: 32 },
    { title: "Product Manager", level: "L5", dept: "Product", count: 14 },
    { title: "HR Operations Lead", level: "L6", dept: "HR", count: 4 }
  ]);
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[24px] font-bold">Designations</h1><p className="text-[13px] text-muted">Define roles and hierarchy</p></div><button onClick={() => {
    const t = prompt("Title");
    if (t) setRows([...rows, { title: t, level: "L3", dept: "General", count: 0 }]);
  }} className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Add Designation</button></div>
      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left"><thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-5">Title</th><th className="py-3 px-5">Level</th><th className="py-3 px-5">Department</th><th className="py-3 px-5">Employees</th><th className="py-3 px-5 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-bdr/40 text-[13px]">{rows.map((r) => <tr key={r.title} className="hover:bg-off/60"><td className="py-4 px-5 font-medium">{r.title}</td><td className="py-4 px-5"><span className={`px-2.5 py-1 rounded-full text-[11px] border ${r.level === "L6" ? "bg-navy text-white border-navy" : "bg-off border-bdr"}`}>{r.level}</span></td><td className="py-4 px-5">{r.dept}</td><td className="py-4 px-5">{r.count}</td><td className="py-4 px-5 text-right flex justify-end gap-1"><button onClick={() => showToast("Edit " + r.title)} className="p-1.5 hover:bg-off rounded-lg"><span className="material-symbols-outlined text-[18px] text-muted">edit</span></button><button onClick={() => {
    if (confirm("Delete " + r.title + "?")) setRows(rows.filter((x) => x.title !== r.title));
  }} className="p-1.5 hover:bg-off rounded-lg"><span className="material-symbols-outlined text-[18px] text-muted">delete</span></button></td></tr>)}</tbody>
        </table>
      </div>
    </div>;
}
export function Training() {
  const showToast = useAppStore((s) => s.showToast);
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[24px] font-bold">Training Setup</h1><p className="text-[13px] text-muted">Programs, sessions, assessments & certificates</p></div><button onClick={() => showToast("Create program")} className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Create Program</button></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[{ l: "Active Programs", v: "12" }, { l: "Enrolled", v: "186" }, { l: "Upcoming", v: "8" }, { l: "Completion", v: "74%" }, { l: "Certificates", v: "94" }].map((x) => <div key={x.l} className="bg-white border border-bdr rounded-xl p-4 shadow-sm"><div className="text-[12px] text-muted">{x.l}</div><div className="text-[20px] font-bold mt-1">{x.v}</div></div>)}</div>
      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-hidden"><table className="w-full text-left text-[13px]"><thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-5">Program</th><th className="py-3 px-5">Trainer</th><th className="py-3 px-5">Date</th><th className="py-3 px-5">Status</th></tr></thead>
        <tbody className="divide-y divide-bdr/40"><tr><td className="py-3 px-5 font-medium">Leadership Essentials</td><td className="py-3 px-5">Sarah Mitchell</td><td className="py-3 px-5">Oct 18 • 2 days</td><td className="py-3 px-5"><Badge tone="warning">Upcoming</Badge></td></tr><tr><td className="py-3 px-5 font-medium">Secure Coding 101</td><td className="py-3 px-5">David Park</td><td className="py-3 px-5">Oct 08 • 4h</td><td className="py-3 px-5"><Badge tone="success">Completed</Badge></td></tr></tbody>
      </table></div>
    </div>;
}
export function Assets() {
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[24px] font-bold">Asset Setup</h1><p className="text-[13px] text-muted">Inventory, assignment, return & maintenance</p></div><button className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Add Asset</button></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[{ l: "Total Assets", v: "342" }, { l: "Assigned", v: "248" }, { l: "Available", v: "72" }, { l: "Under Maintenance", v: "14" }, { l: "Lost/Damaged", v: "8" }].map((x) => <div key={x.l} className="bg-white border border-bdr rounded-xl p-4 shadow-sm"><div className="text-[12px] text-muted">{x.l}</div><div className="text-[20px] font-bold mt-1">{x.v}</div></div>)}</div>
      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-hidden"><table className="w-full text-left text-[13px]"><thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-5">Asset</th><th className="py-3 px-5">ID</th><th className="py-3 px-5">Category</th><th className="py-3 px-5">Assigned To</th><th className="py-3 px-5">Status</th></tr></thead>
        <tbody className="divide-y divide-bdr/40"><tr><td className="py-3 px-5">MacBook Pro 16" — Space Gray</td><td className="py-3 px-5 text-muted">AST-1001</td><td className="py-3 px-5">Laptop</td><td className="py-3 px-5">Priya Patel</td><td className="py-3 px-5"><Badge tone="success">Assigned</Badge></td></tr></tbody>
      </table></div>
    </div>;
}
export function Documents() {
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[24px] font-bold">Documents</h1><p className="text-[13px] text-muted">Versioning & expiry</p></div><button className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Upload Document</button></div>
      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-hidden"><table className="w-full text-left text-[13px]"><thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-5">Document</th><th className="py-3 px-5">Employee</th><th className="py-3 px-5">Expiry</th><th className="py-3 px-5">Status</th></tr></thead>
        <tbody className="divide-y divide-bdr/40"><tr><td className="py-3 px-5">Employment Contract — Priya Patel</td><td className="py-3 px-5">Priya Patel</td><td className="py-3 px-5">—</td><td className="py-3 px-5"><Badge tone="success">Valid</Badge></td></tr><tr><td className="py-3 px-5">Work Permit — Chen Li</td><td className="py-3 px-5">Chen Li</td><td className="py-3 px-5">Nov 15, 2024</td><td className="py-3 px-5"><Badge tone="warning">Expiring Soon</Badge></td></tr><tr><td className="py-3 px-5">NDA — Rahul Verma</td><td className="py-3 px-5">Rahul Verma</td><td className="py-3 px-5">Expired Jan 02</td><td className="py-3 px-5"><Badge tone="danger">Expired</Badge></td></tr></tbody>
      </table></div>
    </div>;
}
export function CompanyPolicy() {
  const [acked, setAcked] = useState(false);
  const showToast = useAppStore((s) => s.showToast);
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[24px] font-bold">Company Policy</h1><p className="text-[13px] text-muted">Versioned policies with acknowledgement</p></div><button onClick={() => showToast("New policy")} className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">New Policy</button></div>
      <div className="bg-white border border-bdr rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap justify-between gap-4"><div><h3 className="font-semibold text-[16px]">Remote Work Policy</h3><div className="flex gap-2 mt-2 text-[11px]"><span className="px-2.5 py-1 bg-off border border-bdr rounded-full">v2.1</span><span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Published</span></div><div className="text-[12px] text-muted mt-2">Effective Sep 01 • Author Ayesha Khan</div></div><div className="text-right"><div className="text-[11px] text-muted uppercase">Acknowledgement</div><div className="text-[22px] font-bold mt-1">84%</div><div className="w-40 h-1.5 bg-off border border-bdr rounded-full mt-2"><div className="h-full bg-navy rounded-full" style={{ width: "84%" }} /></div></div></div>
        <button onClick={() => {
    setAcked(true);
    showToast("Policy acknowledged");
  }} className={`mt-4 px-5 py-2 rounded-xl text-[13.5px] font-medium ${acked ? "bg-emerald-600 text-white" : "bg-navy text-white"}`}>{acked ? "Acknowledged \u2713" : "Read Policy \u2192 Acknowledge"}</button>
      </div>
    </div>;
}
export function CalendarPage() {
  const [view, setView] = useState("Month");
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[24px] font-bold">Personal Calendar</h1><p className="text-[13px] text-muted">October 2024 • Leave, holidays, meetings</p></div><div className="flex p-1 bg-white border border-bdr rounded-xl"><button onClick={() => setView("Month")} className={`px-3 py-1.5 rounded-lg text-[12px] ${view === "Month" ? "bg-navy text-white" : ""}`}>Month</button><button onClick={() => setView("Week")} className={`px-3 py-1.5 rounded-lg text-[12px] ${view === "Week" ? "bg-navy text-white" : ""}`}>Week</button><button onClick={() => setView("Day")} className={`px-3 py-1.5 rounded-lg text-[12px] ${view === "Day" ? "bg-navy text-white" : ""}`}>Day</button></div></div>
      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-7 gap-px bg-bdr border border-bdr rounded-xl overflow-hidden text-center text-[12px]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-off py-2 font-medium text-muted">{d}</div>)}
          {Array.from({ length: 14 }).map((_, i) => <div key={i} className={`bg-white h-24 p-1 text-left ${i === 10 ? "bg-navy/5" : ""}`}><span className={`text-[11px] ${i === 10 ? "font-bold" : ""}`}>{i + 1}</span>{i === 0 && <div className="mt-1 px-1 py-0.5 bg-amber-50 border border-amber-200 rounded text-[10px]">Annual Leave</div>}{i === 2 && <div className="mt-1 px-1 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px]">Training</div>}{i === 10 && <div className="mt-1 px-1 py-0.5 bg-navy text-white rounded text-[10px]">Today • Review</div>}</div>)}
        </div>
        <div className="text-[12px] text-muted mt-3">View: {view} • Minimal palette with subtle event indicators</div>
      </div>
    </div>;
}
export function HrmsSetup() {
  const showToast = useAppStore((s) => s.showToast);
  return <div className="flex flex-col gap-6">
      <h1 className="text-[24px] font-bold">HRMS Setup</h1>
      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 flex justify-between border-b border-bdr"><h3 className="font-semibold">Roles & Permissions Matrix</h3><button onClick={() => showToast("Add role")} className="px-3 py-1.5 bg-navy text-white rounded-lg text-[12px]">Add Role</button></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-[13px]"><thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-4">Role</th><th className="py-3 px-3 text-center">View</th><th className="py-3 px-3 text-center">Create</th><th className="py-3 px-3 text-center">Edit</th><th className="py-3 px-3 text-center">Delete</th><th className="py-3 px-3 text-center">Approve</th><th className="py-3 px-3 text-center">Export</th></tr></thead>
          <tbody className="divide-y divide-bdr/40"><tr><td className="py-3 px-4 font-medium">HR Admin</td><td className="py-3 text-center">✓</td><td className="py-3 text-center">✓</td><td className="py-3 text-center">✓</td><td className="py-3 text-center">✓</td><td className="py-3 text-center">✓</td><td className="py-3 text-center">✓</td></tr><tr><td className="py-3 px-4 font-medium">Employee</td><td className="py-3 text-center">✓</td><td className="py-3 text-center">—</td><td className="py-3 text-center">—</td><td className="py-3 text-center">—</td><td className="py-3 text-center">—</td><td className="py-3 text-center">—</td></tr></tbody>
        </table></div>
      </div>
      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Audit Logs</h3><div className="mt-3 space-y-2 text-[13px]"><div className="p-3 bg-off border border-bdr rounded-xl"><b>Sarah Wilson</b> → Updated Employee Salary • EMP1024 • Oct 11 09:42</div><div className="p-3 bg-off border border-bdr rounded-xl"><b>Ayesha Khan</b> → Approved Leave • LV-2041 • Oct 11 08:20</div></div></div>
    </div>;
}
