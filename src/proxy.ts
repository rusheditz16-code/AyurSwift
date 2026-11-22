import { NextResponse } from 'next/server';

/**
 * Next.js 16 Network Boundary Proxy — scoped STRICTLY to known automated hacker/scanner probe paths.
 * Legitimate storefront, admin, and API routes are completely unmatched (0ms overhead).
 * Returns edge-cacheable 403 Forbidden so scanner floods are absorbed at Vercel Edge.
 */
export function proxy() {
  return new NextResponse('Forbidden', {
    status: 403,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'CDN-Cache-Control': 'public, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export const config = {
  matcher: [
    '/.env',
    '/.env.:path*',
    '/.git/:path*',
    '/.htaccess',
    '/wp-admin',
    '/wp-admin/:path*',
    '/wp-login.php',
    '/wp-content/:path*',
    '/wp-includes/:path*',
    '/phpmyadmin',
    '/phpmyadmin/:path*',
    '/xmlrpc.php',
    '/admin.php',
  ],
};
