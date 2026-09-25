import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import {
    Plus, ArrowDownLeft, CreditCard, X, Receipt, DollarSign, CheckCircle2,
    TrendingUp, Printer, Edit, Ban, Eye, FileText, AlertCircle, ShieldAlert,
    Filter, RefreshCw, Calendar, User, Search
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { PaymentReceiptModal } from '../../components/common/PaymentReceiptModal';

const paymentInGuide = {
    title: 'Payment In & Cash Receipts',
    subtitle: 'Dual-stream settlement: With-Bill (GST Invoices) & Without-Bill (Cash Receipts)',
    purpose: 'Record incoming customer payments for billed tax invoices or unbilled cash transactions. With-bill payments settle tax invoice balances and track GST reconciliation. Without-bill cash receipts generate numbered cash receipts (CPR) without affecting GST returns.',
    workflow: [
        'Select Payment Stream (With-Bill / Without-Bill)',
        'Link Invoice (for With-Bill) or Customer (for Cash)',
        'Verify Live Due / Enter Amount',
        'Issue Official Tax Receipt or Cash Payment Receipt'
    ],
    keyTerms: [
        {
            term: 'With-Bill Payment (GST)',
            definition: 'A payment tied directly to an official Sales Invoice. Reduces invoice outstanding and adjusts Accounts Receivable.',
        },
        {
            term: 'Without-Bill / Cash Receipt (CPR)',
            definition: 'Customer payment recorded separately. Generates a Cash Payment Receipt without adding to GST invoice/tax totals.',
        },
        {
            term: 'Invoice Outstanding',
            definition: 'Calculated strictly as Invoice Total minus valid With-Bill Payments.',
        },
        {
            term: 'Cash Desk Settlement',
            definition: 'Direct customer cash-in flow credited to customer ledger and cash account without creating taxable liability.',
        },
    ],
    tips: [
        'Without-Bill Cash payments never alter invoice taxable or GST totals.',
        'Cancelling or voiding a cash receipt automatically restores customer ledger and cash balances.',
    ],
};

export const PaymentInPage = () => {
    const {
        paymentIns = [],
        cashPaymentReceipts = [],
        invoices = [],
        customers = [],
        addPaymentIn,
        cancelPaymentIn,
        cancelCashPaymentReceipt,
        voidCashPaymentReceipt,
        updateCashPaymentReceipt,
        getInvoiceOutstanding,
        formatCurrency,
        formatDateDDMMYYYY,
        getCurrentDateFormatted
    } = useERP();

    // Active tab: 'with-bill' | 'without-bill'
    const [activeTab, setActiveTab] = useState('with-bill');

    // Add Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [paymentType, setPaymentType] = useState('WITH_BILL'); // 'WITH_BILL' | 'WITHOUT_BILL'
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || '');
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
    const [amount, setAmount] = useState(0);
    const [mode, setMode] = useState('Bank Transfer');
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modals for actions
    const [activeReceipt, setActiveReceipt] = useState(null); // Printable receipt modal
    const [viewReceipt, setViewReceipt] = useState(null); // View details modal
    const [editReceipt, setEditReceipt] = useState(null); // Edit modal
    const [editForm, setEditForm] = useState({ description: '', referenceNumber: '', notes: '' });
    const [cancelModalTarget, setCancelModalTarget] = useState(null); // Cancel/Void modal
    const [cancelAction, setCancelAction] = useState('CANCELLED'); // 'CANCELLED' | 'VOIDED'
    const [cancelReason, setCancelReason] = useState('');

    // Filters for Cash Payment Section
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterCustomer, setFilterCustomer] = useState('ALL');
    const [filterMode, setFilterMode] = useState('ALL');
    const [filterDate, setFilterDate] = useState('');
    const [searchReceipt, setSearchReceipt] = useState('');

    // Selected Invoice for With-Bill Modal
    const selectedInv = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
    const selectedOutstanding = selectedInv
        ? getInvoiceOutstanding(selectedInv.id)
        : { balanceDue: 0, paid: 0, total: 0, taxableAmount: 0, gst: 0, paidAgainstInvoice: 0 };

    const handleInvoiceChange = (invId) => {
        setSelectedInvoiceId(invId);
        const inv = invoices.find((i) => i.id === invId);
        if (inv) {
            const out = getInvoiceOutstanding(inv.id);
            setAmount(out.balanceDue > 0 ? out.balanceDue : (inv.grandTotal || inv.total || 0));
        }
    };

    const handleOpenAddModal = (type = null) => {
        const targetType = type || (activeTab === 'without-bill' ? 'WITHOUT_BILL' : 'WITH_BILL');
        setPaymentType(targetType);
        if (targetType === 'WITH_BILL') {
            if (invoices.length > 0) {
                handleInvoiceChange(invoices[0].id);
            }
            setMode('Bank Transfer');
        } else {
            setSelectedCustomerId(customers[0]?.id || '');
            setAmount(0);
            setMode('Cash');
            setDescription('Cash advance / counter settlement');
        }
        setReference('');
        setNotes('');
        setShowAddModal(true);
    };

    const handleRecord = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) {
            alert('Please enter a valid payment amount greater than zero.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (paymentType === 'WITH_BILL') {
                const inv = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
                if (!inv) {
                    alert('Please select an invoice to record this payment against.');
                    return;
                }
                const cust = customers.find((c) => c.name === inv?.customer || c.id === inv?.customerId);
                const created = addPaymentIn({
                    paymentType: 'WITH_BILL',
                    customerId: cust?.id,
                    customer: inv?.customer || cust?.name || 'Walk-in Customer',
                    invoiceId: inv?.id,
                    invoiceNumber: inv?.invoiceNumber || '',
                    date: getCurrentDateFormatted(),
                    mode,
                    amount: numAmount,
                    reference: reference || `REC-${Date.now()}`,
                    description: description || `Payment for Invoice ${inv?.invoiceNumber}`,
                    notes,
                });
                setShowAddModal(false);
                if (created) setActiveReceipt(created);
            } else {
                const cust = customers.find((c) => c.id === selectedCustomerId || c.name === selectedCustomerId) || customers[0];
                const created = addPaymentIn({
                    paymentType: 'WITHOUT_BILL',
                    customerId: cust?.id,
                    customer: cust?.name || 'Cash Customer',
                    date: getCurrentDateFormatted(),
                    mode: mode || 'Cash',
                    amount: numAmount,
                    reference: reference || `CASH-${Date.now()}`,
                    description: description || 'Cash settlement / unbilled payment',
                    notes,
                });
                setShowAddModal(false);
                if (created) setActiveReceipt(created);
            }
        } catch (err) {
            console.error('Error recording payment:', err);
            alert('Failed to record payment: ' + (err.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate Financial KPI Metrics
    const withBillPayments = useMemo(() => {
        return paymentIns.filter((p) => p.paymentType !== 'WITHOUT_BILL');
    }, [paymentIns]);

    const validWithBillPayments = useMemo(() => {
        return withBillPayments.filter((p) => p.status !== 'Cancelled' && p.status !== 'CANCELLED');
    }, [withBillPayments]);

    const totalWithBillCollected = useMemo(() => {
        return validWithBillPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }, [validWithBillPayments]);

    const validCashReceipts = useMemo(() => {
        return cashPaymentReceipts.filter((r) => r.status === 'RECEIVED' || (!r.status && r.status !== 'CANCELLED' && r.status !== 'VOIDED'));
    }, [cashPaymentReceipts]);

    const totalCashCollected = useMemo(() => {
        return validCashReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    }, [validCashReceipts]);

    const grandTotalCollected = totalWithBillCollected + totalCashCollected;

    // Filtered Cash Payment Receipts for the Table
    const filteredCashReceipts = useMemo(() => {
        return cashPaymentReceipts.filter((r) => {
            if (filterStatus !== 'ALL' && (r.status || 'RECEIVED').toUpperCase() !== filterStatus.toUpperCase()) {
                return false;
            }
            if (filterCustomer !== 'ALL') {
                const custMatch = String(r.customer || r.partyName || '').toLowerCase() === filterCustomer.toLowerCase() ||
                    r.customerId === filterCustomer || r.partyId === filterCustomer;
                if (!custMatch) return false;
            }
            if (filterMode !== 'ALL' && String(r.mode || '').toLowerCase() !== filterMode.toLowerCase()) {
                return false;
            }
            if (filterDate && String(r.paymentDate || r.date || '').indexOf(filterDate) === -1) {
                return false;
            }
            if (searchReceipt) {
                const q = searchReceipt.toLowerCase();
                const num = String(r.receiptNumber || r.receipt_number || '').toLowerCase();
                const cust = String(r.customer || r.partyName || '').toLowerCase();
                const ref = String(r.referenceNumber || r.reference || '').toLowerCase();
                const desc = String(r.description || '').toLowerCase();
                if (!num.includes(q) && !cust.includes(q) && !ref.includes(q) && !desc.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [cashPaymentReceipts, filterStatus, filterCustomer, filterMode, filterDate, searchReceipt]);

    // Columns for With-Bill Table
    const withBillColumns = [
        {
            key: 'receiptNumber',
            header: 'Receipt Ref',
            width: '14%',
            render: (p) => (
                <span className="font-mono font-bold text-text flex items-center gap-1.5 whitespace-nowrap">
                    <ArrowDownLeft size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{p.receiptNumber || p.paymentNumber}</span>
                </span>
            ),
        },
        {
            key: 'customer',
            header: 'Customer Account',
            width: '20%',
            render: (p) => <span className="font-bold text-text block">{p.customer}</span>,
        },
        {
            key: 'invoiceNumber',
            header: 'Settled Invoice',
            width: '14%',
            render: (p) => <span className="font-mono font-semibold text-primary whitespace-nowrap">{p.invoiceNumber || '—'}</span>,
        },
        {
            key: 'date',
            header: 'Payment Date',
            width: '12%',
            render: (p) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(p.date)}</span>,
        },
        {
            key: 'mode',
            header: 'Payment Mode',
            align: 'center',
            width: '12%',
            render: (p) => (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-border whitespace-nowrap">
                    <CreditCard size={11} className="text-muted" /> {p.mode}
                </span>
            ),
        },
        {
            key: 'reference',
            header: 'Wire / UTR Ref',
            width: '12%',
            render: (p) => (
                <span className="font-mono text-[11px] text-muted whitespace-nowrap">{p.reference || '—'}</span>
            ),
        },
        {
            key: 'amount',
            header: 'Amount Received',
            align: 'right',
            width: '14%',
            render: (p) => (
                <span className={`font-mono font-bold whitespace-nowrap ${p.status === 'Cancelled' ? 'line-through text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    +{formatCurrency(p.amount ?? 0)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            width: '10%',
            render: (p) => (
                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <button
                        onClick={() => setActiveReceipt(p)}
                        className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 rounded transition"
                        title="Print / View Receipt"
                    >
                        <Printer size={13} />
                    </button>
                    {p.status !== 'Cancelled' && (
                        <button
                            onClick={() => {
                                const reason = prompt('Enter reason for cancelling this payment:');
                                if (reason) cancelPaymentIn(p.id, reason);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Cancel Payment"
                        >
                            <Ban size={13} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    // Columns for Without-Bill Cash Receipts Table
    const cashReceiptColumns = [
        {
            key: 'receiptNumber',
            header: 'Receipt No',
            width: '14%',
            render: (r) => (
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 whitespace-nowrap">
                    <Receipt size={13} className="shrink-0" />
                    <span>{r.receiptNumber || r.receipt_number}</span>
                </span>
            ),
        },
        {
            key: 'paymentDate',
            header: 'Date',
            width: '10%',
            render: (r) => (
                <span className="text-muted font-mono text-[11px] whitespace-nowrap">
                    {formatDateDDMMYYYY(r.paymentDate || r.date)}
                </span>
            ),
        },
        {
            key: 'customer',
            header: 'Customer',
            width: '18%',
            render: (r) => <span className="font-bold text-text block truncate">{r.customer || r.partyName || 'Cash Customer'}</span>,
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            width: '12%',
            render: (r) => (
                <span className={`font-mono font-bold whitespace-nowrap ${r.status === 'CANCELLED' || r.status === 'VOIDED' ? 'line-through text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    +{formatCurrency(r.amount ?? 0)}
                </span>
            ),
        },
        {
            key: 'mode',
            header: 'Mode',
            align: 'center',
            width: '10%',
            render: (r) => (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                    <DollarSign size={11} /> {r.mode || 'Cash'}
                </span>
            ),
        },
        {
            key: 'reference',
            header: 'Reference',
            width: '11%',
            render: (r) => (
                <span className="font-mono text-[11px] text-muted whitespace-nowrap truncate block">
                    {r.referenceNumber || r.reference || '—'}
                </span>
            ),
        },
        {
            key: 'description',
            header: 'Description',
            width: '15%',
            render: (r) => (
                <span className="text-slate-600 text-xs truncate block" title={r.description}>
                    {r.description || 'Unbilled cash transaction'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            align: 'center',
            width: '10%',
            render: (r) => {
                const st = (r.status || 'RECEIVED').toUpperCase();
                if (st === 'CANCELLED') {
                    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">CANCELLED</span>;
                }
                if (st === 'VOIDED') {
                    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-300">VOIDED</span>;
                }
                return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">RECEIVED</span>;
            },
        },
        {
            key: 'createdBy',
            header: 'Created By',
            width: '10%',
            render: (r) => <span className="text-[11px] text-slate-500 font-medium truncate block">{r.createdBy || '—'}</span>,
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            width: '12%',
            render: (r) => {
                const isInactive = r.status === 'CANCELLED' || r.status === 'VOIDED';
                return (
                    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        <button
                            onClick={() => setViewReceipt(r)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                        >
                            <Eye size={13} />
                        </button>
                        <button
                            onClick={() => setActiveReceipt(r)}
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                            title="Print / View Receipt"
                        >
                            <Printer size={13} />
                        </button>
                        {!isInactive && (
                            <>
                                <button
                                    onClick={() => {
                                        setEditReceipt(r);
                                        setEditForm({
                                            description: r.description || '',
                                            referenceNumber: r.referenceNumber || r.reference || '',
                                            notes: r.notes || '',
                                        });
                                    }}
                                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                                    title="Edit Receipt"
                                >
                                    <Edit size={13} />
                                </button>
                                <button
                                    onClick={() => {
                                        setCancelModalTarget(r);
                                        setCancelAction('CANCELLED');
                                        setCancelReason('');
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                    title="Cancel or Void"
                                >
                                    <Ban size={13} />
                                </button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Payment Receipts & Collections"
                subtitle="Dual-stream revenue intake: With-Bill (GST Invoices) and Without-Bill (Cash Payment Receipts)."
                guide={paymentInGuide}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            icon={Receipt}
                            onClick={() => handleOpenAddModal('WITHOUT_BILL')}
                            className="border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
                        >
                            + Cash Receipt
                        </Button>
                        <Button
                            icon={Plus}
                            onClick={() => handleOpenAddModal('WITH_BILL')}
                        >
                            Record Payment In
                        </Button>
                    </div>
                }
            />

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Collections (All)"
                    value={formatCurrency(grandTotalCollected)}
                    icon={DollarSign}
                    highlight
                />
                <StatCard
                    label="With-Bill Payments (GST)"
                    value={formatCurrency(totalWithBillCollected)}
                    icon={FileText}
                    trend={{ positive: true, text: `${validWithBillPayments.length} Invoices Settled` }}
                />
                <StatCard
                    label="Without-Bill Cash (Unbilled)"
                    value={formatCurrency(totalCashCollected)}
                    icon={Receipt}
                    trend={{ positive: true, text: `${validCashReceipts.length} Cash Receipts (CPR)` }}
                />
                <StatCard
                    label="Total Vouchers Issued"
                    value={`${paymentIns.length + cashPaymentReceipts.length}`}
                    icon={CheckCircle2}
                    subtext="Audited & Cleared"
                />
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border bg-card rounded-t-xl px-2 pt-2 gap-2">
                <button
                    onClick={() => setActiveTab('with-bill')}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
                        activeTab === 'with-bill'
                            ? 'border-primary text-primary bg-primary/5 font-extrabold'
                            : 'border-transparent text-muted hover:text-text hover:bg-soft'
                    }`}
                >
                    <FileText size={15} />
                    <span>With-Bill Payments (GST Invoices)</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-primary/10 text-primary rounded-full font-bold">
                        {withBillPayments.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('without-bill')}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
                        activeTab === 'without-bill'
                            ? 'border-amber-600 text-amber-700 bg-amber-50 font-extrabold'
                            : 'border-transparent text-muted hover:text-text hover:bg-soft'
                    }`}
                >
                    <Receipt size={15} />
                    <span>Without-Bill Cash Receipts (CPR)</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-bold">
                        {cashPaymentReceipts.length}
                    </span>
                </button>
            </div>

            {/* TAB CONTENT 1: With-Bill Payments */}
            {activeTab === 'with-bill' && (
                <div className="space-y-4">
                    <DataTable
                        title="With-Bill Invoice Payments"
                        columns={withBillColumns}
                        data={withBillPayments}
                        keyExtractor={(p) => p.id}
                        searchPlaceholder="Search receipt #, customer, or invoice..."
                        searchFilter={(p, term) =>
                            String(p.receiptNumber ?? '').toLowerCase().includes(term) ||
                            String(p.customer ?? '').toLowerCase().includes(term) ||
                            (p.invoiceNumber && String(p.invoiceNumber ?? '').toLowerCase().includes(term)) ||
                            (p.reference && String(p.reference ?? '').toLowerCase().includes(term))
                        }
                    />
                </div>
            )}

            {/* TAB CONTENT 2: Without-Bill Cash Payment Section */}
            {activeTab === 'without-bill' && (
                <div className="space-y-4 bg-card border border-border rounded-xl p-4 shadow-xs">
                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <Filter size={14} className="text-amber-600" />
                            <span>Cash Receipts Filter Bar:</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Customer Filter */}
                            <select
                                value={filterCustomer}
                                onChange={(e) => setFilterCustomer(e.target.value)}
                                className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 text-xs font-medium"
                            >
                                <option value="ALL">All Customers</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>

                            {/* Mode Filter */}
                            <select
                                value={filterMode}
                                onChange={(e) => setFilterMode(e.target.value)}
                                className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 text-xs font-medium"
                            >
                                <option value="ALL">All Payment Modes</option>
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Corporate Card">Corporate Card</option>
                            </select>

                            {/* Status Filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 text-xs font-medium"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="RECEIVED">RECEIVED</option>
                                <option value="CANCELLED">CANCELLED</option>
                                <option value="VOIDED">VOIDED</option>
                            </select>

                            {/* Date Filter */}
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700 text-xs"
                                title="Filter by date"
                            />

                            {(filterStatus !== 'ALL' || filterCustomer !== 'ALL' || filterMode !== 'ALL' || filterDate || searchReceipt) && (
                                <button
                                    onClick={() => {
                                        setFilterStatus('ALL');
                                        setFilterCustomer('ALL');
                                        setFilterMode('ALL');
                                        setFilterDate('');
                                        setSearchReceipt('');
                                    }}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                                >
                                    <RefreshCw size={11} /> Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cash Receipts Table */}
                    <DataTable
                        title="Without-Bill Cash Payment Receipts"
                        columns={cashReceiptColumns}
                        data={filteredCashReceipts}
                        keyExtractor={(r) => r.id || r.receiptNumber}
                        searchPlaceholder="Search receipt #, customer, reference, description..."
                        searchFilter={(r, term) =>
                            String(r.receiptNumber ?? '').toLowerCase().includes(term) ||
                            String(r.customer ?? r.partyName ?? '').toLowerCase().includes(term) ||
                            String(r.referenceNumber ?? r.reference ?? '').toLowerCase().includes(term) ||
                            String(r.description ?? '').toLowerCase().includes(term)
                        }
                    />
                </div>
            )}

            {/* RECORD PAYMENT MODAL (WITH-BILL OR WITHOUT-BILL) */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-6 text-xs max-h-[95vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-base text-slate-900">
                                    {paymentType === 'WITH_BILL' ? 'Record With-Bill Invoice Payment' : 'Record Without-Bill Cash Receipt'}
                                </h3>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Stream Selector Radio/Toggle */}
                        <div className="mt-4 p-1 bg-slate-100 rounded-lg flex gap-1 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setPaymentType('WITH_BILL');
                                    if (invoices.length > 0) handleInvoiceChange(invoices[0].id);
                                }}
                                className={`flex-1 py-1.5 px-3 rounded-md font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                                    paymentType === 'WITH_BILL'
                                        ? 'bg-white text-emerald-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <FileText size={13} />
                                <span>With Bill (GST Invoice)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setPaymentType('WITHOUT_BILL');
                                    setMode('Cash');
                                    setDescription('Cash payment / unbilled counter settlement');
                                }}
                                className={`flex-1 py-1.5 px-3 rounded-md font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                                    paymentType === 'WITHOUT_BILL'
                                        ? 'bg-white text-amber-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Receipt size={13} />
                                <span>Without Bill (Cash Receipt)</span>
                            </button>
                        </div>

                        <form onSubmit={handleRecord} className="space-y-4 mt-4">
                            {/* WITH-BILL SPECIFIC FIELDS */}
                            {paymentType === 'WITH_BILL' ? (
                                <>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Target Sales Invoice *</label>
                                        <select
                                            value={selectedInvoiceId}
                                            onChange={(e) => handleInvoiceChange(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium"
                                        >
                                            {invoices.map((inv) => {
                                                const outstanding = getInvoiceOutstanding(inv.id);
                                                return (
                                                    <option key={inv.id} value={inv.id}>
                                                        {inv.invoiceNumber} - {inv.customer} (Due: {formatCurrency(outstanding.balanceDue)})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    {/* Live Bill Outstanding Summary */}
                                    {selectedInv && (
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Invoice Total:</span>
                                                <span className="font-mono text-slate-800">{formatCurrency(selectedInv.grandTotal || selectedInv.total || 0)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500">
                                                <span>Taxable Amount / GST:</span>
                                                <span className="font-mono">
                                                    {formatCurrency(selectedOutstanding.taxableAmount)} / {formatCurrency(selectedOutstanding.gst)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Paid Against Invoice:</span>
                                                <span className="font-mono text-emerald-700 font-semibold">{formatCurrency(selectedOutstanding.paidAgainstInvoice)}</span>
                                            </div>
                                            <div className="flex justify-between text-amber-700 font-semibold border-t border-slate-200 pt-1.5">
                                                <span>Remaining Invoice Outstanding:</span>
                                                <span className="font-mono font-bold">{formatCurrency(selectedOutstanding.balanceDue)}</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* WITHOUT-BILL SPECIFIC FIELDS */
                                <>
                                    {/* Non-GST Disclaimer Banner */}
                                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
                                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="block text-[10px] uppercase font-bold tracking-wider text-amber-800">Non-GST Cash Receipt (CPR)</strong>
                                            <span>This records an unbilled cash transaction. It generates a numbered Cash Payment Receipt and will <strong>NOT alter invoice GST totals</strong>.</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Customer Account *</label>
                                        <select
                                            value={selectedCustomerId}
                                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium"
                                        >
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} {c.balance ? `(Bal: ${formatCurrency(c.balance)})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Description / Purpose *</label>
                                        <input
                                            type="text"
                                            required
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="e.g. Counter sale advance, unbilled repair settlement"
                                            className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                                        />
                                    </div>
                                </>
                            )}

                            {/* COMMON FIELDS */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Receipt Settlement Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    min="0.01"
                                    max={paymentType === 'WITH_BILL' && selectedOutstanding.balanceDue > 0 ? selectedOutstanding.balanceDue : undefined}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono font-bold text-sm text-slate-900"
                                />
                                {paymentType === 'WITH_BILL' && selectedOutstanding.balanceDue > 0 && Number(amount) > selectedOutstanding.balanceDue + 0.01 && (
                                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                                        ⚠ Overpayment: amount exceeds outstanding invoice balance by {formatCurrency(Number(amount) - selectedOutstanding.balanceDue)}.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                                    <select
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Wire / ACH</option>
                                        <option value="Corporate Card">Corporate Card</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="UPI">UPI / Digital</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Reference / UTR / Memo</label>
                                    <input
                                        type="text"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="UTR / cheque / memo #"
                                        className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Internal Notes (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any internal audit notes..."
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        Number(amount) <= 0 ||
                                        (paymentType === 'WITH_BILL' && Number(amount) > selectedOutstanding.balanceDue + 0.01 && selectedOutstanding.balanceDue > 0)
                                    }
                                    className={`px-4 py-1.5 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        paymentType === 'WITH_BILL'
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : 'bg-amber-600 hover:bg-amber-700'
                                    }`}
                                >
                                    {isSubmitting ? 'Posting...' : paymentType === 'WITH_BILL' ? 'Post Payment & Update Invoice' : 'Generate Cash Receipt (CPR)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW CASH RECEIPT DETAILS MODAL */}
            {viewReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 text-xs max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-amber-600" />
                                <h3 className="font-bold text-base text-slate-900">Cash Payment Receipt Details</h3>
                            </div>
                            <button onClick={() => setViewReceipt(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="py-4 space-y-3">
                            <div className="flex justify-between items-center bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                                <div>
                                    <span className="text-[10px] text-amber-700 uppercase font-bold block">Receipt Number</span>
                                    <strong className="font-mono text-sm text-amber-900">{viewReceipt.receiptNumber || viewReceipt.receipt_number}</strong>
                                </div>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                    viewReceipt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                                    viewReceipt.status === 'VOIDED' ? 'bg-slate-200 text-slate-700' :
                                    'bg-emerald-100 text-emerald-800'
                                }`}>
                                    {viewReceipt.status || 'RECEIVED'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                                <div>
                                    <span className="text-slate-400 text-[10px] block">Customer</span>
                                    <strong className="text-slate-800">{viewReceipt.customer || viewReceipt.partyName}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] block">Payment Date</span>
                                    <strong className="font-mono">{formatDateDDMMYYYY(viewReceipt.paymentDate || viewReceipt.date)}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] block">Amount Received</span>
                                    <strong className="font-mono text-emerald-700 text-sm">{formatCurrency(viewReceipt.amount)}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] block">Payment Mode</span>
                                    <strong className="text-slate-800">{viewReceipt.mode || 'Cash'}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] block">Reference</span>
                                    <span className="font-mono">{viewReceipt.referenceNumber || viewReceipt.reference || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] block">Created By</span>
                                    <span>{viewReceipt.createdBy || '—'}</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-slate-500 font-semibold block mb-0.5">Description / Purpose:</span>
                                <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-800">
                                    {viewReceipt.description || 'No description provided.'}
                                </p>
                            </div>

                            {viewReceipt.notes && (
                                <div>
                                    <span className="text-slate-500 font-semibold block mb-0.5">Internal Notes:</span>
                                    <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-600">
                                        {viewReceipt.notes}
                                    </p>
                                </div>
                            )}

                            {(viewReceipt.status === 'CANCELLED' || viewReceipt.status === 'VOIDED') && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                                    <div className="flex items-center gap-1 font-bold">
                                        <AlertCircle size={13} />
                                        <span>Cancellation / Void Details</span>
                                    </div>
                                    <p className="text-[11px]">Reason: {viewReceipt.cancellationReason || 'No reason provided'}</p>
                                    <p className="text-[10px] text-rose-600">Cancelled At: {viewReceipt.cancelledAt || 'Recorded'}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                            <button
                                onClick={() => {
                                    const r = viewReceipt;
                                    setViewReceipt(null);
                                    setActiveReceipt(r);
                                }}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1"
                            >
                                <Printer size={13} /> Print Receipt
                            </button>
                            <button
                                onClick={() => setViewReceipt(null)}
                                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT CASH RECEIPT MODAL */}
            {editReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 text-xs max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <Edit className="w-5 h-5 text-slate-700" />
                                <h3 className="font-bold text-base text-slate-900">
                                    Edit Receipt {editReceipt.receiptNumber}
                                </h3>
                            </div>
                            <button onClick={() => setEditReceipt(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                updateCashPaymentReceipt(editReceipt.id, {
                                    description: editForm.description,
                                    referenceNumber: editForm.referenceNumber,
                                    reference: editForm.referenceNumber,
                                    notes: editForm.notes,
                                });
                                setEditReceipt(null);
                            }}
                            className="space-y-3 mt-4"
                        >
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Description / Purpose</label>
                                <input
                                    type="text"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Reference Number / Memo</label>
                                <input
                                    type="text"
                                    value={editForm.referenceNumber}
                                    onChange={(e) => setEditForm({ ...editForm, referenceNumber: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                                <textarea
                                    rows={2}
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setEditReceipt(null)}
                                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CANCEL / VOID RECEIPT MODAL */}
            {cancelModalTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 text-xs max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                            <Ban className="w-5 h-5 text-rose-600" />
                            <h3 className="font-bold text-base text-slate-900">
                                Cancel or Void Cash Receipt
                            </h3>
                        </div>

                        <div className="py-3 space-y-3">
                            <p className="text-slate-600">
                                You are about to cancel receipt <strong className="font-mono text-slate-800">{cancelModalTarget.receiptNumber}</strong> ({formatCurrency(cancelModalTarget.amount)}).
                                This will reverse ledger entries and restore customer balance.
                            </p>

                            <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                                    <input
                                        type="radio"
                                        name="cancelType"
                                        checked={cancelAction === 'CANCELLED'}
                                        onChange={() => setCancelAction('CANCELLED')}
                                    />
                                    <span>Cancel Receipt</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                                    <input
                                        type="radio"
                                        name="cancelType"
                                        checked={cancelAction === 'VOIDED'}
                                        onChange={() => setCancelAction('VOIDED')}
                                    />
                                    <span>Void Receipt</span>
                                </label>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Reason for Cancellation / Void *</label>
                                <textarea
                                    rows={2}
                                    required
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Enter audit reason for cancellation..."
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setCancelModalTarget(null)}
                                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
                            >
                                Dismiss
                            </button>
                            <button
                                type="button"
                                disabled={!cancelReason.trim()}
                                onClick={() => {
                                    if (cancelAction === 'VOIDED') {
                                        voidCashPaymentReceipt(cancelModalTarget.id, cancelReason);
                                    } else {
                                        cancelCashPaymentReceipt(cancelModalTarget.id, cancelReason);
                                    }
                                    setCancelModalTarget(null);
                                }}
                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold disabled:opacity-50"
                            >
                                Confirm {cancelAction === 'VOIDED' ? 'Void' : 'Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Official Printable Receipt Modal (Handles both With-Bill and Without-Bill CPR) */}
            <PaymentReceiptModal
                receipt={activeReceipt}
                onClose={() => setActiveReceipt(null)}
            />
        </div>
    );
};

export default PaymentInPage;
