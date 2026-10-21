import { findDealForLead } from '../../../services/dealService';
import CrmKpiCard from '../common/CrmKpiCard';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Clock,
  Check,
  CheckSquare,
  Square,
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
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  X,
  Users,
} from 'lucide-react';
import LeadAvatar from './LeadAvatar';
import { exportToCSV } from '../../../services/exportUtils';
import { useEstimates, estimateMatchesLead, addEstimate } from '../../../services/estimateStore';
import { useCrmStore } from '../../../stores/crmStore';
import { generateProductSku } from './leadSubResources';
import { resolveFileUrl } from '../../../services/api';
import {
  activeLeadForm, allCustomLeadFields, customLeadFields, formatCustomValue, missingRequiredField,
} from '../../../services/leadFormFields';
import { CustomLeadFieldInput } from './CustomLeadFieldInput';
import { useLeadDetailStore, EMPTY_DETAIL } from '../../../stores/leadDetailStore';
import { isServerId } from '../../../services/resourceSync';
import { crmSync, describeError } from '../../../services/crmSync';
import { uploadFileToBackend } from '../../../services/fileUploadService';
import { LineItemEditor } from '../../../components/common/LineItemEditor';
import { loadCrmTasks, saveCrmTasks, runLeadStageAutomation, TASK_SOURCE_AUTOMATION } from '../../../services/leadStageAutomation';
import { emitCrmEvent, CRM_EVENT_TYPES } from '../../../services/crmEventNotifications';
import { useAppStore } from '../../../stores/appStore';
import { completeTaskWithOutcome, NEXT_ACTION_LABELS, getLeadStageOrder } from '../../../services/taskCompletionService';
import CompleteTaskModal from '../tasks/CompleteTaskModal';

const DETAIL_TABS = [
  'General',
  'Users & Products',
  'Sources & Emails',
  'Files',
  'Tasks',
  'Estimates',
  'Activity',
];

const DETAIL_TAB_ICONS = {
  General: Info,
  'Users & Products': UserCheck,
  'Sources & Emails': Globe,
  Files: FileStack,
  Tasks: ListChecks,
  Estimates: Receipt,
  Activity: Sparkles,
};

/**
 * The drawer used to keep a lead and its sections in two localStorage blobs.
 * Both now go to the API: the lead row through the CRM store, each section
 * through its own sub-collection endpoint.
 */
/** Merge display-only fields into the lead's store row, without a server write. */
function patchLeadRowLocally(leadId, patch) {
  if (!leadId) return;
  useCrmStore.setState((state) => {
    const row = state.leads.find((l) => l.id === leadId);
    if (!row || Object.keys(patch).every((k) => row[k] === patch[k])) return state;
    return { leads: state.leads.map((l) => (l.id === leadId ? { ...l, ...patch } : l)) };
  });
}

/**
 * One write from a tab to a lead's sub-collection, server first. The tabs render
 * the lead-detail store, so a saved row appears once the server has it; a
 * rejected one is reported on the activity strip instead of vanishing.
 *
 *   leadDetailWrite(lead.id, 'add', 'sources', row, onActivity)
 *   leadDetailWrite(lead.id, 'update', 'products', { id, ...changes }, onActivity)
 *   leadDetailWrite(lead.id, 'remove', 'calls', { id }, onActivity)
 */
function leadDetailWrite(leadId, verb, section, row, onActivity) {
  const store = useLeadDetailStore.getState();
  if (!isServerId(leadId)) return Promise.resolve(null);
  const request = verb === 'add'
    ? store.add(leadId, section, row)
    : verb === 'update'
      ? store.update(leadId, section, row.id, row)
      : store.remove(leadId, section, row.id);
  return request.catch((err) => {
    console.warn(`[CRM] ${section} not saved:`, err?.message || err);
    onActivity?.(`Could not save ${section}: ${describeError(err)}`, '#ef4444');
    return null;
  });
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

/** Name of the signed-in user, for rows this screen stamps with an author. */
function currentUserName() {
  return useAppStore.getState().currentUser?.name || '';
}

/** Phone with the +91 prefix when a bare local number was stored; '' when unset. */
function displayPhone(phone) {
  const value = String(phone || '').trim();
  if (!value) return '';
  return value.startsWith('+') ? value : `+91 ${value}`;
}

function UserChip({ name, avatar }) {
  if (avatar) return <img src={avatar} alt={name} className="w-5 h-5 rounded-full object-cover" />;
  return (
    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold flex items-center justify-center">
      {getInitials(name)}
    </span>
  );
}


// ── helpers the drawer's tabs share ─────────────────────────────────────────

/** Lead source icons are stored by name and resolved to a component to render. */
const SOURCE_ICONS = {
  website: Globe,
  email: Mail,
  phone: Phone,
  call: Phone,
  referral: Users,
  campaign: Megaphone,
  exhibition: Building2,
  default: Globe,
};

export function sourceIconName(icon) {
  if (typeof icon === 'string') return icon;
  const match = Object.entries(SOURCE_ICONS).find(([, component]) => component === icon);
  return match ? match[0] : 'default';
}

export function resolveSourceIcon(icon) {
  if (icon && typeof icon !== 'string') return icon;
  return SOURCE_ICONS[String(icon || 'default').toLowerCase()] || SOURCE_ICONS.default;
}

export const LEAD_TASK_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
export const LEAD_TASK_STATUS_OPTIONS = ['Open', 'In Progress', 'Waiting', 'Completed'];

/**
 * The Tasks Master rows a lead task can start from, from `/crm/master-tasks/`:
 * picking one fills the title, priority and role.
 */
function getMasterTaskOptions() {
  return useCrmStore.getState().masterTasks
    .filter((task) => (task.name || task.title) && task.status !== 'Inactive')
    .map((task) => ({
      id: task.id,
      name: task.name || task.title,
      priority: task.priority,
      role: task.role,
    }));
}

/** `DD/MM/YYYY, hh:mm` — what the task rows render — and back again. */
function parseLeadTaskDueAt(value) {
  if (!value) return null;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return new Date(direct);
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2}))?/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh = '0', min = '0'] = match;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
}

/** The Tasks tab's editor, blank. */
function emptyLeadTaskEditor(assignee, stage) {
  return {
    defaultTask: 'custom', title: '', stage: stage || 'New Lead', priority: 'Medium', status: 'Due',
    assignee: assignee || '', description: '',
    taskDate: '', taskTime: '',
  };
}

/** `dueAt` -> the editor's `<input type="date">` / `<input type="time">` values. */
function splitLeadTaskDueAt(value) {
  const date = parseLeadTaskDueAt(value);
  if (!date || Number.isNaN(date.getTime())) return { taskDate: '', taskTime: '' };
  const pad = (n) => String(n).padStart(2, '0');
  return {
    taskDate: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    taskTime: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

/**
 * A CRM task (`/crm/tasks/`) as the lead's Tasks tab renders it. The columns
 * the task list shares are the task's own; what only this tab captures (stage,
 * due time, task-form answers) rides in `extra`.
 */
function leadTaskFromCrmTask(task) {
  const extra = task.extra || {};
  const done = task.status === 'Completed';
  return {
    ...extra,
    id: task.id,
    crmTaskId: task.id,
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'Medium',
    status: done ? 'Completed' : 'Due',
    process: done ? 'Done' : (extra.process || 'Not Started'),
    assignee: task.assigneeName || task.owner || 'Unassigned',
    dueAt: extra.dueAt || task.dueDate || '',
    source: task.source,
    completionOutcome: task.completionOutcome || '',
    nextAction: task.nextAction || task.next_action || '',
    completedBy: task.completedBy || '',
  };
}

function formatLeadTaskDueAt(value) {
  const date = parseLeadTaskDueAt(value);
  if (!date) return String(value || '');
  return date.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

/**
 * One lead's sections, as the server returned them. Anything the server has no
 * rows for stays empty — the drawer shows an empty state instead of invented
 * contacts, files or a fabricated timeline.
 */
function leadDetailState(detail) {
  const stored = detail || EMPTY_DETAIL;
  return {
    users: stored.users || [],
    products: stored.products || [],
    sources: stored.sources || [],
    emails: stored.emails || [],
    timeline: stored.timeline || [],
    files: stored.files || [],
    calls: stored.calls || [],
    notes: stored.notes || [],
    threads: stored.threads || [],
    tasks: stored.tasks || [],
    activities: stored.activities || [],
  };
}

/** Subscribe to one lead's sections and trigger the load on first use. */
function useLeadDetailState(lead) {
  const leadId = lead?.id;
  const detail = useLeadDetailStore((s) => s.byLead[String(leadId || '')]);
  const load = useLeadDetailStore((s) => s.load);
  useEffect(() => {
    if (leadId) load(leadId);
  }, [leadId, load]);
  return useMemo(() => leadDetailState(detail), [detail]);
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
    ['Company', lead.company || ''],
    ['Title', lead.jobTitle || ''],
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
    ['Zip Code', lead.zipCode || ''],
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
    ['Zip Code', lead.zipCode || ''],
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
  setTimeout(() => {
    printWindow.print();
  }, 250);
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
  const initialState = useLeadDetailState(lead);
  const { sources, emails, timeline } = initialState;

  const [showAddSource, setShowAddSource] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [newSource, setNewSource] = useState({ source: 'Website', details: '' });
  const [newEmail, setNewEmail] = useState({ subject: '', message: '' });
  const [recipients, setRecipients] = useState([lead.email].filter(Boolean));
  const [mailTo, setMailTo] = useState(lead.email || '');
  const [mailError, setMailError] = useState('');
  const editorRef = React.useRef(null);
  const [editorEmpty, setEditorEmpty] = useState(true);

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

  function syncEditor() {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText || '';
    setNewEmail((prev) => ({ ...prev, message: text }));
    setEditorEmpty(text.trim() === '');
  }

  function formatDoc(command, value = null) {
    try {
      if (editorRef.current) editorRef.current.focus();
      document.execCommand(command, false, value);
    } catch {
      return;
    }
    syncEditor();
  }

  function runLink() {
    const url = window.prompt('Enter link URL', 'https://');
    if (url) formatDoc('createLink', url);
  }

  function openEmailModal() {
    setMailTo(lead.email || '');
    setMailError('');
    setNewEmail({ subject: '', message: '' });
    setEditorEmpty(true);
    if (editorRef.current) editorRef.current.innerHTML = '';
    setShowSendEmail(true);
  }

  function closeEmailModal() {
    setShowSendEmail(false);
  }

  const handleAddSource = (e) => {
    e.preventDefault();
    if (!newSource.details) return;
    const added = { source: newSource.source, details: newSource.details };
    leadDetailWrite(lead.id, 'add', 'sources', added, onActivity).then((saved) => {
      if (saved) onActivity?.(`Source "${added.source}" added`, '#10b981');
    });
    setNewSource({ source: 'Website', details: '' });
    setShowAddSource(false);
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    const toOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailTo.trim());
    if (!toOk) {
      setMailError('Enter a valid email address');
      return;
    }
    if (!newEmail.subject.trim()) return;
    const bodyText = (editorRef.current?.innerText || newEmail.message || '').trim();
    // The email row is the record; the server adds it to the lead's timeline.
    const addedEmail = { subject: newEmail.subject, body: bodyText, to: mailTo.trim() };
    leadDetailWrite(lead.id, 'add', 'emails', addedEmail, onActivity).then((saved) => {
      if (saved) onActivity?.(`Email "${addedEmail.subject}" sent`, '#3b82f6');
    });
    setNewEmail({ subject: '', message: '' });
    setEditorEmpty(true);
    if (editorRef.current) editorRef.current.innerHTML = '';
    setShowSendEmail(false);
  };

  const deleteSource = (id) => {
    const target = sources.find((s) => s.id === id);
    leadDetailWrite(lead.id, 'remove', 'sources', { id }, onActivity).then((done) => {
      if (done) onActivity?.(`Source "${target?.source ?? 'entry'}" removed`, '#f59e0b');
    });
  };
  const deleteEmail = (id) => {
    const target = emails.find((e) => e.id === id);
    leadDetailWrite(lead.id, 'remove', 'emails', { id }, onActivity).then((done) => {
      if (done) onActivity?.(`Email "${target?.subject ?? 'entry'}" deleted`, '#f59e0b');
    });
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
          <div className="card-header flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <table className="data-table text-xs min-w-[640px] lg:min-w-0">
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
                  const Icon = resolveSourceIcon(s.icon);
                  return (
                    <tr key={s.id}>
                      <td className="text-slate-500 font-mono">{idx + 1}</td>
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
                      <td className="font-semibold">{s.details}</td>
                      <td className="text-slate-500 font-mono text-xs whitespace-nowrap">{s.date}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <UserChip name={s.createdBy} avatar={s.avatar} />
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
          <div className="card-header flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0">
            <h3 className="font-bold text-sm">Emails ({emails.length})</h3>
            <button
              type="button"
              onClick={openEmailModal}
              className="btn-primary btn-sm flex items-center gap-1.5"
            >
              <Plus size={13} strokeWidth={2.4} /> Send Email
            </button>
          </div>

          {showSendEmail && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/50" onClick={closeEmailModal}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                  <h2 className="text-[15px] font-bold text-slate-800">Create Email</h2>
                  <button type="button" onClick={closeEmailModal} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleSendEmail}>
                  <div className="px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[13px] font-semibold text-slate-600">Mail To<span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={mailTo}
                          onChange={(e) => { setMailTo(e.target.value); setMailError(''); }}
                          placeholder="Enter email"
                          className="mt-1.5 h-11 w-full border border-slate-300 rounded-lg px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                        />
                        {mailError && <p className="text-[11px] text-rose-500 mt-1 font-medium">{mailError}</p>}
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-slate-600">Subject<span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={newEmail.subject}
                          onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                          placeholder="Enter subject"
                          className="mt-1.5 h-11 w-full border border-slate-300 rounded-lg px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[13px] font-semibold text-slate-600">Description<span className="text-rose-500">*</span></label>
                      <div className="mt-1.5 border border-slate-300 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-white flex-wrap">
                          <button type="button" title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => formatDoc('bold')} className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700"><Bold size={15} /></button>
                          <button type="button" title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => formatDoc('italic')} className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700"><Italic size={15} /></button>
                          <button type="button" title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => formatDoc('underline')} className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700"><Underline size={15} /></button>
                          <button type="button" title="Strikethrough" onMouseDown={(e) => e.preventDefault()} onClick={() => formatDoc('strikeThrough')} className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700"><Strikethrough size={15} /></button>
                          <button type="button" title="Bullet list" onMouseDown={(e) => e.preventDefault()} onClick={() => formatDoc('insertUnorderedList')} className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700"><List size={15} /></button>
                          <button type="button" title="Numbered list" onMouseDown={(e) => e.preventDefault()} onClick={() => formatDoc('insertOrderedList')} className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700"><ListOrdered size={15} /></button>
                          <button type="button" title="Align left" onMouseDown={(e) => e.preventDefault()} onClick={() => formatDoc('justifyLeft')} className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700"><AlignLeft size={15} /></button>
                          <button type="button" title="Align center" onMouseDown={(e) => e.preventDefault()} onClick={() => formatDoc('justifyCenter')} className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700"><AlignCenter size={15} /></button>
                          <button type="button" title="Align right" onMouseDown={(e) => e.preventDefault()} onClick={() => formatDoc('justifyRight')} className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700"><AlignRight size={15} /></button>
                          <button type="button" title="Insert link" onMouseDown={(e) => e.preventDefault()} onClick={runLink} className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-700"><Link2 size={15} /></button>
                        </div>
                        <div className="relative">
                          {editorEmpty && <span className="absolute left-3.5 top-3 text-sm text-slate-400 pointer-events-none">Write Here...</span>}
                          <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncEditor} className="min-h-[170px] max-h-[260px] overflow-y-auto px-3.5 py-3 text-sm text-slate-800 outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
                    <button type="button" onClick={closeEmailModal} className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold">Cancel</button>
                    <button type="submit" className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold shadow-xs">Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="table-scroll">
            <table className="data-table text-xs min-w-[640px] lg:min-w-0">
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
                    <td className="text-slate-500 font-mono">{idx + 1}</td>
                    <td>
                      <div className="inline-flex items-center gap-2">
                        <Mail size={13} className="text-blue-500 shrink-0" />
                        <span className="font-bold">{e.subject}</span>
                      </div>
                    </td>
                    <td className="text-slate-500 font-mono text-xs whitespace-nowrap">{e.date}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <UserChip name={e.person} avatar={e.avatar} />
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
        <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Email Activity Timeline</h3>
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
                  <strong className="text-xs font-bold" style={{ color: 'var(--text)' }}>{item.title}</strong>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{item.preview}</p>
              </div>
              <div className="text-right shrink-0">
                <time className="text-[11px] font-mono block" style={{ color: 'var(--muted)' }}>{item.date}</time>
                {item.author && <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>by {item.author}</span>}
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
  const initialState = useLeadDetailState(lead);
  const { files } = initialState;
  const [fileSearch, setFileSearch] = useState('');
  const [fileType, setFileType] = useState('All');
  const [viewFile, setViewFile] = useState(null);

  const visibleFiles = useMemo(() => files.filter((f) => {
    if (fileType !== 'All' && f.type !== fileType) return false;
    if (fileSearch && !String(f.name ?? '').toLowerCase().includes(fileSearch.toLowerCase())) return false;
    return true;
  }), [files, fileSearch, fileType]);

  React.useEffect(() => {
    onCountsChange?.({ files: files.length });
  }, [files.length, onCountsChange]);

  async function handleUploadFiles(event) {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;
    event.target.value = '';
    // Each file is uploaded (`/files/…`), then attached to the lead by its id.
    const results = await Promise.all(selected.map(async (file) => {
      try {
        const fileId = await uploadFileToBackend(file, file.name, 'crm_lead');
        if (!fileId) throw new Error('Sign in to upload files.');
        return leadDetailWrite(lead.id, 'add', 'files', { fileId, name: file.name }, onActivity);
      } catch (err) {
        onActivity?.(`Could not upload "${file.name}": ${describeError(err)}`, '#ef4444');
        return null;
      }
    }));
    const uploaded = results.filter(Boolean);
    if (uploaded.length) onActivity?.(`${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded`, '#8b5cf6');
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
    leadDetailWrite(lead.id, 'remove', 'files', { id }, onActivity).then((done) => {
      if (done) onActivity?.(`File "${target?.name ?? 'entry'}" removed`, '#f59e0b');
    });
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
        <table className="data-table text-xs min-w-[640px] lg:min-w-0">
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

// Replaced: CallsTab (lead call log) removed together with the Calls tab and KPI card.

function LeadTasksTab({ lead, onCountsChange, onActivity }) {
  const navigate = useNavigate();
  const initialState = useLeadDetailState(lead);
  // This lead's tasks are the CRM task list's (`/crm/tasks/?lead=…`), not a copy.
  const crmTasks = useCrmStore((s) => s.tasks);
  const teamMembers = useCrmStore((s) => s.teamMembers);
  const tasks = useMemo(
    () => crmTasks.filter((task) => String(task.leadId) === String(lead?.id)).map(leadTaskFromCrmTask),
    [crmTasks, lead?.id],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const assigneeOptions = useMemo(() => {
    const names = [
      lead?.owner,
      ...(initialState.users || []).map((user) => user.name),
      ...useCrmStore.getState().teamMembers.map((member) => member.name),
      ...tasks.map((task) => task.assignee),
    ]
      .map((name) => String(name || '').trim())
      .filter(Boolean);

    return [...new Set(names)];
  }, [initialState.users, lead?.owner, tasks]);
  const defaultAssignee = assigneeOptions[0] || currentUserName();
  const [masterTaskOptions, setMasterTaskOptions] = useState(() => getMasterTaskOptions());
  React.useEffect(() => {
    setMasterTaskOptions(getMasterTaskOptions());
  }, [isModalOpen]);
  const [form, setForm] = useState(() => emptyLeadTaskEditor(defaultAssignee, lead?.status));
  const [formError, setFormError] = useState('');
  const [completeId, setCompleteId] = useState(null);
  const currentUser = useAppStore((s) => s.currentUser);
  React.useEffect(() => {
    onCountsChange?.({ openTasks: tasks.filter((t) => t.status !== 'Completed').length });
  }, [tasks, onCountsChange]);

  /** The task-list payload for what the editor holds. */
  function crmTaskFromEditor() {
    const assigneeId = teamMembers.find((m) => String(m.name || '').trim() === String(form.assignee || '').trim())?.id;
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      leadId: lead.id,
      assigneeId,
      dueDate: form.taskDate || undefined,
      priority: form.priority || 'Medium',
      status: form.status === 'Completed' ? 'Completed' : 'Open',
      extra: {
        defaultTask: form.defaultTask,
        stage: form.stage,
        dueAt: formatLeadTaskDueAt(`${form.taskDate}T${form.taskTime || '00:00'}`),
        process: form.status === 'Completed' ? 'Done' : 'Not Started',
      },
    };
  }

  const dueTasks = useMemo(() => tasks.filter((t) => t.status === 'Due'), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.status !== 'Due'), [tasks]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyLeadTaskEditor(defaultAssignee, lead?.status));
    setFormError('');
    setIsModalOpen(true);
  }

  function openEdit(task) {
    const due = splitLeadTaskDueAt(task.dueAt);
    setEditingId(task.id);
    setForm({
      defaultTask: task.defaultTask || 'custom',
      title: task.title || '',
      stage: task.stage || 'New Lead',
      priority: task.priority || 'Low',
      status: task.status || 'Due',
      assignee: task.assignee || defaultAssignee,
      description: task.description || '',
      taskDate: due.taskDate,
      taskTime: due.taskTime,
    });
    setFormError('');
    setIsModalOpen(true);
  }

  function updateTaskForm(key, value) {
    setForm((current) => {
      if (key === 'defaultTask' && value && value !== 'custom') {
        const preset = masterTaskOptions.find((t) => String(t.id) === String(value));
        if (preset) {
          return {
            ...current,
            defaultTask: value,
            title: current.title || preset.name || '',
            priority: preset.priority || current.priority,
            assignee: current.assignee || defaultAssignee,
          };
        }
      }
      return { ...current, [key]: value };
    });
  }

  async function submitTask(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Task name is required.');
      return;
    }
    if (!form.taskDate) {
      setFormError('Task date is required.');
      return;
    }
    if (!form.taskTime) {
      setFormError('Task time is required.');
      return;
    }
    if (!form.assignee) {
      setFormError('Please select an assignee.');
      return;
    }
    const payload = crmTaskFromEditor();
    const store = useCrmStore.getState();
    try {
      if (editingId) {
        await store.updateTask(editingId, payload);
        onActivity?.(`Task "${payload.title}" updated`, '#1d6bff');
      } else {
        const saved = await store.createTask(payload);
        onActivity?.(`Task "${payload.title}" added`, '#16a34a');
        emitCrmEvent({
          type: CRM_EVENT_TYPES.TASK_CREATED,
          entityType: 'lead-task',
          entityId: saved?.id,
          payload: {
            title: payload.title,
            ownerName: form.assignee,
            leadName: lead?.name,
            leadId: lead?.id,
            path: `/crm/leads/${lead?.id}`,
          },
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(describeError(err));
    }
  }

  function toggleStatus(task) {
    if (task.status === 'Due') {
      setCompleteId(task.id);
      return;
    }
    // Reopen a completed task.
    const current = crmTasks.find((t) => String(t.id) === String(task.id));
    useCrmStore.getState()
      .updateTask(task.id, { status: 'Open', extra: { ...(current?.extra || {}), process: 'Not Started' } })
      .catch((err) => onActivity?.(`Could not reopen task: ${describeError(err)}`, '#ef4444'));
  }

  async function submitCompleteTask(outcome, nextAction, note, options = {}) {
    const detailTask = tasks.find((t) => t.id === completeId);
    if (!detailTask) {
      return { ok: false, message: 'Task could not be found.' };
    }
    const crmTask = crmTasks.find((t) => String(t.id) === String(detailTask.crmTaskId)) || null;
    const actor = currentUser?.name || defaultAssignee || lead?.owner || 'CRM User';
    // `POST /crm/tasks/{id}/complete/` -- the store re-reads, and this tab renders the store.
    return completeTaskWithOutcome({
      task: crmTask,
      lead,
      outcome,
      nextAction,
      note,
      ...options,
      completedBy: actor,
      leadDetailTask: detailTask,
    });
  }

  function confirmDelete() {
    if (!deleteId) return;
    const target = tasks.find((t) => t.id === deleteId);
    useCrmStore.getState().deleteTask(deleteId)
      .then(() => onActivity?.(`Task "${target?.title ?? 'entry'}" removed`, '#f59e0b'))
      .catch((err) => onActivity?.(`Could not remove task: ${describeError(err)}`, '#ef4444'));
    setDeleteId(null);
  }

  function priorityCls(priority) {
    if (priority === 'High') return 'bg-rose-50 text-rose-600 border border-rose-100';
    if (priority === 'Low') return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    return 'bg-orange-50 text-orange-500 border border-orange-100';
  }

  function renderRow(task, showNote) {
    const done = task.status !== 'Due';
    const isAuto = task.source === TASK_SOURCE_AUTOMATION || task.source === 'Created by Lead Stage Automation';
    return (
      <div key={task.id} className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50/60 transition">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            role="switch"
            aria-checked={done}
            aria-label={done ? 'Mark as due' : 'Mark as completed'}
            onClick={() => toggleStatus(task)}
            className={`relative mt-0.5 w-9 h-5 rounded-full transition shrink-0 ${done ? 'bg-[#1d4a79]' : 'bg-slate-200'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${done ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px]">
              <span className="font-bold text-slate-900">{task.title}</span>
              <span className="text-slate-400 font-normal">· {task.stage}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${done ? 'bg-lime-500' : 'bg-rose-600'}`}>{done ? 'Completed' : 'Due'}</span>
              {isAuto && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Created by Lead Stage Automation
                </span>
              )}
            </p>
            <p className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px]">
              <span className={`px-2 py-0.5 rounded font-bold ${priorityCls(task.priority)}`}>{task.priority}</span>
              <span className="text-slate-400">·</span>
              <span className="text-[#1d4a79] font-medium">{task.dueAt}</span>
              {task.assignee && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className={`font-semibold ${task.assignee === 'Unassigned' ? 'text-amber-600' : 'text-slate-500'}`}>
                    {task.assignee}
                  </span>
                </>
              )}
            </p>
            {task.warning && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded mt-1.5 font-medium">
                ⚠️ {task.warning}
              </p>
            )}
            {task.description && <p className="text-[11px] text-slate-500 mt-1">{task.description}</p>}
            <p className="text-[11px] text-slate-400 mt-1">Process: {task.process || 'Not Started'}</p>
            {task.completionOutcome && (
              <p className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                  Outcome: {task.completionOutcome}
                </span>
                {task.nextAction && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
                    Next: {NEXT_ACTION_LABELS[task.nextAction] || task.nextAction}
                  </span>
                )}
                {task.completedBy && <span className="text-slate-400">by {task.completedBy}</span>}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!done && showNote && (
            <button type="button" onClick={() => setCompleteId(task.id)} title="Fill Task Form" className="p-1.5 text-muted hover:text-primary hover:bg-card-hover rounded-lg cursor-pointer transition-colors">
              <ClipboardList size={14} />
            </button>
          )}
          <button type="button" onClick={() => openEdit(task)} title="Edit" className="p-1.5 text-muted hover:text-primary hover:bg-card-hover rounded-lg cursor-pointer transition-colors">
            <Pencil size={14} />
          </button>
          <button type="button" onClick={() => setDeleteId(task.id)} title="Delete" className="p-1.5 text-muted hover:text-danger hover:bg-card-hover rounded-lg cursor-pointer transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3">
        <h3 className="text-[15px] font-bold text-slate-900">Tasks</h3>
        <button
          type="button"
          onClick={openCreate}
          title="Add Lead Task"
          aria-label="Add Lead Task"
          className="p-1.5 text-muted hover:text-primary hover:bg-card-hover rounded-lg cursor-pointer transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-rose-100/80 border-y border-rose-100">
        <h4 className="text-[13px] font-bold text-slate-800">Due Tasks</h4>
        <span className="min-w-5 h-5 px-1.5 grid place-items-center rounded bg-slate-500/80 text-white text-[11px] font-bold">{dueTasks.length}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {dueTasks.length === 0 && (
          <p className="px-4 sm:px-5 py-6 text-center text-xs text-slate-400">No due tasks. Click + to add one.</p>
        )}
        {dueTasks.map((t) => renderRow(t, true))}
      </div>

      <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-slate-100/80 border-y border-slate-100">
        <h4 className="text-[13px] font-bold text-slate-800">Tasks</h4>
        <span className="min-w-5 h-5 px-1.5 grid place-items-center rounded bg-slate-500/80 text-white text-[11px] font-bold">{doneTasks.length}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {doneTasks.length === 0 && (
          <p className="px-4 sm:px-5 py-6 text-center text-xs text-slate-400">No completed tasks yet.</p>
        )}
        {doneTasks.map((t) => renderRow(t, false))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-2 sm:p-4 bg-slate-950/50 overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[#f1f5f9] rounded-xl shadow-2xl w-full max-w-5xl my-6 overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={editingId ? 'Edit lead task' : 'Create lead task'}>
            <div className="bg-white px-6 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-[15px] font-bold text-slate-900">Create Lead Task</h2>
              <p className="text-[11px] text-slate-500 mt-1">Dashboard <span className="mx-1">&gt;</span> Lead Task <span className="mx-1">&gt;</span> Create Lead Task</p>
            </div>

            <form onSubmit={submitTask} className="px-6 py-5">
              <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Default Task</label>
                  <select value={form.defaultTask} onChange={(e) => updateTaskForm('defaultTask', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500">
                    <option value="custom">Create custom task</option>
                    {masterTaskOptions.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Name <span className="text-rose-500">*</span></label>
                  <input autoFocus value={form.title} onChange={(e) => updateTaskForm('title', e.target.value)} placeholder="Enter Name" className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Date <span className="text-rose-500">*</span></label>
                    <input type="date" value={form.taskDate} onChange={(e) => updateTaskForm('taskDate', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Time <span className="text-rose-500">*</span></label>
                    <input type="time" value={form.taskTime} onChange={(e) => updateTaskForm('taskTime', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Description</label>
                  <textarea rows={4} value={form.description} onChange={(e) => updateTaskForm('description', e.target.value)} placeholder="Enter task related description or notes" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 resize-y focus:outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Priority <span className="text-rose-500">*</span></label>
                    <select value={form.priority} onChange={(e) => updateTaskForm('priority', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500">
                      {LEAD_TASK_PRIORITY_OPTIONS.map((priority) => (<option key={priority} value={priority}>{priority}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Status</label>
                    <select value={form.status} onChange={(e) => updateTaskForm('status', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500">
                      {LEAD_TASK_STATUS_OPTIONS.map((status) => (<option key={status} value={status}>{status}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">Assign To</label>
                  <select value={form.assignee} onChange={(e) => updateTaskForm('assignee', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500">
                    <option value="">Select Staff</option>
                    {assigneeOptions.map((name) => (<option key={name} value={name}>{name}</option>))}
                  </select>
                </div>
                {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}
              </div>
              <div className="flex items-center justify-end gap-2.5 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold">{editingId ? 'Update' : 'Create'}</button>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">© 2026 IMT Endoscopy</p>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/50" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-4 sm:p-5 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-slate-900">Delete this task?</h2>
            <p className="text-xs text-slate-500 mt-1">This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button type="button" onClick={() => setDeleteId(null)} className="btn-outline">Cancel</button>
              <button type="button" onClick={confirmDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {completeId && (
        <CompleteTaskModal
          open={Boolean(completeId)}
          task={tasks.find((t) => t.id === completeId) || null}
          lead={lead}
          onCancel={() => setCompleteId(null)}
          onComplete={submitCompleteTask}
          onSuccess={() => setCompleteId(null)}
        />
      )}
    </div>
  );
}

/**
 * The estimate / quotation forms on a lead page are for that lead, so the
 * Customer Account is not picked: it is the lead, shown read-only. A lead that
 * was converted keeps its lead link and is billed to its linked customer;
 * otherwise the lead's own details go on the document as a one-time party.
 */
function partyForLead(lead, customers) {
  if (lead?.party) {
    const customer = (customers || []).find((c) => String(c.id) === String(lead.party));
    return { customerId: lead.party, customer: customer?.name || lead.customerName || lead.name || '' };
  }
  return {
    customerId: '',
    customer: lead?.name || '',
    isOneTimeParty: true,
    partyName: lead?.name || '',
    partyType: 'Customer',
    partyPhone: lead?.phone || undefined,
    partyEmail: lead?.email || undefined,
  };
}

/** The lead a form is for, re-read from the server when the form opens. */
function useFormLead(lead) {
  const [formLead, setFormLead] = useState(lead);
  function refreshFormLead() {
    setFormLead(lead);
    if (!lead?.id) return;
    crmSync.pullOne('leads', lead.id).then((row) => { if (row) setFormLead(row); }).catch(() => {});
  }
  return [formLead || lead, refreshFormLead];
}

function LeadAccountField({ lead, customers }) {
  const customer = lead?.party
    ? (customers || []).find((c) => String(c.id) === String(lead.party))?.name || lead.customerName
    : null;
  return (
    <div>
      <span className="font-semibold text-slate-700 block mb-1">Customer Account *</span>
      <div className="w-full p-2 border border-slate-300 rounded bg-slate-50 text-slate-800 font-medium" aria-readonly="true">
        {lead?.name || 'This lead'}{lead?.company ? ` (${lead.company})` : ''} - Lead
      </div>
      {customer && (
        <p className="text-[11px] text-slate-500 mt-1">
          Linked customer: <span className="font-semibold text-slate-700">{customer}</span>
        </p>
      )}
    </div>
  );
}

function EstimatesTab({ lead, onCountsChange }) {
  const all = useEstimates();
  const { customers } = useERP() || {};
  const navigate = useNavigate();
  const linked = useMemo(() => all.filter((e) => estimateMatchesLead(e, lead)), [all, lead]);
  const storedProducts = useLeadDetailState(lead).products;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formLead, refreshFormLead] = useFormLead(lead);
  const [validUntil, setValidUntil] = useState('15 Days');
  const [lineItems, setLineItems] = useState([]);

  React.useEffect(() => {
    onCountsChange?.({ estimates: linked.length });
  }, [linked.length, onCountsChange]);

  function openCreateModal() {
    refreshFormLead();
    setValidUntil('15 Days');
    setLineItems((storedProducts || []).map((p, index) => ({
      id: `li-${Date.now()}-${index}`,
      description: p.name,
      qty: Number(p.qty) || 1,
      rate: Number(String(p.price || '').replace(/[^0-9]/g, '')) || 0,
      amount: (Number(String(p.price || '').replace(/[^0-9]/g, '')) || 0) * (Number(p.qty) || 1),
    })));
    setIsCreateOpen(true);
  }

  function handleCreateEstimate(event) {
    event.preventDefault();
    const party = partyForLead(formLead, customers);
    const total = (lineItems || []).reduce((sum, item) => sum + ((item.amount) || (Number(item.qty || 1) * Number(item.rate || 0))), 0);
    const created = {
      id: `est-${Date.now()}`,
      estimateNumber: `EST-${new Date().getFullYear()}-${String((all.length || 0) + 1).padStart(3, '0')}`,
      ...party,
      leadId: String(lead?.id || ''),
      leadName: lead?.name || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      validUntil: validUntil || '15 Days',
      amount: total,
      status: 'Draft',
      items: lineItems,
    };

    addEstimate(created);
    setIsCreateOpen(false);
    setLineItems([]);
  }

  function estimateTone(status) {
    if (status === 'Converted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Sent') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  }

  return (
    <div className="card">
      <div className="card-header flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0">
        <h3 className="font-bold text-sm">Estimates ({linked.length})</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate('/sales/estimates')} className="btn-outline btn-sm flex items-center gap-1.5">
            Open in Sales <ArrowRight size={13} />
          </button>
          <button type="button" onClick={openCreateModal} className="btn-primary btn-sm flex items-center gap-1.5">
            <Plus size={13} strokeWidth={2.4} /> New Estimate
          </button>
        </div>
      </div>
      <div className="table-scroll">
        <table className="data-table text-xs min-w-[640px] lg:min-w-0">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th>Estimate Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Valid Until</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ width: 80, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {linked.map((e, idx) => (
              <tr key={e.id}>
                <td className="text-slate-500 font-mono">{idx + 1}</td>
                <td>
                  <button type="button" onClick={() => navigate('/sales/estimates')} className="font-mono font-bold text-blue-600 hover:underline">
                    {e.estimateNumber}
                  </button>
                </td>
                <td className="font-semibold">{e.customer}</td>
                <td className="text-slate-500 text-xs whitespace-nowrap">{e.date}</td>
                <td className="text-slate-500 text-xs">{e.validUntil}</td>
                <td style={{ textAlign: 'right' }} className="font-bold font-mono">
                  ${(e.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${estimateTone(e.status)}`}>
                    {e.status}
                  </span>
                </td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button type="button" onClick={() => navigate('/sales/estimates')} className="p-1 rounded text-blue-600 hover:bg-blue-50 transition cursor-pointer" title="Open estimate in Sales">
                      <Eye size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {linked.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">No estimates for {lead?.name || 'this lead'} yet. Click New Estimate to create one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onClick={() => setIsCreateOpen(false)}>
          <div className="bg-white rounded-xl border border-slate-200 max-w-3xl w-full p-4 sm:p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Create Sales Estimate</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateEstimate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LeadAccountField lead={formLead} customers={customers} />
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Validity Period</label>
                  <input
                    type="text"
                    value={validUntil}
                    onChange={(event) => setValidUntil(event.target.value)}
                    placeholder="e.g. 15 Days"
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-2">Estimate Line Items</label>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="sales" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer">
                  Generate Estimate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function quotationMatchesLead(q, lead) {
  if (!q || !lead) return false;
  if (q.leadId && String(q.leadId) === String(lead.id)) return true;
  const company = String(lead.company || '').trim().toLowerCase();
  const customer = String(q.customer || '').trim().toLowerCase();
  if (company && customer && (customer === company || customer.includes(company) || company.includes(customer))) return true;
  const leadName = String(lead.name || '').trim().toLowerCase();
  const qLead = String(q.leadName || '').trim().toLowerCase();
  if (leadName && qLead && qLead === leadName) return true;
  return false;
}

function ActivityTab({ lead, items }) {
  const entries = items ?? [];
  const allEstimates = useEstimates();
  const { quotations } = useERP() || {};
  const linkedEstimates = (allEstimates || []).filter((e) => estimateMatchesLead(e, lead));
  const linkedQuotations = (quotations || []).filter((q) => quotationMatchesLead(q, lead));
  const systemEntries = [
    ...linkedEstimates.map((e) => ({ id: `sys-est-${e.id}`, title: `Estimate ${e.estimateNumber} • ${e.status}`, time: e.date || '', color: '#f59e0b' })),
    ...linkedQuotations.map((q) => ({ id: `sys-q-${q.id}`, title: `Quotation ${q.quoteNumber} • ${q.status}`, time: q.date || '', color: '#10b981' })),
  ];
  systemEntries.push(...linkedQuotations.flatMap(q => (q.activity || []).map(event => ({ id: event.id, title: `${q.quoteNumber} • ${event.type}`, time: event.timestamp, color: '#10b981' }))));
  const total = entries.length + systemEntries.length;
  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Activity Log ({total})</h3>
      {total === 0 && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>No activity recorded for this lead yet.</p>
      )}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
        {entries.map((item) => (
          <div key={item.id} className="relative flex items-start justify-between gap-4">
            <span
              className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center"
              style={{ background: item.color || '#3b82f6' }}
            />
            <div className="space-y-1">
              <strong className="text-xs font-bold block" style={{ color: 'var(--text)' }}>{item.title}</strong>
              {item.outcome && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Outcome: {item.outcome}
                  </span>
                  {item.nextAction && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Next: {item.nextAction}
                    </span>
                  )}
                  {item.employee && <span className="text-[10px] font-medium text-slate-500">by {item.employee}</span>}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <time className="text-[11px] font-mono block" style={{ color: 'var(--muted)' }}>{item.time}</time>
            </div>
          </div>
        ))}
        {systemEntries.map((item) => (
          <div key={item.id} className="relative flex items-start justify-between gap-4">
            <span
              className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center"
              style={{ background: item.color || '#3b82f6' }}
            />
            <div className="space-y-1">
              <strong className="text-xs font-bold block" style={{ color: 'var(--text)' }}>{item.title}</strong>
            </div>
            <div className="text-right shrink-0">
              <time className="text-[11px] font-mono block" style={{ color: 'var(--muted)' }}>{item.time}</time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Replaced: DiscussionNotesTab removed together with the Discussion & Notes tab.

// ── 2. General Tab ────────────────────────────────────────────
function GeneralTab({ lead, activities = [] }) {
  // Values for fields added in the Lead Create Form builder, under their
  // current labels (a field removed from every form is no longer shown).
  const storeForms = useCrmStore((s) => s.forms);
  const customRows = React.useMemo(() => {
    const fields = allCustomLeadFields();
    return Object.entries(lead.customValues || {})
      .filter(([id]) => fields.has(id))
      .map(([id, value]) => [fields.get(id).label, formatCustomValue(value)]);
    // storeForms: re-read the labels when a form changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.customValues, storeForms]);
  const nameParts = String(lead.name || '').trim().split(/\s+/).filter(Boolean);
  const phone = displayPhone(lead.phone);
  const infoRows = [
    ['Company', lead.company || '—'],
    ['First Name', nameParts[0] || '—'],
    ['Last Name', nameParts.slice(1).join(' ') || '—'],
    ['Title', lead.jobTitle || '—'],
    ['Email', lead.email || '—'],
    ['Phone', phone || '—'],
    ['Mobile', displayPhone(lead.mobile || lead.phone) || '—'],
    ['Lead Source', lead.source || '—'],
    ['Lead Status', lead.status || '—'],
    ['Industry', lead.industry || '—'],
    ['Annual Revenue', formatAmount(lead.amount)],
    ['Website', lead.website || '—'],
    ...customRows,
  ];

  const addressRows = [
    ['Address', lead.address || '—'],
    ['City', lead.city || '—'],
    ['State', lead.state || '—'],
    ['Country', lead.country || '—'],
    ['Zip Code', lead.zipCode || '—'],
  ];

  const recentActivities = (activities || []).slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-5">Lead Information</h3>
        <div className="space-y-3.5 text-xs">
          {infoRows.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-slate-400 font-normal shrink-0">{label}</span>
              <span className="text-slate-900 font-semibold text-right truncate min-w-0 lg:min-w-auto">{val}</span>
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
              <span className="text-slate-900 font-semibold text-right truncate min-w-0 lg:min-w-auto">{val}</span>
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
              className="btn-outline btn-sm"
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
            className="btn-outline btn-sm inline-flex items-center gap-1"
          >
            <Plus size={13} /> Add
          </button>
        </div>

        <div className="space-y-4">
          {recentActivities.length === 0 && (
            <p className="text-xs text-slate-400">No activity recorded for this lead yet.</p>
          )}
          {recentActivities.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: item.color || '#3b82f6' }}
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
  const initialState = useLeadDetailState(lead);
  const { users, products } = initialState;
  const { items = [] } = useERP() || {};
  const teamMembers = useCrmStore((s) => s.teamMembers);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [isEditCustomProduct, setIsEditCustomProduct] = useState(false);
  const [skuTouched, setSkuTouched] = useState(false);
  const [productDraft, setProductDraft] = useState({ itemId: '', name: '', sku: '', price: '', qty: 1, status: 'Active', image: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All Users');
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState('All Products');

  const sortedInventoryItems = useMemo(() => {
    return [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [items]);

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

  const availableEmployees = useMemo(() => {
    const assignedIds = new Set(users.map((u) => u.userId || u.id));
    const assignedNames = new Set(users.map((u) => (u.name || '').toLowerCase().trim()));
    const seen = new Set();
    const result = [];
    (teamMembers || []).forEach((member) => {
      if (!member?.id || seen.has(member.id)) return;
      seen.add(member.id);
      if (assignedIds.has(member.id)) return;
      if (member.name && assignedNames.has(member.name.toLowerCase().trim())) return;
      result.push(member);
    });
    return result;
  }, [teamMembers, users]);

  React.useEffect(() => {
    onCountsChange?.({ users: users.length, products: products.length });
  }, [users.length, products.length, onCountsChange]);

  function addUser() {
    const employee = teamMembers.find((item) => item.id === selectedEmployeeId);
    if (!employee) return;
    // `userId` is the employee's account; the row id is the server's.
    leadDetailWrite(lead.id, 'add', 'users', {
      userId: employee.id,
      role: employee.designation || employee.role || 'Staff',
    }, onActivity).then((saved) => {
      if (saved) onActivity?.(`${employee.name} assigned to lead`, '#10b981');
    });
    setSelectedEmployeeId('');
    setIsAddUserOpen(false);
  }

  function deleteUser(id) {
    const target = users.find((u) => u.id === id);
    leadDetailWrite(lead.id, 'remove', 'users', { id }, onActivity).then((done) => {
      if (done) onActivity?.(`User "${target?.name ?? 'entry'}" removed`, '#f59e0b');
    });
  }

  function addProduct() {
    if (!productDraft.name.trim() || !productDraft.sku.trim() || !productDraft.price || Number(productDraft.qty) < 1) return;
    const added = {
      itemId: productDraft.itemId || undefined,
      name: productDraft.name.trim(),
      sku: productDraft.sku.trim().toUpperCase(),
      price: Number(productDraft.price),
      qty: Number(productDraft.qty),
      status: productDraft.status,
      image: productDraft.image || undefined,
    };
    leadDetailWrite(lead.id, 'add', 'products', added, onActivity).then((saved) => {
      if (saved) onActivity?.(`Product "${added.name}" added`, '#ec4899');
    });
    setProductDraft({ itemId: '', name: '', sku: '', price: '', qty: 1, status: 'Active', image: '' });
    setIsCustomProduct(false);
    setSkuTouched(false);
    setIsAddProductOpen(false);
  }

  function openEditProduct(product) {
    const matchedItem = items.find((i) => (product.itemId && String(i.id) === String(product.itemId)) || (i.name && i.name.toLowerCase() === (product.name || '').toLowerCase()));
    setIsEditCustomProduct(!matchedItem && !!product.name);
    setEditingProduct({
      id: product.id,
      itemId: product.itemId || matchedItem?.id || '',
      name: product.name || '',
      sku: product.sku || matchedItem?.sku || '',
      price: String(product.price || '').replace(/[^0-9.]/g, '') || (matchedItem?.sellingPrice ? String(matchedItem.sellingPrice) : ''),
      qty: product.qty || 1,
      status: product.status || 'Active',
      image: product.image || matchedItem?.image || matchedItem?.imageUrl || '',
    });
  }

  function saveEditProduct() {
    if (!editingProduct) return;
    if (!editingProduct.name.trim() || !editingProduct.sku.trim() || !editingProduct.price || Number(editingProduct.qty) < 1) return;
    const changes = {
      id: editingProduct.id,
      itemId: editingProduct.itemId || undefined,
      name: editingProduct.name.trim(),
      sku: editingProduct.sku.trim().toUpperCase(),
      price: Number(editingProduct.price),
      qty: Number(editingProduct.qty),
      status: editingProduct.status,
      image: editingProduct.image || undefined,
    };
    leadDetailWrite(lead.id, 'update', 'products', changes, onActivity).then((saved) => {
      if (saved) onActivity?.(`Product "${changes.name}" updated`, '#3b82f6');
    });
    setEditingProduct(null);
  }

  function deleteProduct(id) {
    const target = products.find((p) => p.id === id);
    leadDetailWrite(lead.id, 'remove', 'products', { id }, onActivity).then((done) => {
      if (done) onActivity?.(`Product "${target?.name ?? 'entry'}" removed`, '#f59e0b');
    });
  }

  async function handleProductImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = await readFileAsDataUrl(file);
    setProductDraft((current) => ({ ...current, image }));
  }

  async function handleEditProductImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = await readFileAsDataUrl(file);
    setEditingProduct((current) => (current ? { ...current, image } : current));
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
            className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} /> Add User
          </button>
        </div>

        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/30 flex items-center justify-center p-2 sm:p-4" onClick={() => setIsAddUserOpen(false)}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md p-4 sm:p-5 max-h-[95vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
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
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 h-9 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  {availableEmployees.length === 0 ? (
                    <option value="">All employees are already added</option>
                  ) : (
                    availableEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} · {employee.designation || employee.role || 'Staff'} · {employee.department || 'General'}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <div className="flex justify-end gap-2 mt-5">
                <button type="button" className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold disabled:opacity-50" onClick={addUser} disabled={!selectedEmployeeId}>
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
          <table className="w-full min-w-[560px] lg:min-w-0 text-left text-xs">
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
            onClick={() => {
              setProductDraft({ itemId: '', name: '', sku: '', price: '', qty: 1, status: 'Active', image: '' });
              setIsCustomProduct(false);
              setSkuTouched(false);
              setIsAddProductOpen(true);
            }}
            className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>

        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/30 flex items-center justify-center p-2 sm:p-4" onClick={() => setIsAddProductOpen(false)}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg p-4 sm:p-5 max-h-[95vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Add Product</h4>
                  <p className="text-xs text-slate-500 mt-1">Enter the product details for this lead.</p>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-700 text-lg" onClick={() => setIsAddProductOpen(false)} aria-label="Close add product dialog">×</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Product Name</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomProduct((prev) => !prev)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      {isCustomProduct ? '← Choose from inventory' : '+ Enter custom product'}
                    </button>
                  </div>
                  {!isCustomProduct ? (
                    <select
                      value={productDraft.itemId || ''}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val === '__custom__') {
                          setIsCustomProduct(true);
                          return;
                        }
                        const item = items.find((i) => String(i.id) === String(val));
                        if (item) {
                          const itemImg = item.image || item.imageUrl || '';
                          const rawPrice = item.sellingPrice ?? item.selling_price ?? item.price ?? item.costPrice ?? item.cost_price ?? '';
                          setProductDraft((current) => ({
                            ...current,
                            itemId: item.id,
                            name: item.name,
                            sku: item.sku || current.sku,
                            price: rawPrice !== '' && rawPrice != null ? String(rawPrice) : current.price,
                            image: itemImg || current.image,
                          }));
                          setSkuTouched(true);
                        } else {
                          setProductDraft((current) => ({
                            ...current,
                            itemId: '',
                            name: '',
                            sku: '',
                            price: '',
                            image: '',
                          }));
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                      autoFocus
                    >
                      <option value="">Select a product from inventory...</option>
                      {sortedInventoryItems.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} {it.sku ? `(${it.sku})` : ''} {it.sellingPrice ? `- ₹${Number(it.sellingPrice).toLocaleString('en-IN')}` : ''}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter custom product...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={productDraft.name}
                      onChange={(event) => {
                        const newName = event.target.value;
                        setProductDraft((current) => ({
                          ...current,
                          name: newName,
                          itemId: '',
                          sku: skuTouched ? current.sku : generateProductSku(newName, products),
                        }));
                      }}
                      placeholder="Enter product name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                  )}
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Product Image</label>
                    {productDraft.image && (
                      <button
                        type="button"
                        onClick={() => setProductDraft((current) => ({ ...current, image: '' }))}
                        className="text-[11px] text-rose-500 hover:text-rose-600 font-normal cursor-pointer"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageChange}
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-700"
                  />
                  {productDraft.image && (
                    <div className="mt-3 flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <img
                        src={resolveFileUrl(productDraft.image)}
                        alt="Product preview"
                        className="h-16 w-16 rounded-lg border border-slate-200 object-cover bg-white shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        {productDraft.itemId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Automatically fetched from inventory
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600 font-medium">Custom image selected</span>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">Choose a file to replace or click Remove Image.</p>
                      </div>
                    </div>
                  )}
                </div>

                <label className="text-xs font-semibold text-slate-700">
                  SKU
                  <input
                    type="text"
                    value={productDraft.sku}
                    onChange={(event) => {
                      setSkuTouched(true);
                      setProductDraft((current) => ({ ...current, sku: event.target.value }));
                    }}
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
                <button type="button" className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold" onClick={() => setIsAddProductOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold disabled:opacity-50"
                  onClick={addProduct}
                  disabled={!productDraft.name.trim() || !productDraft.sku.trim() || !productDraft.price || Number(productDraft.qty) < 1}
                >
                  Add Product
                </button>
              </div>
            </div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 z-50 bg-slate-950/30 flex items-center justify-center p-2 sm:p-4" onClick={() => setEditingProduct(null)}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg p-4 sm:p-5 max-h-[95vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Edit Product</h4>
                  <p className="text-xs text-slate-500 mt-1">Update the product details for this lead.</p>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-700 text-lg" onClick={() => setEditingProduct(null)} aria-label="Close edit product dialog">×</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Product Name</label>
                    <button
                      type="button"
                      onClick={() => setIsEditCustomProduct((prev) => !prev)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      {isEditCustomProduct ? '← Choose from inventory' : '+ Enter custom product'}
                    </button>
                  </div>
                  {!isEditCustomProduct ? (
                    <select
                      value={editingProduct.itemId || ''}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val === '__custom__') {
                          setIsEditCustomProduct(true);
                          return;
                        }
                        const item = items.find((i) => String(i.id) === String(val));
                        if (item) {
                          const itemImg = item.image || item.imageUrl || '';
                          const rawPrice = item.sellingPrice ?? item.selling_price ?? item.price ?? item.costPrice ?? item.cost_price ?? '';
                          setEditingProduct((current) => (current ? {
                            ...current,
                            itemId: item.id,
                            name: item.name,
                            sku: item.sku || current.sku,
                            price: rawPrice !== '' && rawPrice != null ? String(rawPrice) : current.price,
                            image: itemImg || current.image,
                          } : current));
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                      autoFocus
                    >
                      <option value="">Select a product from inventory...</option>
                      {sortedInventoryItems.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} {it.sku ? `(${it.sku})` : ''} {it.sellingPrice ? `- ₹${Number(it.sellingPrice).toLocaleString('en-IN')}` : ''}
                        </option>
                      ))}
                      <option value="__custom__">+ Enter custom product...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(event) => setEditingProduct((current) => (current ? { ...current, name: event.target.value } : current))}
                      placeholder="Enter product name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                  )}
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Product Image</label>
                    {editingProduct.image && (
                      <button
                        type="button"
                        onClick={() => setEditingProduct((current) => (current ? { ...current, image: '' } : current))}
                        className="text-[11px] text-rose-500 hover:text-rose-600 font-normal cursor-pointer"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditProductImageChange}
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-700"
                  />
                  {editingProduct.image && (
                    <div className="mt-3 flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <img
                        src={resolveFileUrl(editingProduct.image)}
                        alt="Product preview"
                        className="h-16 w-16 rounded-lg border border-slate-200 object-cover bg-white shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        {editingProduct.itemId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Automatically fetched from inventory
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600 font-medium">Custom image selected</span>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">Choose a file to replace or click Remove Image.</p>
                      </div>
                    </div>
                  )}
                </div>

                <label className="text-xs font-semibold text-slate-700">
                  SKU
                  <input
                    type="text"
                    value={editingProduct.sku}
                    onChange={(event) => setEditingProduct((current) => (current ? { ...current, sku: event.target.value } : current))}
                    placeholder="e.g. PRD-001"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Price
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.price}
                    onChange={(event) => setEditingProduct((current) => (current ? { ...current, price: event.target.value } : current))}
                    placeholder="Enter price"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={editingProduct.qty}
                    onChange={(event) => setEditingProduct((current) => (current ? { ...current, qty: event.target.value } : current))}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Status
                  <select
                    value={editingProduct.status}
                    onChange={(event) => setEditingProduct((current) => (current ? { ...current, status: event.target.value } : current))}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold disabled:opacity-50"
                  onClick={saveEditProduct}
                  disabled={!editingProduct.name.trim() || !editingProduct.sku.trim() || !editingProduct.price || Number(editingProduct.qty) < 1}
                >
                  Save Changes
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
          <table className="w-full min-w-[560px] lg:min-w-0 text-left text-xs">
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
              {filteredProducts.map((p, idx) => {
                const matchedInv = items.find(
                  (it) =>
                    (p.itemId && String(it.id) === String(p.itemId)) ||
                    (p.sku && String(it.sku).toLowerCase() === String(p.sku).toLowerCase()) ||
                    (p.name && String(it.name).toLowerCase() === String(p.name).toLowerCase())
                );
                const displayImage = p.image || matchedInv?.image || matchedInv?.imageUrl;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-2 text-slate-400 font-normal">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-blue-100/70 border border-blue-200/50 flex items-center justify-center shrink-0 overflow-hidden">
                          {displayImage ? (
                            <img src={resolveFileUrl(displayImage)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-2.5 h-2.5 bg-slate-700 rounded-[2px]" />
                          )}
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
                        onClick={() => openEditProduct(p)}
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
              );
            })}
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
  const [viewLead, setViewLead] = useState(lead);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const storedDetailState = useLeadDetailState(lead);
  const storeLeads = useCrmStore((s) => s.leads);
  const storeStages = useCrmStore((s) => s.stages);
  const storeSources = useCrmStore((s) => s.sources);
  const storeMembers = useCrmStore((s) => s.teamMembers);
  const [activeTab, setActiveTab] = useState('Users & Products');
  const { addCustomer, showToast } = useERP() || {};
  const [isConverted, setIsConverted] = useState(lead?.status === 'Converted');
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    setViewLead(lead);
    setIsConverted(lead?.status === 'Converted');
  }, [lead]);
  const [detailCounts, setDetailCounts] = useState(() => ({
    users: storedDetailState.users.length,
    products: storedDetailState.products.length,
    sources: storedDetailState.sources.length,
    files: storedDetailState.files.length,
    openTasks: (storedDetailState.tasks || []).filter((t) => t.status !== 'Completed').length || lead?.openTasksCount || 0,
    calls: (storedDetailState.calls || []).length,
    estimates: lead?.estimatesCount ?? 0,
    challans: lead?.deliveryChallansCount ?? 0,
  }));
  const [activities, setActivities] = useState(() => storedDetailState.activities || []);
  const [convertedDeal, setConvertedDeal] = useState(() => findDealForLead(lead?.id));

  const logActivity = React.useCallback((title, color) => {
    if (!title) return;
    const entry = { id: `act-${Date.now()}`, title, time: 'Just now', color: color || '#3b82f6' };
    // The server records the activity from the change itself; this shows it
    // immediately, and the next read of the timeline confirms it.
    setActivities((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
  }, [viewLead?.id, lead?.id]);

  const updateDetailCounts = React.useCallback((counts) => {
    setDetailCounts((current) => ({ ...current, ...counts }));
  }, []);

  // Display-only counters for the list: patched into the store row locally.
  // Sending them to the server made a PATCH every time a lead was opened.
  // The stage (`status`) is the server's: writing this view's copy back made
  // the row and the view overwrite each other forever once the server moved
  // the lead (e.g. a completed task taking it to Lost).
  React.useEffect(() => {
    patchLeadRowLocally(viewLead?.id ?? lead?.id, {
      ...(isConverted ? { status: 'Converted' } : {}),
      productsCount: detailCounts.products,
      sourcesCount: detailCounts.sources,
      filesCount: detailCounts.files,
      openTasksCount: detailCounts.openTasks,
      callsCount: detailCounts.calls,
      estimatesCount: detailCounts.estimates,
      deliveryChallansCount: detailCounts.challans,
    });
  }, [viewLead?.id, lead?.id, isConverted, detailCounts]);

  // The lead row and its sections both live in the CRM stores now, so this only
  // has to react to them rather than re-reading a browser cache.
  React.useEffect(() => {
    const target = viewLead ?? lead;
    if (!target?.id) return;
    const freshLead = storeLeads.find((row) => String(row.id) === String(target.id));
    if (freshLead) {
      setViewLead((current) => (
        JSON.stringify(current) === JSON.stringify(freshLead) ? current : freshLead
      ));
    }
    setConvertedDeal(findDealForLead(target.id));

    const incoming = storedDetailState.activities || [];
    setActivities((current) => {
      if (JSON.stringify(incoming) === JSON.stringify(current)) return current;
      const seen = new Map(current.map((a) => [a.id, a]));
      incoming.forEach((a) => seen.set(a.id, a));
      return Array.from(seen.values());
    });

    const openTasks = (storedDetailState.tasks || []).filter((t) => t.status !== 'Completed').length;
    setDetailCounts((current) => (current.openTasks === openTasks ? current : { ...current, openTasks }));
  }, [viewLead, lead, storeLeads, storedDetailState]);

  // The Leads list's "Edit Lead Information" lands here with `?edit=1`; open
  // the dialog once and drop the flag so a reload does not reopen it.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('edit') !== '1' || !(viewLead ?? lead)) return;
    openEditLead();
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
  }, [searchParams, viewLead, lead]);

  function openEditLead() {
    const source = viewLead ?? lead;
    if (!source) return;
    if (!storeStages || storeStages.length === 0) {
      useCrmStore.getState().hydrate();
    }
    setEditForm({
      name: source.name ?? '',
      company: source.company ?? '',
      email: source.email ?? '',
      phone: source.phone ?? '',
      source: source.source ?? '',
      status: isConverted ? 'Converted' : (source.status ?? ''),
      owner: source.owner ?? '',
      jobTitle: source.jobTitle ?? '',
      industry: source.industry ?? '',
      city: source.city ?? '',
      state: source.state ?? '',
      country: source.country ?? '',
      zipCode: source.zipCode ?? '',
      amount: source.amount ?? '',
      leadNumber: source.leadNumber ?? '',
      createdOn: source.createdOn ?? '',
      customValues: { ...(source.customValues || {}) },
    });
    setIsEditOpen(true);
  }

  function updateEditField(field, value) {
    setEditForm((current) => (current ? { ...current, [field]: value } : current));
  }

  function saveEditedLead() {
    if (!editForm) return;
    const targetId = viewLead?.id ?? lead?.id;
    if (!targetId) return;
    const trimmedName = String(editForm.name ?? '').trim();
    if (!trimmedName) {
      showToast?.('Lead name is required.');
      return;
    }

    const trimmedEmail = String(editForm.email ?? '').trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showToast?.('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    const trimmedPhone = String(editForm.phone ?? '').trim();
    if (trimmedPhone) {
      const digits = trimmedPhone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        showToast?.('Phone number must contain between 10 and 15 digits.');
        return;
      }
    }

    const updates = {
      name: trimmedName,
      company: String(editForm.company ?? '').trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      source: String(editForm.source ?? '').trim(),
      status: String(editForm.status ?? '').trim() || viewLead?.status || lead?.status,
      owner: String(editForm.owner ?? '').trim(),
      jobTitle: String(editForm.jobTitle ?? '').trim(),
      industry: String(editForm.industry ?? '').trim(),
      city: String(editForm.city ?? '').trim(),
      state: String(editForm.state ?? '').trim(),
      country: String(editForm.country ?? '').trim(),
      zipCode: String(editForm.zipCode ?? '').trim(),
      amount: editForm.amount === '' ? 0 : Number(editForm.amount) || 0,
      leadNumber: String(editForm.leadNumber ?? '').trim(),
      createdOn: String(editForm.createdOn ?? '').trim(),
      customValues: editForm.customValues || {},
    };
    const missing = missingRequiredField(customLeadFields(activeLeadForm()), updates.customValues);
    if (missing) {
      showToast?.(`${missing.label} is required.`);
      return;
    }
    const prevStatus = viewLead?.status ?? lead?.status;
    const allStages = storeStages?.length ? storeStages : (useCrmStore.getState().stages || []);
    const allSources = storeSources?.length ? storeSources : (useCrmStore.getState().sources || []);
    const allMembers = storeMembers?.length ? storeMembers : (useCrmStore.getState().teamMembers || []);

    const byName = (rows, name) => (rows || []).find((r) => String(r.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase());
    const stage = updates.status !== 'Converted' ? byName(allStages, updates.status) : null;
    if (stage) {
      updates.stageId = stage.id;
    } else if (updates.status !== 'Converted' && (viewLead?.stageId || lead?.stageId)) {
      updates.stageId = viewLead?.stageId || lead?.stageId;
    }

    if (updates.source) {
      const src = byName(allSources, updates.source);
      if (src) updates.sourceId = src.id;
    } else {
      updates.sourceId = null;
    }

    if (updates.owner) {
      const own = byName(allMembers, updates.owner);
      if (own) updates.ownerId = own.id;
    } else {
      updates.ownerId = null;
    }
    const stageChanged = Boolean(stage) && updates.status !== prevStatus;

    useCrmStore.getState().updateLead(targetId, updates)
      .then((saved) => {
        setViewLead((current) => ({ ...(current ?? lead), ...updates, ...(saved || {}) }));
        if (stageChanged) {
          runLeadStageAutomation({ ...(viewLead ?? lead), ...updates, ...(saved || {}) }, updates.status, { previousStage: prevStatus });
        }
        if (updates.status === 'Converted') {
          setIsConverted(true);
        } else if (isConverted && updates.status !== 'Converted') {
          setIsConverted(false);
        }
        setIsEditOpen(false);
        setEditForm(null);
        logActivity(`Lead information updated`, '#10b981');
        showToast?.(`Lead "${updates.name}" updated.`);
      })
      .catch((err) => {
        console.error('[CRM Lead Edit] Failed to save lead:', err);
        showToast?.(`Lead not saved — ${describeError(err)}`);
      });
  }

  function exportLead(format) {
    const effectiveLead = viewLead ?? lead;
    const filename = `${String(effectiveLead.name || 'lead').replace(/\s+/g, '_')}_details`;
    if (format === 'CSV') {
      exportToCSV(filename, ['Field', 'Value'], leadExportRows(effectiveLead));
    }
    if (format === 'Excel') {
      downloadLeadAsExcel(effectiveLead);
    }
    if (format === 'PDF') {
      printLeadAsPdf(effectiveLead);
    }
    setIsExportOpen(false);
  }

  if (!viewLead && !lead) return null;
  const activeLeadData = viewLead ?? lead;

  const metrics = [
    { label: 'Products', value: detailCounts.products, icon: ShoppingBag, color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Source', value: detailCounts.sources, icon: Globe, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Files', value: detailCounts.files, icon: FileStack, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Open Tasks', value: detailCounts.openTasks, icon: ListChecks, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Estimates', value: detailCounts.estimates, icon: Receipt, color: '#06b6d4', bg: '#ecfeff' },
  ];

  const handleConvert = () => {
    if (isConverted) {
      showToast?.('Lead is already converted to an active Customer.');
      return;
    }
    addCustomer?.({
      name: activeLeadData.company || activeLeadData.name,
      contactPerson: activeLeadData.name,
      email: activeLeadData.email,
      phone: displayPhone(activeLeadData.phone),
      balance: 0,
      status: 'Active',
    });
    setIsConverted(true);
    showToast?.(`Lead "${activeLeadData.name}" converted to Customer.`);
  };

  const displayName = activeLeadData.name || 'Untitled Lead';
  const headerPhone = displayPhone(activeLeadData.phone);
  const headerLocation = [activeLeadData.city, activeLeadData.state, activeLeadData.country].filter(Boolean).join(', ');

  return (
    <div className="space-y-4">
      <div className="card p-3 text-xs text-slate-600">
        {convertedDeal ? <>Converted to Deal: {convertedDeal.id} <Link className="ml-2 text-blue-600 hover:underline" to={`/crm/deals?deal=${encodeURIComponent(convertedDeal.id)}`}>View Deal</Link></> : 'Not converted / No Deal'}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 min-w-0 lg:min-w-auto text-xs font-medium text-slate-500">
          <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
          <span className="text-slate-300">&gt;</span>
          <Link to="/crm/leads" className="text-blue-600 hover:underline">Leads</Link>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-900 font-semibold">{displayName}</span>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToLeads}
            className="btn-outline h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={13} className="text-slate-500" /> Back
          </button>
          <button
            type="button"
            onClick={openEditLead}
            className="btn-outline h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Pencil size={13} className="text-slate-500" /> Edit
          </button>
          <button
            type="button"
            onClick={handleConvert}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer ${
              isConverted
                ? 'btn-primary !bg-emerald-600 hover:!bg-emerald-700 text-white'
                : 'btn-outline text-[#1f6bff] border-[#1f6bff]/30 hover:bg-[#1f6bff]/5'
            }`}
          >
            <CheckCircle size={13} /> {isConverted ? 'Converted' : 'Convert'}
          </button>
          <button
            type="button"
            className="btn-outline h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            onClick={() => setIsExportOpen(true)}
          >
            <Printer size={13} className="text-slate-500" /> Print
          </button>
        </div>
      </div>

      {isExportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/30 flex items-center justify-center p-2 sm:p-4" onClick={() => setIsExportOpen(false)}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm p-4 sm:p-5 max-h-[95vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
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
          <div className="flex items-center gap-4 min-w-0 lg:min-w-auto">
            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-xs border border-slate-100 ring-2 ring-slate-50">
              {activeLeadData.photo ? (
                <img
                  src={activeLeadData.photo}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: activeLeadData.avatarColor || '#2F6FED' }}>
                  {getInitials(displayName)}
                </span>
              )}
            </div>
            <div className="space-y-1 min-w-0 lg:min-w-auto">
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight break-words">{displayName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {isConverted ? 'Converted' : (activeLeadData.status || '—')}
                </span>
              </div>
              {activeLeadData.company && <p className="text-xs text-slate-500 font-medium">{activeLeadData.company}</p>}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                {headerPhone && <span className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /> {headerPhone}</span>}
                {activeLeadData.email && <span className="flex items-center gap-1.5 min-w-0 lg:min-w-auto break-all"><Mail size={13} className="text-slate-400 shrink-0 lg:shrink" /> {activeLeadData.email}</span>}
                {headerLocation && <span className="flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {headerLocation}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-8">
            <div>
              <span className="text-[11px] text-slate-400 block font-normal mb-1">Lead Number</span>
              <strong className="text-xs font-bold text-slate-900 font-mono">{activeLeadData.leadNumber || '—'}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-normal mb-1">Source</span>
              <strong className="text-xs font-bold text-slate-900">{activeLeadData.source || '—'}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-normal mb-1">Created On</span>
              <strong className="text-xs font-bold text-slate-900">{activeLeadData.createdOn || '—'}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map((m, index) => (
          <CrmKpiCard key={m.label} label={m.label} value={m.value} icon={m.icon} tone={['rose', 'emerald', 'purple', 'amber', 'teal', 'orange'][index]} />
        ))}
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
              className={`inline-flex shrink-0 lg:shrink items-center gap-1.5 px-3.5 h-9 whitespace-nowrap rounded-xl text-xs font-semibold transition cursor-pointer focus:outline-none ${
                isActive
                  ? 'btn-primary text-white shadow-xs'
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
      {activeTab === 'Sources & Emails' && <SourcesAndEmailsTab lead={activeLeadData} onCountsChange={updateDetailCounts} onActivity={logActivity} />}
      {activeTab === 'General' && <GeneralTab lead={activeLeadData} activities={activities} />}
      {activeTab === 'Users & Products' && <UsersProductsTab lead={activeLeadData} onCountsChange={updateDetailCounts} onActivity={logActivity} />}
      {activeTab === 'Files' && <FilesTab lead={activeLeadData} onCountsChange={updateDetailCounts} onActivity={logActivity} />}
      {activeTab === 'Tasks' && <LeadTasksTab lead={activeLeadData} onCountsChange={updateDetailCounts} onActivity={logActivity} />}
      {activeTab === 'Estimates' && <EstimatesTab lead={activeLeadData} onCountsChange={updateDetailCounts} />}
      {activeTab === 'Activity' && <ActivityTab lead={activeLeadData} items={activities} />}
      {!['Sources & Emails', 'General', 'Users & Products', 'Files', 'Tasks', 'Estimates', 'Activity'].includes(activeTab) && (
        <div className="card p-8 text-center space-y-2">
          <Info size={28} className="text-blue-500 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{activeTab} Details</h4>
          <p className="text-xs text-slate-400">
            Real-time synchronization for {activeTab.toLowerCase()} associated with {activeLeadData.name}.
          </p>
        </div>
      )}

      {isEditOpen && editForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/30 flex items-center justify-center p-2 sm:p-4" onClick={() => { setIsEditOpen(false); setEditForm(null); }}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit lead information">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Edit Lead Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">Update the lead details below</p>
              </div>
              <button type="button" className="text-slate-400 hover:text-slate-700 text-xl leading-none" onClick={() => { setIsEditOpen(false); setEditForm(null); }} aria-label="Close edit lead dialog">×</button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Lead Name *
                <input className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.name} onChange={(e) => updateEditField('name', e.target.value)} placeholder="Enter lead name" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Company
                <input className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.company} onChange={(e) => updateEditField('company', e.target.value)} placeholder="Enter company name" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Email
                <input type="email" className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.email} onChange={(e) => updateEditField('email', e.target.value)} placeholder="Enter email address" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Phone
                <input className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.phone} onChange={(e) => updateEditField('phone', e.target.value)} placeholder="Enter phone number" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Lead Source
                <select className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400 bg-white" value={editForm.source} onChange={(e) => updateEditField('source', e.target.value)}>
                  <option value="">Select source</option>
                  {Array.from(new Set([editForm.source, ...storeSources.map((s) => s.name)].filter(Boolean))).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Lead Status
                <select className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400 bg-white" value={editForm.status} onChange={(e) => updateEditField('status', e.target.value)}>
                  {Array.from(new Set([editForm.status, ...getLeadStageOrder()].filter(Boolean))).map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Lead Owner
                <select className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400 bg-white" value={editForm.owner} onChange={(e) => updateEditField('owner', e.target.value)}>
                  <option value="">Select user</option>
                  {Array.from(new Set([editForm.owner, ...storeMembers.map((m) => m.name)].filter(Boolean))).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Title
                <input className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.jobTitle} onChange={(e) => updateEditField('jobTitle', e.target.value)} placeholder="Enter title" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Industry
                <input className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.industry} onChange={(e) => updateEditField('industry', e.target.value)} placeholder="Enter industry" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Lead Number
                <input readOnly disabled className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-500 bg-slate-50 cursor-not-allowed outline-none" value={editForm.leadNumber} placeholder="Auto-generated" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                City
                <input className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.city} onChange={(e) => updateEditField('city', e.target.value)} placeholder="Enter city" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                State
                <input className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.state} onChange={(e) => updateEditField('state', e.target.value)} placeholder="Enter state" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Country
                <input className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.country} onChange={(e) => updateEditField('country', e.target.value)} placeholder="Enter country" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Zip Code
                <input className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.zipCode} onChange={(e) => updateEditField('zipCode', e.target.value)} placeholder="Enter zip code" />
              </label>
              {customLeadFields(activeLeadForm()).map((field) => (
                <label key={field.id} htmlFor={`custom-${field.id}`} className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  {field.label}{field.required ? ' *' : ''}
                  <CustomLeadFieldInput
                    field={field}
                    value={editForm.customValues?.[field.id]}
                    users={storeMembers}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400 bg-white"
                    onChange={(value) => updateEditField('customValues', { ...(editForm.customValues || {}), [field.id]: value })}
                  />
                </label>
              ))}
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Annual Revenue / Amount
                <input type="number" className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-blue-400" value={editForm.amount} onChange={(e) => updateEditField('amount', e.target.value)} placeholder="Enter amount" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 sm:col-span-2">
                Created On
                <input readOnly disabled className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-500 bg-slate-50 cursor-not-allowed outline-none" value={editForm.createdOn} placeholder="Auto-generated" />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-xl">
              <button type="button" className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold" onClick={() => { setIsEditOpen(false); setEditForm(null); }}>
                Cancel
              </button>
              <button type="button" className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold" onClick={saveEditedLead}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


