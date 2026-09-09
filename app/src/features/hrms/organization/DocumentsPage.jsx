import { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { Plus, FileText, Download, Upload, Shield } from 'lucide-react';

const INITIAL_DOCS = [
  { id: 'DOC-01', title: 'Global Employee Handbook (2026)', category: 'Policy', employee: 'All Staff', version: 'v3.2', status: 'Active', updatedOn: '2026-08-15' },
  { id: 'DOC-02', title: 'Information Security & Data Policy', category: 'Security', employee: 'All Staff', version: 'v2.0', status: 'Active', updatedOn: '2026-07-20' },
  { id: 'DOC-03', title: 'Employment Agreement — Priya Patel', category: 'Contract', employee: 'Priya Patel', version: 'v1.0', status: 'Active', updatedOn: '2024-01-10' },
  { id: 'DOC-04', title: 'Work Permit & Visa Filing — Chen Li', category: 'Compliance', employee: 'Chen Li', version: 'v1.1', status: 'Pending', updatedOn: '2026-09-01' },
  { id: 'DOC-05', title: 'Non-Disclosure Agreement — Alex Rivera', category: 'Legal', employee: 'Alex Rivera', version: 'v1.0', status: 'Active', updatedOn: '2024-03-12' },
];

export function DocumentsPage() {
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', category: 'Policy', employee: 'All Staff', version: 'v1.0', status: 'Active' });

  function handleCreate(e) {
    e.preventDefault();
    if (!newDoc.title) return;
    setDocs([...docs, { id: `DOC-0${docs.length + 1}`, ...newDoc, updatedOn: '2026-09-09' }]);
    setIsModalOpen(false);
    setNewDoc({ title: '', category: 'Policy', employee: 'All Staff', version: 'v1.0', status: 'Active' });
  }

  const columns = [
    { key: 'title', label: 'Document Title', render: (val, row) => (
      <div>
        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <FileText size={15} color="#1f6bff" /> {val}
        </strong>
        <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Version: {row.version} • Updated: {row.updatedOn}</span>
      </div>
    )},
    { key: 'category', label: 'Category', render: (val) => <span className="badge badge-purple">{val}</span> },
    { key: 'employee', label: 'Applicable Entity' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="feature-page" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="HR & Policy Documents"
        subtitle="Manage company agreements, versioned policy documents, certificates, and contracts."
        breadcrumb={[{ label: 'HRMS', to: '/hrms/dashboard' }, { label: 'Documents' }]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Upload size={16} /> Upload Document
          </button>
        }
      />

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginTop: 20 }}>
        <DataTable
          columns={columns}
          data={docs}
          rowKey="id"
          searchable={true}
          searchPlaceholder="Search documents by title or employee..."
          actions={(row) => (
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => alert(`Downloading: ${row.title}`)}
            >
              <Download size={13} /> Download
            </button>
          )}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Document">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Document Title</label>
            <input type="text" required placeholder="e.g. Remote Work Policy v3" value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Category</label>
              <select value={newDoc.category} onChange={e => setNewDoc({ ...newDoc, category: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}>
                <option>Policy</option>
                <option>Contract</option>
                <option>Compliance</option>
                <option>Security</option>
                <option>Legal</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Applies To</label>
              <input type="text" placeholder="e.g. All Staff" value={newDoc.employee} onChange={e => setNewDoc({ ...newDoc, employee: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Upload Document</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DocumentsPage;
