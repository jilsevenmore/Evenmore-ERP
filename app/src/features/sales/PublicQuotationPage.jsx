import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicQuoteRequest } from '../../services/quotationSharing';
import { QuotationDocument } from '../../components/common/QuotationDocument';
import { Button } from '../../components/ui/Button';

export default function PublicQuotationPage() {
  const { quotationNumber, secureToken } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);
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
    }).catch(() => { if (active) setError(secureToken.startsWith('local-') ? 'This preview opens only in the browser where it was generated. It may also have expired.' : 'This quotation is unavailable. The link may be invalid or expired. Please contact the sender.'); });
    return () => { active = false; };
  }, [quotationNumber, secureToken]);
  return <main className="min-h-screen bg-slate-100 p-4 sm:p-8 print:bg-white print:p-0"><meta name="referrer" content="no-referrer"/><meta name="robots" content="noindex,nofollow"/>
    <div className="max-w-4xl mx-auto mb-5 no-print flex items-center justify-between gap-4"><div><p className="text-blue-600 font-bold">EVENMORE ERP</p><h1 className="text-xl font-bold text-slate-800 mt-1">Your quotation</h1><p className="text-sm text-slate-500 mt-1">Review your products, pricing and terms below.</p></div><span className="rounded-full border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2 text-xs">{data?.localOnly ? 'Local preview' : 'Secure customer view'}</span></div>
    <div className="max-w-4xl mx-auto bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {error && <p role="alert" className="p-8">{error}</p>}
      {!data && !error && <p className="p-8">Loading quotation…</p>}
      {data && <><QuotationDocument quotation={data.quotation}/>{data.allowDownload && <div className="no-print p-6 flex gap-4 items-center"><Button onClick={async () => { try { await publicQuoteRequest(quotationNumber, secureToken, 'download'); window.print(); } catch { setError('Download is no longer available. Please contact the sender.'); } }}>Download PDF</Button><span className="text-xs">Choose Save as PDF in the print dialog.</span></div>}
        <div className="no-print px-6 pb-6 space-y-3">
          {data.decision ? <p role="status" className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-blue-800">Quotation {data.decision.toLowerCase()}. Your response has been recorded.</p> : data.allowAcceptance && <><p className="text-sm text-slate-500">Ready to respond? Your response will be shared with the quotation sender.</p><div className="flex gap-3"><Button onClick={() => setResponse('accept')}>Accept Quote</Button><Button variant="outline" onClick={() => setResponse('reject')}>Reject Quote</Button></div></>}
          {response && <div role="dialog" aria-label="Confirm quotation response" className="p-4 rounded-xl border border-blue-200 space-y-3"><p>Confirm that you want to {response} quotation <strong>{quotationNumber}</strong>?</p><p className="text-xs text-slate-500">To change a submitted response, contact the sender.</p><div className="flex gap-2"><Button disabled={busy} onClick={async () => { setBusy(true); setError(''); try { const result = await publicQuoteRequest(quotationNumber, secureToken, response); setData(current => ({ ...current, decision: result.decision })); setResponse(''); } catch { setError('Your response could not be recorded. Refresh the page or contact the sender.'); } finally { setBusy(false); } }}>Confirm {response === 'accept' ? 'Acceptance' : 'Rejection'}</Button><Button variant="outline" disabled={busy} onClick={() => setResponse('')}>Cancel</Button></div></div>}
        </div></>}
    </div>
  </main>;
}
