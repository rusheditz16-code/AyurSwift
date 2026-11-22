import { NextRequest, NextResponse } from 'next/server';
import {
  checkMemoryRateLimit,
  CONSENT_VERSION,
  createSignedConsentToken,
  getTrustedClientIp,
  isRequestBodyTooLarge,
  setConsentCookie,
  verifyConsentCookie,
  verifySameOrigin,
} from '@/lib/serverSecurity';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * GET /api/consent
 * Returns whether this browser holds a valid HMAC-signed Privacy & Essential Cookie consent cookie.
 */
export async function GET(request: NextRequest) {
  const accepted = verifyConsentCookie(request);
  return NextResponse.json(
    {
      success: true,
      accepted,
      version: CONSENT_VERSION,
    },
    { headers: NO_STORE_HEADERS }
  );
}

/**
 * POST /api/consent
 * Records explicit user acceptance of AyurSwift Privacy Policy, Terms & Essential Cookies
 * and issues a 180-day HMAC-SHA256 signed HttpOnly cookie required for checkout & tracking.
 */
export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = checkMemoryRateLimit(`consent_post:${ip}`, 40, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again in a minute.' },
      { status: 429, headers: NO_STORE_HEADERS }
    );
  }

  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  if (isRequestBodyTooLarge(request, 4_096)) {
    return NextResponse.json(
      { success: false, error: 'Request too large.' },
      { status: 413, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { accepted?: unknown };
    if (body?.accepted !== true) {
      return NextResponse.json(
        { success: false, error: 'Explicit privacy & cookie consent is required.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const token = createSignedConsentToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Consent service unavailable.' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const res = NextResponse.json(
      {
        success: true,
        accepted: true,
        version: CONSENT_VERSION,
      },
      { headers: NO_STORE_HEADERS }
    );
    setConsentCookie(res, token);
    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid consent request.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
