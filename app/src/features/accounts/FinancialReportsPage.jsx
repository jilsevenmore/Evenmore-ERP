import { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Printer, Download, TrendingUp, TrendingDown, DollarSign, PieChart, FileText } from 'lucide-react';

export function FinancialReportsPage() {
  const { invoices = [], purchaseBills = [], expenses = [], paymentIns = [], paymentOuts = [], items = [], bankAccounts = [], journalEntries = [], budgets = [], getAccountBalances, formatCurrency, formatDateDDMMYYYY } = useERP();
  const [reportType, setReportType] = useState('pl'); // 'pl' | 'cashflow' | 'bs' | 'budget'

  // Calculate financials
  const totalRevenue = useMemo(() => {
    return invoices
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, i) => sum + (Number(i.grandTotal) || Number(i.total) || 0), 0);
  }, [invoices]);

  const totalCOGS = useMemo(() => {
    // COGS = cost of SOLD items from finalized invoices (qty × item costPrice), not procurement spend
    return invoices
      .filter(i => i.status !== 'Cancelled' && i.finalized !== false && i.status !== 'Draft')
      .reduce((sum, inv) => {
        const invLines = inv.items || inv.lineItems || [];
        const lineCost = invLines.reduce((s, line) => s + (Number(line.qty || 0) * (Number(line.costPrice ?? line.unitCost) || 0)), 0);
        return sum + lineCost;
      }, 0) || 0;
  }, [invoices]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const grossProfit = totalRevenue - totalCOGS;
  const netIncome = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0.0';

  const activeInvoiceCount = invoices.filter(i => i.status !== 'Cancelled').length;
  const fyStartYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const fyLabel = `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: 'dollar', tone: 'blue', trend: `${activeInvoiceCount} invoice${activeInvoiceCount === 1 ? '' : 's'}` },
    { label: 'Cost of Goods', value: formatCurrency(totalCOGS), icon: 'cart', tone: 'amber' },
    { label: 'Operating Expenses', value: formatCurrency(totalExpenses), icon: 'file', tone: 'pink' },
    { label: 'Net Profit', value: formatCurrency(netIncome), icon: 'chart', tone: netIncome >= 0 ? 'green' : 'pink', trend: `${profitMargin}% margin` },
  ];

  const plRows = [
    { category: 'Operating Revenue', item: 'Gross Sales & Services', amount: totalRevenue, type: 'revenue' },
    { category: 'Cost of Goods Sold', item: 'Procurement & Inventory Costs', amount: -totalCOGS, type: 'cogs' },
    { category: 'Gross Profit', item: 'Revenue minus COGS', amount: grossProfit, type: 'summary' },
    { category: 'Operating Expenses', item: 'General, Administrative, Utilities', amount: -totalExpenses, type: 'expense' },
    { category: 'Net Income', item: 'Operating Profit Before Taxes', amount: netIncome, type: 'net' },
  ];

  const plColumns = [
    { key: 'category', label: 'Category', render: (val, row) => (
      <strong style={{ color: row.type === 'net' ? '#1f6bff' : row.type === 'summary' ? '#0f172a' : '#334155' }}>
        {val}
      </strong>
    )},
    { key: 'item', label: 'Description', render: (val) => <span style={{ color: '#64748b' }}>{val}</span> },
    { key: 'amount', label: 'Amount', render: (val, row) => (
      <span style={{
        fontWeight: row.type === 'net' || row.type === 'summary' ? 800 : 600,
        color: val > 0 ? '#1bb878' : val < 0 ? '#ef4444' : '#64748b',
        fontSize: row.type === 'net' ? 15 : 13,
      }}>
        {val < 0 ? `-${formatCurrency(Math.abs(val))}` : formatCurrency(val)}
      </span>
    )},
  ];

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
    if (reportType === 'pl') {
      headers = ['Category', 'Description', 'Amount'];
      rows = plRows.map((r) => [r.category, r.item, r.amount]);
      title = 'Profit_and_Loss';
    } else if (reportType === 'bs') {
      headers = ['Section', 'Account', 'Balance'];
      rows = [...bsAssets, ...bsLiabilities, ...bsEquity].map((r) => [r.section, r.account, r.amount]);
      title = 'Balance_Sheet';
    } else if (reportType === 'budget') {
      headers = ['Category', 'Budget (Annual)', 'Actual (YTD)', 'Variance', 'Utilization %'];
      rows = budgetRows.map((r) => [r.name, r.budget, r.actual, r.variance, r.utilization]);
      title = 'Budget_vs_Variance';
    } else {
      headers = ['Category', 'Description', 'Amount'];
      rows = plRows.map((r) => [r.category, r.item, r.amount]);
      title = 'Invoice_Breakdown';
    }
    exportToCSV(`Financial_${title}_${new Date().toISOString().slice(0,10)}`, headers, rows);
  };

  // ── [PHASE-2E] Balance Sheet computation (from journal entries + live bank + invoices) ──
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
  const equityBase = Math.max(0, totalAssets - totalLiabilities - netIncome); // balancing plug

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

  // ── [PHASE-2E] Budget vs Variance (annual budgets vs actual expenses + COGS) ──
  const budgetRows = useMemo(() => {
    const expenseTotalByAccount = {};
    expenses.forEach((e) => {
      const acct = e.category || e.account || 'General';
      expenseTotalByAccount[acct] = (expenseTotalByAccount[acct] || 0) + (Number(e.amount) || 0);
    });
    // Map COGS (from finalized invoice lines) to budget categories
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

  return (
    <div className="feature-page printable-document py-4 sm:py-6 px-0 sm:px-8">
      <PageHeader
        title="Financial Reports"
        subtitle="Consolidated Profit & Loss, Balance Sheet, and Cash Flow metrics."
        breadcrumb={[{ label: 'Accounts', to: '/accounts/cash-bank' }, { label: 'Reports' }]}
        actions={
          <div className="flex-wrap lg:flex-nowrap" style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-outline" onClick={() => window.print()}>
              <Printer size={15} /> Print Statement
            </button>
            <button type="button" className="btn-primary" onClick={() => handleExport()}>
              <Download size={15} /> Export {reportType === 'pl' ? 'P&L' : reportType === 'bs' ? 'Balance Sheet' : reportType === 'budget' ? 'Budget' : 'Report'} CSV
            </button>
          </div>
        }
      />

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '20px 0 24px' }}>
        {stats.map(s => <StatCard key={s.label} stat={s} />)}
        {/* [PHASE-2E] balance sheet headline KPIs */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-1 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Assets</span>
          <span className="text-lg font-mono font-bold text-[#1F2E4A]">{formatCurrency(totalAssets)}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">{bankAccounts.length} bank accts · {formatCurrency(bankTotal)} cash</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-1 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Net Worth (A − L)</span>
          <span className="text-lg font-mono font-bold text-emerald-700">{formatCurrency(totalAssets - totalLiabilities)}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Liabilities: {formatCurrency(totalLiabilities)} · Equity: {formatCurrency(totalAssets - totalLiabilities)}</span>
        </div>
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
        <div className="flex-wrap lg:flex-nowrap gap-3 lg:gap-0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'pl', label: 'Profit & Loss' },
              { id: 'bs', label: 'Balance Sheet' },
              { id: 'budget', label: 'Budget vs Variance' },
              { id: 'cashflow', label: 'Invoice Breakdown' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`tab-btn ${reportType === tab.id ? 'active' : ''}`}
                onClick={() => setReportType(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: reportType === tab.id ? '#1f6bff' : '#e2e8f0',
                  background: reportType === tab.id ? '#f0f6ff' : '#ffffff',
                  color: reportType === tab.id ? '#1f6bff' : '#64748b',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: '#64748b' }}>Period: Current Fiscal Year ({fyLabel})</span>
        </div>

        {reportType === 'pl' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Income Statement Summary</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>All amounts calculated in real-time from recorded sales invoices and purchase bills.</p>
            </div>
            <DataTable columns={plColumns} data={plRows} rowKey="category" emptyMessage="No financial entries available." />
          </div>
        )}

        {/* [PHASE-2E] Balance Sheet — computed from live bank + AR + AP + inventory */}
        {reportType === 'bs' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Balance Sheet (as of today)</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Derived from bank accounts, outstanding invoices/bills, inventory at cost, and journal entry equity.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: 540 }}>
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Section</th>
                    <th className="py-2 px-3">Account</th>
                    <th className="py-2 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={3} className="py-2 px-3 bg-blue-50 font-bold text-blue-800 text-[11px] uppercase tracking-wider">Assets</td></tr>
                  {bsAssets.map((r, i) => (
                    <tr key={`a-${i}`} className={r.isTotal ? 'bg-blue-50/60 font-bold border-t-2 border-blue-200' : 'hover:bg-slate-50'}>
                      <td className="py-1.5 px-3">{r.section}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{r.account}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-900" style={{ fontWeight: r.isTotal ? 800 : 500 }}>{formatCurrency(r.amount)}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={3} className="py-2 px-3 bg-rose-50 font-bold text-rose-800 text-[11px] uppercase tracking-wider">Liabilities</td></tr>
                  {bsLiabilities.map((r, i) => (
                    <tr key={`l-${i}`} className={r.isTotal ? 'bg-rose-50/60 font-bold border-t-2 border-rose-200' : 'hover:bg-slate-50'}>
                      <td className="py-1.5 px-3">{r.section}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{r.account}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-900" style={{ fontWeight: r.isTotal ? 800 : 500 }}>{formatCurrency(r.amount)}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={3} className="py-2 px-3 bg-emerald-50 font-bold text-emerald-800 text-[11px] uppercase tracking-wider">Owners' Equity</td></tr>
                  {bsEquity.map((r, i) => (
                    <tr key={`e-${i}`} className={r.isTotal ? 'bg-emerald-50/60 font-bold border-t-2 border-emerald-200' : 'hover:bg-slate-50'}>
                      <td className="py-1.5 px-3">{r.section}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{r.account}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-900" style={{ fontWeight: r.isTotal ? 800 : 500 }}>{formatCurrency(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* [PHASE-2E] Budget vs Variance — annual budgeted amounts vs actual expense + COGS */}
        {reportType === 'budget' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Budget vs Actual ({fyLabel})</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Annual budgets compared against actual expenses and COGS derived from live transactions. Over-budget lines are flagged.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: 600 }}>
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Budget (Annual)</th>
                    <th className="py-2 px-3 text-right">Actual YTD</th>
                    <th className="py-2 px-3 text-right">Variance</th>
                    <th className="py-2 px-3 text-right">Utilization</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budgetRows.length === 0 && (
                    <tr><td colSpan={6} className="py-6 px-3 text-center text-slate-500">No budgets configured yet.</td></tr>
                  )}
                  {budgetRows.map((r) => (
                    <tr key={r.id} className={`hover:bg-slate-50 ${r.isOver ? 'bg-rose-50/50' : ''}`}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{r.name}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">{formatCurrency(r.budget)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(r.actual)}</td>
                      <td className={`py-2 px-3 text-right font-mono font-bold ${r.isOver ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {r.variance < 0 ? '−' : '+'}{formatCurrency(Math.abs(r.variance))}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">{r.utilization === '—' ? '—' : `${r.utilization}%`}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${r.isOver ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                          {r.isOver ? 'Over Budget' : 'Within Budget'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-slate-400 italic">Budgets are annual and static; variance is computed against total expenses + COGS recorded so far in {fyLabel}.</p>
          </div>
        )}

        {reportType === 'cashflow' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Sales Invoices Ledger</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Individual invoice contributions to overall operating revenue.</p>
            </div>
            <DataTable
              columns={[
                { key: 'invoiceNumber', label: 'Invoice #' },
                { key: 'customerName', label: 'Customer', render: (v, row) => v || row.customer || '—' },
                { key: 'date', label: 'Date', render: (v) => formatDateDDMMYYYY(v) },
                { key: 'grandTotal', label: 'Total', render: (v, row) => formatCurrency(Number(v ?? row.total ?? 0) || 0) },
                { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
              ]}
              data={invoices}
              rowKey="id"
              emptyMessage="No invoices found."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancialReportsPage;
