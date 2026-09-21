/**
 * Manufacturing Module — Pure Calculation & Formatting Utilities
 *
 * Centralized business logic for BOM calculations, scrap factors, material
 * availability, consumption variance, weighted progress, labour costing,
 * batch unit cost, and project profitability.
 */

/** Calculate total estimated cost of BOM components */
export function computeBomCost(components = []) {
  if (!Array.isArray(components)) return 0;
  return components.reduce((sum, item) => {
    const qty = Number(item.requiredQty ?? item.quantity ?? 0);
    const rate = Number(item.estimatedRate ?? 0);
    return sum + (qty * rate);
  }, 0);
}

/** Calculate total component quantity in BOM */
export function computeBomTotalQty(components = []) {
  if (!Array.isArray(components)) return 0;
  return components.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
}

/** Calculate required component quantity factoring in scrap percentage */
export function computeRequiredWithScrap(baseQty, scrapPct = 0) {
  const qty = Number(baseQty || 0);
  const scrap = Number(scrapPct || 0);
  if (scrap <= 0) return qty;
  return Math.ceil(qty * (1 + scrap / 100));
}

/** Material shortage & reservation balance calculation */
export function computeMaterialBalance(requiredQty, availableStock, reservedStock = 0) {
  const req = Number(requiredQty || 0);
  const avail = Number(availableStock || 0);
  const res = Number(reservedStock || 0);

  const availableAfterReservation = Math.max(0, avail - res);
  const shortage = Math.max(0, req - availableAfterReservation);
  const surplus = Math.max(0, availableAfterReservation - req);

  let status = 'Stock Available';
  if (shortage > 0) {
    status = availableAfterReservation === 0 ? 'Shortage' : 'Partially Available';
  }

  return {
    availableAfterReservation,
    shortage,
    surplus,
    status,
  };
}

/** Consumption variance calculation */
export function computeConsumptionVariance(plannedQty, actualConsumedQty) {
  const planned = Number(plannedQty || 0);
  const consumed = Math.max(0, Number(actualConsumedQty || 0)); // cannot be negative
  const variance = consumed - planned;
  const variancePct = planned > 0 ? ((variance / planned) * 100) : 0;

  let tone = 'normal'; // 'normal' | 'warning' | 'danger'
  if (variancePct > 10) {
    tone = 'danger';
  } else if (variancePct > 2) {
    tone = 'warning';
  } else if (variancePct < 0) {
    tone = 'savings';
  }

  return {
    variance: Math.round(variance * 100) / 100,
    variancePct: Math.round(variancePct * 10) / 10,
    tone,
  };
}

/**
 * Weighted manufacturing progress calculation.
 * Each stage carries a defined percentage weight. Total weight = 100%.
 * Contribution of each stage = (completionPct * weight) / 100.
 */
export function computeWeightedProgress(stages = []) {
  if (!Array.isArray(stages) || stages.length === 0) return 0;
  
  const totalWeight = stages.reduce((acc, s) => acc + Number(s.weight ?? 0), 0);
  
  // If weights are missing or not set to 100, fallback to equal weighting
  if (totalWeight <= 0) {
    const sum = stages.reduce((acc, s) => acc + Number(s.completionPct ?? 0), 0);
    return Math.min(100, Math.max(0, Math.round(sum / stages.length)));
  }

  const weightedSum = stages.reduce((acc, stage) => {
    const pct = Math.min(100, Math.max(0, Number(stage.completionPct ?? 0)));
    const weight = Number(stage.weight ?? (100 / stages.length));
    return acc + (pct * (weight / totalWeight));
  }, 0);

  return Math.min(100, Math.max(0, Math.round(weightedSum)));
}

/** Calculate labour cost from regular and overtime hours */
export function computeLabourCost(regularHours = 0, ratePerHour = 0, overtimeHours = 0, overtimeRateMultiplier = 1.5) {
  const regHrs = Number(regularHours || 0);
  const rate = Number(ratePerHour || 0);
  const otHrs = Number(overtimeHours || 0);
  const otRate = rate * overtimeRateMultiplier;

  const regularCost = regHrs * rate;
  const overtimeCost = otHrs * otRate;
  const totalCost = regularCost + overtimeCost;
  const totalHours = regHrs + otHrs;

  return {
    regularCost,
    overtimeCost,
    totalCost,
    totalHours,
  };
}

/** Calculate total production cost breakdown */
export function computeProductionCost({
  materialCost = 0,
  labourCost = 0,
  machineCost = 0,
  overheadCost = 0,
  reworkCost = 0,
  scrapCost = 0,
  otherCost = 0,
} = {}) {
  const mat = Number(materialCost || 0);
  const lab = Number(labourCost || 0);
  const mac = Number(machineCost || 0);
  const ovh = Number(overheadCost || 0);
  const rwk = Number(reworkCost || 0);
  const scp = Number(scrapCost || 0);
  const oth = Number(otherCost || 0);

  const total = mat + lab + mac + ovh + rwk + scp + oth;
  return {
    materialCost: mat,
    labourCost: lab,
    machineCost: mac,
    overheadCost: ovh,
    reworkCost: rwk,
    scrapCost: scp,
    otherCost: oth,
    totalCost: total,
  };
}

/** Calculate batch unit cost and planned vs actual variance */
export function computeBatchCost(totalCost = 0, batchQuantity = 1, plannedCost = 0) {
  const cost = Number(totalCost || 0);
  const qty = Math.max(1, Number(batchQuantity || 1));
  const planned = Number(plannedCost || cost);

  const costPerUnit = Math.round((cost / qty) * 100) / 100;
  const variance = cost - planned;
  const variancePct = planned > 0 ? ((variance / planned) * 100) : 0;

  return {
    totalCost: cost,
    costPerUnit,
    plannedCost: planned,
    variance: Math.round(variance * 100) / 100,
    variancePct: Math.round(variancePct * 10) / 10,
    isOverBudget: variance > 0,
  };
}

/** Calculate project profitability, gross profit, and margin % */
export function computeProjectProfitability(revenue = 0, totalCost = 0, plannedProfit = null) {
  const rev = Number(revenue || 0);
  const cost = Number(totalCost || 0);
  const grossProfit = rev - cost;
  const profitMargin = rev > 0 ? Math.round(((grossProfit / rev) * 100) * 10) / 10 : 0;

  const targetProfit = plannedProfit !== null ? Number(plannedProfit) : Math.round(rev * 0.35);
  const profitVariance = grossProfit - targetProfit;

  return {
    revenue: rev,
    totalCost: cost,
    grossProfit,
    profitMargin,
    plannedProfit: targetProfit,
    profitVariance,
    isHealthy: profitMargin >= 25,
  };
}

/** Status badge class mappings for manufacturing */
export function getManufacturingStatusStyle(status) {
  const label = status || 'Planned';
  switch (label) {
    case 'Active':
    case 'Approved':
    case 'Stock Available':
    case 'Completed':
    case 'Delivered':
    case 'Packed':
    case 'Healthy':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        bgColor: '#ecfdf5',
        color: '#047857',
        bgClass: 'bg-emerald-50',
        label,
      };

    case 'In Progress':
    case 'In Production':
    case 'Issued':
    case 'Dispatched':
    case 'In Transit':
    case 'Under Review':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        bgColor: '#eff6ff',
        color: '#1d4ed8',
        bgClass: 'bg-blue-50',
        label,
      };

    case 'Partially Available':
    case 'Partially Issued':
    case 'Pending Approval':
    case 'At Risk':
    case 'Requested':
    case 'Need Improvement':
    case 'Reserved':
    case 'QC Ready':
    case 'Ready for Dispatch':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        bgColor: '#fffbeb',
        color: '#b45309',
        bgClass: 'bg-amber-50',
        label,
      };

    case 'Shortage':
    case 'Delayed':
    case 'Blocked':
    case 'Rejected':
    case 'Cancelled':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        bgColor: '#fff1f2',
        color: '#be123c',
        bgClass: 'bg-rose-50',
        label,
      };

    case 'Draft':
    case 'Planned':
    case 'Not Started':
    case 'Scheduled':
    case 'Superseded':
    case 'Archived':
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        bgColor: '#f8fafc',
        color: '#334155',
        bgClass: 'bg-slate-50',
        label,
      };
  }
}
