import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, ClipboardList, Send, ArrowRight, X, Copy, Printer, DollarSign, Clock, CheckCircle2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { DocumentTimeline } from '../../components/common/DocumentTimeline';
import { RelatedDocumentsCard } from '../../components/common/RelatedDocumentsCard';
import { PageHeader } from '../../components/common/PageHeader';
const purchaseOrderGuide = {
    title: 'Purchase Orders',
    subtitle: 'Supplier procurement contracts driving inventory replenishment and vendor billing.',
    purpose: 'A Purchase Order (PO) is an official commercial document issued by your business to an external supplier, committing to buy specified quantities of goods at negotiated prices. It serves as the baseline for warehouse goods intake and 3-way matching.',
    keyTerms: [
        { term: 'Purchase Order (PO)', definition: 'A legally binding procurement contract sent to a vendor before goods are shipped.' },
        { term: 'Vendor Lead Time', definition: 'The expected days between issuing the PO and receiving physical delivery at the warehouse dock.' },
        { term: 'PO to Bill Conversion', definition: 'Converts the verified order into a vendor invoice and automatically increases warehouse inventory on-hand.' },
    ],
    tips: [
        'Use the 📋 Clone button on frequent supplier orders to duplicate items into a new draft in 1 click.',
        'Once goods arrive at the dock, click "Create Bill" to post inventory intake and record Accounts Payable.',
    ],
    workflow: ['Auto-Generated / Draft PO', 'Issued to Vendor', 'Goods Intake & Vendor Bill', '3-Way Match Verified', 'Disbursement Settlement'],
};
export const PurchaseOrdersPage = () => {
    const navigate = useNavigate();
    const { purchaseOrders, vendors, addPurchaseOrder, updatePurchaseOrderStatus, convertPurchaseOrderToBill, purchaseBills, paymentOuts, } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPo, setSelectedPo] = useState(null);
    const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
    const [expectedDate, setExpectedDate] = useState('In 10 days');
    const [lineItems, setLineItems] = useState([]);
    const handleClonePo = (po) => {
        setSelectedVendorId(po.vendorId || vendors[0]?.id || '');
        setExpectedDate('In 10 days (Reorder)');
        setLineItems((po.items || []).map((it) => ({
            ...it,
            id: `li-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        })));
        setShowAddModal(true);
    };
    const handleCreate = (e) => {
        e.preventDefault();
        const vend = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
        const totalAmt = lineItems.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0);
        addPurchaseOrder({
            vendorId: vend?.id,
            vendor: vend?.name || 'Cisco Systems Direct',
            amount: totalAmt > 0 ? totalAmt : 2500,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            expectedDate: expectedDate || 'In 10 days',
            status: 'Draft',
            items: lineItems,
        });
        setShowAddModal(false);
        setLineItems([]);
    };
    const issuePo = (id) => {
        updatePurchaseOrderStatus(id, 'Issued');
    };
    const handleConvertToBill = (poId) => {
        convertPurchaseOrderToBill(poId);
        navigate('/purchase/bills');
    };
    const getPoTimelineSteps = (po) => {
        const isIssued = po.status !== 'Draft';
        const linkedBill = purchaseBills.find((b) => b.purchaseOrderId === po.id || b.poRef === po.poNumber || b.linkedPo === po.poNumber);
        const isBilled = !!linkedBill;
        const isPaid = linkedBill?.status === 'Paid';
        return [
            {
                label: 'Purchase Order',
                docNumber: po.poNumber,
                date: po.date,
                amount: po.amount,
                status: isIssued ? 'completed' : 'current',
            },
            {
                label: 'Supplier Receipt & Bill',
                docNumber: linkedBill?.billNumber,
                amount: linkedBill?.total || linkedBill?.amount,
                status: isBilled ? 'completed' : isIssued ? 'current' : 'pending',
            },
            {
                label: 'Disbursement Payment',
                status: isPaid ? 'completed' : isBilled ? 'current' : 'pending',
            },
        ];
    };
    const getPoRelatedDocs = (po) => {
        const docs = [];
        const linkedBill = purchaseBills.find((b) => b.purchaseOrderId === po.id || b.poRef === po.poNumber || b.linkedPo === po.poNumber);
        if (linkedBill) {
            docs.push({
                type: 'Purchase Bill',
                number: linkedBill.billNumber,
                amount: linkedBill.total || linkedBill.amount,
                date: linkedBill.date || linkedBill.billDate,
                status: linkedBill.status,
            });
            const relatedPayments = paymentOuts.filter((p) => p.billId === linkedBill.id || p.billNumber === linkedBill.billNumber);
            relatedPayments.forEach((p) => {
                docs.push({
                    type: 'Payment',
                    number: p.voucherNumber,
                    amount: p.amount,
                    date: p.date,
                    status: 'Paid',
                });
            });
        }
        return docs;
    };
    const columns = [
        {
            key: 'poNumber',
            header: 'PO Number',
            render: (p) => (<button onClick={() => setSelectedPo(p)} className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1.5 text-left">
          <ClipboardList size={13} className="text-slate-400"/> {p.poNumber}
        </button>),
        },
        {
            key: 'vendor',
            header: 'Supplier / Vendor',
            render: (p) => <span className="font-bold text-[#1F2E4A]">{p.vendor}</span>,
        },
        {
            key: 'date',
            header: 'PO Date',
            render: (p) => <span className="text-slate-600">{p.date}</span>,
        },
        {
            key: 'expectedDate',
            header: 'Expected Delivery',
            render: (p) => <span className="text-slate-600">{p.expectedDate}</span>,
        },
        {
            key: 'amount',
            header: 'Total Order Value',
            align: 'right',
            render: (p) => (<span className="font-mono font-bold text-slate-900">
          ${(p.amount ?? p.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            align: 'center',
            render: (p) => <StatusBadge status={p.status}/>,
        },
        {
            key: 'actions',
            header: 'Actions / Intake',
            align: 'right',
            render: (p) => {
                return (<div className="flex items-center justify-end gap-1.5">
            <button onClick={() => handleClonePo(p)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors" title="Clone / Reorder this Purchase Order">
              <Copy size={13}/>
            </button>
            {p.status === 'Draft' ? (<button onClick={() => issuePo(p.id)} className="px-2.5 py-1 bg-[#1F2E4A] text-white rounded text-[11px] font-semibold hover:bg-[#152033] cursor-pointer flex items-center gap-1 shadow-sm">
                <Send size={11}/> Issue PO
              </button>) : (<button onClick={() => handleConvertToBill(p.id)} className="text-[11px] text-blue-700 font-semibold hover:underline flex items-center gap-1 justify-end cursor-pointer">
                Create Bill <ArrowRight size={11}/>
              </button>)}
          </div>);
            },
        },
    ];
    const totalPoValue = purchaseOrders.reduce((sum, p) => sum + (p.amount ?? p.total ?? 0), 0);
    const activePoCount = purchaseOrders.filter(p => p.status === 'Issued' || p.status === 'Pending').length;
    const draftPoCount = purchaseOrders.filter(p => p.status === 'Draft').length;
    const receivedPoCount = purchaseOrders.filter(p => p.status === 'Received' || p.status === 'Billed').length;

    return (<div className="space-y-6">
      <PageHeader title="Purchase Orders Management" subtitle="Issue procurement orders to suppliers for stock intake, manage component line items, and seamlessly convert to vendor bills." guide={purchaseOrderGuide} actions={<Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Create Purchase Order
          </Button>}/>

      {/* Purchase Orders KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Committed Procurement" value={`$${totalPoValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} />
        <StatCard label="Active Orders In-Flight" value={`${activePoCount} Orders`} icon={Clock} trend={{ positive: true, text: 'Awaiting dock arrival' }} highlight={activePoCount > 0} />
        <StatCard label="Draft Orders" value={`${draftPoCount} Drafts`} icon={Package} subtext="Ready for vendor dispatch" />
        <StatCard label="Fulfilled & Billed" value={`${receivedPoCount} Received`} icon={CheckCircle2} trend={{ positive: true, text: 'Inventory updated' }} />
      </div>

      <DataTable title="Supplier Purchase Orders" columns={columns} data={purchaseOrders} keyExtractor={(p) => p.id} searchPlaceholder="Search PO # or vendor..." searchFilter={(p, term) => p.poNumber.toLowerCase().includes(term) ||
            p.vendor.toLowerCase().includes(term)}/>

      {/* Create PO Modal */}
      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">
                Draft New Purchase Order
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor / Supplier *</label>
                  <select value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                    {vendors.map((v) => (<option key={v.id} value={v.id}>
                        {v.name} ({v.code}) - Terms: {v.paymentTerms}
                      </option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Intake Date</label>
                  <input type="text" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} placeholder="e.g. In 10 days" className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"/>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-2">Procurement Line Items</label>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="purchase"/>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-lg font-bold shadow-sm">
                  Save & Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* PO Detail & Lifecycle Modal */}
      {selectedPo && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-[#1F2E4A]">{selectedPo.poNumber}</h3>
                <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                  {selectedPo.vendor}
                </span>
                <StatusBadge status={selectedPo.status}/>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Printer size={13}/>
                  Print PO
                </button>
                <button onClick={() => setSelectedPo(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <X size={18}/>
                </button>
              </div>
            </div>

            <div className="space-y-6 mt-4 overflow-y-auto pr-1 flex-1">
              <DocumentTimeline steps={getPoTimelineSteps(selectedPo)}/>
              <RelatedDocumentsCard documents={getPoRelatedDocs(selectedPo)}/>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Procured Line Items ({selectedPo.items?.length || 0})
                </h4>
                <LineItemEditor items={selectedPo.items || []} onChange={() => { }} readOnly={true} type="purchase"/>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 px-6 py-3">
              <div className="font-mono text-xs">
                PO Value: <strong className="text-slate-900">${(selectedPo.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex items-center gap-2">
                {selectedPo.status === 'Draft' && (<Button onClick={() => { issuePo(selectedPo.id); setSelectedPo(null); }}>
                    Issue PO to Vendor
                  </Button>)}
                {selectedPo.status !== 'Draft' && (<Button onClick={() => { handleConvertToBill(selectedPo.id); setSelectedPo(null); }}>
                    Convert to Vendor Bill & Intake Goods
                  </Button>)}
                <Button variant="outline" onClick={() => setSelectedPo(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
};
