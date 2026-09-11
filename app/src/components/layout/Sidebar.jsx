import { useEffect, useRef, useState, useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutGrid,
  Target,
  Users,
  Briefcase,
  ShoppingCart,
  Truck,
  Package,
  Layers,
  Landmark,
  UserCheck,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Infinity as InfinityIcon,
  Building2,
  FileText,
  FileSpreadsheet,
  Receipt,
  ArrowDownLeft,
  RotateCcw,
  Boxes,
  MapPin,
  ArrowLeftRight,
  Wrench,
  AlertTriangle,
  PieChart,
  CalendarCheck,
  ListChecks,
  ClipboardList,
  UserPlus,
  GraduationCap,
  TrendingUp,
  Shield,
  MessagesSquare,
  Send,
  User,
  ShieldCheck,
  Search,
  X,
  Sun,
  Moon,
  Sparkles,
  TreePine,
  BookOpen,
  Check,
  LogOut,
  Lock,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useERP } from '../../context/ERPContext';
import { UserGuideModal } from '../common/UserGuideModal';

const SIDEBAR_THEMES = [
  { id: 'light', name: 'Light', icon: Sun, color: '#1f6bff' },
  { id: 'dark', name: 'Dark', icon: Moon, color: '#3b82f6' },
  { id: 'midnight', name: 'Midnight', icon: Sparkles, color: '#818cf8' },
  { id: 'emerald', name: 'Emerald', icon: TreePine, color: '#10b981' },
];

// ── Navigation Structure ──────────────────────────────────────
const NAV = [
  {
    label: 'Dashboard',
    icon: Home,
    defaultOpen: false,
    children: [
      { label: 'Main Dashboard', icon: Home, to: '/dashboard' },
      { label: 'CRM Dashboard', icon: Home, to: '/crm/dashboard' },
    ],
  },

  {
    label: 'CRM',
    icon: LayoutGrid,
    defaultOpen: false,
    children: [
      {
        label: 'Leads',
        icon: Target,
        defaultOpen: true,
        children: [
          { label: 'Leads', to: '/crm/leads', dot: true },
          { label: 'Lead Create Form', to: '/crm/leads/forms' },
          { label: 'Lead Tasks Master', to: '/crm/leads/tasks-master' },
          { label: 'Lead Task Form', to: '/crm/leads/task-form' },
          { label: 'Lead Stage Tasks', to: '/crm/leads/stage-tasks' },
        ],
      },
      {
        label: 'Tasks',
        icon: ListChecks,
        defaultOpen: true,
        children: [
          { label: 'Tasks List', to: '/crm/tasks' },
          { label: 'Task Allocation', to: '/crm/tasks/allocation' },
        ],
      },
      { label: 'User Allocation & Tracking', icon: Users, to: '/crm/user-allocation' },
      { label: 'Deals', icon: TrendingUp, to: '/crm/deals' },
      { label: 'CRM System Setup', icon: Settings, to: '/crm/system-setup' },
    ],
  },

  {
    label: 'Sales',
    icon: BarChart3,
    children: [
      { label: 'Estimates', icon: FileText, to: '/sales/estimates' },
      { label: 'Quotations', icon: FileText, to: '/sales/quotations' },
      { label: 'Sales Orders', icon: ShoppingCart, to: '/sales/orders' },
      { label: 'Proforma Invoices', icon: FileSpreadsheet, to: '/sales/proforma' },
      { label: 'Sales Invoices', icon: Receipt, to: '/sales/invoices' },
      { label: 'Delivery Challans', icon: Send, to: '/sales/delivery' },
      { label: 'Sales Returns', icon: RotateCcw, to: '/sales/returns' },
      { label: 'Payment In', icon: ArrowDownLeft, to: '/sales/payments' },
    ],
  },

  {
    label: 'Purchase',
    icon: Truck,
    children: [
      { label: 'Purchase Orders', icon: ClipboardList, to: '/purchase/orders' },
      { label: 'Purchase Bills', icon: Receipt, to: '/purchase/bills' },
      { label: 'Purchase Returns', icon: RotateCcw, to: '/purchase/returns' },
      { label: 'Payment Out', icon: ArrowDownLeft, to: '/purchase/payments' },
      { label: 'Expenses', icon: Landmark, to: '/purchase/expenses' },
    ],
  },

  {
    label: 'Parties',
    icon: Building2,
    to: '/parties',
  },

  {
    label: 'Inventory',
    icon: Package,
    children: [
      {
        label: 'Items Master',
        icon: Boxes,
        defaultOpen: false,
        children: [
          { label: 'All Items', to: '/inventory/items', dot: true },
          { label: 'Machine Master', to: '/inventory/items/machines' },
          { label: 'Stock Inventory', to: '/inventory/items/stock' },
        ],
      },
      {
        label: 'Categories',
        icon: Layers,
        defaultOpen: false,
        children: [
          { label: 'All Categories', to: '/inventory/categories', dot: true },
          { label: 'Machine Categories', to: '/inventory/categories/machines' },
          { label: 'Stock Categories', to: '/inventory/categories/stock' },
        ],
      },
      { label: 'Stock Position', icon: BarChart3, to: '/inventory/stock-position' },
      { label: 'Transfers', icon: ArrowLeftRight, to: '/inventory/transfers' },
      { label: 'Locations', icon: MapPin, to: '/inventory/locations' },
      { label: 'Faulty Parts', icon: AlertTriangle, to: '/inventory/faulty-parts', badgeKey: 'faulty' },
      { label: 'Service Usage', icon: Wrench, to: '/inventory/service-usage' },
      { label: 'Zone Requests', icon: Send, to: '/inventory/zone-requests', badgeKey: 'zone' },
      { label: 'Valuation & Ageing', icon: TrendingUp, to: '/inventory/valuation' },
      { label: 'Month-End Audit', icon: CalendarCheck, to: '/inventory/audit' },
    ],
  },

  {
    label: 'Accounts',
    icon: Landmark,
    children: [
      { label: 'Cash / Bank', icon: Landmark, to: '/accounts/cash-bank' },
      { label: 'General Ledger', icon: FileText, to: '/accounts/general-ledger' },
      { label: 'Financial Reports', icon: PieChart, to: '/accounts/reports' },
    ],
  },

  {
    label: 'HRMS',
    icon: UserCheck,
    children: [
      { label: 'Dashboard', icon: Home, to: '/hrms/dashboard' },
      { label: 'Employees', icon: Users, to: '/hrms/employees' },
      {
        label: 'Attendance',
        icon: CalendarCheck,
        defaultOpen: false,
        children: [
          { label: 'Overview', to: '/hrms/attendance', dot: true },
          { label: 'Mark Attendance', to: '/hrms/attendance/mark' },
          { label: 'Individual', to: '/hrms/attendance/individual' },
          { label: 'Bulk', to: '/hrms/attendance/bulk' },
          { label: 'Requests', to: '/hrms/attendance/requests' },
          { label: 'Flexibility', to: '/hrms/attendance/flexibility' },
        ],
      },
      { label: 'Leave', icon: CalendarCheck, to: '/hrms/leave' },
      { label: 'Payroll', icon: Receipt, to: '/hrms/payroll' },
      {
        label: 'Recruitment',
        icon: UserPlus,
        defaultOpen: false,
        children: [
          { label: 'Dashboard', to: '/hrms/recruitment', dot: true },
          { label: 'Jobs', to: '/hrms/recruitment/jobs' },
          { label: 'Candidates', to: '/hrms/recruitment/candidates' },
          { label: 'Interviews', to: '/hrms/recruitment/interviews' },
          { label: 'Applications', to: '/hrms/recruitment/applications' },
          { label: 'Offers', to: '/hrms/recruitment/offers' },
          { label: 'Onboarding', to: '/hrms/recruitment/onboarding' },
          { label: 'Career', to: '/hrms/recruitment/career' },
          { label: 'Custom Questions', to: '/hrms/recruitment/questions' },
          { label: 'Funnel', to: '/hrms/recruitment/funnel' },
        ],
      },
      {
        label: 'Performance',
        icon: TrendingUp,
        defaultOpen: false,
        children: [
          { label: 'Dashboard', to: '/hrms/performance', dot: true },
          { label: 'Indicators', to: '/hrms/performance/indicators' },
          { label: 'KPI Data', to: '/hrms/performance/kpi-data' },
          { label: 'Appraisal', to: '/hrms/performance/appraisal' },
          { label: 'Goal Tracking', to: '/hrms/performance/goal-tracking' },
        ],
      },
      {
        label: 'Training',
        icon: GraduationCap,
        defaultOpen: false,
        children: [
          { label: 'Training List', to: '/hrms/training', dot: true },
          { label: 'Trainers', to: '/hrms/training/trainers' },
        ],
      },
      {
        label: 'Organization',
        icon: Building2,
        defaultOpen: false,
        children: [
          { label: 'Org Chart', to: '/hrms/org-chart', dot: true },
          { label: 'Departments', to: '/hrms/departments' },
          { label: 'Locations', to: '/hrms/locations' },
          { label: 'Designations', to: '/hrms/designations' },
        ],
      },
      { label: 'Assets', icon: Briefcase, to: '/hrms/assets' },
      { label: 'Documents', icon: FileText, to: '/hrms/documents' },
    ],
  },

  {
    label: 'Reports',
    icon: BarChart3,
    to: '/reports',
  },

  {
    label: 'Administration',
    icon: Shield,
    children: [
      { label: 'Users', icon: Users, to: '/administration/users' },
      { label: 'Roles', icon: Shield, to: '/administration/roles' },
      { label: 'Settings', icon: Settings, to: '/administration/settings' },
    ],
  },
];

// Flatten all defined navigation paths to compute accurate specificity
function collectNavPaths(items) {
  const paths = [];
  function walk(list) {
    for (const item of list) {
      if (item.to) paths.push(item.to);
      if (item.children) walk(item.children);
    }
  }
  walk(items);
  return paths;
}

const ALL_NAV_PATHS = collectNavPaths(NAV);

function isRouteActive(targetPath, currentPath) {
  if (!targetPath) return false;
  // 1. Exact match
  if (currentPath === targetPath) return true;

  // 2. Prefix match only if no other nav item matches currentPath more specifically
  if (currentPath.startsWith(targetPath + '/')) {
    // If an exact match exists in the navigation tree for currentPath, then prefix match is false
    const exactMatchExists = ALL_NAV_PATHS.some((p) => p === currentPath);
    if (exactMatchExists) return false;

    // Otherwise, check if this is the longest matching prefix
    const matchingPrefixes = ALL_NAV_PATHS.filter(
      (p) => currentPath === p || currentPath.startsWith(p + '/')
    );
    // Sort descending by path length
    matchingPrefixes.sort((a, b) => b.length - a.length);
    return matchingPrefixes[0] === targetPath;
  }

  return false;
}

// ── Filter navigation tree recursively by search query ──────
function filterNavTree(items, query) {
  if (!query || !query.trim()) return items;
  const q = query.toLowerCase().trim();

  function filterItem(item) {
    const labelMatch = item.label.toLowerCase().includes(q);

    if (item.children) {
      const filteredChildren = item.children
        .map(filterItem)
        .filter(Boolean);

      if (labelMatch || filteredChildren.length > 0) {
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : item.children,
          forceOpen: true,
        };
      }
      return null;
    }

    return labelMatch ? item : null;
  }

  return items.map(filterItem).filter(Boolean);
}

// ── Sub-item (leaf node) ────────────────────────────────────
function SubItem({ item, depth = 1, badges = {} }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const isExact = currentPath === item.to;
  const isFormBuilderAlias =
    item.label === 'Lead Create Form' &&
    (currentPath === '/crm/leads/forms' || currentPath === '/crm/leads/form-builder' || currentPath === '/crm/leads/create-form');
  const isPrefix = Boolean(item.to && currentPath.startsWith(item.to + '/'));
  const hasBetterMatch =
    isPrefix &&
    (isFormBuilderAlias ||
      ALL_NAV_PATHS.some(
        (p) =>
          p !== item.to &&
          (currentPath === p || (currentPath.startsWith(p + '/') && p.length > item.to.length))
      ) ||
      (item.to === '/crm/leads' &&
        (currentPath === '/crm/leads/forms' ||
          currentPath === '/crm/leads/form-builder' ||
          currentPath === '/crm/leads/create-form')));
  const isActive = isFormBuilderAlias || isExact || (isPrefix && !hasBetterMatch);
  const count = item.badgeKey ? (badges?.[item.badgeKey] ?? 0) : 0;
  const Icon = item.icon;

  // Icon leaves (e.g. CRM > Dashboard) render like nav row with icon
  if (Icon && item.to) {
    return (
      <NavLink
        to={item.to}
        title={item.label}
        className={() => `sub-group-row${isActive ? ' section-active' : ''}`}
      >
        <Icon size={16} strokeWidth={2} className="nav-ico" />
        <span className="nav-txt">{item.label}</span>
        {count > 0 && (
          <span className="ml-auto px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
            {count}
          </span>
        )}
      </NavLink>
    );
  }

  return (
    <NavLink
      to={item.to || '#'}
      end
      title={item.label}
      className={({ isActive: navActive }) =>
        `sub-item${isActive || navActive ? ' active' : ''}`
      }
    >
      <span className="sub-dot" />
      <span className="sub-label">{item.label}</span>
      {count > 0 && (
        <span className="ml-auto px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
          {count}
        </span>
      )}
    </NavLink>
  );
}

// ── Sub-list (group of sub-items) ───────────────────────────
function SubList({ items, depth = 1, badges }) {
  const isDeep = depth >= 2;
  return (
    <div className={isDeep ? 'sub-list-deep' : 'sub-list'}>
      {items.map((item) => {
        if (item.children) {
          return (
            <ExpandableRow key={item.label} item={item} depth={depth} badges={badges} />
          );
        }
        return <SubItem key={item.label} item={item} depth={depth} badges={badges} />;
      })}
    </div>
  );
}

// ── Expandable group row ────────────────────────────────────
function ExpandableRow({ item, depth = 0, badges = {} }) {
  const location = useLocation();
  const [open, setOpen] = useState(Boolean(item.defaultOpen));
  const Icon = item.icon;

  // Auto-open if a child route is active
  const isChildActive = item.children?.some(
    (c) => (c.to && (location.pathname === c.to || location.pathname.startsWith(c.to + '/'))) ||
      (c.children?.some((sub) => sub.to && (location.pathname === sub.to || location.pathname.startsWith(sub.to + '/'))))
  );

  useEffect(() => {
    if (isChildActive) {
      setOpen(true);
    }
  }, [isChildActive]);

  const isActive = item.to && (location.pathname === item.to || location.pathname.startsWith(item.to + '/'));

  if (item.to && !item.children) {
    // Simple root nav row (direct link like Parties, Reports)
    return (
      <NavLink
        to={item.to}
        end
        title={item.label}
        className={({ isActive: directActive }) =>
          `nav-row${directActive || isActive ? ' section-active' : ''}`
        }
      >
        {Icon && <Icon size={18} strokeWidth={1.9} className="nav-ico" />}
        <span className="nav-txt">{item.label}</span>
      </NavLink>
    );
  }

  const isRoot = depth === 0;

  return (
    <div className="nav-group">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={item.label}
        className={
          isRoot
            ? `nav-row${isChildActive ? ' parent-active' : isActive ? ' section-active' : ''}`
            : `sub-group-row${isChildActive ? ' parent-active' : ''}`
        }
      >
        {Icon && <Icon size={isRoot ? 18 : 16} strokeWidth={1.9} className="nav-ico" />}
        <span className="nav-txt">{item.label}</span>
        {item.children && (
          <span className="nav-chev">
            {open ? <ChevronDown size={isRoot ? 14 : 12} /> : <ChevronRight size={isRoot ? 14 : 12} />}
          </span>
        )}
      </button>
      {open && item.children && (
        <SubList items={item.children} depth={depth + 1} badges={badges} />
      )}
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────
export default function Sidebar() {
  const sidebarWidth = useAppStore((s) => s.sidebarWidth) ?? 280;
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const currentUser = useAppStore((s) => s.currentUser);
  const theme = useAppStore((s) => s.theme) || 'light';
  const setTheme = useAppStore((s) => s.setTheme);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, startWidth: sidebarWidth });

  const filteredNav = useMemo(() => filterNavTree(NAV, searchQuery), [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  let badges = { zone: 0, faulty: 0 };
  try {
    const erp = useERP();
    if (erp) {
      badges.zone = erp.zoneRequests?.filter((r) => r.status === 'Requested')?.length || 0;
      badges.faulty = erp.faultyParts?.filter((f) => f.status === 'Reported' || f.status === 'Sent for Replacement')?.length || 0;
    }
  } catch { }

  useEffect(() => {
    function handleMove(e) {
      if (!dragRef.current.dragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const nextWidth = Math.min(380, Math.max(240, dragRef.current.startWidth + dx));
      setSidebarWidth(nextWidth);
    }

    function handleUp() {
      dragRef.current.dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    }

    if (dragRef.current.dragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [setSidebarWidth]);

  function handleResizeStart(e) {
    e.preventDefault();
    dragRef.current = { dragging: true, startX: e.clientX, startWidth: sidebarWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function handleMove(ev) {
      const dx = ev.clientX - dragRef.current.startX;
      const nextWidth = Math.min(380, Math.max(240, dragRef.current.startWidth + dx));
      setSidebarWidth(nextWidth);
    }

    function handleUp() {
      dragRef.current.dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }

  return (
    <aside className="sidebar" style={{ width: sidebarWidth }}>
      <div className="side-top">
        {/* Brand Header */}
        <div className="brand-block">
          <div className="brand-left">
            <span className="brand-logo">
              <InfinityIcon size={28} strokeWidth={2.6} />
            </span>
            <div className="min-w-0">
              <div className="brand-name">EVENMORE INFOTECH</div>
              <div className="brand-tag">PEOPLE | PROCESS | PROGRESS</div>
            </div>
          </div>
        </div>

        {/* Search Bar Above Navigation */}
        <div className="px-1 pb-2.5 pt-0.5">
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl focus-within:border-blue-400/60 focus-within:bg-white/10 transition-all">
            <Search size={14} className="ml-2.5 text-slate-400 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tabs & menus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 py-2 pl-2 pr-7 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="side-nav" aria-label="Primary navigation">
          {filteredNav.length > 0 ? (
            filteredNav.map((item) => (
              <ExpandableRow key={item.label} item={item} depth={0} badges={badges} />
            ))
          ) : (
            <div className="px-3 py-6 text-center text-xs text-slate-400">
              <p>No tabs match &ldquo;{searchQuery}&rdquo;</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-blue-400 hover:underline text-[11px] cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Sticky Bottom User Profile Widget */}
      <div className="pt-2 px-1 pb-1 mt-auto border-t border-white/10 relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/20">
              {currentUser?.initials || 'AG'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {currentUser?.name || 'Adarsh Gupta'}
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                {currentUser?.role || 'Operations Admin'}
              </p>
            </div>
          </div>
          <ChevronDown
            size={14}
            className={`text-slate-400 group-hover:text-white transition-transform duration-150 ${isProfileOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Rich Theme-Adaptive Profile Popup Menu */}
        {isProfileOpen && (
          <div className="absolute bottom-full left-1 right-1 mb-2 p-3 rounded-2xl bg-[#0f172a]/95 border border-white/20 text-white shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xl ring-1 ring-black/40">
            {/* User Profile Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md ring-2 ring-white/20">
                {currentUser?.initials || 'AG'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold truncate text-white">{currentUser?.name || 'Adarsh Gupta'}</p>
                  <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate">{currentUser?.email || 'admin@evenmore.io'}</p>
                <div className="mt-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-blue-300 border border-white/10">
                    {currentUser?.role || 'Operations Admin'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Theme Switcher */}
            <div className="pb-2.5 mb-2.5 border-b border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Theme Mode</span>
                <span className="text-[9px] text-blue-400 capitalize">{theme}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {SIDEBAR_THEMES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer text-center ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                      }`}
                      title={t.name}
                    >
                      <Icon size={12} className="mb-0.5" />
                      <span className="text-[9px] leading-none">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="space-y-0.5 text-xs">
              <Link
                to="/hrms/dashboard"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition group"
              >
                <User size={13} className="text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium">HR Profile & Attendance</span>
              </Link>
              <Link
                to="/administration/users"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition group"
              >
                <ShieldCheck size={13} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium">Administration & Roles</span>
              </Link>
              <Link
                to="/administration/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition group"
              >
                <Settings size={13} className="text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium">System Preferences & Currency</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsGuideOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition text-left cursor-pointer group"
              >
                <BookOpen size={13} className="text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium">Interactive User Guides</span>
              </button>
            </div>

            {/* Footer / Session */}
            <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <span className="text-[9px] text-slate-400">Evenmore Cloud v2.6</span>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  alert('Session secured. Active demo user signed in.');
                }}
                className="hover:text-rose-400 flex items-center gap-1 cursor-pointer transition"
                title="Lock Session"
              >
                <Lock size={10} />
                <span>Lock</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Global User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Visual Drag Handle for Sidebar Width */}
      <div
        className="sidebar-resize-handle"
        onMouseDown={handleResizeStart}
        title="Drag to resize sidebar width"
      >
        <div className="resize-thumb" />
      </div>
    </aside>
  );
}
