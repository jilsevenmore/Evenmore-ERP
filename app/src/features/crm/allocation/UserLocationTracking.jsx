import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  MapPin,
  Users,
  Wifi,
  WifiOff,
  Navigation,
  Briefcase,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Plus,
  Minus,
  Crosshair,
  Layers,
  X,
  Phone,
  MessageCircle,
  LocateFixed,
  Clock,
  Battery,
  Footprints,
  Timer,
  History,
  ChevronLeft,
  ChevronRight,
  Radio,
  CalendarDays,
} from 'lucide-react';

const DEPTS = ['Sales & Marketing', 'Operations', 'Support'];
const PER_PAGE_OPTIONS = [5, 10, 20];

const STAFF = [
  { id: 'EMP-01', name: 'Anuska Shah', short: 'Anuska', dept: 'Sales & Marketing', role: 'TCE', phone: '+91 98111 22334', status: 'Online', lastSeen: 'Just now', x: 38, y: 52, color: '#2563eb', loc: '4th Mission St, San Francisco, CA 94105, USA', dist: '0.02 km', worked: '10:24h', idle: '12m', atSite: 'At Client', battery: 78 },
  { id: 'EMP-02', name: 'Rahul Verma', short: 'Rahul', dept: 'Sales & Marketing', role: 'BDE', phone: '+91 98234 11223', status: 'Online', lastSeen: '2 min ago', x: 55, y: 38, color: '#7c3aed', loc: 'Market St, San Francisco, CA, USA', dist: '0.4 km', worked: '08:10h', idle: '05m', atSite: 'Travel', battery: 64 },
  { id: 'EMP-03', name: 'Priya Mehta', short: 'Priya', dept: 'Sales & Marketing', role: 'TCE', phone: '+91 98455 33445', status: 'Online', lastSeen: '1 min ago', x: 66, y: 55, color: '#0d9488', loc: 'Mission District, San Francisco, CA, USA', dist: '1.1 km', worked: '09:02h', idle: '20m', atSite: 'Office', battery: 82 },
  { id: 'EMP-04', name: 'David Patel', short: 'David', dept: 'Operations', role: 'ASM', phone: '+91 98777 88990', status: 'Online', lastSeen: '4 min ago', x: 28, y: 30, color: '#ea580c', loc: 'Richmond District, San Francisco, CA, USA', dist: '2.3 km', worked: '07:45h', idle: '08m', atSite: 'Travel', battery: 55 },
  { id: 'EMP-05', name: 'Sneha Iyer', short: 'Sneha', dept: 'Support', role: 'SSE', phone: '+91 98111 99887', status: 'Online', lastSeen: '6 min ago', x: 48, y: 68, color: '#db2777', loc: 'Bernal Heights, San Francisco, CA, USA', dist: '0.8 km', worked: '06:30h', idle: '15m', atSite: 'At Client', battery: 71 },
  { id: 'EMP-06', name: 'Amit Rao', short: 'Amit', dept: 'Operations', role: 'SSE', phone: '+91 97654 32109', status: 'Offline', lastSeen: '1 hour ago', x: 72, y: 30, color: '#64748b', loc: 'Downtown, San Francisco, CA, USA', dist: '3.5 km', worked: '05:12h', idle: '48m', atSite: 'Idle', battery: 32 },
  { id: 'EMP-07', name: 'Kavya Nair', short: 'Kavya', dept: 'Sales & Marketing', role: 'BDE', phone: '+91 96543 21098', status: 'Offline', lastSeen: '3 hours ago', x: 22, y: 62, color: '#64748b', loc: 'Sunset District, San Francisco, CA, USA', dist: '4.0 km', worked: '04:05h', idle: '62m', atSite: 'Idle', battery: 21 },
  { id: 'EMP-08', name: 'Vikram Singh', short: 'Vikram', dept: 'Support', role: 'TCE', phone: '+91 95432 10987', status: 'Offline', lastSeen: 'Yesterday', x: 60, y: 74, color: '#64748b', loc: 'Bayview, San Francisco, CA, USA', dist: '5.2 km', worked: '03:40h', idle: '90m', atSite: 'Off Duty', battery: 12 },
];

const ACTIVITY = [
  { time: '10:24 AM', title: 'At Client Location', sub: 'Met client at San Francisco', tone: '#2563eb' },
  { time: '01:02 AM', title: 'Travel', sub: 'Moving (28 km/h)', tone: '#7c3aed' },
  { time: '02:42 AM', title: 'Office', sub: 'Checked in at office', tone: '#0d9488' },
  { time: '01:45 PM', title: 'Idle', sub: 'No movement for 12 minutes', tone: '#f59e0b' },
];

function initials(name) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function downloadCsv(filename, rows) {
  const body = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function UserLocationTracking() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [status, setStatus] = useState('All');
  const [mapType, setMapType] = useState('map');
  const [zoom, setZoom] = useState(1);
  const [live, setLive] = useState(true);
  const [selectedId, setSelectedId] = useState('EMP-01');
  const [tab, setTab] = useState('live');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [checked, setChecked] = useState([]);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [date, setDate] = useState('2026-09-11');
  const [updatedAt, setUpdatedAt] = useState('11 Sep 2026, 10:30 AM');
  const [ping, setPing] = useState(0);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      setPing((p) => p + 1);
      setUpdatedAt(new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(t);
  }, [live]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return STAFF.filter((s) => {
      if (dept !== 'All' && s.dept !== dept) return false;
      if (status !== 'All' && s.status !== status) return false;
      if (!q) return true;
      return (s.name + ' ' + s.id + ' ' + s.phone).toLowerCase().includes(q);
    });
  }, [search, dept, status]);

  const online = STAFF.filter((s) => s.status === 'Online');
  const offline = STAFF.filter((s) => s.status !== 'Online');
  const selected = STAFF.find((s) => s.id === selectedId) || filtered[0] || STAFF[0];

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  useEffect(() => {
    setPage(1);
  }, [search, dept, status, perPage]);

  function toggleCheck(id) {
    setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  function exportExcel() {
    downloadCsv('user_locations.csv', [
      ['ID', 'Name', 'Department', 'Role', 'Phone', 'Status', 'Last Seen', 'Location'],
      ...filtered.map((s) => [s.id, s.name, s.dept, s.role, s.phone, s.status, s.lastSeen, s.loc]),
    ]);
  }

  function exportPdf() {
    const w = window.open('', '_blank', 'width=1000,height=700');
    if (!w) return;
    const rows = filtered.map((s) => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.dept}</td><td>${s.status}</td><td>${s.lastSeen}</td></tr>`).join('');
    w.document.write(`<!doctype html><html><head><title>User Locations</title><style>body{font-family:Arial;color:#172033;padding:24px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #cbd5e1;padding:7px;text-align:left}th{background:#e2e8f0}</style></head><body><h1>User Location Tracking</h1><table><thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Status</th><th>Last Seen</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    w.document.close();
    w.focus();
  }

  const dark = mapType === 'sat';

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Location Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track your team's live location, activity and working hours in real time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
            <CalendarDays size={14} className="text-slate-400" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="outline-none bg-transparent text-xs text-slate-700" />
          </label>
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${live ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            <Radio size={14} /> {live ? 'Live Tracking' : 'Start Live'}
          </button>
          <button
            type="button"
            onClick={() => setReportsOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <FileText size={14} /> Reports
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center shrink-0"><Users size={19} /></span>
          <span><span className="block text-[11px] text-slate-500 font-medium">Total Employees</span><strong className="text-xl font-bold text-slate-900">{STAFF.length}</strong></span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><Wifi size={19} /></span>
          <span><span className="block text-[11px] text-slate-500 font-medium">Online Now</span><strong className="text-xl font-bold text-slate-900">{online.length}</strong> <em className="not-italic text-[10px] font-bold text-emerald-600">23.8%</em></span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 grid place-items-center shrink-0"><WifiOff size={19} /></span>
          <span><span className="block text-[11px] text-slate-500 font-medium">Offline</span><strong className="text-xl font-bold text-slate-900">{offline.length}</strong> <em className="not-italic text-[10px] font-bold text-slate-400">76.2%</em></span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center shrink-0"><Navigation size={19} /></span>
          <span><span className="block text-[11px] text-slate-500 font-medium">Tracked with Location</span><strong className="text-xl font-bold text-slate-900">{STAFF.length - 3}</strong></span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 grid place-items-center shrink-0"><Briefcase size={19} /></span>
          <span><span className="block text-[11px] text-slate-500 font-medium">Out of Office</span><strong className="text-xl font-bold text-slate-900">3</strong></span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID, mobile..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer">
          <option value="All">All Departments</option>
          {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer">
          <option value="All">All Status</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
        </select>
        <button type="button" onClick={() => { setSearch(''); setDept('All'); setStatus('All'); }} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">Reset</button>
        <button type="button" onClick={() => setPing((p) => p + 1)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <RefreshCw size={13} /> Auto Refresh
        </button>
        <button type="button" onClick={exportExcel} className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition">
          <FileSpreadsheet size={13} /> Excel
        </button>
        <button type="button" onClick={exportPdf} className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition">
          <FileText size={13} /> PDF
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} /> Live Employee Locations</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Real-time tracking. Last updated: {updatedAt}</p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-[11px] font-bold">
                <button type="button" onClick={() => setMapType('map')} className={`px-3 py-1 rounded-md transition ${mapType === 'map' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Map</button>
                <button type="button" onClick={() => setMapType('sat')} className={`px-3 py-1 rounded-md transition ${mapType === 'sat' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Satellite</button>
              </div>
            </div>
            <div className={`relative overflow-hidden ${dark ? 'bg-[#1e293b]' : 'bg-[#dcebf7]'}`} style={{ height: 380 }}>
              <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
                <rect x="0" y="0" width="800" height="400" fill={dark ? '#1e293b' : '#cfe3f5'} />
                <path d="M40,90 Q120,40 220,70 T380,60 T520,90 T700,60 L760,90 L740,180 L620,220 L560,300 L430,340 L300,320 L180,340 L80,280 L30,190 Z" fill={dark ? '#334155' : '#d9e9d4'} />
                <path d="M120,140 Q200,120 280,150 T420,170 T600,160 L640,200 L560,260 L400,280 L240,260 L140,220 Z" fill={dark ? '#3f4f63' : '#c8dfc2'} />
                <path d="M480,240 Q580,220 660,260 T700,330 L560,360 L480,320 Z" fill={dark ? '#334155' : '#d9e9d4'} />
                {Array.from({ length: 9 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="400" stroke={dark ? '#2b3a4f' : '#ffffff'} strokeOpacity="0.5" strokeWidth="1" />
                ))}
                {Array.from({ length: 5 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} stroke={dark ? '#2b3a4f' : '#ffffff'} strokeOpacity="0.5" strokeWidth="1" />
                ))}
              </svg>
              <div className="absolute inset-0 transition-transform" style={{ transform: `scale(${zoom})` }}>
                {filtered.map((s, i) => (
                  <button
                    key={s.id + ping}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-full group"
                    style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  >
                    <span className={`flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full border text-[10px] font-bold shadow-sm whitespace-nowrap ${selectedId === s.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}>
                      <span className="w-5 h-5 rounded-full grid place-items-center text-[8px] font-bold text-white" style={{ background: s.color }}>{initials(s.name)}</span>
                      {s.short}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 bg-white/80 rounded px-1">{i + 1} min ago</span>
                    <span className={`w-0 h-0 border-l-[7px] border-r-[7px] border-t-[10px] border-l-transparent border-r-transparent ${s.status === 'Online' ? 'border-t-emerald-500' : 'border-t-slate-400'}`} />
                  </button>
                ))}
              </div>
              <div className="absolute left-3 top-3 flex flex-col gap-1">
                <button type="button" onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(1)))} className="w-8 h-8 grid place-items-center bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:bg-slate-50" aria-label="Zoom in"><Plus size={15} /></button>
                <button type="button" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} className="w-8 h-8 grid place-items-center bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:bg-slate-50" aria-label="Zoom out"><Minus size={15} /></button>
              </div>
              <button type="button" onClick={() => setZoom(1)} className="absolute left-3 bottom-3 w-8 h-8 grid place-items-center bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:bg-slate-50" aria-label="Reset view"><Crosshair size={15} /></button>
              <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white/85 rounded-md px-2 py-1 border border-slate-200"><Layers size={11} /> {filtered.length} markers</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-900">All Users ({filtered.length})</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-2.5 w-8"><input type="checkbox" checked={pageItems.length > 0 && pageItems.every((t) => checked.includes(t.id))} onChange={() => { const ids = pageItems.map((t) => t.id); setChecked((c) => pageItems.every((t) => c.includes(t.id)) ? c.filter((x) => !ids.includes(x)) : [...new Set([...c, ...ids])]); }} className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer" /></th>
                    <th className="px-2 py-2.5">#</th>
                    <th className="px-2 py-2.5">Employee</th>
                    <th className="px-2 py-2.5">Department</th>
                    <th className="px-2 py-2.5">Contact</th>
                    <th className="px-2 py-2.5">Status</th>
                    <th className="px-2 py-2.5">Last Seen</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageItems.map((s, i) => (
                    <tr key={s.id} onClick={() => setSelectedId(s.id)} className={`cursor-pointer transition ${selectedId === s.id ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'}`}>
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={checked.includes(s.id)} onChange={() => toggleCheck(s.id)} className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer" /></td>
                      <td className="px-2 py-2.5 text-slate-400">{(safePage - 1) * perPage + i + 1}</td>
                      <td className="px-2 py-2.5">
                        <span className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold text-white shrink-0" style={{ background: s.color }}>{initials(s.name)}</span>
                          <span><strong className="block text-slate-800 leading-tight">{s.name}</strong><span className="block text-[10px] text-slate-400 font-mono">{s.id}</span></span>
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-slate-500">{s.dept}<span className="block text-[10px] text-slate-400">{s.role}</span></td>
                      <td className="px-2 py-2.5 text-slate-500 font-mono text-[11px]">{s.phone}</td>
                      <td className="px-2 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.status === 'Online' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-500 border-rose-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'Online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />{s.status}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-slate-400 text-[11px]">{s.lastSeen}</td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <span className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => setSelectedId(s.id)} title="Locate" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><LocateFixed size={14} /></button>
                          <button type="button" title="Call" className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><Phone size={14} /></button>
                          <button type="button" title="Message" className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><MessageCircle size={14} /></button>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No employees match the filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-500 pr-20 sm:pr-24">
              <span>Showing {(safePage - 1) * perPage + 1} to {Math.min(safePage * perPage, filtered.length)} of {filtered.length} users</span>
              <span className="flex items-center gap-1.5">
                <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"><ChevronLeft size={13} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} type="button" onClick={() => setPage(p)} className={`min-w-6 h-6 px-1.5 rounded-md border text-[11px] font-bold cursor-pointer ${p === safePage ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{p}</button>
                ))}
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"><ChevronRight size={13} /></button>
                <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="px-1.5 py-1 border border-slate-200 rounded-md text-[11px] cursor-pointer">
                  {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n} per page</option>)}
                </select>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden h-fit xl:sticky xl:top-4">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
            <span className="w-9 h-9 rounded-full grid place-items-center text-xs font-bold text-white shrink-0" style={{ background: selected.color }}>{initials(selected.name)}</span>
            <div className="flex-1 min-w-0">
              <strong className="block text-sm text-slate-900 truncate">{selected.name}</strong>
              <span className="block text-[10px] text-slate-400 truncate">{selected.dept} | {selected.role}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${selected.status === 'Online' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{selected.status}</span>
            <button type="button" onClick={() => setSelectedId(filtered[0]?.id || 'EMP-01')} className="text-slate-300 hover:text-slate-500"><X size={15} /></button>
          </div>
          <div className="flex gap-1 px-4 pt-3 text-[11px] font-bold">
            {[['live', 'Live Info'], ['history', 'Activity History'], ['timeline', 'Timeline']].map(([k, label]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg transition ${tab === k ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>{label}</button>
            ))}
          </div>
          <div className="p-4">
            {tab === 'live' && (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5"><MapPin size={13} className="text-blue-500" /> Current Location</p>
                  <p className="text-[11px] text-slate-500 mt-1">{selected.loc}</p>
                  <button type="button" className="text-[11px] font-bold text-blue-600 mt-1">View on Map</button>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-center">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5"><Footprints size={15} className="mx-auto text-slate-400" /><p className="text-[10px] text-slate-400 mt-1">Distance</p><strong className="text-xs text-slate-800">{selected.dist}</strong></div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5"><Clock size={15} className="mx-auto text-slate-400" /><p className="text-[10px] text-slate-400 mt-1">Last Update</p><strong className="text-xs text-slate-800">{selected.lastSeen}</strong></div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5"><Timer size={15} className="mx-auto text-slate-400" /><p className="text-[10px] text-slate-400 mt-1">Worked Time</p><strong className="text-xs text-slate-800">{selected.worked}</strong></div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5"><History size={15} className="mx-auto text-slate-400" /><p className="text-[10px] text-slate-400 mt-1">Idle Time</p><strong className="text-xs text-slate-800">{selected.idle}</strong></div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                  <div className="rounded-xl border border-slate-200 p-2.5"><p className="text-slate-400 text-[10px]">Location Status</p><strong className="text-emerald-600 flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{selected.atSite}</strong></div>
                  <div className="rounded-xl border border-slate-200 p-2.5"><p className="text-slate-400 text-[10px]">Battery</p><strong className="text-slate-800 flex items-center gap-1 mt-0.5"><Battery size={13} className="text-emerald-500" />{selected.battery}%</strong></div>
                </div>
              </div>
            )}
            {tab !== 'live' && (
              <div className="space-y-0">
                <p className="text-[11px] font-bold text-slate-500 mb-2">Today's Activity</p>
                {ACTIVITY.map((a) => (
                  <div key={a.title} className="flex gap-2.5 pb-3.5 relative">
                    <span className="flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.tone }} />
                      <span className="w-px flex-1 bg-slate-200" />
                    </span>
                    <div className="flex-1 flex items-start justify-between gap-2">
                      <div><strong className="block text-[11px] text-slate-800">{a.title}</strong><span className="block text-[10px] text-slate-400">{a.sub}</span></div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setTab('history')} className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">View Full History</button>
          </div>
        </div>
      </div>

      {reportsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="presentation" onMouseDown={() => setReportsOpen(false)}>
          <div onMouseDown={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Tracking Report — {date}</h2>
              <button type="button" onClick={() => setReportsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-2.5 text-xs">
              <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2"><span className="text-slate-500">Total employees</span><strong>{STAFF.length}</strong></div>
              <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2"><span className="text-slate-500">Online</span><strong className="text-emerald-600">{online.length}</strong></div>
              <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2"><span className="text-slate-500">Offline</span><strong className="text-slate-500">{offline.length}</strong></div>
              {DEPTS.map((d) => (
                <div key={d} className="flex justify-between bg-slate-50 rounded-lg px-3 py-2"><span className="text-slate-500">{d}</span><strong>{STAFF.filter((s) => s.dept === d).length}</strong></div>
              ))}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3.5 bg-slate-50/70 border-t border-slate-100">
              <button type="button" onClick={exportExcel} className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">Excel</button>
              <button type="button" onClick={() => setReportsOpen(false)} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
