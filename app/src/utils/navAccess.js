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

// Longest matching prefix wins.
const ROUTE_PERMISSIONS = [
  ['/crm/dashboard', 'show_crm_dashboard'],
  ['/crm/tasks', 'view_task'],
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
  ['/customer/projects', ['view_projects', 'view_pms']],
  ['/pms/tracking', ['view_projects', 'view_pms']],
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

const SELF_SERVICE_ROUTES = new Set([
  '/crm/tasks',
  '/hrms/leave',
  '/hrms/payroll',
  '/hrms/attendance/mark',
  '/pms/my-projects',
  '/pms/my-tasks',
  '/customer/projects',
]);

export function routePermission(path) {
  if (!path) return null;
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
  return SELF_SERVICE_ROUTES.has(path) || SELF_SERVICE_PREFIXES.some((p) => path.startsWith(`${p}/`));
}

/**
 * Whether a page may be opened at all — the sidebar's rule applied to any URL,
 * so a page the menu hides cannot be reached by typing its address either:
 * the page's own permission, plus its module's `menu_*` unless it is a
 * self-service page.
 */
export function canOpenPath(path, granted) {
  const clean = String(path || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (!canUse(routePermission(clean), granted)) return false;
  const menu = moduleMenu(clean);
  return !menu || canUse(menu, granted) || isSelfService(clean);
}

/** NAV filtered to what `granted` (the /auth/me permission ids) allows. */
export function filterNavByPermission(items, granted) {
  function visit(item, inMenu) {
    if (item.children) {
      const open = inMenu && canUse(item.menu, granted);
      const children = item.children.map((child) => visit(child, open)).filter(Boolean);
      return children.length ? { ...item, children } : null;
    }
    if (!canUse(routePermission(item.to), granted)) return null;
    if (!inMenu && !SELF_SERVICE_ROUTES.has(item.to)) return null;
    return item;
  }
  return items.map((item) => visit(item, true)).filter(Boolean);
}
