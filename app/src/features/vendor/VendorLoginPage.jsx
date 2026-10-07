import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, Mail, ArrowRight, AlertCircle, Building2 } from 'lucide-react';
import { vendorPortalLogin } from '../../services/upgradeService';

export function VendorLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your vendor registered email address.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await vendorPortalLogin(email.trim());
      if (res?.token) {
        localStorage.setItem('vendor_portal_token', res.token);
        localStorage.setItem('vendor_portal_user', JSON.stringify(res.user || {}));
        localStorage.setItem('vendor_portal_party', JSON.stringify(res.party || {}));
        navigate('/vendor/portal');
      } else {
        throw new Error('No access token received.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Authentication failed. Please verify your vendor email or contact procurement.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4">
            <Truck size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            SEWEN <span className="text-blue-400">Supplier Portal</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Self-Service Purchase Orders, Stage Progress & Dock ASNs
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold text-sm">
            <Building2 size={18} className="text-blue-600" />
            <span>Vendor Sign In</span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Supplier Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="procurement@supplier.com"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your company email registered on the SEWEN vendor master.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                'Authenticating...'
              ) : (
                <>
                  <span>Access Vendor Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>TLS 256-Bit Encrypted</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 font-semibold hover:underline text-[11px]"
            >
              Internal ERP Login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorLoginPage;
