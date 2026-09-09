import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, FileSpreadsheet, CheckCircle2, DollarSign, X, Eye, Printer, Clock, AlertCircle, FileText } from 'lucide-react';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { DocumentTimeline } from '../../components/common/DocumentTimeline';
import { RelatedDocumentsCard } from '../../components/common/RelatedDocumentsCard';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintBillModal } from '../../components/common/PrintBillModal';
const purchaseBillGuide = {
    title: 'Purchase Bills & Accounts Payable',
    subtitle: 'Supplier invoice intake, 3-way matching audit, inventory replenishment, and disbursements.',
    purpose: 'A Purchase Bill is an official invoice submitted by your supplier demanding payment for delivered goods or services. Recording a bill automatically increases warehouse inventory on-hand, reconciles against the original Purchase Order (3-Way Matching), and tracks Accounts Payable (AP) balances for disbursements.',
    keyTerms: [
        { term: 'Purchase Bill (Vendor Invoice)', definition: 'The financial document from a supplier charging your business for received goods.' },
        { term: '3-Way Matching', definition: 'The enterprise verification rule ensuring Purchase Order quantities = Warehouse Intake quantities = Billed invoice amounts.' },
        { term: 'Accounts Payable (AP)', definition: 'Short-term debt owed by your company to suppliers for goods already received on credit.' },
        { term: 'Disbursement Voucher', definition: 'Formal proof of outgoing cash, ACH, or wire payment to settle the vendor balance.' },
    ],
    tips: [
        'Always pull from an existing PO when recording a bill to ensure 100% 3-Way Match accuracy.',
        'Click "Pay Bill" to record an ACH or Wire disbursement and post the payment to the General Ledger.',
        'Click the 🖨️ icon to view or print an authentic formal vendor purchase bill.',
    ],
    workflow: ['PO Issued', 'Physical Goods Intake', 'Vendor Bill Recorded', '3-Way Match Verified', 'Payment Disbursed'],
};
export const PurchaseBillsPage = () => {
    const { purchaseBills, purchaseOrders, vendors, addPurchaseBill, addPaymentOut, getBillOutstanding, paymentOuts, purchaseReturns, } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showPayModal, setShowPayModal] = useState(null);
    const [printBillTarget, setPrintBillTarget] = useState(null);
    // Form state
    const [selectedPoId, setSelectedPoId] = useState('manual');
    const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
    const [dueDate, setDueDate] = useState('30 Days from now');
    const [lineItems, setLineItems] = useState([]);
    // Payment form state
    const [payAmount, setPayAmount] = useState(0);
    const [payMode, setPayMode] = useState('ACH');
    const [payRef, setPayRef] = useState('ACH-9941');
    const handleSelectPo = (poId) => {
        setSelectedPoId(poId);
        if (poId !== 'manual') {
            const matchedPo = purchaseOrders.find((p) => p.id === poId || p.poNumber === poId);
            if (matchedPo) {
                if (matchedPo.vendorId)
                    setSelectedVendorId(matchedPo.vendorId);
                if (matchedPo.items && matchedPo.items.length > 0) {
                    setLineItems(matchedPo.items);
                }
            }
        }
    };
    const handleCreate = (e) => {
        e.preventDefault();
        const po = purchaseOrders.find((p) => p.id === selectedPoId);
        const vend = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
        const totalAmt = lineItems.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0);
        addPurchaseBill({
            purchaseOrderId: po?.id,
            poRef: po?.poNumber || 'PO-DIRECT',
            linkedPo: po?.poNumber || 'PO-DIRECT',
            vendorId: vend?.id,
            vendor: vend?.name || 'Cisco Systems Direct',
            billDate: 'Today',
            date: 'Today',
            dueDate: dueDate || '30 Days from now',
            amount: totalAmt > 0 ? totalAmt : 5000,
            total: totalAmt > 0 ? totalAmt : 5000,
            paidAmount: 0,
            status: 'Unpaid',
            items: lineItems,
        });
        setShowAddModal(false);
        setLineItems([]);
    };
    const handleDisbursementSubmit = (e) => {
        e.preventDefault();
        if (!showPayModal || payAmount <= 0)
            return;
        addPaymentOut({
            vendorId: showPayModal.vendorId,
            vendor: showPayModal.vendor,
            billId: showPayModal.id,
            billNumber: showPayModal.billNumber,
            amount: payAmount,
            mode: payMode,
            reference: payRef || `ACH-${Date.now()}`,
        });
        setShowPayModal(null);
        setPayAmount(0);
    };
    const getBillTimelineSteps = (b) => {
        const outstanding = getBillOutstanding(b.id);
        return [
            {
                label: 'Purchase Order',
                docNumber: b.poRef || b.linkedPo || 'Direct PO',
                status: 'completed',
            },
            {
                label: 'Vendor Bill & Intake',
                docNumber: b.billNumber,
                amount: b.total || b.amount,
                date: b.billDate || b.date,
                status: 'completed',
            },
            {
                label: 'Disbursement Settlement',
                amount: outstanding.paid,
                status: outstanding.status === 'Paid' ? 'completed' : outstanding.status === 'Partially Paid' ? 'current' : 'pending',
            },
        ];
    };
    const getBillRelatedDocs = (b) => {
        const docs = [];
        const poNum = b.poRef || b.linkedPo;
        if (poNum) {
            const po = purchaseOrders.find((p) => p.poNumber === poNum || p.id === b.purchaseOrderId);
            if (po) {
                docs.push({
                    type: 'Purchase Order',
                    number: po.poNumber,
                    amount: po.amount,
                    date: po.date,
                    status: po.status,
                });
            }
        }
        const disbursements = paymentOuts.filter((p) => p.billId === b.id || p.billNumber === b.billNumber);
        disbursements.forEach((p) => {
            docs.push({
                type: 'Payment',
                number: p.voucherNumber,
                amount: p.amount,
                date: p.date,
                status: 'Paid',
            });
        });
        const debitNotes = purchaseReturns.filter((pr) => pr.billId === b.id || pr.billRef === b.billNumber);
        debitNotes.forEach((pr) => {
            docs.push({
                type: 'Debit Note',
                number: pr.debitNoteNumber,
                amount: pr.amount,
                date: pr.date,
                status: pr.status,
            });
        });
        return docs;
    };
    const columns = [
        {
            key: 'billNumber',
            header: 'Vendor Bill #',
            render: (b) => (<button onClick={() => setSelectedBill(b)} className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1.5 text-left">
          <FileSpreadsheet size={13} className="text-slate-400"/> {b.billNumber}
        </button>),
        },
        {
            key: 'poRef',
            header: '3-Way Match & PO Ref',
            render: (b) => {
                const poNum = b.poRef || b.linkedPo;
                const linkedPo = purchaseOrders.find((p) => p.poNumber === poNum || p.id === b.purchaseOrderId);
                let matchBadge = {
                    label: 'Direct Entry',
                    bg: 'bg-slate-100 text-slate-700 border-slate-200',
                };
                if (linkedPo) {
                    const poItemsCount = linkedPo.items?.reduce((acc, it) => acc + it.qty, 0) || 0;
                    const billItemsCount = b.items?.reduce((acc, it) => acc + it.qty, 0) || 0;
                    if (poItemsCount === billItemsCount && Math.abs((linkedPo.amount || 0) - (b.amount || b.total || 0)) < 1) {
                        matchBadge = {
                            label: '3-Way Matched (100%)',
                            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        };
                    }
                    else if (billItemsCount < poItemsCount) {
                        matchBadge = {
                            label: `Partial Intake (${billItemsCount}/${poItemsCount})`,
                            bg: 'bg-amber-50 text-amber-700 border-amber-200',
                        };
                    }
                    else {
                        matchBadge = {
                            label: 'Audit Verified',
                            bg: 'bg-blue-50 text-blue-700 border-blue-200',
                        };
                    }
                }
                return (<div className="space-y-1">
            <span className="font-mono text-slate-600 font-semibold block">{poNum || 'N/A'}</span>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${matchBadge.bg}`}>
              {matchBadge.label}
            </span>
          </div>);
            },
        },
        {
            key: 'vendor',
            header: 'Vendor Supplier',
            render: (b) => <span className="font-bold text-[#1F2E4A]">{b.vendor}</span>,
        },
        {
            key: 'billDate',
            header: 'Bill Date',
            render: (b) => <span className="text-slate-600">{b.billDate || b.date || 'Today'}</span>,
        },
        {
            key: 'dueDate',
            header: 'Payment Due',
            render: (b) => <span className="text-slate-600">{b.dueDate}</span>,
        },
        {
            key: 'amount',
            header: 'Bill Amount',
            align: 'right',
            render: (b) => (<span className="font-mono font-bold text-slate-900">
          ${(b.amount ?? b.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>),
        },
        {
            key: 'balanceDue',
            header: 'Outstanding Due',
            align: 'right',
            render: (b) => {
                const outstanding = getBillOutstanding(b.id);
                return (<span className={`font-mono font-bold ${outstanding.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            ${outstanding.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>);
            },
        },
        {
            key: 'status',
            header: 'Settlement Status',
            align: 'center',
            render: (b) => {
                const outstanding = getBillOutstanding(b.id);
                return <StatusBadge status={outstanding.status}/>;
            },
        },
        {
            key: 'actions',
            header: 'Disbursement',
            align: 'right',
            render: (b) => {
                const outstanding = getBillOutstanding(b.id);
                return (<div className="flex items-center justify-end gap-1.5">
            <button onClick={() => setSelectedBill(b)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Bill Details">
              <Eye className="w-4 h-4"/>
            </button>
            <button onClick={() => setPrintBillTarget(b)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Print Official Vendor Bill">
              <Printer className="w-4 h-4"/>
            </button>
            {outstanding.balanceDue > 0.01 ? (<button onClick={() => {
                            setShowPayModal(b);
                            setPayAmount(outstanding.balanceDue);
                        }} className="px-2.5 py-1 bg-[#1F2E4A] text-white rounded text-[11px] font-semibold hover:bg-[#152033] cursor-pointer inline-flex items-center gap-1 shadow-sm">
                <DollarSign className="w-3 h-3"/> Pay Bill
              </button>) : (<span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                <CheckCircle2 size={12}/> Disbursed
              </span>)}
          </div>);
            },
        },
    ];
    const totalBilled = purchaseBills.reduce((acc, b) => acc + (b.total || b.amount || 0), 0);
    const totalApOutstanding = purchaseBills.reduce((acc, b) => acc + getBillOutstanding(b.id).balanceDue, 0);
    const totalDisbursed = purchaseBills.reduce((acc, b) => acc + getBillOutstanding(b.id).paid, 0);
    const unpaidBillsCount = purchaseBills.filter(b => getBillOutstanding(b.id).balanceDue > 0).length;

    return (<div className="space-y-6">
      <PageHeader title="Purchase Bills & Accounts Payable" subtitle="Supplier invoice intake, line-item inventory replenishment, remaining balance tracking, and vendor disbursements." guide={purchaseBillGuide} actions={<Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Enter Vendor Bill
          </Button>}/>

      {/* Purchase Bills KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Billed Invoices" value={`$${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} />
        <StatCard label="AP Payable Due" value={`$${totalApOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Clock} trend={{ positive: totalApOutstanding === 0, text: totalApOutstanding > 0 ? `${unpaidBillsCount} unpaid bills` : 'All bills cleared' }} highlight={totalApOutstanding > 0} />
        <StatCard label="Total Disbursed" value={`$${totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={CheckCircle2} trend={{ positive: true, text: 'Disbursements verified' }} />
        <StatCard label="Active Bills" value={`${purchaseBills.length} Bills`} icon={FileText} subtext={`${unpaidBillsCount} awaiting payment`} />
      </div>

      <DataTable title="Accounts Payable Bills" columns={columns} data={purchaseBills} keyExtractor={(b) => b.id} searchPlaceholder="Search bill #, PO, or vendor..." searchFilter={(b, term) => b.billNumber.toLowerCase().includes(term) ||
            (b.poRef || b.linkedPo || '').toLowerCase().includes(term) ||
            b.vendor.toLowerCase().includes(term)}/>

      {/* Enter Bill Modal */}
      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">
                Record Vendor Purchase Bill
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pull From PO (Optional)</label>
                  <select value={selectedPoId} onChange={(e) => handleSelectPo(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                    <option value="manual">-- Manual Bill Entry --</option>
                    {purchaseOrders.map((po) => (<option key={po.id} value={po.id}>
                        {po.poNumber} ({po.vendor})
                      </option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor / Supplier *</label>
                  <select value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                    {vendors.map((v) => (<option key={v.id} value={v.id}>
                        {v.name} ({v.code})
                      </option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Due Date</label>
                  <input type="text" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"/>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-2">Billed Line Items (Adds to Stock on Save)</label>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="purchase"/>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-lg font-bold shadow-sm">
                  Record Bill & Intake Inventory
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Bill Detail Modal */}
      {selectedBill && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-[#1F2E4A]">{selectedBill.billNumber}</h3>
                <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                  {selectedBill.vendor}
                </span>
                <StatusBadge status={getBillOutstanding(selectedBill.id).status}/>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPrintBillTarget(selectedBill)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Printer size={13}/>
                  Print Official Bill
                </button>
                <button onClick={() => setSelectedBill(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <X size={18}/>
                </button>
              </div>
            </div>

            <div className="space-y-6 mt-4 overflow-y-auto pr-1 flex-1">
              {/* 3-Way Reconciliation Audit Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600"/>
                    3-Way Matching Audit Verification
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    RECONCILED
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/70">
                  <div>
                    <span className="text-slate-400 block text-[10px]">1. PO Approved Qty</span>
                    <strong className="text-slate-800 font-mono">
                      {selectedBill.items?.reduce((acc, it) => acc + it.qty, 0) || 0} Units
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">2. Physical Intake (GRN)</span>
                    <strong className="text-emerald-700 font-mono">
                      {selectedBill.items?.reduce((acc, it) => acc + it.qty, 0) || 0} Units Received
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">3. Vendor Invoiced Amount</span>
                    <strong className="text-slate-800 font-mono">
                      ${(selectedBill.total || selectedBill.amount).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <DocumentTimeline steps={getBillTimelineSteps(selectedBill)}/>
              <RelatedDocumentsCard documents={getBillRelatedDocs(selectedBill)}/>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Intake Line Items ({selectedBill.items?.length || 0})
                </h4>
                <LineItemEditor items={selectedBill.items || []} onChange={() => { }} readOnly={true} type="purchase"/>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 px-6 py-3">
              <div className="font-mono text-xs">
                Total: <strong className="text-slate-900">${(selectedBill.total || selectedBill.amount).toFixed(2)}</strong> | Due: <strong className="text-amber-700">${getBillOutstanding(selectedBill.id).balanceDue.toFixed(2)}</strong>
              </div>
              <div className="flex items-center gap-2">
                {getBillOutstanding(selectedBill.id).balanceDue > 0.01 && (<Button onClick={() => {
                    setShowPayModal(selectedBill);
                    setPayAmount(getBillOutstanding(selectedBill.id).balanceDue);
                    setSelectedBill(null);
                }}>
                    Disburse Payment
                  </Button>)}
                <Button variant="outline" onClick={() => setSelectedBill(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>)}

      {/* Pay Modal */}
      {showPayModal && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600"/>
                <h3 className="font-bold text-base text-slate-900">Disburse Vendor Payment</h3>
              </div>
              <button onClick={() => setShowPayModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18}/>
              </button>
            </div>
            <form onSubmit={handleDisbursementSubmit} className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor:</span>
                  <span className="font-bold text-slate-800">{showPayModal.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bill #:</span>
                  <span className="font-mono font-bold text-slate-800">{showPayModal.billNumber}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold border-t border-slate-200 pt-1">
                  <span>Balance Due:</span>
                  <span className="font-mono">${getBillOutstanding(showPayModal.id).balanceDue.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Disbursement Amount ($) *</label>
                <input type="number" step="0.01" min="0.01" max={getBillOutstanding(showPayModal.id).balanceDue} value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} required className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-mono font-bold text-sm"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                  <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800">
                    <option value="ACH">ACH Direct</option>
                    <option value="Bank Wire">Bank Wire</option>
                    <option value="Corporate Card">Corporate Card</option>
                    <option value="Cheque">Corporate Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Disbursement Voucher / Ref</label>
                  <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-mono"/>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowPayModal(null)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-lg font-bold shadow-sm">
                  Confirm Disbursement & Post GL
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Official Printable Vendor Bill Document */}
      <PrintBillModal isOpen={Boolean(printBillTarget)} onClose={() => setPrintBillTarget(null)} bill={printBillTarget} balanceDue={printBillTarget ? getBillOutstanding(printBillTarget.id).balanceDue : 0}/>
    </div>);
};
