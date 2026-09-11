import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Button } from '../../components/ui/Button';
import { Building, Bell, Database, Save, Check, RotateCcw, AlertTriangle } from 'lucide-react';
export const SettingsPage = () => {
    const { resetDemoData, currency: globalCurrency, setCurrency: setGlobalCurrency, showToast } = useERP();
    const [saved, setSaved] = useState(false);
    const [companyName, setCompanyName] = useState('Horizon Global Industrial Corp');
    const [currency, setCurrency] = useState(globalCurrency || 'USD ($)');
    const [fiscalYear, setFiscalYear] = useState('Jan - Dec');
    const [autoReorder, setAutoReorder] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const handleSave = (e) => {
        e.preventDefault();
        setGlobalCurrency(currency);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };
    const handleResetData = () => {
        resetDemoData();
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

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-[#CED4DA] rounded-lg p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#CED4DA] mb-4">
            <Building className="text-[#1F2E4A]" size={18}/>
            <h3 className="font-bold text-sm text-[#1F2E4A]">Company Profile & Taxation</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company Legal Entity</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Base Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]">
                <option value="USD ($)">USD ($) - United States Dollar</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fiscal Year</label>
              <input type="text" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tax ID / VAT Registration</label>
              <input type="text" defaultValue="US-991283912-TX" className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#CED4DA] rounded-lg p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#CED4DA] mb-4">
            <Bell className="text-[#1F2E4A]" size={18}/>
            <h3 className="font-bold text-sm text-[#1F2E4A]">Inventory Automation & Alerts</h3>
          </div>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Automated Reorder Triggering</p>
                <p className="text-slate-500 text-[11px]">
                  Draft purchase orders automatically when stock levels breach SKU minimum safety points.
                </p>
              </div>
              <input type="checkbox" checked={autoReorder} onChange={(e) => setAutoReorder(e.target.checked)} className="w-4 h-4 accent-[#1F2E4A]"/>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Low Stock & RMA Email Notifications</p>
                <p className="text-slate-500 text-[11px]">
                  Send daily briefing notifications to warehouse floor managers and QA engineers.
                </p>
              </div>
              <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="w-4 h-4 accent-[#1F2E4A]"/>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved ? (<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
              <Check size={14}/> Configuration saved successfully
            </span>) : (<span />)}
          <Button icon={Save} type="submit">
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Demo State Reset Section */}
      <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-rose-100 mb-4 text-rose-800">
          <Database size={18}/>
          <h3 className="font-bold text-sm">ERP Demo Data Management & Factory Reset</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-semibold text-slate-800">Restore Clean Demo Seed Data</p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Reset all inventory movements, customer balances, vendor bills, and journal entries back to the factory seed state.
            </p>
          </div>
          {!showConfirmReset ? (<button type="button" onClick={() => setShowConfirmReset(true)} className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5"/> Reset Demo State
            </button>) : (<div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowConfirmReset(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="button" onClick={handleResetData} className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer">
                <AlertTriangle className="w-3.5 h-3.5"/> Confirm Factory Reset
              </button>
            </div>)}
        </div>
      </div>
    </div>);
};
