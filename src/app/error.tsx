'use client';

import React from 'react';
import { AlertTriangle, MessageCircle, RefreshCw } from 'lucide-react';
import { DEFAULT_SETTINGS } from '@/lib/initialData';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const waUrl = `https://wa.me/${DEFAULT_SETTINGS.merchantWhatsApp}?text=${encodeURIComponent(
    'Hello AyurSwift! I need help placing an Ayurvedic medicine order.'
  )}`;

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-extrabold text-gray-950 tracking-tight">
            Temporary hiccup on AyurSwift
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Your cart and saved address are safe. Tap below to reload the live store, or order directly on WhatsApp.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0C831F] hover:bg-[#096B19] text-white font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Store</span>
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-[#0A5C16] border border-emerald-200 font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Order on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
