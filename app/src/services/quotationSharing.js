import { localShare, localQuote } from './localQuotationSharing';
import { ApiError } from './api';

export const sharingRequest = async (id, data) => {
  const result = localShare(id, data);
  if (!result) throw new ApiError('No quotation link has been generated.', { status: 404 });
  return result;
};

export const publicQuoteRequest = async (number, token, action) => {
  return localQuote(number, token, action);
};
