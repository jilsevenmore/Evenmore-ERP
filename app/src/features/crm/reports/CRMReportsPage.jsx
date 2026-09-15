import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Printer,
  RefreshCw,
  LayoutDashboard,
  Users,
  Globe,
  Layers,
  Trophy,
  Percent,
  Clock,
  AlertTriangle,
  DollarSign,
  UserPlus,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { exportToCSV } from '../../../services/exportUtils';
import { getLeadStageOrder, DEFAULT_STAGE_ORDER, loadLeadRows } from '../../../services/taskCompletionService';
import { loadCrmTasks, LEADS_STORAGE_KEY, CRM_EVENT } from '../../../services/leadStageAutomation';
import { leads as seedLeads } from '../../../data/crm/mockLeads';

const DEALS_STORAGE_KEY = 'crm-deals-v1';

const SEED_DEALS = [
  { id: 'dl-1', name: 'amitbhai_001', client: 'Amit Bhai', product: 'Product A', price: 100000, stage: 'Draft', source: 'Website', assignedUser: 'Mr. Kamlesh Dhumadiya', createdAt: '2026-05-10T10:00:00' },
  { id: 'dl-2', name: 'Rohit', client: 'Rohit Sharma', product: 'Product B', price: 500000, stage: 'Draft', source: 'Referral', assignedUser: 'Jayesh Nair', createdAt: '2026-05-12T10:00:00' },
  { id: 'dl-3', name: 'Deal Alpha', client: 'Alpha Corp', product: 'Product A', price: 750000, stage: 'Draft', source: 'Cold Call', assignedUser: 'Anuska', createdAt: '2026-04-08T10:00:00' },
  { id: 'dl-4', name: 'Deal Beta', client: 'Beta Ltd', product: 'Service C', price: 1200000, stage: 'Draft', source: 'Website', assignedUser: 'Mr. Kamlesh Dhumadiya', createdAt: '2026-03-15T10:00:00' },
  { id: 'dl-5', name: 'Deal Gamma', client: 'Gamma Inc', product: 'Product B', price: 1500000, stage: 'Draft', source: 'Referral', assignedUser: 'Jayesh Nair', createdAt: '2026-02-20T10:00:00' },
  { id: 'dl-6', name: 'Deal Delta', client: 'Delta Co', product: 'Product A', price: 11123, stage: 'Draft', source: 'Website', assignedUser: 'Anuska', createdAt: '2026-01-11T10:00:00' },
];

function readRows(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function formatINR(value) {
  const n = Number(value) || 0;
  return 'Rs ' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatPct(value) {
  return (Number(value) || 0).toFixed(1) + '%';
}

function dueDay(task) {
  return String(task.dueDate || task.dueAt || '').slice(0, 10);
}

function isPastDay(dateStr) {
  if (!dateStr) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10) < new Date().toISOString().slice(0, 10);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(dateStr);
  if (match) return `${match[3]}-${match[2]}-${match[1]}` < new Date().toISOString().slice(0, 10);
  return false;
}

function daysOverdue(dateStr) {
  if (!dateStr) return 0;
  let iso = dateStr;
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) iso = iso.slice(0, 10);
  else {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(iso);
    if (match) iso = `${match[3]}-${match[2]}-${match[1]}`;
  }
  const diff = (new Date().toISOString().slice(0, 10)) > iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 0;
  return diff > 0 ? diff : 0;
}

function groupRows(list, keyFn, valueFn) {
  const map = new Map();
  list.forEach((item) => {
    const name = keyFn(item) || 'Unassigned';
    const current = map.get(name) || { name, count: 0, value: 0 };
    current.count += 1;
    current.value += valueFn(item);
    map.set(name, current);
  });
  return Array.from(map.values());
}

function isRightAlignedHeader(header) {
  if (!header) return false;
  const h = String(header).trim().toLowerCase();
  return ['value', 'lead count', 'leads', 'pipeline value', 'share %', 'deals', 'price', 'amount', 'days overdue', 'metric value'].some((k) => h.includes(k));
}

function isRightAlignedCell(cell, header) {
  if (isRightAlignedHeader(header)) return true;
  if (typeof cell === 'number') return true;
  if (!cell) return false;
  const str = String(cell).trim();
  if (/^Rs\s?[\d,]+(\.\d+)?$/i.test(str)) return true;
  if (/^\d+(\.\d+)?%$/.test(str)) return true;
  if (/^\d+$/.test(str)) return true;
  return false;
}

function DownloadButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
    >
      <Download size={13} /> {label || 'Download CSV'}
    </button>
  );
}

function ReportBlock({ title, subtitle, actions, columns, rows, empty }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-6 text-center">
          {empty || 'No data available.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs min-w-[480px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wide">
                {columns.map((col, i) => {
                  const isRight = i > 0 && isRightAlignedHeader(col);
                  return (
                    <th
                      key={i}
                      className={`px-3 py-2.5 font-semibold whitespace-nowrap ${
                        isRight ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {row.map((cell, j) => {
                    const isRight = j > 0 && isRightAlignedCell(cell, columns[j]);
                    return (
                      <td
                        key={j}
                        className={
                          j === 0
                            ? 'px-3 py-2.5 font-semibold text-slate-700 whitespace-nowrap text-left'
                            : `px-3 py-2.5 text-slate-600 ${isRight ? 'text-right' : 'text-left'}`
                        }
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'byEmployee', label: 'Leads by Employee', icon: Users },
  { id: 'bySource', label: 'Leads by Source', icon: Globe },
  { id: 'byStage', label: 'Leads by Stage', icon: Layers },
  { id: 'wonLost', label: 'Won/Lost', icon: Trophy },
  { id: 'conversion', label: 'Conversion %', icon: Percent },
  { id: 'pendingTasks', label: 'Pending Tasks', icon: Clock },
  { id: 'overdueTasks', label: 'Overdue Tasks', icon: AlertTriangle },
  { id: 'dealValue', label: 'Deal Value', icon: DollarSign },
];

const reportsGuide = {
  title: 'CRM Reports',
  subtitle: 'Manager-level CRM analytics with downloadable reports.',
  purpose: 'Real-time CRM KPIs across leads by employee, source and stage, win/loss and conversion rates, task health, follow-up tracking, and total deal value.',
  keyTerms: [
    { term: 'Conversion %', definition: 'Percentage of total leads that were Won / Converted.' },
    { term: 'Win Rate', definition: 'Percentage of decided deals (Won vs Lost) that are Won.' },
    { term: 'Overdue Task', definition: 'An open task whose due date has already passed.' },
    { term: 'Follow-up Task', definition: 'A task auto-created as the next action after completing another task.' },
  ],
  tips: [
    'Every report tab has its own "Download CSV" button for a full export.',
  ],
  workflow: ['Leads Logged', 'Tasks Completed', 'Stages Advanced', 'Reports Computed', 'CSV Downloaded'],
};

export default function CRMReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [tick, setTick] = useState(0);
  const [printView, setPrintView] = useState(false);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(CRM_EVENT, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(CRM_EVENT, refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  function handlePrint() {
    setPrintView(true);
    window.setTimeout(() => {
      window.print();
      setPrintView(false);
    }, 300);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const leads = useMemo(() => readRows(LEADS_STORAGE_KEY, seedLeads), [tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tasks = useMemo(() => loadCrmTasks(), [tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deals = useMemo(() => readRows(DEALS_STORAGE_KEY, SEED_DEALS), [tick]);

  const stageOrder = (() => {
    const order = getLeadStageOrder();
    return order && order.length > 0 ? order : DEFAULT_STAGE_ORDER;
  })();

  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => /won|convert/i.test(String(l.status || '')));
  const lostLeads = leads.filter((l) => /lost/i.test(String(l.status || '')));
  const openLeads = Math.max(0, totalLeads - wonLeads.length - lostLeads.length);
  const conversionPct = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
  const winRate = wonLeads.length + lostLeads.length > 0 ? (wonLeads.length / (wonLeads.length + lostLeads.length)) * 100 : 0;

  const wonLostLeads = [...wonLeads, ...lostLeads];
  const leadValue = leads.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');
  const overdueTasks = tasks.filter((t) => t.status !== 'Completed' && isPastDay(dueDay(t)));
  const followUps = tasks.filter((t) => t.followUpFrom || (/follow|call|demo|quotation|quote/i.test(String(t.title || '')) && t.source === 'Created by Lead Stage Automation'));
  const pendingFollowUps = followUps.filter((t) => t.status !== 'Completed');
  const completedFollowUps = followUps.length - pendingFollowUps.length;
  const dealValue = deals.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
  const avgDealValue = deals.length > 0 ? dealValue / deals.length : 0;
  const maxDeal = deals.reduce((max, d) => Math.max(max, Number(d.price) || 0), 0);

  const byEmployee = useMemo(
    () => groupRows(leads, (l) => l.owner, (l) => Number(l.amount) || 0).sort((a, b) => b.count - a.count),
    [leads]
  );
  const bySource = useMemo(
    () => groupRows(leads, (l) => l.source, (l) => Number(l.amount) || 0).sort((a, b) => b.count - a.count),
    [leads]
  );
  const byStage = (() => {
    const stageIndex = (name) => {
      const i = stageOrder.findIndex((s) => String(s).toLowerCase() === String(name).toLowerCase());
      return i < 0 ? 999 : i;
    };
    return groupRows(leads, (l) => l.status, (l) => Number(l.amount) || 0).sort(
      (a, b) => stageIndex(a.name) - stageIndex(b.name)
    );
  })();
  const dealByStage = useMemo(
    () => groupRows(deals, (d) => d.stage, (d) => Number(d.price) || 0).sort((a, b) => b.value - a.value),
    [deals]
  );
  const dealByEmployee = useMemo(
    () => groupRows(deals, (d) => d.assignedUser, (d) => Number(d.price) || 0).sort((a, b) => b.value - a.value),
    [deals]
  );

  const leadTableRows = byEmployee.map((e) => [e.name, e.count, formatINR(e.value), formatPct((e.count / (totalLeads || 1)) * 100)]);
  const sourceTableRows = bySource.map((s) => [s.name, s.count, formatINR(s.value), formatPct((s.count / (totalLeads || 1)) * 100)]);
  const stageTableRows = byStage.map((s) => [s.name, s.count, formatINR(s.value), formatPct((s.count / (totalLeads || 1)) * 100)]);
  const wonLostTableRows = wonLostLeads.map((l) => [l.name, l.company, l.status, l.owner, l.createdOn]);
  const conversionTableRows = [
    ['Total Leads', totalLeads],
    ['Won / Converted', wonLeads.length],
    ['Lost', lostLeads.length],
    ['Open / In Progress', openLeads],
    ['Conversion % (Won / Total)', formatPct(conversionPct)],
    ['Win Rate (Won / Won + Lost)', formatPct(winRate)],
  ];
  const pendingTaskRows = pendingTasks.map((t) => [t.id, t.title, t.lead, t.owner || t.assignee || 'Unassigned', t.priority, t.dueDate || t.dueAt || '—', t.stage || '—']);
  const overdueTaskRows = overdueTasks.map((t) => [t.id, t.title, t.lead, t.owner || t.assignee || 'Unassigned', t.priority, t.dueDate || t.dueAt || '—', daysOverdue(dueDay(t))]);
  const followUpRows = followUps.map((t) => [t.id, t.title, t.lead, t.owner || t.assignee || 'Unassigned', t.priority, t.dueDate || t.dueAt || '—', t.status, t.followUpFrom || '—']);
  const dealDetailRows = deals.map((d) => [d.name, d.client || d.product, d.stage, d.assignedUser, formatINR(d.price)]);
  const dealStageRows = dealByStage.map((s) => [s.name, s.count, formatINR(s.value), formatPct((s.value / (dealValue || 1)) * 100)]);
  const dealEmployeeRows = dealByEmployee.map((e) => [e.name, e.count, formatINR(e.value), formatPct((e.value / (dealValue || 1)) * 100)]);

  const exportByEmployee = () =>
    exportToCSV('CRM_Leads_By_Employee', ['Employee', 'Lead Count', 'Pipeline Value (Rs)', 'Share %'], byEmployee.map((e) => [e.name, e.count, (Number(e.value) || 0).toFixed(2), ((e.count / (totalLeads || 1)) * 100).toFixed(1) + '%']));
  const exportBySource = () =>
    exportToCSV('CRM_Leads_By_Source', ['Source', 'Lead Count', 'Pipeline Value (Rs)', 'Share %'], bySource.map((s) => [s.name, s.count, (Number(s.value) || 0).toFixed(2), ((s.count / (totalLeads || 1)) * 100).toFixed(1) + '%']));
  const exportByStage = () =>
    exportToCSV('CRM_Leads_By_Stage', ['Stage', 'Lead Count', 'Pipeline Value (Rs)', 'Share %'], byStage.map((s) => [s.name, s.count, (Number(s.value) || 0).toFixed(2), ((s.count / (totalLeads || 1)) * 100).toFixed(1) + '%']));
  const exportWonLost = () =>
    exportToCSV('CRM_Won_Lost', ['Lead', 'Company', 'Status', 'Owner', 'Created On'], wonLostLeads.map((l) => [l.name, l.company, l.status, l.owner, l.createdOn]));
  const exportConversion = () =>
    exportToCSV('CRM_Conversion_Rate', ['Metric', 'Value'], conversionTableRows);
  const exportPendingTasks = () =>
    exportToCSV('CRM_Pending_Tasks', ['Task ID', 'Title', 'Lead', 'Assignee', 'Priority', 'Due Date', 'Stage'], pendingTaskRows);
  const exportOverdueTasks = () =>
    exportToCSV('CRM_Overdue_Tasks', ['Task ID', 'Title', 'Lead', 'Assignee', 'Priority', 'Due Date', 'Days Overdue'], overdueTaskRows);
  const exportFollowUps = () =>
    exportToCSV('CRM_Follow_Up_Tasks', ['Task ID', 'Title', 'Lead', 'Assignee', 'Priority', 'Due Date', 'Status', 'Follow-up From'], followUpRows);
  const exportDealValue = () =>
    exportToCSV('CRM_Deal_Value', ['Deal', 'Client', 'Stage', 'Employee', 'Price (Rs)'], dealDetailRows);
  const exportDealStages = () =>
    exportToCSV('CRM_Deal_Value_By_Stage', ['Stage', 'Deals', 'Value (Rs)', 'Share %'], dealByStage.map((s) => [s.name, s.count, (Number(s.value) || 0).toFixed(2), ((s.value / (dealValue || 1)) * 100).toFixed(1) + '%']));
  const exportDealEmployees = () =>
    exportToCSV('CRM_Deal_Value_By_Employee', ['Employee', 'Deals', 'Value (Rs)', 'Share %'], dealByEmployee.map((e) => [e.name, e.count, (Number(e.value) || 0).toFixed(2), ((e.value / (dealValue || 1)) * 100).toFixed(1) + '%']));

  const printSections = [
    { title: 'Leads by Employee', columns: ['Employee', 'Lead Count', 'Pipeline Value', 'Share %'], rows: leadTableRows },
    { title: 'Leads by Source', columns: ['Source', 'Lead Count', 'Pipeline Value', 'Share %'], rows: sourceTableRows },
    { title: 'Leads by Stage', columns: ['Stage', 'Lead Count', 'Pipeline Value', 'Share %'], rows: stageTableRows },
    { title: 'Won / Lost', columns: ['Lead', 'Company', 'Status', 'Owner', 'Created On'], rows: wonLostTableRows },
    { title: 'Conversion Rate', columns: ['Metric', 'Value'], rows: conversionTableRows },
    { title: 'Pending Tasks', columns: ['Task ID', 'Title', 'Lead', 'Assignee', 'Priority', 'Due Date', 'Stage'], rows: pendingTaskRows },
    { title: 'Overdue Tasks', columns: ['Task ID', 'Title', 'Lead', 'Assignee', 'Priority', 'Due Date', 'Days Overdue'], rows: overdueTaskRows },
    { title: 'Deal Value by Stage', columns: ['Stage', 'Deals', 'Value', 'Share %'], rows: dealStageRows },
    { title: 'Deal Value by Employee', columns: ['Employee', 'Deals', 'Value', 'Share %'], rows: dealEmployeeRows },
    { title: 'Deal Register', columns: ['Deal', 'Client / Product', 'Stage', 'Employee', 'Price'], rows: dealDetailRows },
  ];

  const printSummary = [
    ['Total Leads', String(totalLeads)],
    ['Won', String(wonLeads.length)],
    ['Lost', String(lostLeads.length)],
    ['Conversion %', formatPct(conversionPct)],
    ['Pending Tasks', String(pendingTasks.length)],
    ['Overdue Tasks', String(overdueTasks.length)],
    ['Deal Value', formatINR(dealValue)],
  ];

  if (printView) {
    return (
      <div className="printable-document p-6 sm:p-10 text-slate-800 font-sans text-xs space-y-6 bg-white">
        <div className="text-center border-b border-slate-300 pb-3">
          <h1 className="text-lg font-black uppercase tracking-wide text-slate-900">CRM Reports</h1>
          <p className="text-[11px] text-slate-500">{new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {printSummary.map(([label, value]) => (
            <div key={label} className="rounded border border-slate-300 bg-slate-50 px-2.5 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">{label}</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {printSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-[13px] font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">{section.title}</h2>
            {section.rows.length === 0 ? (
              <p className="text-[11px] text-slate-400">No data available.</p>
            ) : (
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr>
                    {section.columns.map((col, i) => (
                      <th key={i} className="border border-slate-300 bg-slate-100 px-2 py-1.5 text-left font-bold text-slate-700">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className={`border border-slate-300 px-2 py-1 text-slate-700 ${j === 0 ? 'font-semibold' : ''}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="CRM Reports"
        subtitle="Manager analytics — leads by employee, source and stage, Won/Lost, conversion %, task health, follow-ups and deal value. Download every report as CSV."
        guide={reportsGuide}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              <Printer size={14} /> Print Report
            </button>
            <button
              type="button"
              onClick={() => setTick((t) => t + 1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <RefreshCw size={14} /> Refresh Data
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1f6bff] flex-shrink-0">
            <Users size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Active Leads</div>
            <div className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{totalLeads}</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>↑ 12%</span>
              <span className="text-slate-400 font-normal">vs last week</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <UserPlus size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">New Leads</div>
            <div className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{leads.filter((l) => l.status === 'New').length || 1}</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>↑ 2%</span>
              <span className="text-slate-400 font-normal">vs last week</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Clock size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Pending Tasks</div>
            <div className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{pendingTasks.length}</div>
            <div className="text-[11px] font-semibold text-rose-500 mt-0.5 flex items-center gap-1">
              <span>↓ 4%</span>
              <span className="text-slate-400 font-normal">vs last week</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
            <TrendingUp size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Deals in Pipeline</div>
            <div className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{deals.length}</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>↑ 15%</span>
              <span className="text-slate-400 font-normal">Rs 1.72 Cr</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5 transition-transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 flex-shrink-0 font-bold text-xl">
            $
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Revenue Expected</div>
            <div className="text-xl font-bold text-slate-900 leading-tight mt-0.5">$17,355,083.00</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>↑ 22%</span>
              <span className="text-slate-400 font-normal">$5,884.00 due</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-[#1F2E4A] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          <ReportBlock
            title="Top Employees"
            subtitle="Leads assigned per employee"
            actions={<DownloadButton onClick={exportByEmployee} />}
            columns={['Employee', 'Leads', 'Pipeline Value', 'Share %']}
            rows={leadTableRows}
            empty="No leads available yet."
          />
          <ReportBlock
            title="Top Sources"
            subtitle="Lead acquisition by source"
            actions={<DownloadButton onClick={exportBySource} />}
            columns={['Source', 'Leads', 'Pipeline Value', 'Share %']}
            rows={sourceTableRows}
            empty="No leads available yet."
          />
        </div>
      )}

      {activeTab === 'byEmployee' && (
        <div className="space-y-4">
          <ReportBlock
            title="Leads by Employee"
            subtitle="How many leads each sales person owns and their pipeline value"
            actions={<DownloadButton onClick={exportByEmployee} />}
            columns={['Employee', 'Lead Count', 'Pipeline Value', 'Share %']}
            rows={leadTableRows}
            empty="No leads available yet."
          />
        </div>
      )}

      {activeTab === 'bySource' && (
        <div className="space-y-4">
          <ReportBlock
            title="Leads by Source"
            subtitle="Website, Cold Call, Referral and other acquisition channels"
            actions={<DownloadButton onClick={exportBySource} />}
            columns={['Source', 'Lead Count', 'Pipeline Value', 'Share %']}
            rows={sourceTableRows}
            empty="No leads available yet."
          />
        </div>
      )}

      {activeTab === 'byStage' && (
        <div className="space-y-4">
          <ReportBlock
            title="Leads by Stage"
            subtitle="Current pipeline distribution across lead stages"
            actions={<DownloadButton onClick={exportByStage} />}
            columns={['Stage', 'Lead Count', 'Pipeline Value', 'Share %']}
            rows={stageTableRows}
            empty="No leads available yet."
          />
        </div>
      )}

      {activeTab === 'wonLost' && (
        <div className="space-y-4">
          <ReportBlock
            title="Won / Lost Breakdown"
            subtitle="Every won and lost lead record"
            actions={<DownloadButton onClick={exportWonLost} />}
            columns={['Lead', 'Company', 'Status', 'Owner', 'Created On']}
            rows={wonLostTableRows}
            empty="No Won or Lost leads recorded yet."
          />
        </div>
      )}

      {activeTab === 'conversion' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Conversion Rate</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Share of total leads converted into Won</p>
              </div>
              <DownloadButton onClick={exportConversion} />
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                <span>{wonLeads.length} of {totalLeads} leads won</span>
                <span>{formatPct(conversionPct)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, conversionPct)}%` }} />
              </div>
            </div>
            <ReportBlock
              title="Conversion Summary"
              subtitle="Key conversion metrics"
              actions={<DownloadButton onClick={exportConversion} />}
              columns={['Metric', 'Value']}
              rows={conversionTableRows}
              empty="No leads available yet."
            />
          </div>
        </div>
      )}

      {activeTab === 'pendingTasks' && (
        <div className="space-y-4">
          <ReportBlock
            title="Pending Tasks"
            subtitle="All tasks that are not yet completed"
            actions={<DownloadButton onClick={exportPendingTasks} />}
            columns={['Task ID', 'Title', 'Lead', 'Assignee', 'Priority', 'Due Date', 'Stage']}
            rows={pendingTaskRows}
            empty="No pending tasks."
          />
        </div>
      )}

      {activeTab === 'overdueTasks' && (
        <div className="space-y-4">
          <ReportBlock
            title="Overdue Tasks"
            subtitle="Open tasks that have crossed their due date and need attention"
            actions={<DownloadButton onClick={exportOverdueTasks} />}
            columns={['Task ID', 'Title', 'Lead', 'Assignee', 'Priority', 'Due Date', 'Days Overdue']}
            rows={overdueTaskRows}
            empty="No overdue tasks — all caught up."
          />
        </div>
      )}

      {activeTab === 'dealValue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReportBlock
              title="Deal Value by Stage"
              subtitle="Money locked at each deal stage"
              actions={<DownloadButton onClick={exportDealStages} />}
              columns={['Stage', 'Deals', 'Value', 'Share %']}
              rows={dealStageRows}
              empty="No deals available yet."
            />
            <ReportBlock
              title="Deal Value by Employee"
              subtitle="Sales value owned per employee"
              actions={<DownloadButton onClick={exportDealEmployees} />}
              columns={['Employee', 'Deals', 'Value', 'Share %']}
              rows={dealEmployeeRows}
              empty="No deals available yet."
            />
          </div>
          <ReportBlock
            title="Deal Register"
            subtitle="Every deal in the pipeline with its value"
            actions={<DownloadButton onClick={exportDealValue} />}
            columns={['Deal', 'Client / Product', 'Stage', 'Employee', 'Price']}
            rows={dealDetailRows}
            empty="No deals available yet."
          />
        </div>
      )}
    </div>
  );
}