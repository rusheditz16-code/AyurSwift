'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  Zap,
  ChevronDown,
  X,
  Tag,
  Sparkles,
  User,
  Plus,
  Minus,
  Truck,
  TrendingUp,
} from 'lucide-react';
import { CartItem, DeliveryType, MerchantSettings, Product } from '@/types';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

interface HeaderProps {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  settings: MerchantSettings;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedBrand?: string;
  onSelectBrand?: (brand: string) => void;
  currentLocation: {
    area: string;
    pincode: string;
    estimate: string;
    dispatchType?: DeliveryType;
  };
  onOpenLocationModal: () => void;
  onOpenQuickBuyModal: () => void;
  onOpenAccountModal: () => void;
  products: Product[];
  onSelectProduct: (p: Product) => void;
}

const ROTATING_PLACEHOLDERS = [
  'Search "Zandu Balm"',
  'Search "Pudin Hara"',
  'Search "Joint pain oil"',
  'Search "Chyawanprash"',
  'Search "Liv.52 Tablets"',
  'Search "Digestion & Acidity"',
];

const TRENDING_SEARCHES = [
  'Zandu Balm',
  'Pudin Hara',
  'Mahanarayan Tel',
  'Chyawanprash',
  'Liv.52',
  'Isabgol',
];

const ALL_CATEGORIES = [
  'Joint & Muscle Pain',
  'Digestion & Acidity',
  'Immunity & Cold',
  'Skin & Hair',
  'Daily Wellness',
  'Liver & Detox',
];

export function Header({
  cart,
  cartCount,
  cartTotal,
  onOpenCart,
  onAddToCart,
  onUpdateQuantity,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  onSelectBrand,
  currentLocation,
  onOpenLocationModal,
  onOpenQuickBuyModal,
  onOpenAccountModal,
  products,
  onSelectProduct,
}: HeaderProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const searchContainerDesktopRef = useRef<HTMLDivElement>(null);
  const searchContainerMobileRef = useRef<HTMLDivElement>(null);

  const isLocalExpress = currentLocation.dispatchType !== 'COURIER_OUTSIDE';

  // Cycle rotating search placeholder every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Close suggestions on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedDesktop = searchContainerDesktopRef.current?.contains(target);
      const clickedMobile = searchContainerMobileRef.current?.contains(target);
      if (!clickedDesktop && !clickedMobile) {
        setShowSuggestions(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowSuggestions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const { matchedProducts, matchedCategories, matchedBrands } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { matchedProducts: [], matchedCategories: [], matchedBrands: [] };
    }

    const inStock = products.filter((p) => p.isLive && p.stockQuantity > 0);
    const prods = inStock
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.indications.toLowerCase().includes(q) ||
          (p.composition && p.composition.toLowerCase().includes(q))
      )
      .slice(0, 6);

    const categories = ALL_CATEGORIES.filter((c) => c.toLowerCase().includes(q));
    const brands = Array.from(new Set(inStock.map((p) => p.brand))).filter((b) =>
      b.toLowerCase().includes(q)
    );

    return { matchedProducts: prods, matchedCategories: categories, matchedBrands: brands };
  }, [searchQuery, products]);

  const showDropdown = showSuggestions;
  const isTyping = searchQuery.trim().length > 0;
  const hasMatches =
    matchedProducts.length > 0 || matchedCategories.length > 0 || matchedBrands.length > 0;

  const renderSuggestionsDropdown = () => {
    if (!showDropdown) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-900/12 z-50 overflow-hidden animate-modal-pop max-h-[75vh] overflow-y-auto thin-scrollbar">
        {!isTyping ? (
          <div className="p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-[#0C831F]" />
              <span>Trending Searches</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_SEARCHES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    onSearchChange(tag);
                    setShowSuggestions(false);
                  }}
                  className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-[#ECFDF3] hover:text-[#0C831F] border border-transparent hover:border-[#BBF7D0] text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : !hasMatches ? (
          <div className="p-6 text-center space-y-1.5">
            <p className="text-sm font-bold text-gray-900">
              No in-stock matches for &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-xs text-gray-500">
              Try searching by concern like &ldquo;pain&rdquo;, &ldquo;acidity&rdquo;, or send a custom request via Quick Buy.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSuggestions(false);
                onOpenQuickBuyModal();
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ECFDF3] text-[#0C831F] font-bold text-xs hover:bg-[#DCFCE7] cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Request via Quick Buy</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(matchedCategories.length > 0 || matchedBrands.length > 0) && (
              <div className="p-3 bg-gray-50/70 flex flex-wrap gap-2">
                {matchedCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat);
                      setShowSuggestions(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#0C831F] hover:text-[#0C831F] text-xs font-semibold text-gray-800 transition-colors cursor-pointer"
                  >
                    <Tag className="w-3 h-3 text-[#0C831F]" />
                    <span>{cat}</span>
                  </button>
                ))}
                {matchedBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => {
                      if (onSelectBrand) onSelectBrand(brand);
                      setShowSuggestions(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-amber-500 hover:text-amber-700 text-xs font-semibold text-gray-800 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{brand}</span>
                  </button>
                ))}
              </div>
            )}

            {matchedProducts.length > 0 && (
              <div>
                <div className="px-3.5 py-2 bg-gray-50/50 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>In-Stock Remedies</span>
                  <span className="text-[#0C831F]">⚡ Instant Add</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {matchedProducts.map((item) => {
                    const qty = cart.find((c) => c.product.id === item.id)?.quantity ?? 0;
                    const discount = Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100);
                    return (
                      <div
                        key={item.id}
                        className="px-3.5 py-2.5 hover:bg-gray-50/90 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div
                          onClick={() => {
                            onSelectProduct(item);
                            setShowSuggestions(false);
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200/80 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <MedicinePackVisual product={item} className="w-full h-full" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-[13px] font-bold text-gray-900 truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <span>{item.packSize}</span>
                              <span>•</span>
                              <span className="font-bold text-gray-900 tabular-nums">
                                ₹{item.sellingPrice}
                              </span>
                              {item.mrp > item.sellingPrice && (
                                <span className="text-[10px] text-gray-400 line-through tabular-nums">
                                  ₹{item.mrp}
                                </span>
                              )}
                              {discount > 0 && (
                                <span className="text-[10px] font-bold text-[#0C831F] bg-[#ECFDF3] px-1.5 py-0.5 rounded">
                                  {discount}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Direct inline ADD / Stepper */}
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => onAddToCart(item)}
                              className="px-3.5 py-1.5 rounded-lg border border-[#0C831F] bg-[#F2FBF4] hover:bg-[#0C831F] text-[#0C831F] hover:text-white font-extrabold text-[11px] tracking-wide transition-all active:scale-95 cursor-pointer"
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="flex items-center bg-[#0C831F] text-white rounded-lg overflow-hidden shadow-xs">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, qty - 1)}
                                className="px-2 py-1.5 hover:bg-[#096B19] transition-colors cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-extrabold tabular-nums">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, qty + 1)}
                                disabled={qty >= item.stockQuantity}
                                className="px-2 py-1.5 hover:bg-[#096B19] disabled:opacity-40 transition-colors cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/90 shadow-[0_1px_12px_rgba(15,23,42,0.04)] w-full">
      {/* Main Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 h-16 sm:h-[72px] flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Logo + Blinkit-style Delivery ETA & Location */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="flex items-center shrink-0 group py-0.5"
            aria-label="AyurSwift Home"
          >
            <img
              src="/ayurswift-logo.png"
              alt="AyurSwift - Tradition Meets Speed"
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </Link>

          <div className="hidden sm:block h-8 w-px bg-gray-200 shrink-0" />

          {/* Two-line Blinkit ETA + Location Selector */}
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="text-left group cursor-pointer rounded-xl px-2 py-1 -mx-1 hover:bg-gray-100/80 transition-colors min-w-0 max-w-[175px] sm:max-w-[235px]"
            aria-label="Change delivery location"
          >
            <div className="flex items-center gap-1 text-[13px] sm:text-[15px] font-extrabold text-gray-900 tracking-tight leading-tight">
              {isLocalExpress ? (
                <>
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="truncate">Delivery in 30 mins</span>
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0C831F] shrink-0" />
                  <span className="truncate">Courier in 2–4 days</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5">
              <span className="truncate">
                {currentLocation.area}
                {currentLocation.pincode && currentLocation.pincode !== 'Other'
                  ? ` • ${currentLocation.pincode}`
                  : ''}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 shrink-0 transition-transform group-hover:translate-y-0.5" />
            </div>
          </button>
        </div>

        {/* Center: Desktop Animated Live Search */}
        <div
          ref={searchContainerDesktopRef}
          className="hidden md:flex flex-1 max-w-xl mx-2 relative"
        >
          <div className="w-full relative flex items-center bg-[#F3F4F6] hover:bg-[#ECEFF3] focus-within:bg-white border border-transparent focus-within:border-[#0C831F] focus-within:ring-4 focus-within:ring-[#0C831F]/10 rounded-xl transition-all">
            <Search className="w-4 h-4 text-gray-500 ml-3.5 shrink-0" />
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full py-2.5 px-3 text-sm text-gray-900 bg-transparent focus:outline-none relative z-10"
                aria-label="Search remedies, brands, or health concerns"
              />
              {!searchQuery && (
                <span
                  key={placeholderIdx}
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-500 animate-placeholder select-none"
                >
                  {ROTATING_PLACEHOLDERS[placeholderIdx]}
                </span>
              )}
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-2 text-gray-400 hover:text-gray-700 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {renderSuggestionsDropdown()}
        </div>

        {/* Right: Quick Buy, Account/Orders, Cart CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenQuickBuyModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>Quick Buy</span>
          </button>

          <button
            type="button"
            onClick={onOpenAccountModal}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-700 hover:text-gray-950 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
            aria-label="Track orders & account"
          >
            <User className="w-4 h-4 text-gray-600" />
            <span>Orders</span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
              cartCount > 0
                ? 'bg-[#0C831F] hover:bg-[#096B19] text-white shadow-md shadow-[#0C831F]/25'
                : 'bg-gray-100 hover:bg-gray-200/80 text-gray-800 border border-gray-200/70'
            }`}
            aria-label={`View cart (${cartCount} items)`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            {cartCount > 0 ? (
              <div
                key={cartCount}
                className="flex flex-col items-start leading-none animate-badge-pop text-left"
              >
                <span className="text-[10px] font-semibold text-emerald-100 tabular-nums">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
                <span className="text-xs sm:text-sm font-extrabold tabular-nums mt-0.5">
                  ₹{cartTotal}
                </span>
              </div>
            ) : (
              <span>My Cart</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Strip */}
      <div
        ref={searchContainerMobileRef}
        className="md:hidden px-3 pb-2.5 relative"
      >
        <div className="w-full relative flex items-center bg-[#F3F4F6] focus-within:bg-white border border-gray-200/80 focus-within:border-[#0C831F] focus-within:ring-2 focus-within:ring-[#0C831F]/15 rounded-xl transition-all">
          <Search className="w-4 h-4 text-gray-500 ml-3 shrink-0" />
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              className="w-full py-2 px-2.5 text-xs text-gray-900 bg-transparent focus:outline-none relative z-10"
              aria-label="Search medicines"
            />
            {!searchQuery && (
              <span
                key={placeholderIdx}
                className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-gray-500 animate-placeholder select-none"
              >
                {ROTATING_PLACEHOLDERS[placeholderIdx]}
              </span>
            )}
          </div>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-2 text-gray-400 hover:text-gray-700 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenQuickBuyModal}
              className="mr-1.5 px-2 py-1 rounded-lg bg-amber-100/80 text-amber-900 text-[10px] font-extrabold flex items-center gap-0.5 shrink-0 cursor-pointer"
            >
              <Zap className="w-3 h-3 fill-amber-500 text-amber-600" />
              <span>Quick</span>
            </button>
          )}
        </div>
        {renderSuggestionsDropdown()}
      </div>
    </header>
  );
}
