import { useEffect, useState } from 'react';
import { Infinity as InfinityIcon } from 'lucide-react';
import ContractSignaturePad, { SignaturePreview } from '../../../components/common/ContractSignaturePad';
import { signingRequest } from '../../../utils/contractSigningRequest';
import { validateSignature } from '../../../utils/contractSigning';
import { printContract } from '../../../utils/contractPrint';

export default function PublicContractSigningPage() {
  const token = /^\/contracts\/sign\/([a-f0-9]{64})\/?$/.exec(window.location.pathname)?.[1];
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [strokes, setStrokes] = useState([]);
  const [agreed, setAgreed] = useState(false);
  useEffect(() => {
    let disposed = false;
    const meta = document.createElement('meta');
    meta.name = 'referrer'; meta.content = 'no-referrer'; document.head.appendChild(meta);
    async function load() {
      try {
        if (!token) throw new Error('This signing link is invalid. Please contact the sender.');
        const data = await signingRequest(`public-contracts/${token}/view`, {});
        if (!disposed) setRecord(data);
      } catch (failure) { if (!disposed) setError(failure.message); }
      finally { if (!disposed) setLoading(false); }
    }
    load();
    return () => { disposed = true; meta.remove(); };
  }, [token]);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    try {
      const signature = validateSignature({ name, role, strokes, agreed });
      setBusy(true);
      const data = await signingRequest(`public-contracts/${token}/sign`, { signature });
      setRecord(data);
    } catch (failure) {
      setError(failure.message);
      if (failure.status === 409) {
        try { setRecord(await signingRequest(`public-contracts/${token}`)); } catch { /* Keep the original actionable error. */ }
      }
      if (failure.status === 410 || failure.status === 404) setRecord(null);
    } finally { setBusy(false); }
  }
  const contract = record?.contract;
  const signed = record?.customerSignature;
  return <main className="min-h-screen bg-slate-50 text-slate-800 px-4 py-8 sm:py-12">
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center gap-3 text-blue-900"><InfinityIcon size={40} strokeWidth={2.6} /><div><p className="font-bold">EVENMORE INFOTECH</p><p className="text-xs tracking-wide">PEOPLE | PROCESS | PROGRESS</p></div></header>
      {loading && <p role="status">Loading contract…</p>}
      {error && <p role="alert" className="border border-rose-200 rounded-xl bg-rose-50 text-rose-700 p-4">{error}</p>}
      {contract && <>
        <article className="bg-white rounded-xl border border-slate-200 p-5 sm:p-8 space-y-5">
          <div><p className="text-sm text-slate-500">Contract {contract.contractNumber}</p><h1 className="text-2xl font-bold mt-1">{contract.contractType}</h1></div>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            {[['Customer', contract.customer], ['Contract Date', contract.startDate], ['Valid Until', contract.endDate], ['Contract Value', `₹ ${Number(contract.amount).toLocaleString('en-IN')}`]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="font-semibold break-words">{value}</dd></div>)}
          </dl>
          {contract.description && <p className="whitespace-pre-wrap break-words leading-7">{contract.description}</p>}
          <h2 className="font-bold">Terms & Conditions</h2><p className="whitespace-pre-wrap break-words leading-7 text-sm">{contract.terms}</p>
          <button type="button" className="btn-outline btn-sm" onClick={() => printContract({ ...contract, status: record.status, signing: { customerSignature: signed } })}>View Full Contract / Save PDF</button>
        </article>
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-8 space-y-4">
          {signed ? <div role="status" className="space-y-3">
            <h2 className="font-bold text-xl text-emerald-700">✓ Contract Signed Successfully</h2>
            <p>Thank you. Your signature has been recorded. You have already signed this contract.</p>
            <SignaturePreview signature={signed} />
            <p>Contract: {contract.contractNumber}<br />Signed by: {signed.name}<br />Signed on: {new Date(signed.signedAt).toLocaleString()}<br />Status: {record.status}</p>
            <p className="text-sm text-slate-500">{record.companySigned ? 'Both parties have signed. The contract is Accepted.' : 'The company signature is still required before this contract is accepted.'}</p>
          </div> : <form onSubmit={submit} className="space-y-4">
            <h2 className="font-bold text-xl">Customer Signature</h2>
            <p className="text-sm text-slate-500">You are signing on behalf of {contract.customer}. Review the full terms above. The company will countersign after your signature is recorded.</p>
            <ContractSignaturePad value={strokes} onChange={setStrokes} />
            <label className="block text-sm font-medium">Customer Name<input required maxLength={200} autoComplete="name" className="block w-full rounded-lg border border-slate-300 p-3 mt-1" value={name} onChange={e => setName(e.target.value)} /></label>
            <label className="block text-sm font-medium">Designation<input maxLength={200} autoComplete="organization-title" className="block w-full rounded-lg border border-slate-300 p-3 mt-1" value={role} onChange={e => setRole(e.target.value)} /></label>
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={agreed} onChange={e => setAgreed(e.target.checked)} />I agree to the terms and conditions and am authorized to sign for {contract.customer}.</label>
            <button disabled={busy} className="btn-primary w-full sm:w-auto">{busy ? 'Saving signature…' : 'Sign Contract'}</button>
          </form>}
        </section>
      </>}
    </div>
  </main>;
}
