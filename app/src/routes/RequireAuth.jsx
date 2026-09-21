import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { getStoredToken, clearStoredAuth } from '../utils/authUtils';

/**
 * RequireAuth — Route guard that verifies the user has a valid, unexpired token.
 * If the token is missing or expired, redirects directly to /login with returnTo context.
 */
export default function RequireAuth() {
  const location = useLocation();
  const [token, setToken] = useState(() => getStoredToken());

  useEffect(() => {
    // Re-verify token on route change
    const currentToken = getStoredToken();
    if (!currentToken && token) {
      setToken(null);
    }

    const handleAuthChange = () => {
      const activeToken = getStoredToken();
      setToken(activeToken);
    };

    window.addEventListener('evenmore:unauthorized', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('evenmore:unauthorized', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [location, token]);

  if (!token) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <Outlet />;
}
