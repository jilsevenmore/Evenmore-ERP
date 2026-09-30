import { useCrmStore } from '../../../../stores/crmStore';
import { useAppStore } from '../../../../stores/appStore';

/**
 * Who can be allocated work, and the departments they sit in — from the roster.
 * The roster lists a person once per CRM role, so it is de-duplicated by id.
 */
export function loadEmployees() {
  const seen = new Set();
  return (useCrmStore.getState().teamMembers || []).filter((member) => {
    if (!member?.id || seen.has(member.id)) return false;
    seen.add(member.id);
    return true;
  });
}

export function loadDepartments() {
  const seen = new Set();
  loadEmployees().forEach((m) => { if (m.department) seen.add(m.department); });
  return [...seen];
}

/**
 * Kept as named exports because the allocation screens read them directly.
 * Both are live reads of the roster rather than a fixed list of colleagues.
 */
export const EMPLOYEES = new Proxy([], {
  get(_t, prop) {
    const rows = loadEmployees();
    const value = rows[prop];
    return typeof value === 'function' ? value.bind(rows) : value;
  },
  ownKeys: () => Reflect.ownKeys(loadEmployees()),
  getOwnPropertyDescriptor: (_t, prop) =>
    Reflect.getOwnPropertyDescriptor(loadEmployees(), prop),
});

export const DEPARTMENTS = new Proxy([], {
  get(_t, prop) {
    const rows = loadDepartments();
    const value = rows[prop];
    return typeof value === 'function' ? value.bind(rows) : value;
  },
  ownKeys: () => Reflect.ownKeys(loadDepartments()),
  getOwnPropertyDescriptor: (_t, prop) =>
    Reflect.getOwnPropertyDescriptor(loadDepartments(), prop),
});
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['Pending', 'In Progress', 'Completed'];

/** The allocations the CRM store is holding, from `/crm/task-allocations/`. */
export function useAllocationTasks() {
  return useCrmStore((s) => s.taskAllocations);
}

/** Whether the store has finished its first load (so "not found" means it). */
export function useAllocationsLoaded() {
  return useCrmStore((s) => s.status.loaded);
}

/**
 * Managers allocate, edit, reassign and delete; everyone else sees the work
 * allocated to them and moves its status along. Mirrors the API's rule.
 */
export function useCanManageAllocations() {
  const permissions = useAppStore((s) => s.permissions) || [];
  return ['manage_task_allocation', 'assign_task', '*'].some((code) => permissions.includes(code));
}

export function createAllocation(allocation) {
  return useCrmStore.getState().createRecord('taskAllocations', allocation);
}

/** A partial update: send only what changed, plus an optional audit `note`. */
export function updateAllocation(id, updates) {
  return useCrmStore.getState().updateRecord('taskAllocations', id, updates);
}

export function deleteAllocation(id) {
  return useCrmStore.getState().deleteRecord('taskAllocations', id);
}

export function formatDeadline(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}

export function formatAuditDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}
