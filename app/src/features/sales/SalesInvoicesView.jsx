import React, { useState } from 'react';
import { Search, CheckCircle2, Receipt, Eye, DollarSign, X, Zap, Printer, Clock, AlertCircle, FileText, Plus } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { StatCard } from '../../components/ui/StatCard';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { DocumentTimeline } from '../../components/common/DocumentTimeline';
import { RelatedDocumentsCard } from '../../components/common/RelatedDocumentsCard';
import { PaymentReceiptModal } from '../../components/common/PaymentReceiptModal';
import { PrintInvoiceModal } from '../../components/common/PrintInvoiceModal';
const invoiceGuide = {
    title: 'Sales Invoices & Receivables',
    subtitle: 'Commercial tax billing, accounts receivable ledger, and payment receipt settlement.',
    purpose: 'A Sales Invoice is the official commercial demand for payment issued to a customer after order confirmation and warehouse dispatch. It posts to Accounts Receivable (AR), computes taxes, tracks remaining balances, and produces official Payment Receipts upon settlement.',
    keyTerms: [
        { term: 'Sales Invoice', definition: 'The commercial billing instrument detailing goods sold, unit prices, applied taxes, and due date.' },
        { term: 'Accounts Receivable (AR)', definition: 'The total unpaid money owed by customers to your company for delivered goods.' },
        { term: 'Payment Due Date / Terms', definition: 'The agreed calendar deadline by which the customer must remit payment (e.g. Net 30 days).' },
        { term: 'Payment Receipt / Voucher', definition: 'An official acknowledgement proving that full or partial payment has been collected and posted to the General Ledger.' },
    ],
    tips: [
        'Use the ⚡ Settle button on unpaid invoices to record payment and generate an official printable receipt voucher in 1 click.',
        'Link an invoice to a Sales Order to pull all verified line items automatically.',
    ],
    workflow: ['Sales Order Dispatched', 'Tax Invoice Issued', 'Payment Received', 'Receipt Voucher Issued', 'AR Balance Cleared'],
};
export const SalesInvoicesView = ({ invoices, onCreateInvoice, searchTerm: globalSearch = '', }) => {
    const { customers, salesOrders, paymentIns, addPaymentIn, getInvoiceOutstanding, deliveryChallans } = useERP();
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [activeReceipt, setActiveReceipt] = useState(null);
    const [printInvoiceTarget, setPrintInvoiceTarget] = useState(null);
    const [payAmount, setPayAmount] = useState(0);
    const [payMode, setPayMode] = useState('Bank Transfer');
    const [payRef, setPayRef] = useState('WIRE-2026');
    // Form state
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
    const [linkedSoId, setLinkedSoId] = useState('None');
    const [invoiceDate, setInvoiceDate] = useState('2026-10-25');
    const [dueDate, setDueDate] = useState('2026-11-25');
    const [notes, setNotes] = useState('');
    const [lineItems, setLineItems] = useState([]);
    const handleQuickSettleAndReceipt = (inv) => {
        const outstanding = getInvoiceOutstanding(inv.id);
        const amountToPay = outstanding.balanceDue > 0 ? outstanding.balanceDue : inv.total;
        const receiptNum = `RCPT-2026-${Date.now().toString().slice(-4)}`;
        addPaymentIn({
            customerId: inv.customerId,
            customer: inv.customer,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            amount: amountToPay,
            mode: 'Bank Wire Direct',
            reference: `AUTO-SETTLE-${inv.invoiceNumber}`,
        });
        setActiveReceipt({
            receiptNumber: receiptNum,
            invoiceNumber: inv.invoiceNumber,
            customer: inv.customer,
            amount: amountToPay,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            paymentMode: 'Bank Wire Direct',
            reference: `WIRE-${Date.now().toString().slice(-6)}`,
        });
    };
    const handleSoSelect = (soId) => {
        setLinkedSoId(soId);
        if (soId !== 'None') {
            const order = salesOrders.find((o) => o.id === soId || o.orderNumber === soId);
            if (order) {
                if (order.customerId)
                    setSelectedCustomerId(order.customerId);
                if (order.items && order.items.length > 0) {
                    setLineItems(order.items);
                }
            }
        }
    };
    const handleSave = (status) => {
        const cust = customers.find((c) => c.id === selectedCustomerId) || customers[0];
        const so = salesOrders.find((o) => o.id === linkedSoId || o.orderNumber === linkedSoId);
        const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || item.qty * item.rate), 0);
        const tax = Math.round(subtotal * 0.08 * 100) / 100;
        const grandTotal = Math.round((subtotal + tax) * 100) / 100;
        const nextNumber = `INV-2026-${String(invoices.length + 101).padStart(3, '0')}`;
        const newInvoice = {
            invoiceNumber: nextNumber,
            customerId: cust?.id,
            customer: cust?.name || 'Acme Corp',
            salesOrderId: so?.id,
            linkedSo: so?.orderNumber || (linkedSoId !== 'None' ? linkedSoId : `SO-2026-${String(invoices.length + 101).padStart(4, '0')}`),
            date: new Date(invoiceDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
            dueDate: new Date(dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
            status: status === 'Paid' ? 'Paid' : status === 'Draft' ? 'Draft' : 'Unpaid',
            items: lineItems.length > 0 ? lineItems : [
                {
                    id: `line-${Date.now()}`,
                    description: 'Standard IT Merchandise Fulfillment',
                    qty: 1,
                    rate: 1000,
                    amount: 1000,
                },
            ],
            subtotal: subtotal > 0 ? subtotal : 1000,
            tax: subtotal > 0 ? tax : 80,
            total: subtotal > 0 ? grandTotal : 1080,
            paidAmount: status === 'Paid' ? (subtotal > 0 ? grandTotal : 1080) : 0,
            notes,
        };
        const created = onCreateInvoice(newInvoice);
        if (status === 'Paid' && created) {
            addPaymentIn({
                customerId: cust?.id,
                customer: cust?.name,
                invoiceId: created.id,
                invoiceNumber: created.invoiceNumber,
                amount: created.total,
                mode: 'Bank Transfer',
                reference: `SETTLE-${created.invoiceNumber}`,
            });
        }
        setLineItems([]);
        setNotes('');
        setShowCreateModal(false);
    };
    const handleRecordPaymentSubmit = (e) => {
        e.preventDefault();
        if (!showPaymentModal || payAmount <= 0)
            return;
        addPaymentIn({
            customerId: showPaymentModal.customerId,
            customer: showPaymentModal.customer,
            invoiceId: showPaymentModal.id,
            invoiceNumber: showPaymentModal.invoiceNumber,
            amount: payAmount,
            mode: payMode,
            reference: payRef || `WIRE-${Date.now()}`,
        });
        const receiptNum = `RCPT-2026-${Date.now().toString().slice(-4)}`;
        setActiveReceipt({
            receiptNumber: receiptNum,
            invoiceNumber: showPaymentModal.invoiceNumber,
            customer: showPaymentModal.customer,
            amount: payAmount,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            paymentMode: payMode,
            reference: payRef || `WIRE-${Date.now()}`,
        });
        setShowPaymentModal(null);
        setPayAmount(0);
    };
    // Filtering
    const effectiveFilter = (filterText || globalSearch).toLowerCase().trim();
    const filteredInvoices = invoices.filter((inv) => {
        if (!effectiveFilter)
            return true;
        return (inv.invoiceNumber.toLowerCase().includes(effectiveFilter) ||
            inv.customer.toLowerCase().includes(effectiveFilter) ||
            (inv.linkedSo && inv.linkedSo.toLowerCase().includes(effectiveFilter)) ||
            inv.status.toLowerCase().includes(effectiveFilter));
    });
    const pageSize = 8;
    const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
    const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Paid':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
            case 'Partially Paid':
                return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
            case 'Unpaid':
                return 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
            case 'Draft':
                return 'bg-gray-100 text-gray-700 border-gray-300 font-medium';
            default:
                return 'bg-gray-50 text-gray-700 border-[#CED4DA]';
        }
    };
    const getInvoiceTimelineSteps = (inv) => {
        const outstanding = getInvoiceOutstanding(inv.id);
        const so = salesOrders.find((o) => o.id === inv.salesOrderId || o.orderNumber === inv.linkedSo);
        const challan = deliveryChallans.find((c) => c.salesOrderId === so?.id || c.salesOrderNumber === so?.orderNumber);
        return [
            {
                label: 'Sales Order',
                docNumber: inv.linkedSo || 'Direct Order',
                status: 'completed',
            },
            {
                label: 'Delivery Challan',
                docNumber: challan?.challanNumber || 'Dispatched',
                status: 'completed',
            },
            {
                label: 'Tax Invoice',
                docNumber: inv.invoiceNumber,
                amount: inv.total,
                date: inv.date,
                status: 'completed',
            },
            {
                label: 'Payment Receipt',
                amount: outstanding.paid,
                status: outstanding.status === 'Paid' ? 'completed' : outstanding.status === 'Partially Paid' ? 'current' : 'pending',
            },
        ];
    };
    const getInvoiceRelatedDocs = (inv) => {
        const docs = [];
        if (inv.linkedSo) {
            const so = salesOrders.find((o) => o.orderNumber === inv.linkedSo || o.id === inv.salesOrderId);
            if (so) {
                docs.push({
                    type: 'Sales Order',
                    number: so.orderNumber,
                    amount: so.amount,
                    date: so.date,
                    status: so.stage,
                });
            }
        }
        const challans = deliveryChallans.filter((c) => c.salesOrderNumber === inv.linkedSo || (inv.salesOrderId && c.salesOrderId === inv.salesOrderId));
        challans.forEach((c) => {
            docs.push({
                type: 'Delivery Challan',
                number: c.challanNumber,
                date: c.date,
                status: c.status,
            });
        });
        const relatedPayments = paymentIns.filter((p) => p.invoiceId === inv.id || p.invoiceNumber === inv.invoiceNumber);
        relatedPayments.forEach((p) => {
            docs.push({
                type: 'Payment',
                number: p.receiptNumber,
                amount: p.amount,
                date: p.date,
                status: 'Paid',
            });
        });
        return docs;
    };
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalBalanceDue = invoices.reduce((sum, inv) => sum + getInvoiceOutstanding(inv.id).balanceDue, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + getInvoiceOutstanding(inv.id).paid, 0);
    const unpaidCount = invoices.filter(inv => getInvoiceOutstanding(inv.id).balanceDue > 0).length;

    return (<div className="flex-1 overflow-y-auto flex flex-col gap-6 font-sans">
      {/* Sales Invoices KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Invoiced Value" value={`$${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} />
        <StatCard label="AR Outstanding Due" value={`$${totalBalanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Clock} trend={{ positive: totalBalanceDue === 0, text: totalBalanceDue > 0 ? `${unpaidCount} unpaid/partial` : 'All settled' }} highlight={totalBalanceDue > 0} />
        <StatCard label="Total Collected" value={`$${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={CheckCircle2} trend={{ positive: true, text: 'Receipts synchronized' }} />
        <StatCard label="Total Invoices" value={`${invoices.length} Invoices`} icon={FileText} subtext={`${unpaidCount} requiring payment`} />
      </div>

      {/* Invoices List Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Table Card Header */}
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white">
          <div>
            <h2 className="text-lg font-bold text-[#1F2E4A]">Sales Invoices & Receivables</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live invoicing status, remaining balances, and multi-mode payment settlements.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input type="text" placeholder="Filter invoice, customer, SO..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs w-64 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"/>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="px-3.5 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0">
              <Plus size={14}/>
              Create Tax Invoice
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold select-none">
                <th className="py-3 px-6 whitespace-nowrap">Invoice #</th>
                <th className="py-3 px-6 whitespace-nowrap">Customer</th>
                <th className="py-3 px-6 whitespace-nowrap">Linked SO</th>
                <th className="py-3 px-6 whitespace-nowrap">Invoice Date</th>
                <th className="py-3 px-6 whitespace-nowrap">Due Date</th>
                <th className="py-3 px-6 whitespace-nowrap">Status</th>
                <th className="py-3 px-6 text-right whitespace-nowrap">Total</th>
                <th className="py-3 px-6 text-right whitespace-nowrap">Balance Due</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedInvoices.length === 0 ? (<tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No sales invoices match the current filter.
                  </td>
                </tr>) : (paginatedInvoices.map((inv) => {
            const outstanding = getInvoiceOutstanding(inv.id);
            return (<tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-2.5 px-6 font-mono font-bold text-blue-600">
                        <button onClick={() => setSelectedInvoice(inv)} className="hover:underline text-left">
                          {inv.invoiceNumber}
                        </button>
                      </td>
                      <td className="py-2.5 px-6 font-semibold text-slate-800">
                        {inv.customer}
                      </td>
                      <td className="py-2.5 px-6 text-slate-500 font-mono text-[11px]">
                        {inv.linkedSo || '-'}
                      </td>
                      <td className="py-2.5 px-6 text-slate-600">{inv.date}</td>
                      <td className="py-2.5 px-6 text-slate-600">{inv.dueDate}</td>
                      <td className="py-2.5 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-[10px] ${getStatusBadge(outstanding.status)}`}>
                          {outstanding.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-6 text-right font-semibold text-slate-900 font-mono">
                        ${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-6 text-right font-mono font-bold">
                        <span className={outstanding.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          ${outstanding.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setSelectedInvoice(inv)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Invoice Details">
                            <Eye className="w-4 h-4"/>
                          </button>
                          <button onClick={() => setPrintInvoiceTarget(inv)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Print Official Tax Invoice">
                            <Printer className="w-4 h-4"/>
                          </button>
                          {outstanding.balanceDue > 0.01 && (<button onClick={() => handleQuickSettleAndReceipt(inv)} className="px-2 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs inline-flex items-center gap-1 transition-colors cursor-pointer" title="1-Click Settle & Print Payment Receipt">
                              <Zap className="w-3 h-3"/> Settle
                            </button>)}
                        </div>
                      </td>
                    </tr>);
        }))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 bg-white">
          <span>
            Showing {Math.min(1, filteredInvoices.length)} to{' '}
            {Math.min(filteredInvoices.length, currentPage * pageSize)} of{' '}
            {filteredInvoices.length} entries
          </span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 text-xs font-medium">
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (<button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`px-3 py-1 border rounded text-xs font-medium ${currentPage === idx + 1
                ? 'bg-[#1F2E4A] text-white border-[#1F2E4A]'
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}>
                {idx + 1}
              </button>))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 text-xs font-medium">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create New Invoice Modal */}
      {showCreateModal && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-[#1F2E4A]">Issue New Commercial Tax Invoice</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Select a customer or link directly to a confirmed Sales Order for automatic pricing calculations.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X size={18}/>
              </button>
            </div>

            <div className="p-2 space-y-5 overflow-y-auto flex-1 my-3 pr-1">
              {/* Top Form Row: Customer, Linked SO, Invoice Date, Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">Customer Account *</label>
                  <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium">
                    {customers.map((c) => (<option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">Linked Sales Order</label>
                  <select value={linkedSoId} onChange={(e) => handleSoSelect(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium">
                    <option value="None">None (Direct Invoicing)</option>
                    {salesOrders.map((so) => (<option key={so.id} value={so.id}>
                        {so.orderNumber} - {so.customer} (${so.amount.toFixed(2)})
                      </option>))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">Invoice Issue Date</label>
                  <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800"/>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-700">Payment Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800"/>
                </div>
              </div>

              {/* Line Items Editor */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Invoice Line Items</label>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="sales"/>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Payment Terms & Commercial Notes
                </label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Standard Net 30 terms. Remit payment to Chase Operating Account..." className="w-full border border-slate-300 rounded-lg p-3 text-xs bg-white h-16 text-slate-800"/>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 -mx-6 -mb-6 px-6 py-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-white transition-colors text-xs cursor-pointer">
                Cancel
              </button>
              <button onClick={() => handleSave('Draft')} className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-white transition-colors text-xs cursor-pointer">
                Save Draft
              </button>
              <button onClick={() => handleSave('Unpaid')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-xs shadow-sm cursor-pointer">
                Issue Invoice (Unpaid)
              </button>
              <button onClick={() => handleSave('Paid')} className="px-5 py-2 bg-[#1F2E4A] hover:bg-[#152036] text-white font-medium rounded-lg transition-colors text-xs shadow-sm flex items-center gap-1.5 cursor-pointer">
                <CheckCircle2 className="w-3.5 h-3.5"/>
                Issue & Record Full Payment
              </button>
            </div>
          </div>
        </div>)}

      {/* Invoice Detail Modal with Document Timeline & Related Docs */}
      {selectedInvoice && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-[#1F2E4A]">{selectedInvoice.invoiceNumber}</h3>
                <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                  {selectedInvoice.customer}
                </span>
                <span className={`px-2 py-0.5 border rounded-full text-[10px] ${getStatusBadge(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPrintInvoiceTarget(selectedInvoice)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Printer size={13}/>
                  Print Official Invoice
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
                  <X size={18}/>
                </button>
              </div>
            </div>

            <div className="space-y-6 mt-4 overflow-y-auto pr-1 flex-1">
              {/* Stepper */}
              <DocumentTimeline steps={getInvoiceTimelineSteps(selectedInvoice)}/>

              {/* Related Docs */}
              <RelatedDocumentsCard documents={getInvoiceRelatedDocs(selectedInvoice)}/>

              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Invoiced Line Items ({selectedInvoice.items?.length || 0})
                </h4>
                <LineItemEditor items={selectedInvoice.items || []} onChange={() => { }} readOnly={true}/>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 px-6 py-3">
              <div className="font-mono text-xs">
                Total: <strong className="text-slate-900">${selectedInvoice.total.toFixed(2)}</strong> | Paid: <strong className="text-emerald-700">${(selectedInvoice.paidAmount || 0).toFixed(2)}</strong>
              </div>
              <div className="flex items-center gap-2">
                {getInvoiceOutstanding(selectedInvoice.id).balanceDue > 0.01 && (<button onClick={() => {
                    setShowPaymentModal(selectedInvoice);
                    setPayAmount(getInvoiceOutstanding(selectedInvoice.id).balanceDue);
                }} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-sm flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5"/> Settle Payment
                  </button>)}
                <button onClick={() => setSelectedInvoice(null)} className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>)}

      {/* Record Payment In Modal */}
      {showPaymentModal && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600"/>
                <h3 className="font-bold text-base text-slate-900">Receive Customer Payment</h3>
              </div>
              <button onClick={() => setShowPaymentModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18}/>
              </button>
            </div>
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800">{showPaymentModal.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice #:</span>
                  <span className="font-mono font-bold text-slate-800">{showPaymentModal.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Total:</span>
                  <span className="font-mono font-bold text-slate-900">${showPaymentModal.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-semibold border-t border-slate-200 pt-1">
                  <span>Balance Due:</span>
                  <span className="font-mono">${getInvoiceOutstanding(showPaymentModal.id).balanceDue.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Receipt Amount ($) *</label>
                <input type="number" step="0.01" min="1" max={getInvoiceOutstanding(showPaymentModal.id).balanceDue} value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} required className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-mono font-bold text-sm"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                  <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800">
                    <option value="Bank Transfer">Bank Transfer / Wire</option>
                    <option value="Corporate Card">Corporate Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Transaction Ref #</label>
                  <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="WIRE-99214" className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-mono"/>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowPaymentModal(null)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-sm">
                  Post Payment & Settle Invoice
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Instant Settle Payment Receipt Modal */}
      <PaymentReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)}/>

      {/* Official Printable Commercial Tax Invoice Document */}
      <PrintInvoiceModal isOpen={Boolean(printInvoiceTarget)} onClose={() => setPrintInvoiceTarget(null)} invoice={printInvoiceTarget} balanceDue={printInvoiceTarget ? getInvoiceOutstanding(printInvoiceTarget.id).balanceDue : 0}/>
    </div>);
};
