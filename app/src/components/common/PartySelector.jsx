import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, UserPlus, Building, Phone, Mail, MapPin, FileText, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

const PARTY_TYPES = ['Walk-in', 'Contractor', 'Individual', 'Business'];

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh'
];

export default function PartySelector({
    value = {},
    onChange,
    customers: propCustomers,
    // Opt-in: offer CRM leads alongside registered customers. Off by default so
    // the documents that must raise against a real party keep that rule.
    leads = [],
    showAddressFields = true,
    disabled = false,
    className = '',
}) {
    const { customers: contextCustomers, parties: contextParties, companyProfile } = useERP() || {};
    const customers = propCustomers || contextCustomers || [];
    const parties = contextParties || [];

    // Customers and leads live in different collections and can share a name,
    // so an option's value is prefixed to keep the two apart when it comes back.
    const CUSTOMER_PREFIX = 'customer:';
    const LEAD_PREFIX = 'lead:';
    const leadOptions = useMemo(() => leads.map((lead) => ({
        value: `${LEAD_PREFIX}${lead.id}`,
        lead,
    })), [leads]);
    const hasLeads = leadOptions.length > 0;

    const isOneTime = Boolean(value.isOneTimeParty);
    const [mode, setMode] = useState(isOneTime ? 'onetime' : 'registered');
    const [showAddresses, setShowAddresses] = useState(false);
    const [sameAsBilling, setSameAsBilling] = useState(true);

    // Sync mode when value.isOneTimeParty changes externally
    useEffect(() => {
        if (value.isOneTimeParty && mode !== 'onetime') {
            setMode('onetime');
        } else if (!value.isOneTimeParty && value.customerId && mode !== 'registered') {
            setMode('registered');
        }
    }, [value.isOneTimeParty, value.customerId]);

    const handleModeSwitch = (newMode) => {
        if (disabled) return;
        setMode(newMode);
        if (newMode === 'registered') {
            const firstCust = customers.find(c => String(c.id) === String(value.customerId)) || customers[0];
            const party = parties.find(p => String(p.id) === String(firstCust?.id)) || firstCust;
            onChange?.({
                isOneTimeParty: false,
                selectedLeadId: '',
                customerId: firstCust?.id || '',
                customer: firstCust?.name || '',
                partyName: firstCust?.name || '',
                partyType: firstCust?.type || 'Customer',
                partyPhone: party?.phone || firstCust?.phone || '',
                partyEmail: party?.email || firstCust?.email || '',
                partyGstin: party?.gstin || firstCust?.gstin || '',
                placeOfSupply: party?.placeOfSupply || firstCust?.placeOfSupply || '',
                billingAddress: party?.billingAddress || firstCust?.billingAddress || { line1: '', city: '', state: '', pincode: '', country: 'India' },
                shippingAddress: party?.shippingAddress || firstCust?.shippingAddress || { line1: '', city: '', state: '', pincode: '', country: 'India' },
            });
        } else {
            onChange?.({
                isOneTimeParty: true,
                customerId: '',
                customer: value.partyName || value.customer || '',
                partyName: value.partyName || value.customer || '',
                partyType: value.partyType || 'Walk-in',
                partyPhone: value.partyPhone || value.phone || '',
                partyEmail: value.partyEmail || value.email || '',
                partyGstin: value.partyGstin || value.gstin || '',
                placeOfSupply: value.placeOfSupply || companyProfile?.state || '',
                billingAddress: value.billingAddress || { line1: '', city: '', state: companyProfile?.state || '', pincode: '', country: 'India' },
                shippingAddress: value.shippingAddress || { line1: '', city: '', state: companyProfile?.state || '', pincode: '', country: 'India' },
            });
        }
    };

    const handleRegisteredChange = (optionValue) => {
        // A lead is not a party: it has no ledger, addresses or GSTIN, so it is
        // raised against the document's own party columns and linked by id.
        if (typeof optionValue === 'string' && optionValue.startsWith(LEAD_PREFIX)) {
            const leadId = optionValue.slice(LEAD_PREFIX.length);
            const lead = leads.find((l) => String(l.id) === leadId);
            const leadName = lead?.displayName || lead?.company || lead?.name || '';
            onChange?.({
                isOneTimeParty: false,
                selectedLeadId: leadId,
                customerId: '',
                customer: leadName,
                partyName: leadName,
                partyType: 'Lead',
                partyPhone: lead?.phone || '',
                partyEmail: lead?.email || '',
                partyGstin: '',
                placeOfSupply: lead?.state || '',
                billingAddress: { line1: '', city: lead?.city || '', state: lead?.state || '', pincode: '', country: lead?.country || 'India' },
                shippingAddress: { line1: '', city: lead?.city || '', state: lead?.state || '', pincode: '', country: lead?.country || 'India' },
            });
            return;
        }

        const customerId = typeof optionValue === 'string' && optionValue.startsWith(CUSTOMER_PREFIX)
            ? optionValue.slice(CUSTOMER_PREFIX.length)
            : optionValue;
        const cust = customers.find(c => String(c.id) === String(customerId));
        const party = parties.find(p => String(p.id) === String(customerId)) || cust;
        onChange?.({
            isOneTimeParty: false,
            selectedLeadId: '',
            customerId: cust?.id || '',
            customer: cust?.name || '',
            partyName: cust?.name || '',
            partyType: cust?.type || 'Customer',
            partyPhone: party?.phone || cust?.phone || '',
            partyEmail: party?.email || cust?.email || '',
            partyGstin: party?.gstin || cust?.gstin || '',
            placeOfSupply: party?.placeOfSupply || cust?.placeOfSupply || '',
            billingAddress: party?.billingAddress || cust?.billingAddress || { line1: '', city: '', state: '', pincode: '', country: 'India' },
            shippingAddress: party?.shippingAddress || cust?.shippingAddress || { line1: '', city: '', state: '', pincode: '', country: 'India' },
        });
    };

    const handleOneTimeFieldChange = (field, val) => {
        const updated = {
            ...value,
            isOneTimeParty: true,
            [field]: val,
        };
        if (field === 'partyName') {
            updated.customer = val;
        }
        // Auto derive place of supply if valid GSTIN entered
        if (field === 'partyGstin' && val.length >= 2) {
            const stateCode = val.substring(0, 2);
            const stateMap = {
                '24': 'Gujarat', '27': 'Maharashtra', '29': 'Karnataka', '07': 'Delhi',
                '06': 'Haryana', '08': 'Rajasthan', '09': 'Uttar Pradesh', '23': 'Madhya Pradesh',
                '19': 'West Bengal', '33': 'Tamil Nadu', '36': 'Telangana', '37': 'Andhra Pradesh',
                '32': 'Kerala', '03': 'Punjab', '10': 'Bihar', '20': 'Jharkhand', '21': 'Odisha',
                '22': 'Chhattisgarh', '30': 'Goa', '02': 'Himachal Pradesh', '05': 'Uttarakhand',
            };
            if (stateMap[stateCode] && !value.placeOfSupply) {
                updated.placeOfSupply = stateMap[stateCode];
            }
        }
        onChange?.(updated);
    };

    const handleAddressChange = (type, addrField, val) => {
        const currentAddr = value[type] || {};
        const newAddr = { ...currentAddr, [addrField]: val };
        const updated = { ...value, isOneTimeParty: true, [type]: newAddr };
        if (type === 'billingAddress' && sameAsBilling) {
            updated.shippingAddress = { ...newAddr };
        }
        onChange?.(updated);
    };

    const selectedCust = value.selectedLeadId
        ? null
        : customers.find(c => String(c.id) === String(value.customerId));
    const selectedLead = value.selectedLeadId
        ? leads.find((l) => String(l.id) === String(value.selectedLeadId)) || null
        : null;
    // The dropdown's value is the prefixed id, so a lead keeps its selection
    // across a re-render instead of falling back to the first customer.
    const registeredValue = selectedLead
        ? `${LEAD_PREFIX}${selectedLead.id}`
        : (value.customerId ? `${CUSTOMER_PREFIX}${value.customerId}` : '');

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Mode Switch Tabs */}
            <div className="flex items-center justify-between gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleModeSwitch('registered')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        mode === 'registered'
                            ? 'bg-white dark:bg-slate-900 text-[#1F3A6E] dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                >
                    <UserCheck size={14} className={mode === 'registered' ? 'text-blue-600' : ''} />
                    <span>Registered Customer</span>
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleModeSwitch('onetime')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        mode === 'onetime'
                            ? 'bg-white dark:bg-slate-900 text-[#1F3A6E] dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                >
                    <UserPlus size={14} className={mode === 'onetime' ? 'text-amber-500' : ''} />
                    <span>One-Time / Walk-in Party</span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-200 font-mono">
                        Direct
                    </span>
                </button>
            </div>

            {/* Mode 1: Registered Customer Dropdown */}
            {mode === 'registered' ? (
                <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Select Customer Account <span className="text-rose-500">*</span>
                    </label>
                    <select
                        required
                        disabled={disabled}
                        value={registeredValue}
                        onChange={(e) => handleRegisteredChange(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="" disabled>-- Select Customer Account --</option>
                        {customers.length > 0 && (
                            <optgroup label={`Customers (${customers.length})`}>
                                {customers.map((c) => (
                                    <option key={`c-${c.id}`} value={`${CUSTOMER_PREFIX}${c.id}`}>
                                        {c.name} {c.code ? `(${c.code})` : ''} - Balance: ₹{Number(c.balance || 0).toFixed(2)}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                        {hasLeads && (
                            <optgroup label={`Leads (${leads.length})`}>
                                {leadOptions.map(({ value: optValue, lead }) => (
                                    <option key={optValue} value={optValue}>
                                        {lead.displayName || lead.company || lead.name}
                                        {lead.leadNumber ? ` [${lead.leadNumber}]` : ''}
                                        {' - Balance: '}
                                        {lead.balance !== undefined && lead.balance !== null
                                            ? `₹${Number(lead.balance || 0).toFixed(2)}`
                                            : 'N/A'}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>

                    {selectedLead && (
                        <div className="mt-2 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-[11px] space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                                <span>{selectedLead.displayName || selectedLead.company || selectedLead.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-700 dark:text-blue-300 font-mono text-[10px] bg-white dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                        {selectedLead.leadNumber ? `ID: ${selectedLead.leadNumber}` : 'Lead'}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                        Bal: ₹{Number(selectedLead.balance || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-600 dark:text-slate-400 text-[10px]">
                                {selectedLead.phone && <span>Ph: <strong>{selectedLead.phone}</strong></span>}
                                {selectedLead.email && <span>Email: <strong>{selectedLead.email}</strong></span>}
                                {selectedLead.status && <span>Stage: <strong>{selectedLead.status}</strong></span>}
                            </div>
                            <p className="text-[10px] text-blue-700 dark:text-blue-300">
                                This quotation will be linked to the lead.
                            </p>
                        </div>
                    )}

                    {selectedCust && (
                        <div className="mt-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-[11px] space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                                <span>{selectedCust.name}</span>
                                <div className="flex items-center gap-2">
                                    {selectedCust.creditLimit ? (
                                        <span className="text-blue-700 dark:text-blue-300 font-mono text-[10px] bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                            Limit: ₹{Number(selectedCust.creditLimit).toLocaleString('en-IN')}
                                        </span>
                                    ) : null}
                                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                        Bal: ₹{Number(selectedCust.balance || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-600 dark:text-slate-400 text-[10px]">
                                {selectedCust.phone && <span>Ph: <strong>{selectedCust.phone}</strong></span>}
                                {selectedCust.email && <span>Email: <strong>{selectedCust.email}</strong></span>}
                                {selectedCust.gstin && <span>GSTIN: <strong className="font-mono">{selectedCust.gstin}</strong></span>}
                                {selectedCust.placeOfSupply && <span>State: <strong>{selectedCust.placeOfSupply}</strong></span>}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Mode 2: One-Time Party Inline Form */
                <div className="p-3 bg-amber-50/40 dark:bg-slate-800/40 border border-amber-200/60 dark:border-slate-700 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Building size={14} className="text-amber-600" />
                            One-Time Party Details (No Master Required)
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            Saved directly to this document
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                                Party Type <span className="text-rose-500">*</span>
                            </label>
                            <select
                                disabled={disabled}
                                value={value.partyType || 'Walk-in'}
                                onChange={(e) => handleOneTimeFieldChange('partyType', e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium"
                            >
                                {PARTY_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                                Party / Customer Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                required
                                disabled={disabled}
                                type="text"
                                placeholder="e.g. Ramesh Patel, Sharma Fabricators, Metro Infra"
                                value={value.partyName || value.customer || ''}
                                onChange={(e) => handleOneTimeFieldChange('partyName', e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px] flex items-center gap-1">
                                <Phone size={11} className="text-slate-400" /> Mobile / Phone
                            </label>
                            <input
                                disabled={disabled}
                                type="text"
                                placeholder="10-digit mobile"
                                value={value.partyPhone || ''}
                                onChange={(e) => handleOneTimeFieldChange('partyPhone', e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium"
                            />
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px] flex items-center gap-1">
                                <Mail size={11} className="text-slate-400" /> Email Address
                            </label>
                            <input
                                disabled={disabled}
                                type="email"
                                placeholder="party@example.com"
                                value={value.partyEmail || ''}
                                onChange={(e) => handleOneTimeFieldChange('partyEmail', e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium"
                            />
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px] flex items-center gap-1">
                                <FileText size={11} className="text-slate-400" /> GSTIN (Optional)
                            </label>
                            <input
                                disabled={disabled}
                                type="text"
                                maxLength={15}
                                placeholder="15-digit GSTIN"
                                value={value.partyGstin || ''}
                                onChange={(e) => handleOneTimeFieldChange('partyGstin', e.target.value.toUpperCase())}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-mono font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px] flex items-center gap-1">
                                <MapPin size={11} className="text-slate-400" /> Place of Supply (State)
                            </label>
                            <select
                                disabled={disabled}
                                value={value.placeOfSupply || ''}
                                onChange={(e) => handleOneTimeFieldChange('placeOfSupply', e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium"
                            >
                                <option value="">-- Select State --</option>
                                {INDIAN_STATES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            {showAddressFields && (
                                <button
                                    type="button"
                                    onClick={() => setShowAddresses(!showAddresses)}
                                    className="w-full py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-between cursor-pointer transition"
                                >
                                    <span>{showAddresses ? 'Hide Address Details' : 'Add Billing & Shipping Address'}</span>
                                    {showAddresses ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Expandable Address Details for One-Time Party */}
                    {showAddressFields && showAddresses && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Billing Address */}
                                <div className="space-y-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                    <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block">
                                        Billing Address
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Street / Plot / Area"
                                        value={value.billingAddress?.line1 || ''}
                                        onChange={(e) => handleAddressChange('billingAddress', 'line1', e.target.value)}
                                        className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={value.billingAddress?.city || ''}
                                            onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)}
                                            className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Pincode"
                                            value={value.billingAddress?.pincode || ''}
                                            onChange={(e) => handleAddressChange('billingAddress', 'pincode', e.target.value)}
                                            className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="space-y-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                                            Shipping Address
                                        </span>
                                        <label className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={sameAsBilling}
                                                onChange={(e) => {
                                                    setSameAsBilling(e.target.checked);
                                                    if (e.target.checked) {
                                                        onChange?.({
                                                            ...value,
                                                            shippingAddress: { ...(value.billingAddress || {}) },
                                                        });
                                                    }
                                                }}
                                                className="rounded border-slate-300 text-blue-600"
                                            />
                                            Same as Billing
                                        </label>
                                    </div>
                                    {!sameAsBilling ? (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Street / Plot / Area"
                                                value={value.shippingAddress?.line1 || ''}
                                                onChange={(e) => handleAddressChange('shippingAddress', 'line1', e.target.value)}
                                                className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="City"
                                                    value={value.shippingAddress?.city || ''}
                                                    onChange={(e) => handleAddressChange('shippingAddress', 'city', e.target.value)}
                                                    className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Pincode"
                                                    value={value.shippingAddress?.pincode || ''}
                                                    onChange={(e) => handleAddressChange('shippingAddress', 'pincode', e.target.value)}
                                                    className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-[11px] text-slate-500 italic pt-2">
                                            Using billing address for delivery & dispatch.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
