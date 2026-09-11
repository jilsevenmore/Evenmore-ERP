import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  RotateCcw,
  ShoppingCart,
  User,
  ListChecks,
  X,
  Handshake,
  CalendarDays,
  CalendarRange,
  Wallet,
  ChevronDown,
  Phone,
  Trash2,
  SlidersHorizontal,
  Package,
  Flag,
  Globe,
  UserRound,
  Calendar,
  MoreVertical,
  Bookmark,
  Pencil,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
} from 'lucide-react';

const STORAGE_KEY = 'crm-deals-v1';
const STAGES = ['Draft', 'Sent', 'Open', 'Revised', 'Declined'];
const PRODUCTS = ['All Products', 'Product A', 'Product B', 'Service C'];
const SOURCES = ['All Sources', 'Website', 'Referral', 'Cold Call'];
const USERS = ['All Users', 'Mr. Kamlesh Dhumadiya', 'Jayesh Nair', 'Anuska'];
const PIPELINES = ['Sales', 'Support'];
const LABEL_OPTIONS = [
  { id: 'on-hold', label: 'On Hold', cls: 'bg-[#1d4a79]' },
  { id: 'new', label: 'New', cls: 'bg-cyan-400' },
  { id: 'pending', label: 'Pending', cls: 'bg-orange-400' },
  { id: 'loss', label: 'Loss', cls: 'bg-rose-500' },
  { id: 'win', label: 'Win', cls: 'bg-lime-400' },
];

function seedDeals() {
  return [
    { id: 'dl-1', name: 'amitbhai_001', phone: '+919876543210', price: 100000, client: 'Amit Bhai', product: 'Product A', stage: 'Draft', source: 'Website', assignedUser: 'Mr. Kamlesh Dhumadiya', pipeline: 'Sales', labels: [], notes: '', tasks: '0/0', items: 0, users: 0, createdAt: '2026-05-10T10:00:00' },
    { id: 'dl-2', name: 'Rohit', phone: '+919876543211', price: 500000, client: 'Rohit Sharma', product: 'Product B', stage: 'Draft', source: 'Referral', assignedUser: 'Jayesh Nair', pipeline: 'Sales', labels: [], notes: '', tasks: '0/0', items: 0, users: 0, createdAt: '2026-05-12T10:00:00' },
    { id: 'dl-3', name: 'Deal Alpha', phone: '+919876543212', price: 750000, client: 'Alpha Corp', product: 'Product A', stage: 'Draft', source: 'Cold Call', assignedUser: 'Anuska', pipeline: 'Sales', labels: [], notes: '', tasks: '1/3', items: 2, users: 1, createdAt: '2026-04-08T10:00:00' },
    { id: 'dl-4', name: 'Deal Beta', phone: '+919876543213', price: 1200000, client: 'Beta Ltd', product: 'Service C', stage: 'Draft', source: 'Website', assignedUser: 'Mr. Kamlesh Dhumadiya', pipeline: 'Sales', labels: [], notes: '', tasks: '2/5', items: 1, users: 2, createdAt: '2026-03-15T10:00:00' },
    { id: 'dl-5', name: 'Deal Gamma', phone: '+919876543214', price: 1500000, client: 'Gamma Inc', product: 'Product B', stage: 'Draft', source: 'Referral', assignedUser: 'Jayesh Nair', pipeline: 'Sales', labels: [], notes: '', tasks: '0/2', items: 0, users: 0, createdAt: '2026-02-20T10:00:00' },
    { id: 'dl-6', name: 'Deal Delta', phone: '+919876543215', price: 11123, client: 'Delta Co', product: 'Product A', stage: 'Draft', source: 'Website', assignedUser: 'Anuska', pipeline: 'Sales', labels: [], notes: '', tasks: '0/0', items: 0, users: 0, createdAt: '2026-01-11T10:00:00' },
  ];
}

function loadDeals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDeals();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return seedDeals();
    return parsed.map((d) => ({ labels: [], pipeline: 'Sales', notes: '', ...d }));
  } catch {
    return seedDeals();
  }
}

function formatINR(value) {
  return `₹ ${(Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function formatShort(value) {
  const n = Number(value) || 0;
  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹ ${(n / 1000).toFixed(1)}k`;
  return formatINR(n);
}

const EMPTY_FORM = { name: '', phone: '', price: 0, client: '' };

export default function DealsPage() {
  const [deals, setDeals] = useState(loadDeals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [labelsId, setLabelsId] = useState(null);
  const [labelsDraft, setLabelsDraft] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', price: 0, pipeline: 'Sales', stage: 'Draft', source: '', notes: '' });
  const [editError, setEditError] = useState('');
  const [draftProduct, setDraftProduct] = useState('All Products');
  const [draftStage, setDraftStage] = useState('All Stages');
  const [draftSource, setDraftSource] = useState('All Sources');
  const [draftUser, setDraftUser] = useState('All Users');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [product, setProduct] = useState('All Products');
  const [stage, setStage] = useState('All Stages');
  const [source, setSource] = useState('All Sources');
  const [assignedUser, setAssignedUser] = useState('All Users');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
    } catch {
      return;
    }
  }, [deals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((d) => {
      if (product !== 'All Products' && d.product !== product) return false;
      if (stage !== 'All Stages' && d.stage !== stage) return false;
      if (source !== 'All Sources' && d.source !== source) return false;
      if (assignedUser !== 'All Users' && d.assignedUser !== assignedUser) return false;
      if (fromDate && new Date(d.createdAt).getTime() < new Date(fromDate).getTime()) return false;
      if (toDate && new Date(d.createdAt).getTime() > new Date(toDate).getTime() + 86400000) return false;
      if (q && !`${d.name} ${d.phone} ${d.client} ${d.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [deals, product, stage, source, assignedUser, fromDate, toDate, search]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const weekStart = now.getTime() - 7 * 86400000;
  const days30Start = now.getTime() - 30 * 86400000;
  const sumBy = (list) => list.reduce((s, d) => s + (Number(d.price) || 0), 0);
  const totalDeals = sumBy(filtered);
  const monthTotal = sumBy(filtered.filter((d) => new Date(d.createdAt).getTime() >= monthStart));
  const weekTotal = sumBy(filtered.filter((d) => new Date(d.createdAt).getTime() >= weekStart));
  const days30Total = sumBy(filtered.filter((d) => new Date(d.createdAt).getTime() >= days30Start));

  const activeFilterCount = [product, stage, source, assignedUser].filter((v) => v !== 'All Products' && v !== 'All Stages' && v !== 'All Sources' && v !== 'All Users').length + (fromDate ? 1 : 0) + (toDate ? 1 : 0) + (search.trim() ? 1 : 0);

  const stats = [
    { label: 'Total Deals', sub: `${filtered.length} deals`, value: formatINR(totalDeals), short: formatShort(totalDeals), icon: Handshake, card: 'bg-rose-50 border-rose-100', text: 'text-rose-600', chip: 'bg-rose-600' },
    { label: 'This Month', sub: 'Month pipeline', value: formatINR(monthTotal), short: formatShort(monthTotal), icon: CalendarDays, card: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600', chip: 'bg-emerald-500' },
    { label: 'This Week', sub: 'Week pipeline', value: formatINR(weekTotal), short: formatShort(weekTotal), icon: CalendarRange, card: 'bg-amber-50 border-amber-100', text: 'text-amber-600', chip: 'bg-amber-500' },
    { label: 'Last 30 Days', sub: 'Rolling pipeline', value: formatINR(days30Total), short: formatShort(days30Total), icon: Wallet, card: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', chip: 'bg-indigo-800' },
  ];

  function applyFilters() {
    setProduct(draftProduct);
    setStage(draftStage);
    setSource(draftSource);
    setAssignedUser(draftUser);
    setFromDate(draftFrom);
    setToDate(draftTo);
    setSearch(draftSearch);
  }

  function resetFilters() {
    setDraftProduct('All Products');
    setDraftStage('All Stages');
    setDraftSource('All Sources');
    setDraftUser('All Users');
    setDraftFrom('');
    setDraftTo('');
    setDraftSearch('');
    setProduct('All Products');
    setStage('All Stages');
    setSource('All Sources');
    setAssignedUser('All Users');
    setFromDate('');
    setToDate('');
    setSearch('');
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError('');
    setIsModalOpen(true);
  }

  function submitDeal(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Deal name is required.');
      return;
    }
    if (!form.phone.trim()) {
      setFormError('Phone is required.');
      return;
    }
    if (!form.client.trim()) {
      setFormError('Client is required.');
      return;
    }
    setDeals((prev) => [
      ...prev,
      {
        id: `dl-${Date.now()}`,
        name: form.name.trim(),
        phone: form.phone.trim(),
        price: Number(form.price) || 0,
        client: form.client.trim(),
        product: 'Product A',
        stage: 'Draft',
        source: 'Website',
        assignedUser: 'Mr. Kamlesh Dhumadiya',
        pipeline: 'Sales',
        labels: [],
        notes: '',
        tasks: '0/0',
        items: 0,
        users: 0,
        createdAt: new Date().toISOString(),
      },
    ]);
    setIsModalOpen(false);
  }

  function deleteDeal(id) {
    setDeals((prev) => prev.filter((d) => d.id !== id));
    setOpenMenuId(null);
  }

  function openLabels(deal) {
    setLabelsId(deal.id);
    setLabelsDraft([...(deal.labels || [])]);
    setOpenMenuId(null);
  }

  function toggleLabel(id) {
    setLabelsDraft((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function saveLabels() {
    if (!labelsId) return;
    setDeals((prev) => prev.map((d) => (d.id === labelsId ? { ...d, labels: labelsDraft } : d)));
    setLabelsId(null);
  }

  function openEdit(deal) {
    setEditId(deal.id);
    setEditForm({
      name: deal.name,
      phone: deal.phone,
      price: deal.price,
      pipeline: deal.pipeline || 'Sales',
      stage: deal.stage,
      source: deal.source === 'All Sources' ? '' : (deal.source || ''),
      notes: deal.notes || '',
    });
    setEditError('');
    setOpenMenuId(null);
  }

  function submitEdit(e) {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError('Deal name is required.');
      return;
    }
    if (!editForm.phone.trim()) {
      setEditError('Phone is required.');
      return;
    }
    if (!editForm.stage) {
      setEditError('Stage is required.');
      return;
    }
    setDeals((prev) => prev.map((d) => (d.id === editId ? {
      ...d,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      price: Number(editForm.price) || 0,
      pipeline: editForm.pipeline,
      stage: editForm.stage,
      source: editForm.source.trim() || 'Website',
      notes: editForm.notes,
    } : d)));
    setEditId(null);
  }

  const inputCls = 'w-full h-[42px] pl-9 pr-3 bg-slate-50/60 border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/70 transition';
  const labelCls = 'flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5';
  const iconCls = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';

  return (
    <section className="w-full max-w-[1400px] mx-auto py-4 px-2 sm:px-3">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Manage Deals</h1>
          <div className="text-xs mt-1 flex items-center gap-1.5">
            <Link to="/dashboard" className="text-blue-600 hover:underline font-medium">Dashboard</Link>
            <span className="text-slate-400">›</span>
            <span className="text-slate-500">Deal</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{filtered.length} of {deals.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold hover:border-blue-400 hover:text-blue-700 transition"
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-blue-600 text-white text-[11px] font-bold">{activeFilterCount}</span>
            )}
            <ChevronDown size={14} className={`transition ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#1d4a79] hover:bg-[#163a61] text-white text-[13px] font-bold shadow-sm transition"
          >
            <Plus size={16} /> New Deal
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.05)] mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/60">
            <p className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-800">
              <span className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-700 grid place-items-center">
                <SlidersHorizontal size={14} />
              </span>
              Filter deals
              {activeFilterCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-blue-600 text-white text-[11px] font-bold">{activeFilterCount} on</span>
              )}
            </p>
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
              <RotateCcw size={13} /> Reset
            </button>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className={labelCls}><Package size={12} /> Product</label>
              <div className="relative">
                <Package size={14} className={iconCls} />
                <select value={draftProduct} onChange={(e) => setDraftProduct(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}><Flag size={12} /> Stage</label>
              <div className="relative">
                <Flag size={14} className={iconCls} />
                <select value={draftStage} onChange={(e) => setDraftStage(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                  <option value="All Stages">All Stages</option>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}><Globe size={12} /> Source</label>
              <div className="relative">
                <Globe size={14} className={iconCls} />
                <select value={draftSource} onChange={(e) => setDraftSource(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}><UserRound size={12} /> Assigned User</label>
              <div className="relative">
                <UserRound size={14} className={iconCls} />
                <select value={draftUser} onChange={(e) => setDraftUser(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                  {USERS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}><Calendar size={12} /> From Date</label>
              <div className="relative">
                <Calendar size={14} className={iconCls} />
                <input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} className={`${inputCls} cursor-pointer`} />
              </div>
            </div>
            <div>
              <label className={labelCls}><Calendar size={12} /> To Date</label>
              <div className="relative">
                <Calendar size={14} className={iconCls} />
                <input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} className={`${inputCls} cursor-pointer`} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}><Search size={12} /> Search</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className={iconCls} />
                  <input
                    value={draftSearch}
                    onChange={(e) => setDraftSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                    placeholder="Search by deal name, phone, client, notes"
                    className={`${inputCls} pr-9`}
                  />
                  {draftSearch && (
                    <button type="button" onClick={() => setDraftSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button type="button" onClick={applyFilters} className="h-[42px] px-5 inline-flex items-center gap-1.5 bg-[#1d4a79] hover:bg-[#163a61] text-white text-[13px] font-bold rounded-xl transition shrink-0 shadow-sm">
                  <Search size={15} /> <span className="hidden sm:inline">Search</span>
                </button>
                <button type="button" onClick={resetFilters} aria-label="Reset" title="Reset filters" className="h-[42px] w-[42px] grid place-items-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition shrink-0">
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs">
              <span className="font-semibold text-slate-500">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} on</span>
              <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold transition"><X size={12} /> Clear all</button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-5">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${s.card}`}>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-800 truncate">{s.label}</p>
              <p className="text-[11px] text-slate-500 truncate">{s.sub}</p>
              <p className={`text-lg font-bold mt-1 truncate ${s.text}`} title={s.value}>{s.short}</p>
            </div>
            <span className="w-12 h-12 rounded-2xl bg-white shadow-sm grid place-items-center shrink-0">
              <span className={`w-9 h-9 rounded-xl grid place-items-center text-white ${s.chip}`}>
                <s.icon size={18} />
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 snap-x">
        {STAGES.map((st) => {
          const items = filtered.filter((d) => d.stage === st);
          const stageValue = sumBy(items);
          return (
            <div key={st} className="bg-slate-100/70 rounded-2xl border border-slate-200/70 w-[290px] shrink-0 snap-start flex flex-col max-h-[72vh]">
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded-t-2xl border-b-2 border-[#1d4a79] sticky top-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{st}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{formatShort(stageValue)} • {items.length} deal{items.length === 1 ? '' : 's'}</p>
                </div>
                <span className="min-w-7 h-7 px-2 grid place-items-center rounded-lg border border-[#1d4a79] text-[#1d4a79] text-xs font-bold bg-white">{items.length}</span>
              </div>
              <div className="p-2.5 space-y-2.5 overflow-y-auto">
                {items.length === 0 && (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-5 text-center">
                    <p className="text-xs font-semibold text-slate-500">No deals here</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Drag here or create one</p>
                    <button type="button" onClick={openCreate} className="mt-2.5 inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#1d4a79] hover:border-[#1d4a79] transition">
                      <Plus size={13} /> Add deal
                    </button>
                  </div>
                )}
                {items.map((d) => (
                  <article key={d.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 truncate" title={d.name}>{d.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{d.client}</p>
                      </div>
                      <div className="relative shrink-0">
                        <button type="button" onClick={() => setOpenMenuId(openMenuId === d.id ? null : d.id)} className="w-7 h-7 grid place-items-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition" aria-label="Deal actions">
                          <MoreVertical size={15} />
                        </button>
                        {openMenuId === d.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden py-1.5">
                            <button type="button" onClick={() => openLabels(d)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition">
                              <span className="w-7 h-7 rounded-full bg-[#1d4a79] text-white grid place-items-center shrink-0"><Bookmark size={13} /></span>
                              Labels
                            </button>
                            <button type="button" onClick={() => openEdit(d)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition border-t border-slate-100">
                              <span className="w-7 h-7 rounded-full bg-[#1d4a79] text-white grid place-items-center shrink-0"><Pencil size={13} /></span>
                              Edit
                            </button>
                            <button type="button" onClick={() => deleteDeal(d.id)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition border-t border-slate-100">
                              <span className="w-7 h-7 rounded-full bg-[#1d4a79] text-white grid place-items-center shrink-0"><Trash2 size={13} /></span>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {(d.labels || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(d.labels || []).map((lid) => {
                          const opt = LABEL_OPTIONS.find((o) => o.id === lid);
                          if (!opt) return null;
                          return <span key={lid} className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white ${opt.cls}`}>{opt.label}</span>;
                        })}
                      </div>
                    )}
                    <div className="mt-2.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-[#1d4a79] text-xs font-bold">
                        {formatINR(d.price)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs text-slate-500">
                        <Phone size={12} /> {d.phone}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-500 font-medium">
                        <ListChecks size={12} /> {d.tasks}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-500 font-medium">
                        <ShoppingCart size={12} /> {d.items}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-500 font-medium">
                        <User size={12} /> {d.users}
                      </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 truncate">{d.assignedUser}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-semibold shrink-0">{d.product}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/50" onClick={() => setIsModalOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Create deal"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Create Deal</h2>
                <p className="text-xs text-slate-500 mt-0.5">Deals start in Draft, then move across stages.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitDeal} className="px-6 py-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deal Name<span className="text-rose-500">*</span></label>
                <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter Name" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone<span className="text-rose-500">*</span></label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter Phone" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                <p className="text-[11px] text-slate-400 mt-1">Please use with country code. (ex. +91)</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Price</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Clients<span className="text-rose-500">*</span></label>
                <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Client name" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
              {formError && <p className="sm:col-span-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">{formError}</p>}
              <div className="sm:col-span-2 flex items-center justify-end gap-2.5 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold transition">
                  Cancel
                </button>
                <button type="submit" className="h-10 px-6 rounded-xl bg-[#1d4a79] hover:bg-[#163a61] text-white text-[13px] font-bold transition">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {labelsId && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-950/50" onClick={() => setLabelsId(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Labels"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-900">Labels</h2>
              <button type="button" onClick={() => setLabelsId(null)} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {LABEL_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelsDraft.includes(opt.id)}
                    onChange={() => toggleLabel(opt.id)}
                    className="w-4 h-4 rounded border-slate-300 accent-[#1d4a79] cursor-pointer"
                  />
                  <span className={`h-8 w-28 grid place-items-center rounded-md text-xs font-bold text-white ${opt.cls}`}>{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2.5 px-6 py-4">
              <button type="button" onClick={() => setLabelsId(null)} className="h-10 px-5 rounded-lg bg-slate-500 hover:bg-slate-600 text-white text-[13px] font-semibold transition">
                Cancel
              </button>
              <button type="button" onClick={saveLabels} className="h-10 px-6 rounded-lg bg-[#1d4a79] hover:bg-[#163a61] text-white text-[13px] font-semibold transition">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {editId && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-950/50" onClick={() => setEditId(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Edit deal"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-900">Edit Deal</h2>
              <button type="button" onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitEdit} className="px-6 py-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Deal Name<span className="text-rose-500">*</span></label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Phone<span className="text-rose-500">*</span></label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Enter Phone" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400" />
                  <p className="text-[11px] text-rose-400 mt-1">Please use with country code. (ex. +91)</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Price</label>
                  <input type="number" min="0" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Pipeline<span className="text-rose-500">*</span></label>
                  <select value={editForm.pipeline} onChange={(e) => setEditForm({ ...editForm, pipeline: e.target.value })} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400">
                    {PIPELINES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Stage<span className="text-rose-500">*</span></label>
                  <select value={editForm.stage} onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400">
                    <option value="">Select Stage</option>
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Sources</label>
                  <input value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Notes</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-1 px-2.5 py-2 border-b border-slate-200 bg-slate-50/60 text-slate-600">
                    <button type="button" className="p-1.5 rounded hover:bg-slate-200 transition" title="Bold"><Bold size={14} /></button>
                    <button type="button" className="p-1.5 rounded hover:bg-slate-200 transition font-serif font-bold text-[13px]" title="Bold">B</button>
                    <button type="button" className="p-1.5 rounded hover:bg-slate-200 transition italic font-serif text-[13px]" title="Italic">I</button>
                    <button type="button" className="p-1.5 rounded hover:bg-slate-200 transition underline text-[13px]" title="Underline"><Underline size={14} /></button>
                    <button type="button" className="p-1.5 rounded hover:bg-slate-200 transition" title="Strike"><Strikethrough size={14} /></button>
                    <button type="button" className="p-1.5 rounded hover:bg-slate-200 transition" title="List"><List size={14} /></button>
                    <button type="button" className="p-1.5 rounded hover:bg-slate-200 transition" title="Ordered list"><ListOrdered size={14} /></button>
                    <button type="button" className="p-1.5 rounded hover:bg-slate-200 transition" title="Link"><Link2 size={14} /></button>
                  </div>
                  <textarea
                    rows={6}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Write Here..."
                    className="w-full px-3.5 py-3 text-[13px] text-slate-700 focus:outline-none resize-y min-h-[140px]"
                  />
                </div>
              </div>
              {editError && <p className="text-xs font-semibold text-rose-600">{editError}</p>}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button type="button" onClick={() => setEditId(null)} className="h-10 px-5 rounded-lg bg-slate-500 hover:bg-slate-600 text-white text-[13px] font-semibold transition">
                  Cancel
                </button>
                <button type="submit" className="h-10 px-6 rounded-lg bg-[#1d4a79] hover:bg-[#163a61] text-white text-[13px] font-semibold transition">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
