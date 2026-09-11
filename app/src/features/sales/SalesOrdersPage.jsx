import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, ShoppingCart, CheckCircle, Truck, Receipt, X, ShieldAlert, Copy, Printer, DollarSign, Clock, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { DocumentTimeline } from '../../components/common/DocumentTimeline';
import { RelatedDocumentsCard } from '../../components/common/RelatedDocumentsCard';
import { AutoPOModal } from '../../components/common/AutoPOModal';
import { PageHeader } from '../../components/common/PageHeader';
const salesOrderGuide = {
    title: 'Sales Orders',
    subtitle: 'Customer purchase agreements driving warehouse reservation and dispatch.',
    purpose: 'A Sales Order (SO) represents a legally confirmed customer commitment to purchase goods or services. Once confirmed, it reserves inventory in the warehouse, triggers a Delivery Challan for dispatch, and subsequently issues a commercial Sales Invoice.',
    keyTerms: [
        { term: 'Sales Order (SO)', definition: 'A confirmed commercial agreement between your business and the customer before dispatch.' },
        { term: 'Credit Limit Guard', definition: 'An enterprise safety check that ensures a customer\'s current debt plus new order does not exceed their approved threshold.' },
        { term: 'Inventory Reservation', definition: 'Stock committed to this order so it cannot be double-sold to another customer.' },
        { term: 'SO Lifecycle', definition: 'The 4-stage progression: Draft → Confirmed → Delivered (Challan) → Invoiced (Settlement).' },
    ],
    tips: [
        'Use the 📋 Clone button on any past order to duplicate customer and line items in 1 click.',
        'If stock is 0 or low, click [+PO] directly on the line item to requisition missing units immediately.',
    ],
    workflow: ['Quotation Approved', 'Sales Order Confirmed', 'Delivery Challan Dispatched', 'Sales Invoice Issued', 'Payment Receipt Settled'],
};
export const SalesOrdersPage = () => {
    const navigate = useNavigate();
    const { salesOrders, customers, addSalesOrder, updateSalesOrderStage, convertSalesOrderToInvoice, convertSalesOrderToChallan, deliveryChallans, invoices, paymentIns, formatCurrency, formatDateDDMMYYYY } = useERP();
    const [stageFilter, setStageFilter] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
    const [deliveryDate, setDeliveryDate] = useState('In 10 days');
    const [lineItems, setLineItems] = useState([]);
    // Auto-PO Requisition Modal State
    const [autoPOState, setAutoPOState] = useState({ isOpen: false });
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
    const totalAmt = lineItems.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0);
    const creditLimit = selectedCustomer?.creditLimit || 50000;
    const isCreditExceeded = selectedCustomer ? (selectedCustomer.balance + totalAmt) > creditLimit : false;

    const handleOpenCreateModal = () => {
        setSelectedCustomerId(customers[0]?.id || '');
        setDeliveryDate('In 10 days');
        setLineItems([]);
        setIsFullscreen(false);
        setShowAddModal(true);
    };

    const handleCloseCreateModal = () => {
        setShowAddModal(false);
        setSelectedCustomerId(customers[0]?.id || '');
        setDeliveryDate('In 10 days');
        setLineItems([]);
        setIsFullscreen(false);
    };

    const handleCloneOrder = (order) => {
        setSelectedCustomerId(order.customerId || customers[0]?.id || '');
        setDeliveryDate('In 10 days (Repeat Order)');
        setLineItems((order.items || []).map((it) => ({
            ...it,
            id: `li-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        })));
        setIsFullscreen(false);
        setShowAddModal(true);
    };
    const handleCreate = (e) => {
        e.preventDefault();
        const cust = selectedCustomer || customers[0];
        addSalesOrder({
            customerId: cust?.id,
            customer: cust?.name || 'Acme Corp',
            amount: totalAmt > 0 ? totalAmt : 5000,
            deliveryDate: deliveryDate || 'In 10 days',
            stage: 'Draft',
            status: 'Draft',
            paymentStatus: 'Unpaid',
            items: lineItems,
        });
        handleCloseCreateModal();
    };
    const advanceStage = (orderId, currentStage) => {
        if (currentStage === 'Draft') {
            updateSalesOrderStage(orderId, 'Confirmed');
        }
        else if (currentStage === 'Confirmed') {
            convertSalesOrderToChallan(orderId);
            navigate('/sales/delivery');
        }
        else if (currentStage === 'Delivered' || currentStage === 'Dispatched') {
            convertSalesOrderToInvoice(orderId);
            navigate('/sales/invoices');
        }
    };
    const filteredOrders = salesOrders.filter((o) => {
        if (stageFilter === 'All')
            return true;
        return o.stage === stageFilter;
    });
    const getOrderTimelineSteps = (order) => {
        const isQuoteLinked = !!order.quotationNumber;
        const isConfirmed = order.stage !== 'Draft';
        const isDispatched = order.stage === 'Delivered' || order.stage === 'Dispatched' || order.stage === 'Invoiced';
        const isInvoiced = order.stage === 'Invoiced';
        const linkedInvoice = invoices.find((i) => i.salesOrderId === order.id || i.linkedSo === order.orderNumber);
        const isPaid = linkedInvoice?.status === 'Paid' || order.paymentStatus === 'Paid';
        return [
            {
                label: 'Quotation',
                docNumber: order.quotationNumber || 'Direct Order',
                status: isQuoteLinked ? 'completed' : 'completed',
            },
            {
                label: 'Sales Order',
                docNumber: order.orderNumber,
                date: order.date,
                amount: order.amount,
                status: isConfirmed ? 'completed' : 'current',
            },
            {
                label: 'Delivery Challan',
                docNumber: order.orderNumber ? `DC for ${order.orderNumber}` : undefined,
                status: isDispatched ? 'completed' : isConfirmed ? 'current' : 'pending',
            },
            {
                label: 'Sales Invoice',
                docNumber: linkedInvoice?.invoiceNumber,
                amount: linkedInvoice?.total,
                status: isInvoiced ? 'completed' : isDispatched ? 'current' : 'pending',
            },
            {
                label: 'Payment Settlement',
                status: isPaid ? 'completed' : isInvoiced ? 'current' : 'pending',
            },
        ];
    };
    const getOrderRelatedDocs = (order) => {
        const docs = [];
        if (order.quotationNumber) {
            docs.push({
                type: 'Quotation',
                number: order.quotationNumber,
                amount: order.amount,
                status: 'Converted',
            });
        }
        const challans = deliveryChallans.filter((c) => c.salesOrderId === order.id || c.salesOrderNumber === order.orderNumber || c.linkedSo === order.orderNumber);
        challans.forEach((c) => {
            docs.push({
                type: 'Delivery Challan',
                number: c.challanNumber,
                date: c.date,
                status: c.status,
            });
        });
        const invs = invoices.filter((i) => i.salesOrderId === order.id || i.linkedSo === order.orderNumber);
        invs.forEach((inv) => {
            docs.push({
                type: 'Invoice',
                number: inv.invoiceNumber,
                amount: inv.total,
                date: inv.date,
                status: inv.status,
            });
            const payments = paymentIns.filter((p) => p.invoiceId === inv.id || p.invoiceNumber === inv.invoiceNumber);
            payments.forEach((p) => {
                docs.push({
                    type: 'Payment',
                    number: p.receiptNumber,
                    amount: p.amount,
                    date: p.date,
                    status: 'Settled',
                });
            });
        });
        return docs;
    };
    const columns = [
        {
            key: 'orderNumber',
            header: 'Sales Order #',
            width: '13%',
            render: (o) => (<button onClick={() => setSelectedOrder(o)} className="font-mono font-bold text-primary hover:underline flex items-center gap-1.5 text-left cursor-pointer whitespace-nowrap">
          <ShoppingCart size={13} className="text-muted"/> {o.orderNumber}
        </button>),
        },
        {
            key: 'customer',
            header: 'Customer Account',
            width: '20%',
            render: (o) => <span className="font-bold text-text">{o.customer}</span>,
        },
        {
            key: 'date',
            header: 'SO Date',
            width: '11%',
            render: (o) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(o.date)}</span>,
        },
        {
            key: 'deliveryDate',
            header: 'Target Delivery',
            width: '12%',
            render: (o) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(o.deliveryDate)}</span>,
        },
        {
            key: 'amount',
            header: 'Order Value',
            align: 'right',
            width: '12%',
            render: (o) => (<span className="font-mono font-bold text-text whitespace-nowrap">
          {formatCurrency(o.amount ?? o.total ?? 0)}
        </span>),
        },
        {
            key: 'stage',
            header: 'Stage Lifecycle',
            align: 'center',
            width: '14%',
            render: (o) => {
                const stageVal = o.stage || o.status || 'Draft';
                const stages = ['Draft', 'Confirmed', 'Delivered', 'Invoiced'];
                const currentIdx = stages.indexOf(stageVal);
                return (<div className="flex items-center justify-center gap-1">
            {stages.map((stg, i) => (<span key={stg} title={stg} className={`w-2.5 h-2.5 rounded-full ${i <= currentIdx ? 'bg-primary' : 'bg-border'}`}/>))}
            <span className="ml-1.5 text-[11px] font-semibold text-text">
              {stageVal}
            </span>
          </div>);
            },
        },
        {
            key: 'paymentStatus',
            header: 'Payment Status',
            align: 'center',
            width: '10%',
            render: (o) => <StatusBadge status={o.paymentStatus || 'Unpaid'}/>,
        },
        {
            key: 'actions',
            header: 'Actions / Lifecycle',
            align: 'right',
            width: '18%',
            render: (o) => {
                return (<div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button onClick={() => handleCloneOrder(o)} className="p-1 text-muted hover:text-primary hover:bg-soft rounded-lg cursor-pointer transition-colors" title="Clone / Duplicate this Sales Order">
              <Copy size={13}/>
            </button>

            {o.stage === 'Draft' && (<button onClick={() => advanceStage(o.id, 'Draft')} className="px-2.5 py-1 bg-primary text-white rounded-md text-xs font-semibold hover:bg-primary-hover cursor-pointer shadow-xs transition-colors whitespace-nowrap inline-flex items-center gap-1">
                Confirm Order
              </button>)}
            {o.stage === 'Confirmed' && (<button onClick={() => advanceStage(o.id, 'Confirmed')} className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors whitespace-nowrap">
                <Truck size={12}/> Issue Challan
              </button>)}
            {(o.stage === 'Delivered' || o.stage === 'Dispatched') && (<button onClick={() => advanceStage(o.id, 'Delivered')} className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors whitespace-nowrap">
                <Receipt size={12}/> Invoice
              </button>)}
            {o.stage === 'Invoiced' && (<span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 whitespace-nowrap">
                <CheckCircle size={12}/> Fulfilled
              </span>)}
          </div>);
            },
        },
    ];
    const totalSoValue = salesOrders.reduce((acc, o) => acc + (o.amount ?? o.total ?? 0), 0);
    const confirmedValue = salesOrders.filter(o => o.stage === 'Confirmed' || o.stage === 'Delivered').reduce((acc, o) => acc + (o.amount ?? o.total ?? 0), 0);
    const openOrdersCount = salesOrders.filter(o => o.stage !== 'Invoiced').length;
    const fulfilledOrdersCount = salesOrders.filter(o => o.stage === 'Invoiced').length;

    return (<div className="space-y-6">
      <PageHeader title="Sales Orders" subtitle="Confirmed customer purchase agreements driving warehouse stock reservation, dispatch manifests, and automated invoicing." guide={salesOrderGuide} actions={<Button icon={Plus} onClick={handleOpenCreateModal}>
            Create Sales Order
          </Button>}/>

      {/* Sales Orders KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Booked Pipeline" value={formatCurrency(totalSoValue)} icon={DollarSign} />
        <StatCard label="Active In-Fulfillment" value={formatCurrency(confirmedValue)} icon={Truck} trend={{ positive: true, text: `${openOrdersCount} orders active` }} highlight={openOrdersCount > 0} />
        <StatCard label="Open Backlog Orders" value={`${openOrdersCount} Orders`} icon={Clock} subtext="Pending warehouse dispatch" />
        <StatCard label="Invoiced & Fulfilled" value={`${fulfilledOrdersCount} Completed`} icon={CheckCircle2} trend={{ positive: true, text: 'Invoices created' }} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#CED4DA] pb-2 text-xs">
        {['All', 'Draft', 'Confirmed', 'Delivered', 'Invoiced'].map((stg) => (<button key={stg} onClick={() => setStageFilter(stg)} className={`px-3 py-1.5 rounded-t font-semibold transition-colors ${stageFilter === stg
                ? 'bg-white border-t-2 border-[#1F2E4A] text-[#1F2E4A] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'}`}>
            {stg}
          </button>))}
      </div>

      <DataTable title="Sales Order Register" data={filteredOrders} columns={columns} keyExtractor={(o) => o.id} searchPlaceholder="Search order number or customer..."/>

      {/* Create Modal */}
      {showAddModal && (
        <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${isFullscreen ? 'p-0' : 'p-4'}`}>
          <div className={`bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isFullscreen ? 'w-full h-full rounded-none p-8' : 'max-w-5xl w-full rounded-2xl p-6 max-h-[92vh]'
          } text-xs`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Create New Sales Order</h3>
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
                  <label className="font-semibold text-slate-700 block mb-1">Customer Account *</label>
                  <select required value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-medium">
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - Balance: ₹{c.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {selectedCustomer && (
                    <div className="mt-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{selectedCustomer.name}</span>
                        <span className="text-blue-700 font-mono text-[10px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Credit Limit: ₹{(selectedCustomer.creditLimit || 50000).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-600 text-[10px]">
                        <span>POC: <strong>{selectedCustomer.contactPerson || 'Account Lead'}</strong></span>
                        <span>Email: {selectedCustomer.email}</span>
                        <span>Phone: {selectedCustomer.phone}</span>
                        <span>Outstanding: ₹{(selectedCustomer.balance || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Delivery Date</label>
                  <input type="text" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} placeholder="e.g. In 10 days" className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"/>
                </div>
              </div>

              {/* Enterprise Credit Limit Guard */}
              {isCreditExceeded && selectedCustomer && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs">
                  <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5"/>
                  <div className="space-y-0.5">
                    <p className="font-bold">Credit Limit Guard Warning</p>
                    <p className="text-[11px] text-rose-700">
                      Customer current outstanding (${selectedCustomer.balance.toLocaleString()}) + this order (${totalAmt.toLocaleString()}) = ${(selectedCustomer.balance + totalAmt).toLocaleString()}, which exceeds the approved credit limit (${creditLimit.toLocaleString()}).
                    </p>
                  </div>
                </div>)}

              <div>
                <label className="font-semibold text-slate-700 block mb-2">Order Line Items & Inventory Allocation</label>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="sales" onRequestPO={(item, deficitQty) => {
                setAutoPOState({
                    isOpen: true,
                    item,
                    deficitQty,
                });
            }}/>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={handleCloseCreateModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  Confirm & Create Order
                </Button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Auto-PO Requisition Modal */}
      <AutoPOModal isOpen={autoPOState.isOpen} onClose={() => setAutoPOState({ isOpen: false })} shortageItem={autoPOState.item} requiredDeficitQty={autoPOState.deficitQty} sourceRef={`Sales Order Requisition`}/>

      {/* Sales Order Detail & Lifecycle Stepper Modal */}
      {selectedOrder && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-[#1F2E4A]">{selectedOrder.orderNumber}</h3>
                <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                  {selectedOrder.customer}
                </span>
                <StatusBadge status={selectedOrder.stage || 'Draft'}/>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Printer size={13}/>
                  Print Order
                </button>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <X size={18}/>
                </button>
              </div>
            </div>

            <div className="space-y-6 mt-4 overflow-y-auto pr-1 flex-1">
              {/* Lifecycle Stepper */}
              <DocumentTimeline steps={getOrderTimelineSteps(selectedOrder)}/>

              {/* Connected Docs Card */}
              <RelatedDocumentsCard documents={getOrderRelatedDocs(selectedOrder)}/>

              {/* Order Line Items Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Committed Line Items ({selectedOrder.items?.length || 0})
                </h4>
                <LineItemEditor items={selectedOrder.items || []} onChange={() => { }} readOnly={true}/>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 px-6 py-3">
              <div className="font-mono text-xs">
                Total Value: <span className="font-bold text-slate-900">{formatCurrency(selectedOrder.amount || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedOrder.stage === 'Draft' && (<Button onClick={() => { advanceStage(selectedOrder.id, 'Draft'); setSelectedOrder(null); }}>
                    Confirm Order
                  </Button>)}
                {selectedOrder.stage === 'Confirmed' && (<Button onClick={() => { advanceStage(selectedOrder.id, 'Confirmed'); setSelectedOrder(null); }}>
                    Issue Delivery Challan
                  </Button>)}
                {selectedOrder.stage === 'Delivered' && (<Button onClick={() => { advanceStage(selectedOrder.id, 'Delivered'); setSelectedOrder(null); }}>
                    Generate Sales Invoice
                  </Button>)}
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
};
