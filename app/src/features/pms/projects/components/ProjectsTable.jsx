import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, UserPlus, AlertTriangle, Percent, Trash2 } from 'lucide-react';
import { DataTable } from '../../../../components/ui/DataTable';
import { StageStatusBadge } from '../../components/StageStatusBadge';
import { DynamicProgressBar } from '../../components/DynamicProgressBar';
import { getProjectRowMeta, isProjectCreator } from '../../../../stores/pmsStore';
import { useAppStore } from '../../../../stores/appStore';
import { formatCurrency } from '../../../../utils/currencyUtils';

/**
 * ProjectsTable — the master project directory grid.
 *
 * Shared by /pms/projects and /pms/my-projects; the only difference between
 * those pages is which rows they hand in. Row metadata (current stage, its
 * sequence position, delay) is derived once per row via getProjectRowMeta.
 *
 * Note the two-argument render signature: DataTable calls render(value, row)
 * whenever a column has a label and the row carries a matching value, so a
 * single-argument render would receive the cell value instead of the row.
 */

const PRIORITY_TONES = {
  Urgent: { bg: '#ffe4e6', fg: '#9f1239' },
  High: { bg: '#ffedd5', fg: '#9a3412' },
  Medium: { bg: '#e0f2fe', fg: '#0369a1' },
  Low: { bg: '#f1f5f9', fg: '#475569' },
};

export function getPriorityRowClass(row) {
  const priority = row?.priority || 'Low';
  switch (priority) {
    case 'Urgent':
      return 'bg-rose-50/50 hover:bg-rose-100/70 shadow-[inset_4px_0_0_0_#e11d48]';
    case 'High':
      return 'bg-orange-50/40 hover:bg-orange-100/60 shadow-[inset_4px_0_0_0_#f97316]';
    case 'Medium':
      return 'bg-sky-50/25 hover:bg-sky-100/45 shadow-[inset_4px_0_0_0_#38bdf8]';
    case 'Low':
    default:
      return 'hover:bg-slate-50/80 shadow-[inset_4px_0_0_0_#cbd5e1]';
  }
}

const DEPARTMENT_TONES = {
  Design: { bg: '#eef2ff', fg: '#4338ca' },
  Production: { bg: '#eff6ff', fg: '#1d4ed8' },
  Quality: { bg: '#f0fdfa', fg: '#0f766e' },
  Packaging: { bg: '#faf5ff', fg: '#7e22ce' },
  Installation: { bg: '#fff7ed', fg: '#c2410c' },
};

function formatDayMonthYear(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ProjectsTable({
  projects = [],
  onQuickAssign,
  onLogDelay,
  onConfigurePercentages,
  onDeleteProject,
  emptyTitle = 'No projects found',
  emptyDesc = 'No project matches the current filters.',
  emptyAction,
}) {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);

  // Derive once per render so each column body stays a cheap lookup.
  const rows = projects.map((p) => ({ ...p, _meta: getProjectRowMeta(p) }));

  const columns = [
    {
      key: 'id',
      label: 'Project ID',
      render: (_v, row) => {
        const p = row.priority || 'Low';
        const dotColor =
          p === 'Urgent'
            ? 'bg-rose-600 ring-2 ring-rose-200'
            : p === 'High'
            ? 'bg-orange-500 ring-2 ring-orange-200'
            : p === 'Medium'
            ? 'bg-sky-500'
            : 'bg-slate-400';

        return (
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ${p === 'Urgent' ? 'animate-pulse' : ''}`}
              title={`Priority: ${p}`}
            />
            <Link
              to={`/pms/projects/${row.id}`}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap"
              onClick={(e) => e.stopPropagation()}
            >
              {row.code || row.id}
            </Link>
          </div>
        );
      },
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (_v, row) => (
        <span
          className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 max-w-[150px] truncate"
          title={row.customerName}
        >
          {row.customerName}
        </span>
      ),
    },
    {
      key: 'crmOrderId',
      label: 'Order / Item',
      render: (_v, row) => (
        <div
          className="min-w-0"
          title={`${row.crmOrderId} · ${formatCurrency(row.productDetails?.orderValue ?? 0)}\n${row.productDetails?.specifications ?? ''}`}
        >
          <div className="text-[11px] font-semibold text-slate-700">{row.crmOrderId}</div>
          <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
            {row.productDetails?.productName}
          </div>
        </div>
      ),
    },
    {
      key: 'projectManager',
      label: 'Project Manager',
      render: (_v, row) => (
        <div className="flex items-center gap-2 min-w-0">
          {row.projectManager?.avatar ? (
            <img
              src={row.projectManager.avatar}
              alt=""
              className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-500 flex items-center justify-center shrink-0">
              {(row.projectManager?.name ?? '?').slice(0, 1)}
            </span>
          )}
          <span className="text-[11px] text-slate-700 truncate">{row.projectManager?.name}</span>
        </div>
      ),
    },
    {
      key: 'currentStageId',
      label: 'Current Stage',
      render: (_v, row) => {
        const meta = row._meta;
        if (!meta.currentStage) {
          return <span className="text-[11px] text-slate-400">No stages</span>;
        }
        return (
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400">
              Stage {meta.stageIndex}/{meta.stageCount}
            </span>
            <div className="text-[11px] text-slate-700 truncate max-w-[160px]" title={meta.currentStage.name}>
              {meta.currentStage.name}
            </div>
          </div>
        );
      },
    },
    {
      key: 'currentDepartment',
      label: 'Department',
      render: (_v, row) => {
        const dept = row._meta.department;
        const tone = DEPARTMENT_TONES[dept] ?? { bg: '#f1f5f9', fg: '#475569' };
        return (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: tone.bg, color: tone.fg }}
          >
            {dept}
          </span>
        );
      },
    },
    {
      key: 'overallCompletionPct',
      label: 'Completion',
      render: (_v, row) => (
        <div style={{ minWidth: 120 }}>
          <DynamicProgressBar
            value={row.overallCompletionPct}
            status={row.status}
            timing={row._meta.timing}
            plannedDuration={row._meta.currentStage?.plannedDuration}
            durationUnit={row._meta.currentStage?.durationUnit}
            height={6}
          />
        </div>
      ),
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (_v, row) => (
        <span className="text-[11px] text-slate-600 whitespace-nowrap">
          {formatDayMonthYear(row.startDate)}
        </span>
      ),
    },
    {
      key: 'expectedCompletionDate',
      label: 'Expected End',
      render: (_v, row) => (
        <div className="whitespace-nowrap">
          <div className="text-[11px] text-slate-600">
            {formatDayMonthYear(row.expectedCompletionDate)}
          </div>
          <div
            className="text-[10px] font-semibold"
            style={{ color: row._meta.isOverdue ? '#9f1239' : '#64748b' }}
          >
            {row.status === 'Completed' ? 'Delivered' : row._meta.remainingLabel}
          </div>
        </div>
      ),
    },
    {
      key: 'delay',
      label: 'Delay',
      render: (_v, row) =>
        row._meta.projectDelayMs > 0 ? (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: '#ffe4e6', color: '#9f1239' }}
          >
            <AlertTriangle size={10} strokeWidth={2.5} />+{row._meta.projectDelayLabel}
          </span>
        ) : (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: '#d1fae5', color: '#065f46' }}
          >
            On Time
          </span>
        ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (_v, row) => {
        const p = row.priority || 'Low';
        const tone = PRIORITY_TONES[p] ?? PRIORITY_TONES.Low;
        const borderCls =
          p === 'Urgent'
            ? 'border-rose-300'
            : p === 'High'
            ? 'border-orange-300'
            : p === 'Medium'
            ? 'border-sky-300'
            : 'border-slate-200';

        return (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${borderCls}`}
            style={{ background: tone.bg, color: tone.fg }}
          >
            {p === 'Urgent' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />}
            {p}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, row) => <StageStatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_v, row) => {
        const isCreator = isProjectCreator(row, currentUser);
        const canDelete =
          isCreator ||
          currentUser?.role === 'Admin' ||
          currentUser?.role === 'Superadmin' ||
          currentUser?.isSuperuser ||
          (row.projectManager?.id && String(row.projectManager.id) === String(currentUser?.id));
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              title="View details"
              onClick={() => navigate(`/pms/projects/${row.id}`)}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-card-hover"
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              title="Quick assign current stage"
              disabled={!onQuickAssign || !row._meta.currentStage}
              onClick={() => onQuickAssign?.(row)}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-card-hover disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <UserPlus size={14} />
            </button>
            <button
              type="button"
              title={
                !isCreator
                  ? 'Only the project creator can edit stage percentages'
                  : row.status === 'Completed'
                    ? 'Project is completed'
                    : 'Configure stage percentages'
              }
              disabled={!onConfigurePercentages || !isCreator || row.status === 'Completed'}
              onClick={() => onConfigurePercentages?.(row)}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-card-hover disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Percent size={14} />
            </button>
            <button
              type="button"
              title="Log delay"
              disabled={!onLogDelay || !row._meta.currentStage}
              onClick={() => onLogDelay?.(row)}
              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-card-hover disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <AlertTriangle size={14} />
            </button>
            {onDeleteProject && (
              <button
                type="button"
                title={
                  !canDelete
                    ? 'Only the project creator, manager or administrators can delete this project'
                    : 'Delete project'
                }
                disabled={!canDelete}
                onClick={() => onDeleteProject(row)}
                className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-card-hover disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey="id"
      pageSize={10}
      pageSizeOptions={[10, 20, 50]}
      getRowClassName={getPriorityRowClass}
      onRowClick={(row) => navigate(`/pms/projects/${row.id}`)}
      emptyTitle={emptyTitle}
      emptyDesc={emptyDesc}
      emptyAction={emptyAction}
      exportable={false}
      searchable={false}
    />
  );
}

export default ProjectsTable;
