import { api } from '../../../services/api';
import { useCrmStore } from '../../../stores/crmStore';
import { useLeadDetailStore } from '../../../stores/leadDetailStore';

/**
 * Generate a standard product SKU from product name and optional existing products list.
 * E.g., 'tabel' -> 'TAB-001', 'Office Chair' -> 'OCH-001', 'Ergonomic Desk Fan' -> 'EDF-001'.
 * If 'TAB-001' exists, increments to 'TAB-002'.
 */
export function generateProductSku(name, existingProducts = []) {
  if (!name || !name.trim()) return '';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);
  let prefix = '';

  if (words.length === 1) {
    prefix = words[0].slice(0, 3);
  } else if (words.length === 2) {
    prefix = (words[0].slice(0, 2) + words[1].slice(0, 1)).slice(0, 3);
  } else if (words.length >= 3) {
    prefix = words.slice(0, 3).map((w) => w[0]).join('');
  }

  if (!prefix) prefix = 'PRD';
  if (prefix.length < 3) prefix = prefix.padEnd(3, 'X');

  const regex = new RegExp(`^${prefix}-(\\d+)$`);
  let maxSeq = 0;

  (existingProducts || []).forEach((p) => {
    const sku = (typeof p === 'string' ? p : p?.sku) || '';
    const m = sku.toUpperCase().match(regex);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxSeq) maxSeq = n;
    }
  });

  return `${prefix}-${String(maxSeq + 1).padStart(3, '0')}`;
}

/**
 * Attach selected products and users to a newly created lead.
 */
export async function attachLeadSubResources(leadId, { products = [], leadUsers = [], items = [], teamMembers = [] }) {
  if (!leadId) return;

  const resolvedMembers = teamMembers?.length ? teamMembers : useCrmStore.getState().teamMembers;

  const productPromises = (products || []).map(async (prod) => {
    try {
      const prodName = typeof prod === 'string' ? prod.trim() : (prod?.name || '').trim();
      if (!prodName) return null;

      const matchedItem = (items || []).find(
        (it) => it.name?.trim().toLowerCase() === prodName.toLowerCase() || it.id === prodName || it.id === prod?.itemId
      );

      const sku = (typeof prod === 'object' && prod?.sku)
        ? prod.sku
        : (matchedItem?.sku || generateProductSku(prodName));

      const price = (typeof prod === 'object' && prod?.price !== undefined)
        ? Number(prod.price)
        : (Number(matchedItem?.selling_price ?? matchedItem?.rate) || 0);

      const qty = (typeof prod === 'object' && prod?.qty) ? Number(prod.qty) : 1;

      return await api.post(`/crm/leads/${leadId}/products/`, {
        itemId: matchedItem?.id || undefined,
        name: prodName,
        sku: String(sku).toUpperCase(),
        price,
        qty,
        status: 'Active',
      });
    } catch (err) {
      console.warn(`[CRM] Failed to attach product "${prod}" to lead ${leadId}:`, err?.message || err);
      return null;
    }
  });

  const userPromises = (leadUsers || []).map(async (usr) => {
    try {
      const userName = typeof usr === 'string' ? usr.trim() : (usr?.name || '').trim();
      const userId = typeof usr === 'object' && usr?.userId ? usr.userId : (typeof usr === 'object' ? usr?.id : null);

      const matchedMember = (resolvedMembers || []).find(
        (m) => m.id === userId || m.id === usr || m.name?.trim().toLowerCase() === userName.toLowerCase()
      );

      const targetUserId = matchedMember?.id || userId;
      if (!targetUserId) return null;

      const role = (typeof usr === 'object' && usr?.role)
        ? usr.role
        : (matchedMember?.designation || matchedMember?.role || 'Staff');

      return await api.post(`/crm/leads/${leadId}/users/`, {
        userId: targetUserId,
        role,
      });
    } catch (err) {
      console.warn(`[CRM] Failed to attach user "${usr}" to lead ${leadId}:`, err?.message || err);
      return null;
    }
  });

  await Promise.allSettled([...productPromises, ...userPromises]);

  // Refresh crm store and invalidate/reload lead detail if cached
  try {
    useCrmStore.getState().refresh();
    const detailStore = useLeadDetailStore.getState();
    if (detailStore?.load) {
      await detailStore.load(leadId, { force: true });
    }
  } catch (e) {
    // Non-blocking store refresh
  }
}
