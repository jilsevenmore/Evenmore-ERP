import React, { useEffect, useState } from 'react';
import { fetchMe } from '../services/authService';
import { getStoredToken } from '../utils/authUtils';
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

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (!getStoredToken()) {
        setCurrentUser(null);
        setPermissions([]);
        setResolving(false);
        return;
      }
      setResolving(true);
      const session = await fetchMe();
      if (cancelled) return;
      setCurrentUser(session?.user || null);
      setPermissions(session?.permissions || []);
      setResolving(false);
    };

    resolve();

    // A sign-in elsewhere in the app (or in another tab) re-resolves the user.
    window.addEventListener('evenmore:authorized', resolve);
    window.addEventListener('storage', resolve);
    return () => {
      cancelled = true;
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
