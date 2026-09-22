import React, { useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { QuotationDocument } from './QuotationDocument';

export const PrintQuotationModal = ({ isOpen, onClose, quotation, onPrint }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = event => { if (event.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  if (!isOpen || !quotation) return null;
  return <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 print:static print:p-0 print:bg-white">
    <div role="dialog" aria-modal="true" aria-label="Quotation PDF preview" className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-auto print:max-h-none print:overflow-visible">
      <div className="no-print flex justify-between items-center bg-[#1F2E4A] text-white p-4"><span>{quotation.quoteNumber} — PDF preview</span><button onClick={onClose} aria-label="Close preview"><X size={18}/></button></div>
      <QuotationDocument quotation={quotation}/>
      <div className="no-print p-4 flex items-center justify-between border-t"><p className="text-xs text-slate-600">Choose Save as PDF in the print dialog to download.</p><button className="btn-primary" onClick={async () => { if (onPrint) await onPrint(); window.print(); }}><Printer size={14}/> Download PDF / Print</button></div>
    </div>
  </div>;
};
