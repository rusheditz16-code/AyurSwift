'use client';

import React from 'react';
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
}

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
}: AdminAuthPortalProps) {
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
            <span>Dark-Store Command Portal</span>
          </div>

          <div>
            <h1
              className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                dark ? 'text-white' : 'text-slate-950'
              }`}
            >
              AyurSwift Merchant Hub
            </h1>
            <p
              className={`text-xs mt-1 max-w-xs mx-auto leading-relaxed ${
                dark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Dual-factor security enabled. Verify your authorized Gmail and 4-digit PIN to access live orders &amp; stock.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-[#0C831F]/25 focus:border-[#0C831F] ${
                  dark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className={`block text-xs font-bold ${
                dark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              Security PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                maxLength={6}
                value={pinInput}
                onChange={(e) => onPinChange(e.target.value)}
                placeholder="••••"
                required
                disabled={lockoutSeconds > 0}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-mono font-bold tracking-[0.25em] border transition-all focus:outline-none focus:ring-2 focus:ring-[#0C831F]/25 focus:border-[#0C831F] ${
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
        </form>

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
