'use client';

import React from 'react';
import { Plus, Minus, Star, Info } from 'lucide-react';
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
    <div className="bg-[#0e1311]/90 rounded-3xl border border-white/[0.08] hover:border-emerald-500/40 shadow-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Top Product Visual Container (Dark Luxury Canvas) */}
        <div
          onClick={() => onViewDetails(product)}
          className="relative w-full h-44 bg-gradient-to-b from-[#161f1a]/80 via-[#101713]/90 to-[#0e1311] flex items-center justify-center p-2 cursor-pointer border-b border-white/[0.06] group-hover:from-[#1b2620] transition-colors"
        >
          {/* Custom high-fidelity medicine visual */}
          <MedicinePackVisual product={product} className="w-full h-36" />

          {/* Discount Pill */}
          {discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
              {discountPercent}% OFF
            </div>
          )}

          {/* Badge */}
          {product.badgeText && (
            <div className="absolute top-3 right-3 bg-black/60 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
              {product.badgeText}
            </div>
          )}

          {/* Pack Size */}
          <div className="absolute bottom-2.5 left-3 bg-black/70 backdrop-blur-md text-gray-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-white/[0.08]">
            {product.packSize}
          </div>

          {/* Stock */}
          {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
            <div className="absolute bottom-2.5 right-3 bg-rose-950/80 text-rose-300 border border-rose-500/30 text-[9px] font-bold px-2 py-0.5 rounded-md">
              {product.stockQuantity} Left
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4 space-y-2">
          {/* Brand & Rating */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-black text-emerald-400 tracking-wider uppercase text-[10px]">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 bg-white/[0.05] text-amber-300 px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/[0.08]">
              <span>{product.rating}</span>
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-sm text-white line-clamp-1 group-hover:text-emerald-300 transition-colors cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Clinical Indications Snippet */}
          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed font-normal">
            {product.indications}
          </p>

          {/* Manufacturer & Details Trigger */}
          <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400">
            <span className="truncate max-w-[130px]">{product.manufacturer}</span>
            <button
              onClick={() => onViewDetails(product)}
              className="text-emerald-400 font-bold hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <Info className="w-3 h-3" /> Details
            </button>
          </div>
        </div>
      </div>

      {/* Pricing & High-Speed Stepper */}
      <div className="p-4 pt-0 border-t border-white/[0.04] flex items-center justify-between gap-2 mt-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-base text-white tracking-tight">
              ₹{product.sellingPrice}
            </span>
            {product.mrp > product.sellingPrice && (
              <span className="text-xs text-gray-500 line-through">
                ₹{product.mrp}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold block -mt-0.5">
            Save ₹{product.mrp - product.sellingPrice}
          </span>
        </div>

        {/* Quick Stepper */}
        <div>
          {quantityInCart === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-emerald-500/10 hover:bg-emerald-400 text-emerald-400 hover:text-black border border-emerald-500/40 hover:border-emerald-400 px-4 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-emerald-500 text-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] overflow-hidden font-black">
              <button
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="px-2.5 py-1.5 hover:bg-emerald-600 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3 text-black" />
              </button>
              <span className="px-2 font-black text-xs min-w-[20px] text-center">
                {quantityInCart}
              </span>
              <button
                onClick={() => {
                  if (quantityInCart < product.stockQuantity) {
                    onUpdateQuantity(product.id, quantityInCart + 1);
                  }
                }}
                disabled={quantityInCart >= product.stockQuantity}
                className="px-2.5 py-1.5 hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3 text-black" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
