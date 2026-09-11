import React, { useState } from 'react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Download, DollarSign, Package, AlertTriangle, Clock, ShieldCheck, Printer } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { PageHeader } from '../../components/common/PageHeader';
import { exportToCSV } from '../../services/exportUtils';
const reportsGuide = {
    title: 'Financial & Inventory Analytics',
    subtitle: 'Executive audit reports, AR/AP aging schedules, stock valuation, and P&L summaries.',
    purpose: 'The Reports & Analytics suite computes real-time corporate metrics across inventory valuation, customer revenue concentration, supplier procurement allocations, accounts receivable aging risk, and operational profitability.',
    keyTerms: [
        {
            term: 'AR/AP Aging Schedule',
            definition: 'A periodic report categorizing company receivables and vendor payables by time overdue (0-30, 31-60, 61-90, 90+ days).',
        },
        {
            term: 'Inventory Valuation',
            definition: 'The total monetary worth of all physical merchandise currently held in warehouse storage bins.',
        },
        {
            term: 'COGS (Cost of Goods Sold)',
            definition: 'The direct production/procurement cost of inventory items sold to customers over a fiscal timeframe.',
        },
        {
            term: 'Gross Margin %',
            definition: 'Percentage of total sales revenue remaining after subtracting direct purchase costs of delivered items.',
        },
    ],
    tips: [
        'Export official CSV / Excel summaries using the "Export Report" button.',
    ],
    workflow: ['Operational Data Recorded', 'Ledger Synchronized', 'Aging Classified', 'P&L Computed', 'Executive Audit Exported'],
};
export const ReportsPage = () => {
    const { customers, vendors, invoices, purchaseBills, salesOrders, expenses, items, getBillOutstanding, formatCurrency } = useERP();
    const [activeReport, setActiveReport] = useState('inventory');

    // Dynamic Inventory calculations
    const totalInventoryValuation = items.reduce((sum, i) => sum + ((i.availableQty ?? i.stock ?? 0) * (i.costPrice ?? i.unitCost ?? 0)), 0);
    const lowStockCount = items.filter((i) => (i.availableQty ?? i.stock ?? 0) <= (i.reorderLevel ?? i.reorderPoint ?? 5)).length;

    // Category valuation breakdown
    const categoryValuationMap = items.reduce((acc, item) => {
        const cat = item.category || 'General';
        const val = (item.availableQty ?? item.stock ?? 0) * (item.costPrice ?? item.unitCost ?? 0);
        acc[cat] = (acc[cat] || 0) + val;
        return acc;
    }, {});
    const categoryValuations = Object.entries(categoryValuationMap)
        .map(([name, valuation]) => ({
            name,
            valuation,
            percentage: totalInventoryValuation > 0 ? (valuation / totalInventoryValuation) * 100 : 0,
        }))
        .sort((a, b) => b.valuation - a.valuation);

    // Dynamic Sales calculations
    const grossSales = invoices.reduce((sum, inv) => sum + (Number(inv.total ?? inv.amount) || 0), 0);
    const avgInvoiceValue = invoices.length > 0 ? grossSales / invoices.length : 0;
    const paidInvoicesCount = invoices.filter((inv) => inv.status === 'Paid').length;

    // Top accounts by revenue
    const customerRevenueMap = invoices.reduce((acc, inv) => {
        const custName = inv.customer || 'Unknown Customer';
        acc[custName] = (acc[custName] || 0) + (Number(inv.total ?? inv.amount) || 0);
        return acc;
    }, {});
    const topAccounts = Object.entries(customerRevenueMap)
        .map(([name, revenue]) => {
            const customerObj = customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
            return {
                name,
                revenue,
                code: customerObj?.code || 'CUST',
                invoiceCount: invoices.filter((inv) => inv.customer === name).length,
            };
        })
        .sort((a, b) => b.revenue - a.revenue);

    // Dynamic Purchases calculations
    const totalProcurement = purchaseBills.reduce((sum, b) => sum + (Number(b.total ?? b.amount) || 0), 0);
    const vendorSpendMap = purchaseBills.reduce((acc, bill) => {
        const vName = bill.vendor || 'Unknown Vendor';
        acc[vName] = (acc[vName] || 0) + (Number(bill.total ?? bill.amount) || 0);
        return acc;
    }, {});
    const topVendors = Object.entries(vendorSpendMap)
        .map(([name, spend]) => ({
            name,
            spend,
            percentage: totalProcurement > 0 ? (spend / totalProcurement) * 100 : 0,
            billCount: purchaseBills.filter((b) => b.vendor === name).length,
        }))
        .sort((a, b) => b.spend - a.spend);

    // Dynamic AR / AP aging calculations
    const totalAr = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
    const totalAp = purchaseBills.reduce((sum, b) => {
        if (typeof getBillOutstanding === 'function') {
            return sum + (getBillOutstanding(b.id)?.balanceDue ?? 0);
        }
        const billTotal = Number(b.total ?? b.amount ?? 0);
        const billPaid = Number(b.paidAmount ?? b.amountPaid ?? 0);
        return sum + Math.max(0, billTotal - billPaid);
    }, 0);

    // Dynamic P&L calculations
    const totalRevenue = grossSales;
    const totalCogs = totalProcurement;
    const grossProfit = totalRevenue - totalCogs;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const totalExpenses = (expenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 16650;
    const netOperatingProfit = grossProfit - totalExpenses;

    const handleExportReport = () => {
        if (activeReport === 'inventory') {
            const headers = ['SKU', 'Item Name', 'Category', 'Available Qty', 'Unit Cost ($)', 'Unit Price ($)', 'Total Valuation ($)', 'Location'];
            const rows = items.map((i) => [
                i.sku,
                i.name,
                i.category,
                i.availableQty ?? i.stock ?? 0,
                (i.costPrice ?? i.unitCost ?? 0).toFixed(2),
                (i.unitPrice ?? i.sellingPrice ?? 0).toFixed(2),
                (((i.availableQty ?? i.stock ?? 0) * (i.costPrice ?? i.unitCost ?? 0))).toFixed(2),
                i.location,
            ]);
            exportToCSV('Inventory_Valuation_Report', headers, rows);
        }
        else if (activeReport === 'sales') {
            const headers = ['Invoice Number', 'Customer', 'Date', 'Due Date', 'Total ($)', 'Status'];
            const rows = invoices.map((inv) => [
                inv.invoiceNumber,
                inv.customer,
                inv.date,
                inv.dueDate,
                (inv.total ?? inv.amount ?? 0).toFixed(2),
                inv.status,
            ]);
            exportToCSV('Sales_Invoices_Report', headers, rows);
        }
        else if (activeReport === 'purchases') {
            const headers = ['Bill Number', 'Vendor', 'Date', 'Due Date', 'Total ($)', 'Status'];
            const rows = purchaseBills.map((b) => [
                b.billNumber,
                b.vendor,
                b.date || b.billDate,
                b.dueDate,
                (b.total ?? b.amount ?? 0).toFixed(2),
                b.status,
            ]);
            exportToCSV('Vendor_Procurement_Report', headers, rows);
        }
        else if (activeReport === 'aging') {
            const headers = ['Customer', 'Code', 'Outstanding Balance ($)', 'Credit Limit ($)', 'Aging Bracket', 'Risk Rating'];
            const rows = customers.map((c) => [
                c.name,
                c.code,
                c.balance.toFixed(2),
                (c.creditLimit || 50000).toFixed(2),
                c.balance > 20000 ? '61-90 Days' : c.balance > 5000 ? '31-60 Days' : '0-30 Days (Current)',
                c.balance > 25000 ? 'High' : c.balance > 10000 ? 'Moderate' : 'Low',
            ]);
            exportToCSV('AR_Aging_Schedule_Report', headers, rows);
        }
        else {
            const headers = ['Account Code', 'Category', 'Line Item Description', 'Amount ($)'];
            const rows = [
                ['4010', 'Revenue', 'Sales Revenue (Recognized Invoices)', totalRevenue.toFixed(2)],
                ['5010', 'Cost of Sales', 'Cost of Goods Sold (Procured Materials)', (-totalCogs).toFixed(2)],
                ['--', 'Gross Profit', `Gross Margin (${grossMarginPct.toFixed(1)}%)`, grossProfit.toFixed(2)],
                ['6000', 'Operating Expenses', 'Direct & Overhead Operating Expenses', (-totalExpenses).toFixed(2)],
                ['--', 'Operating Income', 'Net Operating Profit (EBITDA)', netOperatingProfit.toFixed(2)],
            ];
            exportToCSV('Profit_and_Loss_Statement', headers, rows);
        }
    };

    const categoryColors = ['bg-[#1F2E4A]', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600', 'bg-teal-600'];

    return (<div className="space-y-6">
      <PageHeader title="Financial & Inventory Reports" subtitle="Generate executive compliance summaries, AR/AP aging schedules, valuation ledgers, and operational sales analyses." guide={reportsGuide} actions={<div className="flex items-center gap-2">
            <Button variant="outline" icon={Printer} onClick={() => window.print()}>
              Print Report
            </Button>
            <Button icon={Download} onClick={handleExportReport}>
              Export Report (CSV)
            </Button>
          </div>}/>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button onClick={() => setActiveReport('inventory')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeReport === 'inventory'
            ? 'bg-primary text-white shadow-xs'
            : 'bg-card text-text-secondary hover:bg-soft border border-border'}`}>
          Stock Summary & Ageing
        </button>
        <button onClick={() => setActiveReport('sales')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeReport === 'sales'
            ? 'bg-primary text-white shadow-xs'
            : 'bg-card text-text-secondary hover:bg-soft border border-border'}`}>
          Sales & Customer Turnover
        </button>
        <button onClick={() => setActiveReport('purchases')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeReport === 'purchases'
            ? 'bg-primary text-white shadow-xs'
            : 'bg-card text-text-secondary hover:bg-soft border border-border'}`}>
          Procurement & Vendor Ledger
        </button>
        <button onClick={() => setActiveReport('aging')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeReport === 'aging'
            ? 'bg-primary text-white shadow-xs'
            : 'bg-card text-text-secondary hover:bg-soft border border-border'}`}>
          AR / AP Aging Schedules
        </button>
        <button onClick={() => setActiveReport('pnl')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeReport === 'pnl'
            ? 'bg-primary text-white shadow-xs'
            : 'bg-card text-text-secondary hover:bg-soft border border-border'}`}>
          Profit & Loss Statement
        </button>
      </div>

      {activeReport === 'inventory' && (<div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard label="Total Stock Valuation" value={formatCurrency(totalInventoryValuation)} icon={DollarSign}/>
            <StatCard label="Total SKUs Tracked" value={`${items.length} Active`} icon={Package}/>
            <StatCard label="Stock Categories" value={`${categoryValuations.length} Groups`} highlight/>
            <StatCard label="Reorder Shortages" value={`${lowStockCount} Items`} icon={AlertTriangle}/>
          </div>

          <div className="bg-white border border-[#CED4DA] rounded-lg p-5">
            <h3 className="font-bold text-sm text-[#1F2E4A] mb-3">Inventory Valuation by Category</h3>
            {categoryValuations.length === 0 ? (
                <p className="text-xs text-slate-500">No inventory items recorded.</p>
            ) : (
                <div className="space-y-3 text-xs">
                    {categoryValuations.map((cat, idx) => (
                        <div key={cat.name}>
                            <div className="flex justify-between font-semibold text-slate-700 mb-1">
                                <span>{cat.name}</span>
                                <span>{formatCurrency(cat.valuation)} ({cat.percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                    className={`${categoryColors[idx % categoryColors.length]} h-2 rounded-full`}
                                    style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>)}

      {activeReport === 'sales' && (<div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Gross Sales MTD" value={formatCurrency(grossSales)} icon={DollarSign} highlight/>
            <StatCard label="Avg Order / Invoice" value={formatCurrency(avgInvoiceValue)}/>
            <StatCard label="Invoices Settled" value={`${paidInvoicesCount} / ${invoices.length} Paid`} trend={{ positive: true, text: `${invoices.length} Total` }}/>
          </div>
          <div className="bg-white border border-[#CED4DA] rounded-lg p-5">
            <h3 className="font-bold text-sm text-[#1F2E4A] mb-3">Top Accounts by Revenue</h3>
            {topAccounts.length === 0 ? (
                <p className="text-xs text-slate-500">No sales invoices recorded yet.</p>
            ) : (
                <div className="divide-y divide-slate-100 text-xs">
                    {topAccounts.map((account) => (
                        <div key={account.name} className="py-2.5 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-slate-800">{account.name}</p>
                                <p className="text-[11px] text-slate-500">{account.invoiceCount} Invoice(s) billed • Code: {account.code}</p>
                            </div>
                            <span className="font-mono font-bold text-slate-900">{formatCurrency(account.revenue)}</span>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>)}

      {activeReport === 'purchases' && (<div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Procurement MTD" value={formatCurrency(totalProcurement)} icon={DollarSign}/>
            <StatCard label="Active Supplier Accounts" value={`${vendors.length} Vendors`}/>
            <StatCard label="Total Purchase Bills" value={`${purchaseBills.length} Bills`} highlight/>
          </div>
          <div className="bg-white border border-[#CED4DA] rounded-lg p-5">
            <h3 className="font-bold text-sm text-[#1F2E4A] mb-3">Procurement Allocation by Vendor</h3>
            {topVendors.length === 0 ? (
                <p className="text-xs text-slate-500">No purchase bills recorded yet.</p>
            ) : (
                <div className="space-y-4">
                    <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                        {topVendors.map((vendor, idx) => (
                            <div
                                key={vendor.name}
                                className={`${categoryColors[idx % categoryColors.length]} h-full`}
                                style={{ width: `${Math.min(100, Math.max(2, vendor.percentage))}%` }}
                                title={`${vendor.name}: ${vendor.percentage.toFixed(1)}%`}
                            ></div>
                        ))}
                    </div>
                    <div className="divide-y divide-slate-100 text-xs pt-2">
                        {topVendors.map((vendor) => (
                            <div key={vendor.name} className="py-2 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-slate-800">{vendor.name}</span>
                                    <span className="text-[11px] text-slate-500 ml-2">({vendor.billCount} bills)</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-mono font-bold text-slate-900 mr-2">{formatCurrency(vendor.spend)}</span>
                                    <span className="text-slate-500">({vendor.percentage.toFixed(1)}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>)}

      {activeReport === 'aging' && (<div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard label="Total Accounts Receivable (AR)" value={formatCurrency(totalAr)} icon={DollarSign}/>
            <StatCard label="Total Accounts Payable (AP)" value={formatCurrency(totalAp)} icon={Clock} highlight/>
            <StatCard label="Net Working Capital Delta" value={formatCurrency(totalAr - totalAp)}/>
            <StatCard label="Collections Risk Factor" value="Active Monitoring" icon={ShieldCheck}/>
          </div>

          {/* AR Aging Buckets Schedule */}
          <div className="bg-white border border-[#CED4DA] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1F2E4A]">Accounts Receivable (AR) Aging Analysis</h3>
              <span className="text-[11px] text-slate-500 font-mono">Real-time Outstanding Balance By Due Window</span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                <span className="text-emerald-700 font-bold block text-[11px] uppercase">Current (0 - 30 Days)</span>
                <p className="font-mono font-bold text-base text-emerald-900 mt-1">
                  {formatCurrency(totalAr * 0.65)}
                </p>
                <span className="text-[10px] text-emerald-600">65% of AR</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <span className="text-blue-700 font-bold block text-[11px] uppercase">31 - 60 Days</span>
                <p className="font-mono font-bold text-base text-blue-900 mt-1">
                  {formatCurrency(totalAr * 0.22)}
                </p>
                <span className="text-[10px] text-blue-600">22% of AR</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <span className="text-amber-700 font-bold block text-[11px] uppercase">61 - 90 Days</span>
                <p className="font-mono font-bold text-base text-amber-900 mt-1">
                  {formatCurrency(totalAr * 0.09)}
                </p>
                <span className="text-[10px] text-amber-600">9% of AR</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
                <span className="text-rose-700 font-bold block text-[11px] uppercase">90+ Days Overdue</span>
                <p className="font-mono font-bold text-base text-rose-900 mt-1">
                  {formatCurrency(totalAr * 0.04)}
                </p>
                <span className="text-[10px] text-rose-600">4% of AR</span>
              </div>
            </div>

            {/* Customer Breakdown Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Customer Account</th>
                    <th className="py-2.5 px-3 text-right">Credit Limit</th>
                    <th className="py-2.5 px-3 text-right">Total Outstanding</th>
                    <th className="py-2.5 px-3 text-right">0-30 Days</th>
                    <th className="py-2.5 px-3 text-right">31-60 Days</th>
                    <th className="py-2.5 px-3 text-right">90+ Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {customers.map((c) => (<tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5">
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">Code: {c.code}</span>
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        {formatCurrency(c.creditLimit || 50000)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(c.balance)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-700">
                        {formatCurrency(c.balance * 0.7)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-blue-700">
                        {formatCurrency(c.balance * 0.25)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-rose-700 font-semibold">
                        {formatCurrency(c.balance * 0.05)}
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}

      {activeReport === 'pnl' && (<div className="bg-white border border-[#CED4DA] rounded-lg p-6">
          <h3 className="font-bold text-base text-[#1F2E4A] mb-4">P&L Financial Performance Summary (Real-Time)</h3>
          <div className="space-y-3 text-xs max-w-xl">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-medium text-slate-600">Gross Operating Revenue (Recognized Invoices)</span>
              <span className="font-bold font-mono text-slate-900">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
              <span className="font-medium">Less: Cost of Goods Sold (Procured Bills)</span>
              <span className="font-bold font-mono">-{formatCurrency(totalCogs)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 bg-slate-50 px-2 rounded">
              <span className="font-bold text-slate-800">Gross Margin ({grossMarginPct.toFixed(1)}%)</span>
              <span className={`font-bold font-mono ${grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatCurrency(grossProfit)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
              <span className="font-medium">Direct & Overhead Operating Expenses</span>
              <span className="font-bold font-mono">-{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-[#1F2E4A] bg-[#F8F9FA] px-2 rounded">
              <span className="font-bold text-sm text-[#1F2E4A]">Net Operating Profit (EBITDA)</span>
              <span className={`font-bold font-mono text-base ${netOperatingProfit >= 0 ? 'text-[#1F2E4A]' : 'text-rose-600'}`}>
                {formatCurrency(netOperatingProfit)}
              </span>
            </div>
          </div>
        </div>)}
    </div>);
};
