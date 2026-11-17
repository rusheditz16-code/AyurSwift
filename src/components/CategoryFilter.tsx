'use client';

import React from 'react';
import { Search, X, Sparkles, Filter } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Search Input with Neon Accent */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search authentic Ayurvedic remedies, health concerns, or brands (e.g. Zandu, Isabgol, Pain)..."
          className="w-full pl-10 pr-9 py-3 rounded-2xl border border-white/[0.1] bg-black/40 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Trending Search Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar text-xs">
        <span className="text-gray-400 shrink-0 text-[11px] font-semibold uppercase tracking-wider">
          Trending:
        </span>
        {TRENDING_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onSearchChange(tag)}
            className="whitespace-nowrap px-2.5 py-1 bg-white/[0.04] hover:bg-emerald-500/10 hover:text-emerald-300 text-gray-300 rounded-lg border border-white/[0.06] hover:border-emerald-500/30 transition-all text-[11px]"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Health Concerns Horizontal Rail (Digital Gravity Pill Style) */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Shop by Health Concern:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onSelectCategory('ALL')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-white/[0.03] text-gray-400 hover:text-white border border-white/[0.08] hover:border-emerald-500/40'
            }`}
          >
            All Medicines
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-white/[0.03] text-gray-400 hover:text-white border border-white/[0.08] hover:border-emerald-500/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Selector Rail */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 mb-2">
          <Filter className="w-3 h-3 text-emerald-400" />
          <span>Verified Ayurvedic Brands:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onSelectBrand('ALL')}
            className={`whitespace-nowrap px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              selectedBrand === 'ALL'
                ? 'bg-white text-black'
                : 'bg-white/[0.04] text-gray-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            All Brands
          </button>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => onSelectBrand(brand)}
              className={`whitespace-nowrap px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                selectedBrand === brand
                  ? 'bg-emerald-500 text-black font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white border border-white/[0.06] hover:border-emerald-500/30'
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
