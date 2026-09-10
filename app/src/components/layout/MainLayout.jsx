import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAppStore } from '../../stores/appStore';

// ERP-only UI scope: graph.json global-shell guidance applied purely as a
// CSS class. CRM/HRMS routes never receive `erp-scope`, so their UI is
// untouched. No routing, data, or API logic changes here.
const ERP_PREFIXES = ['/dashboard', '/sales', '/purchase', '/inventory', '/parties', '/accounts', '/reports'];

export default function MainLayout() {
  const sidebarWidth = useAppStore((s) => s.sidebarWidth) ?? 260;
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);
  const { pathname } = useLocation();
  const isErpRoute = ERP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Auto-dismiss toast
  if (toast) setTimeout(() => clearToast?.(), 3000);

  return (
    <div
      className="app-shell"
      style={{ '--sidebar-width': `${sidebarWidth}px`, gridTemplateColumns: `${sidebarWidth}px minmax(0,1fr)` }}
    >
      <Sidebar />

      <div className="main-col">
        <Topbar />
        <main className={`content${isErpRoute ? ' erp-scope' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* Global Toast */}
      {toast && (
        <div className="toast">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
