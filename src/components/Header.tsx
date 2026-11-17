'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  MapPin,
  ChevronDown,
  Zap,
  Lock,
  PhoneCall,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { MerchantSettings } from '@/types';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  settings: MerchantSettings;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
}

export function Header({
  cartCount,
  cartTotal,
  onOpenCart,
  settings,
  searchQuery = '',
  onSearchChange = () => {},
  selectedCategory = 'ALL',
  onSelectCategory = () => {},
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      {/* 1. Top Utility Strip (Tata 1mg Style) */}
      <div className="bg-[#FAFBFB] border-b border-gray-200/80 px-4 py-1.5 text-xs text-gray-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 font-medium text-[11px] sm:text-xs">
            <span className="font-extrabold text-[#10847e] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              MEDICINES (30-45M RAPIDO)
            </span>
            <span className="text-gray-400">|</span>
            <span className="hover:text-[#10847e] cursor-pointer">AYURVEDIC OTC</span>
            <span className="text-gray-400 hidden md:inline">|</span>
            <span className="hover:text-[#10847e] cursor-pointer hidden md:inline">PRIMARY CARE</span>
            <span className="text-gray-400 hidden lg:inline">|</span>
            <span className="hover:text-[#10847e] cursor-pointer hidden lg:inline">COURIER DISPATCH</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium">
            <Link
              href="/admin"
              className="text-gray-500 hover:text-[#10847e] flex items-center gap-1 transition-colors"
              title="Merchant Admin Portal"
            >
              <Lock className="w-3 h-3" />
              <span>Merchant Hub</span>
            </Link>
            <span className="text-gray-300">•</span>
            <a
              href={`https://wa.me/${settings.merchantWhatsApp}?text=Hi%20AyurSwift,%20I%20need%20quick%20medicine%20assistance.`}
              target="_blank"
              rel="noreferrer"
              className="text-[#10847e] hover:underline flex items-center gap-1 font-bold"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Quick Help / Order on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Search & Action Bar (Tata 1mg & Truemeds Exact Combined Layout) */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-[#10847e] text-white flex items-center justify-center text-lg font-black shadow-xs group-hover:scale-105 transition-transform">
            🌿
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-xl tracking-tight text-gray-900 leading-none">
                Ayur<span className="text-[#10847e]">Swift</span>
              </span>
            </div>
            <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Genuine Ayurveda
            </p>
          </div>
        </Link>

        {/* Location Selector (Tata 1mg / Truemeds exact pill) */}
        <div className="hidden md:flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-2 rounded-xl text-xs text-gray-700 cursor-pointer shrink-0 transition-colors">
          <MapPin className="w-3.5 h-3.5 text-[#10847e] shrink-0" />
          <div className="leading-tight">
            <span className="font-bold text-gray-900 block text-[11px] truncate max-w-[130px]">
              Bhavnagar 364001
            </span>
            <span className="text-[9.5px] text-[#10847e] font-semibold">
              30–45m Rapido
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
        </div>

        {/* Big Search Bar with Truemeds / Tata 1mg Blue/Teal Search Button */}
        <div className="flex-1 max-w-2xl relative">
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden shadow-2xs focus-within:border-[#10847e] focus-within:ring-1 focus-within:ring-[#10847e] bg-white transition-all">
            <div className="pl-3.5 text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for Medicines, Ayurvedic remedies, or Brands (e.g. Zandu, Pudin Hara)..."
              className="w-full py-2 px-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
            />
            <button
              onClick={() => {}}
              className="bg-[#10847e] hover:bg-[#0c6b66] text-white text-xs font-bold px-4 py-2.5 transition-colors hidden sm:block shrink-0"
            >
              Search
            </button>
          </div>
        </div>

        {/* Quick Order (Tata 1mg Coral Tag) & Cart Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Tata 1mg Coral Quick Order Button */}
          <button
            onClick={onOpenCart}
            className="hidden lg:flex items-center gap-2 bg-[#FFF1ED] hover:bg-[#FFE3DC] border border-[#FFD0C5] text-[#E54B38] px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-[#E54B38]" />
            <div className="text-left leading-tight">
              <span className="text-[9.5px] uppercase tracking-wider block font-bold text-gray-500">QUICK BUY</span>
              <span className="font-extrabold text-[11px]">Quick Order</span>
            </div>
          </button>

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 ${
              cartCount > 0
                ? 'bg-[#10847e] hover:bg-[#0c6b66] text-white shadow-xs'
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
            <span className="hidden sm:inline">
              {cartCount > 0 ? `₹${cartTotal}` : 'Cart'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Category Subnav Strip (Tata 1mg / Truemeds sub-row) */}
      <div className="border-t border-gray-100 px-4 overflow-x-auto no-scrollbar bg-white">
        <div className="max-w-7xl mx-auto flex items-center gap-6 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
          <button
            onClick={() => onSelectCategory('ALL')}
            className={`pb-1 border-b-2 transition-all ${
              selectedCategory === 'ALL'
                ? 'border-[#10847e] text-[#10847e] font-bold'
                : 'border-transparent hover:text-[#10847e]'
            }`}
          >
            All Medicines
          </button>

          <button
            onClick={() => onSelectCategory('Joint & Muscle Pain')}
            className={`pb-1 border-b-2 transition-all flex items-center gap-1 ${
              selectedCategory === 'Joint & Muscle Pain'
                ? 'border-[#10847e] text-[#10847e] font-bold'
                : 'border-transparent hover:text-[#10847e]'
            }`}
          >
            <span>Joint & Muscle Pain</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          <button
            onClick={() => onSelectCategory('Digestion & Acidity')}
            className={`pb-1 border-b-2 transition-all flex items-center gap-1 ${
              selectedCategory === 'Digestion & Acidity'
                ? 'border-[#10847e] text-[#10847e] font-bold'
                : 'border-transparent hover:text-[#10847e]'
            }`}
          >
            <span>Digestion & Acidity</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          <button
            onClick={() => onSelectCategory('Immunity & Cold')}
            className={`pb-1 border-b-2 transition-all flex items-center gap-1 ${
              selectedCategory === 'Immunity & Cold'
                ? 'border-[#10847e] text-[#10847e] font-bold'
                : 'border-transparent hover:text-[#10847e]'
            }`}
          >
            <span>Immunity & Cold</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          <button
            onClick={() => onSelectCategory('Liver & Vital Organs')}
            className={`pb-1 border-b-2 transition-all flex items-center gap-1 ${
              selectedCategory === 'Liver & Vital Organs'
                ? 'border-[#10847e] text-[#10847e] font-bold'
                : 'border-transparent hover:text-[#10847e]'
            }`}
          >
            <span>Liver & Vital Organs</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          <button
            onClick={() => onSelectCategory('Daily Wellness')}
            className={`pb-1 border-b-2 transition-all flex items-center gap-1 ${
              selectedCategory === 'Daily Wellness'
                ? 'border-[#10847e] text-[#10847e] font-bold'
                : 'border-transparent hover:text-[#10847e]'
            }`}
          >
            <span>Daily Wellness</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
