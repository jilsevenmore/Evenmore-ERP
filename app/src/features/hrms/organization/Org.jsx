import { useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import { departmentsMock } from "../../../data/hrms/mocks/data";
import { Badge } from "../../../components/hrms/Badge";
export function OrgChart() {
  const showToast = useAppStore((s) => s.showToast);
  const [zoom, setZoom] = useState(100);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(true);
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[24px] font-bold">Org Chart</h1><p className="text-[13px] text-muted">12 Departments • 1,248 Employees • Last updated Oct 11, 2024</p></div><div className="flex gap-2"><button onClick={() => showToast("Exported PNG")} className="px-4 py-2.5 border border-bdr bg-white rounded-xl text-[13.5px] font-medium flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">download</span>Export</button><button onClick={() => showToast("Add department")} className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Add Department</button></div></div>
      <div className="bg-white border border-bdr rounded-xl p-4 shadow-sm flex flex-wrap justify-between gap-3">
        <div className="flex gap-2"><div className="relative"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[18px]">search</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or role" className="pl-10 pr-4 h-9 w-64 bg-off border border-bdr rounded-xl text-[13px]" /></div><button onClick={() => setExpanded(!expanded)} className="px-3 py-1 text-navy text-[13px] font-medium">{expanded ? "Collapse all" : "Expand all"}</button></div>
        <div className="flex items-center gap-2 text-[12px]"><span className="text-muted">Zoom</span><button onClick={() => setZoom(Math.max(70, zoom - 10))} className="w-8 h-8 border border-bdr rounded-lg grid place-items-center bg-white"><span className="material-symbols-outlined text-[16px]">remove</span></button><span className="w-10 text-center font-medium">{zoom}%</span><button onClick={() => setZoom(Math.min(140, zoom + 10))} className="w-8 h-8 border border-bdr rounded-lg grid place-items-center bg-white"><span className="material-symbols-outlined text-[16px]">add</span></button></div>
      </div>
      <div className="bg-white border border-bdr rounded-xl shadow-sm p-8 overflow-x-auto">
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }} className="min-w-[900px] flex flex-col items-center gap-0">
          <div className="w-[160px] bg-white border-2 border-navy rounded-xl p-3 flex flex-col items-center shadow-sm"><img src="https://i.pravatar.cc/100?img=8" className="w-8 h-8 rounded-full ring-2 ring-navy" /><div className="text-[13px] font-semibold mt-2">Sarah Mitchell</div><div className="text-[11px] text-muted">CEO</div></div>
          <div className="w-px h-8 bg-bdr" /><div className="w-[680px] h-px bg-bdr" />
          {expanded && <div className="flex gap-6 mt-6">
              {[{ name: "David Park", role: "CTO", img: 11 }, { name: "Ayesha Khan", role: "HR Director", img: 5 }, { name: "James Wilson", role: "CFO", img: 12 }].filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase())).map((x) => <div key={x.name} className="w-[160px] bg-white border border-bdr rounded-xl p-3 flex flex-col items-center"><img src={`https://i.pravatar.cc/100?img=${x.img}`} className="w-8 h-8 rounded-full" /><div className="text-[13px] font-semibold mt-2">{x.name}</div><div className="text-[11px] text-muted">{x.role}</div></div>)}
            </div>}
        </div>
      </div>
    </div>;
}
export function Departments() {
  const showToast = useAppStore((s) => s.showToast);
  const [q, setQ] = useState("");
  const [view, setView] = useState("table");
  const filtered = departmentsMock.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-[24px] font-bold">Departments</h1><p className="text-[13px] text-muted">Manage organizational structure</p></div><button onClick={() => showToast("Add department")} className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Add Department</button></div>
      <div className="bg-white border border-bdr rounded-xl p-4 shadow-sm flex flex-wrap justify-between gap-3">
        <div className="relative"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[18px]">search</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search department" className="pl-10 pr-4 h-9 w-64 bg-off border border-bdr rounded-xl text-[13px]" /></div>
        <div className="flex p-1 bg-off border border-bdr rounded-xl"><button onClick={() => setView("table")} className={`px-3 py-1.5 rounded-lg text-[12px] ${view === "table" ? "bg-white border border-bdr shadow-sm font-medium" : ""}`}>List</button><button onClick={() => setView("grid")} className={`px-3 py-1.5 rounded-lg text-[12px] ${view === "grid" ? "bg-white border border-bdr shadow-sm font-medium" : ""}`}>Grid</button></div>
      </div>
      {view === "table" ? <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left"><thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-5">Department</th><th className="py-3 px-5">Head</th><th className="py-3 px-5">Teams</th><th className="py-3 px-5">Employees</th><th className="py-3 px-5">Status</th></tr></thead>
            <tbody className="divide-y divide-bdr/40 text-[13px]">{filtered.map((d) => <tr key={d.name} className="hover:bg-off/60"><td className="py-4 px-5 font-medium flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">{d.icon}</span>{d.name}</td><td className="py-4 px-5"><div className="flex items-center gap-2"><img src={d.avatar} className="w-7 h-7 rounded-full" />{d.head}</div></td><td className="py-4 px-5">{d.teams}</td><td className="py-4 px-5">{d.employees}</td><td className="py-4 px-5"><Badge tone={d.status === "Active" ? "success" : "warning"}>{d.status}</Badge></td></tr>)}</tbody>
          </table>
        </div> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map((d) => <div key={d.name} className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><div className="font-semibold">{d.name}</div><div className="text-[12px] text-muted flex items-center gap-2 mt-2"><img src={d.avatar} className="w-6 h-6 rounded-full" />{d.head}</div><div className="flex gap-2 mt-3 text-[11px]"><span className="px-2 py-1 bg-off border border-bdr rounded-full">{d.teams} teams</span><span className="px-2 py-1 bg-off border border-bdr rounded-full">{d.employees} employees</span></div></div>)}</div>}
    </div>;
}
