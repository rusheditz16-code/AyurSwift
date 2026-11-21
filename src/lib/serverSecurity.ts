import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
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
 * Server-only Supabase client.
 * Uses SUPABASE_SERVICE_ROLE_KEY when set, or authenticates server requests via
 * a 256-bit HMAC token derived from the server-only ADMIN_SESSION_SECRET verified
 * by public.is_ayurswift_server() in Postgres RLS.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (cachedSupabaseAdmin !== undefined) return cachedSupabaseAdmin;

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const sessionSecret = (process.env.ADMIN_SESSION_SECRET || '').trim();

  if (url && url.startsWith('https://') && url !== 'https://your-project.supabase.co') {
    if (serviceKey) {
      cachedSupabaseAdmin = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      return cachedSupabaseAdmin;
    }

    if (anonKey && sessionSecret.length >= 32) {
      const serverHmacToken = crypto
        .createHmac('sha256', sessionSecret)
        .update('ayurswift-supabase-server-v1')
        .digest('hex');

      cachedSupabaseAdmin = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: {
            'x-ayurswift-server-key': serverHmacToken,
          },
        },
      });
      return cachedSupabaseAdmin;
    }
  }

  cachedSupabaseAdmin = null;
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

// Locked 2-email recovery allowlist (can be overridden strictly via server env ADMIN_RECOVERY_EMAILS)
const DEFAULT_RECOVERY_EMAILS = ['rushirajdabhi16@gmail.com', 'ayurswift.care@gmail.com'];
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

export interface EffectiveAdminCredentials {
  adminEmails: string[];
  pinHash: string;
  tokenVersion: number;
}

interface StoredOtpRecord {
  id: string;
  purpose: 'PIN' | 'EMAIL' | 'BOTH';
  otpHash: string;
  expiresAt: string;
  attempts: number;
  used: boolean;
  createdAt: string;
}

interface LocalAdminStateFile {
  credentials?: EffectiveAdminCredentials;
  latestOtp?: StoredOtpRecord;
}

function getLocalAdminStatePath(): string {
  return path.join(os.tmpdir(), 'ayurswift_admin_security_state.json');
}

function readLocalAdminState(): LocalAdminStateFile {
  try {
    const filePath = getLocalAdminStatePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as LocalAdminStateFile;
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

function writeLocalAdminState(state: LocalAdminStateFile): void {
  try {
    fs.writeFileSync(getLocalAdminStatePath(), JSON.stringify(state, null, 2), 'utf-8');
  } catch {}
}

export function hashSecretWithScrypt(plain: string): string {
  const saltHex = crypto.randomBytes(16).toString('hex');
  const hashHex = crypto.scryptSync(plain, saltHex, 64).toString('hex');
  return `scrypt:${saltHex}:${hashHex}`;
}

export function verifyScryptHash(candidate: string, storedHash: string): boolean {
  const parts = storedHash.trim().split(':');
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

/**
 * Returns the strictly locked recovery Gmail allowlist (at most 2 authorized emails).
 */
export function getAllowedRecoveryEmails(): string[] {
  const fromEnv = (process.env.ADMIN_RECOVERY_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (fromEnv.length > 0) return Array.from(new Set(fromEnv)).slice(0, 2);
  return [...DEFAULT_RECOVERY_EMAILS];
}

export function isAuthorizedRecoveryEmail(email: string): boolean {
  const clean = email.trim().toLowerCase();
  return getAllowedRecoveryEmails().includes(clean);
}

/**
 * Loads active admin credentials from Supabase admin_credentials (if updated via OTP reset),
 * falling back to server-only env vars ADMIN_EMAILS & ADMIN_PIN_HASH.
 */
export async function loadEffectiveAdminCredentials(): Promise<EffectiveAdminCredentials | null> {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_credentials')
        .select('admin_emails, pin_hash, token_version')
        .eq('id', 'primary')
        .maybeSingle();

      if (
        !error &&
        data &&
        Array.isArray(data.admin_emails) &&
        data.admin_emails.length > 0 &&
        typeof data.pin_hash === 'string' &&
        data.pin_hash.startsWith('scrypt:')
      ) {
        return {
          adminEmails: data.admin_emails.map((e: string) => e.trim().toLowerCase()).filter(Boolean),
          pinHash: data.pin_hash.trim(),
          tokenVersion: Number(data.token_version) || 1,
        };
      }
    } catch {}
  }

  // Local fallback file (for local dev or when Supabase service_role isn't configured yet)
  const local = readLocalAdminState().credentials;
  if (
    local &&
    Array.isArray(local.adminEmails) &&
    local.adminEmails.length > 0 &&
    typeof local.pinHash === 'string' &&
    local.pinHash.startsWith('scrypt:')
  ) {
    return local;
  }

  // Fallback to server-only env vars
  const envHash = (process.env.ADMIN_PIN_HASH || '').trim();
  const envEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (envHash.startsWith('scrypt:') && envEmails.length > 0) {
    return {
      adminEmails: envEmails,
      pinHash: envHash,
      tokenVersion: 1,
    };
  }

  return null;
}

export async function saveUpdatedAdminCredentials(update: {
  adminEmails: string[];
  pinHash: string;
}): Promise<EffectiveAdminCredentials> {
  const current = await loadEffectiveAdminCredentials();
  const nextVersion = (current?.tokenVersion || 1) + 1;
  const nextCreds: EffectiveAdminCredentials = {
    adminEmails: Array.from(
      new Set(update.adminEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))
    ),
    pinHash: update.pinHash,
    tokenVersion: nextVersion,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from('admin_credentials').upsert({
      id: 'primary',
      admin_emails: nextCreds.adminEmails,
      pin_hash: nextCreds.pinHash,
      token_version: nextCreds.tokenVersion,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('Supabase admin_credentials upsert error');
    }
  }

  const localState = readLocalAdminState();
  localState.credentials = nextCreds;
  writeLocalAdminState(localState);

  return nextCreds;
}

/**
 * Generates a cryptographically random 6-digit single-use OTP, hashes it with scrypt,
 * invalidates prior unused OTPs, and stores only the hash.
 */
export async function createAndStoreAdminOtp(
  purpose: 'PIN' | 'EMAIL' | 'BOTH'
): Promise<{ otp: string; expiresAt: string }> {
  const otp = String(crypto.randomInt(100000, 1000000));
  const id = crypto.randomBytes(12).toString('hex');
  const otpHash = hashSecretWithScrypt(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const createdAt = new Date().toISOString();

  const record: StoredOtpRecord = {
    id,
    purpose,
    otpHash,
    expiresAt,
    attempts: 0,
    used: false,
    createdAt,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      // Invalidate any previously active unused OTPs
      await supabase.from('admin_otps').update({ used: true }).eq('used', false);
      await supabase.from('admin_otps').insert({
        id: record.id,
        purpose: record.purpose,
        otp_hash: record.otpHash,
        expires_at: record.expiresAt,
        attempts: 0,
        used: false,
        created_at: record.createdAt,
      });
    } catch {
      console.warn('Supabase admin_otps insert fallback');
    }
  }

  const localState = readLocalAdminState();
  localState.latestOtp = record;
  writeLocalAdminState(localState);

  return { otp, expiresAt };
}

/**
 * Verifies a 6-digit OTP against the latest unused, non-expired OTP hash.
 * Enforces single-use and locks out after MAX_OTP_ATTEMPTS failed guesses.
 */
export async function verifyAndConsumeAdminOtp(
  candidateOtp: string
): Promise<{ valid: boolean; reason?: string }> {
  const cleanOtp = candidateOtp.replace(/\D/g, '');
  if (cleanOtp.length !== 6) {
    return { valid: false, reason: 'Please enter a valid 6-digit OTP.' };
  }

  const now = Date.now();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_otps')
        .select('*')
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const expMs = new Date(String(data.expires_at)).getTime();
        const attempts = Number(data.attempts) || 0;

        if (expMs <= now) {
          await supabase.from('admin_otps').update({ used: true }).eq('id', data.id);
          return { valid: false, reason: 'OTP has expired. Please request a new OTP.' };
        }
        if (attempts >= MAX_OTP_ATTEMPTS) {
          await supabase.from('admin_otps').update({ used: true }).eq('id', data.id);
          return {
            valid: false,
            reason: 'Too many invalid OTP attempts. Please request a new OTP.',
          };
        }

        const matched = verifyScryptHash(cleanOtp, String(data.otp_hash || ''));
        if (!matched) {
          const nextAttempts = attempts + 1;
          await supabase
            .from('admin_otps')
            .update({
              attempts: nextAttempts,
              used: nextAttempts >= MAX_OTP_ATTEMPTS,
            })
            .eq('id', data.id);
          return { valid: false, reason: 'Invalid OTP code. Please check your email and try again.' };
        }

        // Single-use: consume OTP immediately
        await supabase.from('admin_otps').update({ used: true }).eq('id', data.id);
        const localState = readLocalAdminState();
        if (localState.latestOtp) {
          localState.latestOtp.used = true;
          writeLocalAdminState(localState);
        }
        return { valid: true };
      }
    } catch {}
  }

  // Fallback to local state file
  const localState = readLocalAdminState();
  const rec = localState.latestOtp;
  if (!rec || rec.used) {
    return { valid: false, reason: 'No active OTP found. Please request a new OTP first.' };
  }

  if (new Date(rec.expiresAt).getTime() <= now) {
    rec.used = true;
    writeLocalAdminState(localState);
    return { valid: false, reason: 'OTP has expired. Please request a new OTP.' };
  }

  if (rec.attempts >= MAX_OTP_ATTEMPTS) {
    rec.used = true;
    writeLocalAdminState(localState);
    return { valid: false, reason: 'Too many invalid OTP attempts. Please request a new OTP.' };
  }

  const matched = verifyScryptHash(cleanOtp, rec.otpHash);
  if (!matched) {
    rec.attempts += 1;
    if (rec.attempts >= MAX_OTP_ATTEMPTS) rec.used = true;
    writeLocalAdminState(localState);
    return { valid: false, reason: 'Invalid OTP code. Please check your email and try again.' };
  }

  rec.used = true;
  writeLocalAdminState(localState);
  return { valid: true };
}

export async function isAdminAuthConfigured(): Promise<boolean> {
  const secret = (process.env.ADMIN_SESSION_SECRET || '').trim();
  if (secret.length < 32) return false;
  const creds = await loadEffectiveAdminCredentials();
  return Boolean(creds && creds.adminEmails.length > 0 && creds.pinHash.startsWith('scrypt:'));
}

export interface AdminSessionPayload {
  email: string;
  role: 'admin';
  tv?: number;
  iat: number;
  exp: number;
  jti: string;
}

function getSessionSecret(): string | null {
  const secret = (process.env.ADMIN_SESSION_SECRET || '').trim();
  return secret.length >= 32 ? secret : null;
}

export function createAdminSessionToken(email: string, tokenVersion = 1): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    role: 'admin',
    tv: tokenVersion,
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
    .replace(/\r?\n+/g, ' ')
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
