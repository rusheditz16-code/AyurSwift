'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Zap,
  Send,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface AdminAuthPortalProps {
  emailInput: string;
  onEmailChange: (v: string) => void;
  pinInput: string;
  onPinChange: (v: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  authError: string | null;
  lockoutSeconds: number;
  onSubmit: (e: React.FormEvent) => void;
  dark: boolean;
  initialResetOpen?: boolean;
}

type ResetMode = 'PIN' | 'EMAIL' | 'BOTH';

export function AdminAuthPortal({
  emailInput,
  onEmailChange,
  pinInput,
  onPinChange,
  showPassword,
  onToggleShowPassword,
  authError,
  lockoutSeconds,
  onSubmit,
  dark,
  initialResetOpen = false,
}: AdminAuthPortalProps) {
  const [isResetView, setIsResetView] = useState(initialResetOpen);
  const [resetStep, setResetStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [resetMode, setResetMode] = useState<ResetMode>('PIN');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [loginSuccessBanner, setLoginSuccessBanner] = useState<string | null>(null);

  const inputBaseClass = `w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-[#0C831F]/25 focus:border-[#0C831F] ${
    dark
      ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400'
  }`;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setResetError(null);
    setResetNotice(null);
    setIsBusy(true);

    try {
      const res = await fetch('/api/admin/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryEmail: recoveryEmail.trim(),
          purpose: resetMode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setResetError(data.error || 'Could not send recovery OTP. Please try again.');
        return;
      }

      setResetNotice(
        data.message ||
          'If that is one of your authorized recovery emails, a 6-digit OTP has been sent.'
      );
      setResetStep('VERIFY');
    } catch {
      setResetError('Network error while requesting OTP. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setResetError(null);

    const wantsPin = resetMode === 'PIN' || resetMode === 'BOTH';
    const wantsEmail = resetMode === 'EMAIL' || resetMode === 'BOTH';

    if (otpInput.replace(/\D/g, '').length !== 6) {
      setResetError('Enter the exact 6-digit OTP received in your recovery Gmail.');
      return;
    }
    if (wantsPin && newPin.trim() !== confirmNewPin.trim()) {
      setResetError('New PIN / password and confirmation do not match.');
      return;
    }
    if (wantsPin && newPin.trim().length < 4) {
      setResetError('New PIN / password must be at least 4 characters.');
      return;
    }
    if (wantsEmail && !newEmail.trim()) {
      setResetError('Please enter your new admin Gmail address.');
      return;
    }

    setIsBusy(true);
    try {
      const res = await fetch('/api/admin/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: otpInput.replace(/\D/g, ''),
          resetMode,
          newPin: wantsPin ? newPin.trim() : undefined,
          newEmail: wantsEmail ? newEmail.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setResetError(data.error || 'Could not verify OTP or update credentials.');
        return;
      }

      if (wantsEmail && newEmail.trim()) {
        onEmailChange(newEmail.trim());
      }
      onPinChange('');
      setOtpInput('');
      setNewPin('');
      setConfirmNewPin('');
      setNewEmail('');
      setResetStep('REQUEST');
      setResetNotice(null);
      setResetError(null);
      setIsResetView(false);
      setLoginSuccessBanner(
        data.message || 'Credentials updated securely. Please sign in with your new credentials.'
      );
    } catch {
      setResetError('Network error while verifying OTP. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        dark
          ? 'bg-[#090D16] text-slate-100'
          : 'bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-[#ECFDF3]/60 text-slate-900'
      }`}
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 animate-modal-pop ${
          dark
            ? 'bg-[#111827] border-slate-800 shadow-black/50'
            : 'bg-white border-slate-200/90 shadow-slate-900/10'
        }`}
      >
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/ayurswift-logo.png"
              alt="AyurSwift"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF3] text-[#0C831F] text-[11px] font-extrabold border border-[#BBF7D0]">
            <Lock className="w-3 h-3" />
            <span>{isResetView ? 'Recovery OTP Verification' : 'Dark-Store Command Portal'}</span>
          </div>

          <div>
            <h1
              className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                dark ? 'text-white' : 'text-slate-950'
              }`}
            >
              {isResetView ? 'Reset Admin Email or PIN' : 'AyurSwift Merchant Hub'}
            </h1>
            <p
              className={`text-xs mt-1 max-w-xs mx-auto leading-relaxed ${
                dark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {isResetView
                ? 'A single-use 6-digit OTP is sent strictly to your 2 authorized recovery Gmail accounts only.'
                : 'Server-verified security enabled. Enter your authorized Gmail and security PIN to unlock live orders & stock.'}
            </p>
          </div>
        </div>

        {!isResetView ? (
          <form onSubmit={onSubmit} className="space-y-4">
            {loginSuccessBanner && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{loginSuccessBanner}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                className={`block text-xs font-bold ${
                  dark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                Authorized Gmail Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="Enter admin Gmail address"
                  autoFocus
                  required
                  disabled={lockoutSeconds > 0}
                  className={inputBaseClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className={`block text-xs font-bold ${
                  dark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                Security PIN / Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  maxLength={64}
                  value={pinInput}
                  onChange={(e) => onPinChange(e.target.value)}
                  placeholder="••••"
                  required
                  disabled={lockoutSeconds > 0}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-mono font-bold tracking-[0.2em] border transition-all focus:outline-none focus:ring-2 focus:ring-[#0C831F]/25 focus:border-[#0C831F] ${
                    dark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={onToggleShowPassword}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={lockoutSeconds > 0}
              className={`w-full font-extrabold py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                lockoutSeconds > 0
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-[#0C831F] hover:bg-[#096B19] text-white shadow-[#0C831F]/25 active:scale-[0.98] cursor-pointer'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {lockoutSeconds > 0 ? `Locked for ${lockoutSeconds}s` : 'Unlock Dark-Store Hub'}
              </span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsResetView(true);
                  setResetStep('REQUEST');
                  setResetError(null);
                  setResetNotice(null);
                  setLoginSuccessBanner(null);
                }}
                className="text-xs font-bold text-[#0C831F] hover:underline cursor-pointer"
              >
                Forgot or Reset Admin Email / PIN? (Get OTP on Recovery Gmail)
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Reset Mode Selector */}
            <div
              className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl border text-[11px] font-bold ${
                dark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {(
                [
                  { id: 'PIN', label: 'Reset PIN' },
                  { id: 'EMAIL', label: 'Reset Email' },
                  { id: 'BOTH', label: 'Reset Both' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setResetMode(opt.id);
                    setResetError(null);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    resetMode === opt.id
                      ? 'bg-[#0C831F] text-white shadow-xs'
                      : dark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {resetStep === 'REQUEST' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    className={`block text-xs font-bold ${
                      dark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Your Authorized Recovery Gmail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="Enter your main recovery Gmail"
                      required
                      disabled={isBusy}
                      className={inputBaseClass}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Reset OTPs are delivered strictly to your 2 registered main Gmail addresses and expire in 10 minutes.
                  </p>
                </div>

                {resetError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{resetError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full bg-[#0C831F] hover:bg-[#096B19] disabled:opacity-60 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-[#0C831F]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isBusy ? 'Sending OTP...' : 'Send 6-Digit Recovery OTP'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-3.5">
                {resetNotice && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11.5px] leading-relaxed font-medium">
                    {resetNotice}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold">6-Digit OTP from Gmail</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      required
                      className={`${inputBaseClass} font-mono tracking-[0.35em] text-sm`}
                    />
                  </div>
                </div>

                {(resetMode === 'EMAIL' || resetMode === 'BOTH') && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold">New Admin Login Gmail</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new login Gmail"
                        required
                        className={inputBaseClass}
                      />
                    </div>
                  </div>
                )}

                {(resetMode === 'PIN' || resetMode === 'BOTH') && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold">New Security PIN / Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                          type="password"
                          maxLength={64}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          placeholder="Choose a strong new PIN/password"
                          required
                          className={inputBaseClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold">Confirm New PIN / Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                          type="password"
                          maxLength={64}
                          value={confirmNewPin}
                          onChange={(e) => setConfirmNewPin(e.target.value)}
                          placeholder="Re-enter new PIN/password"
                          required
                          className={inputBaseClass}
                        />
                      </div>
                    </div>
                  </>
                )}

                {resetError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{resetError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full bg-[#0C831F] hover:bg-[#096B19] disabled:opacity-60 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-[#0C831F]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{isBusy ? 'Verifying...' : 'Verify OTP & Update Credentials'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetStep('REQUEST');
                    setResetError(null);
                  }}
                  className="w-full text-[11px] font-bold text-slate-500 hover:text-[#0C831F] cursor-pointer"
                >
                  Didn&apos;t get the email? Request a new OTP
                </button>
              </form>
            )}

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsResetView(false);
                  setResetError(null);
                }}
                className="text-xs font-bold text-slate-500 hover:text-[#0C831F] cursor-pointer"
              >
                ← Back to Admin Sign In
              </button>
            </div>
          </div>
        )}

        <div
          className={`pt-4 border-t flex items-center justify-between text-xs ${
            dark ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 font-bold transition-colors ${
              dark
                ? 'text-slate-400 hover:text-emerald-400'
                : 'text-slate-500 hover:text-[#0C831F]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>Bhavnagar Hub</span>
          </span>
        </div>
      </div>
    </div>
  );
}
