'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Upload, Plus, TrendingUp, Loader2, Eye, EyeOff } from 'lucide-react';
import { Product } from '@/types';

const PRESET_BRANDS = [
  'Dabur',
  'Zandu',
  'Himalaya',
  'Baidyanath',
  'Patanjali',
  'Dr. Ortho',
  'Moov',
  'Vicco',
  'Hamdard',
  'Charak',
];

const PRESET_CATEGORIES = [
  'Joint & Muscle Pain',
  'Digestion & Acidity',
  'Immunity & Cold',
  'Skin & Hair',
  'Liver & Detox',
  'Daily Wellness',
];

interface AdminProductDrawerProps {
  isOpen: boolean;
  editingProductId: string | null;
  newProd: Partial<Product>;
  onChangeProd: (p: Partial<Product>) => void;
  existingBrands?: string[];
  existingCategories?: string[];
  uploadedImages: string[];
  imageUrlInput: string;
  onImageUrlInputChange: (v: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onMultipleImageFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddImageUrl: () => void;
  onSetPrimaryImage: (idx: number) => void;
  onRemoveImage: (idx: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isSaving?: boolean;
  dark: boolean;
}

export function AdminProductDrawer({
  isOpen,
  editingProductId,
  newProd,
  onChangeProd,
  existingBrands = [],
  existingCategories = [],
  uploadedImages,
  imageUrlInput,
  onImageUrlInputChange,
  fileInputRef,
  onMultipleImageFiles,
  onAddImageUrl,
  onSetPrimaryImage,
  onRemoveImage,
  onSubmit,
  onClose,
  isSaving = false,
  dark,
}: AdminProductDrawerProps) {
  const brandOptions = Array.from(
    new Set([...PRESET_BRANDS, ...existingBrands.map((b) => b.trim()).filter(Boolean)])
  );
  const categoryOptions = Array.from(
    new Set([...PRESET_CATEGORIES, ...existingCategories.map((c) => c.trim()).filter(Boolean)])
  );

  const [useCustomBrand, setUseCustomBrand] = useState(false);
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const customBrandInputRef = useRef<HTMLInputElement>(null);
  const customCategoryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const initialBrand = String(newProd.brand ?? '').trim();
    setUseCustomBrand(Boolean(initialBrand) && !brandOptions.includes(initialBrand));
    const initialCat = String(newProd.category ?? '').trim();
    setUseCustomCategory(Boolean(initialCat) && !categoryOptions.includes(initialCat));
    // Re-sync custom brand/category modes only when opening the drawer or switching edited SKU
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingProductId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const cost = Number(newProd.agencyCostPrice) || 0;
  const mrp = Number(newProd.mrp) || 0;
  const sell = Number(newProd.sellingPrice) || 0;
  const stock = Math.max(0, Math.floor(Number(newProd.stockQuantity) || 0));
  const unitProfit = sell - cost;
  const marginPct = sell > 0 ? Math.round((unitProfit / sell) * 100) : 0;
  const discountPct = mrp > 0 ? Math.max(0, Math.round(((mrp - sell) / mrp) * 100)) : 0;

  const rawBrand = typeof newProd.brand === 'string' ? newProd.brand : '';
  const isCustomBrand =
    useCustomBrand || (rawBrand.trim().length > 0 && !brandOptions.includes(rawBrand));

  const rawCategory = typeof newProd.category === 'string' ? newProd.category : '';
  const isCustomCategory =
    useCustomCategory || (rawCategory.trim().length > 0 && !categoryOptions.includes(rawCategory));

  const inputClass = `w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15 ${
    dark
      ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400'
  }`;

  return (
    <div
      className="fixed inset-0 z-70 bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fade-in"
      onClick={() => !isSaving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-drawer-title"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl h-full flex flex-col shadow-2xl animate-drawer-right border-l ${
          dark
            ? 'bg-[#111827] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            dark ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div>
            <h3 id="admin-product-drawer-title" className="font-extrabold text-base">
              {editingProductId ? 'Edit Medicine SKU' : 'Add New Ayurvedic SKU'}
            </h3>
            <p className={`text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Saves directly to Supabase and updates the live storefront immediately
            </p>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Close product editor"
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-50 ${
              dark
                ? 'bg-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="admin-sku-form"
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto thin-scrollbar p-5 space-y-4"
        >
          {/* Live Profit & Margin Preview Strip */}
          <div className="rounded-2xl bg-gradient-to-r from-[#0A6B19] to-[#0C831F] text-white p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-100">
                  Live Profit Calculator
                </div>
                <div className="text-sm font-extrabold tabular-nums">
                  {unitProfit >= 0 ? `+₹${unitProfit}` : `-₹${Math.abs(unitProfit)}`} / unit ({marginPct}% margin)
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-emerald-100">Customer Sees</div>
              <div className="text-sm font-extrabold tabular-nums">
                {discountPct > 0 ? `${discountPct}% OFF` : 'MRP Price'}
              </div>
            </div>
          </div>

          {/* Multi-Image Upload Section */}
          <div
            className={`rounded-2xl border p-3.5 space-y-3 ${
              dark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50/70 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold">
                  Product Photos ({uploadedImages.length}/6)
                </div>
                <div className={`text-[10.5px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Upload real front/back pack photos (auto-compressed for fast loading). 1st image is cover.
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadedImages.length >= 6}
                className="bg-[#0C831F] hover:bg-[#096B19] disabled:opacity-50 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>

            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {uploadedImages.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    className={`relative group rounded-xl border p-0 aspect-[4/5] flex items-center justify-center overflow-hidden ${
                      dark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    <img src={imgSrc} alt={`View ${idx + 1}`} className="w-full h-full object-cover object-center" />
                    {idx === 0 ? (
                      <span className="absolute top-1 left-1 bg-[#0C831F] text-white text-[8.5px] font-extrabold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSetPrimaryImage(idx)}
                        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 bg-slate-900/85 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveImage(idx)}
                      aria-label={`Remove photo ${idx + 1}`}
                      className="absolute top-1 right-1 opacity-85 group-hover:opacity-100 bg-rose-600 text-white p-1 rounded-full cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {uploadedImages.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      dark
                        ? 'border-slate-700 text-slate-400 hover:border-emerald-500'
                        : 'border-slate-300 text-slate-500 hover:border-[#0C831F]'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Add</span>
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  dark
                    ? 'border-slate-700 hover:border-emerald-500'
                    : 'border-slate-300 hover:border-[#0C831F]'
                }`}
              >
                <Upload className="w-5 h-5 mx-auto text-[#0C831F] mb-1" />
                <div className="text-xs font-bold">Click to upload PNG, JPG or WebP packshots</div>
                <div className={`text-[10.5px] mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Optional — if none uploaded, a clean illustrative pack matches your dosage form
                </div>
              </div>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              ref={fileInputRef}
              onChange={onMultipleImageFiles}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => onImageUrlInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddImageUrl();
                  }
                }}
                placeholder="Or paste an https:// product image URL..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={onAddImageUrl}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shrink-0 cursor-pointer"
              >
                Add URL
              </button>
            </div>
          </div>

          {/* Core Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="admin-sku-name" className="block text-[11px] font-bold mb-1">
                Medicine Name *
              </label>
              <input
                id="admin-sku-name"
                type="text"
                value={newProd.name || ''}
                onChange={(e) => onChangeProd({ ...newProd, name: e.target.value })}
                placeholder="e.g. Zandu Balm Ultra Fast Relief"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="admin-sku-brand" className="block text-[11px] font-bold mb-1">
                Brand *
              </label>
              <select
                id="admin-sku-brand"
                value={isCustomBrand ? '__OTHER__' : rawBrand || 'Dabur'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__OTHER__') {
                    setUseCustomBrand(true);
                    const nextBrand = brandOptions.includes(rawBrand) ? '' : rawBrand;
                    const nextMfg =
                      !editingProductId && newProd.manufacturer === 'Dabur India Ltd.'
                        ? ''
                        : newProd.manufacturer;
                    onChangeProd({
                      ...newProd,
                      brand: nextBrand,
                      manufacturer: nextMfg,
                    });
                    setTimeout(() => customBrandInputRef.current?.focus(), 0);
                  } else {
                    setUseCustomBrand(false);
                    onChangeProd({
                      ...newProd,
                      brand: val,
                    });
                  }
                }}
                className={inputClass}
              >
                {brandOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="__OTHER__">+ Other / Add Custom Brand</option>
              </select>
            </div>
          </div>

          {isCustomBrand && (
            <div
              className={`rounded-xl border p-3 ${
                dark
                  ? 'bg-emerald-950/25 border-emerald-800/70'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <label htmlFor="admin-sku-custom-brand" className="block text-[11px] font-extrabold mb-1">
                Custom Brand Name *
              </label>
              <input
                ref={customBrandInputRef}
                id="admin-sku-custom-brand"
                type="text"
                value={rawBrand === 'Other' ? '' : rawBrand}
                onChange={(e) => onChangeProd({ ...newProd, brand: e.target.value })}
                placeholder="Type any brand name (e.g. Kottakkal, Sandu, Organic India)"
                required
                className={inputClass}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="admin-sku-category" className="block text-[11px] font-bold mb-1">
                Category *
              </label>
              <select
                id="admin-sku-category"
                value={isCustomCategory ? '__NEW_CATEGORY__' : rawCategory || 'Joint & Muscle Pain'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__NEW_CATEGORY__') {
                    setUseCustomCategory(true);
                    const nextCat = categoryOptions.includes(rawCategory) ? '' : rawCategory;
                    onChangeProd({ ...newProd, category: nextCat });
                    setTimeout(() => customCategoryInputRef.current?.focus(), 0);
                  } else {
                    setUseCustomCategory(false);
                    onChangeProd({ ...newProd, category: val });
                  }
                }}
                className={inputClass}
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__NEW_CATEGORY__">+ Add New Category</option>
              </select>
            </div>
            <div>
              <label htmlFor="admin-sku-pack" className="block text-[11px] font-bold mb-1">
                Pack Size *
              </label>
              <input
                id="admin-sku-pack"
                type="text"
                value={newProd.packSize || ''}
                onChange={(e) => onChangeProd({ ...newProd, packSize: e.target.value })}
                placeholder="e.g. 25g Jar, 100ml Bottle"
                required
                className={inputClass}
              />
            </div>
          </div>

          {isCustomCategory && (
            <div
              className={`rounded-xl border p-3 ${
                dark
                  ? 'bg-emerald-950/25 border-emerald-800/70'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <label
                htmlFor="admin-sku-custom-category"
                className="block text-[11px] font-extrabold mb-1"
              >
                New Category Name *
              </label>
              <input
                ref={customCategoryInputRef}
                id="admin-sku-custom-category"
                type="text"
                maxLength={80}
                value={rawCategory}
                onChange={(e) => onChangeProd({ ...newProd, category: e.target.value })}
                placeholder="e.g. Diabetes Care, Women's Wellness, Baby Care, Eye Care"
                required
                className={inputClass}
              />
              <p className={`text-[10px] mt-1 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                Automatically appears on your storefront navigation, category tiles &amp; filters.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="admin-sku-form" className="block text-[11px] font-bold mb-1">
                Dosage Form
              </label>
              <select
                id="admin-sku-form"
                value={newProd.form || 'Balm'}
                onChange={(e) =>
                  onChangeProd({ ...newProd, form: e.target.value as Product['form'] })
                }
                className={inputClass}
              >
                <option value="Balm">Balm (Jar)</option>
                <option value="Gel">Gel / Paste (Tube / Jar)</option>
                <option value="Cream">Cream / Ointment</option>
                <option value="Powder">Powder</option>
                <option value="Soap">Soap (Bar)</option>
                <option value="Toothpaste">Toothpaste</option>
                <option value="Toothbrush">Toothbrush</option>
                <option value="Tablets">Tablets (Bottle)</option>
                <option value="Capsules">Capsules (Blister)</option>
                <option value="Syrup">Syrup (Bottle)</option>
                <option value="Oil">Oil (Bottle)</option>
                <option value="Drops">Drops</option>
                <option value="Lotion">Lotion</option>
                <option value="Spray">Spray (Can)</option>
                <option value="Churna">Churna (Tub)</option>
                <option value="Husk">Husk (Box)</option>
              </select>
            </div>
            <div>
              <label htmlFor="admin-sku-mfg" className="block text-[11px] font-bold mb-1">
                Manufacturer
              </label>
              <input
                id="admin-sku-mfg"
                type="text"
                value={newProd.manufacturer || ''}
                onChange={(e) => onChangeProd({ ...newProd, manufacturer: e.target.value })}
                placeholder="e.g. Dabur India Ltd."
                className={inputClass}
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label htmlFor="admin-sku-cost" className="block text-[10.5px] font-bold mb-1">
                Cost (₹)
              </label>
              <input
                id="admin-sku-cost"
                type="number"
                min={0}
                step="0.01"
                value={newProd.agencyCostPrice ?? 0}
                onChange={(e) =>
                  onChangeProd({ ...newProd, agencyCostPrice: Number(e.target.value) })
                }
                required
                className={`${inputClass} tabular-nums`}
              />
            </div>
            <div>
              <label htmlFor="admin-sku-mrp" className="block text-[10.5px] font-bold mb-1">
                MRP (₹) *
              </label>
              <input
                id="admin-sku-mrp"
                type="number"
                min={1}
                step="0.01"
                value={newProd.mrp ?? 0}
                onChange={(e) => onChangeProd({ ...newProd, mrp: Number(e.target.value) })}
                required
                className={`${inputClass} tabular-nums`}
              />
            </div>
            <div>
              <label htmlFor="admin-sku-sell" className="block text-[10.5px] font-bold mb-1">
                Sell (₹) *
              </label>
              <input
                id="admin-sku-sell"
                type="number"
                min={1}
                step="0.01"
                value={newProd.sellingPrice ?? 0}
                onChange={(e) =>
                  onChangeProd({ ...newProd, sellingPrice: Number(e.target.value) })
                }
                required
                className={`${inputClass} tabular-nums`}
              />
            </div>
            <div>
              <label htmlFor="admin-sku-stock" className="block text-[10.5px] font-bold mb-1">
                Stock *
              </label>
              <input
                id="admin-sku-stock"
                type="number"
                min={0}
                value={newProd.stockQuantity ?? 0}
                onChange={(e) =>
                  onChangeProd({ ...newProd, stockQuantity: Number(e.target.value) })
                }
                required
                className={`${inputClass} tabular-nums`}
              />
            </div>
          </div>

          {/* Storefront Visibility Toggle + Highlight Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className={`rounded-xl border p-3 flex items-center justify-between gap-2 ${
                dark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="text-[11px] font-extrabold">Storefront Visibility</div>
                <div className={`text-[10px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stock <= 0
                    ? 'Add stock (>0) to publish live'
                    : newProd.isLive !== false
                    ? 'Visible to customers right away'
                    : 'Saved as hidden draft'}
                </div>
              </div>
              <button
                type="button"
                disabled={stock <= 0}
                onClick={() => onChangeProd({ ...newProd, isLive: !(newProd.isLive !== false) })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer disabled:opacity-45 ${
                  stock > 0 && newProd.isLive !== false
                    ? 'bg-[#0C831F] text-white'
                    : dark
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {stock > 0 && newProd.isLive !== false ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hidden</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <label htmlFor="admin-sku-badge" className="block text-[11px] font-bold mb-1">
                Highlight Badge (optional)
              </label>
              <input
                id="admin-sku-badge"
                type="text"
                maxLength={40}
                value={newProd.badgeText || ''}
                onChange={(e) => onChangeProd({ ...newProd, badgeText: e.target.value })}
                placeholder="e.g. Fast Relief, Classical Oil, 40+ Herbs"
                className={inputClass}
              />
            </div>
          </div>

          {/* Clinical & Product Details */}
          <div>
            <label htmlFor="admin-sku-indications" className="block text-[11px] font-bold mb-1">
              Primary Indications &amp; Benefits
            </label>
            <textarea
              id="admin-sku-indications"
              rows={2}
              value={newProd.indications || ''}
              onChange={(e) => onChangeProd({ ...newProd, indications: e.target.value })}
              placeholder="e.g. Targeted relief for headaches, neck stiffness, back pain & joint aches."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="admin-sku-dosage" className="block text-[11px] font-bold mb-1">
                Dosage &amp; Method of Use
              </label>
              <input
                id="admin-sku-dosage"
                type="text"
                value={newProd.dosage || ''}
                onChange={(e) => onChangeProd({ ...newProd, dosage: e.target.value })}
                placeholder="e.g. Apply or take 2-3 times daily"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="admin-sku-composition" className="block text-[11px] font-bold mb-1">
                Key Ayurvedic Composition
              </label>
              <input
                id="admin-sku-composition"
                type="text"
                value={newProd.composition || ''}
                onChange={(e) => onChangeProd({ ...newProd, composition: e.target.value })}
                placeholder="e.g. Mentha Satva, Gaultheria Oil"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-sku-safety" className="block text-[11px] font-bold mb-1">
              Safety &amp; Storage Advice
            </label>
            <input
              id="admin-sku-safety"
              type="text"
              value={newProd.safetyAdvice || ''}
              onChange={(e) => onChangeProd({ ...newProd, safetyAdvice: e.target.value })}
              placeholder="e.g. Store in a cool dry place away from direct sunlight."
              className={inputClass}
            />
          </div>
        </form>

        {/* Footer */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-end gap-2.5 shrink-0 ${
            dark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 ${
              dark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin-sku-form"
            disabled={isSaving}
            className="bg-[#0C831F] hover:bg-[#096B19] disabled:opacity-60 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {isSaving
                ? 'Saving to Storefront...'
                : editingProductId
                ? 'Update & Publish SKU'
                : 'Save & Publish SKU'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
