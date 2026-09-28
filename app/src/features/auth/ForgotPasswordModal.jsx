import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  X,
  ShieldCheck,
} from 'lucide-react';
import { forgotPassword, resetPassword, verifyOtp } from '../../services/authService';
import { describeError } from '../../services/resourceSync';

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccess,
}) {
  const [step, setStep] = useState('REQUEST'); // 'REQUEST' | 'VERIFY_AND_RESET' | 'SUCCESS'
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setStep('REQUEST');
      setOtpDigits(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setInfoMessage('');
      setResendCooldown(0);
    }
  }, [isOpen, initialEmail]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus the first OTP box when entering the VERIFY_AND_RESET step
  useEffect(() => {
    if (step === 'VERIFY_AND_RESET') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  if (!isOpen) return null;

  const fullOtp = otpDigits.join('');

  // Step 1: Send OTP to Email
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await forgotPassword(cleanEmail);
      setInfoMessage(
        response?.message || 'A 6-digit verification code has been sent to your email.'
      );
      setStep('VERIFY_AND_RESET');
      setResendCooldown(60);
    } catch (err) {
      setError(describeError(err) || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError('');
    try {
      const response = await forgotPassword(email.trim());
      setInfoMessage(response?.message || 'New verification code sent to your email.');
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      setError(describeError(err) || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  // OTP inputs handling (auto-focus advance, backspace, paste)
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const updated = [...otpDigits];

    if (cleaned.length > 1) {
      // If user pasted or multi-char typed
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

  // Step 2: Submit Reset Password with OTP
  const handleResetSubmit = async (e) => {
    e?.preventDefault();
    if (fullOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resetPassword({
        email: email.trim(),
        otp: fullOtp,
        newPassword,
      });

      setStep('SUCCESS');
    } catch (err) {
      setError(
        describeError(err) || 'Failed to reset password. Please check the code and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    onClose();
    onSuccess?.(email.trim());
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

        {/* STEP 1: REQUEST OTP */}
        {step === 'REQUEST' && (
          <div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3.5 shadow-xs">
              <KeyRound size={22} />
            </div>

            <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">
              Forgot Password
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1 mb-5 leading-relaxed">
              Enter your corporate email address to receive a 6-digit one-time verification code (OTP).
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1 text-[11.5px] leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Corporate Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-[var(--muted)] pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: ENTER OTP & NEW PASSWORD */}
        {step === 'VERIFY_AND_RESET' && (
          <div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3.5 shadow-xs">
              <ShieldCheck size={22} />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setStep('REQUEST');
                  setError('');
                }}
                className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Change email</span>
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] mt-1 mb-4 leading-relaxed">
              We sent a 6-digit code to{' '}
              <strong className="text-[var(--text)] font-semibold">{email}</strong>.
            </p>

            {infoMessage && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span className="text-[11px]">{infoMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1 text-[11.5px] leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              {/* 6-digit OTP Inputs */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-2">
                  6-Digit Verification Code
                </label>
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
                      className="w-10 sm:w-12 h-12 text-center text-lg font-mono font-bold bg-[var(--soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition selection:bg-transparent"
                    />
                  ))}
                </div>

                {/* Resend Code Section */}
                <div className="flex items-center justify-between mt-2.5 text-[11px]">
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
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-10 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[var(--muted)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
                    className="w-full bg-[var(--soft)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-10 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
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

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('REQUEST')}
                  className="py-2.5 px-4 rounded-xl bg-[var(--soft)] text-[var(--text)] text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || fullOtp.length !== 6}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Updating Password...</span>
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
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 'SUCCESS' && (
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-500/5">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">
              Password Reset Complete!
            </h3>
            <p className="text-xs text-[var(--muted)] mt-2 mb-6 leading-relaxed max-w-xs mx-auto">
              Your password has been changed successfully. You can now sign in to your workspace with your new password.
            </p>

            <button
              type="button"
              onClick={handleDone}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              Sign In to Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
