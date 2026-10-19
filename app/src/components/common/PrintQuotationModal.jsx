import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { QuotationDocument } from './QuotationDocument';
import { useERP } from '../../context/ERPContext';
import { downloadElementAsPdf } from '../../services/exportUtils';

export const PrintQuotationModal = ({ isOpen, onClose, quotation, onPrint }) => {
  const { companyProfile } = useERP();
  const docRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = event => { if (event.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !quotation) return null;

  const handleDirectDownload = async () => {
    if (!docRef.current || downloading) return;
    setDownloading(true);
    try {
      if (onPrint) await onPrint();
      await downloadElementAsPdf(docRef.current, `Quotation_${quotation.quoteNumber || 'Quote'}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (onPrint) await onPrint();
    window.print();
  };

  return <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-2 sm:p-4 print:static print:p-0 print:bg-white">
    <div role="dialog" aria-modal="true" aria-label="Quotation PDF preview" className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-auto print:max-h-none print:overflow-visible">
      <div className="no-print flex flex-wrap lg:flex-nowrap justify-between items-center gap-2 lg:gap-0 bg-[#1F2E4A] text-white p-4"><span>{quotation.quoteNumber} — PDF preview</span><button onClick={onClose} aria-label="Close preview"><X size={18}/></button></div>
      <div ref={docRef}>
        <QuotationDocument quotation={quotation} company={companyProfile} shareUrl={quotation.share?.url && Date.parse(quotation.share.expiresAt) > Date.now() ? quotation.share.url : ''}/>
      </div>
      <div className="no-print p-4 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 border-t bg-slate-50">
        <p className="text-xs text-slate-500">Instant PDF download or print to physical printer.</p>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-outline flex items-center gap-1.5" onClick={handlePrint}>
            <Printer size={14} /> Print
          </button>
          <button type="button" className="btn-primary flex items-center gap-1.5" disabled={downloading} onClick={handleDirectDownload}>
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  </div>;
};

