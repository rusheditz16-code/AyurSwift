'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

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

const TRENDING_TAGS = ['Zandu Balm', 'Pudin Hara', 'Chyawanprash', 'Liv.52', 'Isabgol', 'Moov Spray'];

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
    <div className="space-y-3.5">
      {/* Clean Ivory Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718277]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search medicines, pain relief, digestion, cough (e.g. Zandu, Isabgol)..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#d6ddce] bg-white text-xs sm:text-sm text-[#143d29] placeholder:text-[#718277] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e] transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718277] hover:text-[#143d29] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Search Tags */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
        <span className="text-[#526359] shrink-0 text-[11px] font-semibold">
          Popular:
        </span>
        {TRENDING_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onSearchChange(tag)}
            className="whitespace-nowrap px-2.5 py-1 bg-[#e9efdf] hover:bg-[#d6ddce] text-[#143d29] rounded-lg text-[11px] font-medium transition-colors border border-[#d6ddce]"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Category Horizontal Pills */}
      <div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onSelectCategory('ALL')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-[#1d5a3e] text-white shadow-2xs'
                : 'bg-white border border-[#d6ddce] text-[#143d29] hover:bg-[#e9efdf]'
            }`}
          >
            All Medicines
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1d5a3e] text-white shadow-2xs'
                  : 'bg-white border border-[#d6ddce] text-[#143d29] hover:bg-[#e9efdf]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Horizontal Filter */}
      {brands.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          <span className="text-[#526359] shrink-0 font-medium">Brands:</span>
          <button
            onClick={() => onSelectBrand('ALL')}
            className={`whitespace-nowrap px-2.5 py-0.5 rounded-lg font-bold transition-colors ${
              selectedBrand === 'ALL'
                ? 'bg-[#143d29] text-white'
                : 'bg-[#e9efdf] text-[#143d29] hover:bg-[#d6ddce]'
            }`}
          >
            All
          </button>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => onSelectBrand(brand)}
              className={`whitespace-nowrap px-2.5 py-0.5 rounded-lg font-bold transition-colors ${
                selectedBrand === brand
                  ? 'bg-[#143d29] text-white'
                  : 'bg-[#e9efdf] text-[#143d29] hover:bg-[#d6ddce]'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
