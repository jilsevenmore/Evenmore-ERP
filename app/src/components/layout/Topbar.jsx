import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  CheckCircle2,
  AlertTriangle,
  Building,
  FilePlus,
  ShoppingCart,
  Receipt,
  UserPlus,
  Layers,
  Inbox,
  Menu,
  Clock,
  ArrowRight,
  Loader2,
  Target,
  Package,
  FolderKanban,
  Users,
  Landmark,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { canOpenPath, canUse } from '../../utils/navAccess';
import { usePunchActions } from '../../features/hrms/attendance/usePunchActions';
import { useERP } from '../../context/ERPContext';
import { useCrmNotificationDigest } from '../../hooks/useCrmNotificationDigest';
import { useIdleReady } from '../../hooks/useIdleReady';
import { markEventNotificationRead, markAllNotificationsRead } from '../../services/crmEventNotifications';
import { EarlyPunchOutModal } from '../../features/hrms/attendance/components/EarlyPunchOutModal';

// The bell groups notifications by the module they come from, in this order.
const NOTIF_MODULES = [
  { id: 'crm', label: 'CRM', icon: Target, link: '/crm/tasks', chip: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-300' },
  { id: 'sales', label: 'Sales', icon: Receipt, chip: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300' },
  { id: 'purchase', label: 'Purchase', icon: ShoppingCart, chip: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-300' },
  { id: 'inventory', label: 'Inventory', icon: Package, chip: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-300' },
  { id: 'pms', label: 'Projects', icon: FolderKanban, chip: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-300' },
  { id: 'hrms', label: 'HRMS', icon: Users, chip: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300' },
  { id: 'accounts', label: 'Accounts', icon: Landmark, chip: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-300' },
  { id: 'system', label: 'System', icon: Bell, chip: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300' },
];
const NOTIF_MODULE_PATHS = [
  ['/crm', 'crm'], ['/sales', 'sales'], ['/purchase', 'purchase'], ['/inventory', 'inventory'],
  ['/pms', 'pms'], ['/hrms', 'hrms'], ['/organization', 'hrms'], ['/accounts', 'accounts'],
];

/** The module a notification belongs to: its link first, then the server's category. */
function notificationModule(n) {
  const path = String(n.path || '');
  const hit = NOTIF_MODULE_PATHS.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  if (hit) return hit[1];
  return NOTIF_MODULES.some((m) => m.id === n.category) ? n.category : 'system';
}

const THEMES = [
  { id: 'light', name: 'Enterprise Light', icon: Sun, desc: 'Clean high-contrast corporate palette', color: '#1f6bff' },
  { id: 'dark', name: 'Onyx Dark', icon: Moon, desc: 'Deep slate eye-comfort dark mode', color: '#3b82f6' },
  { id: 'midnight', name: 'Midnight Nebula', icon: Sparkles, desc: 'Indigo violet executive gradient', color: '#818cf8' },
  { id: 'emerald', name: 'Emerald Executive', icon: TreePine, desc: 'Fintech forest & gold prestige', color: '#10b981' },
];

const QUICK_ACTIONS = [
  // `permission` is the create right the target form needs; the page itself
  // must also be open to the role (navAccess.canOpenPath).
  { label: 'Create New Lead', path: '/crm/leads', permission: 'create_lead', icon: UserPlus, color: 'text-blue-500 bg-blue-50' },
  { label: 'Create Sales Order', path: '/sales/orders', permission: 'create_sales_order', icon: ShoppingCart, color: 'text-indigo-500 bg-indigo-50' },
  { label: 'Create Tax Invoice', path: '/sales/invoices', permission: 'create_invoice', icon: Receipt, color: 'text-emerald-500 bg-emerald-50' },
  { label: 'New Purchase Bill', path: '/purchase/bills', permission: 'create_bill', icon: FilePlus, color: 'text-amber-500 bg-amber-50' },
  { label: 'Register Trade Party', path: '/parties', permission: ['create_quotation', 'create_sales_order', 'create_invoice', 'create_purchase_order', 'create_bill'], icon: Building, color: 'text-purple-500 bg-purple-50' },
  { label: 'Add Inventory Item', path: '/inventory/items/new', permission: 'view_inventory', icon: Layers, color: 'text-rose-500 bg-rose-50' },
];

export default function Topbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const globalSearch = useAppStore((s) => s.globalSearch);
  const setGlobalSearch = useAppStore((s) => s.setGlobalSearch);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const mobileSidebarOpen = useAppStore((s) => s.mobileSidebarOpen);
  const toggleMobileSidebar = useAppStore((s) => s.toggleMobileSidebar);
  const theme = useAppStore((s) => s.theme) || 'light';
  const setTheme = useAppStore((s) => s.setTheme);

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPunchOpen, setIsPunchOpen] = useState(false);

  const themeRef = useRef(null);
  const quickAddRef = useRef(null);
  const notifRef = useRef(null);
  const punchRef = useRef(null);

  const currentUser = useAppStore((s) => s.currentUser);
  const isCustomer = Boolean(
    currentUser?.isCustomer ||
    currentUser?.role?.code === 'CU' ||
    String(currentUser?.role?.name || currentUser?.role || '').toLowerCase() === 'customer'
  );
  const grantedPermissions = useAppStore((s) => s.permissions);
  const quickActions = useMemo(() => {
    if (isCustomer) return [];
    const granted = grantedPermissions || [];
    return QUICK_ACTIONS.filter((a) => canUse(a.permission, granted) && canOpenPath(a.path, granted));
  }, [grantedPermissions, isCustomer]);
  const canOpenAttendance = canOpenPath('/hrms/attendance', grantedPermissions || []);
  // `.raw`: the punch button only needs today's status, which it fetches itself
  // below. Reading through the lazy hook would pull the whole attendance module
  // (team register, regularizations, flexibility) on every screen, for every
  // role — and 403 for anyone without team attendance access.
  // Shared with the Mark Attendance page, so both drive the same punch.
  const {
    todayPunch,
    fetchTodayPunch,
    tickPunch,
    submitting: punchSubmitting,
    error: punchError,
    doPunchIn: handlePunchIn,
    doPunchOut: handlePunchOut,
    executePunchOut,
    earlyModalOpen: isEarlyPunchModalOpen,
    setEarlyModalOpen: setIsEarlyPunchModalOpen,
  } = usePunchActions();

  // Load today's punch status once per signed-in user (employees only)
  const currentUserId = currentUser?.id;
  useEffect(() => {
    if (isCustomer || !currentUserId) return;
    fetchTodayPunch();
  }, [fetchTodayPunch, isCustomer, currentUserId]);

  // Live timer for active punch session
  useEffect(() => {
    if (isCustomer || !todayPunch?.isPunchedIn) return;
    const interval = setInterval(() => {
      tickPunch();
    }, 1000);
    return () => clearInterval(interval);
  }, [todayPunch?.isPunchedIn, tickPunch, isCustomer]);

  // Live ERP data for notifications.
  //
  // Reading a collection is what pulls it (`ERPContext`), and these four belong
  // to the shell rather than to any one screen — so the alert list waits for an
  // idle moment and the page the user opened gets the network first.
  const erp = useERP();
  const crmDigest = useCrmNotificationDigest();
  const alertsReady = useIdleReady();
  const hasInventory = canOpenPath('/inventory/items', grantedPermissions);
  const hasSales = canOpenPath('/sales/invoices', grantedPermissions);
  const items = (!isCustomer && hasInventory && alertsReady) ? erp?.items : undefined;
  const deliveryChallans = (!isCustomer && hasSales && alertsReady) ? erp?.deliveryChallans : undefined;
  // const zoneRequests = alertsReady ? erp?.zoneRequests : undefined; // Hidden: Zone Requests out of scope
  const zoneRequests = undefined;
  const salesInvoices = (!isCustomer && hasSales && alertsReady) ? erp?.invoices : undefined;
  const isCrmRoute = pathname === '/crm' || pathname.startsWith('/crm/');

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

  const erpNotifications = useMemo(() => {
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
    // Hidden: Zone Requests out of scope
    // if (pendingZoneRequests.length > 0) {
    //   list.push({
    //     id: 'zone-request-alert',
    //     title: `Pending Zone Requests (${pendingZoneRequests.length})`,
    //     desc: `Technician part requests awaiting warehouse dispatch approval.`,
    //     time: 'New',
    //     unread: true,
    //     path: '/inventory/zone-requests',
    //   });
    // }
    if (inTransitChallans.length > 0) {
      list.push({
        id: 'transit-challan-alert',
        title: `In-Transit Deliveries (${inTransitChallans.length})`,
        desc: `Shipments currently out for customer delivery.`,
        time: 'In Route',
        unread: false,
        path: '/sales/delivery',
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
    return list.filter((n) => canOpenPath(n.path, grantedPermissions || []));
  }, [lowStockItems, /* pendingZoneRequests, */ inTransitChallans, overdueInvoices, grantedPermissions]);

  // Bell: one list, every notification tagged with its module.
  const [notifModule, setNotifModule] = useState('all');
  const [expandedModules, setExpandedModules] = useState({});
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);
  const moduleMenuRef = useRef(null);

  const moduleNotifs = useMemo(() => {
    const rows = [
      ...erpNotifications,
      ...(crmDigest.reminders || []),
      // The in-transit challan alert is already among the Sales alerts.
      ...(crmDigest.notifications || []).filter((n) => n.bucket !== 'challan'),
    ];
    return rows.map((n) => ({ ...n, module: notificationModule(n) }));
  }, [erpNotifications, crmDigest]);

  const moduleGroups = useMemo(
    () => NOTIF_MODULES
      .map((m) => ({ ...m, items: moduleNotifs.filter((n) => n.module === m.id) }))
      .filter((group) => group.items.length > 0),
    [moduleNotifs]
  );

  const totalUnreadCount = moduleNotifs.filter((n) => n.unread).length;
  const totalNotifCount = moduleNotifs.length;
  const hasUnreadEvents = moduleNotifs.some((n) => n.eventId && n.unread);
  const activeModule = notifModule;
  const visibleGroups = activeModule === 'all' ? moduleGroups : moduleGroups.filter((g) => g.id === activeModule);

  const openNotification = (n) => {
    if (n.eventId) markEventNotificationRead(n.eventId);
    if (n.path) navigate(n.path);
    setIsNotifOpen(false);
  };

  const storeShowToast = useAppStore((s) => s.showToast || s.setToast);
  const showToast = erp?.showToast || storeShowToast;

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (themeRef.current && !themeRef.current.contains(event.target)) setIsThemeOpen(false);
      if (quickAddRef.current && !quickAddRef.current.contains(event.target)) setIsQuickAddOpen(false);
      if (punchRef.current && !punchRef.current.contains(event.target)) setIsPunchOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(event.target)) setIsModuleMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];
  const ActiveThemeIcon = activeThemeObj.icon;

  return (
    <header className="topbar">
      {/* Mobile / tablet navigation toggle (below lg only) */}
      <button
        type="button"
        onClick={toggleMobileSidebar}
        className="topbar-hamburger"
        aria-label={mobileSidebarOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileSidebarOpen}
        title="Menu"
      >
        <Menu size={18} />
      </button>

      {/* Compact search trigger (phones only) — opens the Command Palette */}
      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="top-search-compact"
        aria-label="Search (Ctrl+K)"
        title="Search"
      >
        <Search size={16} />
      </button>

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
      <div className="top-actions flex items-center gap-2 shrink-0">
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

        {/* Quick Add Menu — only the create actions this role can use */}
        {quickActions.length > 0 && (
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
                {quickActions.map((action, idx) => {
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
        )}

        {/* Harmonized Icon Buttons Cluster */}
        <div className="flex items-center gap-1.5 pl-1">
          {/* Unified Notifications Button & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsThemeOpen(false);
                setIsQuickAddOpen(false);
              }}
              className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-soft text-text flex items-center justify-center transition cursor-pointer relative shadow-2xs"
              aria-label="Notifications & Reminders"
              title="Notifications & Reminders"
            >
              <Bell size={16} />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-card">
                  {totalUnreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="top-dropdown-menu w-84 sm:w-96 p-3 animate-in fade-in zoom-in-95 duration-150 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-text">Notifications</span>
                    {totalUnreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {totalUnreadCount} unread
                      </span>
                    )}
                  </div>
                  {hasUnreadEvents && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead()}
                      className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Module selector */}
                {(() => {
                  const options = [
                    { id: 'all', label: 'All Modules', count: totalNotifCount, icon: Bell },
                    ...NOTIF_MODULES.map((m) => ({
                      id: m.id,
                      label: m.label,
                      count: moduleNotifs.filter((n) => n.module === m.id).length,
                      icon: m.icon,
                    })),
                  ];
                  const current = options.find((o) => o.id === activeModule) || options[0];
                  const CurrentIcon = current.icon;
                  return (
                    <div className="relative mt-2 mb-2.5" ref={moduleMenuRef}>
                      <button
                        type="button"
                        onClick={() => setIsModuleMenuOpen(!isModuleMenuOpen)}
                        className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-soft border border-border text-[11px] font-semibold text-text hover:bg-card transition cursor-pointer shadow-2xs"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <CurrentIcon size={13} className="text-primary shrink-0" />
                          <span className="font-bold truncate">{current.label}</span>
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-card border border-border text-primary">
                            {current.count}
                          </span>
                          <ChevronDown size={13} className={`text-muted transition-transform duration-150 ${isModuleMenuOpen ? 'rotate-180 text-primary' : ''}`} />
                        </span>
                      </button>

                      {isModuleMenuOpen && (
                        <div className="absolute top-full right-0 left-0 mt-1 p-1 rounded-xl bg-card border border-border shadow-xl z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-muted">
                            Notification Modules
                          </div>
                          {options.map((option) => {
                            const OptionIcon = option.icon;
                            const selected = activeModule === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  setNotifModule(option.id);
                                  setIsModuleMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition cursor-pointer ${
                                  selected
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : option.count === 0
                                      ? 'text-muted hover:bg-soft font-medium'
                                      : 'text-text hover:bg-soft font-medium'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <OptionIcon size={12} className={selected ? 'text-primary' : 'text-muted'} />
                                  <span className="truncate">{option.label}</span>
                                </span>
                                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  selected ? 'bg-primary text-white border-primary' : 'bg-soft border-border text-muted'
                                }`}>
                                  {option.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* CRM task summary */}
                {activeModule === 'crm' && (crmDigest.reminders?.length || 0) > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-2 py-1.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-rose-500">Overdue</p>
                      <p className="mt-0.5 text-xs font-extrabold text-rose-600 dark:text-rose-400">{crmDigest.counts?.overdue || 0}</p>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500">Today</p>
                      <p className="mt-0.5 text-xs font-extrabold text-amber-600 dark:text-amber-400">{crmDigest.counts?.today || 0}</p>
                    </div>
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-2 py-1.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-blue-500">All Tasks</p>
                      <p className="mt-0.5 text-xs font-extrabold text-blue-600 dark:text-blue-400">{crmDigest.reminders.length}</p>
                    </div>
                  </div>
                )}

                {/* Notifications, grouped by module */}
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {visibleGroups.map((group) => {
                    const ModuleIcon = group.icon;
                    const limit = activeModule === 'all' && !expandedModules[group.id] ? 3 : group.items.length;
                    return (
                      <div key={group.id}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                            <ModuleIcon size={11} />
                            {group.label}
                            <span className="text-primary">{group.items.length}</span>
                          </span>
                          {group.link && (
                            <Link
                              to={group.link}
                              onClick={() => setIsNotifOpen(false)}
                              className="text-[10px] font-bold text-primary hover:underline"
                            >
                              Open &rarr;
                            </Link>
                          )}
                        </div>
                        <div className="space-y-1">
                          {group.items.slice(0, limit).map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => openNotification(n)}
                              className={`w-full text-left flex gap-2.5 p-2.5 rounded-xl border transition cursor-pointer hover:bg-soft ${
                                n.tone === 'overdue'
                                  ? 'border-rose-500/25 bg-rose-500/5'
                                  : n.tone === 'today'
                                    ? 'border-amber-500/25 bg-amber-500/5'
                                    : n.unread ? 'border-border bg-soft' : 'border-border bg-card'
                              }`}
                            >
                              <span className={`mt-0.5 w-7 h-7 shrink-0 rounded-lg border flex items-center justify-center ${group.chip}`}>
                                <ModuleIcon size={13} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className="truncate text-[11.5px] font-semibold text-text">{n.title}</span>
                                  <span className="shrink-0 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-card border border-border text-muted">
                                    {n.time}
                                  </span>
                                </span>
                                <span className="block mt-0.5 text-[10.5px] leading-snug text-muted line-clamp-2">
                                  {n.subtitle ? `${n.subtitle} • ` : ''}{n.desc}
                                </span>
                              </span>
                              {n.unread && <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                            </button>
                          ))}
                        </div>
                        {group.items.length > limit && (
                          <button
                            type="button"
                            onClick={() => setExpandedModules((prev) => ({ ...prev, [group.id]: true }))}
                            className="w-full py-1 text-[10px] font-semibold text-primary hover:underline text-center cursor-pointer"
                          >
                            Show all {group.items.length} {group.label} notifications
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {visibleGroups.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted">
                      {activeModule === 'all'
                        ? 'All caught up! No notifications right now.'
                        : `No ${NOTIF_MODULES.find((m) => m.id === activeModule)?.label || ''} notifications right now.`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Punch In / Out Primary Control & Popover (employees only) */}
          {!isCustomer && (
          <div className="relative" ref={punchRef}>
            {todayPunch?.isPunchedIn ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPunchOpen(!isPunchOpen)}
                  className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold shadow-2xs transition cursor-pointer"
                  title="View Today's Punches"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="whitespace-nowrap">
                    Punched In • {todayPunch.firstPunch || todayPunch.punches?.[todayPunch.punches.length - 1]?.timeDisplay || 'Active'}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-150 opacity-70 ${isPunchOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {/* Punch Out lives in the popover below. */}
              </div>
            ) : (todayPunch?.dayCompleted || todayPunch?.punches?.length > 0) ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPunchOpen(!isPunchOpen)}
                  className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-text flex items-center gap-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer"
                  title="Today's attendance completed (1 Punch In, 1 Punch Out)"
                >
                  <CheckCircle2 size={14} className="text-emerald-600 font-bold shrink-0" />
                  <span className="whitespace-nowrap">
                    Day Completed • {todayPunch.lastPunch || todayPunch.punches?.[todayPunch.punches.length - 1]?.timeDisplay}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-muted transition-transform duration-150 ${isPunchOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePunchIn}
                disabled={punchSubmitting}
                className="h-9 px-3 rounded-xl border border-primary/40 bg-card hover:bg-primary/5 text-primary flex items-center gap-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
                title="Punch In Today"
              >
                {punchSubmitting ? <Loader2 size={14} className="animate-spin text-primary" /> : <Clock size={15} className="text-primary" />}
                <span className="whitespace-nowrap">Punch In</span>
              </button>
            )}

            {/* Attendance Popover Dropdown */}
            {isPunchOpen && (
              <div className="top-dropdown-menu w-72 sm:w-80 p-3.5 animate-in fade-in zoom-in-95 duration-150 shadow-xl border border-border bg-card rounded-2xl z-50">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-text">
                      {todayPunch?.employee?.name || "Today's Attendance"}
                    </h4>
                    <p className="text-[10px] text-muted">
                      {todayPunch?.employee?.employeeCode
                        ? `${todayPunch.employee.employeeCode} • ${todayPunch.employee.department || 'General'}`
                        : 'Realtime HRMS attendance tracking'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      todayPunch?.isPunchedIn
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : todayPunch?.punches?.length > 0
                        ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                        : 'bg-muted/10 text-muted border border-border'
                    }`}
                  >
                    {todayPunch?.status || 'Not Punched In'}
                  </span>
                </div>

                {todayPunch?.hasEmployee === false && (
                  <div className="mb-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] leading-tight flex items-start gap-1.5">
                    <span>ℹ️</span>
                    <span>No employee profile linked to this user account. Link your profile in HRMS Employees.</span>
                  </div>
                )}

                {punchError && (
                  <div className="mb-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[11px] leading-tight flex items-start gap-1.5">
                    <span>⚠️</span>
                    <span>{punchError}</span>
                  </div>
                )}

                {/* Metrics Summary */}
                <div className="space-y-1.5 text-xs mb-3 bg-soft/50 p-2.5 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted text-[11px]">Status</span>
                    <span className="font-semibold text-text">{todayPunch?.status}</span>
                  </div>
                  {todayPunch?.firstPunch && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted text-[11px]">First Punch In</span>
                      <span className="font-semibold text-text">{todayPunch.firstPunch}</span>
                    </div>
                  )}
                  {todayPunch?.lastPunch && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted text-[11px]">Last Punch</span>
                      <span className="font-semibold text-text">{todayPunch.lastPunch}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted text-[11px]">Working Time</span>
                    <span className="font-mono font-bold text-primary">{todayPunch?.formattedWorkingTime || '00h 00m'}</span>
                  </div>
                  {todayPunch?.lateMinutes > 0 && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted text-[11px]">Late</span>
                      <span className="font-semibold text-amber-600">{todayPunch.lateMinutes} min late</span>
                    </div>
                  )}
                  {todayPunch?.earlyLeavingMinutes > 0 && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted text-[11px]">Early Leaving</span>
                      <span className="font-semibold text-rose-500">{todayPunch.earlyLeavingMinutes} min early</span>
                    </div>
                  )}
                  {todayPunch?.hasPendingRegularization && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted text-[11px]">Regularization</span>
                      <span className="font-semibold text-primary">Pending Review</span>
                    </div>
                  )}
                  {todayPunch?.overtimeHours > 0 && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-muted text-[11px]">Overtime</span>
                      <span className="font-semibold text-emerald-600">+{todayPunch.overtimeHours}h</span>
                    </div>
                  )}
                </div>

                {/* Multiple Punches Timeline */}
                {todayPunch?.punches?.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center justify-between">
                      <span>Today's Punches</span>
                      <span className="font-normal font-mono text-[10px] text-muted">
                        {todayPunch.punches.length} {todayPunch.punches.length === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                      {todayPunch.punches.map((p, idx) => (
                        <div key={p.id || idx} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-card border border-border/40">
                          <span className="font-mono text-muted text-[11px]">{p.timeDisplay || p.punchTime?.slice(11, 16)}</span>
                          <span className="text-muted/40">→</span>
                          <span className={`font-semibold ${p.punchType === 'IN' ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {p.punchType === 'IN' ? 'Punch In' : 'Punch Out'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-1.5 border-t border-border text-[11px] font-semibold text-text">
                      <span>Total Working Time:</span>
                      <span className="font-mono font-bold text-primary">{todayPunch?.formattedWorkingTime || '00h 00m'}</span>
                    </div>
                  </div>
                )}

                {/* Primary Action in Popover */}
                <div className="pt-1">
                  {todayPunch?.isPunchedIn ? (
                    <button
                      type="button"
                      onClick={() => {
                        handlePunchOut();
                      }}
                      disabled={punchSubmitting}
                      className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {punchSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
                      <span>Punch Out</span>
                    </button>
                  ) : (todayPunch?.dayCompleted || todayPunch?.punches?.length > 0) ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-soft border border-border/70 text-muted font-semibold text-xs flex items-center justify-center gap-1.5 text-center">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>Day Completed (1 Punch In/Out per day)</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handlePunchIn();
                      }}
                      disabled={punchSubmitting}
                      className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {punchSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />}
                      <span>Punch In</span>
                    </button>
                  )}
                </div>

                {/* Link to Attendance Overview */}
                {canOpenAttendance && (
                  <div className="mt-2.5 pt-2 border-t border-border flex justify-end">
                    <Link
                      to="/hrms/attendance"
                      onClick={() => setIsPunchOpen(false)}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>View Attendance →</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Each shortcut shows only to a role that can open its page. */}
          {!isCustomer && (
            <>
              {/* Calendar Shortcut */}
              {canOpenAttendance && (
                <Link
                  to="/hrms/attendance"
                  className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-soft text-text hidden sm:flex items-center justify-center transition shadow-2xs"
                  aria-label="Calendar & Schedule"
                  title="Attendance & Schedule"
                >
                  <CalendarDays size={16} />
                </Link>
              )}

              {/* Messages & Tasks Shortcut */}
              {canOpenPath('/crm/tasks', grantedPermissions) && (
                <Link
                  to="/crm/tasks"
                  className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-soft text-text hidden sm:flex items-center justify-center transition shadow-2xs"
                  aria-label="Tasks & Activities"
                  title="Tasks & Activities"
                >
                  <Inbox size={16} />
                </Link>
              )}

              {/* Settings Shortcut */}
              {canOpenPath('/administration/settings', grantedPermissions) && (
                <Link
                  to="/administration/settings"
                  className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-soft text-text hidden sm:flex items-center justify-center transition shadow-2xs"
                  aria-label="System Settings"
                  title="System Settings"
                >
                  <Settings size={16} />
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Early Punch Out Confirmation Modal */}
      {!isCustomer && (
        <EarlyPunchOutModal
          isOpen={isEarlyPunchModalOpen}
          onClose={() => setIsEarlyPunchModalOpen(false)}
          onConfirm={executePunchOut}
          todayPunch={todayPunch}
          isSubmitting={punchSubmitting}
        />
      )}
    </header>
  );
}
