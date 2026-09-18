import { create } from 'zustand';

/**
 * proofShareStore — the approval links issued against a design proof.
 *
 * Kept out of pmsStore deliberately: a link is a circulation artefact, not part
 * of a project's own record, and the decision it carries is written back through
 * pmsStore.decideDocument so every stage rule and audit entry still applies.
 *
 * With no backend, a token resolves against this browser's localStorage. The
 * link is therefore shareable within the same browser profile — the shape of the
 * record is what a server-issued link would carry.
 */

const LS = 'pms_proof_shares_v1';

/** Links go stale on their own so a circulated drawing does not stay open forever. */
export const DEFAULT_VALIDITY_DAYS = 14;

function load() {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupt or unavailable storage — start clean */
  }
  return null;
}

function persist(shares) {
  try {
    localStorage.setItem(LS, JSON.stringify({ shares }));
  } catch {
    /* quota or private mode — the link simply will not survive a reload */
  }
}

function makeToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** The public URL for a token, absolute so it can be pasted into an email. */
export function shareUrlFor(token) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/pms/approve/${token}`;
}

/**
 * Why a link cannot be opened, or null when it is good to use.
 * Callers render this verbatim, so each reason is written for the client.
 */
export function shareBlockReason(share, now = Date.now()) {
  if (!share) return 'not-found';
  if (share.status === 'Revoked') return 'revoked';
  if (share.decision) return 'decided';
  if (share.expiresAt && new Date(share.expiresAt).getTime() < now) return 'expired';
  return null;
}

const saved = load();

export const useProofShareStore = create((set, get) => ({
  shares: saved?.shares ?? [],

  /**
   * Issue a link for one document version. Re-issuing for the same document
   * revokes the previous live link, so only one circulation is ever open.
   */
  createShare: ({
    projectId,
    stageId,
    documentId,
    documentVersion,
    fileName,
    fileKey = null,
    mimeType = null,
    recipientName = '',
    recipientEmail = '',
    createdBy = '',
    validityDays = DEFAULT_VALIDITY_DAYS,
    message = '',
  }) => {
    const now = new Date();
    const share = {
      token: makeToken(),
      projectId,
      stageId,
      documentId,
      documentVersion,
      fileName,
      fileKey,
      mimeType,
      recipientName,
      recipientEmail,
      createdBy,
      message,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + validityDays * 86400000).toISOString(),
      status: 'Active',
      decision: null,
      decidedAt: null,
      decidedBy: '',
      decisionComments: '',
      revisionReason: '',
      openedAt: null,
    };

    set((st) => {
      // Supersede any live link on the same document.
      const shares = [
        share,
        ...st.shares.map((s) =>
          s.documentId === documentId && s.status === 'Active' && !s.decision
            ? { ...s, status: 'Revoked', revokedAt: now.toISOString(), revokedReason: 'Superseded by a newer link' }
            : s
        ),
      ];
      persist(shares);
      return { shares };
    });

    return share;
  },

  revokeShare: (token, reason = 'Revoked by the project manager') =>
    set((st) => {
      const shares = st.shares.map((s) =>
        s.token !== token ? s : { ...s, status: 'Revoked', revokedAt: new Date().toISOString(), revokedReason: reason }
      );
      persist(shares);
      return { shares };
    }),

  /** Stamp the first time the client opened the link — shown on the PM's side. */
  markOpened: (token) =>
    set((st) => {
      const share = st.shares.find((s) => s.token === token);
      if (!share || share.openedAt) return st;
      const shares = st.shares.map((s) =>
        s.token !== token ? s : { ...s, openedAt: new Date().toISOString() }
      );
      persist(shares);
      return { shares };
    }),

  /** Close the link out once the client has decided. */
  recordDecision: (token, { decision, decidedBy, comments = '', revisionReason = '' }) =>
    set((st) => {
      const shares = st.shares.map((s) =>
        s.token !== token
          ? s
          : {
              ...s,
              status: 'Used',
              decision,
              decidedAt: new Date().toISOString(),
              decidedBy,
              decisionComments: comments,
              revisionReason,
            }
      );
      persist(shares);
      return { shares };
    }),

  getShare: (token) => get().shares.find((s) => s.token === token) ?? null,

  /** Live link for a document, if one is open. */
  getActiveShareFor: (documentId) =>
    get().shares.find((s) => s.documentId === documentId && s.status === 'Active' && !s.decision) ?? null,

  /** Every link ever issued for a document, newest first. */
  getSharesFor: (documentId) =>
    get().shares.filter((s) => s.documentId === documentId),
}));

export default useProofShareStore;
