import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_PRODUCTS } from '@/lib/initialData';
import { Product } from '@/types';
import {
  checkRateLimit,
  getSupabaseAdminClient,
  getTrustedClientIp,
  isSafeImageUrl,
  logSecurityEvent,
  maskIpForLog,
  sanitizeText,
  verifyAdminSession,
  verifySameOrigin,
} from '@/lib/serverSecurity';

/**
 * GET /api/admin/products
 * - Public mode (?public=1): Returns live, in-stock products with wholesale cost & raw stock stripped.
 * - Admin mode: Requires valid admin session cookie and returns full inventory with stock & agencyCostPrice.
 */
export async function GET(request: NextRequest) {
  const isPublicMode = new URL(request.url).searchParams.get('public') === '1';
  const admin = verifyAdminSession(request);

  if (!isPublicMode && !admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({
      success: true,
      products: isPublicMode
        ? INITIAL_PRODUCTS.filter((p) => p.isLive && p.stockQuantity > 0).map((p) => ({
            ...p,
            agencyCostPrice: 0,
            stockQuantity: 1,
          }))
        : INITIAL_PRODUCTS,
    });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        products: isPublicMode
          ? INITIAL_PRODUCTS.filter((p) => p.isLive && p.stockQuantity > 0).map((p) => ({
              ...p,
              agencyCostPrice: 0,
              stockQuantity: 1,
            }))
          : INITIAL_PRODUCTS,
      });
    }

    const baseMap = new Map<string, Product>();
    INITIAL_PRODUCTS.forEach((p) => baseMap.set(p.id, p));

    const mapped: Product[] = data.map((row: Record<string, unknown>) => {
      const id = String(row.id || '');
      const base = baseMap.get(id);
      const rawStock = Math.max(0, Number(row.stock_quantity ?? base?.stockQuantity ?? 0));
      const isLive = Boolean(row.is_live ?? base?.isLive ?? true) && rawStock > 0;

      return {
        id,
        name: String(row.name || base?.name || ''),
        brand: (String(row.brand || base?.brand || 'Other') as Product['brand']),
        category: (String(row.category || base?.category || 'Daily Wellness') as Product['category']),
        manufacturer: String(row.manufacturer || base?.manufacturer || ''),
        form: (String(row.form || base?.form || 'Tablets') as Product['form']),
        packSize: String(row.pack_size || base?.packSize || ''),
        agencyCostPrice: isPublicMode ? 0 : Number(row.agency_cost_price ?? base?.agencyCostPrice ?? 0),
        mrp: Number(row.mrp ?? base?.mrp ?? 0),
        sellingPrice: Number(row.selling_price ?? base?.sellingPrice ?? 0),
        stockQuantity: isPublicMode ? (rawStock > 0 ? 1 : 0) : rawStock,
        isLive,
        rating: base?.rating ?? 4.8,
        reviewCount: base?.reviewCount ?? 120,
        badgeText: base?.badgeText,
        indications: String(row.indications ?? base?.indications ?? ''),
        dosage: String(row.dosage ?? base?.dosage ?? ''),
        composition: String(row.composition ?? base?.composition ?? ''),
        safetyAdvice: base?.safetyAdvice,
        imageUrl: String(row.image_url ?? base?.imageUrl ?? ''),
        images: Array.isArray(row.images) && row.images.length > 0
          ? (row.images as string[])
          : base?.images || [],
      };
    });

    const filtered = isPublicMode
      ? mapped.filter((p) => p.isLive && p.stockQuantity > 0)
      : mapped;

    return NextResponse.json({ success: true, products: filtered });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load catalog.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Admin-only: Upserts a product in Supabase using server-only SUPABASE_SERVICE_ROLE_KEY.
 */
export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = await checkRateLimit(`admin_products:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded.' }, { status: 429 });
  }

  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  }

  const admin = verifyAdminSession(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = sanitizeText(body.id, 64);
    const name = sanitizeText(body.name, 120);
    const brand = sanitizeText(body.brand, 80);
    const category = sanitizeText(body.category, 80);
    const packSize = sanitizeText(body.packSize, 60);
    const manufacturer = sanitizeText(body.manufacturer, 100);
    const form = sanitizeText(body.form, 40);

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
        { success: false, error: 'Invalid product fields or numeric values.' },
        { status: 400 }
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

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error } = await supabase.from('products').upsert({
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
        indications: sanitizeText(body.indications, 400),
        dosage: sanitizeText(body.dosage, 300),
        composition: sanitizeText(body.composition, 400),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('Supabase admin product upsert failed');
        return NextResponse.json(
          { success: false, error: 'Failed to save product to database.' },
          { status: 500 }
        );
      }
    }

    logSecurityEvent('admin_product_saved', {
      productId: id,
      ip: maskIpForLog(ip),
    });

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request payload.' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/products?id=...
 * Admin-only: Deletes a product SKU from Supabase.
 */
export async function DELETE(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = await checkRateLimit(`admin_products:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded.' }, { status: 429 });
  }

  if (!verifySameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Invalid request origin.' }, { status: 403 });
  }

  const admin = verifyAdminSession(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const id = sanitizeText(new URL(request.url).searchParams.get('id'), 64);
  if (!id) {
    return NextResponse.json({ success: false, error: 'Product id is required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete product.' },
        { status: 500 }
      );
    }
  }

  logSecurityEvent('admin_product_deleted', {
    productId: id,
    ip: maskIpForLog(ip),
  });

  return NextResponse.json({ success: true, id });
}
