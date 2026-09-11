import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, ArrowDownLeft, CreditCard, X, Receipt, DollarSign, CheckCircle2, TrendingUp } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
const paymentInGuide = {
    title: 'Payment In & Customer Receipts',
    subtitle: 'Cash inflow reconciliation and Accounts Receivable settlement',
    purpose: 'Use this page to record customer payments (cash, check, card, or bank transfer). Recording a payment credits the customer’s open invoice and reduces their Accounts Receivable (AR) balance.',
    workflow: ['Issue Invoice', 'Customer Sends Funds', 'Record Payment In', 'AR Settled & Receipt Issued'],
    keyTerms: [
        {
            term: 'Payment In / Receipt Voucher',
            definition: 'An official accounting document proving funds have been received and applied to a customer invoice.',
        },
        {
            term: 'Accounts Receivable (AR)',
            definition: 'Money owed to your business by customers for goods or services delivered on credit.',
        },
        {
            term: 'Invoice Reconciliation',
            definition: 'The process of matching incoming bank payments against outstanding open sales invoices.',
        },
        {
            term: 'Settlement Status',
            definition: 'Indicates whether an invoice is Unpaid, Partially Paid, or Fully Paid.',
        },
    ],
    tips: [
        'You can also click "⚡ Settle" directly from the Sales Invoices screen to record payment with 1 click!',
        'Each recorded payment immediately adjusts the customer’s live credit balance in Customer 360°.',
    ],
};
export const PaymentInPage = () => {
    const { paymentIns, invoices, customers, addPaymentIn, getInvoiceOutstanding, formatCurrency, formatDateDDMMYYYY, getCurrentDateFormatted } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || '');
    const [amount, setAmount] = useState(1000);
    const [mode, setMode] = useState('Bank Transfer');
    const [reference, setReference] = useState('WIRE-49821');
    const handleInvoiceChange = (invId) => {
        setSelectedInvoiceId(invId);
        const inv = invoices.find((i) => i.id === invId);
        if (inv) {
            const outstanding = getInvoiceOutstanding(inv.id);
            setAmount(outstanding.balanceDue > 0 ? outstanding.balanceDue : inv.total);
        }
    };
    const handleRecord = (e) => {
        e.preventDefault();
        const inv = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
        const cust = customers.find((c) => c.name === inv?.customer || c.id === inv?.customerId);
        addPaymentIn({
            customerId: cust?.id,
            customer: inv?.customer || cust?.name || 'Acme Corp',
            invoiceId: inv?.id,
            invoiceNumber: inv?.invoiceNumber || 'INV-2026-001',
            date: getCurrentDateFormatted(),
            mode,
            amount: Number(amount) || 1000,
            reference: reference || `WIRE-${Date.now()}`,
        });
        setShowAddModal(false);
    };
    const totalCollected = paymentIns.reduce((sum, p) => sum + (p.amount || 0), 0);
    const columns = [
        {
            key: 'receiptNumber',
            header: 'Receipt Ref',
            width: '14%',
            render: (p) => (
              <span className="font-mono font-bold text-text flex items-center gap-1.5 whitespace-nowrap">
                <ArrowDownLeft size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0"/>
                <span>{p.receiptNumber}</span>
              </span>
            ),
        },
        {
            key: 'customer',
            header: 'Customer Account',
            width: '24%',
            render: (p) => <span className="font-bold text-text block">{p.customer}</span>,
        },
        {
            key: 'invoiceNumber',
            header: 'Settled Invoice',
            width: '14%',
            render: (p) => <span className="font-mono font-semibold text-primary whitespace-nowrap">{p.invoiceNumber}</span>,
        },
        {
            key: 'date',
            header: 'Payment Date',
            width: '12%',
            render: (p) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(p.date)}</span>,
        },
        {
            key: 'mode',
            header: 'Payment Mode',
            align: 'center',
            width: '14%',
            render: (p) => (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-border whitespace-nowrap">
                <CreditCard size={11} className="text-muted"/> {p.mode}
              </span>
            ),
        },
        {
            key: 'reference',
            header: 'Transaction / Wire Ref',
            width: '12%',
            render: (p) => (
              <span className="font-mono text-[11px] text-muted whitespace-nowrap">{p.reference}</span>
            ),
        },
        {
            key: 'amount',
            header: 'Amount Received',
            align: 'right',
            width: '14%',
            render: (p) => (
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                +{formatCurrency(p.amount ?? 0)}
              </span>
            ),
        },
    ];
    const avgReceipt = paymentIns.length > 0 ? (totalCollected / paymentIns.length) : 0;
    const wireCount = paymentIns.filter(p => (p.mode || '').toLowerCase().includes('wire') || (p.mode || '').toLowerCase().includes('bank')).length;

    return (<div className="space-y-6">
      <PageHeader title="Payment Receipts & AR Collections" subtitle="Record incoming payments, allocate across customer open invoices, automatically credit cash/bank, and post double-entry General Ledger receipts." guide={paymentInGuide} actions={<Button icon={Plus} onClick={() => {
                if (invoices.length > 0) {
                    handleInvoiceChange(invoices[0].id);
                }
                setShowAddModal(true);
            }}>
            Record Payment In
          </Button>}/>

      {/* Payment In KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Received Collections" value={formatCurrency(totalCollected)} icon={DollarSign} highlight />
        <StatCard label="Total Vouchers Issued" value={`${paymentIns.length} Receipts`} icon={Receipt} trend={{ positive: true, text: 'Cleared to Ledger' }} />
        <StatCard label="Avg Receipt Amount" value={formatCurrency(avgReceipt)} icon={TrendingUp} />
        <StatCard label="Bank & Wire Transfers" value={`${wireCount} Settlements`} icon={CheckCircle2} subtext="Direct Treasury intake" />
      </div>

      <DataTable title="Cleared Customer Collections" columns={columns} data={paymentIns} keyExtractor={(p) => p.id} searchPlaceholder="Search receipt #, customer, or invoice..." searchFilter={(p, term) => p.receiptNumber.toLowerCase().includes(term) ||
            p.customer.toLowerCase().includes(term) ||
            (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term)) ||
            (p.reference && p.reference.toLowerCase().includes(term))}/>

      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600"/>
                <h3 className="font-bold text-base text-slate-900">Record Customer Receipt</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleRecord} className="space-y-4 mt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Sales Invoice *</label>
                <select value={selectedInvoiceId} onChange={(e) => handleInvoiceChange(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                  {invoices.map((inv) => {
                const outstanding = getInvoiceOutstanding(inv.id);
                return (<option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.customer} (Due: ${outstanding.balanceDue.toFixed(2)})
                      </option>);
            })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Settlement Amount ($) *</label>
                <input type="number" step="0.01" required min="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono font-bold text-sm text-slate-900"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800">
                    <option value="Bank Transfer">Bank Wire / ACH</option>
                    <option value="Corporate Card">Corporate Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference / Wire #</label>
                  <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-mono"/>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">
                  Post Payment & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
