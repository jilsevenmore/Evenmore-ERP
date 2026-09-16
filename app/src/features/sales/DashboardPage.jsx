import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { Link } from 'react-router-dom';
import { useERP } from '../../context/ERPContext';
import { dashboardData } from '../../data/crm/dashboardData';
import { leads } from '../../data/crm/mockLeads';
import {
  Target,
  TrendingUp,
  ListChecks,
  FileText,
  ShoppingCart,
  Receipt,
  Send,
  Truck,
  ClipboardList,
  Landmark,
  Package,
  Boxes,
  ArrowLeftRight,
  MapPin,
  Building2,
  Users,
  Wallet,
  PieChart,
  UserCheck,
  BarChart3,
  Shield,
  Settings,
  ArrowRight,
  BriefcaseBusiness,
  UserPlus,
  CheckSquare,
  UserRoundPlus,
  TrendingDown,
  Plus,
} from 'lucide-react';

function buildChart(values, width, height, padding) {
  const max = Math.max(...values);
  const min = 0;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const points = values.map((value, index) => {
    const x = padding + (index * innerWidth) / (values.length - 1);
    const normalized = (value - min) / (max - min || 1);
    const y = height - padding - normalized * innerHeight;
    return { x, y, value };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  return { points, linePath, areaPath, max };
}

function polarToCartesian(cx, cy, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

const ICONS = { users: Users, building: Building2, check: CheckSquare, bars: BarChart3 };
const ACTIVITY_ICONS = { lead: UserPlus, deal: BriefcaseBusiness, task: CheckSquare, team: UserRoundPlus };

const CARD_STYLES = {
  blue: { bg: 'linear-gradient(180deg, rgba(31,107,255,0.12) 0%, rgba(31,107,255,0.04) 100%)', fg: '#1f6bff' },
  green: { bg: 'linear-gradient(180deg, rgba(27,184,120,0.12) 0%, rgba(27,184,120,0.04) 100%)', fg: '#1bb878' },
  pink: { bg: 'linear-gradient(180deg, rgba(255,79,143,0.12) 0%, rgba(255,79,143,0.04) 100%)', fg: '#ff4f8f' },
  amber: { bg: 'linear-gradient(180deg, rgba(239,155,6,0.12) 0%, rgba(239,155,6,0.04) 100%)', fg: '#ef9b06' },
  purple: { bg: 'linear-gradient(180deg, rgba(155,81,224,0.12) 0%, rgba(155,81,224,0.04) 100%)', fg: '#9b51e0' },
  teal: { bg: 'linear-gradient(180deg, rgba(12,177,172,0.12) 0%, rgba(12,177,172,0.04) 100%)', fg: '#0cb1ac' },
};

export const DashboardPage = () => {
  const {
    items = [],
    transfers = [],
    zoneRequests = [],
    faultyParts = [],
    salesOrders = [],
    quotations = [],
    invoices = [],
    paymentIns = [],
    purchaseOrders = [],
    purchaseBills = [],
    paymentOuts = [],
    expenses = [],
    customers = [],
    vendors = [],
    parties = [],
    bankAccounts = [],
    deliveryChallans = [],
    salesReturns = [],
    calculateItemStock = () => ({ available: 0, onHand: 0 }),
  } = useERP();

  const overview = dashboardData.leadsOverview;
  const chart = buildChart(overview.series.map((item) => item.value), 620, 260, 28);
  const totalTasks = dashboardData.taskStatus.reduce((sum, item) => sum + item.value, 0);
  const completedTasks = dashboardData.taskStatus.find((item) => item.key === 'done')?.value || 0;
  const completedPct = Math.round((completedTasks / (totalTasks || 1)) * 100);

  let currentAngle = 0;
  const donutSegments = dashboardData.taskStatus.map((item) => {
    const angle = (item.value / (totalTasks || 1)) * 360;
    const segment = { ...item, path: describeArc(110, 110, 72, currentAngle, currentAngle + angle) };
    currentAngle += angle;
    return segment;
  });

  const enriched = items.map((itm) => {
    const calc = calculateItemStock(itm.id);
    let status = 'Optimal';
    if (calc.available <= (itm.reorderLevel || 5) / 2) status = 'Critical';
    else if (calc.available <= (itm.reorderLevel || 5)) status = 'Low Stock';
    return { ...itm, availableQty: calc.available, onHandQty: calc.onHand, status };
  });

  const lowStockItems = enriched.filter((itm) => itm.status === 'Low Stock' || itm.status === 'Critical');
  const totalStockValue = enriched.reduce((acc, itm) => acc + (itm.costPrice || itm.unitCost || 0) * (itm.onHandQty || 0), 0);
  const pendingTransfers = transfers.filter((t) => t.status !== 'Received').length;
  const pendingZoneReqs = zoneRequests.filter((r) => r.status === 'Requested').length;
  const openFaulty = faultyParts.filter((f) => f.status === 'Reported' || f.status === 'Sent for Replacement').length;

  const salesTotal = salesOrders.reduce((a, o) => a + (o.amount || o.total || 0), 0);
  const invoiceTotal = invoices.reduce((a, i) => a + (i.total || 0), 0);
  const purchaseTotal = purchaseOrders.reduce((a, o) => a + (o.total || o.amount || 0), 0);
  const billTotal = purchaseBills.reduce((a, b) => a + (b.total || b.amount || 0), 0);
  const paymentInTotal = paymentIns.reduce((a, p) => a + (p.amount || 0), 0);
  const paymentOutTotal = paymentOuts.reduce((a, p) => a + (p.amount || 0), 0);
  const expenseTotal = expenses.reduce((a, e) => a + (e.amount || e.total || 0), 0);
  const bankBalance = bankAccounts.reduce((a, b) => a + (b.balance || b.currentBalance || 0), 0);

  const modules = [
    { label: 'CRM', desc: `${leads.length} Leads | Deals | Tasks`, to: '/crm/dashboard', icon: Target, tone: 'blue', count: leads.length, tag: 'Leads' },
    { label: 'Sales', desc: `${salesOrders.length} Orders | ${quotations.length} Quotes | ${invoices.length} Invoices`, to: '/sales/quotations', icon: TrendingUp, tone: 'green', count: salesOrders.length, tag: 'Orders' },
    { label: 'Purchase', desc: `${purchaseOrders.length} Orders | ${purchaseBills.length} Bills`, to: '/purchase/orders', icon: Truck, tone: 'amber', count: purchaseOrders.length, tag: 'POs' },
    { label: 'Inventory', desc: `${items.length} SKUs | ${lowStockItems.length} Low Stock`, to: '/inventory/items', icon: Package, tone: 'purple', count: items.length, tag: 'SKUs' },
    { label: 'Parties', desc: `${parties.length} Parties | ${customers.length} Customers`, to: '/parties', icon: Building2, tone: 'teal', count: parties.length, tag: 'Parties' },
    { label: 'Accounts', desc: `Bank $${Math.round(bankBalance).toLocaleString()} | ${invoices.length} Invoices`, to: '/accounts/cash-bank', icon: Wallet, tone: 'blue', count: bankAccounts.length, tag: 'Accounts' },
    { label: 'HRMS', desc: 'Employees | Attendance | Payroll', to: '/hrms/dashboard', icon: UserCheck, tone: 'green', count: 48, tag: 'Staff' },
    { label: 'Reports', desc: 'Sales | Stock | Finance Reports', to: '/reports', icon: PieChart, tone: 'pink', count: 12, tag: 'Reports' },
    { label: 'Administration', desc: 'Users | Roles | Settings', to: '/administration/users', icon: Shield, tone: 'amber', count: 3, tag: 'Admin' },
  ];

  const fmt = (n) => Number(n || 0).toLocaleString();

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Unified Business Dashboard"
        subtitle="CRM + Sales + Purchase + Inventory + Parties + Accounts + HRMS + Reports + Administration"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/crm/dashboard"
              className="inline-flex items-center justify-center px-3.5 py-2 bg-card border border-border rounded-xl text-xs font-bold text-text hover:bg-soft transition shadow-2xs"
            >
              CRM Dashboard
            </Link>
            <Link
              to="/crm/leads"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus size={14} />
              <span>New Lead</span>
            </Link>
          </div>
        }
      />

      {/* Top 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard label="Total Leads" value={fmt(leads.length + 238)} icon={Target} tone="blue" trend="12%" trendDirection="up" note="vs last month" />
        <StatCard label="Sales Orders" value={fmt(salesOrders.length)} icon={ShoppingCart} tone="green" trend={`$${fmt(Math.round(salesTotal / 1000))}k`} note="order value" />
        <StatCard label="Invoices Value" value={`$${fmt(Math.round(invoiceTotal))}`} icon={Receipt} tone="purple" trend={`${fmt(invoices.length)}`} note="invoices" />
        <StatCard label="Purchase Orders" value={fmt(purchaseOrders.length)} icon={ClipboardList} tone="amber" trend={`$${fmt(Math.round(purchaseTotal / 1000))}k`} note="purchase value" />
        <StatCard label="Stock Value" value={`$${fmt(Math.round(totalStockValue))}`} icon={Package} tone="teal" trend={`${fmt(lowStockItems.length)}`} note="low stock" />
        <StatCard label="Bank Balance" value={`$${fmt(Math.round(bankBalance))}`} icon={Wallet} tone="blue" trend={`$${fmt(paymentInTotal - paymentOutTotal)}`} note="net flow" />
      </div>

      {/* All Modules Directory Grid */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-text text-sm">All Enterprise Modules</h3>
            <p className="text-[11px] text-muted">Direct single-click access across all unified modules</p>
          </div>
          <Link to="/reports" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>View Reports</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m) => {
            const Icon = m.icon;
            const style = CARD_STYLES[m.tone] || CARD_STYLES.blue;
            return (
              <Link
                key={m.label}
                to={m.to}
                className="p-3.5 rounded-xl border border-border bg-soft hover:bg-card hover:border-primary/40 hover:shadow-md transition flex items-center gap-3 group"
              >
                <span
                  className="w-10 h-10 rounded-xl grid place-items-center shrink-0 shadow-2xs"
                  style={{ background: style.bg, color: style.fg }}
                >
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <strong className="text-xs sm:text-sm font-bold text-text">{m.label}</strong>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {m.count} {m.tag}
                    </span>
                  </span>
                  <span className="block text-[11px] text-muted truncate mt-0.5">{m.desc}</span>
                </span>
                <ArrowRight size={14} className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Dashboard Analytics & Trends */}
      <div className="dashboard-view" style={{ padding: 0 }}>
        <div className="dashboard-stats">
          {dashboardData.stats.map((stat) => {
            const Icon = ICONS[stat.icon] || Users;
            const style = CARD_STYLES[stat.tone] || CARD_STYLES.blue;
            const TrendIcon = stat.trendDirection === 'down' ? TrendingDown : TrendingUp;
            const trendClass = stat.trendDirection === 'down' ? ' down' : '';
            return (
              <article key={stat.label} className="dashboard-stat">
                <div className="dashboard-stat-top">
                  <span className="dashboard-stat-icon" style={{ background: style.bg, color: style.fg }}>
                    <Icon size={22} />
                  </span>
                  <div className="dashboard-stat-copy">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                </div>
                <small className={`dashboard-stat-trend${trendClass}`}>
                  <TrendIcon size={14} />
                  <b>{stat.trend}</b>
                  <em>{stat.note}</em>
                </small>
              </article>
            );
          })}
          <article className="dashboard-stat">
            <div className="dashboard-stat-top">
              <span className="dashboard-stat-icon" style={{ background: CARD_STYLES.green.bg, color: CARD_STYLES.green.fg }}>
                <FileText size={22} />
              </span>
              <div className="dashboard-stat-copy">
                <strong>{fmt(quotations.length + 64)}</strong>
                <span>Quotations</span>
              </div>
            </div>
            <small className="dashboard-stat-trend">
              <TrendingUp size={14} />
              <b>9%</b>
              <em>this month</em>
            </small>
          </article>
          <article className="dashboard-stat">
            <div className="dashboard-stat-top">
              <span className="dashboard-stat-icon" style={{ background: CARD_STYLES.amber.bg, color: CARD_STYLES.amber.fg }}>
                <Boxes size={22} />
              </span>
              <div className="dashboard-stat-copy">
                <strong>{fmt(items.length)}</strong>
                <span>SKUs Live</span>
              </div>
            </div>
            <small className="dashboard-stat-trend">
              <TrendingUp size={14} />
              <b>{fmt(lowStockItems.length)}</b>
              <em>need reorder</em>
            </small>
          </article>
        </div>

        <div className="dashboard-main-grid">
          <section className="dashboard-panel dashboard-chart-card">
            <div className="panel-head panel-head-spread">
              <div>
                <h3>Leads Overview</h3>
                <p>{overview.headline}</p>
              </div>
              <button type="button" className="dashboard-filter-btn">
                {overview.period}
              </button>
            </div>
            <div className="chart-wrap">
              <svg viewBox="0 0 620 260" className="chart-svg" aria-label="Leads overview chart">
                <defs>
                  <linearGradient id="uniChartArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2b7cff" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#2b7cff" stopOpacity="0.04" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((line) => {
                  const y = 28 + line * 52;
                  return <line key={line} x1="28" y1={y} x2="592" y2={y} className="chart-grid-line" />;
                })}
                <path d={chart.areaPath} fill="url(#uniChartArea)" />
                <path d={chart.linePath} className="chart-line-path" />
                {chart.points.map((point) => (
                  <g key={`${point.x}-${point.y}`}>
                    <circle cx={point.x} cy={point.y} r="6" fill="#1f6bff" />
                    <circle cx={point.x} cy={point.y} r="3" fill="#ffffff" />
                  </g>
                ))}
                {overview.series.map((item, index) => (
                  <text key={item.month} x={chart.points[index]?.x} y="250" textAnchor="middle" className="chart-axis-label">
                    {item.month}
                  </text>
                ))}
              </svg>
            </div>
            <p className="chart-note">{overview.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs font-semibold">
              <Link to="/crm/leads" className="text-center px-2 py-2 rounded-xl bg-card border border-border text-text hover:bg-soft transition">
                Leads: {fmt(leads.length)}
              </Link>
              <Link to="/crm/deals" className="text-center px-2 py-2 rounded-xl bg-card border border-border text-text hover:bg-soft transition">
                Deals
              </Link>
              <Link to="/crm/tasks" className="text-center px-2 py-2 rounded-xl bg-card border border-border text-text hover:bg-soft transition">
                Tasks: {totalTasks}
              </Link>
              <Link to="/crm/system-setup" className="text-center px-2 py-2 rounded-xl bg-card border border-border text-text hover:bg-soft transition flex items-center justify-center gap-1">
                <Settings size={12} />
                <span>Setup</span>
              </Link>
            </div>
          </section>

          <section className="dashboard-panel dashboard-donut-card">
            <div className="panel-head panel-head-spread">
              <div>
                <h3>Task Status</h3>
                <p>Team work distribution.</p>
              </div>
              <Link to="/crm/tasks" className="view-all-link">
                View All
              </Link>
            </div>
            <div className="donut-layout">
              <div className="donut-chart">
                <svg viewBox="0 0 220 220" aria-label="Task status donut chart">
                  <circle cx="110" cy="110" r="72" className="donut-track" />
                  {donutSegments.map((item) => (
                    <path key={item.key} d={item.path} stroke={item.color} strokeWidth="22" strokeLinecap="round" fill="none" />
                  ))}
                </svg>
                <div className="donut-center">
                  <strong>{completedPct}%</strong>
                  <span>Completed</span>
                </div>
              </div>
              <div className="donut-legend">
                {dashboardData.taskStatus.map((item) => (
                  <div key={item.key} className="legend-row">
                    <div className="legend-meta">
                      <span className="legend-dot" style={{ backgroundColor: item.color }} />
                      <span>{item.label}</span>
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="activity-list mt-4">
              {dashboardData.recentActivity.slice(0, 3).map((item) => {
                const Icon = ACTIVITY_ICONS[item.icon] || UserPlus;
                const style = CARD_STYLES[item.tone] || CARD_STYLES.blue;
                return (
                  <div key={`${item.title}-${item.person}`} className="activity-item">
                    <span className="activity-badge" style={{ background: style.bg, color: style.fg }}>
                      <Icon size={16} />
                    </span>
                    <div className="activity-copy">
                      <strong>{item.title}</strong>
                      <p>{item.person}</p>
                    </div>
                    <time>{item.time}</time>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Low-Stock Alerts & Snapshots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left: Low Stock Alerts */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-text text-sm">Low-Stock Alerts</h3>
              <p className="text-[11px] text-muted">Items below safety reorder threshold</p>
            </div>
            <Link to="/inventory/stock-position" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-center">Available</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {lowStockItems.slice(0, 6).map((item) => (
                  <tr key={item.id || item.sku} className="hover:bg-soft/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-text-secondary">{item.sku}</td>
                    <td className="py-3 px-3 font-semibold text-text">{item.name}</td>
                    <td className="py-3 px-3 text-center font-bold text-danger font-mono">
                      {item.availableQty}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to="/purchase/orders"
                        className="inline-flex items-center justify-center px-3 py-1 bg-primary text-white hover:bg-primary-hover rounded-lg text-[11px] font-semibold shadow-2xs transition"
                      >
                        Order
                      </Link>
                    </td>
                  </tr>
                ))}
                {lowStockItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted">
                      All inventory levels are healthy and stocked.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs font-semibold">
            <Link to="/inventory/items" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition">
              Items: {fmt(items.length)}
            </Link>
            <Link to="/inventory/transfers" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition">
              Transfers: {fmt(transfers.length)}
            </Link>
            <Link to="/inventory/faulty-parts" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition">
              Faulty: {fmt(openFaulty)}
            </Link>
            <Link to="/inventory/locations" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition flex items-center justify-center gap-1">
              <MapPin size={12} />
              <span>Locations</span>
            </Link>
          </div>
        </div>

        {/* Right: Sales & Purchase Snapshots */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-text text-sm">Sales Snapshot</h3>
                <p className="text-[11px] text-muted">Orders + Invoices + Challans</p>
              </div>
              <Link to="/sales/orders" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              {salesOrders.slice(0, 3).map((o) => (
                <div key={o.id} className="p-2.5 rounded-xl border border-border bg-soft flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-text">{o.orderNumber || o.id}</p>
                    <p className="text-[11px] text-muted truncate">
                      {o.customer} | ${fmt(o.amount || 0)}
                    </p>
                  </div>
                  <StatusBadge status={o.stage || o.status || 'Draft'} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-text text-sm">Purchase Snapshot</h3>
                <p className="text-[11px] text-muted">POs + Bills + Expenses</p>
              </div>
              <Link to="/purchase/orders" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              {purchaseOrders.slice(0, 3).map((o) => (
                <div key={o.id} className="p-2.5 rounded-xl border border-border bg-soft flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-text">{o.orderNumber || o.poNumber || o.id}</p>
                    <p className="text-[11px] text-muted truncate">
                      {o.vendor} | ${fmt(o.total || o.amount || 0)}
                    </p>
                  </div>
                  <StatusBadge status={o.status || 'Draft'} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Snapshot Metrics */}
          <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs font-semibold">
            <Link to="/sales/invoices" className="px-2 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition">
              Invoices ${fmt(Math.round(invoiceTotal))}
            </Link>
            <Link to="/purchase/bills" className="px-2 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition">
              Bills ${fmt(Math.round(billTotal))}
            </Link>
            <Link to="/sales/payments" className="px-2 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition">
              PayIn ${fmt(Math.round(paymentInTotal))}
            </Link>
            <Link to="/purchase/payments" className="px-2 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition">
              PayOut ${fmt(Math.round(paymentOutTotal))}
            </Link>
            <Link to="/purchase/expenses" className="px-2 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition col-span-2">
              Expenses ${fmt(Math.round(expenseTotal))} | Challans {fmt(deliveryChallans.length)} | Returns {fmt(salesReturns.length)}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Parties, Accounts, HRMS + Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-text text-sm">Parties</h3>
              <p className="text-[11px] text-muted">Customers + Vendors</p>
            </div>
            <Link to="/parties" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2 text-xs font-semibold">
            <Link to="/crm/customers" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold">
                <Users size={14} className="text-primary" />
                <span>Customers</span>
              </span>
              <strong className="text-text">{fmt(customers.length)}</strong>
            </Link>
            <Link to="/parties" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold">
                <Building2 size={14} className="text-primary" />
                <span>Vendors</span>
              </span>
              <strong className="text-text">{fmt(vendors.length)}</strong>
            </Link>
            <Link to="/parties" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold">
                <BriefcaseBusiness size={14} className="text-primary" />
                <span>All Parties</span>
              </span>
              <strong className="text-text">{fmt(parties.length)}</strong>
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-text text-sm">Accounts</h3>
              <p className="text-[11px] text-muted">Cash + Ledger + Reports</p>
            </div>
            <Link to="/accounts/cash-bank" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2 text-xs font-semibold">
            <Link to="/accounts/cash-bank" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold">
                <Landmark size={14} className="text-primary" />
                <span>Bank Balance</span>
              </span>
              <strong className="text-text">${fmt(Math.round(bankBalance))}</strong>
            </Link>
            <Link to="/accounts/general-ledger" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold">
                <FileText size={14} className="text-primary" />
                <span>Ledger</span>
              </span>
              <strong className="text-text">Open</strong>
            </Link>
            <Link to="/accounts/reports" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold">
                <PieChart size={14} className="text-primary" />
                <span>Finance Reports</span>
              </span>
              <strong className="text-primary">View</strong>
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-text text-sm">HRMS + Admin</h3>
              <p className="text-[11px] text-muted">People + Settings</p>
            </div>
            <Link to="/hrms/dashboard" className="text-xs font-bold text-primary hover:underline">
              HRMS
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <Link to="/hrms/employees" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              Employees
            </Link>
            <Link to="/hrms/attendance" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              Attendance
            </Link>
            <Link to="/hrms/leave" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              Leave
            </Link>
            <Link to="/hrms/payroll" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              Payroll
            </Link>
            <Link to="/administration/users" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              Users
            </Link>
            <Link to="/administration/settings" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              Settings
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
            <Link to="/crm/user-allocation" className="flex-1 p-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-center transition flex items-center justify-center gap-1">
              <ListChecks size={13} />
              <span>Allocation</span>
            </Link>
            <Link to="/inventory/zone-requests" className="flex-1 p-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-center transition">
              Zone ({pendingZoneReqs})
            </Link>
            <Link to="/inventory/transfers" className="flex-1 p-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-center transition flex items-center justify-center gap-1">
              <ArrowLeftRight size={13} />
              <span>{pendingTransfers}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
