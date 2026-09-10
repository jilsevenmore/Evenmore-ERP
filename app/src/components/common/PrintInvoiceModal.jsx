import React, { useEffect } from 'react';
import { X, Printer, CheckCircle2, FileText } from 'lucide-react';
export const PrintInvoiceModal = ({ isOpen, onClose, invoice, balanceDue = 0, }) => {
    // UX only: Esc dismisses. No logic changes.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);
    if (!isOpen || !invoice)
        return null;
    const handlePrint = () => {
        window.print();
    };
    const isPaid = invoice.status === 'Paid' || balanceDue <= 0.01;
    const totalAmount = invoice.total || 0;
    const paidAmount = isPaid ? totalAmount : Math.max(0, totalAmount - balanceDue);
    return (<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:static print:bg-white print:backdrop-blur-none">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Top Control Bar (Screen Only) */}
        <div className="bg-[#1F2E4A] text-white px-6 py-3 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-300"/>
            <span className="font-bold text-sm tracking-tight">
              Official Tax Invoice Document — {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
              <Printer size={14}/>
              Print / Save as PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer" title="Close Preview">
              <X size={18}/>
            </button>
          </div>
        </div>

        {/* Real Invoice Sheet (A4 Proportion) */}
        <div className="p-8 sm:p-12 text-slate-800 bg-white font-sans text-xs space-y-6 printable-document">
          {/* Header / Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#1F2E4A] text-white flex items-center justify-center font-bold text-lg font-mono">
                  H
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-[#1F2E4A] tracking-tight uppercase">
                    HORIZON ENTERPRISE LOGISTICS
                  </h1>
                  <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                    Enterprise Commercial Sales & Hardware Supply
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-2">
                <p>742 Industrial Technology Way, Bldg 4 • San Jose, CA 95134</p>
                <p>Tax Registration / GSTIN: US-8849201-CORP</p>
                <p>Remittance Wire Desk: billing@horizon-enterprise.internal | +1 (800) 555-0199</p>
              </div>
            </div>

            {/* Invoice Meta Block */}
            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold font-mono text-xs uppercase tracking-wider rounded">
                COMMERCIAL TAX INVOICE
              </span>
              <div className="pt-2 font-mono">
                <p className="text-lg font-black text-slate-900">{invoice.invoiceNumber}</p>
                <p className="text-xs text-slate-600">
                  Invoice Date: <strong className="text-slate-900">{invoice.date}</strong>
                </p>
                <p className="text-xs text-slate-600">
                  Payment Due: <strong className="text-slate-900">{invoice.dueDate || 'Net 30 Days'}</strong>
                </p>
                <p className="text-xs text-blue-700 font-semibold">
                  Reference: {invoice.salesOrderRef || 'SO-2026-004'}
                </p>
              </div>

              {/* Status Stamp */}
              <div className="pt-1">
                {isPaid ? (<span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border-2 border-emerald-600 px-3 py-0.5 rounded uppercase tracking-wider">
                    <CheckCircle2 size={12}/> PAID IN FULL
                  </span>) : (<span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border-2 border-rose-600 px-3 py-0.5 rounded uppercase tracking-wider">
                    PAYMENT DUE
                  </span>)}
              </div>
            </div>
          </div>

          {/* Two-Column Billing Parties Info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            {/* Seller */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                ISSUED BY (SELLER)
              </span>
              <p className="text-sm font-bold text-slate-900">Horizon Enterprise Logistics LLC</p>
              <p className="text-slate-600 text-[11px]">Enterprise Hardware Fulfillment Division</p>
              <p className="text-slate-500 text-[11px]">Origin Warehouse: Central Bay A-1</p>
            </div>

            {/* Customer */}
            <div className="space-y-1 border-l border-slate-200 pl-6">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                BILLED TO (CLIENT ACCOUNT)
              </span>
              <p className="text-sm font-bold text-slate-900">{invoice.customer}</p>
              <p className="text-slate-600 text-[11px]">Commercial Enterprise Account</p>
              <p className="text-slate-500 text-[11px]">Account ID: CUST-{String(invoice.customer || 'CUS').slice(0, 3).toUpperCase()}-401</p>
              <p className="text-slate-500 text-[11px]">Payment Terms: {invoice.dueDate || 'Net 30 Days'}</p>
            </div>
          </div>

          {/* Itemized Commercial Table */}
          <div className="space-y-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-y-2 border-slate-800 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item SKU & Product Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price ($)</th>
                  <th className="py-2.5 px-3 text-center">Disc %</th>
                  <th className="py-2.5 px-3 text-center">Tax %</th>
                  <th className="py-2.5 px-3 text-right">Amount ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(!invoice.items || invoice.items.length === 0) ? (<tr>
                    <td className="py-2.5 px-3 text-center font-mono">1</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">Commercial Hardware Delivery</p>
                      <p className="text-[10px] text-slate-500 font-mono">SKU-COMM-DELIVERY</p>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold">1</td>
                    <td className="py-2.5 px-3 text-right font-mono">${totalAmount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">0%</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">0%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      ${totalAmount.toFixed(2)}
                    </td>
                  </tr>) : ((invoice?.items || []).map((it, idx) => (<tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{it.description || it.itemSku || 'Part Description'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">SKU: {it.itemSku || `SKU-${idx + 1}`}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">{it.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">${it.rate.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{it.discount || 0}%</td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{it.tax || 0}%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ${(it.amount || it.qty * it.rate).toFixed(2)}
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Payment Remittance */}
          <div className="flex items-start justify-between pt-3 border-t-2 border-slate-800">
            {/* Wire / Bank Instructions */}
            <div className="max-w-xs space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-[10px] uppercase text-slate-600 tracking-wider">
                Bank Remittance & Wire Instructions
              </span>
              <p className="text-[10px] text-slate-600">Bank: Chase Manhattan Operating Desk</p>
              <p className="text-[10px] text-slate-600 font-mono">Account #: 9948-2019-3321 • Routing #: 021000021</p>
              <p className="text-[10px] text-slate-500 italic">Please include Invoice # on wire transfers.</p>
            </div>

            {/* Totals */}
            <div className="w-72 space-y-1.5 font-mono text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Net):</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Sales Tax / VAT (0%):</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                <span>Grand Invoice Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-700">
                <span>Payments Received:</span>
                <span>-${paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t-2 border-slate-900 bg-slate-50 p-1.5 rounded">
                <span>Net Balance Due:</span>
                <span className={balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                  ${balanceDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Authorization & Signatures */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-12 text-center text-xs">
            <div className="space-y-8">
              <div className="border-b border-slate-400 pb-1 h-12 flex items-end justify-center">
                <span className="font-mono text-slate-400 text-[10px] italic">Client Acceptance Signature</span>
              </div>
              <div>
                <p className="font-bold text-slate-900">Authorized Customer Representative</p>
                <p className="text-[10px] text-slate-500">Sign & Date upon Receiving Consignment</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="border-b border-slate-400 pb-1 h-12 flex items-end justify-center">
                <span className="font-mono text-slate-400 text-[10px] italic">Horizon Corporate Seal & Auth</span>
              </div>
              <div>
                <p className="font-bold text-slate-900">Chief Financial Officer / Billing Controller</p>
                <p className="text-[10px] text-slate-500">Horizon Enterprise Logistics LLC</p>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
            Thank you for your business! All deliveries are subject to standard Horizon Enterprise Terms of Supply.
          </div>
        </div>

        {/* Modal Footer (Screen Only) */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-between items-center no-print shrink-0">
          <span className="text-xs text-slate-500">
            Press <strong>Ctrl+P</strong> or click <strong>Print</strong> to generate a clean A4 PDF.
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white font-semibold text-xs transition cursor-pointer">
              Close
            </button>
            <button onClick={handlePrint} className="px-5 py-2 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm">
              <Printer size={14}/>
              Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>);
};
