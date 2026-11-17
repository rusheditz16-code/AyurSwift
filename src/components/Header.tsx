'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Zap, Lock, MapPin } from 'lucide-react';
import { MerchantSettings } from '@/types';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  settings: MerchantSettings;
}

export function Header({ cartCount, cartTotal, onOpenCart, settings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      {/* Top Delivery Notice Bar (Blinkit style) */}
      <div className="bg-emerald-50 border-b border-emerald-100/80 px-4 py-1.5 text-xs text-emerald-900">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-medium">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-bold text-emerald-800">Delivery in 30–45 Mins</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-600 hidden sm:inline">Via Rapido Parcel Bike Rider</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-600">
            <span className="hidden md:inline">📦 All-India Courier Available</span>
            <span className="hidden md:inline text-gray-300">•</span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Genuine GST Stock
            </span>
          </div>
        </div>
      </div>

      {/* Main Clean Storefront Header */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-xs group-hover:bg-emerald-700 transition-colors">
            🌿
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-gray-900">
                Ayur<span className="text-emerald-600">Swift</span>
              </span>
              <span className="bg-amber-100 text-amber-800 font-black text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> RAPID
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium">
              Authentic Ayurveda & OTC Health
            </p>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Admin Lock Button */}
          <Link
            href="/admin"
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            title="Merchant Admin Hub"
          >
            <Lock className="w-4 h-4" />
          </Link>

          {/* Clean Cart Button */}
          <button
            onClick={onOpenCart}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 ${
              cartCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            aria-label="View Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-gray-900 font-black text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            {cartCount > 0 ? (
              <span className="font-black">₹{cartTotal}</span>
            ) : (
              <span className="font-semibold">Cart</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
