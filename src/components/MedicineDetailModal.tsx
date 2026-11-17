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
  Zap,
  ShoppingBag,
} from 'lucide-react';
import { Product } from '@/types';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#10847e]">
              {product.brand}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-600 font-semibold">{product.category}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors shadow-2xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Authentic Medicine Packshot Showcase */}
          <div className="relative bg-gradient-to-b from-gray-50 via-white to-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-center h-48 sm:h-52 overflow-hidden shadow-inner">
            <MedicinePackVisual
              product={product}
              className="w-full h-full transform scale-110"
            />

            <div className="absolute top-3 left-3 bg-[#10847e] text-white text-[10px] font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
              <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>30–45M RAPIDO DISPATCH</span>
            </div>

            <div className="absolute bottom-3 right-3 bg-white text-gray-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
              {product.packSize}
            </div>
          </div>

          {/* Title & Brand */}
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-snug">
              {product.name}
            </h2>
            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2 pt-0.5">
              <span>Manufacturer: <strong className="text-gray-800">{product.manufacturer}</strong></span>
              <span>•</span>
              <div className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{product.rating}</span>
                <span className="text-gray-400">({product.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Price Strip */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-gray-500 font-medium">Selling Price (incl. GST)</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900 leading-none">
                  ₹{product.sellingPrice}
                </span>
                {product.mrp > product.sellingPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    MRP ₹{product.mrp}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-[#10847e] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-[#10847e] block">
                IN STOCK AT HOME STORE
              </span>
              <span className="text-[11px] text-gray-500 font-mono">
                {product.stockQuantity} units available
              </span>
            </div>
          </div>

          {/* Clinical Indications */}
          <div className="space-y-1.5 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 text-xs">
            <div className="font-extrabold text-[#10847e] flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Key Health Benefits &amp; Action</span>
            </div>
            <p className="text-gray-700 leading-relaxed font-normal">
              {product.indications}
            </p>
          </div>

          {/* Dosage & Instructions */}
          <div className="space-y-1.5 p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 text-xs">
            <div className="font-extrabold text-gray-900 flex items-center gap-1.5 text-xs">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Recommended Usage / Dosage</span>
            </div>
            <p className="text-gray-600 leading-relaxed font-normal">
              {product.dosage}
            </p>
          </div>

          {/* Composition */}
          {product.composition && (
            <div className="space-y-1.5 p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 text-xs">
              <div className="font-extrabold text-gray-900 text-xs">
                Key Ayurvedic Ingredients
              </div>
              <p className="text-gray-600 font-mono text-[11px] leading-relaxed">
                {product.composition}
              </p>
            </div>
          )}

          {/* Safety Advice */}
          {product.safetyAdvice && (
            <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug font-medium">
                <strong>Storage &amp; Caution:</strong> {product.safetyAdvice}
              </p>
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10847e]" />
              <span>100% Genuine Agency Sourced</span>
            </span>
            <span>•</span>
            <span>Non-drowsy OTC</span>
            <span>•</span>
            <span>Bhavnagar Stock</span>
          </div>
        </div>

        {/* Footer Add / Stepper */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total</div>
            <div className="text-base font-black text-gray-900">
              ₹{quantityInCart > 0 ? product.sellingPrice * quantityInCart : product.sellingPrice}
            </div>
          </div>

          {quantityInCart === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-[#10847e] hover:bg-[#0c6b66] text-white font-extrabold text-xs px-6 py-3 rounded-2xl transition-all shadow-xs flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#10847e] text-white rounded-2xl shadow-xs overflow-hidden">
                <button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                  className="px-3.5 py-2.5 hover:bg-[#0c6b66] transition-colors active:scale-90"
                  aria-label="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-black min-w-[28px] text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                  disabled={quantityInCart >= product.stockQuantity}
                  className="px-3.5 py-2.5 hover:bg-[#0c6b66] disabled:opacity-40 transition-colors active:scale-90"
                  aria-label="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={onClose}
                className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-2xl"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
