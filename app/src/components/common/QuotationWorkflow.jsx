import { Send, RotateCw, Link2, Download, Activity, ShieldCheck, CheckCircle2, Clock3, FileText, Truck, X, Mail } from 'lucide-react';
import './quotationWorkflow.css';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui/Button';
import { useERP } from '../../context/ERPContext';
import { sharingRequest } from '../../services/quotationSharing';
import { emitCrmEvent, CRM_EVENT_TYPES } from '../../services/crmEventNotifications';
import { publicQuotation } from '../../utils/quotationDocument';

export function QuotationWorkflow({ quotation, onDownload, onChallan, initialMode = '' }) {
  const { customers, showToast, recordQuotationActivity, syncQuotationShare, companyProfile } = useERP();
  const senderName = companyProfile?.name || '';
  const [mode, setMode] = useState(initialMode);
  const [share, setShare] = useState(quotation.share || null);
  const [days, setDays] = useState(30);
  const [allowDownload, setAllowDownload] = useState(quotation.share?.allowDownload ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [qr, setQr] = useState('');
  const customer = customers.find(item => item.id === quotation.customerId);
  const [email, setEmail] = useState(customer?.email || '');
  const [subject, setSubject] = useState(`Quotation ${quotation.quoteNumber}${senderName ? ` from ${senderName}` : ''}`);
  const [message, setMessage] = useState(`Dear ${quotation.customer || 'Customer'},\n\nPlease find our quotation ${quotation.quoteNumber} for your review.\n\nYou can view the quotation using the preview link below.\n\nRegards,${senderName ? `\n${senderName}` : ''}`);
  const run = async callback => { setBusy(true); setError(''); try { await callback(); } catch (err) { setError(err.status === 404 ? 'No active share link. Please generate a link below.' : 'The share link could not be updated. Please try again.'); } finally { setBusy(false); } };
  useEffect(() => {
    let active = true;
    if (!share?.url) return;
    QRCode.toDataURL(share.url, { width: 220, margin: 4 }).then(url => { if (active) setQr(url); }).catch(() => { if (active) setError('QR code could not be generated.'); });
    return () => { active = false; };
  }, [share?.url]);
  const refresh = () => run(async () => { const result = await sharingRequest(quotation.id); setShare(result); setAllowDownload(result.allowDownload); syncQuotationShare(quotation.id, result); });
  const openShare = () => {
    setMode('share');
    if (!share) publish();
    else refresh();
  };
  const publish = () => run(async () => {
    const result = await sharingRequest(quotation.id, { expiryDays: days, allowDownload });
    setShare(result); syncQuotationShare(quotation.id, result);
    showToast('Quotation preview link generated.');
  });
  const copy = () => run(async () => {
    let result;
    try { result = await sharingRequest(quotation.id); }
    catch (err) { if (err.status !== 404) throw err; }
    if (!result || Date.parse(result.expiresAt) <= Date.now()) {
      result = await sharingRequest(quotation.id, { expiryDays: days, allowDownload });
    }
    setShare(result); syncQuotationShare(quotation.id, result);
    emitCrmEvent({
      type: CRM_EVENT_TYPES.QUOTATION_SENT,
      entityType: 'quotation',
      entityId: quotation.id,
      payload: {
        quoteRef: quotation.quoteNumber,
        customerId: quotation.customerId,
        customerName: quotation.customer,
        path: quotation.dealId ? `/crm/deals?deal=${encodeURIComponent(quotation.dealId)}` : '/crm/quotations',
      },
    });
    try { await navigator.clipboard.writeText(result.url); }
    catch {
      setMode('share');
      setError('Link is ready. Your browser blocked clipboard access; select the link above and copy it manually.');
      return;
    }
    recordQuotationActivity(quotation.id, 'Share link copied');
    showToast('Quotation share link copied.');
  });
  const active = share && Date.parse(share.expiresAt) > Date.now();
  const actions = [
    [Send, 'Send', 'Send to email or WhatsApp', () => setMode('send')],
    [RotateCw, 'Resend', 'Send again with a new message', () => setMode('resend')],
    [Link2, 'Copy Link', 'Generate or copy quotation link', copy, busy],
    [Download, 'Download PDF', 'Save your branded quotation', onDownload],
    [Activity, 'View Status', 'Refresh quotation activity', refresh, busy],
  ];
  const events = quotation.activity || [];
  const milestones = [
    ['Quotation Created', quotation.date, true],
    ['Quotation Sent', events.find(e => e.type === 'Quotation Sent')?.timestamp, quotation.status === 'Sent'],
    ['Viewed by Customer', events.find(e => e.type === 'Quotation Viewed')?.timestamp, quotation.status === 'Viewed'],
    ['PDF print requested', events.find(e => e.type === 'PDF print requested')?.timestamp],
    ['Accepted / Rejected', events.find(e => ['Quotation Accepted', 'Quotation Rejected'].includes(e.type))?.timestamp, ['Accepted', 'Rejected'].includes(quotation.status)],
  ];
  return <section className="quotation-workflow space-y-4">
    <div className="qw-banner"><div className="qw-icon"><FileText size={21}/></div><div><h3>Share, track & deliver</h3><p>Manage every step of {quotation.quoteNumber} from one place.</p></div><span className="qw-status">{quotation.status}</span></div>
    <div className="qw-actions">{actions.map(([Icon, label, description, action, disabled]) => <button aria-label={label} key={label} type="button" disabled={disabled} onClick={action}><Icon size={22}/><strong>{label}</strong><span>{description}</span></button>)}</div>
    <div className="qw-columns">
      <div className="qw-card"><div className="qw-card-title"><Activity size={17}/><h4>Quotation Activity</h4></div><ol className="qw-timeline">{milestones.map(([label, timestamp, complete]) => <li key={label} className={timestamp || complete ? 'complete' : ''}>{timestamp || complete ? <CheckCircle2 size={19}/> : <Clock3 size={19}/>}<div><strong>{label}</strong><small>{timestamp ? (Number.isNaN(Date.parse(timestamp)) ? timestamp : new Date(timestamp).toLocaleString()) : complete ? 'Recorded on quotation' : 'Not yet'}</small></div></li>)}</ol><details><summary>All activity ({events.length})</summary>{events.map(event => <p className="qw-event" key={event.id}>{event.type}<small>{new Date(event.timestamp).toLocaleString()}</small></p>)}</details></div>
      <div className="space-y-4"><div className="qw-card"><div className="qw-card-title"><ShieldCheck size={17}/><h4>Quotation Sharing</h4></div><p>Generate a preview link for this quotation. Manage expiry and download permission.</p><Button onClick={openShare}>Share Quotation</Button></div>
      {onChallan && <div className="qw-card"><div className="qw-card-title"><Truck size={17}/><h4>Quotation to Delivery Challan</h4></div><ul className="qw-checklist">{['Reuse quotation items and quantities', 'Copy customer and delivery address', 'Keep a link to the original quotation', 'Review dispatch before stock is posted'].map(text => <li key={text}><CheckCircle2 size={14}/>{text}</li>)}</ul><Button onClick={() => quotation.deliveryChallanId ? onChallan() : setMode('challan')}>{quotation.deliveryChallanId ? 'Open Delivery Challan' : 'Convert to Delivery Challan'}</Button></div>}</div>
    </div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {mode && <div className="fixed inset-0 z-[65] bg-black/50 flex items-center justify-center p-2 sm:p-4"><div role="dialog" aria-modal="true" aria-label={mode === 'share' ? 'Share Quotation' : mode === 'challan' ? 'Convert to Delivery Challan' : 'Send Quotation'} className="qw-dialog bg-white text-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-auto space-y-4">
      <div className="qw-dialog-title"><h3>{mode === 'share' ? 'Share Quotation' : mode === 'challan' ? 'Convert to Delivery Challan' : 'Send Quotation'}</h3><button aria-label="Close dialog" onClick={() => setMode('')}><X size={19}/></button></div>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {mode === 'challan' ? <><div className="qw-notice"><Truck size={22}/><p>Create a draft delivery challan for <strong>{quotation.customer}</strong> using {quotation.items?.length || 0} quotation items. Review quantities and dispatch details before issuing it.</p></div><p>Source quotation: <strong>{quotation.quoteNumber}</strong></p><Button onClick={() => { setMode(''); onChallan(); }}>Create Delivery Challan</Button></> : mode === 'share' ? <>
        <label className="block">Quotation Preview Link<input className="w-full border rounded p-2 mt-1" readOnly value={share?.url || ''} placeholder="Generate a preview link"/></label>
        {qr && active && share.url.length < 2000 && <figure className="qw-qr"><img src={qr} alt="Scan to open this quotation" width="220" height="220"/><figcaption>Scan to view quotation</figcaption></figure>}
        <p className="qw-notice">This link opens in any browser until it expires.</p>
        <p>Link Status: {active ? 'Active' : share ? 'Expired' : 'Not published'}{share && ` · Expires ${new Date(share.expiresAt).toLocaleString()}`}</p>
        <h4 className="font-bold border-t pt-4">Link Settings</h4><label className="qw-toggle"><span>Require OTP for access<small>OTP delivery service not connected</small></span><input type="checkbox" disabled aria-label="Require OTP for access"/></label><label className="block">Link expiry (days)<input type="number" min="1" max="365" value={days} onChange={event => setDays(Number(event.target.value))} className="border p-2 ml-2 rounded w-24"/></label>
        <label className="qw-toggle"><input type="checkbox" role="switch" checked={allowDownload} onChange={event => setAllowDownload(event.target.checked)}/>Allow Download</label><div className="qw-notice"><ShieldCheck size={19}/><p>This preview uses quotation data saved in your browser.</p></div>
        <p className="text-xs">Generating a new link replaces the previous link.</p>
        <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={publish}>{share ? 'Update / Replace Link' : 'Generate Link'}</Button><Button disabled={busy} onClick={copy}>Copy Link</Button><Button variant="outline" onClick={onDownload}>Download PDF</Button><Button variant="outline" onClick={() => setMode('send')}>Send</Button></div>
      </> : <>
        <div className="qw-tabs"><button className={mode === 'send' ? 'selected' : ''} onClick={() => setMode('send')}>Send</button><button className={mode === 'resend' ? 'selected' : ''} onClick={() => setMode('resend')}>Resend</button></div><div className="qw-recipient"><Mail size={19}/><div><strong>{quotation.customer}</strong><small>Send quotation to</small></div></div><label className="flex gap-2"><input type="checkbox" defaultChecked/>Email</label><label className="flex gap-2"><input type="checkbox"/>WhatsApp {customer?.phone || '(phone not available)'}</label>
        <label className="block">Email<input className="border rounded p-2 w-full" type="email" value={email} onChange={event => setEmail(event.target.value)}/></label>
        <p>Phone / WhatsApp: {customer?.phone || 'Not available'}</p>
        <label className="block">Subject<input className="border rounded p-2 w-full" value={subject} onChange={event => setSubject(event.target.value)}/></label>
        <label className="block">Message<textarea rows="7" className="border rounded p-2 w-full" value={message} onChange={event => setMessage(event.target.value)}/></label>
        {['Include PDF attachment', 'Include preview link', 'Include QR code'].map(label => <label key={label} className="flex gap-2"><input type="checkbox" defaultChecked/>{label}</label>)}
        <p role="status" className="rounded bg-amber-50 p-3">Email and WhatsApp delivery are not connected. Nothing has been sent and the quotation status remains unchanged. You can copy the preview link to share it manually.</p>
        <div className="flex flex-wrap lg:flex-nowrap gap-2"><Button disabled title="Connect an email service to enable sending">Send Quotation</Button><Button variant="outline" disabled={busy} onClick={copy}>Copy Link</Button></div>
      </>}
      <Button variant="outline" onClick={() => setMode('')}>Close</Button>
    </div></div>}
  </section>;
}
