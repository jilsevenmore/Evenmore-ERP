import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  pullConversations,
  pullMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markConversationRead,
  startDirectConversation,
  isBackendEnabled,
  isServerId,
  describeError,
} from '../../../services/pmsSync';
import { usePmsStore } from '../../../stores/pmsStore';

/**
 * useProjectMessenger — one project's conversations and the open thread.
 *
 * The backend has no push channel, so this polls: the conversation list (for
 * unread counts) slowly while the Messenger tab is closed and faster while it
 * is open, and the open thread every few seconds with the server's `since`
 * cursor, which returns new, edited and deleted messages alike. Polling pauses
 * while the browser tab is hidden. A WebSocket later would replace the two
 * timers and nothing else.
 */

const LIST_POLL_IDLE_MS = 30000;
const LIST_POLL_OPEN_MS = 10000;
const THREAD_POLL_MS = 4000;

const EMPTY_THREAD = { messages: [], hasMore: false, cursor: null, loaded: false, loading: false };

function byCreatedAt(a, b) {
  return Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

/** Merge server rows into a thread by id; the server copy wins. */
function mergeMessages(current, incoming) {
  const map = new Map(current.map((m) => [m.id, m]));
  incoming.forEach((m) => map.set(m.id, m));
  return [...map.values()].sort(byCreatedAt);
}

function useInterval(callback, delay) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    if (!delay) return undefined;
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      saved.current();
    }, delay);
    return () => clearInterval(id);
  }, [delay]);
}

export function useProjectMessenger(projectId, { open = false } = {}) {
  const showToast = usePmsStore((s) => s.showToast);
  const enabled = isBackendEnabled() && isServerId(projectId);

  const [conversations, setConversations] = useState([]);
  const [aggregates, setAggregates] = useState({});
  const [status, setStatus] = useState(enabled ? 'loading' : 'offline');
  const [activeId, setActiveId] = useState(null);
  const [threads, setThreads] = useState({});
  const threadsRef = useRef(threads);
  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const patchThread = useCallback((conversationId, patch) => {
    setThreads((prev) => {
      const current = prev[conversationId] ?? EMPTY_THREAD;
      const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
      return { ...prev, [conversationId]: next };
    });
  }, []);

  // ── conversation list ────────────────────────────────────────────────────
  const refreshConversations = useCallback(async () => {
    if (!enabled) return;
    const body = await pullConversations(projectId);
    if (!body) {
      setStatus((s) => (s === 'loading' ? 'error' : s));
      return;
    }
    setConversations(body.results ?? []);
    setAggregates(body.aggregates ?? {});
    setStatus('ready');
  }, [enabled, projectId]);

  useEffect(() => {
    setConversations([]);
    setAggregates({});
    setThreads({});
    setActiveId(null);
    setStatus(enabled ? 'loading' : 'offline');
    refreshConversations();
  }, [enabled, refreshConversations]);

  useInterval(refreshConversations, enabled ? (open ? LIST_POLL_OPEN_MS : LIST_POLL_IDLE_MS) : null);

  const setUnread = useCallback((conversationId, count) => {
    setConversations((rows) =>
      rows.map((row) => (row.id === conversationId ? { ...row, unreadCount: count } : row)),
    );
  }, []);

  const markRead = useCallback(
    (conversationId) => {
      setUnread(conversationId, 0);
      return markConversationRead(projectId, conversationId);
    },
    [projectId, setUnread],
  );

  // ── threads ──────────────────────────────────────────────────────────────
  const loadThread = useCallback(
    async (conversationId) => {
      patchThread(conversationId, { loading: true });
      const body = await pullMessages(projectId, conversationId);
      if (!body) {
        patchThread(conversationId, { loading: false });
        return;
      }
      patchThread(conversationId, (current) => ({
        ...current,
        messages: mergeMessages(current.messages, body.results ?? []),
        hasMore: Boolean(body.aggregates?.hasMore),
        cursor: body.aggregates?.cursor ?? current.cursor,
        loaded: true,
        loading: false,
      }));
    },
    [projectId, patchThread],
  );

  const loadOlder = useCallback(
    async (conversationId) => {
      const current = threadsRef.current[conversationId];
      const oldest = current?.messages?.[0];
      if (!oldest || current.loading) return;
      patchThread(conversationId, { loading: true });
      const body = await pullMessages(projectId, conversationId, { before: oldest.id });
      patchThread(conversationId, (thread) => ({
        ...thread,
        messages: body ? mergeMessages(thread.messages, body.results ?? []) : thread.messages,
        hasMore: body ? Boolean(body.aggregates?.hasMore) : thread.hasMore,
        loading: false,
      }));
    },
    [projectId, patchThread],
  );

  const openConversation = useCallback(
    (conversationId) => {
      setActiveId(conversationId);
      if (!conversationId) return;
      if (!threadsRef.current[conversationId]?.loaded) loadThread(conversationId);
      markRead(conversationId);
    },
    [loadThread, markRead],
  );

  const pollActiveThread = useCallback(async () => {
    if (!activeId) return;
    const current = threadsRef.current[activeId];
    if (!current?.loaded || !current.cursor) return;
    const body = await pullMessages(projectId, activeId, { since: current.cursor });
    if (!body) return;
    const incoming = body.results ?? [];
    const known = new Set(current.messages.map((m) => m.id));
    const fresh = incoming.some((m) => !known.has(m.id));
    patchThread(activeId, (thread) => ({
      ...thread,
      messages: mergeMessages(thread.messages, incoming),
      cursor: body.aggregates?.cursor ?? thread.cursor,
    }));
    // The thread is on screen, so anything that just arrived is read.
    if (fresh) markRead(activeId);
  }, [activeId, projectId, patchThread, markRead]);

  useInterval(pollActiveThread, enabled && open && activeId ? THREAD_POLL_MS : null);

  // ── writes ───────────────────────────────────────────────────────────────
  const touchConversation = useCallback((conversationId, message) => {
    setConversations((rows) =>
      rows.map((row) =>
        row.id === conversationId
          ? {
            ...row,
            lastMessageAt: message.createdAt,
            lastMessage: {
              id: message.id,
              text: message.text || message.attachments?.map((a) => a.fileName).join(', ') || '',
              senderId: message.sender?.id,
              senderName: message.sender?.name,
              createdAt: message.createdAt,
              hasAttachments: (message.attachments ?? []).length > 0,
            },
          }
          : row,
      ),
    );
  }, []);

  const send = useCallback(
    async (conversationId, payload) => {
      try {
        const message = await sendMessage(projectId, conversationId, payload);
        patchThread(conversationId, (thread) => ({
          ...thread,
          messages: mergeMessages(thread.messages, [message]),
        }));
        touchConversation(conversationId, message);
        return message;
      } catch (err) {
        showToast(`Message not sent — ${describeError(err)}`, 'error');
        return null;
      }
    },
    [projectId, patchThread, touchConversation, showToast],
  );

  const replaceMessage = useCallback(
    (conversationId, message) =>
      patchThread(conversationId, (thread) => ({
        ...thread,
        messages: mergeMessages(thread.messages, [message]),
      })),
    [patchThread],
  );

  const edit = useCallback(
    async (conversationId, messageId, payload) => {
      try {
        const message = await editMessage(projectId, conversationId, messageId, payload);
        replaceMessage(conversationId, message);
        return message;
      } catch (err) {
        showToast(`Message not updated — ${describeError(err)}`, 'error');
        return null;
      }
    },
    [projectId, replaceMessage, showToast],
  );

  const remove = useCallback(
    async (conversationId, messageId) => {
      try {
        const message = await deleteMessage(projectId, conversationId, messageId);
        replaceMessage(conversationId, message);
        refreshConversations();
        return message;
      } catch (err) {
        showToast(`Message not deleted — ${describeError(err)}`, 'error');
        return null;
      }
    },
    [projectId, replaceMessage, refreshConversations, showToast],
  );

  const startDirect = useCallback(
    async (userId) => {
      try {
        const row = await startDirectConversation(projectId, userId);
        setConversations((rows) => (rows.some((r) => r.id === row.id) ? rows : [...rows, row]));
        openConversation(row.id);
        return row;
      } catch (err) {
        showToast(`Could not start the conversation — ${describeError(err)}`, 'error');
        return null;
      }
    },
    [projectId, openConversation, showToast],
  );

  const totalUnread = useMemo(
    () => conversations.reduce((n, row) => n + (row.unreadCount ?? 0), 0),
    [conversations],
  );

  return {
    status,
    conversations,
    aggregates,
    totalUnread,
    activeId,
    activeThread: (activeId && threads[activeId]) || EMPTY_THREAD,
    openConversation,
    loadOlder,
    send,
    edit,
    remove,
    startDirect,
    refresh: refreshConversations,
  };
}

export default useProjectMessenger;
