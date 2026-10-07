import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertCircle, Check, X, RefreshCw, Building2, FileText, ShieldCheck, Clock, Ban,
  Link2Off, CalendarClock, WifiOff, Printer, MessageCircle, Send,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import {
  decidePublicSalesApproval,
  fetchPublicSalesApproval,
  postPublicSalesComment,
} from '../../../services/salesApprovalLinks';

/**
 * CustomerApprovalPage — what a sales approval link opens (`/sales/approve/:token`).
 *
 * The sales twin of the PMS ClientProofApprovalPage: outside the app shell, no
 * account needed. It shows the estimate / quotation / proforma / invoice as
 * printed, a comment thread with the sales team, and Approve / Reject, which
 * can be submitted once. Everything goes through the public approval API.
 */

const fieldClass =
  'w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
const labelClass = 'block text-[11px] font-semibold text-slate-600 mb-1.5';

function stamp(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function day(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function money(value, currency = 'INR') {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

function qty(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 3 }) : '—';
}

/** Addresses arrive as text or as { line1, line2, city, state, pincode }. */
function addressText(address) {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return ['line1', 'line2', 'address', 'street', 'city', 'district', 'state', 'pincode', 'zip', 'country']
    .map((k) => address[k])
    .filter(Boolean)
    .join(', ');
}

function PortalShell({ company, children }) {
  return (
    <div className="min-h-screen bg-[#f4f7fc] print:bg-white">
      <header className="bg-white border-b border-[#dce5f4] print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-white" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 tracking-tight leading-none">
              Document Approval Portal
            </p>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              {company?.tradeName || company?.legalName || 'Evenmore'} — Sales
            </p>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4 print:p-0">{children}</main>
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 pt-2 print:hidden">
        <p className="text-[10.5px] text-slate-400 text-center">
          This link was issued for a single approval. Contact your sales representative if you need it re-sent.
        </p>
      </footer>
    </div>
  );
}

function PortalNotice({ icon: Icon, tone, title, body, detail, company }) {
  return (
    <PortalShell company={company}>
      <section className="rounded-xl border border-[#dce5f4] bg-white p-6 sm:p-8 shadow-2xs text-center">
        <span className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ background: tone.bg }}>
          <Icon size={22} style={{ color: tone.fg }} />
        </span>
        <h1 className="text-base font-black text-slate-800">{title}</h1>
        <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto">{body}</p>
        {detail && (
          <div className="mt-4 inline-block rounded-lg border border-[#dce5f4] bg-[#f6f9ff] px-4 py-2.5 text-left">
            {detail}
          </div>
        )}
      </section>
    </PortalShell>
  );
}

/** Map a public-API failure to the terminal state it means. */
function blockFromError(err) {
  if (!err?.status || err.status >= 500) return 'unreachable';
  if (err.status === 429) return 'throttled';
  if (err.status === 409) {
    const msg = `${err?.message || ''}`.toLowerCase();
    if (msg.includes('revok')) return 'revoked';
    if (msg.includes('expir')) return 'expired';
  }
  return 'invalid';
}

/** The document as printed: letterhead, parties, lines, totals, terms. */
function SalesDocumentView({ company, doc }) {
  const totals = doc.totals || {};
  const currency = doc.currency || 'INR';
  const lines = doc.lineItems || [];
  const hasDiscount = lines.some((l) => Number(l.discountAmount) > 0);
  const showBank = ['proforma_invoice', 'sales_invoice'].includes(doc.type) && company?.bank;

  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs overflow-hidden print:border-0 print:shadow-none">
      {/* Letterhead */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 px-5 py-4 border-b-2 border-slate-800">
        <div className="flex items-start gap-3 min-w-0">
          {company?.logo ? (
            <img src={company.logo} alt="" className="w-12 h-12 object-contain shrink-0" />
          ) : (
            <span className="w-12 h-12 rounded-lg bg-[#f6f9ff] border border-[#dce5f4] flex items-center justify-center shrink-0">
              <Building2 size={20} className="text-blue-500" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800">{company?.legalName || company?.tradeName || ''}</p>
            {addressText(company?.address) && <p className="text-[11px] text-slate-600">{addressText(company.address)}</p>}
            <p className="text-[10.5px] text-slate-500">
              {[company?.gstin && `GSTIN ${company.gstin}`, company?.phone, company?.email].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="sm:text-right shrink-0">
          <p className="text-lg font-black text-slate-800 uppercase tracking-wide">{doc.title}</p>
          <p className="text-[11px] font-semibold text-slate-700">{doc.number}</p>
          <p className="text-[10.5px] text-slate-500">Date: {day(doc.date)}</p>
          {doc.validUntil && <p className="text-[10.5px] text-slate-500">Valid until: {day(doc.validUntil)}</p>}
          {doc.dueDate && <p className="text-[10.5px] text-slate-500">Due date: {day(doc.dueDate)}</p>}
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 py-3 border-b border-[#eef2f8] text-[11px]">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Bill to</p>
          <p className="font-bold text-slate-800">{doc.partyName}</p>
          {addressText(doc.billingAddress) && <p className="text-slate-600">{addressText(doc.billingAddress)}</p>}
          {doc.partyGstin && <p className="text-slate-500">GSTIN {doc.partyGstin}</p>}
        </div>
        <div>
          {addressText(doc.shippingAddress) && (
            <>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Ship to</p>
              <p className="text-slate-600">{addressText(doc.shippingAddress)}</p>
            </>
          )}
          {doc.placeOfSupply && <p className="text-slate-500 mt-1">Place of supply: {doc.placeOfSupply}</p>}
          {doc.referenceNumber && <p className="text-slate-500">Reference: {doc.referenceNumber}</p>}
        </div>
      </div>

      {doc.subject && (
        <p className="px-5 py-2 text-[11px] text-slate-700 border-b border-[#eef2f8]">
          <strong>Subject:</strong> {doc.subject}
        </p>
      )}

      {/* Lines */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#f6f9ff] text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Item</th>
              <th className="px-3 py-2 font-semibold">HSN</th>
              <th className="px-3 py-2 font-semibold text-right">Qty</th>
              <th className="px-3 py-2 font-semibold text-right">Rate</th>
              {hasDiscount && <th className="px-3 py-2 font-semibold text-right">Discount</th>}
              <th className="px-3 py-2 font-semibold text-right">Tax</th>
              <th className="px-5 py-2 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f8]">
            {lines.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-4 text-center text-slate-400 italic">No line items.</td></tr>
            ) : lines.map((l, i) => (
              <tr key={`${l.lineNo}-${i}`} className="align-top">
                <td className="px-5 py-2 text-slate-500">{i + 1}</td>
                <td className="px-3 py-2">
                  <p className="font-semibold text-slate-800">{l.itemName || l.description || '—'}</p>
                  {l.description && l.description !== l.itemName && (
                    <p className="text-slate-500 whitespace-pre-wrap">{l.description}</p>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">{l.hsnCode || '—'}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{qty(l.qty)} {l.uom || ''}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{money(l.rate, currency)}</td>
                {hasDiscount && <td className="px-3 py-2 text-right whitespace-nowrap">{money(l.discountAmount, currency)}</td>}
                <td className="px-3 py-2 text-right whitespace-nowrap">{qty(l.taxPct)}%</td>
                <td className="px-5 py-2 text-right font-semibold whitespace-nowrap">{money(l.lineTotal || l.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 px-5 py-4 border-t-2 border-slate-800">
        <div className="text-[11px] text-slate-600 max-w-md space-y-2">
          {totals.amountInWords && <p><strong>Amount in words:</strong> {totals.amountInWords}</p>}
          {showBank && (
            <p>
              <strong>Bank:</strong> {company.bank.bankName || company.bank.name}
              {company.bank.accountNumber ? ` · A/c ${company.bank.accountNumber}` : ''}
              {company.bank.ifsc ? ` · IFSC ${company.bank.ifsc}` : ''}
            </p>
          )}
        </div>
        <dl className="text-[11px] min-w-[220px] space-y-1">
          {[
            ['Taxable value', totals.taxableValue],
            ...(Number(totals.totalDiscount) > 0 ? [['Discount', totals.totalDiscount]] : []),
            ...(Number(totals.cgst) > 0 ? [['CGST', totals.cgst]] : []),
            ...(Number(totals.sgst) > 0 ? [['SGST', totals.sgst]] : []),
            ...(Number(totals.igst) > 0 ? [['IGST', totals.igst]] : []),
            ...(Number(totals.cess) > 0 ? [['Cess', totals.cess]] : []),
            ...(Number(totals.freightCharges) > 0 ? [['Freight', totals.freightCharges]] : []),
            ...(Number(totals.otherCharges) > 0 ? [['Other charges', totals.otherCharges]] : []),
            ...(Number(totals.roundOff) !== 0 && totals.roundOff != null ? [['Round off', totals.roundOff]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 text-slate-600">
              <dt>{k}</dt><dd>{money(v, currency)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-6 pt-1.5 mt-1.5 border-t border-slate-300 text-sm font-black text-slate-800">
            <dt>Total</dt><dd>{money(totals.grandTotal, currency)}</dd>
          </div>
        </dl>
      </div>

      {(doc.paymentTerms || doc.deliveryTerms || doc.notes || doc.terms) && (
        <div className="px-5 py-3 border-t border-[#eef2f8] text-[11px] text-slate-600 space-y-1.5">
          {doc.paymentTerms && <p><strong>Payment terms:</strong> {doc.paymentTerms}</p>}
          {doc.deliveryTerms && <p><strong>Delivery terms:</strong> {doc.deliveryTerms}</p>}
          {doc.notes && <p className="whitespace-pre-wrap"><strong>Notes:</strong> {doc.notes}</p>}
          {doc.terms && <p className="whitespace-pre-wrap"><strong>Terms &amp; conditions:</strong> {doc.terms}</p>}
        </div>
      )}
    </section>
  );
}

export default function CustomerApprovalPage() {
  const { token } = useParams();

  const [data, setData] = useState(null);
  const [state, setState] = useState(token ? 'loading' : 'invalid'); // loading|ready|invalid|expired|revoked|unreachable|throttled
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    setState('loading');
    fetchPublicSalesApproval(token)
      .then((body) => {
        if (cancelled) return;
        setData(body || null);
        setState(body?.document ? 'ready' : 'invalid');
      })
      .catch((err) => {
        if (!cancelled) setState(blockFromError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  const [decision, setDecision] = useState('Approved');
  const [signer, setSigner] = useState('');
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (data?.recipientName) setSigner(data.recipientName);
  }, [data?.recipientName]);

  const company = data?.company ?? null;
  const doc = data?.document ?? null;
  const thread = data?.comments ?? [];
  const isReject = decision === 'Rejected';

  async function addComment(e) {
    e.preventDefault();
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const rows = await postPublicSalesComment(token, {
        text: newComment.trim(),
        authorName: signer.trim() || data?.recipientName || 'Customer',
      });
      setData((prev) => (prev ? { ...prev, comments: rows } : prev));
      setNewComment('');
      setErrors((prev) => ({ ...prev, comment: undefined }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, comment: err?.message || 'Could not post your comment.' }));
    } finally {
      setPosting(false);
    }
  }

  /** Picking Reject without a reason only selects it and flags what is missing. */
  async function submitDecision(value) {
    setDecision(value);
    const found = {};
    if (!signer.trim()) found.signer = 'Enter your name.';
    if (value === 'Rejected' && !rejectionReason.trim()) found.rejectionReason = 'Tell us why you are rejecting it.';
    setErrors(found);
    if (Object.keys(found).length > 0 || submitting) return;

    setSubmitting(true);
    try {
      const res = await decidePublicSalesApproval(token, {
        decision: value,
        decidedBy: signer.trim(),
        comments: comments.trim(),
        rejectionReason: value === 'Rejected' ? rejectionReason.trim() : '',
      });
      setReceipt({ decision: value, at: res?.decidedAt ?? new Date().toISOString(), by: signer.trim() });
    } catch (err) {
      if (err?.status === 404) setState('invalid');
      else if (err?.status === 409 && /revok|expir/i.test(err?.message || '')) setState(blockFromError(err));
      else setErrors({ submit: err?.message || 'Your decision could not be recorded. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Terminal states ──

  if (state === 'loading') {
    return <PortalNotice icon={Clock} tone={{ bg: '#f6f9ff', fg: '#1f6bff' }} title="Checking this link…" body="Fetching the document and approval details." />;
  }
  if (state === 'unreachable' || state === 'throttled') {
    return (
      <PortalNotice
        icon={WifiOff}
        tone={{ bg: '#f1f5f9', fg: '#64748b' }}
        title="We couldn't load this link"
        body={state === 'throttled'
          ? 'Too many requests in a short time. Wait a minute and try again.'
          : 'The server did not respond. Check your connection and try again in a moment.'}
        detail={<Button type="button" size="sm" icon={RefreshCw} onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}
      />
    );
  }
  if (state === 'expired' || state === 'revoked') {
    const withdrawn = state === 'revoked';
    return (
      <PortalNotice
        icon={withdrawn ? Ban : CalendarClock}
        tone={withdrawn ? { bg: '#ffe4e6', fg: '#9f1239' } : { bg: '#fef3c7', fg: '#92400e' }}
        title={withdrawn ? 'This link has been withdrawn' : 'This link has expired'}
        body={withdrawn
          ? 'The sales team revoked this approval link. A newer version of the document may be on its way.'
          : 'The approval window for this link has closed. Ask your sales representative to re-issue it.'}
      />
    );
  }
  if (state !== 'ready' || !doc) {
    return (
      <PortalNotice
        icon={Link2Off}
        tone={{ bg: '#f1f5f9', fg: '#64748b' }}
        title="This approval link is not valid"
        body="The link may have been mistyped, or it is no longer active. Ask your sales representative to send a fresh one."
      />
    );
  }

  const settled = receipt ?? (data.decision ? { decision: data.decision, at: data.decidedAt, by: data.decidedBy } : null);

  if (receipt) {
    const approved = receipt.decision === 'Approved';
    return (
      <PortalNotice
        company={company}
        icon={approved ? Check : X}
        tone={approved ? { bg: '#d1fae5', fg: '#065f46' } : { bg: '#ffe4e6', fg: '#9f1239' }}
        title={approved ? `${doc.title} approved — thank you` : `${doc.title} rejected`}
        body={approved
          ? 'Your approval has been recorded and the sales team has been notified.'
          : 'Your feedback has been sent to the sales team. They will get back to you with a revised document.'}
        detail={
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              ['Document', `${doc.title} ${doc.number}`],
              ['Total', money(doc.totals?.grandTotal, doc.currency)],
              ['Decision by', receipt.by || '—'],
              ['Recorded at', stamp(receipt.at)],
              ...(!approved && rejectionReason.trim() ? [['Reason given', rejectionReason.trim()]] : []),
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[10px] text-slate-400">{k}</dt>
                <dd className="text-[11px] font-semibold text-slate-700">{v}</dd>
              </div>
            ))}
          </dl>
        }
      />
    );
  }

  // ── The live view ──

  return (
    <PortalShell company={company}>
      <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <span className="w-11 h-11 rounded-xl bg-[#f6f9ff] border border-[#dce5f4] flex items-center justify-center shrink-0">
            <FileText size={19} className="text-blue-500" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">{doc.title} {doc.number}</h1>
              {settled ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${settled.decision === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {settled.decision} by {settled.by || 'you'} on {stamp(settled.at)}
                </span>
              ) : data.canDecide ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Awaiting your decision</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{doc.status}</span>
              )}
            </div>
            <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
              {[
                ['Customer', doc.partyName],
                ['Date', day(doc.date)],
                ...(doc.validUntil ? [['Valid until', day(doc.validUntil)]] : []),
                ...(doc.dueDate ? [['Due date', day(doc.dueDate)]] : []),
                ['Total', money(doc.totals?.grandTotal, doc.currency)],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[10px] text-slate-400 font-medium">{k}</dt>
                  <dd className="text-[11px] font-semibold text-slate-700 truncate max-w-[220px]" title={String(v)}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Button type="button" variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        </div>

        {data.message && (
          <p className="flex items-start gap-1.5 text-[11px] text-slate-700 bg-white border border-[#dce5f4] rounded-lg px-3 py-2 mt-4">
            <FileText size={12} className="shrink-0 mt-0.5 text-slate-400" />
            <span><strong>{data.createdBy || 'Your sales representative'} wrote:</strong> {data.message}</span>
          </p>
        )}
        <p className="flex items-center gap-1.5 text-[10.5px] text-slate-400 mt-3">
          <Clock size={11} /> This link expires on {stamp(data.expiresAt)}.
        </p>
      </section>

      <SalesDocumentView company={company} doc={doc} />

      {/* Comments with the sales team */}
      <section className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs print:hidden">
        <header className="flex items-center gap-1.5 px-5 py-3 border-b border-[#dce5f4]">
          <MessageCircle size={13} className="text-blue-500" />
          <h2 className="text-sm font-bold text-slate-800">Questions &amp; comments</h2>
        </header>
        <ul className="divide-y divide-[#eef2f8]">
          {thread.length === 0 ? (
            <li className="px-5 py-3 text-[11px] text-slate-400">No comments yet. Ask the sales team anything about this document.</li>
          ) : thread.map((c) => (
            <li key={c.id} className="px-5 py-2.5">
              <p className="text-[10px] text-slate-400">
                <strong className={c.authorType === 'Client' ? 'text-slate-700' : 'text-blue-700'}>
                  {c.author || (c.authorType === 'Client' ? 'You' : 'Sales team')}
                </strong>
                {c.authorType === 'Client' ? '' : ' (sales team)'} · {stamp(c.createdAt)}
              </p>
              <p className="text-[11px] text-slate-700 whitespace-pre-wrap">{c.text}</p>
            </li>
          ))}
        </ul>
        <form onSubmit={addComment} className="flex items-center gap-1.5 border-t border-[#dce5f4] p-3">
          <input
            type="text"
            className={fieldClass}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment or question…"
            aria-label="Write a comment"
          />
          <Button size="sm" type="submit" icon={Send} disabled={posting || !newComment.trim()}>Send</Button>
        </form>
        {errors.comment && <p className="px-5 pb-3 text-[11px] text-rose-600">{errors.comment}</p>}
      </section>

      {/* Decision */}
      {!settled && !data.canDecide && (
        <p className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-white border border-[#dce5f4] rounded-lg px-4 py-3 print:hidden">
          <AlertCircle size={12} className="shrink-0 mt-0.5 text-slate-400" />
          This {doc.title.toLowerCase()} is {String(doc.status || '').toLowerCase()} and can no longer be approved or rejected here.
        </p>
      )}

      {!settled && data.canDecide && (
        <section className="rounded-xl border border-[#dce5f4] bg-white p-5 shadow-2xs print:hidden">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Your decision</h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Reviewing <strong>{doc.title} {doc.number}</strong>. This can be submitted once.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); submitDecision(decision); }} className="space-y-4">
            <fieldset>
              <legend className="sr-only">Decision</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: 'Approved', label: `Approve ${doc.title}`, hint: 'Confirms the document as issued.', icon: Check, tone: '#065f46', bg: '#d1fae5' },
                  { value: 'Rejected', label: 'Reject', hint: 'Sends it back to the sales team with your reason.', icon: X, tone: '#9f1239', bg: '#ffe4e6' },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = decision === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className="flex items-start gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors"
                      style={active ? { borderColor: opt.tone, background: opt.bg } : { borderColor: '#dce5f4', background: '#fff' }}
                    >
                      <input
                        type="radio"
                        name="decision"
                        value={opt.value}
                        checked={active}
                        onChange={() => setDecision(opt.value)}
                        className="mt-0.5 accent-blue-600"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: active ? opt.tone : '#334155' }}>
                          <Icon size={12} /> {opt.label}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">{opt.hint}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label className={labelClass} htmlFor="sales-portal-signer">
                Your name <span className="text-rose-500">*</span>
              </label>
              <input
                id="sales-portal-signer"
                type="text"
                className={fieldClass}
                value={signer}
                onChange={(e) => setSigner(e.target.value)}
                placeholder="Name of the person deciding"
              />
              {errors.signer && (
                <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5"><AlertCircle size={11} /> {errors.signer}</p>
              )}
            </div>

            {isReject && (
              <div>
                <label className={labelClass} htmlFor="sales-portal-reason">
                  Reason for rejecting <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="sales-portal-reason"
                  rows={3}
                  className={fieldClass}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. The rate for item 2 is higher than agreed."
                />
                {errors.rejectionReason && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5"><AlertCircle size={11} /> {errors.rejectionReason}</p>
                )}
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="sales-portal-comments">{isReject ? 'Additional notes' : 'Comments'}</label>
              <textarea
                id="sales-portal-comments"
                rows={2}
                className={fieldClass}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Optional."
              />
            </div>

            {errors.submit && (
              <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{errors.submit}</p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-[#dce5f4] pt-4">
              <Button type="button" size="lg" variant="danger" icon={X} disabled={submitting} onClick={() => submitDecision('Rejected')}>
                Reject
              </Button>
              <Button type="button" size="lg" icon={Check} disabled={submitting} onClick={() => submitDecision('Approved')}>
                Approve
              </Button>
            </div>
          </form>
        </section>
      )}
    </PortalShell>
  );
}
