'use client';

import React from 'react';
import { Search, X, Sparkles, Filter } from 'lucide-react';
import { ProductCategory, BrandName } from '@/types';

interface CategoryFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  categories: string[];
  brands: string[];
}

export function CategoryFilter({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  categories,
  brands,
}: CategoryFilterProps) {
  return (
    <div className="space-y-3">
      {/* Instant Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Ayurvedic medicine, health concern or brand (e.g. Zandu, Isabgol, Pain)..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-emerald-200/80 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Health Concerns Horizontal Rail (1mg / Apollo style) */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Shop by Health Concern:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onSelectCategory('ALL')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full font-medium transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                  : 'bg-emerald-50/80 text-emerald-950 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Selector Rail */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
          <Filter className="w-3 h-3 text-gray-400" />
          <span>Top Trusted Brands:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onSelectBrand('ALL')}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedBrand === 'ALL'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Brands
          </button>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => onSelectBrand(brand)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedBrand === brand
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
