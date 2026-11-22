import { NextRequest, NextResponse } from 'next/server';
import { getCachedPublicCatalog } from '@/lib/catalogCache';

const PUBLIC_CDN_HEADERS = {
  'Cache-Control': 'public, max-age=5, s-maxage=15, stale-while-revalidate=60',
  'CDN-Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
};

/**
 * GET /api/catalog
 * High-throughput public storefront catalog served via Vercel Edge CDN + Next.js `'use cache'`.
 * - Strips wholesale cost & caps customer-visible stock at 10
 * - Returns only live, in-stock products with lightweight CDN image URLs (~4 KB JSON)
 * - Supports ETag / If-None-Match 304 responses for zero-byte background refreshes
 * - Absorbs 1,000-2,000+ concurrent shoppers directly at Vercel Mumbai Edge (bom1)
 */
export async function GET(request: NextRequest) {
  try {
    // Access request header/url dynamically so Next.js 16 never freezes build-time snapshot
    const ifNoneMatch = request.headers.get('if-none-match');
    const catalog = await getCachedPublicCatalog();
    const etag = `"${catalog.version}"`;

    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ...PUBLIC_CDN_HEADERS,
          ETag: etag,
        },
      });
    }

    return NextResponse.json(catalog, {
      status: 200,
      headers: {
        ...PUBLIC_CDN_HEADERS,
        ETag: etag,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Store catalog temporarily unavailable. Please retry.' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
