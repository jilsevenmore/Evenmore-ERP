import React from 'react';

/** Formatting shared by the conversation list, the thread and the composer. */

function toDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** `11:20` today, `Yesterday`, `25 Sep` this year, `25 Sep 2025` otherwise. */
export function listTime(value) {
  const d = toDate(value);
  if (!d) return '';
  const now = new Date();
  if (sameDay(d, now)) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

/** `11:20 AM` — the time under each message. */
export function messageTime(value) {
  const d = toDate(value);
  return d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
}

/** Full stamp for tooltips: `25 Sep 2026, 11:20`. */
export function fullStamp(value) {
  const d = toDate(value);
  return d
    ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
}

/** Day divider label: `Today`, `Yesterday`, `25 Sep 2026`. */
export function dayLabel(value) {
  const d = toDate(value);
  if (!d) return '';
  const now = new Date();
  if (sameDay(d, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dayKey(value) {
  const d = toDate(value);
  return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : '';
}

export function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Message text with its validated mentions highlighted. Only mentions the
 * server kept are highlighted, so an `@word` that tagged nobody stays plain.
 */
export function renderMessageText(text, mentions = [], currentUserId = null) {
  if (!text) return null;
  const names = mentions.map((m) => m.name).filter(Boolean);
  if (names.length === 0) return text;

  const byName = new Map(mentions.map((m) => [m.name.toLowerCase(), m]));
  const pattern = new RegExp(
    `(@(?:${names.sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')}))`,
    'gi',
  );
  return text.split(pattern).map((part, index) => {
    const mention = part.startsWith('@') ? byName.get(part.slice(1).toLowerCase()) : null;
    if (!mention) return <React.Fragment key={index}>{part}</React.Fragment>;
    const isMe = mention.type === 'user' && mention.id === currentUserId;
    return (
      <span
        key={index}
        className="font-semibold rounded px-0.5"
        style={isMe ? { background: '#fef3c7', color: '#92400e' } : { background: '#dbeafe', color: '#1d4ed8' }}
      >
        {part}
      </span>
    );
  });
}
