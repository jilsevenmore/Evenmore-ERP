/**
 * Authentication Utilities for Evenmore ERP.
 * Handles token storage, JWT expiration checks, and session validation.
 */

export const AUTH_TOKEN_KEY = 'auth_token';
export const EVENMORE_AUTH_TOKEN_KEY = 'evenmore_auth_token';
export const REFRESH_TOKEN_KEY = 'evenmore_refresh_token';
export const TOKEN_EXPIRES_KEY = 'evenmore_token_expires_at';
export const SAVED_USER_KEY = 'evenmore_saved_user';

/**
 * Validates whether a token exists and is unexpired.
 * Supports standard JWTs (reads exp claim) and fallback session timestamps.
 */
export function isTokenValid(token, bufferMs = 5000) {
  if (!token || typeof token !== 'string') return false;

  // 1. Check JWT format (3 base64url segments separated by dots)
  const parts = token.split('.');
  if (parts.length === 3) {
    try {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (payload && typeof payload.exp === 'number') {
        // payload.exp is in seconds; check against current timestamp with buffer
        return payload.exp * 1000 > Date.now() + bufferMs;
      }
      return true;
    } catch {
      return false;
    }
  }

  // 2. Opaque (non-JWT) token: verify stored expiration timestamp if set
  try {
    const exp = localStorage.getItem(TOKEN_EXPIRES_KEY);
    if (exp) {
      const expNum = Number(exp);
      if (!Number.isNaN(expNum) && expNum <= Date.now() + bufferMs) {
        return false;
      }
    }
  } catch {}

  return true;
}

/**
 * Retrieves the stored token if valid.
 * If the access token has expired but a valid refresh token exists, returns the
 * current token so route guards and active screens stay alive while the API
 * client performs silent background refresh.
 * Automatically clears stale credentials only when both access and refresh tokens expire.
 */
export function getStoredToken() {
  try {
    const token = localStorage.getItem(EVENMORE_AUTH_TOKEN_KEY);
    if (!token) return null;

    if (isTokenValid(token, 0)) {
      return token;
    }

    // Access token expired; check if refresh token is still viable
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken && isTokenValid(refreshToken, 0)) {
      return token;
    }

    clearStoredAuth();
    return null;
  } catch {
    return null;
  }
}

/**
 * Persists auth credentials with expiration.
 */
export function saveStoredAuth(token, { refreshToken = null, expiresInMs = null, remember = true } = {}) {
  try {
    if (!token) return;
    localStorage.setItem(EVENMORE_AUTH_TOKEN_KEY, token);

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // Default duration: 30 days for remember-me, 24 hours otherwise
    const duration = expiresInMs || (remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
    localStorage.setItem(TOKEN_EXPIRES_KEY, String(Date.now() + duration));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('evenmore:authorized', { detail: { token } }));
    }
  } catch {}
}

/**
 * Completely clears stored authentication data.
 */
export function clearStoredAuth() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(EVENMORE_AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
    localStorage.removeItem(SAVED_USER_KEY);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('evenmore:unauthorized'));
    }
  } catch {}
}
