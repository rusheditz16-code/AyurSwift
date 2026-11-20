'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { CartItem, DeliveryType, Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';

interface ProductShelfProps {
  title: string;
  subtitle?: string;
  badge?: string;
  products: Product[];
  cart: CartItem[];
  dispatchType?: DeliveryType;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onViewDetails: (product: Product) => void;
  onSeeAll?: () => void;
}

export function ProductShelf({
  title,
  subtitle,
  badge,
  products,
  cart,
  dispatchType = 'RAPIDO_CITY',
  onAddToCart,
  onUpdateQuantity,
  onViewDetails,
  onSeeAll,
}: ProductShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const distance = direction === 'left' ? -440 : 440;
    scrollRef.current.scrollBy({ left: distance, behavior: 'smooth' });
  };

  return (
    <section className="space-y-3 relative group/shelf">
      {/* Shelf Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-lg sm:text-xl text-gray-950 tracking-tight">
              {title}
            </h2>
            {badge && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-[#ECFDF3] border border-[#BBF7D0] text-[#0C831F] text-[10.5px] font-bold">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-xs sm:text-sm font-bold text-[#0C831F] hover:text-[#096B19] inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>See all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      <div className="relative">
        {/* Left Arrow (Desktop) */}
        <button
          type="button"
          onClick={() => scrollByAmount('left')}
          aria-label={`Scroll ${title} left`}
          className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-lg text-gray-700 hover:text-[#0C831F] hover:border-[#0C831F]/40 items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-all cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scroll Track */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-1.5 -mx-3 px-3 sm:mx-0 sm:px-0"
        >
          {products.map((product) => {
            const qty = cart.find((i) => i.product.id === product.id)?.quantity ?? 0;
            return (
              <div key={product.id} className="snap-start">
                <ProductCard
                  product={product}
                  quantityInCart={qty}
                  onAddToCart={onAddToCart}
                  onUpdateQuantity={onUpdateQuantity}
                  onViewDetails={onViewDetails}
                  dispatchType={dispatchType}
                  compact
                />
              </div>
            );
          })}
        </div>

        {/* Right Arrow (Desktop) */}
        <button
          type="button"
          onClick={() => scrollByAmount('right')}
          aria-label={`Scroll ${title} right`}
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-lg text-gray-700 hover:text-[#0C831F] hover:border-[#0C831F]/40 items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-all cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
