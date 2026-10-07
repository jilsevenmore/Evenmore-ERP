import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, Link2, Copy, Check, ExternalLink, Ban, Building2, FileText, Clock, Mail,
  MessageCircle, Send, XCircle, CheckCircle2,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { isServerId } from '../../../services/backendSync';
import {
  APPROVAL_DOC_LABELS,
  DEFAULT_APPROVAL_VALIDITY_DAYS,
  approvalUrlFor,
  createApprovalLink,
  listApprovalComments,
  listApprovalLinks,
  postApprovalComment,
  revokeApprovalLink,
} from '../../../services/salesApprovalLinks';
import { formatCurrency } from '../../../utils/currencyUtils';

/**
 * ShareApprovalLinkModal — issue a customer approval link for an estimate,
 * quotation, proforma invoice or sales invoice. The sales twin of the PMS
 * ShareProofModal: the link opens `/sales/approve/:token`, where the customer
 * reads the document, comments, and approves or rejects it once.
 *
 * `document` is the screen's record: { id, number, customerName, total, status }.
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

function isLive(link) {
  return link?.status === 'Active' && !link.decision && new Date(link.expiresAt) > new Date();
}

function linkBadge(link) {
  if (link.decision === 'Approved') return ['Approved', 'bg-emerald-100 text-emerald-700'];
  if (link.decision === 'Rejected') return ['Rejected', 'bg-rose-100 text-rose-700'];
  if (link.status === 'Revoked') return ['Revoked', 'bg-slate-200 text-slate-600'];
  if (!isLive(link)) return ['Expired', 'bg-amber-100 text-amber-800'];
  return ['Awaiting customer', 'bg-blue-100 text-blue-700'];
}

export function ShareApprovalLinkModal({ isOpen, onClose, docType, document: doc }) {
  const label = APPROVAL_DOC_LABELS[docType] || 'Document';
  const docId = doc?.id;
  const saved = isServerId(docId);

  const [links, setLinks] = useState([]);
  const [thread, setThread] = useState([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [validityDays, setValidityDays] = useState(DEFAULT_APPROVAL_VALIDITY_DAYS);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [issued, setIssued] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!saved) return;
    try {
      const [linkRows, commentRows] = await Promise.all([
        listApprovalLinks(docType, docId),
        listApprovalComments(docType, docId),
      ]);
      setLinks(linkRows);
      setThread(commentRows);
    } catch (err) {
      setErrors((prev) => ({ ...prev, load: err?.message || 'Could not load approval links.' }));
    }
  }, [docType, docId, saved]);

  // Reset only when the modal opens or the document changes.
  const customerName = doc?.customerName ?? '';
  useEffect(() => {
    if (!isOpen) return;
    setRecipientName(customerName);
    setRecipientEmail('');
    setValidityDays(DEFAULT_APPROVAL_VALIDITY_DAYS);
    setMessage('');
    setReply('');
    setIssued(null);
    setCopied(false);
    setErrors({});
    setLinks([]);
    setThread([]);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- customerName is the opening default only
  }, [isOpen, docId]);

  const live = links.find(isLive) ?? null;
  const latestDecision = links.find((l) => l.decision) ?? null;
  const active = issued;
  const activeUrl = active ? approvalUrlFor(active.token) : '';

  // Ready-to-send wording for the email / WhatsApp buttons.
  const sendTo = active?.recipientName || recipientName || customerName;
  const note = active?.message || message.trim();
  const shareSubject = `${label} ${doc?.number || ''} for your approval`;
  const shareBody = [
    `Hello${sendTo ? ` ${sendTo}` : ''},`,
    '',
    `Please review ${label.toLowerCase()} ${doc?.number || ''}${doc?.total != null ? ` (${formatCurrency(doc.total)})` : ''}.`,
    ...(note ? ['', note] : []),
    '',
    'You can view the document, leave comments, and approve or reject it here:',
    activeUrl,
    '',
    `This link is valid until ${stamp(active?.expiresAt)}.`,
  ].join('\n');
  const recipientEmailFor = active?.recipientEmail || recipientEmail.trim();
  const mailtoHref = `mailto:${encodeURIComponent(recipientEmailFor)}?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareBody)}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareBody)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrors({ copy: 'Clipboard access was blocked — select the link and copy it manually.' });
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    const found = {};
    if (!recipientName.trim()) found.recipientName = 'Name the person who will approve it.';
    if (recipientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      found.recipientEmail = 'That does not look like an email address.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0 || busy) return;

    setBusy(true);
    try {
      const link = await createApprovalLink(docType, docId, {
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        expiryDays: Number(validityDays) || DEFAULT_APPROVAL_VALIDITY_DAYS,
        message: message.trim(),
      });
      if (!link.token) throw new Error('The server could not issue a link. Please try again.');
      setIssued(link);
      refresh();
    } catch (err) {
      setErrors({ form: err?.message || 'The server could not issue a link. Please try again.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(link) {
    if (!link || busy) return;
    setBusy(true);
    try {
      await revokeApprovalLink(docType, docId, link.id);
      if (issued?.id === link.id) setIssued(null);
      await refresh();
    } catch (err) {
      setErrors({ form: err?.message || 'Could not revoke the link.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!reply.trim() || busy) return;
    setBusy(true);
    try {
      setThread(await postApprovalComment(docType, docId, reply.trim()));
      setReply('');
    } catch (err) {
      setErrors({ reply: err?.message || 'Could not post the comment.' });
    } finally {
      setBusy(false);
    }
  }

  if (!doc) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share for Customer Approval"
      subtitle={`${label} ${doc.number || ''}`}
      size="lg"
      footer={
        active ? (
          <>
            <Button variant="secondary" type="button" icon={Ban} disabled={busy} onClick={() => handleRevoke(active)}>
              Revoke Link
            </Button>
            <Button type="button" onClick={onClose}>Done</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" type="button" onClick={onClose}>Close</Button>
            {saved && (
              <Button type="submit" form="sales-approval-link" icon={Link2} disabled={busy}>
                {busy ? 'Working…' : live ? 'Generate New Link' : 'Generate Link'}
              </Button>
            )}
          </>
        )
      }
    >
      <div className="space-y-4">
        {/* What the link will carry */}
        <section className="rounded-lg border border-[#dce5f4] bg-[#f6f9ff] p-3">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
              <Building2 size={15} className="text-slate-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800">{doc.customerName || '—'}</p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                <FileText size={10} className="text-slate-400" />
                {label} {doc.number}
                {doc.status && (
                  <span className="font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">{doc.status}</span>
                )}
              </p>
            </div>
            {doc.total != null && (
              <p className="text-sm font-black text-slate-800 shrink-0">{formatCurrency(doc.total)}</p>
            )}
          </div>
        </section>

        {!saved && (
          <p className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            This {label.toLowerCase()} has not been saved to the server yet. Save it, then share it.
          </p>
        )}

        {latestDecision && (
          <section
            className={`rounded-lg border px-3 py-2.5 text-[11px] ${latestDecision.decision === 'Approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}
          >
            <p className="flex items-center gap-1.5 font-bold">
              {latestDecision.decision === 'Approved' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {latestDecision.decision} by {latestDecision.decidedBy || 'customer'} on {stamp(latestDecision.decidedAt)}
            </p>
            {latestDecision.rejectionReason && (
              <p className="mt-1"><strong>Reason:</strong> {latestDecision.rejectionReason}</p>
            )}
            {latestDecision.decisionComments && (
              <p className="mt-1"><strong>Comments:</strong> {latestDecision.decisionComments}</p>
            )}
          </section>
        )}

        {active ? (
          /* ── Issued: show the link ── */
          <>
            <div>
              <span className={labelClass}>Shareable approval link</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={activeUrl}
                  onFocus={(e) => e.target.select()}
                  aria-label="Approval link"
                  className={`${fieldClass} font-mono text-[10.5px]`}
                />
                <Button size="sm" variant="secondary" type="button" icon={copied ? Check : Copy} onClick={copyLink} title="Copy the link">
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open the customer view"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-soft hover:bg-card-hover px-3 py-1.5 text-xs font-semibold text-text shadow-2xs"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              {errors.copy && (
                <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                  <AlertCircle size={11} /> {errors.copy}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-[11px] font-semibold text-slate-500">Send via</span>
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#dce5f4] bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                  title={recipientEmailFor ? `Email ${recipientEmailFor}` : 'Open an email with the link'}
                >
                  <Mail size={13} /> Email
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#dce5f4] bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                  title="Share the link on WhatsApp"
                >
                  <MessageCircle size={13} /> WhatsApp
                </a>
              </div>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-[#dce5f4] bg-white px-3 py-2.5">
              {[
                ['Issued to', active.recipientName || '—'],
                ['Issued at', stamp(active.createdAt)],
                ['Expires', stamp(active.expiresAt)],
                ['First opened', active.openedAt ? stamp(active.openedAt) : 'Not opened yet'],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[10px] text-slate-400">{k}</dt>
                  <dd className="text-[11px] font-semibold text-slate-700 truncate" title={String(v)}>{v}</dd>
                </div>
              ))}
            </dl>

            <p className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-[#f6f9ff] border border-[#dce5f4] rounded-lg px-3 py-2">
              <Clock size={12} className="shrink-0 mt-0.5 text-blue-500" />
              <span>
                Anyone with this link can view the {label.toLowerCase()}, leave comments, and record an
                <strong> Approve</strong> or <strong> Reject</strong> decision once. You are notified when they decide.
                Copy the link now — for security it is not shown again after you close this window.
              </span>
            </p>
          </>
        ) : saved ? (
          /* ── Not issued in this window: the form ── */
          <form id="sales-approval-link" onSubmit={handleGenerate} className="space-y-4">
            {live && (
              <div className="flex items-start justify-between gap-2 text-[11px] text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <span>
                  A link sent to <strong>{live.recipientName || 'the customer'}</strong> is live until {stamp(live.expiresAt)}
                  {live.openedAt ? ` (opened ${stamp(live.openedAt)})` : ' (not opened yet)'}. Generating a new link replaces it.
                </span>
                <button
                  type="button"
                  onClick={() => handleRevoke(live)}
                  disabled={busy}
                  className="shrink-0 font-semibold text-rose-700 hover:underline"
                >
                  Revoke
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="sales-share-name">
                  Send to <span className="text-rose-500">*</span>
                </label>
                <input
                  id="sales-share-name"
                  type="text"
                  className={fieldClass}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Customer contact who approves"
                />
                {errors.recipientName && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                    <AlertCircle size={11} /> {errors.recipientName}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass} htmlFor="sales-share-email">Email (for your records)</label>
                <input
                  id="sales-share-email"
                  type="email"
                  className={fieldClass}
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="name@customer.com"
                />
                {errors.recipientEmail && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                    <AlertCircle size={11} /> {errors.recipientEmail}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="sales-share-validity">Link valid for</label>
              <select
                id="sales-share-validity"
                className={fieldClass}
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
              >
                {[3, 7, 14, 30].map((d) => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="sales-share-message">Note to the customer</label>
              <textarea
                id="sales-share-message"
                rows={2}
                className={fieldClass}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Prices are valid for 15 days. Please confirm so we can schedule production."
              />
            </div>

            {errors.form && (
              <p className="flex items-start gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <AlertCircle size={12} className="shrink-0 mt-0.5" /> {errors.form}
              </p>
            )}
          </form>
        ) : null}

        {/* Review thread — the customer's comments and the team's replies */}
        {saved && (
          <section className="rounded-lg border border-[#dce5f4] bg-white">
            <header className="flex items-center gap-1.5 px-3 py-2 border-b border-[#dce5f4]">
              <MessageCircle size={12} className="text-blue-500" />
              <h3 className="text-[11px] font-bold text-slate-700">Comments with the customer</h3>
            </header>
            <ul className="max-h-48 overflow-y-auto divide-y divide-[#eef2f8]">
              {thread.length === 0 ? (
                <li className="px-3 py-2.5 text-[11px] text-slate-400">No comments yet.</li>
              ) : thread.map((c) => (
                <li key={c.id} className="px-3 py-2">
                  <p className="text-[10px] text-slate-400">
                    <strong className={c.authorType === 'Client' ? 'text-blue-700' : 'text-slate-600'}>
                      {c.author || (c.authorType === 'Client' ? 'Customer' : 'Team')}
                    </strong>
                    {c.authorType === 'Client' ? ' (customer)' : ''} · {stamp(c.createdAt)}
                  </p>
                  <p className="text-[11px] text-slate-700 whitespace-pre-wrap">{c.text}</p>
                </li>
              ))}
            </ul>
            <form onSubmit={handleReply} className="flex items-center gap-1.5 border-t border-[#dce5f4] p-2">
              <input
                type="text"
                className={fieldClass}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply to the customer…"
                aria-label="Reply to the customer"
              />
              <Button size="sm" type="submit" icon={Send} disabled={busy || !reply.trim()}>Send</Button>
            </form>
            {errors.reply && <p className="px-3 pb-2 text-[11px] text-rose-600">{errors.reply}</p>}
          </section>
        )}

        {/* Every link issued for this document */}
        {links.length > 0 && (
          <section>
            <h3 className="text-[11px] font-bold text-slate-600 mb-1.5">Link history</h3>
            <ul className="space-y-1">
              {links.map((l) => {
                const [text, tone] = linkBadge(l);
                return (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-[11px] rounded-lg border border-[#eef2f8] px-3 py-1.5">
                    <span className="min-w-0 truncate text-slate-600">
                      {l.recipientName || '—'} · issued {stamp(l.createdAt)}{l.createdBy ? ` by ${l.createdBy}` : ''}
                    </span>
                    <span className={`shrink-0 font-bold px-1.5 py-0.5 rounded-full ${tone}`}>{text}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {errors.load && <p className="text-[11px] text-rose-600">{errors.load}</p>}
      </div>
    </Modal>
  );
}

export default ShareApprovalLinkModal;
