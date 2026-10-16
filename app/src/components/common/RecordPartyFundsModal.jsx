import React, { useState, useMemo } from 'react';
import { X, CreditCard, Receipt, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { sanitizeNumberInput, handleNumberInputFocus } from '../../utils/stringUtils';

export const RecordPartyFundsModal = ({ isOpen, onClose, party, onSaved }) => {
    const {
        invoices = [],
        recordPartyFunds,
        getInvoiceOutstanding,
        formatCurrency,
        getCurrentDateFormatted,
    } = useERP();

    const [formalAmount, setFormalAmount] = useState('');
    const [cashAmount, setCashAmount] = useState('');
    const [formalMode, setFormalMode] = useState('Bank Transfer');
    const [cashMode, setCashMode] = useState('Cash');
    const [formalReference, setFormalReference] = useState('');
    const [cashReference, setCashReference] = useState('');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentDate, setPaymentDate] = useState(getCurrentDateFormatted());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Eligible invoices for this party
    const eligibleInvoices = useMemo(() => {
        if (!party) return [];
        return invoices.filter((inv) => {
            const matchesParty =
                (inv.customerId && (inv.customerId === party.id || inv.customerId === party.code)) ||
                (inv.partyId && (inv.partyId === party.id || inv.partyId === party.code)) ||
                (inv.customer && String(inv.customer).trim().toLowerCase() === String(party.name).trim().toLowerCase()) ||
                (inv.partyName && String(inv.partyName).trim().toLowerCase() === String(party.name).trim().toLowerCase());

            if (!matchesParty) return false;
            if (inv.status === 'Cancelled' || inv.status === 'Draft' || inv.finalized === false) return false;
            const out = getInvoiceOutstanding(inv.id);
            return out.balanceDue > 0.01;
        });
    }, [invoices, party, getInvoiceOutstanding]);

    const selectedInvoice = useMemo(() => {
        return eligibleInvoices.find((i) => i.id === selectedInvoiceId) || null;
    }, [eligibleInvoices, selectedInvoiceId]);

    const selectedInvoiceDue = useMemo(() => {
        if (!selectedInvoice) return 0;
        return getInvoiceOutstanding(selectedInvoice.id).balanceDue;
    }, [selectedInvoice, getInvoiceOutstanding]);

    if (!isOpen || !party) return null;

    const numFormal = Number(formalAmount) || 0;
    const numCash = Number(cashAmount) || 0;
    const totalAmount = numFormal + numCash;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (numFormal < 0 || numCash < 0) {
            setErrorMsg('Amounts cannot be negative.');
            return;
        }

        if (numFormal === 0 && numCash === 0) {
            setErrorMsg('Please enter at least one amount (Formal Amount or Cash Amount).');
            return;
        }

        if (selectedInvoice && numFormal > selectedInvoiceDue + 0.01) {
            setErrorMsg(`Formal amount (${formatCurrency(numFormal)}) exceeds invoice balance due (${formatCurrency(selectedInvoiceDue)}). Any excess should be recorded as unallocated customer advance without invoice selection.`);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await recordPartyFunds({
                partyId: party.id,
                partyName: party.name,
                formalAmount: numFormal,
                cashAmount: numCash,
                formalMode,
                cashMode,
                formalReference: formalReference || (numFormal > 0 ? `TXN-FORMAL-${Date.now()}` : ''),
                cashReference: cashReference || (numCash > 0 ? `TXN-CASH-${Date.now()}` : ''),
                date: paymentDate,
                invoiceId: selectedInvoice?.id || null,
                invoiceNumber: selectedInvoice?.invoiceNumber || '',
                description: description || (selectedInvoice ? `Funds received against ${selectedInvoice.invoiceNumber}` : 'Account funds deposit'),
                notes,
            });

            if (res) {
                onSaved?.(res);
                onClose();
            }
        } catch (err) {
            console.error('Failed to record party funds:', err);
            setErrorMsg(err.message || 'Failed to record funds.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto flex flex-col text-xs animate-in fade-in duration-150">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <div>
                        <span className="font-mono text-[10px] font-bold text-primary uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {party.code || 'PARTY'}
                        </span>
                        <h3 className="font-bold text-base text-slate-800 mt-1">Record Funds & Receipts</h3>
                        <p className="text-[11px] text-slate-500">
                            {party.name} • Live Balance: <strong className="font-mono text-slate-700">{formatCurrency(party.balance || 0)}</strong>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
                    {errorMsg && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center gap-2 font-medium">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Dual Stream Split Explanation */}
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed">
                        <strong>Dual Amount Settlement:</strong> Enter <strong>Formal Amount</strong> for GST invoices / official bank transfers, and <strong>Cash Amount</strong> for unbilled cash desk receipts. Both streams are optional, non-negative, and recorded as separate audit trails.
                    </div>

                    {/* Invoice Allocation (Optional) */}
                    <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                            Link to Open Invoice (Optional)
                        </label>
                        <select
                            value={selectedInvoiceId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setSelectedInvoiceId(id);
                                if (id) {
                                    const inv = eligibleInvoices.find((i) => i.id === id);
                                    if (inv) {
                                        const due = getInvoiceOutstanding(inv.id).balanceDue;
                                        setFormalAmount(due > 0 ? due : '');
                                    }
                                }
                            }}
                            className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium"
                        >
                            <option value="">-- No Specific Invoice (Customer Advance / Account Credit) --</option>
                            {eligibleInvoices.map((inv) => {
                                const out = getInvoiceOutstanding(inv.id);
                                return (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.invoiceNumber} — Due: {formatCurrency(out.balanceDue)} (Total: {formatCurrency(out.total)})
                                    </option>
                                );
                            })}
                        </select>
                        {selectedInvoice && (
                            <p className="text-[11px] text-emerald-700 font-medium mt-1">
                                ✓ Target Invoice Due: {formatCurrency(selectedInvoiceDue)}. Formal amount will automatically apply towards settling this invoice.
                            </p>
                        )}
                    </div>

                    {/* TWO SEPARATED AMOUNT SECTIONS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* 1. FORMAL AMOUNT */}
                        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2.5">
                            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs pb-1 border-b border-emerald-200">
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Formal Amount (With Bill)</span>
                            </div>

                            <div>
                                <label className="block text-slate-600 font-semibold text-[11px] mb-1">
                                    Formal Received (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={formalAmount}
                                    onFocus={handleNumberInputFocus}
                                    onChange={(e) => setFormalAmount(sanitizeNumberInput(e.target.value))}
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono font-bold text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-600 font-semibold text-[10px] mb-1">Payment Mode</label>
                                <select
                                    value={formalMode}
                                    onChange={(e) => setFormalMode(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-slate-800 text-[11px]"
                                >
                                    <option value="Bank Transfer">Bank Wire / ACH</option>
                                    <option value="UPI">UPI / Digital</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Corporate Card">Corporate Card</option>
                                    <option value="Cash">Cash (With Bill)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-600 font-semibold text-[10px] mb-1">Formal Ref / UTR #</label>
                                <input
                                    type="text"
                                    placeholder="e.g. UTR-982187312"
                                    value={formalReference}
                                    onChange={(e) => setFormalReference(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-1.5 bg-white font-mono text-[11px] text-slate-800"
                                />
                            </div>
                        </div>

                        {/* 2. CASH AMOUNT */}
                        <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2.5">
                            <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs pb-1 border-b border-amber-200">
                                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                                <span>Cash Amount (Without Bill)</span>
                            </div>

                            <div>
                                <label className="block text-slate-600 font-semibold text-[11px] mb-1">
                                    Cash Received (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={cashAmount}
                                    onFocus={handleNumberInputFocus}
                                    onChange={(e) => setCashAmount(sanitizeNumberInput(e.target.value))}
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono font-bold text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-600 font-semibold text-[10px] mb-1">Cash Mode</label>
                                <select
                                    value={cashMode}
                                    onChange={(e) => setCashMode(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-slate-800 text-[11px]"
                                >
                                    <option value="Cash">Cash Desk</option>
                                    <option value="UPI">Counter UPI</option>
                                    <option value="Cheque">Counter Cheque</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-600 font-semibold text-[10px] mb-1">Cash Ref / Receipt #</label>
                                <input
                                    type="text"
                                    placeholder="e.g. CPR-COUNTER-01"
                                    value={cashReference}
                                    onChange={(e) => setCashReference(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-1.5 bg-white font-mono text-[11px] text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Common Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Receipt Date</label>
                            <input
                                type="date"
                                required
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Description / Memo</label>
                            <input
                                type="text"
                                placeholder="Payment narrative..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                            />
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-semibold">
                        <span className="text-slate-600">Total Funds Collected:</span>
                        <div className="text-right">
                            <span className="font-mono text-sm font-extrabold text-slate-900">{formatCurrency(totalAmount)}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">
                                Formal: {formatCurrency(numFormal)} | Cash: {formatCurrency(numCash)}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || totalAmount <= 0}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Recording...' : 'Record Dual Funds'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPartyFundsModal;
