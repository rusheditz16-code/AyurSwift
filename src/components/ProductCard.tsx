'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Eye, Zap, Truck } from 'lucide-react';
import { DeliveryType, Product } from '@/types';
import { DELIVERY_PROMISE, isVerifiedProductImageUrl } from '@/lib/initialData';
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
  const primaryImage = product.imageUrl || product.images?.[0] || '';

  useEffect(() => {
    setImageError(false);
  }, [primaryImage]);

  const discountPercent =
    product.mrp > product.sellingPrice
      ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
      : 0;
  const isLocal = dispatchType !== 'COURIER_OUTSIDE';
  const showPhoto = isVerifiedProductImageUrl(primaryImage) && !imageError;

  return (
    <article
      className={`h-full flex flex-col bg-white rounded-2xl border border-gray-200/90 hover:border-[#0C831F]/50 hover:shadow-[0_12px_30px_-12px_rgba(12,131,31,0.18)] transition-all duration-200 overflow-hidden group relative ${
        compact ? 'w-[216px] sm:w-[248px] shrink-0' : 'w-full'
      }`}
      aria-label={`${product.name} (${product.packSize}) by ${product.brand}`}
    >
      {/* Verified Discount Pill */}
      {discountPercent > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-[#0C831F] text-white text-[10.5px] font-extrabold px-2 py-0.5 rounded-md shadow-xs tracking-wide tabular-nums">
          {discountPercent}% OFF
        </div>
      )}

      {/* Form Tag Top-Right */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 border border-gray-200/90 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
        {product.form}
      </div>

      {/* Consistent Full-Bleed Image Frame */}
      <button
        type="button"
        onClick={() => onViewDetails(product)}
        aria-label={`View details for ${product.name}, ${product.packSize}`}
        className={`relative w-full aspect-[4/5] bg-[#F7FAF8] group-hover:bg-[#EFF7F2] border-b border-gray-100 transition-colors flex items-center justify-center cursor-pointer overflow-hidden text-left ${
          showPhoto ? 'p-0' : 'p-3'
        }`}
      >
        {showPhoto ? (
          <img
            src={primaryImage}
            alt={`${product.name} (${product.packSize}) by ${product.brand}`}
            width={400}
            height={500}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <>
            <MedicinePackVisual
              product={product}
              className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-2 left-2.5 bg-white/90 border border-gray-200/80 text-gray-600 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md pointer-events-none">
              Illustrative
            </span>
          </>
        )}

        <span
          aria-hidden="true"
          className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity bg-white/95 border border-gray-200 p-1.5 rounded-full shadow-xs"
        >
          <Eye className="w-3.5 h-3.5 text-[#0C831F]" />
        </span>
      </button>

      {/* Readable Product Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Brand Eyebrow & Optional Highlight Badge */}
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <span className="text-[10.5px] sm:text-[11px] font-extrabold text-[#0F766E] uppercase tracking-wide truncate">
            {product.brand}
          </span>
          {product.badgeText && (
            <span className="text-[9.5px] font-bold text-[#0A5C16] bg-[#ECFDF3] border border-[#BBF7D0] px-1.5 py-0.5 rounded-md truncate max-w-[52%] shrink-0">
              {product.badgeText}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-[13px] sm:text-[15px] text-gray-950 line-clamp-2 leading-[1.35] min-h-[36px] sm:min-h-[40px]">
          <button
            type="button"
            onClick={() => onViewDetails(product)}
            className="text-left hover:text-[#0C831F] transition-colors cursor-pointer rounded"
          >
            {product.name}
          </button>
        </h3>

        {/* Pack Size & Verified Delivery Estimate */}
        <div className="mt-1.5 space-y-1">
          <p className="text-[11.5px] sm:text-xs text-gray-600 font-medium truncate">
            {product.packSize}
          </p>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold text-gray-700">
            {isLocal ? (
              <>
                <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" aria-hidden="true" />
                <span>{DELIVERY_PROMISE.localTimeShort}</span>
              </>
            ) : (
              <>
                <Truck className="w-2.5 h-2.5 text-[#0C831F] shrink-0" aria-hidden="true" />
                <span>{DELIVERY_PROMISE.courierTimeShort}</span>
              </>
            )}
          </span>
        </div>

        {/* Bottom Price + Accessible Add / Stepper */}
        <div className="pt-3.5 mt-auto flex items-end justify-between gap-2 border-t border-gray-100/80 mt-3">
          <div className="leading-tight">
            <div className="font-extrabold text-[15px] sm:text-base text-gray-950 tabular-nums">
              ₹{product.sellingPrice}
            </div>
            {product.mrp > product.sellingPrice && (
              <div className="text-[11px] text-gray-500 line-through tabular-nums mt-0.5">
                MRP ₹{product.mrp}
              </div>
            )}
          </div>

          {quantityInCart === 0 ? (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="h-9 px-4 rounded-xl border border-[#0C831F] bg-[#F2FBF4] hover:bg-[#0C831F] text-[#0C831F] hover:text-white font-extrabold text-xs tracking-wide transition-all active:scale-95 shadow-2xs cursor-pointer"
              aria-label={`Add ${product.name} to cart`}
            >
              ADD
            </button>
          ) : (
            <div
              className="h-9 flex items-center bg-[#0C831F] text-white rounded-xl shadow-sm shadow-[#0C831F]/25 overflow-hidden animate-badge-pop"
              role="group"
              aria-label={`Quantity in cart for ${product.name}`}
            >
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="w-8 h-full hover:bg-[#096B19] transition-colors active:scale-90 flex items-center justify-center cursor-pointer"
                aria-label={`Decrease quantity for ${product.name}`}
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span
                className="min-w-[24px] text-center text-xs font-extrabold tabular-nums"
                aria-live="polite"
              >
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                disabled={quantityInCart >= product.stockQuantity}
                className="w-8 h-full hover:bg-[#096B19] disabled:opacity-40 transition-colors active:scale-90 flex items-center justify-center cursor-pointer"
                aria-label={`Increase quantity for ${product.name}`}
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
