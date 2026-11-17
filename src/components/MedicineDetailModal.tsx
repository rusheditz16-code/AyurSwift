'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Product } from '@/types';

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
  const [imageError, setImageError] = useState(false);
  if (!product) return null;

  const discountPercent = Math.round(
    ((product.mrp - product.sellingPrice) / product.mrp) * 100
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              {product.brand}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-600 font-medium">{product.category}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Image Showcase */}
          <div className="relative bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-center h-44">
            {product.imageUrl && !imageError ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                onError={() => setImageError(true)}
                className="max-h-full max-w-full object-contain mix-blend-multiply"
              />
            ) : (
              <div className="text-center">
                <span className="text-4xl">🌿</span>
                <p className="text-xs text-gray-500 mt-1 font-semibold">{product.name}</p>
              </div>
            )}
            <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
              <Zap className="w-3 h-3 fill-white" />
              <span>30-45 MINS DISPATCH</span>
            </div>
            <div className="absolute bottom-3 right-3 bg-white text-gray-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
              {product.packSize}
            </div>
          </div>

          {/* Title & Brand */}
          <div className="space-y-1">
            <h2 className="text-lg font-black text-gray-900 leading-snug">
              {product.name}
            </h2>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>Marketed by: <strong className="text-gray-700">{product.manufacturer}</strong></span>
              <span>•</span>
              <div className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{product.rating}</span>
                <span className="text-gray-400">({product.reviewCount} verified)</span>
              </div>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Home Dark Store Price
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-gray-900">
                  ₹{product.sellingPrice}
                </span>
                {product.mrp > product.sellingPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    MRP ₹{product.mrp}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-[11px] text-emerald-800 font-medium">
              <div className="flex items-center gap-1 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>GST Tax Invoice</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Genuine Wholesale Sourced</div>
            </div>
          </div>

          {/* Key Clinical Information */}
          <div className="space-y-3 text-xs">
            {/* Indications */}
            <div className="bg-white border border-gray-200 p-3.5 rounded-2xl space-y-1">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Primary Health Indications & Benefits</span>
              </div>
              <p className="text-gray-600 leading-relaxed font-normal">
                {product.indications}
              </p>
            </div>

            {/* Dosage */}
            {product.dosage && (
              <div className="bg-white border border-gray-200 p-3.5 rounded-2xl space-y-1">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Recommended Usage & Dosage</span>
                </div>
                <p className="text-gray-600 leading-relaxed font-normal">
                  {product.dosage}
                </p>
              </div>
            )}

            {/* Composition */}
            {product.composition && (
              <div className="bg-white border border-gray-200 p-3.5 rounded-2xl space-y-1">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">🌿</span>
                  <span>Active Ayurvedic Composition</span>
                </div>
                <p className="text-gray-600 leading-relaxed font-mono text-[11px]">
                  {product.composition}
                </p>
              </div>
            )}

            {/* Safety */}
            {product.safetyAdvice && (
              <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Storage & Safety Advice</span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  {product.safetyAdvice}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-gray-400 block font-bold uppercase">
              Total Amount
            </span>
            <span className="text-lg font-black text-gray-900">
              ₹{product.sellingPrice * Math.max(1, quantityInCart)}
            </span>
          </div>

          <div>
            {quantityInCart === 0 ? (
              <button
                onClick={() => onAddToCart(product)}
                className="bg-[#10847e] hover:bg-[#0c6b66] text-white font-black text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs transition-all active:scale-95"
              >
                ADD TO CART
              </button>
            ) : (
              <div className="flex items-center bg-[#10847e] text-white rounded-xl shadow-xs overflow-hidden">
                <button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                  className="px-3 py-2 hover:bg-[#0c6b66] transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 font-black text-sm min-w-[28px] text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                  className="px-3 py-2 hover:bg-[#0c6b66] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
