import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Hash, Users, Search, X, Plus, MessageSquare, WifiOff, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { EmptyStatePms } from '../components/EmptyStatePms';
import { searchMessages } from '../../../services/pmsSync';
import { usePresence } from '../../../services/realtime';
import { ConversationThread, OnlineDot } from './ConversationThread';
import { initials, listTime } from './messengerFormat';

/**
 * MessengerTab — the project's Messenger: Project Chat, one chat per team on
 * the project's stages, and direct messages between project members.
 *
 * Desktop shows the conversation rail beside the open thread, the same
 * rail-plus-panel layout as Design Proofs. Below `lg` the rail and the thread
 * take turns, with a back arrow in the thread header.
 */

function UnreadBadge({ count }) {
  if (!count) return null;
  return (
    <span className="text-[9px] font-bold min-w-[18px] text-center px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function SectionLabel({ children, action }) {
  return (
    <div className="flex items-center justify-between mt-3 mb-1.5 px-0.5">
      <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{children}</h4>
      {action}
    </div>
  );
}

function ConversationRow({ conversation, active, currentUserId, onlineIds, onOpen }) {
  const last = conversation.lastMessage;
  const isTeam = conversation.kind === 'Team';
  const Icon = conversation.kind === 'Project' ? Hash : Users;
  const unread = conversation.unreadCount > 0;
  const who = last ? (last.senderId === currentUserId ? 'You' : last.senderName?.split(' ')[0]) : null;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(conversation.id)}
        aria-current={active}
        className="w-full text-left rounded-lg border px-2.5 py-2 transition-colors"
        style={active ? { borderColor: '#1f6bff', background: '#f6f9ff' } : { borderColor: '#e8eef8', background: '#fff' }}
      >
        <div className="flex items-center gap-2">
          {conversation.kind === 'Direct' ? (
            <span className="relative shrink-0 w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 flex items-center justify-center">
              {initials(conversation.title)}
              <OnlineDot
                online={conversation.members?.some((m) => m.id !== currentUserId && onlineIds?.has(m.id))}
              />
            </span>
          ) : (
            <span
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: isTeam && conversation.color ? `${conversation.color}1a` : '#eff6ff',
                color: isTeam && conversation.color ? conversation.color : '#1f6bff',
              }}
            >
              <Icon size={13} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] truncate ${unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                {conversation.title}
              </span>
              {conversation.isMyTeam && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                  Your team
                </span>
              )}
              <span className="ml-auto text-[10px] text-slate-400 shrink-0">{listTime(last?.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className={`text-[10px] truncate flex-1 ${unread ? 'text-slate-700' : 'text-slate-400'}`}>
                {last ? (
                  <>
                    {who}: {last.hasAttachments && <Paperclip size={9} className="inline -mt-0.5 mr-0.5" />}
                    {last.text}
                  </>
                ) : conversation.kind === 'Direct' ? (
                  'No messages yet'
                ) : (
                  `${conversation.memberCount} member${conversation.memberCount === 1 ? '' : 's'}`
                )}
              </p>
              <UnreadBadge count={conversation.unreadCount} />
            </div>
          </div>
        </div>
      </button>
    </li>
  );
}

function SearchResults({ results, searching, conversationsById, onOpen }) {
  if (searching && results.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1 py-3">
        <Loader2 size={12} className="animate-spin" /> Searching…
      </p>
    );
  }
  if (results.length === 0) {
    return <p className="text-[11px] text-slate-400 px-1 py-3">No messages match.</p>;
  }
  return (
    <ul className="space-y-1.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {results.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            onClick={() => onOpen(m.conversationId, m.id)}
            className="w-full text-left rounded-lg border border-[#e8eef8] bg-white px-2.5 py-2 hover:border-blue-300"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-blue-700 truncate">
                {conversationsById.get(m.conversationId)?.title ?? 'Conversation'}
              </span>
              <span className="ml-auto text-[10px] text-slate-400 shrink-0">{listTime(m.createdAt)}</span>
            </div>
            <p className="text-[11px] text-slate-700 mt-0.5 line-clamp-2">
              <span className="font-semibold">{m.sender?.name}: </span>
              {m.text || m.attachments?.map((a) => a.fileName).join(', ')}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function MessengerTab({ project, messenger, currentUserId, stageId, onStageChange, highlightMessageId, onHighlight }) {
  const { status, conversations, aggregates, activeId, activeThread } = messenger;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const searchSeq = useRef(0);

  // Coming back to the tab re-reads the open conversation.
  const { openConversation } = messenger;
  useEffect(() => {
    if (activeId) openConversation(activeId);
    // Only on mount: switching conversations is handled by the click itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const seq = ++searchSeq.current;
    const timer = setTimeout(async () => {
      const body = await searchMessages(project.id, q);
      if (seq !== searchSeq.current) return;
      setResults(body?.results ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, project.id]);

  const conversationsById = useMemo(() => new Map(conversations.map((c) => [c.id, c])), [conversations]);
  const active = activeId ? conversationsById.get(activeId) ?? null : null;
  const projectChat = conversations.filter((c) => c.kind === 'Project');
  const teams = conversations.filter((c) => c.kind === 'Team');
  const directs = conversations.filter((c) => c.kind === 'Direct');

  const directCandidates = (aggregates.projectMembers ?? []).filter((m) => m.id !== currentUserId);
  const onlineIds = usePresence([
    ...(aggregates.projectMembers ?? []).map((m) => m.id),
    ...directs.flatMap((c) => (c.members ?? []).map((m) => m.id)),
  ]);

  const mentionCandidates = useMemo(() => {
    if (!active) return [];
    const people = (active.members ?? [])
      .filter((m) => m.id !== currentUserId)
      .map((m) => ({ type: 'user', id: m.id, name: m.name, role: m.role }));
    if (active.kind !== 'Project') return people;
    const teamTags = conversations
      .filter((c) => c.kind === 'Team' && c.isActive && c.departmentId)
      .map((c) => ({ type: 'team', id: c.departmentId, name: `${c.departmentName} Team`, role: 'Team' }));
    return [...people, ...teamTags];
  }, [active, conversations, currentUserId]);

  const composerStages = useMemo(() => {
    const stages = [...(project.stages ?? [])].sort((a, b) => a.sequence - b.sequence);
    if (active?.kind !== 'Team') return stages;
    return stages.filter(
      (s) => (s.departmentId && s.departmentId === active.departmentId) || s.department === active.departmentName,
    );
  }, [project.stages, active]);

  function open(conversationId, messageId = null) {
    onHighlight?.(messageId);
    messenger.openConversation(conversationId);
  }

  if (status === 'offline') {
    return (
      <div className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs">
        <EmptyStatePms
          icon={WifiOff}
          title="Messenger needs the server"
          description="Project chat is stored on the ERP server so every team member sees the same history. Sign in to the server to use it."
        />
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs flex items-center justify-center gap-2 py-16 text-[11px] text-slate-400">
        <Loader2 size={14} className="animate-spin" /> Loading conversations…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs">
        <EmptyStatePms
          icon={MessageSquare}
          title="Messenger is unavailable"
          description="The conversations could not be loaded. Check your connection and try again."
          action={<Button size="sm" onClick={messenger.refresh}>Retry</Button>}
        />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-[#dce5f4] bg-white shadow-2xs">
        <EmptyStatePms
          icon={MessageSquare}
          title="You are not on this project's teams"
          description="Project and team chats are open to the project manager and the people assigned to the project's stages and tasks."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      {/* Conversation rail */}
      <aside
        className={`rounded-xl border border-[#dce5f4] bg-white p-3 shadow-2xs h-fit lg:max-h-[620px] lg:overflow-y-auto ${active ? 'hidden lg:block' : ''}`}
      >
        <header className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-bold text-slate-700">Conversations</h3>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: messenger.live ? '#15803d' : '#94a3b8' }}
              title={messenger.live ? 'Messages arrive instantly' : 'Reconnecting — checking for messages every few seconds'}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: messenger.live ? '#16a34a' : '#cbd5e1' }} />
              {messenger.live ? 'Live' : 'Syncing'}
            </span>
            <UnreadBadge count={messenger.totalUnread} />
          </div>
        </header>

        <label className="relative block">
          <span className="sr-only">Search messages</span>
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages…"
            className="w-full rounded-lg border border-[#dce5f4] bg-white pl-7 pr-7 py-1.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-300"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </label>

        {query.trim().length >= 2 ? (
          <div className="mt-3">
            <SearchResults
              results={results}
              searching={searching}
              conversationsById={conversationsById}
              onOpen={(conversationId, messageId) => {
                open(conversationId, messageId);
              }}
            />
          </div>
        ) : (
          <>
            {projectChat.length > 0 && (
              <ul className="space-y-1.5 mt-3" style={{ listStyle: 'none', marginBottom: 0, padding: 0 }}>
                {projectChat.map((c) => (
                  <ConversationRow key={c.id} conversation={c} active={c.id === activeId} currentUserId={currentUserId} onlineIds={onlineIds} onOpen={open} />
                ))}
              </ul>
            )}

            {teams.length > 0 && (
              <>
                <SectionLabel>Team Chats</SectionLabel>
                <ul className="space-y-1.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {teams.map((c) => (
                    <ConversationRow key={c.id} conversation={c} active={c.id === activeId} currentUserId={currentUserId} onlineIds={onlineIds} onOpen={open} />
                  ))}
                </ul>
              </>
            )}

            {aggregates.isParticipant && (
              <>
                <SectionLabel
                  action={
                    directCandidates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPickerOpen((v) => !v)}
                        aria-expanded={pickerOpen}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-800"
                      >
                        <Plus size={11} /> <span className="text-[10px]">New</span>
                      </button>
                    )
                  }
                >
                  Direct Messages
                </SectionLabel>

                {pickerOpen && (
                  <ul
                    className="mb-2 rounded-lg border border-[#dce5f4] bg-[#f6f9ff] p-1 max-h-48 overflow-y-auto"
                    style={{ listStyle: 'none', marginTop: 0 }}
                  >
                    {directCandidates.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={async () => {
                            setPickerOpen(false);
                            onHighlight?.(null);
                            await messenger.startDirect(m.id);
                          }}
                          className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white"
                        >
                          <span className="relative w-5 h-5 rounded-full bg-white border border-slate-200 text-[9px] font-bold text-slate-500 flex items-center justify-center">
                            {initials(m.name)}
                            <OnlineDot online={onlineIds.has(m.id)} />
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 truncate">{m.name}</span>
                          <span className="ml-auto text-[10px] text-slate-400 truncate">
                            {m.role === 'Project Manager' ? 'PM' : m.teams?.join(', ')}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {directs.length > 0 ? (
                  <ul className="space-y-1.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {directs.map((c) => (
                      <ConversationRow key={c.id} conversation={c} active={c.id === activeId} currentUserId={currentUserId} onlineIds={onlineIds} onOpen={open} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-slate-400 px-0.5">Message a project member directly.</p>
                )}
              </>
            )}
          </>
        )}
      </aside>

      {/* Thread */}
      <div className={active ? '' : 'hidden lg:block'}>
        <ConversationThread
          conversation={active}
          onlineIds={onlineIds}
          thread={activeThread}
          currentUserId={currentUserId}
          mentionCandidates={mentionCandidates}
          stages={composerStages}
          stageId={composerStages.some((s) => s.id === stageId) ? stageId : null}
          onStageChange={onStageChange}
          highlightMessageId={highlightMessageId}
          onBack={() => messenger.openConversation(null)}
          onLoadOlder={() => messenger.loadOlder(active.id)}
          onSend={(payload) => messenger.send(active.id, payload)}
          onEdit={(message, text) =>
            messenger.edit(active.id, message.id, {
              text,
              mentions: (message.mentions ?? []).map(({ type, id }) => ({ type, id })),
            })
          }
          onDelete={(message) => messenger.remove(active.id, message.id)}
        />
      </div>
    </div>
  );
}

export default MessengerTab;
