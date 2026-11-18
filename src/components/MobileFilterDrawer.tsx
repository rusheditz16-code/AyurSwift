'use client';

import React from 'react';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { Product } from '@/types';

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
  onSelectDispatch: (speed: string) => void;
  availableCategories: string[];
  availableBrands: string[];
  onResetFilters: () => void;
  totalFilteredCount: number;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  products,
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f8f3] w-full max-w-xs h-full flex flex-col shadow-2xl border-l border-[#d6ddce] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#d6ddce] flex items-center justify-between bg-[#e9efdf]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#1d5a3e]" />
            <h3 className="font-serif font-bold text-sm text-[#143d29]">Filter Medicines</h3>
          </div>
          <div className="flex items-center gap-2">
            {(selectedCategory !== 'ALL' ||
              selectedBrand !== 'ALL' ||
              selectedPriceRange !== 'ALL' ||
              selectedDispatch !== 'ALL') && (
              <button
                onClick={onResetFilters}
                className="text-[11px] font-bold text-[#1d5a3e] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center border border-[#d6ddce]"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Filters */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs divide-y divide-[#d6ddce]/60">
          {/* 1. Category */}
          <div className="space-y-2">
            <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px] block">
              Health Concern / Category
            </span>
            <div className="space-y-1">
              <label
                onClick={() => onSelectCategory('ALL')}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#e9efdf] cursor-pointer"
              >
                <span className={selectedCategory === 'ALL' ? 'font-bold text-[#1d5a3e]' : 'text-gray-700'}>
                  All Categories
                </span>
                {selectedCategory === 'ALL' && <Check className="w-3.5 h-3.5 text-[#1d5a3e]" />}
              </label>

              {availableCategories.map((cat) => {
                const count = products.filter(
                  (p) => p.isLive && p.stockQuantity > 0 && p.category === cat
                ).length;
                const isSelected = selectedCategory === cat;

                return (
                  <label
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#e9efdf] cursor-pointer"
                  >
                    <span className={isSelected ? 'font-bold text-[#1d5a3e]' : 'text-gray-700'}>
                      {cat} ({count})
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#1d5a3e]" />}
                  </label>
                );
              })}
            </div>
          </div>

          {/* 2. Brand */}
          <div className="pt-4 space-y-2">
            <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px] block">
              Ayurvedic Brand
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <label
                onClick={() => onSelectBrand('ALL')}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#e9efdf] cursor-pointer"
              >
                <span className={selectedBrand === 'ALL' ? 'font-bold text-[#1d5a3e]' : 'text-gray-700'}>
                  All Brands
                </span>
                {selectedBrand === 'ALL' && <Check className="w-3.5 h-3.5 text-[#1d5a3e]" />}
              </label>

              {availableBrands.map((brand) => {
                const isSelected = selectedBrand === brand;
                return (
                  <label
                    key={brand}
                    onClick={() => onSelectBrand(brand)}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#e9efdf] cursor-pointer"
                  >
                    <span className={isSelected ? 'font-bold text-[#1d5a3e]' : 'text-gray-700'}>
                      {brand}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#1d5a3e]" />}
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. Dispatch Speed */}
          <div className="pt-4 space-y-2">
            <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px] block">
              Dispatch Speed
            </span>
            <div className="space-y-1">
              {[
                { id: 'ALL', label: 'All Options' },
                { id: 'RAPIDO', label: '⚡ 30–45 Mins In-City (Rapido)' },
                { id: 'COURIER', label: '📦 All-India Courier (2–4 Days)' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => onSelectDispatch(opt.id)}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#e9efdf] cursor-pointer"
                >
                  <span className={selectedDispatch === opt.id ? 'font-bold text-[#1d5a3e]' : 'text-gray-700'}>
                    {opt.label}
                  </span>
                  {selectedDispatch === opt.id && <Check className="w-3.5 h-3.5 text-[#1d5a3e]" />}
                </label>
              ))}
            </div>
          </div>

          {/* 4. Price Range */}
          <div className="pt-4 space-y-2">
            <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px] block">
              Price Range
            </span>
            <div className="space-y-1">
              {[
                { id: 'ALL', label: 'All Prices' },
                { id: 'UNDER_100', label: 'Under ₹100' },
                { id: '100_TO_200', label: '₹100 to ₹200' },
                { id: 'ABOVE_200', label: 'Above ₹200' },
              ].map((range) => (
                <label
                  key={range.id}
                  onClick={() => onSelectPriceRange(range.id)}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#e9efdf] cursor-pointer"
                >
                  <span className={selectedPriceRange === range.id ? 'font-bold text-[#1d5a3e]' : 'text-gray-700'}>
                    {range.label}
                  </span>
                  {selectedPriceRange === range.id && <Check className="w-3.5 h-3.5 text-[#1d5a3e]" />}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Footer */}
        <div className="p-3 bg-[#e9efdf] border-t border-[#d6ddce] flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-700">
            {totalFilteredCount} medicines
          </span>
          <button
            onClick={onClose}
            className="bg-[#1d5a3e] hover:bg-[#143d29] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
