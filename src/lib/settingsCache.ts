import fs from 'fs';
import os from 'os';
import path from 'path';
import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { DEFAULT_SETTINGS } from '@/lib/initialData';
import { getSupabaseAdminClient, sanitizeText } from '@/lib/serverSecurity';
import { BillingMode, MerchantSettings } from '@/types';

export const PUBLIC_SETTINGS_TAG = 'public-settings';

function getLocalSettingsPath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join(os.tmpdir(), 'ayurswift_settings_store.json');
  }
  return path.join(process.cwd(), '.settings_store.json');
}

export function loadLocalFallbackSettings(): MerchantSettings {
  try {
    const p = getLocalSettingsPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf-8')) as Record<string, unknown>;
      return sanitizeMerchantSettings(parsed);
    }
  } catch {
    // Ignore fallback file read error
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveLocalFallbackSettings(settings: MerchantSettings): void {
  try {
    fs.writeFileSync(getLocalSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
  } catch {
    // Ignore read-only disk error
  }
}

function clampNumber(val: unknown, fallback: number, min: number, max: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num * 100) / 100));
}

export function sanitizeMerchantSettings(
  raw?: Record<string, unknown> | null
): MerchantSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const billingMode: BillingMode = raw.billingMode === 'GST' ? 'GST' : 'NON_GST';
  const cleanGstin = sanitizeText(raw.gstin, 15)
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');

  const rawStateCode = sanitizeText(raw.storeStateCode, 2).replace(/\D/g, '');
  const storeStateCode =
    billingMode === 'GST' && cleanGstin.length >= 2
      ? cleanGstin.slice(0, 2)
      : rawStateCode.length === 2
        ? rawStateCode
        : DEFAULT_SETTINGS.storeStateCode || '24';

  const cleanWhatsApp =
    sanitizeText(raw.merchantWhatsApp, 20).replace(/\D/g, '') ||
    DEFAULT_SETTINGS.merchantWhatsApp;

  return {
    storeName: sanitizeText(raw.storeName, 80) || DEFAULT_SETTINGS.storeName,
    tagline: sanitizeText(raw.tagline, 120) || DEFAULT_SETTINGS.tagline,
    merchantWhatsApp: cleanWhatsApp,
    merchantUpiId: sanitizeText(raw.merchantUpiId, 80) || DEFAULT_SETTINGS.merchantUpiId,
    merchantUpiName:
      sanitizeText(raw.merchantUpiName, 80) || DEFAULT_SETTINGS.merchantUpiName,
    cityDeliveryFee: clampNumber(
      raw.cityDeliveryFee,
      DEFAULT_SETTINGS.cityDeliveryFee,
      0,
      500
    ),
    cityFreeDeliveryAbove: clampNumber(
      raw.cityFreeDeliveryAbove,
      DEFAULT_SETTINGS.cityFreeDeliveryAbove,
      0,
      25000
    ),
    courierDeliveryFee: clampNumber(
      raw.courierDeliveryFee,
      DEFAULT_SETTINGS.courierDeliveryFee,
      0,
      1500
    ),
    adminEmail: sanitizeText(raw.adminEmail, 120) || DEFAULT_SETTINGS.adminEmail,
    billingMode,
    legalBusinessName:
      sanitizeText(raw.legalBusinessName, 120) ||
      DEFAULT_SETTINGS.legalBusinessName ||
      DEFAULT_SETTINGS.storeName,
    proprietorName: sanitizeText(raw.proprietorName, 80),
    storeAddress:
      sanitizeText(raw.storeAddress, 240) ||
      DEFAULT_SETTINGS.storeAddress ||
      'Bhavnagar City, Dist. Bhavnagar, Gujarat - 364001',
    storeStateCode,
    gstin: cleanGstin,
    defaultGstRate: clampNumber(
      raw.defaultGstRate,
      DEFAULT_SETTINGS.defaultGstRate ?? 12,
      0,
      28
    ),
    udyamNumber: sanitizeText(raw.udyamNumber, 40).toUpperCase(),
    fssaiNumber: sanitizeText(raw.fssaiNumber, 24).replace(/[^0-9A-Za-z-]/g, ''),
    ayushLicenseNote:
      raw.ayushLicenseNote !== undefined
        ? sanitizeText(raw.ayushLicenseNote, 200)
        : DEFAULT_SETTINGS.ayushLicenseNote,
    restrictCourierToGujarat: Boolean(raw.restrictCourierToGujarat),
  };
}

export async function fetchUncachedSettingsFromDb(): Promise<MerchantSettings> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return loadLocalFallbackSettings();
  }

  const { data, error } = await supabase
    .from('store_settings')
    .select('config')
    .eq('id', 'primary')
    .maybeSingle();

  if (error || !data || !data.config || typeof data.config !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  return sanitizeMerchantSettings(data.config as Record<string, unknown>);
}

/**
 * Cached public merchant & legal billing settings (`'use cache'` + `cacheTag('public-settings')`).
 * Ensures every customer invoice and checkout fee across India reflects Admin's saved configuration
 * with zero per-request database load.
 */
export async function getCachedPublicSettings(): Promise<MerchantSettings> {
  'use cache';
  cacheTag(PUBLIC_SETTINGS_TAG);
  cacheLife({ stale: 30, revalidate: 60, expire: 600 });

  return fetchUncachedSettingsFromDb();
}

export function invalidatePublicSettingsCache(): void {
  try {
    revalidateTag(PUBLIC_SETTINGS_TAG, { expire: 0 });
  } catch {
    // Safe no-op outside Next.js request context
  }
}
