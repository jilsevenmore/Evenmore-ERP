import CrmKpiCard from '../common/CrmKpiCard';
import { Link } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { Calendar, User, Search, CheckCircle2, AlertTriangle, ArrowUpDown, Clock, Users, UserPlus, TrendingUp } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import StatCard from '../../../components/ui/StatCard';
import {
  CRM_EVENT,
  TASK_SOURCE_AUTOMATION,
} from '../../../services/leadStageAutomation';
import { completeTaskWithOutcome, resolveLeadForTask, NEXT_ACTION_LABELS } from '../../../services/taskCompletionService';
import CompleteTaskModal from './CompleteTaskModal';
import { useCrmStore } from '../../../stores/crmStore';
import { describeError } from '../../../services/crmSync';
import { formatCurrency } from '../../../utils/currencyUtils';


const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Waiting', 'Completed'];

export default function TasksPage() {
  const tasks = useCrmStore((s) => s.tasks);
  const leads = useCrmStore((s) => s.leads);
  const deals = useCrmStore((s) => s.deals);
  const kpis = useMemo(() => {
    const currency = localStorage.getItem('evenmore_currency') || 'USD ($)';
    const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost' && d.stage !== 'Declined');
    return {
      activeLeads: leads.filter((l) => !/lost/i.test(String(l.status || ''))).length,
      totalLeads: leads.length,
      newLeads: leads.filter((l) => l.status === 'New' || l.status === 'New Lead').length,
      pipelineDeals: openDeals.length,
      pipelineValue: formatCurrency(openDeals.reduce((sum, d) => sum + (Number(d.price) || 0), 0), currency, { noDecimals: true }),
      expected: formatCurrency(leads.reduce((sum, l) => sum + (Number(l.amount) || 0), 0), currency),
      symbol: (currency.match(/\(([^)]+)\)/) || [])[1] || '$',
    };
  }, [leads, deals]);
  const updateTask = useCrmStore((s) => s.updateTask);
  const [activeStatus, setActiveStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');

  // Complete Task Modal state
  const [completeTarget, setCompleteTarget] = useState(null);
  const [successToast, setSuccessToast] = useState('');


  const stats = [
    { label: 'Total Tasks', value: tasks.length.toString(), icon: 'file', tone: 'blue' },
    { label: 'Pending', value: tasks.filter((t) => t.status !== 'Completed').length.toString(), icon: 'clock', tone: 'amber' },
    { label: 'Urgent/High', value: tasks.filter((t) => t.priority === 'High' || t.priority === 'Urgent').length.toString(), icon: 'filter', tone: 'pink' },
    { label: 'Completed', value: tasks.filter((t) => t.status === 'Completed').length.toString(), icon: 'chart', tone: 'green' },
  ];

  function toggleComplete(task) {
    if (task.status === 'Completed') {
      // Re-opening is an ordinary edit; completing goes through the modal so
      // the server can apply the outcome and next action.
      updateTask(task.id, {
        status: 'Open',
        outcome: null,
        nextAction: null,
        completionNote: null,
      }).catch((err) => console.warn('[CRM] task not reopened:', describeError(err)));
      return;
    }
    const lead = resolveLeadForTask(task);
    setCompleteTarget({ task, lead });
  }

  async function handleComplete(outcome, nextAction, note, options = {}) {
    if (!completeTarget?.task) return { ok: false, message: 'No task selected.' };
    const result = await completeTaskWithOutcome({
      task: completeTarget.task,
      outcome,
      nextAction,
      note,
      ...options,
    });
    if (result.ok !== false) {
      setSuccessToast(result.message || 'Task completed successfully.');
      window.setTimeout(() => setSuccessToast(''), 2500);
    }
    return result;
  }

  function handleCompleteSuccess() {
    setCompleteTarget(null);
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((t) => {
      const matchesStatus = activeStatus === 'All' || t.status === activeStatus;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (t.title && String(t.title ?? '').toLowerCase().includes(q)) ||
        (t.lead && String(t.lead ?? '').toLowerCase().includes(q)) ||
        (t.leadNumber && String(t.leadNumber).toLowerCase().includes(q)) ||
        (t.owner && String(t.owner ?? '').toLowerCase().includes(q)) ||
        (t.source && String(t.source ?? '').toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'dueDate') {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return (da - db) * dir;
      }
      if (sortField === 'priority') {
        const weight = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return ((weight[a.priority] || 0) - (weight[b.priority] || 0)) * dir;
      }
      const valA = String(a[sortField] || '').toLowerCase();
      const valB = String(b[sortField] || '').toLowerCase();
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  }, [tasks, activeStatus, search, sortField, sortDirection]);

  const columns = [
    {
      key: 'leadNumber',
      label: (
        <span
          onClick={() => handleSort('leadNumber')}
          className="inline-flex items-center gap-1 cursor-pointer hover:text-blue-600"
        >
          Lead ID <ArrowUpDown size={12} />
        </span>
      ),
      // The Lead ID opens that lead's page.
      render: (val, row) => (val && row.leadId
        ? <Link to={`/crm/leads/${encodeURIComponent(row.leadId)}`} className="font-semibold text-blue-600 hover:underline whitespace-nowrap">{val}</Link>
        : val
          ? <span className="font-semibold text-slate-700 whitespace-nowrap">{val}</span>
          : <span className="text-slate-300">—</span>),
    },
    {
      key: 'title',
      label: (
        <span
          onClick={() => handleSort('title')}
          className="inline-flex items-center gap-1 cursor-pointer hover:text-blue-600"
        >
          Task Title <ArrowUpDown size={12} />
        </span>
      ),
      render: (val, row) => {
        const isAuto = row.source === TASK_SOURCE_AUTOMATION || row.source === 'Created by Lead Stage Automation';
        const isUnassigned = row.owner === 'Unassigned' || !row.owner;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>{val}</strong>
              {isAuto && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Created by Lead Stage Automation
                </span>
              )}
              {isUnassigned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle size={11} /> Unassigned
                </span>
              )}
            </div>
            {row.lead && (
              <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>
                Related Lead: <span className="font-medium text-slate-700">{row.lead}</span>
              </span>
            )}
            {row.completionOutcome && (
              <span style={{ fontSize: 11, color: '#059669', display: 'block' }}>
                Outcome: <strong>{row.completionOutcome}</strong>
                {row.nextAction && <> · Next: <strong>{NEXT_ACTION_LABELS[row.nextAction] || row.nextAction}</strong></>}
                {row.completedBy && <> · By <strong>{row.completedBy}</strong></>}
              </span>
            )}
            {row.warning && (
              <span style={{ fontSize: 11, color: '#b45309', display: 'block' }}>
                ⚠️ {row.warning}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'owner',
      label: (
        <span
          onClick={() => handleSort('owner')}
          className="inline-flex items-center gap-1 cursor-pointer hover:text-blue-600"
        >
          Assigned To <ArrowUpDown size={12} />
        </span>
      ),
      render: (val) => {
        const isUnassigned = val === 'Unassigned' || !val;
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: isUnassigned ? '#d97706' : '#334155',
              fontWeight: isUnassigned ? 600 : 400,
            }}
          >
            <User size={14} color={isUnassigned ? '#d97706' : '#64748b'} />
            {val || 'Unassigned'}
          </span>
        );
      },
    },
    {
      key: 'dueDate',
      label: (
        <span
          onClick={() => handleSort('dueDate')}
          className="inline-flex items-center gap-1 cursor-pointer hover:text-blue-600"
        >
          Due Date <ArrowUpDown size={12} />
        </span>
      ),
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
          <Calendar size={13} /> {val || 'Today'}
        </span>
      ),
    },
    {
      key: 'priority',
      label: (
        <span
          onClick={() => handleSort('priority')}
          className="inline-flex items-center gap-1 cursor-pointer hover:text-blue-600"
        >
          Priority <ArrowUpDown size={12} />
        </span>
      ),
      render: (val) => {
        const color =
          val === 'Urgent'
            ? 'badge-red'
            : val === 'High'
            ? 'badge-orange'
            : val === 'Medium'
            ? 'badge-blue'
            : 'badge-gray';
        return <span className={`badge ${color}`}>{val}</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleComplete(row)}
            title={row.status === 'Completed' ? 'Reopen task' : 'Complete task'}
            className={`p-1.5 rounded-xl border transition ${
              row.status === 'Completed'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="feature-page">
      <PageHeader
        title="CRM Tasks"
        subtitle="Track follow-ups, scheduled calls, demos, and sales milestones."
        breadcrumb={[{ label: 'CRM', to: '/crm/leads' }, { label: 'Tasks' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-5">
        <CrmKpiCard label="Total Active Leads" value={kpis.activeLeads} icon={Users} tone="blue">
          <div className="text-[11px] mt-0.5 text-slate-400">{kpis.totalLeads} total leads</div>
        </CrmKpiCard>

        <CrmKpiCard label="New Leads" value={kpis.newLeads} icon={UserPlus} tone="emerald">
          <div className="text-[11px] mt-0.5 text-slate-400">in the New stage</div>
        </CrmKpiCard>

        <CrmKpiCard label="Pending Tasks" value={tasks.filter((t) => t.status !== 'Completed').length} icon={Clock} tone="amber">
          <div className="text-[11px] mt-0.5 text-slate-400">{tasks.length} total tasks</div>
        </CrmKpiCard>

        <CrmKpiCard label="Deals in Pipeline" value={kpis.pipelineDeals} icon={TrendingUp} tone="purple">
          <div className="text-[11px] mt-0.5 text-slate-400">{kpis.pipelineValue}</div>
        </CrmKpiCard>

        <CrmKpiCard label="Total Revenue Expected" value={kpis.expected} symbol={kpis.symbol} tone="rose">
          <div className="text-[11px] mt-0.5 text-slate-400">from lead amounts</div>
        </CrmKpiCard>
      </div>

      <div
        className="card"
        style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['All', 'Open', 'In Progress', 'Waiting', 'Completed'].map((status) => (
              <button
                key={status}
                type="button"
                className={`tab-btn h-9 px-3.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  activeStatus === status ? 'btn-primary' : 'btn-outline'
                }`}
                onClick={() => setActiveStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search tasks, leads, assignee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                }}
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredTasks}
          rowKey="id"
          emptyMessage="No tasks found matching your filters."
        />
      </div>

      {/* Complete Task Modal */}
      <CompleteTaskModal
        open={Boolean(completeTarget)}
        task={completeTarget?.task || null}
        lead={completeTarget?.lead || null}
        onCancel={() => setCompleteTarget(null)}
        onComplete={handleComplete}
        onSuccess={handleCompleteSuccess}
      />

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={16} />
          {successToast}
        </div>
      )}
    </div>
  );
}
