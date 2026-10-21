import React, { useEffect, useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { Button } from '../../components/ui/Button';
import { Building, Bell, Database, Save, Check, RotateCcw, AlertTriangle, MapPin, Phone, Hash, AlertCircle } from 'lucide-react';
import { validatePhone, validateGSTIN, validatePAN } from '../../utils/validators';

export const SettingsPage = () => {
    const {
        resetBusinessData,
        exportDatabaseSnapshot,
        importDatabaseSnapshot,
        currency: globalCurrency,
        setCurrency: setGlobalCurrency,
        companyProfile,
        setCompanyProfile,
        showToast,
    } = useERP();
    const [saved, setSaved] = useState(false);
    const [companyName, setCompanyName] = useState(companyProfile?.name || companyProfile?.legalName || '');
    const [gstin, setGstin] = useState(companyProfile?.gstin || '');
    const [pan, setPan] = useState(companyProfile?.pan || '');
    const [address, setAddress] = useState(companyProfile?.address || '');
    const [phone, setPhone] = useState(companyProfile?.phone || '');
    const [currency, setCurrency] = useState(globalCurrency || 'INR (₹)');
    const [fiscalYear, setFiscalYear] = useState('Apr - Mar');
    const [autoReorder, setAutoReorder] = useState(() => {
        try {
            const stored = localStorage.getItem('evenmore_auto_reorder');
            return stored !== null ? JSON.parse(stored) : true;
        } catch (e) {
            return true;
        }
    });
    const [emailAlerts, setEmailAlerts] = useState(() => {
        try {
            const stored = localStorage.getItem('evenmore_email_alerts');
            return stored !== null ? JSON.parse(stored) : true;
        } catch (e) {
            return true;
        }
    });
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const inputRefs = {
        companyName: useRef(null),
        fiscalYear: useRef(null),
        gstin: useRef(null),
        pan: useRef(null),
        phone: useRef(null),
        address: useRef(null),
    };

    // The profile arrives from the server after mount; show it once it does.
    useEffect(() => {
        if (companyProfile) {
            setCompanyName(companyProfile.name || companyProfile.legalName || '');
            const currentGstin = companyProfile.gstin || '';
            setGstin(currentGstin);
            // If pan is missing but gstin exists, derive it
            setPan(companyProfile.pan || (currentGstin.length >= 12 ? currentGstin.substring(2, 12) : ''));
            setAddress(companyProfile.address || '');
            setPhone(companyProfile.phone || '');
            if (companyProfile.currency) {
                if (companyProfile.currency.includes('USD')) setCurrency('USD ($)');
                else if (companyProfile.currency.includes('EUR')) setCurrency('EUR (€)');
                else if (companyProfile.currency.includes('GBP')) setCurrency('GBP (£)');
                else setCurrency('INR (₹)');
            }
        }
    }, [companyProfile]);

    const validateForm = (values) => {
        const errs = {};

        // 1. Company Legal Entity (Mandatory)
        if (!values.companyName || !values.companyName.trim()) {
            errs.companyName = 'Company Legal Entity name is required.';
        } else if (values.companyName.trim().length < 2) {
            errs.companyName = 'Company name must be at least 2 characters.';
        }

        // 2. Fiscal Year (Mandatory)
        if (!values.fiscalYear || !values.fiscalYear.trim()) {
            errs.fiscalYear = 'Fiscal Year is required (e.g. Apr - Mar).';
        }

        // 3. GSTIN (Tax Registration) (Optional, but if entered, must be valid 15-char GSTIN)
        const cleanGstin = values.gstin ? values.gstin.trim().toUpperCase() : '';
        if (cleanGstin) {
            const gstinRes = validateGSTIN(cleanGstin);
            if (!gstinRes.isValid) {
                errs.gstin = gstinRes.message;
            }
        }

        // 4. PAN (Optional, but if entered, must be valid 10-char PAN and match GSTIN)
        const cleanPan = values.pan ? values.pan.trim().toUpperCase() : '';
        if (cleanPan) {
            const panRes = validatePAN(cleanPan);
            if (!panRes.isValid) {
                errs.pan = panRes.message;
            } else if (cleanGstin && cleanGstin.length >= 12) {
                const gstinPan = cleanGstin.substring(2, 12);
                if (cleanPan !== gstinPan) {
                    errs.pan = `PAN (${cleanPan}) does not match the PAN embedded in GSTIN (${gstinPan}).`;
                }
            }
        }

        // 5. Business Phone (Optional, but if entered, must be valid)
        const cleanPhone = values.phone ? values.phone.trim() : '';
        if (cleanPhone) {
            const phoneRes = validatePhone(cleanPhone, false);
            if (!phoneRes.isValid) {
                errs.phone = phoneRes.message;
            }
        }

        return errs;
    };

    const handleGstinChange = (e) => {
        const val = e.target.value.toUpperCase();
        setGstin(val);
        if (errors.gstin) {
            setErrors((prev) => ({ ...prev, gstin: undefined }));
        }
        // Auto-fill PAN from GSTIN if PAN is empty or was previously derived
        if (val.length >= 12) {
            const derivedPan = val.substring(2, 12);
            if (!pan || pan === gstin.substring(2, 12)) {
                setPan(derivedPan);
                if (errors.pan) {
                    setErrors((prev) => ({ ...prev, pan: undefined }));
                }
            }
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (phone?.trim()) {
            const phoneRes = validatePhone(phone, false);
            if (!phoneRes.isValid) {
                showToast(phoneRes.message, 'error');
                return;
            }
        }
        setGlobalCurrency(currency);
        try {
            localStorage.setItem('evenmore_auto_reorder', JSON.stringify(autoReorder));
            localStorage.setItem('evenmore_email_alerts', JSON.stringify(emailAlerts));
        } catch (err) {}

        if (typeof setCompanyProfile === 'function') {
            setCompanyProfile({
                name: companyName.trim(),
                legalName: companyName.trim(),
                gstin: gstin.trim().toUpperCase(),
                pan: pan.trim().toUpperCase(),
                address: address.trim(),
                phone: phone.trim(),
                currency,
            });
        }
        setSaved(true);
        showToast('Configuration saved successfully');
        setTimeout(() => setSaved(false), 3000);
    };

    const handleResetData = async () => {
        setResetting(true);
        const ok = await resetBusinessData();
        if (!ok) setResetting(false);
        setShowConfirmReset(false);
    };

    return (<div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2E4A] tracking-tight">System & Organization Settings</h2>
          <p className="text-xs text-[#5a6062] mt-1">
            Configure company legal entity parameters, fiscal calendars, threshold alerts, and inventory rules.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        <div className="bg-white border border-[#CED4DA] rounded-lg p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#CED4DA] mb-4">
            <Building className="text-[#1F2E4A]" size={18}/>
            <h3 className="font-bold text-sm text-[#1F2E4A]">Company Profile & Taxation</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Company Legal Entity <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                ref={inputRefs.companyName}
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: undefined }));
                }}
                placeholder="e.g. Sweven Fabricators Pvt. Ltd."
                className={`w-full p-2 border rounded text-xs transition-colors ${
                  errors.companyName
                    ? 'border-rose-400 bg-rose-50/30 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
                    : 'border-[#CED4DA] bg-[#F8F9FA] focus:outline-none focus:border-[#1F2E4A] focus:bg-white'
                }`}
              />
              {errors.companyName && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  {errors.companyName}
                </p>
              )}
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Base Currency <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA] focus:outline-none focus:border-[#1F2E4A] focus:bg-white"
              >
                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                <option value="USD ($)">USD ($) - United States Dollar</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Fiscal Year <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                ref={inputRefs.fiscalYear}
                type="text"
                value={fiscalYear}
                onChange={(e) => {
                  setFiscalYear(e.target.value);
                  if (errors.fiscalYear) setErrors((prev) => ({ ...prev, fiscalYear: undefined }));
                }}
                placeholder="e.g. Apr - Mar"
                className={`w-full p-2 border rounded text-xs transition-colors ${
                  errors.fiscalYear
                    ? 'border-rose-400 bg-rose-50/30 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
                    : 'border-[#CED4DA] bg-[#F8F9FA] focus:outline-none focus:border-[#1F2E4A] focus:bg-white'
                }`}
              />
              {errors.fiscalYear && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  {errors.fiscalYear}
                </p>
              )}
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">GSTIN (Tax Registration)</label>
              <input
                ref={inputRefs.gstin}
                type="text"
                maxLength={15}
                value={gstin}
                onChange={handleGstinChange}
                placeholder="e.g. 24AAACS1234F1Z1"
                className={`w-full p-2 border rounded text-xs uppercase font-mono transition-colors ${
                  errors.gstin
                    ? 'border-rose-400 bg-rose-50/30 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
                    : 'border-[#CED4DA] bg-[#F8F9FA] focus:outline-none focus:border-[#1F2E4A] focus:bg-white'
                }`}
              />
              {errors.gstin && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  {errors.gstin}
                </p>
              )}
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">PAN</label>
              <input
                ref={inputRefs.pan}
                type="text"
                maxLength={10}
                value={pan}
                onChange={(e) => {
                  setPan(e.target.value.toUpperCase());
                  if (errors.pan) setErrors((prev) => ({ ...prev, pan: undefined }));
                }}
                placeholder="e.g. AABCU8912E"
                className={`w-full p-2 border rounded text-xs uppercase font-mono transition-colors ${
                  errors.pan
                    ? 'border-rose-400 bg-rose-50/30 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
                    : 'border-[#CED4DA] bg-[#F8F9FA] focus:outline-none focus:border-[#1F2E4A] focus:bg-white'
                }`}
              />
              {errors.pan && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  {errors.pan}
                </p>
              )}
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Business Phone</label>
              <input
                ref={inputRefs.phone}
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder="e.g. +91 22 4000 0000"
                className={`w-full p-2 border rounded text-xs transition-colors ${
                  errors.phone
                    ? 'border-rose-400 bg-rose-50/30 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
                    : 'border-[#CED4DA] bg-[#F8F9FA] focus:outline-none focus:border-[#1F2E4A] focus:bg-white'
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  {errors.phone}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Registered Address</label>
              <textarea
                ref={inputRefs.address}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                }}
                rows={2}
                placeholder="Line 1, Line 2, City, State, PIN"
                className={`w-full p-2 border rounded text-xs transition-colors ${
                  errors.address
                    ? 'border-rose-400 bg-rose-50/30 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
                    : 'border-[#CED4DA] bg-[#F8F9FA] focus:outline-none focus:border-[#1F2E4A] focus:bg-white'
                }`}
              />
              {errors.address && (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  {errors.address}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#CED4DA] rounded-lg p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#CED4DA] mb-4">
            <Bell className="text-[#1F2E4A]" size={18}/>
            <h3 className="font-bold text-sm text-[#1F2E4A]">Inventory Automation & Alerts</h3>
          </div>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between gap-3 lg:gap-0">
              <div>
                <p className="font-semibold text-slate-800">Automated Reorder Triggering</p>
                <p className="text-slate-500 text-[11px]">
                  Draft purchase orders automatically when stock levels breach SKU minimum safety points.
                </p>
              </div>
              <input type="checkbox" checked={autoReorder} onChange={(e) => setAutoReorder(e.target.checked)} className="w-4 h-4 shrink-0 lg:shrink accent-[#1F2E4A]"/>
            </div>
            <div className="flex items-center justify-between gap-3 lg:gap-0">
              <div>
                <p className="font-semibold text-slate-800">Low Stock & RMA Email Notifications</p>
                <p className="text-slate-500 text-[11px]">
                  Send daily briefing notifications to warehouse floor managers and QA engineers.
                </p>
              </div>
              <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="w-4 h-4 shrink-0 lg:shrink accent-[#1F2E4A]"/>
            </div>
          </div>
        </div>

        {submitAttempted && Object.keys(errors).length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-700 text-xs animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span className="font-medium">Please correct the highlighted validation errors above before saving preferences.</span>
          </div>
        )}

        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 lg:gap-0 pt-2">
          {saved ? (<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
              <Check size={14}/> Configuration saved successfully
            </span>) : (<span />)}
          <Button icon={Save} type="submit">
            Save Preferences
          </Button>
        </div>
      </form>

      {/* ERP Snapshot Backup & Recovery Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 text-[#1F2E4A]">
          <Database size={18}/>
          <h3 className="font-bold text-sm">ERP Database Backup & Portability</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Export / Backup */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div>
              <p className="font-bold text-slate-900">Export Complete Database Snapshot</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Download a JSON snapshot containing all customers, vendors, inventory items, orders, invoices, and accounting journals.
              </p>
            </div>
            <button
              type="button"
              onClick={exportDatabaseSnapshot}
              className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Database size={14} /> Download Backup (.json)
            </button>
          </div>

          {/* Import / Restore */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div>
              <p className="font-bold text-slate-900">Restore Database from Backup</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Upload a previously saved `.json` database snapshot to restore your full ERP state.
              </p>
            </div>
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer shadow-xs transition-colors">
              <RotateCcw size={14} /> Upload & Restore Snapshot
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const parsed = JSON.parse(event.target?.result);
                        importDatabaseSnapshot(parsed);
                      } catch (err) {
                        showToast('Failed to parse uploaded JSON file.', 'error');
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Reset data */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-rose-800">Reset Data</p>
            <p className="text-slate-500 text-[11px]">
              Permanently erase all business data (customers, vendors, items, orders, invoices, accounts and module records) and start with an empty database. Download a backup first if you may need it.
            </p>
          </div>
          {!showConfirmReset ? (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5"/> Reset Data
            </button>
          ) : (
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                disabled={resetting}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                disabled={resetting}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <AlertTriangle className="w-3.5 h-3.5"/> {resetting ? 'Erasing…' : 'Yes, Erase All Data'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>);
};
