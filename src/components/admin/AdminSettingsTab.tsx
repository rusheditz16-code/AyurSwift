'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  Mail,
  Check,
  Copy,
  ShieldCheck,
  Smartphone,
  Zap,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { MerchantSettings } from '@/types';

interface WebhookCreditRecord {
  txn_id: string;
  amount: number;
  sender_name: string;
  matched_order_id: string | null;
  raw_summary: string;
  received_at: string;
}

interface AdminSettingsTabProps {
  settings: MerchantSettings;
  onChangeSettings: (s: MerchantSettings) => void;
  onSaveSettings: (e: React.FormEvent) => void;
  onOpenCredentialReset?: () => void;
  savedToast: boolean;
  dark: boolean;
}

export function AdminSettingsTab({
  settings,
  onChangeSettings,
  onSaveSettings,
  onOpenCredentialReset,
  savedToast,
  dark,
}: AdminSettingsTabProps) {
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedJsonBody, setCopiedJsonBody] = useState(false);
  const [recentCredits, setRecentCredits] = useState<WebhookCreditRecord[]>([]);
  const [testNotificationText, setTestNotificationText] = useState(
    'You received Rs.50.0 from DABHI MITALI .. with txn ID FMPIB7008115932. Your FamX a/c balance is Rs.12066.99 on FamApp by Trio'
  );
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const loadWebhookConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks/upi-notify', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as {
        success?: boolean;
        webhookUrl?: string;
        recentCredits?: WebhookCreditRecord[];
      };
      if (data?.success) {
        if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
        if (Array.isArray(data.recentCredits)) setRecentCredits(data.recentCredits);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadWebhookConfig();
  }, [loadWebhookConfig]);

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

  const handleCopyWebhookUrl = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const macroDroidBodyTemplate = '{"text": "{not_text}"}';

  const handleCopyMacroDroidBody = () => {
    navigator.clipboard.writeText(macroDroidBodyTemplate);
    setCopiedJsonBody(true);
    setTimeout(() => setCopiedJsonBody(false), 2000);
  };

  const handleSimulateWebhook = async () => {
    if (!testNotificationText.trim() || isTestingWebhook) return;
    setIsTestingWebhook(true);
    setTestWebhookResult(null);
    try {
      const res = await fetch('/api/webhooks/upi-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testNotificationText }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        error?: string;
        parsed?: { amount: number; txnId: string; senderName: string };
      };
      if (res.ok && data.success) {
        setTestWebhookResult({
          ok: true,
          message:
            data.message ||
            `Parsed ₹${data.parsed?.amount} (Txn: ${data.parsed?.txnId}) cleanly!`,
        });
        loadWebhookConfig();
      } else {
        setTestWebhookResult({
          ok: false,
          message: data.error || 'Notification did not match FamApp credit format.',
        });
      }
    } catch {
      setTestWebhookResult({
        ok: false,
        message: 'Network error testing webhook.',
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-5">
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

          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs space-y-2.5">
            <div className="font-extrabold text-emerald-700 dark:text-emerald-400">
              Server-Side Admin Credentials &amp; OTP Reset
            </div>
            <p className={`text-[11px] leading-relaxed ${muted}`}>
              Your Admin login email and hashed PIN are verified strictly on the server. To change
              your email or PIN anytime, request a 6-digit recovery OTP sent strictly to your 2
              authorized recovery Gmail accounts.
            </p>
            {onOpenCredentialReset && (
              <button
                type="button"
                onClick={onOpenCredentialReset}
                className="px-3.5 py-2 rounded-lg bg-[#0C831F] hover:bg-[#096B19] text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                Reset Admin Email or PIN via OTP →
              </button>
            )}
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

      {/* Bottom Full-Width Card: FamApp by Trio / FamPay Free Auto-Verification Webhook */}
      <div className={`rounded-2xl border p-5 space-y-4 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-500/15">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base">
                  FamApp by Trio / FamPay — Free Auto-Payment Webhook
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                  ₹0 Gateway Fee
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${muted}`}>
                Forwards your phone&apos;s FamApp credit notifications to AyurSwift and marks matching UPI orders{' '}
                <strong>VERIFIED ✓</strong> automatically in ~2 seconds (strips your FamX balance for privacy).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadWebhookConfig}
            className="px-3 py-1.5 rounded-xl border border-slate-500/25 hover:bg-slate-500/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: 2-Minute MacroDroid Android Setup */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>2-Minute Android Setup (Free MacroDroid App)</span>
            </div>

            <div className="space-y-2 text-[11px] leading-relaxed">
              <div>
                <span className="font-bold">Step 1 (Trigger):</span> Install free{' '}
                <strong>MacroDroid</strong> on Android → Tap <strong>Add Macro</strong> →{' '}
                <strong>Triggers → Device Events → Notification → Notification Received</strong> →
                Select app <strong>FamApp by Trio</strong> → Text content: select{' '}
                <strong>Matches Regex</strong> and paste:{' '}
                <code className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono">
                  (You received Rs|was credited to your account)
                </code>
              </div>

              <div>
                <span className="font-bold">Step 2 (Action — Webhook URL):</span> Go to{' '}
                <strong>Actions → Web Interactions → HTTP Request</strong> → Method:{' '}
                <strong>POST</strong> → Paste your personal signed Webhook URL below:
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl || 'Loading signed webhook URL...'}
                  className={`${inputClass} font-mono text-[11px]`}
                />
                <button
                  type="button"
                  onClick={handleCopyWebhookUrl}
                  disabled={!webhookUrl}
                  className="px-3 py-2 rounded-xl bg-[#0C831F] hover:bg-[#096B19] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>

              <div>
                <span className="font-bold">Step 3 (Content Body):</span> In HTTP Request →{' '}
                <strong>Content Body</strong> → Content Type:{' '}
                <code className="font-mono">application/json</code> → Paste this body (uses MacroDroid&apos;s{' '}
                <code className="font-mono">{'{not_text}'}</code> notification text variable):
              </div>

              <div className="flex items-center gap-2">
                <code
                  className={`px-3 py-2 rounded-xl font-mono text-xs flex-1 border ${
                    dark
                      ? 'bg-slate-900 border-slate-800 text-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-[#0C831F]'
                  }`}
                >
                  {macroDroidBodyTemplate}
                </code>
                <button
                  type="button"
                  onClick={handleCopyMacroDroidBody}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedJsonBody ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJsonBody ? 'Copied' : 'Copy Body'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Simulator + Recent FamApp Credits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold">
                Live FamApp Notification Simulator (Test Auto-Verify)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setTestNotificationText(
                      'You received Rs.50.0 from DABHI MITALI .. with txn ID FMPIB7008115932. Your FamX a/c balance is Rs.12066.99 on FamApp by Trio'
                    )
                  }
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 cursor-pointer"
                >
                  Format 1 (Received)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTestNotificationText(
                      'Rs 534.6 was credited to your account with transaction ID FMPIB6913513778. Currently, your account balance is Rs 6615.08 on FamPay.'
                    )
                  }
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 cursor-pointer"
                >
                  Format 2 (Credited)
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={testNotificationText}
              onChange={(e) => setTestNotificationText(e.target.value)}
              className={`${inputClass} font-mono text-[11px] resize-none`}
              placeholder="Paste a real FamApp notification here to test parsing & auto-verification..."
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateWebhook}
                disabled={isTestingWebhook}
                className="px-4 py-2 rounded-xl bg-[#0C831F] hover:bg-[#096B19] text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isTestingWebhook ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>Test Notification Webhook</span>
              </button>
            </div>

            {testWebhookResult && (
              <div
                className={`p-2.5 rounded-xl border text-xs font-bold ${
                  testWebhookResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                }`}
              >
                {testWebhookResult.message}
              </div>
            )}

            {recentCredits.length > 0 && (
              <div className="pt-1 space-y-1.5">
                <div className={`text-[11px] font-extrabold ${muted}`}>
                  Recent Received FamApp Webhook Credits ({recentCredits.length})
                </div>
                <div className="max-h-36 overflow-y-auto thin-scrollbar space-y-1.5">
                  {recentCredits.map((c) => (
                    <div
                      key={c.txn_id}
                      className={`px-3 py-2 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                        dark
                          ? 'bg-slate-900/70 border-slate-800'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">
                          ₹{c.amount} • <span className="font-mono">{c.txn_id}</span>
                        </div>
                        <div className={`text-[10px] truncate ${muted}`}>
                          {c.sender_name ? `From: ${c.sender_name}` : 'FamPay Credit'}
                        </div>
                      </div>
                      {c.matched_order_id ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-extrabold text-[10px] shrink-0">
                          Verified {c.matched_order_id} ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold text-[10px] shrink-0">
                          Ready to Match
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
