import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge, translateStatus } from '../../components/ui/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { Link } from 'react-router-dom';
import { useERP } from '../../context/ERPContext';
import { useTranslation } from '../../i18n';
import { toDisplayDateLocalized } from '../../utils/dateUtils';
// ── [PHASE-1-DASHBOARD] CRM mock imports removed from the ERP (sales) dashboard ──
// Before (kept for reference if the CRM dashboard panel is ever re-added):
// import { dashboardData } from '../../data/crm/dashboardData';
// import { leads } from '../../data/crm/mockLeads';
// Reason: the ERP dashboard should compute from live ERP state (invoices, paymentIns,
//   purchaseBills, items, calculateItemStock), not from static CRM fixture data.
// import { toISODate, getCurrentISODate } from '../../utils/dateUtils';
import { Target, TrendingUp, ListChecks, FileText, ShoppingCart, Receipt, Send, Truck, ClipboardList, Landmark, Package, Boxes, ArrowLeftRight, MapPin, Building2, Users, Wallet, PieChart, UserCheck, BarChart3, Shield, Settings, ArrowRight, BriefcaseBusiness, UserPlus, CheckSquare, UserRoundPlus, TrendingDown } from 'lucide-react';
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
  const { items, transfers, zoneRequests, faultyParts, salesOrders, quotations, invoices, paymentIns, purchaseOrders, purchaseBills, paymentOuts, expenses, customers, vendors, parties, bankAccounts, deliveryChallans, salesReturns, calculateItemStock } = useERP();
  const { t, currentLanguage } = useTranslation();
  // ── [PHASE-1-DASHBOARD] CRM lead/task analytics replaced with ERP-derived analytics ──
  // Before (kept for reference): dashboardData.leadsOverview, dashboardData.taskStatus drove
  //   the chart + donut. Now we chart invoice revenue over the last 6 months and show
  //   invoice status distribution, both computed from live ERP state.
  // const overview = dashboardData.leadsOverview;
  // const chart = buildChart(overview.series.map((item) => item.value), 620, 260, 28);
  // const totalTasks = dashboardData.taskStatus.reduce((sum, item) => sum + item.value, 0);
  // const completedTasks = dashboardData.taskStatus.find((item) => item.key === 'done')?.value || 0;
  // const completedPct = Math.round((completedTasks / (totalTasks || 1)) * 100);
  // let currentAngle = 0;
  // const donutSegments = dashboardData.taskStatus.map((item) => {...});
  const monthKey = (iso) => { const p = String(iso || '').split('-'); return p.length === 3 ? `${p[0]}-${p[1]}` : ''; };
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const revenueByMonth = last6Months.map((mk) => invoices
    .filter((inv) => monthKey(inv.date) === mk || monthKey(inv.dueDate) === mk)
    .reduce((sum, inv) => sum + (Number(inv.total ?? inv.amount) || 0), 0));
  const overview = {
    headline: t('dashboard.revenueHeadline', { count: invoices.length }),
    period: t('dashboard.last6Months'),
    summary: t('dashboard.revenueSummary'),
    series: last6Months.map((mk, i) => ({ month: mk.split('-')[1], value: revenueByMonth[i] })),
  };
  const chart = buildChart(revenueByMonth, 620, 260, 28);
  const invoiceStatusMap = {
    Paid: { label: t('sales.paid'), color: '#1bb878' },
    Unpaid: { label: t('sales.unpaid'), color: '#1f6bff' },
    Overdue: { label: t('status.overdue'), color: '#ef9b06' },
    Cancelled: { label: t('common.cancelled'), color: '#ef4444' },
    Draft: { label: t('common.draft'), color: '#94a3b8' },
  };
  const taskStatus = Object.entries(invoiceStatusMap)
    .map(([key, meta]) => ({
      key: key.toLowerCase(),
      label: meta.label,
      color: meta.color,
      value: invoices.filter((inv) => (inv.status || 'Unpaid') === key).length,
    }))
    .filter((s) => s.value > 0);
  const totalTasks = taskStatus.reduce((sum, item) => sum + item.value, 0);
  const doneKey = taskStatus.find((s) => s.key === 'paid');
  const completedTasks = doneKey?.value || 0;
  const completedPct = Math.round((completedTasks / (totalTasks || 1)) * 100);

  let currentAngle = 0;
  const donutSegments = taskStatus.map((item) => {
    const angle = (item.value / (totalTasks || 1)) * 360;
    const segment = { ...item, path: describeArc(110, 110, 72, currentAngle, currentAngle + angle) };
    currentAngle += angle;
    return segment;
  });
  const recentActivity = invoices.slice(0, 3).map((inv) => ({
    icon: invoices.length ? 'check' : 'task',
    tone: inv.status === 'Paid' ? 'green' : inv.status === 'Overdue' ? 'amber' : 'blue',
    title: inv.customer || t('common.customer'),
    person: `${inv.invoiceNumber} • ${translateStatus(inv.status, t)}`,
    time: toDisplayDateLocalized(inv.date, currentLanguage),
  }));
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
    // ── [PHASE-1-DASHBOARD] CRM module card now counts ERP quotations (was: leads) ──
    // Old: { label: 'CRM', desc: `${leads.length} Leads | Deals | Tasks`, ... count: leads.length, tag: 'Leads' }
    { label: t('navigation.crm'), desc: `${quotations.length} ${t('dashboard.tagQuotes')} | ${t('crm.deals')} | ${t('crm.tasks')}`, to: '/crm/dashboard', icon: Target, tone: 'blue', count: quotations.length, tag: t('dashboard.tagQuotes') },
    { label: t('navigation.sales'), desc: `${salesOrders.length} ${t('dashboard.tagOrders')} | ${quotations.length} ${t('dashboard.tagQuotes')} | ${invoices.length} ${t('dashboard.linkInvoices')}`, to: '/sales/quotations', icon: TrendingUp, tone: 'green', count: salesOrders.length, tag: t('dashboard.tagOrders') },
    { label: t('navigation.purchase'), desc: `${purchaseOrders.length} ${t('dashboard.tagOrders')} | ${purchaseBills.length} ${t('dashboard.linkInvoices')}`, to: '/purchase/orders', icon: Truck, tone: 'amber', count: purchaseOrders.length, tag: t('dashboard.tagPOs') },
    { label: t('navigation.inventory'), desc: `${items.length} ${t('dashboard.tagSKUs')} | ${lowStockItems.length} ${t('dashboard.lowStock')}`, to: '/inventory/items', icon: Package, tone: 'purple', count: items.length, tag: t('dashboard.tagSKUs') },
    { label: t('navigation.parties'), desc: `${parties.length} ${t('dashboard.tagParties')} | ${customers.length} ${t('crm.customers')}`, to: '/parties', icon: Building2, tone: 'teal', count: parties.length, tag: t('dashboard.tagParties') },
    { label: t('navigation.accounts'), desc: `${t('finance.bank')} $${Math.round(bankBalance).toLocaleString()} | ${invoices.length} ${t('dashboard.linkInvoices')}`, to: '/accounts/cash-bank', icon: Wallet, tone: 'blue', count: bankAccounts.length, tag: t('dashboard.tagAccounts') },
    { label: t('navigation.hrms'), desc: `${t('hr.employees')} | ${t('hr.attendance')} | ${t('hr.payroll')}`, to: '/hrms/dashboard', icon: UserCheck, tone: 'green', count: 48, tag: t('dashboard.tagStaff') },
    { label: t('navigation.reports'), desc: `${t('navigation.sales')} | ${t('inventory.stock')} | ${t('navigation.financialReports')}`, to: '/reports', icon: PieChart, tone: 'pink', count: 12, tag: t('dashboard.tagReports') },
    { label: t('navigation.administration'), desc: `${t('navigation.users')} | ${t('navigation.roles')} | ${t('common.settings')}`, to: '/administration/users', icon: Shield, tone: 'amber', count: 3, tag: t('dashboard.tagAdmin') },
  ];

  const fmt = (n) => Number(n || 0).toLocaleString();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.unifiedTitle")}
        subtitle={t("dashboard.unifiedSubtitle")}
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              to="/crm/dashboard"
              className="px-3.5 py-2 bg-card border border-border hover:bg-soft text-text rounded-xl text-xs font-semibold shadow-2xs transition"
            >
              {t("dashboard.crmDashboard")}
            </Link>
            <Link
              to="/crm/leads"
              className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              {t("dashboard.newLead")}
            </Link>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* [PHASE-1-DASHBOARD] "Total Leads" stat card replaced with ERP Totals */}
        {/* Old: <StatCard label="Total Leads" value={fmt(leads.length + 238)} icon={Target} tone="blue" trend="12%" trendDirection="up" note="vs last month" /> */}
        <StatCard label={t("dashboard.quotations")} value={fmt(quotations.length)} icon={FileText} tone="blue" trend={`${fmt(deliveryChallans.length)}`} note={t("dashboard.challansIssued")} />
        <StatCard label={t("dashboard.salesOrders")} value={fmt(salesOrders.length)} icon={ShoppingCart} tone="green" trend={`${fmt(Math.round(salesTotal / 1000))}k`} note={t("dashboard.orderValue")} />
        <StatCard label={t("dashboard.invoicesValue")} value={`₹${fmt(Math.round(invoiceTotal))}`} icon={Receipt} tone="purple" trend={`${fmt(invoices.length)}`} note={t("dashboard.invoices")} />
        <StatCard label={t("dashboard.purchaseOrders")} value={fmt(purchaseOrders.length)} icon={ClipboardList} tone="amber" trend={`${fmt(Math.round(purchaseTotal / 1000))}k`} note={t("dashboard.purchaseValue")} />
        <StatCard label={t("dashboard.stockValue")} value={`₹${fmt(Math.round(totalStockValue))}`} icon={Package} tone="teal" trend={`${fmt(lowStockItems.length)}`} note={t("dashboard.lowStock")} />
        <StatCard label={t("dashboard.bankBalance")} value={`₹${fmt(Math.round(bankBalance))}`} icon={Wallet} tone="blue" trend={`${fmt(paymentInTotal - paymentOutTotal)}`} note={t("dashboard.netFlow")} />
      </div>

      {/* All Modules Directory Grid */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-text text-sm">{t("dashboard.allModules")}</h3>
            <p className="text-[11px] text-muted">{t("dashboard.modulesAccessDesc")}</p>
          </div>
          <Link to="/reports" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>{t("dashboard.viewReports")}</span>
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
          {/* ── [PHASE-1-DASHBOARD] was: {dashboardData.stats.map((stat) => {...})} ──
              CRM stat cards (leads/tasks pipeline) replaced with live ERP stats below. */}
          {[
            { label: t('dashboard.statInvoicesPkg'), value: fmt(invoices.length), icon: 'file', tone: 'blue', trend: `${fmt(Math.round(invoiceTotal))}`, note: t('dashboard.billedValue') },
            { label: t('dashboard.statSoOrders'), value: fmt(salesOrders.length), icon: 'users', tone: 'green', trend: `${fmt(Math.round(salesTotal))}`, note: t('dashboard.orderValue') },
            { label: t('dashboard.statPurchaseBills'), value: fmt(purchaseBills.length), icon: 'building', tone: 'amber', trend: `${fmt(Math.round(billTotal))}`, note: t('dashboard.billValue') },
            { label: t('dashboard.statPayIn'), value: fmt(paymentIns.length), icon: 'check', tone: 'purple', trend: `${fmt(Math.round(paymentInTotal))}`, note: t('dashboard.receivedNote') },
            { label: t('dashboard.statPayOut'), value: fmt(paymentOuts.length), icon: 'users', tone: 'teal', trend: `${fmt(Math.round(paymentOutTotal))}`, note: t('dashboard.paidNote') },
            { label: t('dashboard.statExpenses'), value: fmt(expenses.length), icon: 'bars', tone: 'pink', trend: `${fmt(Math.round(expenseTotal))}`, note: t('dashboard.mtExpense') },
          ].map((stat) => {
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
              <span className="dashboard-stat-icon" style={{ background: CARD_STYLES.green.bg, color: CARD_STYLES.green.fg }}><FileText size={24} /></span>
              {/* ── [PHASE-1-DASHBOARD] was: {fmt(quotations.length + 64)} — removed demo +64 offset ── */}
              <div className="dashboard-stat-copy"><strong>{fmt(quotations.length)}</strong><span>{t("dashboard.quotations")}</span></div>
            </div>
            <small className="dashboard-stat-trend"><TrendingUp size={14} /><b>100%</b><em>{t("dashboard.liveCount")}</em></small>
          </article>
          <article className="dashboard-stat">
            <div className="dashboard-stat-top">
              <span className="dashboard-stat-icon" style={{ background: CARD_STYLES.amber.bg, color: CARD_STYLES.amber.fg }}>
                <Boxes size={22} />
              </span>
              <div className="dashboard-stat-copy">
                <strong>{fmt(items.length)}</strong>
                <span>{t("dashboard.statSkusLive")}</span>
              </div>
            </div>
            <small className="dashboard-stat-trend">
              <TrendingUp size={14} />
              <b>{fmt(lowStockItems.length)}</b>
              <em>{t("dashboard.needReorder")}</em>
            </small>
          </article>
        </div>

        <div className="dashboard-main-grid">
          <section className="dashboard-panel dashboard-chart-card">
            <div className="panel-head panel-head-spread">
              <div><h3>{t("dashboard.revenueOverview")}</h3><p>{overview.headline}</p></div>
              <button type="button" className="dashboard-filter-btn">{overview.period}</button>
            </div>
            <div className="chart-wrap">
              <svg viewBox="0 0 620 260" className="chart-svg" aria-label="Invoiced revenue chart">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <Link to="/sales/quotes" className="text-center px-3 py-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-xs font-semibold shadow-2xs transition">{t("dashboard.linkQuotes")}: {fmt(quotations.length)}</Link>
              <Link to="/sales/invoices" className="text-center px-3 py-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-xs font-semibold shadow-2xs transition">{t("dashboard.linkInvoices")}: {fmt(invoices.length)}</Link>
              <Link to="/sales/challans" className="text-center px-3 py-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-xs font-semibold shadow-2xs transition">{t("dashboard.linkChallans")}: {fmt(deliveryChallans.length)}</Link>
              <Link to="/sales/orders" className="text-center px-3 py-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-1.5"><Settings size={12} className="text-primary" /> {t("dashboard.linkOrders")}: {fmt(salesOrders.length)}</Link>
            </div>
          </section>

          <section className="dashboard-panel dashboard-donut-card">
            <div className="panel-head panel-head-spread">
              <div><h3>{t("dashboard.invoiceStatus")}</h3><p>{t("dashboard.billingDist")}</p></div>
              <Link to="/sales/invoices" className="view-all-link">{t("common.viewAll")}</Link>
            </div>
            <div className="donut-layout">
              <div className="donut-chart">
                <svg viewBox="0 0 220 220" aria-label="Task status donut chart">
                  <circle cx="110" cy="110" r="72" className="donut-track" />
                  {donutSegments.map((item) => (
                    <path key={item.key} d={item.path} stroke={item.color} strokeWidth="22" strokeLinecap="round" fill="none" />
                  ))}
                </svg>
                <div className="donut-center"><strong>{completedPct}%</strong><span>{t("sales.paid")}</span></div>
              </div>
              <div className="donut-legend">
                {/* ── [PHASE-1-DASHBOARD] was: dashboardData.taskStatus.map(...) — now ERP taskStatus ── */}
                {taskStatus.map((item) => (
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
              {/* ── [PHASE-1-DASHBOARD] was: dashboardData.recentActivity.slice(0,3) — now ERP recentActivity ── */}
              {recentActivity.map((item) => {
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
              <h3 className="font-bold text-text text-sm">{t("dashboard.lowStockAlerts")}</h3>
              <p className="text-[11px] text-muted">{t("dashboard.belowThreshold")}</p>
            </div>
            <Link to="/inventory/stock-position" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>{t("common.viewAll")}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">{t("common.product")}</th>
                  <th className="py-2.5 px-3 text-center">{t("dashboard.available")}</th>
                  <th className="py-2.5 px-3 text-center">{t("table.status")}</th>
                  <th className="py-2.5 px-3 text-right">{t("table.actions")}</th>
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
                        {t("dashboard.orderAction")}
                      </Link>
                    </td>
                  </tr>
                ))}
                {lowStockItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted">
                      {t("dashboard.allHealthy")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs font-semibold">
            <Link to="/inventory/items" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition">
              {t("dashboard.linkItems")}: {fmt(items.length)}
            </Link>
            <Link to="/inventory/transfers" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition">
              {t("dashboard.linkTransfers")}: {fmt(transfers.length)}
            </Link>
            <Link to="/inventory/faulty-parts" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition">
              {t("dashboard.linkFaulty")}: {fmt(openFaulty)}
            </Link>
            <Link to="/inventory/locations" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition flex items-center justify-center gap-1">
              <MapPin size={12} />
              <span>{t("dashboard.linkLocations")}</span>
            </Link>
          </div>
        </div>

        {/* Right: Sales & Purchase Snapshots */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-text text-sm">{t("dashboard.salesSnapshot")}</h3>
                <p className="text-[11px] text-muted">{t("dashboard.salesSnapDesc")}</p>
              </div>
              <Link to="/sales/orders" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>{t("common.viewAll")}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              {salesOrders.slice(0, 3).map((o) => (
                <div key={o.id} className="p-3 rounded-xl border border-border bg-soft/60 hover:bg-soft flex items-center justify-between gap-3 transition">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-text">{o.orderNumber || o.id}</p>
                    <p className="text-[11px] text-muted truncate">{o.customer} • ₹{fmt(o.amount || 0)}</p>
                  </div>
                  <StatusBadge status={o.stage || o.status || 'Draft'} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-text text-sm">{t("dashboard.purchaseSnapshot")}</h3>
                <p className="text-[11px] text-muted">{t("dashboard.purchaseSnapDesc")}</p>
              </div>
              <Link to="/purchase/orders" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>{t("common.viewAll")}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              {purchaseOrders.slice(0, 3).map((o) => (
                <div key={o.id} className="p-3 rounded-xl border border-border bg-soft/60 hover:bg-soft flex items-center justify-between gap-3 transition">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-text">{o.orderNumber || o.poNumber || o.id}</p>
                    <p className="text-[11px] text-muted truncate">{o.vendor} • ₹{fmt(o.total || o.amount || 0)}</p>
                  </div>
                  <StatusBadge status={o.status || 'Draft'} />
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs font-semibold">
            <Link to="/sales/invoices" className="px-3 py-2 rounded-xl bg-primary text-white text-center shadow-2xs hover:bg-primary/90 transition">
              {t("dashboard.linkInvoices")} ₹{fmt(Math.round(invoiceTotal))}
            </Link>
            <Link to="/purchase/bills" className="px-3 py-2 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              {t("purchase.purchaseBill")} ₹{fmt(Math.round(billTotal))}
            </Link>
            <Link to="/sales/payments" className="px-3 py-2 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              {t("dashboard.linkPayIn")} ₹{fmt(Math.round(paymentInTotal))}
            </Link>
            <Link to="/purchase/payments" className="px-3 py-2 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              {t("dashboard.linkPayOut")} ₹{fmt(Math.round(paymentOutTotal))}
            </Link>
            <Link to="/purchase/expenses" className="px-3 py-2 rounded-xl bg-soft hover:bg-card border border-border text-text text-center col-span-2 transition">
              {t("dashboard.linkExpenses")} ₹{fmt(Math.round(expenseTotal))} • {t("dashboard.linkChallans")} {fmt(deliveryChallans.length)} • {t("dashboard.linkReturns")} {fmt(salesReturns.length)}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Parties, Accounts, HRMS + Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-text text-sm">{t("navigation.parties")}</h3>
              <p className="text-[11px] text-muted">{t("dashboard.partiesDesc")}</p>
            </div>
            <Link to="/parties" className="text-xs font-bold text-primary hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="space-y-2 text-xs font-semibold">
            <Link to="/crm/customers" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold">
                <Users size={14} className="text-primary" />
                <span>{t("crm.customers")}</span>
              </span>
              <strong className="text-text">{fmt(customers.length)}</strong>
            </Link>
            <Link to="/parties" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold">
                <Building2 size={14} className="text-primary" />
                <span>{t("common.vendorsLabel")}</span>
              </span>
              <strong className="text-text">{fmt(vendors.length)}</strong>
            </Link>
            <Link to="/parties" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold">
                <BriefcaseBusiness size={14} className="text-primary" />
                <span>{t("dashboard.allParties")}</span>
              </span>
              <strong className="text-text">{fmt(parties.length)}</strong>
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-text text-sm">{t("navigation.accounts")}</h3>
              <p className="text-[11px] text-muted">{t("dashboard.accountsDesc")}</p>
            </div>
            <Link to="/accounts/cash-bank" className="text-xs font-bold text-primary hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="space-y-2 text-xs font-semibold">
            <Link to="/accounts/cash-bank" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold text-text">
                <Landmark size={14} className="text-primary" />
                <span>{t("dashboard.bankBalance")}</span>
              </span>
              <strong className="text-text font-mono font-bold">₹{fmt(Math.round(bankBalance))}</strong>
            </Link>
            <Link to="/accounts/general-ledger" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold text-text">
                <FileText size={14} className="text-primary" />
                <span>{t("navigation.generalLedger")}</span>
              </span>
              <span className="text-primary text-xs font-bold">{t("common.open")} →</span>
            </Link>
            <Link to="/accounts/reports" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold text-text">
                <PieChart size={14} className="text-primary" />
                <span>{t("navigation.financialReports")}</span>
              </span>
              <span className="text-primary text-xs font-bold">{t("common.view")} →</span>
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-text text-sm">{t("dashboard.hrmsAdmin")}</h3>
              <p className="text-[11px] text-muted">{t("dashboard.peopleSettings")}</p>
            </div>
            <Link to="/hrms/dashboard" className="text-xs font-bold text-primary hover:underline">
              {t("navigation.hrms")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <Link to="/hrms/employees" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              {t("hr.employees")}
            </Link>
            <Link to="/hrms/attendance" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              {t("hr.attendance")}
            </Link>
            <Link to="/hrms/leave" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              {t("hr.leave")}
            </Link>
            <Link to="/hrms/payroll" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              {t("hr.payroll")}
            </Link>
            <Link to="/administration/users" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              {t("navigation.users")}
            </Link>
            <Link to="/administration/settings" className="p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition">
              {t("common.settings")}
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
            <Link to="/crm/user-allocation" className="flex-1 p-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-center transition flex items-center justify-center gap-1.5 shadow-2xs">
              <ListChecks size={13} className="text-primary" />
              <span>{t("navigation.taskAllocation")}</span>
            </Link>
            <Link to="/inventory/zone-requests" className="flex-1 p-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-center transition flex items-center justify-center gap-1.5 shadow-2xs">
              <span>{t("navigation.zoneRequests")} ({pendingZoneReqs})</span>
            </Link>
            <Link to="/inventory/transfers" className="flex-1 p-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-center transition flex items-center justify-center gap-1.5 shadow-2xs">
              <ArrowLeftRight size={13} className="text-primary" />
              <span>{t("navigation.transfers")} ({pendingTransfers})</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
