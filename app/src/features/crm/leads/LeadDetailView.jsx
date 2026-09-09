import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useERP } from '../../../context/ERPContext';
import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileStack,
  Info,
  ListChecks,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  Eye,
  Send,
  UserCheck,
  Building2,
  Paperclip,
  Share2,
  MoreVertical,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Clock,
  Check,
  CheckSquare,
  Square,
  FileText,
  Truck,
  Receipt,
  Download,
  Upload,
  Globe,
  Tag,
  Megaphone,
  User,
} from 'lucide-react';
import LeadAvatar from './LeadAvatar';

const DETAIL_TABS = [
  'General',
  'Users | Products',
  'Sources & Emails',
  'Discussion & Notes',
  'Files',
  'Tasks',
  'Calls',
  'Estimates',
  'Delivery Challans',
  'Activity',
];

function formatAmount(value) {
  return `Rs. ${(value || 0).toLocaleString('en-IN')}`;
}

// ── 1. Sources & Emails Tab (Screenshot Focus) ────────────────
function SourcesAndEmailsTab({ lead }) {
  const [sources, setSources] = useState([
    {
      id: 1,
      source: 'Website',
      sourceType: 'website',
      details: 'Contact Form (Homepage)',
      date: '27/08/2026 01:42 PM',
      createdBy: 'David Patel',
      avatar: 'https://i.pravatar.cc/160?img=68',
      color: '#10b981',
      icon: Globe,
    },
    {
      id: 2,
      source: 'Referral',
      sourceType: 'referral',
      details: 'Recommended by Priya Mehta',
      date: '25/08/2026 11:20 AM',
      createdBy: 'Priya Mehta',
      avatar: 'https://i.pravatar.cc/160?img=47',
      color: '#f59e0b',
      icon: User,
    },
    {
      id: 3,
      source: 'Advertisement',
      sourceType: 'ad',
      details: 'Instagram Ads',
      date: '20/08/2026 05:30 PM',
      createdBy: 'Rohit Sharma',
      avatar: 'https://i.pravatar.cc/160?img=15',
      color: '#ec4899',
      icon: Megaphone,
    },
  ]);

  const [emails, setEmails] = useState([
    {
      id: 1,
      subject: 'Product Inquiry',
      date: '27/08/2026 01:45 PM',
      person: 'Chirag Hirapara',
      avatar: 'https://i.pravatar.cc/160?img=60',
      status: 'Received',
      statusColor: 'slate',
    },
    {
      id: 2,
      subject: 'Follow Up - Call Scheduled',
      date: '27/08/2026 03:20 PM',
      person: 'David Patel',
      avatar: 'https://i.pravatar.cc/160?img=68',
      status: 'Sent',
      statusColor: 'green',
    },
    {
      id: 3,
      subject: 'Quotation Shared',
      date: '26/08/2026 11:10 AM',
      person: 'Priya Mehta',
      avatar: 'https://i.pravatar.cc/160?img=47',
      status: 'Sent',
      statusColor: 'green',
    },
    {
      id: 4,
      subject: 'Re: Quotation',
      date: '26/08/2026 02:35 PM',
      person: 'Chirag Hirapara',
      avatar: 'https://i.pravatar.cc/160?img=60',
      status: 'Received',
      statusColor: 'slate',
    },
    {
      id: 5,
      subject: 'Final Discussion',
      date: '25/08/2026 04:12 PM',
      person: 'Rohit Sharma',
      avatar: 'https://i.pravatar.cc/160?img=15',
      status: 'Sent',
      statusColor: 'green',
    },
  ]);

  const [timeline, setTimeline] = useState([
    {
      id: 1,
      type: 'sent',
      title: 'Quotation Shared',
      preview: 'Hi Chirag, Please find the attached quotation for the Endoscopy Machine. Let me know if you have any questions.',
      date: '26/08/2026 11:10 AM',
      author: 'Priya Mehta',
      dotColor: '#10b981',
    },
    {
      id: 2,
      type: 'received',
      title: 'Re: Quotation',
      preview: 'Thanks for the quotation. Looks good. I would like to discuss the payment terms.',
      date: '26/08/2026 02:35 PM',
      author: 'Chirag Hirapara',
      dotColor: '#64748b',
    },
    {
      id: 3,
      type: 'sent',
      title: 'Follow Up - Call Scheduled',
      preview: 'Hi Chirag, As discussed, we have scheduled a call tomorrow at 11 AM to finalize the order.',
      date: '27/08/2026 03:20 PM',
      author: 'David Patel',
      dotColor: '#10b981',
    },
  ]);

  const [showAddSource, setShowAddSource] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [newSource, setNewSource] = useState({ source: 'Website', details: '' });
  const [newEmail, setNewEmail] = useState({ subject: '', message: '' });

  const handleAddSource = (e) => {
    e.preventDefault();
    if (!newSource.details) return;
    const added = {
      id: Date.now(),
      source: newSource.source,
      sourceType: newSource.source.toLowerCase(),
      details: newSource.details,
      date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdBy: 'David Patel',
      avatar: 'https://i.pravatar.cc/160?img=68',
      color: '#1f6bff',
      icon: Globe,
    };
    setSources([added, ...sources]);
    setNewSource({ source: 'Website', details: '' });
    setShowAddSource(false);
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!newEmail.subject) return;
    const now = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const addedEmail = {
      id: Date.now(),
      subject: newEmail.subject,
      date: now,
      person: 'David Patel',
      avatar: 'https://i.pravatar.cc/160?img=68',
      status: 'Sent',
      statusColor: 'green',
    };
    const addedTimeline = {
      id: Date.now(),
      type: 'sent',
      title: newEmail.subject,
      preview: newEmail.message || 'Direct email communication with client representative.',
      date: now,
      author: 'David Patel',
      dotColor: '#10b981',
    };
    setEmails([addedEmail, ...emails]);
    setTimeline([addedTimeline, ...timeline]);
    setNewEmail({ subject: '', message: '' });
    setShowSendEmail(false);
  };

  const deleteSource = (id) => setSources(sources.filter((s) => s.id !== id));
  const deleteEmail = (id) => setEmails(emails.filter((e) => e.id !== id));

  return (
    <div className="space-y-4">
      {/* 2-Column Grid for Lead Sources & Emails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Lead Sources */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-bold text-sm">Lead Sources ({sources.length})</h3>
            <button
              type="button"
              onClick={() => setShowAddSource(!showAddSource)}
              className="btn-primary btn-sm flex items-center gap-1.5"
            >
              <Plus size={13} strokeWidth={2.4} /> Add Source
            </button>
          </div>

          {showAddSource && (
            <form onSubmit={handleAddSource} className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs">Source Channel</label>
                  <select
                    value={newSource.source}
                    onChange={(e) => setNewSource({ ...newSource, source: e.target.value })}
                    className="form-select text-xs"
                  >
                    <option value="Website">Website Form</option>
                    <option value="Referral">Client Referral</option>
                    <option value="Advertisement">Social Ads</option>
                    <option value="Cold Call">Direct Inbound Call</option>
                    <option value="Trade Fair">Trade Expo</option>
                  </select>
                </div>
                <div>
                  <label className="form-label text-xs">Specific Details / Notes</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inbound enquiry from landing page"
                    value={newSource.details}
                    onChange={(e) => setNewSource({ ...newSource, details: e.target.value })}
                    className="form-input text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddSource(false)} className="btn-ghost btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm">
                  Save Source
                </button>
              </div>
            </form>
          )}

          <div className="table-scroll">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Source</th>
                  <th>Details</th>
                  <th>Date</th>
                  <th>Created By</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s, idx) => {
                  const Icon = s.icon || Globe;
                  return (
                    <tr key={s.id}>
                      <td className="text-slate-400 font-mono">{idx + 1}</td>
                      <td>
                        <div className="inline-flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
                            style={{ background: s.color }}
                          >
                            <Icon size={12} />
                          </div>
                          <span className="font-semibold">{s.source}</span>
                        </div>
                      </td>
                      <td className="text-slate-600 dark:text-slate-300 font-medium">{s.details}</td>
                      <td className="text-slate-400 font-mono text-[11px] whitespace-nowrap">{s.date}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <img src={s.avatar} alt={s.createdBy} className="w-5 h-5 rounded-full object-cover" />
                          <span className="text-xs font-medium">{s.createdBy}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            className="p-1 rounded text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSource(s.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Emails */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-bold text-sm">Emails ({emails.length})</h3>
            <button
              type="button"
              onClick={() => setShowSendEmail(!showSendEmail)}
              className="btn-primary btn-sm flex items-center gap-1.5"
            >
              <Plus size={13} strokeWidth={2.4} /> Send Email
            </button>
          </div>

          {showSendEmail && (
            <form onSubmit={handleSendEmail} className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="form-label text-xs">Email Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Proposal Discussion & Quotation"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
              <div>
                <label className="form-label text-xs">Message Body</label>
                <textarea
                  rows={2}
                  placeholder="Enter message content..."
                  value={newEmail.message}
                  onChange={(e) => setNewEmail({ ...newEmail, message: e.target.value })}
                  className="form-textarea text-xs resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSendEmail(false)} className="btn-ghost btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm flex items-center gap-1">
                  <Send size={12} /> Send Email
                </button>
              </div>
            </form>
          )}

          <div className="table-scroll">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Subject</th>
                  <th>Date & Time</th>
                  <th>Sent/Received By</th>
                  <th>Status</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((e, idx) => (
                  <tr key={e.id}>
                    <td className="text-slate-400 font-mono">{idx + 1}</td>
                    <td>
                      <div className="inline-flex items-center gap-2">
                        <Mail size={13} className="text-blue-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{e.subject}</span>
                      </div>
                    </td>
                    <td className="text-slate-400 font-mono text-[11px] whitespace-nowrap">{e.date}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <img src={e.avatar} alt={e.person} className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-xs font-medium">{e.person}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.status === 'Sent'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          className="p-1 rounded text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="View Message"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEmail(e.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Card: Email Activity Timeline */}
      <div className="card p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Email Activity Timeline</h3>
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
          {timeline.map((item) => (
            <div key={item.id} className="relative flex items-start justify-between gap-4">
              <span
                className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center"
                style={{ background: item.dotColor }}
              />
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.type === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Email {item.type}
                  </span>
                  <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold">{item.title}</strong>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.preview}</p>
              </div>
              <div className="text-right shrink-0">
                <time className="text-[11px] text-slate-400 font-mono block">{item.date}</time>
                <span className="text-[11px] text-slate-500 font-medium">by {item.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 2. General Tab ────────────────────────────────────────────
function GeneralTab({ lead }) {
  const infoRows = [
    ['Company', lead.company || 'Hirapara Industries'],
    ['First Name', (lead.name || 'Chirag').split(' ')[0]],
    ['Last Name', (lead.name || 'Hirapara').split(' ')[1] || ''],
    ['Title', lead.jobTitle || 'Managing Director'],
    ['Email', lead.email || 'chirag@hirapara.com'],
    ['Phone', `+91 ${lead.phone || '98765 43210'}`],
    ['Mobile', `+91 ${lead.phone || '98765 43210'}`],
    ['Lead Source', lead.source || 'Website'],
    ['Lead Status', lead.status || 'Qualified'],
    ['Industry', lead.industry || 'Manufacturing & Electronics'],
    ['Annual Revenue', formatAmount(lead.amount || 185000)],
    ['Website', `www.${(lead.company || 'hirapara').toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`],
  ];

  const addressRows = [
    ['Address', `123, GIDC Industrial Estate, Ring Road`],
    ['City', lead.city || 'Surat'],
    ['State', lead.state || 'Gujarat'],
    ['Country', lead.country || 'India'],
    ['Zip Code', '395006'],
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Lead Information */}
      <div className="card p-4 space-y-3">
        <h3 className="font-bold text-sm border-b border-slate-100 pb-2">Lead Information</h3>
        <div className="space-y-2 text-xs">
          {infoRows.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-400">{label}</span>
              <strong className="text-slate-700 dark:text-slate-200 font-semibold">{val}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Address Information & Map */}
      <div className="card p-4 space-y-3">
        <h3 className="font-bold text-sm border-b border-slate-100 pb-2">Address Information</h3>
        <div className="space-y-2 text-xs">
          {addressRows.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-400">{label}</span>
              <strong className="text-slate-700 dark:text-slate-200 font-semibold">{val}</strong>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <div className="h-28 rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600 flex flex-col items-center justify-center gap-2 p-3 text-center">
            <MapPin size={24} className="text-blue-600 animate-bounce" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{lead.city || 'Surat'}, Gujarat</span>
            <span className="text-[10px] text-slate-500">Geo-coordinates: 21.1702° N, 72.8311° E</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm">Recent Activity</h3>
          <button type="button" className="text-xs text-blue-600 font-semibold hover:underline">
            + Log Activity
          </button>
        </div>
        <div className="space-y-3 text-xs">
          <div className="flex gap-2.5 items-start">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Stage upgraded to Qualified</p>
              <span className="text-[10px] text-slate-400">2 hours ago by David Patel</span>
            </div>
          </div>
          <div className="flex gap-2.5 items-start">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Quotation EST-2026-081 sent</p>
              <span className="text-[10px] text-slate-400">Yesterday at 11:10 AM by Priya Mehta</span>
            </div>
          </div>
          <div className="flex gap-2.5 items-start">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Technical requirements review</p>
              <span className="text-[10px] text-slate-400">2 days ago by Rohit Sharma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. Users | Products Tab ──────────────────────────────────
function UsersProductsTab({ lead }) {
  const users = [
    { id: 1, name: 'David Patel', role: 'Account Owner', email: 'david@evenmore.io', status: 'Active', avatar: 'https://i.pravatar.cc/160?img=68' },
    { id: 2, name: 'Priya Mehta', role: 'Sales Executive', email: 'priya@evenmore.io', status: 'Active', avatar: 'https://i.pravatar.cc/160?img=47' },
    { id: 3, name: 'Rohit Sharma', role: 'Technical Lead', email: 'rohit@evenmore.io', status: 'Active', avatar: 'https://i.pravatar.cc/160?img=15' },
  ];

  const products = [
    { id: 1, name: 'Endoscopy Vision Machine', sku: 'EVM-2026', price: 120000, qty: 1, status: 'Active' },
    { id: 2, name: 'High-Definition Surgical Monitor 4K', sku: 'MON-4K-01', price: 45000, qty: 1, status: 'Active' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Users Card */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-bold text-sm">Assigned Users ({users.length})</h3>
          <button type="button" className="btn-primary btn-sm flex items-center gap-1">
            <Plus size={13} /> Add User
          </button>
        </div>
        <div className="table-scroll">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="font-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-500">{u.email}</td>
                  <td className="font-medium">{u.role}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products Card */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-bold text-sm">Interested Products ({products.length})</h3>
          <button type="button" className="btn-primary btn-sm flex items-center gap-1">
            <Plus size={13} /> Add Product
          </button>
        </div>
        <div className="table-scroll">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.name}</td>
                  <td className="font-mono text-slate-400">{p.sku}</td>
                  <td className="font-bold">{formatAmount(p.price)}</td>
                  <td>{p.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 4. Main Lead Detail View ─────────────────────────────────
export default function LeadDetailView({ lead, onBackToLeads }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Sources & Emails');
  const { addCustomer, showToast } = useERP() || {};
  const [isConverted, setIsConverted] = useState(lead?.status === 'Converted');

  if (!lead) return null;

  // 8 Pastel Metric Cards exactly as in the reference screenshot
  const metrics = [
    { label: 'Products', value: lead.productsCount ?? 1, icon: ShoppingBag, color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Source', value: lead.sourcesCount ?? 0, icon: Globe, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Files', value: lead.filesCount ?? 0, icon: FileStack, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Open Tasks', value: lead.openTasksCount ?? 2, icon: ListChecks, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Calls', value: lead.callsCount ?? 0, icon: Phone, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Estimates', value: lead.estimatesCount ?? 0, icon: Receipt, color: '#06b6d4', bg: '#ecfeff' },
    { label: 'Delivery Challans', value: lead.deliveryChallansCount ?? 0, icon: Truck, color: '#f97316', bg: '#fff7ed' },
    { label: 'Sales Invoices', value: lead.salesInvoicesCount ?? 0, icon: FileText, color: '#a855f7', bg: '#faf5ff' },
  ];

  const handleConvert = () => {
    if (isConverted) {
      showToast?.('Lead is already converted to an active Customer.');
      return;
    }
    addCustomer?.({
      name: lead.company || lead.name,
      contactPerson: lead.name,
      email: lead.email,
      phone: `+91 ${lead.phone}`,
      balance: 0,
      status: 'Active',
    });
    setIsConverted(true);
    showToast?.(`Lead "${lead.name}" converted to Customer.`);
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
          <span>&gt;</span>
          <Link to="/crm/leads" className="text-blue-600 hover:underline">Leads</Link>
          <span>&gt;</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">{lead.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn-outline btn-sm flex items-center gap-1">
            <Pencil size={13} /> Edit
          </button>
          <button
            type="button"
            onClick={handleConvert}
            className={`btn-sm flex items-center gap-1 ${isConverted ? 'btn-primary' : 'btn-outline text-blue-600'}`}
          >
            <CheckCircle size={13} /> {isConverted ? 'Converted' : 'Convert'}
          </button>
          <button type="button" className="btn-outline btn-sm flex items-center gap-1">
            More <MoreVertical size={13} />
          </button>
        </div>
      </div>

      {/* Hero Lead Profile Summary Card */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Lead Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-slate-100 dark:ring-slate-700 shrink-0 shadow-md">
              <img
                src={lead.photo || 'https://i.pravatar.cc/160?img=60'}
                alt={lead.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{lead.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {isConverted ? 'Converted' : (lead.status || 'Qualified')}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{lead.company || 'Hirapara Industries'}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                <span className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /> +91 {lead.phone || '98765 43210'}</span>
                <span className="flex items-center gap-1.5"><Mail size={13} className="text-slate-400" /> {lead.email || 'chirag@hirapara.com'}</span>
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {lead.city || 'Surat'}, {lead.state || 'Gujarat'}, {lead.country || 'India'}</span>
              </div>
            </div>
          </div>

          {/* Right: Key Meta Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-3 md:pt-0 md:pl-6">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Lead Number</span>
              <strong className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{lead.leadNumber || 'L00000185'}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Source</span>
              <strong className="text-xs font-semibold text-slate-800 dark:text-slate-200">{lead.source || 'Website'}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Owner</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <img
                  src={lead.ownerAvatar || 'https://i.pravatar.cc/160?img=68'}
                  alt={lead.owner || 'David Patel'}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <strong className="text-xs font-semibold text-slate-800 dark:text-slate-200">{lead.owner || 'David Patel'}</strong>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Created On</span>
              <strong className="text-xs font-semibold text-slate-800 dark:text-slate-200">{lead.createdOn || '27/08/2026'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Pastel Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="card p-3 flex items-center gap-3 transition hover:shadow-md cursor-pointer"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: m.bg, color: m.color }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 leading-tight">
                <span className="text-[11px] font-medium text-slate-500 block truncate">{m.label}</span>
                <strong className="text-base font-extrabold text-slate-900 dark:text-slate-100">{m.value}</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-slate-700 flex items-center gap-1 overflow-x-auto text-xs font-bold scrollbar-none">
        {DETAIL_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 whitespace-nowrap transition cursor-pointer border-b-2 font-semibold ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      {activeTab === 'Sources & Emails' && <SourcesAndEmailsTab lead={lead} />}
      {activeTab === 'General' && <GeneralTab lead={lead} />}
      {activeTab === 'Users | Products' && <UsersProductsTab lead={lead} />}
      {activeTab !== 'Sources & Emails' && activeTab !== 'General' && activeTab !== 'Users | Products' && (
        <div className="card p-8 text-center space-y-2">
          <Info size={28} className="text-blue-500 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{activeTab} Details</h4>
          <p className="text-xs text-slate-400">
            Real-time synchronization for {activeTab.toLowerCase()} associated with {lead.name}.
          </p>
        </div>
      )}
    </div>
  );
}
