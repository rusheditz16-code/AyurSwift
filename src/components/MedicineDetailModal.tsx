'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  Star,
  Plus,
  Minus,
  Sparkles,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { Product } from '@/types';
import { MedicinePackVisual } from './MedicinePackVisual';

interface MedicineDetailModalProps {
  product: Product | null;
  onClose: () => void;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export function MedicineDetailModal({
  product,
  onClose,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
}: MedicineDetailModalProps) {
  if (!product) return null;

  const discountPercent = Math.round(
    ((product.mrp - product.sellingPrice) / product.mrp) * 100
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-[#0c100e] text-white rounded-3xl shadow-2xl border border-white/[0.1] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              {product.brand}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-xs text-gray-300">{product.category}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Showcase Visual */}
          <div className="relative bg-gradient-to-b from-[#161f1a] to-[#0a0d0c] rounded-2xl p-4 border border-white/[0.08] flex items-center justify-center">
            {product.badgeText && (
              <span className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                {product.badgeText}
              </span>
            )}
            <MedicinePackVisual product={product} className="w-48 h-40" />
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-xs font-bold px-2.5 py-1 rounded-lg border border-white/[0.1] text-gray-200">
              {product.packSize}
            </div>
          </div>

          {/* Title & Ratings */}
          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-white leading-snug">
              {product.name}
            </h2>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>Marketed by: <strong className="text-gray-200">{product.manufacturer}</strong></span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-1 bg-emerald-500 text-black text-xs font-black px-2 py-0.5 rounded-md">
                <span>{product.rating}</span>
                <Star className="w-3 h-3 fill-black" />
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {product.reviewCount.toLocaleString()} verified customer ratings
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/[0.08] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Direct Dark Store Price
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-white">
                  ₹{product.sellingPrice}
                </span>
                {product.mrp > product.sellingPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    MRP ₹{product.mrp}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                You save ₹{product.mrp - product.sellingPrice} per unit
              </span>
            </div>

            {/* Stepper / Add */}
            <div>
              {quantityInCart === 0 ? (
                <button
                  onClick={() => onAddToCart(product)}
                  className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black px-5 py-2.5 rounded-xl font-black text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 fill-black" />
                  ADD TO CART
                </button>
              ) : (
                <div className="flex items-center bg-emerald-500 text-black rounded-xl shadow-md overflow-hidden font-black">
                  <button
                    onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                    className="p-2 hover:bg-emerald-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 font-black text-xs">{quantityInCart}</span>
                  <button
                    onClick={() => {
                      if (quantityInCart < product.stockQuantity) {
                        onUpdateQuantity(product.id, quantityInCart + 1);
                      }
                    }}
                    disabled={quantityInCart >= product.stockQuantity}
                    className="p-2 hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Indications */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Health Indications & Benefits
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
              {product.indications}
            </p>
          </div>

          {/* Dosage & Directions */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-400" />
              Recommended Dosage & Directions
            </h4>
            <p className="text-xs text-gray-300 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
              {product.dosage}
            </p>
          </div>

          {/* Composition */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Key Active Herbal Ingredients
            </h4>
            <div className="text-xs text-emerald-300 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06] font-mono text-[11px]">
              {product.composition}
            </div>
          </div>

          {/* Safety */}
          {product.safetyAdvice && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Safety Notice:</strong> {product.safetyAdvice}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/50 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" /> 100% Genuine GST Billed
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
