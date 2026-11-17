'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  Star,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Share2,
  Plus,
  Minus,
  Sparkles,
  Info,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Top Header with Brand & Close */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-950 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {product.brand}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-emerald-200">{product.category}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-900 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Visual Showcase & Badges */}
          <div className="relative bg-gradient-to-b from-emerald-50/70 via-stone-50/40 to-white rounded-2xl p-4 border border-emerald-100/60 flex items-center justify-center">
            {product.badgeText && (
              <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                {product.badgeText}
              </span>
            )}
            <MedicinePackVisual product={product} className="w-48 h-40" />
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 shadow-2xs">
              {product.packSize}
            </div>
          </div>

          {/* Title & Ratings */}
          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-gray-900 leading-snug">
              {product.name}
            </h2>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>Marketed by: <strong>{product.manufacturer}</strong></span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-1 bg-emerald-700 text-white text-xs font-extrabold px-2 py-0.5 rounded-md">
                <span>{product.rating}</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {product.reviewCount.toLocaleString()} verified customer ratings
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase">
                Direct Dark Store Price
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-gray-950">
                  ₹{product.sellingPrice}
                </span>
                {product.mrp > product.sellingPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    MRP ₹{product.mrp}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <span className="text-[11px] text-emerald-800 font-semibold block mt-0.5">
                You save ₹{product.mrp - product.sellingPrice} per pack
              </span>
            </div>

            {/* Stepper / Add */}
            <div>
              {quantityInCart === 0 ? (
                <button
                  onClick={() => onAddToCart(product)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  ADD TO CART
                </button>
              ) : (
                <div className="flex items-center bg-emerald-700 text-white rounded-xl shadow-md overflow-hidden">
                  <button
                    onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                    className="p-2 hover:bg-emerald-800"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 font-bold text-xs">{quantityInCart}</span>
                  <button
                    onClick={() => {
                      if (quantityInCart < product.stockQuantity) {
                        onUpdateQuantity(product.id, quantityInCart + 1);
                      }
                    }}
                    disabled={quantityInCart >= product.stockQuantity}
                    className="p-2 hover:bg-emerald-800 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Indications */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              Health Indications & Benefits
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/60">
              {product.indications}
            </p>
          </div>

          {/* Dosage & Directions */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Recommended Usage / Dosage
            </h4>
            <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 font-medium">
              {product.dosage}
            </p>
          </div>

          {/* Ayurvedic Composition */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Key Herbal Ingredients
            </h4>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed font-mono text-[11px]">
              {product.composition}
            </div>
          </div>

          {/* Safety & Storage */}
          {product.safetyAdvice && (
            <div className="flex items-start gap-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Safety Notice:</strong> {product.safetyAdvice}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1 text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" /> 100% Genuine GST Procurement
          </span>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
