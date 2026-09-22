import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Plus, RotateCcw, CheckCircle2, AlertCircle, X, Ban, Eye, FileText, Check, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';

const salesReturnGuide = {
    title: 'Sales Returns & Credit Notes',
    subtitle: 'Selective customer return processing, condition grading, serial restoration, and ledger reversals.',
    purpose: 'Use this page to process partial or full product returns against commercial Sales Invoices. Issuing a Credit Note reduces customer Accounts Receivable, creates official credit note ledger entries, and dynamically restores sellable inventory only for items in Good condition.',
    workflow: ['Select Target Sales Invoice', 'Specify Return Quantities (Capped at Returnable Qty)', 'Assign Condition (Good / Damaged / Scrap)', 'Select Dispatched Serials (if Serialized)', 'Issue Credit Note & Update Ledger'],
    keyTerms: [
        {
            term: 'Selective Line Return',
            definition: 'Returning specific quantities of individual line items rather than returning the entire invoice blindly.',
        },
        {
            term: 'Returnable Quantity',
            definition: 'Invoiced Quantity minus all Previously Returned Quantities on active credit notes.',
        },
        {
            term: 'Condition Grading',
            definition: 'Good returns restore sellable warehouse inventory and serials. Damaged and Scrap returns are quarantined without increasing sellable stock.',
        },
        {
            term: 'Reversible Lifecycle',
            definition: 'Cancelling a Sales Return safely reverses the inventory restock, serial availability, customer balance credit, and accounting journal entries.',
        },
    ],
    tips: [
        'Over-returning is strictly prevented: you cannot return more units than the remaining returnable quantity.',
        'Serialized items will only allow selecting serial numbers that were originally sold on that invoice and not yet returned.',
    ],
};

export const SalesReturnsPage = () => {
    const {
        salesReturns = [],
        addSalesReturn,
        cancelSalesReturn,
        invoices = [],
        customers = [],
        items: masterItems = [],
        formatCurrency,
        formatDateDDMMYYYY,
        getCurrentDateFormatted,
    } = useERP();

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [reason, setReason] = useState('Customer Return / Specification Exchange');
    const [restocked, setRestocked] = useState(true);
    const [returnLines, setReturnLines] = useState([]);
    const [validationError, setValidationError] = useState('');

    const [viewReturn, setViewReturn] = useState(null);
    const [cancelModalTarget, setCancelModalTarget] = useState(null);

    // Active (non-cancelled) invoices available for return
    const activeInvoices = useMemo(() => {
        return invoices.filter((inv) => inv.status !== 'Cancelled' && inv.status !== 'Draft');
    }, [invoices]);

    // Compute previous returns for an invoice
    const getInvoiceReturnHistory = (invId) => {
        const inv = invoices.find((i) => i.id === invId);
        if (!inv) return [];
        return salesReturns.filter((sr) => (sr.invoiceId === invId || (inv.invoiceNumber && sr.invoiceRef === inv.invoiceNumber)) && sr.status !== 'Cancelled');
    };

    const initializeReturnLinesForInvoice = (invId) => {
        const inv = invoices.find((i) => i.id === invId);
        if (!inv || !inv.items) {
            setReturnLines([]);
            return;
        }

        const activeReturnsForInv = salesReturns.filter(
            (sr) => (sr.invoiceId === invId || (inv.invoiceNumber && sr.invoiceRef === inv.invoiceNumber)) && sr.status !== 'Cancelled'
        );

        const lines = inv.items.map((it, idx) => {
            const invoicedQty = Number(it.qty || 1);
            
            // Calculate previously returned for this item
            const prevReturned = activeReturnsForInv.reduce((sum, sr) => {
                const match = (sr.items || []).find(
                    (rLine) => (rLine.itemId && rLine.itemId === it.itemId) || (rLine.sku && rLine.sku === it.sku) || rLine.description === it.description
                );
                return sum + Number(match?.qty || 0);
            }, 0);

            const returnableQty = Math.max(0, invoicedQty - prevReturned);

            // Find serials if serialized item
            const mi = masterItems.find((m) => m.id === it.itemId || (it.sku && m.sku?.toLowerCase() === String(it.sku ?? '').toLowerCase()) || (it.itemSku && m.sku?.toLowerCase() === String(it.itemSku ?? '').toLowerCase()));
            const isSerial = mi?.trackingMode === 'Serial' || Boolean(it.serialNumbers?.length || it.selectedSerials?.length);

            // Serials originally dispatched on this invoice line
            const originalSerials = it.selectedSerials || it.serialNumbers || (it.serialNumber ? [it.serialNumber] : (isSerial && mi?.serialNumbers ? mi.serialNumbers : []));

            // Serials already returned in active returns
            const alreadyReturnedSerials = activeReturnsForInv.flatMap((sr) => {
                const match = (sr.items || []).find(
                    (rLine) => (rLine.itemId && rLine.itemId === it.itemId) || (rLine.sku && rLine.sku === it.sku) || rLine.description === it.description
                );
                return match?.selectedSerials || [];
            });

            const returnableSerials = originalSerials.filter((s) => !alreadyReturnedSerials.includes(s));

            return {
                id: it.id || `inv-line-${idx}`,
                itemId: it.itemId || mi?.id || '',
                sku: it.sku || it.itemSku || mi?.sku || '',
                description: it.description || it.name || `Item ${idx + 1}`,
                invoicedQty,
                previouslyReturnedQty: prevReturned,
                returnableQty,
                returnQty: 0,
                condition: 'Good',
                rate: Number(it.rate || 0),
                tax: Number(it.tax !== undefined ? it.tax : (it.taxRate !== undefined ? it.taxRate : 18)),
                isSerial,
                returnableSerials,
                selectedSerials: [],
            };
        });

        setReturnLines(lines);
    };

    const handleInvoiceSelect = (invId) => {
        setSelectedInvoiceId(invId);
        setValidationError('');
        initializeReturnLinesForInvoice(invId);
    };

    const handleOpenCreateModal = () => {
        const defaultInv = activeInvoices[0];
        if (defaultInv) {
            setSelectedInvoiceId(defaultInv.id);
            initializeReturnLinesForInvoice(defaultInv.id);
        } else {
            setSelectedInvoiceId('');
            setReturnLines([]);
        }
        setReason('Customer Return / Specification Exchange');
        setRestocked(true);
        setValidationError('');
        setShowAddModal(true);
    };

    const handleLineQtyChange = (index, val) => {
        setValidationError('');
        const updated = [...returnLines];
        const line = updated[index];
        const numVal = Math.max(0, parseInt(val, 10) || 0);
        
        if (numVal > line.returnableQty) {
            setValidationError(`Cannot return more than ${line.returnableQty} units for ${line.description}.`);
            line.returnQty = line.returnableQty;
        } else {
            line.returnQty = numVal;
        }

        // Auto-adjust selected serials count if serialized
        if (line.isSerial) {
            line.selectedSerials = line.returnableSerials.slice(0, line.returnQty);
        }

        updated[index] = line;
        setReturnLines(updated);
    };

    const handleConditionChange = (index, condition) => {
        const updated = [...returnLines];
        updated[index].condition = condition;
        setReturnLines(updated);
    };

    const handleSerialToggle = (lineIndex, serial) => {
        const updated = [...returnLines];
        const line = updated[lineIndex];
        const current = line.selectedSerials || [];
        
        let next;
        if (current.includes(serial)) {
            next = current.filter((s) => s !== serial);
        } else {
            if (current.length >= line.returnQty) {
                next = [...current.slice(0, Math.max(0, line.returnQty - 1)), serial];
            } else {
                next = [...current, serial];
            }
        }
        line.selectedSerials = next;
        updated[lineIndex] = line;
        setReturnLines(updated);
    };

    const totalReturnQty = returnLines.reduce((sum, l) => sum + Number(l.returnQty || 0), 0);
    const totalCreditAmount = returnLines.reduce((sum, l) => {
        const lineSub = Number(l.returnQty || 0) * Number(l.rate || 0);
        const lineTax = lineSub * (Number(l.tax || 0) / 100);
        return sum + lineSub + lineTax;
    }, 0);

    const handleCreateReturnSubmit = (e) => {
        e.preventDefault();
        setValidationError('');

        if (totalReturnQty <= 0) {
            setValidationError('Please enter a return quantity of at least 1 unit.');
            return;
        }

        // Validate over-return on every line
        for (const line of returnLines) {
            if (line.returnQty > line.returnableQty) {
                setValidationError(`Over-return error: ${line.description} cannot exceed ${line.returnableQty} units.`);
                return;
            }
            if (line.isSerial && line.returnQty > 0 && line.selectedSerials.length !== line.returnQty) {
                setValidationError(`Please select exactly ${line.returnQty} serial number(s) for ${line.description}.`);
                return;
            }
        }

        const inv = invoices.find((i) => i.id === selectedInvoiceId);
        const cust = customers.find((c) => c.id === inv?.customerId || c.name?.toLowerCase() === inv?.customer?.toLowerCase());

        const itemsToReturn = returnLines.filter((l) => l.returnQty > 0).map((l) => {
            const lineSub = Number(l.returnQty) * Number(l.rate);
            const lineTax = lineSub * (Number(l.tax) / 100);
            return {
                id: `sr-line-${Date.now()}-${l.id}`,
                itemId: l.itemId,
                sku: l.sku,
                description: l.description,
                invoicedQty: l.invoicedQty,
                previouslyReturnedQty: l.previouslyReturnedQty,
                returnableQty: l.returnableQty,
                qty: l.returnQty,
                condition: l.condition,
                rate: l.rate,
                tax: l.tax,
                amount: Math.round((lineSub + lineTax) * 100) / 100,
                selectedSerials: l.selectedSerials,
            };
        });

        addSalesReturn({
            customerId: cust?.id || inv?.customerId,
            customer: inv?.customer || cust?.name || 'Cyberdyne Systems',
            billingAddress: inv?.billingAddress,
            shippingAddress: inv?.shippingAddress,
            invoiceId: inv?.id,
            invoiceRef: inv?.invoiceNumber || 'INV-2026-002',
            date: getCurrentDateFormatted(),
            amount: Math.round(totalCreditAmount * 100) / 100,
            reason,
            restocked,
            items: itemsToReturn,
        });

        setShowAddModal(false);
        setReturnLines([]);
    };

    const handleConfirmCancel = () => {
        if (!cancelModalTarget) return;
        cancelSalesReturn(cancelModalTarget.id);
        setCancelModalTarget(null);
    };

    const columns = [
        {
            key: 'returnNumber',
            header: 'Credit Note #',
            width: '16%',
            render: (r) => (
              <button
                onClick={() => setViewReturn(r)}
                className="font-mono font-bold text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-left"
              >
                <RotateCcw size={13} className="text-rose-600 shrink-0"/>
                <span>{r.returnNumber}</span>
              </button>
            ),
        },
        {
            key: 'customer',
            header: 'Customer Account',
            width: '20%',
            render: (r) => <span className="font-bold text-text block">{r.customer}</span>,
        },
        {
            key: 'invoiceRef',
            header: 'Target Invoice',
            width: '14%',
            render: (r) => <span className="font-mono text-primary font-semibold whitespace-nowrap">{r.invoiceRef}</span>,
        },
        {
            key: 'date',
            header: 'Return Date',
            width: '11%',
            render: (r) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(r.date)}</span>,
        },
        {
            key: 'itemsSummary',
            header: 'Items & Condition',
            width: '18%',
            render: (r) => {
                const itemsCount = (r.items || []).reduce((acc, it) => acc + Number(it.qty || 1), 0);
                const hasDamaged = (r.items || []).some((it) => it.condition === 'Damaged' || it.condition === 'Scrap');
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-text text-xs">{itemsCount} units returned</span>
                        <div className="flex items-center gap-1">
                            {r.restocked && !hasDamaged ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Restocked (Good)</span>
                            ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">Quarantined / Defect</span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'amount',
            header: 'Credit Note Amount',
            align: 'right',
            width: '12%',
            render: (r) => (
              <span className={`font-mono font-bold whitespace-nowrap ${r.status === 'Cancelled' ? 'text-slate-400 line-through' : 'text-rose-600 dark:text-rose-400'}`}>
                -{formatCurrency(r.amount ?? 0)}
              </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            align: 'center',
            width: '10%',
            render: (r) => <StatusBadge status={r.status || 'Approved'}/>,
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            width: '11%',
            render: (r) => (
                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <button
                        onClick={() => setViewReturn(r)}
                        className="p-1 text-slate-500 hover:text-primary hover:bg-slate-100 rounded cursor-pointer transition-colors"
                        title="View Return Details"
                    >
                        <Eye size={13}/>
                    </button>
                    {r.status !== 'Cancelled' && (
                        <button
                            onClick={() => setCancelModalTarget(r)}
                            className="px-2 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1"
                            title="Cancel Return and Reverse Stock/Ledger"
                        >
                            <Ban size={11}/> Cancel
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Sales Returns & Credit Notes"
                subtitle="Customer return documentation, selective line return grading, warehouse serial restoration, and ledger reversals."
                guide={salesReturnGuide}
                actions={
                    <Button icon={Plus} onClick={handleOpenCreateModal}>
                        Issue Sales Return / Credit Note
                    </Button>
                }
            />

            <DataTable
                title="Sales Return & Credit Note Register"
                columns={columns}
                data={salesReturns}
                keyExtractor={(r) => r.id}
                searchPlaceholder="Search return #, customer, invoice, or reason..."
                searchFilter={(r, term) =>
                    String(r.returnNumber ?? '').toLowerCase().includes(term) ||
                    String(r.customer ?? '').toLowerCase().includes(term) ||
                    (r.invoiceRef && String(r.invoiceRef ?? '').toLowerCase().includes(term)) ||
                    (r.reason && String(r.reason ?? '').toLowerCase().includes(term))
                }
            />

            {/* CREATE SALES RETURN MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full p-6 text-xs max-h-[92vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-rose-600"/>
                                <div>
                                    <h3 className="font-bold text-base text-[#1F2E4A]">Issue Selective Sales Credit Note</h3>
                                    <p className="text-[11px] text-slate-500">Select returned line items, condition grading, and restored serial numbers</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                                <X size={18}/>
                            </button>
                        </div>

                        <form onSubmit={handleCreateReturnSubmit} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
                            {validationError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2 text-xs">
                                    <AlertCircle size={16} className="shrink-0 text-rose-600"/>
                                    <span>{validationError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Target Sales Invoice *</label>
                                    <select
                                        value={selectedInvoiceId}
                                        onChange={(e) => handleInvoiceSelect(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium"
                                        required
                                    >
                                        {activeInvoices.map((inv) => (
                                            <option key={inv.id} value={inv.id}>
                                                {inv.invoiceNumber} - {inv.customer} ({formatCurrency(inv.total)})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Reason for Return *</label>
                                    <input
                                        type="text"
                                        required
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g. Specification revision, damaged in transit, client return..."
                                        className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="restockCheck"
                                    checked={restocked}
                                    onChange={(e) => setRestocked(e.target.checked)}
                                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                />
                                <label htmlFor="restockCheck" className="font-semibold text-slate-800 cursor-pointer">
                                    Reintegrate 'Good' items back into warehouse available stock (+ Sellable Qty & Serials)
                                </label>
                            </div>

                            {/* SELECTIVE RETURN LINE ITEMS TABLE */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-slate-700 block">Select Items & Quantities to Return</label>
                                    <span className="text-[11px] text-slate-500">Dynamic over-return protection enforced</span>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 uppercase text-slate-500 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="py-2.5 px-3">Product Description</th>
                                                <th className="py-2.5 px-2 text-center w-20">Invoiced</th>
                                                <th className="py-2.5 px-2 text-center w-20">Prev. Ret.</th>
                                                <th className="py-2.5 px-2 text-center w-24">Returnable</th>
                                                <th className="py-2.5 px-3 text-center w-28">Return Qty</th>
                                                <th className="py-2.5 px-3 w-28">Condition</th>
                                                <th className="py-2.5 px-3 text-right w-24">Rate</th>
                                                <th className="py-2.5 px-3 text-right w-28">Credit Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {returnLines.map((line, idx) => {
                                                const lineSub = Number(line.returnQty || 0) * Number(line.rate || 0);
                                                const lineTax = lineSub * (Number(line.tax || 0) / 100);
                                                const lineTotal = lineSub + lineTax;
                                                const isExhausted = line.returnableQty === 0;

                                                return (
                                                    <React.Fragment key={line.id || idx}>
                                                        <tr className={`hover:bg-slate-50/70 ${isExhausted ? 'opacity-60 bg-slate-50/40' : ''}`}>
                                                            <td className="py-2 px-3">
                                                                <span className="font-semibold text-slate-800 block">{line.description}</span>
                                                                {line.sku && <span className="font-mono text-[10px] text-slate-400">SKU: {line.sku}</span>}
                                                            </td>
                                                            <td className="py-2 px-2 text-center font-mono">{line.invoicedQty}</td>
                                                            <td className="py-2 px-2 text-center font-mono text-slate-500">{line.previouslyReturnedQty}</td>
                                                            <td className="py-2 px-2 text-center font-mono font-bold">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] ${line.returnableQty > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {line.returnableQty}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-3 text-center">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={line.returnableQty}
                                                                    disabled={isExhausted}
                                                                    value={line.returnQty}
                                                                    onChange={(e) => handleLineQtyChange(idx, e.target.value)}
                                                                    className="w-20 p-1 border border-slate-300 rounded text-center font-bold font-mono focus:border-rose-500"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <select
                                                                    disabled={line.returnQty === 0}
                                                                    value={line.condition}
                                                                    onChange={(e) => handleConditionChange(idx, e.target.value)}
                                                                    className="w-full p-1 border border-slate-300 rounded bg-white text-slate-800 text-[11px] font-medium"
                                                                >
                                                                    <option value="Good">Good (Restock)</option>
                                                                    <option value="Damaged">Damaged (Quarantine)</option>
                                                                    <option value="Scrap">Scrap (Discard)</option>
                                                                </select>
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono text-slate-700">{formatCurrency(line.rate)}</td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                                                                {formatCurrency(lineTotal)}
                                                            </td>
                                                        </tr>

                                                        {/* Serial Number Picker Row if item is Serialized and returning > 0 */}
                                                        {line.isSerial && line.returnQty > 0 && (
                                                            <tr className="bg-rose-50/40 border-b border-rose-100">
                                                                <td colSpan={8} className="py-2 px-4">
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center justify-between text-[11px]">
                                                                            <span className="font-semibold text-rose-900">
                                                                                Select Serial Numbers to Return ({line.selectedSerials.length} of {line.returnQty} selected):
                                                                            </span>
                                                                            <span className="text-slate-500">Only previously sold serials shown</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {line.returnableSerials.map((sn) => {
                                                                                const isSelected = line.selectedSerials.includes(sn);
                                                                                return (
                                                                                    <button
                                                                                        key={sn}
                                                                                        type="button"
                                                                                        onClick={() => handleSerialToggle(idx, sn)}
                                                                                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border cursor-pointer transition-colors ${
                                                                                            isSelected
                                                                                                ? 'bg-rose-600 text-white border-rose-600'
                                                                                                : 'bg-white text-slate-700 border-slate-300 hover:border-rose-400'
                                                                                        }`}
                                                                                    >
                                                                                        {sn}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* SUMMARY TOTALS */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="font-semibold text-slate-700">Total Returning Items: <strong>{totalReturnQty} units</strong></span>
                                <div className="text-right">
                                    <span className="text-slate-500 text-[11px] block">Total Credit Note Amount</span>
                                    <span className="font-mono font-bold text-base text-rose-600">
                                        -{formatCurrency(totalCreditAmount)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={totalReturnQty === 0}
                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                                >
                                    Issue Credit Note & Post Reversal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW RETURN DETAILS MODAL */}
            {viewReturn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 text-xs max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-rose-600"/>
                                <div>
                                    <h3 className="font-bold text-base text-[#1F2E4A]">Credit Note {viewReturn.returnNumber}</h3>
                                    <p className="text-[11px] text-slate-500">Issued against {viewReturn.invoiceRef}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewReturn(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                                <X size={18}/>
                            </button>
                        </div>

                        <div className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Customer</span>
                                    <p className="font-bold text-slate-900">{viewReturn.customer}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Date</span>
                                    <p className="font-semibold text-slate-800">{formatDateDDMMYYYY(viewReturn.date)}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Status</span>
                                    <p><StatusBadge status={viewReturn.status || 'Approved'}/></p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Total Credit Value</span>
                                    <p className="font-mono font-bold text-rose-600">-{formatCurrency(viewReturn.amount || 0)}</p>
                                </div>
                            </div>

                            <div>
                                <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">Reason for Return</span>
                                <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-700">{viewReturn.reason || 'Client order adjustment'}</p>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-1">
                                <span className="font-semibold text-slate-700 block">Returned Line Items</span>
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 uppercase text-slate-500 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="py-2 px-3">Item</th>
                                                <th className="py-2 px-2 text-center">Qty</th>
                                                <th className="py-2 px-2 text-center">Condition</th>
                                                <th className="py-2 px-3 text-right">Credit Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {(viewReturn.items || []).map((it, idx) => (
                                                <tr key={it.id || idx}>
                                                    <td className="py-2 px-3">
                                                        <span className="font-semibold text-slate-800 block">{it.description || it.name}</span>
                                                        {it.selectedSerials?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {it.selectedSerials.map((s) => (
                                                                    <span key={s} className="px-1.5 py-0.2 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-700">
                                                                        {s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2 text-center font-mono font-bold">{it.qty}</td>
                                                    <td className="py-2 px-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                            it.condition === 'Good' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                        }`}>
                                                            {it.condition || 'Good'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                                                        {formatCurrency(it.amount || 0)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-slate-200">
                            <Button variant="outline" onClick={() => setViewReturn(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* CANCEL CONFIRMATION MODAL */}
            {cancelModalTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-xs flex flex-col">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                            <ShieldAlert className="w-5 h-5 text-rose-600"/>
                            <h3 className="font-bold text-base text-[#1F2E4A]">Cancel Sales Return {cancelModalTarget.returnNumber}?</h3>
                        </div>

                        <div className="py-4 space-y-2 text-slate-600">
                            <p className="font-semibold text-slate-800">This action will automatically:</p>
                            <ul className="list-disc list-inside space-y-1 text-slate-600">
                                <li>Reverse warehouse inventory restocks for Good items</li>
                                <li>Re-reserve or remove restored serial numbers</li>
                                <li>Restore the customer Accounts Receivable balance (+{formatCurrency(cancelModalTarget.amount)})</li>
                                <li>Post double-entry reversal to General Ledger</li>
                                <li>Mark Credit Note as <span className="text-rose-600 font-bold">Cancelled</span></li>
                            </ul>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                            <Button variant="outline" onClick={() => setCancelModalTarget(null)}>
                                Keep Return
                            </Button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                            >
                                Cancel Return & Reverse
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
