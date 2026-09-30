/**
 * leadDetailSections — one lead's sub-collections, translated both ways.
 *
 * The lead drawer's tabs render rows in their own shape (a product's `price`
 * is the label "Rs. 1,000", a call has `by` and `date`, a note has `text`);
 * the API answers with its columns (`price: 1000`, `calledByName`, `body`).
 * Without a translation, a row saved from a tab came back blank after a reload,
 * and fields the API does not know were silently dropped on the way in.
 */
import { resolveFileUrl } from './api';

const num = (value) => {
  const n = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** `29/09/2026 10:00`, the stamp the tabs print. */
export function stamp(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

const day = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-GB') : '';
};

const initials = (name) => String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

const sourceIcon = (label) => (label === 'Referral' ? 'user' : label === 'Advertisement' ? 'megaphone' : 'globe');

/** Minutes typed as "5" or "5 min" -> seconds; "-" is unknown. */
const toSeconds = (duration) => {
  const minutes = Number(String(duration ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : 0;
};

export const SECTION_MAPPERS = {
  users: {
    toApi: (row) => ({ userId: row.userId || row.id, role: row.role || undefined }),
    fromApi: (row) => ({
      ...row,
      initials: initials(row.name),
      status: 'Active',
      bg: '#3b82f6',
    }),
  },
  products: {
    toApi: (row) => ({
      name: row.name,
      sku: row.sku || undefined,
      price: row.price !== undefined && row.price !== '' ? num(row.price) : undefined,
      qty: row.qty !== undefined ? num(row.qty) : undefined,
      status: row.status || undefined,
    }),
    fromApi: (row) => ({
      ...row,
      name: row.name || row.productName || '',
      sku: row.sku || '',
      price: row.price != null ? `Rs. ${Number(row.price).toLocaleString('en-IN')}` : '',
      qty: Number(row.qty) || 1,
      status: row.status || 'Active',
    }),
  },
  sources: {
    toApi: (row) => ({ label: row.source || row.label, details: row.details || undefined }),
    fromApi: (row) => ({
      ...row,
      source: row.name || row.label || '',
      sourceType: String(row.name || row.label || '').toLowerCase(),
      details: row.details || '',
      date: stamp(row.attributedAt || row.createdAt),
      createdBy: '',
      avatar: '',
      color: '#1f6bff',
      icon: sourceIcon(row.name || row.label),
    }),
  },
  emails: {
    toApi: (row) => ({
      subject: row.subject,
      body: row.body || row.preview || undefined,
      toAddresses: row.to ? [].concat(row.to) : undefined,
      sentAt: new Date().toISOString(),
    }),
    fromApi: (row) => ({
      ...row,
      date: stamp(row.sentAt || row.createdAt),
      person: (row.toAddresses || []).join(', '),
      avatar: '',
      status: row.sentAt ? 'Sent' : 'Draft',
      statusColor: row.sentAt ? 'green' : 'slate',
    }),
  },
  timeline: {
    // Read-only: the server builds it from notes, calls, emails, tasks and the audit log.
    fromApi: (row) => ({
      ...row,
      type: row.type === 'email' ? 'sent' : row.type,
      preview: row.body || '',
      date: stamp(row.at),
      time: row.at,
      timestamp: row.at,
      author: row.actor || '',
      dotColor: { email: '#10b981', call: '#2563eb', note: '#f59e0b', task: '#7c3aed' }[row.type] || '#94a3b8',
    }),
  },
  files: {
    toApi: (row) => ({ fileId: row.fileId, label: row.description || row.name || undefined }),
    fromApi: (row) => {
      const url = resolveFileUrl(row.url || '');
      const image = /\.(png|jpe?g|gif|webp|svg)$/i.test(row.fileName || '');
      return {
        ...row,
        type: image ? 'image' : 'document',
        name: row.fileName || row.label || 'File',
        size: row.fileSize ? `${Math.max(1, Math.round(row.fileSize / 1024))} KB` : '',
        sentOn: day(row.createdAt),
        sentBy: '',
        preview: image ? url : '',
        downloadUrl: url,
        description: row.label || '',
      };
    },
  },
  calls: {
    toApi: (row) => ({
      subject: row.subject || undefined,
      phone: row.phone || undefined,
      direction: row.callType || row.direction || undefined,
      outcome: row.outcome || undefined,
      durationSeconds: toSeconds(row.duration),
      notes: row.notes || row.description || undefined,
    }),
    fromApi: (row) => ({
      ...row,
      date: stamp(row.calledAt),
      by: row.calledByName || '',
      duration: row.durationSeconds ? `${Math.round(row.durationSeconds / 60)} min` : '-',
      notes: row.notes || '',
    }),
  },
  notes: {
    toApi: (row) => ({ body: row.body || row.text }),
    fromApi: (row) => ({ ...row, text: row.body || '', by: row.authorName || '' }),
  },
  threads: {},
};

export function sectionToApi(section, row) {
  const toApi = SECTION_MAPPERS[section]?.toApi;
  const payload = toApi ? toApi(row) : row;
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
}

export function sectionFromApi(section, row) {
  const fromApi = SECTION_MAPPERS[section]?.fromApi;
  return { ...(fromApi ? fromApi(row) : row), _synced: true };
}
