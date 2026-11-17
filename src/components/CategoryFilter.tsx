'use client';

import React from 'react';
import { Search, X, Sparkles, Filter, Activity, Heart, Shield, Flame, Droplets } from 'lucide-react';

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

const TRENDING_TAGS = ['Zandu Balm', 'Pudin Hara', 'Chyawanprash', 'Liv.52', 'Isabgol', 'Pain Oil'];

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
      {/* Search Input with Clear Button */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Ayurvedic medicines, health concerns, or brands (e.g. Zandu, Isabgol, Digestion)..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-emerald-200/90 bg-white text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent shadow-xs"
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

      {/* Trending Search Shortcuts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
        <span className="text-gray-400 shrink-0 font-medium">Trending:</span>
        {TRENDING_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onSearchChange(tag)}
            className="whitespace-nowrap px-2 py-0.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-600 rounded-md transition-colors text-[10.5px]"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Health Concerns Horizontal Rail (1mg / Apollo style) */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Shop by Health Concern:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onSelectCategory('ALL')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/80 font-medium'
            }`}
          >
            All Medicines
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-emerald-50/80 text-emerald-950 hover:bg-emerald-100 border border-emerald-200/80 font-medium'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Selector Rail */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 mb-1.5">
          <Filter className="w-3 h-3 text-gray-400" />
          <span>Verified Ayurvedic Brands:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onSelectBrand('ALL')}
            className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              selectedBrand === 'ALL'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Brands
          </button>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => onSelectBrand(brand)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                selectedBrand === brand
                  ? 'bg-emerald-800 text-white'
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
