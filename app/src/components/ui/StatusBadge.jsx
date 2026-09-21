/**
 * StatusBadge — maps ERP/HRMS/CRM status strings to CRM badge styles.
 * Consolidated from ERP StatusBadge.jsx
 *
 * Known predefined system statuses are localized via `status.*` keys.
 * Any other value (user-entered / business data) is rendered unchanged.
 */
import { useTranslation } from '../../i18n';

const STATUS_I18N_KEY = {
  'Draft': 'status.draft',
  'Sent': 'status.sent',
  'Viewed': 'status.viewed',
  'Expired': 'status.expired',
  'Accepted': 'status.accepted',
  'Rejected': 'status.rejected',
  'Invoiced': 'status.invoiced',
  'Pending': 'status.pending',
  'Paid': 'sales.paid',
  'Partial': 'status.partial',
  'Partially Paid': 'sales.partiallyPaid',
  'Unpaid': 'sales.unpaid',
  'Overdue': 'status.overdue',
  'Confirmed': 'status.confirmed',
  'Delivered': 'status.delivered',
  'Cancelled': 'status.cancelled',
  'Active': 'status.active',
  'Inactive': 'status.inactive',
  'Received': 'status.received',
  'Ordered': 'status.ordered',
  'Returned': 'status.returned',
  'Requested': 'status.requested',
  'In Transit': 'status.inTransit',
  'Completed': 'status.completed',
  'Reported': 'status.reported',
  'Sent for Replacement': 'status.sentForReplacement',
  'Replaced': 'status.replaced',
  'Credited': 'status.credited',
  'New': 'status.new',
  'Contacted': 'status.contacted',
  'Qualified': 'status.qualified',
  'Converted': 'status.converted',
  'Lost': 'status.lost',
  'Nurturing': 'status.nurturing',
  'Present': 'status.present',
  'Absent': 'status.absent',
  'Late': 'status.late',
  'Half Day': 'status.halfDay',
  'Leave': 'status.leave',
  'Holiday': 'status.holiday',
  'Pending Approval': 'status.pendingApproval',
  'Rework': 'status.rework',
  'Processed': 'status.processed',
  'Processing': 'status.processing',
  'Failed': 'status.failed',
  'In Progress': 'status.inProgress',
  'In Review': 'status.inReview',
  'Submitted': 'status.submitted',
  'Approved': 'status.approved',
  'Archived': 'status.archived',
  'Posted': 'status.posted',
  'Voided': 'status.voided',
  'Awaiting Approval': 'status.awaitingApproval',
  'Partially Completed': 'status.partiallyCompleted',
  'Delayed': 'status.delayed',
  'At Risk': 'status.atRisk',
  'On Track': 'status.onTrack',
  'Started': 'status.started',
  'Optimal': 'status.optimal',
  'Low Stock': 'status.lowStock',
  'Critical': 'status.critical',
};

const STATUS_MAP = {
  // ERP sales
  'Draft': 'badge-gray',
  'Sent': 'badge-blue',
  'Viewed': 'badge-cyan',
  'Expired': 'badge-orange',
  'Accepted': 'badge-green',
  'Rejected': 'badge-red',
  'Invoiced': 'badge-purple',
  'Pending': 'badge-yellow',
  'Paid': 'badge-green',
  'Partial': 'badge-yellow',
  'Overdue': 'badge-red',
  'Confirmed': 'badge-blue',
  'Delivered': 'badge-green',
  'Cancelled': 'badge-red',
  'Active': 'badge-green',
  'Inactive': 'badge-gray',
  'Received': 'badge-green',
  'Ordered': 'badge-blue',
  'Returned': 'badge-orange',

  // Stock / Inventory
  'Requested': 'badge-yellow',
  'In Transit': 'badge-cyan',
  'Completed': 'badge-green',
  'Reported': 'badge-red',
  'Sent for Replacement': 'badge-orange',
  'Replaced': 'badge-green',
  'Credited': 'badge-purple',

  // CRM
  'New': 'badge-blue',
  'Contacted': 'badge-cyan',
  'Qualified': 'badge-purple',
  'Converted': 'badge-green',
  'Lost': 'badge-red',
  'Nurturing': 'badge-yellow',

  // HRMS attendance
  'Present': 'badge-green',
  'Absent': 'badge-red',
  'Late': 'badge-yellow',
  'Half Day': 'badge-orange',
  'Leave': 'badge-purple',
  'Holiday': 'badge-cyan',

  // HRMS leave
  'Pending Approval': 'badge-yellow',
  // QC (Phase 2C)
  'Rework': 'badge-orange',

  // HRMS payroll
  'Processed': 'badge-green',
  'Processing': 'badge-yellow',
  'Failed': 'badge-red',

  // HRMS Performance
  'In Progress': 'badge-blue',
  'In Review': 'badge-yellow',
  'Submitted': 'badge-purple',
  'Approved': 'badge-green',
  'Archived': 'badge-gray',
  'Self Review': 'badge-blue',
  'Manager Review': 'badge-yellow',
  'HR Review': 'badge-purple',
  'Finalization': 'badge-green',

  // Valuation
  'Posted': 'badge-green',
  'Voided': 'badge-red',

  // Vendor Portal & Progress Tracking
  'Awaiting Approval': 'badge-yellow',
  'Partially Completed': 'badge-yellow',
  'Delayed': 'badge-red',
  'At Risk': 'badge-orange',
  'On Track': 'badge-green',
  'Started': 'badge-blue',
  'Shared': 'badge-blue',
  'Unshared': 'badge-gray',
  'Enabled': 'badge-green',
  'Disabled': 'badge-red',
  'Paused': 'badge-orange',
};

/**
 * Translate a predefined system status via `status.*` keys.
 * Unknown / user-entered values are returned unchanged (business data safe).
 */
export function translateStatus(status, t) {
  const key = STATUS_I18N_KEY[status];
  if (key && typeof t === 'function') return t(key);
  return status;
}

export function StatusBadge({ status, className = '' }) {  const { t } = useTranslation();
  const cls = STATUS_MAP[status] || 'badge-gray';
  const key = STATUS_I18N_KEY[status];
  // translate() falls back to English, then to a readable label — never undefined.
  const label = key ? t(key) : status;
  return (
    <span className={`badge ${cls} ${className}`}>
      {label}
    </span>
  );
}

export default StatusBadge;

