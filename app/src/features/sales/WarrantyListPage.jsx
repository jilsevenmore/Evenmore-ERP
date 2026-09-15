import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { ShieldCheck, Award, Eye, Send, Printer, Plus, AlertTriangle, Clock, Ban, CheckCircle2, User, Package, QrCode, FileText } from 'lucide-react';
import { formatDisplayDate, formatWarrantyPeriod, getWarrantyStatusStyle } from '../../utils/warrantyUtils';
import { WarrantyCardModal } from '../../components/common/WarrantyCardModal';
import { CreateWarrantyCardModal } from '../../components/common/CreateWarrantyCardModal';
import { SendChallanModal } from '../../components/common/SendChallanModal';

const warrantyGuide = {
    title: 'Customer Warranty & Guarantee Registry',
    subtitle: 'Manage customer equipment warranty cards, serial guarantees, and delivery consignment attachments.',
    purpose: 'The Customer Warranty Registry tracks all equipment warranty certificates issued to customers upon delivery dispatch. It automatically manages warranty periods, expiry dates, serial number associations, and component-level coverage without requiring manual data duplication.',
    keyTerms: [
        { term: 'Warranty Card', definition: 'The official customer-facing certificate confirming equipment coverage, serial numbers, and validity periods.' },
        { term: 'Coverage Status', definition: 'Real-time coverage state (Active, Expiring Soon, Expired, Pending Activation, or Cancelled) dynamically calculated from dates.' },
        { term: 'Component Warranty', definition: 'Modular sub-assemblies (e.g. motors, sensors, camera heads) that have independent warranty durations distinct from the parent machine.' },
    ],
    tips: [
        'Warranty Cards are auto-populated from Delivery Challan dispatch manifests and linked sales orders.',
        'Editing a warranty card for a specific delivery does not modify the master catalog or serialized inventory rules.',
    ],
    workflow: ['Delivery Challan Dispatched', 'Warranty Card Attached & Verified', 'Card Generated', 'Consignment & Card Sent to Customer'],
};

export const WarrantyListPage = () => {
    const { warranties = [], deliveryChallans = [], cancelWarrantyCard } = useERP();

    const [selectedWarranty, setSelectedWarranty] = useState(null);
    const [editWarrantyChallan, setEditWarrantyChallan] = useState(null);
    const [editingCard, setEditingCard] = useState(null);
    const [sendChallan, setSendChallan] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');

    // Summary counts
    const activeCount = warranties.filter((w) => w.coverageStatus === 'Active' && w.documentStatus !== 'Cancelled').length;
    const expiringSoonCount = warranties.filter((w) => w.coverageStatus === 'Expiring Soon' && w.documentStatus !== 'Cancelled').length;
    const expiredCount = warranties.filter((w) => w.coverageStatus === 'Expired' && w.documentStatus !== 'Cancelled').length;
    const draftCount = warranties.filter((w) => w.documentStatus === 'Draft').length;

    const filteredWarranties = useMemo(() => {
        return warranties.filter((w) => {
            if (statusFilter === 'All') return true;
            if (statusFilter === 'Active') return w.coverageStatus === 'Active' && w.documentStatus !== 'Cancelled';
            if (statusFilter === 'Expiring Soon') return w.coverageStatus === 'Expiring Soon' && w.documentStatus !== 'Cancelled';
            if (statusFilter === 'Expired') return w.coverageStatus === 'Expired' && w.documentStatus !== 'Cancelled';
            if (statusFilter === 'Pending') return w.coverageStatus === 'Pending Activation' && w.documentStatus !== 'Cancelled';
            if (statusFilter === 'Draft') return w.documentStatus === 'Draft';
            if (statusFilter === 'Cancelled') return w.documentStatus === 'Cancelled' || w.coverageStatus === 'Cancelled';
            return true;
        });
    }, [warranties, statusFilter]);

    const columns = [
        {
            key: 'cardNumber',
            header: 'Warranty Card #',
            width: '14%',
            render: (w) => (
                <button
                    onClick={() => setSelectedWarranty(w)}
                    className="font-mono font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer text-left whitespace-nowrap"
                >
                    <Award size={14} className="text-emerald-600 shrink-0" />
                    <span>{w.cardNumber}</span>
                </button>
            ),
        },
        {
            key: 'customerName',
            header: 'Customer / Consignee',
            width: '18%',
            render: (w) => (
                <div>
                    <strong className="text-text block font-bold">{w.customerName}</strong>
                    <span className="font-mono text-[10px] text-muted">{w.customerCode || 'CUST'}</span>
                </div>
            ),
        },
        {
            key: 'product',
            header: 'Covered Machine / Equipment',
            width: '20%',
            render: (w) => {
                const firstItem = (w.items && w.items[0]) || {};
                const otherCount = (w.items?.length || 1) - 1;
                return (
                    <div>
                        <span className="font-semibold text-text block">{firstItem.name || 'Industrial Equipment'}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted font-mono">
                            <span>SKU: {firstItem.sku || 'SKU'}</span>
                            {otherCount > 0 && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 rounded font-bold">
                                    +{otherCount} more
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'serials',
            header: 'Serial Number(s)',
            width: '15%',
            render: (w) => {
                const serials = (w.items || []).flatMap((it) => it.serialNumbers || (it.serialNumber ? [it.serialNumber] : []));
                if (serials.length === 0) {
                    return <span className="text-[11px] text-muted italic">Non-serialized</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {serials.slice(0, 2).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded font-mono text-[10px] font-semibold">
                                {s}
                            </span>
                        ))}
                        {serials.length > 2 && (
                            <span className="text-[10px] font-mono text-muted">+{serials.length - 2}</span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'challanNumber',
            header: 'Delivery Challan',
            width: '12%',
            render: (w) => (
                <div>
                    <span className="font-mono font-bold text-text text-[11px] block">{w.challanNumber}</span>
                    <span className="text-[10px] text-muted">{formatDisplayDate(w.deliveryDate || w.startDate)}</span>
                </div>
            ),
        },
        {
            key: 'expiryDate',
            header: 'Duration / Expiry',
            width: '13%',
            render: (w) => (
                <div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-[11px] block">
                        {formatWarrantyPeriod(w.warrantyPeriod, w.warrantyUnit)}
                    </span>
                    <span className="font-mono text-[10px] text-muted">Exp: {formatDisplayDate(w.expiryDate)}</span>
                </div>
            ),
        },
        {
            key: 'coverageStatus',
            header: 'Coverage Status',
            align: 'center',
            width: '12%',
            render: (w) => {
                const style = getWarrantyStatusStyle(w.coverageStatus);
                const isDraft = w.documentStatus === 'Draft';
                return (
                    <div className="space-y-0.5 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                            isDraft ? 'bg-amber-50 text-amber-800 border-amber-200' : style.bg
                        }`}>
                            {isDraft ? 'Draft Certificate' : style.label}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            width: '10%',
            render: (w) => {
                const linkedChallan = deliveryChallans.find((c) => c.id === w.deliveryChallanId || c.challanNumber === w.challanNumber);
                return (
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button
                            onClick={() => setSelectedWarranty(w)}
                            className="p-1 text-slate-500 hover:text-primary hover:bg-slate-100 rounded text-xs flex items-center gap-1 cursor-pointer"
                            title="Preview / Print Certificate"
                        >
                            <Eye size={13} />
                        </button>
                        {linkedChallan && w.documentStatus !== 'Cancelled' && (
                            <button
                                onClick={() => setSendChallan(linkedChallan)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-xs flex items-center gap-1 cursor-pointer"
                                title="Send with Delivery Challan"
                            >
                                <Send size={13} />
                            </button>
                        )}
                        {w.documentStatus === 'Draft' && linkedChallan && (
                            <button
                                onClick={() => {
                                    setEditingCard(w);
                                    setEditWarrantyChallan(linkedChallan);
                                }}
                                className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded text-xs cursor-pointer font-semibold"
                                title="Edit Draft"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Customer Warranty & Equipment Guarantee Registry"
                subtitle="Manage equipment warranty cards, serial number registrations, and multi-document consignment dispatches."
                guide={warrantyGuide}
            />

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                    label="Active Warranties"
                    value={`${activeCount} Cards`}
                    icon={ShieldCheck}
                />
                <StatCard
                    label="Expiring Soon (60 Days)"
                    value={`${expiringSoonCount} Units`}
                    icon={Clock}
                />
                <StatCard
                    label="Expired Warranties"
                    value={`${expiredCount} Cards`}
                    icon={Ban}
                />
                <StatCard
                    label="Draft Certificates"
                    value={`${draftCount} Drafts`}
                    icon={FileText}
                />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {[
                    { id: 'All', label: 'All Warranties', count: warranties.length },
                    { id: 'Active', label: 'Active Coverage', count: activeCount },
                    { id: 'Expiring Soon', label: 'Expiring Soon', count: expiringSoonCount },
                    { id: 'Expired', label: 'Expired', count: expiredCount },
                    { id: 'Draft', label: 'Drafts', count: draftCount },
                    { id: 'Cancelled', label: 'Cancelled / Void', count: warranties.filter((w) => w.documentStatus === 'Cancelled').length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                            statusFilter === tab.id
                                ? 'bg-[#1F2E4A] text-white shadow-2xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                            statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Main Data Table */}
            <DataTable
                title="Customer Equipment Warranty Registry"
                columns={columns}
                data={filteredWarranties}
                keyExtractor={(w) => w.id}
                searchPlaceholder="Search warranty #, customer, serial, or SKU..."
                searchFilter={(w, term) => {
                    const t = term.toLowerCase();
                    const cardMatch = w.cardNumber?.toLowerCase().includes(t);
                    const custMatch = w.customerName?.toLowerCase().includes(t);
                    const dcMatch = w.challanNumber?.toLowerCase().includes(t);
                    const itemMatch = (w.items || []).some(
                        (it) =>
                            it.name?.toLowerCase().includes(t) ||
                            it.sku?.toLowerCase().includes(t) ||
                            (it.serialNumbers && it.serialNumbers.some((s) => s.toLowerCase().includes(t))) ||
                            (it.serialNumber && it.serialNumber.toLowerCase().includes(t))
                    );
                    return cardMatch || custMatch || dcMatch || itemMatch;
                }}
            />

            {/* View / Print Customer Warranty Card Modal */}
            {selectedWarranty && (
                <WarrantyCardModal
                    isOpen={Boolean(selectedWarranty)}
                    onClose={() => setSelectedWarranty(null)}
                    warrantyCard={selectedWarranty}
                    onSend={(wc) => {
                        const linkedC = deliveryChallans.find((c) => c.id === wc.deliveryChallanId || c.challanNumber === wc.challanNumber);
                        if (linkedC) {
                            setSelectedWarranty(null);
                            setSendChallan(linkedC);
                        }
                    }}
                />
            )}

            {/* Edit Draft Warranty Card Modal */}
            {editWarrantyChallan && (
                <CreateWarrantyCardModal
                    isOpen={Boolean(editWarrantyChallan)}
                    onClose={() => {
                        setEditWarrantyChallan(null);
                        setEditingCard(null);
                    }}
                    challan={editWarrantyChallan}
                    existingCard={editingCard}
                    onSuccess={(updated) => {
                        setSelectedWarranty(updated);
                    }}
                />
            )}

            {/* Send Challan & Warranty Modal */}
            {sendChallan && (
                <SendChallanModal
                    isOpen={Boolean(sendChallan)}
                    onClose={() => setSendChallan(null)}
                    challan={sendChallan}
                    warrantyCard={warranties.find((w) => w.deliveryChallanId === sendChallan.id || w.challanNumber === sendChallan.challanNumber)}
                    onPreviewWarranty={() => {
                        const wc = warranties.find((w) => w.deliveryChallanId === sendChallan.id || w.challanNumber === sendChallan.challanNumber);
                        if (wc) setSelectedWarranty(wc);
                    }}
                />
            )}
        </div>
    );
};
