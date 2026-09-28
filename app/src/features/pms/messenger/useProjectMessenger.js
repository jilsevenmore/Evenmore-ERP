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
import { onRealtime, useRealtimeStatus, watchProject } from '../../../services/realtime';

/**
 * useProjectMessenger — one project's conversations and the open thread.
 *
 * Push first, poll as the fallback. While the Socket.IO connection is up, the
 * server's `chat:activity` event (ids only) triggers a re-read: the list for
 * unread counts, and the open thread through the `since` cursor, which returns
 * new, edited and deleted messages alike. While it is down, the same two reads
 * run on timers instead, and a reconnect catches up once. Timers pause while
 * the browser tab is hidden.
 */

const LIST_POLL_IDLE_MS = 30000;
const LIST_POLL_OPEN_MS = 10000;
/** A safety net only: with the socket up, events drive the list. */
const LIST_POLL_LIVE_MS = 120000;
const THREAD_POLL_MS = 4000;
const LIST_REFRESH_DEBOUNCE_MS = 250;

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
  const live = useRealtimeStatus() === 'connected';

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

  useInterval(
    refreshConversations,
    enabled ? (live ? LIST_POLL_LIVE_MS : open ? LIST_POLL_OPEN_MS : LIST_POLL_IDLE_MS) : null,
  );

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

  // Read by the socket handlers, which outlive any one render.
  const activeIdRef = useRef(activeId);
  const openRef = useRef(open);
  useEffect(() => {
    activeIdRef.current = activeId;
    openRef.current = open;
  }, [activeId, open]);

  /** Bring a loaded thread up to date through the `since` cursor. */
  const syncThread = useCallback(async (conversationId) => {
    const current = threadsRef.current[conversationId];
    if (!current?.loaded || !current.cursor) return;
    const body = await pullMessages(projectId, conversationId, { since: current.cursor });
    if (!body) return;
    const incoming = body.results ?? [];
    const known = new Set(current.messages.map((m) => m.id));
    const fresh = incoming.some((m) => !known.has(m.id));
    patchThread(conversationId, (thread) => ({
      ...thread,
      messages: mergeMessages(thread.messages, incoming),
      cursor: body.aggregates?.cursor ?? thread.cursor,
    }));
    // On screen, so anything that just arrived is read.
    if (fresh && openRef.current && activeIdRef.current === conversationId) markRead(conversationId);
  }, [projectId, patchThread, markRead]);

  const openConversation = useCallback(
    (conversationId) => {
      setActiveId(conversationId);
      activeIdRef.current = conversationId;
      if (!conversationId) return;
      // A thread cached from an earlier visit catches up; a new one loads.
      if (threadsRef.current[conversationId]?.loaded) syncThread(conversationId);
      else loadThread(conversationId);
      markRead(conversationId);
    },
    [loadThread, syncThread, markRead],
  );

  const pollActiveThread = useCallback(() => {
    if (activeId) syncThread(activeId);
  }, [activeId, syncThread]);

  useInterval(pollActiveThread, enabled && open && activeId && !live ? THREAD_POLL_MS : null);

  // ── push ─────────────────────────────────────────────────────────────────
  useEffect(() => (enabled ? watchProject(projectId) : undefined), [enabled, projectId]);

  useEffect(() => {
    if (!enabled) return undefined;
    let listTimer = null;
    const refreshSoon = () => {
      clearTimeout(listTimer);
      listTimer = setTimeout(refreshConversations, LIST_REFRESH_DEBOUNCE_MS);
    };
    const offActivity = onRealtime('chat:activity', ({ projectId: pid, conversationId } = {}) => {
      if (pid !== projectId) return;
      refreshSoon();
      if (conversationId && threadsRef.current[conversationId]?.loaded) syncThread(conversationId);
    });
    const offRead = onRealtime('chat:read', ({ projectId: pid } = {}) => {
      if (pid === projectId) refreshSoon();
    });
    // Whatever happened while the socket was down.
    const offReconnect = onRealtime('realtime:connected', () => {
      refreshSoon();
      if (activeIdRef.current) syncThread(activeIdRef.current);
    });
    return () => {
      clearTimeout(listTimer);
      offActivity();
      offRead();
      offReconnect();
    };
  }, [enabled, projectId, refreshConversations, syncThread]);

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
    live,
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
