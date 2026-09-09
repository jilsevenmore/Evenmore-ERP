import { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import { Plus, Award, Tag } from 'lucide-react';

const INITIAL_DESIGNATIONS = [
  { id: 'DSG-01', title: 'Senior Software Engineer', level: 'L4', department: 'Engineering', count: 18 },
  { id: 'DSG-02', title: 'Staff Backend Architect', level: 'L5', department: 'Engineering', count: 4 },
  { id: 'DSG-03', title: 'Product Manager', level: 'L4', department: 'Product', count: 6 },
  { id: 'DSG-04', title: 'Enterprise Account Executive', level: 'L4', department: 'Sales & CRM', count: 12 },
  { id: 'DSG-05', title: 'HR Business Partner', level: 'L3', department: 'HR', count: 5 },
  { id: 'DSG-06', title: 'Inventory Controller', level: 'L3', department: 'Warehouse', count: 8 },
];

export function DesignationsPage() {
  const [designations, setDesignations] = useState(INITIAL_DESIGNATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDesig, setNewDesig] = useState({ title: '', level: 'L3', department: 'Engineering' });

  function handleCreate(e) {
    e.preventDefault();
    if (!newDesig.title) return;
    setDesignations([...designations, { id: `DSG-0${designations.length + 1}`, ...newDesig, count: 0 }]);
    setIsModalOpen(false);
    setNewDesig({ title: '', level: 'L3', department: 'Engineering' });
  }

  const columns = [
    { key: 'title', label: 'Job Title', render: (val) => (
      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
        <Award size={15} color="#1f6bff" /> {val}
      </strong>
    )},
    { key: 'level', label: 'Hierarchy Level', render: (val) => <span className="badge badge-purple">{val}</span> },
    { key: 'department', label: 'Department' },
    { key: 'count', label: 'Assigned Employees', render: (val) => <span className="badge badge-blue">{val} members</span> },
  ];

  return (
    <div className="feature-page" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="Designations"
        subtitle="Define job profiles, titles, leveling frameworks, and competencies."
        breadcrumb={[{ label: 'HRMS', to: '/hrms/dashboard' }, { label: 'Organization' }, { label: 'Designations' }]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Designation
          </button>
        }
      />

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginTop: 20 }}>
        <DataTable columns={columns} data={designations} rowKey="id" searchable={true} searchPlaceholder="Search designations..." />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Designation">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Title</label>
            <input type="text" required placeholder="e.g. Lead Frontend Architect" value={newDesig.title} onChange={e => setNewDesig({ ...newDesig, title: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Level</label>
            <select value={newDesig.level} onChange={e => setNewDesig({ ...newDesig, level: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}>
              <option>L1 (Junior / Associate)</option>
              <option>L2 (Mid)</option>
              <option>L3 (Senior)</option>
              <option>L4 (Lead / Staff)</option>
              <option>L5 (Principal / Director)</option>
              <option>L6 (Executive)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Department</label>
            <input type="text" placeholder="e.g. Engineering" value={newDesig.department} onChange={e => setNewDesig({ ...newDesig, department: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Designation</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DesignationsPage;
