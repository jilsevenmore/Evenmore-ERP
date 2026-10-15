import { useState, useMemo, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Printer, Download, TrendingUp, TrendingDown, DollarSign, PieChart, FileText, Calendar, ArrowRight, X } from 'lucide-react';
import { toISODate } from '../../utils/dateUtils';
import { PrintFinancialStatementModal } from '../../components/common/PrintFinancialStatementModal';

// Helper to extract YYYY-MM period from document objects
const getDocMonth = (doc) => {
  if (!doc) return null;
  const raw = doc.docDate || doc.doc_date || doc.date || doc.invoiceDate || doc.expenseDate || doc.expense_date || doc.createdAt || doc.created_at;
  if (!raw) return null;
  if (typeof raw === 'string' && /^\d{4}-\d{2}/.test(raw)) {
    return raw.slice(0, 7);
  }
  const iso = toISODate(raw);
  return iso ? iso.slice(0, 7) : null;
};

export function FinancialReportsPage() {
  const {
    invoices = [],
    purchaseBills = [],
    expenses = [],
    paymentIns = [],
    paymentOuts = [],
    items = [],
    bankAccounts = [],
    journalEntries = [],
    budgets = [],
    getAccountBalances,
    formatCurrency,
    formatDateDDMMYYYY,
  } = useERP();

  const [reportType, setReportType] = useState('pl'); // 'pl' | 'monthly' | 'bs' | 'budget' | 'cashflow'
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' | 'YYYY-MM' (e.g. '2026-10')
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Automatically activate clean printable statement if user triggers browser print (Ctrl+P)
  useEffect(() => {
    const handleBeforePrint = () => setShowPrintModal(true);
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, []);

  // Fiscal year calculations (Indian FY: April 1 to March 31)
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const fyEndYear = fyStartYear + 1;
  const fyLabel = `FY ${fyStartYear}-${String(fyEndYear).slice(-2)}`;

  // Generate standard 12 fiscal months: Apr -> Dec (fyStartYear), Jan -> Mar (fyEndYear)
  const fiscalMonths = useMemo(() => {
    const list = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    // Apr (3) to Dec (11)
    for (let m = 3; m <= 11; m++) {
      const padM = String(m + 1).padStart(2, '0');
      list.push({
        value: `${fyStartYear}-${padM}`,
        label: `${monthNames[m]} ${fyStartYear}`,
        shortLabel: `${monthNames[m].slice(0, 3)} '${String(fyStartYear).slice(-2)}`,
        year: fyStartYear,
        monthIndex: m,
      });
    }
    // Jan (0) to Mar (2)
    for (let m = 0; m <= 2; m++) {
      const padM = String(m + 1).padStart(2, '0');
      list.push({
        value: `${fyEndYear}-${padM}`,
        label: `${monthNames[m]} ${fyEndYear}`,
        shortLabel: `${monthNames[m].slice(0, 3)} '${String(fyEndYear).slice(-2)}`,
        year: fyEndYear,
        monthIndex: m,
      });
    }
    return list;
  }, [fyStartYear, fyEndYear]);

  // Combine fiscal months with any other active document months (past/future)
  const availableMonths = useMemo(() => {
    const monthMap = new Map();
    fiscalMonths.forEach(m => monthMap.set(m.value, m));

    const scanDoc = (doc) => {
      const mKey = getDocMonth(doc);
      if (mKey && !monthMap.has(mKey)) {
        const [y, mStr] = mKey.split('-');
        const mIdx = parseInt(mStr, 10) - 1;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        if (monthNames[mIdx]) {
          monthMap.set(mKey, {
            value: mKey,
            label: `${monthNames[mIdx]} ${y}`,
            shortLabel: `${monthNames[mIdx].slice(0, 3)} '${String(y).slice(-2)}`,
            year: parseInt(y, 10),
            monthIndex: mIdx,
          });
        }
      }
    };
    invoices.forEach(scanDoc);
    expenses.forEach(scanDoc);
    purchaseBills.forEach(scanDoc);

    return Array.from(monthMap.values()).sort((a, b) => a.value.localeCompare(b.value));
  }, [fiscalMonths, invoices, expenses, purchaseBills]);

  // Count active invoices per month for select annotations
  const invoiceCountByMonth = useMemo(() => {
    const counts = {};
    invoices.forEach(i => {
      if (i.status !== 'Cancelled') {
        const m = getDocMonth(i);
        if (m) counts[m] = (counts[m] || 0) + 1;
      }
    });
    return counts;
  }, [invoices]);

  const selectedMonthObj = availableMonths.find(m => m.value === selectedMonth);
  const selectedPeriodLabel = selectedMonth === 'all'
    ? `Full Fiscal Year (${fyLabel})`
    : selectedMonthObj?.label || selectedMonth;

  // Filtered collections based on period selection
  const filteredInvoices = useMemo(() => {
    if (selectedMonth === 'all') return invoices;
    return invoices.filter(i => getDocMonth(i) === selectedMonth);
  }, [invoices, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === 'all') return expenses;
    return expenses.filter(e => getDocMonth(e) === selectedMonth);
  }, [expenses, selectedMonth]);

  const filteredPurchaseBills = useMemo(() => {
    if (selectedMonth === 'all') return purchaseBills;
    return purchaseBills.filter(b => getDocMonth(b) === selectedMonth);
  }, [purchaseBills, selectedMonth]);

  // Financial calculations for the selected period
  const totalRevenue = useMemo(() => {
    return filteredInvoices
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, i) => sum + (Number(i.grandTotal) || Number(i.total) || 0), 0);
  }, [filteredInvoices]);

  const totalCOGS = useMemo(() => {
    // COGS = cost of SOLD items from finalized invoices (qty × item costPrice)
    return filteredInvoices
      .filter(i => i.status !== 'Cancelled' && i.finalized !== false && i.status !== 'Draft')
      .reduce((sum, inv) => {
        const invLines = inv.items || inv.lineItems || [];
        const lineCost = invLines.reduce((s, line) => s + (Number(line.qty || 0) * (Number(line.costPrice ?? line.unitCost) || 0)), 0);
        return sum + lineCost;
      }, 0) || 0;
  }, [filteredInvoices]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const grossProfit = totalRevenue - totalCOGS;
  const netIncome = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0.0';

  const activeInvoiceCount = filteredInvoices.filter(i => i.status !== 'Cancelled').length;

  // ── Balance Sheet calculation (for headline KPIs & Balance Sheet tab) ──
  const { arBalance, apBalance, invBalance, advGivenBalance } = useMemo(() => {
    const ar = invoices.filter((i) => i.status !== 'Cancelled').reduce((s, i) => s + (Number(i.balanceDue ?? ((Number(i.grandTotal || i.total || 0)) - (Number(i.paidAmount ?? i.amountPaid) || 0))) || 0), 0);
    const ap = purchaseBills.filter((b) => b.status !== 'Cancelled').reduce((s, b) => s + (Number(b.balanceDue ?? ((Number(b.total || b.amount || 0)) - (Number(b.paidAmount ?? b.amountPaid) || 0))) || 0), 0);
    const inv = items.filter((it) => it.itemKind !== 'Service').reduce((s, it) => {
      const stock = it.availableQty ?? 0;
      return s + stock * (Number(it.costPrice) || 0);
    }, 0);
    const adv = paymentIns.filter((p) => p.status !== 'Cancelled' && String(p.type || '').toLowerCase() === 'advance').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    return { arBalance: ar, apBalance: ap, invBalance: inv, advGivenBalance: adv };
  }, [invoices, purchaseBills, items, paymentIns]);

  const bankTotal = bankAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
  const totalAssets = bankTotal + arBalance + invBalance;
  const totalLiabilities = apBalance + advGivenBalance;
  const netWorth = totalAssets - totalLiabilities;
  const equityBase = Math.max(0, totalAssets - totalLiabilities - netIncome);

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: 'dollar', tone: 'blue', trend: `${activeInvoiceCount} invoice${activeInvoiceCount === 1 ? '' : 's'}` },
    { label: 'Cost of Goods', value: formatCurrency(totalCOGS), icon: 'cart', tone: 'amber' },
    { label: 'Operating Expenses', value: formatCurrency(totalExpenses), icon: 'file', tone: 'pink' },
    { label: 'Net Profit', value: formatCurrency(netIncome), icon: 'chart', tone: netIncome >= 0 ? 'green' : 'pink', trend: `${profitMargin}% margin` },
    { label: 'Total Assets', value: formatCurrency(totalAssets), icon: 'package', tone: 'purple', note: `${bankAccounts.length} accts · ${formatCurrency(bankTotal)}` },
    { label: 'Net Worth (A − L)', value: formatCurrency(netWorth), icon: 'bars', tone: netWorth >= 0 ? 'teal' : 'pink', note: `Liabilities: ${formatCurrency(totalLiabilities)}` },
  ];

  const plRows = [
    { category: 'Operating Revenue', item: 'Gross Sales & Services', amount: totalRevenue, type: 'revenue' },
    { category: 'Cost of Goods Sold', item: 'Procurement & Inventory Costs', amount: -totalCOGS, type: 'cogs' },
    { category: 'Gross Profit', item: 'Revenue minus COGS', amount: grossProfit, type: 'summary' },
    { category: 'Operating Expenses', item: 'General, Administrative, Utilities', amount: -totalExpenses, type: 'expense' },
    { category: 'Net Income', item: 'Operating Profit Before Taxes', amount: netIncome, type: 'net' },
  ];

  const plColumns = [
    {
      key: 'category',
      label: 'Category',
      width: '30%',
      render: (val, row) => (
        <strong style={{ color: row.type === 'net' ? '#1f6bff' : row.type === 'summary' ? '#0f172a' : '#334155' }}>
          {val}
        </strong>
      ),
    },
    {
      key: 'item',
      label: 'Description',
      width: '45%',
      render: (val) => <span style={{ color: '#64748b' }}>{val}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      width: '25%',
      render: (val, row) => (
        <span
          style={{
            fontWeight: row.type === 'net' || row.type === 'summary' ? 800 : 600,
            color: val > 0 ? '#1bb878' : val < 0 ? '#ef4444' : '#64748b',
            fontSize: row.type === 'net' ? 15 : 13,
          }}
        >
          {val < 0 ? `-${formatCurrency(Math.abs(val))}` : formatCurrency(val)}
        </span>
      ),
    },
  ];

  // ── Month-by-Month Financial Performance Grid ──
  const monthlyBreakdown = useMemo(() => {
    return availableMonths.map((m) => {
      const mInvs = invoices.filter((i) => i.status !== 'Cancelled' && getDocMonth(i) === m.value);
      const mRevenue = mInvs.reduce((sum, i) => sum + (Number(i.grandTotal) || Number(i.total) || 0), 0);
      const mCOGS = mInvs
        .filter((i) => i.finalized !== false && i.status !== 'Draft')
        .reduce((sum, inv) => {
          const invLines = inv.items || inv.lineItems || [];
          return sum + invLines.reduce((s, line) => s + (Number(line.qty || 0) * (Number(line.costPrice ?? line.unitCost) || 0)), 0);
        }, 0);
      const mExp = expenses
        .filter((e) => getDocMonth(e) === m.value)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const mGross = mRevenue - mCOGS;
      const mNet = mGross - mExp;
      const mMargin = mRevenue > 0 ? ((mNet / mRevenue) * 100).toFixed(1) : '0.0';

      return {
        key: m.value,
        label: m.label,
        shortLabel: m.shortLabel,
        invoiceCount: mInvs.length,
        revenue: mRevenue,
        cogs: mCOGS,
        grossProfit: mGross,
        expenses: mExp,
        netIncome: mNet,
        margin: mMargin,
      };
    });
  }, [availableMonths, invoices, expenses]);

  const breakdownTotals = useMemo(() => {
    const totalInvs = monthlyBreakdown.reduce((s, r) => s + r.invoiceCount, 0);
    const totalRev = monthlyBreakdown.reduce((s, r) => s + r.revenue, 0);
    const totalCogs = monthlyBreakdown.reduce((s, r) => s + r.cogs, 0);
    const totalGross = totalRev - totalCogs;
    const totalExp = monthlyBreakdown.reduce((s, r) => s + r.expenses, 0);
    const totalNet = totalGross - totalExp;
    const totalMargin = totalRev > 0 ? ((totalNet / totalRev) * 100).toFixed(1) : '0.0';
    return {
      invoiceCount: totalInvs,
      revenue: totalRev,
      cogs: totalCogs,
      grossProfit: totalGross,
      expenses: totalExp,
      netIncome: totalNet,
      margin: totalMargin,
    };
  }, [monthlyBreakdown]);

  // ── Balance Sheet Table Rows ──
  const bsAssets = [
    { section: 'Current Assets', account: 'Cash & Bank', amount: bankTotal },
    { section: 'Current Assets', account: 'Accounts Receivable', amount: arBalance },
    { section: 'Current Assets', account: 'Inventory (at Cost)', amount: invBalance },
    { section: 'Current Assets', account: 'Vendor Advances (Receivable)', amount: advGivenBalance },
    { section: '', account: 'Total Assets', amount: totalAssets, isTotal: true },
  ];
  const bsLiabilities = [
    { section: 'Current Liabilities', account: 'Accounts Payable', amount: apBalance },
    { section: 'Current Liabilities', account: 'GST Payable (Liability)', amount: 0 },
    { section: '', account: 'Total Liabilities', amount: totalLiabilities, isTotal: true },
  ];
  const bsEquity = [
    { section: "Owners' Equity", account: 'Retained Earnings (Plug)', amount: equityBase },
    { section: "Owners' Equity", account: 'Current Year P&L', amount: netIncome },
    { section: '', account: "Total Equity (A − L)", amount: totalAssets - totalLiabilities, isTotal: true },
  ];

  // ── Budget vs Variance computation ──
  const budgetRows = useMemo(() => {
    const expenseTotalByAccount = {};
    expenses.forEach((e) => {
      const acct = e.category || e.account || 'General';
      expenseTotalByAccount[acct] = (expenseTotalByAccount[acct] || 0) + (Number(e.amount) || 0);
    });
    const rawMatCost = totalCOGS;
    if (rawMatCost > 0) expenseTotalByAccount['COGS'] = (expenseTotalByAccount['COGS'] || 0) + rawMatCost;
    const Freight = expenses.filter((e) => (e.category || '').toLowerCase().includes('freight') || (e.description || '').toLowerCase().includes('freight')).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    if (Freight > 0) expenseTotalByAccount['Logistics'] = (expenseTotalByAccount['Logistics'] || 0) + Freight;
    return budgets.filter((b) => b.active !== false).map((b) => {
      const actual = expenseTotalByAccount[b.category] || expenseTotalByAccount[b.name] || 0;
      const budgetAmt = Number(b.annualAmount) || 0;
      const variance = budgetAmt - actual;
      const utilization = budgetAmt > 0 ? ((actual / budgetAmt) * 100).toFixed(1) : '—';
      return {
        id: b.id,
        name: b.name,
        budget: budgetAmt,
        actual,
        variance,
        utilization,
        isOver: variance < 0,
      };
    });
  }, [budgets, expenses, totalCOGS]);

  // ── CSV Export Function ──
  const exportToCSV = (filename, headers, rows) => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    let headers, rows, title;
    const periodSuffix = selectedMonth === 'all' ? fyLabel : selectedMonth;

    if (reportType === 'monthly') {
      headers = ['Month', 'Invoices', 'Revenue', 'Cost of Goods', 'Gross Profit', 'Expenses', 'Net Profit', 'Margin %'];
      rows = monthlyBreakdown.map((r) => [r.label, r.invoiceCount, r.revenue, r.cogs, r.grossProfit, r.expenses, r.netIncome, `${r.margin}%`]);
      rows.push(['TOTAL', breakdownTotals.invoiceCount, breakdownTotals.revenue, breakdownTotals.cogs, breakdownTotals.grossProfit, breakdownTotals.expenses, breakdownTotals.netIncome, `${breakdownTotals.margin}%`]);
      title = `Monthly_Breakdown_${fyLabel}`;
    } else if (reportType === 'pl') {
      headers = ['Category', 'Description', 'Amount'];
      rows = plRows.map((r) => [r.category, r.item, r.amount]);
      title = `Profit_and_Loss_${periodSuffix}`;
    } else if (reportType === 'bs') {
      headers = ['Section', 'Account', 'Balance'];
      rows = [...bsAssets, ...bsLiabilities, ...bsEquity].map((r) => [r.section, r.account, r.amount]);
      title = `Balance_Sheet_${periodSuffix}`;
    } else if (reportType === 'budget') {
      headers = ['Category', 'Budget (Annual)', 'Actual (YTD)', 'Variance', 'Utilization %'];
      rows = budgetRows.map((r) => [r.name, r.budget, r.actual, r.variance, r.utilization]);
      title = `Budget_vs_Variance_${fyLabel}`;
    } else {
      headers = ['Invoice #', 'Customer', 'Date', 'Total', 'Status'];
      rows = filteredInvoices.map((i) => [
        i.invoiceNumber || i.invoice_number || '—',
        i.customerName || i.customer || '—',
        formatDateDDMMYYYY(i.date || i.docDate || i.doc_date || i.createdAt),
        Number(i.grandTotal ?? i.total ?? 0) || 0,
        i.status || '—',
      ]);
      title = `Invoice_Breakdown_${periodSuffix}`;
    }
    exportToCSV(`Financial_${title}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="no-print">
        <PageHeader
          title="Financial Reports"
          subtitle="Consolidated Profit & Loss, Balance Sheet, Cash Flow metrics, and monthly financial summaries."
          breadcrumb={[{ label: 'Accounts', to: '/accounts/cash-bank' }, { label: 'Reports' }]}
          actions={
            <div className="flex-wrap lg:flex-nowrap" style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={() => setShowPrintModal(true)}>
                <Printer size={15} /> Download PDF / Print
              </button>
              <button type="button" className="btn-primary" onClick={() => handleExport()}>
                <Download size={15} /> Export {
                  reportType === 'pl' ? 'P&L' :
                  reportType === 'monthly' ? 'Monthly' :
                  reportType === 'bs' ? 'Balance Sheet' :
                  reportType === 'budget' ? 'Budget' : 'Invoices'
                } CSV
              </button>
            </div>
          }
        />
      </div>

      {/* ── Period & Month Filter Control Bar ── */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
            <Calendar size={15} className="text-primary" />
            <span>Reporting Period:</span>
          </div>

          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-medium bg-card-hover border border-border rounded-lg px-2.5 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-7"
            >
              <option value="all">Full Fiscal Year ({fyLabel}) · All Months</option>
              <optgroup label="Fiscal Year Months">
                {availableMonths.map((m) => {
                  const count = invoiceCountByMonth[m.value] || 0;
                  const isCurrent = m.value === currentMonthKey;
                  return (
                    <option key={m.value} value={m.value}>
                      {m.label} {isCurrent ? '★ (Current)' : ''} {count > 0 ? `— ${count} invoice${count === 1 ? '' : 's'}` : ''}
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedMonth('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                selectedMonth === 'all'
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-card text-muted hover:text-text hover:bg-card-hover'
              }`}
            >
              All Months
            </button>
            <button
              type="button"
              onClick={() => setSelectedMonth(currentMonthKey)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                selectedMonth === currentMonthKey
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-card text-muted hover:text-text hover:bg-card-hover'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {selectedMonth !== 'all' ? (
            <div className="flex items-center gap-1.5 bg-primary-subtle text-primary border border-primary/20 px-2.5 py-1 rounded-lg font-semibold">
              <span>Filtered: {selectedPeriodLabel}</span>
              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                title="Reset to full fiscal year"
                className="hover:opacity-75 cursor-pointer ml-1 text-primary inline-flex items-center"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <span className="text-muted">Showing cumulative {fyLabel}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 no-print">
        {stats.map(s => <StatCard key={s.label} stat={s} />)}
      </div>

      <div className="card bg-card rounded-xl border border-border p-4 sm:p-5 shadow-xs no-print">
        <div className="flex flex-wrap lg:flex-nowrap gap-3 lg:gap-0 justify-between items-center mb-5 border-b border-border pb-3">
          <div className="no-print flex gap-2 flex-wrap">
            {[
              { id: 'pl', label: 'Profit & Loss' },
              { id: 'monthly', label: 'Monthly Breakdown' },
              { id: 'bs', label: 'Balance Sheet' },
              { id: 'budget', label: 'Budget vs Variance' },
              { id: 'cashflow', label: 'Invoice Breakdown' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition shadow-2xs cursor-pointer ${
                  reportType === tab.id
                    ? 'border-primary bg-primary-subtle text-primary'
                    : 'border-border bg-card text-muted hover:text-text hover:bg-card-hover'
                }`}
                onClick={() => setReportType(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted font-medium">Period: {selectedPeriodLabel}</span>
        </div>

        {/* ── Tab 1: Profit & Loss (Filtered by month or Full FY) ── */}
        {reportType === 'pl' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                    Income Statement Summary {selectedMonth !== 'all' ? `— ${selectedPeriodLabel}` : ''}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                    {selectedMonth !== 'all'
                      ? `Calculated in real-time from recorded sales invoices and purchase bills for ${selectedPeriodLabel}.`
                      : 'All amounts calculated in real-time from recorded sales invoices and purchase bills across the full fiscal year.'}
                  </p>
                </div>
                {selectedMonth !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedMonth('all')}
                    className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Switch to Full Year P&L
                  </button>
                )}
              </div>
            </div>
            <DataTable columns={plColumns} data={plRows} rowKey="category" emptyMessage="No financial entries available for this period." />
          </div>
        )}

        {/* ── Tab 2: Monthly Breakdown (Comprehensive 12-Month Progression) ── */}
        {reportType === 'monthly' && (
          <div>
            <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="font-bold text-base text-text">Month-by-Month Financial Performance ({fyLabel})</h3>
                <p className="text-xs text-muted mt-1">
                  Monthly progression of revenue, procurement/COGS, operating overheads, and net profitability.
                </p>
              </div>
              <div className="text-xs text-muted bg-card-hover px-2.5 py-1 rounded-lg border border-border">
                12-Month Fiscal Progression
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs text-text" style={{ minWidth: 720 }}>
                <thead className="bg-table-head uppercase font-semibold text-text-secondary tracking-wider border-b border-border text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Month</th>
                    <th className="py-2.5 px-3 text-center">Invoices</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right">COGS</th>
                    <th className="py-2.5 px-3 text-right">Gross Profit</th>
                    <th className="py-2.5 px-3 text-right">Expenses</th>
                    <th className="py-2.5 px-3 text-right">Net Profit</th>
                    <th className="py-2.5 px-3 text-right">Margin %</th>
                    <th className="py-2.5 px-3 text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {monthlyBreakdown.map((r) => {
                    const isSelected = selectedMonth === r.key;
                    const isCurrent = r.key === currentMonthKey;
                    return (
                      <tr
                        key={r.key}
                        className={`hover:bg-table-row-hover transition-colors ${
                          isSelected ? 'bg-primary-subtle/40 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-text">{r.label}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                Current
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded">
                                Active Filter
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {r.invoiceCount > 0 ? (
                            <span className="font-bold text-text">{r.invoiceCount}</span>
                          ) : (
                            <span className="text-muted">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-text">
                          {formatCurrency(r.revenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted">
                          {formatCurrency(r.cogs)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-text">
                          {formatCurrency(r.grossProfit)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted">
                          {formatCurrency(r.expenses)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            r.netIncome > 0
                              ? 'text-emerald-600'
                              : r.netIncome < 0
                              ? 'text-rose-600'
                              : 'text-muted'
                          }`}
                        >
                          {r.netIncome < 0 ? `-${formatCurrency(Math.abs(r.netIncome))}` : formatCurrency(r.netIncome)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-text">
                          {r.revenue > 0 ? `${r.margin}%` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMonth(r.key);
                              setReportType('pl');
                            }}
                            className="text-xs text-primary hover:text-primary-hover font-semibold px-2 py-1 rounded hover:bg-card-hover inline-flex items-center gap-1 cursor-pointer transition"
                            title={`Filter entire report to ${r.label}`}
                          >
                            <span>View P&L</span>
                            <ArrowRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-table-head/70 font-bold border-t-2 border-border text-xs">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-text uppercase tracking-wider">
                      Total ({fyLabel})
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-text">
                      {breakdownTotals.invoiceCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-text">
                      {formatCurrency(breakdownTotals.revenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-muted">
                      {formatCurrency(breakdownTotals.cogs)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-text">
                      {formatCurrency(breakdownTotals.grossProfit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-muted">
                      {formatCurrency(breakdownTotals.expenses)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-bold ${
                        breakdownTotals.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {breakdownTotals.netIncome < 0
                        ? `-${formatCurrency(Math.abs(breakdownTotals.netIncome))}`
                        : formatCurrency(breakdownTotals.netIncome)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-text">
                      {breakdownTotals.margin}%
                    </td>
                    <td className="py-2.5 px-3 text-center no-print text-[11px] text-muted">
                      Full Year
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab 3: Balance Sheet ── */}
        {reportType === 'bs' && (
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-base text-text">Balance Sheet (as of today)</h3>
              <p className="text-xs text-muted mt-1">Derived from bank accounts, outstanding invoices/bills, inventory at cost, and journal entry equity.</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs text-text" style={{ minWidth: 540 }}>
                <thead className="bg-table-head uppercase font-semibold text-text-secondary tracking-wider border-b border-border text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Section</th>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr><td colSpan={3} className="py-2 px-3 bg-blue-50/70 font-bold text-blue-700 text-[11px] uppercase tracking-wider">Assets</td></tr>
                  {bsAssets.map((r, i) => (
                    <tr key={`a-${i}`} className={r.isTotal ? 'bg-blue-50/40 font-bold border-t-2 border-blue-200' : 'hover:bg-table-row-hover transition-colors'}>
                      <td className="py-2 px-3">{r.section}</td>
                      <td className="py-2 px-3 font-semibold text-text">{r.account}</td>
                      <td className="py-2 px-3 text-right font-mono text-text font-bold">{formatCurrency(r.amount)}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={3} className="py-2 px-3 bg-rose-50/70 font-bold text-rose-700 text-[11px] uppercase tracking-wider">Liabilities</td></tr>
                  {bsLiabilities.map((r, i) => (
                    <tr key={`l-${i}`} className={r.isTotal ? 'bg-rose-50/40 font-bold border-t-2 border-rose-200' : 'hover:bg-table-row-hover transition-colors'}>
                      <td className="py-2 px-3">{r.section}</td>
                      <td className="py-2 px-3 font-semibold text-text">{r.account}</td>
                      <td className="py-2 px-3 text-right font-mono text-text font-bold">{formatCurrency(r.amount)}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={3} className="py-2 px-3 bg-emerald-50/70 font-bold text-emerald-700 text-[11px] uppercase tracking-wider">Owners' Equity</td></tr>
                  {bsEquity.map((r, i) => (
                    <tr key={`e-${i}`} className={r.isTotal ? 'bg-emerald-50/40 font-bold border-t-2 border-emerald-200' : 'hover:bg-table-row-hover transition-colors'}>
                      <td className="py-2 px-3">{r.section}</td>
                      <td className="py-2 px-3 font-semibold text-text">{r.account}</td>
                      <td className="py-2 px-3 text-right font-mono text-text font-bold">{formatCurrency(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab 4: Budget vs Variance ── */}
        {reportType === 'budget' && (
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-base text-text">Budget vs Actual ({fyLabel})</h3>
              <p className="text-xs text-muted mt-1">Annual budgets compared against actual expenses and COGS derived from live transactions. Over-budget lines are flagged.</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs text-text" style={{ minWidth: 600 }}>
                <thead className="bg-table-head uppercase font-semibold text-text-secondary tracking-wider border-b border-border text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Budget (Annual)</th>
                    <th className="py-2.5 px-3 text-right">Actual YTD</th>
                    <th className="py-2.5 px-3 text-right">Variance</th>
                    <th className="py-2.5 px-3 text-right">Utilization</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {budgetRows.length === 0 && (
                    <tr><td colSpan={6} className="py-6 px-3 text-center text-slate-500">No budgets configured yet.</td></tr>
                  )}
                  {budgetRows.map((r) => (
                    <tr key={r.id} className={`hover:bg-table-row-hover transition-colors ${r.isOver ? 'bg-rose-50/30' : ''}`}>
                      <td className="py-2.5 px-3 font-semibold text-text">{r.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-text-secondary">{formatCurrency(r.budget)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-text">{formatCurrency(r.actual)}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${r.isOver ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {r.variance < 0 ? '−' : '+'}{formatCurrency(Math.abs(r.variance))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted">{r.utilization === '—' ? '—' : `${r.utilization}%`}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${r.isOver ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                          {r.isOver ? 'Over Budget' : 'Within Budget'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-muted italic">Budgets are annual and static; variance is computed against total expenses + COGS recorded so far in {fyLabel}.</p>
          </div>
        )}

        {/* ── Tab 5: Invoice Breakdown ── */}
        {reportType === 'cashflow' && (
          <div>
            <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="font-bold text-base text-text">Sales Invoices Ledger</h3>
                <p className="text-xs text-muted mt-1">
                  Individual invoice contributions to operating revenue ({selectedPeriodLabel}).
                </p>
              </div>
              <span className="text-xs font-semibold text-muted bg-card-hover px-2.5 py-1 rounded-lg border border-border">
                {filteredInvoices.length} invoice{filteredInvoices.length === 1 ? '' : 's'}
              </span>
            </div>
            <DataTable
              columns={[
                { key: 'invoiceNumber', label: 'Invoice #', render: (v, row) => v || row.invoice_number || '—' },
                { key: 'customerName', label: 'Customer', render: (v, row) => v || row.customer || '—' },
                { key: 'date', label: 'Date', render: (v, row) => formatDateDDMMYYYY(v || row.docDate || row.doc_date || row.createdAt) },
                { key: 'grandTotal', label: 'Total', render: (v, row) => formatCurrency(Number(v ?? row.total ?? 0) || 0) },
                { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
              ]}
              data={filteredInvoices}
              rowKey="id"
              emptyMessage={`No invoices found for ${selectedPeriodLabel}.`}
            />
          </div>
        )}
      </div>

      {/* ── Official Financial Statement PDF Preview & Print Modal ── */}
      <PrintFinancialStatementModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        reportType={reportType}
        selectedPeriodLabel={selectedPeriodLabel}
        stats={{
          totalRevenue,
          totalCOGS,
          grossProfit,
          totalExpenses,
          netIncome,
          profitMargin,
          activeInvoiceCount,
        }}
        plRows={plRows}
        monthlyBreakdown={monthlyBreakdown}
        breakdownTotals={breakdownTotals}
        bsAssets={bsAssets}
        bsLiabilities={bsLiabilities}
        bsEquity={bsEquity}
        filteredInvoices={filteredInvoices}
        fyLabel={fyLabel}
      />
    </div>
  );
}

export default FinancialReportsPage;
