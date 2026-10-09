import { QuotationWorkflow } from '../../components/common/QuotationWorkflow';
import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Plus, FileText, CheckCircle2, ArrowRight, X, Copy, Eye, Printer, Minimize2, Maximize2, Share2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { AutoPOModal } from '../../components/common/AutoPOModal';
import { PageHeader } from '../../components/common/PageHeader';
import { PrintQuotationModal } from '../../components/common/PrintQuotationModal';
import { isQuotationConvertible } from '../../utils/quotationDocument';
import { sheetAutoDescription } from '../../utils/salesLineMetal';
import { FormSection } from '../../components/common/FormSection';
import { ShareApprovalLinkModal } from './approval/ShareApprovalLinkModal';
import PartySelector from '../../components/common/PartySelector';

// Replaced: moved to components/common/FormSection.jsx so every sales form shares it.
// const FormSection = ({ number, title, hint }) => (
//     <div className="pt-2">
//         <p className="font-mono text-[10px] tracking-[0.2em] text-blue-700 uppercase">{number} · {title}</p>
//         <div className="h-1 w-12 mt-1.5 rounded-full bg-gradient-to-r from-[#1F3A6E] to-[#29A8E0]" />
//         {hint && <p className="text-[11px] text-slate-500 mt-1.5">{hint}</p>}
//     </div>
// );
const quotationGuide = {
    title: 'Quotations & Estimates',
    subtitle: 'Commercial price proposals and direct 1-click conversion to Sales Orders.',
    purpose: 'A Quotation (or Proforma Estimate) is a non-binding price and quantity offer sent to prospective or existing clients. Once the customer approves the quote, it converts directly into a confirmed Sales Order without re-entering line items.',
    keyTerms: [
        { term: 'Quotation / Estimate', definition: 'A proposed pricing estimate valid for a designated duration (e.g. 30 days).' },
        { term: 'Pipeline Value', definition: 'The total monetary value of all active unexpired quotes currently awaiting customer confirmation.' },
        { term: '1-Click SO Conversion', definition: 'Automatically converts approved quote line items into a confirmed Sales Order.' },
    ],
    tips: [
        'Click "Convert to SO" to instantly create a Sales Order and start the warehouse dispatch chain.',
        'Use the 📋 Clone button to duplicate any existing quote for a quick client variation.',
        'Click the Quote number to view line item details and print an official Proforma Quote voucher.',
    ],
    workflow: ['Quotation Created', 'Customer Approval', 'Convert to Sales Order', 'Warehouse Dispatch', 'Invoiced'],
};
export const QuotationsPage = () => {
    const { customers, quotations, addQuotation, convertQuotationToDeliveryChallan, recordQuotationActivity, convertQuotationToSalesOrder, approveQuotation, cancelQuotation, showToast, formatCurrency, formatDateDDMMYYYY } = useERP();
    const navigate = useNavigate();
    const location = useLocation();
    const leadRequest = location.state && (location.state.fromLead || location.state.fromDeal) ? location.state : null;
    const autoOpened = React.useRef(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedQuoteTarget, setSelectedQuote] = useState(null);
    const selectedQuote = quotations.find(q => q.id === selectedQuoteTarget?.id) || selectedQuoteTarget;
    const [printQuotationTarget, setPrintQuotationTarget] = useState(null);
    const [approvalTarget, setApprovalTarget] = useState(null);
    const openedPrintRequest = React.useRef('');
    const [partyData, setPartyData] = useState({
        isOneTimeParty: false,
        customerId: customers[0]?.id || '',
        customer: customers[0]?.name || '',
        partyName: customers[0]?.name || '',
        partyType: 'Customer',
    });
    const [validUntil, setValidUntil] = useState('In 30 days');
    const [quoteDate, setQuoteDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [dealReference, setDealReference] = useState('');
    const [terms, setTerms] = useState('');
    // Quotation-first commercial header (printed on the quotation PDF).
    const [referenceNumber, setReferenceNumber] = useState('');
    const [salesperson, setSalesperson] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [deliveryTerms, setDeliveryTerms] = useState('');
    const [notes, setNotes] = useState('');
    const [authorizedPerson, setAuthorizedPerson] = useState('');
    // Sweven spec §2.1: "line items with tax, discount & freight".
    const [freight, setFreight] = useState('');
    const resetCommercialHeader = (quote = null) => {
        setFreight(quote?.freightCharges ?? quote?.freight ?? '');
        setReferenceNumber(quote?.referenceNumber || '');
        setSalesperson(quote?.salesperson || '');
        setPaymentTerms(quote?.paymentTerms || '');
        setDeliveryTerms(quote?.deliveryTerms || '');
        setNotes(quote?.notes || '');
        setAuthorizedPerson(quote?.authorizedPerson || '');
    };
    const [lineItems, setLineItems] = useState([]);
    const [autoPOState, setAutoPOState] = useState({ isOpen: false, item: null, deficitQty: 0 });

    React.useEffect(() => {
        if (!leadRequest || autoOpened.current) return;
        autoOpened.current = true;
        const match = customers.find((c) => c.id === leadRequest.customerId || c.name === leadRequest.company) || (!leadRequest.fromDeal ? customers[0] : null);
        if (match) {
            setPartyData({
                isOneTimeParty: false,
                customerId: match.id,
                customer: match.name,
                partyName: match.name,
                partyType: match.type || 'Customer',
                partyPhone: match.phone || '',
                partyEmail: match.email || '',
                partyGstin: match.gstin || '',
                placeOfSupply: match.placeOfSupply || '',
            });
        }
        if (leadRequest.fromDeal) setDealReference(leadRequest.dealReference || leadRequest.dealId);
        if (Array.isArray(leadRequest.items) && leadRequest.items.length > 0) {
            setLineItems(leadRequest.items.map((it, i) => ({
                id: `li-${Date.now()}-${i}`,
                description: it.description || it.name,
                qty: it.qty ?? 1,
                rate: it.rate || 0,
                amount: (it.qty ?? 1) * (it.rate || 0),
            })));
        }
        setIsModalOpen(true);
    }, [leadRequest, customers]);
    React.useEffect(() => {
        const quoteId = location.state?.quotationId || new URLSearchParams(location.search).get('quotationId');
        if (quoteId) setSelectedQuote(quotations.find(q => q.id === quoteId) || null);
        const request = `${location.key}:${quoteId}`;
        const quote = quotations.find(q => q.id === quoteId);
        if (quote && new URLSearchParams(location.search).get('print') === 'true' && openedPrintRequest.current !== request) {
            openedPrintRequest.current = request;
            setPrintQuotationTarget(quote);
        }
    }, [location.state, location.search, location.key, quotations]);
    const totalPipeline = quotations.reduce((sum, q) => sum + (q.amount || 0), 0);

    const handleOpenCreateModal = () => {
        setPartyData({
            isOneTimeParty: false,
            customerId: customers[0]?.id || '',
            customer: customers[0]?.name || '',
            partyName: customers[0]?.name || '',
            partyType: 'Customer',
        });
        setValidUntil('In 30 days');
        setQuoteDate(new Date().toLocaleDateString('en-CA'));
        setDealReference('');
        setTerms('');
        resetCommercialHeader();
        setLineItems([]);
        setIsFullscreen(false);
        setIsModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsModalOpen(false);
        setPartyData({
            isOneTimeParty: false,
            customerId: customers[0]?.id || '',
            customer: customers[0]?.name || '',
            partyName: customers[0]?.name || '',
            partyType: 'Customer',
        });
        setValidUntil('In 30 days');
        setQuoteDate(new Date().toLocaleDateString('en-CA'));
        setDealReference('');
        setTerms('');
        resetCommercialHeader();
        setLineItems([]);
        setIsFullscreen(false);
    };

    const handleConvert = (quoteId) => {
        const order = convertQuotationToSalesOrder(quoteId);
        if (order) {
            navigate('/sales/orders');
        }
    };
    const handleCloneQuote = (quote) => {
        // Replaced: setSelectedCustomerId(...) — that setter no longer exists, so Clone threw.
        const match = customers.find((c) => c.id === quote.customerId);
        setPartyData({
            isOneTimeParty: !match,
            customerId: match?.id || '',
            customer: match?.name || quote.customer || '',
            partyName: match?.name || quote.customer || '',
            partyType: match?.type || 'Customer',
            partyPhone: match?.phone || '',
            partyEmail: match?.email || '',
            partyGstin: match?.gstin || '',
            placeOfSupply: match?.placeOfSupply || '',
        });
        setValidUntil(quote.validUntil || 'In 30 days');
        setDealReference(quote.dealReference || '');
        setTerms(quote.termsAndConditions || quote.terms || '');
        resetCommercialHeader(quote);
        setLineItems((quote.items || []).map((it) => ({
            ...it,
            id: `li-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        })));
        setIsFullscreen(false);
        setIsModalOpen(true);
    };
    const columns = [
        {
            header: 'Quote #',
            accessor: 'quoteNumber',
            width: '18%',
            render: (q) => (
              <div>
                <button onClick={() => setSelectedQuote(q)} className="font-bold font-mono text-primary hover:underline block text-left cursor-pointer">
                  {q.quoteNumber}
                </button>
                <span className="text-[11px] text-muted">{formatDateDDMMYYYY(q.date)}</span>
              </div>
            ),
        },
        {
            header: 'Customer',
            accessor: 'customer',
            width: '24%',
            render: (q) => (
              <div>
                <strong className="text-slate-900 dark:text-slate-100 block">{q.customer}</strong>
                <span className="text-[11px] text-muted">Validity: {q.validUntil || '30 Days'}</span>
              </div>
            ),
        },
        {
            header: 'Items',
            width: '14%',
            render: (q) => (
              <span className="text-xs text-muted">
                {q.items && q.items.length > 0 ? `${q.items.length} Line Items` : '1 Item'}
              </span>
            ),
        },
        {
            header: 'Total Value',
            accessor: 'amount',
            align: 'right',
            width: '16%',
            render: (q) => (
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(q.amount || 0)}
              </span>
            ),
        },
        {
            header: 'Status',
            accessor: 'status',
            align: 'center',
            width: '14%',
            render: (q) => <StatusBadge status={q.status}/>,
        },
        {
            header: 'Actions',
            align: 'right',
            width: '14%',
            render: (q) => (
              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                <button
                  onClick={() => setSelectedQuote(q)}
                  className="p-1.5 text-muted hover:text-primary hover:bg-card-hover rounded-lg cursor-pointer transition-colors"
                  title="View Details"
                >
                  <Eye size={13}/>
                </button>
                <button
                  onClick={() => setPrintQuotationTarget(q)}
                  className="p-1.5 text-muted hover:text-primary hover:bg-card-hover rounded-lg cursor-pointer transition-colors"
                  title="Print Official Commercial Quotation"
                >
                  <Printer size={13}/>
                </button>
                <button
                  onClick={() => handleCloneQuote(q)}
                  className="p-1.5 text-muted hover:text-primary hover:bg-card-hover rounded-lg cursor-pointer transition-colors"
                  title="Clone / Duplicate Quote"
                >
                  <Copy size={13}/>
                </button>
                {q.status === 'Confirmed' ? (
                  <button
                    onClick={() => navigate('/sales/orders')}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 size={12}/> Converted
                  </button>
                ) : isQuotationConvertible(q) ? (
                  /* Replaced (quotation-first sales): Rejected / Expired / Cancelled
                     quotations are no longer offers, so they get no Convert button.
                     Was: ) : ( <button ...>Convert</button> ) */
                  <button
                    onClick={() => handleConvert(q.id)}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Convert <ArrowRight size={12}/>
                  </button>
                ) : null}
              </div>
            ),
        },
    ];
    const handleCreate = (e) => {
        e.preventDefault();
        // Quotation-first sales: a line is an inventory item or a custom /
        // service line named by its description. The empty placeholder row is
        // dropped; a priced line with no item and no description is refused.
        const quoteLines = lineItems
            .map((it) => (!it.itemId && !String(it.description || it.name || '').trim() && sheetAutoDescription(it.sheetSpec || {}) && Number(it.rate)
                ? { ...it, description: sheetAutoDescription(it.sheetSpec) } : it))
            .filter((it) => it.itemId || String(it.description || it.name || '').trim() || Number(it.rate));
        if (quoteLines.length === 0) {
            showToast('Add at least one line: an inventory item or a custom / service description.');
            return;
        }
        const unnamed = quoteLines.findIndex((it) => !it.itemId && !String(it.description || it.name || '').trim());
        if (unnamed !== -1) {
            showToast('Line ' + (unnamed + 1) + ' needs a description (or pick an inventory item).');
            return;
        }
        const computedTotal = quoteLines.reduce((acc, it) => acc + (it.amount ?? it.qty * it.rate), 0) + (Number(freight) || 0);
        const partyDisplayName = partyData.partyName || partyData.customer || (partyData.customerId ? customers.find(c => c.id === partyData.customerId)?.name : '') || 'Walk-in Customer';
        addQuotation({
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
            leadId: leadRequest?.leadId || '',
            leadName: leadRequest?.leadName || '',
            dealId: leadRequest?.fromDeal ? leadRequest.dealId : undefined,
            date: quoteDate,
            dealReference,
            terms,
            referenceNumber,
            salesperson,
            paymentTerms,
            deliveryTerms,
            notes,
            authorizedPerson,
            freightCharges: freight === '' ? undefined : Number(freight) || 0,
            validUntil: validUntil || '30 Days',
            amount: computedTotal,
            status: 'Draft',
            items: quoteLines,
        });
        handleCloseCreateModal();
    };
    return (<div className="space-y-6">
      <PageHeader title="Quotations & Estimates" subtitle="Generate pricing estimates and convert approved quotes directly into confirmed Sales Orders." guide={quotationGuide} actions={<Button icon={Plus} onClick={handleOpenCreateModal}>
            New Quotation
          </Button>}/>

      {leadRequest && (
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs">
          <FileText size={15} className="text-blue-600 shrink-0" />
          <span className="text-slate-700">
            Creating quotation for {leadRequest.fromDeal ? 'deal' : 'lead'} <strong className="text-slate-900">{leadRequest.fromDeal ? leadRequest.dealReference : leadRequest.leadName}</strong>
            {leadRequest.company && <span> • {leadRequest.company}</span>}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Quotations" value={quotations.length} icon={FileText}/>
        <StatCard label="Estimated Pipeline Value" value={formatCurrency(totalPipeline)}/>
        <StatCard label="Confirmed Conversion" value={`${quotations.filter((q) => q.status === 'Confirmed' || q.status === 'Invoiced').length} Quotes`} trend={{ positive: true, text: 'Direct SO conversion' }}/>
      </div>

      <DataTable title="Quotation Register" data={quotations} columns={columns} keyExtractor={(q) => q.id} searchPlaceholder="Search quotations..." searchFilter={(q, term) => String(q.quoteNumber ?? '').toLowerCase().includes(term) ||
            String(q.customer ?? '').toLowerCase().includes(term) ||
            String(q.status ?? '').toLowerCase().includes(term)}/>

      {isModalOpen && (<div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
          <div className={`bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isFullscreen ? 'w-full h-full rounded-none p-4 sm:p-8' : 'max-w-5xl w-full rounded-2xl p-4 sm:p-6 max-h-[92vh]'
          } text-xs`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Create Quotation Estimate</h3>
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
              <FormSection number="01" title="Customer & quote details" />
              <div className="space-y-3">
                <PartySelector
                  value={partyData}
                  onChange={setPartyData}
                  customers={customers}
                />
                <div className="sm:w-1/2">
                  <label className="font-semibold text-slate-700 block mb-1">Validity Period</label>
                  <input type="text" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} placeholder="e.g. 30 Days or Nov 30, 2026" className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"/>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="font-semibold text-slate-700">Quote Date<input required type="date" value={quoteDate} onChange={event => setQuoteDate(event.target.value)} className="block mt-1 w-full p-2 border border-slate-300 rounded"/></label><label className="font-semibold text-slate-700">Deal Reference (optional)<input value={dealReference} onChange={event => setDealReference(event.target.value)} placeholder="Existing deal reference" className="block mt-1 w-full p-2 border border-slate-300 rounded"/></label></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="font-semibold text-slate-700">Reference No. (optional)<input value={referenceNumber} onChange={event => setReferenceNumber(event.target.value)} placeholder="Customer enquiry / PO reference" className="block mt-1 w-full p-2 border border-slate-300 rounded font-normal"/></label><label className="font-semibold text-slate-700">Salesperson (optional)<input value={salesperson} onChange={event => setSalesperson(event.target.value)} placeholder="Who is handling this quotation" className="block mt-1 w-full p-2 border border-slate-300 rounded font-normal"/></label></div>
              {/* Replaced title: "Machines, spare parts & fabrication". */}
              <FormSection number="02" title="Sheet, plate, sections & fabrication" />
              <div>
                <label className="font-semibold text-slate-700 block mb-2">Quotation Line Items</label>
                {/* Replaced: hint now covers the metal detail row too.
                <p className="text-[11px] text-slate-500 mb-2">Pick an inventory item, or leave the item empty and type a description for a service, fabrication or custom line. Custom lines never enter Inventory.</p> */}
                {/* Replaced hint (compact metal row): "Pick a machine or spare part from inventory, or leave the item empty…" */}
                <p className="text-[11px] text-slate-500 mb-2">Each line has a sheet-metal calculator: choose material, form and finish, enter thickness × width × length (or OD / dia / kg per metre for pipe, bar and sections) and pieces — the weight is worked out, and the line bills by weight (₹/kg) or by piece. Pick an inventory item for stocked material, or leave it empty for cut-to-size, fabrication or service lines — those never enter Inventory.</p>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="sales" allowCustomLines onRequestPO={(item, deficitQty) => {
                setAutoPOState({
                    isOpen: true,
                    item,
                    deficitQty,
                });
            }}/>
              </div>

              <FormSection number="03" title="Commercial terms" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="font-semibold text-slate-700">Payment Terms<input value={paymentTerms} onChange={event => setPaymentTerms(event.target.value)} placeholder="e.g. 50% advance, balance before dispatch" className="block mt-1 w-full p-2 border border-slate-300 rounded font-normal"/></label><label className="font-semibold text-slate-700">Delivery Terms<input value={deliveryTerms} onChange={event => setDeliveryTerms(event.target.value)} placeholder="e.g. Ex-works Surat, 3–4 weeks from PO & advance" className="block mt-1 w-full p-2 border border-slate-300 rounded font-normal"/></label></div>
              <label className="block font-semibold text-slate-700">Notes<textarea rows="2" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Notes printed on the quotation" className="block mt-1 w-full p-2 border border-slate-300 rounded font-normal"/></label>
              <label className="block font-semibold text-slate-700">Terms & Conditions<textarea rows="3" value={terms} onChange={event => setTerms(event.target.value)} placeholder={'e.g. Prices ex-works; GST extra as applicable.\nWeight-based items billed at actual weight (±2% variation).\nTransport, unloading & installation extra unless stated.'} className="block mt-1 w-full p-2 border border-slate-300 rounded font-normal"/></label>
              {/* Replaced: Authorized Person now sits beside Freight under its own section.
              <label className="block font-semibold text-slate-700 sm:w-1/2">Authorized Person<input value={authorizedPerson} onChange={event => setAuthorizedPerson(event.target.value)} placeholder="Name printed above the signature" className="block mt-1 w-full p-2 border border-slate-300 rounded font-normal"/></label> */}
              <label className="block font-semibold text-slate-700 sm:w-1/2">Freight / Transport Charges (₹)<input type="number" min="0" step="0.01" value={freight} onChange={event => setFreight(event.target.value)} placeholder="Leave empty if ex-works / extra at actuals" className="block mt-1 w-full p-2 border border-slate-300 rounded font-normal"/></label>
              <FormSection number="04" title="Authorisation" hint="Printed above the signature on the quotation PDF." />
              <label className="block font-semibold text-slate-700 sm:w-1/2">Authorized Person<input value={authorizedPerson} onChange={event => setAuthorizedPerson(event.target.value)} placeholder="Name printed above the signature" className="block mt-1 w-full p-2 border border-slate-300 rounded font-normal"/></label>
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={handleCloseCreateModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  Generate Quotation
                </Button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Auto-PO Requisition Modal */}
      <AutoPOModal isOpen={autoPOState.isOpen} onClose={() => setAutoPOState({ isOpen: false })} shortageItem={autoPOState.item} requiredDeficitQty={autoPOState.deficitQty} sourceRef={`Quotation Requisition`}/>

      {/* Quotation Detail Modal */}
      {selectedQuote && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-4 sm:p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
            {/* Replaced: single forced row (lg:flex-nowrap) that squeezed the number, customer and button labels onto two lines each. */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-lg leading-tight text-[#1F2E4A] whitespace-nowrap">{selectedQuote.quoteNumber}</h3>
                  <StatusBadge status={selectedQuote.status}/>
                </div>
                <p className="mt-1 text-[13px] font-medium text-slate-500 truncate" title={selectedQuote.customer}>
                  {selectedQuote.customer}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setApprovalTarget(selectedQuote)}
                  className="h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                  title="Send the customer a link to view, comment on and approve or reject this quotation"
                >
                  <Share2 size={13}/>
                  <span className="hidden sm:inline">Share for Approval</span>
                  <span className="sm:hidden">Approval</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintQuotationTarget(selectedQuote)}
                  className="h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <Printer size={13}/>
                  <span className="hidden sm:inline">Print Official Quote</span>
                  <span className="sm:hidden">Print</span>
                </button>
                <button onClick={() => setSelectedQuote(null)} aria-label="Close" className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                  <X size={18}/>
                </button>
              </div>
            </div>

            <div className="space-y-6 mt-4 overflow-y-auto pr-1 flex-1">
              <QuotationWorkflow key={selectedQuote.id} quotation={selectedQuote} initialMode={(location.state?.sendQuotation || new URLSearchParams(location.search).has('send')) ? 'send' : ''} onDownload={() => setPrintQuotationTarget(selectedQuote)} onChallan={() => {
                const challan = convertQuotationToDeliveryChallan(selectedQuote.id);
                if (challan) navigate('/sales/delivery', { state: { challanId: challan.id } });
              }}/>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Client Account</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedQuote.customer}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Validity Window</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedQuote.validUntil || '30 Days'}</p>
                </div>
                {[['Reference No.', selectedQuote.referenceNumber], ['Salesperson', selectedQuote.salesperson], ['Payment Terms', selectedQuote.paymentTerms], ['Delivery Terms', selectedQuote.deliveryTerms], ['Sales Order', (selectedQuote.salesOrders || []).map(o => o.orderNumber).filter(Boolean).join(', ')]].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{label}</span>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Quoted Line Items ({selectedQuote.items?.length || 0})
                </h4>
                <LineItemEditor items={selectedQuote.items || []} onChange={() => { }} readOnly={true} allowCustomLines/>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 px-4 sm:-mx-6 sm:-mb-6 sm:px-6 py-3">
              <div className="leading-tight">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Quotation Total</span>
                <strong className="text-base font-bold text-slate-900 tabular-nums">{formatCurrency(selectedQuote.amount || 0)}</strong>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 [&>button]:whitespace-nowrap">
                {/* Customer approval: recorded here when given by phone, email or in person. */}
                {['Draft', 'Sent', 'Viewed'].includes(selectedQuote.status) && (<Button variant="outline" onClick={() => approveQuotation(selectedQuote.id)}>
                    Mark Customer Approved
                  </Button>)}
                {!['Confirmed', 'Converted', 'Invoiced', 'Cancelled'].includes(selectedQuote.status) && (<Button variant="outline" onClick={() => {
                    const reason = window.prompt('Cancel quotation ' + selectedQuote.quoteNumber + '? Enter a reason (optional):');
                    if (reason !== null) cancelQuotation(selectedQuote.id, reason.trim());
                  }}>
                    Cancel Quotation
                  </Button>)}
                {/* Replaced (quotation-first sales): only a live offer converts. Was:
                    {selectedQuote.status !== 'Confirmed' && (<Button ...>Convert to Sales Order</Button>)} */}
                {isQuotationConvertible(selectedQuote) && (<Button onClick={() => { handleConvert(selectedQuote.id); setSelectedQuote(null); }}>
                    Convert to Sales Order
                  </Button>)}
                <Button variant="outline" onClick={() => setSelectedQuote(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>)}

      {/* Customer approval link (same flow as the PMS design proof link) */}
      <ShareApprovalLinkModal
        isOpen={Boolean(approvalTarget)}
        onClose={() => setApprovalTarget(null)}
        docType="quotation"
        document={approvalTarget && {
          id: approvalTarget.id,
          number: approvalTarget.quoteNumber,
          customerName: approvalTarget.customer,
          total: approvalTarget.amount,
          status: approvalTarget.status,
        }}
      />

      {/* Official Commercial Quotation PDF Voucher */}
      <PrintQuotationModal
        isOpen={Boolean(printQuotationTarget)}
        onClose={() => setPrintQuotationTarget(null)}
        quotation={printQuotationTarget}
        onPrint={() => recordQuotationActivity(printQuotationTarget.id, 'PDF print requested')}
      />
    </div>);
};
