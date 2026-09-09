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
    const { paymentOuts, purchaseBills, vendors, addPaymentOut, getBillOutstanding } = useERP();
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
    const handleCreate = (e) => {
        e.preventDefault();
        const bill = purchaseBills.find((b) => b.id === selectedBillId) || purchaseBills[0];
        const vend = vendors.find((v) => v.name === bill?.vendor || v.id === bill?.vendorId);
        addPaymentOut({
            vendorId: vend?.id,
            vendor: bill?.vendor || vend?.name || 'Arrow Electronics Supply',
            billId: bill?.id,
            billNumber: bill?.billNumber || 'PB-2026-015',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            mode,
            amount: Number(amount) || 1000,
            reference: reference || `ACH-${Date.now()}`,
        });
        setShowAddModal(false);
    };
    const totalDisbursed = paymentOuts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const columns = [
        {
            key: 'voucherNumber',
            header: 'Voucher Number',
            render: (p) => (<span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
          <ArrowUpRight size={13} className="text-rose-600"/> {p.voucherNumber}
        </span>),
        },
        {
            key: 'vendor',
            header: 'Payee Supplier',
            render: (p) => <span className="font-bold text-[#1F2E4A]">{p.vendor}</span>,
        },
        {
            key: 'billNumber',
            header: 'Matched Bill Ref',
            render: (p) => <span className="font-mono font-semibold text-blue-600">{p.billNumber}</span>,
        },
        {
            key: 'date',
            header: 'Disbursement Date',
            render: (p) => <span className="text-slate-600">{p.date}</span>,
        },
        {
            key: 'mode',
            header: 'Payment Channel',
            render: (p) => (<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
          <CreditCard size={11} className="text-slate-500"/> {p.mode}
        </span>),
        },
        {
            key: 'reference',
            header: 'Bank Transaction Ref',
            render: (p) => (<span className="font-mono text-[11px] text-slate-500">{p.reference}</span>),
        },
        {
            key: 'amount',
            header: 'Disbursed Amount',
            align: 'right',
            render: (p) => (<span className="font-mono font-bold text-rose-700">
          -${(p.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>),
        },
    ];
    const avgDisbursement = paymentOuts.length > 0 ? (totalDisbursed / paymentOuts.length) : 0;
    const achCount = paymentOuts.filter(p => (p.mode || '').toLowerCase().includes('ach') || (p.mode || '').toLowerCase().includes('wire')).length;

    return (<div className="space-y-6">
      <PageHeader title="Payment Out Vouchers" subtitle="Vendor disbursements, ACH/Wire payment authorizations, automatic bank debit, and Accounts Payable liability reduction." guide={paymentOutGuide} actions={<Button icon={Plus} onClick={() => {
                if (purchaseBills.length > 0) {
                    handleBillSelect(purchaseBills[0].id);
                }
                setShowAddModal(true);
            }}>
            New Payment Voucher
          </Button>}/>

      {/* Payment Out KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Disbursed" value={`$${totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} />
        <StatCard label="Total Disbursed Vouchers" value={`${paymentOuts.length} Vouchers`} icon={Receipt} trend={{ positive: true, text: 'Cleared to Ledger' }} />
        <StatCard label="Avg Disbursement" value={`$${avgDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={TrendingDown} />
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
                return (<option key={b.id} value={b.id}>
                        {b.billNumber} - {b.vendor} (Due: ${outstanding.balanceDue.toFixed(2)})
                      </option>);
            })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursed Amount ($) *</label>
                <input type="number" step="0.01" required min="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 font-mono font-bold text-sm"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Channel</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800">
                    <option value="ACH">ACH Direct</option>
                    <option value="Bank Wire">Bank Wire</option>
                    <option value="Corporate Card">Corporate Card</option>
                    <option value="Cheque">Corporate Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Voucher / Ref #</label>
                  <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-mono"/>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm">
                  Post Voucher & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
