import React, { useMemo, useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { usePmsStore, nextProjectId, getProjectManagers } from '../../../../stores/pmsStore';
import { useERP } from '../../../../context/ERPContext';
import { formatCurrency } from '../../../../utils/currencyUtils';
import { AlertCircle, Link2, PackageCheck, Info, Clock, Check, CheckCircle2, ShieldAlert, IndianRupee } from 'lucide-react';
import { StageStatusBadge } from '../../components/StageStatusBadge';

/**
 * CreateProjectModal — turns a confirmed CRM/ERP sales order into a project.
 *
 * Each stage in the stage list displays and allows editing its own stage-specific
 * planned duration (e.g. Design stage default 3 days, user can change to 5 days).
 * The stage-wise durations dynamically calculate the project's total planned duration
 * and final expected completion date.
 * If an order already has a linked project, its saved stage durations and details
 * are loaded and editable instead of creating duplicate projects.
 */

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const fieldClass =
  'w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
const labelClass = 'block text-[11px] font-semibold text-slate-600 mb-1.5';

function todayLocalDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function formatExpectedDate(d) {
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function CreateProjectModal({ isOpen, onClose, onCreated, initialOrderNumber = '' }) {
  const projects = usePmsStore((s) => s.projects);
  const stageConfigs = usePmsStore((s) => s.stageConfigs);
  const employees = usePmsStore((s) => s.employees);
  const createProjectFromOrder = usePmsStore((s) => s.createProjectFromOrder);
  const showToast = usePmsStore((s) => s.showToast);
  // The sales orders a project can be created from, as the server returned them.
  const {
    salesOrders = [],
    parties = [],
    customers = [],
    paymentIns = [],
    invoices = [],
    proformaInvoices = [],
    cashPaymentReceipts = [],
  } = useERP() || {};

  const activeConfigs = useMemo(
    () => stageConfigs.filter((c) => c.isActive).sort((a, b) => a.sequence - b.sequence),
    [stageConfigs]
  );
  const managers = useMemo(() => getProjectManagers(employees), [employees]);

  const { availableOrders, linkedOrders } = useMemo(() => {
    const linkedBy = new Map();
    for (const p of projects) {
      if (p.crmOrderId) linkedBy.set(p.crmOrderId, p.id);
    }
    return {
      availableOrders: salesOrders.filter((o) => !linkedBy.has(o.orderNumber)),
      linkedOrders: salesOrders
        .filter((o) => linkedBy.has(o.orderNumber))
        .map((o) => ({ ...o, linkedProjectId: linkedBy.get(o.orderNumber) })),
    };
  }, [projects, salesOrders]);

  function distributeEvenly(ids) {
    if (!ids || ids.length === 0) return {};
    const equal = Math.floor(100 / ids.length);
    const remainder = 100 - equal * ids.length;
    const map = {};
    ids.forEach((id, idx) => {
      map[id] = idx === ids.length - 1 ? equal + remainder : equal;
    });
    return map;
  }

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
  useEffect(() => {
    if (initialOrderNumber && isOpen) {
      setOrderNumber(initialOrderNumber);
    }
  }, [initialOrderNumber, isOpen]);

  const [managerId, setManagerId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [startDate, setStartDate] = useState(todayLocalDate());
  const [specifications, setSpecifications] = useState('');
  const [selectedConfigIds, setSelectedConfigIds] = useState(() => activeConfigs.map((c) => c.id));
  const [stagePercentages, setStagePercentages] = useState(() =>
    distributeEvenly(activeConfigs.map((c) => c.id))
  );

  // Per-stage planned durations and units
  const [stageDurations, setStageDurations] = useState({});
  const [stageDurationUnits, setStageDurationUnits] = useState({});
  const [errors, setErrors] = useState({});

  // Opened from a sales order's "PMS Project" button: the order is fixed and the
  // picker is not shown; its details come straight from that order.
  const isFixedOrder = Boolean(initialOrderNumber);
  const effectiveOrderNumber = isFixedOrder ? initialOrderNumber : orderNumber;

  const existingProject = useMemo(() => {
    if (!effectiveOrderNumber) return null;
    return (
      projects.find(
        (p) =>
          p.crmOrderId === effectiveOrderNumber ||
          p.salesOrderId === effectiveOrderNumber ||
          p.salesOrder?.orderNumber === effectiveOrderNumber
      ) ?? null
    );
  }, [projects, effectiveOrderNumber]);

  const selectedOrder = useMemo(() => {
    if (!effectiveOrderNumber) return null;
    return salesOrders.find((o) => o.orderNumber === effectiveOrderNumber) ?? null;
  }, [salesOrders, effectiveOrderNumber]);

  // Mandatory PMS Advance Requirement Check
  const advanceCheck = useMemo(() => {
    if (!selectedOrder) {
      return { required: false, satisfied: true, requiredPct: 0, requiredAmount: 0, receivedAmount: 0, shortfall: 0, customerName: '', orderTotal: 0 };
    }

    // 1. Find the customer party record
    const partyMatch =
      parties.find((p) => (selectedOrder.customerId && (p.id === selectedOrder.customerId || p.code === selectedOrder.customerId)) || (p.name && selectedOrder.customer && p.name.trim().toLowerCase() === selectedOrder.customer.trim().toLowerCase())) ||
      customers.find((c) => (selectedOrder.customerId && (c.id === selectedOrder.customerId || c.code === selectedOrder.customerId)) || (c.name && selectedOrder.customer && c.name.trim().toLowerCase() === selectedOrder.customer.trim().toLowerCase())) ||
      null;

    const requiredPct = Number(partyMatch?.pmsAdvancePaymentPercentage ?? partyMatch?.pms_advance_payment_percentage ?? 0) || 0;
    const customerName = partyMatch?.name || selectedOrder.customer || 'Customer';
    const orderTotal = Number(selectedOrder.total ?? selectedOrder.amount ?? selectedOrder.totalSalesValue ?? 0) || 0;

    if (requiredPct <= 0 || orderTotal <= 0) {
      return { required: false, satisfied: true, requiredPct: 0, requiredAmount: 0, receivedAmount: 0, shortfall: 0, customerName, orderTotal };
    }

    const requiredAmount = Math.round((orderTotal * requiredPct) / 100 * 100) / 100;

    // 2. Compute order-specific payments & advances
    const directOrderPaid = Number(selectedOrder.amount_paid ?? selectedOrder.paidAmount ?? selectedOrder.amountPaid ?? 0) || 0;
    const cashAmountPaid = selectedOrder.paymentStatus === 'Paid' ? (Number(selectedOrder.cashAmount) || 0) : 0;

    // Active payments in paymentIns linked directly to this order
    const orderDirectPmts = paymentIns
      .filter((p) => p.status !== 'Cancelled' && ((p.salesOrderId && (p.salesOrderId === selectedOrder.id || p.salesOrderId === selectedOrder.orderNumber)) || (p.salesOrderNumber && p.salesOrderNumber === selectedOrder.orderNumber) || (p.reference && String(p.reference).includes(selectedOrder.orderNumber))))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Payments linked to proformas for this order
    const orderProformaIds = new Set(proformaInvoices.filter((pi) => pi.referenceSo === selectedOrder.orderNumber || pi.salesOrderId === selectedOrder.id).map((pi) => pi.id || pi.piNumber));
    const proformaPmts = paymentIns
      .filter((p) => p.status !== 'Cancelled' && ((p.proformaInvoiceId && orderProformaIds.has(p.proformaInvoiceId)) || (p.invoiceNumber && orderProformaIds.has(p.invoiceNumber)) || (p.proformaId && orderProformaIds.has(p.proformaId))))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Payments linked to invoices for this order
    const orderInvoiceIds = new Set(invoices.filter((inv) => inv.salesOrderId === selectedOrder.id || inv.linkedSo === selectedOrder.orderNumber).map((inv) => inv.id || inv.invoiceNumber));
    const invoicePmts = paymentIns
      .filter((p) => p.status !== 'Cancelled' && ((p.invoiceId && orderInvoiceIds.has(p.invoiceId)) || (p.invoiceNumber && orderInvoiceIds.has(p.invoiceNumber))))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Cash payment receipts
    const cprPmts = cashPaymentReceipts
      .filter((r) => r.status !== 'CANCELLED' && r.status !== 'VOIDED' && ((r.salesOrderId && (r.salesOrderId === selectedOrder.id || r.salesOrderId === selectedOrder.orderNumber)) || (r.salesOrderNumber && r.salesOrderNumber === selectedOrder.orderNumber) || (r.referenceNumber && String(r.referenceNumber).includes(selectedOrder.orderNumber))))
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const orderSpecificTotal = Math.max(directOrderPaid, cashAmountPaid, orderDirectPmts + proformaPmts + invoicePmts + cprPmts);

    // Customer account advance balance (negative balance in SEWEN represents customer advance)
    const partyBal = Number(partyMatch?.balance ?? 0);
    const customerAccountAdvance = partyBal < 0 ? Math.abs(partyBal) : 0;

    const receivedAmount = Math.max(orderSpecificTotal, customerAccountAdvance);
    const satisfied = receivedAmount >= requiredAmount - 0.01;
    const shortfall = Math.max(0, Math.round((requiredAmount - receivedAmount) * 100) / 100);

    return {
      required: true,
      satisfied,
      requiredPct,
      requiredAmount,
      receivedAmount,
      shortfall,
      orderTotal,
      customerName,
      partyId: partyMatch?.id,
    };
  }, [selectedOrder, parties, customers, paymentIns, proformaInvoices, invoices, cashPaymentReceipts]);

  const projectCode = useMemo(() => nextProjectId(projects), [projects]);

  // Synchronize default durations from activeConfigs for new projects
  useEffect(() => {
    if (activeConfigs.length > 0 && !existingProject) {
      setStageDurations((prev) => {
        const next = { ...prev };
        for (const c of activeConfigs) {
          if (next[c.id] === undefined) {
            next[c.id] = c.defaultDuration ?? 1;
          }
        }
        return next;
      });
      setStageDurationUnits((prev) => {
        const next = { ...prev };
        for (const c of activeConfigs) {
          if (!next[c.id]) {
            next[c.id] = c.durationUnit || 'Days';
          }
        }
        return next;
      });
    }
  }, [activeConfigs, existingProject]);

  // Load existing project details and saved stage durations when order is linked
  useEffect(() => {
    if (existingProject) {
      setManagerId(existingProject.projectManager?.id || '');
      setPriority(existingProject.priority || 'Medium');
      if (existingProject.startDate) {
        setStartDate(existingProject.startDate.slice(0, 10));
      }
      setSpecifications(existingProject.productDetails?.specifications || '');

      if (existingProject.stages && existingProject.stages.length > 0) {
        const durMap = {};
        const unitMap = {};
        const weightMap = {};
        const ids = [];
        existingProject.stages.forEach((s) => {
          const key = s.id;
          ids.push(key);
          durMap[key] = s.plannedDuration !== undefined && s.plannedDuration !== null ? s.plannedDuration : 1;
          unitMap[key] = s.durationUnit || 'Days';
          weightMap[key] = s.percentage ?? s.weightPct ?? s.weight ?? 0;
        });
        setStageDurations(durMap);
        setStageDurationUnits(unitMap);
        setStagePercentages(weightMap);
      }
    }
  }, [existingProject]);

  // Live calculation of Total Planned Duration and Final Expected Completion Date
  const { totalPlannedDays, finalExpectedCompletionDate } = useMemo(() => {
    let days = 0;
    if (existingProject && existingProject.stages && existingProject.stages.length > 0) {
      for (const s of existingProject.stages) {
        const durVal = stageDurations[s.id] !== undefined ? stageDurations[s.id] : s.plannedDuration;
        const dur = Number(durVal) || 0;
        const unit = stageDurationUnits[s.id] || s.durationUnit || 'Days';
        days += unit === 'Hours' ? dur / 24 : dur;
      }
    } else {
      for (const id of selectedConfigIds) {
        const cfg = activeConfigs.find((c) => c.id === id);
        const durVal = stageDurations[id] !== undefined ? stageDurations[id] : cfg?.defaultDuration;
        const dur = Number(durVal) || 0;
        const unit = stageDurationUnits[id] || cfg?.durationUnit || 'Days';
        days += unit === 'Hours' ? dur / 24 : dur;
      }
    }
    const roundedDays = Math.round(days * 100) / 100;
    let expectedDate = null;
    if (startDate && !isNaN(new Date(startDate).getTime())) {
      const dt = new Date(`${startDate}T09:00:00`);
      dt.setTime(dt.getTime() + roundedDays * 24 * 60 * 60 * 1000);
      expectedDate = dt;
    }
    return {
      totalPlannedDays: roundedDays,
      finalExpectedCompletionDate: expectedDate,
    };
  }, [
    existingProject,
    selectedConfigIds,
    stageDurations,
    stageDurationUnits,
    activeConfigs,
    startDate,
  ]);

  const totalPercentage = useMemo(() => {
    if (existingProject && existingProject.stages && existingProject.stages.length > 0) {
      return existingProject.stages.reduce(
        (acc, s) => acc + (Number(stagePercentages[s.id] ?? s.percentage ?? s.weightPct ?? 0) || 0),
        0
      );
    }
    return selectedConfigIds.reduce(
      (acc, id) => acc + (Number(stagePercentages[id]) || 0),
      0
    );
  }, [existingProject, selectedConfigIds, stagePercentages]);

  function toggleConfig(id) {
    setSelectedConfigIds((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      // Automatically rebalance percentages among active selections
      setStagePercentages(distributeEvenly(next));
      return next;
    });
  }

  function handlePercentageChange(id, val) {
    const num = val === '' ? '' : Math.max(0, Math.min(100, Number(val)));
    setStagePercentages((prev) => ({
      ...prev,
      [id]: num,
    }));
  }

  function handleDurationChange(id, val) {
    setStageDurations((prev) => ({
      ...prev,
      [id]: val,
    }));
    setErrors((prev) => ({ ...prev, stages: undefined }));
  }

  function handleDurationUnitChange(id, unit) {
    setStageDurationUnits((prev) => ({
      ...prev,
      [id]: unit,
    }));
  }

  function handleDistributeEvenly() {
    setStagePercentages(distributeEvenly(selectedConfigIds));
  }

  function reset() {
    setOrderNumber('');
    setManagerId('');
    setPriority('Medium');
    setStartDate(todayLocalDate());
    setSpecifications('');
    const defaultIds = activeConfigs.map((c) => c.id);
    setSelectedConfigIds(defaultIds);
    setStagePercentages(distributeEvenly(defaultIds));
    const initDurs = {};
    const initUnits = {};
    for (const c of activeConfigs) {
      initDurs[c.id] = c.defaultDuration ?? 1;
      initUnits[c.id] = c.durationUnit || 'Days';
    }
    setStageDurations(initDurs);
    setStageDurationUnits(initUnits);
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const nextErrors = {};
    if (!selectedOrder && !existingProject) {
      nextErrors.order = isFixedOrder
        ? `Sales order ${initialOrderNumber} could not be found.`
        : 'Select a CRM sales order.';
    }

    if (existingProject) {
      // Validate stage durations for existing project
      if (existingProject.stages && existingProject.stages.length > 0) {
        for (const s of existingProject.stages) {
          const val = stageDurations[s.id];
          if (val !== undefined && (isNaN(Number(val)) || Number(val) <= 0)) {
            nextErrors.stages = `Duration for stage '${s.name}' must be greater than zero.`;
            break;
          }
        }
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      if (existingProject.status !== 'Completed') {
        try {
          await createProjectFromOrder({
            order: {
              id: existingProject.crmOrderId || existingProject.salesOrderId || existingProject.id,
              orderNumber: existingProject.crmOrderId || existingProject.salesOrderId || existingProject.id,
            },
            projectManager: { id: existingProject.projectManager?.id || managerId },
            priority,
            startDate: new Date(`${startDate}T09:00:00`).toISOString(),
            stageDurations,
            stageDurationUnits,
            specifications,
          });
          showToast(`Stage durations and timeline updated for ${existingProject.code || existingProject.id}.`, 'success');
        } catch (err) {
          console.error('[CreateProjectModal] Update error:', err);
        }
      }
      reset();
      onCreated?.(existingProject.id);
      onClose?.();
      return;
    }

    // Creating a new project
    if (advanceCheck.required && !advanceCheck.satisfied) {
      nextErrors.advance = `PMS Project conversion blocked: Customer '${advanceCheck.customerName}' requires at least ${advanceCheck.requiredPct}% advance payment (${formatCurrency(advanceCheck.requiredAmount)}) for order value ${formatCurrency(advanceCheck.orderTotal)}. Current advance received is ${formatCurrency(advanceCheck.receivedAmount)} (Shortfall: ${formatCurrency(advanceCheck.shortfall)}).`;
    }
    if (!managerId) nextErrors.manager = 'Assign a project manager.';
    if (selectedConfigIds.length === 0) nextErrors.stages = 'Pick at least one stage.';
    if (selectedConfigIds.length > 0 && Math.round(totalPercentage * 100) / 100 !== 100) {
      nextErrors.stages = `Total stage percentage must equal 100% (currently ${Math.round(totalPercentage * 100) / 100}%).`;
    }

    // Validate stage durations
    for (const cid of selectedConfigIds) {
      const dur = stageDurations[cid];
      if (dur === undefined || isNaN(Number(dur)) || Number(dur) <= 0) {
        const cfg = activeConfigs.find((c) => c.id === cid);
        nextErrors.stages = `Planned duration for stage '${cfg?.name || cid}' must be greater than zero.`;
        break;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.advance) {
        showToast(nextErrors.advance, 'error');
      }
      return;
    }

    const manager = managers.find((m) => m.id === managerId);
    let id;
    const stageWeights = Object.fromEntries(
      selectedConfigIds.map((cid) => [cid, Number(stagePercentages[cid]) || 0])
    );
    try {
      id = await createProjectFromOrder({
        order: selectedOrder,
        projectManager: {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          avatar: manager.avatar,
        },
        priority,
        startDate: new Date(`${startDate}T09:00:00`).toISOString(),
        stageConfigIds: selectedConfigIds,
        stageWeights,
        stageDurations,
        stageDurationUnits,
        specifications,
        plannedDuration: totalPlannedDays,
        durationUnit: 'Days',
      });
    } catch (err) {
      setErrors({ order: err?.message || 'The project could not be created.' });
      return;
    }

    showToast(`${id} created from ${selectedOrder.orderNumber}.`, 'success');
    reset();
    onCreated?.(id);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        existingProject
          ? `PMS Project: ${existingProject.code || existingProject.id} (${effectiveOrderNumber})`
          : isFixedOrder
          ? `Create Project from ${initialOrderNumber}`
          : 'Create Project from CRM Order'
      }
      subtitle={
        existingProject
          ? `Existing project linked to Sales Order ${effectiveOrderNumber}`
          : `New project will be created as ${projectCode}`
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            form="pms-create-project"
            icon={PackageCheck}
            disabled={!existingProject && advanceCheck.required && !advanceCheck.satisfied}
            title={!existingProject && advanceCheck.required && !advanceCheck.satisfied ? `Mandatory ${advanceCheck.requiredPct}% advance payment required before PMS project conversion` : undefined}
          >
            {existingProject
              ? existingProject.status === 'Completed'
                ? 'Open Project'
                : 'Save Stage Durations & Open'
              : !existingProject && advanceCheck.required && !advanceCheck.satisfied
              ? `Advance Required (${advanceCheck.requiredPct}%)`
              : 'Create Project'}
          </Button>
        </>
      }
    >
      <form id="pms-create-project" onSubmit={handleSubmit} className="space-y-4">
        {existingProject && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 flex items-start gap-2.5">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900">
              <div className="font-bold">Project {existingProject.code || existingProject.id} already exists for this order</div>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Saved stage durations and project details have been loaded. You can adjust stage durations below to recalculate the project's final due date without creating duplicate projects.
              </p>
            </div>
          </div>
        )}

        {/* Order picker: only shown when not launched with an order */}
        {!isFixedOrder && !existingProject && (
          <div>
            <label className={labelClass} htmlFor="pms-order">
              CRM Sales Order <span className="text-rose-500">*</span>
            </label>
            <select
              id="pms-order"
              className={fieldClass}
              value={orderNumber}
              onChange={(e) => {
                setOrderNumber(e.target.value);
                setErrors((prev) => ({ ...prev, order: undefined }));
              }}
            >
              <option value="">Select a confirmed sales order…</option>
              {availableOrders.map((o) => (
                <option key={o.orderNumber} value={o.orderNumber}>
                  {o.orderNumber} — {o.customer} ({formatCurrency(o.total ?? o.amount ?? 0)})
                </option>
              ))}
              {linkedOrders.length > 0 && (
                <optgroup label="Already converted (Loads existing project)">
                  {linkedOrders.map((o) => (
                    <option key={o.orderNumber} value={o.orderNumber}>
                      {o.orderNumber} — {o.customer} · linked to {o.linkedProjectId}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {errors.order && (
              <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                <AlertCircle size={11} /> {errors.order}
              </p>
            )}
          </div>
        )}

        {/* Auto-filled order summary */}
        {selectedOrder && (
          <div className="rounded-lg border border-[#dce5f4] bg-[#f6f9ff] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Link2 size={12} className="text-blue-500" />
              <span className="text-[11px] font-bold text-slate-700">
                {isFixedOrder ? `Details from sales order ${selectedOrder.orderNumber}` : 'Auto-filled from order'}
              </span>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Customer', selectedOrder.customer],
                ['Order value', formatCurrency(selectedOrder.total ?? selectedOrder.amount ?? 0)],
                ['Line items', selectedOrder.itemsCount ?? selectedOrder.items?.length ?? 0],
                ['Delivery due', selectedOrder.deliveryDate ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[10px] text-slate-500">{k}</dt>
                  <dd className="text-[11px] font-semibold text-slate-800 truncate" title={String(v)}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Advance Requirement Status for Selected Order */}
        {!existingProject && selectedOrder && advanceCheck.required && (
          <div
            className={`rounded-xl border p-3.5 space-y-2 text-xs transition-all ${
              advanceCheck.satisfied
                ? 'border-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50/90 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {advanceCheck.satisfied ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-xs">
                    {advanceCheck.satisfied
                      ? `✓ Advance Payment Requirement Cleared (${advanceCheck.requiredPct}%)`
                      : `Advance Payment Required: ${advanceCheck.requiredPct}% Policy`}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      advanceCheck.satisfied
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {advanceCheck.satisfied ? 'Eligible for PMS' : 'Conversion Blocked'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                  {advanceCheck.satisfied
                    ? `Customer policy requirement of ${advanceCheck.requiredPct}% advance payment has been satisfied. Received ${formatCurrency(advanceCheck.receivedAmount)} against required ${formatCurrency(advanceCheck.requiredAmount)}.`
                    : `Customer "${advanceCheck.customerName}" requires at least ${advanceCheck.requiredPct}% advance payment before converting this sales order into a PMS production project.`}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="bg-white/90 dark:bg-card p-2 rounded-lg border border-border/60">
                    <span className="text-[10px] text-muted block">Order Total</span>
                    <span className="font-mono font-bold text-text">{formatCurrency(advanceCheck.orderTotal)}</span>
                  </div>
                  <div className="bg-white/90 dark:bg-card p-2 rounded-lg border border-border/60">
                    <span className="text-[10px] text-muted block">Required ({advanceCheck.requiredPct}%)</span>
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(advanceCheck.requiredAmount)}</span>
                  </div>
                  <div className="bg-white/90 dark:bg-card p-2 rounded-lg border border-border/60">
                    <span className="text-[10px] text-muted block">Received Advance</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(advanceCheck.receivedAmount)}</span>
                  </div>
                  <div className="bg-white/90 dark:bg-card p-2 rounded-lg border border-border/60">
                    <span className={`text-[10px] block font-bold ${advanceCheck.satisfied ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {advanceCheck.satisfied ? 'Surplus / Cleared' : 'Shortfall Needed'}
                    </span>
                    <span className={`font-mono font-bold ${advanceCheck.satisfied ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {advanceCheck.satisfied ? '✓ Satisfied' : formatCurrency(advanceCheck.shortfall)}
                    </span>
                  </div>
                </div>

                {!advanceCheck.satisfied && (
                  <div className="pt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-rose-700 dark:text-rose-300 font-medium">
                      Please record an advance payment of at least <strong>{formatCurrency(advanceCheck.shortfall)}</strong> before project start.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {errors.advance && (
          <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1">
            <AlertCircle size={11} /> {errors.advance}
          </p>
        )}

        {/* Project Attributes (Start Date, Priority, Project Manager) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="pms-start">Start Date</label>
            <input
              id="pms-start"
              type="date"
              className={fieldClass}
              value={startDate}
              disabled={Boolean(existingProject)}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="pms-priority">Priority</label>
            <select
              id="pms-priority"
              className={fieldClass}
              value={priority}
              disabled={Boolean(existingProject)}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="pms-pm">
              Project Manager <span className="text-rose-500">*</span>
            </label>
            <select
              id="pms-pm"
              className={fieldClass}
              value={managerId}
              disabled={Boolean(existingProject)}
              onChange={(e) => setManagerId(e.target.value)}
            >
              <option value="">Select a manager…</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role}
                </option>
              ))}
            </select>
            {errors.manager && (
              <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                <AlertCircle size={11} /> {errors.manager}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="pms-specs">Specifications</label>
            <input
              id="pms-specs"
              type="text"
              className={fieldClass}
              value={specifications}
              disabled={Boolean(existingProject)}
              onChange={(e) => setSpecifications(e.target.value)}
              placeholder="Technical notes, tolerances, finish requirements…"
            />
          </div>
        </div>

        {/* Dynamic Timeline Calculation Preview Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 border border-blue-200/90 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Calculated Project Timeline</div>
              <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                <span className="text-sm font-extrabold text-slate-800">
                  Total Duration: {totalPlannedDays} {totalPlannedDays === 1 ? 'Day' : 'Days'}
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  · Final Due Date: <strong className="text-blue-900 font-bold">{formatExpectedDate(finalExpectedCompletionDate)}</strong>
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
            Stage durations calculate final due date
          </span>
        </div>

        {/* Existing Project Stages with Editable Stage Durations */}
        {existingProject && existingProject.stages && existingProject.stages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <span className={labelClass + ' mb-0'}>Configured Project Stages & Durations</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Total Weight: {Math.round(totalPercentage * 100) / 100}%
              </span>
            </div>
            <div className="rounded-lg border border-[#dce5f4] divide-y divide-slate-100 max-h-60 overflow-y-auto bg-white">
              {existingProject.stages.map((s) => {
                const isClosed = s.status === 'Completed' || s.status === 'Approved';
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-slate-50/80 flex-wrap"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-slate-800 truncate">
                        {s.sequence}. {s.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                        {s.department}
                      </span>
                      <StageStatusBadge status={s.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Stage-wise Duration Input */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-medium">Duration:</span>
                        {isClosed ? (
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {stageDurations[s.id] ?? s.plannedDuration} {stageDurationUnits[s.id] || s.durationUnit || 'Days'}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={stageDurations[s.id] !== undefined ? stageDurations[s.id] : s.plannedDuration ?? 1}
                              onChange={(e) => handleDurationChange(s.id, e.target.value)}
                              className="w-16 text-right text-xs rounded-md border border-[#dce5f4] px-1.5 py-1 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                            />
                            <select
                              value={stageDurationUnits[s.id] || s.durationUnit || 'Days'}
                              onChange={(e) => handleDurationUnitChange(s.id, e.target.value)}
                              className="text-[10px] text-slate-600 bg-white border border-[#dce5f4] rounded px-1.5 py-1 focus:outline-none"
                            >
                              <option value="Days">Days</option>
                              <option value="Hours">Hours</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Weight % */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Weight:</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {s.percentage ?? s.weightPct ?? s.weight ?? 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.stages && (
              <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                <AlertCircle size={11} /> {errors.stages}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5">
              Adjusting stage durations recalculates sequential deadlines and project expected completion date.
            </p>
          </div>
        )}

        {/* Stage Template Picker with Per-Stage Duration Inputs for New Projects */}
        {!existingProject && (
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={labelClass + ' mb-0'}>Stage Templates, Durations & Weights</span>
                <span className="text-[10px] text-slate-400">
                  ({selectedConfigIds.length} of {activeConfigs.length} selected)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedConfigIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDistributeEvenly}
                    className="text-[10px] font-semibold text-blue-600 hover:underline"
                  >
                    Distribute Evenly
                  </button>
                )}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    Math.round(totalPercentage * 100) / 100 === 100
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  Total Weight: {Math.round(totalPercentage * 100) / 100}% / 100%
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-[#dce5f4] divide-y divide-slate-100 max-h-60 overflow-y-auto bg-white">
              {activeConfigs.map((c) => {
                const isSelected = selectedConfigIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between gap-2.5 px-3 py-2 ${
                      isSelected ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleConfig(c.id)}
                        className="accent-blue-600"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 truncate">
                        {c.sequence}. {c.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                        {c.department}
                      </span>
                    </label>

                    {isSelected ? (
                      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Per-Stage Duration Input */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-medium">Duration:</span>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={stageDurations[c.id] !== undefined ? stageDurations[c.id] : c.defaultDuration ?? 1}
                            onChange={(e) => handleDurationChange(c.id, e.target.value)}
                            className="w-16 text-right text-xs rounded-md border border-[#dce5f4] px-1.5 py-1 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                            placeholder="1"
                          />
                          <select
                            value={stageDurationUnits[c.id] || c.durationUnit || 'Days'}
                            onChange={(e) => handleDurationUnitChange(c.id, e.target.value)}
                            className="text-[10px] text-slate-600 bg-white border border-[#dce5f4] rounded px-1.5 py-1 focus:outline-none"
                          >
                            <option value="Days">Days</option>
                            <option value="Hours">Hours</option>
                          </select>
                        </div>

                        {/* Weight % */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Weight:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={stagePercentages[c.id] ?? ''}
                            onChange={(e) => handlePercentageChange(c.id, e.target.value)}
                            className="w-14 text-right text-xs rounded-md border border-[#dce5f4] px-1.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                            placeholder="0"
                          />
                          <span className="text-[11px] font-bold text-slate-500">%</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        Default: {c.defaultDuration} {c.durationUnit}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {errors.stages && (
              <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                <AlertCircle size={11} /> {errors.stages}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5">
              Enter individual stage durations (e.g. Design: 5 Days). They sum up to determine the final project due date.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default CreateProjectModal;
