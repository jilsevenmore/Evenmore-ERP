import React, { useMemo, useState } from 'react';
import { Building2, Package, User, CalendarDays, ReceiptText, Pencil } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyUtils';
import { useERP } from '../../../../context/ERPContext';
<<<<<<< Updated upstream
=======
import { usePmsStore } from '../../../../stores/pmsStore';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { BillingAllocationCard } from '../../../../components/common/BillingAllocationCard';
import {
  BILLING_TYPES,
  billingModeLabel,
  billingTypeLabel,
  getInvoiceBillingLegs,
  getProjectAllocation,
  getProjectBillingStatus,
  getProjectValue,
} from '../../../../utils/billingAllocation';
>>>>>>> Stashed changes

/**
 * ProjectInfoTab — order context for the project.
 *
 * Customer contact details are looked up from the ERP customer master by
 * crmCustomerId, so this view shows the same record the rest of the ERP does
 * rather than a PMS-local copy that could drift.
 */

function Card({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs">
      <header className="flex items-center gap-2 mb-4">
        <Icon size={14} className="text-slate-400" />
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <dt className="text-[11px] text-slate-500 shrink-0">{label}</dt>
      <dd
        className={`text-[11px] font-semibold text-slate-800 text-right min-w-0 break-words ${mono ? 'font-mono' : ''}`}
      >
        {value ?? '—'}
      </dd>
    </div>
  );
}

function stamp(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function ProjectInfoTab({ project, meta }) {
  // The party behind the project, from the customers the server returned.
<<<<<<< Updated upstream
  const { customers = [] } = useERP() || {};
=======
  const { customers = [], invoices = [], salesOrders = [], paymentIns = [] } = useERP() || {};
  const updateProject = usePmsStore((s) => s.updateProject);
>>>>>>> Stashed changes
  const customer = customers.find((c) => c.id === project.crmCustomerId) ?? null;
  const details = project.productDetails ?? {};

  const projectValue = getProjectValue(project);
  const allocation = useMemo(() => getProjectAllocation(project), [project]);
  const billingStatus = useMemo(
    () => getProjectBillingStatus(project, invoices, salesOrders),
    [project, invoices, salesOrders]
  );
  const [historyFilter, setHistoryFilter] = useState('All');
  const [editOpen, setEditOpen] = useState(false);
  const [draftBilling, setDraftBilling] = useState(null);

  const canEditBilling = !['Completed', 'Cancelled', 'Closed'].includes(project.status);
  const filteredHistory = useMemo(() => {
    return billingStatus.invoices.filter((inv) => {
      const legs = getInvoiceBillingLegs(inv);
      if (historyFilter === 'White') return legs.type !== BILLING_TYPES.BLACK;
      if (historyFilter === 'Black') return legs.type === BILLING_TYPES.BLACK;
      return true;
    });
  }, [billingStatus.invoices, historyFilter]);

  function openEdit() {
    setDraftBilling({
      mode: allocation.mode,
      whiteAmount: allocation.whiteAmount,
      blackAmount: allocation.blackAmount,
      gstRate: allocation.gstRate,
    });
    setEditOpen(true);
  }

  function saveBilling() {
    if (!draftBilling || !canEditBilling) {
      setEditOpen(false);
      return;
    }
    updateProject?.(project.id, { billing: { ...draftBilling } });
    setEditOpen(false);
  }

  function paidFor(invoice) {
    const total = Number(invoice.total ?? invoice.grandTotal ?? invoice.amount ?? 0) || 0;
    const paid = (paymentIns || [])
      .filter((p) => p.invoiceId === invoice.id || p.invoiceNumber === invoice.invoiceNumber)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const explicit = Number(invoice.paidAmount ?? invoice.amountPaid ?? 0) || 0;
    return Math.min(total, Math.max(paid, explicit, invoice.status === 'Paid' ? total : 0));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Customer" icon={Building2}>
        <dl>
          <Row label="Name" value={project.customerName} />
          <Row label="ERP Customer ID" value={project.crmCustomerId} mono />
          <Row label="Contact Person" value={customer?.contactPerson} />
          <Row label="Email" value={customer?.email} />
          <Row label="Phone" value={customer?.phone} />
          <Row
            label="Credit Limit"
            value={customer ? formatCurrency(customer.creditLimit) : '—'}
          />
        </dl>
        {!customer && (
          <p className="text-[11px] text-slate-400 mt-3">
            No matching ERP customer record for this project.
          </p>
        )}
      </Card>

      <Card title="Order & Product" icon={Package}>
        <dl>
          <Row label="CRM Order" value={project.crmOrderId} mono />
          <Row label="Product" value={details.productName} />
          <Row label="Quantity" value={details.quantity} />
          <Row label="Order Value" value={formatCurrency(details.orderValue ?? 0)} />
        </dl>
        <div className="mt-3">
          <p className="text-[11px] text-slate-500 mb-1">Specifications</p>
          <p className="text-[11px] text-slate-700 bg-[#f6f9ff] border border-[#dce5f4] rounded-lg px-3 py-2">
            {details.specifications || <em className="text-slate-400">No specifications recorded.</em>}
          </p>
        </div>
      </Card>

      <Card title="Ownership" icon={User}>
        <div className="flex items-center gap-3 pb-3 mb-1 border-b border-slate-100">
          {project.projectManager?.avatar ? (
            <img
              src={project.projectManager.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <span className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-center">
              {project.projectManager?.name?.slice(0, 1) ?? '?'}
            </span>
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800">{project.projectManager?.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{project.projectManager?.email}</div>
          </div>
        </div>
        <dl>
          <Row label="Current Department" value={meta?.department} />
          <Row label="Current Stage" value={meta?.sequenceLabel} />
          <Row label="Priority" value={project.priority} />
          <Row label="Status" value={project.status} />
        </dl>
      </Card>

      <Card title="Schedule" icon={CalendarDays}>
        <dl>
          <Row label="Start Date" value={stamp(project.startDate)} />
          <Row label="Expected Completion" value={stamp(project.expectedCompletionDate)} />
          <Row label="Actual Completion" value={stamp(project.actualCompletionDate)} />
          <Row
            label="Schedule Status"
            value={
              project.status === 'Completed'
                ? 'Delivered'
                : meta?.isOverdue
                  ? `Overdue by ${meta.projectDelayLabel}`
                  : meta?.remainingLabel
            }
          />
          <Row label="Overall Completion" value={`${project.overallCompletionPct ?? 0}%`} />
          <Row label="Stages" value={`${meta?.stageCount ?? 0} configured`} />
        </dl>
      </Card>

      {/* Billing summary — White (GST) / Black (Non-GST) allocation */}
      <Card
        title="Billing Summary"
        icon={ReceiptText}
      >
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <Badge>{billingModeLabel(allocation.mode)}</Badge>
          {canEditBilling && (
            <button
              type="button"
              onClick={openEdit}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              <Pencil size={11} /> Edit allocation
            </button>
          )}
        </div>
        <dl>
          <Row label="Project Value" value={formatCurrency(projectValue)} mono />
          <Row label="White Billing (GST)" value={formatCurrency(allocation.whiteAmount)} mono />
          <Row label="Black Billing (Non-GST)" value={formatCurrency(allocation.blackAmount)} mono />
          <Row label="GST Amount" value={formatCurrency(allocation.gstAmount)} mono />
          <Row label="Base Amount Allocated" value={formatCurrency(allocation.allocated)} mono />
          <Row label="White Billed" value={formatCurrency(billingStatus.whiteBilled)} mono />
          <Row label="Black Billed" value={formatCurrency(billingStatus.blackBilled)} mono />
          <Row label="Remaining Billable" value={formatCurrency(billingStatus.remaining)} mono />
        </dl>
        <p className="text-[10px] text-slate-400 mt-2">
          GST applies only to the White leg. Black leg is non-taxable allocation and remains fully reported here.
        </p>
      </Card>

      {/* Billing history across multiple invoices */}
      <Card title="Billing History" icon={ReceiptText}>
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {['All', 'White', 'Black'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setHistoryFilter(f)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
                historyFilter === f
                  ? 'bg-[#1F2E4A] text-white border-[#1F2E4A]'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {f === 'White' ? 'White Billing' : f === 'Black' ? 'Black Billing' : 'All'}
            </button>
          ))}
          <span className="text-[10px] text-slate-400 ml-auto">
            {billingStatus.consumed.length} billed · {billingStatus.invoices.length} records
          </span>
        </div>
        {filteredHistory.length === 0 ? (
          <p className="text-[11px] text-slate-400">No invoices recorded against this project yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            {filteredHistory.map((inv) => {
              const legs = getInvoiceBillingLegs(inv);
              const total = Number(inv.total ?? inv.grandTotal ?? inv.amount ?? 0) || 0;
              const paid = paidFor(inv);
              const outstanding = Math.max(0, total - paid);
              return (
                <div key={inv.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-800 font-mono">{inv.invoiceNumber}</span>
                    <span className="flex items-center gap-1.5">
                      <Badge>{billingTypeLabel(legs.type)}</Badge>
                      <Badge>{inv.status}</Badge>
                    </span>
                  </div>
                  <dl className="mt-1.5">
                    <Row label="White Base" value={formatCurrency(legs.whiteBase)} mono />
                    <Row label="Black Base" value={formatCurrency(legs.blackBase)} mono />
                    <Row label="GST" value={formatCurrency(legs.gstAmount)} mono />
                    <Row label="Invoice Total" value={formatCurrency(total)} mono />
                    <Row
                      label="Paid / Outstanding"
                      value={`${formatCurrency(paid)} / ${formatCurrency(outstanding)}`}
                      mono
                    />
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {editOpen && (
        <Modal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit Billing Allocation"
          subtitle="Previously created invoices are never rewritten."
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditOpen(false)} type="button">
                Cancel
              </Button>
              <Button onClick={saveBilling} type="button">
                Save Allocation
              </Button>
            </>
          }
        >
          <BillingAllocationCard projectValue={projectValue} value={draftBilling} onChange={setDraftBilling} compact />
        </Modal>
      )}
    </div>
  );
}

export default ProjectInfoTab;
