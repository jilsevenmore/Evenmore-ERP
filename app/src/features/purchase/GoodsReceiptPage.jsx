import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { PackageCheck, Truck, ClipboardCheck, ShieldCheck, X, CheckCircle2, AlertTriangle, Boxes, Scale, FileText, ArrowRight } from 'lucide-react';
import { createShortSupplyDebitNote, fetchVendorWeightVariations } from '../../services/upgradeService';

// ── [PHASE-2B] Standalone Goods Receipt (GRN) page ────────────────────────
// New: before this page, goods receipt was an embedded action inside bill
//   creation (auto-stock on addPurchaseBill). The 3-way match (PO ⇄ GRN ⇄ Bill)
//   now has its own screen where received quantity is confirmed against the
//   purchase order before inventory (and QC status) is updated.
const goodsReceiptGuide = {
    title: 'Goods Receipt Notes (GRN)',
    subtitle: 'Physical intake verification, 3-way matching (PO ⇄ GRN ⇄ Bill), and QC checkpoint.',
    purpose: 'Every purchase bill must be physically received before it hits inventory. This screen logs the actual received quantity per line, compares it with the ordered quantity, flags over/short supplies, and captures the QC verdict (Approved / Pending / Rejected).',
    keyTerms: [
        { term: 'GRN (Goods Receipt Note)', definition: 'The warehouse document confirming actual quantity received against a PO/Bill.' },
        { term: '3-Way Match', definition: 'PO ordered qty = GRN received qty = Bill billed qty. Mismatches auto flag over/short supply.' },
        { term: 'QC Checkpoint', definition: 'Quality verdict captured at intake — pending receipts can block invoicing/dispatch.' },
    ],
    tips: [
        'Only bills with "Awaiting Receipt" status appear here — already received bills are hidden.',
        'Enter the actual weighed/measured quantity per line before confirming.',
        'Rejected lines create a rework flag — send material to Faulty Parts for vendor claim.',
    ],
    workflow: ['PO Issued', 'Goods Arrive', 'GRN Verified', 'QC Checked', 'Stock Updated'],
};
export const GoodsReceiptPage = () => {
    const {
        purchaseBills,
        purchaseOrders,
        vendors,
        items: masterItems,
        receivePurchaseBillGoods,
        updateQCStatus,
        qualityStandards = [],
        getPoBilledStatus,
        getBillOutstanding,
        formatCurrency,
        formatDateDDMMYYYY,
        getCurrentISODate,
        getCurrentDateFormatted,
    } = useERP();

    const [selectedBill, setSelectedBill] = useState(null);
    const [receivedQtys, setReceivedQtys] = useState({});
    const [receivedWeights, setReceivedWeights] = useState({}); // [PHASE-2A] weighbridge kg per line
    const [qcStatus, setQcStatus] = useState('Approved');
    const [note, setNote] = useState('');

    // Short-Supply Debit Note State
    const [showDebitNoteModal, setShowDebitNoteModal] = useState(false);
    const [debitNoteBill, setDebitNoteBill] = useState(null);
    const [debitNoteItems, setDebitNoteItems] = useState([]);
    const [debitNoteTotal, setDebitNoteTotal] = useState(0);
    const [debitNoteReason, setDebitNoteReason] = useState('Warehouse Intake Short Supply — Received less than invoiced quantity');
    const [isSubmittingDebitNote, setIsSubmittingDebitNote] = useState(false);

    // Server-side Vendor Weight Variations
    const [serverWeightVariations, setServerWeightVariations] = useState([]);
    useEffect(() => {
        fetchVendorWeightVariations().then(res => {
            if (res?.data && Array.isArray(res.data)) {
                setServerWeightVariations(res.data);
            } else if (Array.isArray(res)) {
                setServerWeightVariations(res);
            }
        }).catch(() => {});
    }, []);

    // ── [PHASE-2A] helper: resolve weight metadata for a bill line (master item + line fields) ──
    const getLineWeightMeta = (line) => {
        const masterObj = line?.itemId
            ? masterItems.find((mi) => mi.id === line.itemId || mi.sku === line.sku)
            : null;
        return {
            isWeightItem: Boolean(line.isWeightItem) || Boolean(masterObj?.isWeightItem),
            theoreticalWeight: Number(line.theoreticalWeight ?? masterObj?.theoreticalWeight ?? 0) || 0,
            tolerancePct: line.tolerancePct !== undefined ? Number(line.tolerancePct) : (masterObj?.tolerancePct !== undefined ? Number(masterObj.tolerancePct) : 2),
            weightUnit: line.weightUnit || masterObj?.weightUnit || 'kg',
        };
    };

    // Bills still waiting for goods receipt
    const pendingReceipts = (purchaseBills || []).filter((b) => b.goodsReceived !== true && b.status !== 'Cancelled');
    const receivedCount = (purchaseBills || []).filter((b) => b.goodsReceived === true).length;
    const pendingQty = pendingReceipts.reduce((sum, b) => sum + (b.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0), 0);
    const pendingValue = pendingReceipts.reduce((sum, b) => sum + (Number(b.total ?? b.amount) || 0), 0);
    const pendingWeight = pendingReceipts.reduce((sum, b) => sum + (b.items || []).reduce((s, it) => {
        const meta = getLineWeightMeta(it);
        return s + (meta.isWeightItem ? (Number(it.theoreticalWeight ?? 0) * Number(it.qty || 0)) : 0);
    }, 0), 0);

    // ── [PHASE-2A] Vendor weight-variation history (past weighted GRNs) ──
    const variationHistory = (purchaseBills || [])
        .filter((b) => b.goodsReceived === true && b.items?.some((it) => it.variationPct !== undefined && it.variationPct !== null))
        .flatMap((b) => (b.items || [])
            .filter((it) => it.variationPct !== undefined && it.variationPct !== null)
            .map((it) => ({
                billNumber: b.billNumber,
                vendor: b.vendor,
                receivedDate: b.receivedDate,
                itemName: it.name || it.description,
                sku: it.sku || it.itemSku,
                orderedQty: it.orderedQty ?? it.qty,
                receivedQty: it.receivedQty ?? it.qty,
                orderedWeight: Number(it.theoreticalWeight || 0) * Number((it.orderedQty ?? it.qty) || 0),
                receivedWeight: Number(it.receivedWeight || 0),
                variationPct: Number(it.variationPct || 0),
                tolerancePct: it.tolerancePct,
            })))
        .sort((a, b2) => (b2.receivedDate || '').localeCompare(a.receivedDate || ''));

    // ── [PHASE-2C] receipts held at a non-Approved QC verdict (need human decision) ──
    const qcReviewBills = (purchaseBills || []).filter((b) =>
        b.goodsReceived === true && b.status !== 'Cancelled' && b.qcStatus && b.qcStatus !== 'Approved'
    );

    const openReceiveModal = (bill) => {
        setSelectedBill(bill);
        const initial = {};
        const initialWeights = {};
        (bill.items || []).forEach((it, idx) => {
            const key = it.id || `line-${idx}`;
            initial[key] = Number(it.qty || 0);
            const meta = getLineWeightMeta(it);
            initialWeights[key] = it.receivedWeight || (meta.isWeightItem ? Number((meta.theoreticalWeight || 0) * Number(it.qty || 1)) : undefined);
        });
        setReceivedQtys(initial);
        setReceivedWeights(initialWeights);
        setQcStatus('Approved');
        setNote('');
    };

    const updateQty = (lineKey, value) => {
        setReceivedQtys((prev) => ({ ...prev, [lineKey]: value }));
    };

    const updateWeight = (lineKey, value) => {
        setReceivedWeights((prev) => ({ ...prev, [lineKey]: value }));
    };

    // Live variation preview for one weight line (returns null when not applicable)
    const computeVariation = (line, idx) => {
        const key = line.id || `line-${idx}`;
        const meta = getLineWeightMeta(line);
        if (!meta.isWeightItem || !meta.theoreticalWeight) return null;
        const orderedQty = Number(line.orderedQty ?? line.qty) || 1;
        const expectedWeight = meta.theoreticalWeight * orderedQty;
        const receivedWeight = Number(receivedWeights[key]) > 0
            ? Number(receivedWeights[key])
            : Number(line.receivedWeight) > 0
                ? Number(line.receivedWeight)
                : expectedWeight;
        const variationPct = expectedWeight > 0 ? ((receivedWeight - expectedWeight) / expectedWeight) * 100 : 0;
        return {
            ...meta,
            expectedWeight,
            receivedWeight,
            variationPct,
            withinTolerance: Math.abs(variationPct) <= meta.tolerancePct,
        };
    };

    const handleInitiateDebitNote = (bill, customItems = null) => {
        setDebitNoteBill(bill);
        let items = [];
        if (customItems) {
            items = customItems;
        } else {
            items = (bill.items || []).map((it, idx) => {
                const ordered = Number(it.orderedQty ?? it.qty) || 0;
                const rec = Number(it.receivedQty ?? it.qty) || 0;
                const diff = Math.max(0, ordered - rec);
                const unitPrice = Number(it.rate ?? it.price ?? 0) || (it.amount && ordered ? it.amount / ordered : 0);
                return {
                    name: it.name || it.description || 'Item',
                    sku: it.sku || it.itemSku || '',
                    ordered,
                    received: rec,
                    shortfallQty: diff,
                    unitPrice,
                    shortfallAmount: diff * unitPrice,
                };
            }).filter(x => x.shortfallQty > 0);
        }
        const tot = items.reduce((acc, it) => acc + (it.shortfallAmount || 0), 0);
        setDebitNoteItems(items);
        setDebitNoteTotal(tot);
        setDebitNoteReason(`Intake shortfall claim against Bill ${bill.billNumber || bill.id}`);
        setShowDebitNoteModal(true);
    };

    const handleSubmitDebitNote = async (e) => {
        e.preventDefault();
        if (!debitNoteBill) return;
        setIsSubmittingDebitNote(true);
        try {
            await createShortSupplyDebitNote(debitNoteBill.id, {
                noteReason: debitNoteReason,
                shortfallAmount: debitNoteTotal,
                shortfallItems: debitNoteItems,
            });
            alert(`Short Supply Debit Note successfully created against ${debitNoteBill.billNumber || 'Bill'}.`);
            setShowDebitNoteModal(false);
            setDebitNoteBill(null);
        } catch (err) {
            alert('Failed to create debit note: ' + (err.message || 'Error occurred'));
        } finally {
            setIsSubmittingDebitNote(false);
        }
    };

    const confirmReceipt = () => {
        if (!selectedBill) return;
        const shortfalls = [];
        const overrides = (selectedBill.items || []).map((it, idx) => {
            const key = it.id || `line-${idx}`;
            const meta = getLineWeightMeta(it);
            const ordered = Number(it.orderedQty ?? it.qty) || 0;
            const rec = Number(receivedQtys[key] || 0) || 0;
            if (rec < ordered) {
                const diff = ordered - rec;
                const unitPrice = Number(it.rate ?? it.price ?? 0) || (it.amount && ordered ? it.amount / ordered : 0);
                shortfalls.push({
                    name: it.name || it.description || 'Item',
                    sku: it.sku || it.itemSku || '',
                    ordered,
                    received: rec,
                    shortfallQty: diff,
                    unitPrice,
                    shortfallAmount: diff * unitPrice,
                });
            }
            return {
                lineIndex: idx,
                lineId: it.id,
                sku: it.sku || it.itemSku,
                receivedQty: rec,
                receivedWeight: meta.isWeightItem ? (Number(receivedWeights[key]) > 0 ? Number(receivedWeights[key]) : undefined) : undefined,
            };
        });
        const currentBill = selectedBill;
        receivePurchaseBillGoods(selectedBill.id, overrides, qcStatus);
        setSelectedBill(null);

        if (shortfalls.length > 0) {
            handleInitiateDebitNote(currentBill, shortfalls);
        }
    };

    const orderedVsReceivedPct = (bill, idx) => {
        const line = (bill.items || [])[idx];
        if (!line) return 100;
        const ordered = Number(line.orderedQty ?? line.qty) || 0;
        const received = Number(receivedQtys[line.id || `line-${idx}`] ?? line.qty) || 0;
        return ordered > 0 ? Math.round((received / ordered) * 100) : 100;
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Goods Receipt Notes (GRN)"
                subtitle="Receive stock against vendor bills — 3-way match & QC checkpoint"
                guide={goodsReceiptGuide}
                actions={<span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><PackageCheck size={14} /> Intake Workbench</span>}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Awaiting Receipt" value={`${pendingReceipts.length} Bills`} icon={Truck} tone="amber" />
                <StatCard label="Pending Qty" value={`${pendingQty.toLocaleString()} Units`} icon={Boxes} />
                {/* [PHASE-2A] pending weight captures kg not yet weighed in */}
                <StatCard label="Receivable Value" value={formatCurrency(pendingValue)} icon={ClipboardCheck} tone="blue" />
                <StatCard label="Received (GRN Done)" value={`${receivedCount} Bills`} icon={ShieldCheck} tone="green" />
            </div>

            {/* ── [PHASE-2A] Vendor weight-variation history (steel variance register) ── */}
            {(variationHistory.length > 0) && (
                <div className="bg-white border border-[#CED4DA] rounded-lg overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap lg:flex-nowrap gap-2 lg:gap-0">
                        <div>
                            <h3 className="font-bold text-sm text-[#1F2E4A]">Weight Variation Register</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Every weighed receipt vs its theoretical weight — drift above tolerance goes to Pending Approval.</p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">{variationHistory.length} weighed lines</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] lg:min-w-0 text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-2.5 px-3">Bill</th>
                                    <th className="py-2.5 px-3">Vendor</th>
                                    <th className="py-2.5 px-3">Item</th>
                                    <th className="py-2.5 px-3 text-right">Expected Wt</th>
                                    <th className="py-2.5 px-3 text-right">Weighed Wt</th>
                                    <th className="py-2.5 px-3 text-right">Variation</th>
                                    <th className="py-2.5 px-3 text-center">Ver</th>
                                    <th className="py-2.5 px-3 text-center">Tol</th>
                                    <th className="py-2.5 px-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {variationHistory.map((row, i) => {
                                    const overTol = Math.abs(row.variationPct) > (row.tolerancePct ?? 2);
                                    return (
                                        <tr key={`${row.billNumber}-${i}`} className="hover:bg-slate-50/70">
                                            <td className="p-2.5 font-mono font-semibold text-slate-800">{row.billNumber}</td>
                                            <td className="p-2.5">{row.vendor}</td>
                                            <td className="p-2.5">
                                                <p className="font-semibold text-slate-700">{row.itemName}</p>
                                                <span className="text-[10px] text-slate-400 font-mono">{row.sku}</span>
                                            </td>
                                            <td className="p-2.5 text-right font-mono">{row.orderedWeight.toFixed(2)} kg</td>
                                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{row.receivedWeight.toFixed(2)} kg</td>
                                            <td className={`p-2.5 text-right font-mono font-bold ${overTol ? 'text-rose-600' : 'text-emerald-700'}`}>
                                                {row.variationPct > 0 ? '+' : ''}{row.variationPct.toFixed(2)}%
                                            </td>
                                            <td className="p-2.5 text-center font-mono">{row.receivedQty}</td>
                                            <td className="p-2.5 text-center font-mono">±{row.tolerancePct ?? 2}%</td>
                                            <td className="p-2.5 text-center">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${overTol ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                    {overTol ? 'Pending Approval' : 'Within Tolerance'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── [PHASE-2C] QC review board: received stock awaiting the QC verdict ── */}
            <div className="bg-white border border-[#CED4DA] rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h3 className="font-bold text-sm text-[#1F2E4A]">QC Review Board</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Receipts held at <span className="font-semibold text-amber-700">Pending Approval</span> (weight variance beyond tolerance) or
                            <span className="font-semibold text-rose-700"> Rejected</span>. Dispatch is blocked until cleared — ship no unchecked steel.
                        </p>
                    </div>
                    {qualityStandards.length > 0 && (
                        <span className="text-[10px] font-mono text-slate-400">{qualityStandards.length} QC standards on file</span>
                    )}
                </div>

                {qcReviewBills.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        <ShieldCheck size={28} className="mx-auto mb-2 text-emerald-500" />
                        No receipts pending QC — all inbound goods are cleared for inventory & dispatch.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] lg:min-w-0 text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-2.5 px-3">Bill / Received</th>
                                    <th className="py-2.5 px-3">Vendor</th>
                                    <th className="py-2.5 px-3">QC Status</th>
                                    <th className="py-2.5 px-3">QC Remarks</th>
                                    <th className="py-2.5 px-3 text-right">Receipt Value</th>
                                    <th className="py-2.5 px-3 text-center">Verdict</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {qcReviewBills.map((b) => {
                                    const isPending = b.qcStatus !== 'Approved' && b.qcStatus !== 'Rejected' && b.qcStatus !== 'Rework';
                                    return (
                                        <tr key={b.id} className="hover:bg-slate-50/70">
                                            <td className="p-2.5">
                                                <p className="font-mono font-semibold text-slate-800">{b.billNumber}</p>
                                                <span className="text-[10px] text-slate-400 font-mono">{b.receivedDate ? formatDateDDMMYYYY(b.receivedDate) : ''}</span>
                                            </td>
                                            <td className="p-2.5 font-semibold text-slate-700">{b.vendor}</td>
                                            <td className="p-2.5">
                                                <StatusBadge
                                                    status={isPending ? 'Pending Approval' : b.qcStatus}
                                                    tone={b.qcStatus === 'Rejected' ? 'rose' : b.qcStatus === 'Rework' ? 'amber' : b.qcStatus === 'Approved' ? 'green' : 'amber'}
                                                />
                                            </td>
                                            <td className="p-2.5 text-slate-500 max-w-[220px]">
                                                <span className="line-clamp-2">{b.qcNote || (b.items || []).find((it) => it.variationPct !== undefined)?.variationPct !== undefined ? 'Weight variance flagged on receipt' : 'QC pending review'}</span>
                                            </td>
                                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(Number(b.total ?? b.amount) || 0)}</td>
                                            <td className="p-2.5 text-center whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => { updateQCStatus(b.id, 'Approved', 'Cleared after inspection'); }}
                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold cursor-pointer transition"
                                                        title="Approve — stock becomes dispatch-eligible"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => { updateQCStatus(b.id, 'Rework', 'Sent back for rework / re-receipt'); }}
                                                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[11px] font-semibold cursor-pointer transition"
                                                        title="Rework — goods returned to vendor, re-receive later"
                                                    >
                                                        Rework
                                                    </button>
                                                    <button
                                                        onClick={() => { updateQCStatus(b.id, 'Rejected', 'Rejected — raise purchase return / debit note'); }}
                                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-semibold cursor-pointer transition"
                                                        title="Reject — movement should be offset via purchase return & debit note"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* QC standards master (reference) */}
                {qualityStandards.length > 0 && (
                    <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/60">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Reference — Intake QC Standards</p>
                        <div className="flex flex-wrap gap-2">
                            {qualityStandards.map((qs) => (
                                <span key={qs.id} className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-1">
                                    <ShieldCheck size={10} className="text-blue-600" />
                                    <span className="font-semibold">{qs.name}</span>
                                    <span className="text-slate-400">· ±{qs.tolerancePct}% wt tol</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white border border-[#CED4DA] rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm text-[#1F2E4A]">Bills Pending Goods Receipt</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Verify physical quantity, QC verdict, then confirm GRN to increase stock.</p>
                    </div>
                </div>

                {pendingReceipts.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-sm">
                        <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-500" />
                        All purchase bills are received — no pending GRNs.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] lg:min-w-0 text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-2.5 px-3">Bill / PO</th>
                                    <th className="py-2.5 px-3">Vendor</th>
                                    <th className="py-2.5 px-3 text-center">Lines</th>
                                    <th className="py-2.5 px-3 text-center">Ordered Qty</th>
                                    <th className="py-2.5 px-3 text-right">Bill Amount</th>
                                    <th className="py-2.5 px-3 text-right">Due Date</th>
                                    <th className="py-2.5 px-3 text-center">Status</th>
                                    <th className="py-2.5 px-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingReceipts.map((b) => {
                                    const poInfo = getPoBilledStatus?.(b.purchaseOrderId) || { totalOrderedQty: 0, lines: [] };
                                    const billQty = (b.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
                                    return (
                                        <tr key={b.id} className="hover:bg-slate-50/70">
                                            <td className="p-2.5">
                                                <p className="font-mono font-semibold text-slate-800">{b.billNumber}</p>
                                                <span className="text-[10px] text-slate-400 font-mono">{b.linkedPo || b.poRef || 'Direct Bill'}</span>
                                            </td>
                                            <td className="p-2.5">
                                                <p className="font-semibold text-slate-700">{b.vendor}</p>
                                                <span className="text-[10px] text-slate-400">{vendors.find((v) => v.id === b.vendorId)?.city || ''}</span>
                                            </td>
                                            <td className="p-2.5 text-center font-mono">{(b.items || []).length}</td>
                                            <td className="p-2.5 text-center font-mono">{billQty.toLocaleString()}</td>
                                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(Number(b.total ?? b.amount) || 0)}</td>
                                            <td className="p-2.5 text-right font-mono">{b.dueDate ? formatDateDDMMYYYY(b.dueDate) : '—'}</td>
                                            <td className="p-2.5 text-center"><StatusBadge status={b.goodsReceived ? 'Received' : 'Awaiting Receipt'} /></td>
                                            <td className="p-2.5 text-center">
                                                <button
                                                    onClick={() => openReceiveModal(b)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-dark transition shadow-2xs cursor-pointer"
                                                >
                                                    <PackageCheck size={13} /> Receive Goods
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedBill && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-150">
                    <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                        <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between gap-2 lg:gap-0 sticky top-0 bg-card z-10">
                            <div>
                                <h3 className="font-bold text-text text-base">Goods Receipt — {selectedBill.billNumber}</h3>
                                <p className="text-xs text-muted mt-0.5">{selectedBill.vendor} • {selectedBill.linkedPo || 'Direct Bill'}</p>
                            </div>
                            <button onClick={() => setSelectedBill(null)} className="p-1.5 rounded-xl hover:bg-card-hover text-muted hover:text-text cursor-pointer transition"><X size={18} /></button>
                        </div>

                        <div className="p-4 sm:p-5 space-y-5">
                            {/* Line-by-line received quantity */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Received Quantity per Line (Actual / Weighed)</h4>
                                <div className="space-y-2">
                                    {(selectedBill.items || []).map((it, idx) => {
                                        const key = it.id || `line-${idx}`;
                                        const ordered = Number(it.orderedQty ?? it.qty) || 0;
                                        const pct = orderedVsReceivedPct(selectedBill, idx);
                                        const wMeta = getLineWeightMeta(it);
                                        const variation = computeVariation(it, idx);
                                        return (
                                            <div key={key} className={`p-3 border rounded-lg bg-[#F8F9FA] ${variation && !variation.withinTolerance ? 'border-rose-300' : 'border-slate-200'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-800 text-xs truncate">{it.name || it.description || 'Item'}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">{it.sku || it.itemSku} • Ordered: {ordered}</p>
                                                        {wMeta.isWeightItem && (
                                                            <p className="text-[10px] text-blue-700 mt-0.5 flex items-center gap-1">
                                                                <Scale size={10} /> Weight item • Thero. {wMeta.theoreticalWeight} {wMeta.weightUnit}/unit • Tol ±{wMeta.tolerancePct}%
                                                            </p>
                                                        )}
                                                        {pct < 100 && (
                                                            <p className="text-[10px] text-amber-700 mt-0.5 flex items-center gap-1"><AlertTriangle size={10} /> Short / partial receipt ({pct}% of order)</p>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={receivedQtys[key] ?? ordered}
                                                        onChange={(e) => updateQty(key, e.target.value)}
                                                        className="w-24 border border-slate-300 rounded-lg p-2 text-right font-mono text-slate-800"
                                                    />
                                                    <span className="text-[10px] text-slate-400 w-14 text-center">Received</span>
                                                </div>
                                                {/* ── [PHASE-2A] weighbridge input — appears for steel / weight items ── */}
                                                {wMeta.isWeightItem && (
                                                    <div className="mt-2 pl-1 flex flex-wrap lg:flex-nowrap items-center gap-3">
                                                        <Scale size={13} className="text-blue-600 shrink-0" />
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step="0.01"
                                                            value={receivedWeights[key] ?? ''}
                                                            placeholder={`Expected ~${(wMeta.theoreticalWeight * ordered).toFixed(2)} ${wMeta.weightUnit}`}
                                                            onChange={(e) => updateWeight(key, e.target.value)}
                                                            className="w-32 border border-blue-200 rounded-lg p-2 text-right font-mono text-slate-800"
                                                        />
                                                        <span className="text-[10px] text-slate-400 w-14">{wMeta.weightUnit} weighed</span>
                                                        {variation && (
                                                            <span className={`text-[11px] font-mono font-bold px-2 py-1 rounded-md ${variation.withinTolerance ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                                                                {variation.variationPct > 0 ? '+' : ''}{variation.variationPct.toFixed(2)}% vs {variation.expectedWeight.toFixed(2)} {wMeta.weightUnit}
                                                                {!variation.withinTolerance && ' — over tolerance → Pending Approval'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* QC checkpoint — [PHASE-2C] standard statuses: Approved / Pending Approval / Rejected */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">QC Checkpoint</h4>
                                <div className="flex flex-wrap lg:flex-nowrap gap-2">
                                    {['Approved', 'Pending Approval', 'Rejected'].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => setQcStatus(q)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition ${
                                                qcStatus === q
                                                    ? q === 'Approved'
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : q === 'Rejected'
                                                            ? 'bg-rose-600 text-white border-rose-600'
                                                            : 'bg-amber-500 text-white border-amber-500'
                                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1.5">
                                    Weight lines outside tolerance are auto-forced to <span className="font-semibold text-amber-700">Pending Approval</span> regardless of this selection.
                                </p>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Weighbridge slip / gate pass / QC remarks (optional)"
                                    className="mt-2 w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-700"
                                />
                            </div>

                            {/* 3-way match summary */}
                            <div className="bg-white border border-slate-200 rounded-lg p-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                                <div className="p-2 rounded-md bg-slate-50">
                                    <p className="text-slate-400 font-semibold uppercase">PO Ordered</p>
                                    <p className="font-mono font-bold text-slate-800 mt-0.5">
                                        {(selectedBill.items || []).reduce((s, it) => s + (Number(it.orderedQty ?? it.qty) || 0), 0)}
                                    </p>
                                </div>
                                <div className="p-2 rounded-md bg-blue-50">
                                    <p className="text-blue-400 font-semibold uppercase">GRN Received</p>
                                    <p className="font-mono font-bold text-blue-700 mt-0.5">
                                        {(selectedBill.items || []).reduce((s, it, idx) => s + (Number(receivedQtys[it.id || `line-${idx}`] ?? it.qty) || 0), 0)}
                                    </p>
                                </div>
                                <div className="p-2 rounded-md bg-emerald-50">
                                    <p className="text-emerald-500 font-semibold uppercase">Bill Amount</p>
                                    <p className="font-mono font-bold text-emerald-700 mt-0.5">{formatCurrency(Number(selectedBill.total ?? selectedBill.amount) || 0)}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap lg:flex-nowrap justify-end gap-2 pt-3 border-t border-border">
                                <button onClick={() => setSelectedBill(null)} className="px-4 py-2 border border-border text-text rounded-xl hover:bg-card-hover font-semibold text-xs cursor-pointer transition">Cancel</button>
                                <button onClick={confirmReceipt} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition">
                                    <CheckCircle2 size={14} /> Confirm GRN & Add to Stock
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Short-Supply Debit Note Claim Modal */}
            {showDebitNoteModal && debitNoteBill && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150 text-xs">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                    <FileText className="text-rose-600" size={18} />
                                    Claim Short-Supply Debit Note
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {debitNoteBill.billNumber} • {debitNoteBill.vendor}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDebitNoteModal(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitDebitNote} className="p-5 space-y-4">
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3">
                                <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                                <div>
                                    <p className="font-bold text-rose-800">Shortfall Detected at Warehouse Dock</p>
                                    <p className="text-slate-600 text-xs mt-0.5">
                                        Received quantities are lower than invoiced quantities. Issue this debit note to deduct the shortfall amount from the supplier's accounts payable balance.
                                    </p>
                                </div>
                            </div>

                            {/* Shortfall breakdown */}
                            <div>
                                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Shortfall Items Breakdown</h4>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="py-2 px-3 text-left">Item</th>
                                                <th className="py-2 px-3 text-center">Ordered</th>
                                                <th className="py-2 px-3 text-center">Received</th>
                                                <th className="py-2 px-3 text-center">Shortfall</th>
                                                <th className="py-2 px-3 text-right">Shortfall Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {debitNoteItems.map((it, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-2 px-3 font-medium text-slate-800">{it.name}</td>
                                                    <td className="py-2 px-3 text-center font-mono text-slate-600">{it.ordered}</td>
                                                    <td className="py-2 px-3 text-center font-mono text-slate-600">{it.received}</td>
                                                    <td className="py-2 px-3 text-center font-mono font-bold text-rose-600">{it.shortfallQty}</td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                                                        {formatCurrency(it.shortfallAmount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                                            <tr>
                                                <td colSpan={4} className="py-2.5 px-3 text-right">Total Debit Claim:</td>
                                                <td className="py-2.5 px-3 text-right font-mono text-rose-700 text-sm">
                                                    {formatCurrency(debitNoteTotal)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Debit Note Reason / Remarks *</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={debitNoteReason}
                                    onChange={(e) => setDebitNoteReason(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowDebitNoteModal(false)}
                                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingDebitNote}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={14} />
                                    {isSubmittingDebitNote ? 'Generating...' : 'Issue Short-Supply Debit Note'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoodsReceiptPage;