import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Infinity as InfinityIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Sun,
  Moon,
  TreePine,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Users,
  Briefcase,
  Layers,
  HelpCircle,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { login as loginRequest } from '../../services/authService';
import { describeError } from '../../services/resourceSync';
import { getStoredToken } from '../../utils/authUtils';

const THEMES = [
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'dark', name: 'Dark', icon: Moon },
  { id: 'midnight', name: 'Midnight', icon: Sparkles },
  { id: 'emerald', name: 'Emerald', icon: TreePine },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const theme = useAppStore((s) => s.theme) || 'light';
  const setTheme = useAppStore((s) => s.setTheme);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setPermissions = useAppStore((s) => s.setPermissions);
  const showToast = useAppStore((s) => s.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Empty by default: the server resolves the tenant from the email address and
  // only needs a slug when the same address exists in more than one tenant
  // (api.md §2). Pre-filling a mock persona's workspace made every real sign-in
  // fail with 'Incorrect email or password'.
  const [tenant, setTenant] = useState('');
  const [showTenant, setShowTenant] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // If already authenticated with a valid token, auto-forward to dashboard or returnTo
  useEffect(() => {
    const existingToken = getStoredToken();
    if (existingToken) {
      navigate(returnTo || '/dashboard', { replace: true });
    }
  }, [navigate, returnTo]);

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // The server owns the session. There is no local persona to fall back on:
      // if this throws, the user is not signed in and the form says why.
      const { user, permissions } = await loginRequest({
        email,
        password,
        tenant,
        remember: rememberMe,
      });

      setCurrentUser(user);
      setPermissions(permissions);

      showToast?.(`Signed in successfully as ${user?.name || email}`);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--page)] text-[var(--text)] flex flex-col justify-between selection:bg-blue-500/20 selection:text-blue-600 relative overflow-x-hidden font-sans">
      {/* Background Decorative Ambient Mesh */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(at 15% 15%, rgba(31, 107, 255, 0.15) 0px, transparent 50%),
            radial-gradient(at 85% 20%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
            radial-gradient(at 50% 85%, rgba(16, 185, 129, 0.12) 0px, transparent 50%)
          `,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(var(--text) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Navbar Strip */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-[var(--border)]/50 bg-[var(--card)]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-1 ring-white/20">
            <InfinityIcon size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wider uppercase text-[var(--text)]">
              Evenmore Infotech
            </span>
            <span className="text-[9px] font-medium tracking-widest text-[var(--muted)]">
              Enterprise Suite v2.6
            </span>
          </div>
        </div>

        {/* Top Right Controls: Theme Switcher & Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--soft)] border border-[var(--border)] text-[11px] font-medium text-[var(--muted)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Normal</span>
          </div>

          <div className="flex items-center bg-[var(--soft)] p-0.5 rounded-xl border border-[var(--border)]">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  title={`Switch to ${t.name} theme`}
                  className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--card)] text-blue-600 font-bold shadow-2xs'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area: Split View on Large Screens */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Column (Showcase on Desktop) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold w-fit">
              <Sparkles size={14} />
              <span>Unified Business Operating System</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-[var(--text)] leading-tight">
                Connect Every Pillar of Your Organization.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-xl">
                Experience unified intelligence across CRM leads, Project milestones, ERP inventory & invoicing, and HRMS employee management.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs transition hover:border-blue-500/40">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2.5">
                  <Briefcase size={16} />
                </div>
                <h2 className="text-xs font-bold text-[var(--text)]">End-to-End Sales & PMS</h2>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Lead pipelines, task allocations, stage gates, and client proof approvals.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs transition hover:border-emerald-500/40">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2.5">
                  <Layers size={16} />
                </div>
                <h2 className="text-xs font-bold text-[var(--text)]">Supply Chain & ERP</h2>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Automated stock positions, GRN audits, GST invoices, and vendor bills.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs transition hover:border-purple-500/40">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2.5">
                  <Users size={16} />
                </div>
                <h2 className="text-xs font-bold text-[var(--text)]">HRMS & Attendance</h2>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Biometric synchronization, payroll runs, leave carryovers, and appraisals.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs transition hover:border-amber-500/40">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2.5">
                  <ShieldCheck size={16} />
                </div>
                <h2 className="text-xs font-bold text-[var(--text)]">Enterprise Security</h2>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Tenant boundary isolation, JWT sessions, role policies, and audit trails.
                </p>
              </div>
            </div>

            {/* Platform Guarantee strip */}
            <div className="flex items-center gap-6 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted)]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>99.99% Cloud Uptime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>256-Bit TLS Security</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>ISO 27001 Certified</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Container */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 relative">
              
              {/* Card Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10 mb-3">
                  <InfinityIcon size={26} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
                  Welcome to Evenmore ERP
                </h2>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                  Sign in to access your organization workspace
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1 text-[11.5px] leading-relaxed">{error}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Email Address or Username
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3.5 text-[var(--muted)] pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[var(--text)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3.5 text-[var(--muted)] pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-10 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[var(--muted)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Tenant / Workspace ID */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTenant(!showTenant)}
                    className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                  >
                    <Building2 size={12} />
                    <span>{showTenant ? 'Hide workspace settings' : 'Custom workspace / tenant domain?'}</span>
                    <ChevronDown size={12} className={`transition-transform duration-150 ${showTenant ? 'rotate-180' : ''}`} />
                  </button>

                  {showTenant && (
                    <div className="mt-2 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={tenant}
                        onChange={(e) => setTenant(e.target.value)}
                        placeholder="Tenant identifier (e.g. evenmore-main)"
                        className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <p className="text-[10px] text-[var(--muted)] mt-1">
                        Leave as default unless logging into a dedicated tenant silo.
                      </p>
                    </div>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border)] text-blue-600 focus:ring-blue-500/30 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs text-[var(--muted)]">Keep me signed in on this device</span>
                  </label>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Authenticating Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Support Link */}
              <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted)]">
                <span>Need access assistance?</span>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle size={12} />
                  <span>IT Helpdesk</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Copyright Strip */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-[var(--border)]/50 bg-[var(--card)]/40 text-center text-xs text-[var(--muted)] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-[var(--text)]">Evenmore Infotech ERP Suite</span>
          <span>•</span>
          <span>PEOPLE | PROCESS | PROGRESS</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hover:text-[var(--text)] transition">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-[var(--text)] transition">Terms of Service</span>
          <span>•</span>
          <span className="font-mono text-[10px]">Cloud Rev 2.6.4</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setIsForgotModalOpen(false); }}
        >
          <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl relative">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
              <KeyRound size={20} />
            </div>

            <h3 className="text-base font-bold text-[var(--text)]">
              Reset Your Password
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1 mb-4 leading-relaxed">
              Enter your corporate email address. If an account is active, your system administrator will issue password reset credentials.
            </p>

            {forgotSent ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>Recovery link generated. Please check your inbox or notify your workspace administrator.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotSent(false);
                  }}
                  className="w-full py-2 rounded-xl bg-[var(--soft)] text-[var(--text)] text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text)] mb-1">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@evenmore.io"
                    className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-[var(--soft)] text-[var(--text)] text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    Send Instructions
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* IT Helpdesk Modal */}
      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => { if (e.target === e.currentTarget) setIsHelpOpen(false); }}
        >
          <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3">
              <HelpCircle size={20} />
            </div>

            <h3 className="text-base font-bold text-[var(--text)]">
              Enterprise IT Helpdesk
            </h3>
            <div className="text-xs text-[var(--muted)] mt-2 space-y-2.5 leading-relaxed">
              <p>For immediate credentials assistance, account lockouts, or role authorization requests:</p>
              <div className="p-3 rounded-xl bg-[var(--soft)] border border-[var(--border)] space-y-1.5 text-[11px] font-mono">
                <p><span className="text-[var(--text)] font-semibold">Email:</span> support@evenmore.io</p>
                <p><span className="text-[var(--text)] font-semibold">Ext:</span> +91 (022) 4800-ERP1</p>
                <p><span className="text-[var(--text)] font-semibold">Hours:</span> 24/7 Operations Desk</p>
              </div>
              <p className="text-[10.5px]">Standard SLA for priority access restoration is under 15 minutes.</p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="w-full py-2 rounded-xl bg-[var(--soft)] text-[var(--text)] text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
