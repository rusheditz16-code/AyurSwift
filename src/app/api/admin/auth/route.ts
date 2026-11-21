import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  clearAdminSessionCookie,
  createAdminSessionToken,
  getTrustedClientIp,
  isAdminAuthConfigured,
  loadEffectiveAdminCredentials,
  logSecurityEvent,
  maskIpForLog,
  revokeAdminSession,
  sanitizeText,
  setAdminSessionCookie,
  verifyAdminSession,
  verifySameOrigin,
  verifyScryptHash,
} from '@/lib/serverSecurity';

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * GET /api/admin/auth
 * Returns current server-verified admin session status (including tokenVersion check).
 */
export async function GET(request: NextRequest) {
  const session = verifyAdminSession(request);
  const creds = await loadEffectiveAdminCredentials();

  if (!session || (creds && session.tv && session.tv < creds.tokenVersion)) {
    const res = NextResponse.json({
      authenticated: false,
      configured: await isAdminAuthConfigured(),
    });
    if (session) clearAdminSessionCookie(res);
    return res;
  }

  return NextResponse.json({
    authenticated: true,
    email: session.email,
    expiresAt: session.exp * 1000,
  });
}

/**
 * POST /api/admin/auth
 * Verifies admin Gmail + PIN/password against active server credentials (env or OTP-updated DB)
 * and issues a signed HttpOnly cookie.
 */
export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request);

  if (!verifySameOrigin(request)) {
    logSecurityEvent('admin_login_csrf_blocked', { ip: maskIpForLog(ip) });
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const configured = await isAdminAuthConfigured();
  const creds = await loadEffectiveAdminCredentials();
  if (!configured || !creds) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Admin login is not configured on the server yet. Set ADMIN_SESSION_SECRET (plus ADMIN_EMAILS & ADMIN_PIN_HASH or complete a Recovery OTP reset).',
      },
      { status: 503 }
    );
  }

  // Per-IP rate limit (10 attempts / 15 min)
  const ipLimit = await checkRateLimit(`admin_login_ip:${ip}`, 10, LOGIN_WINDOW_MS);
  if (!ipLimit.allowed) {
    logSecurityEvent('admin_login_rate_limited', {
      scope: 'ip',
      ip: maskIpForLog(ip),
      retryAfterSec: ipLimit.retryAfterSec,
    });
    return NextResponse.json(
      {
        success: false,
        error: `Too many failed attempts. Try again in ${ipLimit.retryAfterSec} seconds.`,
        retryAfterSec: ipLimit.retryAfterSec,
      },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as { email?: unknown; pin?: unknown };
    const cleanEmail = sanitizeText(body?.email, 120).toLowerCase();
    const cleanPin = typeof body?.pin === 'string' ? body.pin.trim() : '';

    if (!cleanEmail || !cleanPin || cleanPin.length > 64) {
      return NextResponse.json(
        { success: false, error: 'Email and security PIN/password are required.' },
        { status: 400 }
      );
    }

    // Per-account rate limit (5 attempts / 15 min)
    const acctLimit = await checkRateLimit(`admin_login_acct:${cleanEmail}`, 5, LOGIN_WINDOW_MS);
    if (!acctLimit.allowed) {
      logSecurityEvent('admin_login_locked', {
        scope: 'account',
        ip: maskIpForLog(ip),
        retryAfterSec: acctLimit.retryAfterSec,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Account temporarily locked due to repeated failed attempts. Try again in ${acctLimit.retryAfterSec} seconds.`,
          retryAfterSec: acctLimit.retryAfterSec,
        },
        { status: 429 }
      );
    }

    const emailOk = creds.adminEmails.includes(cleanEmail);
    const pinOk = verifyScryptHash(cleanPin, creds.pinHash);

    if (!emailOk || !pinOk) {
      logSecurityEvent('admin_login_failed', { ip: maskIpForLog(ip) });
      return NextResponse.json(
        { success: false, error: 'Invalid email address or security PIN. Access denied.' },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken(cleanEmail, creds.tokenVersion);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Session signing unavailable.' },
        { status: 503 }
      );
    }

    logSecurityEvent('admin_login_success', {
      ip: maskIpForLog(ip),
      emailDomain: cleanEmail.split('@')[1] || 'unknown',
    });

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      email: cleanEmail,
    });
    setAdminSessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to process sign-in request.' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/auth
 * Revokes current admin session token and clears HttpOnly cookie.
 */
export async function DELETE(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const ip = getTrustedClientIp(request);
  revokeAdminSession(request);
  logSecurityEvent('admin_logout', { ip: maskIpForLog(ip) });

  const response = NextResponse.json({ success: true, authenticated: false });
  clearAdminSessionCookie(response);
  return response;
}
