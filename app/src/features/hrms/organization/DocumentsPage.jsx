import { useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import { Badge } from "../../../components/hrms/Badge";

const INITIAL_DOCS = [
  { id: "DOC-01", title: "Global Employee Handbook (2026)", category: "Policy", employee: "All Staff", version: "v3.2", expiry: "—", status: "Valid", updatedOn: "2026-08-15" },
  { id: "DOC-02", title: "Information Security & Data Policy", category: "Security", employee: "All Staff", version: "v2.0", expiry: "2026-12-31", status: "Valid", updatedOn: "2026-07-20" },
  { id: "DOC-03", title: "Employment Agreement — Priya Patel", category: "Contract", employee: "Priya Patel", version: "v1.0", expiry: "—", status: "Valid", updatedOn: "2024-01-10" },
  { id: "DOC-04", title: "Work Permit & Visa Filing — Chen Li", category: "Compliance", employee: "Chen Li", version: "v1.1", expiry: "Nov 15, 2024", status: "Expiring Soon", updatedOn: "2026-09-01" },
  { id: "DOC-05", title: "Non-Disclosure Agreement — Rahul Verma", category: "Legal", employee: "Rahul Verma", version: "v1.0", expiry: "Expired Jan 02", status: "Expired", updatedOn: "2024-03-12" },
  { id: "DOC-06", title: "Health & Safety Protocol (2026)", category: "Policy", employee: "All Staff", version: "v1.4", expiry: "2027-01-01", status: "Valid", updatedOn: "2026-06-11" },
];

export function DocumentsPage() {
  const showToast = useAppStore((s) => s.showToast);
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: "",
    category: "Policy",
    employee: "All Staff",
    version: "v1.0",
    expiry: "",
    status: "Valid",
  });

  const filtered = docs.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.employee.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "All" || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const total = docs.length;
  const valid = docs.filter((d) => d.status === "Valid").length;
  const expiringSoon = docs.filter((d) => d.status === "Expiring Soon").length;
  const expired = docs.filter((d) => d.status === "Expired").length;

  function handleCreate(e) {
    e.preventDefault();
    if (!newDoc.title) return;
    const item = {
      id: `DOC-0${docs.length + 1}`,
      ...newDoc,
      expiry: newDoc.expiry || "—",
      updatedOn: "2026-09-10",
    };
    setDocs([...docs, item]);
    setIsModalOpen(false);
    setNewDoc({ title: "", category: "Policy", employee: "All Staff", version: "v1.0", expiry: "", status: "Valid" });
    showToast(`Document ${item.id} uploaded successfully`);
  }

  function getStatusBadge(status) {
    switch (status) {
      case "Valid":
        return <Badge tone="success">Valid</Badge>;
      case "Expiring Soon":
        return <Badge tone="warning">Expiring Soon</Badge>;
      case "Expired":
        return <Badge tone="danger">Expired</Badge>;
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900">Documents</h1>
          <p className="text-[13px] text-muted">Manage company agreements, versioning & compliance expiry</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium hover:bg-navy/90 transition"
        >
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: "Total Documents", v: total.toString() },
          { l: "Valid & Active", v: valid.toString() },
          { l: "Expiring Soon", v: expiringSoon.toString() },
          { l: "Expired / Action Req.", v: expired.toString() },
        ].map((x) => (
          <div key={x.l} className="bg-white border border-bdr rounded-xl p-4 shadow-sm">
            <div className="text-[12px] text-muted">{x.l}</div>
            <div className="text-[20px] font-bold mt-1 text-slate-900">{x.v}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-bdr rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document title or employee..."
            className="pl-10 pr-4 h-9 w-64 md:w-80 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
          />
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-muted font-medium">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 bg-off border border-bdr rounded-xl text-[12.5px] focus:outline-none focus:border-navy"
          >
            <option value="All">All Categories</option>
            <option value="Policy">Policy</option>
            <option value="Contract">Contract</option>
            <option value="Compliance">Compliance</option>
            <option value="Security">Security</option>
            <option value="Legal">Legal</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
              <tr>
                <th className="py-3 px-5">Document</th>
                <th className="py-3 px-5">ID</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Employee / Scope</th>
                <th className="py-3 px-5">Version</th>
                <th className="py-3 px-5">Expiry</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdr/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    No matching documents found.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-off/60 transition">
                    <td className="py-4 px-5">
                      <div className="font-medium text-slate-900">{d.title}</div>
                      <div className="text-[11px] text-muted">Updated on {d.updatedOn}</div>
                    </td>
                    <td className="py-4 px-5 text-muted font-mono text-[12px]">{d.id}</td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 bg-off border border-bdr rounded-full text-[11px]">
                        {d.category}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-800">{d.employee}</td>
                    <td className="py-4 px-5 font-mono text-[12px] text-muted">{d.version}</td>
                    <td className="py-4 px-5 text-slate-700">{d.expiry}</td>
                    <td className="py-4 px-5">{getStatusBadge(d.status)}</td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => showToast(`Downloading ${d.title}`)}
                          className="p-1.5 hover:bg-off rounded-lg text-muted hover:text-slate-900"
                          title="Download Document"
                        >
                          <span className="material-symbols-outlined text-[18px]">download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => showToast(`Edit document ${d.id}`)}
                          className="p-1.5 hover:bg-off rounded-lg text-muted hover:text-slate-900"
                          title="Edit Document"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-bdr shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-bdr">
              <h3 className="font-bold text-[16px] text-slate-900">Upload Document</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-off grid place-items-center text-muted hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Remote Work Security Agreement"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={newDoc.category}
                    onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option value="Policy">Policy</option>
                    <option value="Contract">Contract</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Security">Security</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Version</label>
                  <input
                    type="text"
                    placeholder="e.g. v1.0"
                    value={newDoc.version}
                    onChange={(e) => setNewDoc({ ...newDoc, version: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Applicable To</label>
                  <input
                    type="text"
                    placeholder="e.g. All Staff or Sarah M."
                    value={newDoc.employee}
                    onChange={(e) => setNewDoc({ ...newDoc, employee: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-12-31 or —"
                    value={newDoc.expiry}
                    onChange={(e) => setNewDoc({ ...newDoc, expiry: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Status</label>
                <select
                  value={newDoc.status}
                  onChange={(e) => setNewDoc({ ...newDoc, status: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                >
                  <option value="Valid">Valid</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-bdr">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-bdr rounded-xl text-[13px] hover:bg-off font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded-xl text-[13px] font-medium hover:bg-navy/90"
                >
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const Documents = DocumentsPage;
export default DocumentsPage;
