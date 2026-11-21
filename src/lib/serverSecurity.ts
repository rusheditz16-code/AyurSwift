import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const ADMIN_COOKIE_NAME = 'ayurswift_admin_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

const ALLOWED_ORIGINS = new Set<string>([
  'https://ayurswift.vercel.app',
  'https://ayurswift.in',
  'https://www.ayurswift.in',
]);

if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.add('http://localhost:3000');
  ALLOWED_ORIGINS.add('http://127.0.0.1:3000');
}

// Bounded in-memory rate limit fallback (shared DB table is preferred when configured)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const memoryRateLimits = new Map<string, RateLimitRecord>();
const MAX_RATE_LIMIT_KEYS = 10_000;

// In-memory revoked session JTIs (prevents replay after logout within instance lifetime)
const revokedJtis = new Map<string, number>();

let cachedSupabaseAdmin: SupabaseClient | null | undefined;

/**
 * Server-only Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Never falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY for privileged writes.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (cachedSupabaseAdmin !== undefined) return cachedSupabaseAdmin;

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (
    url &&
    serviceKey &&
    url.startsWith('https://') &&
    url !== 'https://your-project.supabase.co'
  ) {
    cachedSupabaseAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } else {
    cachedSupabaseAdmin = null;
  }

  return cachedSupabaseAdmin;
}

/**
 * Extracts client IP from trusted reverse proxy headers.
 * Never trusts the client-controlled first entry of x-forwarded-for.
 */
export function getTrustedClientIp(request: NextRequest): string {
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) {
    const parts = vercelForwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Use rightmost entry appended by the platform proxy, not the client-spoofable first entry
    const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return '127.0.0.1';
}

export function maskIpForLog(ip: string): string {
  if (!ip) return 'unknown';
  if (ip.includes('.')) {
    const segs = ip.split('.');
    return segs.length === 4 ? `${segs[0]}.${segs[1]}.x.x` : 'masked-ipv4';
  }
  return `${ip.slice(0, 8)}::masked`;
}

/**
 * Shared rate limiter (uses Supabase rate_limits table when service_role is configured,
 * with a bounded in-memory sliding-window fallback).
 */
export async function checkRateLimit(
  bucketKey: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const now = Date.now();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    try {
      const { data: existing, error: selErr } = await supabase
        .from('rate_limits')
        .select('count, reset_at')
        .eq('key', bucketKey)
        .maybeSingle();

      if (!selErr) {
        if (!existing || new Date(existing.reset_at).getTime() <= now) {
          const resetAtIso = new Date(now + windowMs).toISOString();
          await supabase
            .from('rate_limits')
            .upsert({ key: bucketKey, count: 1, reset_at: resetAtIso });
          return { allowed: true, retryAfterSec: 0 };
        }

        const currentCount = Number(existing.count) || 0;
        const resetMs = new Date(existing.reset_at).getTime();
        if (currentCount >= limit) {
          return {
            allowed: false,
            retryAfterSec: Math.max(1, Math.ceil((resetMs - now) / 1000)),
          };
        }

        await supabase
          .from('rate_limits')
          .update({ count: currentCount + 1 })
          .eq('key', bucketKey);
        return { allowed: true, retryAfterSec: 0 };
      }
    } catch {
      // Fall through cleanly to bounded memory limiter if rate_limits table is not created yet
    }
  }

  if (memoryRateLimits.size >= MAX_RATE_LIMIT_KEYS) {
    for (const [k, v] of memoryRateLimits.entries()) {
      if (v.resetAt <= now) memoryRateLimits.delete(k);
    }
    if (memoryRateLimits.size >= MAX_RATE_LIMIT_KEYS) {
      memoryRateLimits.clear();
    }
  }

  const record = memoryRateLimits.get(bucketKey);
  if (!record || now > record.resetAt) {
    memoryRateLimits.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  record.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * CSRF protection for cookie-authenticated state-changing requests.
 * Verifies Origin (or Referer) matches an exact allowlist of our own domains.
 */
export function verifySameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const selfOrigin = request.nextUrl.origin;

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto =
    request.headers.get('x-forwarded-proto') ||
    request.nextUrl.protocol.replace(':', '') ||
    'https';
  const hostOrigin = host ? `${proto}://${host}` : null;

  const candidate = origin || (referer ? safeParseOrigin(referer) : null);
  if (!candidate) return false;

  if (
    ALLOWED_ORIGINS.has(candidate) ||
    candidate === selfOrigin ||
    (hostOrigin && candidate === hostOrigin)
  ) {
    return true;
  }

  return false;
}

function safeParseOrigin(urlStr: string): string | null {
  try {
    return new URL(urlStr).origin;
  } catch {
    return null;
  }
}

export function isAdminAuthConfigured(): boolean {
  const hash = (process.env.ADMIN_PIN_HASH || '').trim();
  const secret = (process.env.ADMIN_SESSION_SECRET || '').trim();
  const emails = (process.env.ADMIN_EMAILS || '').trim();
  return Boolean(hash.startsWith('scrypt:') && secret.length >= 32 && emails.length > 0);
}

export function isAllowedAdminEmail(email: string): boolean {
  const configured = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (configured.length === 0) return false;
  return configured.includes(email.trim().toLowerCase());
}

/**
 * Verifies admin PIN/password against salted scrypt hash in process.env.ADMIN_PIN_HASH.
 * Format: scrypt:<saltHex>:<hashHex>
 */
export function verifyAdminPassword(candidate: string): boolean {
  const stored = (process.env.ADMIN_PIN_HASH || '').trim();
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, saltHex, hashHex] = parts;
  if (!saltHex || !hashHex) return false;

  try {
    const expectedBuf = Buffer.from(hashHex, 'hex');
    const derivedBuf = crypto.scryptSync(candidate, saltHex, expectedBuf.length);
    if (derivedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derivedBuf, expectedBuf);
  } catch {
    return false;
  }
}

export interface AdminSessionPayload {
  email: string;
  role: 'admin';
  iat: number;
  exp: number;
  jti: string;
}

function getSessionSecret(): string | null {
  const secret = (process.env.ADMIN_SESSION_SECRET || '').trim();
  return secret.length >= 32 ? secret : null;
}

export function createAdminSessionToken(email: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    role: 'admin',
    iat: nowSec,
    exp: nowSec + SESSION_TTL_SECONDS,
    jti: crypto.randomBytes(16).toString('hex'),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${sigB64}`;
}

export function verifyAdminTokenString(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null;
  const secret = getSessionSecret();
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const expectedSigB64 = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64, 'utf8');
  const expBuf = Buffer.from(expectedSigB64, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as AdminSessionPayload;
    const nowSec = Math.floor(Date.now() / 1000);

    if (
      !parsed ||
      parsed.role !== 'admin' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.exp !== 'number' ||
      typeof parsed.jti !== 'string' ||
      parsed.exp <= nowSec
    ) {
      return null;
    }

    // Purge expired entries from revocation map lazily
    const revokedExp = revokedJtis.get(parsed.jti);
    if (revokedExp !== undefined) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function verifyAdminSession(request: NextRequest): AdminSessionPayload | null {
  const cookieVal = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminTokenString(cookieVal);
}

export function revokeAdminSession(request: NextRequest): void {
  const cookieVal = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = verifyAdminTokenString(cookieVal);
  if (session) {
    revokedJtis.set(session.jti, session.exp);
    const nowSec = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of revokedJtis.entries()) {
      if (exp <= nowSec) revokedJtis.delete(jti);
    }
  }
}

export function setAdminSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Cryptographically random, human-readable Order ID (e.g. #AS-7K4M9X2P).
 * Eliminates sequential enumeration.
 */
export function generateSecureOrderId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += alphabet[bytes[i] % alphabet.length];
  }
  return `#AS-${suffix}`;
}

/**
 * Strips HTML brackets and control characters to mitigate XSS / injection.
 */
export function sanitizeText(val: unknown, maxLen = 200): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Normalizes a 10-digit Indian mobile number; returns null if invalid.
 */
export function normalizeIndianPhone(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  let digits = val.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/**
 * Validates product image URLs (blocks javascript:, data:text/html, SVG data URLs, plain http).
 */
export function isSafeImageUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 4_000_000) return false;
  if (trimmed.startsWith('/ayurswift-')) return true;
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Optional Cloudflare Turnstile verification (active automatically when TURNSTILE_SECRET_KEY is set).
 */
export async function verifyTurnstileIfConfigured(
  token: unknown,
  ip: string
): Promise<boolean> {
  const secret = (process.env.TURNSTILE_SECRET_KEY || '').trim();
  if (!secret) return true;
  if (typeof token !== 'string' || !token.trim()) return false;

  try {
    const formData = new URLSearchParams();
    formData.set('secret', secret);
    formData.set('response', token.trim());
    formData.set('remoteip', ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

/**
 * Structured audit logging for important security events (never logs secrets or full PII).
 */
export function logSecurityEvent(
  event: string,
  meta: Record<string, string | number | boolean | undefined>
): void {
  const entry = {
    tag: 'SECURITY_AUDIT',
    timestamp: new Date().toISOString(),
    event,
    ...meta,
  };
  console.info(JSON.stringify(entry));
}
