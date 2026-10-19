import React, { useEffect, useState, useRef } from 'react';
import { fetchMe } from '../services/authService';
import {
  getStoredToken,
  isTokenValid,
  EVENMORE_AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '../utils/authUtils';
import { attemptTokenRefresh } from '../services/api';
import { useAppStore } from '../stores/appStore';

/**
 * SessionGate — turns the stored token back into a real user before the app
 * renders.
 *
 * A reload used to drop the signed-in user and leave a hardcoded name in the
 * sidebar, because nothing asked the server who the token belonged to. Now the
 * first thing the app does with a token is `GET /auth/me/`; if that fails the
 * token is cleared and `RequireAuth` sends the user to sign in.
 *
 * With no token there is nothing to resolve, so the login route renders
 * immediately.
 */
export default function SessionGate({ children }) {
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setPermissions = useAppStore((s) => s.setPermissions);
  const [resolving, setResolving] = useState(() => Boolean(getStoredToken()));
  const isInitialRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (!getStoredToken()) {
        setCurrentUser(null);
        setPermissions([]);
        setResolving(false);
        isInitialRef.current = false;
        return;
      }

      if (isInitialRef.current) {
        setResolving(true);
      }

      const session = await fetchMe();
      if (cancelled) return;

      if (session) {
        setCurrentUser(session?.user || null);
        setPermissions(session?.permissions || []);
      }
      isInitialRef.current = false;
      setResolving(false);
    };

    resolve();

    // A sign-in elsewhere in the app (or in another tab) re-resolves the user.
    window.addEventListener('evenmore:authorized', resolve);
    window.addEventListener('storage', resolve);

    // Proactive background refresh: inspect token every 60s; if expiring within 2 minutes, renew silently
    const refreshInterval = setInterval(() => {
      try {
        const token = localStorage.getItem(EVENMORE_AUTH_TOKEN_KEY);
        const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (token && refresh && !isTokenValid(token, 120000)) {
          attemptTokenRefresh().catch(() => {});
        }
      } catch {}
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(refreshInterval);
      window.removeEventListener('evenmore:authorized', resolve);
      window.removeEventListener('storage', resolve);
    };
  }, [setCurrentUser, setPermissions]);

  if (resolving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page)] text-[var(--muted)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-blue-600 animate-spin" />
          <p className="text-xs font-medium">Restoring your session…</p>
        </div>
      </div>
    );
  }

  return children;
}
