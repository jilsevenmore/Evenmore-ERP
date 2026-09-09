import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { Plus, Shield, Check, Lock, Edit2 } from 'lucide-react';

const INITIAL_ROLES = [
  { id: 'ROL-01', name: 'Super Administrator', usersCount: 2, description: 'Unrestricted access to all CRM, HRMS, ERP, Accounts, and System configuration.', modules: ['CRM', 'Sales', 'Purchase', 'Inventory', 'HRMS', 'Accounts', 'Administration'] },
  { id: 'ROL-02', name: 'Sales & CRM Manager', usersCount: 4, description: 'Manage leads, quotations, sales orders, delivery challans, invoices, and customer party records.', modules: ['CRM', 'Sales', 'Reports'] },
  { id: 'ROL-03', name: 'HR Director', usersCount: 3, description: 'Manage employee records, attendance, leave approvals, payroll processing, recruitment, and appraisals.', modules: ['HRMS', 'Reports'] },
  { id: 'ROL-04', name: 'Procurement & Inventory Head', usersCount: 3, description: 'Manage vendor procurement, purchase bills, stock levels, transfers, faulty parts, and zone requests.', modules: ['Purchase', 'Inventory', 'Reports'] },
  { id: 'ROL-05', name: 'Accountant', usersCount: 2, description: 'Manage cash & bank accounts, general ledger, payment entries, expenses, and financial reports.', modules: ['Accounts', 'Sales', 'Purchase', 'Reports'] },
];

export function RolesPage() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', modules: [] });

  const allModules = ['CRM', 'Sales', 'Purchase', 'Inventory', 'HRMS', 'Accounts', 'Reports', 'Administration'];

  function toggleModule(m) {
    if (newRole.modules.includes(m)) {
      setNewRole({ ...newRole, modules: newRole.modules.filter(x => x !== m) });
    } else {
      setNewRole({ ...newRole, modules: [...newRole.modules, m] });
    }
  }

  function handleCreateRole(e) {
    e.preventDefault();
    if (!newRole.name) return;
    const created = {
      id: `ROL-0${roles.length + 1}`,
      name: newRole.name,
      description: newRole.description,
      usersCount: 0,
      modules: newRole.modules,
    };
    setRoles([...roles, created]);
    setIsModalOpen(false);
    setNewRole({ name: '', description: '', modules: [] });
  }

  const columns = [
    { key: 'name', label: 'Role Name', render: (val, row) => (
      <div>
        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0f172a' }}>
          <Shield size={14} color="#1f6bff" /> {val}
        </strong>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>{row.description}</p>
      </div>
    )},
    { key: 'usersCount', label: 'Assigned Users', render: (val) => (
      <span className="badge badge-gray">{val} users</span>
    )},
    { key: 'modules', label: 'Module Permissions', render: (val = []) => (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {val.map(m => (
          <span key={m} className="badge badge-blue" style={{ fontSize: 11 }}>
            {m}
          </span>
        ))}
      </div>
    )},
  ];

  return (
    <div className="feature-page" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure role-based access control and module-level permission boundaries."
        breadcrumb={[{ label: 'Administration' }, { label: 'Roles' }]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Define New Role
          </button>
        }
      />

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginTop: 20 }}>
        <DataTable
          columns={columns}
          data={roles}
          rowKey="id"
          searchable={true}
          searchPlaceholder="Search roles..."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Define Role & Permissions"
      >
        <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Role Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Regional Sales Lead"
              value={newRole.name}
              onChange={e => setNewRole({ ...newRole, name: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Description</label>
            <textarea
              rows={3}
              placeholder="Describe access boundaries..."
              value={newRole.description}
              onChange={e => setNewRole({ ...newRole, description: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Module Access Permissions</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {allModules.map(m => {
                const checked = newRole.modules.includes(m);
                return (
                  <label
                    key={m}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: checked ? '#1f6bff' : '#e2e8f0',
                      background: checked ? '#f0f6ff' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      color: checked ? '#1f6bff' : '#334155',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModule(m)}
                    />
                    {m}
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Role</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default RolesPage;
