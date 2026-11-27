import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianGstin } from '@/lib/billing';
import {
  fetchUncachedSettingsFromDb,
  getCachedPublicSettings,
  invalidatePublicSettingsCache,
  sanitizeMerchantSettings,
  saveLocalFallbackSettings,
} from '@/lib/settingsCache';
import {
  checkMemoryRateLimit,
  getSupabaseAdminClient,
  getTrustedClientIp,
  isRequestBodyTooLarge,
  logSecurityEvent,
  maskIpForLog,
  verifyAdminSession,
  verifySameOrigin,
} from '@/lib/serverSecurity';

const PUBLIC_SETTINGS_CDN_HEADERS = {
  'Cache-Control': 'public, max-age=10, s-maxage=30, stale-while-revalidate=120',
  'CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
};

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * GET /api/settings
 * Returns live public store & legal billing configuration (UPI ID, delivery fees,
 * Non-GST vs GST mode, GSTIN, Udyam/FSSAI numbers, and Gujarat courier guard).
 */
export async function GET(request: NextRequest) {
  try {
    // Read dynamic request properties so Next.js 16 never freezes a build-time snapshot
    const _ifNoneMatch = request.headers.get('if-none-match');
    const isFresh = new URL(request.url).searchParams.get('fresh') === '1';

    if (isFresh) {
      const freshSettings = await fetchUncachedSettingsFromDb();
      return NextResponse.json(
        { success: true, settings: freshSettings, fresh: Boolean(_ifNoneMatch || true) },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    const settings = await getCachedPublicSettings();
    return NextResponse.json(
      { success: true, settings },
      { status: 200, headers: PUBLIC_SETTINGS_CDN_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to load store settings.' },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * POST /api/settings
 * Admin-only: Validates and persists Dual Legal Billing & Store settings to Supabase (`public.store_settings`)
 * and immediately invalidates the Edge/server settings cache.
 */
export async function POST(request: NextRequest) {
  if (isRequestBodyTooLarge(request, 16_384)) {
    return NextResponse.json(
      { success: false, error: 'Settings payload is too large.' },
      { status: 413, headers: NO_STORE_HEADERS }
    );
  }

  const ip = getTrustedClientIp(request);
  const rl = checkMemoryRateLimit(`admin_settings_post:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many settings updates. Please wait a moment.' },
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
    const rawSettings =
      body && typeof body.settings === 'object' && body.settings !== null
        ? (body.settings as Record<string, unknown>)
        : body;

    const cleanSettings = sanitizeMerchantSettings(rawSettings);

    if (cleanSettings.billingMode === 'GST' && !isValidIndianGstin(cleanSettings.gstin)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Enter a valid 15-character GSTIN (e.g. 24AAAAA0000A1Z5) to enable GST Tax Invoice mode, or select Non-GST Retail Cash Memo.',
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (cleanSettings.gstin && !isValidIndianGstin(cleanSettings.gstin)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid GSTIN format. A valid Indian GSTIN must be 15 characters (e.g. 24AAAAA0000A1Z5), or leave it blank for Non-GST mode.',
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error } = await supabase.from('store_settings').upsert({
        id: 'primary',
        config: cleanSettings,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('Supabase store_settings upsert failed:', error.message);
        return NextResponse.json(
          { success: false, error: 'Failed to save settings to database.' },
          { status: 500, headers: NO_STORE_HEADERS }
        );
      }
    } else {
      saveLocalFallbackSettings(cleanSettings);
    }

    invalidatePublicSettingsCache();

    logSecurityEvent('admin_settings_updated', {
      billingMode: cleanSettings.billingMode,
      restrictCourierToGujarat: cleanSettings.restrictCourierToGujarat,
      ip: maskIpForLog(ip),
    });

    return NextResponse.json(
      { success: true, settings: cleanSettings },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid settings payload.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
