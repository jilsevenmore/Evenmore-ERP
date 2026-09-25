import React, { useEffect, useState } from 'react';
import {
  AlertCircle, Link2, Copy, Check, ExternalLink, Ban, Building2, FileText, Clock, Mail,
  MessageCircle,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { usePmsStore } from '../../../stores/pmsStore';
import { useProofShareStore, shareUrlFor, DEFAULT_VALIDITY_DAYS } from '../../../stores/proofShareStore';
import { formatCurrency } from '../../../utils/currencyUtils';

/**
 * ShareProofModal — issue a client-facing approval link for one proof version.
 *
 * The link carries the drawing, the order and product details, and the two
 * decisions the client can make. Issuing a link also circulates the proof, so a
 * version that has not been sent yet moves to "with client" in the same step.
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

export function ShareProofModal({ isOpen, onClose, project, stage, document: doc, canCirculate }) {
  const requestApproval = usePmsStore((s) => s.requestApproval);
  const showToast = usePmsStore((s) => s.showToast);
  const createShare = useProofShareStore((s) => s.createShare);
  const revokeShare = useProofShareStore((s) => s.revokeShare);
  const loadShares = useProofShareStore((s) => s.loadShares);
  const shares = useProofShareStore((s) => s.shares);

  const existing = shares.find(
    (s) => s.documentId === doc?.id && s.status === 'Active' && !s.decision
  ) ?? null;

  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [validityDays, setValidityDays] = useState(DEFAULT_VALIDITY_DAYS);
  const [message, setMessage] = useState('');
  const [issued, setIssued] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});
  const [generating, setGenerating] = useState(false);

  // Reset only when the modal opens or the version changes. Keyed on ids, not
  // the objects: issuing a link circulates the proof, which rewrites the
  // project in the store — keyed on the object, that wiped the freshly issued
  // link (and the note) the moment it appeared.
  const docId = doc?.id;
  const customerName = project?.customerName ?? '';
  useEffect(() => {
    if (!isOpen) return;
    setRecipientName(customerName);
    setRecipientEmail('');
    setValidityDays(DEFAULT_VALIDITY_DAYS);
    setMessage('');
    setIssued(null);
    setCopied(false);
    setErrors({});
    // Pull this version's links so a live one shows instead of a blank form.
    if (docId) loadShares(docId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- customerName is the opening default only
  }, [isOpen, docId, loadShares]);

  // An existing live link is what the modal shows first — no need to re-issue.
  // A row without a token can never open (e.g. issued before the token
  // mapping fix) — never let it masquerade as the live link.
  const active = issued ?? (existing?.token ? existing : null);
  const activeUrl = active ? shareUrlFor(active.token) : '';

  // Ready-to-send wording for the email / WhatsApp buttons.
  const productName = project?.productDetails?.productName || 'your order';
  const sendTo = active?.recipientName || recipientName || project?.customerName || '';
  const note = active?.message || message.trim();
  const shareSubject = `Design approval: ${productName} (${project?.code || project?.id || ''})`;
  const shareBody = [
    `Hello${sendTo ? ` ${sendTo}` : ''},`,
    '',
    `Please review the design proof for ${productName} — ${doc?.fileName} (v${doc?.version}.0).`,
    ...(note ? ['', note] : []),
    '',
    'You can view the drawing and product details, leave comments, and approve or reject it here:',
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
    if (!recipientName.trim()) found.recipientName = 'Name the person who will sign off.';
    if (recipientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      found.recipientEmail = 'That does not look like an email address.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0 || generating) return;

    // A failed request used to reject unhandled — the button looked dead.
    let share = null;
    setGenerating(true);
    try {
      share = await createShare({
        projectId: project.id,
        stageId: stage.id,
        documentId: doc.id,
        documentVersion: doc.version,
        fileName: doc.fileName,
        fileKey: doc.fileKey ?? null,
        mimeType: doc.mimeType ?? null,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        createdBy: project.projectManager?.name ?? '',
        validityDays: Number(validityDays) || DEFAULT_VALIDITY_DAYS,
        message: message.trim(),
      });
    } catch (err) {
      setErrors({ form: err?.message || 'The server could not issue a link. Please try again.' });
      return;
    } finally {
      setGenerating(false);
    }

    if (!share || !share.token) {
      setErrors({
        form: share
          ? 'The server could not issue a link. Please try again.'
          : 'Approval links need the server — this project is not connected to the backend.',
      });
      return;
    }

    // Issuing a link is the circulation. If the proof has not been sent yet,
    // open the approval record now so the stage reads "awaiting decision".
    if (canCirculate) {
      requestApproval(project.id, stage.id, doc.id, {
        approverName: recipientName.trim(),
        actor: project.projectManager,
      });
    }

    setIssued(share);
    showToast(`Approval link generated for v${doc.version}.0.`, 'success', 'onApproval');
  }

  if (!project || !stage || !doc) return null;

  // Rows written before real uploads carried a '/mock/' placeholder path.
  const hasFile = Boolean(
    doc.fileKey || doc.fileId || doc.fileData || (doc.previewUrl && !doc.previewUrl.startsWith('/mock/'))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Approval Link"
      subtitle={`${doc.fileName} — v${doc.version}.0`}
      size="lg"
      footer={
        active ? (
          <>
            <Button
              variant="secondary"
              type="button"
              icon={Ban}
              onClick={() => {
                revokeShare(active.token);
                setIssued(null);
                showToast('Approval link revoked.', 'info', 'onApproval');
              }}
            >
              Revoke Link
            </Button>
            <Button type="button" onClick={onClose}>Done</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="pms-share-proof" icon={Link2} disabled={generating}>
              {generating ? 'Generating…' : 'Generate Link'}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {/* What the link will carry — the same summary the client sees */}
        <section className="rounded-lg border border-[#dce5f4] bg-[#f6f9ff] p-3">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
              <Building2 size={15} className="text-slate-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800">{project.customerName}</p>
              <p className="text-[11px] text-slate-600 truncate">
                {project.productDetails?.productName}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                <FileText size={10} className="text-slate-400" />
                {doc.fileName}
                <span className="font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  v{doc.version}.0
                </span>
                {hasFile ? (
                  <span className="font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    File attached
                  </span>
                ) : (
                  <span className="font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    No file attached
                  </span>
                )}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-[#dce5f4]">
            {[
              ['Project', project.code || project.id],
              ['CRM order', project.crmOrderId ?? '—'],
              ['Order value', formatCurrency(project.productDetails?.orderValue ?? 0)],
              ['Quantity', project.productDetails?.quantity ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[10px] text-slate-400">{k}</dt>
                <dd className="text-[11px] font-semibold text-slate-700 truncate" title={String(v)}>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

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
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  icon={copied ? Check : Copy}
                  onClick={copyLink}
                  title="Copy the link"
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open the client view"
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

              {/* Send it — opens the mail app / WhatsApp with the message filled in */}
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
                Anyone with this link can view the drawing, the product description and the order
                details, leave comments, and record an <strong> Approve</strong> or <strong> Reject</strong>{' '}
                decision once. Comments and the decision land back on this project&apos;s Design Proofs tab.
              </span>
            </p>
          </>
        ) : (
          /* ── Not issued yet: the form ── */
          <form id="pms-share-proof" onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="share-name">
                  Send to <span className="text-rose-500">*</span>
                </label>
                <input
                  id="share-name"
                  type="text"
                  className={fieldClass}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Client contact who signs off"
                />
                {errors.recipientName && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                    <AlertCircle size={11} /> {errors.recipientName}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="share-email">Email (for your records)</label>
                <input
                  id="share-email"
                  type="email"
                  className={fieldClass}
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="name@client.com"
                />
                {errors.recipientEmail && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                    <AlertCircle size={11} /> {errors.recipientEmail}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="share-validity">Link valid for</label>
              <select
                id="share-validity"
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
              <label className={labelClass} htmlFor="share-message">Note to the client</label>
              <textarea
                id="share-message"
                rows={2}
                className={fieldClass}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Please confirm the bracket positions before we cut steel."
              />
            </div>

            <p className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-[#f6f9ff] border border-[#dce5f4] rounded-lg px-3 py-2">
              <Mail size={12} className="shrink-0 mt-0.5 text-blue-500" />
              <span>
                Generating a link {canCirculate ? 'circulates this version and ' : ''}
                opens a client-facing page with the drawing, the order and product details, and
                Approve / Reject buttons. Any earlier live link for this version is revoked.
              </span>
            </p>

            {errors.form && (
              <p className="flex items-start gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <AlertCircle size={12} className="shrink-0 mt-0.5" /> {errors.form}
              </p>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
}

export default ShareProofModal;
