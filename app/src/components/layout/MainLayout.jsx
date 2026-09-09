import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAppStore } from '../../stores/appStore';

export default function MainLayout() {
  const sidebarWidth = useAppStore((s) => s.sidebarWidth) ?? 260;
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);

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
        <main className="content">
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
