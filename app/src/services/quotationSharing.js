import { localShare, localQuote } from './localQuotationSharing';
import { apiClient, ApiError } from './api';

export const sharingRequest = async (id, data) => {
  if (!sessionStorage.getItem('quotation_admin_token')) {
    const local = localShare(id, data);
    if (local) return local;
    throw new ApiError('No quotation link has been generated.', { status: 404 });
  }
  const result = await apiClient(`/quotation-sharing/${encodeURIComponent(id)}`, {
    method: data ? 'POST' : 'GET', data,
    clearAuthOnUnauthorized: false,
    headers: { Authorization: `Bearer ${sessionStorage.getItem('quotation_admin_token') || ''}` },
  });
  if (!result?.url || !result?.expiresAt || !Array.isArray(result.events)) throw new Error('Sharing service is not configured.');
  return result;
};
export const publicQuoteRequest = async (number, token, action) => {
  if (token.startsWith('local-')) return localQuote(number, token, action);
  const result = await apiClient(`/public-quotations/${encodeURIComponent(number)}/${encodeURIComponent(token)}${action ? `/${action}` : ''}`, {
    clearAuthOnUnauthorized: false,
    method: action ? 'POST' : 'GET', headers: { Authorization: '' }, ...(action ? { data: {} } : {}),
  });
  if (action ? result?.ok !== true : !result?.quotation?.quoteNumber || !Array.isArray(result?.quotation?.items)) throw new Error('Quotation service is not configured.');
  return result;
};
