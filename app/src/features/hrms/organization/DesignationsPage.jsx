import { useState } from 'react';
import { useAppStore } from '../../../stores/appStore';
import Modal from '../../../components/ui/Modal';
import PageInfoButton from '../../../components/common/PageInfoButton';
import { hrmsGuides } from '../../../data/hrms/hrmsGuides';
import { Plus, Award, Search, Edit2, Trash2 } from 'lucide-react';

const INITIAL_DESIGNATIONS = [
  { id: 'DSG-01', title: 'Chief Executive Officer', level: 'L7', department: 'Executive', count: 1 },
  { id: 'DSG-02', title: 'Chief Technology Officer', level: 'L6', department: 'Engineering', count: 1 },
  { id: 'DSG-03', title: 'Head of People & HRMS', level: 'L6', department: 'Human Resources', count: 1 },
  { id: 'DSG-04', title: 'Chief Financial Officer', level: 'L6', department: 'Finance', count: 1 },
  { id: 'DSG-05', title: 'Staff Backend Architect', level: 'L5', department: 'Engineering', count: 4 },
  { id: 'DSG-06', title: 'Senior Software Engineer', level: 'L4', department: 'Engineering', count: 32 },
  { id: 'DSG-07', title: 'Product Manager', level: 'L5', department: 'Product', count: 14 },
  { id: 'DSG-08', title: 'HR Operations Lead', level: 'L4', department: 'Human Resources', count: 6 },
  { id: 'DSG-09', title: 'DevOps & Cloud Lead', level: 'L5', department: 'Engineering', count: 5 },
];

export function DesignationsPage() {
  const showToast = useAppStore((s) => s.showToast);
  const [designations, setDesignations] = useState(INITIAL_DESIGNATIONS);
  const [q, setQ] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDesig, setNewDesig] = useState({ title: '', level: 'L4', department: 'Engineering' });

  const filtered = designations.filter(
    (d) =>
      d.title.toLowerCase().includes(q.toLowerCase()) ||
      d.department.toLowerCase().includes(q.toLowerCase()) ||
      d.level.toLowerCase().includes(q.toLowerCase())
  );

  function handleCreate(e) {
    e.preventDefault();
    if (!newDesig.title.trim()) return;
    setDesignations([
      { id: `DSG-0${designations.length + 1}`, ...newDesig, count: 0 },
      ...designations,
    ]);
    showToast(`Designation "${newDesig.title}" created successfully`);
    setIsModalOpen(false);
    setNewDesig({ title: '', level: 'L4', department: 'Engineering' });
  }

  function handleDelete(id, title) {
    setDesignations(designations.filter((x) => x.id !== id));
    showToast(`Designation "${title}" removed`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold tracking-tight">Designations</h1>
            <PageInfoButton guide={hrmsGuides.designations} />
          </div>
          <p className="text-[13px] text-muted">
            Define corporate job roles, leveling framework, and departmental allocations
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-navy hover:bg-navy/90 text-white rounded-xl text-[13.5px] font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} /> Add Designation
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-bdr rounded-xl p-4 shadow-xs flex flex-wrap justify-between items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, level, or department..."
            className="pl-9 pr-4 h-9 w-72 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
          />
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white border border-bdr rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-off border-b border-bdr text-[11px] uppercase text-muted">
              <tr>
                <th className="py-3 px-5">Job Title</th>
                <th className="py-3 px-5">Level</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Assigned Employees</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdr/40 text-[13px]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-off/60 transition-colors">
                  <td className="py-4 px-5 font-semibold text-slate-900 flex items-center gap-2">
                    <Award size={15} className="text-navy shrink-0" />
                    {r.title}
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        r.level === 'L7' || r.level === 'L6'
                          ? 'bg-navy text-white border-navy'
                          : r.level === 'L5'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-off border-bdr text-slate-700'
                      }`}
                    >
                      {r.level}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-700">{r.department}</td>
                  <td className="py-4 px-5 font-medium text-slate-700">{r.count} members</td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => showToast(`Edit ${r.title}`)}
                        className="w-8 h-8 rounded-lg hover:bg-off grid place-items-center text-muted transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id, r.title)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 text-muted hover:text-red-600 grid place-items-center transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Designation */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Designation">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Designation Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lead Product Designer"
              value={newDesig.title}
              onChange={(e) => setNewDesig({ ...newDesig, title: e.target.value })}
              className="w-full px-3.5 py-2 bg-off border border-bdr rounded-xl text-[13.5px] focus:outline-none focus:border-navy"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                Level Framework
              </label>
              <select
                value={newDesig.level}
                onChange={(e) => setNewDesig({ ...newDesig, level: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-bdr rounded-xl text-[13.5px] focus:outline-none focus:border-navy"
              >
                <option value="L1">L1 — Associate</option>
                <option value="L2">L2 — Junior</option>
                <option value="L3">L3 — Mid-Level</option>
                <option value="L4">L4 — Senior</option>
                <option value="L5">L5 — Staff / Lead</option>
                <option value="L6">L6 — Director / Head</option>
                <option value="L7">L7 — Executive</option>
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                Department
              </label>
              <select
                value={newDesig.department}
                onChange={(e) => setNewDesig({ ...newDesig, department: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-bdr rounded-xl text-[13.5px] focus:outline-none focus:border-navy"
              >
                <option>Engineering</option>
                <option>Human Resources</option>
                <option>Finance</option>
                <option>Product</option>
                <option>Sales & CRM</option>
                <option>Marketing</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-bdr">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-bdr bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-navy hover:bg-navy/90 text-white rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
            >
              Save Designation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export const Designations = DesignationsPage;
export default DesignationsPage;

