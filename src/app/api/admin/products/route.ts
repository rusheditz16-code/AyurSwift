import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_PRODUCTS } from '@/lib/initialData';
import {
  invalidatePublicCatalogCache,
  mapDbRowToProduct,
  MAX_CUSTOMER_ORDER_QTY,
} from '@/lib/catalogCache';
import {
  persistOffloadedProductImages,
  prepareOffloadedProductImages,
} from '@/lib/productImages';
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

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * GET /api/admin/products
 * - Version check (?version=1): Ultra-lightweight ~35-byte catalog fingerprint (no images)
 * - Public fresh bypass (?public=1): Returns live, in-stock products directly from Supabase
 *   for ~0s same-browser Admin->Storefront verification (regular shoppers use CDN /api/catalog).
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
 * without re-uploading images. Immediately invalidates cached public catalog.
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

      invalidatePublicCatalogCache();

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

    invalidatePublicCatalogCache();

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
 * Admin-only: Upserts a product in Supabase, automatically offloading base64 photos to
 * content-addressed public.product_images (served via 1-year immutable Vercel Edge CDN URLs),
 * or restores the 20 starter SKUs ({ action: 'SEED_STARTER' }).
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
          hsn_code: p.hsnCode || null,
          gst_rate: typeof p.gstRate === 'number' ? p.gstRate : null,
          batch_no: p.batchNo || null,
          expiry_date: p.expiryDate || null,
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

      invalidatePublicCatalogCache();
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
    const hsnCode = sanitizeText(body.hsnCode, 16).replace(/[^0-9A-Za-z]/g, '');
    const batchNo = sanitizeText(body.batchNo, 40);
    const expiryDate = sanitizeText(body.expiryDate, 20);
    const parsedGstRate =
      body.gstRate !== undefined && body.gstRate !== null && String(body.gstRate).trim() !== ''
        ? Number(body.gstRate)
        : null;
    const gstRate =
      parsedGstRate !== null &&
      Number.isFinite(parsedGstRate) &&
      parsedGstRate >= 0 &&
      parsedGstRate <= 28
        ? Math.round(parsedGstRate * 100) / 100
        : null;

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

    let finalPrimaryImage = primaryImage;
    let finalImages = safeImages;

    if (supabase) {
      const prepared = prepareOffloadedProductImages(id, primaryImage, safeImages);
      finalPrimaryImage = prepared.primaryImage;
      finalImages = prepared.images;

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
        image_url: finalPrimaryImage,
        images: finalImages,
        indications,
        dosage,
        composition,
        safety_advice: safetyAdvice || null,
        badge_text: badgeText || null,
        hsn_code: hsnCode || null,
        gst_rate: gstRate,
        batch_no: batchNo || null,
        expiry_date: expiryDate || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('products').upsert(dbPayload);

      if (error) {
        console.warn('Supabase admin product upsert failed:', error.message);
        return NextResponse.json(
          { success: false, error: 'Failed to save product to Supabase database.' },
          { status: 500, headers: NO_STORE_HEADERS }
        );
      }

      const imgRes = await persistOffloadedProductImages(supabase, id, prepared);
      if (!imgRes.ok) {
        console.warn('Supabase product_images upsert failed:', imgRes.error);
        return NextResponse.json(
          { success: false, error: 'Product saved, but uploading product photos failed. Please retry.' },
          { status: 500, headers: NO_STORE_HEADERS }
        );
      }
    }

    invalidatePublicCatalogCache();

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
      hsnCode: hsnCode || undefined,
      gstRate: gstRate !== null ? gstRate : undefined,
      batchNo: batchNo || undefined,
      expiryDate: expiryDate || undefined,
      imageUrl: finalPrimaryImage || '',
      images: finalImages,
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
 * Admin-only: Permanently deletes a product SKU from Supabase (cascades product_images).
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

  invalidatePublicCatalogCache();

  logSecurityEvent('admin_product_deleted', {
    productId: id,
    ip: maskIpForLog(ip),
  });

  return NextResponse.json({ success: true, id }, { headers: NO_STORE_HEADERS });
}
