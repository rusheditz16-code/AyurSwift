'use client';

import React, { useState } from 'react';
import { Plus, Minus, Eye, Star, Zap, Truck, Images } from 'lucide-react';
import { DeliveryType, Product } from '@/types';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onViewDetails: (product: Product) => void;
  dispatchType?: DeliveryType;
  compact?: boolean;
}

export function ProductCard({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  onViewDetails,
  dispatchType = 'RAPIDO_CITY',
  compact = false,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const discountPercent = Math.round(
    ((product.mrp - product.sellingPrice) / product.mrp) * 100
  );
  const isLocal = dispatchType !== 'COURIER_OUTSIDE';

  return (
    <article
      className={`h-full flex flex-col bg-white rounded-2xl border border-gray-200/85 hover:border-[#0C831F]/45 hover:shadow-[0_10px_28px_-10px_rgba(15,23,42,0.14)] transition-all duration-200 overflow-hidden group relative ${
        compact ? 'w-[172px] sm:w-[196px] shrink-0' : 'w-full'
      }`}
      aria-label={`${product.name} by ${product.brand}`}
    >
      {/* Top Discount Ribbon (Blinkit-style blue/emerald badge) */}
      {discountPercent > 0 && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-[#2563EB] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs tracking-wide tabular-nums">
          {discountPercent}% OFF
        </div>
      )}

      {/* Rating Pill top-right */}
      {product.rating > 0 && (
        <div className="absolute top-2.5 right-2.5 z-10 bg-white/92 backdrop-blur-xs border border-gray-200/80 text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs tabular-nums">
          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
          <span>{product.rating.toFixed(1)}</span>
        </div>
      )}

      {/* Packshot Stage */}
      <div
        onClick={() => onViewDetails(product)}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onViewDetails(product);
          }
        }}
        aria-label={`View details for ${product.name}`}
        className="relative w-full aspect-[4/3] bg-[#F8FAFC] group-hover:bg-[#F1F5F9]/90 transition-colors flex items-center justify-center p-3 cursor-pointer overflow-hidden"
      >
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <MedicinePackVisual
            product={product}
            className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-105"
          />
        )}

        {/* Multi-photo pill */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 left-2 bg-gray-900/65 backdrop-blur-xs text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
            <Images className="w-2.5 h-2.5" />
            <span>{product.images.length}</span>
          </div>
        )}

        {/* Subtle Quick-View eye on hover */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 border border-gray-200 p-1.5 rounded-full shadow-xs">
          <Eye className="w-3.5 h-3.5 text-[#0C831F]" />
        </div>
      </div>

      {/* Product Body */}
      <div className="p-3 flex flex-col flex-1">
        {/* Micro ETA Pill */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-[9.5px] font-extrabold text-gray-700 uppercase tracking-wide">
            {isLocal ? (
              <>
                <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                <span>30 MINS</span>
              </>
            ) : (
              <>
                <Truck className="w-2.5 h-2.5 text-[#0C831F]" />
                <span>2–4 DAYS</span>
              </>
            )}
          </span>
          {product.badgeText && discountPercent === 0 && (
            <span className="text-[9.5px] font-bold text-[#0C831F] bg-[#ECFDF3] px-1.5 py-0.5 rounded-md truncate max-w-[90px]">
              {product.badgeText}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetails(product)}
          className="font-bold text-[13px] sm:text-[13.5px] text-gray-900 line-clamp-2 leading-[1.3] cursor-pointer hover:text-[#0C831F] transition-colors min-h-[34px]"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Brand & Pack Size */}
        <div className="text-[11px] text-gray-500 font-medium mt-1 truncate">
          {product.packSize} • {product.brand}
        </div>

        {/* Bottom Price + Blinkit ADD / Stepper */}
        <div className="pt-3 mt-auto flex items-center justify-between gap-2">
          <div className="leading-tight">
            <div className="font-extrabold text-sm sm:text-[15px] text-gray-950 tabular-nums">
              ₹{product.sellingPrice}
            </div>
            {product.mrp > product.sellingPrice && (
              <div className="text-[10.5px] text-gray-400 line-through tabular-nums">
                ₹{product.mrp}
              </div>
            )}
          </div>

          {quantityInCart === 0 ? (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="h-8 px-4 rounded-lg border border-[#0C831F] bg-[#F2FBF4] hover:bg-[#0C831F] text-[#0C831F] hover:text-white font-extrabold text-xs tracking-wide transition-all active:scale-95 shadow-2xs cursor-pointer"
              aria-label={`Add ${product.name} to cart`}
            >
              ADD
            </button>
          ) : (
            <div
              className="h-8 flex items-center bg-[#0C831F] text-white rounded-lg shadow-sm shadow-[#0C831F]/25 overflow-hidden animate-badge-pop"
              role="group"
              aria-label={`Quantity in cart for ${product.name}`}
            >
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="w-7 h-full hover:bg-[#096B19] transition-colors active:scale-90 flex items-center justify-center cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span
                className="min-w-[22px] text-center text-xs font-extrabold tabular-nums"
                aria-live="polite"
              >
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                disabled={quantityInCart >= product.stockQuantity}
                className="w-7 h-full hover:bg-[#096B19] disabled:opacity-40 transition-colors active:scale-90 flex items-center justify-center cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
