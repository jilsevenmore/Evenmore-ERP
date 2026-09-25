import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Users,
  CornerUpLeft,
  Pencil,
  Trash2,
  Download,
  FileText,
  Layers,
  Loader2,
  Hash,
  MessageSquare,
} from 'lucide-react';
import { resolveFileUrl } from '../../../services/api';
import { EmptyStatePms } from '../components/EmptyStatePms';
import { MessageComposer } from './MessageComposer';
import {
  dayKey,
  dayLabel,
  formatBytes,
  fullStamp,
  initials,
  messageTime,
  renderMessageText,
} from './messengerFormat';

/**
 * ConversationThread — the right-hand pane of the Messenger tab.
 *
 * The global stylesheet gives every <button> `font: inherit`, which beats a
 * size utility on the button itself, so the small inline controls here carry
 * their size on an inner <span>.
 */

function Avatar({ name, color, size = 28 }) {
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center font-bold border"
      style={{
        width: size,
        height: size,
        fontSize: size < 28 ? 9 : 10,
        background: color ? `${color}1a` : '#f1f5f9',
        color: color ?? '#475569',
        borderColor: color ? `${color}33` : '#e2e8f0',
      }}
    >
      {initials(name)}
    </span>
  );
}

function Attachment({ attachment }) {
  const url = resolveFileUrl(attachment.url);
  const isImage = (attachment.contentType || '').startsWith('image/');
  if (isImage && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block" title={attachment.fileName}>
        <img
          src={url}
          alt={attachment.fileName}
          className="max-h-48 max-w-full rounded-lg border border-[#dce5f4] object-contain bg-white"
          loading="lazy"
        />
      </a>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#dce5f4] bg-white px-2.5 py-2 max-w-[280px]">
      <FileText size={16} className="shrink-0 text-rose-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-700 truncate" title={attachment.fileName}>
          {attachment.fileName}
        </p>
        <p className="text-[10px] text-slate-400">{formatBytes(attachment.fileSize)}</p>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          download={attachment.fileName}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-800 shrink-0"
        >
          <Download size={12} /> Download
        </a>
      )}
    </div>
  );
}

function MessageItem({ message, isOwn, currentUserId, highlighted, onReply, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <p className="text-[11px] italic text-slate-400 px-3 py-1.5 rounded-lg border border-dashed border-slate-200">
          {isOwn ? 'You deleted this message' : `${message.sender?.name} deleted a message`}
        </p>
      </div>
    );
  }

  async function saveEdit() {
    const text = draft.trim();
    if (!text || text === message.text) {
      setEditing(false);
      return;
    }
    const saved = await onEdit(message, text);
    if (saved) setEditing(false);
  }

  return (
    <div
      id={`chat-message-${message.id}`}
      className={`group flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {!isOwn && <Avatar name={message.sender?.name} />}
      <div className={`min-w-0 max-w-[85%] sm:max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[11px] font-bold text-slate-700">{isOwn ? 'You' : message.sender?.name}</span>
          <span className="text-[10px] text-slate-400" title={fullStamp(message.createdAt)}>
            {messageTime(message.createdAt)}
          </span>
          {message.isEdited && <span className="text-[10px] text-slate-400">· edited</span>}
        </div>

        <div
          className="rounded-xl border px-3 py-2 space-y-1.5 transition-shadow"
          style={{
            ...(isOwn
              ? { background: '#eff6ff', borderColor: '#bfdbfe' }
              : { background: '#fff', borderColor: '#e8eef8' }),
            ...(highlighted ? { boxShadow: '0 0 0 2px #fbbf24' } : {}),
          }}
        >
          {message.stageName && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f6f9ff] text-blue-700 border border-blue-100">
              <Layers size={10} /> Stage: {message.stageName}
            </span>
          )}

          {message.replyTo && (
            <div className="border-l-2 border-blue-300 pl-2 py-0.5">
              <p className="text-[10px] font-bold text-blue-700">{message.replyTo.senderName}</p>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {message.replyTo.isDeleted ? <em>Original message deleted</em> : message.replyTo.text}
              </p>
            </div>
          )}

          {editing ? (
            <div className="space-y-1.5 min-w-[220px]">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                  }
                  if (e.key === 'Escape') setEditing(false);
                }}
                rows={2}
                autoFocus
                aria-label="Edit message"
                className="w-full resize-none rounded-lg border border-[#dce5f4] bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-300"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(message.text);
                    setEditing(false);
                  }}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <span className="text-[10px]">Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  <span className="text-[10px]">Save</span>
                </button>
              </div>
            </div>
          ) : (
            message.text && (
              <p className="text-xs text-slate-700 whitespace-pre-wrap break-words">
                {renderMessageText(message.text, message.mentions, currentUserId)}
              </p>
            )
          )}

          {(message.attachments ?? []).length > 0 && (
            <div className="flex flex-col gap-1.5">
              {message.attachments.map((a) => (
                <Attachment key={a.id} attachment={a} />
              ))}
            </div>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-2 mt-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
            {confirmDelete ? (
              <>
                <span className="text-[10px] text-slate-500">Delete this message?</span>
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete(message);
                    setConfirmDelete(false);
                  }}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700"
                >
                  <span className="text-[10px]">Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  <span className="text-[10px]">Keep</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onReply(message)}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-blue-700"
                >
                  <CornerUpLeft size={11} /> <span className="text-[10px]">Reply</span>
                </button>
                {isOwn && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(message.text);
                        setEditing(true);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-blue-700"
                    >
                      <Pencil size={11} /> <span className="text-[10px]">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={11} /> <span className="text-[10px]">Delete</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConversationThread({
  conversation,
  thread,
  currentUserId,
  mentionCandidates,
  stages,
  stageId,
  onStageChange,
  highlightMessageId,
  onBack,
  onLoadOlder,
  onSend,
  onEdit,
  onDelete,
}) {
  const [replyTo, setReplyTo] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef(null);
  const stickToBottom = useRef(true);
  const lastMessageId = thread.messages[thread.messages.length - 1]?.id;

  // Keep the newest message in view unless the reader has scrolled up.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [lastMessageId, conversation?.id]);

  useEffect(() => {
    stickToBottom.current = true;
    setReplyTo(null);
    setShowMembers(false);
  }, [conversation?.id]);

  useEffect(() => {
    if (!highlightMessageId) return;
    document.getElementById(`chat-message-${highlightMessageId}`)?.scrollIntoView({ block: 'center' });
  }, [highlightMessageId, thread.messages.length]);

  const grouped = useMemo(() => {
    const groups = [];
    thread.messages.forEach((m) => {
      const key = dayKey(m.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.items.push(m);
      else groups.push({ key, label: dayLabel(m.createdAt), items: [m] });
    });
    return groups;
  }, [thread.messages]);

  if (!conversation) {
    return (
      <section className="hidden lg:flex rounded-xl border border-[#dce5f4] bg-white shadow-2xs min-h-[520px] items-center justify-center">
        <EmptyStatePms
          icon={MessageSquare}
          title="Select a conversation"
          description="Pick the Project Chat or a team on the left to read and send messages."
        />
      </section>
    );
  }

  const isTeam = conversation.kind === 'Team';
  const HeaderIcon = conversation.kind === 'Project' ? Hash : Users;

  return (
    <section className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs flex flex-col min-h-[520px] h-[70vh] lg:h-[620px]">
      {/* Header */}
      <header className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[#dce5f4]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="lg:hidden -ml-1 p-1 rounded-md text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
        </button>
        {conversation.kind === 'Direct' ? (
          <Avatar name={conversation.title} size={30} />
        ) : (
          <span
            className="shrink-0 w-[30px] h-[30px] rounded-lg flex items-center justify-center"
            style={{
              background: isTeam && conversation.color ? `${conversation.color}1a` : '#eff6ff',
              color: isTeam && conversation.color ? conversation.color : '#1f6bff',
            }}
          >
            <HeaderIcon size={15} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-800 truncate">{conversation.title}</h3>
          <button
            type="button"
            onClick={() => setShowMembers((v) => !v)}
            className="text-[11px] text-slate-500 hover:text-blue-700"
            aria-expanded={showMembers}
          >
            <span className="text-[11px]">
              {conversation.memberCount} member{conversation.memberCount === 1 ? '' : 's'}
              {!conversation.isActive && ' · team no longer on this project'}
            </span>
          </button>
        </div>
      </header>

      {showMembers && (
        <div className="px-3.5 py-2.5 border-b border-[#dce5f4] bg-[#f6f9ff] max-h-44 overflow-y-auto">
          <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Members</h4>
          {conversation.members.length === 0 ? (
            <p className="text-[11px] text-slate-400">Nobody is assigned to this team yet.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {conversation.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2 min-w-0">
                  <Avatar name={m.name} size={22} />
                  <span className="text-[11px] font-semibold text-slate-700 truncate">{m.name}</span>
                  {m.role === 'Project Manager' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">PM</span>
                  )}
                  {conversation.kind === 'Project' && m.teams?.length > 0 && (
                    <span className="text-[10px] text-slate-400 truncate">{m.teams.join(', ')}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
        className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 bg-[#fbfcff]"
      >
        {thread.hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                stickToBottom.current = false;
                onLoadOlder();
              }}
              disabled={thread.loading}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-[#dce5f4] bg-white text-slate-600 hover:text-blue-700 disabled:opacity-50"
            >
              <span className="text-[11px]">{thread.loading ? 'Loading…' : 'Load earlier messages'}</span>
            </button>
          </div>
        )}

        {!thread.loaded && thread.loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-[11px] text-slate-400">
            <Loader2 size={14} className="animate-spin" /> Loading messages…
          </div>
        )}

        {thread.loaded && thread.messages.length === 0 && (
          <EmptyStatePms
            icon={MessageSquare}
            title="No messages yet"
            description={`Start the conversation in ${conversation.title}.`}
          />
        )}

        {grouped.map((group) => (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400">{group.label}</span>
              <span className="flex-1 h-px bg-slate-200" />
            </div>
            {group.items.map((m) => (
              <MessageItem
                key={m.id}
                message={m}
                isOwn={m.sender?.id === currentUserId}
                currentUserId={currentUserId}
                highlighted={m.id === highlightMessageId}
                onReply={setReplyTo}
                onEdit={(msg, text) => onEdit(msg, text)}
                onDelete={onDelete}
              />
            ))}
          </div>
        ))}
      </div>

      <MessageComposer
        key={conversation.id}
        conversation={conversation}
        mentionCandidates={mentionCandidates}
        stages={stages}
        stageId={stageId}
        onStageChange={onStageChange}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={(payload) => {
          stickToBottom.current = true;
          return onSend(payload);
        }}
      />
    </section>
  );
}

export default ConversationThread;
