import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { CommandPalette } from '../common/CommandPalette';
import { FloatingSupportModal } from '../common/FloatingSupportModal';
import { useAppStore } from '../../stores/appStore';
import { useProofApprovalSync } from '../../features/pms/approval/useProofApprovalSync';
import { useModuleHydration } from '../../hooks/useModuleHydration';

// ERP-only UI scope: graph.json global-shell guidance applied purely as a
// CSS class. CRM/HRMS routes never receive `erp-scope`, so their UI is
// untouched. No routing, data, or API logic changes here.
const ERP_PREFIXES = ['/dashboard', '/sales', '/purchase', '/inventory', '/parties', '/accounts', '/reports'];

export default function MainLayout() {
  const sidebarWidth = useAppStore((s) => s.sidebarWidth) ?? 280;
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const { pathname } = useLocation();
  const isErpRoute = ERP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Fill the module stores from the API for this session.
  useModuleHydration();

  // Pick up design approvals taken in a client's approval-link tab.
  useProofApprovalSync();

  // Global keydown for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && String(e.key ?? '').toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => clearToast?.(), 3000);
    return () => window.clearTimeout(timer);
  }, [clearToast, toast]);

  return (
    <div
      className="app-shell"
      style={{
        '--sidebar-width': `${sidebarWidth}px`,
        gridTemplateColumns: `${sidebarWidth}px minmax(0,1fr)`,
      }}
    >
      <Sidebar />

      <div className="main-col">
        <Topbar />
        <main className={`content${isErpRoute ? ' erp-scope' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Global Floating Need Help / Support Button */}
      <FloatingSupportModal />

      {/* Global Toast */}
      {toast && (
        <div className="toast">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
