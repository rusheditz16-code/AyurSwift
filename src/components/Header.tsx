'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  Zap,
  MapPin,
  ChevronDown,
  X,
  Tag,
  Sparkles,
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
  selectedBrand?: string;
  onSelectBrand?: (brand: string) => void;
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
  selectedBrand,
  onSelectBrand,
  currentLocation,
  onOpenLocationModal,
  onOpenQuickBuyModal,
  products,
  onSelectProduct,
}: HeaderProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerDesktopRef = useRef<HTMLDivElement>(null);
  const searchContainerMobileRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedDesktop = searchContainerDesktopRef.current?.contains(target);
      const clickedMobile = searchContainerMobileRef.current?.contains(target);
      if (!clickedDesktop && !clickedMobile) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-entity search matches: Products, Brands, and Categories
  const { matchedProducts, matchedCategories, matchedBrands } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { matchedProducts: [], matchedCategories: [], matchedBrands: [] };
    }

    // Matching products (in-stock only)
    const prods = products
      .filter((p) => p.isLive && p.stockQuantity > 0)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.indications.toLowerCase().includes(q)
      )
      .slice(0, 5);

    // Matching categories
    const categories = CATEGORY_TABS.filter(
      (c) => c.id !== 'ALL' && c.label.toLowerCase().includes(q)
    ).map((c) => c.id);

    // Matching brands
    const allBrands = Array.from(
      new Set(products.filter((p) => p.isLive && p.stockQuantity > 0).map((p) => p.brand))
    );
    const brands = allBrands.filter((b) => b.toLowerCase().includes(q));

    return {
      matchedProducts: prods,
      matchedCategories: categories,
      matchedBrands: brands,
    };
  }, [searchQuery, products]);

  const hasSuggestions =
    showSuggestions &&
    searchQuery.trim().length > 0 &&
    (matchedProducts.length > 0 || matchedCategories.length > 0 || matchedBrands.length > 0);

  return (
    <header className="sticky top-0 z-40 bg-[#f8f8f3] border-b border-[#d6ddce] shadow-2xs w-full">
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* 1. AyurSwift Brand Mark */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group py-0.5"
          aria-label="AyurSwift Home"
        >
          <img
            src="/ayurswift-logo.png"
            alt="AyurSwift - Tradition Meets Speed"
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102"
          />
        </Link>

        {/* 2. Compact Location Selector (Single clean selector) */}
        <button
          onClick={onOpenLocationModal}
          type="button"
          className="flex items-center gap-1.5 bg-[#e9efdf] hover:bg-[#dfe7d2] border border-[#d6ddce] px-2.5 py-1.5 rounded-xl text-xs text-[#143d29] cursor-pointer shrink transition-colors text-left focus:outline-none focus:ring-1 focus:ring-[#1d5a3e] max-w-[155px] sm:max-w-xs"
          aria-label="Set delivery location"
        >
          <MapPin className="w-3.5 h-3.5 text-[#1d5a3e] shrink-0" />
          <span className="font-semibold text-[11px] sm:text-xs text-[#143d29] truncate">
            {currentLocation.pincode ? `Deliver to ${currentLocation.pincode}` : 'Set location'}
          </span>
          <ChevronDown className="w-3 h-3 text-[#526359] shrink-0" />
        </button>

        {/* 3. Desktop Search Bar (Hidden on Mobile, Prominent on Desktop) */}
        <div ref={searchContainerDesktopRef} className="hidden md:flex flex-1 max-w-xl mx-2 relative">
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
              placeholder="Search remedies, brands (Zandu, Dabur) or health concerns..."
              className="w-full py-2 px-3 text-xs sm:text-sm text-[#143d29] placeholder:text-[#718277] focus:outline-none bg-transparent"
              aria-label="Search remedies or brands"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-1.5 text-[#718277] hover:text-[#143d29] mr-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Overlay (Desktop) */}
          {hasSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#d6ddce] shadow-xl z-50 overflow-hidden divide-y divide-[#e9efdf] animate-in fade-in duration-100">
              {/* Category Suggestions */}
              {matchedCategories.length > 0 && (
                <div className="p-2.5 bg-[#f8f8f3]">
                  <div className="text-[10px] font-bold text-[#526359] uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#1d5a3e]" />
                    <span>Matching Categories</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat);
                          setShowSuggestions(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#d6ddce] hover:border-[#1d5a3e] hover:bg-[#e9efdf] text-xs font-semibold text-[#143d29] transition-colors cursor-pointer"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Suggestions */}
              {matchedBrands.length > 0 && (
                <div className="p-2.5 bg-[#f8f8f3]">
                  <div className="text-[10px] font-bold text-[#526359] uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#c86326]" />
                    <span>Matching Brands</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedBrands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => {
                          if (onSelectBrand) onSelectBrand(brand);
                          setShowSuggestions(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#d6ddce] hover:border-[#1d5a3e] hover:bg-[#e9efdf] text-xs font-semibold text-[#143d29] transition-colors cursor-pointer"
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Matches */}
              {matchedProducts.length > 0 && (
                <div>
                  <div className="p-2 bg-[#e9efdf] text-[10px] font-bold text-[#143d29] uppercase tracking-wider px-3">
                    In-Stock Remedies
                  </div>
                  {matchedProducts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectProduct(item);
                        setShowSuggestions(false);
                      }}
                      className="p-2.5 px-3 hover:bg-[#f8f8f3] cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-[#143d29] truncate">{item.name}</div>
                        <div className="text-[10px] text-[#526359]">
                          {item.brand} • {item.packSize}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs text-[#143d29]">₹{item.sellingPrice}</span>
                        {item.mrp > item.sellingPrice && (
                          <span className="text-[10px] text-[#c86326] font-semibold ml-1.5">
                            {Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100)}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Action Buttons (Quick Buy & Basket) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            onClick={onOpenQuickBuyModal}
            className="hidden sm:flex items-center gap-1.5 bg-[#e9efdf] hover:bg-[#dfe7d2] border border-[#d6ddce] text-[#143d29] px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            aria-label="Quick Buy"
          >
            <Zap className="w-3.5 h-3.5 text-[#c86326] fill-[#c86326]" />
            <span>Quick Buy</span>
          </button>

          <button
            onClick={onOpenCart}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-95 cursor-pointer ${
              cartCount > 0
                ? 'bg-[#1d5a3e] hover:bg-[#143d29] text-white'
                : 'bg-white hover:bg-[#e9efdf] text-[#143d29] border border-[#d6ddce]'
            }`}
            aria-label={`View Shopping Basket (${cartCount} items)`}
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

      {/* Mobile Full-Width Search Field Directly Under Header */}
      <div ref={searchContainerMobileRef} className="md:hidden px-3 pb-2.5 pt-0.5 relative">
        <div className="flex items-center border border-[#d6ddce] rounded-xl overflow-hidden shadow-2xs focus-within:border-[#1d5a3e] focus-within:ring-1 focus-within:ring-[#1d5a3e] bg-white">
          <div className="pl-3 text-[#526359]">
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
            placeholder="Search remedies, brands or concerns..."
            className="w-full py-2 px-2.5 text-xs text-[#143d29] placeholder:text-[#718277] focus:outline-none bg-transparent"
            aria-label="Search remedies on mobile"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1.5 text-[#718277] hover:text-[#143d29] mr-1 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Suggestions Overlay (Mobile) */}
        {hasSuggestions && (
          <div className="absolute top-full left-3 right-3 mt-1.5 bg-white rounded-2xl border border-[#d6ddce] shadow-xl z-50 overflow-hidden divide-y divide-[#e9efdf] animate-in fade-in duration-100 max-h-80 overflow-y-auto">
            {/* Category Suggestions */}
            {matchedCategories.length > 0 && (
              <div className="p-2.5 bg-[#f8f8f3]">
                <div className="text-[10px] font-bold text-[#526359] uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#1d5a3e]" />
                  <span>Matching Categories</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchedCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat);
                        setShowSuggestions(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#d6ddce] text-xs font-semibold text-[#143d29] cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Suggestions */}
            {matchedBrands.length > 0 && (
              <div className="p-2.5 bg-[#f8f8f3]">
                <div className="text-[10px] font-bold text-[#526359] uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#c86326]" />
                  <span>Matching Brands</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchedBrands.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => {
                        if (onSelectBrand) onSelectBrand(brand);
                        setShowSuggestions(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#d6ddce] text-xs font-semibold text-[#143d29] cursor-pointer"
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product Matches */}
            {matchedProducts.length > 0 && (
              <div>
                <div className="p-2 bg-[#e9efdf] text-[10px] font-bold text-[#143d29] uppercase tracking-wider px-3">
                  In-Stock Remedies
                </div>
                {matchedProducts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectProduct(item);
                      setShowSuggestions(false);
                    }}
                    className="p-2.5 px-3 hover:bg-[#f8f8f3] cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-[#143d29] truncate">{item.name}</div>
                      <div className="text-[10px] text-[#526359]">
                        {item.brand} • {item.packSize}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-[#143d29]">₹{item.sellingPrice}</span>
                      {item.mrp > item.sellingPrice && (
                        <span className="text-[10px] text-[#c86326] font-semibold ml-1.5">
                          {Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100)}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Category Subnav (Hidden on mobile; on mobile categories are dedicated tiles below hero) */}
      <nav
        aria-label="Category Navigation"
        className="hidden md:block border-t border-[#d6ddce] px-4 overflow-x-auto no-scrollbar bg-[#f8f8f3] w-full"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 py-2 text-xs whitespace-nowrap">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-[#1d5a3e] text-white border-[#1d5a3e] shadow-2xs font-bold'
                    : 'bg-white text-[#143d29] border-[#d6ddce] hover:border-[#1d5a3e] hover:bg-[#e9efdf] font-medium'
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
