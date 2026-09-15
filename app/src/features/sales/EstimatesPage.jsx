import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Plus, FileText, CheckCircle2, ArrowRight, X, Copy, Eye, Printer, Minimize2, Maximize2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { PageHeader } from '../../components/common/PageHeader';
import { useEstimates, addEstimate, updateEstimate } from '../../services/estimateStore';
import { PrintEstimateModal } from '../../components/common/PrintEstimateModal';

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
    const { customers, addQuotation, formatCurrency, formatDateDDMMYYYY } = useERP();
    const navigate = useNavigate();
    const location = useLocation();
    const leadRequest = location.state && location.state.fromLead ? location.state : null;
    const autoOpened = React.useRef(false);
    const estimates = useEstimates();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState(null);
    const [printEstimateTarget, setPrintEstimateTarget] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
    const [validUntil, setValidUntil] = useState('15 Days');
    const [lineItems, setLineItems] = useState([]);

    const handleOpenCreateModal = () => {
        setSelectedCustomerId(customers[0]?.id || '');
        setValidUntil('15 Days');
        setLineItems([]);
        setIsFullscreen(false);
        setIsModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsModalOpen(false);
        setIsFullscreen(false);
    };

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
        const nextQuote = {
            id: `quo-${Date.now()}`,
            quoteNumber: `QUO-2026-${String(Date.now()).slice(-3)}`,
            estimateRef: estimate.estimateNumber,
            customerId: cust?.id || '',
            customer: cust?.name || estimate.customer || 'Client Account',
            leadId: estimate.leadId || '',
            leadName: estimate.leadName || '',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            validUntil: '30 Days',
            amount: estimate.amount,
            status: 'Draft',
            items: estimate.items || [],
        };
        addQuotation(nextQuote);
        updateEstimate(estimate.id, { status: 'Converted' });
        if (estimate.leadId) {
            logLeadActivity(estimate.leadId, `Estimate ${estimate.estimateNumber} converted to Quotation ${nextQuote.quoteNumber}`, '#10b981');
        }
        navigate('/sales/quotations');
    };

    const handleClone = (estimate) => {
        const cloned = {
            ...estimate,
            id: `est-${Date.now()}`,
            estimateNumber: `EST-2026-${String(estimates.length + 3).padStart(3, '0')}`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'Draft',
        };
        addEstimate(cloned);
    };

    const columns = [
        {
            header: 'Estimate #',
            accessor: 'estimateNumber',
            width: '18%',
            render: (e) => (
                <div>
                    <button
                        onClick={() => setSelectedEstimate(e)}
                        className="font-bold font-mono text-primary hover:underline block text-left cursor-pointer"
                    >
                        {e.estimateNumber}
                    </button>
                    <span className="text-[11px] text-muted">{formatDateDDMMYYYY(e.date)}</span>
                </div>
            ),
        },
        {
            header: 'Customer',
            accessor: 'customer',
            width: '26%',
            render: (e) => (
                <div>
                    <strong className="text-slate-900 dark:text-slate-100 block">{e.customer}</strong>
                    <span className="text-[11px] text-muted">Validity: {e.validUntil || '15 Days'}</span>
                </div>
            ),
        },
        {
            header: 'Items',
            width: '14%',
            render: (e) => (
                <span className="text-xs text-muted">
                    {e.items && e.items.length > 0 ? `${e.items.length} Line Items` : '1 Item'}
                </span>
            ),
        },
        {
            header: 'Estimated Total',
            accessor: 'amount',
            width: '18%',
            render: (e) => (
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(e.amount || 0)}
                </span>
            ),
        },
        {
            header: 'Status',
            accessor: 'status',
            width: '14%',
            render: (e) => <StatusBadge status={e.status} />,
        },
        {
            header: 'Actions',
            width: '10%',
            render: (e) => (
                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedEstimate(e)}
                      className="p-1.5 text-muted hover:text-primary hover:bg-card-hover rounded-lg cursor-pointer transition-colors"
                      title="View Details"
                    >
                        <Eye size={13} />
                    </button>
                    <button
                      onClick={() => setPrintEstimateTarget(e)}
                      className="p-1.5 text-muted hover:text-primary hover:bg-card-hover rounded-lg cursor-pointer transition-colors"
                      title="Print Official Estimate Voucher"
                    >
                        <Printer size={13} />
                    </button>
                    <button
                      onClick={() => handleClone(e)}
                      className="p-1.5 text-muted hover:text-primary hover:bg-card-hover rounded-lg cursor-pointer transition-colors"
                      title="Clone / Duplicate Estimate"
                    >
                        <Copy size={13} />
                    </button>
                    {e.status === 'Converted' ? (
                        <button
                          onClick={() => navigate('/sales/quotations')}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                            <CheckCircle2 size={12} /> Converted
                        </button>
                    ) : (
                        <button
                          onClick={() => handleConvert(e.id)}
                          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                            Convert <ArrowRight size={12} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

    const handleCreate = (e) => {
        e.preventDefault();
        const cust = selectedCustomer || customers[0];
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
                    <Button icon={Plus} onClick={handleOpenCreateModal}>
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
                <StatCard label="Open Estimate Value" value={formatCurrency(totalValue)} />
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
                <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${isFullscreen ? 'p-0' : 'p-4'}`}>
                    <div className={`bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
                        isFullscreen ? 'w-full h-full rounded-none p-8' : 'max-w-5xl w-full rounded-2xl p-6 max-h-[92vh]'
                    } text-xs`}>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="font-bold text-base text-[#1F2E4A]">Create Sales Estimate</h3>
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
                                    <X size={18} />
                                </button>
                            </div>
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
                                <Button variant="outline" type="button" onClick={handleCloseCreateModal}>
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
                                    onClick={() => setPrintEstimateTarget(selectedEstimate)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Printer size={13} />
                                    Print Official Estimate
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

            {/* Official Commercial Sales Estimate Voucher */}
            <PrintEstimateModal
                isOpen={Boolean(printEstimateTarget)}
                onClose={() => setPrintEstimateTarget(null)}
                estimate={printEstimateTarget}
            />
        </div>
    );
};

export default EstimatesPage;
