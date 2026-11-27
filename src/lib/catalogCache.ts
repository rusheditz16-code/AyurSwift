import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { INITIAL_PRODUCTS, isVerifiedProductImageUrl } from '@/lib/initialData';
import { getSupabaseAdminClient } from '@/lib/serverSecurity';
import { Product } from '@/types';

export const PUBLIC_CATALOG_TAG = 'public-catalog';
export const MAX_CUSTOMER_ORDER_QTY = 10;

export function mapDbRowToProduct(
  row: Record<string, unknown>,
  isPublicMode: boolean,
  baseMap: Map<string, Product>
): Product {
  const id = String(row.id || '');
  const base = baseMap.get(id);
  const rawStock = Math.max(0, Number(row.stock_quantity ?? 0));
  const isLive = Boolean(row.is_live) && rawStock > 0;

  const rawImage = typeof row.image_url === 'string' ? row.image_url : '';
  const safePrimary = isVerifiedProductImageUrl(rawImage) ? rawImage.trim() : '';
  const rawImgs = Array.isArray(row.images) ? (row.images as string[]) : [];
  const safeImgs = rawImgs.filter((u) => isVerifiedProductImageUrl(u));

  const safetyFromRow =
    typeof row.safety_advice === 'string' ? row.safety_advice.trim() : '';
  const badgeFromRow =
    typeof row.badge_text === 'string' ? row.badge_text.trim() : '';
  const hsnFromRow =
    typeof row.hsn_code === 'string' ? row.hsn_code.trim() : '';
  const gstRateFromRow =
    row.gst_rate !== null && row.gst_rate !== undefined && Number.isFinite(Number(row.gst_rate))
      ? Number(row.gst_rate)
      : undefined;
  const batchFromRow =
    typeof row.batch_no === 'string' ? row.batch_no.trim() : '';
  const expiryFromRow =
    typeof row.expiry_date === 'string' ? row.expiry_date.trim() : '';

  return {
    id,
    name: String(row.name || ''),
    brand: String(row.brand || 'Other') as Product['brand'],
    category: String(row.category || 'Daily Wellness') as Product['category'],
    manufacturer: String(row.manufacturer || ''),
    form: String(row.form || 'Tablets') as Product['form'],
    packSize: String(row.pack_size || ''),
    agencyCostPrice: isPublicMode ? 0 : Number(row.agency_cost_price ?? 0),
    mrp: Number(row.mrp ?? 0),
    sellingPrice: Number(row.selling_price ?? 0),
    stockQuantity: isPublicMode
      ? rawStock > 0
        ? Math.min(rawStock, MAX_CUSTOMER_ORDER_QTY)
        : 0
      : rawStock,
    isLive,
    badgeText: badgeFromRow || base?.badgeText || undefined,
    indications: String(row.indications ?? ''),
    dosage: String(row.dosage ?? ''),
    composition: String(row.composition ?? ''),
    safetyAdvice: safetyFromRow || base?.safetyAdvice || undefined,
    imageUrl: safePrimary || safeImgs[0] || '',
    images: safeImgs.length > 0 ? safeImgs : safePrimary ? [safePrimary] : [],
    hsnCode: hsnFromRow || base?.hsnCode || undefined,
    gstRate: gstRateFromRow !== undefined ? gstRateFromRow : base?.gstRate,
    batchNo: batchFromRow || base?.batchNo || undefined,
    expiryDate: expiryFromRow || base?.expiryDate || undefined,
  };
}

export interface CachedPublicCatalogResult {
  success: boolean;
  source: 'supabase' | 'fallback';
  version: string;
  products: Product[];
}

function computeCatalogVersion(rows: Array<Record<string, unknown>>): string {
  let maxUpdated = '';
  let checksum = 0;
  for (const row of rows) {
    const u = String(row.updated_at || '');
    if (u > maxUpdated) maxUpdated = u;
    const stockCap = Math.min(MAX_CUSTOMER_ORDER_QTY, Math.max(0, Number(row.stock_quantity ?? 0)));
    checksum =
      (checksum * 31 +
        stockCap * 7 +
        Math.round(Number(row.selling_price ?? 0)) * 13) %
      1_000_000_007;
  }
  return `${rows.length}:${checksum}:${maxUpdated}`;
}

/**
 * Cached server catalog fetcher using Next.js 16 `'use cache'` + `cacheTag('public-catalog')`.
 * Absorbs 1,000-2,000+ concurrent requests with ~0 Postgres load and purges immediately on
 * any Admin mutation or stock-changing order via `invalidatePublicCatalogCache()`.
 */
export async function getCachedPublicCatalog(): Promise<CachedPublicCatalogResult> {
  'use cache';
  cacheTag(PUBLIC_CATALOG_TAG);
  cacheLife({ stale: 10, revalidate: 30, expire: 300 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    const liveFallback = INITIAL_PRODUCTS.filter((p) => p.isLive && p.stockQuantity > 0).map(
      (p) => ({
        ...p,
        agencyCostPrice: 0,
        stockQuantity: Math.min(p.stockQuantity, MAX_CUSTOMER_ORDER_QTY),
      })
    );
    return {
      success: true,
      source: 'fallback',
      version: `fallback:${liveFallback.length}`,
      products: liveFallback,
    };
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, name, brand, category, manufacturer, form, pack_size, mrp, selling_price, stock_quantity, is_live, image_url, images, indications, dosage, composition, safety_advice, badge_text, hsn_code, gst_rate, batch_no, expiry_date, updated_at'
    )
    .eq('is_live', true)
    .gt('stock_quantity', 0)
    .order('created_at', { ascending: false })
    .order('id', { ascending: true });

  if (error || !Array.isArray(data)) {
    throw new Error('Failed to load public catalog from Supabase.');
  }

  const baseMap = new Map<string, Product>();
  INITIAL_PRODUCTS.forEach((p) => baseMap.set(p.id, p));

  const products = (data as Array<Record<string, unknown>>)
    .map((row) => mapDbRowToProduct(row, true, baseMap))
    .filter((p) => p.isLive && p.stockQuantity > 0);

  return {
    success: true,
    source: 'supabase',
    version: computeCatalogVersion(data as Array<Record<string, unknown>>),
    products,
  };
}

/**
 * Immediately expires the cached public catalog across Next.js server cache
 * whenever Admin creates, edits, toggles, deletes, or restores products, or when an order changes stock.
 */
export function invalidatePublicCatalogCache(): void {
  try {
    revalidateTag(PUBLIC_CATALOG_TAG, { expire: 0 });
  } catch {
    // Safe no-op outside Next.js request lifecycle
  }
}
