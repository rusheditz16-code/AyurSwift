import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/serverSecurity';
import { PRODUCT_IMAGE_KEY_REGEX } from '@/lib/productImages';

const IMMUTABLE_CDN_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
  'CDN-Cache-Control': 'public, s-maxage=31536000, immutable',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=31536000, immutable',
  'X-Content-Type-Options': 'nosniff',
};

const NOT_FOUND_HEADERS = {
  'Cache-Control': 'public, max-age=10, s-maxage=10',
  'X-Content-Type-Options': 'nosniff',
};

/**
 * GET /api/product-image/[key]
 * Serves content-addressed product photos as raw binary WebP/JPEG/PNG with 1-year immutable
 * Vercel Edge CDN & browser caching. Because every image key embeds its SHA-256 hash,
 * 2,000+ concurrent shoppers load photos straight from Vercel Mumbai Edge RAM (0 Postgres hits).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;
  if (!key || !PRODUCT_IMAGE_KEY_REGEX.test(key)) {
    return new NextResponse('Invalid image key', { status: 400, headers: NOT_FOUND_HEADERS });
  }

  const etag = `"${key}"`;
  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ...IMMUTABLE_CDN_HEADERS,
        ETag: etag,
      },
    });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return new NextResponse('Image storage unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  try {
    const { data, error } = await supabase
      .from('product_images')
      .select('content_type, data_b64')
      .eq('id', key)
      .maybeSingle();

    if (error) {
      return new NextResponse('Image lookup failed', {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    if (!data || typeof data.data_b64 !== 'string' || !data.data_b64) {
      return new NextResponse('Image not found', { status: 404, headers: NOT_FOUND_HEADERS });
    }

    const contentType =
      typeof data.content_type === 'string' &&
      /^image\/(webp|jpeg|png)$/.test(data.content_type)
        ? data.content_type
        : 'image/webp';

    const bytes = Buffer.from(data.data_b64, 'base64');

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        ...IMMUTABLE_CDN_HEADERS,
        'Content-Type': contentType,
        'Content-Length': String(bytes.byteLength),
        ETag: etag,
      },
    });
  } catch {
    return new NextResponse('Image service error', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
