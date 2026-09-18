import { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import ContractSignaturePad, { SignaturePreview } from '../../../components/common/ContractSignaturePad';
import { manageContractSigning } from '../../../services/contractSigningService';
import { validateSignature } from '../../../utils/contractSigning';

export default function ContractSigningPanel({ contract, currentUser }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [companyOpen, setCompanyOpen] = useState(false);
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [credential, setCredential] = useState('');
  const [strokes, setStrokes] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const signerName = currentUser?.name || currentUser?.fullName || name;
  const signerRole = currentUser?.designation || currentUser?.role || role;
  const signing = contract.signing;
  const pending = signing && !signing.revoked && ['Sent', 'Viewed'].includes(signing.status);
  const canSend = (!signing || signing.revoked) && ['Draft', 'Active', 'Sent'].includes(contract.status);

  useEffect(() => {
    let disposed = false;
    let running = false;
    async function sync() {
      if (!sessionStorage.getItem('quotation_admin_token') || running) return;
      running = true;
      try { await manageContractSigning(contract.id); }
      catch (failure) { if (!disposed && failure.status !== 404) setError(failure.message); }
      finally { running = false; }
    }
    sync();
    const timer = window.setInterval(sync, 15000);
    window.addEventListener('focus', sync);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener('focus', sync); };
  }, [contract.id]);

  async function act(action, signature) {
    if (busy) return;
    if (!sessionStorage.getItem('quotation_admin_token')) { setCredentialOpen(true); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      await manageContractSigning(contract.id, action, action ? { contract, actor: signerName || 'CRM User', signature } : undefined);
      setNotice(action === 'company-sign' ? 'Contract Accepted. Both signatures have been recorded.' : action === 'send' || action === 'resend' ? 'Signing link generated successfully. Copy and share it with the customer. Email delivery is not configured.' : action === 'revoke' ? 'Signing link revoked. The old link can no longer be used.' : 'Signing status refreshed.');
      if (action === 'company-sign') setCompanyOpen(false);
    } catch (failure) { setError(failure.message); if (failure.status === 401) setCredentialOpen(true); }
    finally { setBusy(false); }
  }

  return <section id="contract-signatures" className="card p-5 space-y-4">
    <div className="flex flex-wrap justify-between gap-2"><h2 className="text-sm font-bold">Signature Status</h2><span className="text-sm font-semibold">{contract.status}</span></div>
    <div className="grid sm:grid-cols-2 gap-4">
      {['customer', 'company'].map(type => {
        const signature = signing?.[`${type}Signature`];
        return <div key={type} className="rounded-lg border border-slate-200 p-3 text-sm">
          <h3 className="font-semibold capitalize">{type} — {signature ? 'Signed ✓' : 'Pending'}</h3>
          {signature && <><SignaturePreview signature={signature} /><p>{signature.name} {signature.role && `· ${signature.role}`}</p><p className="text-xs text-slate-500">{new Date(signature.signedAt).toLocaleString()}</p></>}
        </div>;
      })}
    </div>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
    <div className="flex flex-wrap gap-2">
      {canSend && <button id="contract-send-action" className="btn-primary btn-sm" disabled={busy} onClick={() => act('send')}>Send to Customer</button>}
      {pending && <>
        <button className="btn-outline btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(signing.url); setNotice('Signing link copied.'); } catch { setError('Unable to copy automatically. Select and copy the signing link below.'); } }}>Copy Signing Link</button>
        <a className="btn-outline btn-sm" href={signing.url} target="_blank" rel="noreferrer">Open Signing Page</a>
        <button className="btn-outline btn-sm" disabled={busy} onClick={() => act('resend')}>Resend</button>
        <button className="btn-outline btn-sm" disabled={busy} onClick={() => act('revoke')}>Revoke Link</button>
      </>}
      {signing?.customerSignature && !signing.companySignature && <button className="btn-primary btn-sm" disabled={busy} onClick={() => { setError(''); setStrokes([]); setAgreed(false); setCompanyOpen(true); }}>Sign as Company</button>}
      <button className="btn-outline btn-sm" disabled={busy} onClick={() => act()}>Refresh Signing Status</button>
    </div>
    {pending && <label className="block text-xs text-slate-500">Signing link<input className="block w-full border rounded p-2 mt-1" value={signing.url} readOnly onFocus={e => e.target.select()} /><span>Expires {new Date(signing.expiresAt).toLocaleString()}</span></label>}
    {signing && !signing.revoked && <p className="text-xs text-slate-500">Contract content is locked for signing. An unsigned link can be revoked to make changes.</p>}
    <Modal isOpen={credentialOpen} onClose={() => setCredentialOpen(false)} title="Sharing Server Access">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); sessionStorage.setItem('quotation_admin_token', credential); setCredential(''); setCredentialOpen(false); setNotice('Server credential saved for this session. Retry your signing action.'); }}>
        <p className="text-sm">Use the administrator token configured for the existing quotation sharing server.</p>
        <label className="block text-sm">Administrator token<input type="password" required minLength={32} autoComplete="off" className="block border rounded p-2 w-full" value={credential} onChange={e => setCredential(e.target.value)} /></label>
        <button className="btn-primary btn-sm">Save for Session</button>
      </form>
    </Modal>
    <Modal isOpen={companyOpen} onClose={() => !busy && setCompanyOpen(false)} title="Company Signature">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); try { const signature = validateSignature({ name: signerName, role: signerRole, strokes, agreed }); act('company-sign', signature); } catch (failure) { setError(failure.message); } }}>
        <p className="text-sm">Contract: {contract.contractNumber}</p>
        <label className="block text-sm">Signer<input required readOnly={Boolean(currentUser?.name || currentUser?.fullName)} value={signerName} onChange={e => setName(e.target.value)} className="block border rounded p-2 w-full" /></label>
        <label className="block text-sm">Designation<input readOnly={Boolean(currentUser?.designation || currentUser?.role)} value={signerRole} onChange={e => setRole(e.target.value)} className="block border rounded p-2 w-full" /></label>
        <ContractSignaturePad value={strokes} onChange={setStrokes} />
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />I confirm that I am authorized to sign this contract.</label>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" disabled={busy} className="btn-outline btn-sm" onClick={() => setCompanyOpen(false)}>Cancel</button><button disabled={busy} className="btn-primary btn-sm">{busy ? 'Saving…' : 'Sign Contract'}</button></div>
      </form>
    </Modal>
  </section>;
}
