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
  MapPin,
} from 'lucide-react';
import { CartItem, DeliveryType, MerchantSettings, Product } from '@/types';
import { DELIVERY_PROMISE, isVerifiedProductImageUrl } from '@/lib/initialData';
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
  availableCategories?: string[];
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
  'Search "Mahanarayan Tel"',
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

export function Header({
  cart,
  cartCount,
  cartTotal,
  onOpenCart,
  onAddToCart,
  onUpdateQuantity,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onSelectBrand,
  availableCategories = [],
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

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

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

  const navCategories = useMemo(() => {
    if (availableCategories.length > 0) return availableCategories;
    const inStock = products.filter((p) => p.isLive && p.stockQuantity > 0);
    return Array.from(new Set(inStock.map((p) => p.category)));
  }, [availableCategories, products]);

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

    const categories = navCategories.filter((c) => c.toLowerCase().includes(q));
    const brands = Array.from(new Set(inStock.map((p) => p.brand))).filter((b) =>
      b.toLowerCase().includes(q)
    );

    return { matchedProducts: prods, matchedCategories: categories, matchedBrands: brands };
  }, [searchQuery, products, navCategories]);

  const isTyping = searchQuery.trim().length > 0;
  const hasMatches =
    matchedProducts.length > 0 || matchedCategories.length > 0 || matchedBrands.length > 0;

  const renderSuggestionsDropdown = () => {
    if (!showSuggestions) return null;

    return (
      <div
        role="region"
        aria-label="Search suggestions"
        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-900/12 z-50 overflow-hidden animate-modal-pop max-h-[70vh] overflow-y-auto thin-scrollbar"
      >
        {!isTyping ? (
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-[#0C831F]" />
              <span>Popular Searches</span>
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
          <div className="p-6 text-center space-y-2">
            <p className="text-sm font-bold text-gray-900">
              No in-stock matches for &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="text-xs text-gray-500">
              Try searching by concern like &ldquo;pain&rdquo; or &ldquo;acidity&rdquo;, or send a custom request via Quick Buy.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSuggestions(false);
                onOpenQuickBuyModal();
              }}
              className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ECFDF3] text-[#0C831F] font-bold text-xs hover:bg-[#DCFCE7] cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-teal-600 hover:text-teal-800 text-xs font-semibold text-gray-800 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>{brand}</span>
                  </button>
                ))}
              </div>
            )}

            {matchedProducts.length > 0 && (
              <div>
                <div className="px-3.5 py-2 bg-gray-50/50 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>In-Stock Remedies</span>
                  <span className="text-[#0C831F]">Quick Add</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {matchedProducts.map((item) => {
                    const qty = cart.find((c) => c.product.id === item.id)?.quantity ?? 0;
                    const discount =
                      item.mrp > item.sellingPrice
                        ? Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100)
                        : 0;
                    const showPhoto = isVerifiedProductImageUrl(item.imageUrl);

                    return (
                      <div
                        key={item.id}
                        className="px-3.5 py-2.5 hover:bg-gray-50/90 flex items-center justify-between gap-3 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProduct(item);
                            setShowSuggestions(false);
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer rounded-lg"
                        >
                          <div className="w-11 h-11 rounded-xl bg-[#F7FAF8] border border-gray-200/80 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            {showPhoto ? (
                              <img
                                src={item.imageUrl}
                                alt={`${item.name} (${item.packSize})`}
                                width={44}
                                height={44}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <MedicinePackVisual product={item} compact className="w-full h-full" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-[13px] font-bold text-gray-900 truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span>{item.packSize}</span>
                              <span aria-hidden="true">•</span>
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
                        </button>

                        <div className="shrink-0">
                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => onAddToCart(item)}
                              aria-label={`Add ${item.name} to cart`}
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
                                aria-label={`Decrease quantity for ${item.name}`}
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
                                aria-label={`Increase quantity for ${item.name}`}
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
      {/* Row 1: Compact Utility Bar (Brand, Location, Search, Quick Buy, Orders, Cart) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 h-15 sm:h-[68px] flex items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <Link
            href="/"
            className="flex items-center shrink-0 group py-0.5 rounded-lg"
            aria-label="AyurSwift Home"
          >
            <img
              src="/ayurswift-logo.png"
              alt="AyurSwift — Tradition Meets Speed"
              width={136}
              height={34}
              className="h-8 sm:h-8.5 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>

          <div className="hidden sm:block h-7 w-px bg-gray-200 shrink-0" />

          <button
            type="button"
            onClick={onOpenLocationModal}
            className="text-left group cursor-pointer rounded-xl px-2 py-1 -mx-1 hover:bg-gray-100/80 transition-colors min-w-0 max-w-[175px] sm:max-w-[235px]"
            aria-label={`Change delivery location. Currently ${currentLocation.area}, estimated ${isLocalExpress ? DELIVERY_PROMISE.localTimeShort : DELIVERY_PROMISE.courierTimeShort}`}
          >
            <div className="flex items-center gap-1 text-[12.5px] sm:text-[13.5px] font-extrabold text-gray-900 tracking-tight leading-tight">
              {isLocalExpress ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="truncate">{DELIVERY_PROMISE.localTimeShort}</span>
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5 text-[#0C831F] shrink-0" />
                  <span className="truncate">Courier {DELIVERY_PROMISE.courierTimeShort}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-600 font-medium mt-0.5">
              <MapPin className="w-3 h-3 text-[#0C831F] shrink-0 hidden sm:inline" />
              <span className="truncate">
                {currentLocation.area}
                {currentLocation.pincode && currentLocation.pincode !== 'Other'
                  ? ` • ${currentLocation.pincode}`
                  : ''}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-700 shrink-0" />
            </div>
          </button>
        </div>

        {/* Center: Desktop Live Search */}
        <div
          ref={searchContainerDesktopRef}
          className="hidden md:flex flex-1 max-w-xl mx-2 relative"
        >
          <label htmlFor="desktop-catalog-search" className="sr-only">
            Search Ayurvedic medicines, brands, or health concerns
          </label>
          <div className="w-full relative flex items-center bg-[#F3F4F6] hover:bg-[#ECEFF3] focus-within:bg-white border border-gray-200/80 focus-within:border-[#0C831F] focus-within:ring-4 focus-within:ring-[#0C831F]/10 rounded-xl transition-all">
            <Search className="w-4 h-4 text-gray-500 ml-3.5 shrink-0" aria-hidden="true" />
            <div className="relative flex-1">
              <input
                id="desktop-catalog-search"
                type="search"
                aria-label="Search Ayurvedic medicines, brands, or health concerns"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full py-2.5 px-3 text-sm text-gray-900 bg-transparent focus:outline-none relative z-10"
                autoComplete="off"
              />
              {!searchQuery && (
                <span
                  key={placeholderIdx}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-3 right-3 flex items-center text-sm text-gray-500 animate-placeholder select-none overflow-hidden whitespace-nowrap text-ellipsis"
                >
                  <span className="truncate">{ROTATING_PLACEHOLDERS[placeholderIdx]}</span>
                </span>
              )}
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-2 text-gray-500 hover:text-gray-800 cursor-pointer rounded-lg"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {renderSuggestionsDropdown()}
        </div>

        {/* Right: Quick Buy, Orders, Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenQuickBuyModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#0C831F] fill-[#0C831F]/20" />
            <span>Quick Buy</span>
          </button>

          <button
            type="button"
            onClick={onOpenAccountModal}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-700 hover:text-gray-950 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
            aria-label="Track orders and account"
          >
            <User className="w-4 h-4 text-gray-600" />
            <span>Orders</span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
              cartCount > 0
                ? 'bg-[#0C831F] hover:bg-[#096B19] text-white shadow-md shadow-[#0C831F]/25'
                : 'bg-gray-100 hover:bg-gray-200/80 text-gray-800 border border-gray-200/80'
            }`}
            aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}, subtotal ₹${cartTotal}`}
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
              <span>Cart</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Strip */}
      <div ref={searchContainerMobileRef} className="md:hidden px-3 pb-2.5 relative">
        <label htmlFor="mobile-catalog-search" className="sr-only">
          Search medicines
        </label>
        <div className="w-full relative flex items-center bg-[#F3F4F6] focus-within:bg-white border border-gray-200/90 focus-within:border-[#0C831F] focus-within:ring-2 focus-within:ring-[#0C831F]/15 rounded-xl transition-all">
          <Search className="w-4 h-4 text-gray-500 ml-3 shrink-0" aria-hidden="true" />
          <div className="relative flex-1">
            <input
              id="mobile-catalog-search"
              type="search"
              aria-label="Search Ayurvedic medicines"
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              className="w-full py-2.5 px-2.5 text-xs text-gray-900 bg-transparent focus:outline-none relative z-10"
              autoComplete="off"
            />
            {!searchQuery && (
              <span
                key={placeholderIdx}
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-2.5 right-2.5 flex items-center text-xs text-gray-500 animate-placeholder select-none overflow-hidden whitespace-nowrap"
              >
                <span className="truncate">{ROTATING_PLACEHOLDERS[placeholderIdx]}</span>
              </span>
            )}
          </div>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-2 text-gray-500 hover:text-gray-800 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenQuickBuyModal}
              className="mr-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-[10.5px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-[#0C831F]" />
              <span>Quick Buy</span>
            </button>
          )}
        </div>
        {renderSuggestionsDropdown()}
      </div>

      {/* Row 2: Clearly Separated Category Navigation Bar */}
      <nav
        aria-label="Medicine Categories"
        className="border-t border-gray-100 bg-[#F8FAF9]/95"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5 h-10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectCategory('ALL')}
            aria-current={selectedCategory === 'ALL' ? 'page' : undefined}
            className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-[#0C831F] text-white shadow-2xs'
                : 'text-gray-700 hover:bg-emerald-50 hover:text-[#0C831F]'
            }`}
          >
            All Remedies
          </button>
          {navCategories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  active
                    ? 'bg-[#0C831F] text-white shadow-2xs'
                    : 'text-gray-700 hover:bg-emerald-50 hover:text-[#0C831F]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
