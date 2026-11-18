'use client';

import React, { useState } from 'react';
import { Plus, Minus, Zap, Eye } from 'lucide-react';
import { Product } from '@/types';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onViewDetails: (product: Product) => void;
}

export function ProductCard({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  onViewDetails,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const discountPercent = Math.round(
    ((product.mrp - product.sellingPrice) / product.mrp) * 100
  );

  return (
    <article
      className="h-full flex flex-col justify-between bg-white rounded-2xl border border-[#d6ddce] hover:border-[#1d5a3e] hover:shadow-sm transition-all duration-200 overflow-hidden group focus-within:ring-2 focus-within:ring-[#1d5a3e]"
      aria-label={`${product.name} by ${product.brand}`}
    >
      <div className="p-3 sm:p-3.5 flex flex-col flex-1">
        {/* Top Meta Strip: Warm Orange Discount Badge + In-Stock Indicator */}
        <div className="flex items-center justify-between min-h-[22px] mb-2 gap-1">
          {discountPercent > 0 ? (
            <span className="bg-[#c86326] text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
              {discountPercent}% OFF
            </span>
          ) : (
            <span />
          )}

          {/* Factual Stock State Badge */}
          <span className="text-[10px] font-semibold text-emerald-800 bg-[#e9efdf] px-1.5 py-0.5 rounded border border-[#d6ddce]">
            ● In Stock
          </span>
        </div>

        {/* Product Visual Container (Uploaded Packshot or Form-Accurate Art) */}
        <div
          onClick={() => onViewDetails(product)}
          className="w-full h-36 sm:h-38 bg-[#f8f8f3] rounded-xl flex items-center justify-center p-2 cursor-pointer relative overflow-hidden group-hover:bg-[#e9efdf]/40 transition-colors"
          tabIndex={0}
          role="button"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onViewDetails(product);
            }
          }}
          aria-label={`View details for ${product.name}`}
        >
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-contain p-1 transform group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <MedicinePackVisual
              product={product}
              className="w-full h-full transform group-hover:scale-105 transition-transform duration-200"
            />
          )}

          {/* Multiple Photos Badge */}
          {product.images && product.images.length > 1 && (
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs pointer-events-none">
              <span>📷 {product.images.length}</span>
            </div>
          )}

          {/* Quick-view icon overlay on hover */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-full shadow-xs text-gray-700">
            <Eye className="w-3.5 h-3.5 text-[#1d5a3e]" />
          </div>
        </div>

        {/* Product Metadata */}
        <div className="pt-2.5 flex-1 flex flex-col justify-between space-y-1">
          <div>
            <div className="text-[10.5px] text-gray-500 font-semibold uppercase tracking-wider truncate">
              {product.brand} • {product.packSize}
            </div>

            <h3
              onClick={() => onViewDetails(product)}
              className="font-serif font-bold text-[13px] sm:text-[14px] text-gray-900 line-clamp-2 leading-snug cursor-pointer hover:text-[#1d5a3e] transition-colors mt-0.5 min-h-[36px]"
              title={product.name}
            >
              {product.name}
            </h3>
          </div>

          {/* Dispatch Tag */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#143d29] bg-[#e9efdf] px-1.5 py-0.5 rounded">
              <Zap className="w-2.5 h-2.5 fill-[#c86326] text-[#c86326]" />
              <span>30–45m Rapido</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & Add/Stepper Controls */}
      <div className="px-3 sm:px-3.5 pb-3 pt-2 bg-[#f8f8f3]/60 border-t border-[#d6ddce] flex items-center justify-between mt-auto">
        <div>
          {product.mrp > product.sellingPrice && (
            <div className="text-[10px] text-gray-400 line-through leading-none mb-0.5">
              MRP ₹{product.mrp}
            </div>
          )}
          <div className="font-bold text-sm sm:text-base text-gray-900 leading-none">
            ₹{product.sellingPrice}
          </div>
        </div>

        {/* Add Button or Stepper */}
        <div>
          {quantityInCart === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-white hover:bg-[#1d5a3e] text-[#1d5a3e] hover:text-white border border-[#1d5a3e] px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs active:scale-95 flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d5a3e]"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <div
              className="flex items-center bg-[#1d5a3e] text-white rounded-xl shadow-xs overflow-hidden"
              role="group"
              aria-label={`Quantity in cart for ${product.name}`}
            >
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="px-2.5 py-1.5 hover:bg-[#143d29] transition-colors active:scale-90 flex items-center justify-center focus:outline-none"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 text-xs font-bold min-w-[20px] text-center" aria-live="polite">
                {quantityInCart}
              </span>
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                disabled={quantityInCart >= product.stockQuantity}
                className="px-2.5 py-1.5 hover:bg-[#143d29] disabled:opacity-40 transition-colors active:scale-90 flex items-center justify-center focus:outline-none"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
