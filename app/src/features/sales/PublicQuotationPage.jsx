import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicQuoteRequest } from '../../services/quotationSharing';
import { QuotationDocument } from '../../components/common/QuotationDocument';
import { Button } from '../../components/ui/Button';

export default function PublicQuotationPage() {
  const { quotationNumber, secureToken } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
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
  return <main className="min-h-screen bg-slate-100 p-4 sm:p-8 print:bg-white print:p-0"><meta name="referrer" content="no-referrer"/><meta name="robots" content="noindex,nofollow"/>
    <div className="max-w-4xl mx-auto mb-5 no-print flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-4"><div><p className="text-blue-600 font-bold">EVENMORE ERP</p><h1 className="text-xl font-bold text-slate-800 mt-1">Your quotation</h1><p className="text-sm text-slate-500 mt-1">Review your products, pricing and terms below.</p></div><span className="rounded-full border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2 text-xs">Shared quotation</span></div>
    <div className="max-w-4xl mx-auto bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {error && <p role="alert" className="p-8">{error}</p>}
      {!data && !error && <p className="p-8">Loading quotation…</p>}
      {data && <><QuotationDocument quotation={data.quotation} company={data.company}/>{data.allowDownload && <div className="no-print p-6 flex gap-4 items-center"><Button onClick={async () => { try { await publicQuoteRequest(quotationNumber, secureToken, 'download'); window.print(); } catch { setError('This quotation link is invalid or has expired. Please contact the sender.'); } }}>Download PDF</Button><span className="text-xs">Choose Save as PDF in the print dialog.</span></div>}</>}
    </div>
  </main>;
}
