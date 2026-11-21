import { NextRequest, NextResponse } from 'next/server';
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
