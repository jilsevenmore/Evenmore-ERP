import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../../components/ui/DataTable';
import { StageStatusBadge } from '../../components/StageStatusBadge';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';

/**
 * DelayedProjectsTable — the delay watchlist with a jump-to-project action.
 *
 * Rows come from computeDelayWatchlist(), which surfaces any stage that is
 * explicitly flagged Delayed *or* has simply run past its expected completion,
 * so a slip shows up here before anyone remembers to log a reason.
 */

const PRIORITY_TONES = {
  Urgent: { bg: '#ffe4e6', fg: '#9f1239' },
  High: { bg: '#ffedd5', fg: '#9a3412' },
  Medium: { bg: '#e0f2fe', fg: '#0369a1' },
  Low: { bg: '#f1f5f9', fg: '#475569' },
};

export function DelayedProjectsTable({ rows = [] }) {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'projectId',
      label: 'Project',
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 text-xs">{row.projectId}</div>
          <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={row.customerName}>
            {row.customerName}
          </div>
        </div>
      ),
    },
    {
      key: 'stageName',
      label: 'Stage',
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="text-xs text-slate-700 truncate max-w-[170px]">{row.stageName}</div>
          <div className="text-[11px] text-slate-400">{row.department}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_value, row) => <StageStatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'delayMs',
      label: 'Overdue',
      render: (_value, row) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: '#9f1239' }}>
          <AlertTriangle size={12} strokeWidth={2.5} />
          {row.delayMs > 0 ? row.delayLabel : 'Flagged'}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (_value, row) => {
        const tone = PRIORITY_TONES[row.priority] ?? PRIORITY_TONES.Low;
        return (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: tone.bg, color: tone.fg }}
          >
            {row.priority}
          </span>
        );
      },
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (_value, row) => (
        <span
          className="text-[11px] text-slate-500 line-clamp-2 max-w-[220px] block"
          title={row.reason || 'No reason logged yet'}
        >
          {row.reason || <em className="text-slate-400">No reason logged</em>}
        </span>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (_value, row) => <span className="text-[11px] text-slate-600">{row.owner}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (_value, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/pms/projects/${row.projectId}`);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Open
          <ArrowUpRight size={12} strokeWidth={2.5} />
        </button>
      ),
    },
  ];

  return (
    <DataTable
      title="Delay Watchlist & Action Alerts"
      subtitle="Stages flagged as delayed or already past their expected completion"
      columns={columns}
      data={rows}
      rowKey="id"
      pageSize={5}
      onRowClick={(row) => navigate(`/pms/projects/${row.projectId}`)}
      emptyTitle="Nothing running late"
      emptyDesc="Overdue and delayed stages will appear here as soon as one slips."
      exportable={false}
    />
  );
}

export default DelayedProjectsTable;
