import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, ShoppingCart, CheckCircle, Truck, Receipt, X, ShieldAlert, Copy, Printer, DollarSign, Clock, CheckCircle2, Maximize2, Minimize2, FileSpreadsheet, Ban, Layers, SlidersHorizontal, Eye, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { DocumentTimeline } from '../../components/common/DocumentTimeline';
import { RelatedDocumentsCard } from '../../components/common/RelatedDocumentsCard';
import { AutoPOModal } from '../../components/common/AutoPOModal';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintSalesOrderModal } from '../../components/common/PrintSalesOrderModal';
import { PaymentReceiptModal } from '../../components/common/PaymentReceiptModal';
import { usePmsStore } from '../../stores/pmsStore';
import { CreateProjectModal } from '../pms/projects/components/CreateProjectModal';
const salesOrderGuide = {
    title: 'Sales Orders',
    subtitle: 'Customer purchase agreements driving warehouse reservation, proforma billing, and dispatch.',
    purpose: 'A Sales Order (SO) represents a legally confirmed customer commitment to purchase goods or services. Once confirmed, it can generate an optional Proforma Invoice for advance payment milestone collection, reserves inventory in the warehouse, triggers a Delivery Challan for dispatch, and subsequently issues a commercial Sales Invoice.',
    keyTerms: [
        { term: 'Sales Order (SO)', definition: 'A confirmed commercial agreement between your business and the customer before dispatch.' },
        { term: 'Proforma Invoice (Optional)', definition: 'A preliminary commercial offer/demand for payment issued before final tax invoicing to secure advance milestones without affecting AR/GL.' },
        { term: 'Credit Limit Guard', definition: 'An enterprise safety check that ensures a customer\'s current debt plus new order does not exceed their approved threshold.' },
        { term: 'Inventory Reservation', definition: 'Stock committed to this order so it cannot be double-sold to another customer.' },
        { term: 'SO Lifecycle', definition: 'The flexible progression: Draft → Confirmed → Proforma (Optional) → Delivered (Challan) → Invoiced (Settlement).' },
    ],
    tips: [
        'Use the 📋 Clone button on any past order to duplicate customer and line items in 1 click.',
        'Click "Generate Proforma" to create a non-accounting preliminary invoice with custom payment milestones for advance deposit collection.',
        'If stock is 0 or low, click [+PO] directly on the line item to requisition missing units immediately.',
    ],
    workflow: ['Quotation Approved', 'Sales Order Confirmed', 'Proforma Issued (Optional)', 'Delivery Challan Dispatched', 'Sales Invoice Issued', 'Payment Receipt Settled'],
};
export const SalesOrdersPage = () => {
    const navigate = useNavigate();
    const { salesOrders, customers, addSalesOrder, updateSalesOrderAllocation, updateSalesOrderStage, cancelSalesOrder, convertSalesOrderToInvoice, convertSalesOrderToChallan, addProformaInvoice, proformaInvoices = [], deliveryChallans, invoices, paymentIns, formatCurrency, formatDateDDMMYYYY, getCurrentISODate, addDaysISO } = useERP();
    const pmsProjects = usePmsStore((s) => s.projects || []);
    const [pmsModalOrder, setPmsModalOrder] = useState(null);
    const [stageFilter, setStageFilter] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [printSalesOrderTarget, setPrintSalesOrderTarget] = useState(null);
    const [cancelModalTarget, setCancelModalTarget] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
    const [deliveryDate, setDeliveryDate] = useState(() => addDaysISO(getCurrentISODate(), 10));
    const [lineItems, setLineItems] = useState([]);
    // Auto-PO Requisition Modal State
    const [autoPOState, setAutoPOState] = useState({ isOpen: false });
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
    const totalAmt = lineItems.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0);
    const creditLimit = selectedCustomer?.creditLimit || 50000;
    const isCreditExceeded = selectedCustomer ? (selectedCustomer.balance + totalAmt) > creditLimit : false;

    // Two sections: Invoice & Cash Receipt split
    const [totalSalesValueInput, setTotalSalesValueInput] = useState(0);
    const [formalInvoiceAmountInput, setFormalInvoiceAmountInput] = useState(0);
    const [cashAmountInput, setCashAmountInput] = useState(0);
    const [autoBalanceSplit, setAutoBalanceSplit] = useState(true);
    const [createInvoiceNow, setCreateInvoiceNow] = useState(true);
    const [invoiceStatusInput, setInvoiceStatusInput] = useState('Draft');
    const [invoiceDueDateInput, setInvoiceDueDateInput] = useState(() => addDaysISO(getCurrentISODate(), 30));
    const [createCashReceiptNow, setCreateCashReceiptNow] = useState(true);
    const [cashModeInput, setCashModeInput] = useState('Cash');
    const [cashRefInput, setCashRefInput] = useState('');
    const [activeReceipt, setActiveReceipt] = useState(null);

    // Allocation adjustment modal for existing Sales Order
    const [allocationModalOrder, setAllocationModalOrder] = useState(null);
    const [allocModalFormal, setAllocModalFormal] = useState(0);
    const [allocModalCash, setAllocModalCash] = useState(0);
    const [allocModalTotal, setAllocModalTotal] = useState(0);
    const [allocModalReason, setAllocModalReason] = useState('');
    const [allocSubmitting, setAllocSubmitting] = useState(false);
    const [allocErrorMessage, setAllocErrorMessage] = useState('');

    useEffect(() => {
        if (!showAddModal) return;
        const computed = lineItems.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0);
        const rounded = Math.round(computed * 100) / 100;
        setTotalSalesValueInput(rounded);
        if (rounded > 0 && formalInvoiceAmountInput === 0 && cashAmountInput === 0) {
            setFormalInvoiceAmountInput(rounded);
            setCashAmountInput(0);
        }
    }, [lineItems, showAddModal]);

    const handleInvoiceAmountChange = (val) => {
        const numVal = Number(val) || 0;
        setFormalInvoiceAmountInput(numVal);
        if (autoBalanceSplit) {
            const rem = Math.max(0, Math.round((totalSalesValueInput - numVal) * 100) / 100);
            setCashAmountInput(rem);
        }
    };

    const handleCashAmountChange = (val) => {
        const numVal = Number(val) || 0;
        setCashAmountInput(numVal);
        if (autoBalanceSplit) {
            const rem = Math.max(0, Math.round((totalSalesValueInput - numVal) * 100) / 100);
            setFormalInvoiceAmountInput(rem);
        }
    };

    const handleOpenAllocationModal = (order) => {
        const total = Number(order.totalSalesValue || order.amount || order.total || 0);
        const formal = Number(order.formalInvoiceAmount !== undefined ? order.formalInvoiceAmount : (order.invoice?.total ?? 0));
        const cash = Number(order.cashAmount !== undefined ? order.cashAmount : (order.cashReceipt?.amount ?? 0));

        setAllocationModalOrder(order);
        setAllocModalTotal(total);
        setAllocModalFormal(formal);
        setAllocModalCash(cash);
        setAllocModalReason('');
        setAllocErrorMessage('');
    };

    const handleSaveAllocation = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!allocationModalOrder) return;

        const formal = Math.round(Number(allocModalFormal) * 100) / 100;
        const cash = Math.round(Number(allocModalCash) * 100) / 100;
        const total = Math.round(Number(allocModalTotal) * 100) / 100;

        if (formal + cash > total + 0.01) {
            setAllocErrorMessage('Invoice + Cash Receipt cannot exceed Total Order Value.');
            return;
        }

        setAllocSubmitting(true);
        setAllocErrorMessage('');
        try {
            const updated = await updateSalesOrderAllocation(allocationModalOrder.id, {
                formalInvoiceAmount: formal,
                cashAmount: cash,
                totalSalesValue: total,
                reason: allocModalReason || 'Manual SO split allocation adjustment',
            });

            if (selectedOrder && selectedOrder.id === allocationModalOrder.id) {
                setSelectedOrder((prev) => ({
                    ...prev,
                    totalSalesValue: total,
                    formalInvoiceAmount: formal,
                    cashAmount: cash,
                }));
            }
            setAllocationModalOrder(null);
        } catch (err) {
            console.error('Failed to update sales order split:', err);
            setAllocErrorMessage(err.message || 'Failed to update allocation.');
        } finally {
            setAllocSubmitting(false);
        }
    };

    const handleOpenCreateModal = () => {
        setSelectedCustomerId(customers[0]?.id || '');
        setDeliveryDate(addDaysISO(getCurrentISODate(), 10));
        setLineItems([]);
        setTotalSalesValueInput(0);
        setFormalInvoiceAmountInput(0);
        setCashAmountInput(0);
        setAutoBalanceSplit(true);
        setCreateInvoiceNow(true);
        setInvoiceStatusInput('Draft');
        setInvoiceDueDateInput(addDaysISO(getCurrentISODate(), 30));
        setCreateCashReceiptNow(true);
        setCashModeInput('Cash');
        setCashRefInput(`CASH-${Date.now().toString().slice(-4)}`);
        setIsFullscreen(false);
        setShowAddModal(true);
    };

    const handleCloseCreateModal = () => {
        setShowAddModal(false);
        setSelectedCustomerId(customers[0]?.id || '');
        setDeliveryDate(addDaysISO(getCurrentISODate(), 10));
        setLineItems([]);
        setIsFullscreen(false);
    };

    const handleCloneOrder = (order) => {
        setSelectedCustomerId(order.customerId || customers[0]?.id || '');
        setDeliveryDate(order.deliveryDate || addDaysISO(getCurrentISODate(), 10));
        setLineItems((order.items || []).map((it) => ({
            ...it,
            id: `li-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        })));
        setFormalInvoiceAmountInput(order.formalInvoiceAmount || 0);
        setCashAmountInput(order.cashAmount || 0);
        setIsFullscreen(false);
        setShowAddModal(true);
    };
    const handleCreate = (e) => {
        e.preventDefault();
        const cust = selectedCustomer || customers[0];
        const effectiveOrderAmt = totalAmt > 0 ? totalAmt : (Number(totalSalesValueInput) || 0);

        if (formalInvoiceAmountInput + cashAmountInput > effectiveOrderAmt + 0.01) {
            alert('Formal Invoice + Cash Receipt amount cannot exceed Total Order Value.');
            return;
        }

        addSalesOrder({
            customerId: cust?.id,
            customer: cust?.name || 'Walk-in Customer',
            amount: effectiveOrderAmt,
            totalSalesValue: effectiveOrderAmt,
            formalInvoiceAmount: formalInvoiceAmountInput,
            cashAmount: cashAmountInput,
            createInvoiceNow: createInvoiceNow && formalInvoiceAmountInput > 0,
            createCashReceiptNow: createCashReceiptNow && cashAmountInput > 0,
            invoiceStatus: invoiceStatusInput,
            invoiceDueDate: invoiceDueDateInput,
            cashMode: cashModeInput,
            cashRef: cashRefInput || `CASH-${Date.now().toString().slice(-4)}`,
            deliveryDate: deliveryDate || addDaysISO(getCurrentISODate(), 10),
            stage: 'Draft',
            status: 'Draft',
            paymentStatus: cashAmountInput >= effectiveOrderAmt ? 'Paid' : (cashAmountInput > 0 ? 'Partial' : 'Unpaid'),
            items: lineItems,
        });
        handleCloseCreateModal();
    };
    const advanceStage = (orderId, currentStage) => {
        if (currentStage === 'Draft') {
            updateSalesOrderStage(orderId, 'Confirmed');
        }
        else if (currentStage === 'Confirmed' || currentStage === 'Partially Dispatched') {
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
    const handleGenerateProforma = (order) => {
        const cust = customers.find((c) => c.id === order.customerId || c.name === order.customer) || customers[0];
        const nextId = (proformaInvoices.length + 101);
        const piNumber = `PI-2026-${String(nextId).padStart(3, '0')}`;
        
        const rawItems = (order.items && order.items.length > 0) ? order.items.map((it, idx) => ({
            id: `pi-it-${Date.now()}-${idx}`,
            itemId: it.id || it.itemId || `item-${idx}`,
            productName: it.description || it.productName || it.name || 'Industrial Machine Equipment',
            productCode: it.productCode || it.sku || `SKU-SO-${idx + 1}`,
            description: it.description || 'Pre-dispatch proforma billing unit',
            qty: it.qty || 1,
            unit: it.unit || 'pcs',
            unitPrice: it.rate || it.unitPrice || it.amount || 10000,
            discountPercent: it.discountPercent || 0,
            discountAmount: it.discountAmount || 0,
            taxRate: it.taxRate || 18,
            taxAmount: (it.qty || 1) * (it.rate || it.unitPrice || 10000) * ((it.taxRate || 18) / 100),
            lineTotal: ((it.qty || 1) * (it.rate || it.unitPrice || 10000)) * (1 + ((it.taxRate || 18) / 100)),
            isMachine: it.isMachine ?? true,
            warrantyStatus: 'Pending Final Invoicing / Commissioning',
        })) : [
            {
                id: `pi-it-${Date.now()}-1`,
                itemId: 'item-mach-01',
                productName: 'CNC High-Precision Milling Machine X500',
                productCode: 'CNC-M-500',
                description: 'Industrial 5-axis vertical machining center',
                qty: 1,
                unit: 'set',
                unitPrice: order.amount || 450000,
                discountPercent: 0,
                discountAmount: 0,
                taxRate: 18,
                taxAmount: (order.amount || 450000) * 0.18,
                lineTotal: (order.amount || 450000) * 1.18,
                isMachine: true,
                warrantyStatus: 'Pending Final Invoicing / Commissioning',
            }
        ];

        const subtotal = rawItems.reduce((sum, it) => sum + (it.qty * (it.unitPrice || 0)), 0);
        const taxTotal = rawItems.reduce((sum, it) => sum + (it.taxAmount || 0), 0);
        const grandTotal = subtotal + taxTotal;

        const newPi = {
            id: `pi-${Date.now()}`,
            piNumber,
            piDate: new Date().toISOString().split('T')[0],
            customerId: cust?.id || order.customerId,
            customer: cust?.name || order.customer,
            customerContact: cust?.contactPerson || 'Procurement Lead',
            billingAddress: cust?.billingAddress || cust?.address || 'Industrial Area Phase 2, New Delhi, 110020',
            shippingAddress: cust?.shippingAddress || cust?.address || 'Plant 4, Industrial Zone, Gurgaon, HR',
            referenceSo: order.orderNumber,
            salesOrderId: order.id,
            paymentPreset: '50-40-10',
            paymentTerms: '50% Advance • 40% Before Dispatch • 10% Post-Delivery',
            paymentSchedule: [
                { milestone: 'Advance Booking Deposit', pct: 50, amount: grandTotal * 0.5, due: 'Order Confirmation / Proforma Acceptance' },
                { milestone: 'Before Warehouse Dispatch', pct: 40, amount: grandTotal * 0.4, due: 'Readiness Inspection' },
                { milestone: 'Post-Delivery / Final Invoice', pct: 10, amount: grandTotal * 0.1, due: 'Final Tax Invoicing & Commissioning' },
            ],
            notes: `Commercial Proforma issued for Sales Order ${order.orderNumber}. Non-negotiable price validity 30 days.`,
            termsAndConditions: '1. This Proforma Invoice is a commercial quotation and agreement document only. It does not constitute a legal Tax Invoice and creates no direct Accounting / AR liability.\n2. Machine warranties and service guarantees will commence strictly upon issuance of the Final Tax Invoice and successful site commissioning.',
            status: 'Draft',
            items: rawItems,
            subtotal,
            discountTotal: 0,
            taxTotal,
            grandTotal,
            total: grandTotal,
            createdAt: new Date().toISOString(),
        };

        addProformaInvoice(newPi);
        navigate('/sales/proforma');
    };

    const getOrderTimelineSteps = (order) => {
        const isQuoteLinked = !!order.quotationNumber;
        const isConfirmed = order.stage !== 'Draft';
        const linkedPi = proformaInvoices.find((p) => p.referenceSo === order.orderNumber || p.salesOrderId === order.id);
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
                label: 'Proforma (Optional)',
                docNumber: linkedPi?.piNumber || 'Advance Milestone',
                status: linkedPi ? 'completed' : isConfirmed ? 'current' : 'pending',
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
        const relatedPis = proformaInvoices.filter((p) => p.referenceSo === order.orderNumber || p.salesOrderId === order.id);
        relatedPis.forEach((pi) => {
            docs.push({
                type: 'Proforma Invoice',
                number: pi.piNumber,
                amount: pi.grandTotal || pi.total,
                date: pi.piDate,
                status: pi.status,
            });
        });
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
            width: '14%',
            render: (o) => {
                const linkedPms = pmsProjects.find((p) => p.crmOrderId === o.orderNumber);
                return (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setSelectedOrder(o)} className="font-mono font-bold text-primary hover:underline flex items-center gap-1.5 text-left cursor-pointer whitespace-nowrap">
                      <ShoppingCart size={13} className="text-muted"/> {o.orderNumber}
                    </button>
                    {linkedPms && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/pms/projects/${linkedPms.id}`); }}
                        className="font-mono text-[10px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit cursor-pointer transition-colors"
                        title={`View linked PMS Project ${linkedPms.code} (${linkedPms.status || 'Active'})`}
                      >
                        <Layers size={10} /> {linkedPms.code} ({linkedPms.overallCompletionPct ?? 0}%)
                      </button>
                    )}
                  </div>
                );
            },
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
            header: 'Order Value & Split',
            align: 'right',
            width: '15%',
            render: (o) => {
                const total = o.amount ?? o.total ?? 0;
                const formal = o.formalInvoiceAmount !== undefined ? o.formalInvoiceAmount : (o.invoice?.total ?? null);
                const cash = o.cashAmount !== undefined ? o.cashAmount : (o.cashReceipt?.amount ?? null);
                return (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(total)}
                    </span>
                    {(formal !== null || cash !== null) && (
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        {formal !== null && Number(formal) > 0 && (
                          <span className="text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200" title="Formal Tax Invoice">
                            Inv: {formatCurrency(formal)}
                          </span>
                        )}
                        {cash !== null && Number(cash) > 0 && (
                          <span className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200" title="Cash Receipt">
                            Cash: {formatCurrency(cash)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
            },
        },
        {
            key: 'stage',
            header: 'Stage Lifecycle',
            align: 'center',
            width: '14%',
            render: (o) => {
                const stageVal = o.stage || o.status || 'Draft';
                return (
                  <div className="flex items-center justify-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      stageVal === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      stageVal === 'Partially Dispatched' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      stageVal === 'Confirmed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      stageVal === 'Invoiced' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {stageVal}
                    </span>
                  </div>
                );
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
                const isCancelled = o.stage === 'Cancelled' || o.status === 'Cancelled';
                return (<div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button onClick={() => setSelectedOrder(o)} className="p-1 text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors" title="View Sales Order Details & Allocation Split">
              <Eye size={13}/>
            </button>
            {!isCancelled && (
              <button onClick={() => handleOpenAllocationModal(o)} className="p-1 text-muted hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors" title="Adjust Order Split Allocation (Formal vs Cash)">
                <SlidersHorizontal size={13}/>
              </button>
            )}
            <button onClick={() => setPrintSalesOrderTarget(o)} className="p-1 text-muted hover:text-primary hover:bg-soft rounded-lg cursor-pointer transition-colors" title="Print Official Sales Order Confirmation">
              <Printer size={13}/>
            </button>
            <button onClick={() => handleCloneOrder(o)} className="p-1 text-muted hover:text-primary hover:bg-soft rounded-lg cursor-pointer transition-colors" title="Clone / Duplicate this Sales Order">
              <Copy size={13}/>
            </button>
            {!isCancelled && (
              <button onClick={() => handleGenerateProforma(o)} className="p-1 text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors" title="Generate Proforma Invoice for advance payment milestone collection">
                <FileSpreadsheet size={13}/>
              </button>
            )}

            {o.stage === 'Draft' && (<button onClick={() => advanceStage(o.id, 'Draft')} className="px-2.5 py-1 bg-primary text-white rounded-md text-xs font-semibold hover:bg-primary-hover cursor-pointer shadow-xs transition-colors whitespace-nowrap inline-flex items-center gap-1">
                Confirm Order
              </button>)}
            {o.stage === 'Confirmed' && (<>
                {!pmsProjects.some((p) => p.crmOrderId === o.orderNumber) && (
                  <button
                    onClick={() => setPmsModalOrder(o.orderNumber)}
                    className="px-2 py-1 bg-violet-600 text-white rounded-md text-xs font-semibold hover:bg-violet-700 cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors whitespace-nowrap"
                    title="Convert this Confirmed Sales Order into a PMS Production Project"
                  >
                    <Layers size={12}/> PMS Project
                  </button>
                )}
                <button onClick={() => advanceStage(o.id, 'Confirmed')} className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors whitespace-nowrap">
                  <Truck size={12}/> Issue Challan
                </button>
              </>)}
            {(o.stage === 'Delivered' || o.stage === 'Dispatched') && (<button onClick={() => advanceStage(o.id, 'Delivered')} className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors whitespace-nowrap">
                <Receipt size={12}/> Invoice
              </button>)}
            {o.stage === 'Invoiced' && (<span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 whitespace-nowrap">
                <CheckCircle size={12}/> Fulfilled
              </span>)}
            {isCancelled && (<span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1 whitespace-nowrap">
                <Ban size={12}/> Cancelled
              </span>)}
            {!isCancelled && o.stage !== 'Invoiced' && (
              <button
                onClick={() => setCancelModalTarget(o)}
                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                title="Cancel Sales Order"
              >
                <Ban size={13}/>
              </button>
            )}
          </div>);
            },
        },
    ];
    const totalSoValue = salesOrders.filter(o => o.stage !== 'Cancelled').reduce((acc, o) => acc + (o.amount ?? o.total ?? 0), 0);
    const confirmedValue = salesOrders.filter(o => o.stage === 'Confirmed' || o.stage === 'Delivered').reduce((acc, o) => acc + (o.amount ?? o.total ?? 0), 0);
    const openOrdersCount = salesOrders.filter(o => o.stage !== 'Invoiced' && o.stage !== 'Cancelled').length;
    const fulfilledOrdersCount = salesOrders.filter(o => o.stage === 'Invoiced').length;

    return (<div className="space-y-6">
      <PageHeader title="Sales Orders" subtitle="Confirmed customer purchase agreements driving warehouse stock reservation, dispatch manifests, and automated invoicing." guide={salesOrderGuide} actions={<Button icon={Plus} onClick={handleOpenCreateModal}>
            Create Sales Order
          </Button>}/>

      {/* Sales Orders KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Booked Pipeline" value={formatCurrency(totalSoValue)} icon={DollarSign} />
        <StatCard label="Active In-Fulfillment" value={formatCurrency(confirmedValue)} icon={Truck} trend={{ positive: true, text: `${openOrdersCount} orders active` }} highlight={openOrdersCount > 0} />
        <StatCard label="Open Backlog Orders" value={`${openOrdersCount} Orders`} icon={Clock} subtext="Pending warehouse dispatch" />
        <StatCard label="Invoiced & Fulfilled" value={`${fulfilledOrdersCount} Completed`} icon={CheckCircle2} trend={{ positive: true, text: 'Invoices created' }} />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-nowrap items-center gap-2 border-b border-[#CED4DA] pb-2 text-xs overflow-x-auto lg:overflow-visible whitespace-nowrap lg:whitespace-normal scrollbar-none">
        {['All', 'Draft', 'Confirmed', 'Delivered', 'Invoiced', 'Cancelled'].map((stg) => (<button key={stg} onClick={() => setStageFilter(stg)} className={`shrink-0 lg:shrink px-3 py-1.5 rounded-t font-semibold transition-colors ${stageFilter === stg
                ? 'bg-white border-t-2 border-[#1F2E4A] text-[#1F2E4A] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'}`}>
            {stg}
          </button>))}
      </div>

      <DataTable title="Sales Order Register" data={filteredOrders} columns={columns} keyExtractor={(o) => o.id} searchPlaceholder="Search order number or customer..."/>

      {/* Create Modal */}
      {showAddModal && (
        <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
          <div className={`bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isFullscreen ? 'w-full h-full rounded-none p-4 sm:p-8' : 'max-w-5xl w-full rounded-2xl p-4 sm:p-6 max-h-[92vh]'
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
                  <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"/>
                </div>
              </div>

              {/* Enterprise Credit Limit Guard */}
              {isCreditExceeded && selectedCustomer && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs">
                  <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5"/>
                  <div className="space-y-0.5">
                    <p className="font-bold">Credit Limit Guard Warning</p>
                    <p className="text-[11px] text-rose-700">
                      Customer current outstanding ({formatCurrency(selectedCustomer.balance)}) + this order ({formatCurrency(totalAmt)}) = {formatCurrency(selectedCustomer.balance + totalAmt)}, which exceeds the approved credit limit ({formatCurrency(creditLimit)}).
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

              {/* TWO SECTIONS: FORMAL INVOICE & CASH RECEIPT ALLOCATION */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                {/* Header with Title & Live Balance Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-slate-800 text-sm">
                        Order Split Allocation: Formal Invoice & Cash Receipt
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Manually decide how much amount is allocated to the formal tax invoice and how much into cash receipt.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoBalanceSplit}
                        onChange={(e) => setAutoBalanceSplit(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <span>Auto-balance amounts</span>
                    </label>
                  </div>
                </div>

                {/* Quick Split Preset Buttons & Balance Bar */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="text-slate-500">Total Order Value: </span>
                      <strong className="font-mono text-slate-900 font-bold">{formatCurrency(totalAmt)}</strong>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => { setFormalInvoiceAmountInput(totalAmt); setCashAmountInput(0); }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                      >
                        100% Invoice
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFormalInvoiceAmountInput(0); setCashAmountInput(totalAmt); }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 cursor-pointer"
                      >
                        100% Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const f = Math.round(totalAmt * 0.7 * 100) / 100;
                          setFormalInvoiceAmountInput(f);
                          setCashAmountInput(Math.round((totalAmt - f) * 100) / 100);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                      >
                        70% / 30%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const f = Math.round(totalAmt * 0.5 * 100) / 100;
                          setFormalInvoiceAmountInput(f);
                          setCashAmountInput(Math.round((totalAmt - f) * 100) / 100);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                      >
                        50% / 50%
                      </button>
                    </div>
                  </div>

                  {/* Balance Status indicator */}
                  {(() => {
                    const sum = Math.round((Number(formalInvoiceAmountInput) + Number(cashAmountInput)) * 100) / 100;
                    const diff = Math.round((Number(totalAmt) - sum) * 100) / 100;
                    if (diff < -0.01) {
                      return (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] font-mono flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1"><ShieldAlert size={13}/> Over-allocated!</span>
                          <span>Sum ({formatCurrency(sum)}) exceeds Order Value by {formatCurrency(Math.abs(diff))}</span>
                        </div>
                      );
                    }
                    if (Math.abs(diff) < 0.01 && totalAmt > 0) {
                      return (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] font-mono flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1"><CheckCircle2 size={13}/> 100% Balanced</span>
                          <span>Invoice {formatCurrency(formalInvoiceAmountInput)} + Cash {formatCurrency(cashAmountInput)} = {formatCurrency(totalAmt)}</span>
                        </div>
                      );
                    }
                    return (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] font-mono flex items-center justify-between">
                        <span className="font-semibold">Unallocated Order Value:</span>
                        <span className="font-bold">{formatCurrency(diff)} remaining</span>
                      </div>
                    );
                  })()}
                </div>

                {/* THE TWO SECTIONS: SIDE BY SIDE IN GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SECTION 1: FORMAL TAX INVOICE */}
                  <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          <Receipt size={16}/>
                        </div>
                        <div>
                          <h5 className="font-bold text-blue-950 text-xs">Section 1: Formal Invoice</h5>
                          <span className="text-[10px] text-blue-600 font-semibold">Tax Billing & Accounts Receivable</span>
                        </div>
                      </div>
                      <label className="text-[11px] font-bold text-blue-900 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createInvoiceNow}
                          onChange={(e) => setCreateInvoiceNow(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>Create Invoice</span>
                      </label>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-slate-700 text-xs">Invoice Amount (₹) *</label>
                        <span className="text-[10px] text-slate-400 font-medium">Billed with GST</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formalInvoiceAmountInput}
                          onChange={(e) => handleInvoiceAmountChange(e.target.value)}
                          className="w-full p-2 border border-blue-300 rounded-lg bg-blue-50/30 text-blue-950 font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 font-mono">
                          {totalAmt > 0 ? `${Math.round((formalInvoiceAmountInput / totalAmt) * 100)}%` : '0%'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Invoice Status</label>
                        <select
                          value={invoiceStatusInput}
                          onChange={(e) => setInvoiceStatusInput(e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs"
                        >
                          <option value="Draft">Draft (Editable)</option>
                          <option value="Finalized">Finalized (Post AR)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Due Date</label>
                        <input
                          type="date"
                          value={invoiceDueDateInput}
                          onChange={(e) => setInvoiceDueDateInput(e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      * Generates an official Tax Invoice linked to this SO with proportional item rates.
                    </p>
                  </div>

                  {/* SECTION 2: CASH RECEIPT */}
                  <div className="bg-white p-4 rounded-xl border-2 border-amber-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                          <DollarSign size={16}/>
                        </div>
                        <div>
                          <h5 className="font-bold text-amber-950 text-xs">Section 2: Cash Receipt</h5>
                          <span className="text-[10px] text-amber-600 font-semibold">Without-Bill / Cash Collection</span>
                        </div>
                      </div>
                      <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createCashReceiptNow}
                          onChange={(e) => setCreateCashReceiptNow(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                        />
                        <span>Record Receipt</span>
                      </label>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-slate-700 text-xs">Cash Receipt Amount (₹) *</label>
                        <span className="text-[10px] text-slate-400 font-medium">Unbilled Cash</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={cashAmountInput}
                          onChange={(e) => handleCashAmountChange(e.target.value)}
                          className="w-full p-2 border border-amber-300 rounded-lg bg-amber-50/30 text-amber-950 font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 font-mono">
                          {totalAmt > 0 ? `${Math.round((cashAmountInput / totalAmt) * 100)}%` : '0%'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Payment Mode</label>
                        <select
                          value={cashModeInput}
                          onChange={(e) => setCashModeInput(e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs"
                        >
                          <option value="Cash">Cash In Hand</option>
                          <option value="Bank">Bank Transfer</option>
                          <option value="UPI">UPI</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Reference / Voucher #</label>
                        <input
                          type="text"
                          value={cashRefInput}
                          onChange={(e) => setCashRefInput(e.target.value)}
                          placeholder="CASH-SO-..."
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-800 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      * Issues a Cash Receipt voucher and immediately credits customer ledger balance.
                    </p>
                  </div>
                </div>
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
      {selectedOrder && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-4 sm:p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 pb-3 border-b border-slate-200">
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-3 min-w-0 lg:min-w-auto">
                <h3 className="font-bold text-lg text-[#1F2E4A]">{selectedOrder.orderNumber}</h3>
                <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                  {selectedOrder.customer}
                </span>
                <StatusBadge status={selectedOrder.stage || 'Draft'}/>
              </div>
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintSalesOrderTarget(selectedOrder)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={13}/>
                  Print Official Order
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

              {/* TWO SECTIONS: FORMAL INVOICE & CASH RECEIPT SUMMARY */}
              {(() => {
                const totalOrderVal = Number(selectedOrder.totalSalesValue || selectedOrder.amount || selectedOrder.total || 0);
                const formalAmt = Number(selectedOrder.formalInvoiceAmount !== undefined ? selectedOrder.formalInvoiceAmount : (selectedOrder.invoice?.total ?? 0));
                const cashAmt = Number(selectedOrder.cashAmount !== undefined ? selectedOrder.cashAmount : (selectedOrder.cashReceipt?.amount ?? 0));
                const linkedInv = invoices.find((i) => i.salesOrderId === selectedOrder.id || i.linkedSo === selectedOrder.orderNumber || (selectedOrder.invoiceId && i.id === selectedOrder.invoiceId));
                const linkedPmt = paymentIns.find((p) => p.salesOrderId === selectedOrder.id || p.salesOrderNumber === selectedOrder.orderNumber || (selectedOrder.cashReceiptId && p.id === selectedOrder.cashReceiptId));
                const totalAlloc = Math.round((formalAmt + cashAmt) * 100) / 100;
                const unalloc = Math.max(0, Math.round((totalOrderVal - totalAlloc) * 100) / 100);

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                          Order Split Allocation & Financial Breakdown
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedOrder.stage !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAllocationModal(selectedOrder)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <SlidersHorizontal size={12}/> Adjust Split
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Breakdown KPI Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block truncate">Total Order Value</span>
                        <strong className="font-mono text-slate-900 text-xs block font-bold">{formatCurrency(totalOrderVal)}</strong>
                        <span className="text-[9px] text-slate-400 block">Gross Committed</span>
                      </div>
                      <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200">
                        <span className="text-[10px] text-blue-800 uppercase font-semibold block truncate">Formal Invoice</span>
                        <strong className="font-mono text-blue-900 text-xs block font-bold">{formatCurrency(formalAmt)}</strong>
                        <span className="text-[9px] text-blue-700 block">
                          {totalOrderVal > 0 ? `${Math.round((formalAmt / totalOrderVal) * 100)}% Billed` : '0%'}
                        </span>
                      </div>
                      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-800 uppercase font-semibold block truncate">Cash Receipt</span>
                        <strong className="font-mono text-amber-900 text-xs block font-bold">{formatCurrency(cashAmt)}</strong>
                        <span className="text-[9px] text-amber-700 block">
                          {totalOrderVal > 0 ? `${Math.round((cashAmt / totalOrderVal) * 100)}% Cash` : '0%'}
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${unalloc > 0.01 ? 'bg-slate-100 border-slate-300' : 'bg-emerald-50 border-emerald-200'}`}>
                        <span className={`text-[10px] uppercase font-semibold block truncate ${unalloc > 0.01 ? 'text-slate-600' : 'text-emerald-700'}`}>
                          {unalloc > 0.01 ? 'Unallocated' : 'Allocation Status'}
                        </span>
                        <strong className={`font-mono text-xs block font-bold ${unalloc > 0.01 ? 'text-slate-700' : 'text-emerald-800'}`}>
                          {unalloc > 0.01 ? formatCurrency(unalloc) : '100% Balanced'}
                        </strong>
                        <span className="text-[9px] block text-slate-500">
                          {unalloc > 0.01 ? 'Remaining to split' : 'Formal + Cash = Total'}
                        </span>
                      </div>
                    </div>

                    {/* TWO SECTION CARDS: FORMAL INVOICE & CASH RECEIPT */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Section 1 Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-2">
                        <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-blue-600"/>
                            <span className="font-bold text-xs text-blue-900">Section 1: Formal Tax Invoice</span>
                          </div>
                          {linkedInv && <StatusBadge status={linkedInv.status || 'Draft'}/>}
                        </div>

                        {linkedInv ? (
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Invoice Number:</span>
                              <strong className="font-mono text-blue-700 font-bold">{linkedInv.invoiceNumber}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Invoice Amount:</span>
                              <span className="font-mono font-bold text-slate-800">{formatCurrency(linkedInv.total)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Invoice Due / Balance:</span>
                              <span className={`font-mono font-bold ${(linkedInv.balanceDue ?? linkedInv.total) > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatCurrency(linkedInv.balanceDue ?? linkedInv.total)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(null);
                                navigate('/sales/invoices');
                              }}
                              className="w-full mt-2 py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <ExternalLink size={11}/> View Formal Invoice in Register
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 py-1">
                            <p className="text-[11px] text-slate-500">
                              Allocated Amount: <strong className="font-mono text-slate-800">{formatCurrency(formalAmt)}</strong>
                              <span className="block text-[10px] text-slate-400">Formal invoice has not yet been generated for this order.</span>
                            </p>
                            {formalAmt > 0 && selectedOrder.stage !== 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => {
                                  convertSalesOrderToInvoice(selectedOrder.id);
                                  setSelectedOrder(null);
                                  navigate('/sales/invoices');
                                }}
                                className="w-full py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Receipt size={12}/> Generate Formal Invoice ({formatCurrency(formalAmt)})
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Section 2 Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between border-b border-amber-50 pb-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-amber-600"/>
                            <span className="font-bold text-xs text-amber-900">Section 2: Cash Receipt</span>
                          </div>
                          {linkedPmt && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Settled
                            </span>
                          )}
                        </div>

                        {linkedPmt ? (
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Voucher / Receipt #:</span>
                              <strong className="font-mono text-amber-800 font-bold">{linkedPmt.receiptNumber || linkedPmt.paymentNumber}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Receipt Amount:</span>
                              <span className="font-mono font-bold text-emerald-700">{formatCurrency(linkedPmt.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Mode & Ref:</span>
                              <span className="text-slate-700 font-mono text-[11px]">
                                {linkedPmt.mode || 'Cash'} • {linkedPmt.reference || linkedPmt.referenceNumber || 'Cash'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReceipt({
                                  receiptNumber: linkedPmt.receiptNumber || linkedPmt.paymentNumber || `RCPT-${Date.now().toString().slice(-4)}`,
                                  invoiceNumber: selectedOrder.orderNumber,
                                  customer: selectedOrder.customer,
                                  amount: linkedPmt.amount,
                                  date: formatDateDDMMYYYY(linkedPmt.date || 'Today'),
                                  paymentMode: linkedPmt.mode || 'Cash',
                                  reference: linkedPmt.reference || linkedPmt.referenceNumber || `CASH-${selectedOrder.orderNumber}`,
                                });
                              }}
                              className="w-full mt-2 py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Printer size={11}/> Print / View Cash Receipt Voucher
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 py-1">
                            <p className="text-[11px] text-slate-500">
                              Allocated Amount: <strong className="font-mono text-slate-800">{formatCurrency(cashAmt)}</strong>
                              <span className="block text-[10px] text-slate-400">Cash receipt has not yet been collected for this order.</span>
                            </p>
                            {cashAmt > 0 && selectedOrder.stage !== 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cust = customers.find((c) => c.id === selectedOrder.customerId || c.name === selectedOrder.customer) || customers[0];
                                  addPaymentIn({
                                    customerId: cust?.id,
                                    customer: cust?.name || selectedOrder.customer,
                                    amount: cashAmt,
                                    mode: 'Cash',
                                    paymentType: 'WITHOUT_BILL',
                                    salesOrderId: selectedOrder.id,
                                    salesOrderNumber: selectedOrder.orderNumber,
                                    reference: `CASH-${selectedOrder.orderNumber}`,
                                    notes: `Cash receipt allocated with Sales Order ${selectedOrder.orderNumber}`,
                                  });
                                }}
                                className="w-full py-1 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                              >
                                <DollarSign size={12}/> Record Cash Receipt ({formatCurrency(cashAmt)})
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Order Line Items Table */}
              <div className="space-y-3">
                <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                    Committed Line Items & Fulfillment Status ({selectedOrder.items?.length || 0})
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    Stage: <strong className="text-slate-800">{selectedOrder.stage || 'Draft'}</strong>
                  </span>
                </div>

                {/* Line Fulfillment Progress Summary Table */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full min-w-[640px] lg:min-w-0 text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200 text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Item / Description</th>
                          <th className="py-2 px-3 text-center">Ordered</th>
                          <th className="py-2 px-3 text-center">Delivered</th>
                          <th className="py-2 px-3 text-center">Invoiced</th>
                          <th className="py-2 px-3 text-center">Remaining to Deliver</th>
                          <th className="py-2 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedOrder.items.map((it, idx) => {
                          const ordered = Number(it.orderedQty ?? it.qty ?? 1);
                          const delivered = Number(it.deliveredQty ?? 0);
                          const invoiced = Number(it.invoicedQty ?? 0);
                          const remaining = Math.max(0, ordered - delivered);
                          return (
                            <tr key={it.id || idx}>
                              <td className="py-2 px-3 font-semibold text-slate-800">
                                {it.description || it.name}
                                {it.sku && <span className="text-[10px] text-slate-400 font-mono block">SKU: {it.sku}</span>}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold">{ordered}</td>
                              <td className="py-2 px-3 text-center font-mono text-blue-600 font-bold">{delivered}</td>
                              <td className="py-2 px-3 text-center font-mono text-purple-600 font-bold">{invoiced}</td>
                              <td className="py-2 px-3 text-center font-mono">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  remaining === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                                }`}>
                                  {remaining}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                {formatCurrency(it.amount ?? (ordered * Number(it.rate || 0)))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Address Snapshot Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px] text-muted block">Billed To (Snapshot)</span>
                    <p className="font-semibold text-slate-800">{selectedOrder.customer}</p>
                    <p className="text-slate-600">{selectedOrder.billingAddress?.line1 || 'Main Facility'}</p>
                    <p className="text-slate-600">{selectedOrder.billingAddress?.city || 'Mumbai'}, {selectedOrder.billingAddress?.state || 'Maharashtra'} {selectedOrder.billingAddress?.pincode}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px] text-muted block">Shipped To (Snapshot)</span>
                    <p className="font-semibold text-slate-800">{selectedOrder.customer}</p>
                    <p className="text-slate-600">{selectedOrder.shippingAddress?.line1 || selectedOrder.billingAddress?.line1 || 'Destination Facility'}</p>
                    <p className="text-slate-600">{selectedOrder.shippingAddress?.city || selectedOrder.billingAddress?.city || 'Mumbai'}, {selectedOrder.shippingAddress?.state || selectedOrder.billingAddress?.state || 'Maharashtra'} {selectedOrder.shippingAddress?.pincode}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 pt-4 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 px-4 sm:-mx-6 sm:-mb-6 sm:px-6 py-3">
              <div className="font-mono text-xs">
                Total Value: <span className="font-bold text-slate-900">{formatCurrency(selectedOrder.amount || 0)}</span>
              </div>
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                {selectedOrder.stage !== 'Cancelled' && (
                  <>
                    <Button variant="outline" onClick={() => { handleGenerateProforma(selectedOrder); setSelectedOrder(null); }}>
                      <FileSpreadsheet size={13} className="mr-1 text-blue-600"/> Generate Proforma
                    </Button>
                    {selectedOrder.stage === 'Draft' && (<Button onClick={() => { advanceStage(selectedOrder.id, 'Draft'); setSelectedOrder(null); }}>
                        Confirm Order
                      </Button>)}
                    {(selectedOrder.stage === 'Confirmed' || selectedOrder.stage === 'Partially Dispatched') && (<Button onClick={() => { advanceStage(selectedOrder.id, selectedOrder.stage); setSelectedOrder(null); }}>
                        {selectedOrder.stage === 'Partially Dispatched' ? 'Dispatch Remaining' : 'Issue Delivery Challan'}
                      </Button>)}
                    {(selectedOrder.stage === 'Delivered' || selectedOrder.stage === 'Dispatched' || selectedOrder.stage === 'Partially Dispatched') && (<Button variant="outline" onClick={() => { convertSalesOrderToInvoice(selectedOrder.id); setSelectedOrder(null); navigate('/sales/invoices'); }}>
                        Generate Sales Invoice
                      </Button>)}
                    <button
                      type="button"
                      onClick={() => handleOpenAllocationModal(selectedOrder)}
                      className="px-3 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <SlidersHorizontal size={12}/> Adjust Split
                    </button>
                    <button
                      onClick={() => {
                        const target = selectedOrder;
                        setSelectedOrder(null);
                        setCancelModalTarget(target);
                      }}
                      className="px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Ban size={12}/> Cancel Order
                    </button>
                  </>
                )}
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>)}

      {/* Cancel Confirmation Modal */}
      {cancelModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-4 sm:p-6 text-xs flex flex-col max-h-[95vh] overflow-y-auto">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <ShieldAlert className="w-5 h-5 text-rose-600"/>
              <h3 className="font-bold text-base text-[#1F2E4A]">Cancel Sales Order {cancelModalTarget.orderNumber}?</h3>
            </div>

            <div className="py-4 space-y-2 text-slate-600">
              <p className="font-semibold text-slate-800">This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Release inventory reservation for this order</li>
                <li>Prevent any new Delivery Challans or Invoices from being generated</li>
                <li>Mark order as <strong className="text-rose-600">Cancelled</strong></li>
                <li>Preserve previous document history</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="outline" onClick={() => setCancelModalTarget(null)}>
                Keep Order
              </Button>
              <button
                type="button"
                onClick={() => {
                  cancelSalesOrder(cancelModalTarget.id);
                  setCancelModalTarget(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Commercial Sales Order Confirmation PDF Voucher */}
      <PrintSalesOrderModal
        isOpen={Boolean(printSalesOrderTarget)}
        onClose={() => setPrintSalesOrderTarget(null)}
        order={printSalesOrderTarget}
      />

      {/* Connect with PMS: Create Production Project */}
      <CreateProjectModal
        isOpen={Boolean(pmsModalOrder)}
        initialOrderNumber={pmsModalOrder || ''}
        onClose={() => setPmsModalOrder(null)}
        onCreated={(id) => {
          setPmsModalOrder(null);
          navigate(`/pms/projects/${id}`);
        }}
      />

      {/* ADJUST SALES ORDER ALLOCATION SPLIT MODAL */}
      {allocationModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-6 text-xs flex flex-col max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-600"/>
                <div>
                  <h3 className="font-bold text-base text-[#1F2E4A]">Adjust Order Split Allocation</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {allocationModalOrder.orderNumber} • {allocationModalOrder.customer}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setAllocationModalOrder(null); setAllocErrorMessage(''); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleSaveAllocation} className="py-4 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Layers size={15} className="text-blue-600"/>
                  <span>Sales Order Split Adjustment</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Decide how much of this order value is assigned to the formal tax invoice and how much into cash receipt.
                </p>
              </div>

              {allocErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-600"/>
                  <span>{allocErrorMessage}</span>
                </div>
              )}

              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Total Order Value (₹)</label>
                    <span className="text-[10px] text-slate-500">Gross order amount</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={allocModalTotal}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setAllocModalTotal(val);
                      if (allocModalFormal <= val) {
                        setAllocModalCash(Math.max(0, Math.round((val - allocModalFormal) * 100) / 100));
                      } else {
                        setAllocModalFormal(val);
                        setAllocModalCash(0);
                      }
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-blue-800">Formal Invoice (₹)</label>
                      <span className="text-[10px] text-blue-600 font-medium">Billed with GST</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={allocModalTotal}
                      value={allocModalFormal}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setAllocModalFormal(val);
                        setAllocModalCash(Math.max(0, Math.round((allocModalTotal - val) * 100) / 100));
                      }}
                      className="w-full p-2 border border-blue-300 rounded-lg bg-white font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-amber-800">Cash Receipt (₹)</label>
                      <span className="text-[10px] text-amber-600 font-medium">Without-Bill Cash</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={allocModalTotal}
                      value={allocModalCash}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setAllocModalCash(val);
                        setAllocModalFormal(Math.max(0, Math.round((allocModalTotal - val) * 100) / 100));
                      }}
                      className="w-full p-2 border border-amber-300 rounded-lg bg-white font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>

                {/* Validation calculation */}
                {(() => {
                  const sum = Math.round((Number(allocModalFormal) + Number(allocModalCash)) * 100) / 100;
                  const diff = Math.round((Number(allocModalTotal) - sum) * 100) / 100;
                  if (diff < -0.01) {
                    return (
                      <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 font-mono text-[11px] flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1"><AlertCircle size={13}/> Over-allocated!</span>
                        <span>Exceeds Order Value by {formatCurrency(Math.abs(diff))}</span>
                      </div>
                    );
                  }
                  if (Math.abs(diff) < 0.01) {
                    return (
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1"><CheckCircle2 size={13}/> Perfectly Balanced</span>
                        <span>{formatCurrency(allocModalFormal)} + {formatCurrency(allocModalCash)} = {formatCurrency(allocModalTotal)}</span>
                      </div>
                    );
                  }
                  return (
                    <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[11px] flex items-center justify-between">
                      <span className="font-semibold">Unallocated Remaining:</span>
                      <span className="font-bold">{formatCurrency(diff)}</span>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Notes for Split Adjustment</label>
                <input
                  type="text"
                  value={allocModalReason}
                  onChange={(e) => setAllocModalReason(e.target.value)}
                  placeholder="e.g., Client requested ₹30,000 cash receipt and balance formal invoice"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => { setAllocationModalOrder(null); setAllocErrorMessage(''); }} disabled={allocSubmitting}>
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={allocSubmitting || (allocModalFormal + allocModalCash > allocModalTotal + 0.01)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {allocSubmitting ? 'Updating...' : 'Save Order Split'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Settle / View Payment Receipt Voucher Modal */}
      <PaymentReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)}/>
    </div>);
};
