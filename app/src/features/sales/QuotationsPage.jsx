import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Plus, FileText, CheckCircle2, ArrowRight, X, Copy, Eye, Printer } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { AutoPOModal } from '../../components/common/AutoPOModal';
import { PageHeader } from '../../components/common/PageHeader';
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
    const { quotations, customers, addQuotation, convertQuotationToSalesOrder } = useERP();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
    const [validUntil, setValidUntil] = useState('30 Days');
    const [lineItems, setLineItems] = useState([]);
    const [autoPOState, setAutoPOState] = useState({ isOpen: false });
    const navigate = useNavigate();
    const location = useLocation();
    const leadRequest = location.state && location.state.fromLead ? location.state : null;
    const autoOpened = React.useRef(false);

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
    const totalPipeline = quotations.reduce((sum, q) => sum + (q.amount || 0), 0);
    const handleConvert = (quoteId) => {
        convertQuotationToSalesOrder(quoteId);
        navigate('/sales/orders');
    };
    const handleCloneQuote = (q) => {
        setSelectedCustomerId(q.customerId || customers[0]?.id || '');
        setValidUntil('30 Days');
        setLineItems((q.items || []).map((it) => ({
            ...it,
            id: `li-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        })));
        setIsModalOpen(true);
    };
    const columns = [
        {
            header: 'Quote Number',
            accessor: 'quoteNumber',
            render: (q) => (<button onClick={() => setSelectedQuote(q)} className="font-mono font-bold text-blue-600 hover:underline text-left">
          {q.quoteNumber}
        </button>),
        },
        {
            header: 'Customer',
            accessor: 'customer',
            render: (q) => <span className="font-semibold text-slate-900">{q.customer}</span>,
        },
        {
            header: 'Quote Date',
            accessor: 'date',
        },
        {
            header: 'Valid Until',
            accessor: 'validUntil',
        },
        {
            header: 'Estimated Total',
            accessor: 'amount',
            align: 'right',
            render: (q) => (<span className="font-bold font-mono text-slate-900">${q.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>),
        },
        {
            header: 'Lifecycle Status',
            align: 'center',
            render: (q) => <StatusBadge status={q.status}/>,
        },
        {
            header: 'Actions',
            align: 'right',
            render: (q) => (<div className="flex items-center justify-end gap-1.5">
          <button onClick={() => setSelectedQuote(q)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors" title="View & Print Quote">
            <Eye size={13}/>
          </button>
          <button onClick={() => handleCloneQuote(q)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors" title="Clone / Duplicate Quote">
            <Copy size={13}/>
          </button>
          {q.status === 'Confirmed' ? (<button onClick={() => navigate('/sales/orders')} className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer">
              <CheckCircle2 size={12}/> Converted
            </button>) : (<button onClick={() => handleConvert(q.id)} className="text-xs font-semibold text-[#1F2E4A] hover:underline inline-flex items-center gap-1 cursor-pointer">
              Convert to SO <ArrowRight size={12}/>
            </button>)}
        </div>),
        },
    ];
    const handleCreate = (e) => {
        e.preventDefault();
        const cust = customers.find((c) => c.id === selectedCustomerId) || customers[0];
        const computedTotal = lineItems.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0);
        addQuotation({
            customerId: cust?.id,
            customer: cust?.name || 'Acme Corp',
            leadId: leadRequest?.leadId || '',
            leadName: leadRequest?.leadName || '',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            validUntil: validUntil || '30 Days',
            amount: computedTotal > 0 ? computedTotal : 1500,
            status: 'Draft',
            items: lineItems,
        });
        setIsModalOpen(false);
        setLineItems([]);
    };
    return (<div className="space-y-6">
      <PageHeader title="Quotations & Estimates" subtitle="Generate pricing estimates and convert approved quotes directly into confirmed Sales Orders." guide={quotationGuide} actions={<Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            New Quotation
          </Button>}/>

      {leadRequest && (
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs">
          <FileText size={15} className="text-blue-600 shrink-0" />
          <span className="text-slate-700">
            Creating quotation for lead <strong className="text-slate-900">{leadRequest.leadName}</strong>
            {leadRequest.company && <span> • {leadRequest.company}</span>}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Quotations" value={quotations.length} icon={FileText}/>
        <StatCard label="Estimated Pipeline Value" value={`$${totalPipeline.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}/>
        <StatCard label="Confirmed Conversion" value={`${quotations.filter((q) => q.status === 'Confirmed' || q.status === 'Invoiced').length} Quotes`} trend={{ positive: true, text: 'Direct SO conversion' }}/>
      </div>

      <DataTable title="Quotation Register" data={quotations} columns={columns} keyExtractor={(q) => q.id} searchPlaceholder="Search quotations..." searchFilter={(q, term) => q.quoteNumber.toLowerCase().includes(term) ||
            q.customer.toLowerCase().includes(term) ||
            q.status.toLowerCase().includes(term)}/>

      {isModalOpen && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">Create Quotation Estimate</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18}/>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer Account *</label>
                  <select required value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-medium">
                    {customers.map((c) => (<option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - Balance: ${c.balance.toFixed(2)}
                      </option>))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Validity Period</label>
                  <input type="text" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} placeholder="e.g. 30 Days or Nov 30, 2026" className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"/>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-2">Quotation Line Items</label>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="sales" onRequestPO={(item, deficitQty) => {
                setAutoPOState({
                    isOpen: true,
                    item,
                    deficitQty,
                });
            }}/>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
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

      {/* Quotation Detail & Printable Voucher Modal */}
      {selectedQuote && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-[#1F2E4A]">{selectedQuote.quoteNumber}</h3>
                <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                  {selectedQuote.customer}
                </span>
                <StatusBadge status={selectedQuote.status}/>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Printer size={13}/>
                  Print Quote
                </button>
                <button onClick={() => setSelectedQuote(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <X size={18}/>
                </button>
              </div>
            </div>

            <div className="space-y-6 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Client Account</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedQuote.customer}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Validity Window</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedQuote.validUntil || '30 Days'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Quoted Line Items ({selectedQuote.items?.length || 0})
                </h4>
                <LineItemEditor items={selectedQuote.items || []} onChange={() => { }} readOnly={true}/>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 px-6 py-3">
              <div className="font-mono text-xs">
                Total Estimate: <strong className="text-slate-900">${(selectedQuote.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex items-center gap-2">
                {selectedQuote.status !== 'Confirmed' && (<Button onClick={() => { handleConvert(selectedQuote.id); setSelectedQuote(null); }}>
                    Convert to Sales Order
                  </Button>)}
                <Button variant="outline" onClick={() => setSelectedQuote(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
};
