import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import Modal from '../../components/ui/Modal';
import PageInfoButton from '../../components/common/PageInfoButton';
import { hrmsGuides } from '../../data/hrms/hrmsGuides';
import { Plus, MapPin, Search, Edit2, Trash2, Building } from 'lucide-react';
import { useOrgCollection, useConfirmDelete } from './useOrgCollection';
import ConfirmDeleteModal from './ConfirmDeleteModal';

// The location types the server accepts (hrms.Location.TYPES).
const TYPES = ['Headquarters', 'Branch', 'Factory', 'Warehouse', 'Remote'];
const EMPTY = { name: '', address: '', timezone: 'IST • UTC+5:30', type: 'Branch' };
const inputCls = 'w-full h-9 px-3.5 bg-off border border-bdr rounded-xl text-xs focus:outline-none focus:border-navy';

export function LocationsPage() {
  const showToast = useAppStore((s) => s.showToast);
  const { rows: locations, loading, failed, save, remove } = useOrgCollection('locations', 'Location');
  const del = useConfirmDelete(remove, showToast, 'Location');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const term = q.trim().toLowerCase();
  const filtered = locations.filter((l) =>
    !term || [l.name, l.address, l.type].some((v) => String(v ?? '').toLowerCase().includes(term))
  );

  function openForm(row) {
    setEditing(row || {});
    setForm(row
      ? { name: row.name, address: row.address || '', timezone: row.timezone || '', type: row.type || 'Branch' }
      : EMPTY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const saved = await save(editing?.id, form);
    setSaving(false);
    if (!saved) return;
    showToast(`Location "${form.name.trim()}" ${editing?.id ? 'updated' : 'added'}`);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-bold tracking-tight">Locations</h1>
            <PageInfoButton guide={hrmsGuides.locations} />
          </div>
          <p className="text-[13px] text-muted">
            {locations.length} office{locations.length === 1 ? '' : 's'}, plants and workspaces
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} /> Add Location
        </button>
      </div>

      <div className="bg-white border border-bdr rounded-xl p-4 shadow-xs flex flex-wrap justify-between items-center gap-3">
        <div className="relative w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search location by name, type or address..."
            className="pl-9 pr-4 h-9 w-full sm:w-72 bg-off border border-bdr rounded-xl text-[13px] focus:outline-none focus:border-navy"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {filtered.length === 0 && (
          <div className="md:col-span-2 bg-white border border-bdr rounded-xl p-8 text-center text-muted text-[13px]">
            {loading
              ? 'Loading locations…'
              : failed ? 'Couldn’t load locations. Refresh the page to try again.'
              : locations.length === 0 ? 'No locations yet. Add your first office or workspace.' : 'No locations match your search.'}
          </div>
        )}
        {filtered.map((l) => (
          <div key={l.id} className="bg-white border border-bdr rounded-xl p-5 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-off border border-bdr grid place-items-center text-navy shrink-0">
                    <Building size={17} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[15px] text-slate-900 truncate">{l.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-off border border-bdr text-slate-600">{l.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => openForm(l)} className="w-8 h-8 rounded-xl border border-bdr hover:bg-off grid place-items-center text-muted transition-colors cursor-pointer" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" onClick={() => del.ask(l)} className="w-8 h-8 rounded-xl border border-bdr hover:bg-red-50 text-muted hover:text-red-600 grid place-items-center transition-colors cursor-pointer" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="text-[13px] text-muted flex items-start gap-1.5 mt-3.5">
                <MapPin size={15} className="shrink-0 mt-0.5 text-navy" />
                <span>{l.address || 'No address on file'}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-bdr/60 text-[11px]">
              {l.timezone && (
                <span className="px-2.5 py-1 bg-off border border-bdr rounded-full text-slate-700 font-medium">{l.timezone}</span>
              )}
              <span className="px-2.5 py-1 bg-off border border-bdr rounded-full text-slate-700 font-medium">
                {l.employees} staff member{l.employees === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Location' : 'Add Office Location'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input type="text" required placeholder="e.g. Pune Plant" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Street Address</label>
            <input type="text" placeholder="e.g. Plot 12, MIDC Bhosari, Pune" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Location Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`${inputCls} bg-white`}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Timezone</label>
              <input type="text" placeholder="e.g. IST • UTC+5:30" value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-bdr">
            <button type="button" onClick={() => setEditing(null)} className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Location'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal target={del.target} noun="Location" onCancel={del.cancel} onConfirm={del.confirm} />
    </div>
  );
}

export default LocationsPage;
