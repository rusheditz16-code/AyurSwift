'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Sparkles, Check } from 'lucide-react';
import { Product } from '@/types';
import { isVerifiedProductImageUrl } from '@/lib/initialData';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

interface HeroAnimatedShowcaseProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onSelectBrand: (brand: string) => void;
}

export function HeroAnimatedShowcase({
  products,
  onAddToCart,
  onSelectProduct,
  onSelectBrand,
}: HeroAnimatedShowcaseProps) {
  const liveProducts = useMemo(
    () => products.filter((p) => p.isLive && p.stockQuantity > 0),
    [products]
  );

  // Pick top verified-discount deals from distinct categories so the hero spotlight feels curated
  const spotlightPool = useMemo(() => {
    const sortedByDiscount = [...liveProducts].sort((a, b) => {
      const discA = a.mrp > 0 ? (a.mrp - a.sellingPrice) / a.mrp : 0;
      const discB = b.mrp > 0 ? (b.mrp - b.sellingPrice) / b.mrp : 0;
      return discB - discA;
    });
    return sortedByDiscount.slice(0, 5);
  }, [liveProducts]);

  // Distinct real brands present in the live catalog
  const liveBrands = useMemo(
    () => Array.from(new Set(liveProducts.map((p) => p.brand))).slice(0, 6),
    [liveProducts]
  );

  // 3 distinct featured picks shown alongside the active spotlight (never duplicating category tiles below)
  const quickPicks = useMemo(() => {
    const seenCat = new Set<string>();
    const picks: Product[] = [];
    for (const p of liveProducts) {
      if (!seenCat.has(p.category)) {
        seenCat.add(p.category);
        picks.push(p);
      }
      if (picks.length >= 3) break;
    }
    return picks;
  }, [liveProducts]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (spotlightPool.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setActiveIdx((prev) => (prev + 1) % spotlightPool.length);
    }, 3200);
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
      {/* 1. Real Brand Filter Bar */}
      <div className="flex items-center justify-between gap-2 bg-black/18 backdrop-blur-xs border border-white/15 rounded-2xl px-3 py-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100 shrink-0 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-300" aria-hidden="true" />
          <span>Shop by Brand</span>
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {liveBrands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => onSelectBrand(brand)}
              className="px-2.5 py-1 rounded-full bg-white/95 hover:bg-amber-300 text-[#0A5C16] font-extrabold text-[10.5px] shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Value Spotlight + Quick OTC Picks */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
        {/* Left: Featured Savings Spotlight */}
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
          aria-label={`Featured deal: ${currentDeal.name}, ₹${currentDeal.sellingPrice}`}
          className="sm:col-span-6 bg-white/14 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer hover:border-amber-300/80 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">
              Featured Value Deal
            </span>
            {discountPct > 0 && (
              <span className="text-[10px] font-black bg-amber-300 text-slate-950 px-2 py-0.5 rounded-md tabular-nums">
                SAVE {discountPct}%
              </span>
            )}
          </div>

          <div key={currentDeal.id} className="animate-deal-swap my-2 flex items-center gap-3">
            <div className="w-24 h-20 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              {showCurrentPhoto ? (
                <img
                  src={currentDeal.imageUrl}
                  alt={`${currentDeal.name} (${currentDeal.packSize})`}
                  width={96}
                  height={80}
                  className="w-full h-full object-contain"
                />
              ) : (
                <MedicinePackVisual product={currentDeal} className="w-full h-full" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-200 truncate">
                {currentDeal.brand} • {currentDeal.packSize}
              </div>
              <div className="text-xs sm:text-[13px] font-extrabold text-white line-clamp-2 leading-snug">
                {currentDeal.name}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-baseline gap-1.5 tabular-nums">
                  <span className="text-base font-black text-amber-300">
                    ₹{currentDeal.sellingPrice}
                  </span>
                  {currentDeal.mrp > currentDeal.sellingPrice && (
                    <span className="text-[11px] text-emerald-100/80 line-through">
                      ₹{currentDeal.mrp}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(e, currentDeal)}
                  aria-label={`Add ${currentDeal.name} to cart`}
                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[10.5px] shadow-sm flex items-center gap-1 transition-all cursor-pointer ${
                    justAddedId === currentDeal.id
                      ? 'bg-emerald-950 text-amber-300'
                      : 'bg-white text-[#0A5C16] hover:bg-amber-300 hover:text-slate-950'
                  }`}
                >
                  {justAddedId === currentDeal.id ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 stroke-[2.75]" />
                      <span>ADD</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            {spotlightPool.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(idx);
                }}
                aria-label={`Show deal ${idx + 1}: ${item.name}`}
                aria-current={idx === activeIdx % spotlightPool.length ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeIdx % spotlightPool.length
                    ? 'w-5 bg-amber-300'
                    : 'w-1.5 bg-white/35 hover:bg-white/65'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: 3 Quick-Add OTC Essentials */}
        <div className="sm:col-span-6 bg-black/15 border border-white/15 rounded-2xl p-3 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">
              In-Stock OTC Picks
            </span>
            <span className="text-[10px] font-bold text-amber-300">Ready to pack</span>
          </div>

          <div className="space-y-2">
            {quickPicks.map((item) => {
              const showPhoto = isVerifiedProductImageUrl(item.imageUrl);
              return (
                <div
                  key={item.id}
                  className="bg-white/95 hover:bg-white rounded-xl p-2 flex items-center justify-between gap-2.5 text-gray-900 shadow-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelectProduct(item)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer rounded-lg"
                  >
                    <div className="w-10 h-9 rounded-lg bg-[#F7FAF8] border border-gray-100 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                      {showPhoto ? (
                        <img
                          src={item.imageUrl}
                          alt={`${item.name} (${item.packSize})`}
                          width={40}
                          height={36}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <MedicinePackVisual product={item} compact className="w-full h-full" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-bold text-gray-950 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1 tabular-nums">
                        <span>{item.packSize}</span>
                        <span aria-hidden="true">•</span>
                        <strong className="text-[#0C831F]">₹{item.sellingPrice}</strong>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, item)}
                    aria-label={`Add ${item.name} to cart`}
                    className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] shrink-0 transition-colors cursor-pointer ${
                      justAddedId === item.id
                        ? 'bg-[#0C831F] text-white'
                        : 'bg-[#ECFDF3] text-[#0C831F] hover:bg-[#0C831F] hover:text-white border border-[#BBF7D0]'
                    }`}
                  >
                    {justAddedId === item.id ? 'Added' : '+ ADD'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
