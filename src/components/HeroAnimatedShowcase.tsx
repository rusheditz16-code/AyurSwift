'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Check, MessageCircle, ArrowRight } from 'lucide-react';
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
      <div className="flex items-center justify-between gap-2.5 bg-[#EAE1D0] border border-[#DDD1BC] rounded-xl px-3.5 py-2">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#5C5346] shrink-0">
          Shop by Brand
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {liveBrands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => onSelectBrand(brand)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#1B2A21] text-[#1F2421] hover:text-white border border-[#DCD1BC] hover:border-[#1B2A21] font-bold text-[11px] transition-colors active:scale-95 shrink-0 cursor-pointer"
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Single Clean Value Deal Spotlight (Editorial White Card, Zero Glassmorphism) */}
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
        className="bg-white border border-[#E2D8C6] rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer hover:border-[#C7B79D] transition-all shadow-[0_6px_20px_-8px_rgba(28,25,20,0.10)]"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#6B6256]">
            Value Spotlight • {currentDeal.category}
          </span>
          {discountPct > 0 && (
            <span className="text-[10.5px] font-extrabold bg-[#9A3412] text-[#FFFBF5] px-2.5 py-0.5 rounded-md tracking-wide tabular-nums shrink-0">
              SAVE {discountPct}%
            </span>
          )}
        </div>

        <div key={currentDeal.id} className="animate-deal-swap flex items-center gap-4">
          <div
            className={`relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl bg-[#F7F4EE] border border-[#EAE2D4] flex items-center justify-center shrink-0 overflow-hidden ${
              showCurrentPhoto ? 'p-0' : 'p-1.5'
            }`}
          >
            {showCurrentPhoto ? (
              <img
                src={currentDeal.imageUrl}
                alt={`${currentDeal.name} (${currentDeal.packSize})`}
                width={112}
                height={128}
                className="w-full h-full object-cover object-center"
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9A3412] truncate">
              {currentDeal.brand} • {currentDeal.packSize}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-[#181B18] line-clamp-2 leading-snug">
              {currentDeal.name}
            </div>
            <p className="text-[11px] text-[#5C574F] line-clamp-1 hidden sm:block">
              {currentDeal.indications}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-lg font-extrabold text-[#181B18]">
                  ₹{currentDeal.sellingPrice}
                </span>
                {currentDeal.mrp > currentDeal.sellingPrice && (
                  <span className="text-xs text-[#8A8277] line-through">
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
                    ? 'bg-[#0C831F] text-white'
                    : 'bg-[#1B2A21] text-white hover:bg-[#0C831F]'
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

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EFEAE0]">
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
                    ? 'w-5 bg-[#9A3412]'
                    : 'w-1.5 bg-[#D5CBB9] hover:bg-[#A69B89]'
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
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A463E] hover:text-[#181B18] transition-colors cursor-pointer"
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
