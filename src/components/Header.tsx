'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Zap, Lock, MapPin, Sparkles } from 'lucide-react';
import { MerchantSettings } from '@/types';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  settings: MerchantSettings;
}

export function Header({ cartCount, cartTotal, onOpenCart, settings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#060908]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl">
      {/* Top Futuristic Ribbon (Digital Gravity Style) */}
      <div className="bg-black/60 border-b border-white/[0.05] text-[11px] py-1 px-4 text-gray-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            </span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
              Dark Store Live
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300 hidden sm:inline">Direct Home Fulfillment Hub</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-gray-400 text-[11px]">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> 30-45m Rapido Parcel In-City
            </span>
            <span>•</span>
            <span>📦 All-India Speed Post & Courier</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">₹0 Platform Fee</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Genuine GST Billed</span>
          </div>
        </div>
      </div>

      {/* Main Glass Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand & Location Indicator */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/30 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:scale-105 group-hover:border-emerald-400 transition-all">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-white">
                  Ayur<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Swift</span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  <Zap className="w-2.5 h-2.5 mr-0.5 fill-black" /> RAPID
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                Genuine Ayurveda & OTC, Delivered Swiftly
              </p>
            </div>
          </Link>

          {/* Location Badge (Dubai Agency Style Pill) */}
          <div className="hidden lg:flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] px-3.5 py-1.5 rounded-full text-xs text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <div className="leading-tight">
              <span className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-wider block">
                Instant Dispatch In 30-45 Mins
              </span>
              <span className="text-[11px] text-gray-300 font-medium">
                Home Dark Store Hub
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Admin Dashboard Lock Button */}
          <Link
            href="/admin"
            className="p-2 text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/40 rounded-xl transition-all"
            title="Merchant Admin Hub"
          >
            <Lock className="w-4 h-4" />
          </Link>

          {/* Quick Commerce Cart CTA (Digital Gravity Electric Glow) */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 hover:from-emerald-300 hover:to-teal-300 text-black px-4 py-2 rounded-xl font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-95 transition-all"
            aria-label="View Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 fill-black" />
              {cartCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-black text-emerald-300 border border-emerald-400 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-black tracking-wide">CART</span>
            {cartCount > 0 && (
              <span className="bg-black/20 px-1.5 py-0.5 rounded text-xs font-black">
                ₹{cartTotal}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
