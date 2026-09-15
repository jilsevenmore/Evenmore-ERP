import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, ArrowUpRight, CreditCard, X, DollarSign, Receipt, CheckCircle2, TrendingDown } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
const paymentOutGuide = {
    title: 'Payment Out & Vendor Disbursements',
    subtitle: 'Supplier payment authorization and Accounts Payable settlement',
    purpose: 'Use this page to issue disbursement vouchers against approved vendor bills. Paying a supplier decreases your company cash/bank balance and reduces Accounts Payable (AP) liability.',
    workflow: ['Receive Vendor Bill', 'Approve 3-Way Match', 'Issue Payment Out Voucher', 'AP Liability Settled'],
    keyTerms: [
        {
            term: 'Payment Out / Disbursement Voucher',
            definition: 'A formal payment authorization record documenting cash outflows paid to a vendor/supplier.',
        },
        {
            term: 'Accounts Payable (AP)',
            definition: 'Short-term debt obligations and unpaid vendor bills owed to suppliers.',
        },
        {
            term: '3-Way Matching Check',
            definition: 'Comparing PO qty & price with Delivery Challan receipt and Vendor Bill before disbursing funds.',
        },
        {
            term: 'Payment Terms (e.g., Net 30)',
            definition: 'The agreed timeframe by which full payment must be remitted after bill generation.',
        },
    ],
    tips: [
        'Always verify the vendor bill reference number before disbursing funds to prevent duplicate payment vouchers.',
    ],
};
export const PaymentOutPage = () => {
    const { paymentOuts, purchaseBills, vendors, addPaymentOut, getBillOutstanding, formatCurrency, formatDateDDMMYYYY, getCurrentDateFormatted } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBillId, setSelectedBillId] = useState(purchaseBills[0]?.id || '');
    const [amount, setAmount] = useState(1000);
    const [mode, setMode] = useState('ACH');
    const [reference, setReference] = useState('ACH-994821');

    const handleBillSelect = (billId) => {
        setSelectedBillId(billId);
        const bill = purchaseBills.find((b) => b.id === billId);
        if (bill) {
            const outstanding = getBillOutstanding(bill.id);
            setAmount(outstanding.balanceDue > 0 ? outstanding.balanceDue : (bill.total || bill.amount));
        }
    };

    const handleOpenModal = () => {
        const defaultBill = purchaseBills.find(b => b.status !== 'Cancelled' && getBillOutstanding(b.id).balanceDue > 0) || purchaseBills[0];
        if (defaultBill) {
            handleBillSelect(defaultBill.id);
        }
        setShowAddModal(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        const bill = purchaseBills.find((b) => b.id === selectedBillId) || purchaseBills[0];
        const vend = vendors.find((v) => v.name === bill?.vendor || v.id === bill?.vendorId);
        
        const res = addPaymentOut({
            vendorId: vend?.id || bill?.vendorId,
            vendor: bill?.vendor || vend?.name || 'Arrow Electronics Supply',
            billId: bill?.id,
            billNumber: bill?.billNumber || 'PB-2026-015',
            date: getCurrentDateFormatted(),
            mode,
            amount: Number(amount) || 1000,
            reference: reference || `ACH-${Date.now()}`,
        });

        if (res) {
            setShowAddModal(false);
        }
    };

    const selectedBill = purchaseBills.find((b) => b.id === selectedBillId);
    const selectedBillOutstanding = selectedBill ? getBillOutstanding(selectedBill.id) : { balanceDue: 0, paid: 0, status: 'Unpaid' };
    const isCancelled = selectedBill?.status === 'Cancelled';
    const isSettled = selectedBillOutstanding.balanceDue <= 0.01;

    const totalDisbursed = paymentOuts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const columns = [
        {
            key: 'voucherNumber',
            header: 'Voucher Number',
            width: '14%',
            render: (p) => (
              <span className="font-mono font-bold text-text flex items-center gap-1.5 whitespace-nowrap">
                <ArrowUpRight size={13} className="text-rose-600 dark:text-rose-400 shrink-0"/>
                <span>{p.voucherNumber}</span>
              </span>
            ),
        },
        {
            key: 'vendor',
            header: 'Payee Supplier',
            width: '24%',
            render: (p) => <span className="font-bold text-text block">{p.vendor}</span>,
        },
        {
            key: 'billNumber',
            header: 'Matched Bill Ref',
            width: '14%',
            render: (p) => <span className="font-mono font-semibold text-primary whitespace-nowrap">{p.billNumber}</span>,
        },
        {
            key: 'date',
            header: 'Disbursement Date',
            width: '12%',
            render: (p) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(p.date)}</span>,
        },
        {
            key: 'mode',
            header: 'Payment Channel',
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
            header: 'Bank Transaction Ref',
            width: '12%',
            render: (p) => (
              <span className="font-mono text-[11px] text-muted whitespace-nowrap">{p.reference}</span>
            ),
        },
        {
            key: 'amount',
            header: 'Disbursed Amount',
            align: 'right',
            width: '14%',
            render: (p) => (
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                -{formatCurrency(p.amount ?? 0)}
              </span>
            ),
        },
    ];
    const avgDisbursement = paymentOuts.length > 0 ? (totalDisbursed / paymentOuts.length) : 0;
    const achCount = paymentOuts.filter(p => (p.mode || '').toLowerCase().includes('ach') || (p.mode || '').toLowerCase().includes('wire')).length;

    return (<div className="space-y-6">
      <PageHeader title="Payment Out Vouchers" subtitle="Vendor disbursements, ACH/Wire payment authorizations, automatic bank debit, and Accounts Payable liability reduction." guide={paymentOutGuide} actions={<Button icon={Plus} onClick={handleOpenModal}>
            New Payment Voucher
          </Button>}/>

      {/* Payment Out KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Disbursed" value={formatCurrency(totalDisbursed)} icon={DollarSign} />
        <StatCard label="Total Disbursed Vouchers" value={`${paymentOuts.length} Vouchers`} icon={Receipt} trend={{ positive: true, text: 'Cleared to Ledger' }} />
        <StatCard label="Avg Disbursement" value={formatCurrency(avgDisbursement)} icon={TrendingDown} />
        <StatCard label="ACH & Wire Settlements" value={`${achCount} Electronic`} icon={CheckCircle2} subtext="Direct Treasury debit" />
      </div>

      <DataTable title="Vendor Disbursement Vouchers" columns={columns} data={paymentOuts} keyExtractor={(p) => p.id} searchPlaceholder="Search voucher #, vendor, or bill..." searchFilter={(p, term) => p.voucherNumber.toLowerCase().includes(term) ||
            p.vendor.toLowerCase().includes(term) ||
            (p.billNumber && p.billNumber.toLowerCase().includes(term)) ||
            (p.reference && p.reference.toLowerCase().includes(term))}/>

      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-600"/>
                <h3 className="font-bold text-base text-[#1F2E4A]">Issue Payment Out Voucher</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Vendor Bill *</label>
                <select value={selectedBillId} onChange={(e) => handleBillSelect(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                  {purchaseBills.map((b) => {
                    const outstanding = getBillOutstanding(b.id);
                    const tag = b.status === 'Cancelled' ? ' [Cancelled]' : outstanding.balanceDue <= 0.01 ? ' [Settled]' : ` [Due: ${formatCurrency(outstanding.balanceDue)}]`;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.billNumber} - {b.vendor}{tag}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedBill && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supplier:</span>
                    <span className="font-bold text-slate-800">{selectedBill.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bill Total:</span>
                    <span className="font-mono text-slate-800">{formatCurrency(selectedBill.total || selectedBill.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Already Paid:</span>
                    <span className="font-mono text-slate-600">{formatCurrency(selectedBillOutstanding.paid)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-semibold border-t border-slate-200 pt-1">
                    <span>Remaining Balance Due:</span>
                    <span className="font-mono font-bold">{formatCurrency(selectedBillOutstanding.balanceDue)}</span>
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  This bill is cancelled. No disbursements can be posted.
                </div>
              )}

              {isSettled && !isCancelled && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  This bill is already fully settled.
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Disbursed Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={Math.max(0.01, selectedBillOutstanding.balanceDue)}
                  disabled={isCancelled || isSettled}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 font-mono font-bold text-sm disabled:bg-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Channel</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value)} disabled={isCancelled || isSettled} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 disabled:bg-slate-100">
                    <option value="ACH">ACH Direct</option>
                    <option value="Bank Wire">Bank Wire</option>
                    <option value="Corporate Card">Corporate Card</option>
                    <option value="Cheque">Corporate Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Voucher / Ref #</label>
                  <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} disabled={isCancelled || isSettled} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-mono disabled:bg-slate-100"/>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isCancelled || isSettled || amount <= 0 || amount > selectedBillOutstanding.balanceDue + 0.01} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-sm cursor-pointer">
                  Post Voucher & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
