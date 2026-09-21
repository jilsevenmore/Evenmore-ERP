import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorStore } from '../../../stores/vendorStore';
import { Shield, KeyRound, Mail, AlertCircle, CheckCircle2, ArrowRight, ArrowLeftRight, HelpCircle } from 'lucide-react';

export function VendorLoginPage() {
  const navigate = useNavigate();
  const loginVendor = useVendorStore((s) => s.loginVendor);
  const switchDemoVendor = useVendorStore((s) => s.switchDemoVendor);
  const sessionError = useVendorStore((s) => s.sessionError);

  const [emailOrId, setEmailOrId] = useState('rajesh@omfab.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLocalError('');

    if (!emailOrId.trim()) {
      setLocalError('Please enter your Vendor ID or Email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = loginVendor(emailOrId, password);
      setLoading(false);
      if (res.success) {
        navigate('/vendor/dashboard');
      } else {
        setLocalError(res.error || 'Failed to authenticate.');
      }
    }, 300);
  };

  const handleDemoLogin = (vendorId, userId, email) => {
    setEmailOrId(email);
    setPassword('password123');
    switchDemoVendor(vendorId, userId);
    navigate('/vendor/dashboard');
  };

  const currentDisplayError = localError || sessionError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1E293B] to-[#0F172A] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand */}
      <div className="max-w-md w-full text-center mb-6 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
          <Shield size={13} />
          <span>Secured External Vendor Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Evenmore ERP
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Supplier Order Progress Tracking & Quality Inspection Workflow
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 z-10 backdrop-blur-md">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Vendor Sign In</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enter your credentials to access assigned orders and submit stage progress.
          </p>
        </div>

        {/* Error State */}
        {currentDisplayError && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
            <span className="leading-relaxed">{currentDisplayError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vendor ID / Email Address
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                placeholder="e.g. rajesh@omfab.com or VEND-001"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
              />
              <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-primary hover:underline text-[11px] font-medium cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
              />
              <KeyRound size={15} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400 text-xs">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span>Remember this device</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-xs shadow-primary/25 cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Vendor Portal'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Demo Fast Login Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Instant Demo Logins
          </p>
          <div className="space-y-1.5">
            {[
              {
                vendorId: 'vend-om-fab',
                userId: 'vuser-1',
                email: 'rajesh@omfab.com',
                name: 'Om Fabrication Works',
                role: 'Rajesh Sharma (Admin)',
                badge: 'ORD-1025 Active',
              },
              {
                vendorId: 'vend-shakti',
                userId: 'vuser-3',
                email: 'suresh@shaktisteel.com',
                name: 'Shakti Steel Traders',
                role: 'Suresh Mehta',
                badge: 'Structural Steel',
              },
              {
                vendorId: 'vend-precision',
                userId: 'vuser-4',
                email: 'vikram@precisionparts.com',
                name: 'Precision Parts Co.',
                role: 'Vikram Rathi',
                badge: 'CNC Milling',
              },
            ].map((demo) => (
              <button
                key={demo.vendorId}
                type="button"
                onClick={() => handleDemoLogin(demo.vendorId, demo.userId, demo.email)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 text-left transition-all flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary">
                    {demo.name}
                  </p>
                  <p className="text-[10px] text-slate-400">{demo.role}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {demo.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Back to ERP Admin */}
        <div className="mt-5 text-center">
          <Link
            to="/purchase/vendors"
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeftRight size={12} />
            <span>Switch to Admin ERP Workspace</span>
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 text-slate-800 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Password Recovery</h3>
                <p className="text-xs text-slate-500">Contact ERP Operations Administrator</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Vendor credentials are managed securely by your in-house Evenmore ERP procurement team. To reset your portal password or request a new login token, please contact your designated procurement manager or administrator.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <p className="font-bold text-slate-700 dark:text-slate-300">Demo Environment Note:</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                All preconfigured demo vendor accounts use default password: <code className="font-mono text-primary font-bold">password123</code>
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="py-2 px-4 rounded-xl bg-primary text-white font-bold text-xs cursor-pointer hover:bg-primary-hover"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorLoginPage;
