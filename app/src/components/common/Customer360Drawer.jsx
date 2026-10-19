import React, { useEffect, useState } from 'react';
import { X, Printer, Phone, Mail, MapPin } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
export const Customer360Drawer = ({ customer, onClose }) => {
    const {
        salesOrders = [],
        invoices = [],
        paymentIns = [],
        cashPaymentReceipts = [],
        salesReturns = [],
        getPartyFinancialSummary,
        getCustomerLedger,
        getInvoiceOutstanding,
        formatCurrency,
        formatDateDDMMYYYY,
    } = useERP();

    const [activeTab, setActiveTab] = useState('financials'); // 'financials' | 'transactions' | 'invoices' | 'orders'

    // UX only: Esc closes, background scroll locks while open. No data changes.
    useEffect(() => {
        if (!customer) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [customer, onClose]);

    if (!customer) return null;

    const summary = getPartyFinancialSummary ? getPartyFinancialSummary(customer.id || customer.name) : {
        formalAmountReceived: 0,
        cashAmountReceived: 0,
        totalReceived: 0,
        outstandingDue: 0,
        unallocatedAdvance: 0,
        appliedCredit: 0,
        availableCredit: 0,
        creditLimit: Number(customer.creditLimit) || 0,
        balance: Number(customer.balance) || 0,
        openInvoicesCount: 0,
        totalInvoicesCount: 0,
        lifetimeSales: 0,
    };

    const customerOrders = salesOrders.filter((o) => o.customerId === customer.id || o.customer === customer.name);
    const customerInvoices = invoices.filter((i) => i.customerId === customer.id || i.customer === customer.name);
    const ledgerEntries = getCustomerLedger ? getCustomerLedger(customer.id || customer.name) : [];

    const totalLifetimeSpent = summary.lifetimeSales || customerInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const creditLimit = Number(customer.creditLimit) || summary.creditLimit || 0;
    const balance = Number(customer.balance) || summary.balance || 0;
    const creditUsedPct = creditLimit > 0 ? Math.max(0, Math.min(100, Math.round((balance / creditLimit) * 100))) : 0;
    const location = [customer.city || customer.billingAddress?.city, customer.state || customer.billingAddress?.state].filter(Boolean).join(', ') || '—';

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-150" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${customer.name || 'Customer'} 360 view`}>
            <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col text-xs overflow-hidden printable-document" onClick={(e) => e.stopPropagation()}>
                {/* Top Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3 lg:gap-0">
                    <div>
                        <span className="font-mono text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {customer.code || 'CUST'}
                        </span>
                        <h3 className="font-bold text-lg text-[#1F2E4A] mt-1">{customer.name || 'Unnamed Customer'}</h3>
                        <div className="flex flex-wrap gap-3 text-slate-500 text-[11px] mt-1.5">
                            <span className="flex items-center gap-1"><Mail size={11} /> {customer.email || '—'}</span>
                            <span className="flex items-center gap-1"><Phone size={11} /> {customer.phone || '—'}</span>
                            <span className="flex items-center gap-1"><MapPin size={11} /> {location}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation Tabs inside Drawer */}
                <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('financials')}
                        className={`py-2 px-3 border-b-2 transition ${activeTab === 'financials' ? 'border-primary text-primary font-bold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Financial Standing
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('transactions')}
                        className={`py-2 px-3 border-b-2 transition flex items-center gap-1 ${activeTab === 'transactions' ? 'border-primary text-primary font-bold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Transaction History ({ledgerEntries.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('invoices')}
                        className={`py-2 px-3 border-b-2 transition flex items-center gap-1 ${activeTab === 'invoices' ? 'border-primary text-primary font-bold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Invoices ({customerInvoices.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className={`py-2 px-3 border-b-2 transition flex items-center gap-1 ${activeTab === 'orders' ? 'border-primary text-primary font-bold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Orders ({customerOrders.length})
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                    {activeTab === 'financials' && (
                        <>
                            {/* Financial Exposure & Credit Meter */}
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-xs">Financial Standing & Exposure</span>
                                    <button onClick={() => window.print()} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-blue-200">
                                        <Printer size={11} /> Print Statement
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Outstanding Due</span>
                                        <p className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                                            {formatCurrency(summary.outstandingDue || balance)}
                                        </p>
                                    </div>
                                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <span className="text-[10px] text-emerald-700 font-semibold uppercase block">Formal (With Bill)</span>
                                        <p className="font-mono font-bold text-sm text-emerald-800 mt-0.5">
                                            {formatCurrency(summary.formalAmountReceived || 0)}
                                        </p>
                                    </div>
                                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                                        <span className="text-[10px] text-amber-700 font-semibold uppercase block">Cash (Without Bill)</span>
                                        <p className="font-mono font-bold text-sm text-amber-800 mt-0.5">
                                            {formatCurrency(summary.cashAmountReceived || 0)}
                                        </p>
                                    </div>
                                    <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                                        <span className="text-[10px] text-indigo-700 font-semibold uppercase block">Available Credit</span>
                                        <p className="font-mono font-bold text-sm text-indigo-800 mt-0.5" title="Unallocated Advances + Approved Credit Notes">
                                            {formatCurrency(summary.availableCredit || 0)}
                                        </p>
                                    </div>
                                </div>

                                {/* Credit Breakdown Details */}
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1.5">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Customer Advance (Unallocated):</span>
                                        <span className="font-mono font-semibold text-slate-800">{formatCurrency(summary.unallocatedAdvance || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Applied Credit Notes (Returns):</span>
                                        <span className="font-mono font-semibold text-slate-800">{formatCurrency(summary.appliedCredit || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>PMS Project Advance Req.:</span>
                                        <span className="font-mono font-semibold text-violet-700">
                                            {Number(customer?.pmsAdvancePaymentPercentage ?? customer?.pms_advance_payment_percentage ?? summary?.pmsAdvancePaymentPercentage ?? 0) > 0
                                                ? `${customer?.pmsAdvancePaymentPercentage ?? customer?.pms_advance_payment_percentage ?? summary?.pmsAdvancePaymentPercentage}% of Order`
                                                : 'None (0%)'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1">
                                        <span>Total Usable Credit:</span>
                                        <span className="font-mono text-indigo-700">{formatCurrency(summary.availableCredit || 0)}</span>
                                    </div>
                                </div>

                                {/* Credit Gauge */}
                                <div className="space-y-1 pt-1">
                                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                                        <span>Credit Utilization ({creditUsedPct}%)</span>
                                        <span>{creditLimit > 0 ? `${formatCurrency(Math.max(0, creditLimit - balance), { noDecimals: true })} available credit limit` : 'No credit limit set'}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className={`h-2 rounded-full ${creditUsedPct > 85 ? 'bg-rose-500' : creditUsedPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${creditUsedPct}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Recent Open Invoices Preview */}
                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                                    <span>Open Due Invoices ({customerInvoices.filter((i) => i.status !== 'Paid' && i.status !== 'Cancelled').length})</span>
                                </h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                                    {customerInvoices.filter((i) => i.status !== 'Paid' && i.status !== 'Cancelled').length === 0 ? (
                                        <p className="p-3 text-center text-slate-400">All invoices for this account are fully settled.</p>
                                    ) : (
                                        customerInvoices.filter((i) => i.status !== 'Paid' && i.status !== 'Cancelled').map((inv) => {
                                            const out = getInvoiceOutstanding(inv.id);
                                            return (
                                                <div key={inv.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                                    <div>
                                                        <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                                                        <p className="text-[10px] text-slate-400">{formatDateDDMMYYYY(inv.date)} • Due: {formatDateDDMMYYYY(inv.dueDate)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-mono font-bold text-rose-600 block">Due: {formatCurrency(out.balanceDue)}</span>
                                                        <span className="text-[10px] text-slate-400">Total: {formatCurrency(out.total)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'transactions' && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                                <span>Complete Transaction History</span>
                                <span className="text-[10px] text-slate-400 font-normal">Audit trail of formal, cash, and invoice postings</span>
                            </h4>
                            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                                {ledgerEntries.length === 0 ? (
                                    <p className="p-4 text-center text-slate-400">No transactions recorded for this account.</p>
                                ) : (
                                    ledgerEntries.map((txn) => {
                                        const isCash = txn.category === 'CASH' || String(txn.type || '').includes('Cash');
                                        const isCredit = txn.category === 'CREDIT' || String(txn.type || '').includes('Credit Note');
                                        const isFormal = txn.category === 'FORMAL' || String(txn.type || '').includes('With-Bill');

                                        return (
                                            <div key={txn.id} className="p-3 hover:bg-slate-50 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCash ? 'bg-amber-100 text-amber-800 border border-amber-200' : isCredit ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : isFormal ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                                                            {txn.type}
                                                        </span>
                                                        {txn.reference && (
                                                            <span className="font-mono font-bold text-slate-700 text-[11px]">{txn.reference}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">{formatDateDDMMYYYY(txn.date)}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-600">{txn.description}</p>
                                                <div className="flex justify-between items-center text-[11px] pt-1">
                                                    <span className="text-slate-400">
                                                        Running Balance: <strong className="font-mono text-slate-700">{formatCurrency(txn.balance)}</strong>
                                                    </span>
                                                    <div className="text-right font-mono font-bold">
                                                        {txn.debit > 0 && <span className="text-rose-600">+{formatCurrency(txn.debit)}</span>}
                                                        {txn.credit > 0 && <span className="text-emerald-700">-{formatCurrency(txn.credit)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'invoices' && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 text-xs">Customer Invoices ({customerInvoices.length})</h4>
                            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                                {customerInvoices.length === 0 ? (
                                    <p className="p-4 text-center text-slate-400">No invoices recorded for this account.</p>
                                ) : (
                                    customerInvoices.map((inv) => {
                                        const out = getInvoiceOutstanding(inv.id);
                                        return (
                                            <div key={inv.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                                <div>
                                                    <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                                                    <p className="text-[10px] text-slate-400">{formatDateDDMMYYYY(inv.date)} • Due: {formatDateDDMMYYYY(inv.dueDate)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono font-bold text-slate-900">{formatCurrency(inv.total)}</span>
                                                    <span className={`block text-[10px] font-semibold ${out.balanceDue <= 0.01 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                        {out.balanceDue <= 0.01 ? 'Paid' : `Due: ${formatCurrency(out.balanceDue)}`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 text-xs">Recent Sales Orders ({customerOrders.length})</h4>
                            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                                {customerOrders.length === 0 ? (
                                    <p className="p-4 text-center text-slate-400">No sales orders found.</p>
                                ) : (
                                    customerOrders.map((so) => (
                                        <div key={so.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                            <div>
                                                <span className="font-mono font-bold text-blue-700">{so.orderNumber}</span>
                                                <p className="text-[10px] text-slate-400">{formatDateDDMMYYYY(so.date)} • {so.items?.length || 0} line items</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-mono font-bold text-slate-900">{formatCurrency(so.amount)}</span>
                                                <span className="block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full mt-0.5">
                                                    {so.stage}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Customer Status: <strong className="text-emerald-700">{customer.status || 'Active'}</strong></span>
                    <button onClick={onClose} className="px-4 py-2 border border-border bg-card hover:bg-card-hover text-text rounded-xl font-semibold text-xs cursor-pointer transition">
                        Close Drawer
                    </button>
                </div>
            </div>
        </div>
    );
};
