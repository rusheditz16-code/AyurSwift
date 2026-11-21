'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Check } from 'lucide-react';
import { Product } from '@/types';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

interface HeroAnimatedShowcaseProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (category: string) => void;
  onSelectBrand: (brand: string) => void;
}

const POWERED_BRANDS = ['Dabur', 'Zandu', 'Himalaya', 'Baidyanath'];

interface MarqueeTile {
  id: string;
  badge: string;
  title: string;
  category: string;
  accentBg: string;
  badgeBg: string;
  fallbackBrand: string;
}

const MARQUEE_TILES: MarqueeTile[] = [
  {
    id: 'tile-immunity',
    badge: 'Up to 15% OFF',
    title: 'Chyawanprash & Immunity',
    category: 'Immunity & Cold',
    accentBg: 'from-[#ECFDF3] via-white to-[#DCFCE7]',
    badgeBg: 'bg-[#0C831F] text-white',
    fallbackBrand: 'Dabur',
  },
  {
    id: 'tile-pain',
    badge: 'Fast Relief',
    title: 'Balms & Joint Care',
    category: 'Joint & Muscle Pain',
    accentBg: 'from-[#FEF3C7] via-white to-[#FDE68A]/50',
    badgeBg: 'bg-amber-500 text-slate-950',
    fallbackBrand: 'Zandu',
  },
  {
    id: 'tile-digestion',
    badge: 'Top Seller',
    title: 'Digestion & Liver Care',
    category: 'Digestion & Acidity',
    accentBg: 'from-[#E0F2FE] via-white to-[#BAE6FD]/50',
    badgeBg: 'bg-sky-700 text-white',
    fallbackBrand: 'Himalaya',
  },
  {
    id: 'tile-wellness',
    badge: '100% Pure',
    title: 'Daily Herbs & Vitality',
    category: 'Daily Wellness',
    accentBg: 'from-[#F3E8FF] via-white to-[#E9D5FF]/50',
    badgeBg: 'bg-emerald-800 text-white',
    fallbackBrand: 'Baidyanath',
  },
  {
    id: 'tile-skin',
    badge: 'Herbal Care',
    title: 'Skin & Hair Ayurveda',
    category: 'Skin & Hair',
    accentBg: 'from-[#FCE7F3] via-white to-[#FBCFE8]/45',
    badgeBg: 'bg-teal-800 text-white',
    fallbackBrand: 'Himalaya',
  },
];

export function HeroAnimatedShowcase({
  products,
  onAddToCart,
  onSelectProduct,
  onSelectCategory,
  onSelectBrand,
}: HeroAnimatedShowcaseProps) {
  const liveProducts = products.filter((p) => p.isLive && p.stockQuantity > 0);
  const spotlightPool = liveProducts.slice(0, 6);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Blinkit-style 2.2s auto-cycling spotlight deal card (pauses on hover or hidden tab)
  useEffect(() => {
    if (spotlightPool.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setActiveIdx((prev) => (prev + 1) % spotlightPool.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [spotlightPool.length, isPaused]);

  if (spotlightPool.length === 0) return null;

  const currentDeal = spotlightPool[activeIdx % spotlightPool.length];
  const discountPct =
    currentDeal.mrp > currentDeal.sellingPrice
      ? Math.round(((currentDeal.mrp - currentDeal.sellingPrice) / currentDeal.mrp) * 100)
      : 0;

  // Duplicate marquee tiles once for a seamless infinite 0 -> -50% CSS translation loop
  const loopedTiles = [...MARQUEE_TILES, ...MARQUEE_TILES];

  const handleQuickAdd = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    onAddToCart(prod);
    setJustAddedId(prod.id);
    setTimeout(() => setJustAddedId(null), 1100);
  };

  return (
    <div
      className="relative z-10 flex flex-col gap-2.5 w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Blinkit/JioMart "POWERED BY" Brand Pill Bar */}
      <div className="flex items-center justify-between gap-2 bg-black/15 backdrop-blur-xs border border-white/15 rounded-2xl px-3 py-1.5">
        <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-emerald-100/90 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Powered By</span>
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {POWERED_BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => onSelectBrand(brand)}
              className="px-2.5 py-0.5 rounded-full bg-white/95 hover:bg-amber-300 text-[#0A5C16] font-extrabold text-[10px] shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Split: Blinkit Auto-Morphing Deal Spotlight + JioMart Gliding Arched Cards */}
      <div className="grid grid-cols-12 gap-2.5 items-stretch">
        {/* LEFT (5 cols): Blinkit "Winter Deals" Style Auto-Cycling Price & Pack Spotlight */}
        <div
          onClick={() => onSelectProduct(currentDeal)}
          className="col-span-5 bg-gradient-to-b from-white/22 via-white/14 to-black/20 backdrop-blur-md border border-white/30 rounded-t-[26px] rounded-b-2xl p-2.5 sm:p-3 flex flex-col justify-between text-center cursor-pointer hover:border-amber-300/80 transition-all shadow-lg relative overflow-hidden group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-100">
              Flash Deal
            </span>
            {discountPct > 0 && (
              <span className="text-[9px] font-black bg-emerald-950/60 text-amber-300 px-1.5 py-0.5 rounded-md border border-amber-300/30">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Animated Swap Container keyed by product id */}
          <div key={currentDeal.id} className="animate-deal-swap my-1 space-y-1.5">
            {/* Blinkit Strikethrough MRP + Yellow Price Pill */}
            <div className="flex flex-col items-center">
              {currentDeal.mrp > currentDeal.sellingPrice && (
                <span className="text-[10px] text-emerald-100/80 line-through font-bold tabular-nums leading-none">
                  ₹{currentDeal.mrp}
                </span>
              )}
              <div className="mt-0.5 inline-block bg-amber-300 text-slate-950 font-black text-sm sm:text-base px-2.5 py-0.5 rounded-lg shadow-sm tabular-nums leading-tight">
                ₹{currentDeal.sellingPrice}
              </div>
            </div>

            <div className="text-[11px] font-extrabold text-white line-clamp-1 px-0.5">
              {currentDeal.name}
            </div>

            {/* Floating Product Packshot */}
            <div className="relative mx-auto w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white/95 p-1.5 shadow-md flex items-center justify-center animate-gentle-float">
              {currentDeal.imageUrl ? (
                <img
                  src={currentDeal.imageUrl}
                  alt={currentDeal.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <MedicinePackVisual product={currentDeal} />
              )}

              <button
                type="button"
                onClick={(e) => handleQuickAdd(e, currentDeal)}
                aria-label={`Add ${currentDeal.name}`}
                className={`absolute -bottom-1.5 -right-1.5 px-2 py-1 rounded-lg font-extrabold text-[10px] shadow-md flex items-center gap-0.5 transition-all cursor-pointer ${
                  justAddedId === currentDeal.id
                    ? 'bg-emerald-700 text-white scale-105'
                    : 'bg-[#0C831F] hover:bg-[#096B19] text-white active:scale-95'
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

          {/* Slide Progress Dots */}
          <div className="flex items-center justify-center gap-1 pt-1.5">
            {spotlightPool.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(idx);
                }}
                aria-label={`Show ${item.name}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeIdx % spotlightPool.length
                    ? 'w-4 bg-amber-300'
                    : 'w-1.5 bg-white/35 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT (7 cols): JioMart-Style Continuous Auto-Gliding Arched Category Cards */}
        <div className="col-span-7 flex flex-col justify-between overflow-hidden rounded-2xl bg-black/15 border border-white/15 p-2">
          <div className="flex items-center justify-between px-1 pb-1.5">
            <span className="text-[10px] font-extrabold text-emerald-50 tracking-wide">
              Swipe or Tap Health Picks
            </span>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
              <span>Live Shelf</span>
            </span>
          </div>

          {/* Infinite Horizontal Gliding Marquee Rail */}
          <div className="relative overflow-hidden w-full py-0.5">
            <div className="animate-hero-marquee gap-2.5">
              {loopedTiles.map((tile, idx) => {
                const sampleProduct =
                  liveProducts.find((p) => p.category === tile.category) ||
                  liveProducts.find((p) => p.brand === tile.fallbackBrand) ||
                  currentDeal;

                return (
                  <button
                    key={`${tile.id}-${idx}`}
                    type="button"
                    onClick={() => onSelectCategory(tile.category)}
                    className={`w-[116px] sm:w-[126px] shrink-0 rounded-t-[34px] rounded-b-2xl bg-gradient-to-b ${tile.accentBg} text-gray-900 p-2.5 shadow-md border border-white flex flex-col items-center justify-between gap-1.5 hover:-translate-y-0.5 transition-transform cursor-pointer group`}
                  >
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs ${tile.badgeBg}`}
                    >
                      {tile.badge}
                    </span>

                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white shadow-xs border border-gray-100 p-1.5 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                      {sampleProduct?.imageUrl ? (
                        <img
                          src={sampleProduct.imageUrl}
                          alt={tile.title}
                          className="w-full h-full object-contain"
                        />
                      ) : sampleProduct ? (
                        <MedicinePackVisual product={sampleProduct} />
                      ) : null}
                    </div>

                    <span className="text-[10.5px] font-extrabold text-gray-900 leading-tight line-clamp-2 text-center">
                      {tile.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-1.5 px-2 py-1 rounded-xl bg-white/12 text-[10px] font-bold text-emerald-50 flex items-center justify-between">
            <span>100% Authentic Sealed Packs</span>
            <span className="text-amber-300 font-extrabold">Tap to Filter →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
