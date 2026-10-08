import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, ClipboardList, Send, ArrowRight, X, Copy, Printer, DollarSign, Clock, CheckCircle2, Package, Maximize2, Minimize2, Trash2, Ban, MapPin, BookOpen, CreditCard, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { DocumentTimeline } from '../../components/common/DocumentTimeline';
import { RelatedDocumentsCard } from '../../components/common/RelatedDocumentsCard';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintPurchaseOrderModal } from '../../components/common/PrintPurchaseOrderModal';
import { fetchPoRegister, fetchVendorAdvances, createVendorAdvance, reconcileVendorAdvance } from '../../services/upgradeService';
const purchaseOrderGuide = {
    title: 'Purchase Orders',
    subtitle: 'Supplier procurement contracts driving inventory replenishment and vendor billing.',
    purpose: 'A Purchase Order (PO) is an official commercial document issued by your business to an external supplier, committing to buy specified quantities of goods at negotiated prices. It serves as the baseline for warehouse goods intake and 3-way matching.',
    keyTerms: [
        { term: 'Purchase Order (PO)', definition: 'A legally binding procurement contract sent to a vendor before goods are shipped.' },
        { term: 'Vendor Lead Time', definition: 'The expected days between issuing the PO and receiving physical delivery at the warehouse dock.' },
        { term: 'PO to Bill Conversion', definition: 'Converts the verified order into a vendor invoice and automatically increases warehouse inventory on-hand.' },
        { term: 'Commitments Book', definition: 'Tracks gross supplier contractual commitments versus actual invoiced totals and unsettled unbilled exposure.' },
    ],
    tips: [
        'Use the 📋 Clone button on frequent supplier orders to duplicate items into a new draft in 1 click.',
        'Once goods arrive at the dock, click "Create Bill" to post inventory intake and record Accounts Payable.',
        'Switch to the Commitments Book tab to review unbilled commitments and record vendor advances.',
    ],
    workflow: ['Auto-Generated / Draft PO', 'Issued to Vendor', 'Goods Intake & Vendor Bill', '3-Way Match Verified', 'Disbursement Settlement'],
};
export const PurchaseOrdersPage = () => {
    const navigate = useNavigate();
    const { purchaseOrders, vendors, addPurchaseOrder, updatePurchaseOrderStatus, cancelPurchaseOrder, deletePurchaseOrder, getPoBilledStatus, convertPurchaseOrderToBill, purchaseBills, paymentOuts, formatCurrency, formatDateDDMMYYYY, getCurrentDateFormatted, getCurrentISODate, addDaysISO } = useERP();
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'register'
    const [showAddModal, setShowAddModal] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedPo, setSelectedPo] = useState(null);
    const [printPoTarget, setPrintPoTarget] = useState(null);
    const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
    const [expectedDate, setExpectedDate] = useState(() => addDaysISO(getCurrentISODate(), 10));
    const [lineItems, setLineItems] = useState([]);
    
    // Commitments & Advances State
    const [registerData, setRegisterData] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [isLoadingRegister, setIsLoadingRegister] = useState(false);
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [showReconcileModal, setShowReconcileModal] = useState(false);
    const [selectedAdvance, setSelectedAdvance] = useState(null);
    const [newAdvance, setNewAdvance] = useState({
        party: '',
        amount: '',
        advance_date: new Date().toISOString().slice(0, 10),
        payment_mode: 'Bank Transfer',
        reference_number: '',
        purchase_order: '',
        notes: '',
    });
    const [reconcileForm, setReconcileForm] = useState({ bill_id: '', amount: '' });

    const handleOpenCreateModal = () => {
        setSelectedVendorId(vendors[0]?.id || '');
        setExpectedDate(addDaysISO(getCurrentISODate(), 10));
        setLineItems([]);
        setIsFullscreen(false);
        setShowAddModal(true);
    };

    const handleCloseCreateModal = () => {
        setShowAddModal(false);
        setSelectedVendorId(vendors[0]?.id || '');
        setExpectedDate(addDaysISO(getCurrentISODate(), 10));
        setLineItems([]);
        setIsFullscreen(false);
    };

    const handleClonePo = (po) => {
        setSelectedVendorId(po.vendorId || vendors[0]?.id || '');
        setExpectedDate(po.expectedDate || addDaysISO(getCurrentISODate(), 10));
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
            vendor: vend?.name || '',
            amount: totalAmt > 0 ? totalAmt : 0,
            date: getCurrentDateFormatted(),
            expectedDate: expectedDate || addDaysISO(getCurrentISODate(), 10),
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

    const loadRegisterData = async () => {
        setIsLoadingRegister(true);
        try {
            const regRes = await fetchPoRegister().catch(() => null);
            if (regRes?.data) {
                setRegisterData(Array.isArray(regRes.data) ? regRes.data : []);
            } else if (Array.isArray(regRes)) {
                setRegisterData(regRes);
            }
            const advRes = await fetchVendorAdvances().catch(() => null);
            if (advRes?.data) {
                setAdvances(Array.isArray(advRes.data) ? advRes.data : []);
            } else if (Array.isArray(advRes)) {
                setAdvances(advRes);
            }
        } catch (err) {
            console.error('Error loading PO register / advances:', err);
        } finally {
            setIsLoadingRegister(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'register') {
            loadRegisterData();
        }
    }, [activeTab]);

    const handleCreateAdvanceSubmit = async (e) => {
        e.preventDefault();
        try {
            await createVendorAdvance({
                party: newAdvance.party,
                amount: parseFloat(newAdvance.amount),
                advance_date: newAdvance.advance_date,
                payment_mode: newAdvance.payment_mode,
                reference_number: newAdvance.reference_number,
                purchase_order: newAdvance.purchase_order || undefined,
                notes: newAdvance.notes,
            });
            setShowAdvanceModal(false);
            setNewAdvance({
                party: '',
                amount: '',
                advance_date: new Date().toISOString().slice(0, 10),
                payment_mode: 'Bank Transfer',
                reference_number: '',
                purchase_order: '',
                notes: '',
            });
            await loadRegisterData();
        } catch (err) {
            alert('Failed to record vendor advance: ' + (err.message || 'Unknown error'));
        }
    };

    const handleReconcileSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAdvance) return;
        try {
            await reconcileVendorAdvance(selectedAdvance.id, reconcileForm.bill_id, reconcileForm.amount);
            setShowReconcileModal(false);
            setSelectedAdvance(null);
            setReconcileForm({ bill_id: '', amount: '' });
            await loadRegisterData();
        } catch (err) {
            alert('Failed to reconcile advance: ' + (err.message || 'Unknown error'));
        }
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
                    <button onClick={() => setPrintPoTarget(p)} className="p-1 text-muted hover:text-primary hover:bg-soft rounded-lg cursor-pointer transition-colors" title="Print Official Purchase Order">
                      <Printer size={13}/>
                    </button>
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
      <PageHeader
        title="Purchase Orders & Commitments"
        subtitle="Issue procurement orders, track supplier contractual commitments, manage goods intake, and settle vendor advances."
        guide={purchaseOrderGuide}
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'register' && (
              <>
                <Button variant="outline" icon={RefreshCw} onClick={loadRegisterData}>
                  Refresh
                </Button>
                <Button icon={Plus} onClick={() => setShowAdvanceModal(true)}>
                  Record Vendor Advance
                </Button>
              </>
            )}
            {activeTab === 'orders' && (
              <Button icon={Plus} onClick={handleOpenCreateModal}>
                Create Purchase Order
              </Button>
            )}
          </div>
        }
      />

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList size={14} />
          Purchase Orders ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition flex items-center gap-2 ${
            activeTab === 'register'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen size={14} />
          Commitments Book & Vendor Advances
        </button>
      </div>

      {activeTab === 'orders' ? (
        <>
          {/* Purchase Orders KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Committed Procurement" value={formatCurrency(totalPoValue)} icon={DollarSign} />
            <StatCard label="Active Orders In-Flight" value={`${activePoCount} Orders`} icon={Clock} trend={{ positive: true, text: 'Awaiting dock arrival' }} highlight={activePoCount > 0} />
            <StatCard label="Draft Orders" value={`${draftPoCount} Drafts`} icon={Package} subtext="Ready for vendor dispatch" />
            <StatCard label="Fulfilled & Billed" value={`${receivedPoCount} Received`} icon={CheckCircle2} trend={{ positive: true, text: 'Inventory updated' }} />
          </div>

          <DataTable title="Supplier Purchase Orders" columns={columns} data={purchaseOrders} keyExtractor={(p) => p.id} searchPlaceholder="Search PO # or vendor..." searchFilter={(p, term) => String(p.poNumber ?? '').toLowerCase().includes(term) ||
                String(p.vendor ?? '').toLowerCase().includes(term)}/>
        </>
      ) : (
        /* Commitments Book & Vendor Advances View */
        <div className="space-y-6">
          {/* Commitments KPIs */}
          {(() => {
            const totalCommit = registerData.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
            const totalBilled = registerData.reduce((acc, r) => acc + (Number(r.billed_total) || 0), 0);
            const totalUnbilled = registerData.reduce((acc, r) => acc + (Number(r.unbilled_commitment) || 0), 0);
            const totalAdv = advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0);
            const unallocAdv = advances.reduce((acc, a) => acc + (Number(a.unallocated_amount) || 0), 0);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Gross PO Commitments" value={formatCurrency(totalCommit)} icon={DollarSign} subtext={`${registerData.length} total orders`} />
                <StatCard label="Billed / Invoiced to Date" value={formatCurrency(totalBilled)} icon={CheckCircle2} />
                <StatCard label="Open Unbilled Commitments" value={formatCurrency(totalUnbilled)} icon={Clock} highlight={totalUnbilled > 0} trend={{ positive: false, text: 'Future AP exposure' }} />
                <StatCard label="Unallocated Advances" value={formatCurrency(unallocAdv)} icon={CreditCard} subtext={`${advances.length} advances recorded`} />
              </div>
            );
          })()}

          {/* Section 1: PO Commitments Register */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Purchase Commitments Register</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tracking ordered quantities, warehouse receipts, and unbilled commitment liabilities</p>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                {registerData.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">PO #</th>
                    <th className="py-2.5 px-4">Supplier</th>
                    <th className="py-2.5 px-4">Order Date</th>
                    <th className="py-2.5 px-4">Delivery Due</th>
                    <th className="py-2.5 px-4 text-center">Ordered / Received</th>
                    <th className="py-2.5 px-4 text-right">Gross Committed</th>
                    <th className="py-2.5 px-4 text-right">Invoiced / Billed</th>
                    <th className="py-2.5 px-4 text-right">Open Unbilled</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registerData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        {isLoadingRegister ? 'Loading commitments...' : 'No purchase commitments found.'}
                      </td>
                    </tr>
                  ) : (
                    registerData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-primary">{row.po_number}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{row.vendor_name || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-600">{row.doc_date ? formatDateDDMMYYYY(row.doc_date) : '—'}</td>
                        <td className="py-2.5 px-4 text-slate-600">{row.expected_date ? formatDateDDMMYYYY(row.expected_date) : '—'}</td>
                        <td className="py-2.5 px-4 text-center font-mono">
                          <span className="text-slate-800 font-bold">{row.received_qty}</span>
                          <span className="text-slate-400"> / {row.ordered_qty}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium">{formatCurrency(row.total)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-600">{formatCurrency(row.billed_total)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-600">
                          {formatCurrency(row.unbilled_commitment)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Vendor Advances Book */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Vendor Advance Disbursements</h3>
                <p className="text-xs text-slate-500 mt-0.5">Prepayments made to suppliers prior to invoice presentation, eligible for settlement against final bills</p>
              </div>
              <Button size="sm" icon={Plus} onClick={() => setShowAdvanceModal(true)}>
                Record Advance
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Advance #</th>
                    <th className="py-2.5 px-4">Vendor</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Payment Mode</th>
                    <th className="py-2.5 px-4">Reference #</th>
                    <th className="py-2.5 px-4 text-right">Advance Amount</th>
                    <th className="py-2.5 px-4 text-right">Reconciled</th>
                    <th className="py-2.5 px-4 text-right">Unallocated Balance</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advances.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-400">
                        No vendor advances recorded. Click "Record Advance" to log a supplier prepayment.
                      </td>
                    </tr>
                  ) : (
                    advances.map((adv) => (
                      <tr key={adv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-primary">{adv.advance_number || adv.advanceNumber}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{adv.party_name || adv.partyName || adv.vendor || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-600">{adv.advance_date ? formatDateDDMMYYYY(adv.advance_date) : '—'}</td>
                        <td className="py-2.5 px-4 text-slate-600">{adv.payment_mode || adv.paymentMode || '—'}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{adv.reference_number || adv.referenceNumber || '—'}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold">{formatCurrency(adv.amount)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-600">{formatCurrency(adv.reconciled_amount || 0)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-600">
                          {formatCurrency(adv.unallocated_amount !== undefined ? adv.unallocated_amount : adv.amount - (adv.reconciled_amount || 0))}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <StatusBadge status={adv.status || 'Active'} />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {Number(adv.unallocated_amount ?? adv.amount) > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedAdvance(adv);
                                setReconcileForm({ bill_id: '', amount: adv.unallocated_amount || adv.amount });
                                setShowReconcileModal(true);
                              }}
                              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-primary hover:text-white rounded font-medium transition cursor-pointer text-slate-700"
                            >
                              Reconcile
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showAddModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-200 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
          <div className={`bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isFullscreen ? 'w-full h-full rounded-none p-4 sm:p-8' : 'max-w-5xl w-full rounded-2xl p-4 sm:p-6 max-h-[95vh] sm:max-h-[92vh]'
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
                        {v.name}{v.code ? ` (${v.code})` : ''}{v.paymentTerms ? ` - Terms: ${v.paymentTerms}` : ''}
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
                          <span>POC: <strong>{vend.contactPerson || '—'}</strong></span>
                          <span>Email: {vend.email || '—'}</span>
                          <span>Phone: {vend.phone || '—'}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Intake Date</label>
                  <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"/>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-2">Procurement Line Items</label>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="purchase"/>
              </div>

              <div className="flex flex-wrap lg:flex-nowrap justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={handleCloseCreateModal} className="px-4 py-2 border border-border bg-card hover:bg-card-hover text-text rounded-xl font-semibold text-xs cursor-pointer transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-xs shadow-2xs cursor-pointer transition active:scale-[0.99]">
                  Save & Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* PO Detail & Lifecycle Modal */}
      {selectedPo && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-4 sm:p-6 shadow-2xl text-xs max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 pb-3 border-b border-slate-200">
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-3 min-w-0 lg:min-w-auto">
                <h3 className="font-bold text-lg text-[#1F2E4A]">{selectedPo.poNumber}</h3>
                <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                  {selectedPo.vendor}
                </span>
                <StatusBadge status={selectedPo.status}/>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintPoTarget(selectedPo)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={13}/>
                  Print Official PO
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
                        {selectedPo.billingAddress?.line1 && (<>{selectedPo.billingAddress.line1}<br /></>)}
                        {[selectedPo.billingAddress?.city, selectedPo.billingAddress?.state, selectedPo.billingAddress?.pincode].filter(Boolean).join(', ') || (!selectedPo.billingAddress?.line1 && '—')}
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-0 pt-4 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 px-4 sm:-mx-6 sm:-mb-6 sm:px-6 py-3">
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
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
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

      {/* Record Vendor Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Record Vendor Advance</h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateAdvanceSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Supplier / Vendor *</label>
                <select
                  required
                  value={newAdvance.party}
                  onChange={(e) => setNewAdvance({ ...newAdvance, party: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Advance Amount (Rs) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={newAdvance.amount}
                    onChange={(e) => setNewAdvance({ ...newAdvance, amount: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Disbursement Date *</label>
                  <input
                    type="date"
                    required
                    value={newAdvance.advance_date}
                    onChange={(e) => setNewAdvance({ ...newAdvance, advance_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={newAdvance.payment_mode}
                    onChange={(e) => setNewAdvance({ ...newAdvance, payment_mode: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Transaction / UTR Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-98765432"
                    value={newAdvance.reference_number}
                    onChange={(e) => setNewAdvance({ ...newAdvance, reference_number: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Link to Purchase Order (Optional)</label>
                <select
                  value={newAdvance.purchase_order}
                  onChange={(e) => setNewAdvance({ ...newAdvance, purchase_order: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                >
                  <option value="">None / General Advance</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>{po.poNumber} — {po.vendor} ({formatCurrency(po.amount)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Terms or conditions for this advance payment..."
                  value={newAdvance.notes}
                  onChange={(e) => setNewAdvance({ ...newAdvance, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm & Disburse Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconcile Advance Modal */}
      {showReconcileModal && selectedAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Reconcile Advance Against Bill</h3>
              <button onClick={() => setShowReconcileModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReconcileSubmit} className="space-y-3.5 mt-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p className="text-slate-600">Advance: <span className="font-mono font-bold text-slate-800">{selectedAdvance.advance_number || selectedAdvance.advanceNumber}</span></p>
                <p className="text-slate-600">Available Balance: <span className="font-mono font-bold text-emerald-600">{formatCurrency(selectedAdvance.unallocated_amount ?? selectedAdvance.amount)}</span></p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Purchase Bill *</label>
                <select
                  required
                  value={reconcileForm.bill_id}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, bill_id: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                >
                  <option value="">Select Bill to Settle...</option>
                  {(purchaseBills || []).filter(b => b.status !== 'Paid' && b.status !== 'Cancelled').map((bill) => (
                    <option key={bill.id} value={bill.id}>{bill.billNumber} — {bill.vendor} (Total: {formatCurrency(bill.total || bill.amount)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Settlement Amount (Rs) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  max={selectedAdvance.unallocated_amount ?? selectedAdvance.amount}
                  value={reconcileForm.amount}
                  onChange={(e) => setReconcileForm({ ...reconcileForm, amount: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReconcileModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Apply Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Commercial Purchase Order PDF Voucher */}
      <PrintPurchaseOrderModal
        isOpen={Boolean(printPoTarget)}
        onClose={() => setPrintPoTarget(null)}
        po={printPoTarget}
      />
    </div>);
};
