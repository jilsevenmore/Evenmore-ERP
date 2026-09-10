import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Plus, RotateCcw, CheckCircle2, X } from 'lucide-react';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { PageHeader } from '../../components/common/PageHeader';
const purchaseReturnGuide = {
    title: 'Purchase Returns & Debit Notes',
    subtitle: 'Supplier RMA, debit memo issuance, and payables write-down',
    purpose: 'Use this page when purchased items arrive damaged, defective, or incorrect. Issuing a Debit Note reduces your stock quantity and deducts the amount from your vendor Accounts Payable balance.',
    workflow: ['Inspect Intake Goods', 'Detect Defect / Issue', 'Issue Debit Note', 'AP Balance Reduced'],
    keyTerms: [
        {
            term: 'Debit Note / Debit Memo',
            definition: 'A commercial document issued by a buyer to notify a supplier that their payable balance is being debited/reduced.',
        },
        {
            term: 'RMA (Return Merchandise Authorization)',
            definition: 'Supplier approval code allowing defective or surplus components to be returned for credit.',
        },
        {
            term: 'Stock Reversal',
            definition: 'Automatically decreasing on-hand inventory when components are shipped back to the vendor.',
        },
        {
            term: 'Settled Status',
            definition: 'Acknowledges that the vendor has credited the debit note against future or current invoices.',
        },
    ],
    tips: [
        'Once a debit note is settled, it automatically reconciles in the Vendor 360° Statement.',
    ],
};
export const PurchaseReturnsPage = () => {
    const { purchaseReturns, vendors, purchaseBills, addPurchaseReturn, updatePurchaseReturnStatus, formatCurrency, formatDateDDMMYYYY, getCurrentDateFormatted } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBillId, setSelectedBillId] = useState(purchaseBills[0]?.id || '');
    const [reason, setReason] = useState('Damaged casing detected on intake inspection');
    const [lineItems, setLineItems] = useState([]);
    const handleBillSelect = (billId) => {
        setSelectedBillId(billId);
        const bill = purchaseBills.find((b) => b.id === billId);
        if (bill && bill.items && bill.items.length > 0) {
            setLineItems(bill.items);
        }
    };
    const handleCreate = (e) => {
        e.preventDefault();
        const bill = purchaseBills.find((b) => b.id === selectedBillId) || purchaseBills[0];
        const vend = vendors.find((v) => v.name === bill?.vendor || v.id === bill?.vendorId);
        const totalAmt = lineItems.reduce((sum, item) => sum + (item.amount || item.qty * item.rate), 0);
        addPurchaseReturn({
            vendorId: vend?.id,
            vendor: bill?.vendor || vend?.name || 'Delta Controls & Hydraulics',
            billId: bill?.id,
            billRef: bill?.billNumber || 'PB-2026-015',
            date: getCurrentDateFormatted(),
            amount: totalAmt > 0 ? totalAmt : 500,
            reason,
            status: 'Pending Credit',
            items: lineItems,
        });
        setShowAddModal(false);
        setLineItems([]);
    };
    const markSettled = (id) => {
        updatePurchaseReturnStatus(id, 'Settled');
    };
    const columns = [
        {
            key: 'debitNoteNumber',
            header: 'Debit Note #',
            render: (r) => (<span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
          <RotateCcw size={13} className="text-rose-600"/> {r.debitNoteNumber}
        </span>),
        },
        {
            key: 'vendor',
            header: 'Vendor Supplier',
            render: (r) => <span className="font-bold text-[#1F2E4A]">{r.vendor}</span>,
        },
        {
            key: 'billRef',
            header: 'Matched Bill Ref',
            render: (r) => <span className="font-mono text-slate-600 font-semibold">{r.billRef || 'PB-INTAKE'}</span>,
        },
        {
            key: 'date',
            header: 'Issue Date',
            render: (r) => <span className="text-slate-600">{formatDateDDMMYYYY(r.date)}</span>,
        },
        {
            key: 'reason',
            header: 'Defect / Return Reason',
            render: (r) => <span className="text-slate-700 text-[11px]">{r.reason}</span>,
        },
        {
            key: 'amount',
            header: 'Debit Amount',
            align: 'right',
            render: (r) => (<span className="font-mono font-bold text-slate-900">
          {formatCurrency(r.amount ?? 0)}
        </span>),
        },
        {
            key: 'status',
            header: 'Settlement Status',
            align: 'center',
            render: (r) => <StatusBadge status={r.status}/>,
        },
        {
            key: 'actions',
            header: 'Reconciliation',
            align: 'right',
            render: (r) => r.status !== 'Settled' ? (<button onClick={() => markSettled(r.id)} className="px-2.5 py-1 bg-[#1F2E4A] text-white rounded text-[11px] font-semibold hover:bg-[#152033] cursor-pointer flex items-center gap-1 ml-auto shadow-sm">
            <CheckCircle2 size={11}/> Mark Credit Received
          </button>) : (<span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1 justify-end">
            <CheckCircle2 size={12}/> Settled on Payables
          </span>),
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Purchase Returns & Debit Notes" subtitle="Supplier debit memos, vendor return documentation, inventory reductions, and Accounts Payable ledger write-downs." guide={purchaseReturnGuide} actions={<Button icon={Plus} onClick={() => {
                if (purchaseBills.length > 0) {
                    handleBillSelect(purchaseBills[0].id);
                }
                setShowAddModal(true);
            }}>
            Create Debit Note
          </Button>}/>

      <DataTable title="Vendor Return Debit Notes" columns={columns} data={purchaseReturns} keyExtractor={(r) => r.id} searchPlaceholder="Search debit note # or vendor..." searchFilter={(r, term) => r.debitNoteNumber.toLowerCase().includes(term) ||
            r.vendor.toLowerCase().includes(term) ||
            (r.billRef && r.billRef.toLowerCase().includes(term)) ||
            r.reason.toLowerCase().includes(term)}/>

      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full p-6 text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">
                Issue Vendor Debit Note
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Vendor Bill *</label>
                  <select value={selectedBillId} onChange={(e) => handleBillSelect(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                    {purchaseBills.map((b) => (<option key={b.id} value={b.id}>
                        {b.billNumber} - {b.vendor} (${(b.total || b.amount).toFixed(2)})
                      </option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Return / Rejection</label>
                  <input type="text" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Broken packaging, wrong voltage rating..." className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"/>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-2">Returned Component Line Items (Reduces Stock)</label>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="purchase"/>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm">
                  Issue Debit Note & Post AP Reduction
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
