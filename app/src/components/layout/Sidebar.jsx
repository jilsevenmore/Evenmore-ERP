import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Headphones,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

// ── Navigation Structure ──────────────────────────────────────
const NAV = [
  { label: 'Dashboard', icon: Home, to: '/dashboard' },

  {
    label: 'CRM',
    icon: LayoutGrid,
    defaultOpen: true,
    children: [
      {
        label: 'Leads',
        icon: Target,
        defaultOpen: true,
        children: [
          { label: 'All Leads', to: '/crm/leads', dot: true },
          { label: 'Lead Form Builder', to: '/crm/leads/form-builder' },
          { label: 'Lead Create Form', to: '/crm/leads/create-form' },
        ],
      },
      { label: 'Customers', icon: Users, to: '/crm/customers' },
      { label: 'Tasks', icon: ListChecks, to: '/crm/tasks' },
      { label: 'Quotations', icon: ClipboardList, to: '/crm/quotations' },
    ],
  },

  {
    label: 'Sales',
    icon: BarChart3,
    children: [
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
    label: 'Inventory',
    icon: Package,
    children: [
      { label: 'Items', icon: Boxes, to: '/inventory/items' },
      { label: 'Categories', icon: Layers, to: '/inventory/categories' },
      { label: 'Stock Position', icon: BarChart3, to: '/inventory/stock' },
      { label: 'Transfers', icon: ArrowLeftRight, to: '/inventory/transfers' },
      { label: 'Locations', icon: MapPin, to: '/inventory/locations' },
      { label: 'Faulty Parts', icon: AlertTriangle, to: '/inventory/faulty-parts' },
      { label: 'Service Usage', icon: Wrench, to: '/inventory/service-usage' },
      { label: 'Zone Requests', icon: Send, to: '/inventory/zone-requests' },
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
        ],
      },
      { label: 'Leave', icon: CalendarCheck, to: '/hrms/leave' },
      { label: 'Payroll', icon: Receipt, to: '/hrms/payroll' },
      { label: 'Recruitment', icon: UserPlus, to: '/hrms/recruitment' },
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

// ── Sub-item (leaf node) ────────────────────────────────────
function SubItem({ item }) {
  const location = useLocation();
  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');

  return (
    <NavLink
      to={item.to || '#'}
      className={`sub-item${isActive ? ' active' : ''}`}
    >
      {item.dot && <span className="sub-dot" />}
      <span className="sub-label">{item.label}</span>
    </NavLink>
  );
}

// ── Sub-list (group of sub-items) ───────────────────────────
function SubList({ items, depth }) {
  return (
    <div className="sub-list" style={{ marginLeft: depth === 1 ? 22 : 18 }}>
      {items.map((item) => {
        if (item.children) {
          return (
            <ExpandableRow key={item.label} item={item} depth={depth} />
          );
        }
        return <SubItem key={item.label} item={item} />;
      })}
    </div>
  );
}

// ── Expandable group row ────────────────────────────────────
function ExpandableRow({ item, depth = 0 }) {
  const location = useLocation();
  const [open, setOpen] = useState(item.defaultOpen ?? (depth === 0));
  const Icon = item.icon;

  // Auto-open if a child route is active
  const isChildActive = item.children?.some(
    (c) => c.to && (location.pathname === c.to || location.pathname.startsWith(c.to + '/'))
  );

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
        onClick={() => setOpen((v) => !v)}
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
        <SubList items={item.children} depth={depth + 1} />
      )}
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────
export default function Sidebar() {
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const dragRef = useRef({ dragging: false, startX: 0, startWidth: sidebarWidth });

  useEffect(() => {
    function handleMove(e) {
      if (!dragRef.current.dragging) return;
      setSidebarWidth(dragRef.current.startWidth + (e.clientX - dragRef.current.startX));
    }
    function handleUp() {
      dragRef.current.dragging = false;
      document.body.classList.remove('is-resizing');
    }
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      document.body.classList.remove('is-resizing');
    };
  }, [setSidebarWidth]);

  function handleResizeStart(e) {
    dragRef.current = { dragging: true, startX: e.clientX, startWidth: sidebarWidth };
    document.body.classList.add('is-resizing');
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
            <ExpandableRow key={item.label} item={item} depth={0} />
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="side-footer">
        <div className="footer-link">Work Smarter Together</div>
        <div className="footer-copy">© 2026 Evenmore Infotech</div>
      </div>

      {/* Resize handle */}
      <button
        type="button"
        className="sidebar-resize-handle"
        aria-label="Resize sidebar"
        onMouseDown={handleResizeStart}
      >
        <span className="resize-thumb" />
      </button>
    </aside>
  );
}
