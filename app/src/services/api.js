/**
 * Base API Client — Bridges frontend state with Django REST APIs.
 * Supports timeout, retry, query builder, JWT authentication, idempotency keys,
 * structured ApiError, safe JSON parsing, and unauthorized session handling.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000;

/**
 * A signed file URL (`…/api/v1/files/{id}/download/?token=…`) as this app
 * should load it. The server builds it absolute from its own host — behind the
 * Vite proxy that is 127.0.0.1:8000, a different origin from the page, so a
 * fetch of it is a CORS request and an <iframe> of it is refused. Re-basing it
 * on the app's API base sends it the way every other API call goes: through
 * the proxy in dev, to the configured API origin in production.
 */
export function resolveFileUrl(url) {
  if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const match = url.match(/^(?:https?:\/\/[^/]+)?\/api\/v\d+(\/files\/.+)$/);
  return match ? `${API_BASE_URL}${match[1]}` : url;
}

export class ApiError extends Error {
  constructor(message, { status = 0, endpoint = '', payload = null, retryAfter = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
    this.payload = payload;
    this.retryAfter = retryAfter;
  }
}

export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function getAuthToken(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    return storage?.getItem('evenmore_auth_token') || '';
  } catch {
    return '';
  }
}

export function getRefreshToken(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    return storage?.getItem('evenmore_refresh_token') || '';
  } catch {
    return '';
  }
}

export function clearAuthTokens(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    storage?.removeItem('evenmore_auth_token');
    storage?.removeItem('auth_token');
    storage?.removeItem('evenmore_refresh_token');
    storage?.removeItem('evenmore_token_expires_at');
    storage?.removeItem('evenmore_saved_user');
  } catch {}
}

async function fetchWithTimeout(url, config, timeoutMs, externalSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  try {
    return await fetch(url, { ...config, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

let refreshPromise = null;

async function attemptTokenRefresh() {
  if (refreshPromise) return refreshPromise;
  const refresh = getRefreshToken();
  if (!refresh) {
    const err = new Error('No refresh token available');
    return Promise.reject(err);
  }

  refreshPromise = (async () => {
    const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    const body = await parseBodySafe(res);
    if (!res.ok || !body?.access) {
      throw new Error((body && (body.detail || body.message || body.error)) || 'Token refresh failed');
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('evenmore_auth_token', body.access);
        if (body.refresh) localStorage.setItem('evenmore_refresh_token', body.refresh);
      }
    } catch {}
    return body.access;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function parseBodySafe(response) {
  try {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  } catch {
    return null;
  }
}

function normalizeEndpoint(endpoint) {
  if (!endpoint) return '/';
  let ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Ensure trailing slash for DRF unless it has a query or extension
  if (!ep.endsWith('/') && !ep.includes('?') && !ep.includes('.')) {
    ep = `${ep}/`;
  }
  return ep;
}

export async function apiClient(
  endpoint,
  {
    data,
    method = 'GET',
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 0,
    query = null,
    clearAuthOnUnauthorized = true,
    idempotencyKey = null,
    signal = null,
    _retried = false,
    ...customConfig
  } = {},
) {
  const token = getAuthToken();
  const normalizedEp = normalizeEndpoint(endpoint);
  const url = `${API_BASE_URL}${normalizedEp}${query ? buildQuery(query) : ''}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    ...headers,
  };

  const config = {
    method,
    headers: requestHeaders,
    ...customConfig,
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  let attempt = 0;
  let refreshed = _retried;
  const isRefreshEndpoint = normalizedEp === '/auth/refresh/';
  for (;;) {
    try {
      const response = await fetchWithTimeout(url, config, timeoutMs, signal);
      const result = await parseBodySafe(response);

      const authCodes = new Set([
        'TOKEN_INVALID', 'TOKEN_REVOKED', 'ACCOUNT_INACTIVE', 'TENANT_INACTIVE', 'TOKEN_EXPIRED',
      ]);
      const backendCode = (result && (result.code || result.errorCode || result.error_code)) || '';
      const isAuthSessionFailure = !backendCode || authCodes.has(backendCode);
      const isLoginEndpoint = normalizedEp.includes('/auth/login') || normalizedEp.includes('/auth/verify-otp');

      if (
        response.status === 401 &&
        clearAuthOnUnauthorized &&
        !isRefreshEndpoint &&
        !isLoginEndpoint &&
        !refreshed &&
        isAuthSessionFailure &&
        (token || getRefreshToken())
      ) {
        try {
          const newAccess = await attemptTokenRefresh();
          refreshed = true;
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newAccess}`,
          };
          continue;
        } catch {
          clearAuthTokens();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('evenmore:unauthorized'));
          }
          throw new ApiError('Your session has expired. Please sign in again.', {
            status: 401,
            endpoint: normalizedEp,
            payload: result,
          });
        }
      }

      if (
        response.status === 401 &&
        clearAuthOnUnauthorized &&
        !isRefreshEndpoint &&
        !isLoginEndpoint &&
        isAuthSessionFailure &&
        !refreshed
      ) {
        // No recoverable refresh available for a genuine auth/session failure.
        clearAuthTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('evenmore:unauthorized'));
        }
      }
      if (response.ok) {
        return result;
      }

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
        const msg =
          (result && (result.detail || result.message || result.error)) ||
          'Too many requests. Please try again later.';

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('evenmore:throttled', { detail: { retryAfter, message: msg } })
          );
        }

        throw new ApiError(msg, {
          status: 429,
          endpoint: normalizedEp,
          payload: result,
          retryAfter,
        });
      }

      const message =
        (result && (result.message || result.detail || result.error)) ||
        (result && typeof result === 'object' && Object.values(result)[0]?.[0]) ||
        `Request failed with status ${response.status}`;

      throw new ApiError(message, { status: response.status, endpoint: normalizedEp, payload: result });
    } catch (err) {
      const retryable =
        err?.name === 'AbortError' ||
        (err instanceof ApiError && err.status >= 500 && err.status !== 429) ||
        err instanceof TypeError;

      if (retryable && attempt < retries) {
        attempt += 1;
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }
      if (err instanceof ApiError) throw err;
      throw new ApiError(err?.message || 'Network error occurred', { endpoint: normalizedEp });
    }
  }
}

export const api = {
  get: (url, config) => apiClient(url, { ...config, method: 'GET' }),
  post: (url, data, config) => apiClient(url, { ...config, data, method: 'POST' }),
  put: (url, data, config) => apiClient(url, { ...config, data, method: 'PUT' }),
  patch: (url, data, config) => apiClient(url, { ...config, data, method: 'PATCH' }),
  delete: (url, config) => apiClient(url, { ...config, method: 'DELETE' }),
};

export default api;
