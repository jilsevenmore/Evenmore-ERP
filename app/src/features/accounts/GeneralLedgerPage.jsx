import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Plus, BookOpen, Scale, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
const generalLedgerGuide = {
    title: 'General Ledger & Journal Entries',
    subtitle: 'Double-entry accounting journal vouchers and Chart of Accounts postings',
    purpose: 'Use this page to view every debit and credit transaction posted across the business. System events (Sales Invoices, Purchase Bills, Payments, Inventory adjustments) create balanced journal entries automatically.',
    workflow: ['Operational Transaction Occurs', 'Auto-Generate Double Entry (Debit = Credit)', 'Post to Chart of Accounts', 'Balance Trial Sheet'],
    keyTerms: [
        {
            term: 'Double-Entry Accounting',
            definition: 'A fundamental principle where every financial entry has equal and opposite Debit (Dr) and Credit (Cr) postings.',
        },
        {
            term: 'Debit (Dr)',
            definition: 'Increases Asset and Expense accounts; decreases Liability, Equity, and Revenue accounts.',
        },
        {
            term: 'Credit (Cr)',
            definition: 'Increases Liability, Equity, and Revenue accounts; decreases Asset and Expense accounts.',
        },
        {
            term: 'Chart of Accounts (COA)',
            definition: 'Structured financial classification index (1xxx Assets, 2xxx Liabilities, 3xxx Equity, 4xxx Revenue, 5xxx COGS).',
        },
    ],
    tips: [
        'All system actions automatically balance Debits and Credits to maintain strict accounting compliance.',
    ],
};
/** Lower-cased text, safe on a field the server left unset. */
function text(value) {
  return String(value ?? '').toLowerCase();
}

export const GeneralLedgerPage = () => {
    const { journalEntries, addJournalEntry, formatCurrency, formatDateDDMMYYYY, getCurrentDateFormatted } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [description, setDescription] = useState('');
    const [debitAccount, setDebitAccount] = useState('1010 - Cash & Bank');
    const [creditAccount, setCreditAccount] = useState('4010 - Sales Revenue');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const handleCreate = (e) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (!(parsedAmount > 0)) {
            alert('Please enter a valid amount greater than zero.');
            return;
        }
        addJournalEntry({
            entryNumber: `JE-2026-${String(journalEntries.length + 80).padStart(3, '0')}`,
            date: getCurrentDateFormatted(),
            description: description || 'Manual Adjustment Entry',
            reference: reference || '',
            debitAccount,
            creditAccount,
            amount: parsedAmount,
            status: 'Posted',
        });
        setShowAddModal(false);
        setDescription('');
        setAmount('');
        setReference('');
    };
    const totalDebits = journalEntries.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalCredits = totalDebits; // By double-entry definition
    const columns = [
        {
            key: 'entryNumber',
            header: 'Voucher Ref',
            width: '14%',
            render: (e) => (
              <span className="font-mono font-bold text-text flex items-center gap-1.5 whitespace-nowrap">
                <BookOpen size={13} className="text-primary shrink-0"/>
                <span>{e.entryNumber}</span>
              </span>
            ),
        },
        {
            key: 'date',
            header: 'Posting Date',
            width: '12%',
            render: (e) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(e.date)}</span>,
        },
        {
            key: 'description',
            header: 'Transaction Narrative',
            width: '28%',
            render: (e) => (
              <div>
                <p className="font-semibold text-text">{e.description}</p>
                <span className="font-mono text-[10px] text-muted">{e.reference}</span>
              </div>
            ),
        },
        {
            key: 'debitAccount',
            header: 'Debit Ledger (Dr)',
            width: '16%',
            render: (e) => (
              <span className="font-mono text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/30 inline-flex items-center gap-1 whitespace-nowrap">
                <ArrowDownLeft size={11}/> {e.debitAccount}
              </span>
            ),
        },
        {
            key: 'creditAccount',
            header: 'Credit Ledger (Cr)',
            width: '16%',
            render: (e) => (
              <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30 inline-flex items-center gap-1 whitespace-nowrap">
                <ArrowUpRight size={11}/> {e.creditAccount}
              </span>
            ),
        },
        {
            key: 'amount',
            header: 'Entry Balance',
            align: 'right',
            width: '14%',
            render: (e) => (
              <span className="font-mono font-bold text-text whitespace-nowrap">
                {formatCurrency(e.amount)}
              </span>
            ),
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="General Ledger & Journal Entries" subtitle="Double-entry accounting journal vouchers, chart of accounts debit/credit postings, and audit trails." guide={generalLedgerGuide} actions={<Button icon={Plus} onClick={() => setShowAddModal(true)}>
            New Journal Voucher
          </Button>}/>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#CED4DA] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Debits (Dr)</span>
            <p className="text-lg font-bold text-blue-900 mt-1">
              {formatCurrency(totalDebits)}
            </p>
          </div>
          <ArrowDownLeft className="text-blue-600" size={24}/>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#CED4DA] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Credits (Cr)</span>
            <p className="text-lg font-bold text-emerald-900 mt-1">
              {formatCurrency(totalCredits)}
            </p>
          </div>
          <ArrowUpRight className="text-emerald-600" size={24}/>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#CED4DA] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Trial Balance Net</span>
            <p className="text-lg font-bold text-slate-800 mt-1">{formatCurrency(0)} (Balanced)</p>
          </div>
          <Scale className="text-emerald-600" size={24}/>
        </div>
      </div>

      <DataTable title="Journal Ledger Postings" columns={columns} data={journalEntries} keyExtractor={(e) => e.id} searchPlaceholder="Filter journal ref, account, or narrative..." searchFilter={(e, term) => text(e.entryNumber).includes(term) ||
            text(e.description).includes(term) ||
            text(e.debitAccount).includes(term) ||
            text(e.creditAccount).includes(term)}/>

      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-2 sm:p-4">
          <div className="bg-white rounded-lg border border-[#CED4DA] shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            <h3 className="font-bold text-base text-[#1F2E4A] mb-1">
              Create Journal Voucher Entry
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter balanced debit and credit accounts for general ledger posting.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Narration / Description</label>
                <input required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]" placeholder="e.g. Accrued utility adjustment for Q3"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Debit Account (Dr)</label>
                  <select value={debitAccount} onChange={(e) => setDebitAccount(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]">
                    <option value="1010 - Cash & Bank">1010 - Cash & Bank</option>
                    <option value="1200 - Accounts Receivable">1200 - Accounts Receivable</option>
                    <option value="1300 - Inventory Asset">1300 - Inventory Asset</option>
                    <option value="5010 - Cost of Goods Sold">5010 - COGS</option>
                    <option value="6020 - Logistics & Shipping">6020 - Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Account (Cr)</label>
                  <select value={creditAccount} onChange={(e) => setCreditAccount(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA]">
                    <option value="4010 - Sales Revenue">4010 - Sales Revenue</option>
                    <option value="2010 - Accounts Payable">2010 - Accounts Payable</option>
                    <option value="1010 - Cash & Bank">1010 - Cash & Bank</option>
                    <option value="1300 - Inventory Asset">1300 - Inventory Asset</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ($)</label>
                  <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] font-mono" placeholder="2500"/>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference Doc #</label>
                  <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full border border-[#CED4DA] rounded p-2 bg-[#F8F9FA] font-mono" placeholder="MEMO-991"/>
                </div>
              </div>

              <div className="flex flex-wrap lg:flex-nowrap justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-1.5 border border-[#CED4DA] rounded text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded font-semibold">
                  Post to General Ledger
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
