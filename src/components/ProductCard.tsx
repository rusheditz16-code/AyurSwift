'use client';

import React, { useState } from 'react';
import { Plus, Minus, Star, Zap, Info } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between p-3 relative group">
      <div>
        {/* Top Product Image & Delivery Tag (Blinkit style) */}
        <div
          onClick={() => onViewDetails(product)}
          className="relative w-full h-36 bg-gray-50 rounded-xl flex items-center justify-center p-2 cursor-pointer overflow-hidden border border-gray-100"
        >
          {/* Real product photo or clean fallback */}
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImageError(true)}
              className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2">
              <span className="text-3xl mb-1">🌿</span>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {product.brand}
              </span>
            </div>
          )}

          {/* Delivery speed pill */}
          <div className="absolute top-2 left-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
            <Zap className="w-2.5 h-2.5 fill-emerald-700 text-emerald-700" />
            <span>30-45 MINS</span>
          </div>

          {/* Discount badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-2xs">
              {discountPercent}% OFF
            </div>
          )}

          {/* Pack Size */}
          <div className="absolute bottom-2 left-2 bg-white/95 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
            {product.packSize}
          </div>
        </div>

        {/* Product Info */}
        <div className="pt-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
              {product.brand}
            </span>
            <div className="flex items-center gap-0.5 text-amber-600 text-[10px] font-bold">
              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              <span>{product.rating}</span>
            </div>
          </div>

          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 leading-snug cursor-pointer hover:text-emerald-700 transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-[11px] text-gray-500 line-clamp-1">
            {product.indications}
          </p>
        </div>
      </div>

      {/* Price & Add / Stepper Section */}
      <div className="pt-3 border-t border-gray-100 mt-2 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-sm sm:text-base text-gray-900">
              ₹{product.sellingPrice}
            </span>
            {product.mrp > product.sellingPrice && (
              <span className="text-[11px] text-gray-400 line-through">
                ₹{product.mrp}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold block">
            GST wholesale billed
          </span>
        </div>

        {/* Action Button: Blinkit style Add or Stepper */}
        <div>
          {quantityInCart === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-600 font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs transition-all active:scale-95"
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-emerald-600 text-white rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="px-2 py-1.5 hover:bg-emerald-700 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 font-black text-xs min-w-[20px] text-center">
                {quantityInCart}
              </span>
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                className="px-2 py-1.5 hover:bg-emerald-700 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
