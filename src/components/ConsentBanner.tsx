'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie, Check, Loader2 } from 'lucide-react';
import {
  acceptPrivacyConsent,
  checkPrivacyConsentStatus,
  CONSENT_EVENT_NAME,
} from '@/lib/checkoutGuardClient';

/**
 * Non-blocking Smart DPDP Privacy Policy & Essential Security Cookie Banner.
 * - Lets visitors browse the store immediately (low bounce rate)
 * - Issues a 180-day HMAC-SHA256 signed HttpOnly cookie (`ayurswift_consent`) required for
 *   placing orders, tracking by phone/ID, and submitting UTRs (blocks raw unconsented API bots).
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    let active = true;
    checkPrivacyConsentStatus().then((accepted) => {
      if (active && !accepted) {
        setVisible(true);
      }
    });

    const onAccepted = () => {
      setVisible(false);
    };
    window.addEventListener(CONSENT_EVENT_NAME, onAccepted);
    return () => {
      active = false;
      window.removeEventListener(CONSENT_EVENT_NAME, onAccepted);
    };
  }, []);

  if (!visible) return null;

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      const ok = await acceptPrivacyConsent();
      if (ok) {
        setVisible(false);
      }
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <aside
      role="region"
      aria-label="Privacy policy and essential cookie notice"
      className="fixed bottom-16 md:bottom-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl z-60 animate-fade-in"
    >
      <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-2xl border border-emerald-500/30 shadow-2xl shadow-slate-950/35 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
              <Cookie className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
              <span>Privacy &amp; Essential Security Cookies</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
              We use strictly essential anti-bot security cookies (zero ad trackers) and your order info under India&apos;s DPDP Act. Required to place or track orders.{' '}
              <Link
                href="/privacy"
                className="text-emerald-300 hover:text-emerald-200 underline font-semibold"
              >
                Privacy Policy
              </Link>{' '}
              &bull;{' '}
              <Link
                href="/terms"
                className="text-emerald-300 hover:text-emerald-200 underline font-semibold"
              >
                Terms
              </Link>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          disabled={isAccepting}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 bg-[#0C831F] hover:bg-[#0EA026] disabled:opacity-60 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          {isAccepting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5 stroke-[2.75]" />
          )}
          <span>{isAccepting ? 'Securing...' : 'Accept & Continue'}</span>
        </button>
      </div>
    </aside>
  );
}
