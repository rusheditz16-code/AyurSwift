'use client';

import React from 'react';
import { Plus, Minus, Star, ShieldCheck, Zap, Info } from 'lucide-react';
import { Product } from '@/types';
import { MedicinePackVisual } from './MedicinePackVisual';

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
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-emerald-300">
      <div>
        {/* Top Product Visual Container */}
        <div
          onClick={() => onViewDetails(product)}
          className="relative w-full h-44 bg-gradient-to-b from-[#F3F8F4] to-white flex items-center justify-center p-2 cursor-pointer border-b border-emerald-50/60"
        >
          {/* Custom high-fidelity medicine visual */}
          <MedicinePackVisual product={product} className="w-full h-36" />

          {/* Discount Pill */}
          {discountPercent > 0 && (
            <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
              {discountPercent}% OFF
            </div>
          )}

          {/* Bestseller Badge */}
          {product.badgeText && (
            <div className="absolute top-2.5 right-2.5 bg-emerald-900/90 text-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
              {product.badgeText}
            </div>
          )}

          {/* Pack Size Pill */}
          <div className="absolute bottom-2 left-2.5 bg-white/95 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
            {product.packSize}
          </div>

          {/* Low Stock Warning */}
          {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
            <div className="absolute bottom-2 right-2.5 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold px-1.5 py-0.5 rounded">
              {product.stockQuantity} Left
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-3.5 space-y-1.5">
          {/* Brand & Rating */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-emerald-900 tracking-wider uppercase text-[10px]">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200/60">
              <span>{product.rating}</span>
              <Star className="w-2.5 h-2.5 fill-emerald-700 text-emerald-700" />
            </div>
          </div>

          {/* Medicine Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-1 group-hover:text-emerald-800 transition-colors cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Clinical Indications Snippet */}
          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
            {product.indications}
          </p>

          {/* Trust Badge */}
          <div className="flex items-center justify-between pt-0.5 text-[10px] text-gray-400">
            <span className="truncate max-w-[120px]">{product.manufacturer}</span>
            <button
              onClick={() => onViewDetails(product)}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
            >
              <Info className="w-2.5 h-2.5" /> Details
            </button>
          </div>
        </div>
      </div>

      {/* Pricing & Stepper */}
      <div className="p-3.5 pt-0 border-t border-gray-50 flex items-center justify-between gap-2 mt-1">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-sm sm:text-base text-gray-900">
              ₹{product.sellingPrice}
            </span>
            {product.mrp > product.sellingPrice && (
              <span className="text-[11px] text-gray-400 line-through">
                ₹{product.mrp}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold block -mt-0.5">
            Save ₹{product.mrp - product.sellingPrice}
          </span>
        </div>

        {/* Quick Stepper */}
        <div>
          {quantityInCart === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-emerald-50 hover:bg-emerald-800 text-emerald-900 hover:text-white border border-emerald-300 hover:border-emerald-800 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-emerald-800 text-white rounded-xl shadow-xs overflow-hidden">
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="px-2 py-1.5 hover:bg-emerald-900 active:bg-emerald-950 transition-colors"
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
                className="px-2 py-1.5 hover:bg-emerald-900 active:bg-emerald-950 disabled:opacity-40 transition-colors"
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
