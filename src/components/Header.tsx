'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Zap, Lock, MapPin, ChevronDown } from 'lucide-react';
import { MerchantSettings } from '@/types';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  settings: MerchantSettings;
}

export function Header({ cartCount, cartTotal, onOpenCart, settings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      {/* Micro-Fulfillment Promise Top Ribbon */}
      <div className="bg-emerald-950 text-white text-[11px] py-1.5 px-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-bold">Dark Store Live:</span>
            <span className="text-gray-200">Home-Stocked Ayurvedic OTC</span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-emerald-200">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> 30-45m Rapido Parcel In-City
            </span>
            <span>•</span>
            <span>📦 All-India Speed Post & Courier</span>
            <span>•</span>
            <span className="text-amber-300 font-bold">₹0 Platform Fees</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Genuine GST Billed</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Location Pill */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-all">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-emerald-950">
                  Ayur<span className="text-emerald-700">Swift</span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-emerald-950 shadow-2xs">
                  <Zap className="w-2.5 h-2.5 mr-0.5 fill-emerald-950" /> RAPID
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">
                Genuine Ayurveda & OTC, Delivered Swiftly
              </p>
            </div>
          </Link>

          {/* Rapid Delivery Location Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs text-emerald-950">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <div>
              <div className="text-[10px] font-bold text-emerald-800 leading-tight">
                DELIVERY IN 30-45 MINS
              </div>
              <div className="text-[11px] text-gray-700 font-medium leading-tight">
                Home Dark Store Dispatch
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Admin Lock / Merchant Hub */}
          <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-emerald-900 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-200"
            title="Merchant Admin Hub"
          >
            <Lock className="w-4 h-4" />
          </Link>

          {/* Quick Commerce Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-xl font-bold shadow-md active:scale-95 transition-all text-xs sm:text-sm"
            aria-label="View Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-400 text-emerald-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">My Cart</span>
            {cartCount > 0 && (
              <span className="bg-emerald-900/90 px-1.5 py-0.5 rounded text-xs font-bold text-amber-300">
                ₹{cartTotal}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
