/**
 * realtime — the app's one Socket.IO connection (server: Backend/apps/core/realtime.py).
 *
 * Events carry ids, not data: "project X changed", "conversation Y has a new
 * message". Whoever listens re-reads through the ordinary REST call, so the
 * permission checks and the data shapes stay where they already are, and a
 * dropped socket costs only latency — every screen that listens still polls
 * (more slowly) while `getRealtimeStatus()` is not 'connected'.
 *
 *   connectRealtime() / disconnectRealtime()   session lifecycle (useRealtimeBridge)
 *   onRealtime(event, handler) -> unsubscribe  works before the socket exists
 *   watchProject(projectId)    -> unwatch      joins pms:project:<id>, re-joined on reconnect
 *   useRealtimeStatus()                        'connecting' | 'connected' | 'offline'
 *   usePresence(userIds)                       Set of those ids that are online now
 */
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { io } from 'socket.io-client';
import { getAuthToken } from './api';

/**
 * Same origin by default: Vite proxies /socket.io in development, and a
 * production build is served beside the API. An absolute VITE_API_URL means
 * the API lives elsewhere, so the socket goes there too.
 */
function socketOrigin() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit;
  const api = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  try {
    return /^https?:\/\//.test(api) ? new URL(api).origin : undefined;
  } catch {
    return undefined;
  }
}

let socket = null;
let status = 'offline';
const statusListeners = new Set();
const handlers = new Map(); // event -> Set(handler)
const watched = new Map(); // projectId -> watcher count

// ── status ─────────────────────────────────────────────────────────────────

function setStatus(next) {
  if (next === status) return;
  status = next;
  statusListeners.forEach((listener) => listener());
}

export function getRealtimeStatus() {
  return status;
}

function subscribeStatus(listener) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export function useRealtimeStatus() {
  return useSyncExternalStore(subscribeStatus, getRealtimeStatus, () => 'offline');
}

// ── events ─────────────────────────────────────────────────────────────────

function dispatch(event, payload) {
  handlers.get(event)?.forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      console.warn(`[realtime] ${event} handler failed:`, err?.message || err);
    }
  });
}

/** Subscribe to a server event. Safe to call before connecting. */
export function onRealtime(event, handler) {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event).add(handler);
  return () => handlers.get(event)?.delete(handler);
}

// ── connection ─────────────────────────────────────────────────────────────

export function connectRealtime() {
  if (socket) return socket;
  if (!getAuthToken()) return null;

  socket = io(socketOrigin(), {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    // A function, so every reconnect sends the token that is current then.
    auth: (cb) => cb({ token: getAuthToken() }),
    reconnectionDelayMax: 10000,
  });
  setStatus('connecting');

  socket.on('connect', () => {
    setStatus('connected');
    watched.forEach((_, projectId) => socket.emit('pms:watch', { projectId }));
    dispatch('realtime:connected', {});
  });
  socket.on('disconnect', () => setStatus('offline'));
  socket.on('connect_error', () => {
    setStatus('offline');
    if (!getAuthToken()) disconnectRealtime();
  });
  socket.onAny((event, payload) => dispatch(event, payload));
  socket.on('presence:changed', ({ userId, online } = {}) => setOnline(userId, online));
  return socket;
}

export function disconnectRealtime() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  onlineIds = new Set();
  presenceListeners.forEach((listener) => listener());
  setStatus('offline');
}

/** Receive `chat:activity` for one project while a screen shows it. */
export function watchProject(projectId) {
  if (!projectId) return () => {};
  const count = watched.get(projectId) ?? 0;
  watched.set(projectId, count + 1);
  if (count === 0 && socket?.connected) socket.emit('pms:watch', { projectId });

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const remaining = (watched.get(projectId) ?? 1) - 1;
    if (remaining > 0) {
      watched.set(projectId, remaining);
      return;
    }
    watched.delete(projectId);
    if (socket?.connected) socket.emit('pms:unwatch', { projectId });
  };
}

// ── presence ───────────────────────────────────────────────────────────────

let onlineIds = new Set();
const presenceListeners = new Set();

function setOnline(userId, online) {
  if (!userId || onlineIds.has(userId) === Boolean(online)) return;
  onlineIds = new Set(onlineIds);
  if (online) onlineIds.add(userId);
  else onlineIds.delete(userId);
  presenceListeners.forEach((listener) => listener());
}

function subscribePresence(listener) {
  presenceListeners.add(listener);
  return () => presenceListeners.delete(listener);
}

/** Ask the server which of `userIds` are connected; later changes arrive as events. */
async function queryPresence(userIds) {
  if (!socket?.connected || userIds.length === 0) return;
  try {
    const { online = [] } = await socket.timeout(5000).emitWithAck('presence:query', { userIds });
    userIds.forEach((id) => setOnline(id, online.includes(id)));
  } catch {
    // Presence is decoration; a timeout just leaves the dots as they were.
  }
}

/** The subset of `userIds` online right now (empty while disconnected). */
export function usePresence(userIds = []) {
  const online = useSyncExternalStore(subscribePresence, () => onlineIds, () => onlineIds);
  const live = useRealtimeStatus() === 'connected';
  const key = [...new Set(userIds.filter(Boolean))].sort().join(',');

  useEffect(() => {
    if (live && key) queryPresence(key.split(','));
  }, [live, key]);

  return useMemo(() => new Set(key ? key.split(',').filter((id) => online.has(id)) : []), [key, online]);
}
