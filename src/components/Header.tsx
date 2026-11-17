'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react';
import { MerchantSettings } from '@/types';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  settings: MerchantSettings;
}

export function Header({ cartCount, cartTotal, onOpenCart, settings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-emerald-100 shadow-xs">
      {/* Micro-Fulfillment Promise Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white text-xs py-1.5 px-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-medium">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-200">Dark Store Live:</span>
            <span>Home-Stocked Ayurvedic OTC</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-emerald-100">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-300" /> 30-45m Rapido In-City
            </span>
            <span>•</span>
            <span>📦 All-India Courier (Prepaid)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>100% Genuine GST Billed</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Promise */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:bg-emerald-800 transition-colors">
            🌿
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-emerald-950 font-sans">
                Ayur<span className="text-emerald-700">Swift</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Zap className="w-2.5 h-2.5 mr-0.5 fill-amber-500 text-amber-500" /> FAST
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium line-clamp-1">
              Genuine Ayurveda & OTC, Delivered Swiftly
            </p>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Admin Dashboard Entry */}
          <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
            title="Merchant Admin Portal"
          >
            <Lock className="w-5 h-5" />
          </Link>

          {/* Quick Commerce Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl font-semibold shadow-md active:scale-95 transition-all text-sm"
            aria-label="View Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-400 text-emerald-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-emerald-800/80 px-1.5 py-0.5 rounded text-xs font-bold text-amber-200">
                ₹{cartTotal}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
