'use client';

import React, { useState } from 'react';
import { QrCode, Mail, Check, Copy, ShieldCheck } from 'lucide-react';
import { MerchantSettings } from '@/types';

interface AdminSettingsTabProps {
  settings: MerchantSettings;
  onChangeSettings: (s: MerchantSettings) => void;
  onSaveSettings: (e: React.FormEvent) => void;
  savedToast: boolean;
  dark: boolean;
}

export function AdminSettingsTab({
  settings,
  onChangeSettings,
  onSaveSettings,
  savedToast,
  dark,
}: AdminSettingsTabProps) {
  const [copiedVpa, setCopiedVpa] = useState(false);

  const cardBg = dark
    ? 'bg-[#111827] border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';
  const inputClass = `w-full px-3 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15 ${
    dark
      ? 'bg-slate-900 border-slate-700 text-white'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
  }`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=${encodeURIComponent(
    `upi://pay?pa=${settings.merchantUpiId.trim()}&pn=${encodeURIComponent(
      settings.merchantUpiName.trim() || 'AyurSwift'
    )}&cu=INR&tn=AyurSwift%20Payment`
  )}`;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(settings.merchantUpiId);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
      {/* Left: Configuration Form */}
      <form
        onSubmit={onSaveSettings}
        className={`lg:col-span-3 rounded-2xl border p-5 space-y-4 ${cardBg}`}
      >
        <div className="pb-3 border-b border-slate-500/15">
          <h2 className="font-extrabold text-base">Storefront, Delivery &amp; UPI Config</h2>
          <p className={`text-xs mt-0.5 ${muted}`}>
            Controls live storefront checkout calculations, WhatsApp routing &amp; UPI QR destination
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">
            Merchant WhatsApp Number (with country code, no +)
          </label>
          <input
            type="text"
            value={settings.merchantWhatsApp}
            onChange={(e) =>
              onChangeSettings({ ...settings, merchantWhatsApp: e.target.value })
            }
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold mb-1">Store UPI ID (VPA)</label>
            <input
              type="text"
              value={settings.merchantUpiId}
              onChange={(e) =>
                onChangeSettings({ ...settings, merchantUpiId: e.target.value })
              }
              required
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">UPI Payee Name</label>
            <input
              type="text"
              value={settings.merchantUpiName}
              onChange={(e) =>
                onChangeSettings({ ...settings, merchantUpiName: e.target.value })
              }
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold mb-1">In-City Fee (₹)</label>
            <input
              type="number"
              value={settings.cityDeliveryFee}
              onChange={(e) =>
                onChangeSettings({ ...settings, cityDeliveryFee: Number(e.target.value) })
              }
              required
              className={`${inputClass} tabular-nums`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Free Above (₹)</label>
            <input
              type="number"
              value={settings.cityFreeDeliveryAbove}
              onChange={(e) =>
                onChangeSettings({
                  ...settings,
                  cityFreeDeliveryAbove: Number(e.target.value),
                })
              }
              required
              className={`${inputClass} tabular-nums`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Courier Fee (₹)</label>
            <input
              type="number"
              value={settings.courierDeliveryFee}
              onChange={(e) =>
                onChangeSettings({ ...settings, courierDeliveryFee: Number(e.target.value) })
              }
              required
              className={`${inputClass} tabular-nums`}
            />
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs space-y-1">
          <div className="font-extrabold text-emerald-700 dark:text-emerald-400">
            Server-Side Admin Credentials
          </div>
          <p className={`text-[11px] leading-relaxed ${muted}`}>
            For your security, your Admin PIN is no longer stored in browser storage. Update{' '}
            <code className="font-mono">ADMIN_EMAILS</code> and{' '}
            <code className="font-mono">ADMIN_PIN_HASH</code> in Vercel Environment Variables to rotate credentials.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="submit"
            className="bg-[#0C831F] hover:bg-[#096B19] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            Save Store Configuration
          </button>
          {savedToast && (
            <span className="text-xs font-extrabold text-emerald-500 flex items-center gap-1 animate-fade-in">
              <Check className="w-4 h-4" />
              <span>Settings saved!</span>
            </span>
          )}
        </div>
      </form>

      {/* Right: Live UPI QR Preview & Admin Security Card */}
      <div className="lg:col-span-2 space-y-4">
        <div className={`rounded-2xl border p-5 space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm">Live Bharat UPI QR</h3>
                <p className={`text-[10.5px] ${muted}`}>Zero-fee direct settlement</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
              Active
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-center gap-2 text-center">
            <img
              src={qrUrl}
              alt={`UPI QR for ${settings.merchantUpiId}`}
              className="w-40 h-40 object-contain"
            />
            <div className="text-[11px] font-bold text-slate-600">
              {settings.merchantUpiName}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <code
              className={`px-2.5 py-1.5 rounded-xl font-mono font-bold truncate flex-1 border ${
                dark
                  ? 'bg-slate-900 border-slate-800 text-emerald-400'
                  : 'bg-slate-50 border-slate-200 text-[#0C831F]'
              }`}
            >
              {settings.merchantUpiId}
            </code>
            <button
              type="button"
              onClick={handleCopyVpa}
              className="px-3 py-1.5 rounded-xl bg-[#0C831F] hover:bg-[#096B19] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedVpa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedVpa ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 space-y-2 ${cardBg}`}>
          <div className="flex items-center gap-2 text-xs font-extrabold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Dual-Factor Protected Accounts</span>
          </div>
          <div className={`text-[11px] font-mono flex items-center gap-1.5 ${muted}`}>
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">ayurswift.care@gmail.com</span>
          </div>
          <div className={`text-[11px] font-mono flex items-center gap-1.5 ${muted}`}>
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">rushirajdabhi16@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
