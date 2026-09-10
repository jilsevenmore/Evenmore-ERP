import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Plus, RotateCcw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { LineItemEditor } from '../../components/common/LineItemEditor';
import { PageHeader } from '../../components/common/PageHeader';
const salesReturnGuide = {
    title: 'Sales Returns & Credit Notes',
    subtitle: 'Customer return processing, credit note issuance, and warehouse restock',
    purpose: 'Use this page to process goods returned by customers. Issuing a Credit Note reduces customer Accounts Receivable (or creates a customer credit balance) and can automatically restock healthy inventory back into warehouse bins.',
    workflow: ['Receive Customer Return', 'Inspect Quality', 'Issue Credit Note', 'Restock / Scrap Item', 'AR Balance Adjusted'],
    keyTerms: [
        {
            term: 'Credit Note / Credit Memo',
            definition: 'A formal accounting document issued by a seller reducing the amount owed by a customer.',
        },
        {
            term: 'Inventory Reversal',
            definition: 'Optionally returning undamaged items directly back into available sellable warehouse inventory.',
        },
        {
            term: 'Scrapped / Damaged Write-Off',
            definition: 'Marking returned items that cannot be resold due to defects or transit damage.',
        },
        {
            term: 'AR Offset',
            definition: 'Applying the credit note amount against the customer’s open or future invoices.',
        },
    ],
    tips: [
        'Enable "Automatically Reintegrate" to immediately restore warehouse stock quantity on return confirmation.',
    ],
};
export const SalesReturnsPage = () => {
    const { salesReturns, addSalesReturn, invoices, customers, formatCurrency, formatDateDDMMYYYY, getCurrentDateFormatted } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || '');
    const [reason, setReason] = useState('Incorrect cable gauge ordered by client');
    const [restocked, setRestocked] = useState(true);
    const [lineItems, setLineItems] = useState([]);
    const handleInvoiceSelect = (invId) => {
        setSelectedInvoiceId(invId);
        const inv = invoices.find((i) => i.id === invId);
        if (inv && inv.items && inv.items.length > 0) {
            setLineItems(inv.items);
        }
    };
    const handleCreate = (e) => {
        e.preventDefault();
        const inv = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
        const cust = customers.find((c) => c.name === inv?.customer || c.id === inv?.customerId);
        const totalAmt = lineItems.reduce((sum, item) => sum + (item.amount || item.qty * item.rate), 0);
        addSalesReturn({
            customerId: cust?.id,
            customer: inv?.customer || cust?.name || 'Cyberdyne Systems',
            invoiceId: inv?.id,
            invoiceRef: inv?.invoiceNumber || 'INV-2026-002',
            date: getCurrentDateFormatted(),
            amount: totalAmt > 0 ? totalAmt : 500,
            reason,
            restocked,
            items: lineItems,
        });
        setShowAddModal(false);
        setLineItems([]);
    };
    const columns = [
        {
            key: 'returnNumber',
            header: 'Return Ref / Credit Note',
            render: (r) => (<span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
          <RotateCcw size={13} className="text-amber-600"/> {r.returnNumber}
        </span>),
        },
        {
            key: 'customer',
            header: 'Customer',
            render: (r) => <span className="font-bold text-[#1F2E4A]">{r.customer}</span>,
        },
        {
            key: 'invoiceRef',
            header: 'Original Invoice',
            render: (r) => <span className="font-mono text-slate-600">{r.invoiceRef}</span>,
        },
        {
            key: 'date',
            header: 'Return Date',
            render: (r) => <span className="text-slate-600">{formatDateDDMMYYYY(r.date)}</span>,
        },
        {
            key: 'reason',
            header: 'Reason for Return',
            render: (r) => <span className="text-slate-700 text-[11px]">{r.reason}</span>,
        },
        {
            key: 'restocked',
            header: 'Inventory Reversal',
            align: 'center',
            render: (r) => r.restocked ? (<span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 size={12}/> Restocked to Bay
          </span>) : (<span className="text-rose-700 font-semibold text-[11px] flex items-center justify-center gap-1 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertCircle size={12}/> Damaged / Scrapped
          </span>),
        },
        {
            key: 'amount',
            header: 'Credit Note Amount',
            align: 'right',
            render: (r) => (<span className="font-mono font-bold text-rose-700">
          -{formatCurrency(r.amount ?? 0)}
        </span>),
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Sales Returns & Credit Notes" subtitle="Customer return documentation, credit note allocations, warehouse restock reintegration, and double-entry ledger adjustments." guide={salesReturnGuide} actions={<Button icon={Plus} onClick={() => {
                if (invoices.length > 0) {
                    handleInvoiceSelect(invoices[0].id);
                }
                setShowAddModal(true);
            }}>
            Issue Credit Note
          </Button>}/>

      <DataTable title="Approved Sales Returns & Credit Notes" columns={columns} data={salesReturns} keyExtractor={(r) => r.id} searchPlaceholder="Search return #, customer, or reason..." searchFilter={(r, term) => r.returnNumber.toLowerCase().includes(term) ||
            r.customer.toLowerCase().includes(term) ||
            (r.invoiceRef && r.invoiceRef.toLowerCase().includes(term)) ||
            r.reason.toLowerCase().includes(term)}/>

      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full p-6 text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#1F2E4A]">
                Issue Sales Credit Note
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Sales Invoice *</label>
                  <select value={selectedInvoiceId} onChange={(e) => handleInvoiceSelect(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                    {invoices.map((inv) => (<option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.customer} (${inv.total.toFixed(2)})
                      </option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Return</label>
                  <input type="text" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Defective hardware, client spec revision..." className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"/>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input type="checkbox" id="restockCheck" checked={restocked} onChange={(e) => setRestocked(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                <label htmlFor="restockCheck" className="font-semibold text-slate-800 cursor-pointer">
                  Automatically Reintegrate Returned Items into Warehouse Stock (+ Available Qty)
                </label>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-2">Returned Line Items</label>
                <LineItemEditor items={lineItems} onChange={setLineItems} type="sales"/>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm">
                  Issue Credit Note & Post Reversal
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
