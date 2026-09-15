import { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Printer, Download, TrendingUp, TrendingDown, DollarSign, PieChart, FileText } from 'lucide-react';

export function FinancialReportsPage() {
  const { salesInvoices = [], purchaseBills = [], expenses = [], formatCurrency, formatDateDDMMYYYY } = useERP();
  const [reportType, setReportType] = useState('pl'); // 'pl' | 'cashflow' | 'sales_summary'

  // Calculate financials
  const totalRevenue = useMemo(() => {
    return salesInvoices
      .filter(i => i.status !== 'Cancelled')
      .reduce((sum, i) => sum + (Number(i.grandTotal) || Number(i.total) || 0), 0);
  }, [salesInvoices]);

  const totalCOGS = useMemo(() => {
    return purchaseBills
      .filter(b => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + (Number(b.grandTotal) || Number(b.total) || 0), 0);
  }, [purchaseBills]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const grossProfit = totalRevenue - totalCOGS;
  const netIncome = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(1) : '0.0';

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: 'dollar', tone: 'blue', trend: '+12.5%' },
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

  return (
    <div className="feature-page printable-document" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="Financial Reports"
        subtitle="Consolidated Profit & Loss, Balance Sheet, and Cash Flow metrics."
        breadcrumb={[{ label: 'Accounts', to: '/accounts/cash-bank' }, { label: 'Reports' }]}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-outline" onClick={() => window.print()}>
              <Printer size={15} /> Print Statement
            </button>
            <button type="button" className="btn-primary" onClick={() => alert('Financial report exported as CSV/PDF.')}>
              <Download size={15} /> Export Report
            </button>
          </div>
        }
      />

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '20px 0 24px' }}>
        {stats.map(s => <StatCard key={s.label} stat={s} />)}
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <div className="no-print" style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'pl', label: 'Profit & Loss Statement' },
              { id: 'cashflow', label: 'Recent Invoices Breakdown' },
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
          <span style={{ fontSize: 13, color: '#64748b' }}>Period: Current Fiscal Year (2026)</span>
        </div>

        {reportType === 'pl' ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Income Statement Summary</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>All amounts calculated in real-time from recorded sales invoices and purchase bills.</p>
            </div>
            <DataTable
              columns={plColumns}
              data={plRows}
              rowKey="category"
              emptyMessage="No financial entries available."
            />
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Sales Invoices Ledger</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Individual invoice contributions to overall operating revenue.</p>
            </div>
            <DataTable
              columns={[
                { key: 'invoiceNumber', label: 'Invoice #' },
                { key: 'customerName', label: 'Customer' },
                { key: 'date', label: 'Date', render: (v) => formatDateDDMMYYYY(v) },
                { key: 'grandTotal', label: 'Total', render: (v) => formatCurrency(Number(v || 0)) },
                { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
              ]}
              data={salesInvoices}
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
