import { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import Modal from '../../../components/ui/Modal';
import { Plus, MapPin, Building, Globe } from 'lucide-react';

const INITIAL_LOCATIONS = [
  { id: 'LOC-01', name: 'Global HQ — New York', address: '350 5th Avenue, New York, NY 10118', timezone: 'EST • UTC-5', headCount: 64, type: 'Headquarters' },
  { id: 'LOC-02', name: 'London Regional Office', address: '1 Canada Square, Canary Wharf, London', timezone: 'GMT • UTC+0', headCount: 38, type: 'Branch' },
  { id: 'LOC-03', name: 'Dubai Operations Hub', address: 'DIFC Gate Precinct 4, Dubai, UAE', timezone: 'GST • UTC+4', headCount: 22, type: 'Branch' },
  { id: 'LOC-04', name: 'Distributed / Remote', address: 'Global remote workforce', timezone: 'Multiple Zones', headCount: 14, type: 'Remote' },
];

export function LocationsPage() {
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: '', address: '', timezone: 'EST • UTC-5', type: 'Branch' });

  function handleCreate(e) {
    e.preventDefault();
    if (!newLoc.name) return;
    setLocations([...locations, { id: `LOC-0${locations.length + 1}`, ...newLoc, headCount: 0 }]);
    setIsModalOpen(false);
    setNewLoc({ name: '', address: '', timezone: 'EST • UTC-5', type: 'Branch' });
  }

  const columns = [
    { key: 'name', label: 'Office Location', render: (val, row) => (
      <div>
        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0f172a' }}>
          <MapPin size={15} color="#1f6bff" /> {val}
        </strong>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{row.address}</p>
      </div>
    )},
    { key: 'type', label: 'Office Type', render: (val) => <span className="badge badge-purple">{val}</span> },
    { key: 'timezone', label: 'Timezone' },
    { key: 'headCount', label: 'Staff Count', render: (val) => <span className="badge badge-blue">{val} members</span> },
  ];

  return (
    <div className="feature-page" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="Company Locations"
        subtitle="Manage regional offices, headquarters, work facilities, and timezone hubs."
        breadcrumb={[{ label: 'HRMS', to: '/hrms/dashboard' }, { label: 'Organization' }, { label: 'Locations' }]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Location
          </button>
        }
      />

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginTop: 20 }}>
        <DataTable columns={columns} data={locations} rowKey="id" searchable={true} searchPlaceholder="Search locations..." />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Location">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Location Name</label>
            <input type="text" required placeholder="e.g. Singapore Innovation Center" value={newLoc.name} onChange={e => setNewLoc({ ...newLoc, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Address</label>
            <input type="text" placeholder="e.g. Marina Bay Financial Centre, Tower 1" value={newLoc.address} onChange={e => setNewLoc({ ...newLoc, address: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Location</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LocationsPage;
