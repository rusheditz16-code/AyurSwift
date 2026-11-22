import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_PRODUCTS, isVerifiedProductImageUrl } from '@/lib/initialData';
import { Product } from '@/types';
import {
  checkMemoryRateLimit,
  getSupabaseAdminClient,
  getTrustedClientIp,
  isSafeImageUrl,
  logSecurityEvent,
  maskIpForLog,
  sanitizeText,
  verifyAdminSession,
  verifySameOrigin,
} from '@/lib/serverSecurity';

const MAX_CUSTOMER_ORDER_QTY = 10;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

function mapDbRowToProduct(
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

  return {
    id,
    name: String(row.name || ''),
    brand: (String(row.brand || 'Other') as Product['brand']),
    category: (String(row.category || 'Daily Wellness') as Product['category']),
    manufacturer: String(row.manufacturer || ''),
    form: (String(row.form || 'Tablets') as Product['form']),
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
  };
}

/**
 * GET /api/admin/products
 * - Version check (?version=1): Ultra-lightweight ~35-byte catalog fingerprint (no images)
 *   for near-0-second storefront change detection without wasted bandwidth.
 * - Public mode (?public=1): Returns ONLY live, in-stock products directly filtered in Supabase
 *   with wholesale cost stripped and stock capped to safe per-order customer limit.
 * - Admin mode: Requires valid admin session cookie and returns full inventory with stock & agencyCostPrice.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isVersionOnly = searchParams.get('version') === '1';
  const isPublicMode = searchParams.get('public') === '1';
  const admin = verifyAdminSession(request);

  if (!isVersionOnly && !isPublicMode && !admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized.' },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    if (isVersionOnly) {
      return NextResponse.json(
        { success: true, version: `fallback:${INITIAL_PRODUCTS.length}` },
        { headers: NO_STORE_HEADERS }
      );
    }
    return NextResponse.json(
      {
        success: true,
        source: 'fallback',
        products: isPublicMode
          ? INITIAL_PRODUCTS.filter((p) => p.isLive && p.stockQuantity > 0).map((p) => ({
              ...p,
              agencyCostPrice: 0,
              stockQuantity: Math.min(p.stockQuantity, MAX_CUSTOMER_ORDER_QTY),
            }))
          : INITIAL_PRODUCTS,
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  try {
    // Ultra-fast lightweight version check (~15ms, selects zero image blobs)
    if (isVersionOnly) {
      const { data, error } = await supabase
        .from('products')
        .select('id, updated_at, is_live, stock_quantity, selling_price')
        .order('id', { ascending: true });

      if (error || !Array.isArray(data)) {
        return NextResponse.json(
          { success: false, error: 'Version check unavailable.' },
          { status: 500, headers: NO_STORE_HEADERS }
        );
      }

      let maxUpdated = '';
      let liveCount = 0;
      let checksum = 0;
      for (const row of data as Array<{
        id?: string;
        updated_at?: string;
        is_live?: boolean;
        stock_quantity?: number;
        selling_price?: number;
      }>) {
        const u = String(row.updated_at || '');
        if (u > maxUpdated) maxUpdated = u;
        const isLive = Boolean(row.is_live) && Number(row.stock_quantity ?? 0) > 0;
        if (isLive) liveCount += 1;
        checksum =
          (checksum * 31 +
            (isLive ? 1 : 0) +
            Math.min(10, Math.max(0, Number(row.stock_quantity ?? 0))) * 7 +
            Math.round(Number(row.selling_price ?? 0)) * 13) %
          1_000_000_007;
      }

      return NextResponse.json(
        {
          success: true,
          version: `${data.length}:${liveCount}:${checksum}:${maxUpdated}`,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // Filter live in-stock rows directly in Postgres for public storefront so hidden product images are never downloaded
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true });

    if (isPublicMode) {
      query = query.eq('is_live', true).gt('stock_quantity', 0);
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'Failed to load products from database.' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    const baseMap = new Map<string, Product>();
    INITIAL_PRODUCTS.forEach((p) => baseMap.set(p.id, p));

    // Authoritative Supabase catalog — respects empty catalog & deleted products (never resurrects INITIAL_PRODUCTS)
    const mapped = data.map((row: Record<string, unknown>) =>
      mapDbRowToProduct(row, isPublicMode, baseMap)
    );

    const filtered = isPublicMode
      ? mapped.filter((p) => p.isLive && p.stockQuantity > 0)
      : mapped;

    return NextResponse.json(
      { success: true, source: 'supabase', products: filtered },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load catalog.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * PATCH /api/admin/products
 * Ultra-fast (~50-byte) admin endpoint for 1-click Live/Hidden toggle and Quick Stock (+/-)
 * without re-uploading multi-image base64 galleries.
 */
export async function PATCH(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = checkMemoryRateLimit(`admin_products_patch:${ip}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many rapid updates. Please wait a second.' },
      { status: 429, headers: NO_STORE_HEADERS }
    );
  }

  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const admin = verifyAdminSession(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Admin session expired. Please log in again.' },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = sanitizeText(body.id, 64);
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product id is required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    let nextStock: number | undefined;
    if (body.stockQuantity !== undefined) {
      const parsedStock = Math.floor(Number(body.stockQuantity));
      if (!Number.isFinite(parsedStock) || parsedStock < 0 || parsedStock > 100_000) {
        return NextResponse.json(
          { success: false, error: 'Invalid stock quantity.' },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
      nextStock = parsedStock;
      patch.stock_quantity = parsedStock;
    }

    if (body.isLive !== undefined) {
      patch.is_live = nextStock === 0 ? false : Boolean(body.isLive);
    } else if (nextStock === 0) {
      patch.is_live = false;
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .update(patch)
        .eq('id', id)
        .select('id, is_live, stock_quantity, updated_at')
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to update product in database.' },
          { status: 500, headers: NO_STORE_HEADERS }
        );
      }
      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Product not found in database.' },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      return NextResponse.json(
        {
          success: true,
          id: data.id,
          isLive: Boolean(data.is_live) && Number(data.stock_quantity ?? 0) > 0,
          stockQuantity: Number(data.stock_quantity ?? 0),
          updatedAt: data.updated_at,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id,
        isLive: patch.is_live !== undefined ? Boolean(patch.is_live) : undefined,
        stockQuantity: nextStock,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid update request.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * POST /api/admin/products
 * Admin-only: Upserts a product in Supabase, or restores the 20 starter SKUs ({ action: 'SEED_STARTER' }).
 */
export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = checkMemoryRateLimit(`admin_products:${ip}`, 90, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded.' },
      { status: 429, headers: NO_STORE_HEADERS }
    );
  }

  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const admin = verifyAdminSession(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Admin session expired. Please log in again.' },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = getSupabaseAdminClient();

    // Optional action: Restore the 20 verified starter products directly into Supabase
    if (body.action === 'SEED_STARTER') {
      if (supabase) {
        const nowIso = new Date().toISOString();
        const rows = INITIAL_PRODUCTS.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          manufacturer: p.manufacturer,
          form: p.form,
          pack_size: p.packSize,
          agency_cost_price: p.agencyCostPrice,
          mrp: p.mrp,
          selling_price: p.sellingPrice,
          stock_quantity: p.stockQuantity,
          is_live: p.isLive,
          image_url: p.imageUrl || null,
          images: p.images || [],
          indications: p.indications,
          dosage: p.dosage,
          composition: p.composition,
          safety_advice: p.safetyAdvice || null,
          badge_text: p.badgeText || null,
          updated_at: nowIso,
        }));

        const { error } = await supabase.from('products').upsert(rows);
        if (error) {
          return NextResponse.json(
            { success: false, error: 'Failed to restore starter catalog in database.' },
            { status: 500, headers: NO_STORE_HEADERS }
          );
        }
      }

      logSecurityEvent('admin_catalog_restored', { ip: maskIpForLog(ip) });
      return NextResponse.json(
        { success: true, products: INITIAL_PRODUCTS },
        { headers: NO_STORE_HEADERS }
      );
    }

    const id = sanitizeText(body.id, 64);
    const name = sanitizeText(body.name, 120);
    const brand = sanitizeText(body.brand, 80);
    const category = sanitizeText(body.category, 80);
    const packSize = sanitizeText(body.packSize, 60);
    const manufacturer = sanitizeText(body.manufacturer, 100);
    const form = sanitizeText(body.form, 40);
    const indications = sanitizeText(body.indications, 500);
    const dosage = sanitizeText(body.dosage, 350);
    const composition = sanitizeText(body.composition, 500);
    const safetyAdvice = sanitizeText(body.safetyAdvice, 350);
    const badgeText = sanitizeText(body.badgeText, 40);

    const agencyCostPrice = Number(body.agencyCostPrice);
    const mrp = Number(body.mrp);
    const sellingPrice = Number(body.sellingPrice);
    const stockQuantity = Math.floor(Number(body.stockQuantity));

    if (
      !id ||
      !name ||
      !brand ||
      !category ||
      !packSize ||
      !Number.isFinite(agencyCostPrice) ||
      agencyCostPrice < 0 ||
      !Number.isFinite(mrp) ||
      mrp <= 0 ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice <= 0 ||
      !Number.isFinite(stockQuantity) ||
      stockQuantity < 0 ||
      stockQuantity > 100_000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Please fill Name, Brand, Category, Pack Size, MRP (>0), Selling Price (>0), and valid Stock.',
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const rawImages = Array.isArray(body.images) ? body.images : [];
    const safeImages = rawImages
      .filter((u): u is string => isSafeImageUrl(u))
      .slice(0, 6);

    const primaryImage = isSafeImageUrl(body.imageUrl)
      ? String(body.imageUrl).trim()
      : safeImages[0] || null;

    const isLive = stockQuantity > 0 ? Boolean(body.isLive) : false;

    const dbPayload = {
      id,
      name,
      brand,
      category,
      manufacturer,
      form,
      pack_size: packSize,
      agency_cost_price: agencyCostPrice,
      mrp,
      selling_price: sellingPrice,
      stock_quantity: stockQuantity,
      is_live: isLive,
      image_url: primaryImage,
      images: safeImages,
      indications,
      dosage,
      composition,
      safety_advice: safetyAdvice || null,
      badge_text: badgeText || null,
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      const { error } = await supabase.from('products').upsert(dbPayload);

      if (error) {
        console.warn('Supabase admin product upsert failed:', error.message);
        return NextResponse.json(
          { success: false, error: 'Failed to save product to Supabase database.' },
          { status: 500, headers: NO_STORE_HEADERS }
        );
      }
    }

    const savedProduct: Product = {
      id,
      name,
      brand: brand as Product['brand'],
      category: category as Product['category'],
      manufacturer,
      form: (form || 'Tablets') as Product['form'],
      packSize,
      agencyCostPrice,
      mrp,
      sellingPrice,
      stockQuantity,
      isLive,
      indications,
      dosage,
      composition,
      safetyAdvice: safetyAdvice || undefined,
      badgeText: badgeText || undefined,
      imageUrl: primaryImage || '',
      images: safeImages,
    };

    logSecurityEvent('admin_product_saved', {
      productId: id,
      ip: maskIpForLog(ip),
    });

    return NextResponse.json(
      { success: true, id, product: savedProduct },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request payload or image too large.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * DELETE /api/admin/products?id=...
 * Admin-only: Permanently deletes a product SKU from Supabase.
 */
export async function DELETE(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = checkMemoryRateLimit(`admin_products:${ip}`, 90, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded.' },
      { status: 429, headers: NO_STORE_HEADERS }
    );
  }

  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const admin = verifyAdminSession(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Admin session expired. Please log in again.' },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const id = sanitizeText(new URL(request.url).searchParams.get('id'), 64);
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Product id is required.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete product from database.' },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }
  }

  logSecurityEvent('admin_product_deleted', {
    productId: id,
    ip: maskIpForLog(ip),
  });

  return NextResponse.json({ success: true, id }, { headers: NO_STORE_HEADERS });
}
