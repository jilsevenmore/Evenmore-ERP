import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { Link } from 'react-router-dom';
import { useERP } from '../../context/ERPContext';
// ── [PHASE-1-DASHBOARD] CRM mock imports removed from the ERP (sales) dashboard ──
// Before (kept for reference if the CRM dashboard panel is ever re-added):
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
  const { items, transfers, zoneRequests, faultyParts, salesOrders, quotations, invoices, paymentIns, purchaseOrders, purchaseBills, paymentOuts, expenses, customers, vendors, parties, bankAccounts, deliveryChallans, salesReturns, calculateItemStock, cashPaymentReceipts, getInvoiceOutstanding } = useERP();
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
    headline: `${invoices.length} tax invoices booked across the last 6 months`,
    period: 'Last 6 Months',
    summary: 'Invoiced value trend by month. Filter or open Sales > Invoices for details.',
    series: last6Months.map((mk, i) => ({ month: mk.split('-')[1], value: revenueByMonth[i] })),
  };
  const chart = buildChart(revenueByMonth, 620, 260, 28);
  const invoiceStatusMap = {
    Paid: { label: 'Paid', color: '#1bb878' },
    Unpaid: { label: 'Unpaid', color: '#1f6bff' },
    Overdue: { label: 'Overdue', color: '#ef9b06' },
    Cancelled: { label: 'Cancelled', color: '#ef4444' },
    Draft: { label: 'Draft', color: '#94a3b8' },
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
    title: inv.customer || 'Customer',
    person: `${inv.invoiceNumber} • ${inv.status}`,
    time: inv.date,
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

  // ── [PHASE-4] Core Financial Metrics: Distinguishing Billed Sales vs Without-Bill Cash ──
  const activeInvoices = invoices.filter((inv) => inv.status !== 'Cancelled');
  const billedSales = activeInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal ?? inv.total ?? inv.amount) || 0), 0);
  const gstTotal = activeInvoices.reduce((sum, inv) => {
    const out = getInvoiceOutstanding ? getInvoiceOutstanding(inv.id) : null;
    return sum + (out?.gst ?? Number(inv.taxAmount || 0));
  }, 0);
  const validWithBillPayments = paymentIns.filter(
    (p) => p.paymentType !== 'WITHOUT_BILL' && p.status !== 'Cancelled' && p.status !== 'CANCELLED'
  );
  const withBillPaymentsTotal = validWithBillPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const validCashReceipts = (cashPaymentReceipts || []).filter(
    (r) => r.status === 'RECEIVED' || (!r.status && r.status !== 'CANCELLED' && r.status !== 'VOIDED')
  );
  const withoutBillCashTotal = validCashReceipts.length > 0
    ? validCashReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    : paymentIns.filter((p) => p.paymentType === 'WITHOUT_BILL' && p.status !== 'Cancelled').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPaymentsReceived = withBillPaymentsTotal + withoutBillCashTotal;
  const totalInvoiceOutstanding = activeInvoices.reduce((sum, inv) => {
    const out = getInvoiceOutstanding ? getInvoiceOutstanding(inv.id) : null;
    return sum + (out?.outstanding ?? Math.max(0, (inv.total || 0) - (inv.paidAmount || 0)));
  }, 0);
  const overdueOrUnpaidCount = activeInvoices.filter((inv) => {
    const out = getInvoiceOutstanding ? getInvoiceOutstanding(inv.id) : null;
    return (out?.outstanding ?? (inv.total || 0)) > 0.01;
  }).length;

  const modules = [
    // ── [PHASE-1-DASHBOARD] CRM module card now counts ERP quotations (was: leads) ──
    // Old: { label: 'CRM', desc: `${leads.length} Leads | Deals | Tasks`, ... count: leads.length, tag: 'Leads' }
    { label: 'CRM', desc: `${quotations.length} Quotes | Deals | Tasks`, to: '/crm/dashboard', icon: Target, tone: 'blue', count: quotations.length, tag: 'Quotes' },
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
    <div className="space-y-5 sm:space-y-6 max-w-full">
      <PageHeader
        title="Unified Business Dashboard"
        subtitle="CRM + Sales + Purchase + Inventory + Parties + Accounts + HRMS + Reports + Administration"
        actions={
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <Link
              to="/crm/dashboard"
              className="flex-1 sm:flex-initial text-center justify-center px-3.5 py-2 bg-card border border-border hover:bg-soft text-text rounded-xl text-xs font-semibold shadow-2xs transition"
            >
              CRM Dashboard
            </Link>
            <Link
              to="/crm/leads"
              className="flex-1 sm:flex-initial text-center justify-center px-3.5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              + New Lead
            </Link>
          </div>
        }
      />
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
        {/* [PHASE-1-DASHBOARD] "Total Leads" stat card replaced with ERP Totals */}
        <StatCard label="Quotations" value={fmt(quotations.length)} icon={FileText} tone="blue" trend={`${fmt(deliveryChallans.length)}`} note="challans issued" />
        <StatCard label="Sales Orders" value={fmt(salesOrders.length)} icon={ShoppingCart} tone="green" trend={`${fmt(Math.round(salesTotal / 1000))}k`} note="order value" />
        <StatCard label="Invoices Value" value={`₹${fmt(Math.round(invoiceTotal))}`} icon={Receipt} tone="purple" trend={`${fmt(invoices.length)}`} note="invoices" />
        <StatCard label="Purchase Orders" value={fmt(purchaseOrders.length)} icon={ClipboardList} tone="amber" trend={`${fmt(Math.round(purchaseTotal / 1000))}k`} note="purchase value" />
        <StatCard label="Stock Value" value={`₹${fmt(Math.round(totalStockValue))}`} icon={Package} tone="teal" trend={`${fmt(lowStockItems.length)}`} note="low stock" />
        <StatCard label="Bank Balance" value={`₹${fmt(Math.round(bankBalance))}`} icon={Wallet} tone="blue" trend={`${fmt(paymentInTotal - paymentOutTotal)}`} note="net flow" />
      </div>

      {/* ── [PHASE-4] Sales & Collections Financial Summary (Billed vs Without-Bill Cash) ── */}
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
          <div>
            <h3 className="font-bold text-text text-sm sm:text-base flex items-center gap-2">
              <Receipt size={17} className="text-primary" />
              <span>Sales & Collections Financial Summary</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-muted">
              Distinguishing Billed Sales (GST Invoices) vs Unbilled Cash (Cash Payment Receipts)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/sales/payments"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage Collections</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* 1. Billed Sales */}
          <div className="p-3.5 rounded-xl border border-border bg-soft/70 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">Billed Sales</span>
            <div className="my-1.5">
              <strong className="text-base sm:text-lg font-bold font-mono text-text block">
                ₹{fmt(Math.round(billedSales))}
              </strong>
            </div>
            <span className="text-[11px] text-text-secondary">
              {activeInvoices.length} Tax Invoices booked
            </span>
          </div>

          {/* 2. GST Total */}
          <div className="p-3.5 rounded-xl border border-blue-200/50 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">GST Tax</span>
            <div className="my-1.5">
              <strong className="text-base sm:text-lg font-bold font-mono text-blue-800 dark:text-blue-300 block">
                ₹{fmt(Math.round(gstTotal))}
              </strong>
            </div>
            <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80">
              Taxable: ₹{fmt(Math.round(Math.max(0, billedSales - gstTotal)))}
            </span>
          </div>

          {/* 3. With-Bill Payments */}
          <div className="p-3.5 rounded-xl border border-emerald-200/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">With-Bill Payments</span>
            <div className="my-1.5">
              <strong className="text-base sm:text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300 block">
                ₹{fmt(Math.round(withBillPaymentsTotal))}
              </strong>
            </div>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
              {validWithBillPayments.length} payments allocated
            </span>
          </div>

          {/* 4. Without-Bill Cash */}
          <div className="p-3.5 rounded-xl border border-amber-200/50 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">Without-Bill Cash</span>
            <div className="my-1.5">
              <strong className="text-base sm:text-lg font-bold font-mono text-amber-800 dark:text-amber-300 block">
                ₹{fmt(Math.round(withoutBillCashTotal))}
              </strong>
            </div>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
              {validCashReceipts.length} Cash Receipts (CPR)
            </span>
          </div>

          {/* 5. Total Payments Received */}
          <div className="p-3.5 rounded-xl border border-purple-200/50 bg-purple-50/40 dark:bg-purple-950/20 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">Total Received</span>
            <div className="my-1.5">
              <strong className="text-base sm:text-lg font-bold font-mono text-purple-800 dark:text-purple-300 block">
                ₹{fmt(Math.round(totalPaymentsReceived))}
              </strong>
            </div>
            <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80">
              Billed + Cash desk receipts
            </span>
          </div>

          {/* 6. Outstanding Invoices */}
          <div className="p-3.5 rounded-xl border border-rose-200/50 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">Outstanding Invoices</span>
            <div className="my-1.5">
              <strong className="text-base sm:text-lg font-bold font-mono text-rose-700 dark:text-rose-300 block">
                ₹{fmt(Math.round(totalInvoiceOutstanding))}
              </strong>
            </div>
            <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
              {overdueOrUnpaidCount} open invoices due
            </span>
          </div>
        </div>
      </div>

      {/* All Modules Directory Grid */}
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
          <div>
            <h3 className="font-bold text-text text-sm sm:text-base">All Enterprise Modules</h3>
            <p className="text-[11px] sm:text-xs text-muted">Direct single-click access across all unified modules</p>
          </div>
          <Link to="/reports" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto">
            <span>View Reports</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {modules.map((m) => {
            const Icon = m.icon;
            const style = CARD_STYLES[m.tone] || CARD_STYLES.blue;
            return (
              <Link
                key={m.label}
                to={m.to}
                className="p-3 sm:p-3.5 rounded-xl border border-border bg-soft hover:bg-card hover:border-primary/40 hover:shadow-md transition flex items-center gap-2.5 sm:gap-3 group min-w-0"
              >
                <span
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl grid place-items-center shrink-0 shadow-2xs"
                  style={{ background: style.bg, color: style.fg }}
                >
                  <Icon size={18} className="sm:w-5 sm:h-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <strong className="text-xs sm:text-sm font-bold text-text truncate">{m.label}</strong>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
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
      <div className="dashboard-view">
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {/* ── [PHASE-1-DASHBOARD] was: {dashboardData.stats.map((stat) => {...})} ──
              CRM stat cards (leads/tasks pipeline) replaced with live ERP stats below. */}
          {[
            { label: 'Invoices (PKG)', value: fmt(invoices.length), icon: 'file', tone: 'blue', trend: `${fmt(Math.round(invoiceTotal))}`, note: 'billed value' },
            { label: 'SO Orders', value: fmt(salesOrders.length), icon: 'users', tone: 'green', trend: `${fmt(Math.round(salesTotal))}`, note: 'order value' },
            { label: 'Purchase Bills', value: fmt(purchaseBills.length), icon: 'building', tone: 'amber', trend: `${fmt(Math.round(billTotal))}`, note: 'bill value' },
            { label: 'Payments In', value: fmt(paymentIns.length), icon: 'check', tone: 'purple', trend: `${fmt(Math.round(paymentInTotal))}`, note: 'received' },
            { label: 'Payments Out', value: fmt(paymentOuts.length), icon: 'users', tone: 'teal', trend: `${fmt(Math.round(paymentOutTotal))}`, note: 'paid' },
            { label: 'Expenses', value: fmt(expenses.length), icon: 'bars', tone: 'pink', trend: `${fmt(Math.round(expenseTotal))}`, note: 'mt expense' },
          ].map((stat) => {
            const Icon = ICONS[stat.icon] || Users;
            const style = CARD_STYLES[stat.tone] || CARD_STYLES.blue;
            const TrendIcon = stat.trendDirection === 'down' ? TrendingDown : TrendingUp;
            const trendClass = stat.trendDirection === 'down' ? ' down' : '';
            return (
              <article key={stat.label} className="dashboard-stat">
                <div className="dashboard-stat-top">
                  <span className="dashboard-stat-icon" style={{ background: style.bg, color: style.fg }}>
                    <Icon size={20} className="sm:w-5 sm:h-5" />
                  </span>
                  <div className="dashboard-stat-copy">
                    <strong title={stat.value}>{stat.value}</strong>
                    <span title={stat.label}>{stat.label}</span>
                  </div>
                </div>
                <small className={`dashboard-stat-trend${trendClass}`}>
                  <TrendIcon size={13} className="shrink-0" />
                  <b className="shrink-0">{stat.trend}</b>
                  <em className="truncate">{stat.note}</em>
                </small>
              </article>
            );
          })}
          <article className="dashboard-stat">
            <div className="dashboard-stat-top">
              <span className="dashboard-stat-icon" style={{ background: CARD_STYLES.green.bg, color: CARD_STYLES.green.fg }}>
                <FileText size={20} className="sm:w-5 sm:h-5" />
              </span>
              <div className="dashboard-stat-copy">
                <strong title={fmt(quotations.length)}>{fmt(quotations.length)}</strong>
                <span>Quotations</span>
              </div>
            </div>
            <small className="dashboard-stat-trend">
              <TrendingUp size={13} className="shrink-0" />
              <b className="shrink-0">100%</b>
              <em className="truncate">live count</em>
            </small>
          </article>
          <article className="dashboard-stat">
            <div className="dashboard-stat-top">
              <span className="dashboard-stat-icon" style={{ background: CARD_STYLES.amber.bg, color: CARD_STYLES.amber.fg }}>
                <Boxes size={20} className="sm:w-5 sm:h-5" />
              </span>
              <div className="dashboard-stat-copy">
                <strong title={fmt(items.length)}>{fmt(items.length)}</strong>
                <span>SKUs Live</span>
              </div>
            </div>
            <small className="dashboard-stat-trend">
              <TrendingUp size={13} className="shrink-0" />
              <b className="shrink-0">{fmt(lowStockItems.length)}</b>
              <em className="truncate">need reorder</em>
            </small>
          </article>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6 mt-4 sm:mt-5">
          <section className="xl:col-span-2 bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-text text-sm sm:text-base">Revenue Overview</h3>
                <p className="text-[11px] sm:text-xs text-muted">{overview.headline}</p>
              </div>
              <button type="button" className="dashboard-filter-btn self-start sm:self-auto">{overview.period}</button>
            </div>
            <div className="chart-wrap overflow-hidden">
              <svg viewBox="0 0 620 260" className="chart-svg w-full h-auto max-h-[260px]" aria-label="Invoiced revenue chart">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-[11px] sm:text-xs font-semibold">
              <Link to="/sales/quotes" className="text-center px-2.5 py-2 rounded-xl border border-border bg-soft hover:bg-card text-text shadow-2xs transition truncate">Quotes: {fmt(quotations.length)}</Link>
              <Link to="/sales/invoices" className="text-center px-2.5 py-2 rounded-xl border border-border bg-soft hover:bg-card text-text shadow-2xs transition truncate">Invoices: {fmt(invoices.length)}</Link>
              <Link to="/sales/challans" className="text-center px-2.5 py-2 rounded-xl border border-border bg-soft hover:bg-card text-text shadow-2xs transition truncate">Challans: {fmt(deliveryChallans.length)}</Link>
              <Link to="/sales/orders" className="text-center px-2.5 py-2 rounded-xl border border-border bg-soft hover:bg-card text-text shadow-2xs transition flex items-center justify-center gap-1.5 truncate">
                <Settings size={12} className="text-primary shrink-0" />
                <span className="truncate">Orders: {fmt(salesOrders.length)}</span>
              </Link>
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-text text-sm sm:text-base">Invoice Status</h3>
                <p className="text-[11px] sm:text-xs text-muted">Billing distribution</p>
              </div>
              <Link to="/sales/invoices" className="text-xs font-bold text-primary hover:underline">View All</Link>
            </div>
            <div className="donut-layout py-2">
              <div className="donut-chart">
                <svg viewBox="0 0 220 220" aria-label="Task status donut chart">
                  <circle cx="110" cy="110" r="72" className="donut-track" />
                  {donutSegments.map((item) => (
                    <path key={item.key} d={item.path} stroke={item.color} strokeWidth="22" strokeLinecap="round" fill="none" />
                  ))}
                </svg>
                <div className="donut-center">
                  <strong>{completedPct}%</strong>
                  <span>Paid</span>
                </div>
              </div>
              <div className="donut-legend">
                {/* ── [PHASE-1-DASHBOARD] was: dashboardData.taskStatus.map(...) — now ERP taskStatus ── */}
                {taskStatus.map((item) => (
                  <div key={item.key} className="legend-row">
                    <div className="legend-meta">
                      <span className="legend-dot" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="activity-list mt-4 pt-3 border-t border-border">
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
                      <strong className="truncate">{item.title}</strong>
                      <p className="truncate">{item.person}</p>
                    </div>
                    <time className="shrink-0">{item.time}</time>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Low-Stock Alerts & Snapshots Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
        {/* Left: Low Stock Alerts */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-text text-sm sm:text-base">Low-Stock Alerts</h3>
              <p className="text-[11px] sm:text-xs text-muted">Items below safety reorder threshold</p>
            </div>
            <Link to="/inventory/stock-position" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-thin">
            <table className="w-full min-w-[460px] text-left border-collapse text-xs">
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
                    <td className="py-2.5 sm:py-3 px-3 font-mono font-semibold text-text-secondary whitespace-nowrap">{item.sku}</td>
                    <td className="py-2.5 sm:py-3 px-3 font-semibold text-text max-w-[160px] sm:max-w-none truncate">{item.name}</td>
                    <td className="py-2.5 sm:py-3 px-3 text-center font-bold text-danger font-mono whitespace-nowrap">
                      {item.availableQty}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 text-right whitespace-nowrap">
                      <Link
                        to="/purchase/orders"
                        className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1 bg-primary text-white hover:bg-primary-hover rounded-lg text-[11px] font-semibold shadow-2xs transition"
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs font-semibold">
            <Link to="/inventory/items" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition truncate">
              Items: {fmt(items.length)}
            </Link>
            <Link to="/inventory/transfers" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition truncate">
              Transfers: {fmt(transfers.length)}
            </Link>
            <Link to="/inventory/faulty-parts" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition truncate">
              Faulty: {fmt(openFaulty)}
            </Link>
            <Link to="/inventory/locations" className="px-2.5 py-2 rounded-xl bg-card hover:bg-soft border border-border text-text text-center shadow-2xs transition flex items-center justify-center gap-1 truncate">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">Locations</span>
            </Link>
          </div>
        </div>

        {/* Right: Sales & Purchase Snapshots */}
        <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
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
                  <div key={o.id} className="p-2.5 sm:p-3 rounded-xl border border-border bg-soft/60 hover:bg-soft flex items-center justify-between gap-3 transition">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-bold text-text truncate">{o.orderNumber || o.id}</p>
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
                  <div key={o.id} className="p-2.5 sm:p-3 rounded-xl border border-border bg-soft/60 hover:bg-soft flex items-center justify-between gap-3 transition">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-bold text-text truncate">{o.orderNumber || o.poNumber || o.id}</p>
                      <p className="text-[11px] text-muted truncate">{o.vendor} • ₹{fmt(o.total || o.amount || 0)}</p>
                    </div>
                    <StatusBadge status={o.status || 'Draft'} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2 text-xs font-semibold">
            <Link to="/sales/invoices" className="px-2.5 py-2 rounded-xl bg-primary text-white text-center shadow-2xs hover:bg-primary/90 transition truncate">
              Invoices ₹{fmt(Math.round(invoiceTotal))}
            </Link>
            <Link to="/purchase/bills" className="px-2.5 py-2 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition truncate">
              Bills ₹{fmt(Math.round(billTotal))}
            </Link>
            <Link to="/sales/payments" className="px-2.5 py-2 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition truncate">
              PayIn ₹{fmt(Math.round(paymentInTotal))}
            </Link>
            <Link to="/purchase/payments" className="px-2.5 py-2 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition truncate">
              PayOut ₹{fmt(Math.round(paymentOutTotal))}
            </Link>
            <Link to="/purchase/expenses" className="px-2.5 py-2 rounded-xl bg-soft hover:bg-card border border-border text-text text-center col-span-2 sm:col-span-4 xl:col-span-2 transition text-[11px] sm:text-xs">
              Expenses ₹{fmt(Math.round(expenseTotal))} • Challans {fmt(deliveryChallans.length)} • Returns {fmt(salesReturns.length)}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Parties, Accounts, HRMS + Admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-text text-sm sm:text-base">Parties</h3>
              <p className="text-[11px] sm:text-xs text-muted">Customers + Vendors</p>
            </div>
            <Link to="/parties" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2 text-xs font-semibold">
            <Link to="/crm/customers" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold min-w-0">
                <Users size={14} className="text-primary shrink-0" />
                <span className="truncate">Customers</span>
              </span>
              <strong className="text-text font-mono shrink-0">{fmt(customers.length)}</strong>
            </Link>
            <Link to="/parties" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold min-w-0">
                <Building2 size={14} className="text-primary shrink-0" />
                <span className="truncate">Vendors</span>
              </span>
              <strong className="text-text font-mono shrink-0">{fmt(vendors.length)}</strong>
            </Link>
            <Link to="/parties" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold min-w-0">
                <BriefcaseBusiness size={14} className="text-primary shrink-0" />
                <span className="truncate">All Parties</span>
              </span>
              <strong className="text-text font-mono shrink-0">{fmt(parties.length)}</strong>
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-text text-sm sm:text-base">Accounts</h3>
              <p className="text-[11px] sm:text-xs text-muted">Cash + Ledger + Reports</p>
            </div>
            <Link to="/accounts/cash-bank" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2 text-xs font-semibold">
            <Link to="/accounts/cash-bank" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold text-text min-w-0">
                <Landmark size={14} className="text-primary shrink-0" />
                <span className="truncate">Bank Balance</span>
              </span>
              <strong className="text-text font-mono font-bold shrink-0">₹{fmt(Math.round(bankBalance))}</strong>
            </Link>
            <Link to="/accounts/general-ledger" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold text-text min-w-0">
                <FileText size={14} className="text-primary shrink-0" />
                <span className="truncate">General Ledger</span>
              </span>
              <span className="text-primary text-xs font-bold shrink-0">Open →</span>
            </Link>
            <Link to="/accounts/reports" className="flex items-center justify-between p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text transition">
              <span className="flex items-center gap-2 font-bold text-text min-w-0">
                <PieChart size={14} className="text-primary shrink-0" />
                <span className="truncate">Financial Reports</span>
              </span>
              <span className="text-primary text-xs font-bold shrink-0">View →</span>
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-text text-sm sm:text-base">HRMS + Admin</h3>
              <p className="text-[11px] sm:text-xs text-muted">People + Settings</p>
            </div>
            <Link to="/hrms/dashboard" className="text-xs font-bold text-primary hover:underline">
              HRMS
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-2 text-xs font-semibold">
            <Link to="/hrms/employees" className="p-2 sm:p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition truncate">
              Employees
            </Link>
            <Link to="/hrms/attendance" className="p-2 sm:p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition truncate">
              Attendance
            </Link>
            <Link to="/hrms/leave" className="p-2 sm:p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition truncate">
              Leave
            </Link>
            <Link to="/hrms/payroll" className="p-2 sm:p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition truncate">
              Payroll
            </Link>
            <Link to="/administration/users" className="p-2 sm:p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition truncate">
              Users
            </Link>
            <Link to="/administration/settings" className="p-2 sm:p-2.5 rounded-xl bg-soft hover:bg-card border border-border text-text text-center transition truncate">
              Settings
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold">
            {/* Hidden: User Tracking & Zone Requests out of scope
            <Link to="/crm/user-allocation" className="p-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-center transition flex items-center justify-center gap-1.5 shadow-2xs truncate">
              <ListChecks size={13} className="text-primary shrink-0" />
              <span className="truncate">Allocation</span>
            </Link>
            <Link to="/inventory/zone-requests" className="p-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-center transition flex items-center justify-center gap-1.5 shadow-2xs truncate">
              <span className="truncate">Zone Requests ({pendingZoneReqs})</span>
            </Link>
            */}
            <Link to="/inventory/transfers" className="p-2 rounded-xl border border-border bg-soft hover:bg-card text-text text-center transition flex items-center justify-center gap-1.5 shadow-2xs truncate">
              <ArrowLeftRight size={13} className="text-primary shrink-0" />
              <span className="truncate">Transfers ({pendingTransfers})</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
