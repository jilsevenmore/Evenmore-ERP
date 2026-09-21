import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Plus, ArrowUpRight, CreditCard, X, DollarSign, Receipt, CheckCircle2, TrendingDown } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
const paymentOutGuide = {
    title: 'Payment Out & Vendor Disbursements',
    subtitle: 'Supplier payment authorization and Accounts Payable settlement',
    purpose: 'Use this page to issue disbursement vouchers against approved vendor bills. Paying a supplier decreases your company cash/bank balance and reduces Accounts Payable (AP) liability.',
    workflow: ['Receive Vendor Bill', 'Approve 3-Way Match', 'Issue Payment Out Voucher', 'AP Liability Settled'],
    keyTerms: [
        {
            term: 'Payment Out / Disbursement Voucher',
            definition: 'A formal payment authorization record documenting cash outflows paid to a vendor/supplier.',
        },
        {
            term: 'Accounts Payable (AP)',
            definition: 'Short-term debt obligations and unpaid vendor bills owed to suppliers.',
        },
        {
            term: '3-Way Matching Check',
            definition: 'Comparing PO qty & price with Delivery Challan receipt and Vendor Bill before disbursing funds.',
        },
        {
            term: 'Payment Terms (e.g., Net 30)',
            definition: 'The agreed timeframe by which full payment must be remitted after bill generation.',
        },
    ],
    tips: [
        'Always verify the vendor bill reference number before disbursing funds to prevent duplicate payment vouchers.',
    ],
};
export const PaymentOutPage = () => {
    const { paymentOuts, purchaseBills, purchaseOrders, vendors, addPaymentOut, applyVendorAdvanceToBill, getVendorAdvanceBalance, getBillOutstanding, formatCurrency, formatDateDDMMYYYY, getCurrentDateFormatted } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBillId, setSelectedBillId] = useState(purchaseBills[0]?.id || '');
    const [paymentType, setPaymentType] = useState('Final'); // [PHASE-2D] 'Advance' | 'Final'
    const [selectedPoId, setSelectedPoId] = useState(purchaseOrders[0]?.id || '');
    const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
    const [amount, setAmount] = useState(1000);
    const [mode, setMode] = useState('ACH');
    const [reference, setReference] = useState('ACH-994821');
    // [PHASE-2D] advance-adjustment widget state
    const [advanceBillId, setAdvanceBillId] = useState('');
    const [advanceApplyAmt, setAdvanceApplyAmt] = useState(0);

    const handleBillSelect = (billId) => {
        setSelectedBillId(billId);
        const bill = purchaseBills.find((b) => b.id === billId);
        if (bill) {
            const outstanding = getBillOutstanding(bill.id);
            setAmount(outstanding.balanceDue > 0 ? outstanding.balanceDue : (bill.total || bill.amount));
        }
    };

    const handleOpenModal = () => {
        const defaultBill = purchaseBills.find(b => b.status !== 'Cancelled' && getBillOutstanding(b.id).balanceDue > 0) || purchaseBills[0];
        if (defaultBill) {
            handleBillSelect(defaultBill.id);
        }
        setPaymentType('Final');
        setShowAddModal(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (paymentType === 'Advance') {
            // ── [PHASE-2D] Advance released against a PO (no bill yet for steel on credit) ──
            const po = purchaseOrders.find((p) => p.id === selectedPoId) || purchaseOrders[0];
            const vend = vendors.find((v) => v.id === po?.vendorId || v.name === po?.vendor) || po?.vendorId
                ? { id: po.vendorId, name: po.vendor }
                : vendors.find((v) => v.id === selectedVendorId);
            const res = addPaymentOut({
                vendorId: vend?.id || po?.vendorId,
                vendor: vend?.name || po?.vendor || 'Arrow Electronics Supply',
                poId: po?.id,
                poNumber: po?.poNumber,
                paymentType: 'Advance',
                date: getCurrentDateFormatted(),
                mode,
                amount: Number(amount) || 1000,
                reference: reference || `ADV-${Date.now()}`,
            });
            if (res) setShowAddModal(false);
            return;
        }
        const bill = purchaseBills.find((b) => b.id === selectedBillId) || purchaseBills[0];
        const vend = vendors.find((v) => v.name === bill?.vendor || v.id === bill?.vendorId);
        
        const res = addPaymentOut({
            vendorId: vend?.id || bill?.vendorId,
            vendor: bill?.vendor || vend?.name || 'Arrow Electronics Supply',
            billId: bill?.id,
            billNumber: bill?.billNumber || 'PB-2026-015',
            paymentType: 'Final',
            date: getCurrentDateFormatted(),
            mode,
            amount: Number(amount) || 1000,
            reference: reference || `ACH-${Date.now()}`,
        });

        if (res) {
            setShowAddModal(false);
        }
    };

    const selectedBill = purchaseBills.find((b) => b.id === selectedBillId);
    const selectedBillOutstanding = selectedBill ? getBillOutstanding(selectedBill.id) : { balanceDue: 0, paid: 0, status: 'Unpaid' };
    const isCancelled = selectedBill?.status === 'Cancelled';
    const isSettled = selectedBillOutstanding.balanceDue <= 0.01;

    const totalDisbursed = paymentOuts.reduce((sum, p) => sum + (p.amount || 0), 0);
    // [PHASE-2D] advance aggregation
    const totalAdvances = paymentOuts.filter((p) => p.paymentType === 'Advance').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalAdvanceApplied = paymentOuts.filter((p) => p.advanceApplied === true).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const openAdvanceBalance = Math.max(0, totalAdvances - totalAdvanceApplied);
    const columns = [
        {
            key: 'voucherNumber',
            header: 'Voucher Number',
            width: '13%',
            render: (p) => (
              <span className="font-mono font-bold text-text flex items-center gap-1.5 whitespace-nowrap">
                <ArrowUpRight size={13} className="text-rose-600 dark:text-rose-400 shrink-0"/>
                <span>{p.voucherNumber}</span>
              </span>
            ),
        },
        {
            key: 'vendor',
            header: 'Payee Supplier',
            width: '22%',
            render: (p) => <span className="font-bold text-text block">{p.vendor}</span>,
        },
        {
            // [PHASE-2D] new column — Advance (PO-funded) vs Final (bill settlement)
            key: 'paymentType',
            header: 'Type',
            align: 'center',
            width: '11%',
            render: (p) => {
              const isAdvance = p.paymentType === 'Advance';
              const isApplied = p.advanceApplied === true;
              return (
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                  isAdvance
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : isApplied
                    ? 'bg-violet-50 text-violet-700 border-violet-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                }`}>
                  {isAdvance ? 'Advance' : isApplied ? 'Adv. Applied' : 'Final'}
                </span>
              );
            },
        },
        {
            key: 'billNumber',
            header: 'Bill / PO Ref',
            width: '13%',
            render: (p) => <span className="font-mono font-semibold text-primary whitespace-nowrap">{p.billNumber || p.poNumber || '—'}</span>,
        },
        {
            key: 'date',
            header: 'Disbursement Date',
            width: '10%',
            render: (p) => <span className="text-muted font-mono text-[11px] whitespace-nowrap">{formatDateDDMMYYYY(p.date)}</span>,
        },
        {
            key: 'mode',
            header: 'Payment Channel',
            align: 'center',
            width: '13%',
            render: (p) => (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-border whitespace-nowrap">
                <CreditCard size={11} className="text-muted"/> {p.mode}
              </span>
            ),
        },
        {
            key: 'reference',
            header: 'Bank Transaction Ref',
            width: '10%',
            render: (p) => (
              <span className="font-mono text-[11px] text-muted whitespace-nowrap">{p.reference}</span>
            ),
        },
        {
            key: 'amount',
            header: 'Disbursed Amount',
            align: 'right',
            width: '12%',
            render: (p) => (
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                -{formatCurrency(p.amount ?? 0)}
              </span>
            ),
        },
    ];
    const avgDisbursement = paymentOuts.length > 0 ? (totalDisbursed / paymentOuts.length) : 0;
    const achCount = paymentOuts.filter(p => (p.mode || '').toLowerCase().includes('ach') || (p.mode || '').toLowerCase().includes('wire')).length;

    return (<div className="space-y-6">
      <PageHeader title="Payment Out Vouchers" subtitle="Vendor disbursements, ACH/Wire payment authorizations, automatic bank debit, and Accounts Payable liability reduction." guide={paymentOutGuide} actions={<Button icon={Plus} onClick={handleOpenModal}>
            New Payment Voucher
          </Button>}/>

      {/* Payment Out KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Disbursed" value={formatCurrency(totalDisbursed)} icon={DollarSign} />
        <StatCard label="Total Disbursed Vouchers" value={`${paymentOuts.length} Vouchers`} icon={Receipt} trend={{ positive: true, text: 'Cleared to Ledger' }} />
        {/* [PHASE-2D] advance exposure vs applied */}
        <StatCard label="Advances Released" value={formatCurrency(totalAdvances)} icon={ArrowUpRight} tone="blue" subtext={`${totalAdvanceApplied > 0 ? formatCurrency(totalAdvanceApplied) + ' applied · ' : ''}${formatCurrency(openAdvanceBalance)} open`} />
        <StatCard label="ACH & Wire Settlements" value={`${achCount} Electronic`} icon={CheckCircle2} subtext="Direct Treasury debit" />
      </div>

      {/* ── [PHASE-2D] Apply-existing-advance widget: settle a bill from vendor advance balance ── */}
      <div className="bg-white border border-[#CED4DA] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-[#1F2E4A] flex items-center gap-1.5"><ArrowUpRight size={14} className="text-blue-600" /> Adjust Bill Using Vendor Advance</h3>
            <p className="text-xs text-slate-500 mt-0.5">No cash movement — an existing advance (against a PO) settles part of a vendor bill.</p>
          </div>
          <div className="text-xs font-mono text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            Open advance: {formatCurrency(openAdvanceBalance)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_200px_auto] gap-3 mt-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vendor Bill (open balance)</label>
            <select
              value={advanceBillId}
              onChange={(e) => {
                setAdvanceBillId(e.target.value);
                const b = purchaseBills.find((x) => x.id === e.target.value);
                if (b) setAdvanceApplyAmt(Math.min(getVendorAdvanceBalance(b.vendorId, b.vendor), getBillOutstanding(b.id).balanceDue));
              }}
              className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 text-xs"
            >
              <option value="">Select an open bill...</option>
              {purchaseBills.map((b) => {
                const bal = getBillOutstanding(b.id).balanceDue;
                const adv = getVendorAdvanceBalance(b.vendorId, b.vendor);
                if (b.status === 'Cancelled' || bal <= 0.01 || adv <= 0) return null;
                return (
                  <option key={b.id} value={b.id}>{b.billNumber} — {b.vendor} (due {formatCurrency(bal)}, advance {formatCurrency(adv)})</option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Amount (max advance)</label>
            <input type="number" min="0.01" step="0.01" value={advanceApplyAmt || ''}
              onChange={(e) => setAdvanceApplyAmt(Number(e.target.value))}
              placeholder="Amount to adjust"
              className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!advanceBillId) { alert('Select a vendor bill with an open balance.'); return; }
                const b = purchaseBills.find((x) => x.id === advanceBillId);
                const maxAdv = getVendorAdvanceBalance(b?.vendorId, b?.vendor);
                const bal = getBillOutstanding(advanceBillId).balanceDue;
                const amt = Math.max(0.01, Math.min(advanceApplyAmt || maxAdv, maxAdv, bal));
                const res = applyVendorAdvanceToBill(advanceBillId, amt);
                if (res) { setAdvanceBillId(''); setAdvanceApplyAmt(0); }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer whitespace-nowrap"
            >
              Apply Advance
            </button>
          </div>
        </div>
      </div>

      <DataTable title="Vendor Disbursement Vouchers" columns={columns} data={paymentOuts} keyExtractor={(p) => p.id} searchPlaceholder="Search voucher #, vendor, or bill..." searchFilter={(p, term) => String(p.voucherNumber ?? '').toLowerCase().includes(term) ||
            String(p.vendor ?? '').toLowerCase().includes(term) ||
            (p.billNumber && String(p.billNumber ?? '').toLowerCase().includes(term)) ||
            (p.reference && String(p.reference ?? '').toLowerCase().includes(term))}/>

      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-600"/>
                <h3 className="font-bold text-base text-[#1F2E4A]">Issue Payment Out Voucher</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              {/* ── [PHASE-2D] Payment purpose: settle a bill (Final) vs fund a PO (Advance) ── */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Purpose *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('Final')}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      paymentType === 'Final'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-400'
                    }`}
                  >
                    Final — Settle Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('Advance')}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      paymentType === 'Advance'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'
                    }`}
                  >
                    {/* [PHASE-2D] advances support steel-on-credit: cash out now, adjust later */}
                    <span className="inline-flex items-center gap-1 justify-center">Advance — Fund PO</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {paymentType === 'Advance'
                    ? 'Advance released to the supplier before the bill is raised (steel on credit). It stays in Vendor Advances until adjusted against a bill.'
                    : 'Final settlement: cash goes out and Accounts Payable for the matched bill reduces.'}
                </p>
              </div>

              {paymentType === 'Final' ? (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Vendor Bill *</label>
                    <select value={selectedBillId} onChange={(e) => handleBillSelect(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                      {purchaseBills.map((b) => {
                        const outstanding = getBillOutstanding(b.id);
                        const tag = b.status === 'Cancelled' ? ' [Cancelled]' : outstanding.balanceDue <= 0.01 ? ' [Settled]' : ` [Due: ${formatCurrency(outstanding.balanceDue)}]`;
                        return (
                          <option key={b.id} value={b.id}>
                            {b.billNumber} - {b.vendor}{tag}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedBill && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Supplier:</span>
                        <span className="font-bold text-slate-800">{selectedBill.vendor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bill Total:</span>
                        <span className="font-mono text-slate-800">{formatCurrency(selectedBill.total || selectedBill.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Already Paid:</span>
                        <span className="font-mono text-slate-600">{formatCurrency(selectedBillOutstanding.paid)}</span>
                      </div>
                      <div className="flex justify-between text-amber-700 font-semibold border-t border-slate-200 pt-1">
                        <span>Remaining Balance Due:</span>
                        <span className="font-mono font-bold">{formatCurrency(selectedBillOutstanding.balanceDue)}</span>
                      </div>
                      {/* [PHASE-2D] surface any open vendor advance that the user could apply instead */}
                      {getVendorAdvanceBalance(selectedBill.vendorId, selectedBill.vendor) > 0 && (
                        <div className="flex justify-between text-blue-700 font-semibold">
                          <span>Open vendor advance (adjustable):</span>
                          <span className="font-mono font-bold">{formatCurrency(getVendorAdvanceBalance(selectedBill.vendorId, selectedBill.vendor))}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isCancelled && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      This bill is cancelled. No disbursements can be posted.
                    </div>
                  )}

                  {isSettled && !isCancelled && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                      This bill is already fully settled.
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* ── [PHASE-2D] Advance form: pick PO (or vendor) instead of a bill ── */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Purchase Order (funded by advance)</label>
                    <select value={selectedPoId} onChange={(e) => setSelectedPoId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                      {purchaseOrders.map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.poNumber} - {po.vendor} [{po.status || 'Draft'}]
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">Advance is parked as a Vendor Advance asset against this PO until the bill arrives and is adjusted.</p>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payee Supplier</label>
                    <select value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium">
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Disbursed Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={paymentType === 'Final' ? Math.max(0.01, selectedBillOutstanding.balanceDue) : undefined}
                  disabled={paymentType === 'Final' && (isCancelled || isSettled)}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 font-mono font-bold text-sm disabled:bg-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Channel</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value)} disabled={paymentType === 'Final' && (isCancelled || isSettled)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 disabled:bg-slate-100">
                    <option value="ACH">ACH Direct</option>
                    <option value="Bank Wire">Bank Wire</option>
                    <option value="Corporate Card">Corporate Card</option>
                    <option value="Cheque">Corporate Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Voucher / Ref #</label>
                  <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} disabled={paymentType === 'Final' && (isCancelled || isSettled)} className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-mono disabled:bg-slate-100"/>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={(paymentType === 'Final' && (isCancelled || isSettled)) || amount <= 0 || (paymentType === 'Final' && amount > selectedBillOutstanding.balanceDue + 0.01)} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-sm cursor-pointer">
                  {paymentType === 'Advance' ? 'Release Advance Voucher' : 'Post Voucher & Disburse'}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
};
