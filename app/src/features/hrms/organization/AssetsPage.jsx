import { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import StatCard from '../../../components/ui/StatCard';
import Modal from '../../../components/ui/Modal';
import { Plus, Laptop, Smartphone, Monitor, ShieldCheck } from 'lucide-react';

const INITIAL_ASSETS = [
  { id: 'AST-1001', name: 'MacBook Pro 16" (M3 Max)', category: 'Laptop', serial: 'C02G40L3MD6R', assignedTo: 'Priya Patel', dept: 'Engineering', status: 'Active', issuedDate: '2024-01-15' },
  { id: 'AST-1002', name: 'Dell XPS 15 (i9 32GB)', category: 'Laptop', serial: 'DL-9921-XPS', assignedTo: 'David Park', dept: 'Engineering', status: 'Active', issuedDate: '2024-02-10' },
  { id: 'AST-1003', name: 'LG 27" 4K Ultrafine Display', category: 'Monitor', serial: 'LG-4K-27-01', assignedTo: 'Marcus Chen', dept: 'Design', status: 'Active', issuedDate: '2024-03-01' },
  { id: 'AST-1004', name: 'iPhone 15 Pro (Test Device)', category: 'Mobile', serial: 'AP-IPH15-08', assignedTo: 'QA Lab Pool', dept: 'Engineering', status: 'Active', issuedDate: '2024-03-12' },
  { id: 'AST-1005', name: 'MacBook Air 15" (M2)', category: 'Laptop', serial: 'C02H89P2MD6A', assignedTo: 'Unassigned (Inventory)', dept: 'IT Stock', status: 'Inactive', issuedDate: '—' },
];

export function AssetsPage() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', category: 'Laptop', serial: '', assignedTo: '', dept: 'Engineering', status: 'Active' });

  function handleCreate(e) {
    e.preventDefault();
    if (!newAsset.name) return;
    setAssets([...assets, { id: `AST-${1000 + assets.length + 1}`, ...newAsset, issuedDate: '2026-09-09' }]);
    setIsModalOpen(false);
    setNewAsset({ name: '', category: 'Laptop', serial: '', assignedTo: '', dept: 'Engineering', status: 'Active' });
  }

  const columns = [
    { key: 'name', label: 'Asset Name', render: (val, row) => (
      <div>
        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Laptop size={15} color="#1f6bff" /> {val}
        </strong>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>SN: {row.serial}</span>
      </div>
    )},
    { key: 'category', label: 'Category', render: (val) => <span className="badge badge-gray">{val}</span> },
    { key: 'assignedTo', label: 'Assigned Custodian' },
    { key: 'dept', label: 'Department' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="feature-page" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="Company Assets"
        subtitle="Track laptops, equipment, peripheral inventories, and employee custodian assignments."
        breadcrumb={[{ label: 'HRMS', to: '/hrms/dashboard' }, { label: 'Assets' }]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Register Asset
          </button>
        }
      />

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '20px 0 24px' }}>
        <StatCard stat={{ label: 'Total Tracked Assets', value: assets.length.toString(), icon: 'package', tone: 'blue' }} />
        <StatCard stat={{ label: 'Assigned to Staff', value: assets.filter(a => a.status === 'Active').length.toString(), icon: 'users', tone: 'green' }} />
        <StatCard stat={{ label: 'In IT Reserve', value: assets.filter(a => a.status === 'Inactive').length.toString(), icon: 'cart', tone: 'amber' }} />
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
        <DataTable columns={columns} data={assets} rowKey="id" searchable={true} searchPlaceholder="Search assets by name, serial, or employee..." />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Company Asset">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Asset Description</label>
            <input type="text" required placeholder="e.g. MacBook Pro 14 (M3)" value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Category</label>
              <select value={newAsset.category} onChange={e => setNewAsset({ ...newAsset, category: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}>
                <option>Laptop</option>
                <option>Monitor</option>
                <option>Mobile</option>
                <option>Peripherals</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Serial Number</label>
              <input type="text" placeholder="e.g. SN-88219" value={newAsset.serial} onChange={e => setNewAsset({ ...newAsset, serial: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Assigned Custodian</label>
            <input type="text" placeholder="e.g. Elena Rostova" value={newAsset.assignedTo} onChange={e => setNewAsset({ ...newAsset, assignedTo: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Register Asset</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AssetsPage;
