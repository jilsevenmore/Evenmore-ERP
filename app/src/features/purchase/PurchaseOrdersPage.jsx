import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, ClipboardList, Send, ArrowRight, X, Copy, Printer, DollarSign, Clock, CheckCircle2, Package, Maximize2, Minimize2, Trash2, Ban, MapPin } from 'lucide-react';
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
    const { purchaseOrders, vendors, addPurchaseOrder, updatePurchaseOrderStatus, cancelPurchaseOrder, deletePurchaseOrder, getPoBilledStatus, convertPurchaseOrderToBill, purchaseBills, paymentOuts, formatCurrency, formatDateDDMMYYYY, getCurrentDateFormatted } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedPo, setSelectedPo] = useState(null);
    const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
    const [expectedDate, setExpectedDate] = useState('In 10 days');
    const [lineItems, setLineItems] = useState([]);

    const handleOpenCreateModal = () => {
        setSelectedVendorId(vendors[0]?.id || '');
        setExpectedDate('In 10 days');
        setLineItems([]);
        setIsFullscreen(false);
        setShowAddModal(true);
    };

    const handleCloseCreateModal = () => {
        setShowAddModal(false);
        setSelectedVendorId(vendors[0]?.id || '');
        setExpectedDate('In 10 days');
        setLineItems([]);
        setIsFullscreen(false);
    };

    const handleClonePo = (po) => {
        setSelectedVendorId(po.vendorId || vendors[0]?.id || '');
        setExpectedDate('In 10 days (Reorder)');
        setLineItems((po.items || []).map((it) => ({
            ...it,
            id: `li-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        })));
        setIsFullscreen(false);
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
            date: getCurrentDateFormatted(),
            expectedDate: expectedDate || 'In 10 days',
            status: 'Draft',
            items: lineItems,
        });
        handleCloseCreateModal();
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
        const poStatusInfo = getPoBilledStatus(po.id);
        const linkedBills = poStatusInfo.activeBills || [];
        const isBilled = poStatusInfo.totalBilledQty > 0;
        const latestBill = linkedBills[0];
        const isPaid = latestBill?.status === 'Paid';
        return [
            {
                label: 'Purchase Order',
                docNumber: po.poNumber,
                date: formatDateDDMMYYYY(po.date),
                amount: po.amount,
                status: isIssued ? 'completed' : 'current',
            },
            {
                label: poStatusInfo.status === 'Partially Billed' ? 'Partial Intake & Bill' : 'Supplier Receipt & Bill',
                docNumber: latestBill?.billNumber,
                amount: latestBill?.total || latestBill?.amount,
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
        const poStatusInfo = getPoBilledStatus(po.id);
        (poStatusInfo.activeBills || []).forEach((linkedBill) => {
            docs.push({
                type: 'Purchase Bill',
                number: linkedBill.billNumber,
                amount: linkedBill.total || linkedBill.amount,
                date: formatDateDDMMYYYY(linkedBill.date || linkedBill.billDate),
                status: linkedBill.status,
            });
            const relatedPayments = paymentOuts.filter((p) => p.billId === linkedBill.id || p.billNumber === linkedBill.billNumber);
            relatedPayments.forEach((p) => {
                docs.push({
                    type: 'Payment',
                    number: p.voucherNumber,
                    amount: p.amount,
                    date: formatDateDDMMYYYY(p.date),
                    status: 'Paid',
                });
            });
        });
        return docs;
    };
    const columns = [
        {
            key: 'poNumber',
            header: 'PO Number',
            width: '13%',
            render: (p) => (<button onClick={() => setSelectedPo(p)} className="font-mono font-bold text-primary hover:underline flex items-center gap-1.5 text-left cursor-pointer whitespace-nowrap">
          <ClipboardList size={13} className="text-muted"/> {p.poNumber}
        </button>),
        },
        {
            key: 'vendor',
            header: 'Supplier / Vendor',
            width: '20%',
            render: (p) => <span className="font-bold text-text">{p.vendor}</span>,
        },
        {
            key: 'date',
            header: 'PO Date',
            width: '10%',
            render: (p) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(p.date)}</span>,
        },
        {
            key: 'expectedDate',
            header: 'Expected Delivery',
            width: '12%',
            render: (p) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(p.expectedDate)}</span>,
        },
        {
            key: 'amount',
            header: 'Total Order Value',
            align: 'right',
            width: '12%',
            render: (p) => (<span className="font-mono font-bold text-text whitespace-nowrap">
          {formatCurrency(p.amount ?? p.total ?? 0)}
        </span>),
        },
        {
            key: 'status',
            header: 'Fulfillment Status',
            align: 'center',
            width: '13%',
            render: (p) => {
                const info = getPoBilledStatus(p.id);
                return (
                  <div className="space-y-0.5">
                    <StatusBadge status={info.status}/>
                    {info.status === 'Partially Billed' && (
                      <span className="block text-[10px] text-amber-700 font-mono">
                        {info.totalBilledQty}/{info.totalOrderedQty} Received
                      </span>
                    )}
                  </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions / Intake',
            align: 'right',
            width: '20%',
            render: (p) => {
                const poStatusInfo = getPoBilledStatus(p.id);
                const isCancelled = p.status === 'Cancelled';
                const isFullyBilled = poStatusInfo.status === 'Billed';
                const hasRemaining = poStatusInfo.totalRemainingQty > 0;
                return (
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <button onClick={() => handleClonePo(p)} className="p-1 text-muted hover:text-primary hover:bg-soft rounded-lg cursor-pointer transition-colors" title="Clone / Reorder this Purchase Order">
                      <Copy size={13}/>
                    </button>
                    {p.status === 'Draft' && (
                      <button
                        type="button"
                        onClick={() => deletePurchaseOrder(p.id)}
                        className="p-1 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="Delete Draft PO"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    {p.status === 'Draft' ? (
                      <button onClick={() => issuePo(p.id)} className="px-2.5 py-1 bg-primary text-white rounded-md text-xs font-semibold hover:bg-primary-hover cursor-pointer shadow-xs transition-colors whitespace-nowrap inline-flex items-center gap-1">
                        <Send size={11}/> Issue PO
                      </button>
                    ) : isCancelled ? (
                      <span className="text-xs text-rose-600 font-semibold inline-flex items-center gap-1">
                        <Ban size={11}/> Cancelled
                      </span>
                    ) : isFullyBilled ? (
                      <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 size={11}/> Fully Billed
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        {poStatusInfo.totalBilledQty <= 0 && (
                          <button onClick={() => cancelPurchaseOrder(p.id)} className="p-1 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors" title="Cancel Purchase Order">
                            <Ban size={13}/>
                          </button>
                        )}
                        {hasRemaining && (
                          <button onClick={() => handleConvertToBill(p.id)} className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 justify-end cursor-pointer whitespace-nowrap">
                            {poStatusInfo.status === 'Partially Billed' ? `Bill Remaining (${poStatusInfo.totalRemainingQty})` : 'Create Bill'} <ArrowRight size={11}/>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
            },
        },
    ];
    const totalPoValue = purchaseOrders.reduce((sum, p) => sum + (p.amount ?? p.total ?? 0), 0);
    const activePoCount = purchaseOrders.filter(p => p.status === 'Issued' || p.status === 'Pending').length;
    const draftPoCount = purchaseOrders.filter(p => p.status === 'Draft').length;
    const receivedPoCount = purchaseOrders.filter(p => p.status === 'Received' || p.status === 'Billed').length;

    return (<div className="space-y-6">
      <PageHeader title="Purchase Orders Management" subtitle="Issue procurement orders to suppliers for stock intake, manage component line items, and seamlessly convert to vendor bills." guide={purchaseOrderGuide} actions={<Button icon={Plus} onClick={handleOpenCreateModal}>
            Create Purchase Order
          </Button>}/>

      {/* Purchase Orders KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Committed Procurement" value={formatCurrency(totalPoValue)} icon={DollarSign} />
        <StatCard label="Active Orders In-Flight" value={`${activePoCount} Orders`} icon={Clock} trend={{ positive: true, text: 'Awaiting dock arrival' }} highlight={activePoCount > 0} />
        <StatCard label="Draft Orders" value={`${draftPoCount} Drafts`} icon={Package} subtext="Ready for vendor dispatch" />
        <StatCard label="Fulfilled & Billed" value={`${receivedPoCount} Received`} icon={CheckCircle2} trend={{ positive: true, text: 'Inventory updated' }} />
      </div>

      <DataTable title="Supplier Purchase Orders" columns={columns} data={purchaseOrders} keyExtractor={(p) => p.id} searchPlaceholder="Search PO # or vendor..." searchFilter={(p, term) => p.poNumber.toLowerCase().includes(term) ||
            p.vendor.toLowerCase().includes(term)}/>

      {/* Create PO Modal */}
      {showAddModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-200 ${isFullscreen ? 'p-0' : 'p-4'}`}>
          <div className={`bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isFullscreen ? 'w-full h-full rounded-none p-8' : 'max-w-5xl w-full rounded-2xl p-6 max-h-[92vh]'
          } text-xs`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">
                Draft New Purchase Order
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen" : "Maximize Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18}/>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor / Supplier *</label>
                  <select value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.code}) - Terms: {v.paymentTerms}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const vend = vendors.find(v => v.id === selectedVendorId) || vendors[0];
                    if (!vend) return null;
                    return (
                      <div className="mt-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{vend.name}</span>
                          <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Terms: {vend.paymentTerms || 'Net 30'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-600 text-[10px]">
                          <span>POC: <strong>{vend.contactPerson || 'Vendor Rep'}</strong></span>
                          <span>Email: {vend.email}</span>
                          <span>Phone: {vend.phone}</span>
                        </div>
                      </div>
                    );
                  })()}
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
                <button type="button" onClick={handleCloseCreateModal} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-lg font-bold shadow-sm cursor-pointer">
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
              {/* Vendor & Address Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Supplier / Vendor</span>
                    <strong className="text-slate-900 text-sm block">{selectedPo.vendor}</strong>
                    <div className="text-slate-600 mt-1 flex items-start gap-1">
                      <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {selectedPo.billingAddress?.line1 || 'Corporate Headquarters'}<br />
                        {selectedPo.billingAddress?.city || 'Mumbai'}, {selectedPo.billingAddress?.state || 'Maharashtra'} - {selectedPo.billingAddress?.pincode || '400001'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Shipment & Delivery Terms</span>
                    <p className="text-slate-700">Expected Delivery: <strong>{formatDateDDMMYYYY(selectedPo.expectedDate)}</strong></p>
                    <p className="text-slate-700">PO Date: <strong>{formatDateDDMMYYYY(selectedPo.date)}</strong></p>
                    <p className="text-slate-700">Status: <strong className="text-slate-900">{selectedPo.status}</strong></p>
                  </div>
                </div>
              </div>

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
              {(() => {
                const poInfo = getPoBilledStatus(selectedPo.id);
                return (
                  <>
                    <div className="font-mono text-xs space-y-0.5">
                      <div>PO Value: <strong className="text-slate-900">{formatCurrency(selectedPo.amount || selectedPo.total || 0)}</strong></div>
                      {poInfo.status === 'Partially Billed' && (
                        <div className="text-[11px] text-amber-700 font-sans font-semibold">
                          Intake Progress: {poInfo.totalBilledQty}/{poInfo.totalOrderedQty} items received ({poInfo.totalRemainingQty} remaining)
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPo.status === 'Draft' && (
                        <button
                          type="button"
                          onClick={() => {
                            deletePurchaseOrder(selectedPo.id);
                            setSelectedPo(null);
                          }}
                          className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 size={13} /> Delete Draft
                        </button>
                      )}
                      {selectedPo.status === 'Draft' && (<Button onClick={() => { issuePo(selectedPo.id); setSelectedPo(null); }}>
                          Issue PO to Vendor
                        </Button>)}
                      {selectedPo.status !== 'Draft' && selectedPo.status !== 'Cancelled' && poInfo.status !== 'Billed' && (
                        <>
                          {poInfo.totalBilledQty <= 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                cancelPurchaseOrder(selectedPo.id);
                                setSelectedPo(null);
                              }}
                              className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Ban size={13} /> Cancel PO
                            </button>
                          )}
                          {poInfo.totalRemainingQty > 0 && (
                            <Button onClick={() => { handleConvertToBill(selectedPo.id); setSelectedPo(null); }}>
                              {poInfo.status === 'Partially Billed' ? `Bill Remaining (${poInfo.totalRemainingQty})` : 'Convert to Vendor Bill & Intake Goods'}
                            </Button>
                          )}
                        </>
                      )}
                      {poInfo.status === 'Billed' && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> Fully Billed & Received
                        </span>
                      )}
                      {selectedPo.status === 'Cancelled' && (
                        <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 inline-flex items-center gap-1.5">
                          <Ban size={13} /> Order Cancelled
                        </span>
                      )}
                      <Button variant="outline" onClick={() => setSelectedPo(null)}>
                        Close
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>)}
    </div>);
};
