import { Link, useLocation } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { canOpenPath } from '../../utils/navAccess';

/**
 * Pages outside the signed-in user's role are not rendered, whether they were
 * reached from the menu or by typing the address. The same rule hides them in
 * the sidebar (`navAccess.js`).
 *
 * UX only — the server refuses the data regardless (api-integration.md §6).
 */
// A customer login sees only its portal, as in the sidebar.
const CUSTOMER_PATHS = ['/dashboard', '/customer/projects', '/pms/tracking'];

export default function RouteAccessGuard({ children }) {
  const { pathname } = useLocation();
  const permissions = useAppStore((s) => s.permissions) || [];
  const currentUser = useAppStore((s) => s.currentUser);
  const isCustomer = Boolean(
    currentUser?.isCustomer ||
    currentUser?.role?.code === 'CU' ||
    String(currentUser?.role?.name || currentUser?.role || '').toLowerCase() === 'customer'
  );
  const customerOk = !isCustomer || CUSTOMER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (customerOk && canOpenPath(pathname, permissions)) return children;

  const roleName = currentUser?.role?.name || currentUser?.role || '';
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xs p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
          <ShieldOff size={22} />
        </div>
        <h1 className="text-lg font-bold text-text">You don't have access to this page</h1>
        <p className="text-sm text-muted mt-1.5">
          {roleName ? `Your role (${roleName}) does not include this section.` : 'Your role does not include this section.'}{' '}
          Ask an administrator if you need it.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center mt-5 h-9 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
