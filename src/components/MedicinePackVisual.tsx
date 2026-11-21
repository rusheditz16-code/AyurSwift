'use client';

import React from 'react';
import { Product } from '@/types';

interface MedicinePackVisualProps {
  product: Product;
  className?: string;
  compact?: boolean;
}

interface BrandPalette {
  primary: string;
  primaryDark: string;
  tint: string;
  accent: string;
  badgeText: string;
}

function getBrandPalette(brand: string): BrandPalette {
  switch (brand) {
    case 'Zandu':
      return {
        primary: '#B91C1C',
        primaryDark: '#7F1D1D',
        tint: '#FEF2F2',
        accent: '#F59E0B',
        badgeText: '#991B1B',
      };
    case 'Dabur':
      return {
        primary: '#0C831F',
        primaryDark: '#065F46',
        tint: '#ECFDF3',
        accent: '#D97706',
        badgeText: '#065F46',
      };
    case 'Himalaya':
      return {
        primary: '#0F766E',
        primaryDark: '#115E59',
        tint: '#F0FDFA',
        accent: '#EA580C',
        badgeText: '#0F766E',
      };
    case 'Baidyanath':
      return {
        primary: '#B45309',
        primaryDark: '#78350F',
        tint: '#FFFBEB',
        accent: '#0C831F',
        badgeText: '#92400E',
      };
    case 'Patanjali':
      return {
        primary: '#C2410C',
        primaryDark: '#9A3412',
        tint: '#FFF7ED',
        accent: '#15803D',
        badgeText: '#9A3412',
      };
    case 'Dr. Ortho':
      return {
        primary: '#047857',
        primaryDark: '#064E3B',
        tint: '#ECFDF5',
        accent: '#DC2626',
        badgeText: '#065F46',
      };
    case 'Moov':
      return {
        primary: '#1D4ED8',
        primaryDark: '#1E3A8A',
        tint: '#EFF6FF',
        accent: '#F59E0B',
        badgeText: '#1E40AF',
      };
    case 'Vicco':
      return {
        primary: '#9F1239',
        primaryDark: '#881337',
        tint: '#FFF1F2',
        accent: '#D97706',
        badgeText: '#9F1239',
      };
    default:
      return {
        primary: '#0C831F',
        primaryDark: '#065F46',
        tint: '#ECFDF3',
        accent: '#0F766E',
        badgeText: '#065F46',
      };
  }
}

function getShortLabel(name: string, brand: string): string {
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = name.replace(new RegExp(`^${escaped}\\s*`, 'i'), '').trim();
  const base = stripped || name;
  return base.length > 22 ? `${base.slice(0, 20).trim()}…` : base;
}

export function MedicinePackVisual({
  product,
  className = 'w-full h-full',
  compact = false,
}: MedicinePackVisualProps) {
  const palette = getBrandPalette(product.brand);
  const shortLabel = getShortLabel(product.name, product.brand);
  const brandUpper = (product.brand || 'AYURSWIFT').toUpperCase().slice(0, 12);
  const packShort = (product.packSize || '').slice(0, 18);
  const form = product.form;

  return (
    <div
      role="img"
      aria-label={`${product.name} (${product.packSize}) by ${product.brand} — branded ${form.toLowerCase()} pack illustration`}
      className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 220 165"
        className="w-full h-full max-w-full max-h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`bg-${product.id}`} cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor={palette.tint} stopOpacity="1" />
            <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id={`cap-${product.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.primaryDark} />
            <stop offset="45%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={palette.primaryDark} />
          </linearGradient>
          <linearGradient id={`glass-${product.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E5E7EB" />
            <stop offset="28%" stopColor="#FFFFFF" />
            <stop offset="72%" stopColor="#F9FAFB" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id={`amber-${product.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5C2808" />
            <stop offset="35%" stopColor="#92400E" />
            <stop offset="70%" stopColor="#78350F" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>

        {/* Soft Studio Halo & Pedestal Shadow */}
        <rect x="6" y="6" width="208" height="153" rx="18" fill={`url(#bg-${product.id})`} />
        <ellipse cx="110" cy="144" rx="54" ry="7" fill="#0F172A" fillOpacity="0.08" />

        {/* === FORM 1: BALM JAR === */}
        {form === 'Balm' && (
          <g>
            {/* Screw Lid */}
            <rect x="64" y="42" width="92" height="22" rx="7" fill={`url(#cap-${product.id})`} />
            <rect x="68" y="46" width="84" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.3" />
            {/* Glass Jar Body */}
            <rect
              x="56"
              y="62"
              width="108"
              height="78"
              rx="16"
              fill="#FEF3C7"
              stroke="#D97706"
              strokeWidth="1.5"
              strokeOpacity="0.45"
            />
            <rect x="62" y="66" width="12" height="68" rx="6" fill="#FFFFFF" fillOpacity="0.45" />
            {/* Wraparound Label */}
            <rect
              x="64"
              y="74"
              width="92"
              height="54"
              rx="8"
              fill="#FFFFFF"
              stroke={palette.primary}
              strokeWidth="1.2"
              strokeOpacity="0.35"
            />
            <rect x="64" y="74" width="92" height="15" rx="6" fill={palette.primary} />
            <text
              x="110"
              y="84.5"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="9"
              fontWeight="800"
              letterSpacing="0.8"
            >
              {brandUpper}
            </text>
            {!compact && (
              <>
                <text x="110" y="102" textAnchor="middle" fill="#111827" fontSize="8.5" fontWeight="800">
                  {shortLabel}
                </text>
                <rect x="82" y="109" width="56" height="13" rx="6.5" fill={palette.tint} />
                <text x="110" y="118.5" textAnchor="middle" fill={palette.badgeText} fontSize="7.5" fontWeight="800">
                  {packShort}
                </text>
              </>
            )}
          </g>
        )}

        {/* === FORM 2: SPRAY CAN === */}
        {form === 'Spray' && (
          <g>
            {/* Nozzle Cap */}
            <rect x="92" y="20" width="36" height="19" rx="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
            <rect x="103" y="24" width="14" height="6" rx="2" fill={palette.primary} />
            {/* Shoulder */}
            <path d="M84 48 C84 38 92 37 110 37 C128 37 136 38 136 48 Z" fill="#E2E8F0" />
            {/* Cylinder Body */}
            <rect
              x="80"
              y="46"
              width="60"
              height="95"
              rx="8"
              fill={`url(#cap-${product.id})`}
            />
            {/* Front Label */}
            <rect x="85" y="60" width="50" height="68" rx="6" fill="#FFFFFF" />
            <rect x="85" y="60" width="50" height="14" rx="5" fill={palette.accent} />
            <text x="110" y="70" textAnchor="middle" fill="#111827" fontSize="8.5" fontWeight="900">
              {brandUpper}
            </text>
            {!compact && (
              <>
                <text x="110" y="88" textAnchor="middle" fill="#111827" fontSize="7.5" fontWeight="800">
                  PAIN SPRAY
                </text>
                <text x="110" y="102" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="700">
                  {packShort}
                </text>
                <rect x="92" y="110" width="36" height="11" rx="5.5" fill={palette.tint} />
                <text x="110" y="118" textAnchor="middle" fill={palette.badgeText} fontSize="6.5" fontWeight="800">
                  AYURVEDIC
                </text>
              </>
            )}
          </g>
        )}

        {/* === FORM 3: TABLETS BOTTLE === */}
        {form === 'Tablets' && (
          <g>
            {/* Ribbed Screw Cap */}
            <rect x="83" y="24" width="54" height="17" rx="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.3" />
            <line x1="92" y1="27" x2="92" y2="38" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="101" y1="27" x2="101" y2="38" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="110" y1="27" x2="110" y2="38" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="119" y1="27" x2="119" y2="38" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="128" y1="27" x2="128" y2="38" stroke="#CBD5E1" strokeWidth="1.2" />
            {/* Bottle Body */}
            <rect
              x="71"
              y="40"
              width="78"
              height="100"
              rx="14"
              fill={`url(#glass-${product.id})`}
              stroke="#CBD5E1"
              strokeWidth="1.4"
            />
            {/* Label */}
            <rect
              x="76"
              y="55"
              width="68"
              height="70"
              rx="7"
              fill="#FFFFFF"
              stroke={palette.primary}
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <rect x="76" y="55" width="68" height="16" rx="5" fill={palette.primary} />
            <text x="110" y="66" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="800" letterSpacing="0.5">
              {brandUpper}
            </text>
            {!compact && (
              <>
                <text x="110" y="86" textAnchor="middle" fill="#111827" fontSize="8" fontWeight="800">
                  {shortLabel.slice(0, 15)}
                </text>
                <rect x="83" y="95" width="54" height="14" rx="7" fill={palette.tint} />
                <text x="110" y="104.5" textAnchor="middle" fill={palette.badgeText} fontSize="7" fontWeight="800">
                  {packShort}
                </text>
                <text x="110" y="119" textAnchor="middle" fill="#64748B" fontSize="6.5" fontWeight="700">
                  OTC AYURVEDA
                </text>
              </>
            )}
          </g>
        )}

        {/* === FORM 4: SYRUP AMBER BOTTLE === */}
        {form === 'Syrup' && (
          <g>
            {/* Cap */}
            <rect x="93" y="18" width="34" height="15" rx="4" fill={`url(#cap-${product.id})`} />
            {/* Bottle Neck */}
            <rect x="98" y="33" width="24" height="14" fill={`url(#amber-${product.id})`} />
            {/* Shoulder + Body */}
            <path
              d="M78 62 C78 48 94 46 98 46 L122 46 C126 46 142 48 142 62 L142 132 C142 137 137 141 132 141 L88 141 C83 141 78 137 78 132 Z"
              fill={`url(#amber-${product.id})`}
            />
            {/* Glass Highlight */}
            <rect x="84" y="60" width="7" height="72" rx="3.5" fill="#FFFFFF" fillOpacity="0.18" />
            {/* Label */}
            <rect x="84" y="68" width="52" height="58" rx="6" fill="#FFFFFF" />
            <rect x="84" y="68" width="52" height="14" rx="5" fill={palette.primary} />
            <text x="110" y="78" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">
              {brandUpper}
            </text>
            {!compact && (
              <>
                <text x="110" y="95" textAnchor="middle" fill="#111827" fontSize="7.5" fontWeight="800">
                  {shortLabel.slice(0, 14)}
                </text>
                <rect x="89" y="103" width="42" height="13" rx="6.5" fill={palette.tint} />
                <text x="110" y="112" textAnchor="middle" fill={palette.badgeText} fontSize="6.8" fontWeight="800">
                  {packShort}
                </text>
              </>
            )}
          </g>
        )}

        {/* === FORM 5: HERBAL OIL BOTTLE === */}
        {form === 'Oil' && (
          <g>
            {/* Cap */}
            <rect x="94" y="18" width="32" height="15" rx="4" fill={`url(#cap-${product.id})`} />
            {/* Neck */}
            <rect x="99" y="33" width="22" height="12" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
            {/* Oil Bottle Body */}
            <rect
              x="76"
              y="44"
              width="68"
              height="97"
              rx="14"
              fill="#FEFCE8"
              stroke={palette.primary}
              strokeWidth="1.4"
              strokeOpacity="0.4"
            />
            <rect x="81" y="50" width="8" height="84" rx="4" fill="#FFFFFF" fillOpacity="0.55" />
            {/* Label */}
            <rect x="82" y="60" width="56" height="66" rx="7" fill="#FFFFFF" stroke={palette.primary} strokeOpacity="0.3" />
            <rect x="82" y="60" width="56" height="15" rx="5" fill={palette.primary} />
            <text x="110" y="70.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">
              {brandUpper}
            </text>
            {!compact && (
              <>
                <text x="110" y="90" textAnchor="middle" fill="#111827" fontSize="7.8" fontWeight="800">
                  {shortLabel.slice(0, 14)}
                </text>
                <rect x="88" y="98" width="44" height="13" rx="6.5" fill={palette.tint} />
                <text x="110" y="107" textAnchor="middle" fill={palette.badgeText} fontSize="6.8" fontWeight="800">
                  {packShort}
                </text>
                <text x="110" y="121" textAnchor="middle" fill="#64748B" fontSize="6" fontWeight="700">
                  HERBAL OIL
                </text>
              </>
            )}
          </g>
        )}

        {/* === FORM 6: CHURNA / CHYAWANPRASH JAR === */}
        {form === 'Churna' && (
          <g>
            {/* Wide Lid */}
            <rect x="64" y="34" width="92" height="18" rx="6" fill={`url(#cap-${product.id})`} />
            <rect x="68" y="38" width="84" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.28" />
            {/* Wide Container Body */}
            <rect
              x="60"
              y="51"
              width="100"
              height="90"
              rx="14"
              fill={`url(#glass-${product.id})`}
              stroke="#CBD5E1"
              strokeWidth="1.4"
            />
            {/* Label */}
            <rect
              x="67"
              y="62"
              width="86"
              height="68"
              rx="8"
              fill="#FFFFFF"
              stroke={palette.primary}
              strokeWidth="1.2"
              strokeOpacity="0.35"
            />
            <rect x="67" y="62" width="86" height="16" rx="6" fill={palette.primary} />
            <text x="110" y="73" textAnchor="middle" fill="#FFFFFF" fontSize="8.8" fontWeight="800" letterSpacing="0.6">
              {brandUpper}
            </text>
            {!compact && (
              <>
                <text x="110" y="94" textAnchor="middle" fill="#111827" fontSize="8.3" fontWeight="800">
                  {shortLabel.slice(0, 17)}
                </text>
                <rect x="80" y="104" width="60" height="15" rx="7.5" fill={palette.tint} />
                <text x="110" y="114.5" textAnchor="middle" fill={palette.badgeText} fontSize="7.3" fontWeight="800">
                  {packShort}
                </text>
              </>
            )}
          </g>
        )}

        {/* === FORM 7: CAPSULES / PEARLS BLISTER STRIP === */}
        {form === 'Capsules' && (
          <g>
            {/* Foil Strip */}
            <rect
              x="44"
              y="42"
              width="132"
              height="86"
              rx="14"
              fill="#E2E8F0"
              stroke="#94A3B8"
              strokeWidth="1.5"
            />
            <rect x="50" y="48" width="120" height="74" rx="10" fill="#F8FAFC" />
            {/* 10 Capsule / Pearl Blisters */}
            {[0, 1, 2, 3, 4].map((col) => (
              <g key={col}>
                <rect
                  x={60 + col * 21}
                  y="56"
                  width="15"
                  height="21"
                  rx="7.5"
                  fill={palette.primary}
                  fillOpacity="0.88"
                />
                <ellipse cx={65 + col * 21} cy="62" rx="2.5" ry="4" fill="#FFFFFF" fillOpacity="0.45" />
                <rect
                  x={60 + col * 21}
                  y="83"
                  width="15"
                  height="21"
                  rx="7.5"
                  fill={palette.primary}
                  fillOpacity="0.88"
                />
                <ellipse cx={65 + col * 21} cy="89" rx="2.5" ry="4" fill="#FFFFFF" fillOpacity="0.45" />
              </g>
            ))}
            {!compact && (
              <>
                <rect x="56" y="108" width="108" height="12" rx="4" fill={palette.tint} />
                <text x="110" y="116.5" textAnchor="middle" fill={palette.badgeText} fontSize="7.2" fontWeight="800">
                  {brandUpper} • {packShort}
                </text>
              </>
            )}
          </g>
        )}

        {/* === FORM 8: GEL / PASTE TUBE === */}
        {form === 'Gel' && (
          <g>
            {/* Crimp Top */}
            <rect x="78" y="20" width="64" height="8" rx="2" fill={palette.primaryDark} />
            {/* Tapered Tube Body */}
            <path
              d="M80 28 L140 28 L131 124 L89 124 Z"
              fill={`url(#glass-${product.id})`}
              stroke="#CBD5E1"
              strokeWidth="1.4"
            />
            {/* Flip Cap at Bottom */}
            <rect x="93" y="124" width="34" height="16" rx="4" fill={`url(#cap-${product.id})`} />
            {/* Label */}
            <rect x="86" y="42" width="48" height="68" rx="6" fill="#FFFFFF" stroke={palette.primary} strokeOpacity="0.35" />
            <rect x="86" y="42" width="48" height="15" rx="5" fill={palette.primary} />
            <text x="110" y="52.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">
              {brandUpper}
            </text>
            {!compact && (
              <>
                <text x="110" y="72" textAnchor="middle" fill="#111827" fontSize="7.5" fontWeight="800">
                  {shortLabel.slice(0, 12)}
                </text>
                <rect x="91" y="82" width="38" height="13" rx="6.5" fill={palette.tint} />
                <text x="110" y="91" textAnchor="middle" fill={palette.badgeText} fontSize="6.8" fontWeight="800">
                  {packShort}
                </text>
              </>
            )}
          </g>
        )}

        {/* === FORM 9: HUSK / CARTON BOX === */}
        {form === 'Husk' && (
          <g>
            {/* Box Top */}
            <rect x="66" y="28" width="88" height="113" rx="10" fill="#FFFFFF" stroke={palette.primary} strokeWidth="1.5" strokeOpacity="0.45" />
            <rect x="66" y="28" width="88" height="26" rx="9" fill={`url(#cap-${product.id})`} />
            <text x="110" y="44.5" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="800" letterSpacing="0.8">
              {brandUpper}
            </text>
            {!compact && (
              <>
                <text x="110" y="76" textAnchor="middle" fill="#111827" fontSize="9" fontWeight="900">
                  {shortLabel.slice(0, 16)}
                </text>
                <text x="110" y="91" textAnchor="middle" fill="#64748B" fontSize="7.5" fontWeight="700">
                  PURE AYURVEDIC HUSK
                </text>
                <rect x="80" y="104" width="60" height="16" rx="8" fill={palette.tint} />
                <text x="110" y="115" textAnchor="middle" fill={palette.badgeText} fontSize="7.8" fontWeight="800">
                  {packShort}
                </text>
              </>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
