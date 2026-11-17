'use client';

import React, { useState } from 'react';
import { Plus, Minus, ChevronRight, Zap } from 'lucide-react';
import { Product } from '@/types';

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
    <div className="bg-white rounded-2xl border border-gray-200 hover:border-[#10847e] hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-3.5">
        {/* Top Header: Truemeds Green Discount Pill */}
        <div className="flex items-center justify-between min-h-[22px] mb-2">
          {discountPercent > 0 ? (
            <span className="bg-[#10847e] text-white text-[10.5px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
              {discountPercent}% OFF
            </span>
          ) : (
            <span />
          )}

          {product.badgeText && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {product.badgeText}
            </span>
          )}
        </div>

        {/* Product Image on Pure White Background */}
        <div
          onClick={() => onViewDetails(product)}
          className="w-full h-36 flex items-center justify-center p-2 cursor-pointer relative overflow-hidden"
        >
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImageError(true)}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2">
              <span className="text-3xl mb-1">🌿</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {product.brand}
              </span>
            </div>
          )}
        </div>

        {/* Product Details (Truemeds typography) */}
        <div className="pt-2 space-y-1">
          <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
            {product.brand} • {product.packSize}
          </div>

          <h3
            onClick={() => onViewDetails(product)}
            className="font-medium text-[13px] text-gray-900 line-clamp-2 leading-snug cursor-pointer hover:text-[#10847e] transition-colors min-h-[36px]"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* Pricing & Add Button (Exact Truemeds Layout) */}
        <div className="pt-3 mt-2 flex items-center justify-between border-t border-gray-100">
          <div>
            {product.mrp > product.sellingPrice && (
              <div className="text-[11px] text-gray-400 line-through leading-none mb-0.5">
                MRP ₹{product.mrp}
              </div>
            )}
            <div className="font-extrabold text-[15px] text-gray-900 leading-none">
              ₹{product.sellingPrice}
            </div>
          </div>

          {/* Truemeds Clean Outlined Add Button / Stepper */}
          <div>
            {quantityInCart === 0 ? (
              <button
                onClick={() => onAddToCart(product)}
                className="border border-[#10847e] text-[#10847e] hover:bg-[#10847e] hover:text-white font-bold text-xs px-5 py-1.5 rounded-lg transition-all active:scale-95 shadow-2xs"
              >
                Add
              </button>
            ) : (
              <div className="flex items-center bg-[#10847e] text-white rounded-lg shadow-xs overflow-hidden">
                <button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                  className="px-2.5 py-1 hover:bg-[#0c6b66] transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-2 font-black text-xs min-w-[20px] text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                  className="px-2.5 py-1 hover:bg-[#0c6b66] transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Lilac Strip (Truemeds signature: "Save with substitute" / "⚡ 30-45m Rapido Dispatch >") */}
      <button
        onClick={() => onViewDetails(product)}
        className="w-full bg-[#F6F3FF] hover:bg-[#EFE8FF] text-[#6941C6] text-[11px] font-semibold py-2 px-3 flex items-center justify-between border-t border-[#E9D7FE] transition-colors text-left"
      >
        <span className="flex items-center gap-1 truncate">
          <Zap className="w-3 h-3 fill-[#6941C6] text-[#6941C6] shrink-0" />
          <span>30–45 Mins Rapido Dispatch</span>
        </span>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
      </button>
    </div>
  );
}
