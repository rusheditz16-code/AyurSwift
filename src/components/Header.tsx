'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  MapPin,
  ChevronDown,
  Zap,
  Lock,
  PhoneCall,
  X,
  ArrowRight,
} from 'lucide-react';
import { MerchantSettings, Product } from '@/types';
import { LocationInfo } from '@/components/LocationModal';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  settings: MerchantSettings;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  currentLocation: LocationInfo;
  onOpenLocationModal: () => void;
  onOpenQuickBuyModal: () => void;
  products?: Product[];
  onSelectProduct?: (p: Product) => void;
}

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Medicines' },
  { id: 'Joint & Muscle Pain', label: 'Joint & Muscle Pain' },
  { id: 'Digestion & Acidity', label: 'Digestion & Acidity' },
  { id: 'Immunity & Cold', label: 'Immunity & Cold' },
  { id: 'Daily Wellness', label: 'Daily Wellness' },
  { id: 'Skin & Hair', label: 'Skin & Hair' },
];

export function Header({
  cartCount,
  cartTotal,
  onOpenCart,
  settings,
  searchQuery = '',
  onSearchChange = () => {},
  selectedCategory = 'ALL',
  onSelectCategory = () => {},
  currentLocation,
  onOpenLocationModal,
  onOpenQuickBuyModal,
  products = [],
  onSelectProduct = () => {},
}: HeaderProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchMatches = searchQuery.trim()
    ? products
        .filter((p) => p.isLive && p.stockQuantity > 0)
        .filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.indications.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      {/* 1. Top Utility Strip (Tata 1mg Style) */}
      <div className="bg-[#FAFBFB] border-b border-gray-200/80 px-4 py-1.5 text-xs text-gray-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6 font-medium text-[11px] sm:text-xs">
            <span className="font-extrabold text-[#10847e] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>BHAVNAGAR EXPRESS (30–45M RAPIDO)</span>
            </span>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span className="text-gray-600 hidden md:inline">100% Agency Billed Stock</span>
            <span className="text-gray-300 hidden md:inline">|</span>
            <span className="text-gray-600 hidden lg:inline">Direct Bank UPI (₹0 Cuts)</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-medium">
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
              <span>WhatsApp / Call Order</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Search & Action Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-[#10847e] text-white flex items-center justify-center text-lg font-black shadow-xs group-hover:scale-105 transition-transform">
            🌿
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-xl tracking-tight text-gray-900 leading-none">
                Ayur<span className="text-[#10847e]">Swift</span>
              </span>
              <span className="text-amber-500 text-xs font-bold">⚡</span>
            </div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Genuine Ayurveda
            </p>
          </div>
        </Link>

        {/* Clickable Location Selector Pill */}
        <button
          onClick={onOpenLocationModal}
          type="button"
          className="hidden md:flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl text-xs text-gray-700 cursor-pointer shrink-0 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-[#10847e]"
          aria-label="Change delivery location"
        >
          <MapPin className="w-3.5 h-3.5 text-[#10847e] shrink-0" />
          <div className="leading-tight">
            <span className="font-bold text-gray-900 block text-[11px] truncate max-w-[140px]">
              {currentLocation.area}
            </span>
            <span className="text-[9.5px] text-[#10847e] font-semibold truncate block max-w-[140px]">
              {currentLocation.estimate}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1 shrink-0" />
        </button>

        {/* Big Search Bar with Suggestions */}
        <div ref={searchContainerRef} className="flex-1 max-w-2xl relative">
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden shadow-2xs focus-within:border-[#10847e] focus-within:ring-1 focus-within:ring-[#10847e] bg-white transition-all">
            <div className="pl-3.5 text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search medicines, remedies, or brands (e.g. Zandu, Pudin Hara, Liv.52)..."
              className="w-full py-2 px-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
              aria-label="Search medicines"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1.5 text-gray-400 hover:text-gray-600 mr-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSuggestions(false)}
              className="bg-[#10847e] hover:bg-[#0c6b66] text-white text-xs font-bold px-4 py-2.5 transition-colors hidden sm:block shrink-0"
            >
              Search
            </button>
          </div>

          {/* Live Search Suggestions Dropdown */}
          {showSuggestions && searchMatches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden divide-y divide-gray-100">
              <div className="p-2 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Matching In-Stock Medicines
              </div>
              {searchMatches.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectProduct(item);
                    setShowSuggestions(false);
                  }}
                  className="p-2.5 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-gray-900">{item.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {item.brand} • {item.packSize} • {item.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-xs text-gray-900">
                      ₹{item.sellingPrice}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold ml-1.5">
                      {Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100)}% OFF
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Order & Cart Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Buy Button */}
          <button
            onClick={onOpenQuickBuyModal}
            className="hidden sm:flex items-center gap-1.5 bg-[#FFF1ED] hover:bg-[#FFE3DC] border border-[#FFD0C5] text-[#E54B38] px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 shadow-2xs"
            aria-label="Quick Buy & Fast Order"
          >
            <Zap className="w-3.5 h-3.5 fill-[#E54B38]" />
            <div className="text-left leading-tight">
              <span className="text-[9px] uppercase tracking-wider block font-bold text-gray-500">
                QUICK BUY
              </span>
              <span className="font-extrabold text-[11px]">Fast Order</span>
            </div>
          </button>

          {/* Cart Icon & Total */}
          <button
            onClick={onOpenCart}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-2xs ${
              cartCount > 0
                ? 'bg-[#10847e] hover:bg-[#0c6b66] text-white'
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
            <span>
              {cartCount > 0 ? `₹${cartTotal}` : 'Cart'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Category Subnav Strip (Separate row) */}
      <nav
        aria-label="Categories"
        className="border-t border-gray-100 px-4 overflow-x-auto no-scrollbar bg-white"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-5 sm:gap-6 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectCategory(tab.id)}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#10847e] text-[#10847e] font-extrabold'
                    : 'border-transparent hover:text-[#10847e]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
