/**
 * adminSync — users, roles and tenants (api.md §3).
 *
 * These three screens each carried a fixed list of colleagues, roles and
 * clients. All three are real collections, and the permission catalogue the
 * role editor renders is served by `/admin/permissions/` — so the checkbox tree
 * matches what the server will actually enforce, rather than a copy of it that
 * drifts.
 */
import { createSync, compact, asText, isBackendEnabled, isServerId, describeError } from './resourceSync';
import { api } from './api';

export { isBackendEnabled, isServerId, describeError };

export const ADMIN_RESOURCES = {
  users: {
    path: '/admin/users/',
    toApi: (u) => compact({
      name: u.name,
      email: u.email || undefined,
      phone: u.phone || undefined,
      roleId: u.roleId || undefined,
      department: u.department || undefined,
      // The HRMS employee this login belongs to, by id or code; '' / null
      // unlinks. `createEmployee: false` stops a new login getting a record.
      employeeId: u.employeeId !== undefined ? (u.employeeId || null) : undefined,
      createEmployee: u.createEmployee,
      location: u.location || undefined,
      reportingManager: u.reportingManager || undefined,
      status: u.status || undefined,
      password: u.password || undefined,
    }),
    /**
     * The screens treat these as text — they search, sort and group on them.
     * The API returns null for anything unset (a user with no role yet, no
     * phone on file), so they are normalised to empty strings here rather than
     * guarded at every read.
     */
    fromApi: (row) => ({
      ...asText(row, [
        'name', 'email', 'phone', 'role', 'department',
        'employeeId', 'location', 'reportingManager',
      ]),
      status: row.status || 'Active',
      _synced: true,
    }),
  },

  roles: {
    path: '/admin/roles/',
    // The server reads the permission set from `selectedPermissions` and
    // answers with it as `permissions` (api.md §3.2). Without a code it
    // derives one from the name.
    toApi: (r) => compact({
      name: r.name,
      code: r.code || undefined,
      description: r.description !== undefined ? r.description : undefined,
      selectedPermissions: Array.isArray(r.permissions) ? r.permissions : undefined,
    }),
    fromApi: (row) => ({
      ...asText(row, ['name', 'code', 'description']),
      permissions: row.permissions || [],
      userCount: Number(row.userCount) || 0,
      isSystem: Boolean(row.isSystem),
      _synced: true,
    }),
  },

  clients: {
    path: '/admin/clients/',
    toApi: (c) => compact({
      name: c.name,
      slug: c.slug || undefined,
      plan: c.plan || undefined,
      status: c.status || undefined,
      timezone: c.timezone || undefined,
      currency: c.currency || undefined,
      fyStartMonth: c.fyStartMonth ?? undefined,
      contactName: c.contactName || undefined,
      contactEmail: c.contactEmail || undefined,
      contactPhone: c.contactPhone || undefined,
      industry: c.industry || undefined,
      notes: c.notes || undefined,
    }),
    fromApi: (row) => ({
      ...asText(row, [
        'name', 'slug', 'plan', 'timezone', 'currency', 'contactName',
        'contactEmail', 'contactPhone', 'industry', 'notes', 'location', 'email', 'phone',
      ]),
      status: row.status || 'Active',
      _synced: true,
    }),
  },
};

export const adminSync = createSync(ADMIN_RESOURCES, { label: 'adminSync' });

/**
 * `GET /admin/permissions/` — the permission catalogue, grouped by module.
 *
 * This is what the role editor's checkbox tree is built from. Keeping it here
 * means a permission added on the server appears in the editor without a
 * frontend change.
 */
export async function pullPermissionCatalogue() {
  if (!isBackendEnabled()) return null;
  try {
    const body = await api.get('/admin/permissions/');
    return body?.modules || body || [];
  } catch (err) {
    console.warn('[adminSync] pull permissions failed:', err?.message || err);
    return null;
  }
}

export async function pullUserStats() {
  if (!isBackendEnabled()) return null;
  try {
    return await api.get('/admin/users/stats/');
  } catch (err) {
    console.warn('[adminSync] pull user stats failed:', err?.message || err);
    return null;
  }
}

export const activateUser = (id) => adminSync.act('users', id, 'activate', {});
export const deactivateUser = (id) => adminSync.act('users', id, 'deactivate', {});
export const resetUserPassword = (id, payload = {}) =>
  adminSync.act('users', id, 'reset-password', payload, { raw: true });
export const duplicateRole = (id, payload = {}) => adminSync.act('roles', id, 'duplicate', payload);

/**
 * `GET /admin/users/{id}/permissions/` — `{ effective, role, grant, deny }`:
 * what the role gives, the per-user overrides on top, and the result.
 */
export async function pullUserPermissions(id) {
  if (!isBackendEnabled() || !isServerId(id)) return null;
  return api.get(`/admin/users/${id}/permissions/`);
}

/**
 * Save a user's final permission set as overrides on their role: whatever the
 * role lacks is granted, whatever it gives that was unticked is denied.
 */
export async function setUserPermissions(id, permissions, rolePermissions = []) {
  if (!isBackendEnabled()) return null;
  const wanted = new Set(permissions);
  const fromRole = new Set(rolePermissions);
  return api.post(`/admin/users/${id}/permissions/`, {
    grant: [...wanted].filter((p) => !fromRole.has(p)),
    deny: [...fromRole].filter((p) => !wanted.has(p)),
  });
}

export default adminSync;
