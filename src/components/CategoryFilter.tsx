'use client';

import React from 'react';
import { SlidersHorizontal, ChevronDown, X, RotateCcw } from 'lucide-react';

export type SortKey = 'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'DISCOUNT_DESC' | 'RATING_DESC';

interface CategoryFilterProps {
  categories: string[];
  brands: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  selectedPriceRange: string;
  onSelectPriceRange: (range: string) => void;
  sortBy: SortKey;
  onSortChange: (sort: SortKey) => void;
  activeFilterCount: number;
  onResetFilters: () => void;
  onOpenMobileFilter: () => void;
  resultCount: number;
}

const PRICE_CHIPS = [
  { id: 'ALL', label: 'Any Price' },
  { id: 'UNDER_100', label: 'Under ₹100' },
  { id: '100_TO_200', label: '₹100 – ₹200' },
  { id: 'ABOVE_200', label: 'Above ₹200' },
];

export function CategoryFilter({
  categories,
  brands,
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  selectedPriceRange,
  onSelectPriceRange,
  sortBy,
  onSortChange,
  activeFilterCount,
  onResetFilters,
  onOpenMobileFilter,
  resultCount,
}: CategoryFilterProps) {
  return (
    <div className="sticky top-16 sm:top-[72px] z-30 -mx-3 sm:-mx-5 px-3 sm:px-5 py-2.5 bg-[#F5F7FA]/95 backdrop-blur-md border-b border-gray-200/70 space-y-2.5">
      {/* Row 1: Category Horizontal Pill Rail + Sort/Mobile Filter */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => onSelectCategory('ALL')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#0C831F] text-white shadow-xs shadow-[#0C831F]/25'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:text-gray-950'
            }`}
          >
            All Remedies
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0C831F] text-white shadow-xs shadow-[#0C831F]/25'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:text-gray-950'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right Controls: Mobile Filters + Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileFilter}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-2xs cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0C831F]" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#0C831F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
              className="appearance-none bg-white border border-gray-200 hover:border-gray-300 rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#0C831F] cursor-pointer shadow-2xs"
              aria-label="Sort products"
            >
              <option value="FEATURED">Sort: Popular</option>
              <option value="DISCOUNT_DESC">Sort: Biggest Discount</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="RATING_DESC">Sort: Top Rated</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 2 (Desktop): Brand + Price Quick Chips + Count */}
      <div className="hidden lg:flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Brand Select Pill */}
          <div className="relative">
            <select
              value={selectedBrand}
              onChange={(e) => onSelectBrand(e.target.value)}
              className={`appearance-none rounded-lg pl-2.5 pr-6 py-1 text-[11.5px] font-bold border transition-colors cursor-pointer focus:outline-none ${
                selectedBrand !== 'ALL'
                  ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0C831F]'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
              aria-label="Filter by brand"
            >
              <option value="ALL">Brand: All ({brands.length})</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1.5 pointer-events-none" />
          </div>

          <span className="h-4 w-px bg-gray-200" />

          {/* Price Chips */}
          <div className="flex items-center gap-1.5">
            {PRICE_CHIPS.map((chip) => {
              const active = selectedPriceRange === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onSelectPriceRange(chip.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer border ${
                    active
                      ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0C831F]'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-gray-500 tabular-nums shrink-0">
          Showing <strong className="text-gray-900">{resultCount}</strong> in-stock{' '}
          {resultCount === 1 ? 'remedy' : 'remedies'}
        </div>
      </div>

      {/* Active filter removable chips on Mobile */}
      {activeFilterCount > 0 && (
        <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar">
          {selectedBrand !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectBrand('ALL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF3] border border-[#BBF7D0] text-[#0C831F] text-[11px] font-bold shrink-0 cursor-pointer"
            >
              <span>{selectedBrand}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedPriceRange !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectPriceRange('ALL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF3] border border-[#BBF7D0] text-[#0C831F] text-[11px] font-bold shrink-0 cursor-pointer"
            >
              <span>
                {PRICE_CHIPS.find((p) => p.id === selectedPriceRange)?.label}
              </span>
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-bold text-rose-600 px-2 py-1 shrink-0 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
