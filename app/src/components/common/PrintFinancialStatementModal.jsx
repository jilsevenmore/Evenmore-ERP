import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, FileText, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { LetterpadBrand, LetterpadFooter } from './SalesLetterpad';
import { downloadElementAsPdf } from '../../services/exportUtils';

export const PrintFinancialStatementModal = ({
  isOpen,
  onClose,
  reportType = 'pl',
  selectedPeriodLabel = '',
  stats = {},
  plRows = [],
  monthlyBreakdown = [],
  breakdownTotals = {},
  bsAssets = [],
  bsLiabilities = [],
  bsEquity = [],
  filteredInvoices = [],
  fyLabel = '',
}) => {
  const { companyProfile, formatCurrency, formatDateDDMMYYYY } = useERP();
  const sheetRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  // Escape key closes preview
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDirectDownload = async () => {
    if (!sheetRef.current || downloading) return;
    setDownloading(true);
    try {
      const cleanTitle = (statementTitle || 'Financial_Statement').replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(sheetRef.current, `${cleanTitle}_${selectedPeriodLabel || 'statement'}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const statementTitle =
    reportType === 'monthly'
      ? 'MONTH-BY-MONTH FINANCIAL PROGRESSION'
      : reportType === 'bs'
      ? 'BALANCE SHEET STATEMENT'
      : reportType === 'budget'
      ? 'BUDGET VARIANCE AUDIT'
      : reportType === 'cashflow'
      ? 'SALES INVOICES REVENUE LEDGER'
      : 'STATEMENT OF PROFIT & LOSS';

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:static print:bg-white print:backdrop-blur-none">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Screen Only Top Bar */}
        <div className="bg-[#1F2E4A] text-white px-4 sm:px-6 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 no-print shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-300" />
            <span className="font-bold text-sm tracking-tight">
              Official Statement PDF Preview — {selectedPeriodLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={handleDirectDownload}
              type="button"
              disabled={downloading}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer shadow-2xs"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Statement Sheet (A4 Proportion) */}
        <div className="overflow-x-auto p-4 sm:p-8 lg:p-10 print:p-0 print:overflow-visible bg-slate-50 print:bg-white">
          <div ref={sheetRef} className="p-8 sm:p-12 min-w-[700px] lg:min-w-0 print:min-w-0 text-slate-800 bg-white font-sans text-xs space-y-6 printable-document shadow-sm print:shadow-none border border-slate-200 print:border-none mx-auto max-w-[800px]">
            {/* Header / Letterpad */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-5">
              <LetterpadBrand company={companyProfile} />
              <div className="text-right space-y-1">
                <p className="font-mono text-[9px] tracking-[0.25em] text-slate-400 uppercase font-semibold">
                  AUDITED FINANCIAL TRANSCRIPT
                </p>
                <h1 className="text-lg sm:text-xl font-extrabold text-[#1F2E4A] tracking-tight uppercase">
                  {statementTitle}
                </h1>
                <div className="text-[11px] text-slate-500 pt-1 space-y-0.5">
                  <p>
                    <span className="font-medium text-slate-700">Period:</span>{' '}
                    <strong className="text-[#1F2E4A]">{selectedPeriodLabel}</strong>
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Generated:</span> {todayStr}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Accounting Basis:</span> Accrual Ledger
                  </p>
                </div>
              </div>
            </div>

            {/* Key Financial Metrics Highlights */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Operating Revenue</span>
                <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">{formatCurrency(stats.totalRevenue || 0)}</span>
                <span className="text-[10px] text-slate-500">{stats.activeInvoiceCount || 0} invoice(s)</span>
              </div>
              <div className="border-r border-slate-200 px-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Cost of Goods</span>
                <span className="text-sm font-bold text-amber-700 font-mono mt-0.5 block">{formatCurrency(stats.totalCOGS || 0)}</span>
                <span className="text-[10px] text-slate-500">Inventory Cost</span>
              </div>
              <div className="border-r border-slate-200 px-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Gross Profit</span>
                <span className="text-sm font-bold text-blue-700 font-mono mt-0.5 block">{formatCurrency(stats.grossProfit || 0)}</span>
                <span className="text-[10px] text-slate-500">Revenue − COGS</span>
              </div>
              <div className="pl-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Net Income</span>
                <span className={`text-sm font-bold font-mono mt-0.5 block ${(stats.netIncome || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(stats.netIncome || 0)}
                </span>
                <span className="text-[10px] text-slate-500">{stats.profitMargin || '0.0'}% Net Margin</span>
              </div>
            </div>

            {/* Report Content Body based on Active Report */}
            {reportType === 'monthly' ? (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-200 pb-1">
                  Month-by-Month Financial Progression ({fyLabel})
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">Month</th>
                      <th className="py-2 px-2 text-center">Invoices</th>
                      <th className="py-2 px-2.5 text-right">Revenue</th>
                      <th className="py-2 px-2.5 text-right">COGS</th>
                      <th className="py-2 px-2.5 text-right">Gross Profit</th>
                      <th className="py-2 px-2.5 text-right">Expenses</th>
                      <th className="py-2 px-2.5 text-right">Net Profit</th>
                      <th className="py-2 px-2 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {monthlyBreakdown.map((r) => (
                      <tr key={r.key} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900">{r.label}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{r.invoiceCount}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-medium">{formatCurrency(r.revenue)}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">{formatCurrency(r.cogs)}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-slate-800">{formatCurrency(r.grossProfit)}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">{formatCurrency(r.expenses)}</td>
                        <td className={`py-1.5 px-2.5 text-right font-mono font-bold ${r.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {r.netIncome < 0 ? `-${formatCurrency(Math.abs(r.netIncome))}` : formatCurrency(r.netIncome)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-700">{r.revenue > 0 ? `${r.margin}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-xs">
                    <tr>
                      <td className="py-2 px-2.5 uppercase font-extrabold text-slate-900">Total ({fyLabel})</td>
                      <td className="py-2 px-2 text-center font-mono font-bold">{breakdownTotals.invoiceCount}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(breakdownTotals.revenue)}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-600">{formatCurrency(breakdownTotals.cogs)}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(breakdownTotals.grossProfit)}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-600">{formatCurrency(breakdownTotals.expenses)}</td>
                      <td className={`py-2 px-2.5 text-right font-mono font-bold ${breakdownTotals.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {breakdownTotals.netIncome < 0 ? `-${formatCurrency(Math.abs(breakdownTotals.netIncome))}` : formatCurrency(breakdownTotals.netIncome)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold">{breakdownTotals.margin}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : reportType === 'bs' ? (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-200 pb-1">
                  Balance Sheet (as of {todayStr})
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Classification</th>
                      <th className="py-2 px-3">Account / Ledger Item</th>
                      <th className="py-2 px-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td colSpan={3} className="py-1.5 px-3 bg-blue-50/70 font-bold text-blue-800 uppercase text-[10px] tracking-wider">Assets</td></tr>
                    {bsAssets.map((r, i) => (
                      <tr key={`a-${i}`} className={r.isTotal ? 'bg-blue-50/40 font-bold border-t border-blue-200' : ''}>
                        <td className="py-1.5 px-3 text-slate-600">{r.section}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900">{r.account}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(r.amount)}</td>
                      </tr>
                    ))}
                    <tr><td colSpan={3} className="py-1.5 px-3 bg-rose-50/70 font-bold text-rose-800 uppercase text-[10px] tracking-wider">Liabilities</td></tr>
                    {bsLiabilities.map((r, i) => (
                      <tr key={`l-${i}`} className={r.isTotal ? 'bg-rose-50/40 font-bold border-t border-rose-200' : ''}>
                        <td className="py-1.5 px-3 text-slate-600">{r.section}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900">{r.account}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(r.amount)}</td>
                      </tr>
                    ))}
                    <tr><td colSpan={3} className="py-1.5 px-3 bg-emerald-50/70 font-bold text-emerald-800 uppercase text-[10px] tracking-wider">Equity</td></tr>
                    {bsEquity.map((r, i) => (
                      <tr key={`e-${i}`} className={r.isTotal ? 'bg-emerald-50/40 font-bold border-t border-emerald-200' : ''}>
                        <td className="py-1.5 px-3 text-slate-600">{r.section}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900">{r.account}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : reportType === 'cashflow' ? (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-200 pb-1">
                  Sales Invoices Ledger ({selectedPeriodLabel})
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Invoice #</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3 text-right">Total Amount</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id || inv.invoiceNumber}>
                        <td className="py-1.5 px-3 font-mono font-semibold text-slate-900">{inv.invoiceNumber || inv.invoice_number || '—'}</td>
                        <td className="py-1.5 px-3 text-slate-700">{inv.customerName || inv.customer || '—'}</td>
                        <td className="py-1.5 px-3 text-slate-600">{formatDateDDMMYYYY(inv.date || inv.docDate || inv.doc_date || inv.createdAt)}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(Number(inv.grandTotal ?? inv.total ?? 0) || 0)}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            {inv.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-200 pb-1">
                  Income Statement Ledger Summary ({selectedPeriodLabel})
                </h3>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Accounting Description</th>
                      <th className="py-2.5 px-3 text-right">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {plRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          row.type === 'net'
                            ? 'bg-blue-50/50 font-bold border-t-2 border-slate-400'
                            : row.type === 'summary'
                            ? 'bg-slate-50 font-semibold'
                            : ''
                        }
                      >
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{row.category}</td>
                        <td className="py-2.5 px-3 text-slate-600">{row.item}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {row.amount < 0 ? `-${formatCurrency(Math.abs(row.amount))}` : formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Preparation Notes & Verification */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Statement Notes & Legal Compliance:</p>
              <p>1. Financial figures are extracted directly from Evenmore ERP certified sales invoices, bills of supply, and verified expense vouchers.</p>
              <p>2. Cost of Goods Sold (COGS) reflects the actual unit procurement cost of inventory items dispatched against finalized commercial invoices.</p>
              <p>3. This document is system-generated and serves as an official accounting transcript for internal audit, tax assessment, and management review.</p>
            </div>

            {/* Official Sign-off Block */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-[11px]">
              <div>
                <p className="text-slate-500">Prepared & Certified By:</p>
                <div className="mt-8 border-t border-slate-400 pt-1.5">
                  <p className="font-bold text-slate-900">Finance & Accounts Department</p>
                  <p className="text-slate-500 text-[10px]">Evenmore ERP Automated Audit Ledger</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Authorized Signatory:</p>
                <div className="mt-8 border-t border-slate-400 pt-1.5">
                  <p className="font-bold text-slate-900">{companyProfile?.name || 'Company Management'}</p>
                  <p className="text-slate-500 text-[10px]">Director / Principal Financial Officer</p>
                </div>
              </div>
            </div>

            {/* Letterpad Footer */}
            <LetterpadFooter company={companyProfile} note="Evenmore ERP · Verified Corporate Financial Ledger" />
          </div>
        </div>

        {/* Screen Bottom Actions */}
        <div className="no-print p-4 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-0 border-t border-slate-200 bg-white">
          <p className="text-xs text-slate-600">
            Select <strong>"Save as PDF"</strong> in the destination dropdown to download this official statement.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer shadow-2xs"
            >
              <Printer size={14} />
              Download PDF / Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintFinancialStatementModal;
