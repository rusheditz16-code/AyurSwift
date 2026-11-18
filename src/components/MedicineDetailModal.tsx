'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  Info,
  AlertTriangle,
  Zap,
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
      <div className="w-full max-w-lg bg-[#f8f8f3] text-gray-900 rounded-3xl shadow-2xl border border-[#d6ddce] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-[#d6ddce] flex items-center justify-between bg-[#e9efdf]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1d5a3e]">
              {product.brand}
            </span>
            <span className="text-[#a8b89e]">•</span>
            <span className="text-xs text-gray-700 font-semibold">{product.category}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors shadow-2xs border border-[#d6ddce]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Medicine Packshot Showcase */}
          <div className="relative bg-white rounded-2xl p-4 border border-[#d6ddce] flex items-center justify-center h-48 sm:h-52 overflow-hidden shadow-inner">
            <MedicinePackVisual
              product={product}
              className="w-full h-full transform scale-110"
            />

            <div className="absolute top-3 left-3 bg-[#1d5a3e] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
              <Zap className="w-3 h-3 fill-[#c86326] text-[#c86326]" />
              <span>30–45M RAPIDO DISPATCH</span>
            </div>

            <div className="absolute bottom-3 right-3 bg-[#f8f8f3] text-gray-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-[#d6ddce] shadow-2xs">
              {product.packSize}
            </div>
          </div>

          {/* Title & Brand */}
          <div className="space-y-1">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#143d29] leading-snug">
              {product.name}
            </h2>
            <div className="text-xs text-gray-600 flex flex-wrap items-center gap-2 pt-0.5">
              <span>Manufacturer: <strong className="text-gray-900">{product.manufacturer}</strong></span>
              <span>•</span>
              <span className="text-emerald-800 font-semibold">● In Stock ({product.stockQuantity} available)</span>
            </div>
          </div>

          {/* Price Strip */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#d6ddce] flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-[11px] text-gray-500 font-medium">Selling Price (incl. GST)</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 leading-none">
                  ₹{product.sellingPrice}
                </span>
                {product.mrp > product.sellingPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    MRP ₹{product.mrp}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-[#c86326] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-[#1d5a3e] block">
                BHAVNAGAR STORE
              </span>
              <span className="text-[11px] text-gray-500">
                Ready for dispatch
              </span>
            </div>
          </div>

          {/* Indications / Benefits */}
          <div className="space-y-1.5 bg-[#e9efdf] p-3.5 rounded-2xl border border-[#d6ddce] text-xs">
            <div className="font-bold text-[#143d29] flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#1d5a3e]" />
              <span>Product Information &amp; Action</span>
            </div>
            <p className="text-gray-800 leading-relaxed font-normal">
              {product.indications}
            </p>
          </div>

          {/* Dosage & Instructions */}
          <div className="space-y-1.5 p-3.5 rounded-2xl border border-[#d6ddce] bg-white text-xs shadow-2xs">
            <div className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
              <Info className="w-3.5 h-3.5 text-[#1d5a3e]" />
              <span>Recommended Usage</span>
            </div>
            <p className="text-gray-700 leading-relaxed font-normal">
              {product.dosage}
            </p>
          </div>

          {/* Composition */}
          {product.composition && (
            <div className="space-y-1.5 p-3.5 rounded-2xl border border-[#d6ddce] bg-white text-xs shadow-2xs">
              <div className="font-bold text-gray-900 text-xs">
                Key Botanical Ingredients
              </div>
              <p className="text-gray-700 font-mono text-[11px] leading-relaxed">
                {product.composition}
              </p>
            </div>
          )}

          {/* Safety Advice */}
          {product.safetyAdvice && (
            <div className="p-3 bg-[#fff7ed] rounded-2xl border border-[#fed7aa] text-xs text-amber-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#c86326] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug font-medium">
                <strong>Storage &amp; Caution:</strong> {product.safetyAdvice}
              </p>
            </div>
          )}

          {/* Service Guarantee */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-gray-600 font-medium">
            <span className="flex items-center gap-1 text-[#143d29]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1d5a3e]" />
              <span>Agency Sourced with GST Invoices</span>
            </span>
            <span>•</span>
            <span>Bhavnagar Stock</span>
          </div>
        </div>

        {/* Footer Add / Stepper */}
        <div className="p-4 border-t border-[#d6ddce] bg-[#e9efdf] flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Subtotal</div>
            <div className="text-base font-bold text-gray-900">
              ₹{quantityInCart > 0 ? product.sellingPrice * quantityInCart : product.sellingPrice}
            </div>
          </div>

          {quantityInCart === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-[#1d5a3e] hover:bg-[#143d29] text-white font-bold text-xs px-6 py-3 rounded-2xl transition-all shadow-xs flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Basket</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#1d5a3e] text-white rounded-2xl shadow-xs overflow-hidden">
                <button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                  className="px-3.5 py-2.5 hover:bg-[#143d29] transition-colors active:scale-90"
                  aria-label="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-bold min-w-[28px] text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                  disabled={quantityInCart >= product.stockQuantity}
                  className="px-3.5 py-2.5 hover:bg-[#143d29] disabled:opacity-40 transition-colors active:scale-90"
                  aria-label="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={onClose}
                className="bg-white hover:bg-gray-100 text-[#143d29] border border-[#d6ddce] text-xs font-bold px-4 py-2.5 rounded-2xl"
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
