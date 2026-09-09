import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Landmark, Plus, DollarSign, CheckCircle2, X } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
const cashBankGuide = {
    title: 'Cash & Bank Accounts (Treasury)',
    subtitle: 'Treasury liquidity monitoring, corporate banking, and automated reconciliation',
    purpose: 'Use this page to monitor company cash on hand and institutional bank balances. Recording transactions in Sales, Purchasing, or Payments automatically updates these account balances.',
    workflow: ['Link Bank Account', 'Process ERP Transactions', 'Track Live Cash Balances', 'Perform Month-End Reconciliation'],
    keyTerms: [
        {
            term: 'Liquid Treasury',
            definition: 'Immediate cash and bank reserves available to meet working capital requirements and supplier payables.',
        },
        {
            term: 'Operating Account',
            definition: 'Primary checking account used for day-to-day vendor disbursements and customer invoice settlements.',
        },
        {
            term: 'Automated Posting',
            definition: 'When invoices or bills are marked paid, the corresponding bank ledger balance is updated immediately.',
        },
        {
            term: 'Reconciliation',
            definition: 'Cross-verifying ERP bank ledger entries against official monthly bank statements.',
        },
    ],
    tips: [
        'Settling sales invoices or issuing vendor vouchers automatically updates cash/bank account ledger balances.',
    ],
};
export const CashBankPage = () => {
    const { bankAccounts, addBankAccount } = useERP();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAcc, setNewAcc] = useState({
        bankName: '',
        accountNumber: '',
        accountName: 'Operating Account',
        accountType: 'Current Operating',
        balance: 10000,
    });
    const totalLiquidity = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
    const columns = [
        {
            header: 'Financial Institution',
            key: 'bankName',
            render: (a) => (<div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-100 text-[#1F2E4A]">
            <Landmark size={16}/>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{a.bankName}</p>
            <p className="text-[11px] font-mono text-slate-500">{a.accountNumber}</p>
          </div>
        </div>),
        },
        {
            header: 'Account Classification',
            key: 'accountType',
            render: (a) => (<span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 text-[11px]">
          {a.accountType || 'Operating'}
        </span>),
        },
        {
            header: 'Ledger Balance',
            key: 'balance',
            align: 'right',
            render: (a) => (<span className="font-bold text-slate-900 font-mono text-sm">
          ${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>),
        },
        {
            header: 'Last Reconciled',
            key: 'lastReconciled',
            align: 'center',
            render: (a) => (<span className="text-slate-500 text-xs">
          {a.lastReconciled || 'Oct 24, 2026'}
        </span>),
        },
        {
            header: 'Status',
            key: 'status',
            align: 'center',
            render: () => (<span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          Connected
        </span>),
        },
    ];
    const handleCreate = (e) => {
        e.preventDefault();
        if (!newAcc.bankName)
            return;
        addBankAccount({
            bankName: newAcc.bankName,
            accountName: newAcc.accountName || newAcc.bankName,
            accountNumber: newAcc.accountNumber || '•••• 1234',
            accountType: newAcc.accountType || 'Current Operating',
            currency: 'USD',
            balance: Number(newAcc.balance) || 0,
            lastReconciled: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        });
        setIsModalOpen(false);
    };
    return (<div className="space-y-6">
      <PageHeader title="Cash & Bank Accounts" subtitle="Real-time liquidity monitoring, treasury accounts, and automated statement reconciliation." guide={cashBankGuide} actions={<Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Bank Account
          </Button>}/>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Liquid Cash & Treasury" value={`$${totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} highlight/>
        <StatCard label="Operating Accounts" value={`${bankAccounts.length} Accounts`} icon={Landmark}/>
        <StatCard label="Statement Reconciliation" value="100% Up to Date" icon={CheckCircle2}/>
      </div>

      <DataTable title="Bank & Cash Register" data={bankAccounts} columns={columns} keyExtractor={(a) => a.id} searchPlaceholder="Search bank accounts..." searchFilter={(a, term) => a.bankName.toLowerCase().includes(term) ||
            a.accountNumber.toLowerCase().includes(term) ||
            (a.accountType || '').toLowerCase().includes(term)}/>

      {isModalOpen && (<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#CED4DA] max-w-md w-full p-6 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#CED4DA]">
              <h3 className="font-bold text-base text-[#1F2E4A]">Link New Bank Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18}/>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Financial Institution *</label>
                <input type="text" required placeholder="e.g. Bank of America Commercial" value={newAcc.bankName} onChange={(e) => setNewAcc({ ...newAcc, bankName: e.target.value })} className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Account Number Mask</label>
                <input type="text" placeholder="e.g. •••• 9921" value={newAcc.accountNumber} onChange={(e) => setNewAcc({ ...newAcc, accountNumber: e.target.value })} className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Account Type</label>
                  <select value={newAcc.accountType} onChange={(e) => setNewAcc({ ...newAcc, accountType: e.target.value })} className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]">
                    <option value="Current Operating">Current Operating</option>
                    <option value="Treasury Reserve">Treasury Reserve</option>
                    <option value="Petty Cash">Petty Cash</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Opening Balance ($)</label>
                  <input type="number" value={newAcc.balance} onChange={(e) => setNewAcc({ ...newAcc, balance: Number(e.target.value) })} className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#CED4DA]">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Link Account</Button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
