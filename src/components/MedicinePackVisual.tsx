'use client';

import React from 'react';
import { Product } from '@/types';

interface MedicinePackVisualProps {
  product: Product;
  className?: string;
}

export function MedicinePackVisual({ product, className = 'w-full h-36' }: MedicinePackVisualProps) {
  // Brand color theming
  let primaryColor = '#065F46'; // Default Emerald
  let accentColor = '#F59E0B';  // Gold
  let labelBg = '#ECFDF5';

  if (product.brand === 'Zandu') {
    primaryColor = '#991B1B'; // Rich Crimson / Red
    accentColor = '#FBBF24';
    labelBg = '#FEF2F2';
  } else if (product.brand === 'Dabur') {
    primaryColor = '#047857'; // Dabur Green
    accentColor = '#F59E0B';
    labelBg = '#ECFDF5';
  } else if (product.brand === 'Himalaya') {
    primaryColor = '#0F766E'; // Himalaya Teal
    accentColor = '#EA580C'; // Himalaya Orange
    labelBg = '#F0FDFA';
  } else if (product.brand === 'Baidyanath') {
    primaryColor = '#B45309'; // Classical Saffron Amber
    accentColor = '#D97706';
    labelBg = '#FFFBEB';
  } else if (product.brand === 'Patanjali') {
    primaryColor = '#C2410C'; // Patanjali Terracotta
    accentColor = '#15803D';
    labelBg = '#FFF7ED';
  }

  return (
    <div className={`relative flex items-center justify-center p-2 select-none ${className}`}>
      {/* Background Soft Glow */}
      <div
        className="absolute inset-0 opacity-15 rounded-2xl blur-lg"
        style={{ backgroundColor: primaryColor }}
      />

      {/* RENDER ACCORDING TO MEDICINE FORM */}
      {product.form === 'Balm' && (
        <div className="relative w-24 h-20 flex flex-col items-center justify-end">
          {/* Lid */}
          <div
            className="w-20 h-5 rounded-t-lg shadow-md border-b border-black/20"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="w-full h-1 bg-white/30 rounded-t-lg" />
          </div>
          {/* Glass Jar Body */}
          <div className="w-22 h-14 bg-gradient-to-b from-amber-50 to-amber-100 rounded-b-xl border border-amber-300 shadow-lg flex flex-col items-center justify-center p-1 relative overflow-hidden">
            <div className="text-[9px] font-black tracking-tight" style={{ color: primaryColor }}>
              {product.brand.toUpperCase()}
            </div>
            <div className="text-[7.5px] font-bold text-gray-800 line-clamp-1 max-w-[70px] text-center">
              {product.name.replace(product.brand, '').trim()}
            </div>
            <div className="text-[6.5px] font-semibold text-gray-500 mt-0.5">
              {product.packSize}
            </div>
            {/* Hologram strip */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300 opacity-80" />
          </div>
        </div>
      )}

      {product.form === 'Tablets' && (
        <div className="relative w-20 h-28 flex flex-col items-center justify-end">
          {/* Screw Cap */}
          <div className="w-12 h-4 bg-white rounded-t-md shadow-xs border border-gray-300 flex items-center justify-center">
            <div className="w-10 h-0.5 bg-gray-200" />
          </div>
          {/* Plastic White Bottle */}
          <div className="w-16 h-22 bg-gradient-to-r from-gray-50 via-white to-gray-100 rounded-lg border border-gray-200 shadow-md flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            <div className="w-full flex items-center justify-between">
              <span className="text-[7px] font-black" style={{ color: primaryColor }}>
                {product.brand}
              </span>
              <span className="text-[6px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                OTC
              </span>
            </div>
            {/* Center Label */}
            <div
              className="w-full py-1.5 px-1 rounded text-center my-auto border shadow-2xs"
              style={{ backgroundColor: labelBg, borderColor: `${primaryColor}40` }}
            >
              <div className="text-[8px] font-black line-clamp-1 leading-tight" style={{ color: primaryColor }}>
                {product.name.replace(product.brand, '').trim()}
              </div>
              <div className="text-[6.5px] font-semibold text-gray-600 mt-0.5">
                {product.packSize}
              </div>
            </div>
            <div className="text-[6px] text-gray-400 tracking-wider">GENUINE AYURVEDA</div>
          </div>
        </div>
      )}

      {product.form === 'Syrup' && (
        <div className="relative w-20 h-30 flex flex-col items-center justify-end">
          {/* Syrup Cap */}
          <div
            className="w-9 h-4 rounded-t-sm shadow-xs border-b border-black/15"
            style={{ backgroundColor: primaryColor }}
          />
          {/* Amber Bottle Neck */}
          <div className="w-6 h-3 bg-gradient-to-r from-amber-800 to-amber-900 border-x border-amber-950" />
          {/* Amber Glass Body */}
          <div className="w-16 h-22 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 rounded-b-lg border border-amber-950 shadow-lg flex flex-col items-center justify-center p-1 relative overflow-hidden">
            {/* Front Label */}
            <div className="w-14 bg-white/95 rounded p-1 text-center shadow-xs">
              <div className="text-[7.5px] font-black" style={{ color: primaryColor }}>
                {product.brand}
              </div>
              <div className="text-[7.5px] font-black text-gray-900 line-clamp-1 leading-tight">
                {product.name.replace(product.brand, '').trim()}
              </div>
              <div className="text-[6px] font-bold text-amber-700 bg-amber-50 rounded mt-0.5">
                {product.packSize}
              </div>
            </div>
          </div>
        </div>
      )}

      {product.form === 'Oil' && (
        <div className="relative w-20 h-30 flex flex-col items-center justify-end">
          {/* Oil Cap */}
          <div
            className="w-8 h-4 rounded-t-md shadow-xs"
            style={{ backgroundColor: primaryColor }}
          />
          {/* Clear Bottle Neck */}
          <div className="w-7 h-2 bg-gradient-to-r from-emerald-100 to-emerald-50 border-x border-emerald-200" />
          {/* Tall Bottle Body */}
          <div className="w-16 h-23 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-100/80 rounded-b-xl border border-emerald-200 shadow-md flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
            <div className="w-full flex justify-between items-center">
              <span className="text-[7px] font-black" style={{ color: primaryColor }}>
                {product.brand}
              </span>
              <span className="text-[6px] text-amber-600 font-bold">100% PURE</span>
            </div>
            <div
              className="w-full py-1.5 px-0.5 rounded text-center border"
              style={{ backgroundColor: labelBg, borderColor: `${primaryColor}30` }}
            >
              <div className="text-[8px] font-black line-clamp-1 leading-tight" style={{ color: primaryColor }}>
                {product.name.replace(product.brand, '').trim()}
              </div>
              <div className="text-[6.5px] font-bold text-emerald-800 mt-0.5">
                {product.packSize}
              </div>
            </div>
            <div className="text-[6px] text-gray-500 font-medium">AYURVEDIC OIL</div>
          </div>
        </div>
      )}

      {product.form === 'Churna' && (
        <div className="relative w-22 h-26 flex flex-col items-center justify-end">
          {/* Tub Lid */}
          <div
            className="w-20 h-4 rounded-t-lg shadow-sm"
            style={{ backgroundColor: primaryColor }}
          />
          {/* Tub Body */}
          <div className="w-21 h-20 bg-gradient-to-r from-stone-50 via-white to-stone-100 rounded-b-xl border border-gray-200 shadow-md flex flex-col items-center justify-center p-2 relative overflow-hidden">
            <div className="text-[8px] font-black uppercase tracking-wider" style={{ color: primaryColor }}>
              {product.brand}
            </div>
            <div className="text-[8px] font-black text-gray-900 text-center line-clamp-2 leading-tight mt-0.5">
              {product.name.replace(product.brand, '').trim()}
            </div>
            <div className="mt-1 bg-amber-100/80 text-amber-900 text-[6.5px] font-bold px-1.5 py-0.5 rounded">
              {product.packSize}
            </div>
            {/* Base seal */}
            <div className="absolute bottom-1 w-16 h-0.5 bg-gray-200" />
          </div>
        </div>
      )}

      {product.form === 'Capsules' && (
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Foil Blister Pack */}
          <div className="w-22 h-18 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-xl border border-gray-300 shadow-md p-1.5 flex flex-col justify-between relative overflow-hidden">
            {/* Blister bubbles */}
            <div className="grid grid-cols-5 gap-1.5 justify-items-center">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-4 rounded-full shadow-inner border border-white/60"
                  style={{
                    backgroundColor: i % 2 === 0 ? primaryColor : accentColor,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[7px] font-black px-1 mt-1 text-gray-800">
              <span style={{ color: primaryColor }}>{product.brand}</span>
              <span className="text-[6.5px] font-mono text-gray-600">{product.packSize}</span>
            </div>
          </div>
        </div>
      )}

      {product.form === 'Gel' && (
        <div className="relative w-18 h-28 flex flex-col items-center justify-end">
          {/* Tube Cap */}
          <div className="w-10 h-3 bg-gray-200 rounded-b-md shadow-inner border border-gray-300" />
          {/* Tube Body */}
          <div className="w-14 h-22 bg-gradient-to-b from-emerald-100 via-emerald-50 to-white rounded-t-xl border border-emerald-200 shadow-md flex flex-col items-center justify-between p-1.5 relative">
            <div className="w-full text-center">
              <div className="text-[7.5px] font-black" style={{ color: primaryColor }}>
                {product.brand}
              </div>
              <div className="text-[7.5px] font-black text-gray-900 line-clamp-1">
                {product.name.replace(product.brand, '').trim()}
              </div>
            </div>
            <div className="text-[6.5px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">
              {product.packSize}
            </div>
          </div>
        </div>
      )}

      {product.form === 'Husk' && (
        <div className="relative w-22 h-26 flex flex-col items-center justify-end">
          {/* Box Header */}
          <div
            className="w-20 h-4 rounded-t-md shadow-xs border-b border-black/10 flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-[7px] text-white font-extrabold">{product.brand}</span>
          </div>
          {/* Carton Box */}
          <div className="w-20 h-20 bg-gradient-to-b from-amber-50 to-white rounded-b-md border border-amber-200 shadow-md flex flex-col items-center justify-center p-1.5 relative">
            <div className="text-[8.5px] font-black text-amber-950 text-center leading-tight">
              ISABGOL
            </div>
            <div className="text-[7px] text-gray-600 font-semibold text-center mt-0.5">
              Pure Psyllium
            </div>
            <div className="mt-1 bg-emerald-100 text-emerald-900 text-[6.5px] font-bold px-1.5 py-0.5 rounded">
              {product.packSize}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
