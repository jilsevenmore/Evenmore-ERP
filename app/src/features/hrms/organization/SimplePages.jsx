import { useState, useEffect } from "react";
import { useAppStore } from "../../../stores/appStore";
import { useTrainingStore } from "../../../stores/trainingStore";
import { useAssetStore } from "../../../stores/assetStore";
import { hrmsSync } from "../../../services/hrmsSync";

function usePulled(key) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let cancelled = false;
    hrmsSync.pull(key).then((data) => {
      if (!cancelled && Array.isArray(data)) setRows(data);
    });
    return () => { cancelled = true; };
  }, [key]);
  return rows;
}
import { Badge } from "../../../components/hrms/Badge";
import PageInfoButton from "../../../components/common/PageInfoButton";
import { hrmsGuides } from "../../../data/hrms/hrmsGuides";
export function Locations() {
  const showToast = useAppStore((s) => s.showToast);
  const locations = usePulled("locations");
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold">Locations</h1>
            <PageInfoButton guide={hrmsGuides.locations} />
          </div>
          <p className="text-[13px] text-muted">{locations.length} offices and workspaces</p>
        </div>
        <button onClick={() => showToast("Add location")} className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Add Location</button>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {locations.length === 0 && <div className="md:col-span-2 bg-white border border-bdr rounded-xl p-8 text-center text-[13px] text-muted">No locations yet.</div>}
        {locations.map((l) => ({ name: l.name, addr: l.address || "—", tz: l.timezone || "—", count: l.count ?? 0 })).map((l) => <div key={l.name} className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><div className="flex justify-between"><h3 className="font-semibold">{l.name}</h3><button onClick={() => showToast("Edit " + l.name)} className="w-8 h-8 border border-bdr rounded-lg grid place-items-center hover:bg-off"><span className="material-symbols-outlined text-[16px] text-muted">edit</span></button></div><div className="text-[13px] text-muted flex items-center gap-1 mt-2"><span className="material-symbols-outlined text-[16px]">location_on</span>{l.addr}</div><div className="flex gap-2 mt-3 text-[11px]"><span className="px-2.5 py-1 bg-off border border-bdr rounded-full">{l.tz}</span><span className="px-2.5 py-1 bg-off border border-bdr rounded-full">{l.count} employees</span></div></div>)}
      </div>
    </div>;
}
export function Designations() {
  const showToast = useAppStore((s) => s.showToast);
  const [rows, setRows] = useState([]);
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold">Designations</h1>
            <PageInfoButton guide={hrmsGuides.designations} />
          </div>
          <p className="text-[13px] text-muted">Define roles and hierarchy</p>
        </div>
        <button onClick={() => {
    const t = prompt("Title");
    if (t) setRows([...rows, { title: t, level: "L3", dept: "General", count: 0 }]);
  }} className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Add Designation</button></div>
      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px] lg:min-w-0 text-left"><thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-5">Title</th><th className="py-3 px-5">Level</th><th className="py-3 px-5">Department</th><th className="py-3 px-5">Employees</th><th className="py-3 px-5 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-bdr/40 text-[13px]">{rows.map((r) => <tr key={r.title} className="hover:bg-off/60"><td className="py-4 px-5 font-medium">{r.title}</td><td className="py-4 px-5"><span className={`px-2.5 py-1 rounded-full text-[11px] border ${r.level === "L6" ? "bg-navy text-white border-navy" : "bg-off border-bdr"}`}>{r.level}</span></td><td className="py-4 px-5">{r.dept}</td><td className="py-4 px-5">{r.count}</td><td className="py-4 px-5 text-right flex justify-end gap-1"><button onClick={() => showToast("Edit " + r.title)} className="p-1.5 hover:bg-off rounded-lg"><span className="material-symbols-outlined text-[18px] text-muted">edit</span></button><button onClick={() => {
    if (confirm("Delete " + r.title + "?")) setRows(rows.filter((x) => x.title !== r.title));
  }} className="p-1.5 hover:bg-off rounded-lg"><span className="material-symbols-outlined text-[18px] text-muted">delete</span></button></td></tr>)}</tbody>
        </table>
      </div>
    </div>;
}
export function Training() {
  const showToast = useAppStore((s) => s.showToast);
  const trainings = useTrainingStore((s) => s.trainings || []);
  const activeCount = trainings.filter((t) => t.stage !== "Cancelled").length;
  const doneCount = trainings.filter((t) => ["Completed", "Evaluated"].includes(t.stage)).length;
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold">Training Setup</h1>
            <PageInfoButton guide={hrmsGuides.trainingDashboard} />
          </div>
          <p className="text-[13px] text-muted">Programs, sessions, assessments & certificates</p>
        </div>
        <button onClick={() => showToast("Create program")} className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Create Program</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[{ l: "Active Programs", v: String(activeCount) }, { l: "Enrolled", v: String(trainings.reduce((sum, t) => sum + (Number(t.participants) || 0), 0)) }, { l: "Upcoming", v: String(trainings.filter((t) => ["Scheduled", "Trainer Assigned", "Requested"].includes(t.stage)).length) }, { l: "Completion", v: `${activeCount ? Math.round((doneCount / activeCount) * 100) : 0}%` }, { l: "Certificates", v: String(doneCount) }].map((x) => <div key={x.l} className="bg-white border border-bdr rounded-xl p-4 shadow-sm"><div className="text-[12px] text-muted">{x.l}</div><div className="text-[20px] font-bold mt-1">{x.v}</div></div>)}</div>
      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-x-auto"><table className="w-full min-w-[640px] lg:min-w-0 text-left text-[13px]"><thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-5">Program</th><th className="py-3 px-5">Trainer</th><th className="py-3 px-5">Date</th><th className="py-3 px-5">Status</th></tr></thead>
        <tbody className="divide-y divide-bdr/40">{trainings.length === 0 && <tr><td colSpan={4} className="py-6 px-5 text-center text-muted">No training programs yet.</td></tr>}{trainings.map((t) => <tr key={t.id}><td className="py-3 px-5 font-medium">{t.name || t.title}</td><td className="py-3 px-5">{t.trainer || "Unassigned"}</td><td className="py-3 px-5">{t.start || t.startDate || "—"}</td><td className="py-3 px-5"><Badge tone={["Completed", "Evaluated"].includes(t.stage) ? "success" : "warning"}>{t.stage || t.status}</Badge></td></tr>)}</tbody>
      </table></div>
    </div>;
}
export function Assets() {
  const assets = useAssetStore((s) => s.assets || []);
  const countOf = (status) => assets.filter((a) => a.status === status).length;
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold">Asset Setup</h1>
            <PageInfoButton guide={hrmsGuides.assets} />
          </div>
          <p className="text-[13px] text-muted">Inventory, assignment, return & maintenance</p>
        </div>
        <button className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Add Asset</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[{ l: "Total Assets", v: String(assets.length) }, { l: "Assigned", v: String(countOf("Assigned")) }, { l: "Available", v: String(countOf("Available")) }, { l: "Under Maintenance", v: String(countOf("Under Maintenance")) }, { l: "Lost/Damaged", v: String(countOf("Lost") + countOf("Damaged")) }].map((x) => <div key={x.l} className="bg-white border border-bdr rounded-xl p-4 shadow-sm"><div className="text-[12px] text-muted">{x.l}</div><div className="text-[20px] font-bold mt-1">{x.v}</div></div>)}</div>
      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-x-auto"><table className="w-full min-w-[640px] lg:min-w-0 text-left text-[13px]"><thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-5">Asset</th><th className="py-3 px-5">ID</th><th className="py-3 px-5">Category</th><th className="py-3 px-5">Assigned To</th><th className="py-3 px-5">Status</th></tr></thead>
        <tbody className="divide-y divide-bdr/40">{assets.length === 0 && <tr><td colSpan={5} className="py-6 px-5 text-center text-muted">No assets registered yet.</td></tr>}{assets.map((a) => <tr key={a.id}><td className="py-3 px-5">{a.name}</td><td className="py-3 px-5 text-muted">{a.id}</td><td className="py-3 px-5">{a.category}</td><td className="py-3 px-5">{a.assignedTo || "—"}</td><td className="py-3 px-5"><Badge tone={a.status === "Assigned" ? "success" : "warning"}>{a.status}</Badge></td></tr>)}</tbody>
      </table></div>
    </div>;
}
export function Documents() {
  const documents = usePulled("documents");
  return <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold">Documents</h1>
            <PageInfoButton guide={hrmsGuides.documents} />
          </div>
          <p className="text-[13px] text-muted">Versioning & expiry</p>
        </div>
        <button className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium">Upload Document</button>
      </div>
      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-x-auto"><table className="w-full min-w-[640px] lg:min-w-0 text-left text-[13px]"><thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted"><tr><th className="py-3 px-5">Document</th><th className="py-3 px-5">Employee</th><th className="py-3 px-5">Expiry</th><th className="py-3 px-5">Status</th></tr></thead>
        <tbody className="divide-y divide-bdr/40">{documents.length === 0 && <tr><td colSpan={4} className="py-6 px-5 text-center text-muted">No documents uploaded yet.</td></tr>}{documents.map((d) => <tr key={d.id}><td className="py-3 px-5">{d.title || d.name}</td><td className="py-3 px-5">{d.employee || d.employeeName || "—"}</td><td className="py-3 px-5">{d.expiryDate || "—"}</td><td className="py-3 px-5"><Badge tone={d.status === "Expired" ? "danger" : d.status === "Expiring Soon" ? "warning" : "success"}>{d.status || "Valid"}</Badge></td></tr>)}</tbody>
      </table></div>
    </div>;
}
export { CompanyPolicy, CompanyPolicy as CompanyPolicyPage } from "./CompanyPolicyPage";
export { CalendarPage, CalendarPage as Calendar } from "./CalendarPage";
export { HrmsSetup, HrmsSetup as HrmsSetupPage } from "./HrmsSetupPage";
export { default as HRAdminPage } from "./HRAdminPage";
