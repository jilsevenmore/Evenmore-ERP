/**
 * Base API Client — Prepared for future backend integration.
 * Designed to seamlessly bridge frontend state with Django REST APIs.
 *
 * Hardened (logic-only, no UI change): timeout, retry, query builder,
 * structured ApiError, safe JSON parsing. Existing call signatures are
 * unchanged — `api.get/post/put/patch/delete` keep working as before.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000;

export class ApiError extends Error {
  constructor(message, { status = 0, endpoint = '', payload = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
    this.payload = payload;
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

function getAuthToken(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    return storage?.getItem('auth_token') || '';
  } catch {
    return '';
  }
}

async function fetchWithTimeout(url, config, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...config, signal: controller.signal });
  } finally {
    clearTimeout(timer);
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

export async function apiClient(
  endpoint,
  { data, method = 'GET', headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0, query = null, ...customConfig } = {},
) {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}${query ? buildQuery(query) : ''}`;
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...customConfig,
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  let attempt = 0;
  for (;;) {
    try {
      const response = await fetchWithTimeout(url, config, timeoutMs);
      if (response.status === 401) {
        // Token invalid — clear it so the next backend-authenticated
        // session starts clean. No redirect here (router owns navigation).
        try {
          localStorage.removeItem('auth_token');
        } catch {
          /* storage unavailable */
        }
      }
      const result = await parseBodySafe(response);
      if (response.ok) {
        return result;
      }
      const message =
        (result && (result.message || result.detail || result.error)) ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, { status: response.status, endpoint, payload: result });
    } catch (err) {
      const retryable =
        err?.name === 'AbortError' ||
        (err instanceof ApiError && (err.status >= 500 || err.status === 429)) ||
        err instanceof TypeError;
      if (retryable && attempt < retries) {
        attempt += 1;
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }
      if (err instanceof ApiError) throw err;
      throw new ApiError(err?.message || 'Network error occurred', { endpoint });
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
