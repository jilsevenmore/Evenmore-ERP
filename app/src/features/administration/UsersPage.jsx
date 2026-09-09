import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { Plus, User, Shield, Key, Mail, Phone, Edit2, Trash2 } from 'lucide-react';

const INITIAL_USERS = [
  { id: 'USR-001', name: 'Sarah Mitchell', email: 'sarah.mitchell@evenmore.com', role: 'Super Admin', department: 'Executive', status: 'Active', lastLogin: '2026-09-09 14:20' },
  { id: 'USR-002', name: 'David Park', email: 'david.park@evenmore.com', role: 'Sales Manager', department: 'Sales & CRM', status: 'Active', lastLogin: '2026-09-09 16:05' },
  { id: 'USR-003', name: 'Ayesha Khan', email: 'ayesha.khan@evenmore.com', role: 'HR Director', department: 'HRMS', status: 'Active', lastLogin: '2026-09-09 11:30' },
  { id: 'USR-004', name: 'James Wilson', email: 'james.wilson@evenmore.com', role: 'Finance Head', department: 'Accounts', status: 'Active', lastLogin: '2026-09-08 17:45' },
  { id: 'USR-005', name: 'Chen Li', email: 'chen.li@evenmore.com', role: 'Inventory Specialist', department: 'Warehouse', status: 'Active', lastLogin: '2026-09-09 09:12' },
  { id: 'USR-006', name: 'Elena Rostova', email: 'elena.rostova@evenmore.com', role: 'Sales Rep', department: 'Sales & CRM', status: 'Inactive', lastLogin: '2026-08-28 10:15' },
];

export function UsersPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Sales Rep', department: 'Sales & CRM', status: 'Active' });

  const stats = [
    { label: 'Total Users', value: users.length.toString(), icon: 'users', tone: 'blue' },
    { label: 'Active Now', value: users.filter(u => u.status === 'Active').length.toString(), icon: 'chart', tone: 'green' },
    { label: 'Roles Assigned', value: '5', icon: 'filter', tone: 'purple' },
    { label: 'Pending Invites', value: '0', icon: 'clock', tone: 'amber' },
  ];

  function handleCreateUser(e) {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    const user = {
      id: `USR-00${users.length + 1}`,
      ...newUser,
      lastLogin: 'Never',
    };
    setUsers([...users, user]);
    setIsAddModalOpen(false);
    setNewUser({ name: '', email: '', role: 'Sales Rep', department: 'Sales & CRM', status: 'Active' });
  }

  const columns = [
    { key: 'name', label: 'User Name', render: (val, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
          {val.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <strong style={{ display: 'block', color: '#0f172a' }}>{val}</strong>
          <span style={{ fontSize: 12, color: '#64748b' }}>{row.email}</span>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (val) => (
      <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Shield size={12} /> {val}
      </span>
    )},
    { key: 'department', label: 'Department' },
    { key: 'lastLogin', label: 'Last Login', render: (val) => <span style={{ color: '#64748b', fontSize: 13 }}>{val}</span> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="feature-page" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="User Management"
        subtitle="Manage organization user accounts, roles, access levels, and security credentials."
        breadcrumb={[{ label: 'Administration' }, { label: 'Users' }]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add New User
          </button>
        }
      />

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '20px 0 24px' }}>
        {stats.map(s => <StatCard key={s.label} stat={s} />)}
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
        <DataTable
          columns={columns}
          data={users}
          rowKey="id"
          searchable={true}
          searchPlaceholder="Search users by name, email, or role..."
        />
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New System User"
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Rivera"
              value={newUser.name}
              onChange={e => setNewUser({ ...newUser, name: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Email Address</label>
            <input
              type="email"
              required
              placeholder="alex.rivera@evenmore.com"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Role</label>
              <select
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
              >
                <option>Super Admin</option>
                <option>Sales Manager</option>
                <option>HR Director</option>
                <option>Finance Head</option>
                <option>Inventory Specialist</option>
                <option>Sales Rep</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Department</label>
              <select
                value={newUser.department}
                onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
              >
                <option>Sales & CRM</option>
                <option>HRMS</option>
                <option>Accounts</option>
                <option>Warehouse</option>
                <option>Executive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create User</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default UsersPage;
