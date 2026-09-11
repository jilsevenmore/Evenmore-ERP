import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Building,
  FilePlus,
  ShoppingCart,
  Receipt,
  UserPlus,
  Layers,
  Inbox,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useERP } from '../../context/ERPContext';

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
  const globalSearch = useAppStore((s) => s.globalSearch);
  const setGlobalSearch = useAppStore((s) => s.setGlobalSearch);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const theme = useAppStore((s) => s.theme) || 'light';
  const setTheme = useAppStore((s) => s.setTheme);

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const themeRef = useRef(null);
  const quickAddRef = useRef(null);
  const notifRef = useRef(null);

  // Live ERP data for notifications
  const erp = useERP();
  const items = erp?.items;
  const deliveryChallans = erp?.deliveryChallans;
  const zoneRequests = erp?.zoneRequests;
  const salesInvoices = erp?.salesInvoices;

  const lowStockItems = useMemo(() => {
    return (items || []).filter((i) => (i.availableQty ?? i.stock ?? 0) <= (i.reorderLevel || 5));
  }, [items]);

  const pendingZoneRequests = useMemo(() => {
    return (zoneRequests || []).filter((z) => (z.status || '').toLowerCase() === 'pending');
  }, [zoneRequests]);

  const inTransitChallans = useMemo(() => {
    return (deliveryChallans || []).filter((dc) => (dc.status || '').toLowerCase().includes('transit'));
  }, [deliveryChallans]);

  const overdueInvoices = useMemo(() => {
    return (salesInvoices || []).filter((inv) => (inv.status || '').toLowerCase() === 'overdue');
  }, [salesInvoices]);

  const dynamicNotifications = useMemo(() => {
    const list = [];
    if (lowStockItems.length > 0) {
      list.push({
        id: 'low-stock-alert',
        title: `Low Stock Alert (${lowStockItems.length} SKUs)`,
        desc: `${lowStockItems[0]?.name || 'Item'} and ${lowStockItems.length - 1} other items are below safety stock.`,
        time: 'Active',
        unread: true,
        path: '/inventory/items',
      });
    }
    if (pendingZoneRequests.length > 0) {
      list.push({
        id: 'zone-request-alert',
        title: `Pending Zone Requests (${pendingZoneRequests.length})`,
        desc: `Technician part requests awaiting warehouse dispatch approval.`,
        time: 'New',
        unread: true,
        path: '/inventory/zone-requests',
      });
    }
    if (inTransitChallans.length > 0) {
      list.push({
        id: 'transit-challan-alert',
        title: `In-Transit Deliveries (${inTransitChallans.length})`,
        desc: `Shipments currently out for customer delivery.`,
        time: 'In Route',
        unread: false,
        path: '/sales/delivery-challans',
      });
    }
    if (overdueInvoices.length > 0) {
      list.push({
        id: 'overdue-inv-alert',
        title: `Overdue Invoices (${overdueInvoices.length})`,
        desc: `Customer receivables overdue for payment collection.`,
        time: 'Urgent',
        unread: true,
        path: '/sales/invoices',
      });
    }
    return list.length > 0 ? list : NOTIFICATIONS;
  }, [lowStockItems, pendingZoneRequests, inTransitChallans, overdueInvoices]);

  const unreadCount = dynamicNotifications.filter((n) => n.unread).length;

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (themeRef.current && !themeRef.current.contains(event.target)) setIsThemeOpen(false);
      if (quickAddRef.current && !quickAddRef.current.contains(event.target)) setIsQuickAddOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
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
        <Search size={15} className="top-search-ico shrink-0 text-muted" />
        <input
          type="text"
          placeholder="Search records, contacts, deals... (Ctrl+K)"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          onClick={() => setCommandPaletteOpen(true)}
          readOnly
          className="w-full bg-transparent text-xs focus:outline-none cursor-pointer text-text"
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
            }}
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-soft text-text flex items-center gap-2 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Switch Visual Theme"
          >
            <ActiveThemeIcon size={15} style={{ color: activeThemeObj.color }} />
            <span className="hidden md:inline text-xs font-medium">{activeThemeObj.name}</span>
            <ChevronDown size={13} className="text-muted" />
          </button>

          {isThemeOpen && (
            <div className="top-dropdown-menu w-64 p-2 animate-in fade-in zoom-in-95 duration-150 shadow-xl">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
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
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer"
                      style={{
                        background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                        color: isSelected ? 'var(--primary)' : 'var(--text)',
                        fontWeight: isSelected ? 700 : 500,
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ background: t.color }}
                        >
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{t.name}</div>
                          <div className="text-[10px] text-muted">{t.desc}</div>
                        </div>
                      </div>
                      {isSelected && <Check size={14} className="text-primary shrink-0" />}
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
            }}
            className="h-9 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 text-xs font-bold shadow-xs transition cursor-pointer"
            aria-label="Quick Create Record"
            title="Create New Record"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">New</span>
          </button>

          {isQuickAddOpen && (
            <div className="top-dropdown-menu w-56 p-2 animate-in fade-in zoom-in-95 duration-150 shadow-xl">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
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
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-text hover:bg-soft"
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${action.color}`}>
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

        {/* Harmonized Icon Buttons Cluster */}
        <div className="flex items-center gap-1.5 pl-1">
          {/* Notifications Button & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsThemeOpen(false);
                setIsQuickAddOpen(false);
              }}
              className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-soft text-text flex items-center justify-center transition cursor-pointer relative shadow-2xs"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-card">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="top-dropdown-menu w-80 p-3 animate-in fade-in zoom-in-95 duration-150 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-bold text-xs text-text">Notifications</span>
                  <span className="text-[10px] font-semibold cursor-pointer hover:underline text-primary">
                    Mark all read
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto mt-1 space-y-1">
                  {dynamicNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.path) navigate(n.path);
                        setIsNotifOpen(false);
                      }}
                      className="py-2.5 px-2 rounded-xl transition cursor-pointer hover:bg-soft"
                      style={{ background: n.unread ? 'var(--soft)' : 'transparent' }}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-text">
                        <span>{n.title}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-card text-primary">{n.time}</span>
                      </div>
                      <p className="text-[11px] mt-0.5 leading-snug text-muted">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Calendar Shortcut */}
          <Link
            to="/hrms/attendance"
            className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-soft text-text hidden sm:flex items-center justify-center transition shadow-2xs"
            aria-label="Calendar & Schedule"
            title="Attendance & Schedule"
          >
            <CalendarDays size={16} />
          </Link>

          {/* Messages & Tasks Shortcut */}
          <Link
            to="/crm/tasks"
            className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-soft text-text hidden sm:flex items-center justify-center transition shadow-2xs"
            aria-label="Tasks & Activities"
            title="Tasks & Activities"
          >
            <Inbox size={16} />
          </Link>

          {/* Settings Shortcut */}
          <Link
            to="/administration/settings"
            className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-soft text-text hidden sm:flex items-center justify-center transition shadow-2xs"
            aria-label="System Settings"
            title="System Settings"
          >
            <Settings size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
