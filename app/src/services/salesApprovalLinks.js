/**
 * Customer approval links for sales documents — estimates, quotations, proforma
 * invoices and sales invoices. The sales twin of the PMS proof link
 * (`services/pmsSync.js` share calls, `/pms/approve/:token`).
 *
 * Staff:   GET/POST /sales/{docs}/{id}/approval-links/
 *          POST     /sales/{docs}/{id}/approval-links/{linkId}/revoke/
 *          GET/POST /sales/{docs}/{id}/approval-comments/
 * Public:  GET  /public/sales/approve/{token}/
 *          POST /public/sales/approve/{token}/decide/
 *          GET/POST /public/sales/approve/{token}/comments/
 */
import { api } from './api';

/** Document type → its API collection. */
export const APPROVAL_DOC_PATHS = {
  estimate: 'estimates',
  quotation: 'quotations',
  proforma_invoice: 'proforma-invoices',
  sales_invoice: 'invoices',
};

export const APPROVAL_DOC_LABELS = {
  estimate: 'Estimate',
  quotation: 'Quotation',
  proforma_invoice: 'Proforma Invoice',
  sales_invoice: 'Invoice',
};

export const DEFAULT_APPROVAL_VALIDITY_DAYS = 14;

function docPath(docType, documentId) {
  const collection = APPROVAL_DOC_PATHS[docType];
  if (!collection) throw new Error(`Unknown sales document type: ${docType}`);
  return `/sales/${collection}/${documentId}/`;
}

function rows(body) {
  if (Array.isArray(body)) return body;
  return body?.results || [];
}

/** The page the customer opens — an absolute URL on this web app. */
export function approvalUrlFor(token) {
  if (!token) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/sales/approve/${token}`;
}

// ── staff ────────────────────────────────────────────────────────────────────

export async function listApprovalLinks(docType, documentId) {
  return rows(await api.get(`${docPath(docType, documentId)}approval-links/`));
}

/** Returns the new link with its one-time `token` merged in. */
export async function createApprovalLink(docType, documentId, payload = {}) {
  const body = await api.post(`${docPath(docType, documentId)}approval-links/`, payload);
  return { ...(body?.link || {}), token: body?.token ?? null, url: body?.url ?? null };
}

export async function revokeApprovalLink(docType, documentId, linkId, reason) {
  return api.post(`${docPath(docType, documentId)}approval-links/${linkId}/revoke/`, { reason });
}

export async function listApprovalComments(docType, documentId) {
  return rows(await api.get(`${docPath(docType, documentId)}approval-comments/`));
}

export async function postApprovalComment(docType, documentId, text) {
  return rows(await api.post(`${docPath(docType, documentId)}approval-comments/`, { text }));
}

// ── customer (no account) ────────────────────────────────────────────────────

export async function fetchPublicSalesApproval(token) {
  return api.get(`/public/sales/approve/${token}/`);
}

export async function decidePublicSalesApproval(token, payload = {}) {
  return api.post(`/public/sales/approve/${token}/decide/`, payload);
}

export async function postPublicSalesComment(token, payload = {}) {
  return rows(await api.post(`/public/sales/approve/${token}/comments/`, payload));
}
