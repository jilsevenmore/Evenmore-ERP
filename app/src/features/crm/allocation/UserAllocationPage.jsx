import React, { useState } from 'react';
import { Users, UserPlus, Search, CheckCircle2, Award, Clock, ArrowUpRight, ShieldCheck, Mail, Phone, MapPin, ListChecks } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import UserLocationTracking from './UserLocationTracking';

export default function UserAllocationPage() {
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: 'David Patel',
      role: 'Senior Sales Account Manager',
      email: 'david@evenmore.io',
      phone: '+91 98234 11223',
      leadsAssigned: 28,
      dealsClosed: 14,
      conversionRate: '50.0%',
      activePipeline: 485000,
      avatar: 'https://i.pravatar.cc/160?img=68',
      status: 'Online',
    },
    {
      id: 2,
      name: 'Priya Mehta',
      role: 'Enterprise Accounts Executive',
      email: 'priya@evenmore.io',
      phone: '+91 98455 33445',
      leadsAssigned: 32,
      dealsClosed: 18,
      conversionRate: '56.2%',
      activePipeline: 620000,
      avatar: 'https://i.pravatar.cc/160?img=47',
      status: 'In Meeting',
    },
    {
      id: 3,
      name: 'Rohit Sharma',
      role: 'Technical Pre-Sales Specialist',
      email: 'rohit@evenmore.io',
      phone: '+91 98777 88990',
      leadsAssigned: 19,
      dealsClosed: 9,
      conversionRate: '47.3%',
      activePipeline: 310000,
      avatar: 'https://i.pravatar.cc/160?img=15',
      status: 'Online',
    },
    {
      id: 4,
      name: 'Anuska Shah',
      role: 'Customer Success & Inbound Lead Rep',
      email: 'anuska@evenmore.io',
      phone: '+91 98111 22334',
      leadsAssigned: 42,
      dealsClosed: 16,
      conversionRate: '38.0%',
      activePipeline: 240000,
      avatar: 'https://i.pravatar.cc/160?img=38',
      status: 'Offline',
    },
  ]);

  const [search, setSearch] = useState('');
  const [view, setView] = useState('tracking');

  const filtered = teamMembers.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Tracking"
        subtitle="Sales representative capacity, lead assignment rules, and workload metrics"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-bold">
              <button type="button" onClick={() => setView('allocation')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${view === 'allocation' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}>
                <ListChecks size={13} /> Allocation
              </button>
              <button type="button" onClick={() => setView('tracking')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${view === 'tracking' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'}`}>
                <MapPin size={13} /> Live Tracking
              </button>
            </div>
            {view === 'allocation' && (
              <button type="button" className="btn-primary btn-sm flex items-center gap-1.5">
                <UserPlus size={14} /> Allocate Representative
              </button>
            )}
          </div>
        }
      />

      {view === 'tracking' ? (
        <UserLocationTracking />
      ) : (
      <>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-badge bg-blue-50 text-blue-600 dark:bg-blue-900/30">
            <Users size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-num">{teamMembers.length}</span>
            <span className="stat-label">Active Representatives</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-badge bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-num">121</span>
            <span className="stat-label">Total Allocated Leads</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-badge bg-amber-50 text-amber-600 dark:bg-amber-900/30">
            <Award size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-num">48.2%</span>
            <span className="stat-label">Avg. Conversion Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-badge bg-purple-50 text-purple-600 dark:bg-purple-900/30">
            <ArrowUpRight size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-num">Rs. 16.5L</span>
            <span className="stat-label">Allocated Pipeline</span>
          </div>
        </div>
      </div>

      {/* Team Roster & Allocation Table */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-bold text-sm">Representative Workload & Performance</h3>
          <label className="search-bar" style={{ width: 240, height: 32 }}>
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search representative..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs"
            />
          </label>
        </div>

        <div className="table-scroll">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th>Representative</th>
                <th>Role & Title</th>
                <th>Contact Details</th>
                <th>Assigned Leads</th>
                <th>Deals Closed</th>
                <th>Conversion Rate</th>
                <th>Active Pipeline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover shadow-xs" />
                      <div>
                        <strong className="font-bold text-slate-800 dark:text-slate-200 block">{m.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-600 dark:text-slate-300 font-medium">{m.role}</td>
                  <td>
                    <div className="space-y-0.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Mail size={11} /> {m.email}</span>
                      <span className="flex items-center gap-1"><Phone size={11} /> {m.phone}</span>
                    </div>
                  </td>
                  <td className="font-bold font-mono text-center">{m.leadsAssigned}</td>
                  <td className="font-bold font-mono text-center text-emerald-600">{m.dealsClosed}</td>
                  <td className="font-bold font-mono text-center text-blue-600">{m.conversionRate}</td>
                  <td className="font-bold font-mono">Rs. {m.activePipeline.toLocaleString('en-IN')}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'Online'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : m.status === 'In Meeting'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
