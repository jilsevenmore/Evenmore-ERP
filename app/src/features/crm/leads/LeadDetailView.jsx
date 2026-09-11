import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useERP } from '../../../context/ERPContext';
import { formatCurrency } from '../../../utils/currencyUtils';
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
  Printer,
  Download,
  Upload,
  Globe,
  Tag,
  Megaphone,
  User,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import LeadAvatar from './LeadAvatar';
import { exportToCSV } from '../../../services/exportUtils';
import { leads as seedLeads } from '../../../data/crm/mockLeads';
import { employeesMock } from '../../../data/hrms/mocks/data';

const DETAIL_TABS = [
  'General',
  'Users & Products',
  'Sources & Emails',
  'Discussion & Notes',
  'Files',
  'Tasks',
  'Calls',
  'Estimates',
  'Delivery Challans',
  'Activity',
];

const DETAIL_TAB_ICONS = {
  General: Info,
  'Users & Products': UserCheck,
  'Sources & Emails': Globe,
  'Discussion & Notes': Share2,
  Files: FileStack,
  Tasks: ListChecks,
  Calls: Phone,
  Estimates: Receipt,
  'Delivery Challans': Truck,
  Activity: Sparkles,
};

const LEADS_STORAGE_KEY = 'evenmore-crm-leads-v1';
const LEAD_DETAIL_STORAGE_KEY = 'evenmore-crm-lead-details-v1';

function readStoredJson(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function loadStoredLeadRows() {
  const stored = readStoredJson(LEADS_STORAGE_KEY, null);
  return Array.isArray(stored) && stored.length > 0 ? stored : seedLeads;
}

function loadStoredLeadDetails() {
  const stored = readStoredJson(LEAD_DETAIL_STORAGE_KEY, {});
  return stored && typeof stored === 'object' ? stored : {};
}

function updateStoredLead(leadId, updates) {
  if (!leadId || !updates || Object.keys(updates).length === 0) return false;
  const nextRows = loadStoredLeadRows().map((row) => (
    String(row.id) === String(leadId) ? { ...row, ...updates } : row
  ));
  return writeStoredJson(LEADS_STORAGE_KEY, nextRows);
}

function updateStoredLeadDetail(leadId, updates) {
  if (!leadId || !updates || Object.keys(updates).length === 0) return false;
  const current = loadStoredLeadDetails();
  const key = String(leadId);
  current[key] = { ...(current[key] || {}), ...updates };
  return writeStoredJson(LEAD_DETAIL_STORAGE_KEY, current);
}

function limitItems(items, count) {
  if (!Array.isArray(items)) return [];
  const normalizedCount = Number(count);
  if (!Number.isFinite(normalizedCount)) return items;
  if (normalizedCount <= 0) return [];
  return items.slice(0, normalizedCount);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function formatAmount(value) {
  const activeCurrency = localStorage.getItem('evenmore_currency') || 'USD ($)';
  return formatCurrency(value || 0, activeCurrency, { noDecimals: true });
}

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function statusClass(value) {
  return String(value || '').toLowerCase() === 'active' ? 'green' : 'amber';
}

function buildUsers() {
  return [
    { id: 1, initials: 'PP', name: 'Priya Patel', email: 'priya@company.com', role: 'Sales Executive', status: 'Active', bg: '#c084fc' },
    { id: 2, initials: 'JN', name: 'Jayesh Nair', email: 'jayesh@company.com', role: 'Pre Sales', status: 'Active', bg: '#ca8a04' },
    { id: 3, initials: 'CC', name: 'Chetan Chaudhari', email: 'chetan@company.com', role: 'Technical', status: 'Active', bg: '#3b82f6' },
    { id: 4, initials: 'AS', name: 'Anuska Shah', email: 'anuska@company.com', role: 'Support', status: 'Inactive', bg: '#0d9488' },
    { id: 5, initials: 'UF', name: 'Utsav Faldu', email: 'utsav@company.com', role: 'Manager', status: 'Active', bg: '#3b82f6' },
  ];
}

function buildProducts(lead) {
  const defaults = [
    { id: 1, name: 'Endoscopy Machine', sku: 'END-001', price: 'Rs. 1,20,000', qty: 1, status: 'Active', image: '' },
    { id: 2, name: 'Monitor 4K', sku: 'MON-004', price: 'Rs. 45,000', qty: 2, status: 'Active', image: '' },
    { id: 3, name: 'Surgical Kit', sku: 'SK-010', price: 'Rs. 25,000', qty: 1, status: 'Draft', image: '' },
  ];
  return limitItems(defaults, lead?.productsCount);
}

function buildLeadSources(lead) {
  const defaults = [
    {
      id: 1,
      source: lead?.source || 'Website',
      sourceType: String(lead?.source || 'Website').toLowerCase(),
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
  ];
  return limitItems(defaults, lead?.sourcesCount);
}

function buildLeadEmails() {
  return [
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
  ];
}

function buildLeadTimeline() {
  return [
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
  ];
}

function buildSentFiles(lead) {
  const company = lead?.company || 'Hirapara Industries';
  const owner = lead?.owner || 'David Patel';
  const defaults = [
    { id: `file-${lead?.id || 0}-1`, type: 'image', name: `${company} Front Desk.jpg`, size: '2.4 MB', sentOn: 'Aug 26, 2026', sentBy: owner, preview: 'https://images.unsplash.com/photo-1519494080410-f9aa8f52f12e?auto=format&fit=crop&w=900&q=80', downloadUrl: 'https://images.unsplash.com/photo-1519494080410-f9aa8f52f12e?auto=format&fit=crop&w=1600&q=90', description: 'Shared for location confirmation.' },
    { id: `file-${lead?.id || 0}-2`, type: 'document', name: `${company} Product Quotation.pdf`, size: '860 KB', sentOn: 'Aug 28, 2026', sentBy: owner, preview: '', downloadUrl: '', description: 'Final quotation document.' },
  ];
  return limitItems(defaults, lead?.filesCount);
}

function loadLeadDetailState(lead) {
  const stored = loadStoredLeadDetails()[String(lead?.id || '')] || {};
  return {
    users: Array.isArray(stored.users) ? stored.users : buildUsers(lead),
    products: Array.isArray(stored.products) ? stored.products : buildProducts(lead),
    sources: Array.isArray(stored.sources) ? stored.sources : buildLeadSources(lead),
    emails: Array.isArray(stored.emails) ? stored.emails : buildLeadEmails(),
    timeline: Array.isArray(stored.timeline) ? stored.timeline : buildLeadTimeline(),
    files: Array.isArray(stored.files) ? stored.files : buildSentFiles(lead),
  };
}

function buildDiscussionThreads(lead) {
  const assignedUsers = buildUsers(lead).slice(0, 4);
  const leadName = String(lead?.name || 'Lead').replace(' (Sample)', '');
  return [
    {
      id: `lead-${lead?.id || 0}`,
      kind: 'lead',
      name: leadName,
      subtitle: lead?.company,
      badge: lead?.status,
      time: 'Just now',
      note: `Lead ${leadName} needs a final follow-up.`,
      messages: [
        { id: `lead-${lead?.id || 0}-1`, side: 'in', sender: leadName, body: `Hi team, please share the quotation for ${lead?.company}.`, time: '10:30 AM' },
        { id: `lead-${lead?.id || 0}-2`, side: 'out', sender: 'You', body: 'Quotation draft is ready.', time: '10:42 AM' },
      ],
    },
    ...assignedUsers.map((user, index) => ({
      id: `user-${lead?.id || 0}-${user.id}`,
      kind: 'user',
      name: user.name,
      subtitle: user.role,
      badge: user.status,
      color: user.color,
      time: `${index + 1}:1${index} PM`,
      note: `${user.name} is assigned for support on this lead.`,
      messages: [
        { id: `user-${lead?.id || 0}-${user.id}-1`, side: 'in', sender: user.name, body: `Checked the requirement. Will highlight use cases in the next call.`, time: `${index + 1}:1${index} PM` },
      ],
    })),
  ];
}

function DiscussionAvatar({ thread, lead }) {
  if (thread?.kind === 'lead') {
    return <LeadAvatar lead={lead} className="discussion-avatar lead" />;
  }
  return (
    <span className="discussion-avatar discussion-avatar-badge" style={{ backgroundColor: thread?.color ?? '#2F6FED' }}>
      {getInitials(thread?.name)}
    </span>
  );
}

function formatNoteValue(currentValue, textarea, prefix, suffix = prefix, fallback = 'text') {
  const start = textarea?.selectionStart ?? currentValue.length;
  const end = textarea?.selectionEnd ?? currentValue.length;
  const selectedText = currentValue.slice(start, end);
  const insertValue = `${prefix}${selectedText || fallback}${suffix}`;
  const nextValue = `${currentValue.slice(0, start)}${insertValue}${currentValue.slice(end)}`;
  return {
    nextValue,
    selectionStart: start + prefix.length,
    selectionEnd: start + prefix.length + (selectedText || fallback).length,
  };
}

function fieldRows(lead) {
  return [
    ['Company', lead.company || 'Hirapara Industries'],
    ['Title', lead.jobTitle || 'Managing Director'],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Amount', formatAmount(lead.amount)],
  ];
}

function addressRows(lead) {
  return [
    ['City', lead.city],
    ['State', lead.state],
    ['Country', lead.country],
    ['Zip Code', `39${4200 + (lead.id || 0)}`],
  ];
}

function leadExportRows(lead) {
  return [
    ['Lead Name', lead.name],
    ['Company', lead.company],
    ['Title', lead.jobTitle],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Lead Source', lead.source],
    ['Lead Owner', lead.owner],
    ['Status', lead.status],
    ['Created On', lead.createdOn],
    ['City', lead.city],
    ['State', lead.state],
    ['Country', lead.country],
    ['Zip Code', `39${4200 + (lead.id || 0)}`],
    ['Amount', formatAmount(lead.amount)],
  ];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function downloadLeadAsExcel(lead) {
  const rows = leadExportRows(lead);
  const table = rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
  const workbook = `<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${table}</tbody></table>`;
  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${String(lead.name || 'lead').replace(/\s+/g, '_')}_details.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function printLeadAsPdf(lead) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  const rows = leadExportRows(lead).map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(lead.name)} - Lead Details</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:40px}h1{margin:0 0 8px;font-size:24px}p{color:#64748b;margin:0 0 24px}table{border-collapse:collapse;width:100%;max-width:700px}th,td{border:1px solid #dbe2ea;padding:10px;text-align:left;font-size:14px}th{background:#f1f5f9;width:35%}</style></head><body><h1>${escapeHtml(lead.name)}</h1><p>Lead Details</p><table>${rows}</table></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function metricCards(counts) {
  return [
    { label: 'Products', value: counts.products },
    { label: 'Sources', value: counts.sources },
    { label: 'Files', value: counts.files },
  ];
}

// ── 1. Sources & Emails Tab (Screenshot Focus) ────────────────
function SourcesAndEmailsTab({ lead, onCountsChange, onActivity }) {
  const initialState = useMemo(() => loadLeadDetailState(lead), [lead]);
  const [sources, setSources] = useState(() => initialState.sources);
  const [emails, setEmails] = useState(() => initialState.emails);
  const [timeline, setTimeline] = useState(() => initialState.timeline);

  const [showAddSource, setShowAddSource] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [newSource, setNewSource] = useState({ source: 'Website', details: '' });
  const [newEmail, setNewEmail] = useState({ subject: '', message: '' });
  const [recipients, setRecipients] = useState([lead.email].filter(Boolean));

  React.useEffect(() => {
    updateStoredLeadDetail(lead?.id, { sources, emails, timeline });
  }, [lead?.id, sources, emails, timeline]);

  React.useEffect(() => {
    onCountsChange?.({ sources: sources.length });
  }, [sources.length, onCountsChange]);

  function toggleRecipient(email) {
    setRecipients((current) => (current.includes(email) ? current.filter((r) => r !== email) : [...current, email]));
  }

  function addSource(event) {
    handleAddSource(event);
  }

  function sendEmail(event) {
    handleSendEmail(event);
  }

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
    setSources((current) => [added, ...current]);
    setNewSource({ source: 'Website', details: '' });
    setShowAddSource(false);
    onActivity?.(`Source "${added.source}" added`, '#10b981');
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
    setEmails((current) => [addedEmail, ...current]);
    setTimeline((current) => [addedTimeline, ...current]);
    setNewEmail({ subject: '', message: '' });
    setShowSendEmail(false);
    onActivity?.(`Email "${addedEmail.subject}" sent`, '#3b82f6');
  };

  const deleteSource = (id) => {
    const target = sources.find((s) => s.id === id);
    setSources((current) => current.filter((source) => source.id !== id));
    onActivity?.(`Source "${target?.source ?? 'entry'}" removed`, '#f59e0b');
  };
  const deleteEmail = (id) => {
    const target = emails.find((e) => e.id === id);
    setEmails((current) => current.filter((email) => email.id !== id));
    onActivity?.(`Email "${target?.subject ?? 'entry'}" deleted`, '#f59e0b');
  };

  // Graph compatibility alias: old codebase exposed SourcesEmailsTab; current UI uses SourcesAndEmailsTab.
  // Both names resolve to the same implementation so graph queries keep working.

  // Graph compatibility alias: old codebase exposed SourcesEmailsTab; current UI uses SourcesAndEmailsTab.
  // Both names resolve to the same implementation so graph queries keep working.

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

// ── Files Tab ───────────────────────────────────────────────
function FilesTab({ lead, onCountsChange, onActivity }) {
  const initialState = useMemo(() => loadLeadDetailState(lead), [lead]);
  const [files, setFiles] = useState(() => initialState.files);
  const [fileSearch, setFileSearch] = useState('');
  const [fileType, setFileType] = useState('All');
  const [viewFile, setViewFile] = useState(null);

  const visibleFiles = useMemo(() => files.filter((f) => {
    if (fileType !== 'All' && f.type !== fileType) return false;
    if (fileSearch && !f.name.toLowerCase().includes(fileSearch.toLowerCase())) return false;
    return true;
  }), [files, fileSearch, fileType]);

  React.useEffect(() => {
    updateStoredLeadDetail(lead?.id, { files });
    onCountsChange?.({ files: files.length });
  }, [lead?.id, files, files.length, onCountsChange]);

  async function handleUploadFiles(event) {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;
    const now = new Date().toLocaleDateString('en-GB');
    const uploaded = await Promise.all(selected.map(async (file) => {
      const imagePreview = file.type.startsWith('image/') ? await readFileAsDataUrl(file) : '';
      return {
        id: `file-upload-${Date.now()}-${file.name}`,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        sentOn: now,
        sentBy: lead?.owner || 'David Patel',
        preview: imagePreview,
        downloadUrl: imagePreview,
        description: 'Uploaded from Files tab.',
      };
    }));
    setFiles((current) => [...uploaded, ...current]);
    event.target.value = '';
    onActivity?.(`${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded`, '#8b5cf6');
  }

  function handleViewFile(file) {
    setViewFile(file);
  }

  function handleDownloadFile(file) {
    const url = file.downloadUrl || file.preview;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleRemoveFile(id) {
    const target = files.find((f) => f.id === id);
    setFiles((current) => current.filter((f) => f.id !== id));
    onActivity?.(`File "${target?.name ?? 'entry'}" removed`, '#f59e0b');
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-bold text-sm">Files ({files.length})</h3>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Search files..." value={fileSearch} onChange={(e) => setFileSearch(e.target.value)} className="form-input text-xs" style={{ width: 160 }} />
          <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="form-select text-xs">
            <option value="All">All</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
          </select>
          <label className="btn-primary btn-sm flex items-center gap-1 cursor-pointer">
            <Upload size={13} /> Upload
            <input type="file" multiple hidden onChange={handleUploadFiles} />
          </label>
        </div>
      </div>
      <div className="table-scroll">
        <table className="data-table text-xs">
          <thead><tr><th>Name</th><th>Size</th><th>Sent On</th><th>Sent By</th><th style={{ textAlign: 'center' }}>Action</th></tr></thead>
          <tbody>
            {visibleFiles.map((f) => (
              <tr key={f.id}>
                <td className="font-semibold">{f.name}</td>
                <td className="text-slate-500">{f.size}</td>
                <td className="text-slate-400">{f.sentOn}</td>
                <td>{f.sentBy}</td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button type="button" onClick={() => handleViewFile(f)} className="p-1 rounded text-blue-600 hover:bg-blue-50" title="View"><Eye size={13} /></button>
                    <button type="button" onClick={() => handleDownloadFile(f)} className="p-1 rounded text-emerald-600 hover:bg-emerald-50" title="Download"><Download size={13} /></button>
                    <button type="button" onClick={() => handleRemoveFile(f.id)} className="p-1 rounded text-rose-500 hover:bg-rose-50" title="Remove"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewFile && (
        <div className="modal-overlay" role="presentation" onClick={() => setViewFile(null)}>
          <div className="card p-4" style={{ maxWidth: 560, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold text-sm">{viewFile.name}</h4>
            <p className="text-xs text-slate-500">{viewFile.description}</p>
            {viewFile.preview && <img src={viewFile.preview} alt={viewFile.name} style={{ width: '100%', borderRadius: 8, marginTop: 8 }} />}
            <div className="flex justify-end gap-2" style={{ marginTop: 12 }}>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setViewFile(null)}>Close</button>
              <button type="button" className="btn-primary btn-sm" onClick={() => handleDownloadFile(viewFile)}>Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTab({ items }) {
  const entries = items ?? [];
  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Activity Log ({entries.length})</h3>
      {entries.length === 0 && (
        <p className="text-xs text-slate-400">No activity recorded for this lead yet.</p>
      )}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
        {entries.map((item) => (
          <div key={item.id} className="relative flex items-start justify-between gap-4">
            <span
              className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center"
              style={{ background: item.color || '#3b82f6' }}
            />
            <div className="space-y-1">
              <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold block">{item.title}</strong>
            </div>
            <div className="text-right shrink-0">
              <time className="text-[11px] text-slate-400 font-mono block">{item.time}</time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Discussion & Notes Tab ────────────────────────────────────
function DiscussionNotesTab({ lead, onActivity }) {
  const initialThreads = useMemo(() => buildDiscussionThreads(lead), [lead]);
  const [threads, setThreads] = useState(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreads[0]?.id ?? null);
  const [messageDraft, setMessageDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState([]);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? threads[0];

  function updateThreadMessages(threadId, updater) {
    setThreads((current) => current.map((t) => (t.id === threadId ? { ...t, messages: updater(t.messages) } : t)));
  }

  function appendSystemMessage(threadId, body) {
    updateThreadMessages(threadId, (messages) => [...messages, { id: `sys-${Date.now()}`, side: 'out', sender: 'System', body, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
  }

  function handleSendMessage(event) {
    event?.preventDefault();
    if (!messageDraft.trim() || !selectedThread) return;
    const body = messageDraft.trim();
    updateThreadMessages(selectedThread.id, (messages) => [...messages, { id: `msg-${Date.now()}`, side: 'out', sender: 'You', body, time: 'Now' }]);
    setMessageDraft('');
    onActivity?.('Message sent in discussion', '#3b82f6');
  }

  function handleCallAction() {
    if (!selectedThread) return;
    appendSystemMessage(selectedThread.id, `Call logged with ${selectedThread.name}.`);
    onActivity?.(`Call logged with ${selectedThread.name}`, '#3b82f6');
  }

  function handleMailAction() {
    if (!selectedThread) return;
    appendSystemMessage(selectedThread.id, `Email sent to ${selectedThread.name}.`);
    onActivity?.(`Email sent to ${selectedThread.name}`, '#3b82f6');
  }

  function handleUserAction() {
    if (!selectedThread) return;
    appendSystemMessage(selectedThread.id, `Mentioned ${selectedThread.name} in a note.`);
  }

  function handleSaveNote(event) {
    event?.preventDefault();
    if (!noteDraft.trim() || !selectedThread) return;
    appendSystemMessage(selectedThread.id, `Note: ${noteDraft.trim()}`);
    setNoteDraft('');
    setPendingAttachments([]);
    onActivity?.('Note saved in discussion', '#8b5cf6');
  }

  function handleAttachmentSelect(event) {
    const selected = Array.from(event.target.files || []).map((f) => ({ name: f.name, size: f.size }));
    setPendingAttachments((current) => [...current, ...selected]);
    event.target.value = '';
  }

  function removePendingAttachment(name) {
    setPendingAttachments((current) => current.filter((a) => a.name !== name));
  }

  function handleNoteFormatting(prefix, suffix) {
    setNoteDraft((current) => formatNoteValue(current, null, prefix, suffix).nextValue);
  }

  function applyNoteCommand(command) {
    if (command === 'bold') handleNoteFormatting('**');
    if (command === 'italic') handleNoteFormatting('*');
    if (command === 'call') handleCallAction();
    if (command === 'mail') handleMailAction();
  }

  if (!selectedThread) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-3 space-y-2">
        {threads.map((thread) => (
          <button key={thread.id} type="button" onClick={() => setSelectedThreadId(thread.id)} className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${thread.id === selectedThread.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
            <DiscussionAvatar thread={thread} lead={lead} />
            <span className="min-w-0"><strong className="block text-xs truncate">{thread.name}</strong><span className="block text-[11px] text-slate-400 truncate">{thread.note}</span></span>
          </button>
        ))}
      </div>
      <div className="card p-4 space-y-3 lg:col-span-2">
        <div className="space-y-2">
          {selectedThread.messages.map((m) => (
            <div key={m.id} className={`text-xs p-2 rounded-lg ${m.side === 'out' ? 'bg-blue-50 ml-8' : 'bg-slate-100 mr-8'}`}>
              <strong>{m.sender}</strong><p>{m.body}</p><span className="text-[10px] text-slate-400">{m.time}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input type="text" value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)} placeholder="Write a message..." className="form-input text-xs flex-1" />
          <button type="submit" className="btn-primary btn-sm flex items-center gap-1"><Send size={12} /> Send</button>
        </form>
        <div className="flex gap-1 flex-wrap">
          <button type="button" onClick={handleCallAction} className="btn-ghost btn-sm">Log Call</button>
          <button type="button" onClick={handleMailAction} className="btn-ghost btn-sm">Log Email</button>
          <button type="button" onClick={handleUserAction} className="btn-ghost btn-sm">Mention</button>
          <button type="button" onClick={() => applyNoteCommand('bold')} className="btn-ghost btn-sm">Bold</button>
          <button type="button" onClick={() => applyNoteCommand('italic')} className="btn-ghost btn-sm">Italic</button>
        </div>
        <form onSubmit={handleSaveNote} className="space-y-2">
          <textarea rows={2} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveNote(e); }} placeholder="Write a note..." className="form-textarea text-xs w-full" />
          {pendingAttachments.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {pendingAttachments.map((a) => (
                <span key={a.name} className="text-[11px] bg-slate-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Paperclip size={11} /> {a.name}
                  <button type="button" onClick={() => removePendingAttachment(a.name)} aria-label={`Remove ${a.name}`}>×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center">
            <label className="btn-ghost btn-sm cursor-pointer flex items-center gap-1"><Paperclip size={12} /> Attach<input type="file" multiple hidden onChange={handleAttachmentSelect} /></label>
            <button type="submit" className="btn-outline btn-sm">Save Note</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 2. General Tab ────────────────────────────────────────────
function GeneralTab({ lead }) {
  const infoRows = [
    ['Company', lead.company || 'Hirapara Industries'],
    ['First Name', (lead.name || 'Chirag').split(' ')[0]],
    ['Last Name', (lead.name || 'Hirapara').split(' ').slice(1).join(' ') || 'Hirapara'],
    ['Title', lead.jobTitle || 'Managing Director'],
    ['Email', lead.email || 'chirag@hirapara.com'],
    ['Phone', `+91 ${lead.phone || '98765 43210'}`],
    ['Mobile', `+91 ${lead.phone || '98765 43210'}`],
    ['Lead Source', lead.source || 'Website'],
    ['Lead Status', lead.status || 'Qualified'],
    ['Industry', lead.industry || 'Manufacturing & Electronics'],
    ['Annual Revenue', formatAmount(lead.amount || 185000)],
    ['Website', `www.${(lead.company || 'hiraparaindustries').toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`],
  ];

  const addressRows = [
    ['Address', `123, Mumbai Industrial Estate`],
    ['City', lead.city || 'Surat'],
    ['State', lead.state || 'Gujarat'],
    ['Country', lead.country || 'India'],
    ['Zip Code', lead.zipCode || '394201'],
  ];

  const activities = [
    {
      id: 1,
      title: 'Stage updated to Qualified',
      time: '2 hours ago',
      color: '#8b5cf6',
    },
    {
      id: 2,
      title: 'Task created - Follow up call',
      time: '5 hours ago',
      color: '#f59e0b',
    },
    {
      id: 3,
      title: 'Email sent to lead',
      time: '1 day ago',
      color: '#3b82f6',
    },
    {
      id: 4,
      title: 'Lead record updated',
      time: '2 days ago',
      color: '#10b981',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-5">Lead Information</h3>
        <div className="space-y-3.5 text-xs">
          {infoRows.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-slate-400 font-normal shrink-0">{label}</span>
              <span className="text-slate-900 font-semibold text-right truncate">{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-sm text-slate-900">Address Information</h3>
        <div className="space-y-3.5 text-xs">
          {addressRows.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-slate-400 font-normal shrink-0">{label}</span>
              <span className="text-slate-900 font-semibold text-right truncate">{val}</span>
            </div>
          ))}
        </div>

        <div className="h-44 rounded-2xl bg-gradient-to-b from-slate-50 via-slate-50 to-emerald-50/40 border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-rose-500 mb-2">
              <MapPin size={16} />
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-500/15 -mt-6 mb-3" />
            <button
              type="button"
              className="px-3.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md border border-slate-200 shadow-xs transition cursor-pointer"
            >
              View on Map
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-sm text-slate-900">Recent Activity</h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-xs transition cursor-pointer"
          >
            <Plus size={13} /> Add
          </button>
        </div>

        <div className="space-y-4">
          {activities.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 leading-snug">{item.title}</p>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 3. Users | Products Tab ──────────────────────────────────
function UsersProductsTab({ lead, onCountsChange, onActivity }) {
  const initialState = useMemo(() => loadLeadDetailState(lead), [lead]);
  const [users, setUsers] = useState(() => initialState.users);
  const [products, setProducts] = useState(() => initialState.products);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productDraft, setProductDraft] = useState({ name: '', sku: '', price: '', qty: 1, status: 'Active', image: '' });
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All Users');
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState('All Products');

  const filteredUsers = useMemo(() => users.filter((u) => {
    if (userFilter !== 'All Users' && u.status !== userFilter) return false;
    if (userSearch && !`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(userSearch.toLowerCase())) return false;
    return true;
  }), [users, userSearch, userFilter]);

  const filteredProducts = useMemo(() => products.filter((p) => {
    if (productFilter !== 'All Products' && p.status !== productFilter) return false;
    if (productSearch && !`${p.name} ${p.sku}`.toLowerCase().includes(productSearch.toLowerCase())) return false;
    return true;
  }), [products, productSearch, productFilter]);

  const availableEmployees = useMemo(
    () => employeesMock.filter((employee) => !users.some((user) => user.name === employee.name)),
    [users],
  );

  React.useEffect(() => {
    updateStoredLeadDetail(lead?.id, { users, products });
    onCountsChange?.({ users: users.length, products: products.length });
  }, [lead?.id, users, products, users.length, products.length, onCountsChange]);

  function addUser() {
    const employee = employeesMock.find((item) => item.id === selectedEmployeeId);
    if (!employee) return;
    setUsers((current) => [
      ...current,
      {
        id: employee.id,
        initials: getInitials(employee.name),
        name: employee.name,
        email: employee.email,
        role: employee.designation,
        status: employee.status === 'Active' ? 'Active' : 'Inactive',
        bg: '#3b82f6',
      },
    ]);
    setSelectedEmployeeId('');
    setIsAddUserOpen(false);
    onActivity?.(`${employee.name} assigned to lead`, '#10b981');
  }

  function editUser(user) {
    const name = window.prompt('Enter user name', user.name);
    if (!name?.trim()) return;
    setUsers((current) => current.map((u) => (u.id === user.id ? { ...u, name: name.trim() } : u)));
  }

  function deleteUser(id) {
    const target = users.find((u) => u.id === id);
    setUsers((current) => current.filter((u) => u.id !== id));
    onActivity?.(`User "${target?.name ?? 'entry'}" removed`, '#f59e0b');
  }

  function addProduct() {
    if (!productDraft.name.trim() || !productDraft.sku.trim() || !productDraft.price || Number(productDraft.qty) < 1) return;
    setProducts((current) => [
      ...current,
      {
        id: Date.now(),
        name: productDraft.name.trim(),
        sku: productDraft.sku.trim().toUpperCase(),
        price: `Rs. ${Number(productDraft.price).toLocaleString('en-IN')}`,
        qty: Number(productDraft.qty),
        status: productDraft.status,
        image: productDraft.image,
      },
    ]);
    setProductDraft({ name: '', sku: '', price: '', qty: 1, status: 'Active', image: '' });
    setIsAddProductOpen(false);
    onActivity?.(`Product "${productDraft.name.trim()}" added`, '#ec4899');
  }

  function editProduct(product) {
    const name = window.prompt('Enter product name', product.name);
    if (!name?.trim()) return;
    setProducts((current) => current.map((p) => (p.id === product.id ? { ...p, name: name.trim() } : p)));
  }

  function deleteProduct(id) {
    const target = products.find((p) => p.id === id);
    setProducts((current) => current.filter((p) => p.id !== id));
    onActivity?.(`Product "${target?.name ?? 'entry'}" removed`, '#f59e0b');
  }

  async function handleProductImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = await readFileAsDataUrl(file);
    setProductDraft((current) => ({ ...current, image }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      {/* Users Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-900">Users ({filteredUsers.length})</h3>
          <button
            type="button"
            onClick={() => {
              setSelectedEmployeeId(availableEmployees[0]?.id || '');
              setIsAddUserOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus size={14} /> Add User
          </button>
        </div>

        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/30 flex items-center justify-center p-4" onClick={() => setIsAddUserOpen(false)}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md p-5" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Add Employee</h4>
                  <p className="text-xs text-slate-500 mt-1">Select an employee to assign to this lead.</p>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-700 text-lg" onClick={() => setIsAddUserOpen(false)} aria-label="Close add employee dialog">×</button>
              </div>
              <label className="block text-xs font-semibold text-slate-700">
                Employee
                <select
                  value={selectedEmployeeId}
                  onChange={(event) => setSelectedEmployeeId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  {availableEmployees.length === 0 ? (
                    <option value="">All employees are already added</option>
                  ) : (
                    availableEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} · {employee.designation} · {employee.department}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <div className="flex justify-end gap-2 mt-5">
                <button type="button" className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50" onClick={addUser} disabled={!selectedEmployeeId}>
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="relative">
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="All Users">All Users</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-700">
                <th className="py-2.5 px-2 w-7 font-bold">#</th>
                <th className="py-2.5 px-2 font-bold">User Name</th>
                <th className="py-2.5 px-2 font-bold">Email</th>
                <th className="py-2.5 px-2 font-bold">Role</th>
                <th className="py-2.5 px-2 text-center font-bold">Status</th>
                <th className="py-2.5 px-2 text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-2 text-slate-400 font-normal">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: u.bg || '#3b82f6' }}
                      >
                        {u.initials}
                      </div>
                      <span className="font-semibold text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-slate-500">{u.email}</td>
                  <td className="py-3 px-2 text-slate-600">{u.role}</td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => editUser(u)}
                        className="w-7 h-7 rounded-lg border border-blue-200 text-blue-500 bg-white flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer shadow-2xs"
                        title="Edit User"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(u.id)}
                        className="w-7 h-7 rounded-lg border border-rose-200 text-rose-400 bg-white flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition cursor-pointer shadow-2xs"
                        title="Delete User"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3.5 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
          Showing 1 to {filteredUsers.length} of {filteredUsers.length} entries
        </div>
      </div>

      {/* Products Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-900">Products ({filteredProducts.length})</h3>
          <button
            type="button"
            onClick={() => setIsAddProductOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>

        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/30 flex items-center justify-center p-4" onClick={() => setIsAddProductOpen(false)}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg p-5" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Add Product</h4>
                  <p className="text-xs text-slate-500 mt-1">Enter the product details for this lead.</p>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-700 text-lg" onClick={() => setIsAddProductOpen(false)} aria-label="Close add product dialog">×</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                  Product Name
                  <input
                    type="text"
                    value={productDraft.name}
                    onChange={(event) => setProductDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Enter product name"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                  Product Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageChange}
                    className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-700"
                  />
                  {productDraft.image && <img src={productDraft.image} alt="Product preview" className="mt-3 h-16 w-16 rounded-lg border border-slate-200 object-cover" />}
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  SKU
                  <input
                    type="text"
                    value={productDraft.sku}
                    onChange={(event) => setProductDraft((current) => ({ ...current, sku: event.target.value }))}
                    placeholder="e.g. PRD-001"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Price
                  <input
                    type="number"
                    min="0"
                    value={productDraft.price}
                    onChange={(event) => setProductDraft((current) => ({ ...current, price: event.target.value }))}
                    placeholder="Enter price"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={productDraft.qty}
                    onChange={(event) => setProductDraft((current) => ({ ...current, qty: event.target.value }))}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Status
                  <select
                    value={productDraft.status}
                    onChange={(event) => setProductDraft((current) => ({ ...current, status: event.target.value }))}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setIsAddProductOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                  onClick={addProduct}
                  disabled={!productDraft.name.trim() || !productDraft.sku.trim() || !productDraft.price || Number(productDraft.qty) < 1}
                >
                  Add Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="relative">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="All Products">All Products</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-700">
                <th className="py-2.5 px-2 w-7 font-bold">#</th>
                <th className="py-2.5 px-2 font-bold">Product Name</th>
                <th className="py-2.5 px-2 font-bold">SKU</th>
                <th className="py-2.5 px-2 font-bold">Price</th>
                <th className="py-2.5 px-2 font-bold">Quantity</th>
                <th className="py-2.5 px-2 text-center font-bold">Status</th>
                <th className="py-2.5 px-2 text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-2 text-slate-400 font-normal">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-blue-100/70 border border-blue-200/50 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <div className="w-2.5 h-2.5 bg-slate-700 rounded-[2px]" />}
                      </div>
                      <span className="font-semibold text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-slate-500 font-mono text-[11px]">{p.sku}</td>
                  <td className="py-3 px-2 text-slate-600 font-medium">{p.price}</td>
                  <td className="py-3 px-2 text-slate-700">{p.qty}</td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        p.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => editProduct(p)}
                        className="w-7 h-7 rounded-lg border border-blue-200 text-blue-500 bg-white flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer shadow-2xs"
                        title="Edit Product"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(p.id)}
                        className="w-7 h-7 rounded-lg border border-rose-200 text-rose-400 bg-white flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition cursor-pointer shadow-2xs"
                        title="Delete Product"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3.5 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
          Showing 1 to {filteredProducts.length} of {filteredProducts.length} entries
        </div>
      </div>
    </div>
  );
}

export default function LeadDetailView({ lead, onBackToLeads }) {
  const navigate = useNavigate();
  const storedDetailState = useMemo(() => loadLeadDetailState(lead), [lead]);
  const [activeTab, setActiveTab] = useState('Users & Products');
  const { addCustomer, showToast } = useERP() || {};
  const [isConverted, setIsConverted] = useState(lead?.status === 'Converted');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [detailCounts, setDetailCounts] = useState(() => ({
    users: storedDetailState.users.length,
    products: storedDetailState.products.length,
    sources: storedDetailState.sources.length,
    files: storedDetailState.files.length,
    openTasks: lead?.openTasksCount ?? 0,
    calls: lead?.callsCount ?? 0,
    estimates: lead?.estimatesCount ?? 0,
    challans: lead?.deliveryChallansCount ?? 0,
  }));
  const [activities, setActivities] = useState(() => ([
    { id: 'act-created', title: `Lead created from ${lead?.source || 'Website'}`, time: lead?.createdOn || 'Just now', color: '#3b82f6' },
    { id: 'act-status', title: `Stage set to ${lead?.status || 'New'}`, time: lead?.createdOn || 'Just now', color: '#8b5cf6' },
    { id: 'act-owner', title: `Assigned to ${lead?.owner || 'David Patel'}`, time: lead?.createdOn || 'Just now', color: '#10b981' },
  ]));

  function logActivity(title, color) {
    if (!title) return;
    setActivities((current) => [{ id: `act-${Date.now()}`, title, time: 'Just now', color: color || '#3b82f6' }, ...current]);
  }

  function updateDetailCounts(counts) {
    setDetailCounts((current) => ({ ...current, ...counts }));
  }

  React.useEffect(() => {
    updateStoredLead(lead?.id, {
      status: isConverted ? 'Converted' : lead?.status,
      productsCount: detailCounts.products,
      sourcesCount: detailCounts.sources,
      filesCount: detailCounts.files,
      openTasksCount: detailCounts.openTasks,
      callsCount: detailCounts.calls,
      estimatesCount: detailCounts.estimates,
      deliveryChallansCount: detailCounts.challans,
    });
  }, [lead?.id, lead?.status, isConverted, detailCounts]);

  function exportLead(format) {
    const filename = `${String(lead.name || 'lead').replace(/\s+/g, '_')}_details`;
    if (format === 'CSV') {
      exportToCSV(filename, ['Field', 'Value'], leadExportRows(lead));
    }
    if (format === 'Excel') {
      downloadLeadAsExcel(lead);
    }
    if (format === 'PDF') {
      printLeadAsPdf(lead);
    }
    setIsExportOpen(false);
  }

  if (!lead) return null;

  const metrics = [
    { label: 'Products', value: detailCounts.products, icon: ShoppingBag, color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Source', value: detailCounts.sources, icon: Globe, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Files', value: detailCounts.files, icon: FileStack, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Open Tasks', value: detailCounts.openTasks, icon: ListChecks, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Calls', value: detailCounts.calls, icon: Phone, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Estimates', value: detailCounts.estimates, icon: Receipt, color: '#06b6d4', bg: '#ecfeff' },
    { label: 'Delivery Challans', value: detailCounts.challans, icon: Truck, color: '#f97316', bg: '#fff7ed' },
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

  const displayName = lead.name?.replace(/\s*\(Sample\)/i, '') || 'Christopher Maclead';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
          <span className="text-slate-300">&gt;</span>
          <Link to="/crm/leads" className="text-blue-600 hover:underline">Leads</Link>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-900 font-semibold">{displayName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToLeads}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition cursor-pointer"
          >
            <ArrowLeft size={13} className="text-slate-500" /> Back
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition cursor-pointer"
          >
            <Pencil size={13} className="text-slate-500" /> Edit
          </button>
          <button
            type="button"
            onClick={handleConvert}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer ${
              isConverted
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white hover:bg-blue-50 text-blue-600 border border-blue-200'
            }`}
          >
            <CheckCircle size={13} /> {isConverted ? 'Converted' : 'Convert'}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition cursor-pointer"
            onClick={() => setIsExportOpen(true)}
          >
            <Printer size={13} className="text-slate-500" /> Print
          </button>
        </div>
      </div>

      {isExportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/30 flex items-center justify-center p-4" onClick={() => setIsExportOpen(false)}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Print Lead Details</h2>
                <p className="text-xs text-slate-500 mt-1">Choose a format for {displayName}</p>
              </div>
              <button type="button" className="text-slate-400 hover:text-slate-700 text-lg" onClick={() => setIsExportOpen(false)} aria-label="Close print options">×</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['CSV', 'Excel', 'PDF'].map((format) => (
                <button key={format} type="button" className="border border-slate-200 rounded-lg px-3 py-3 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50" onClick={() => exportLead(format)}>
                  {format}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-xs border border-slate-100 ring-2 ring-slate-50">
              <img
                src={lead.photo || 'https://i.pravatar.cc/160?img=60'}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{displayName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {lead.status || 'Qualified'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{lead.company || 'Hirapara Industries'}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                <span className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /> +91 {lead.phone || '98765 43210'}</span>
                <span className="flex items-center gap-1.5"><Mail size={13} className="text-slate-400" /> {lead.email || 'chirag@hirapara.com'}</span>
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {lead.city || 'Surat'}, {lead.state || 'Gujarat'}, {lead.country || 'India'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-8">
            <div>
              <span className="text-[11px] text-slate-400 block font-normal mb-1">Lead Number</span>
              <strong className="text-xs font-bold text-slate-900 font-mono">{lead.leadNumber || 'L00000185'}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-normal mb-1">Source</span>
              <strong className="text-xs font-bold text-slate-900">{lead.source || 'Website'}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-normal mb-1">Created On</span>
              <strong className="text-xs font-bold text-slate-900">{lead.createdOn || '27/08/2026'}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-xs hover:border-slate-300 transition"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: m.bg, color: m.color }}
              >
                <Icon size={17} strokeWidth={2} />
              </div>
              <div className="min-w-0 leading-tight">
                <span className="text-[11px] font-medium text-slate-500 block truncate">{m.label}</span>
                <strong className="text-sm font-bold text-slate-900">{m.value}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 shadow-xs scrollbar-none">
        {DETAIL_TABS.map((tab) => {
          const isActive = activeTab === tab;
          const TabIcon = DETAIL_TAB_ICONS[tab];
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 whitespace-nowrap rounded-lg text-xs font-semibold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-xs'
              }`}
            >
              <TabIcon size={14} strokeWidth={isActive ? 2.3 : 2} />
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      {activeTab === 'Sources & Emails' && <SourcesAndEmailsTab lead={lead} onCountsChange={updateDetailCounts} onActivity={logActivity} />}
      {activeTab === 'General' && <GeneralTab lead={lead} />}
      {activeTab === 'Users & Products' && <UsersProductsTab lead={lead} onCountsChange={updateDetailCounts} onActivity={logActivity} />}
      {activeTab === 'Discussion & Notes' && <DiscussionNotesTab lead={lead} onActivity={logActivity} />}
      {activeTab === 'Files' && <FilesTab lead={lead} onCountsChange={updateDetailCounts} onActivity={logActivity} />}
      {activeTab === 'Activity' && <ActivityTab items={activities} />}
      {!['Sources & Emails', 'General', 'Users & Products', 'Discussion & Notes', 'Files', 'Activity'].includes(activeTab) && (
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


