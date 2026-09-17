import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, TrendingDown, CheckCircle2, DollarSign, Receipt, Tag } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';

const expensesGuide = {
    title: 'Operating Expenses Management',
    subtitle: 'Track operational overheads, facility maintenance, freight logistics, and corporate disbursements.',
    purpose: 'Record non-inventory operating expenses (OpEx) such as shipping freight, utilities, software licenses, and warehouse facility maintenance. These directly impact the Profit & Loss statement.',
    keyTerms: [
        { term: 'OpEx (Operating Expense)', definition: 'Day-to-day corporate expenditures required to run business operations.' },
        { term: 'Tax Deductible', definition: 'Business expenses that can be subtracted from gross income before tax calculation.' },
        { term: 'Expense Voucher', definition: 'Formal proof of non-PO related cash or card disbursement.' },
    ],
    tips: [
        'Tag recurring expenditures with categories to generate clean monthly P&L breakdowns.',
    ],
    workflow: ['Incur Expense', 'Record Voucher & Payment Method', 'General Ledger Updated', 'Tax Report Classified'],
};

export const ExpensesPage = () => {
    const { expenses, addExpense, formatCurrency, formatDateDDMMYYYY, getCurrentDateFormatted } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [category, setCategory] = useState('Logistics');
    const [payee, setPayee] = useState('');
    const [amount, setAmount] = useState('');
    const [paidVia, setPaidVia] = useState('Corporate Card');
    const handleCreate = (e) => {
        e.preventDefault();
        addExpense({
            category,
            date: getCurrentDateFormatted(),
            payee: payee || 'Service Vendor',
            amount: parseFloat(amount) || 150,
            paidVia,
            taxDeductible: true,
        });
        setShowAddModal(false);
        setPayee('');
        setAmount('');
    };
    const columns = [
        {
            key: 'expenseNumber',
            header: 'Expense Voucher #',
            width: '15%',
            render: (e) => (
              <span className="font-mono font-bold text-text flex items-center gap-1.5 whitespace-nowrap">
                <TrendingDown size={13} className="text-amber-600 dark:text-amber-400 shrink-0"/>
                <span>{e.expenseNumber}</span>
              </span>
            ),
        },
        {
            key: 'category',
            header: 'Expense Category',
            width: '16%',
            render: (e) => (
              <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-text-secondary text-[11px] font-semibold rounded border border-border whitespace-nowrap">
                {e.category}
              </span>
            ),
        },
        {
            key: 'payee',
            header: 'Vendor / Payee Entity',
            width: '22%',
            render: (e) => <span className="font-bold text-text block">{e.payee}</span>,
        },
        {
            key: 'date',
            header: 'Date Paid',
            width: '12%',
            render: (e) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(e.date)}</span>,
        },
        {
            key: 'paidVia',
            header: 'Disbursement Method',
            width: '13%',
            render: (e) => <span className="text-muted text-xs whitespace-nowrap">{e.paidVia}</span>,
        },
        {
            key: 'taxDeductible',
            header: 'Tax Status',
            align: 'center',
            width: '10%',
            render: (e) => (
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap">
                <CheckCircle2 size={12}/> Tax Deductible
              </span>
            ),
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            width: '12%',
            render: (e) => (
              <span className="font-mono font-bold text-text whitespace-nowrap">
                {formatCurrency(e.amount ?? 0)}
              </span>
            ),
        },
    ];
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const avgExpense = expenses.length > 0 ? (totalSpent / expenses.length) : 0;
    const categoriesCount = new Set(expenses.map(e => e.category)).size;

    return (<div className="space-y-6">
      <PageHeader title="Operating Expenses & OpEx" subtitle="Log overhead, logistics fees, utilities, facility maintenance, and corporate operational disbursements." guide={expensesGuide} actions={<Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Record Expense
          </Button>}/>

      {/* Expenses KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Operating Expenses" value={formatCurrency(totalSpent)} icon={DollarSign} highlight />
        <StatCard label="Expense Vouchers" value={`${expenses.length} Vouchers`} icon={Receipt} trend={{ positive: true, text: 'Logged to P&L' }} />
        <StatCard label="Avg Expense Cost" value={formatCurrency(avgExpense)} icon={TrendingDown} />
        <StatCard label="Active Cost Centers" value={`${categoriesCount} Categories`} icon={Tag} subtext="Logistics, Facilities, Admin" />
      </div>

      <DataTable title="Operational Overheads & Disbursed Vouchers" columns={columns} data={expenses} keyExtractor={(e) => e.id} searchPlaceholder="Search payee, voucher #, or category..." searchFilter={(e, term) => e.expenseNumber.toLowerCase().includes(term) ||
            e.payee.toLowerCase().includes(term) ||
            e.category.toLowerCase().includes(term)}/>

      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-lg border border-[#CED4DA] shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-base text-[#1F2E4A] mb-1">
              Record Operational Expense
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter payment details for logistics, utilities, or maintenance.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]">
                  <option value="Logistics">Logistics & Freight</option>
                  <option value="Utilities">Utilities & Power</option>
                  <option value="Maintenance">Facility Maintenance</option>
                  <option value="Office">Office & Admin</option>
                  <option value="Travel">Business Travel</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payee Vendor</label>
                <input required value={payee} onChange={(e) => setPayee(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]" placeholder="e.g. Pacific Power & Light"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ($)</label>
                  <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] font-mono" placeholder="1200"/>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <input value={paidVia} onChange={(e) => setPaidVia(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]" placeholder="Corporate Card"/>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-1.5 border border-[#CED4DA] rounded text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded font-semibold">
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
