import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export const PRODUCT_IMAGE_URL_PREFIX = '/api/product-image/';
export const PRODUCT_IMAGE_KEY_REGEX = /^[a-zA-Z0-9._-]{8,140}$/;

const DATA_IMAGE_REGEX = /^data:(image\/(?:webp|jpeg|jpg|png));base64,([A-Za-z0-9+/=]+)$/;

export interface PendingProductImageRow {
  id: string;
  product_id: string;
  content_type: string;
  data_b64: string;
  byte_size: number;
}

export interface PreparedProductImages {
  primaryImage: string | null;
  images: string[];
  rowsToUpsert: PendingProductImageRow[];
  referencedKeys: string[];
}

function slugifyProductId(productId: string): string {
  const clean = productId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  return clean || 'sku';
}

export function extractProductImageKey(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed.startsWith(PRODUCT_IMAGE_URL_PREFIX)) return null;
  const key = trimmed.slice(PRODUCT_IMAGE_URL_PREFIX.length);
  return PRODUCT_IMAGE_KEY_REGEX.test(key) ? key : null;
}

/**
 * Converts any data:image/...;base64,... URLs into deterministic content-addressed
 * /api/product-image/<key> URLs and collects the rows to persist in public.product_images.
 * Existing /api/product-image/... URLs, /ayurswift-... assets, and https:// URLs pass through unchanged.
 */
export function prepareOffloadedProductImages(
  productId: string,
  rawPrimary: string | null,
  rawGallery: string[]
): PreparedProductImages {
  const slug = slugifyProductId(productId);
  const rowsMap = new Map<string, PendingProductImageRow>();
  const referencedKeySet = new Set<string>();

  const transformUrl = (url: string): string => {
    const trimmed = url.trim();
    const existingKey = extractProductImageKey(trimmed);
    if (existingKey) {
      referencedKeySet.add(existingKey);
      return `${PRODUCT_IMAGE_URL_PREFIX}${existingKey}`;
    }

    const match = DATA_IMAGE_REGEX.exec(trimmed);
    if (!match) return trimmed;

    const rawMime = match[1].toLowerCase();
    const contentType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
    const b64 = match[2];
    const hash = crypto
      .createHash('sha256')
      .update(contentType)
      .update(':')
      .update(b64)
      .digest('hex')
      .slice(0, 16);

    const key = `img_${slug}_${hash}`;
    const byteSize = Math.floor((b64.length * 3) / 4);
    referencedKeySet.add(key);

    if (!rowsMap.has(key)) {
      rowsMap.set(key, {
        id: key,
        product_id: productId,
        content_type: contentType,
        data_b64: b64,
        byte_size: byteSize,
      });
    }

    return `${PRODUCT_IMAGE_URL_PREFIX}${key}`;
  };

  const transformedGallery = rawGallery
    .map(transformUrl)
    .filter(Boolean);

  // Deduplicate gallery while keeping exact order
  const uniqueGallery = Array.from(new Set(transformedGallery));

  const transformedPrimary = rawPrimary ? transformUrl(rawPrimary) : uniqueGallery[0] || null;
  if (transformedPrimary && !uniqueGallery.includes(transformedPrimary)) {
    uniqueGallery.unshift(transformedPrimary);
  }

  return {
    primaryImage: transformedPrimary,
    images: uniqueGallery,
    rowsToUpsert: Array.from(rowsMap.values()),
    referencedKeys: Array.from(referencedKeySet),
  };
}

/**
 * Persists new offloaded images into public.product_images and removes any orphaned images
 * previously attached to this product that are no longer referenced.
 * Must be called AFTER the parent row exists in public.products (satisfies FK constraint).
 */
export async function persistOffloadedProductImages(
  supabase: SupabaseClient,
  productId: string,
  prepared: PreparedProductImages
): Promise<{ ok: boolean; error?: string }> {
  if (prepared.rowsToUpsert.length > 0) {
    const { error: upsertErr } = await supabase
      .from('product_images')
      .upsert(prepared.rowsToUpsert, { onConflict: 'id' });

    if (upsertErr) {
      return { ok: false, error: upsertErr.message };
    }
  }

  // Clean up orphaned images for this product that were removed by Admin
  try {
    const { data: existingRows } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId);

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      const keepSet = new Set(prepared.referencedKeys);
      const orphanIds = existingRows
        .map((r) => String((r as { id?: string }).id || ''))
        .filter((id) => id && !keepSet.has(id));

      if (orphanIds.length > 0) {
        await supabase.from('product_images').delete().in('id', orphanIds);
      }
    }
  } catch {
    // Non-fatal orphan cleanup failure
  }

  return { ok: true };
}
