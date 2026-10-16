import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { useCrmStore } from '../../stores/crmStore';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Plus, FileText, CheckCircle2, ArrowRight, X, Copy, Eye, Printer, Minimize2, Maximize2, Share2, Upload, Truck, Edit3, AlertCircle, XCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { PageHeader } from '../../components/common/PageHeader';
import { FormSection } from '../../components/common/FormSection';
import { PrintEstimateModal } from '../../components/common/PrintEstimateModal';
import { ShareApprovalLinkModal } from './approval/ShareApprovalLinkModal';
import { importEstimatesExcel, convertEstimateToChallan, convertEstimateToOrder } from '../../services/upgradeService';
import PartySelector from '../../components/common/PartySelector';


function logLeadActivity(leadId, title, color) {
    if (!leadId || !title) return;
    // The lead timeline is written server-side from the change itself
    // (`GET /crm/leads/{id}/timeline/`), so there is nothing to record here.
}

const estimateGuide = {
    title: 'Sales Estimates',
    subtitle: 'Cost estimates and 1-click conversion to Sales Orders.',
    purpose: 'An Estimate is a preliminary cost indication shared with a prospect. Once accepted, it converts directly into a Sales Order without re-entering line items.',
    keyTerms: [
        { term: 'Estimate', definition: 'A rough cost indication valid for a short window (e.g. 15 days).' },
        { term: 'Estimate Value', definition: 'The total monetary value of all open estimates awaiting prospect response.' },
        { term: '1-Click Sales Order Conversion', definition: 'Automatically converts an accepted estimate into a Sales Order.' },
    ],
    tips: [
        'Click "Convert" to instantly create a Sales Order from an accepted estimate.',
        'Use the Clone button to duplicate any existing estimate for a quick client variation.',
        'Click the Estimate number to view line item details and print the estimate voucher.',
    ],
    workflow: ['Estimate Created', 'Prospect Review', 'Convert to Sales Order', 'Delivery Challan / Invoice'],
};

export const EstimatesPage = () => {
    const {
        estimates = [],
        addEstimate,
        updateEstimate,
        customers = [],
        addSalesOrder,
        salesOrders = [],
        addInventoryItem,
        formatCurrency,
        formatDateDDMMYYYY,
    } = useERP();
    const navigate = useNavigate();
    const location = useLocation();
    // Leads are offered in the Customer Account dropdown alongside customers,
    // read from `/crm/leads/`. Hydration is permission-gated, so a user without
    // CRM access still gets the customers-only list.
    const crmLeads = useCrmStore((s) => s.leads);
    const hydrateCrm = useCrmStore((s) => s.hydrate);
    useEffect(() => { hydrateCrm?.(); }, [hydrateCrm]);
    const leadRequest = location.state && location.state.fromLead ? location.state : null;
    const autoOpened = React.useRef(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState(null);
    const [editingEstimate, setEditingEstimate] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [printEstimateTarget, setPrintEstimateTarget] = useState(null);
    const [approvalTarget, setApprovalTarget] = useState(null);
    const [partyData, setPartyData] = useState({
        isOneTimeParty: false,
        customerId: '',
        customer: '',
        partyName: '',
        partyType: 'Customer',
    });
    const [lineItems, setLineItems] = useState([]);

    const handleOpenCreateModal = () => {
        setEditingEstimate(null);
        setPartyData({
            isOneTimeParty: false,
            customerId: '',
            customer: '',
            partyName: '',
            partyType: 'Customer',
        });
        setLineItems([]);
        setIsFullscreen(false);
        setIsModalOpen(true);
    };

    const handleEdit = (estimate) => {
        setEditingEstimate(estimate);
        const match = customers.find((c) => String(c.id) === String(estimate.customerId));
        setPartyData({
            isOneTimeParty: Boolean(estimate.isOneTimeParty),
            selectedLeadId: estimate.leadId ? String(estimate.leadId) : '',
            customerId: estimate.customerId || '',
            customer: estimate.customer || estimate.partyName || '',
            partyName: estimate.partyName || estimate.customer || '',
            partyType: estimate.partyType || (estimate.isOneTimeParty ? 'Walk-in' : 'Customer'),
            partyPhone: estimate.partyPhone || match?.phone || '',
            partyEmail: estimate.partyEmail || match?.email || '',
            partyGstin: estimate.partyGstin || match?.gstin || '',
            placeOfSupply: estimate.placeOfSupply || match?.placeOfSupply || '',
            billingAddress: estimate.billingAddress || match?.billingAddress || {},
            shippingAddress: estimate.shippingAddress || match?.shippingAddress || {},
        });
        setLineItems(
            Array.isArray(estimate.items) && estimate.items.length > 0
                ? estimate.items.map((it, i) => ({
                    ...it,
                    id: it.id || `li-${Date.now()}-${i}`,
                }))
                : []
        );
        setIsFullscreen(false);
        setIsModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setEditingEstimate(null);
        setIsModalOpen(false);
        setIsFullscreen(false);
    };

    React.useEffect(() => {
        if (!leadRequest || autoOpened.current) return;
        autoOpened.current = true;
        const match = customers.find((c) => c.name === leadRequest.company);
        if (match) {
            setPartyData({
                isOneTimeParty: false,
                selectedLeadId: '',
                customerId: match.id,
                customer: match.name,
                partyName: match.name,
                partyType: match.type || 'Customer',
                partyPhone: match.phone || '',
                partyEmail: match.email || '',
                partyGstin: match.gstin || '',
                placeOfSupply: match.placeOfSupply || '',
            });
        } else if (leadRequest.leadId) {
            // No matching customer: preselect the lead itself so the dropdown
            // shows who this estimate is really for, instead of falling back to
            // whichever customer happens to be first.
            setPartyData({
                isOneTimeParty: false,
                selectedLeadId: String(leadRequest.leadId),
                customerId: '',
                customer: leadRequest.leadName || leadRequest.company || '',
                partyName: leadRequest.leadName || leadRequest.company || '',
                partyType: 'Lead',
                partyPhone: leadRequest.phone || '',
                partyEmail: leadRequest.email || '',
                partyGstin: '',
                placeOfSupply: '',
            });
        }
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

    const isApprovedEstimate = (e) => ['Approved', 'Accepted', 'Converted'].includes(e?.status);
    const isRejectedEstimate = (e) => e?.status === 'Rejected' || e?.status === 'Need Improvement';

    const openEstimates = estimates.filter((e) => !isApprovedEstimate(e) && !isRejectedEstimate(e));
    const totalValue = openEstimates.reduce((sum, e) => sum + (e.amount || 0), 0);
    const convertedEstimates = estimates.filter((e) => e.status === 'Converted');
    const approvedEstimates = estimates.filter((e) => isApprovedEstimate(e));
    const rejectedEstimates = estimates.filter((e) => isRejectedEstimate(e));

    const handleConvert = async (estimateId) => {
        const estimate = estimates.find((e) => e.id === estimateId);
        if (!estimate) return;

        let serverOrder = null;
        try {
            serverOrder = await convertEstimateToOrder(estimate.id);
        } catch (err) {
            // Local fallback handled below
        }

        const nextOrder = {
            id: serverOrder?.id || `so-${Date.now()}`,
            orderNumber: serverOrder?.orderNumber || serverOrder?.order_number || `SO-2026-${String(salesOrders.length + 101).padStart(4, '0')}`,
            estimateRef: estimate.estimateNumber,
            sourceEstimateId: estimate.id,
            sourceEstimateNumber: estimate.estimateNumber,
            isOneTimeParty: Boolean(estimate.isOneTimeParty),
            customerId: estimate.isOneTimeParty ? '' : (estimate.customerId || ''),
            customer: estimate.customer || estimate.partyName || '',
            partyName: estimate.partyName || estimate.customer || '',
            partyType: estimate.partyType || (estimate.isOneTimeParty ? 'Walk-in' : 'Customer'),
            partyPhone: estimate.partyPhone || '',
            partyEmail: estimate.partyEmail || '',
            partyGstin: estimate.partyGstin || '',
            placeOfSupply: estimate.placeOfSupply || '',
            billingAddress: estimate.billingAddress || {},
            shippingAddress: estimate.shippingAddress || {},
            leadId: estimate.leadId || '',
            leadName: estimate.leadName || '',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            deliveryDate: '',
            amount: estimate.amount,
            totalSalesValue: estimate.amount,
            formalInvoiceAmount: estimate.amount,
            cashAmount: 0,
            stage: 'Draft',
            status: 'Draft',
            paymentStatus: 'Unpaid',
            items: (estimate.items || []).map((it, idx) => ({
                ...it,
                id: it.id || `item-${Date.now()}-${idx}`,
                orderedQty: Number(it.qty || it.orderedQty || 1),
                qty: Number(it.qty || it.orderedQty || 1),
                rate: Number(it.rate || 0),
                amount: Number(it.amount || ((it.qty || 1) * (it.rate || 0))),
            })),
        };
        addSalesOrder(nextOrder);
        updateEstimate(estimate.id, { status: 'Converted' });
        if (estimate.leadId) {
            logLeadActivity(estimate.leadId, `Estimate ${estimate.estimateNumber} converted to Sales Order ${nextOrder.orderNumber}`, '#10b981');
        }
        navigate('/sales/orders');
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
            width: '22%',
            render: (e) => (
                <div>
                    <strong className="text-slate-900 dark:text-slate-100 block">{e.customer}</strong>
                    {e.validUntil && <span className="text-[11px] text-muted">Validity: {e.validUntil}</span>}
                    {(e.leadId || e.leadName) && (
                        <button
                          onClick={() => e.leadId && navigate(`/crm/leads/${encodeURIComponent(e.leadId)}`)}
                          className="block text-[11px] font-semibold text-blue-600 hover:underline mt-0.5 cursor-pointer"
                          title="Open linked lead"
                        >
                            Lead: {e.leadName || e.leadId}
                        </button>
                    )}
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
            render: (e) => {
                if (isRejectedEstimate(e)) {
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="badge badge-orange inline-flex items-center gap-1 font-semibold w-fit" title="Client rejected — needs improvement / revision">
                                <AlertCircle size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                Need Improvement
                            </span>
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Rejected by client</span>
                        </div>
                    );
                }
                if (e.status === 'Approved' || e.status === 'Accepted') {
                    return (
                        <span className="badge badge-green inline-flex items-center gap-1 font-semibold" title="Approved by customer">
                            <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                            Approved
                        </span>
                    );
                }
                return <StatusBadge status={e.status} />;
            },
        },
        {
            header: 'Actions',
            width: '10%',
            render: (e) => {
                const approved = isApprovedEstimate(e);
                const rejected = isRejectedEstimate(e);
                return (
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {/* Edit option is removed when estimate is approved / converted; prominent Improve button when rejected */}
                        {!approved && (
                            rejected ? (
                                <button
                                    onClick={() => handleEdit(e)}
                                    className="px-2 py-1 text-xs font-semibold rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                    title="Improve / Revise rejected estimate"
                                >
                                    <Edit3 size={12} />
                                    <span>Improve</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleEdit(e)}
                                    className="p-1.5 text-muted hover:text-primary hover:bg-card-hover rounded-lg cursor-pointer transition-colors"
                                    title="Edit / Update Estimate"
                                >
                                    <Edit3 size={13} />
                                </button>
                            )
                        )}
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
                                onClick={() => navigate('/sales/orders')}
                                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                                <CheckCircle2 size={12} /> Converted
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleConvert(e.id)}
                                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    title="Convert to Sales Order"
                                >
                                    Convert <ArrowRight size={12} />
                                </button>
                                <button
                                    onClick={() => handleConvertToChallan(e)}
                                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    title="1-Step Fast Delivery Challan Conversion"
                                >
                                    <Truck size={12} /> Challan
                                </button>
                            </div>
                        )}
                    </div>
                );
            },
        },
    ];

    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importStatus, setImportStatus] = useState(null);

    const handleConvertToChallan = async (est) => {
        try {
            await convertEstimateToChallan(est.id);
            alert(`Estimate ${est.estimateNumber} successfully converted to Delivery Challan! State moved to Dispatched.`);
            updateEstimate(est.id, { status: 'Converted' });
        } catch (err) {
            alert(`Challan conversion: ${err.message || 'Converted locally.'}`);
            updateEstimate(est.id, { status: 'Converted' });
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) return;
        setImportLoading(true);
        setImportStatus(null);
        try {
            const res = await importEstimatesExcel(importFile);
            setImportStatus({ success: true, message: `Successfully imported ${res?.imported_count || 0} historical estimates!` });
            setTimeout(() => {
                setImportModalOpen(false);
                setImportFile(null);
                setImportStatus(null);
                window.location.reload();
            }, 1500);
        } catch (err) {
            setImportStatus({ success: false, message: err.message || 'Failed to import Excel file.' });
        } finally {
            setImportLoading(false);
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!partyData.isOneTimeParty && !partyData.customerId && !partyData.selectedLeadId) {
            alert('Please select a customer account before generating the estimate.');
            return;
        }

        // Process any new custom product lines marked to be added to inventory
        const finalItems = lineItems.map((it) => {
            if (it.addToInventory && (it.name || it.description) && !it.itemId && addInventoryItem) {
                const prodName = it.name || it.description;
                try {
                    const created = addInventoryItem({
                        name: prodName,
                        sku: it.itemSku || `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
                        description: it.customNotes || it.description || prodName,
                        sellingPrice: Number(it.rate) || 0,
                        costPrice: Math.round((Number(it.rate) || 0) * 0.7),
                        uom: it.uom || 'Nos',
                        salesUnit: it.uom || 'Nos',
                        purchaseUnit: it.uom || 'Nos',
                        taxRate: it.tax !== undefined ? Number(it.tax) : 18,
                        category: 'Custom Products',
                        itemKind: it.lineKind === 'Service' ? 'Service' : 'Standalone',
                        availableQty: 0,
                    });
                    if (created?.id) {
                        return {
                            ...it,
                            itemId: created.id,
                            sku: created.sku,
                            itemSku: created.sku,
                        };
                    }
                } catch (err) {
                    console.error('Error adding custom item to inventory:', err);
                }
            }
            return it;
        });

        const computedTotal = finalItems.reduce((acc, it) => acc + (Number(it.amount) || ((Number(it.qty) || 1) * (Number(it.rate) || 0))), 0);
        const partyDisplayName = partyData.partyName || partyData.customer || (partyData.customerId ? customers.find(c => String(c.id) === String(partyData.customerId))?.name : '') || 'Walk-in Customer';
        // A lead picked from the Customer Account dropdown has no Party row to
        // point at, so the document carries its details and links by id.
        const selectedLeadId = partyData.selectedLeadId || leadRequest?.leadId || '';
        const selectedLeadName = partyData.selectedLeadId ? partyDisplayName : (leadRequest?.leadName || '');

        if (editingEstimate) {
            const wasRejected = isRejectedEstimate(editingEstimate);
            const updates = {
                customerId: partyData.isOneTimeParty ? '' : (partyData.customerId || ''),
                customer: partyDisplayName,
                partyName: partyDisplayName,
                isOneTimeParty: Boolean(partyData.isOneTimeParty),
                partyType: partyData.partyType || (partyData.isOneTimeParty ? 'Walk-in' : 'Customer'),
                partyPhone: partyData.partyPhone || '',
                partyEmail: partyData.partyEmail || '',
                partyGstin: partyData.partyGstin || '',
                placeOfSupply: partyData.placeOfSupply || '',
                billingAddress: partyData.billingAddress || {},
                shippingAddress: partyData.shippingAddress || {},
                leadId: selectedLeadId,
                leadName: selectedLeadName,
                amount: computedTotal,
                items: finalItems,
                status: wasRejected ? 'Draft' : editingEstimate.status,
            };
            updateEstimate(editingEstimate.id, updates);
            if (selectedEstimate && selectedEstimate.id === editingEstimate.id) {
                setSelectedEstimate({ ...selectedEstimate, ...updates });
            }
            setEditingEstimate(null);
            setIsModalOpen(false);
            setLineItems([]);
            if (wasRejected && statusFilter === 'Rejected') {
                setStatusFilter('Draft');
            }
            return;
        }

        const next = {
            id: `est-${Date.now()}`,
            estimateNumber: `EST-2026-${String(estimates.length + 3).padStart(3, '0')}`,
            isOneTimeParty: Boolean(partyData.isOneTimeParty),
            customerId: partyData.isOneTimeParty ? '' : (partyData.customerId || ''),
            customer: partyDisplayName,
            partyName: partyDisplayName,
            partyType: partyData.partyType || (partyData.isOneTimeParty ? 'Walk-in' : 'Customer'),
            partyPhone: partyData.partyPhone || '',
            partyEmail: partyData.partyEmail || '',
            partyGstin: partyData.partyGstin || '',
            placeOfSupply: partyData.placeOfSupply || '',
            billingAddress: partyData.billingAddress || {},
            shippingAddress: partyData.shippingAddress || {},
            leadId: selectedLeadId,
            leadName: selectedLeadName,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            validUntil: '',
            amount: computedTotal,
            status: 'Draft',
            items: finalItems,
        };
        addEstimate(next);
        if (selectedLeadId) {
            logLeadActivity(selectedLeadId, `Estimate ${next.estimateNumber} created for ${selectedLeadName || 'lead'}`, '#ec4899');
        }
        setIsModalOpen(false);
        setLineItems([]);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Sales Estimates"
                subtitle="Share preliminary cost estimates, import historical records, and convert accepted ones directly into Sales Orders or Delivery Challans."
                guide={estimateGuide}
                actions={
                    <div className="flex items-center gap-2">
                        <Button icon={Upload} variant="outline" onClick={() => setImportModalOpen(true)}>
                            Import Historical
                        </Button>
                        <Button icon={Plus} onClick={handleOpenCreateModal}>
                            New Estimate
                        </Button>
                    </div>
                }
            />

            {/* Excel Import Modal */}
            {importModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <Upload size={18} className="text-primary" />
                                <h3 className="font-bold text-foreground">Import Historical Estimates</h3>
                            </div>
                            <button onClick={() => setImportModalOpen(false)} className="text-muted hover:text-foreground cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">
                            Upload an Excel (.xlsx) or CSV file with columns: <strong>customer_name, estimate_number, doc_date, amount, items</strong>. Customer names are automatically deduplicated against your existing party records.
                        </p>
                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                                <input
                                  type="file"
                                  accept=".xlsx,.xls,.csv"
                                  onChange={(e) => setImportFile(e.target.files[0])}
                                  className="block w-full text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white cursor-pointer"
                                  required
                                />
                                {importFile && (
                                    <p className="mt-2 text-xs font-medium text-primary">Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>
                                )}
                            </div>
                            {importStatus && (
                                <div className={`p-3 rounded-lg text-xs font-medium ${importStatus.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                                    {importStatus.message}
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" type="button" onClick={() => setImportModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={importLoading || !importFile}>
                                    {importLoading ? 'Importing...' : 'Upload & Ingest'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {leadRequest && (
                <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs">
                    <FileText size={15} className="text-blue-600 shrink-0" />
                    <span className="text-slate-700">
                        Creating estimate for lead <strong className="text-slate-900">{leadRequest.leadName}</strong>
                        {leadRequest.company && <span> • {leadRequest.company}</span>}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Estimates" value={estimates.length} icon={FileText} />
                <StatCard label="Open Estimate Value" value={formatCurrency(totalValue)} />
                <StatCard
                    label="Converted to Sales Order"
                    value={`${convertedEstimates.length} Estimates`}
                    trend={{ positive: true, text: 'Direct sales order conversion' }}
                />
                <StatCard
                    label="Rejected Estimates"
                    value={`${rejectedEstimates.length} Estimates`}
                    tone={rejectedEstimates.length > 0 ? "rose" : "gray"}
                    icon={XCircle}
                    trend={{ positive: false, text: rejectedEstimates.length > 0 ? 'Requires revision' : 'No rejections' }}
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-border shadow-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                        { key: 'All', label: 'All Estimates', count: estimates.length },
                        { key: 'Draft', label: 'Draft', count: estimates.filter(e => (e.status || 'Draft') === 'Draft').length },
                        { key: 'Sent', label: 'Sent', count: estimates.filter(e => e.status === 'Sent').length },
                        { key: 'Rejected', label: 'Rejected by Client', count: rejectedEstimates.length, isReject: true },
                        { key: 'Converted', label: 'Converted', count: convertedEstimates.length },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                statusFilter === tab.key
                                    ? tab.isReject
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-xs'
                                        : 'bg-primary text-white shadow-xs'
                                    : tab.isReject && tab.count > 0
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                statusFilter === tab.key
                                    ? tab.isReject ? 'bg-rose-200 text-rose-900' : 'bg-white/20 text-white'
                                    : tab.isReject ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
                {statusFilter === 'Rejected' && rejectedEstimates.length > 0 && (
                    <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle size={13} /> Showing estimates rejected by client. Click Edit to revise line items &amp; pricing.
                    </span>
                )}
            </div>

            <DataTable
                title="Estimate Register"
                data={statusFilter === 'All' ? estimates : estimates.filter((e) => (e.status || 'Draft') === statusFilter)}
                columns={columns}
                keyExtractor={(e) => e.id}
                searchPlaceholder="Search estimates..."
                searchFilter={(e, term) =>
                    String(e.estimateNumber ?? '').toLowerCase().includes(term) ||
                    String(e.customer ?? '').toLowerCase().includes(term) ||
                    String(e.leadName ?? '').toLowerCase().includes(term) ||
                    String(e.status ?? '').toLowerCase().includes(term)
                }
            />

            {isModalOpen && (
                <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
                    <div className={`bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
                        isFullscreen ? 'w-full h-full rounded-none p-4 sm:p-8' : 'max-w-5xl w-full rounded-2xl p-4 sm:p-6 max-h-[92vh]'
                    } text-xs`}>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="font-bold text-base text-[#1F2E4A]">
                                {editingEstimate ? `Update Sales Estimate — ${editingEstimate.estimateNumber}` : 'Create Sales Estimate'}
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
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {editingEstimate?.status === 'Rejected' && (
                            <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2.5">
                                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                                <div>
                                    <strong className="block text-xs font-semibold">Revising Rejected Estimate</strong>
                                    <span className="text-[11px] text-rose-600">Updating this estimate will save the revised items and pricing, and reset its status to Draft so you can re-share it with the client for approval.</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
                            <FormSection number="01" title="Customer Details" />
                            <div className="space-y-3">
                                <PartySelector
                                    value={partyData}
                                    onChange={setPartyData}
                                    customers={customers}
                                    leads={crmLeads}
                                />
                            </div>

                            <FormSection number="02" title="Sheet, plate, sections & fabrication" />
                            <div>
                                <label className="font-semibold text-slate-700 block mb-2">Estimate Line Items</label>
                                {/* Metal-industry sales lines: custom / fabrication rows, unit, material, spec, weight (was: no allowCustomLines). */}
                                <LineItemEditor allowCustomLines items={lineItems} onChange={setLineItems} type="sales" />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                                <Button variant="outline" type="button" onClick={handleCloseCreateModal}>
                                    Cancel
                                </Button>
                                <Button type="submit">{editingEstimate ? 'Save & Update Estimate' : 'Generate Estimate'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedEstimate && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-4 sm:p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 pb-3 border-b border-slate-200">
                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-3 min-w-0 lg:min-w-auto">
                                <h3 className="font-bold text-lg text-[#1F2E4A]">{selectedEstimate.estimateNumber}</h3>
                                <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                                    {selectedEstimate.customer}
                                </span>
                                <StatusBadge status={selectedEstimate.status} />
                            </div>
                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = selectedEstimate;
                                        setSelectedEstimate(null);
                                        handleEdit(target);
                                    }}
                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    title="Edit and update this estimate"
                                >
                                    <Edit3 size={13} />
                                    Update Estimate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setApprovalTarget(selectedEstimate)}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    title="Send the customer a link to view, comment on and approve or reject this estimate"
                                >
                                    <Share2 size={13} />
                                    Share for Approval
                                </button>
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
                            {selectedEstimate.status === 'Rejected' && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2.5">
                                        <AlertCircle size={18} className="text-rose-600 shrink-0" />
                                        <div>
                                            <strong className="text-rose-900 block font-semibold">Client Rejected this Estimate</strong>
                                            <span className="text-[11px] text-rose-700">The customer rejected this proposal. Click Update Estimate to revise line items, pricing, or terms.</span>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => { const target = selectedEstimate; setSelectedEstimate(null); handleEdit(target); }}>
                                        Revise &amp; Update
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Client Account</span>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedEstimate.customer}</p>
                                    {(selectedEstimate.leadId || selectedEstimate.leadName) && (
                                        <button
                                          onClick={() => selectedEstimate.leadId && navigate(`/crm/leads/${encodeURIComponent(selectedEstimate.leadId)}`)}
                                          className="text-[11px] font-semibold text-blue-600 hover:underline mt-1 cursor-pointer"
                                        >
                                            Lead: {selectedEstimate.leadName || selectedEstimate.leadId} →
                                        </button>
                                    )}
                                </div>
                                {selectedEstimate.validUntil && (
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Validity Window</span>
                                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedEstimate.validUntil}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                                    Estimated Line Items ({selectedEstimate.items?.length || 0})
                                </h4>
                                {/* Metal-industry sales lines: custom / fabrication rows, unit, material, spec, weight (was: no allowCustomLines). */}
                                <LineItemEditor allowCustomLines items={selectedEstimate.items || []} onChange={() => {}} readOnly={true} />
                            </div>
                        </div>

                        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 pt-4 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 px-4 sm:-mx-6 sm:-mb-6 sm:px-6 py-3">
                            <div className="font-mono text-xs">
                                Total Estimate:{' '}
                                <strong className="text-slate-900">
                                    {formatCurrency(selectedEstimate.amount || 0)}
                                </strong>
                            </div>
                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const target = selectedEstimate;
                                        setSelectedEstimate(null);
                                        handleEdit(target);
                                    }}
                                >
                                    <Edit3 size={13} className="mr-1 inline" /> Update Estimate
                                </Button>
                                {selectedEstimate.status !== 'Converted' && (
                                    <Button
                                        onClick={() => {
                                            handleConvert(selectedEstimate.id);
                                            setSelectedEstimate(null);
                                        }}
                                    >
                                        Convert to Sales Order
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

            {/* Customer approval link (same flow as the PMS design proof link) */}
            <ShareApprovalLinkModal
                isOpen={Boolean(approvalTarget)}
                onClose={() => setApprovalTarget(null)}
                docType="estimate"
                document={approvalTarget && {
                    id: approvalTarget.id,
                    number: approvalTarget.estimateNumber,
                    customerName: approvalTarget.customer,
                    total: approvalTarget.amount,
                    status: approvalTarget.status,
                }}
            />

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
