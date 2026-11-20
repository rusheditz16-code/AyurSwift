'use client';

import React, { useEffect } from 'react';
import { X, Upload, Plus, TrendingUp } from 'lucide-react';
import { Product } from '@/types';

interface AdminProductDrawerProps {
  isOpen: boolean;
  editingProductId: string | null;
  newProd: Partial<Product>;
  onChangeProd: (p: Partial<Product>) => void;
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
  dark: boolean;
}

export function AdminProductDrawer({
  isOpen,
  editingProductId,
  newProd,
  onChangeProd,
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
  dark,
}: AdminProductDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cost = Number(newProd.agencyCostPrice) || 0;
  const mrp = Number(newProd.mrp) || 0;
  const sell = Number(newProd.sellingPrice) || 0;
  const unitProfit = sell - cost;
  const marginPct = sell > 0 ? Math.round((unitProfit / sell) * 100) : 0;
  const discountPct = mrp > 0 ? Math.max(0, Math.round(((mrp - sell) / mrp) * 100)) : 0;

  const inputClass = `w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15 ${
    dark
      ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400'
  }`;

  return (
    <div
      className="fixed inset-0 z-70 bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
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
            <h3 className="font-extrabold text-base">
              {editingProductId ? 'Edit Medicine SKU' : 'Add New Ayurvedic SKU'}
            </h3>
            <p className={`text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Changes sync immediately to storefront &amp; Supabase
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
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
              <div className="text-sm font-extrabold tabular-nums">{discountPct}% OFF</div>
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
                  Packshot Images ({uploadedImages.length})
                </div>
                <div className={`text-[10.5px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Upload front box, label &amp; ingredients. 1st image is storefront cover.
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0C831F] hover:bg-[#096B19] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
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
                    className={`relative group rounded-xl border p-1.5 aspect-square flex items-center justify-center overflow-hidden ${
                      dark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    <img src={imgSrc} alt={`View ${idx + 1}`} className="w-full h-full object-contain" />
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
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-rose-600 text-white p-1 rounded-full cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
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
                <Upload className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                <div className="text-xs font-bold">Click to select PNG / JPG / WebP images</div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png, image/jpeg, image/webp"
              onChange={onMultipleImageFiles}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => onImageUrlInputChange(e.target.value)}
                placeholder="Or paste image URL..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={onAddImageUrl}
                className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-extrabold shrink-0 cursor-pointer"
              >
                + URL
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1">Medicine Name *</label>
              <input
                type="text"
                value={newProd.name || ''}
                onChange={(e) => onChangeProd({ ...newProd, name: e.target.value })}
                placeholder="e.g. Zandu Balm Ultra Fast Relief"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Brand</label>
              <select
                value={newProd.brand || 'Dabur'}
                onChange={(e) => onChangeProd({ ...newProd, brand: e.target.value })}
                className={inputClass}
              >
                <option value="Dabur">Dabur</option>
                <option value="Zandu">Zandu</option>
                <option value="Himalaya">Himalaya</option>
                <option value="Baidyanath">Baidyanath</option>
                <option value="Patanjali">Patanjali</option>
                <option value="Dr. Ortho">Dr. Ortho</option>
                <option value="Vicco">Vicco</option>
                <option value="Hamdard">Hamdard</option>
                <option value="Charak">Charak</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1">Category</label>
              <select
                value={newProd.category || 'Joint & Muscle Pain'}
                onChange={(e) => onChangeProd({ ...newProd, category: e.target.value })}
                className={inputClass}
              >
                <option value="Joint & Muscle Pain">Joint &amp; Muscle Pain</option>
                <option value="Digestion & Acidity">Digestion &amp; Acidity</option>
                <option value="Immunity & Cold">Immunity &amp; Cold</option>
                <option value="Skin & Hair">Skin &amp; Hair</option>
                <option value="Daily Wellness">Daily Wellness</option>
                <option value="Liver & Detox">Liver &amp; Detox</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Pack Size *</label>
              <input
                type="text"
                value={newProd.packSize || ''}
                onChange={(e) => onChangeProd({ ...newProd, packSize: e.target.value })}
                placeholder="e.g. 25g Jar, 100ml Bottle"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1">Dosage Form</label>
              <select
                value={newProd.form || 'Balm'}
                onChange={(e) =>
                  onChangeProd({ ...newProd, form: e.target.value as Product['form'] })
                }
                className={inputClass}
              >
                <option value="Balm">Balm (Jar)</option>
                <option value="Tablets">Tablets (Bottle)</option>
                <option value="Syrup">Syrup (Bottle)</option>
                <option value="Oil">Oil (Bottle)</option>
                <option value="Churna">Churna (Tub)</option>
                <option value="Capsules">Capsules (Blister)</option>
                <option value="Gel">Gel (Tube)</option>
                <option value="Husk">Husk (Box)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Manufacturer</label>
              <input
                type="text"
                value={newProd.manufacturer || ''}
                onChange={(e) => onChangeProd({ ...newProd, manufacturer: e.target.value })}
                placeholder="e.g. Dabur India Ltd."
                className={inputClass}
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-bold mb-1">Cost (₹)</label>
              <input
                type="number"
                value={newProd.agencyCostPrice ?? 0}
                onChange={(e) =>
                  onChangeProd({ ...newProd, agencyCostPrice: Number(e.target.value) })
                }
                required
                className={`${inputClass} tabular-nums`}
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold mb-1">MRP (₹)</label>
              <input
                type="number"
                value={newProd.mrp ?? 0}
                onChange={(e) => onChangeProd({ ...newProd, mrp: Number(e.target.value) })}
                required
                className={`${inputClass} tabular-nums`}
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold mb-1">Sell (₹)</label>
              <input
                type="number"
                value={newProd.sellingPrice ?? 0}
                onChange={(e) =>
                  onChangeProd({ ...newProd, sellingPrice: Number(e.target.value) })
                }
                required
                className={`${inputClass} tabular-nums`}
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold mb-1">Stock</label>
              <input
                type="number"
                value={newProd.stockQuantity ?? 0}
                onChange={(e) =>
                  onChangeProd({ ...newProd, stockQuantity: Number(e.target.value) })
                }
                required
                className={`${inputClass} tabular-nums`}
              />
            </div>
          </div>

          {/* Clinical Fields */}
          <div>
            <label className="block text-[11px] font-bold mb-1">
              Primary Indications &amp; Benefits
            </label>
            <input
              type="text"
              value={newProd.indications || ''}
              onChange={(e) => onChangeProd({ ...newProd, indications: e.target.value })}
              placeholder="e.g. Fast relief from headaches & joint stiffness"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1">Dosage</label>
              <input
                type="text"
                value={newProd.dosage || ''}
                onChange={(e) => onChangeProd({ ...newProd, dosage: e.target.value })}
                placeholder="e.g. Apply 2-3 times daily"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1">Composition</label>
              <input
                type="text"
                value={newProd.composition || ''}
                onChange={(e) => onChangeProd({ ...newProd, composition: e.target.value })}
                placeholder="e.g. Mentha Satva, Gaultheria Oil"
                className={inputClass}
              />
            </div>
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
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              dark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin-sku-form"
            className="bg-[#0C831F] hover:bg-[#096B19] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            {editingProductId ? 'Update SKU' : 'Save New SKU'}
          </button>
        </div>
      </div>
    </div>
  );
}
