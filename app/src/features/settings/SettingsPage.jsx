import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Button } from '../../components/ui/Button';
import LanguageSettingsSection from '../../components/settings/LanguageSettingsSection';
import { useTranslation } from '../../i18n';
import { Building, Bell, Database, Save, Check, RotateCcw, AlertTriangle, MapPin, Phone, Hash } from 'lucide-react';
export const SettingsPage = () => {
    const {
        resetDemoData,
        exportDatabaseSnapshot,
        importDatabaseSnapshot,
        currency: globalCurrency,
        setCurrency: setGlobalCurrency,
        companyProfile,
        setCompanyProfile,
        showToast,
    } = useERP();
    const { t } = useTranslation();
    const [saved, setSaved] = useState(false);
    const [companyName, setCompanyName] = useState(companyProfile?.name || 'Sweven Fabricators Pvt Ltd');
    const [gstin, setGstin] = useState(companyProfile?.gstin || '');
    const [pan, setPan] = useState(companyProfile?.pan || '');
    const [address, setAddress] = useState(companyProfile?.address || '');
    const [phone, setPhone] = useState(companyProfile?.phone || '');
    const [currency, setCurrency] = useState(globalCurrency || 'INR (₹)');
    const [fiscalYear, setFiscalYear] = useState('Apr - Mar');
    const [autoReorder, setAutoReorder] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const handleSave = (e) => {
        e.preventDefault();
        setGlobalCurrency(currency);
        if (typeof setCompanyProfile === 'function') {
            setCompanyProfile({
                name: companyName,
                gstin,
                pan,
                address,
                phone,
            });
        }
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
          <h2 className="text-2xl font-bold text-[#1F2E4A] tracking-tight">{t("settings.systemSettings")}</h2>
          <p className="text-xs text-[#5a6062] mt-1">
            {t("settings.systemSettingsDesc")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-[#CED4DA] rounded-lg p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#CED4DA] mb-4">
            <Building className="text-[#1F2E4A]" size={18}/>
            <h3 className="font-bold text-sm text-[#1F2E4A]">{t("settings.companyProfile")}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t("settings.companyLegalEntity")}</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t("settings.baseCurrency")}</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]">
                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                <option value="USD ($)">USD ($) - United States Dollar</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t("settings.fiscalYear")}</label>
              <input type="text" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t("settings.gstinLabel")}</label>
              <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="e.g. 29AABCU8912E1ZB" className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t("settings.panLabel")}</label>
              <input type="text" value={pan} onChange={(e) => setPan(e.target.value)} placeholder="e.g. AABCU8912E" className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t("settings.businessPhone")}</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 22 4000 0000" className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">{t("settings.registeredAddress")}</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Line 1, Line 2, City, State, PIN" className="w-full p-2 border border-[#CED4DA] rounded bg-[#F8F9FA]"/>
            </div>
          </div>
        </div>

        {/* Language — shares global language state with the header selector */}
        <LanguageSettingsSection />

        <div className="bg-white border border-[#CED4DA] rounded-lg p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#CED4DA] mb-4">
            <Bell className="text-[#1F2E4A]" size={18}/>
            <h3 className="font-bold text-sm text-[#1F2E4A]">{t("settings.inventoryAutomation")}</h3>
          </div>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{t("settings.autoReorder")}</p>
                <p className="text-slate-500 text-[11px]">
                  {t("settings.autoReorderDesc")}
                </p>
              </div>
              <input type="checkbox" checked={autoReorder} onChange={(e) => setAutoReorder(e.target.checked)} className="w-4 h-4 accent-[#1F2E4A]"/>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{t("settings.stockAlerts")}</p>
                <p className="text-slate-500 text-[11px]">
                  {t("settings.stockAlertsDesc")}
                </p>
              </div>
              <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="w-4 h-4 accent-[#1F2E4A]"/>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved ? (<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
              <Check size={14}/> {t("settings.configSaved")}
            </span>) : (<span />)}
          <Button icon={Save} type="submit">
            {t("settings.savePreferences")}
          </Button>
        </div>
      </form>

      {/* ERP Snapshot Backup & Recovery Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 text-[#1F2E4A]">
          <Database size={18}/>
          <h3 className="font-bold text-sm">{t("settings.backupTitle")}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Export / Backup */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div>
              <p className="font-bold text-slate-900">{t("settings.exportTitle")}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {t("settings.exportDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={exportDatabaseSnapshot}
              className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Database size={14} /> {t("settings.downloadBackup")}
            </button>
          </div>

          {/* Import / Restore */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div>
              <p className="font-bold text-slate-900">{t("settings.restoreTitle")}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {t("settings.restoreDesc")}
              </p>
            </div>
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer shadow-xs transition-colors">
              <RotateCcw size={14} /> {t("settings.uploadRestore")}
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
                        showToast(t("toast.somethingWrong"));
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

        {/* Factory Reset */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-rose-800">{t("settings.factoryReset")}</p>
            <p className="text-slate-500 text-[11px]">
              {t("settings.factoryResetDesc")}
            </p>
          </div>
          {!showConfirmReset ? (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5"/> {t("settings.resetSeed")}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {t("modal.cancel")}
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5"/> {t("settings.confirmReset")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>);
};
