'use client';

import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  Check,
  Plus,
  Minus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Product } from '@/types';
import { isVerifiedProductImageUrl } from '@/lib/initialData';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

interface AdminInventoryTabProps {
  products: Product[];
  searchFilter: string;
  onSearchFilterChange: (q: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (c: string) => void;
  onStockChange: (productId: string, delta: number) => void;
  onToggleLive: (productId: string) => void;
  onOpenAdd?: () => void;
  onOpenEdit: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onResetCatalog: () => void;
  resetToast: boolean;
  dark: boolean;
}

type StockQuickFilter = 'ALL' | 'LIVE' | 'LOW' | 'OUT' | 'HIDDEN';

export function AdminInventoryTab({
  products,
  searchFilter,
  onSearchFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onStockChange,
  onToggleLive,
  onOpenAdd,
  onOpenEdit,
  onDeleteProduct,
  onResetCatalog,
  resetToast,
  dark,
}: AdminInventoryTabProps) {
  const [stockFilter, setStockFilter] = useState<StockQuickFilter>('ALL');

  const totalUnits = products.reduce((a, p) => a + p.stockQuantity, 0);
  const totalCostVal = products.reduce((a, p) => a + p.agencyCostPrice * p.stockQuantity, 0);
  const totalSellVal = products.reduce((a, p) => a + p.sellingPrice * p.stockQuantity, 0);
  const totalProfit = totalSellVal - totalCostVal;
  const marginPct = totalSellVal > 0 ? Math.round((totalProfit / totalSellVal) * 100) : 0;

  const liveCount = products.filter((p) => p.isLive && p.stockQuantity > 0).length;
  const lowCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
  const outCount = products.filter((p) => p.stockQuantity === 0).length;
  const hiddenCount = products.filter((p) => !p.isLive || p.stockQuantity === 0).length;

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (stockFilter === 'LIVE' && (!p.isLive || p.stockQuantity <= 0)) return false;
    if (stockFilter === 'LOW' && (p.stockQuantity <= 0 || p.stockQuantity > 5)) return false;
    if (stockFilter === 'OUT' && p.stockQuantity !== 0) return false;
    if (stockFilter === 'HIDDEN' && p.isLive && p.stockQuantity > 0) return false;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const cardBg = dark
    ? 'bg-[#111827] border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  const quickChips: { id: StockQuickFilter; label: string; count: number }[] = [
    { id: 'ALL', label: 'All SKUs', count: products.length },
    { id: 'LIVE', label: 'Live', count: liveCount },
    { id: 'LOW', label: 'Low Stock (≤5)', count: lowCount },
    { id: 'OUT', label: 'Out of Stock', count: outCount },
    { id: 'HIDDEN', label: 'Hidden', count: hiddenCount },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Catalog SKUs',
            value: `${products.length}`,
            sub: `${liveCount} Live • ${outCount} Out of Stock`,
            accent: dark ? 'text-white' : 'text-slate-950',
          },
          {
            label: 'Shelf Units',
            value: `${totalUnits}`,
            sub: 'Verified dark-store stock',
            accent: dark ? 'text-white' : 'text-slate-950',
          },
          {
            label: 'Wholesale Cost Value',
            value: `₹${totalCostVal.toLocaleString('en-IN')}`,
            sub: 'Agency GST invoiced cost',
            accent: dark ? 'text-white' : 'text-slate-950',
          },
          {
            label: 'Realized Margin',
            value: `${marginPct}%`,
            sub: `+₹${totalProfit.toLocaleString('en-IN')} est. profit`,
            accent: 'text-emerald-500',
          },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-3.5 ${cardBg}`}>
            <div className={`text-[10.5px] font-extrabold uppercase tracking-wider ${muted}`}>
              {kpi.label}
            </div>
            <div className={`text-2xl font-extrabold tabular-nums mt-1 ${kpi.accent}`}>
              {kpi.value}
            </div>
            <div className={`text-[11px] font-medium mt-0.5 ${muted}`}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className={`rounded-2xl border p-3.5 space-y-3 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {quickChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStockFilter(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer tabular-nums ${
                  stockFilter === chip.id
                    ? 'bg-[#0C831F] text-white shadow-2xs'
                    : dark
                    ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {chip.label} ({chip.count})
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onResetCatalog}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              dark
                ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Catalog</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-500/10">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => onSearchFilterChange(e.target.value)}
              placeholder="Search medicine, brand, category..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium border focus:outline-none focus:border-[#0C831F] ${
                dark
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
              }`}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            aria-label="Filter inventory by category"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
              dark
                ? 'bg-slate-900 border-slate-800 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Categories ({products.length})</option>
            {Array.from(
              new Set([
                'Joint & Muscle Pain',
                'Digestion & Acidity',
                'Immunity & Cold',
                'Skin & Hair',
                'Liver & Detox',
                'Daily Wellness',
                ...products.map((p) => p.category).filter(Boolean),
              ])
            ).map((cat) => {
              const catCount = products.filter((p) => p.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({catCount})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {resetToast && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Catalog reset to verified authentic Ayurvedic SKUs with default stock!</span>
        </div>
      )}

      {/* Inventory Table */}
      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b text-[10.5px] font-extrabold uppercase tracking-wider ${
                dark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <tr>
                <th className="py-3 px-4">Medicine &amp; Brand</th>
                <th className="py-3 px-2">Pack</th>
                <th className="py-3 px-2 text-right">Cost</th>
                <th className="py-3 px-2 text-right">MRP</th>
                <th className="py-3 px-2 text-right">Sell</th>
                <th className="py-3 px-2 text-right">Margin</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Storefront</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-2.5">
                      <div className="font-extrabold text-sm">
                        {products.length === 0
                          ? 'Your store catalog is currently empty'
                          : 'No products match your filter'}
                      </div>
                      <p className={`text-xs ${muted}`}>
                        {products.length === 0
                          ? 'Add your own Ayurvedic products or restore the 20 starter SKUs directly to Supabase.'
                          : 'Try clearing your search or category filter.'}
                      </p>
                      {products.length === 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          {onOpenAdd && (
                            <button
                              type="button"
                              onClick={onOpenAdd}
                              className="bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-extrabold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add First Product</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={onResetCatalog}
                            className={`text-xs font-bold px-4 py-2 rounded-xl border inline-flex items-center gap-1.5 cursor-pointer ${
                              dark
                                ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore 20 Starter Products</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const unitProfit = product.sellingPrice - product.agencyCostPrice;
                  const margin =
                    product.sellingPrice > 0
                      ? Math.round((unitProfit / product.sellingPrice) * 100)
                      : 0;
                  const isZero = product.stockQuantity === 0;
                  const isLow = product.stockQuantity > 0 && product.stockQuantity <= 5;
                  const showPhoto = isVerifiedProductImageUrl(product.imageUrl);

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        dark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/90'
                      } ${isZero ? 'opacity-65' : ''}`}
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center overflow-hidden ${
                                showPhoto ? 'p-0' : 'p-0.5'
                              } ${
                                dark ? 'bg-slate-900 border-slate-700' : 'bg-[#F7FAF8] border-slate-200'
                              }`}
                            >
                              {showPhoto ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover object-center"
                                />
                              ) : (
                                <MedicinePackVisual product={product} compact className="w-full h-full" />
                              )}
                            </div>
                            {product.images && product.images.length > 1 && (
                              <span className="absolute -top-1 -right-1 bg-[#0C831F] text-white text-[8.5px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                                {product.images.length}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold line-clamp-1">{product.name}</div>
                            <div className={`text-[10.5px] font-semibold ${muted}`}>
                              <span className="text-emerald-500">{product.brand}</span> •{' '}
                              {product.category}
                              {product.badgeText ? ` • ${product.badgeText}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                    <td className={`py-2.5 px-2 font-medium whitespace-nowrap ${muted}`}>
                      {product.packSize}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-semibold tabular-nums ${muted}`}>
                      ₹{product.agencyCostPrice}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400 line-through tabular-nums">
                      ₹{product.mrp}
                    </td>
                    <td className="py-2.5 px-2 text-right font-extrabold tabular-nums">
                      ₹{product.sellingPrice}
                    </td>

                    <td className="py-2.5 px-2 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-extrabold text-[10.5px]">
                        +₹{unitProfit} ({margin}%)
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div
                        className={`inline-flex items-center rounded-xl border overflow-hidden ${
                          dark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onStockChange(product.id, -1)}
                          className="p-1.5 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                          title="Decrease stock"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span
                          className={`px-2 font-extrabold text-xs min-w-[30px] tabular-nums ${
                            isZero
                              ? 'text-rose-500'
                              : isLow
                              ? 'text-amber-500'
                              : dark
                              ? 'text-white'
                              : 'text-slate-900'
                          }`}
                        >
                          {product.stockQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onStockChange(product.id, 1)}
                          className="p-1.5 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                          title="Increase stock"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {isZero ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-500">
                          Auto-Hidden
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleLive(product.id)}
                          aria-label={`Toggle visibility for ${product.name}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                            product.isLive
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                              : dark
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              product.isLive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{product.isLive ? 'Live' : 'Hidden'}</span>
                        </button>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(product)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            dark
                              ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                              : 'text-slate-500 hover:text-[#0C831F] hover:bg-emerald-50'
                          }`}
                          title="Edit SKU"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete SKU"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
