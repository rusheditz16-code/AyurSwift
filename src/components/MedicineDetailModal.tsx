'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Truck,
  HeartHandshake,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Images,
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
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setActiveImageIdx(0);
    setFailedImages({});
  }, [product?.id]);

  if (!product) return null;

  const allImages: string[] = (product.images && product.images.length > 0)
    ? product.images
    : (product.imageUrl ? [product.imageUrl] : []);

  const currentImage = allImages[activeImageIdx] || product.imageUrl;
  const isCurrentFailed = failedImages[activeImageIdx];

  const discountPercent = Math.round(
    ((product.mrp - product.sellingPrice) / product.mrp) * 100
  );

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="relative bg-[#f8f8f3] rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#d6ddce] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#d6ddce] flex items-center justify-between bg-[#e9efdf] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-[#143d29] tracking-tight">
              Ayurvedic Medicine Details
            </span>
            <span className="bg-[#1d5a3e]/10 text-[#1d5a3e] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#1d5a3e]/20">
              {product.category}
            </span>
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
          {/* Medicine Packshot Showcase with Multiple Images Gallery */}
          <div className="space-y-2">
            <div className="relative bg-white rounded-2xl p-4 border border-[#d6ddce] flex items-center justify-center h-48 sm:h-56 overflow-hidden shadow-inner group">
              {currentImage && !isCurrentFailed ? (
                <img
                  src={currentImage}
                  alt={`${product.name} - View ${activeImageIdx + 1}`}
                  onError={() => setFailedImages((prev) => ({ ...prev, [activeImageIdx]: true }))}
                  className="max-h-full max-w-full object-contain p-2 transition-all duration-200"
                />
              ) : (
                <MedicinePackVisual
                  product={product}
                  className="w-full h-full transform scale-110"
                />
              )}

              <div className="absolute top-3 left-3 bg-[#1d5a3e] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                <Zap className="w-3 h-3 fill-[#c86326] text-[#c86326]" />
                <span>30–45M RAPIDO DISPATCH</span>
              </div>

              <div className="absolute bottom-3 right-3 bg-[#f8f8f3] text-gray-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-[#d6ddce] shadow-2xs">
                {product.packSize}
              </div>

              {/* Multiple Images Navigation Controls */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#143d29] shadow-md border border-[#d6ddce] flex items-center justify-center transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#143d29] shadow-md border border-[#d6ddce] flex items-center justify-center transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Images className="w-3 h-3" />
                    <span>{activeImageIdx + 1} / {allImages.length}</span>
                  </div>
                </>
              )}
            </div>

            {/* Multiple Images Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1">
                {allImages.map((img, idx) => {
                  const isActive = idx === activeImageIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-12 h-12 rounded-xl border bg-white p-1 shrink-0 overflow-hidden cursor-pointer transition-all ${
                        isActive
                          ? 'border-[#1d5a3e] ring-2 ring-[#1d5a3e] shadow-xs'
                          : 'border-[#d6ddce] opacity-70 hover:opacity-100'
                      }`}
                      aria-label={`Switch to image ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  );
                })}
              </div>
            )}
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
                  <span className="bg-[#c86326] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Stepper / Add */}
            <div>
              {quantityInCart === 0 ? (
                <button
                  onClick={() => onAddToCart(product)}
                  className="bg-[#1d5a3e] hover:bg-[#143d29] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Basket</span>
                </button>
              ) : (
                <div className="flex items-center bg-[#1d5a3e] text-white rounded-xl shadow-xs overflow-hidden">
                  <button
                    onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                    className="px-3 py-2 hover:bg-[#143d29] transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 font-bold text-xs sm:text-sm min-w-[28px] text-center">
                    {quantityInCart}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                    disabled={quantityInCart >= product.stockQuantity}
                    className="px-3 py-2 hover:bg-[#143d29] disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Key Indications */}
          <div className="space-y-1.5">
            <h4 className="font-serif text-xs font-bold text-[#143d29] uppercase tracking-wider">
              Primary Indications & Benefits
            </h4>
            <div className="p-3 bg-white rounded-xl border border-[#d6ddce] text-xs text-gray-700 leading-relaxed">
              {product.indications}
            </div>
          </div>

          {/* Dosage & Administration */}
          <div className="space-y-1.5">
            <h4 className="font-serif text-xs font-bold text-[#143d29] uppercase tracking-wider">
              Dosage & Method of Use
            </h4>
            <div className="p-3 bg-white rounded-xl border border-[#d6ddce] text-xs text-gray-700 leading-relaxed">
              {product.dosage}
            </div>
          </div>

          {/* Ayurvedic Composition */}
          <div className="space-y-1.5">
            <h4 className="font-serif text-xs font-bold text-[#143d29] uppercase tracking-wider">
              Key Ayurvedic Composition
            </h4>
            <div className="p-3 bg-white rounded-xl border border-[#d6ddce] text-xs text-gray-700 leading-relaxed font-mono text-[11px]">
              {product.composition}
            </div>
          </div>

          {/* Safety & Storage */}
          {product.safetyAdvice && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{product.safetyAdvice}</span>
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
            <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-[#d6ddce]">
              <ShieldCheck className="w-4 h-4 text-[#1d5a3e]" />
              <span>100% Agency Billed</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-[#d6ddce]">
              <Truck className="w-4 h-4 text-[#1d5a3e]" />
              <span>Rapido City Express</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#d6ddce] bg-[#e9efdf] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#143d29] hover:text-[#1d5a3e] px-4 py-1.5"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
