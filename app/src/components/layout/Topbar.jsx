import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Bell,
  CalendarDays,
  Settings,
  ChevronDown,
  Command,
  Sun,
  Moon,
  Sparkles,
  TreePine,
  Check,
  User,
  LogOut,
  Building,
  ShieldCheck,
  FilePlus,
  ShoppingCart,
  Receipt,
  UserPlus,
  Layers,
  Inbox,
  Clock,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

const THEMES = [
  { id: 'light', name: 'Enterprise Light', icon: Sun, desc: 'Clean high-contrast corporate palette', color: '#1f6bff' },
  { id: 'dark', name: 'Onyx Dark', icon: Moon, desc: 'Deep slate eye-comfort dark mode', color: '#3b82f6' },
  { id: 'midnight', name: 'Midnight Nebula', icon: Sparkles, desc: 'Indigo violet executive gradient', color: '#818cf8' },
  { id: 'emerald', name: 'Emerald Executive', icon: TreePine, desc: 'Fintech forest & gold prestige', color: '#10b981' },
];

const QUICK_ACTIONS = [
  { label: 'Create New Lead', path: '/crm/leads', icon: UserPlus, color: 'text-blue-500 bg-blue-50' },
  { label: 'Create Sales Order', path: '/sales/orders', icon: ShoppingCart, color: 'text-indigo-500 bg-indigo-50' },
  { label: 'Create Tax Invoice', path: '/sales/invoices', icon: Receipt, color: 'text-emerald-500 bg-emerald-50' },
  { label: 'New Purchase Bill', path: '/purchase/bills', icon: FilePlus, color: 'text-amber-500 bg-amber-50' },
  { label: 'Register Trade Party', path: '/parties', icon: Building, color: 'text-purple-500 bg-purple-50' },
  { label: 'Add Inventory Item', path: '/inventory/items/new', icon: Layers, color: 'text-rose-500 bg-rose-50' },
];

const NOTIFICATIONS = [
  { id: 1, title: 'Invoice INV-2026-004 Paid', time: '10m ago', unread: true, desc: 'Acme Corp settled $5,820.00 via Bank Wire' },
  { id: 2, title: 'Low Stock Alert', time: '1h ago', unread: true, desc: 'Cat-6 Ethernet Spool below safety stock (3 avail)' },
  { id: 3, title: 'Sales Order Confirmed', time: '2h ago', unread: false, desc: 'SO-2026-004 approved by Lucius Fox' },
  { id: 4, title: 'Attendance Reconciled', time: 'Yesterday', unread: false, desc: 'Monthly biometric log synchronized for 48 staff' },
];

export default function Topbar() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const globalSearch = useAppStore((s) => s.globalSearch);
  const setGlobalSearch = useAppStore((s) => s.setGlobalSearch);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const theme = useAppStore((s) => s.theme) || 'light';
  const setTheme = useAppStore((s) => s.setTheme);

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const themeRef = useRef(null);
  const quickAddRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (themeRef.current && !themeRef.current.contains(event.target)) setIsThemeOpen(false);
      if (quickAddRef.current && !quickAddRef.current.contains(event.target)) setIsQuickAddOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];
  const ActiveThemeIcon = activeThemeObj.icon;

  return (
    <header className="topbar">
      {/* Search Input Bar */}
      <label className="top-search cursor-pointer">
        <Search size={15} className="top-search-ico shrink-0" />
        <input
          type="text"
          placeholder="Search records, contacts, deals... (Ctrl+K)"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          onClick={() => setCommandPaletteOpen(true)}
          readOnly
          className="w-full bg-transparent text-xs focus:outline-none cursor-pointer"
        />
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          <Command size={10} />K
        </kbd>
      </label>

      {/* Right Actions Cluster */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Switcher Button & Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            type="button"
            onClick={() => {
              setIsThemeOpen(!isThemeOpen);
              setIsQuickAddOpen(false);
              setIsNotifOpen(false);
              setIsProfileOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
            title="Switch Visual Theme"
          >
            <ActiveThemeIcon size={14} style={{ color: activeThemeObj.color }} />
            <span className="hidden md:inline text-[11px]">{activeThemeObj.name}</span>
            <ChevronDown size={12} style={{ color: 'var(--muted)' }} />
          </button>

          {isThemeOpen && (
            <div className="top-dropdown-menu w-64 p-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Select Theme Palette
              </div>
              <div className="space-y-1">
                {THEMES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id);
                        setIsThemeOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer"
                      style={{
                        background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                        color: isSelected ? 'var(--primary)' : 'var(--text)',
                        fontWeight: isSelected ? 700 : 500,
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0"
                          style={{ background: t.color }}
                        >
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{t.name}</div>
                          <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{t.desc}</div>
                        </div>
                      </div>
                      {isSelected && <Check size={14} style={{ color: 'var(--primary)' }} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Menu */}
        <div className="relative" ref={quickAddRef}>
          <button
            type="button"
            onClick={() => {
              setIsQuickAddOpen(!isQuickAddOpen);
              setIsThemeOpen(false);
              setIsNotifOpen(false);
              setIsProfileOpen(false);
            }}
            className="add-btn"
            aria-label="Quick Create Record"
            title="Create New Record"
          >
            <Plus size={16} strokeWidth={2.4} />
          </button>

          {isQuickAddOpen && (
            <div className="top-dropdown-menu w-56 p-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Quick Actions
              </div>
              <div className="space-y-0.5">
                {QUICK_ACTIONS.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        navigate(action.path);
                        setIsQuickAddOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
                      style={{ color: 'var(--text)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--soft)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${action.color}`}>
                        <Icon size={13} />
                      </div>
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsThemeOpen(false);
              setIsQuickAddOpen(false);
              setIsProfileOpen(false);
            }}
            className="top-icon"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={15} />
            <span className="notif-dot" />
          </button>

          {isNotifOpen && (
            <div className="top-dropdown-menu w-80 p-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="font-bold text-xs" style={{ color: 'var(--text)' }}>Notifications</span>
                <span className="text-[10px] font-semibold cursor-pointer hover:underline" style={{ color: 'var(--primary)' }}>
                  Mark all read
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto mt-1 space-y-1">
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className="py-2.5 px-2 rounded-lg transition cursor-pointer"
                    style={{ background: n.unread ? 'var(--soft)' : 'transparent' }}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: 'var(--text)' }}>
                      <span>{n.title}</span>
                      <span className="text-[10px] font-normal" style={{ color: 'var(--muted)' }}>{n.time}</span>
                    </div>
                    <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calendar Shortcut */}
        <Link
          to="/hrms/attendance"
          className="top-icon hidden sm:flex"
          aria-label="Calendar & Schedule"
          title="Calendar & Schedule"
        >
          <CalendarDays size={14} />
        </Link>

        {/* Messages / Discussion Shortcut */}
        <Link
          to="/crm/tasks"
          className="top-icon hidden sm:flex"
          aria-label="Messages & Discussions"
          title="Messages & Discussions"
        >
          <Inbox size={14} />
        </Link>

        {/* Settings Shortcut */}
        <Link
          to="/administration/settings"
          className="top-icon hidden sm:flex"
          aria-label="System Settings"
          title="System Settings"
        >
          <Settings size={14} />
        </Link>

        <span className="top-divider" />

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsThemeOpen(false);
              setIsQuickAddOpen(false);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg transition cursor-pointer"
          >
            <div className="profile-avatar">
              {currentUser?.initials || 'DP'}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="font-bold text-xs" style={{ color: 'var(--text)' }}>{currentUser?.name || 'David Patel'}</span>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{currentUser?.role || 'Admin'}</span>
            </div>
            <ChevronDown size={12} style={{ color: 'var(--muted)' }} />
          </button>

          {isProfileOpen && (
            <div className="top-dropdown-menu w-64 p-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="profile-avatar text-sm">
                  {currentUser?.initials || 'DP'}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-xs truncate" style={{ color: 'var(--text)' }}>{currentUser?.name || 'David Patel'}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>{currentUser?.email || 'david.patel@evenmore.io'}</p>
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  to="/hrms/dashboard"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition"
                  style={{ color: 'var(--text)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--soft)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <User size={13} style={{ color: 'var(--muted)' }} />
                  <span>HR Profile & Attendance</span>
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition"
                  style={{ color: 'var(--text)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--soft)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <ShieldCheck size={13} style={{ color: 'var(--muted)' }} />
                  <span>Administration & Roles</span>
                </Link>
                <Link
                  to="/admin/company"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition"
                  style={{ color: 'var(--text)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--soft)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Building size={13} style={{ color: 'var(--muted)' }} />
                  <span>Company Legal Profile</span>
                </Link>
              </div>

              <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition font-medium cursor-pointer"
                  style={{ color: 'var(--danger)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--soft)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={13} />
                  <span>Switch Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
