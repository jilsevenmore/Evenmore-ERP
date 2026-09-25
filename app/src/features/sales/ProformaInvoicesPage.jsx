import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import {
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Receipt,
  Eye,
  Printer,
  X,
  Copy,
  Edit2,
  ArrowRight,
  Maximize2,
  Minimize2,
  DollarSign,
  Clock,
  Send,
  AlertCircle,
  FileCheck2,
  ShieldAlert,
  Building2,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  Ban,
  Download,
  Trash2,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintProformaInvoiceModal } from '../../components/common/PrintProformaInvoiceModal';
import { PaymentReceiptModal } from '../../components/common/PaymentReceiptModal';

const proformaGuide = {
  title: 'Proforma Invoices',
  subtitle: 'Preliminary commercial offers, proposed payment schedules, and pre-billing agreements.',
  purpose: 'A Proforma Invoice is an official preliminary commercial commitment sent to prospects or clients before actual order dispatch and final tax billing. It outlines expected deliverables, price schedules, and proposed payment milestones without posting to the General Ledger or prematurely starting equipment warranties.',
  keyTerms: [
    { term: 'Proforma Invoice (PI)', definition: 'A preliminary commercial offer used for import clearance, advance deposits, or fund approvals before final tax invoicing.' },
    { term: 'Proposed Payment Schedule', definition: 'Commercial milestone distribution (e.g. 50% advance, 50% on dispatch) defining terms without recording received revenue.' },
    { term: 'Non-Tax Entity', definition: 'Does NOT post Accounts Receivable debt or GL revenue until converted into a Final Sales Invoice.' },
    { term: 'Warranty Pending', definition: 'Product and machine warranties remain inactive and pending until final invoicing, delivery, or commissioning.' },
  ],
  tips: [
    'Use "Create Final Invoice" to convert an approved Proforma Invoice into a formal Tax Invoice in 1 click.',
    'You can modify, add, or remove line items during the Final Invoice review step.',
    'Click "Print / PDF" on any Proforma to generate an official commercial voucher with your company bank details.',
  ],
  workflow: ['Quotation / Sales Order', 'Proforma Invoice Issued', 'Advance Payment Cleared', 'Warehouse Dispatch', 'Final Sales Tax Invoice'],
};

const PAYMENT_PRESETS = {
  '50_50': {
    label: '50% Advance • 50% Before Dispatch',
    schedules: [
      { milestone: 'Advance Booking Deposit', pct: 50, due: 'Upon Commercial Acceptance' },
      { milestone: 'Pre-Dispatch Balance', pct: 50, due: 'Before Warehouse Dispatch' },
    ],
  },
  '30_40_30': {
    label: '30% Advance • 40% Before Dispatch • 30% After Installation',
    schedules: [
      { milestone: 'Mobilization Advance', pct: 30, due: 'Upon Agreement Signing' },
      { milestone: 'Factory Dispatch Gate-Pass', pct: 40, due: 'Prior to Transit' },
      { milestone: 'Site Handover & Sign-off', pct: 30, due: 'Within 7 Days of Setup' },
    ],
  },
  '100_ADVANCE': {
    label: '100% Advance Prior to Build / Fulfillment',
    schedules: [
      { milestone: 'Full Advance Payment', pct: 100, due: 'Before Production Start' },
    ],
  },
  'NET_30': {
    label: 'Net 30 Days from Delivery',
    schedules: [
      { milestone: 'Net 30 Invoicing', pct: 100, due: '30 Days Net from Delivery' },
    ],
  },
  'CUSTOM': {
    label: 'Custom Milestone Schedule',
    schedules: [
      { milestone: 'Stage 1 Advance', pct: 40, due: 'Initial Booking' },
      { milestone: 'Stage 2 Delivery', pct: 60, due: 'Upon Delivery' },
    ],
  },
};

export const ProformaInvoicesPage = () => {
  const navigate = useNavigate();
  const {
    proformaInvoices = [],
    addProformaInvoice,
    updateProformaInvoice,
    updateProformaInvoiceAllocation,
    updateProformaInvoiceStatus,
    convertProformaToInvoice,
    deleteProformaInvoice,
    customers = [],
    salesOrders = [],
    invoices = [],
    paymentIns = [],
    addPaymentIn,
    formatCurrency,
    formatDateDDMMYYYY,
    getCurrentDateFormatted,
    getCurrentISODate,
    addDaysISO,
    companyProfile,
  } = useERP();

  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingPi, setEditingPi] = useState(null);
  const [selectedPi, setSelectedPi] = useState(null);
  const [deleteTargetPi, setDeleteTargetPi] = useState(null);
  const [printPiTarget, setPrintPiTarget] = useState(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [proformaNumber, setProformaNumber] = useState('');
  const [proformaDate, setProformaDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('30 Days');
  const [linkedSoId, setLinkedSoId] = useState('None');
  const [contactPerson, setContactPerson] = useState('');
  const [billingAddress, setBillingAddress] = useState({ line1: '', city: '', state: '', pincode: '' });
  const [shippingAddress, setShippingAddress] = useState({ line1: '', city: '', state: '', pincode: '' });
  const [paymentPresetKey, setPaymentPresetKey] = useState('50_50');
  const [paymentSchedule, setPaymentSchedule] = useState(PAYMENT_PRESETS['50_50'].schedules);
  const [otherCharges, setOtherCharges] = useState(0);
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState(
    '1. This Proforma Invoice is a preliminary commercial offer and not a final tax invoice.\n2. Prices and discounts are valid for 30 calendar days.\n3. Equipment warranty becomes active only upon Final Tax Invoicing and clinical commissioning.'
  );
  const [lineItems, setLineItems] = useState([]);

  // Two sections: Invoice & Cash Receipt split
  const [totalSalesValueInput, setTotalSalesValueInput] = useState(0);
  const [formalInvoiceAmountInput, setFormalInvoiceAmountInput] = useState(0);
  const [cashAmountInput, setCashAmountInput] = useState(0);
  const [autoBalanceSplit, setAutoBalanceSplit] = useState(true);
  const [createInvoiceNow, setCreateInvoiceNow] = useState(true);
  const [invoiceStatusInput, setInvoiceStatusInput] = useState('Draft');
  const [invoiceDueDateInput, setInvoiceDueDateInput] = useState(() => (addDaysISO && getCurrentISODate ? addDaysISO(getCurrentISODate(), 30) : new Date(Date.now() + 30*86400000).toISOString().split('T')[0]));
  const [createCashReceiptNow, setCreateCashReceiptNow] = useState(true);
  const [cashModeInput, setCashModeInput] = useState('Cash');
  const [cashRefInput, setCashRefInput] = useState('');
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Allocation adjustment modal for existing Proforma Invoice
  const [allocationModalPi, setAllocationModalPi] = useState(null);
  const [allocModalFormal, setAllocModalFormal] = useState(0);
  const [allocModalCash, setAllocModalCash] = useState(0);
  const [allocModalTotal, setAllocModalTotal] = useState(0);
  const [allocModalReason, setAllocModalReason] = useState('');
  const [allocSubmitting, setAllocSubmitting] = useState(false);
  const [allocErrorMessage, setAllocErrorMessage] = useState('');

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Recalculate totals
  const subtotal = lineItems.reduce((acc, it) => acc + (Number(it.rate || 0) * Number(it.qty || 1)), 0);
  const discountTotal = lineItems.reduce((acc, it) => {
    const itemSub = Number(it.rate || 0) * Number(it.qty || 1);
    const discPct = Number(it.discount || 0);
    return acc + (itemSub * (discPct / 100));
  }, 0);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  
  // Tax logic: Check if customer is intra-state (Maharashtra 27) or inter-state
  const isInterState = selectedCustomer?.placeOfSupply && !selectedCustomer.placeOfSupply.includes('27') && !selectedCustomer.placeOfSupply.includes('Maharashtra');
  const taxRate = 0.18; // standard 18% GST
  const cgst = !isInterState ? Math.round(taxableAmount * (taxRate / 2) * 100) / 100 : 0;
  const sgst = !isInterState ? Math.round(taxableAmount * (taxRate / 2) * 100) / 100 : 0;
  const igst = isInterState ? Math.round(taxableAmount * taxRate * 100) / 100 : 0;
  const grandTotal = Math.round((taxableAmount + cgst + sgst + igst + Number(otherCharges || 0)) * 100) / 100;

  useEffect(() => {
    if (!showCreateModal) return;
    const rounded = Math.round(grandTotal * 100) / 100;
    setTotalSalesValueInput(rounded);
    if (rounded > 0 && formalInvoiceAmountInput === 0 && cashAmountInput === 0) {
      setFormalInvoiceAmountInput(rounded);
      setCashAmountInput(0);
    }
  }, [grandTotal, showCreateModal]);

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

  const handleOpenAllocationModal = (pi) => {
    const total = Number(pi.totalSalesValue || pi.grandTotal || pi.total || 0);
    const formal = Number(pi.formalInvoiceAmount !== undefined ? pi.formalInvoiceAmount : (pi.invoice?.total ?? 0));
    const cash = Number(pi.cashAmount !== undefined ? pi.cashAmount : (pi.cashReceipt?.amount ?? 0));

    setAllocationModalPi(pi);
    setAllocModalTotal(total);
    setAllocModalFormal(formal);
    setAllocModalCash(cash);
    setAllocModalReason('');
    setAllocErrorMessage('');
  };

  const handleSaveAllocation = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!allocationModalPi) return;

    const formal = Math.round(Number(allocModalFormal) * 100) / 100;
    const cash = Math.round(Number(allocModalCash) * 100) / 100;
    const total = Math.round(Number(allocModalTotal) * 100) / 100;

    if (formal + cash > total + 0.01) {
      setAllocErrorMessage('Invoice + Cash Receipt cannot exceed Total Proforma Value.');
      return;
    }

    setAllocSubmitting(true);
    setAllocErrorMessage('');
    try {
      const updated = await updateProformaInvoiceAllocation(allocationModalPi.id, {
        formalInvoiceAmount: formal,
        cashAmount: cash,
        totalSalesValue: total,
        reason: allocModalReason || 'Manual PI split allocation adjustment',
      });

      if (selectedPi && selectedPi.id === allocationModalPi.id) {
        setSelectedPi((prev) => ({
          ...prev,
          totalSalesValue: total,
          formalInvoiceAmount: formal,
          cashAmount: cash,
        }));
      }
      setAllocationModalPi(null);
    } catch (err) {
      console.error('Failed to update proforma invoice split:', err);
      setAllocErrorMessage(err.message || 'Failed to update allocation.');
    } finally {
      setAllocSubmitting(false);
    }
  };

  // Sync Customer info on customer select
  const handleCustomerChange = (custId) => {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setContactPerson(cust.contactPerson || '');
      if (cust.billingAddress) setBillingAddress(cust.billingAddress);
      if (cust.shippingAddress) setShippingAddress(cust.shippingAddress);
    }
  };

  // Sync Linked Sales Order on SO select
  const handleSoSelect = (soId) => {
    setLinkedSoId(soId);
    if (soId !== 'None') {
      const order = salesOrders.find((o) => o.id === soId || o.orderNumber === soId);
      if (order) {
        if (order.customerId) handleCustomerChange(order.customerId);
        if (order.items && order.items.length > 0) {
          setLineItems(
            order.items.map((it) => ({
              ...it,
              id: `li-pi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              unit: it.unit || 'Unit',
              rate: it.rate || 0,
              discount: it.discount || 0,
              tax: it.tax || 18,
              taxAmount: Math.round((it.rate || 0) * (it.qty || 1) * 0.18 * 100) / 100,
              amount: Math.round((it.rate || 0) * (it.qty || 1) * 1.18 * 100) / 100,
              warrantyStatus: 'Pending Final Invoicing / Commissioning',
            }))
          );
        }
      }
    }
  };

  const handleOpenCreateModal = () => {
    const cust = customers[0];
    setSelectedCustomerId(cust?.id || '');
    setProformaNumber(`PI-2026-${String(proformaInvoices.length + 101).padStart(3, '0')}`);
    setProformaDate(new Date().toISOString().split('T')[0]);
    setValidUntil('30 Days');
    setLinkedSoId('None');
    setContactPerson(cust?.contactPerson || '');
    setBillingAddress(cust?.billingAddress || { line1: 'Corporate Headquarters', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' });
    setShippingAddress(cust?.shippingAddress || { line1: 'Corporate Headquarters', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' });
    setPaymentPresetKey('50_50');
    setPaymentSchedule(PAYMENT_PRESETS['50_50'].schedules);
    setOtherCharges(0);
    setNotes('Preliminary commercial offer for procurement review.');
    setTermsAndConditions(
      '1. This Proforma Invoice is a preliminary commercial offer and not a final tax invoice.\n2. Prices and discounts are valid for 30 calendar days.\n3. Equipment warranty becomes active only upon Final Tax Invoicing and clinical commissioning.'
    );
    setLineItems([]);
    setEditingPi(null);
    setIsFullscreen(false);
    setFormalInvoiceAmountInput(0);
    setCashAmountInput(0);
    setTotalSalesValueInput(0);
    setAutoBalanceSplit(true);
    setCreateInvoiceNow(true);
    setInvoiceStatusInput('Draft');
    setInvoiceDueDateInput(addDaysISO && getCurrentISODate ? addDaysISO(getCurrentISODate(), 30) : new Date(Date.now() + 30*86400000).toISOString().split('T')[0]);
    setCreateCashReceiptNow(true);
    setCashModeInput('Cash');
    setCashRefInput('');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (pi) => {
    setSelectedCustomerId(pi.customerId || customers[0]?.id || '');
    setProformaNumber(pi.proformaNumber);
    setProformaDate(pi.date || new Date().toISOString().split('T')[0]);
    setValidUntil(pi.validUntil || '30 Days');
    setLinkedSoId(pi.salesOrderId || pi.linkedSo || 'None');
    setContactPerson(pi.customerContact || '');
    setBillingAddress(pi.billingAddress || { line1: '', city: '', state: '', pincode: '' });
    setShippingAddress(pi.shippingAddress || { line1: '', city: '', state: '', pincode: '' });
    setPaymentPresetKey('CUSTOM');
    setPaymentSchedule(pi.paymentSchedule || PAYMENT_PRESETS['50_50'].schedules);
    setOtherCharges(pi.otherCharges || 0);
    setNotes(pi.notes || '');
    setTermsAndConditions(pi.termsAndConditions || '');
    setLineItems(pi.items || []);
    setEditingPi(pi);
    setIsFullscreen(false);
    const total = Number(pi.totalSalesValue || pi.grandTotal || pi.total || 0);
    const formal = Number(pi.formalInvoiceAmount !== undefined ? pi.formalInvoiceAmount : (pi.invoice?.total ?? total));
    const cash = Number(pi.cashAmount !== undefined ? pi.cashAmount : (pi.cashReceipt?.amount ?? 0));
    setTotalSalesValueInput(total);
    setFormalInvoiceAmountInput(formal);
    setCashAmountInput(cash);
    setCashModeInput(pi.cashReceipt?.mode || 'Cash');
    setCashRefInput(pi.cashReceipt?.reference || '');
    setCreateInvoiceNow(false);
    setCreateCashReceiptNow(false);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setEditingPi(null);
    setLineItems([]);
    setIsFullscreen(false);
  };

  const handlePresetChange = (presetKey) => {
    setPaymentPresetKey(presetKey);
    if (PAYMENT_PRESETS[presetKey]) {
      setPaymentSchedule(PAYMENT_PRESETS[presetKey].schedules);
    }
  };

  const handleUpdateScheduleMilestone = (idx, field, val) => {
    setPaymentSchedule((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleAddScheduleMilestone = () => {
    setPaymentSchedule((prev) => [
      ...prev,
      { milestone: `Milestone ${prev.length + 1}`, pct: 10, due: 'Upon Notification' },
    ]);
  };

  const handleRemoveScheduleMilestone = (idx) => {
    setPaymentSchedule((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = (status = 'Draft') => {
    const cust = customers.find((c) => c.id === selectedCustomerId) || customers[0];
    const so = salesOrders.find((o) => o.id === linkedSoId || o.orderNumber === linkedSoId);

    const effectivePiAmt = grandTotal > 0 ? grandTotal : 5900;
    if (formalInvoiceAmountInput + cashAmountInput > effectivePiAmt + 0.01) {
      alert('Validation Error: Formal Invoice + Cash Receipt cannot exceed Total Proforma Value.');
      return;
    }

    // Compute milestone amounts
    const computedSchedule = paymentSchedule.map((s) => ({
      ...s,
      amount: Math.round(grandTotal * (Number(s.pct || 0) / 100) * 100) / 100,
    }));

    const payload = {
      id: editingPi ? editingPi.id : undefined,
      proformaNumber: proformaNumber || `PI-2026-${String(proformaInvoices.length + 101).padStart(3, '0')}`,
      customerId: cust?.id,
      customer: cust?.name || 'Acme Corp',
      customerContact: contactPerson || cust?.contactPerson || '',
      billingAddress,
      shippingAddress,
      salesOrderId: so?.id || (linkedSoId !== 'None' ? linkedSoId : null),
      linkedSo: so?.orderNumber || (linkedSoId !== 'None' ? linkedSoId : null),
      date: proformaDate,
      validUntil,
      status: editingPi ? (status || editingPi.status) : status,
      paymentTerms: PAYMENT_PRESETS[paymentPresetKey]?.label || 'Custom Milestone Schedule',
      paymentSchedule: computedSchedule,
      items: lineItems.length > 0 ? lineItems : [
        {
          id: `li-pi-${Date.now()}`,
          description: 'Standard Order Merchandise Package',
          qty: 1,
          unit: 'Unit',
          rate: 5000,
          discount: 0,
          tax: 18,
          taxAmount: 900,
          amount: 5900,
          warrantyStatus: 'Pending Final Invoicing / Commissioning',
        },
      ],
      subtotal: subtotal > 0 ? subtotal : 5000,
      discountTotal,
      taxableAmount: taxableAmount > 0 ? taxableAmount : 5000,
      cgst,
      sgst,
      igst,
      otherCharges: Number(otherCharges || 0),
      roundOff: 0,
      total: grandTotal > 0 ? grandTotal : 5900,
      grandTotal: grandTotal > 0 ? grandTotal : 5900,
      totalSalesValue: totalSalesValueInput || effectivePiAmt,
      formalInvoiceAmount: formalInvoiceAmountInput,
      cashAmount: cashAmountInput,
      createInvoiceNow: createInvoiceNow && formalInvoiceAmountInput > 0,
      invoiceStatus: invoiceStatusInput,
      invoiceDueDate: invoiceDueDateInput,
      createCashReceiptNow: createCashReceiptNow && cashAmountInput > 0,
      cashMode: cashModeInput,
      cashRef: cashRefInput,
      notes,
      termsAndConditions,
    };

    if (editingPi) {
      updateProformaInvoice(editingPi.id, payload);
    } else {
      addProformaInvoice(payload);
    }

    handleCloseCreateModal();
  };

  const handleClonePi = (pi) => {
    setSelectedCustomerId(pi.customerId || customers[0]?.id || '');
    setProformaNumber(`PI-2026-${String(proformaInvoices.length + 102).padStart(3, '0')}`);
    setProformaDate(new Date().toISOString().split('T')[0]);
    setValidUntil(pi.validUntil || '30 Days');
    setLinkedSoId(pi.salesOrderId || pi.linkedSo || 'None');
    setContactPerson(pi.customerContact || '');
    setBillingAddress(pi.billingAddress || { line1: '', city: '', state: '', pincode: '' });
    setShippingAddress(pi.shippingAddress || { line1: '', city: '', state: '', pincode: '' });
    setPaymentPresetKey('CUSTOM');
    setPaymentSchedule(pi.paymentSchedule || PAYMENT_PRESETS['50_50'].schedules);
    setOtherCharges(pi.otherCharges || 0);
    setNotes(`Cloned from ${pi.proformaNumber}. ${pi.notes || ''}`);
    setTermsAndConditions(pi.termsAndConditions || '');
    setLineItems((pi.items || []).map((it) => ({
      ...it,
      id: `li-pi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    })));
    setEditingPi(null);
    setIsFullscreen(false);
    setShowCreateModal(true);
  };

  const handleDirectConvertToInvoice = (pi) => {
    const createdInvoice = convertProformaToInvoice(pi.id);
    if (createdInvoice) {
      navigate('/sales/invoices');
    }
  };

  const filteredInvoices = proformaInvoices.filter((pi) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Converted') return pi.status === 'Converted';
    return pi.status === statusFilter;
  });

  // KPI Calculations
  const totalPiCount = proformaInvoices.length;
  const activePipelineValue = proformaInvoices
    .filter((pi) => pi.status !== 'Converted' && pi.status !== 'Cancelled' && pi.status !== 'Rejected')
    .reduce((sum, pi) => sum + (pi.grandTotal || pi.total || 0), 0);
  const convertedCount = proformaInvoices.filter((pi) => pi.status === 'Converted').length;
  const sentCount = proformaInvoices.filter((pi) => pi.status === 'Sent' || pi.status === 'Accepted').length;

  const columns = [
    {
      key: 'proformaNumber',
      header: 'Proforma #',
      width: '12%',
      render: (pi) => (
        <button
          onClick={() => setSelectedPi(pi)}
          className="font-mono font-bold text-primary hover:underline flex items-center gap-1.5 text-left cursor-pointer whitespace-nowrap"
        >
          <FileSpreadsheet size={13} className="text-muted shrink-0" />
          <span>{pi.proformaNumber}</span>
        </button>
      ),
    },
    {
      key: 'customer',
      header: 'Customer Account',
      width: '16%',
      render: (pi) => (
        <div className="min-w-0">
          <span className="font-bold text-text block truncate">{pi.customer}</span>
          {pi.customerContact && <span className="text-[11px] text-muted block truncate">{pi.customerContact}</span>}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'PI Date',
      width: '9%',
      render: (pi) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(pi.date)}</span>,
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      width: '9%',
      render: (pi) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(pi.validUntil)}</span>,
    },
    {
      key: 'paymentTerms',
      header: 'Proposed Payment Terms',
      width: '20%',
      render: (pi) => {
        let termsText = 'Standard Terms';
        if (typeof pi.paymentTerms === 'string' && pi.paymentTerms.trim()) {
          termsText = pi.paymentTerms;
        } else if (Array.isArray(pi.paymentTerms)) {
          termsText = pi.paymentTerms.map((t) => {
            if (typeof t === 'string') return t;
            if (t && typeof t === 'object') return t.name || t.milestone || `${t.percentage ?? t.pct ?? ''}%`;
            return '';
          }).filter(Boolean).join(' • ') || 'Custom Milestone Schedule';
        } else if (pi.paymentTerms && typeof pi.paymentTerms === 'object') {
          termsText = pi.paymentTerms.name || pi.paymentTerms.milestone || 'Custom Terms';
        } else if (Array.isArray(pi.paymentSchedule) && pi.paymentSchedule.length > 0) {
          termsText = pi.paymentSchedule.map((s) => `${s.pct ?? s.percentage ?? 0}% ${s.milestone || ''}`).join(' • ');
        }
        return (
          <span className="text-[11px] font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 block truncate max-w-[210px]" title={termsText}>
            {termsText}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'PI Value & Split',
      align: 'right',
      width: '15%',
      render: (pi) => {
        const total = pi.grandTotal ?? pi.total ?? 0;
        const formal = pi.formalInvoiceAmount !== undefined ? pi.formalInvoiceAmount : (pi.invoice?.total ?? null);
        const cash = pi.cashAmount !== undefined ? pi.cashAmount : (pi.cashReceipt?.amount ?? null);
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
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '12%',
      render: (pi) => {
        if (pi.status === 'Converted') {
          return (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap">
                <CheckCircle2 size={11} /> Converted
              </span>
              {pi.convertedInvoiceNumber && (
                <button
                  onClick={() => navigate('/sales/invoices')}
                  className="text-[10px] font-mono font-semibold text-primary hover:underline mt-0.5 cursor-pointer"
                >
                  {pi.convertedInvoiceNumber}
                </button>
              )}
            </div>
          );
        }
        return <StatusBadge status={pi.status || 'Draft'} />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '14%',
      render: (pi) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          <button
            onClick={() => setSelectedPi(pi)}
            className="p-1.5 text-muted hover:text-primary hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            title="View Details"
          >
            <Eye size={13} />
          </button>
          {pi.status !== 'Converted' && pi.status !== 'Cancelled' && (
            <button
              onClick={() => handleOpenAllocationModal(pi)}
              className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
              title="Adjust Proforma Split Allocation (Formal vs Cash)"
            >
              <SlidersHorizontal size={13} />
            </button>
          )}
          <button
            onClick={() => setPrintPiTarget(pi)}
            className="p-1.5 text-muted hover:text-primary hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            title="Print Official Proforma Invoice Voucher"
          >
            <Printer size={13} />
          </button>
          <button
            onClick={() => handleClonePi(pi)}
            className="p-1.5 text-muted hover:text-primary hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            title="Clone / Duplicate Proforma"
          >
            <Copy size={13} />
          </button>
          {pi.status === 'Draft' && (
            <button
              onClick={() => setDeleteTargetPi(pi)}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
              title="Delete Draft Proforma"
            >
              <Trash2 size={13} />
            </button>
          )}
          {pi.status !== 'Converted' && pi.status !== 'Cancelled' ? (
            <button
              onClick={() => handleDirectConvertToInvoice(pi)}
              className="px-2.5 py-1 bg-primary text-white rounded-md text-xs font-semibold hover:bg-primary-hover cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors whitespace-nowrap"
              title="Create Final Tax Invoice"
            >
              <Receipt size={12} /> Convert
            </button>
          ) : pi.status === 'Converted' ? (
            <button
              onClick={() => navigate('/sales/invoices')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 size={12} /> View
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proforma Invoices"
        subtitle="Preliminary commercial offers, milestone payment schedules, and pre-billing agreements before final tax invoicing."
        guide={proformaGuide}
        actions={
          <Button icon={Plus} onClick={handleOpenCreateModal}>
            Create Proforma Invoice
          </Button>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Proformas Issued" value={totalPiCount} icon={FileSpreadsheet} />
        <StatCard
          label="Active Proforma Pipeline"
          value={formatCurrency(activePipelineValue)}
          icon={DollarSign}
          trend={{ positive: true, text: `${sentCount} active in negotiation` }}
          highlight={activePipelineValue > 0}
        />
        <StatCard
          label="Converted to Final Invoices"
          value={`${convertedCount} Converted`}
          icon={CheckCircle2}
          trend={{ positive: true, text: 'Direct Tax Invoice Conversion' }}
        />
        <StatCard
          label="Commercial Payment Guard"
          value="Non-Tax / Pre-GL"
          icon={Clock}
          subtext="No AR/GL liability generated"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-nowrap items-center gap-2 border-b border-[#CED4DA] pb-2 text-xs overflow-x-auto lg:overflow-visible whitespace-nowrap lg:whitespace-normal scrollbar-none">
        {['All', 'Draft', 'Sent', 'Accepted', 'Converted', 'Cancelled'].map((stg) => (
          <button
            key={stg}
            onClick={() => setStatusFilter(stg)}
            className={`shrink-0 lg:shrink px-3 py-1.5 rounded-t font-semibold transition-colors cursor-pointer ${
              statusFilter === stg
                ? 'bg-white border-t-2 border-[#1F2E4A] text-[#1F2E4A] shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {stg === 'Converted' ? 'Converted to Final Invoice' : stg}
          </button>
        ))}
      </div>

      {/* Main Register Table */}
      <DataTable
        title="Proforma Invoice Register"
        data={filteredInvoices}
        columns={columns}
        keyExtractor={(pi) => pi.id}
        searchPlaceholder="Search proforma #, customer, or payment terms..."
        searchFilter={(pi, term) => {
          let termsStr = '';
          if (typeof pi.paymentTerms === 'string') {
            termsStr = pi.paymentTerms;
          } else if (Array.isArray(pi.paymentTerms)) {
            termsStr = pi.paymentTerms.map((t) => (typeof t === 'string' ? t : (t.name || t.milestone || ''))).join(' ');
          }
          return (
            (pi.proformaNumber || '').toLowerCase().includes(term) ||
            (pi.customer || '').toLowerCase().includes(term) ||
            termsStr.toLowerCase().includes(term) ||
            (pi.status || '').toLowerCase().includes(term)
          );
        }}
      />

      {/* Create / Edit Proforma Modal (with Fullscreen option) */}
      {showCreateModal && (
        <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
          <div
            className={`bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
              isFullscreen ? 'w-full h-full rounded-none p-4 sm:p-8' : 'max-w-5xl w-full rounded-2xl p-4 sm:p-6 max-h-[92vh]'
            } text-xs`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 lg:gap-0 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3 min-w-0 lg:min-w-auto">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1F2E4A]">
                    {editingPi ? `Edit Proforma Invoice (${editingPi.proformaNumber})` : 'Create Proforma Invoice'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Preliminary commercial document • Non-accounting offer • Equipment warranty remains pending
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={(e) => { e.preventDefault(); handleSave('Sent'); }} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              {/* Header Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Customer Account */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer Account *</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-medium"
                  >
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
                        <span>POC: <strong>{contactPerson || selectedCustomer.contactPerson || 'Account Lead'}</strong></span>
                        <span>Email: {selectedCustomer.email}</span>
                        <span>Place of Supply: {selectedCustomer.placeOfSupply || 'Maharashtra (27)'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Document Information */}
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Proforma Invoice #</label>
                    <input
                      type="text"
                      required
                      value={proformaNumber}
                      onChange={(e) => setProformaNumber(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={proformaDate}
                        onChange={(e) => setProformaDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Valid Until</label>
                      <input
                        type="text"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        placeholder="e.g. 30 Days"
                        className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Linked Sales Order / Reference */}
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Source Sales Order (Optional)</label>
                    <select
                      value={linkedSoId}
                      onChange={(e) => handleSoSelect(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-medium"
                    >
                      <option value="None">-- Direct Proforma (No Linked SO) --</option>
                      {salesOrders.map((so) => (
                        <option key={so.id} value={so.id}>
                          {so.orderNumber} - {so.customer} ({formatCurrency(so.amount ?? so.total ?? 0)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Customer Contact Person</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Sarah Connor (Procurement Lead)"
                      className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 mb-2">
                  <label className="font-semibold text-slate-800 block text-xs">
                    Product Line Items & Machine Components
                  </label>
                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <ShieldAlert size={12} /> Warranty Activation: Pending Final Invoice
                  </span>
                </div>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="sales" />
              </div>

              {/* Proposed Payment Information & Totals Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {/* Proposed Payment Terms & Milestones */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Clock size={14} className="text-blue-600" /> Proposed Payment Terms & Schedule
                      </h4>
                      <p className="text-[10px] text-slate-500">Commercial payment milestones • Does not post received revenue</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddScheduleMilestone}
                      className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Add Milestone
                    </button>
                  </div>

                  {/* Preset Selector */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Payment Schedule Preset</label>
                    <select
                      value={paymentPresetKey}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
                    >
                      {Object.entries(PAYMENT_PRESETS).map(([key, obj]) => (
                        <option key={key} value={key}>
                          {obj.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Milestone Rows */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {paymentSchedule.map((s, idx) => (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                        <input
                          type="text"
                          value={s.milestone}
                          onChange={(e) => handleUpdateScheduleMilestone(idx, 'milestone', e.target.value)}
                          placeholder="Milestone description"
                          className="flex-1 basis-full sm:basis-0 p-1 text-xs border border-slate-200 rounded"
                        />
                        <div className="flex items-center gap-1 w-20 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={s.pct}
                            onChange={(e) => handleUpdateScheduleMilestone(idx, 'pct', Number(e.target.value))}
                            className="w-12 p-1 text-xs border border-slate-200 rounded text-right font-mono"
                          />
                          <span className="text-[11px] text-slate-500">%</span>
                        </div>
                        <span className="font-mono font-bold text-slate-700 w-24 text-right text-xs shrink-0">
                          {formatCurrency(grandTotal * (Number(s.pct || 0) / 100))}
                        </span>
                        <input
                          type="text"
                          value={s.due || ''}
                          onChange={(e) => handleUpdateScheduleMilestone(idx, 'due', e.target.value)}
                          placeholder="Trigger/Due"
                          className="w-28 p-1 text-xs border border-slate-200 rounded text-[11px]"
                        />
                        {paymentSchedule.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveScheduleMilestone(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 text-[10px] flex items-start gap-2">
                    <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Payment schedule information defined in a Proforma Invoice is for commercial alignment only. It does not record actual accounts receivable or revenue receipts.
                    </span>
                  </div>
                </div>

                {/* Financial Totals Breakdown Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <DollarSign size={14} className="text-emerald-600" /> Commercial Price & Tax Summary
                  </h4>

                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>Subtotal (Gross):</span>
                    <span className="font-mono font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="flex justify-between py-0.5 text-emerald-700">
                      <span>Discount Total:</span>
                      <span className="font-mono font-semibold">- {formatCurrency(discountTotal)}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-0.5 font-semibold text-slate-700">
                    <span>Taxable Value:</span>
                    <span className="font-mono">{formatCurrency(taxableAmount)}</span>
                  </div>

                  {!isInterState ? (
                    <>
                      <div className="flex justify-between py-0.5 text-slate-500 text-[11px]">
                        <span>CGST (9% Intra-state):</span>
                        <span className="font-mono">{formatCurrency(cgst)}</span>
                      </div>
                      <div className="flex justify-between py-0.5 text-slate-500 text-[11px]">
                        <span>SGST (9% Intra-state):</span>
                        <span className="font-mono">{formatCurrency(sgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between py-0.5 text-slate-500 text-[11px]">
                      <span>IGST (18% Inter-state):</span>
                      <span className="font-mono">{formatCurrency(igst)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-1 border-t border-slate-200">
                    <span className="text-slate-600">Other Charges (Freight/Handling):</span>
                    <div className="w-28">
                      <input
                        type="number"
                        value={otherCharges}
                        onChange={(e) => setOtherCharges(Number(e.target.value))}
                        className="w-full p-1 text-right border border-slate-300 rounded font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-slate-300 font-bold text-sm text-[#1F2E4A]">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-blue-700">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* TWO SECTIONS: INVOICE & CASH RECEIPT SPLIT */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Split Allocation: Formal Invoice & Cash Receipt
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={autoBalanceSplit}
                          onChange={(e) => setAutoBalanceSplit(e.target.checked)}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span>Auto-balance with Total PI Value</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">
                      Total PI Value: <strong className="font-mono text-slate-800 font-bold">{formatCurrency(grandTotal)}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormalInvoiceAmountInput(grandTotal);
                          setCashAmountInput(0);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                      >
                        100% Invoice
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormalInvoiceAmountInput(0);
                          setCashAmountInput(grandTotal);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 cursor-pointer"
                      >
                        100% Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const f = Math.round(grandTotal * 0.7 * 100) / 100;
                          setFormalInvoiceAmountInput(f);
                          setCashAmountInput(Math.round((grandTotal - f) * 100) / 100);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                      >
                        70% / 30%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const f = Math.round(grandTotal * 0.5 * 100) / 100;
                          setFormalInvoiceAmountInput(f);
                          setCashAmountInput(Math.round((grandTotal - f) * 100) / 100);
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
                    const diff = Math.round((Number(grandTotal) - sum) * 100) / 100;
                    if (diff < -0.01) {
                      return (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] font-mono flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1"><ShieldAlert size={13}/> Over-allocated!</span>
                          <span>Sum ({formatCurrency(sum)}) exceeds PI Value by {formatCurrency(Math.abs(diff))}</span>
                        </div>
                      );
                    }
                    if (Math.abs(diff) < 0.01 && grandTotal > 0) {
                      return (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] font-mono flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1"><CheckCircle2 size={13}/> 100% Balanced</span>
                          <span>Invoice {formatCurrency(formalInvoiceAmountInput)} + Cash {formatCurrency(cashAmountInput)} = {formatCurrency(grandTotal)}</span>
                        </div>
                      );
                    }
                    return (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] font-mono flex items-center justify-between">
                        <span className="font-semibold">Unallocated PI Value:</span>
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
                          {grandTotal > 0 ? `${Math.round((formalInvoiceAmountInput / grandTotal) * 100)}%` : '0%'}
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
                      * Generates an official Tax Invoice linked to this Proforma Invoice with proportional item rates.
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
                          {grandTotal > 0 ? `${Math.round((cashAmountInput / grandTotal) * 100)}%` : '0%'}
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
                          placeholder="CASH-PI-..."
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-800 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      * Generates an official Without-Bill Cash Receipt Voucher linked to this Proforma Invoice.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes & Commercial Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Commercial Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Quotation valid for hospital Phase 2 wing. Delivery scheduled within 3 weeks of advance deposit."
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Commercial Terms & Conditions</label>
                  <textarea
                    rows={3}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={handleCloseCreateModal}>
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={() => handleSave('Draft')}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer"
                >
                  Save as Draft
                </button>
                <Button type="submit">
                  {editingPi ? 'Update Proforma Invoice' : 'Save & Mark Sent'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360 Detail & Printable Voucher Modal */}
      {selectedPi && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 sm:p-6 text-xs max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header Toolbar */}
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 lg:gap-0 pb-3 border-b border-slate-200 bg-slate-50 -m-4 mb-4 p-4 sm:-m-6 sm:mb-4 sm:p-6">
              <div className="flex items-center gap-3 min-w-0 lg:min-w-auto">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                    <h3 className="font-bold text-lg text-[#1F2E4A]">{selectedPi.proformaNumber}</h3>
                    <StatusBadge status={selectedPi.status} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Customer: <strong>{selectedPi.customer}</strong> • Date: {formatDateDDMMYYYY(selectedPi.date)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintPiTarget(selectedPi)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={13} /> Print / PDF
                </button>
                {selectedPi.status === 'Draft' && (
                  <button
                    type="button"
                    onClick={() => {
                      const pi = selectedPi;
                      setSelectedPi(null);
                      setDeleteTargetPi(pi);
                    }}
                    className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Trash2 size={13} /> Delete Draft
                  </button>
                )}
                {selectedPi.status !== 'Converted' && selectedPi.status !== 'Cancelled' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const piToEdit = selectedPi;
                        setSelectedPi(null);
                        handleOpenEditModal(piToEdit);
                      }}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDirectConvertToInvoice(selectedPi);
                        setSelectedPi(null);
                      }}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Receipt size={13} /> Create Final Invoice
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPi(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-slate-200 ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Voucher Content */}
            <div className="overflow-y-auto space-y-5 pr-1 flex-1 text-xs">
              {/* Commercial Watermark Banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 text-blue-900 text-xs">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-blue-600 shrink-0" />
                  <span>
                    <strong>PRELIMINARY COMMERCIAL PROFORMA INVOICE:</strong> Not an official tax invoice. Equipment warranty remains pending until Final Invoice issuance.
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase bg-blue-200/60 px-2 py-0.5 rounded">
                  Non-Accounting Document
                </span>
              </div>

              {/* Company & Client Header Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl border border-slate-200 bg-white">
                <div>
                  {/* [PHASE-2E.1] company identity from companyProfile (was hardcoded Evenmore strings) */}
                  <h4 className="font-extrabold text-sm text-[#1F2E4A] mb-1">{companyProfile?.name || 'EVENMORE ERP MEDICAL & SYSTEMS'}</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {companyProfile?.address || 'Corporate Towers, Sector 62, Electronic City<br />Bengaluru, Karnataka - 560100, India'}<br />
                    <strong>GSTIN:</strong> {companyProfile?.gstin || '29AABCU9912E1Z8'} • <strong>PAN:</strong> {companyProfile?.pan || 'AABCU9912E'}<br />
                    <strong>Email:</strong> billing@sweven.in • <strong>Phone:</strong> {companyProfile?.phone || '+91 80 4920 1100'}
                  </p>
                </div>

                <div className="sm:text-right">
                  <h4 className="font-bold text-xs uppercase text-slate-400 mb-1">PROFORMA INVOICE RECIPIENT</h4>
                  <p className="font-bold text-sm text-slate-800">{selectedPi.customer}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {selectedPi.billingAddress?.line1 || 'Main Facility Center'}<br />
                    {selectedPi.billingAddress?.city || 'Mumbai'}, {selectedPi.billingAddress?.state || 'Maharashtra'} - {selectedPi.billingAddress?.pincode || '400001'}<br />
                    <strong>Contact:</strong> {selectedPi.customerContact || 'Primary Lead'}
                  </p>
                </div>
              </div>

              {/* Meta Parameters Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Proforma #</span>
                  <span className="font-mono font-bold text-slate-800">{selectedPi.proformaNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Proforma Date</span>
                  <span className="font-mono text-slate-800">{formatDateDDMMYYYY(selectedPi.date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Valid Until</span>
                  <span className="font-mono text-slate-800">{formatDateDDMMYYYY(selectedPi.validUntil)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Sales Order Ref</span>
                  <span className="font-mono text-slate-800">{selectedPi.linkedSo || 'Direct PI'}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[640px] lg:min-w-0 text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-[11px]">
                    <tr>
                      <th className="p-2.5 w-8 text-center">#</th>
                      <th className="p-2.5">Product & Machine Deliverables</th>
                      <th className="p-2.5 text-center w-16">Qty</th>
                      <th className="p-2.5 text-right w-24">Unit Rate</th>
                      <th className="p-2.5 text-center w-16">GST</th>
                      <th className="p-2.5 text-right w-24">Tax Amount</th>
                      <th className="p-2.5 text-right w-28">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedPi.items || []).map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5">
                          <span className="font-bold text-slate-800 block">{it.name || it.description}</span>
                          <span className="font-mono text-[10px] text-slate-400 mr-2">SKU: {it.sku || it.itemSku || 'GEN-SKU'}</span>
                          {it.serialNumber && (
                            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 mr-2">
                              SN: {it.serialNumber}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Warranty: Pending Final Invoicing
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono font-semibold">{it.qty} {it.unit || 'Unit'}</td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(it.rate || 0)}</td>
                        <td className="p-2.5 text-center font-mono">{it.tax || 18}%</td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(it.taxAmount || ((it.rate || 0) * (it.qty || 1) * 0.18))}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                          {formatCurrency(it.amount || ((it.rate || 0) * (it.qty || 1) * 1.18))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Proposed Schedule & Financials Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Proposed Payment Milestones */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Clock size={13} className="text-blue-600" /> Proposed Milestone Schedule
                  </h4>
                  <div className="space-y-1.5">
                    {(selectedPi.paymentSchedule || []).map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-800 block">{s.milestone}</span>
                          <span className="text-[10px] text-slate-500">Trigger: {s.due || 'Standard'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-blue-700 block">
                            {formatCurrency(s.amount || (selectedPi.grandTotal * (Number(s.pct || 0) / 100)))}
                          </span>
                          <span className="text-[10px] text-slate-400">({s.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Wire Transfer Banking Info */}
                  <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-[10px] text-blue-900 space-y-0.5">
                    <p className="font-bold uppercase tracking-wider text-blue-800">Bank Wire Details for Deposit:</p>
                    <p><strong>Bank:</strong> HDFC Bank Ltd • <strong>A/C:</strong> 992810029311 • <strong>IFSC:</strong> HDFC0001245</p>
                    <p><strong>Beneficiary:</strong> Evenmore Medical Systems Private Limited</p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">{formatCurrency(selectedPi.subtotal || 0)}</span>
                  </div>
                  {selectedPi.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono font-semibold">- {formatCurrency(selectedPi.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Taxable Amount:</span>
                    <span className="font-mono">{formatCurrency(selectedPi.taxableAmount || selectedPi.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>CGST + SGST (18% / IGST):</span>
                    <span className="font-mono">{formatCurrency((selectedPi.cgst || 0) + (selectedPi.sgst || 0) + (selectedPi.igst || 0))}</span>
                  </div>
                  {selectedPi.otherCharges !== 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Other Charges (Freight):</span>
                      <span className="font-mono">{formatCurrency(selectedPi.otherCharges || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-300 font-extrabold text-sm text-[#1F2E4A]">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-blue-700">
                      {formatCurrency(selectedPi.grandTotal || selectedPi.total || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* TWO SECTIONS: FORMAL INVOICE & CASH RECEIPT SUMMARY */}
              {(() => {
                const totalPiVal = Number(selectedPi.totalSalesValue || selectedPi.grandTotal || selectedPi.total || 0);
                const formalAmt = Number(selectedPi.formalInvoiceAmount !== undefined ? selectedPi.formalInvoiceAmount : (selectedPi.invoice?.total ?? 0));
                const cashAmt = Number(selectedPi.cashAmount !== undefined ? selectedPi.cashAmount : (selectedPi.cashReceipt?.amount ?? 0));
                const linkedInv = invoices.find((i) => i.proformaInvoiceId === selectedPi.id || i.linkedPi === selectedPi.proformaNumber || (selectedPi.invoiceId && i.id === selectedPi.invoiceId));
                const linkedPmt = paymentIns.find((p) => p.proformaInvoiceId === selectedPi.id || p.proformaInvoiceNumber === selectedPi.proformaNumber || (selectedPi.cashReceiptId && p.id === selectedPi.cashReceiptId));
                const totalAlloc = Math.round((formalAmt + cashAmt) * 100) / 100;
                const unalloc = Math.max(0, Math.round((totalPiVal - totalAlloc) * 100) / 100);

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                          Proforma Split Allocation & Financial Breakdown
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPi.status !== 'Converted' && selectedPi.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleOpenAllocationModal(selectedPi)}
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
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block truncate">Total PI Value</span>
                        <strong className="font-mono text-slate-900 text-xs block font-bold">{formatCurrency(totalPiVal)}</strong>
                        <span className="text-[9px] text-slate-400 block">Gross Commercial</span>
                      </div>
                      <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200">
                        <span className="text-[10px] text-blue-800 uppercase font-semibold block truncate">Formal Invoice</span>
                        <strong className="font-mono text-blue-900 text-xs block font-bold">{formatCurrency(formalAmt)}</strong>
                        <span className="text-[9px] text-blue-700 block">
                          {totalPiVal > 0 ? `${Math.round((formalAmt / totalPiVal) * 100)}% Billed` : '0%'}
                        </span>
                      </div>
                      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-800 uppercase font-semibold block truncate">Cash Receipt</span>
                        <strong className="font-mono text-amber-900 text-xs block font-bold">{formatCurrency(cashAmt)}</strong>
                        <span className="text-[9px] text-amber-700 block">
                          {totalPiVal > 0 ? `${Math.round((cashAmt / totalPiVal) * 100)}% Cash` : '0%'}
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
                                setSelectedPi(null);
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
                              <span className="block text-[10px] text-slate-400">Formal invoice has not yet been generated for this proforma.</span>
                            </p>
                            {formalAmt > 0 && selectedPi.status !== 'Converted' && selectedPi.status !== 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleDirectConvertToInvoice(selectedPi);
                                  setSelectedPi(null);
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
                                  invoiceNumber: selectedPi.proformaNumber,
                                  customer: selectedPi.customer,
                                  amount: linkedPmt.amount,
                                  date: formatDateDDMMYYYY(linkedPmt.date || 'Today'),
                                  paymentMode: linkedPmt.mode || 'Cash',
                                  reference: linkedPmt.reference || linkedPmt.referenceNumber || `CASH-${selectedPi.proformaNumber}`,
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
                              <span className="block text-[10px] text-slate-400">Cash receipt has not yet been collected for this proforma.</span>
                            </p>
                            {cashAmt > 0 && selectedPi.status !== 'Converted' && selectedPi.status !== 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const created = addPaymentIn({
                                    customerId: selectedPi.customerId,
                                    customer: selectedPi.customer,
                                    amount: cashAmt,
                                    mode: 'Cash',
                                    paymentType: 'WITHOUT_BILL',
                                    proformaInvoiceId: selectedPi.id,
                                    proformaInvoiceNumber: selectedPi.proformaNumber,
                                    reference: `CASH-${selectedPi.proformaNumber}`,
                                    notes: `Cash collection against Proforma Invoice ${selectedPi.proformaNumber}`,
                                  });
                                  if (created) {
                                    setActiveReceipt({
                                      receiptNumber: created.receiptNumber || created.paymentNumber || `RCPT-${Date.now().toString().slice(-4)}`,
                                      invoiceNumber: selectedPi.proformaNumber,
                                      customer: selectedPi.customer,
                                      amount: cashAmt,
                                      date: formatDateDDMMYYYY('Today'),
                                      paymentMode: 'Cash',
                                      reference: `CASH-${selectedPi.proformaNumber}`,
                                    });
                                  }
                                }}
                                className="w-full py-1 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                              >
                                <DollarSign size={12}/> Record Cash Collection ({formatCurrency(cashAmt)})
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Notes & Commercial Terms */}
              {selectedPi.notes && (
                <div className="p-3 rounded-xl border border-slate-200 bg-white text-[11px]">
                  <span className="font-bold text-slate-700 block mb-0.5">Commercial Notes:</span>
                  <p className="text-slate-600">{selectedPi.notes}</p>
                </div>
              )}

              {selectedPi.termsAndConditions && (
                <div className="p-3 rounded-xl border border-slate-200 bg-white text-[11px]">
                  <span className="font-bold text-slate-700 block mb-0.5">Terms & Conditions:</span>
                  <p className="text-slate-600 whitespace-pre-line">{selectedPi.termsAndConditions}</p>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 pt-3 border-t border-slate-200 mt-4">
              <span className="text-[11px] text-slate-400">
                Commercial document • Created via Evenmore ERP Unified Platform
              </span>
              <Button variant="outline" onClick={() => setSelectedPi(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Draft Confirmation Modal */}
      {deleteTargetPi && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-4 sm:p-6 text-xs flex flex-col space-y-4 max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 shrink-0 border border-rose-100">
                <Trash2 size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800">Delete Draft Proforma</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Are you sure you want to permanently delete draft proforma{' '}
                  <strong className="text-slate-800 font-mono">{deleteTargetPi.proformaNumber}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-600 text-xs">
              <div className="flex justify-between items-center">
                <span>Customer Account:</span>
                <span className="font-semibold text-slate-800">{deleteTargetPi.customer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>PI Date:</span>
                <span className="font-mono text-slate-700">{formatDateDDMMYYYY(deleteTargetPi.date)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="font-medium text-slate-700">Grand Total:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(deleteTargetPi.grandTotal ?? deleteTargetPi.total ?? 0)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              This action will remove the draft proforma invoice from your register. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDeleteTargetPi(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => {
                  deleteProformaInvoice(deleteTargetPi.id);
                  setDeleteTargetPi(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 size={13} /> Delete Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Executive Proforma Invoice Print Voucher */}
      <PrintProformaInvoiceModal
        isOpen={Boolean(printPiTarget)}
        onClose={() => setPrintPiTarget(null)}
        proforma={printPiTarget}
      />

      {/* ADJUST PROFORMA INVOICE ALLOCATION SPLIT MODAL */}
      {allocationModalPi && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-6 text-xs flex flex-col space-y-4 max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Adjust Proforma Invoice Split</h3>
                  <p className="text-[11px] text-slate-500 font-mono">PI #{allocationModalPi.proformaNumber} • {allocationModalPi.customer}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setAllocationModalPi(null); setAllocErrorMessage(''); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {allocErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{allocErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveAllocation} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Proforma Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
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
                        <span>Exceeds PI Value by {formatCurrency(Math.abs(diff))}</span>
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
                <Button variant="outline" type="button" onClick={() => { setAllocationModalPi(null); setAllocErrorMessage(''); }} disabled={allocSubmitting}>
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={allocSubmitting || (allocModalFormal + allocModalCash > allocModalTotal + 0.01)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {allocSubmitting ? 'Updating...' : 'Save Proforma Split'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Payment Receipt Modal */}
      {activeReceipt && (
        <PaymentReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};
