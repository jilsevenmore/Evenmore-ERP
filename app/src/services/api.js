/**
 * Base API Client — Prepared for future backend integration.
 * Designed to seamlessly bridge frontend state with Django REST APIs.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function apiClient(endpoint, { data, method = 'GET', headers = {}, ...customConfig } = {}) {
  const token = localStorage.getItem('auth_token');
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...customConfig,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (response.status === 401) {
      // Clear token and handle unauthorized redirect when backend auth is active
    }
    const result = await response.json();
    if (response.ok) {
      return result;
    }
    return Promise.reject(result);
  } catch (err) {
    return Promise.reject(err.message || 'Network error occurred');
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
