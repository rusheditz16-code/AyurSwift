'use client';

import React from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Search,
  Zap,
  Truck,
} from 'lucide-react';
import { DELIVERY_PROMISE } from '@/lib/initialData';

export type SortKey =
  | 'FEATURED'
  | 'PRICE_ASC'
  | 'PRICE_DESC'
  | 'DISCOUNT_DESC'
  | 'NAME_ASC';

interface CategoryFilterProps {
  categories: string[];
  brands: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  selectedPriceRange: string;
  onSelectPriceRange: (range: string) => void;
  selectedDispatch: string;
  onSelectDispatch: (dispatch: string) => void;
  sortBy: SortKey;
  onSortChange: (sort: SortKey) => void;
  activeFilterCount: number;
  onResetFilters: () => void;
  onOpenMobileFilter: () => void;
  resultCount: number;
  totalCount: number;
}

const PRICE_CHIPS = [
  { id: 'ALL', label: 'Any Price' },
  { id: 'UNDER_100', label: 'Under ₹100' },
  { id: '100_TO_200', label: '₹100 – ₹200' },
  { id: 'ABOVE_200', label: 'Above ₹200' },
];

const DISPATCH_OPTIONS = [
  { id: 'ALL', label: 'Delivery: All Modes' },
  { id: 'RAPIDO_CITY', label: `Bhavnagar (${DELIVERY_PROMISE.localTimeShort})` },
  { id: 'COURIER_OUTSIDE', label: `All-India (${DELIVERY_PROMISE.courierTimeShort})` },
];

export function CategoryFilter({
  categories,
  brands,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  selectedPriceRange,
  onSelectPriceRange,
  selectedDispatch,
  onSelectDispatch,
  sortBy,
  onSortChange,
  activeFilterCount,
  onResetFilters,
  onOpenMobileFilter,
  resultCount,
  totalCount,
}: CategoryFilterProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-2xs space-y-3">
      {/* Row 1: In-Catalog Search + Mobile Filter Trigger + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Inline Catalog Search */}
        <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
          <label htmlFor="catalog-inline-search" className="sr-only">
            Filter catalog by medicine name, brand, or ingredient
          </label>
          <Search
            className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="catalog-inline-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by name, herb or brand..."
            className="w-full pl-8.5 pr-8 py-2 text-xs bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 focus:border-[#0C831F] rounded-xl text-gray-900 placeholder:text-gray-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear catalog search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 cursor-pointer rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls: Mobile Filters + Sort */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={onOpenMobileFilter}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAF9] border border-gray-200 hover:border-[#0C831F] text-xs font-bold text-gray-800 cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0C831F]" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#0C831F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="catalog-sort-select" className="text-xs font-semibold text-gray-500 hidden sm:inline">
              Sort
            </label>
            <div className="relative">
              <select
                id="catalog-sort-select"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortKey)}
                className="appearance-none bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-gray-800 focus:bg-white focus:border-[#0C831F] cursor-pointer"
              >
                <option value="FEATURED">Featured</option>
                <option value="DISCOUNT_DESC">Highest Discount</option>
                <option value="PRICE_ASC">Price: Low to High</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="NAME_ASC">Name: A to Z</option>
              </select>
              <ChevronDown
                className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 (Desktop): Category, Brand, Dispatch & Price Filters */}
      <div className="hidden lg:flex items-center justify-between gap-3 pt-2.5 border-t border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Select */}
          <div className="relative">
            <label htmlFor="desktop-category-filter" className="sr-only">
              Filter by health category
            </label>
            <select
              id="desktop-category-filter"
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className={`appearance-none rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                selectedCategory !== 'ALL'
                  ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <option value="ALL">Category: All ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Brand Select */}
          <div className="relative">
            <label htmlFor="desktop-brand-filter" className="sr-only">
              Filter by Ayurvedic brand
            </label>
            <select
              id="desktop-brand-filter"
              value={selectedBrand}
              onChange={(e) => onSelectBrand(e.target.value)}
              className={`appearance-none rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                selectedBrand !== 'ALL'
                  ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <option value="ALL">Brand: All ({brands.length})</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Dispatch Mode Select */}
          <div className="relative">
            <label htmlFor="desktop-dispatch-filter" className="sr-only">
              Filter by delivery dispatch mode
            </label>
            <select
              id="desktop-dispatch-filter"
              value={selectedDispatch}
              onChange={(e) => onSelectDispatch(e.target.value)}
              className={`appearance-none rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                selectedDispatch !== 'ALL'
                  ? 'bg-teal-50 border-teal-600 text-teal-900'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {DISPATCH_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          <span className="h-4 w-px bg-gray-200" aria-hidden="true" />

          {/* Price Chips */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Price range filter">
            {PRICE_CHIPS.map((chip) => {
              const active = selectedPriceRange === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onSelectPriceRange(chip.id)}
                  aria-pressed={active}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    active
                      ? 'bg-[#ECFDF3] border-[#0C831F] text-[#0A5C16]'
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-gray-600 tabular-nums shrink-0">
          Showing <strong className="text-gray-950">{resultCount}</strong> of{' '}
          <strong className="text-gray-950">{totalCount}</strong>
        </div>
      </div>

      {/* Active Removable Filter Chips (Visible on Mobile & Desktop when filters applied) */}
      {(activeFilterCount > 0 || searchQuery.trim().length > 0) && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 lg:hidden">
          {selectedCategory !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectCategory('ALL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF3] border border-[#BBF7D0] text-[#0A5C16] text-[11px] font-bold cursor-pointer"
            >
              <span>{selectedCategory}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedBrand !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectBrand('ALL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF3] border border-[#BBF7D0] text-[#0A5C16] text-[11px] font-bold cursor-pointer"
            >
              <span>{selectedBrand}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedDispatch !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectDispatch('ALL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-[11px] font-bold cursor-pointer"
            >
              {selectedDispatch === 'RAPIDO_CITY' ? (
                <Zap className="w-3 h-3 text-amber-500" />
              ) : (
                <Truck className="w-3 h-3 text-[#0C831F]" />
              )}
              <span>
                {selectedDispatch === 'RAPIDO_CITY'
                  ? DELIVERY_PROMISE.localTimeShort
                  : DELIVERY_PROMISE.courierTimeShort}
              </span>
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedPriceRange !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectPriceRange('ALL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF3] border border-[#BBF7D0] text-[#0A5C16] text-[11px] font-bold cursor-pointer"
            >
              <span>{PRICE_CHIPS.find((p) => p.id === selectedPriceRange)?.label}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-bold text-rose-700 px-2 py-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
