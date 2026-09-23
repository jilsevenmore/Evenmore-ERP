import React, { useState } from 'react';
import { useVendorStore } from '../../../stores/vendorStore';
import { Button } from '../../../components/ui/Button';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  Edit2,
  Save,
  X,
} from 'lucide-react';

export function VendorProfilePage() {
  const getCurrentVendor = useVendorStore((s) => s.getCurrentVendor);
  const getCurrentUser = useVendorStore((s) => s.getCurrentUser);
  const vendorUsers = useVendorStore((s) => s.vendorUsers);
  const updateVendorProfile = useVendorStore((s) => s.updateVendorProfile);

  const currentVendor = getCurrentVendor();
  const currentUser = getCurrentUser();

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    contactPerson: currentVendor?.contactPerson || '',
    email: currentVendor?.email || '',
    phone: currentVendor?.phone || '',
    address: currentVendor?.address || '',
    city: currentVendor?.city || '',
    state: currentVendor?.state || '',
    country: currentVendor?.country || '',
    pincode: currentVendor?.pincode || '',
  });

  const associatedUsers = vendorUsers.filter((u) => u.vendorId === currentVendor?.id);

  const handleSave = (e) => {
    e.preventDefault();
    updateVendorProfile(currentVendor.id, formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Vendor Organization Profile
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registration details, plant location, authorized technical contacts, and portal authorization.
          </p>
        </div>

        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => setIsEditing(true)}
          >
            Edit Contact Details
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={X}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Vendor profile updated successfully!</span>
        </div>
      )}

      {/* ── Section 1: Company Information ──────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Company Information</h3>
              <p className="text-[11px] text-slate-400">Registered supplier master record</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {currentVendor.code}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Company Name
            </label>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{currentVendor.name}</p>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Supply Category
            </label>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{currentVendor.category}</p>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Supply Scope
            </label>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{currentVendor.supplyType}</p>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              GSTIN / Tax Identifier
            </label>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{currentVendor.gstin || '24AABCO1234F1Z8'}</p>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Payment Terms
            </label>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs">
              {currentVendor.paymentTerms}
            </span>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Performance Rating
            </label>
            <span className="font-bold text-emerald-600">
              ★ {currentVendor.rating || '4.8'} / 5.0 ({currentVendor.onTimeRate || 94}% On-Time)
            </span>
          </div>
        </div>

        {/* Address */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <MapPin size={12} />
            <span>Manufacturing Facility / Plant Address</span>
          </label>
          {!isEditing ? (
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {currentVendor.address}, {currentVendor.city}, {currentVendor.state}, {currentVendor.country} - {currentVendor.pincode}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Street Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full sm:col-span-3 p-2 rounded-xl border border-slate-200 text-xs"
              />
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              />
              <input
                type="text"
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              />
              <input
                type="text"
                placeholder="Pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Primary Contact Information ─────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Phone size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Primary Contact Details</h3>
            <p className="text-[11px] text-slate-400">Designated point of contact for purchase orders</p>
          </div>
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Contact Person
              </span>
              <p className="font-bold text-slate-900 dark:text-white">{currentVendor.contactPerson}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Official Email
              </span>
              <p className="font-medium text-slate-700 dark:text-slate-300">{currentVendor.email}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Phone Number
              </span>
              <p className="font-medium text-slate-700 dark:text-slate-300">{currentVendor.phone}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Contact Name</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Portal Access & Authorized Users ─────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Portal Access Status & Authorized Users</h3>
              <p className="text-[11px] text-slate-400">Authenticated staff with order update privileges</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={13} />
            <span>Portal {currentVendor.portalAccess}</span>
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">Authorized Vendor Portal Users ({associatedUsers.length}):</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {associatedUsers.map((user) => (
              <div key={user.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {user.name}
                      {user.id === currentUser?.id && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                          Current Session
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {user.designation} • {user.email}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                    {user.role}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Last login: {user.lastLogin}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorProfilePage;
