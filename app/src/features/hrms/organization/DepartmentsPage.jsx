import { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import StatCard from '../../../components/ui/StatCard';
import Modal from '../../../components/ui/Modal';
import { Plus, Users, Building, MapPin } from 'lucide-react';

const INITIAL_DEPTS = [
  { id: 'DEP-01', name: 'Engineering', head: 'David Park', totalEmployees: 48, openRoles: 5, budget: '$450,000' },
  { id: 'DEP-02', name: 'Sales & CRM', head: 'Alex Rivera', totalEmployees: 32, openRoles: 3, budget: '$320,000' },
  { id: 'DEP-03', name: 'Human Resources', head: 'Ayesha Khan', totalEmployees: 8, openRoles: 1, budget: '$110,000' },
  { id: 'DEP-04', name: 'Finance & Accounts', head: 'James Wilson', totalEmployees: 12, openRoles: 2, budget: '$180,000' },
  { id: 'DEP-05', name: 'Warehouse & Inventory', head: 'Chen Li', totalEmployees: 24, openRoles: 4, budget: '$210,000' },
  { id: 'DEP-06', name: 'Marketing & Design', head: 'Elena Rostova', totalEmployees: 14, openRoles: 1, budget: '$160,000' },
];

export function DepartmentsPage() {
  const [departments, setDepartments] = useState(INITIAL_DEPTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', head: '', budget: '' });

  function handleCreate(e) {
    e.preventDefault();
    if (!newDept.name) return;
    setDepartments([...departments, { id: `DEP-0${departments.length + 1}`, ...newDept, totalEmployees: 1, openRoles: 0 }]);
    setIsModalOpen(false);
    setNewDept({ name: '', head: '', budget: '' });
  }

  const columns = [
    { key: 'name', label: 'Department Name', render: (val) => (
      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
        <Building size={16} color="#1f6bff" /> {val}
      </strong>
    )},
    { key: 'head', label: 'Department Head' },
    { key: 'totalEmployees', label: 'Employees', render: (val) => (
      <span className="badge badge-blue">{val} members</span>
    )},
    { key: 'openRoles', label: 'Open Positions', render: (val) => (
      <span className="badge badge-green">{val} open</span>
    )},
    { key: 'budget', label: 'Annual Budget' },
  ];

  return (
    <div className="feature-page" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="Departments"
        subtitle="Manage organization structure, operational units, budgets, and leadership."
        breadcrumb={[{ label: 'HRMS', to: '/hrms/dashboard' }, { label: 'Organization' }, { label: 'Departments' }]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Department
          </button>
        }
      />

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '20px 0 24px' }}>
        <StatCard stat={{ label: 'Total Departments', value: departments.length.toString(), icon: 'users', tone: 'blue' }} />
        <StatCard stat={{ label: 'Total Headcount', value: '138', icon: 'cart', tone: 'green' }} />
        <StatCard stat={{ label: 'Open Headcount', value: '16', icon: 'chart', tone: 'amber' }} />
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
        <DataTable columns={columns} data={departments} rowKey="id" searchable={true} searchPlaceholder="Search departments..." />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Department">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Department Name</label>
            <input type="text" required placeholder="e.g. Quality Assurance" value={newDept.name} onChange={e => setNewDept({ ...newDept, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Department Head</label>
            <input type="text" placeholder="e.g. Priya Patel" value={newDept.head} onChange={e => setNewDept({ ...newDept, head: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Annual Budget</label>
            <input type="text" placeholder="e.g. $250,000" value={newDept.budget} onChange={e => setNewDept({ ...newDept, budget: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Department</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DepartmentsPage;
