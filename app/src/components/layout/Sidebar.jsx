import { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useERP } from '../../context/ERPContext';

// ── Navigation Structure ──────────────────────────────────────
const NAV = [
  {
    label: 'Dashboard',
    icon: Home,
    defaultOpen: false,
    children: [
      { label: 'Main Dashboard', icon: Home, to: '/dashboard' },
    ],
  },

  {
    label: 'CRM',
    icon: LayoutGrid,
    defaultOpen: false,
    children: [
      { label: 'CRM Dashboard', icon: Home, to: '/crm/dashboard' },
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
      { label: 'User Tracking', icon: Users, to: '/crm/user-allocation' },
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
      { label: 'Vendors', icon: Building2, to: '/purchase/vendors' },
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

function getAllNavPaths(navItems) {
  const paths = [];
  function recurse(items) {
    for (const item of items) {
      if (item.to) paths.push(item.to);
      if (item.children) recurse(item.children);
    }
  }
  recurse(navItems);
  return paths;
}

const ALL_NAV_PATHS = getAllNavPaths(NAV);

// ── Sub-item (leaf node) ────────────────────────────────────
function SubItem({ item, badges = {} }) {
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

  // Icon leaves (e.g. CRM > Dashboard) render like screenshot: nav-row pill with icon
  if (Icon && item.to) {
    return (
      <NavLink
        to={item.to}
        className={() => `nav-row${isActive ? ' section-active' : ''}`}
      >
        <Icon size={17} strokeWidth={1.9} className="nav-ico" />
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
      className={() => `sub-item${isActive ? ' active' : ''}`}
    >
      {item.dot && <span className="sub-dot" />}
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
function SubList({ items, depth, badges }) {
  return (
    <div className="sub-list" style={{ marginLeft: depth === 1 ? 22 : 18 }}>
      {items.map((item) => {
        if (item.children) {
          return (
            <ExpandableRow key={item.label} item={item} depth={depth} badges={badges} />
          );
        }
        return <SubItem key={item.label} item={item} badges={badges} />;
      })}
    </div>
  );
}

// ── Expandable group row ────────────────────────────────────
function ExpandableRow({ item, depth = 0, badges = {} }) {
  const location = useLocation();
  const [open, setOpen] = useState(Boolean(item.defaultOpen));
  const Icon = item.icon;

  function handleClick() {
    setOpen((v) => !v);
  }

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
    // Simple nav row (direct link)
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) => `nav-row${isActive ? ' section-active' : ''}`}
      >
        {Icon && <Icon size={17} strokeWidth={1.9} className="nav-ico" />}
        <span className="nav-txt">{item.label}</span>
      </NavLink>
    );
  }

  return (
    <div className="nav-group">
      <button
        type="button"
        onClick={handleClick}
        className={`nav-row${isChildActive || isActive ? ' section-active' : ''}`}
      >
        {Icon && <Icon size={17} strokeWidth={1.9} className="nav-ico" />}
        <span className="nav-txt">{item.label}</span>
        {item.children && (
          <span className="nav-chev">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const currentUser = useAppStore((s) => s.currentUser);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, startWidth: sidebarWidth });

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
      const nextWidth = Math.min(360, Math.max(220, dragRef.current.startWidth + dx));
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
      const nextWidth = Math.min(360, Math.max(220, dragRef.current.startWidth + dx));
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
        {/* Brand */}
        <div className="brand-block">
          <div className="brand-left">
            <span className="brand-logo">
              <InfinityIcon size={30} strokeWidth={2.6} />
            </span>
            <div>
              <div className="brand-name">EVENMORE INFOTECH</div>
              <div className="brand-tag">PEOPLE | PROCESS | PROGRESS</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="side-nav" aria-label="Primary navigation">
          {NAV.map((item) => (
            <ExpandableRow key={item.label} item={item} depth={0} badges={badges} />
          ))}
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

        {/* Profile Popup Menu */}
        {isProfileOpen && (
          <div className="absolute bottom-full left-1 right-1 mb-2 p-2 rounded-2xl bg-[#0b1222] border border-white/15 text-white shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md">
            <div className="p-2 border-b border-white/10 mb-1">
              <p className="text-xs font-bold truncate">{currentUser?.name || 'Adarsh Gupta'}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'admin@evenmore.io'}</p>
            </div>
            <div className="space-y-0.5 text-xs">
              <Link
                to="/hrms/dashboard"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition"
              >
                <User size={13} className="text-blue-400" />
                <span>HR Profile & Attendance</span>
              </Link>
              <Link
                to="/administration/users"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition"
              >
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Administration & Roles</span>
              </Link>
              <Link
                to="/administration/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition"
              >
                <Settings size={13} className="text-purple-400" />
                <span>System Preferences</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer
      <div className="side-footer">
        <div className="footer-link">Work Smarter Together</div>
        <div className="footer-copy">© 2026 Evenmore Infotech</div>
      </div>

      {/* Resize handle */}
      {/* <button
        type="button"
        className="sidebar-resize-handle"
        aria-label="Resize sidebar"
        onMouseDown={handleResizeStart}
      >
        <span className="resize-thumb" />
      </button> */}
    </aside>
  );
}
