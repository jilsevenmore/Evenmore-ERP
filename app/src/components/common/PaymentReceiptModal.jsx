import React, { useEffect } from 'react';
import { X, Printer, CheckCircle2, AlertCircle, ShieldAlert, Receipt } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const PaymentReceiptModal = ({ receipt, onClose }) => {
    const { formatCurrency } = useERP ? useERP() : { formatCurrency: (v) => `₹${Number(v || 0).toLocaleString()}` };

    useEffect(() => {
        if (!receipt) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [receipt, onClose]);

    if (!receipt) return null;

    const isWithoutBill = receipt.paymentType === 'WITHOUT_BILL' ||
        receipt.isWithoutBill ||
        Boolean(receipt.receiptNumber && String(receipt.receiptNumber).startsWith('CPR')) ||
        (!receipt.invoiceNumber && !receipt.invoiceId);

    const amountVal = Number(receipt.amount || 0);
    const formattedAmount = formatCurrency ? formatCurrency(amountVal) : `₹${amountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150" onClick={onClose} role="dialog" aria-modal="true" aria-label={isWithoutBill ? "Without Bill / Cash Receipt" : "Official Payment Receipt"}>
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 shadow-2xl text-xs flex flex-col max-h-[95vh] overflow-y-auto printable-document" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center border ${isWithoutBill ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {isWithoutBill ? <Receipt size={18}/> : <CheckCircle2 size={18}/>}
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-[#1F2E4A]">
                                {isWithoutBill ? 'WITHOUT BILL / CASH RECEIPT' : 'Official Payment Receipt'}
                            </h3>
                            <span className="font-mono text-[11px] text-slate-500 font-semibold">{receipt.receiptNumber}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={18}/>
                    </button>
                </div>

                {/* Disclaimer banner for Without-Bill */}
                {isWithoutBill && (
                    <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <strong className="block uppercase text-[10px] tracking-wider text-amber-800">WITHOUT BILL / CASH RECEIPT</strong>
                            <span>This document records an unbilled cash transaction for internal cash-desk reconciliation. It is <strong>NOT a GST tax invoice</strong> and carries no GST input tax credit.</span>
                        </div>
                    </div>
                )}

                {/* Receipt Voucher Body */}
                <div className="py-4 space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start border-b border-slate-200 pb-2.5">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Received From (Customer)</span>
                                <p className="font-bold text-base text-slate-900 mt-0.5">{receipt.customer || 'Direct Customer'}</p>
                                {isWithoutBill ? (
                                    <p className="text-[11px] text-amber-700 font-medium">Unbilled Cash Transaction</p>
                                ) : (
                                    <p className="text-[11px] text-slate-500">Settlement for Invoice #{receipt.invoiceNumber}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Date Received</span>
                                <p className="font-semibold text-slate-800 mt-0.5">{receipt.date}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                <span className="text-[10px] uppercase font-semibold text-slate-400">Payment Mode</span>
                                <p className="font-semibold text-slate-800">{receipt.paymentMode || receipt.mode || 'Cash'}</p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-semibold text-slate-400">Transaction / Ref #</span>
                                <p className="font-mono font-semibold text-slate-800">{receipt.reference || receipt.referenceNumber || receipt.receiptNumber}</p>
                            </div>
                        </div>

                        {receipt.description && (
                            <div className="pt-1 border-t border-slate-200">
                                <span className="text-[10px] uppercase font-semibold text-slate-400">Description / Reason</span>
                                <p className="text-slate-800 mt-0.5 text-xs">{receipt.description}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                            <div>
                                <span className="text-[10px] uppercase font-semibold text-slate-400">Receipt Status</span>
                                <p className="font-bold mt-0.5">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                                        receipt.status === 'CANCELLED' || receipt.status === 'Cancelled'
                                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                            : receipt.status === 'VOIDED' || receipt.status === 'Voided'
                                            ? 'bg-slate-200 text-slate-800 border border-slate-400'
                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    }`}>
                                        {receipt.status || 'RECEIVED'}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-semibold text-slate-400">Recorded By</span>
                                <p className="font-semibold text-slate-700 mt-0.5">{receipt.createdBy || 'Authorized Staff'}</p>
                            </div>
                        </div>

                        <div className={`${isWithoutBill ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'} border rounded-lg p-3 flex items-center justify-between mt-2`}>
                            <span className="font-bold">{isWithoutBill ? 'Cash Amount Received:' : 'Total Amount Settled:'}</span>
                            <span className="font-mono font-bold text-lg">
                                {formattedAmount}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center space-y-2">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Cashier / Accounts Dept</span>
                            <div className="h-8 border-b border-slate-300 flex items-end justify-center font-mono text-[10px] text-slate-600">
                                Authorized Signatory
                            </div>
                        </div>
                        <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center space-y-2">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Customer Acknowledgment</span>
                            <div className="h-8 border-b border-slate-300 flex items-end justify-center font-mono text-[10px] text-slate-600">
                                Received & Verified
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 pt-3 border-t border-slate-200">
                    <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600"/>
                        {isWithoutBill ? 'Internal Cash Voucher Clear' : 'Ledger GL Posted & Invoice Settled'}
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs">
                            <Printer size={13}/> Print Receipt
                        </button>
                        <button onClick={onClose} className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-medium cursor-pointer">
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
