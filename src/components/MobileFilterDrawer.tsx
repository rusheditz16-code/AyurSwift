'use client';

import React, { useEffect } from 'react';
import { X, SlidersHorizontal, RotateCcw, Check, Zap, Truck } from 'lucide-react';
import { Product } from '@/types';
import { DELIVERY_PROMISE } from '@/lib/initialData';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  selectedPriceRange: string;
  onSelectPriceRange: (range: string) => void;
  selectedDispatch: string;
  onSelectDispatch: (dispatch: string) => void;
  availableCategories: string[];
  availableBrands: string[];
  onResetFilters: () => void;
  totalFilteredCount: number;
}

const PRICE_RANGES = [
  { id: 'ALL', label: 'Any Price' },
  { id: 'UNDER_100', label: 'Under ₹100' },
  { id: '100_TO_200', label: '₹100 to ₹200' },
  { id: 'ABOVE_200', label: 'Above ₹200' },
];

export function MobileFilterDrawer({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  selectedPriceRange,
  onSelectPriceRange,
  selectedDispatch,
  onSelectDispatch,
  availableCategories,
  availableBrands,
  onResetFilters,
  totalFilteredCount,
}: MobileFilterDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-70 bg-slate-950/55 backdrop-blur-xs flex items-end justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-filter-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-t-3xl max-h-[86vh] flex flex-col overflow-hidden shadow-2xl animate-sheet-up"
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#0C831F]" />
            <h3 id="mobile-filter-title" className="font-extrabold text-base text-gray-950">
              Filter Remedies
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-bold text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto thin-scrollbar space-y-5 flex-1">
          {/* Health Concern */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              Health Concern
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelectCategory('ALL')}
                aria-pressed={selectedCategory === 'ALL'}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                {selectedCategory === 'ALL' && <Check className="w-3.5 h-3.5" />}
                <span>All Categories</span>
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  {selectedCategory === cat && <Check className="w-3.5 h-3.5" />}
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Dispatch Mode */}
          <div className="space-y-2.5 pt-3 border-t border-gray-100">
            <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              Delivery Dispatch Mode
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onSelectDispatch('ALL')}
                aria-pressed={selectedDispatch === 'ALL'}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedDispatch === 'ALL'
                    ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <span>All Delivery Modes (Bhavnagar &amp; All India)</span>
                {selectedDispatch === 'ALL' && <Check className="w-4 h-4 text-[#0C831F]" />}
              </button>
              <button
                type="button"
                onClick={() => onSelectDispatch('RAPIDO_CITY')}
                aria-pressed={selectedDispatch === 'RAPIDO_CITY'}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedDispatch === 'RAPIDO_CITY'
                    ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{DELIVERY_PROMISE.localLabel}</span>
                </span>
                {selectedDispatch === 'RAPIDO_CITY' && <Check className="w-4 h-4 text-[#0C831F]" />}
              </button>
              <button
                type="button"
                onClick={() => onSelectDispatch('COURIER_OUTSIDE')}
                aria-pressed={selectedDispatch === 'COURIER_OUTSIDE'}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedDispatch === 'COURIER_OUTSIDE'
                    ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#0C831F]" />
                  <span>{DELIVERY_PROMISE.courierLabel}</span>
                </span>
                {selectedDispatch === 'COURIER_OUTSIDE' && (
                  <Check className="w-4 h-4 text-[#0C831F]" />
                )}
              </button>
            </div>
          </div>

          {/* Ayurvedic Brand */}
          <div className="space-y-2.5 pt-3 border-t border-gray-100">
            <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              Ayurvedic Brand
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelectBrand('ALL')}
                aria-pressed={selectedBrand === 'ALL'}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedBrand === 'ALL'
                    ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                All Brands
              </button>
              {availableBrands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => onSelectBrand(brand)}
                  aria-pressed={selectedBrand === brand}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedBrand === brand
                      ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2.5 pt-3 border-t border-gray-100">
            <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              Price Range
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => onSelectPriceRange(range.id)}
                  aria-pressed={selectedPriceRange === range.id}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                    selectedPriceRange === range.id
                      ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#0C831F] hover:bg-[#096B19] text-white font-extrabold text-sm py-3 rounded-xl shadow-md shadow-[#0C831F]/25 transition-all active:scale-98 cursor-pointer tabular-nums"
          >
            Show {totalFilteredCount} In-Stock {totalFilteredCount === 1 ? 'Remedy' : 'Remedies'}
          </button>
        </div>
      </div>
    </div>
  );
}
