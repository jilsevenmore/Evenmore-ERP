import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { X, ChevronRight, ChevronLeft, CheckCircle2, User, Building2, Receipt, Percent, BookOpen, CreditCard, MapPin, Plus, Trash2 } from 'lucide-react';

const STEPS = [
    { id: 1, label: 'Basic Info', icon: User },
    { id: 2, label: 'GST & Tax', icon: Receipt },
    { id: 3, label: 'TDS / TCS', icon: Percent },
    { id: 4, label: 'Ledger', icon: BookOpen },
    { id: 5, label: 'Payment & Bank', icon: CreditCard },
    { id: 6, label: 'Addresses & POC', icon: MapPin },
];

export const PartyWizardModal = ({ isOpen, onClose, onSave, existingParty = null }) => {
    const [step, setStep] = useState(1);
    const [sameAsBilling, setSameAsBilling] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        code: existingParty?.code || `PARTY-${Math.floor(100 + Math.random() * 900)}`,
        type: existingParty?.type || 'Customer',
        name: existingParty?.name || '',
        phone: existingParty?.phone || '',
        email: existingParty?.email || '',
        status: existingParty?.status || 'Active',
        // GST
        gstTreatment: existingParty?.gstTreatment || 'Registered Business',
        gstin: existingParty?.gstin || '',
        placeOfSupply: existingParty?.placeOfSupply || 'Maharashtra (27)',
        gstNotes: existingParty?.gstNotes || '',
        // TDS / TCS
        tdsApplicable: existingParty?.tdsApplicable ?? false,
        tdsSection: existingParty?.tdsSection || '194C',
        tdsRate: existingParty?.tdsRate ?? 2,
        tcsApplicable: existingParty?.tcsApplicable ?? false,
        tcsRate: existingParty?.tcsRate ?? 0.1,
        // Ledger
        ledgerAccount: existingParty?.ledgerAccount || '1210 - Accounts Receivable',
        // Payment & Bank
        creditLimit: existingParty?.creditLimit ?? 50000,
        paymentTerms: existingParty?.paymentTerms || 'Net 30',
        bankName: existingParty?.bankName || '',
        bankAccountNumber: existingParty?.bankAccountNumber || '',
        ifscCode: existingParty?.ifscCode || '',
        accountHolderName: existingParty?.accountHolderName || '',
        openingBalance: existingParty?.openingBalance ?? 0,
        balance: existingParty?.balance ?? 0,
        // Addresses & Contacts
        billingAddress: existingParty?.billingAddress || {
            line1: '',
            line2: '',
            city: '',
            state: 'Maharashtra',
            pincode: '',
        },
        shippingAddress: existingParty?.shippingAddress || {
            line1: '',
            line2: '',
            city: '',
            state: 'Maharashtra',
            pincode: '',
        },
        contacts: existingParty?.contacts && existingParty.contacts.length > 0 ? existingParty.contacts : [
            { id: 'cnt-1', name: '', role: 'Primary POC', phone: '', email: '' },
        ],
    });

    if (!isOpen) return null;

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrorMsg('');
    };

    const updateBillingAddress = (field, value) => {
        setFormData((prev) => {
            const updatedBilling = { ...prev.billingAddress, [field]: value };
            return {
                ...prev,
                billingAddress: updatedBilling,
                shippingAddress: sameAsBilling ? { ...updatedBilling } : prev.shippingAddress,
            };
        });
        setErrorMsg('');
    };

    const updateShippingAddress = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            shippingAddress: { ...prev.shippingAddress, [field]: value },
        }));
    };

    const handleAddContact = () => {
        setFormData((prev) => ({
            ...prev,
            contacts: [
                ...prev.contacts,
                { id: `cnt-${Date.now()}`, name: '', role: 'Accounts POC', phone: '', email: '' },
            ],
        }));
    };

    const handleRemoveContact = (id) => {
        if (formData.contacts.length <= 1) return;
        setFormData((prev) => ({
            ...prev,
            contacts: prev.contacts.filter((c) => c.id !== id),
        }));
    };

    const handleUpdateContact = (id, field, value) => {
        setFormData((prev) => ({
            ...prev,
            contacts: prev.contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
        }));
    };

    const validateStep = (currentStep) => {
        if (currentStep === 1) {
            if (!formData.name.trim()) {
                setErrorMsg('Party / Company Legal Name is required.');
                return false;
            }
        }
        if (currentStep === 2) {
            if (formData.gstTreatment === 'Registered Business') {
                if (!formData.gstin || formData.gstin.trim().length < 5) {
                    setErrorMsg('A valid GSTIN is required for Registered Business entities.');
                    return false;
                }
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((prev) => Math.min(6, prev + 1));
        }
    };

    const handleBack = () => {
        setErrorMsg('');
        setStep((prev) => Math.max(1, prev - 1));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateStep(step)) return;

        const payload = {
            ...formData,
            shippingAddress: sameAsBilling ? { ...formData.billingAddress } : formData.shippingAddress,
        };
        onSave(payload);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-[#CED4DA] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-[#1F2E4A] text-white p-5 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-mono tracking-wider uppercase text-blue-200">
                            Partner Master Registry
                        </span>
                        <h2 className="text-lg font-bold">
                            {existingParty ? `Edit Party: ${existingParty.name}` : 'Register New Commercial Party'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Step Progress Bar */}
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-[500px] gap-2">
                        {STEPS.map((s) => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isCompleted = step > s.id;
                            return (
                                <div
                                    key={s.id}
                                    onClick={() => isCompleted && setStep(s.id)}
                                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                                        isActive
                                            ? 'bg-[#1F2E4A] text-white shadow-xs'
                                            : isCompleted
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer hover:bg-emerald-100'
                                            : 'text-slate-400 opacity-70'
                                    }`}
                                >
                                    {isCompleted ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Icon size={13} />}
                                    <span>{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium animate-in fade-in duration-100">
                        {errorMsg}
                    </div>
                )}

                {/* Step Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                    {/* STEP 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-[#1F2E4A] border-b pb-2 flex items-center gap-2">
                                <Building2 size={16} /> Step 1: Entity Classification & Basic Details
                            </h3>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Party Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => updateField('type', e.target.value)}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA] font-medium"
                                    >
                                        <option value="Customer">Customer (Client)</option>
                                        <option value="Vendor">Vendor (Supplier)</option>
                                        <option value="Both">Both (Dual Partner)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Partner Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA] font-mono uppercase"
                                        placeholder="PARTY-001"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Lifecycle Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => updateField('status', e.target.value)}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA]"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Legal Company / Entity Name *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA]"
                                    placeholder="e.g. Reliance Industrial Systems Ltd"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Corporate Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA]"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Official Billing Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA]"
                                        placeholder="billing@partner.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: GST & Tax */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-[#1F2E4A] border-b pb-2 flex items-center gap-2">
                                <Receipt size={16} /> Step 2: GST Treatment & Tax Identification
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">GST Treatment *</label>
                                    <select
                                        value={formData.gstTreatment}
                                        onChange={(e) => updateField('gstTreatment', e.target.value)}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA]"
                                    >
                                        <option value="Registered Business">Registered Business (Regular / Composition)</option>
                                        <option value="Unregistered Business">Unregistered Business</option>
                                        <option value="Consumer">Consumer (B2C Retail)</option>
                                        <option value="Overseas">Overseas / Export Entity</option>
                                        <option value="SEZ">Special Economic Zone (SEZ Unit)</option>
                                        <option value="Deemed Export">Deemed Export</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        GSTIN Number {formData.gstTreatment === 'Registered Business' && '*'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.gstin}
                                        onChange={(e) => updateField('gstin', e.target.value.toUpperCase())}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA] font-mono uppercase"
                                        placeholder="27AABCA1234F1Z5"
                                        disabled={formData.gstTreatment !== 'Registered Business' && formData.gstTreatment !== 'SEZ'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Place of Supply (State / Region)</label>
                                <select
                                    value={formData.placeOfSupply}
                                    onChange={(e) => updateField('placeOfSupply', e.target.value)}
                                    className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA]"
                                >
                                    <option value="Maharashtra (27)">Maharashtra (27)</option>
                                    <option value="Karnataka (29)">Karnataka (29)</option>
                                    <option value="Delhi (07)">Delhi (07)</option>
                                    <option value="Tamil Nadu (33)">Tamil Nadu (33)</option>
                                    <option value="Gujarat (24)">Gujarat (24)</option>
                                    <option value="Telangana (36)">Telangana (36)</option>
                                    <option value="Other / International (99)">Other / International (99)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">GST / Tax Invoicing Notes</label>
                                <textarea
                                    rows={3}
                                    value={formData.gstNotes}
                                    onChange={(e) => updateField('gstNotes', e.target.value)}
                                    className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA] resize-none"
                                    placeholder="HSN exemption codes, LUT registration number, or tax exemption declarations..."
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: TDS / TCS */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-[#1F2E4A] border-b pb-2 flex items-center gap-2">
                                <Percent size={16} /> Step 3: Direct Tax Withholding (TDS / TCS)
                            </h3>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-bold text-slate-800 block">TDS Withholding Applicable</span>
                                        <p className="text-slate-500 text-[11px]">Deduct Tax at Source on vendor disbursements</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.tdsApplicable}
                                        onChange={(e) => updateField('tdsApplicable', e.target.checked)}
                                        className="w-4 h-4 rounded text-[#1F2E4A] focus:ring-[#1F2E4A] cursor-pointer"
                                    />
                                </div>

                                {formData.tdsApplicable && (
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">TDS Section Code</label>
                                            <select
                                                value={formData.tdsSection}
                                                onChange={(e) => updateField('tdsSection', e.target.value)}
                                                className="w-full border border-[#CED4DA] rounded-lg p-2 bg-white"
                                            >
                                                <option value="194C">194C - Contractor Works (1% / 2%)</option>
                                                <option value="194J">194J - Professional / Tech Fees (10%)</option>
                                                <option value="194Q">194Q - Purchase of Goods (0.1%)</option>
                                                <option value="194H">194H - Commission & Brokerage (5%)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">TDS Rate (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={formData.tdsRate}
                                                onChange={(e) => updateField('tdsRate', parseFloat(e.target.value) || 0)}
                                                className="w-full border border-[#CED4DA] rounded-lg p-2 bg-white font-mono"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-bold text-slate-800 block">TCS Collection Applicable</span>
                                        <p className="text-slate-500 text-[11px]">Collect Tax at Source on outward sales above limits</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.tcsApplicable}
                                        onChange={(e) => updateField('tcsApplicable', e.target.checked)}
                                        className="w-4 h-4 rounded text-[#1F2E4A] focus:ring-[#1F2E4A] cursor-pointer"
                                    />
                                </div>

                                {formData.tcsApplicable && (
                                    <div className="pt-2 border-t border-slate-200">
                                        <label className="block font-semibold text-slate-700 mb-1">TCS Rate (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.tcsRate}
                                            onChange={(e) => updateField('tcsRate', parseFloat(e.target.value) || 0)}
                                            className="w-full border border-[#CED4DA] rounded-lg p-2 bg-white font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Ledger */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-[#1F2E4A] border-b pb-2 flex items-center gap-2">
                                <BookOpen size={16} /> Step 4: General Ledger Account Assignment
                            </h3>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Primary Chart of Accounts Mapping *</label>
                                <select
                                    value={formData.ledgerAccount}
                                    onChange={(e) => updateField('ledgerAccount', e.target.value)}
                                    className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA]"
                                >
                                    <option value="1210 - Accounts Receivable">1210 - Accounts Receivable (Sundry Debtors)</option>
                                    <option value="2010 - Accounts Payable">2010 - Accounts Payable (Sundry Creditors)</option>
                                    <option value="1220 - Advance Payments to Suppliers">1220 - Advance Payments to Suppliers</option>
                                    <option value="2020 - Client Advances & Deposits">2020 - Client Advances & Deposits</option>
                                </select>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs space-y-1">
                                <p className="font-semibold">Ledger Synchronization Notice</p>
                                <p className="text-[11px] text-blue-700">
                                    All invoices, bills, debit/credit notes, and cash receipts posted for this party will
                                    automatically reflect in real-time under this selected balance sheet ledger.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Payment & Bank */}
                    {step === 5 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-[#1F2E4A] border-b pb-2 flex items-center gap-2">
                                <CreditCard size={16} /> Step 5: Commercial Terms & Banking Information
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Credit Limit ($)</label>
                                    <input
                                        type="number"
                                        value={formData.creditLimit}
                                        onChange={(e) => updateField('creditLimit', parseFloat(e.target.value) || 0)}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA] font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Default Payment Terms</label>
                                    <select
                                        value={formData.paymentTerms}
                                        onChange={(e) => updateField('paymentTerms', e.target.value)}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA]"
                                    >
                                        <option value="Immediate">Immediate / Advance</option>
                                        <option value="Net 15">Net 15 Days</option>
                                        <option value="Net 30">Net 30 Days</option>
                                        <option value="Net 45">Net 45 Days</option>
                                        <option value="Net 60">Net 60 Days</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => updateField('bankName', e.target.value)}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA]"
                                        placeholder="e.g. HDFC Bank Ltd"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Bank Account Number</label>
                                    <input
                                        type="text"
                                        value={formData.bankAccountNumber}
                                        onChange={(e) => updateField('bankAccountNumber', e.target.value)}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA] font-mono"
                                        placeholder="998102938192"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">IFSC / Swift Routing Code</label>
                                    <input
                                        type="text"
                                        value={formData.ifscCode}
                                        onChange={(e) => updateField('ifscCode', e.target.value.toUpperCase())}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA] font-mono uppercase"
                                        placeholder="HDFC0001245"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Opening Balance ($)</label>
                                    <input
                                        type="number"
                                        value={formData.openingBalance}
                                        onChange={(e) => updateField('openingBalance', parseFloat(e.target.value) || 0)}
                                        className="w-full border border-[#CED4DA] rounded-lg p-2.5 bg-[#F8F9FA] font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 6: Addresses & Contacts */}
                    {step === 6 && (
                        <div className="space-y-5">
                            <h3 className="font-bold text-sm text-[#1F2E4A] border-b pb-2 flex items-center gap-2">
                                <MapPin size={16} /> Step 6: Locations, Addresses & Person of Contact
                            </h3>

                            {/* Billing Address */}
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                                    Billing Headquarters Address
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            value={formData.billingAddress.line1}
                                            onChange={(e) => updateBillingAddress('line1', e.target.value)}
                                            className="w-full border border-[#CED4DA] rounded-lg p-2 bg-white"
                                            placeholder="Address Line 1 (Street, Building, Suite)"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            value={formData.billingAddress.city}
                                            onChange={(e) => updateBillingAddress('city', e.target.value)}
                                            className="w-full border border-[#CED4DA] rounded-lg p-2 bg-white"
                                            placeholder="City (e.g. Mumbai)"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            value={formData.billingAddress.state}
                                            onChange={(e) => updateBillingAddress('state', e.target.value)}
                                            className="w-full border border-[#CED4DA] rounded-lg p-2 bg-white"
                                            placeholder="State"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            value={formData.billingAddress.pincode}
                                            onChange={(e) => updateBillingAddress('pincode', e.target.value)}
                                            className="w-full border border-[#CED4DA] rounded-lg p-2 bg-white font-mono"
                                            placeholder="Pincode / Postal Code"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                                        Shipping / Warehouse Delivery Address
                                    </span>
                                    <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={sameAsBilling}
                                            onChange={(e) => {
                                                setSameAsBilling(e.target.checked);
                                                if (e.target.checked) {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        shippingAddress: { ...prev.billingAddress },
                                                    }));
                                                }
                                            }}
                                            className="w-3.5 h-3.5 rounded text-[#1F2E4A]"
                                        />
                                        Same as Billing
                                    </label>
                                </div>

                                {!sameAsBilling && (
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={formData.shippingAddress.line1}
                                                onChange={(e) => updateShippingAddress('line1', e.target.value)}
                                                className="w-full border border-[#CED4DA] rounded-lg p-2 bg-white"
                                                placeholder="Shipping Line 1"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={formData.shippingAddress.city}
                                                onChange={(e) => updateShippingAddress('city', e.target.value)}
                                                className="w-full border border-[#CED4DA] rounded-lg p-2 bg-white"
                                                placeholder="City"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={formData.shippingAddress.pincode}
                                                onChange={(e) => updateShippingAddress('pincode', e.target.value)}
                                                className="w-full border border-[#CED4DA] rounded-lg p-2 bg-white font-mono"
                                                placeholder="Pincode"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Contacts List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800">Person of Contact (POCs)</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        icon={Plus}
                                        onClick={handleAddContact}
                                        className="text-xs"
                                    >
                                        Add POC
                                    </Button>
                                </div>

                                {formData.contacts.map((contact, idx) => (
                                    <div key={contact.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-700 text-[11px]">POC #{idx + 1}</span>
                                            {formData.contacts.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveContact(contact.id)}
                                                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <input
                                                type="text"
                                                value={contact.name}
                                                onChange={(e) => handleUpdateContact(contact.id, 'name', e.target.value)}
                                                className="border border-[#CED4DA] rounded-lg p-2 text-xs bg-[#F8F9FA]"
                                                placeholder="POC Name"
                                            />
                                            <input
                                                type="text"
                                                value={contact.role}
                                                onChange={(e) => handleUpdateContact(contact.id, 'role', e.target.value)}
                                                className="border border-[#CED4DA] rounded-lg p-2 text-xs bg-[#F8F9FA]"
                                                placeholder="Designation / Role"
                                            />
                                            <input
                                                type="text"
                                                value={contact.phone}
                                                onChange={(e) => handleUpdateContact(contact.id, 'phone', e.target.value)}
                                                className="border border-[#CED4DA] rounded-lg p-2 text-xs bg-[#F8F9FA]"
                                                placeholder="Direct Phone"
                                            />
                                            <input
                                                type="email"
                                                value={contact.email}
                                                onChange={(e) => handleUpdateContact(contact.id, 'email', e.target.value)}
                                                className="border border-[#CED4DA] rounded-lg p-2 text-xs bg-[#F8F9FA]"
                                                placeholder="Email Address"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
                    <div>
                        {step > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                icon={ChevronLeft}
                                onClick={handleBack}
                            >
                                Back
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        {step < 6 ? (
                            <Button type="button" icon={ChevronRight} onClick={handleNext}>
                                Continue to Step {step + 1}
                            </Button>
                        ) : (
                            <Button type="button" icon={CheckCircle2} onClick={handleSubmit}>
                                {existingParty ? 'Update Party' : 'Save & Register Party'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartyWizardModal;
