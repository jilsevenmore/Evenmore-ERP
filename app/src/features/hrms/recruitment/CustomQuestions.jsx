import { useState } from "react";
import { questionsMock } from "../../../data/hrms/data/recruitmentData";
import { DataTable } from "../../../components/hrms/DataTable";
import { Modal } from "../../../components/hrms/Modal";
import { Drawer } from "../../../components/hrms/Drawer";
import { Button } from "../../../components/hrms/Button";
import { useAppStore } from "../../../stores/appStore";
import { Eye, Pencil, Trash2 } from "lucide-react";

const QUESTION_TYPES = ["Short Answer", "Long Answer", "Single Select", "Multiple Select", "Yes / No", "Number"];

export default function CustomQuestions() {
  const showToast = useAppStore((s) => s.showToast);
  const [data, setData] = useState(questionsMock);
  const [addOpen, setAddOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [form, setForm] = useState({ text: "", type: "Short Answer", enabled: true });

  function save() {
    if (!form.text.trim()) { showToast("Question text required"); return; }
    if (editRow) {
      setData((d) => d.map((x) => x.id === editRow.id ? { ...x, text: form.text, type: form.type, enabled: form.enabled } : x));
      showToast("Question updated"); setEditRow(null);
    } else {
      setData((d) => [{ id: `Q-${String(d.length + 1).padStart(2, "0")}`, text: form.text, type: form.type, enabled: form.enabled, assignedJobs: [] }, ...d]);
      showToast("Question added"); setAddOpen(false);
    }
  }

  const cols = [
    { key: "text", header: "Question", sortable: true, render: (r) => <span className="font-medium max-w-[360px] block truncate">{r.text}</span> },
    { key: "type", header: "Type" },
    { key: "enabled", header: "Enabled", render: (r) => (
      <button onClick={() => { setData((d) => d.map((x) => x.id === r.id ? { ...x, enabled: !x.enabled } : x)); showToast(r.enabled ? "Disabled" : "Enabled"); }} className={`px-2 py-1 rounded-full text-[11px] border ${r.enabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-bdr text-slate"}`}>{r.enabled ? "Enabled" : "Disabled"}</button>
    ) },
    { key: "assignedJobs", header: "Assigned Jobs", render: (r) => r.assignedJobs.length ? r.assignedJobs.join(", ") : "—" },
    { key: "actions", header: "Actions", render: (r) => (
      <div className="flex gap-1">
        <button onClick={() => setViewRow(r)} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Eye size={14} /></button>
        <button onClick={() => { setForm({ text: r.text, type: r.type, enabled: r.enabled }); setEditRow(r); }} className="w-7 h-7 rounded-lg hover:bg-off grid place-items-center"><Pencil size={14} /></button>
        <button onClick={() => setDeleteRow(r)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600 grid place-items-center"><Trash2 size={14} /></button>
      </div>
    ) },
  ];

  function FormFields() {
    return (
      <div className="space-y-4">
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Question *</span><input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]" placeholder="What is your notice period?" /></label>
        <label className="flex flex-col gap-1"><span className="text-[11px] font-medium text-muted">Type</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px]">{QUESTION_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> <span className="text-[13px]">Enabled</span></label>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-[22px] font-bold">Custom Questions</h1><p className="text-[13px] text-muted">{data.length} questions • assign to jobs</p></div><Button onClick={() => { setForm({ text: "", type: "Short Answer", enabled: true }); setAddOpen(true); }}>+ Add Question</Button></div>
      <DataTable columns={cols} data={data} emptyTitle="No questions" emptyDesc="Add a custom question to get started." emptyAction={<Button onClick={() => setAddOpen(true)}>+ Add Question</Button>} />
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Question" footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={save}>Save Question</Button></>}><FormFields /></Modal>
      <Modal isOpen={!!editRow} onClose={() => setEditRow(null)} title="Edit Question" footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={save}>Save Question</Button></>}><FormFields /></Modal>
      <Drawer isOpen={!!viewRow} onClose={() => setViewRow(null)} title={viewRow?.text ?? ""} subtitle={`${viewRow?.type} • ${viewRow?.enabled ? "Enabled" : "Disabled"}`} footer={<Button variant="secondary" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && <div className="text-[13px]"><div>Assigned Jobs: {viewRow.assignedJobs.length ? viewRow.assignedJobs.join(", ") : "Not assigned"}</div></div>}
      </Drawer>
      <Modal isOpen={!!deleteRow} onClose={() => setDeleteRow(null)} title="Delete Question?" footer={<><Button variant="secondary" onClick={() => setDeleteRow(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (deleteRow) setData((d) => d.filter((x) => x.id !== deleteRow.id)); setDeleteRow(null); showToast("Question deleted"); }}>Delete</Button></>}><p className="text-[13px] text-muted">Delete <b>{deleteRow?.text}</b>?</p></Modal>
    </div>
  );
}