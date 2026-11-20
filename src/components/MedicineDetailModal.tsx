'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Plus,
  Minus,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Images,
  Star,
  CheckCircle2,
  FlaskConical,
  ClipboardList,
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

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product) return null;

  const allImages: string[] =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
      ? [product.imageUrl]
      : [];

  const currentImage = allImages[activeImageIdx] || product.imageUrl;
  const isCurrentFailed = failedImages[activeImageIdx];
  const discountPercent = Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100);

  return (
    <div
      className="fixed inset-0 z-70 bg-slate-950/55 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 animate-sheet-up sm:animate-modal-pop"
      >
        {/* Top Bar */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0] text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full truncate">
              {product.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>30 Mins</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-950 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-5 space-y-4 bg-[#F8FAFC]">
          {/* Image Stage */}
          <div className="space-y-2.5">
            <div className="relative bg-white rounded-2xl p-5 border border-gray-200/80 flex items-center justify-center h-52 sm:h-60 overflow-hidden group">
              {currentImage && !isCurrentFailed ? (
                <img
                  src={currentImage}
                  alt={`${product.name} - View ${activeImageIdx + 1}`}
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [activeImageIdx]: true }))
                  }
                  className="max-h-full max-w-full object-contain transition-transform duration-300"
                />
              ) : (
                <MedicinePackVisual product={product} className="w-full h-full scale-105" />
              )}

              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-[#2563EB] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg shadow-xs tabular-nums">
                  {discountPercent}% OFF
                </span>
              )}

              <span className="absolute bottom-3 left-3 bg-white/95 border border-gray-200 text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                {product.packSize} • {product.form}
              </span>

              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-gray-900 shadow-md border border-gray-200 flex items-center justify-center cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-gray-900 shadow-md border border-gray-200 flex items-center justify-center cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute top-3 right-3 bg-gray-900/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Images className="w-3 h-3" />
                    <span>
                      {activeImageIdx + 1}/{allImages.length}
                    </span>
                  </div>
                </>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-13 h-13 rounded-xl border bg-white p-1 shrink-0 overflow-hidden cursor-pointer transition-all ${
                      idx === activeImageIdx
                        ? 'border-[#0C831F] ring-2 ring-[#0C831F]/30'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title, Brand & Rating */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#0C831F] uppercase tracking-wide">
                {product.brand}
              </span>
              <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-[11px] font-extrabold text-amber-900 tabular-nums">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{product.rating.toFixed(1)}</span>
                <span className="text-amber-700/80 font-semibold">
                  ({product.reviewCount.toLocaleString('en-IN')})
                </span>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-gray-950 leading-snug">
              {product.name}
            </h2>

            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                By <strong className="text-gray-800">{product.manufacturer}</strong>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[#0C831F] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock • Ready to Dispatch</span>
              </span>
            </div>
          </div>

          {/* Clinical Details Grid */}
          <div className="space-y-2.5">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-900 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0C831F]" />
                <span>Primary Indications &amp; Benefits</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{product.indications}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-900 uppercase tracking-wider">
                <ClipboardList className="w-3.5 h-3.5 text-[#0C831F]" />
                <span>Dosage &amp; Method of Use</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{product.dosage}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-900 uppercase tracking-wider">
                <FlaskConical className="w-3.5 h-3.5 text-[#0C831F]" />
                <span>Key Ayurvedic Composition</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{product.composition}</p>
            </div>

            {product.safetyAdvice && (
              <div className="bg-amber-50/90 rounded-2xl border border-amber-200/80 p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-[11px] uppercase tracking-wider text-amber-900">
                    Safety &amp; Storage
                  </span>
                  <span className="leading-relaxed">{product.safetyAdvice}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Price + Action Bar */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between gap-4 shrink-0 shadow-[0_-6px_20px_rgba(15,23,42,0.05)]">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-950 tabular-nums leading-none">
                ₹{product.sellingPrice}
              </span>
              {product.mrp > product.sellingPrice && (
                <span className="text-xs text-gray-400 line-through tabular-nums">
                  MRP ₹{product.mrp}
                </span>
              )}
            </div>
            <div className="text-[10.5px] text-gray-500 font-medium mt-0.5">
              Inclusive of all taxes • {product.packSize}
            </div>
          </div>

          {quantityInCart === 0 ? (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="bg-[#0C831F] hover:bg-[#096B19] text-white font-extrabold text-sm px-7 py-3 rounded-xl shadow-md shadow-[#0C831F]/25 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add to Cart</span>
            </button>
          ) : (
            <div className="h-11 flex items-center bg-[#0C831F] text-white rounded-xl shadow-md shadow-[#0C831F]/25 overflow-hidden">
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="px-4 h-full hover:bg-[#096B19] transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              <span className="px-3 font-extrabold text-sm min-w-[32px] text-center tabular-nums">
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                disabled={quantityInCart >= product.stockQuantity}
                className="px-4 h-full hover:bg-[#096B19] disabled:opacity-40 transition-colors cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
