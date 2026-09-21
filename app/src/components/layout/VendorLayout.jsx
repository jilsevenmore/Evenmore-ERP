import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useVendorStore } from '../../stores/vendorStore';
import {
  LayoutDashboard,
  Package,
  Bell,
  User,
  LogOut,
  ArrowLeftRight,
  Menu,
  X,
  ShieldAlert,
  Building2,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export function VendorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const currentVendorId = useVendorStore((s) => s.currentVendorId);
  const currentUserId = useVendorStore((s) => s.currentUserId);
  const getCurrentVendor = useVendorStore((s) => s.getCurrentVendor);
  const getCurrentUser = useVendorStore((s) => s.getCurrentUser);
  const logoutVendor = useVendorStore((s) => s.logoutVendor);
  const notifications = useVendorStore((s) => s.notifications);
  const markNotificationRead = useVendorStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useVendorStore((s) => s.markAllNotificationsRead);

  const currentVendor = getCurrentVendor();
  const currentUser = getCurrentUser();

  // Guard: if not logged in, redirect to login
  if (!currentVendorId || !currentVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Vendor Session Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please log in with your authorized vendor credentials to access the Vendor Portal.
          </p>
          <button
            onClick={() => navigate('/vendor/login')}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-xs cursor-pointer transition-colors"
          >
            Go to Vendor Login
          </button>
        </div>
      </div>
    );
  }

  // Guard: if vendor portal access is disabled
  if (currentVendor.portalAccess === 'Disabled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-rose-200 dark:border-rose-900/40 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Portal Access Disabled</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Vendor portal access for <span className="font-semibold text-slate-800 dark:text-slate-200">{currentVendor.name}</span> is currently disabled by ERP Operations Administration.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                logoutVendor();
                navigate('/vendor/login');
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Sign Out
            </button>
            <Link
              to="/dashboard"
              className="text-xs text-primary font-medium hover:underline inline-flex items-center justify-center gap-1 mt-2"
            >
              Switch to ERP Admin Shell <ArrowLeftRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const vendorNotifications = notifications.filter(
    (n) => n.vendorId === currentVendor.id || n.vendorId === null
  );
  const unreadCount = vendorNotifications.filter((n) => !n.read).length;

  const navItems = [
    { to: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/vendor/orders', label: 'My Orders', icon: Package },
    { to: '/vendor/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/vendor/profile', label: 'Vendor Profile', icon: User },
    { to: '/vendor/performance', label: 'Performance', icon: TrendingUp },
  ];

  const handleLogout = () => {
    logoutVendor();
    navigate('/vendor/login');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-4 lg:px-8 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link to="/vendor/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs font-bold text-sm">
              VP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  EVENMORE
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 uppercase tracking-wide">
                  Vendor Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-[320px]">
                {currentVendor.name}
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
                {Boolean(item.badge) && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Action Icons & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick link back to Admin ERP */}
          <Link
            to="/purchase/vendors"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Switch back to Evenmore ERP Admin interface"
          >
            <ArrowLeftRight size={13} className="text-primary" />
            <span>ERP Admin</span>
          </Link>

          {/* Notifications dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 relative cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">Vendor Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead(currentVendor.id)}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 mt-1">
                  {vendorNotifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      You're all caught up! No notifications.
                    </div>
                  ) : (
                    vendorNotifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifDropdownOpen(false);
                          if (n.orderId) navigate(`/vendor/orders/${n.orderId}`);
                        }}
                        className={`p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors ${
                          !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <Link
                    to="/vendor/notifications"
                    onClick={() => setNotifDropdownOpen(false)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Chip & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {currentUser?.name || 'Vendor Rep'}
              </p>
              <p className="text-[10px] text-slate-400">{currentUser?.role || 'Portal Admin'}</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Sign Out of Vendor Portal"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
          <div className="w-64 bg-white dark:bg-slate-900 p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Vendor Portal</span>
                <button onClick={() => setMobileNavOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {Boolean(item.badge) && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <Link
                to="/purchase/vendors"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                <ArrowLeftRight size={13} />
                <span>Return to ERP Admin</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}

      {/* ── Main View Content ─────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800">
        Evenmore ERP • Vendor Portal v1.0 • Isolated Secure Access for {currentVendor.name}
      </footer>
    </div>
  );
}

export default VendorLayout;
