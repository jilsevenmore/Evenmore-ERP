import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  X,
  ShieldCheck,
  Key,
} from 'lucide-react';
import { changePassword, forgotPassword, resetPassword } from '../../services/authService';
import { describeError } from '../../services/resourceSync';
import { useAppStore } from '../../stores/appStore';

export default function ChangePasswordModal({ isOpen, onClose, userEmail = '' }) {
  const showToast = useAppStore((s) => s.showToast);

  // Tab: 'CURRENT' (using current password) | 'OTP' (reset via email OTP)
  const [tab, setTab] = useState('CURRENT');

  // Fields for 'CURRENT' mode
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fields for 'OTP' mode
  const [otpStep, setOtpStep] = useState('REQUEST'); // 'REQUEST' | 'ENTER_OTP'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpNewPassword, setOtpNewPassword] = useState('');
  const [otpConfirmPassword, setOtpConfirmPassword] = useState('');
  const [showOtpNewPassword, setShowOtpNewPassword] = useState(false);
  const [showOtpConfirmPassword, setShowOtpConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Status & loading
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const otpInputsRef = useRef([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTab('CURRENT');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setOtpStep('REQUEST');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpNewPassword('');
      setOtpConfirmPassword('');
      setResendCooldown(0);

      setError('');
      setIsSuccess(false);
      setSuccessMessage('');
    }
  }, [isOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when switching to ENTER_OTP
  useEffect(() => {
    if (otpStep === 'ENTER_OTP') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [otpStep]);

  if (!isOpen) return null;

  // Handler: Change password using current password
  const handleChangeWithCurrentPassword = async (e) => {
    e?.preventDefault();
    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setError('Please enter your new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await changePassword({ currentPassword, newPassword });
      setIsSuccess(true);
      setSuccessMessage('Password changed successfully.');
      showToast?.('Password changed successfully.');
    } catch (err) {
      setError(describeError(err) || 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Send OTP to email
  const handleRequestOtp = async () => {
    if (!userEmail) {
      setError('User email not found. Please log in again.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await forgotPassword(userEmail);
      setOtpStep('ENTER_OTP');
      setResendCooldown(60);
      showToast?.(`Verification code sent to ${userEmail}`);
    } catch (err) {
      setError(describeError(err) || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError('');
    try {
      await forgotPassword(userEmail);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
      showToast?.('A new code has been sent to your email.');
    } catch (err) {
      setError(describeError(err) || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  // OTP inputs handling
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    const updated = [...otpDigits];

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      chars.forEach((c, idx) => {
        if (index + idx < 6) updated[index + idx] = c;
      });
      setOtpDigits(updated);
      const nextIdx = Math.min(5, index + chars.length);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    updated[index] = cleaned;
    setOtpDigits(updated);

    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;

    const updated = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      if (i < 6) updated[i] = d;
    });
    setOtpDigits(updated);

    const focusIdx = Math.min(digits.length, 5);
    otpInputsRef.current[focusIdx]?.focus();
  };

  // Handler: Submit Reset with OTP
  const handleResetWithOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    if (!otpNewPassword) {
      setError('Please enter your new password.');
      return;
    }
    if (otpNewPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (otpNewPassword !== otpConfirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resetPassword({
        email: userEmail,
        otp: fullOtp,
        newPassword: otpNewPassword,
      });
      setIsSuccess(true);
      setSuccessMessage('Password reset successfully via email verification.');
      showToast?.('Password reset successfully.');
    } catch (err) {
      setError(describeError(err) || 'Failed to reset password. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 text-[var(--muted)] hover:text-[var(--text)] p-1.5 rounded-xl hover:bg-[var(--soft)] transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3 shadow-xs">
            <KeyRound size={22} />
          </div>
          <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">
            Account Security &amp; Password
          </h3>
          <p className="text-xs text-[var(--muted)] mt-1 truncate">
            {userEmail ? `Manage security credentials for ${userEmail}` : 'Update your account password'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 text-[11.5px] leading-relaxed">{error}</div>
          </div>
        )}

        {/* Success View */}
        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-500/5">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-base font-bold text-[var(--text)]">
              {successMessage || 'Password Updated!'}
            </h4>
            <p className="text-xs text-[var(--muted)] mt-1.5 mb-6 max-w-xs mx-auto">
              Your new password is now active. Keep it confidential and secure.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* Tabs for Method Selection */}
            <div className="flex items-center gap-1 p-1 bg-[var(--soft)] rounded-xl border border-[var(--border)] mb-4">
              <button
                type="button"
                onClick={() => {
                  setTab('CURRENT');
                  setError('');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'CURRENT'
                    ? 'bg-[var(--card)] text-cyan-600 dark:text-cyan-400 shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Key size={13} />
                <span>Current Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('OTP');
                  setError('');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'OTP'
                    ? 'bg-[var(--card)] text-cyan-600 dark:text-cyan-400 shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Mail size={13} />
                <span>Reset via Email OTP</span>
              </button>
            </div>

            {/* TAB 1: CHANGE USING CURRENT PASSWORD */}
            {tab === 'CURRENT' && (
              <form onSubmit={handleChangeWithCurrentPassword} className="space-y-3.5">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Current Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={15} className="absolute left-3.5 text-[var(--muted)] pointer-events-none" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter existing password"
                      className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-10 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 text-[var(--muted)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={15} className="absolute left-3.5 text-[var(--muted)] pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-10 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-[var(--muted)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={15} className="absolute left-3.5 text-[var(--muted)] pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-10 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-[var(--muted)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--soft)] text-[var(--text)] text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setTab('OTP');
                      setError('');
                    }}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    Forgot your current password? Reset via Email OTP →
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: RESET VIA EMAIL OTP */}
            {tab === 'OTP' && (
              <div>
                {otpStep === 'REQUEST' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-[var(--soft)] border border-[var(--border)]">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)] mb-1">
                        <Mail size={14} className="text-cyan-600" />
                        <span>Registered Account Email</span>
                      </div>
                      <p className="text-xs text-[var(--muted)] font-mono break-all">{userEmail}</p>
                      <p className="text-[11px] text-[var(--muted)] mt-2 leading-relaxed">
                        A 6-digit one-time verification code (OTP) will be sent to your email to verify your identity and set a new password.
                      </p>
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-[var(--soft)] text-[var(--text)] text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={isLoading}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            <span>Sending Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {otpStep === 'ENTER_OTP' && (
                  <form onSubmit={handleResetWithOtp} className="space-y-3.5">
                    {/* 6-digit OTP */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-[var(--text)]">
                          6-Digit Code sent to your email
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep('REQUEST');
                            setError('');
                          }}
                          className="text-[10.5px] text-cyan-600 hover:underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                        {otpDigits.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (otpInputsRef.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                            className="w-10 sm:w-11 h-11 text-center text-lg font-mono font-bold bg-[var(--soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition selection:bg-transparent"
                          />
                        ))}
                      </div>

                      {/* Resend Code */}
                      <div className="flex items-center justify-between mt-2 text-[11px]">
                        <span className="text-[var(--muted)]">Didn't receive code?</span>
                        {resendCooldown > 0 ? (
                          <span className="text-[var(--muted)] font-mono">
                            Resend in {resendCooldown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isResending}
                            className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <RotateCw size={11} className={isResending ? 'animate-spin' : ''} />
                            <span>Resend Code</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                        New Password
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={15} className="absolute left-3.5 text-[var(--muted)] pointer-events-none" />
                        <input
                          type={showOtpNewPassword ? 'text' : 'password'}
                          required
                          value={otpNewPassword}
                          onChange={(e) => setOtpNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-10 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOtpNewPassword(!showOtpNewPassword)}
                          className="absolute right-3 text-[var(--muted)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
                        >
                          {showOtpNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={15} className="absolute left-3.5 text-[var(--muted)] pointer-events-none" />
                        <input
                          type={showOtpConfirmPassword ? 'text' : 'password'}
                          required
                          value={otpConfirmPassword}
                          onChange={(e) => setOtpConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-10 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOtpConfirmPassword(!showOtpConfirmPassword)}
                          className="absolute right-3 text-[var(--muted)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
                        >
                          {showOtpConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => setOtpStep('REQUEST')}
                        className="py-2.5 px-4 rounded-xl bg-[var(--soft)] text-[var(--text)] text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || otpDigits.join('').length !== 6}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            <span>Resetting...</span>
                          </>
                        ) : (
                          <>
                            <span>Reset Password</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
