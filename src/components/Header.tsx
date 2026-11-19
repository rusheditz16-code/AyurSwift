'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  Zap,
  MapPin,
  ChevronDown,
  X,
  PhoneCall,
} from 'lucide-react';
import { MerchantSettings, Product } from '@/types';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  settings: MerchantSettings;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  currentLocation: { area: string; pincode: string; estimate: string };
  onOpenLocationModal: () => void;
  onOpenQuickBuyModal: () => void;
  products: Product[];
  onSelectProduct: (p: Product) => void;
}

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Remedies' },
  { id: 'Joint & Muscle Pain', label: 'Joint & Muscle Pain' },
  { id: 'Digestion & Acidity', label: 'Digestion & Acidity' },
  { id: 'Immunity & Cold', label: 'Immunity & Cold' },
  { id: 'Skin & Hair', label: 'Skin & Hair' },
  { id: 'Daily Wellness', label: 'Daily Wellness' },
];

export function Header({
  cartCount,
  cartTotal,
  onOpenCart,
  settings,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  currentLocation,
  onOpenLocationModal,
  onOpenQuickBuyModal,
  products,
  onSelectProduct,
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
    <header className="sticky top-0 z-40 bg-[#f8f8f3] border-b border-[#d6ddce] shadow-2xs w-full overflow-hidden">
      {/* 1. Slim Announcement Line (Clear Customer Benefit) */}
      <div className="bg-[#e9efdf] border-b border-[#d6ddce] px-3 sm:px-4 py-1.5 text-xs text-[#143d29] overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-[11px] sm:text-xs truncate">
            <span className="font-bold text-[#1d5a3e] flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d5a3e]" />
              <span>Free local delivery on orders above ₹{settings.cityFreeDeliveryAbove || 499}</span>
            </span>
            <span className="text-[#a8b89e] hidden sm:inline">•</span>
            <span className="hidden sm:inline text-[#526359]">100% Genuine Ayurvedic Medicines</span>
          </div>

          <a
            href={`https://wa.me/${settings.merchantWhatsApp.replace(/\D/g, '')}?text=Hi%20AyurSwift,%20I%20need%20medicine%20assistance.`}
            target="_blank"
            rel="noreferrer"
            className="text-[#1d5a3e] hover:underline flex items-center gap-1 font-bold text-[11px] whitespace-nowrap shrink-0"
          >
            <PhoneCall className="w-3 h-3" />
            <span>Help: 9624766242</span>
          </a>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group py-0.5">
          <img
            src="/ayurswift-logo.png"
            alt="AyurSwift - Tradition Meets Speed"
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102"
          />
        </Link>

        {/* Simple Location Selector */}
        <button
          onClick={onOpenLocationModal}
          type="button"
          className="flex items-center gap-1.5 bg-[#e9efdf] hover:bg-[#dfe7d2] border border-[#d6ddce] px-2.5 py-1.5 rounded-xl text-xs text-[#143d29] cursor-pointer shrink transition-colors text-left focus:outline-none focus:ring-1 focus:ring-[#1d5a3e] max-w-[150px] sm:max-w-xs"
          aria-label="Set delivery location"
        >
          <MapPin className="w-3.5 h-3.5 text-[#1d5a3e] shrink-0" />
          <span className="font-bold text-[11px] sm:text-xs text-[#143d29] truncate">
            {currentLocation.pincode ? `Deliver to ${currentLocation.pincode}` : 'Set delivery location'}
          </span>
          <ChevronDown className="w-3 h-3 text-[#526359] shrink-0" />
        </button>

        {/* Desktop Search Bar */}
        <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xl mx-2 relative">
          <div className="w-full flex items-center border border-[#d6ddce] rounded-xl overflow-hidden shadow-2xs focus-within:border-[#1d5a3e] focus-within:ring-1 focus-within:ring-[#1d5a3e] bg-white transition-all">
            <div className="pl-3.5 text-[#526359]">
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
              placeholder="Search medicines or brands (e.g. Zandu, Pudin Hara, Liv.52)..."
              className="w-full py-2 px-3 text-xs sm:text-sm text-[#143d29] placeholder:text-[#718277] focus:outline-none bg-transparent"
              aria-label="Search medicines"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1.5 text-[#718277] hover:text-[#143d29] mr-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSuggestions(false)}
              className="bg-[#1d5a3e] hover:bg-[#143d29] text-white text-xs font-bold px-4 py-2.5 transition-colors shrink-0"
            >
              Search
            </button>
          </div>

          {/* Autocomplete suggestions */}
          {showSuggestions && searchMatches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#d6ddce] shadow-xl z-50 overflow-hidden divide-y divide-[#e9efdf]">
              <div className="p-2 bg-[#e9efdf] text-[10.5px] font-bold text-[#143d29] uppercase tracking-wider">
                Matching In-Stock Medicines
              </div>
              {searchMatches.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectProduct(item);
                    setShowSuggestions(false);
                  }}
                  className="p-2.5 hover:bg-[#f8f8f3] cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-[#143d29]">{item.name}</div>
                    <div className="text-[10px] text-[#526359]">
                      {item.brand} • {item.packSize}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-[#143d29]">
                      ₹{item.sellingPrice}
                    </span>
                    <span className="text-[10px] text-[#c86326] font-semibold ml-1.5">
                      {Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100)}% OFF
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons: Quick Buy & Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            onClick={onOpenQuickBuyModal}
            className="hidden sm:flex items-center gap-1.5 bg-[#e9efdf] hover:bg-[#dfe7d2] border border-[#d6ddce] text-[#143d29] px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
            aria-label="Quick Buy & Fast Order"
          >
            <Zap className="w-3.5 h-3.5 text-[#c86326] fill-[#c86326]" />
            <span>Quick Buy</span>
          </button>

          <button
            onClick={onOpenCart}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-95 ${
              cartCount > 0
                ? 'bg-[#1d5a3e] hover:bg-[#143d29] text-white'
                : 'bg-white hover:bg-[#e9efdf] text-[#143d29] border border-[#d6ddce]'
            }`}
            aria-label="View Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#c86326] text-white font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm">
              {cartCount > 0 ? `₹${cartTotal}` : 'Basket'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Mobile Full-Width Search Row (Mobile-first requirement) */}
      <div className="md:hidden px-3 sm:px-4 pb-2.5 pt-0.5">
        <div className="relative">
          <div className="flex items-center border border-[#d6ddce] rounded-xl overflow-hidden shadow-2xs focus-within:border-[#1d5a3e] focus-within:ring-1 focus-within:ring-[#1d5a3e] bg-white">
            <div className="pl-3 text-[#526359]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search medicines, pain oil, digestion..."
              className="w-full py-2 px-2.5 text-xs text-[#143d29] placeholder:text-[#718277] focus:outline-none bg-transparent"
              aria-label="Search medicines on mobile"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1.5 text-[#718277] hover:text-[#143d29] mr-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Desktop Category Subnav Row (Hidden on mobile where categories appear as hero tiles) */}
      <nav
        aria-label="Category Navigation"
        className="hidden md:block border-t border-[#d6ddce] px-3 sm:px-4 overflow-x-auto no-scrollbar bg-[#f8f8f3] w-full"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 py-2 text-xs font-semibold whitespace-nowrap">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-medium ${
                  isSelected
                    ? 'bg-[#1d5a3e] text-white border-[#1d5a3e] shadow-2xs font-bold'
                    : 'bg-white text-[#143d29] border-[#d6ddce] hover:border-[#1d5a3e] hover:bg-[#e9efdf]'
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
