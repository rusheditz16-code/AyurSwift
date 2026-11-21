'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Sparkles, Check, MessageCircle, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import { isVerifiedProductImageUrl } from '@/lib/initialData';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

interface HeroAnimatedShowcaseProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onSelectBrand: (brand: string) => void;
  onOpenQuickBuy?: () => void;
}

export function HeroAnimatedShowcase({
  products,
  onAddToCart,
  onSelectProduct,
  onSelectBrand,
  onOpenQuickBuy,
}: HeroAnimatedShowcaseProps) {
  const liveProducts = useMemo(
    () => products.filter((p) => p.isLive && p.stockQuantity > 0),
    [products]
  );

  // Cycle top verified-discount products from distinct categories
  const spotlightPool = useMemo(() => {
    const sorted = [...liveProducts].sort((a, b) => {
      const discA = a.mrp > 0 ? (a.mrp - a.sellingPrice) / a.mrp : 0;
      const discB = b.mrp > 0 ? (b.mrp - b.sellingPrice) / b.mrp : 0;
      return discB - discA;
    });
    const seen = new Set<string>();
    const diverse: Product[] = [];
    for (const p of sorted) {
      if (!seen.has(p.category)) {
        seen.add(p.category);
        diverse.push(p);
      }
      if (diverse.length >= 5) break;
    }
    return diverse.length > 0 ? diverse : sorted.slice(0, 5);
  }, [liveProducts]);

  const liveBrands = useMemo(
    () => Array.from(new Set(liveProducts.map((p) => p.brand))).slice(0, 6),
    [liveProducts]
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (spotlightPool.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setActiveIdx((prev) => (prev + 1) % spotlightPool.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [spotlightPool.length, isPaused]);

  if (spotlightPool.length === 0) return null;

  const currentDeal = spotlightPool[activeIdx % spotlightPool.length];
  const discountPct =
    currentDeal.mrp > currentDeal.sellingPrice
      ? Math.round(((currentDeal.mrp - currentDeal.sellingPrice) / currentDeal.mrp) * 100)
      : 0;
  const showCurrentPhoto = isVerifiedProductImageUrl(currentDeal.imageUrl);

  const handleQuickAdd = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    onAddToCart(prod);
    setJustAddedId(prod.id);
    setTimeout(() => setJustAddedId(null), 1100);
  };

  return (
    <div
      className="relative z-10 flex flex-col gap-3 w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* 1. Shop by Brand Pill Row */}
      <div className="flex items-center justify-between gap-2 bg-black/18 backdrop-blur-xs border border-white/15 rounded-2xl px-3.5 py-2">
        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-100 shrink-0 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
          <span>Shop by Brand</span>
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {liveBrands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => onSelectBrand(brand)}
              className="px-2.5 py-1 rounded-full bg-white/95 hover:bg-amber-300 text-[#0A5C16] font-extrabold text-[11px] shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Single Clean Value Deal Spotlight (Zero Duplicate Multi-Card Clutter) */}
      <div
        onClick={() => onSelectProduct(currentDeal)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectProduct(currentDeal);
          }
        }}
        aria-label={`Featured saving: ${currentDeal.name}, ₹${currentDeal.sellingPrice}`}
        className="bg-white/14 backdrop-blur-md border border-white/25 rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer hover:border-amber-300/80 transition-all shadow-lg"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-100">
            Featured Value Spotlight • {currentDeal.category}
          </span>
          {discountPct > 0 && (
            <span className="text-[10.5px] font-black bg-amber-300 text-slate-950 px-2 py-0.5 rounded-md tabular-nums shrink-0">
              SAVE {discountPct}%
            </span>
          )}
        </div>

        <div key={currentDeal.id} className="animate-deal-swap flex items-center gap-4">
          <div className="relative w-28 h-22 sm:w-32 sm:h-24 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
            {showCurrentPhoto ? (
              <img
                src={currentDeal.imageUrl}
                alt={`${currentDeal.name} (${currentDeal.packSize})`}
                width={128}
                height={96}
                className="w-full h-full object-contain"
              />
            ) : (
              <>
                <MedicinePackVisual product={currentDeal} className="w-full h-full" />
                <span className="absolute bottom-1 left-1 bg-white/90 text-[8.5px] font-bold text-gray-500 px-1.5 py-0.5 rounded">
                  Illustrative
                </span>
              </>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-200 truncate">
              {currentDeal.brand} • {currentDeal.packSize}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white line-clamp-2 leading-snug">
              {currentDeal.name}
            </div>
            <p className="text-[11px] text-emerald-100/90 line-clamp-1 hidden sm:block">
              {currentDeal.indications}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-lg font-black text-amber-300">
                  ₹{currentDeal.sellingPrice}
                </span>
                {currentDeal.mrp > currentDeal.sellingPrice && (
                  <span className="text-xs text-emerald-100/80 line-through">
                    MRP ₹{currentDeal.mrp}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => handleQuickAdd(e, currentDeal)}
                aria-label={`Add ${currentDeal.name} to cart`}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-sm flex items-center gap-1 transition-all cursor-pointer ${
                  justAddedId === currentDeal.id
                    ? 'bg-emerald-950 text-amber-300'
                    : 'bg-white text-[#0A5C16] hover:bg-amber-300 hover:text-slate-950'
                }`}
              >
                {justAddedId === currentDeal.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
                    <span>ADD</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/15">
          <div className="flex items-center gap-1.5">
            {spotlightPool.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(idx);
                }}
                aria-label={`Show spotlight ${idx + 1}: ${item.name}`}
                aria-current={idx === activeIdx % spotlightPool.length ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeIdx % spotlightPool.length
                    ? 'w-5 bg-amber-300'
                    : 'w-1.5 bg-white/35 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {onOpenQuickBuy && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenQuickBuy();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-100 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3 h-3" aria-hidden="true" />
              <span>Custom WhatsApp list</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
