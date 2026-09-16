import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { PackageCheck, Truck, ClipboardCheck, ShieldCheck, X, CheckCircle2, AlertTriangle, Boxes } from 'lucide-react';

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
        receivePurchaseBillGoods,
        getPoBilledStatus,
        getBillOutstanding,
        formatCurrency,
        formatDateDDMMYYYY,
        getCurrentISODate,
        getCurrentDateFormatted,
    } = useERP();

    const [selectedBill, setSelectedBill] = useState(null);
    const [receivedQtys, setReceivedQtys] = useState({});
    const [qcStatus, setQcStatus] = useState('Approved');
    const [note, setNote] = useState('');

    // Bills still waiting for goods receipt
    const pendingReceipts = (purchaseBills || []).filter((b) => b.goodsReceived !== true && b.status !== 'Cancelled');
    const receivedCount = (purchaseBills || []).filter((b) => b.goodsReceived === true).length;
    const pendingQty = pendingReceipts.reduce((sum, b) => sum + (b.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0), 0);
    const pendingValue = pendingReceipts.reduce((sum, b) => sum + (Number(b.total ?? b.amount) || 0), 0);

    const openReceiveModal = (bill) => {
        setSelectedBill(bill);
        const initial = {};
        (bill.items || []).forEach((it, idx) => {
            initial[it.id || `line-${idx}`] = Number(it.qty || 0);
        });
        setReceivedQtys(initial);
        setQcStatus('Approved');
        setNote('');
    };

    const updateQty = (lineKey, value) => {
        setReceivedQtys((prev) => ({ ...prev, [lineKey]: value }));
    };

    const confirmReceipt = () => {
        if (!selectedBill) return;
        const overrides = (selectedBill.items || []).map((it, idx) => {
            const key = it.id || `line-${idx}`;
            return {
                lineIndex: idx,
                lineId: it.id,
                sku: it.sku || it.itemSku,
                receivedQty: Number(receivedQtys[key] || 0) || 0,
            };
        });
        receivePurchaseBillGoods(selectedBill.id, overrides, qcStatus);
        setSelectedBill(null);
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

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard label="Awaiting Receipt" value={`${pendingReceipts.length} Bills`} icon={Truck} tone="amber" />
                <StatCard label="Pending Qty" value={`${pendingQty.toLocaleString()} Units`} icon={Boxes} />
                <StatCard label="Receivable Value" value={formatCurrency(pendingValue)} icon={ClipboardCheck} tone="blue" />
                <StatCard label="Received (GRN Done)" value={`${receivedCount} Bills`} icon={ShieldCheck} tone="green" />
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
                        <table className="w-full text-left text-xs text-slate-600">
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
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1F2E4A] text-white rounded-md text-[11px] font-semibold hover:bg-[#152033] transition cursor-pointer"
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
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                            <div>
                                <h3 className="font-bold text-[#1F2E4A]">Goods Receipt — {selectedBill.billNumber}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedBill.vendor} • {selectedBill.linkedPo || 'Direct Bill'}</p>
                            </div>
                            <button onClick={() => setSelectedBill(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"><X size={18} /></button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Line-by-line received quantity */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Received Quantity per Line (Actual / Weighed)</h4>
                                <div className="space-y-2">
                                    {(selectedBill.items || []).map((it, idx) => {
                                        const key = it.id || `line-${idx}`;
                                        const ordered = Number(it.orderedQty ?? it.qty) || 0;
                                        const pct = orderedVsReceivedPct(selectedBill, idx);
                                        return (
                                            <div key={key} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-[#F8F9FA]">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-800 text-xs truncate">{it.name || it.description || 'Item'}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{it.sku || it.itemSku} • Ordered: {ordered}</p>
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
                                        );
                                    })}
                                </div>
                            </div>

                            {/* QC checkpoint */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">QC Checkpoint</h4>
                                <div className="flex gap-2">
                                    {['Approved', 'Pending', 'Rejected'].map((q) => (
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

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button onClick={() => setSelectedBill(null)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-xs cursor-pointer">Cancel</button>
                                <button onClick={confirmReceipt} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
                                    <CheckCircle2 size={14} /> Confirm GRN & Add to Stock
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoodsReceiptPage;