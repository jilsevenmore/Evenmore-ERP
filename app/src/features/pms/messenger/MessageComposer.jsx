import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Send, X, CornerUpLeft, Layers, FileText, Loader2 } from 'lucide-react';
import { formatBytes } from './messengerFormat';

/**
 * MessageComposer — text, @mentions, attachments, reply and stage context.
 *
 * Mentions are picked from the conversation's own audience (plus whole teams in
 * the Project Chat), because a mention notifies someone and they must be able
 * to open the chat it came from. The server re-checks this and drops any
 * `@name` that no longer appears in the text.
 */

const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip';
const MAX_FILES = 10;

export function MessageComposer({
  conversation,
  mentionCandidates = [],
  stages = [],
  stageId,
  onStageChange,
  replyTo,
  onCancelReply,
  onSend,
  disabled = false,
}) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null); // { start, query } while typing @…
  const [highlight, setHighlight] = useState(0);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  // Where the caret goes after a mention is inserted. Applied in the same
  // commit as the new text, so a keystroke right after the pick cannot land
  // before it.
  const caretAfterRender = useRef(null);

  useLayoutEffect(() => {
    if (caretAfterRender.current === null) return;
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(caretAfterRender.current, caretAfterRender.current);
    caretAfterRender.current = null;
  }, [text]);

  const suggestions = useMemo(() => {
    if (!mentionQuery) return [];
    const q = mentionQuery.query.toLowerCase();
    return mentionCandidates.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionCandidates, mentionQuery]);

  const stage = stages.find((s) => s.id === stageId) ?? null;

  function detectMention(value, caret) {
    const upto = value.slice(0, caret);
    const match = upto.match(/(^|\s)@([^@\n]{0,30})$/);
    if (match) {
      setMentionQuery({ start: caret - match[2].length - 1, query: match[2] });
      setHighlight(0);
    } else {
      setMentionQuery(null);
    }
  }

  function pickMention(candidate) {
    const caret = inputRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, mentionQuery.start);
    const after = text.slice(caret);
    const token = `@${candidate.name} `;
    const next = `${before}${token}${after}`;
    setText(next);
    setMentions((list) =>
      list.some((m) => m.type === candidate.type && m.id === candidate.id) ? list : [...list, candidate],
    );
    setMentionQuery(null);
    caretAfterRender.current = before.length + token.length;
  }

  function addFiles(list) {
    const picked = Array.from(list || []);
    setFiles((current) => [...current, ...picked].slice(0, MAX_FILES));
  }

  const canSend = !disabled && !sending && (text.trim().length > 0 || files.length > 0);

  async function submit() {
    if (!canSend) return;
    setSending(true);
    const body = text.trim();
    const sent = await onSend({
      text: body,
      files,
      replyToId: replyTo?.id,
      stageId: stageId || undefined,
      mentions: mentions
        .filter((m) => body.toLowerCase().includes(`@${m.name}`.toLowerCase()))
        .map(({ type, id }) => ({ type, id })),
    });
    setSending(false);
    if (sent) {
      setText('');
      setFiles([]);
      setMentions([]);
      onCancelReply?.();
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((h) => (h + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pickMention(suggestions[highlight]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-[#dce5f4] p-3 space-y-2 bg-white rounded-b-xl">
      {replyTo && (
        <div className="flex items-start gap-2 rounded-lg bg-[#f6f9ff] border border-[#dce5f4] px-2.5 py-1.5">
          <CornerUpLeft size={12} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-blue-700">Replying to {replyTo.sender?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {replyTo.text || replyTo.attachments?.map((a) => a.fileName).join(', ')}
            </p>
          </div>
          <button type="button" onClick={onCancelReply} aria-label="Cancel reply" className="text-slate-400 hover:text-slate-600">
            <X size={13} />
          </button>
        </div>
      )}

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 rounded-lg border border-[#dce5f4] bg-[#f6f9ff] pl-2 pr-1 py-1 max-w-[220px]"
            >
              <FileText size={12} className="shrink-0 text-slate-400" />
              <span className="truncate" title={file.name}>{file.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => setFiles((list) => list.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="text-slate-400 hover:text-rose-600 shrink-0"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative flex items-start gap-2">
        {suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute bottom-full mb-1 left-0 w-64 max-w-full rounded-lg border border-[#dce5f4] bg-white shadow-lg py-1 z-20"
            style={{ listStyle: 'none', margin: 0 }}
          >
            {suggestions.map((c, index) => (
              <li key={`${c.type}-${c.id}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlight}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickMention(c);
                  }}
                  className="w-full text-left flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px]"
                  style={index === highlight ? { background: '#f6f9ff', color: '#1f6bff' } : { color: '#334155' }}
                >
                  <span className="font-semibold truncate">@{c.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{c.type === 'team' ? 'Team' : c.role}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <textarea
          ref={inputRef}
          value={text}
          rows={2}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            detectMention(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setMentionQuery(null)}
          placeholder={`Message ${conversation?.title ?? ''}… (@ to mention)`}
          aria-label="Type a message"
          className="flex-1 min-w-0 resize-none rounded-lg border border-[#dce5f4] bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
        />
        {/* Beside the text, not in the toolbar: the app's floating support
            button sits over the bottom-right corner of the page. */}
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {sending ? 'Sending' : 'Send'}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || files.length >= MAX_FILES}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#dce5f4] text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <Paperclip size={12} /> Attach
        </button>

        {stages.length > 0 && (
          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Layers size={12} className="text-slate-400" />
            <span className="sr-only">Stage context</span>
            <select
              value={stageId ?? ''}
              onChange={(e) => onStageChange?.(e.target.value || null)}
              disabled={disabled}
              className="text-[11px] font-semibold rounded-lg border border-[#dce5f4] bg-white px-2 py-1.5 text-slate-600 focus:outline-none focus:border-blue-300"
              style={stage ? { borderColor: '#bfdbfe', color: '#1d4ed8', background: '#f6f9ff' } : undefined}
            >
              <option value="">No stage</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  Stage: {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

      </div>
    </div>
  );
}

export default MessageComposer;
