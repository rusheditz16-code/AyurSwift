'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Minus, Check, ShieldCheck, Zap } from 'lucide-react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export function ProductCard({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
}: ProductCardProps) {
  const discountPercent = Math.round(
    ((product.mrp - product.sellingPrice) / product.mrp) * 100
  );

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Top Product Media Container */}
        <div className="relative w-full h-40 bg-gradient-to-b from-emerald-50/50 to-white flex items-center justify-center p-3 border-b border-emerald-50">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-32 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="text-4xl text-emerald-800/40 font-bold select-none">
              🌿
            </div>
          )}

          {/* Discount Pill */}
          {discountPercent > 0 && (
            <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
              {discountPercent}% OFF
            </div>
          )}

          {/* Low Stock Warning */}
          {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
            <div className="absolute bottom-2 left-2 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold px-1.5 py-0.5 rounded">
              Only {product.stockQuantity} left
            </div>
          )}

          {/* Pack Size Badge */}
          <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs text-gray-700 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
            {product.packSize}
          </div>
        </div>

        {/* Product Details */}
        <div className="p-3.5 space-y-1.5">
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-emerald-800 tracking-wide uppercase">
              {product.brand}
            </span>
            <span className="text-gray-400 font-medium truncate max-w-[120px]">
              {product.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
            {product.name}
          </h3>

          {/* Clinical Indications / Benefits */}
          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
            {product.indications}
          </p>

          {/* Trust Cue */}
          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium pt-0.5">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>100% Genuine Ayurvedic OTC</span>
          </div>
        </div>
      </div>

      {/* Pricing & Zepto-Style Instant Stepper */}
      <div className="p-3.5 pt-0 border-t border-gray-50 flex items-center justify-between gap-2 mt-2">
        {/* Prices */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-base text-gray-900">
              ₹{product.sellingPrice}
            </span>
            {product.mrp > product.sellingPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.mrp}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block -mt-0.5">
            Save ₹{product.mrp - product.sellingPrice}
          </span>
        </div>

        {/* Quick-Commerce Stepper */}
        <div>
          {quantityInCart === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white border border-emerald-300 hover:border-emerald-700 px-4 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-emerald-700 text-white rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="px-2.5 py-1.5 hover:bg-emerald-800 active:bg-emerald-900 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 font-bold text-xs min-w-[20px] text-center">
                {quantityInCart}
              </span>
              <button
                onClick={() => {
                  if (quantityInCart < product.stockQuantity) {
                    onUpdateQuantity(product.id, quantityInCart + 1);
                  }
                }}
                disabled={quantityInCart >= product.stockQuantity}
                className="px-2.5 py-1.5 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 transition-colors"
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
