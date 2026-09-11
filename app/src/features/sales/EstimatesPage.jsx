import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Plus, FileText, CheckCircle2, ArrowRight, X, Copy, Eye, Printer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { PageHeader } from '../../components/common/PageHeader';
import { useEstimates, addEstimate, updateEstimate } from '../../services/estimateStore';

function logLeadActivity(leadId, title, color) {
    if (!leadId || !title) return;
    try {
        const key = 'evenmore-crm-lead-details-v1';
        const raw = localStorage.getItem(key);
        const all = raw ? JSON.parse(raw) : {};
        const lid = String(leadId);
        const prev = all[lid] && Array.isArray(all[lid].activities) ? all[lid].activities : [];
        all[lid] = {
            ...(all[lid] || {}),
            activities: [{ id: `act-${Date.now()}`, title, time: 'Just now', color: color || '#3b82f6' }, ...prev],
        };
        localStorage.setItem(key, JSON.stringify(all));
    } catch {
        return;
    }
}

const estimateGuide = {
    title: 'Sales Estimates',
    subtitle: 'Pre-quotation cost estimates and 1-click conversion to Quotations.',
    purpose: 'An Estimate is a preliminary, non-binding cost indication shared with a prospect before a formal Quotation. Once the prospect accepts the estimate, it converts directly into a Quotation without re-entering line items.',
    keyTerms: [
        { term: 'Estimate', definition: 'A rough cost indication valid for a short window (e.g. 15 days).' },
        { term: 'Estimate Value', definition: 'The total monetary value of all open estimates awaiting prospect response.' },
        { term: '1-Click Quotation Conversion', definition: 'Automatically converts an accepted estimate into a formal Quotation.' },
    ],
    tips: [
        'Click "Convert to Quotation" to instantly create a formal Quotation from an accepted estimate.',
        'Use the Clone button to duplicate any existing estimate for a quick client variation.',
        'Click the Estimate number to view line item details and print the estimate voucher.',
    ],
    workflow: ['Estimate Created', 'Prospect Review', 'Convert to Quotation', 'Customer Approval', 'Sales Order'],
};

export const EstimatesPage = () => {
    const { customers, addQuotation } = useERP();
    const navigate = useNavigate();
    const location = useLocation();
    const leadRequest = location.state && location.state.fromLead ? location.state : null;
    const autoOpened = React.useRef(false);
    const estimates = useEstimates();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
    const [validUntil, setValidUntil] = useState('15 Days');
    const [lineItems, setLineItems] = useState([]);

    React.useEffect(() => {
        if (!leadRequest || autoOpened.current) return;
        autoOpened.current = true;
        const match = customers.find((c) => c.name === leadRequest.company) || customers[0];
        if (match) setSelectedCustomerId(match.id);
        if (Array.isArray(leadRequest.items) && leadRequest.items.length > 0) {
            setLineItems(leadRequest.items.map((it, i) => ({
                id: `li-${Date.now()}-${i}`,
                description: it.name,
                qty: 1,
                rate: it.rate || 0,
                amount: it.rate || 0,
            })));
        }
        setIsModalOpen(true);
    }, [leadRequest, customers]);

    const totalValue = estimates
        .filter((e) => e.status !== 'Converted')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const handleConvert = (estimateId) => {
        const estimate = estimates.find((e) => e.id === estimateId);
        if (!estimate) return;
        const cust = customers.find((c) => c.id === estimate.customerId) ||
            customers.find((c) => c.name === estimate.customer) ||
            customers[0];
        addQuotation({
            customerId: cust?.id,
            customer: estimate.customer,
            leadId: estimate.leadId || '',
            leadName: estimate.leadName || '',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            validUntil: '30 Days',
            amount: estimate.amount,
            status: 'Draft',
            items: estimate.items || [],
            notes: `Converted from estimate ${estimate.estimateNumber}`,
        });
        updateEstimate(estimateId, { status: 'Converted' });
        if (estimate.leadId) {
            logLeadActivity(estimate.leadId, `Estimate ${estimate.estimateNumber} converted to quotation`, '#10b981');
        }
        navigate('/sales/quotations');
    };

    const handleClone = (estimate) => {
        setSelectedCustomerId(estimate.customerId || customers[0]?.id || '');
        setValidUntil(estimate.validUntil || '15 Days');
        setLineItems((estimate.items || []).map((it) => ({
            ...it,
            id: `li-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        })));
        setIsModalOpen(true);
    };

    const columns = [
        {
            header: 'Estimate Number',
            accessor: 'estimateNumber',
            render: (e) => (
                <button onClick={() => setSelectedEstimate(e)} className="font-mono font-bold text-blue-600 hover:underline text-left">
                    {e.estimateNumber}
                </button>
            ),
        },
        {
            header: 'Customer',
            accessor: 'customer',
            render: (e) => <span className="font-semibold text-slate-900">{e.customer}</span>,
        },
        { header: 'Estimate Date', accessor: 'date' },
        { header: 'Valid Until', accessor: 'validUntil' },
        {
            header: 'Estimated Total',
            accessor: 'amount',
            align: 'right',
            render: (e) => (
                <span className="font-bold font-mono text-slate-900">
                    ${(e.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            header: 'Status',
            align: 'center',
            render: (e) => <StatusBadge status={e.status} />,
        },
        {
            header: 'Actions',
            align: 'right',
            render: (e) => (
                <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => setSelectedEstimate(e)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors" title="View & Print Estimate">
                        <Eye size={13} />
                    </button>
                    <button onClick={() => handleClone(e)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors" title="Clone / Duplicate Estimate">
                        <Copy size={13} />
                    </button>
                    {e.status === 'Converted' ? (
                        <button onClick={() => navigate('/sales/quotations')} className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer">
                            <CheckCircle2 size={12} /> Converted
                        </button>
                    ) : (
                        <button onClick={() => handleConvert(e.id)} className="text-xs font-semibold text-[#1F2E4A] hover:underline inline-flex items-center gap-1 cursor-pointer">
                            Convert to Quotation <ArrowRight size={12} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const handleCreate = (e) => {
        e.preventDefault();
        const cust = customers.find((c) => c.id === selectedCustomerId) || customers[0];
        const computedTotal = lineItems.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0);
        const next = {
            id: `est-${Date.now()}`,
            estimateNumber: `EST-2026-${String(estimates.length + 3).padStart(3, '0')}`,
            customerId: cust?.id || '',
            customer: cust?.name || 'Acme Corp',
            leadId: leadRequest?.leadId || '',
            leadName: leadRequest?.leadName || '',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            validUntil: validUntil || '15 Days',
            amount: computedTotal > 0 ? computedTotal : 1500,
            status: 'Draft',
            items: lineItems,
        };
        addEstimate(next);
        if (leadRequest?.leadId) {
            logLeadActivity(leadRequest.leadId, `Estimate ${next.estimateNumber} created for ${leadRequest.leadName || 'lead'}`, '#ec4899');
        }
        setIsModalOpen(false);
        setLineItems([]);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Sales Estimates"
                subtitle="Share preliminary cost estimates and convert accepted ones directly into formal Quotations."
                guide={estimateGuide}
                actions={
                    <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
                        New Estimate
                    </Button>
                }
            />

            {leadRequest && (
                <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs">
                    <FileText size={15} className="text-blue-600 shrink-0" />
                    <span className="text-slate-700">
                        Creating estimate for lead <strong className="text-slate-900">{leadRequest.leadName}</strong>
                        {leadRequest.company && <span> • {leadRequest.company}</span>}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Estimates" value={estimates.length} icon={FileText} />
                <StatCard label="Open Estimate Value" value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <StatCard
                    label="Converted to Quotation"
                    value={`${estimates.filter((e) => e.status === 'Converted').length} Estimates`}
                    trend={{ positive: true, text: 'Direct quotation conversion' }}
                />
            </div>

            <DataTable
                title="Estimate Register"
                data={estimates}
                columns={columns}
                keyExtractor={(e) => e.id}
                searchPlaceholder="Search estimates..."
                searchFilter={(e, term) =>
                    e.estimateNumber.toLowerCase().includes(term) ||
                    e.customer.toLowerCase().includes(term) ||
                    e.status.toLowerCase().includes(term)
                }
            />

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="font-bold text-base text-[#1F2E4A]">Create Sales Estimate</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Customer Account *</label>
                                    <select
                                        required
                                        value={selectedCustomerId}
                                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-medium"
                                    >
                                        {customers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.code}) - Balance: ${c.balance.toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Validity Period</label>
                                    <input
                                        type="text"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        placeholder="e.g. 15 Days"
                                        className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-2">Estimate Line Items</label>
                                <LineItemEditor items={lineItems} onChange={setLineItems} type="sales" />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Generate Estimate</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedEstimate && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-lg text-[#1F2E4A]">{selectedEstimate.estimateNumber}</h3>
                                <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                                    {selectedEstimate.customer}
                                </span>
                                <StatusBadge status={selectedEstimate.status} />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Printer size={13} />
                                    Print Estimate
                                </button>
                                <button onClick={() => setSelectedEstimate(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 mt-4 overflow-y-auto pr-1 flex-1">
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Client Account</span>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedEstimate.customer}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Validity Window</span>
                                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedEstimate.validUntil || '15 Days'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                                    Estimated Line Items ({selectedEstimate.items?.length || 0})
                                </h4>
                                <LineItemEditor items={selectedEstimate.items || []} onChange={() => {}} readOnly={true} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 px-6 py-3">
                            <div className="font-mono text-xs">
                                Total Estimate:{' '}
                                <strong className="text-slate-900">
                                    ${(selectedEstimate.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </strong>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedEstimate.status !== 'Converted' && (
                                    <Button
                                        onClick={() => {
                                            handleConvert(selectedEstimate.id);
                                            setSelectedEstimate(null);
                                        }}
                                    >
                                        Convert to Quotation
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => setSelectedEstimate(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EstimatesPage;
