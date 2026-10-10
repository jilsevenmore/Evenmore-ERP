/**
 * Which navigation the signed-in user can see.
 *
 * UX only: the server refuses anything these rules hide (api-integration.md §6,
 * "a hidden button must still 403 if called"). The rules mirror the backend:
 *
 *  - a module section needs its `menu_*` permission (the section's `menu` key
 *    in Sidebar's NAV);
 *  - a page needs the permission its API list endpoint requires, so the menu
 *    never offers a screen that would only answer 403;
 *  - self-service pages (own leave, payslips, attendance, tasks) show even
 *    without the module's `menu_*`, because the seeded Employee role has none.
 *
 * A permission value is an id, or an array meaning "any of these".
 */

// Mirrors `sees_all_projects` + customers in the server's
// `check_customer_tracking_permission`.
const TRACKING_VIEWERS = ['view_projects', 'menu_pms', 'create_pms_project', 'assign_stage', 'menu_admin'];

// Longest matching prefix wins.
const ROUTE_PERMISSIONS = [
  ['/crm/dashboard', 'show_crm_dashboard'],
  // Every employee works their own CRM tasks and allocations; the server
  // returns only the ones assigned to them (managers see the team's).
  ['/crm/tasks', null],
  ['/crm/leads/tasks-master', 'view_task'],
  ['/crm/leads/task-form', 'view_task'],
  ['/crm/leads/stage-tasks', 'view_task'],
  ['/crm/projects', 'view_projects'],
  ['/crm', 'view_lead'],
  ['/pms', 'view_pms'],
  ['/sales', 'view_sales'],
  ['/purchase', 'view_purchase'],
  ['/parties', ['view_sales', 'view_purchase', 'view_ledger']],
  ['/inventory', 'view_inventory'],
  ['/accounts/cash-bank', 'view_bank_accounts'],
  ['/accounts/general-ledger', 'view_ledger'],
  ['/accounts/reports', 'view_financial_reports'],
  ['/hrms/dashboard', 'show_hrm_dashboard'],
  ['/hrms/attendance/mark', 'mark_attendance'],
  ['/hrms/attendance', 'view_team_attendance'],
  ['/hrms/leave', ['apply_leave', 'approve_leave']],
  ['/hrms/payroll', ['view_own_payslip', 'generate_payroll', 'approve_payroll']],
  ['/hrms', 'view_staff'],
  ['/organization', 'view_staff'],
  ['/administration/users', 'view_staff'],
  ['/administration/roles', 'manage_roles'],
  ['/administration/clients', 'menu_admin'],
  // Customer Tracking is the customer's view of their orders: customers
  // (view_projects) and the people who run projects -- not every employee.
  ['/customer/projects', TRACKING_VIEWERS],
  // Whoever is assigned to a project sees it, its details and their tasks,
  // PMS access or not -- the server returns only the projects they work on.
  ['/pms/my-tasks', null],
  ['/pms/my-projects', null],
  ['/pms/tracking', TRACKING_VIEWERS],
  ['/employee/portal', null],
  // Old top-level alias of HRMS › Company Policy.
  ['/company-policy', 'view_staff'],
];

// The module section a URL belongs to, and the `menu_*` id that opens it (the
// `menu` key of that section in Sidebar's NAV).
const MODULE_MENUS = [
  ['/crm', 'menu_crm'],
  ['/pms', 'menu_pms'],
  ['/sales', 'menu_sales'],
  ['/purchase', 'menu_purchase'],
  ['/inventory', 'menu_inventory'],
  ['/accounts', 'menu_accounts'],
  ['/hrms', 'menu_hrms'],
  ['/company-policy', 'menu_hrms'],
  ['/organization', 'menu_organization'],
  ['/administration', 'menu_admin'],
];

// Self-service pages whose detail views (`/customer/projects/:id`) are
// self-service too.
const SELF_SERVICE_PREFIXES = ['/customer/projects', '/pms/tracking'];

// A record's own page opens for anyone assigned to it, module access or not;
// the server answers 404 for records the user is not on. The lists
// (All Projects, Leads, Deals, ...) stay behind their permissions.
const ASSIGNED_RECORD_PREFIXES = [
  '/pms/projects/',
  '/crm/leads/',
  '/crm/projects/',
  '/crm/contracts/',
  '/crm/tasks/allocation/',
];
// Pages under /crm/leads/ that are not a lead.
const LEAD_TOOL_PAGES = new Set([
  'forms', 'tasks-master', 'task-form', 'stage-tasks', 'form-builder', 'create-form',
]);

function isAssignedRecordPath(path) {
  const prefix = ASSIGNED_RECORD_PREFIXES.find((p) => path.startsWith(p));
  if (!prefix) return false;
  const rest = path.slice(prefix.length);
  if (!rest || rest.includes('/')) return false;
  return !(prefix === '/crm/leads/' && LEAD_TOOL_PAGES.has(rest));
}

const SELF_SERVICE_ROUTES = new Set([
  '/employee/portal',
  '/hrms/leave',
  '/hrms/payroll',
  '/hrms/attendance/mark',
  '/pms/my-projects',
  '/pms/my-tasks',
  '/crm/tasks',
  '/crm/tasks/allocation',
  '/customer/projects',
]);

export function routePermission(path) {
  if (!path) return null;
  if (isAssignedRecordPath(path)) return null;
  let best = null;
  for (const [prefix, permission] of ROUTE_PERMISSIONS) {
    const matches = path === prefix || path.startsWith(`${prefix}/`);
    if (matches && (!best || prefix.length > best[0].length)) best = [prefix, permission];
  }
  return best ? best[1] : null;
}

export function canUse(permission, granted) {
  if (!permission) return true;
  const options = Array.isArray(permission) ? permission : [permission];
  return options.some((id) => granted.includes(id));
}

function moduleMenu(path) {
  const found = MODULE_MENUS.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  return found ? found[1] : null;
}

function isSelfService(path) {
  return (
    SELF_SERVICE_ROUTES.has(path) ||
    SELF_SERVICE_PREFIXES.some((p) => path.startsWith(`${p}/`)) ||
    isAssignedRecordPath(path)
  );
}

/**
 * Determines whether a user has permissions to view and use the ERP dashboard.
 * The ERP dashboard aggregates Sales, Purchase, Inventory, Accounts, CRM, HRMS, and PMS.
 *
 * - Admin and superusers can always use the dashboard.
 * - Customers cannot use the ERP dashboard.
 * - Employees who have managerial or operational access (Sales, Purchase, Inventory, Accounts, CRM, HRMS, PMS, Admin) CAN use the dashboard.
 * - Employees who only have self-service access (leave, mark attendance, own payslip, my stage tasks) CANNOT use the dashboard.
 */
export function canUseDashboard(currentUser, granted = []) {
  if (!currentUser) return false;
  if (currentUser.isSuperuser || currentUser.isAdmin) return true;

  const roleName = String(currentUser?.role?.name || currentUser?.role || '').toLowerCase();
  const roleCode = String(currentUser?.role?.code || '').toUpperCase();
  if (roleCode === 'AD' || roleName === 'admin' || roleName === 'administrator') return true;

  if (
    currentUser.isCustomer ||
    roleCode === 'CU' ||
    roleName === 'customer'
  ) {
    return false;
  }

  const permissions = Array.isArray(granted) ? granted : [];
  if (permissions.includes('*')) return true;

  const DASHBOARD_CAPABILITIES = [
    'menu_crm',
    'menu_sales',
    'menu_purchase',
    'menu_inventory',
    'menu_accounts',
    'menu_hrms',
    'menu_organization',
    'menu_admin',
    'menu_pms',
    'show_crm_dashboard',
    'show_hrm_dashboard',
    'show_account_dashboard',
    'view_sales',
    'view_purchase',
    'view_inventory',
    'view_lead',
    'view_projects',
    'view_bank_accounts',
    'view_ledger',
    'view_financial_reports',
    'view_staff',
    'view_team_attendance',
    'approve_leave',
    'generate_payroll',
    'approve_payroll',
    'manage_roles',
  ];

  return DASHBOARD_CAPABILITIES.some((perm) => permissions.includes(perm));
}

/**
 * Whether a page may be opened at all — the sidebar's rule applied to any URL,
 * so a page the menu hides cannot be reached by typing its address either:
 * the page's own permission, plus its module's `menu_*` unless it is a
 * self-service page.
 */
export function canOpenPath(path, granted, currentUser) {
  const clean = String(path || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (clean === '/dashboard' && currentUser && !canUseDashboard(currentUser, granted)) {
    return false;
  }
  if (!canUse(routePermission(clean), granted)) return false;
  const menu = moduleMenu(clean);
  return !menu || canUse(menu, granted) || isSelfService(clean);
}

/** NAV filtered to what `granted` (the /auth/me permission ids) allows. */
export function filterNavByPermission(items, granted, currentUser) {
  function visit(item, inMenu) {
    if (item.children) {
      const open = inMenu && canUse(item.menu, granted);
      const children = item.children.map((child) => visit(child, open)).filter(Boolean);
      return children.length ? { ...item, children } : null;
    }
    if (item.to === '/dashboard' && currentUser && !canUseDashboard(currentUser, granted)) {
      return null;
    }
    if (!canUse(routePermission(item.to), granted)) return null;
    if (!inMenu && !SELF_SERVICE_ROUTES.has(item.to)) return null;
    return item;
  }
  return items.map((item) => visit(item, true)).filter(Boolean);
}
