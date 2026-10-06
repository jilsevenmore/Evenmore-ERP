import InfoBanner from '../../components/ui/InfoBanner';
import AdministrationGuideButton from './AdministrationGuideButton';
import KpiCard from '../../components/ui/KpiCard';
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminSync, duplicateRole, describeError, pullPermissionCatalogue } from '../../services/adminSync';
import { useAppStore } from '../../stores/appStore';
import { PermissionPicker } from './PermissionPicker';
import {
  Users,
  Shield,
  Clock,
  Search,
  Plus,
  MoreVertical,
  X,
  FileText,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Copy,
  Edit2,
  Lock,
} from 'lucide-react';

const ROLES_PER_PAGE = 10;

/** Lower-cased text, safe on a field the server left unset. */
function text(value) {
  return String(value ?? '').toLowerCase();
}

/** A stable chip colour per role, so a role added on the server needs no code. */
const ROLE_BADGE_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

function roleBadgeColor(role) {
  const key = String(role?.code || role?.name || '');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return ROLE_BADGE_COLORS[Math.abs(hash) % ROLE_BADGE_COLORS.length];
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export function RolesPage() {
  // Roles and the permission catalogue both come from the server, so the
  // checkbox tree can only offer permissions the API will actually enforce.
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [rolesError, setRolesError] = useState(false);
  const [catalogue, setCatalogue] = useState([]);
  const [catalogueLoaded, setCatalogueLoaded] = useState(false);

  // The server refuses role changes without `manage_roles`; the screen only
  // follows suit so nobody fills in a form that cannot be saved.
  const grantedPermissions = useAppStore((s) => s.permissions) || [];
  const canManage = grantedPermissions.includes('manage_roles');

  useEffect(() => {
    let cancelled = false;
    adminSync.pull('roles').then((rows) => {
      if (cancelled) return;
      if (!rows) {
        setRolesError(true);
        return;
      }
      setRoles(rows);
      setSelectedRoleId((current) => current || rows[0]?.id || null);
    });
    pullPermissionCatalogue().then((modules) => {
      if (cancelled) return;
      setCatalogue(Array.isArray(modules) ? modules : []);
      setCatalogueLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [openMenuRoleId, setOpenMenuRoleId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingRoleName, setEditingRoleName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingPermissions, setEditingPermissions] = useState([]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.role-menu-container')) {
        setOpenMenuRoleId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0] || null;
  }, [roles, selectedRoleId]);

  // Opening a role (or its saved copy coming back) starts the editor from
  // exactly what the server holds.
  useEffect(() => {
    if (activeRole) {
      setEditingRoleName(activeRole.name);
      setEditingDescription(activeRole.description || '');
      setEditingPermissions(activeRole.permissions || []);
    }
  }, [activeRole]);

  const isDirty = Boolean(activeRole) && (
    editingRoleName.trim() !== activeRole.name ||
    editingDescription.trim() !== (activeRole.description || '') ||
    !sameSet(editingPermissions, activeRole.permissions || [])
  );

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const q = roleSearchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        text(r.name).includes(q) ||
        text(r.description).includes(q) ||
        String(r.code ?? '').toLowerCase().includes(q)
      );
    });
  }, [roles, roleSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / ROLES_PER_PAGE));
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * ROLES_PER_PAGE;
    return filteredRoles.slice(start, start + ROLES_PER_PAGE);
  }, [filteredRoles, currentPage]);

  const startCount = filteredRoles.length === 0 ? 0 : (currentPage - 1) * ROLES_PER_PAGE + 1;
  const endCount = Math.min(currentPage * ROLES_PER_PAGE, filteredRoles.length);

  const stats = useMemo(() => {
    const permissionCount = catalogue.reduce(
      (sum, m) => sum + m.groups.reduce((n, g) => n + g.permissions.length, 0),
      0
    );
    return {
      totalRoles: roles.length,
      systemRoles: roles.filter((r) => r.isSystem).length,
      totalUsers: roles.reduce((sum, r) => sum + (Number(r.userCount) || 0), 0),
      totalPermissions: permissionCount,
      activeModules: catalogue.length,
    };
  }, [roles, catalogue]);

  const handleUpdateRole = async () => {
    if (!activeRole || !canManage) return;
    const name = editingRoleName.trim();
    if (!name) {
      showNotification('Please provide a valid role name.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await adminSync.update('roles', activeRole.id, {
        name,
        description: editingDescription.trim(),
        permissions: editingPermissions,
      });
      if (saved) {
        // The server's copy replaces ours, so the screen shows what was stored.
        setRoles((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        const stored = saved.permissions || [];
        showNotification(
          sameSet(stored, editingPermissions)
            ? `Role "${saved.name}" saved with ${stored.length} permissions.`
            : `Role "${saved.name}" saved, but the server kept ${stored.length} permissions.`
        );
      }
    } catch (err) {
      showNotification(`Role not saved — ${describeError(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    if (activeRole) {
      setEditingRoleName(activeRole.name);
      setEditingDescription(activeRole.description || '');
      setEditingPermissions(activeRole.permissions || []);
      showNotification('Changes reverted.');
    }
  };

  const handleDuplicateRole = async (targetRole) => {
    if (!targetRole) return;
    setOpenMenuRoleId(null);
    try {
      // `POST /admin/roles/{id}/duplicate/` copies the permission set and
      // allocates a code that does not collide with an existing role.
      const copy = await duplicateRole(targetRole.id);
      if (!copy) return;
      setRoles((prev) => [copy, ...prev]);
      setSelectedRoleId(copy.id);
      showNotification(`Role "${targetRole.name}" duplicated successfully!`);
    } catch (err) {
      showNotification(`Role not duplicated — ${describeError(err)}`);
    }
  };

  const handleDeleteRole = async () => {
    const target = roleToDelete || activeRole;
    if (!target) return;
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
    try {
      await adminSync.remove('roles', target.id);
    } catch (err) {
      showNotification(`Role not deleted — ${describeError(err)}`);
      return;
    }
    const remaining = roles.filter((r) => r.id !== target.id);
    setRoles(remaining);
    if (selectedRoleId === target.id) setSelectedRoleId(remaining[0]?.id || null);
    showNotification(`Role "${target.name}" was deleted.`);
  };

  const handleCreateNewRole = async (name, description, copyFromId) => {
    if (!name.trim()) return;
    const source = roles.find((r) => r.id === copyFromId);
    try {
      const created = await adminSync.create('roles', {
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: source ? source.permissions : [],
      });
      if (!created) return;
      setRoles((prev) => [created, ...prev]);
      setSelectedRoleId(created.id);
      setIsCreateModalOpen(false);
      showNotification(`New role "${created.name}" created. Now choose its permissions.`);
    } catch (err) {
      showNotification(`Role not created — ${describeError(err)}`);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 p-4 md:p-7 space-y-6" style={{ backgroundColor: 'var(--page, #f6f9ff)', color: 'var(--text)' }}>
      {toastMessage && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 z-50 bg-[#0f172a] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>&gt;</span>
            <span className="text-slate-700 font-medium">Roles</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Manage Roles</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Create and manage user roles with granular permissions across modules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <AdministrationGuideButton entity="role" />
        {canManage && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-2xs hover:shadow transition-all duration-150 active:scale-[0.99] cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span>Create Role</span>
        </button>
        )}
        </div>
      </div>

      <InfoBanner
        storageKey="adminRolesInfoBannerV1"
        title="Why use Roles & Permissions?"
        text="Group permissions into roles to control which modules and actions users can access. Select a role to review its permissions and keep access consistent for people with similar responsibilities."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Roles" value={stats.totalRoles} icon={Users} tone="blue">
            <div className="text-[11px] text-slate-400 mt-1">
              {stats.systemRoles} system · {stats.totalRoles - stats.systemRoles} custom
            </div>
        </KpiCard>

        <KpiCard label="Total Users" value={stats.totalUsers} icon={Users} tone="emerald">
            <div className="text-[11px] text-slate-400 mt-1">assigned to a role</div>
        </KpiCard>

        <KpiCard label="Total Permissions" value={stats.totalPermissions} icon={Shield} tone="sky">
            <div className="text-[11px] text-slate-400 mt-1">in the permission catalogue</div>
        </KpiCard>

        <KpiCard label="Active Modules" value={stats.activeModules} icon={Clock} tone="purple">
            <div className="text-[11px] text-slate-400 mt-1">permission modules</div>
        </KpiCard>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-5">
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Roles</h2>
            <span className="text-xs text-slate-400 font-medium">{roles.length} total</span>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={roleSearchQuery}
              onChange={(e) => {
                setRoleSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            {paginatedRoles.map((r) => {
              const isSelected = r.id === selectedRoleId;
              const isMenuOpen = openMenuRoleId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRoleId(r.id);
                    setOpenMenuRoleId(null);
                  }}
                  className={`relative flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-[#1f6bff] bg-blue-50/20 ring-1 ring-[#1f6bff] shadow-xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${roleBadgeColor(r)}`}
                    >
                      {r.code}
                    </div>
                    <div className="min-w-0">
                      <h4
                        className={`text-sm font-bold truncate leading-tight ${
                          isSelected ? 'text-[#1f6bff]' : 'text-slate-800'
                        }`}
                      >
                        {r.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {r.description}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {r.userCount} {r.userCount === 1 ? 'user' : 'users'} · {(r.permissions || []).length} permissions
                        {r.isSystem && <span className="ml-1.5 text-[10px] font-semibold uppercase text-slate-400">System</span>}
                      </p>
                    </div>
                  </div>

                  <div className="relative role-menu-container" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuRoleId((prev) => (prev === r.id ? null : r.id));
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isMenuOpen
                          ? 'bg-slate-200 text-slate-800 shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <MoreVertical size={15} />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoleId(r.id);
                            setOpenMenuRoleId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                        >
                          <Edit2 size={14} className="text-blue-600" />
                          <span>Edit Role</span>
                        </button>

                        {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDuplicateRole(r)}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                        >
                          <Copy size={14} className="text-amber-600" />
                          <span>Duplicate Role</span>
                        </button>
                        )}

                        {canManage && !r.isSystem && (
                        <>
                        <div className="my-1 border-t border-slate-100" />

                        <button
                          type="button"
                          onClick={() => {
                            setRoleToDelete(r);
                            setIsDeleteModalOpen(true);
                            setOpenMenuRoleId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                        >
                          <Trash2 size={14} className="text-rose-500" />
                          <span>Delete Role</span>
                        </button>
                        </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {startCount} to {endCount} of {filteredRoles.length} roles
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold ${
                    currentPage === pg
                      ? 'bg-[#1f6bff] text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 w-full bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col space-y-6">
          {rolesError ? (
            <div className="text-center py-16 text-xs text-slate-500">
              <Lock size={28} className="mx-auto text-slate-300 mb-2" />
              Roles could not be loaded. You may not have permission to manage roles.
            </div>
          ) : !activeRole ? (
            <div className="text-center py-16 text-xs text-slate-400">
              {roles.length === 0 ? 'No roles yet.' : 'Select a role to view its permissions.'}
            </div>
          ) : (
          <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1f6bff]">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{canManage ? 'Edit Role' : 'View Role'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {canManage
                    ? 'Configure permissions for this role'
                    : "You can view this role's permissions but not change them."}
                </p>
              </div>
            </div>

            {canManage && !activeRole.isSystem && (
            <button
              onClick={() => {
                setRoleToDelete(activeRole);
                setIsDeleteModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-600 text-xs font-semibold transition-colors"
            >
              <Trash2 size={14} />
              <span>Delete Role</span>
            </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editingRoleName}
                disabled={!canManage}
                onChange={(e) => setEditingRoleName(e.target.value)}
                placeholder="e.g. Employee"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Role name will be displayed across the system. Code: <span className="font-mono">{activeRole.code}</span>
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={editingDescription}
                disabled={!canManage}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="What this role is for"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
            </div>
          </div>

          {catalogueLoaded ? (
            <PermissionPicker
              modules={catalogue}
              selected={editingPermissions}
              onChange={setEditingPermissions}
              readOnly={!canManage}
            />
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">Loading permissions…</div>
          )}

          {canManage && (
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {isDirty && <span className="text-[11px] font-semibold text-amber-600 mr-auto">Unsaved changes</span>}
            <button
              onClick={handleCancelChanges}
              disabled={!isDirty || isSaving}
              className="px-4 h-9 border border-border bg-card hover:bg-card-hover text-text rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRole}
              disabled={!isDirty || isSaving}
              className="px-4 h-9 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-2xs hover:shadow transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Update Role'}
            </button>
          </div>
          )}
          </>
          )}
        </div>
      </div>

      {isDeleteModalOpen && (roleToDelete || activeRole) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Role?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete the <strong>{(roleToDelete || activeRole).name}</strong> role?
              Users currently assigned to this role will lose their permission scope.
            </p>

            <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRoleToDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRole}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs"
              >
                Yes, Delete Role
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateRoleModal
          roles={roles}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateNewRole}
        />
      )}
    </div>
  );
}

function CreateRoleModal({ roles, onClose, onCreate }) {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [copyFromId, setCopyFromId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate(roleName, description, copyFromId);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Create New Role</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Role Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Regional Sales Lead"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Describe access boundaries..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Start with permissions from</label>
            <select
              value={copyFromId}
              onChange={(e) => setCopyFromId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No permissions (choose them next)</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({(r.permissions || []).length} permissions)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#1f6bff] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RolesPage;
