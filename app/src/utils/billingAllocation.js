/**
 * billingAllocation — frontend-only helpers for White (GST) / Black (Non-GST) split.
 *
 * UI terminology: "White Billing" = GST / tax invoice, "Black Billing" =
 * Non-GST / non-taxable allocation. Internally everything is stored as
 * taxable (white) vs non-taxable (black) base amounts; GST applies ONLY to
 * the white base. Nothing here hides amounts — all legs stay visible in
 * project, invoice, history and reports.
 */

export const BILLING_MODES = {
  FULL_WHITE: 'FULL_WHITE',
  FULL_BLACK: 'FULL_BLACK',
  SPLIT: 'SPLIT',
};

export const BILLING_TYPES = {
  WHITE: 'WHITE',
  BLACK: 'BLACK',
  SPLIT: 'SPLIT',
};

export const DEFAULT_GST_RATE = 18;

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function round2(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

/** Project/order value — mirrors ProjectInfoTab / CreateProjectModal sources. */
export function getProjectValue(project) {
  if (!project) return 0;
  const details = project.productDetails || {};
  return toNumber(
    details.orderValue ??
      project.contractValue ??
      project.budget ??
      project.total ??
      project.amount ??
      0
  );
}

/** Stored allocation on a project (defaults to full-white for legacy projects). */
export function getProjectAllocation(project) {
  const value = getProjectValue(project);
  const billing = project?.billing || {};
  let mode = billing.mode || BILLING_MODES.FULL_WHITE;
  let white = toNumber(billing.whiteAmount ?? value);
  let black = toNumber(billing.blackAmount ?? 0);
  const gstRate = billing.gstRate ?? DEFAULT_GST_RATE;

  // Legacy projects without billing block: everything is white/taxable.
  if (!project?.billing) {
    white = value;
    black = 0;
    mode = BILLING_MODES.FULL_WHITE;
  }
  if (mode === BILLING_MODES.FULL_WHITE) {
    white = value;
    black = 0;
  } else if (mode === BILLING_MODES.FULL_BLACK) {
    white = 0;
    black = value;
  }
  return normalizeAllocation({ projectValue: value, whiteAmount: white, blackAmount: black, gstRate, mode });
}

/** Core calculator — GST only on white base, black leg is always tax-free. */
export function normalizeAllocation({ projectValue, whiteAmount, blackAmount, gstRate = DEFAULT_GST_RATE, mode = BILLING_MODES.SPLIT }) {
  const value = Math.max(0, toNumber(projectValue));
  const rate = Math.min(100, Math.max(0, toNumber(gstRate, DEFAULT_GST_RATE)));
  let white = Math.max(0, toNumber(whiteAmount));
  let black = Math.max(0, toNumber(blackAmount));

  if (mode === BILLING_MODES.FULL_WHITE) {
    white = value;
    black = 0;
  } else if (mode === BILLING_MODES.FULL_BLACK) {
    white = 0;
    black = value;
  }

  white = round2(white);
  black = round2(black);
  const allocated = round2(white + black);
  const remaining = round2(value - allocated);
  const overBy = allocated > value ? round2(allocated - value) : 0;

  const gstAmount = round2((white * rate) / 100);
  const whiteTotal = round2(white + gstAmount);
  const blackTotal = round2(black);
  const invoiceTotal = round2(whiteTotal + blackTotal);

  // Mirror ERPContext intra/inter-state split (CGST+SGST vs IGST).
  const cgst = round2(gstAmount / 2);
  const sgst = round2(gstAmount - cgst);

  return {
    projectValue: value,
    mode,
    whiteAmount: white,
    blackAmount: black,
    gstRate: rate,
    gstAmount,
    cgst,
    sgst,
    igst: gstAmount,
    whiteTotal,
    blackTotal,
    invoiceTotal,
    allocated,
    remaining,
    overBy,
    isValid: overBy === 0,
  };
}

export function validateAllocation(alloc) {
  if (!alloc) return { valid: false, message: 'Enter billing amounts.' };
  if (alloc.whiteAmount < 0 || alloc.blackAmount < 0) {
    return { valid: false, message: 'Billing amounts cannot be negative.' };
  }
  if (!Number.isFinite(alloc.whiteAmount) || !Number.isFinite(alloc.blackAmount)) {
    return { valid: false, message: 'Enter valid billing amounts.' };
  }
  if (alloc.overBy > 0) {
    return { valid: false, message: `Billing allocation exceeds project value by ${alloc.overBy.toLocaleString('en-IN')}.` };
  }
  return { valid: true, message: 'Billing allocation is valid. Total allocation matches project value.' };
}

/** Derive invoice billing legs from stored fields (backwards compatible). */
export function getInvoiceBillingLegs(invoice) {
  if (!invoice) return { type: BILLING_TYPES.WHITE, whiteBase: 0, blackBase: 0, gstAmount: 0 };
  const type = invoice.billingType || invoice.billingMode || BILLING_TYPES.WHITE;
  const totalTax = toNumber(invoice.tax ?? ((invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0)));
  const total = toNumber(invoice.total ?? invoice.grandTotal ?? invoice.amount ?? 0);

  let whiteBase = toNumber(invoice.whiteAmount ?? invoice.whiteBase);
  let blackBase = toNumber(invoice.blackAmount ?? invoice.blackBase);
  const hasSplit = invoice.whiteAmount !== undefined || invoice.blackAmount !== undefined;

  if (!hasSplit) {
    // Legacy invoices: taxable unless explicitly marked non-taxable.
    if (type === BILLING_TYPES.BLACK) {
      whiteBase = 0;
      blackBase = round2(total);
    } else {
      whiteBase = round2(Math.max(0, total - totalTax));
      blackBase = 0;
    }
  }
  const gstAmount = type === BILLING_TYPES.BLACK ? 0 : round2(toNumber(invoice.whiteGst ?? totalTax));
  return { type, whiteBase: round2(whiteBase), blackBase: round2(blackBase), gstAmount };
}

export function isBillableInvoice(invoice) {
  return invoice && invoice.status !== 'Cancelled' && invoice.status !== 'Draft' && invoice.finalized !== false;
}

/** Invoices belonging to a project: direct projectId OR via sales order linkage. */
export function getProjectInvoices(allInvoices = [], project, salesOrders = []) {
  if (!project) return [];
  const orderNumbers = new Set();
  if (project.crmOrderId) orderNumbers.add(String(project.crmOrderId));
  const linkedOrder = (salesOrders || []).find(
    (o) => o.orderNumber === project.crmOrderId || o.id === project.crmOrderId
  );
  if (linkedOrder) {
    orderNumbers.add(String(linkedOrder.id));
    orderNumbers.add(String(linkedOrder.orderNumber));
  }
  return (allInvoices || []).filter((inv) => {
    if (inv.projectId && String(inv.projectId) === String(project.id)) return true;
    const soId = inv.salesOrderId || inv.sourceSalesOrderId;
    const soNo = inv.linkedSo;
    return (soId && orderNumbers.has(String(soId))) || (soNo && orderNumbers.has(String(soNo)));
  });
}

/** Remaining allocatable + history, cancelled/draft invoices excluded from consumed. */
export function getProjectBillingStatus(project, allInvoices = [], salesOrders = []) {
  const allocation = getProjectAllocation(project);
  const related = getProjectInvoices(allInvoices, project, salesOrders);
  const consumed = related.filter(isBillableInvoice);

  let whiteBilled = 0;
  let blackBilled = 0;
  let gstBilled = 0;
  consumed.forEach((inv) => {
    const legs = getInvoiceBillingLegs(inv);
    whiteBilled += legs.whiteBase;
    blackBilled += legs.blackBase;
    gstBilled += legs.gstAmount;
  });
  whiteBilled = round2(whiteBilled);
  blackBilled = round2(blackBilled);
  gstBilled = round2(gstBilled);

  const whiteRemaining = round2(Math.max(0, allocation.whiteAmount - whiteBilled));
  const blackRemaining = round2(Math.max(0, allocation.blackAmount - blackBilled));
  const baseBilled = round2(whiteBilled + blackBilled);
  const baseRemaining = round2(Math.max(0, allocation.allocated - baseBilled));

  return {
    allocation,
    invoices: related,
    consumed,
    whiteBilled,
    blackBilled,
    gstBilled,
    baseBilled,
    whiteRemaining,
    blackRemaining,
    remaining: baseRemaining,
    allocatable: baseRemaining,
  };
}

export function billingTypeLabel(type) {
  if (type === BILLING_TYPES.BLACK) return 'Black Billing (Non-GST)';
  if (type === BILLING_TYPES.SPLIT) return 'Split Billing';
  return 'White Billing (GST)';
}

export function billingModeLabel(mode) {
  if (mode === BILLING_MODES.FULL_BLACK) return 'Full Black Billing (Non-GST)';
  if (mode === BILLING_MODES.SPLIT) return 'Split Billing';
  return 'Full White Billing (GST)';
}
