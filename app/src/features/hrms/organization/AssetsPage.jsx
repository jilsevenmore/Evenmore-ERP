import { useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import { Badge } from "../../../components/hrms/Badge";

const INITIAL_ASSETS = [
  { id: "AST-1001", name: 'MacBook Pro 16" — Space Gray', category: "Laptop", assignedTo: "Priya Patel", dept: "Engineering", status: "Assigned" },
  { id: "AST-1002", name: "Dell XPS 15 (i9 32GB)", category: "Laptop", assignedTo: "David Park", dept: "Engineering", status: "Assigned" },
  { id: "AST-1003", name: 'LG 27" 4K Ultrafine Display', category: "Monitor", assignedTo: "Marcus Chen", dept: "Design", status: "Assigned" },
  { id: "AST-1004", name: "iPhone 15 Pro (Test Device)", category: "Mobile", assignedTo: "QA Lab Pool", dept: "Engineering", status: "Available" },
  { id: "AST-1005", name: 'MacBook Air 15" (M2)', category: "Laptop", assignedTo: "IT Stock Reserve", dept: "IT Support", status: "Available" },
  { id: "AST-1006", name: "Dell Precision 5820 Workstation", category: "Workstation", assignedTo: "Hardware Lab", dept: "Engineering", status: "Under Maintenance" },
  { id: "AST-1007", name: "iPad Pro 12.9 (5th Gen)", category: "Tablet", assignedTo: "Damaged in transit", dept: "Operations", status: "Lost/Damaged" },
];

export function AssetsPage() {
  const showToast = useAppStore((s) => s.showToast);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    category: "Laptop",
    assignedTo: "",
    dept: "Engineering",
    status: "Assigned",
  });

  const filtered = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.assignedTo.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "All" || a.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const total = assets.length;
  const assigned = assets.filter((a) => a.status === "Assigned").length;
  const available = assets.filter((a) => a.status === "Available").length;
  const maintenance = assets.filter((a) => a.status === "Under Maintenance").length;
  const lostDamaged = assets.filter((a) => a.status === "Lost/Damaged").length;

  function handleCreate(e) {
    e.preventDefault();
    if (!newAsset.name) return;
    const item = {
      id: `AST-${1000 + assets.length + 1}`,
      ...newAsset,
    };
    setAssets([...assets, item]);
    setIsModalOpen(false);
    setNewAsset({ name: "", category: "Laptop", assignedTo: "", dept: "Engineering", status: "Assigned" });
    showToast(`Asset ${item.id} registered successfully`);
  }

  function getStatusBadge(status) {
    switch (status) {
      case "Assigned":
        return <Badge tone="success">Assigned</Badge>;
      case "Available":
        return <Badge tone="info">Available</Badge>;
      case "Under Maintenance":
        return <Badge tone="warning">Under Maintenance</Badge>;
      case "Lost/Damaged":
        return <Badge tone="danger">Lost/Damaged</Badge>;
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900">Asset Setup</h1>
          <p className="text-[13px] text-muted">Inventory, assignment, return & maintenance</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-navy text-white rounded-xl text-[13.5px] font-medium hover:bg-navy/90 transition"
        >
          Add Asset
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { l: "Total Assets", v: total.toString() },
          { l: "Assigned", v: assigned.toString() },
          { l: "Available", v: available.toString() },
          { l: "Under Maintenance", v: maintenance.toString() },
          { l: "Lost/Damaged", v: lostDamaged.toString() },
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
            placeholder="Search asset, ID, or person..."
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
            <option value="Laptop">Laptop</option>
            <option value="Monitor">Monitor</option>
            <option value="Mobile">Mobile</option>
            <option value="Workstation">Workstation</option>
            <option value="Tablet">Tablet</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-bdr rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
              <tr>
                <th className="py-3 px-5">Asset</th>
                <th className="py-3 px-5">ID</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Assigned To</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdr/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No matching assets found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-off/60 transition">
                    <td className="py-4 px-5 font-medium text-slate-900">{r.name}</td>
                    <td className="py-4 px-5 text-muted font-mono text-[12px]">{r.id}</td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 bg-off border border-bdr rounded-full text-[11px]">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-800">{r.assignedTo || "—"}</td>
                    <td className="py-4 px-5 text-muted">{r.dept}</td>
                    <td className="py-4 px-5">{getStatusBadge(r.status)}</td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => showToast(`Edit asset ${r.id}`)}
                        className="p-1.5 hover:bg-off rounded-lg text-muted hover:text-slate-900"
                        title="Edit Asset"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
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
              <h3 className="font-bold text-[16px] text-slate-900">Add Company Asset</h3>
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
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Asset Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro 14 (M3 Max)"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Workstation">Workstation</option>
                    <option value="Tablet">Tablet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Department</label>
                  <select
                    value={newAsset.dept}
                    onChange={(e) => setNewAsset({ ...newAsset, dept: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Operations">Operations</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Assigned To</label>
                  <input
                    type="text"
                    placeholder="e.g. Liam Evans"
                    value={newAsset.assignedTo}
                    onChange={(e) => setNewAsset({ ...newAsset, assignedTo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Status</label>
                  <select
                    value={newAsset.status}
                    onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-bdr text-[13px] bg-off focus:bg-white focus:outline-none focus:border-navy"
                  >
                    <option value="Assigned">Assigned</option>
                    <option value="Available">Available</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Lost/Damaged">Lost/Damaged</option>
                  </select>
                </div>
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
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const Assets = AssetsPage;
export default AssetsPage;
