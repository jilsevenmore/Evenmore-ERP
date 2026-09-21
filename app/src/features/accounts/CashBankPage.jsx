import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Landmark, Plus, DollarSign, CheckCircle2, X } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useTranslation } from '../../i18n';
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
    const { bankAccounts, addBankAccount, addInterbankTransfer, transfers = [], formatCurrency, formatDateDDMMYYYY, getCurrentDateFormatted } = useERP();
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false); // [PHASE-2E] inter-bank transfer panel
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [transferAmt, setTransferAmt] = useState(0);
    const [transferRef, setTransferRef] = useState('');
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
            header: t("finance.balance"),
            key: 'balance',
            align: 'right',
            render: (a) => (<span className="font-bold text-slate-900 font-mono text-sm">
          {formatCurrency(a.balance)}
        </span>),
        },
        {
            header: 'Last Reconciled',
            key: 'lastReconciled',
            align: 'center',
            render: (a) => (<span className="text-slate-500 text-xs">
          {formatDateDDMMYYYY(a.lastReconciled || 'Oct 24, 2026')}
        </span>),
        },
        {
            header: t("table.status"),
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
            // [PHASE-4] Sweven INR default (was hardcoded 'USD')
            currency: 'INR',
            balance: Number(newAcc.balance) || 0,
            lastReconciled: getCurrentDateFormatted(),
        });
        setIsModalOpen(false);
    };
    return (<div className="space-y-6">
      <PageHeader title={t("navigation.cashBank")} subtitle="Real-time liquidity monitoring, treasury accounts, and automated statement reconciliation." guide={cashBankGuide} actions={<Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Bank Account
          </Button>}/>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("dashboard.bankBalance")} value={formatCurrency(totalLiquidity)} icon={DollarSign} highlight/>
        <StatCard label={t("finance.accounts")} value={`${bankAccounts.length} Accounts`} icon={Landmark}/>
        {/* [PHASE-2E] live treasury movements + open transfers */}
        <StatCard label={t("navigation.transfers")} value={`${transfers.length} Movements`} icon={CheckCircle2} subtext={transfers.length > 0 ? `Latest: ${transfers[0].transferNumber}` : 'No inter-bank movements yet'} />
      </div>

      {/* ── [PHASE-2E] Inter-Bank Transfer (treasury reshuffling, no P&L impact) ── */}
      <div className="bg-white border border-[#CED4DA] rounded-lg shadow-xs">
        <div className="px-5 py-4 border-b border-[#CED4DA] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#1F2E4A]">{t("finance.bankTransfer")}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Move cash between company bank accounts. A mirrored journal entry is auto-posted; P&amp;L is unaffected.</p>
          </div>
          <button onClick={() => setShowTransfer(!showTransfer)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap transition">
            {showTransfer ? t("common.close") : t("finance.bankTransfer")}
          </button>
        </div>
        {showTransfer && (
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_160px_auto] gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">From Account *</label>
                <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 text-xs">
                  <option value="">Select source...</option>
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.bankName} — {formatCurrency(a.balance)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">To Account *</label>
                <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 text-xs">
                  <option value="">Select destination...</option>
                  {bankAccounts.filter((a) => a.id !== transferFrom).map((a) => (
                    <option key={a.id} value={a.id}>{a.bankName} — {formatCurrency(a.balance)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Amount (₹) *</label>
                <input type="number" min="0.01" step="0.01" value={transferAmt || ''} onChange={(e) => setTransferAmt(Number(e.target.value))} placeholder="0" className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 font-mono text-xs" />
              </div>
              <button
                type="button"
                disabled={!transferFrom || !transferTo || transferFrom === transferTo || transferAmt <= 0}
                onClick={() => {
                  addInterbankTransfer({ fromAccountId: transferFrom, toAccountId: transferTo, amount: transferAmt, reference: transferRef, date: getCurrentDateFormatted() });
                  setTransferFrom(''); setTransferTo(''); setTransferAmt(0); setTransferRef('');
                }}
                className="px-4 py-2 bg-[#1F2E4A] hover:bg-[#152033] text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 transition"
              >
                {t("common.submit")}
              </button>
            </div>
            <div className="mt-3">
              <input type="text" value={transferRef} onChange={(e) => setTransferRef(e.target.value)} placeholder="Internal reference (optional)" className="w-full sm:w-80 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 bg-slate-50" />
            </div>
          </div>
        )}
      </div>

      {/* [PHASE-2E] Recent inter-bank transfers log */}
      {transfers.length > 0 && (
        <div className="bg-white border border-[#CED4DA] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="font-bold text-xs text-[#1F2E4A]">Inter-Bank Transfer Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Ref</th>
                  <th className="py-2 px-3">{t("table.date")}</th>
                  <th className="py-2 px-3">From</th>
                  <th className="py-2 px-3">To</th>
                  <th className="py-2 px-3 text-right">{t("common.amount")}</th>
                  <th className="py-2 px-3 text-center">{t("table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.slice(0, 10).map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/70">
                    <td className="p-2 font-mono font-semibold text-slate-800">{tr.transferNumber}</td>
                    <td className="p-2 font-mono text-slate-500">{formatDateDDMMYYYY(tr.date)}</td>
                    <td className="p-2">{tr.fromAccount}</td>
                    <td className="p-2">{tr.toAccount}</td>
                    <td className="p-2 text-right font-mono font-bold text-rose-600">{formatCurrency(tr.amount)}</td>
                    <td className="p-2 text-center"><span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{tr.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DataTable title={t("navigation.cashBank")} data={bankAccounts} columns={columns} keyExtractor={(a) => a.id} searchPlaceholder={t("table.search")} searchFilter={(a, term) => a.bankName.toLowerCase().includes(term) ||
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
                  {t("modal.cancel")}
                </Button>
                <Button type="submit">{t("modal.submit")}</Button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
