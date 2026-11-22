import { NextRequest, NextResponse } from 'next/server';
import {
  checkMemoryRateLimit,
  createCheckoutGuardChallenge,
  getTrustedClientIp,
  verifySameOrigin,
} from '@/lib/serverSecurity';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * GET /api/checkout-guard
 * Issues a short-lived, single-use HMAC-signed micro Proof-of-Work challenge
 * solved invisibly by the customer's browser while reviewing their cart (~25ms).
 * Blocks automated checkout flood & inventory-hoarding bots with zero CAPTCHA friction.
 */
export async function GET(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = checkMemoryRateLimit(`checkout_guard:${ip}`, 45, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many checkout attempts. Please wait a minute.' },
      { status: 429, headers: NO_STORE_HEADERS }
    );
  }

  // If an Origin/Referer header is present, require exact same-origin match
  const hasOriginOrReferer =
    Boolean(request.headers.get('origin')) || Boolean(request.headers.get('referer'));
  if (hasOriginOrReferer && !verifySameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const challenge = createCheckoutGuardChallenge();
  if (!challenge) {
    return NextResponse.json(
      { success: false, error: 'Checkout protection temporarily unavailable.' },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      success: true,
      ...challenge,
    },
    { headers: NO_STORE_HEADERS }
  );
}
