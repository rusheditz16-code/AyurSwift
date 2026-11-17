'use client';

import React from 'react';
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
  const discountPercent = Math.round(
    ((product.mrp - product.sellingPrice) / product.mrp) * 100
  );

  return (
    <article
      className="h-full flex flex-col justify-between bg-white rounded-2xl border border-gray-200 hover:border-[#10847e] hover:shadow-md transition-all duration-200 overflow-hidden group focus-within:ring-2 focus-within:ring-[#10847e]"
      aria-label={`${product.name} by ${product.brand}`}
    >
      <div className="p-3 sm:p-3.5 flex flex-col flex-1">
        {/* Top Badges: Discount Pill + Badge */}
        <div className="flex items-center justify-between min-h-[22px] mb-2 gap-1">
          {discountPercent > 0 ? (
            <span className="bg-[#10847e] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wide uppercase">
              {discountPercent}% OFF
            </span>
          ) : (
            <span />
          )}

          {product.badgeText && (
            <span className="text-[9.5px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate max-w-[120px]">
              {product.badgeText}
            </span>
          )}
        </div>

        {/* Product Visual Container (Realistic Packshot via MedicinePackVisual) */}
        <div
          onClick={() => onViewDetails(product)}
          className="w-full h-36 sm:h-40 bg-gradient-to-b from-gray-50/70 to-white rounded-xl flex items-center justify-center p-2 cursor-pointer relative overflow-hidden group-hover:bg-emerald-50/20 transition-colors"
          tabIndex={0}
          role="button"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onViewDetails(product);
            }
          }}
          aria-label={`View clinical details for ${product.name}`}
        >
          {/* Authentic Form-Accurate Packshot */}
          <MedicinePackVisual
            product={product}
            className="w-full h-full transform group-hover:scale-105 transition-transform duration-200"
          />

          {/* Quick-view icon overlay on hover */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-full shadow-xs text-gray-600">
            <Eye className="w-3.5 h-3.5 text-[#10847e]" />
          </div>
        </div>

        {/* Product Meta */}
        <div className="pt-2.5 flex-1 flex flex-col justify-between space-y-1">
          <div>
            <div className="text-[10.5px] text-gray-500 font-bold uppercase tracking-wider truncate">
              {product.brand} • {product.packSize}
            </div>

            <h3
              onClick={() => onViewDetails(product)}
              className="font-bold text-[12.5px] sm:text-[13px] text-gray-900 line-clamp-2 leading-snug cursor-pointer hover:text-[#10847e] transition-colors mt-0.5 min-h-[36px]"
              title={product.name}
            >
              {product.name}
            </h3>
          </div>

          {/* Dispatch Badge */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50/90 border border-emerald-100 px-1.5 py-0.5 rounded">
              <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              <span>30–45m Rapido</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & Add / Quantity Stepper Footer */}
      <div className="px-3 sm:px-3.5 pb-3 pt-2 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between mt-auto">
        <div>
          {product.mrp > product.sellingPrice && (
            <div className="text-[10px] text-gray-400 line-through leading-none mb-0.5">
              MRP ₹{product.mrp}
            </div>
          )}
          <div className="font-black text-sm sm:text-base text-gray-900 leading-none">
            ₹{product.sellingPrice}
          </div>
        </div>

        {/* Add Button or Stepper */}
        <div>
          {quantityInCart === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-white hover:bg-[#10847e] text-[#10847e] hover:text-white border border-[#10847e] px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-2xs active:scale-95 flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10847e]"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <div
              className="flex items-center bg-[#10847e] text-white rounded-xl shadow-xs overflow-hidden"
              role="group"
              aria-label={`Quantity in cart for ${product.name}`}
            >
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="px-2.5 py-1.5 hover:bg-[#0c6b66] transition-colors active:scale-90 flex items-center justify-center focus:outline-none"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 text-xs font-black min-w-[20px] text-center" aria-live="polite">
                {quantityInCart}
              </span>
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                disabled={quantityInCart >= product.stockQuantity}
                className="px-2.5 py-1.5 hover:bg-[#0c6b66] disabled:opacity-40 transition-colors active:scale-90 flex items-center justify-center focus:outline-none"
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
