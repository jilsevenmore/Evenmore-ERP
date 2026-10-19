import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Printer, Loader2 } from 'lucide-react';
import { publicQuoteRequest } from '../../services/quotationSharing';
import { QuotationDocument } from '../../components/common/QuotationDocument';
import { Button } from '../../components/ui/Button';
import { downloadElementAsPdf } from '../../services/exportUtils';

export default function PublicQuotationPage() {
  const { quotationNumber, secureToken } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef(null);
  const tracked = useRef('');

  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    publicQuoteRequest(quotationNumber, secureToken).then(async result => {
      if (!active) return;
      setData(result);
      const key = `${quotationNumber}/${secureToken}`;
      if (tracked.current !== key) {
        tracked.current = key;
        try { await publicQuoteRequest(quotationNumber, secureToken, 'view'); }
        catch { tracked.current = ''; }
      }
    }).catch(() => { if (active) setError('This quotation link is invalid or has expired. Please contact the sender.'); });
    return () => { active = false; };
  }, [quotationNumber, secureToken]);

  const handleDownloadPdf = async () => {
    if (!docRef.current || downloading) return;
    setDownloading(true);
    try {
      await publicQuoteRequest(quotationNumber, secureToken, 'download');
      await downloadElementAsPdf(docRef.current, `Quotation_${quotationNumber || 'Quote'}.pdf`);
    } catch {
      setError('This quotation link is invalid or has expired. Please contact the sender.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try { await publicQuoteRequest(quotationNumber, secureToken, 'download'); } catch {}
    window.print();
  };

  return <main className="min-h-screen bg-slate-100 p-4 sm:p-8 print:bg-white print:p-0"><meta name="referrer" content="no-referrer"/><meta name="robots" content="noindex,nofollow"/>
    <div className="max-w-4xl mx-auto mb-5 no-print flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-4"><div><p className="text-blue-600 font-bold">EVENMORE ERP</p><h1 className="text-xl font-bold text-slate-800 mt-1">Your quotation</h1><p className="text-sm text-slate-500 mt-1">Review your products, pricing and terms below.</p></div><span className="rounded-full border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2 text-xs">Shared quotation</span></div>
    <div className="max-w-4xl mx-auto bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {error && <p role="alert" className="p-8">{error}</p>}
      {!data && !error && <p className="p-8">Loading quotation…</p>}
      {data && <>
        <div ref={docRef}>
          <QuotationDocument quotation={data.quotation} company={data.company} shareUrl={window.location.href}/>
        </div>
        {data.allowDownload && (
          <div className="no-print p-6 flex flex-wrap gap-3 items-center justify-between border-t bg-slate-50">
            <span className="text-xs text-slate-500">Download a digital PDF copy or print directly to paper.</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrint} className="flex items-center gap-1.5">
                <Printer size={14} /> Print
              </Button>
              <Button onClick={handleDownloadPdf} disabled={downloading} className="flex items-center gap-1.5">
                {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        )}
      </>}
    </div>
  </main>;
}

