import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  clearAdminSessionCookie,
  getAllowedRecoveryEmails,
  getTrustedClientIp,
  hashSecretWithScrypt,
  loadEffectiveAdminCredentials,
  logSecurityEvent,
  maskIpForLog,
  sanitizeText,
  saveUpdatedAdminCredentials,
  verifyAndConsumeAdminOtp,
  verifySameOrigin,
} from '@/lib/serverSecurity';

const VERIFY_WINDOW_MS = 15 * 60 * 1000;
const BLOCKED_WEAK_PINS = new Set(['0000', '1111', '1234', '123456', '1602', 'password', 'admin']);

/**
 * POST /api/admin/reset/confirm
 * Verifies the single-use 6-digit recovery OTP and updates the admin login email and/or scrypt-hashed PIN.
 */
export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request);

  if (!verifySameOrigin(request)) {
    logSecurityEvent('admin_reset_confirm_csrf_blocked', { ip: maskIpForLog(ip) });
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const rl = await checkRateLimit(`admin_otp_confirm_ip:${ip}`, 6, VERIFY_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many verification attempts. Try again in ${rl.retryAfterSec} seconds.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as {
      otp?: unknown;
      resetMode?: unknown;
      newPin?: unknown;
      newEmail?: unknown;
    };

    const otp = sanitizeText(body?.otp, 10).replace(/\D/g, '');
    const resetMode =
      body?.resetMode === 'EMAIL' || body?.resetMode === 'BOTH' ? body.resetMode : 'PIN';
    const newPin = typeof body?.newPin === 'string' ? body.newPin.trim() : '';
    const newEmail = sanitizeText(body?.newEmail, 120).toLowerCase();

    if (otp.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter the exact 6-digit OTP sent to your recovery email.' },
        { status: 400 }
      );
    }

    const wantsPinUpdate = resetMode === 'PIN' || resetMode === 'BOTH';
    const wantsEmailUpdate = resetMode === 'EMAIL' || resetMode === 'BOTH';

    if (wantsPinUpdate) {
      if (newPin.length < 4 || newPin.length > 64) {
        return NextResponse.json(
          { success: false, error: 'New PIN / password must be between 4 and 64 characters.' },
          { status: 400 }
        );
      }
      if (BLOCKED_WEAK_PINS.has(newPin.toLowerCase())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Please choose a stronger PIN/password (avoid 1234, 0000, or previously leaked PINs).',
          },
          { status: 400 }
        );
      }
    }

    if (wantsEmailUpdate) {
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid new admin Gmail address.' },
          { status: 400 }
        );
      }
    }

    // Load current credentials first so EMAIL-only reset preserves existing pinHash
    const existingCreds = await loadEffectiveAdminCredentials();
    if (!wantsPinUpdate && !existingCreds?.pinHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'No existing PIN is configured yet. Choose "Reset Both (Email & PIN)" to set your PIN too.',
        },
        { status: 400 }
      );
    }

    // Verify & atomically consume single-use OTP
    const otpResult = await verifyAndConsumeAdminOtp(otp);
    if (!otpResult.valid) {
      logSecurityEvent('admin_otp_verify_failed', { ip: maskIpForLog(ip), resetMode });
      return NextResponse.json(
        { success: false, error: otpResult.reason || 'Invalid or expired OTP.' },
        { status: 401 }
      );
    }

    const nextPinHash = wantsPinUpdate
      ? hashSecretWithScrypt(newPin)
      : existingCreds!.pinHash;

    // When updating email, set the new primary login email (keep recovery emails untouched on server!)
    const nextEmails = wantsEmailUpdate
      ? [newEmail]
      : existingCreds?.adminEmails && existingCreds.adminEmails.length > 0
      ? existingCreds.adminEmails
      : getAllowedRecoveryEmails();

    await saveUpdatedAdminCredentials({
      adminEmails: nextEmails,
      pinHash: nextPinHash,
    });

    logSecurityEvent('admin_credentials_reset_success', {
      resetMode,
      ip: maskIpForLog(ip),
    });

    // Clear any existing admin cookie so user signs in fresh with their updated credentials
    const response = NextResponse.json({
      success: true,
      message:
        resetMode === 'BOTH'
          ? 'Admin login email and security PIN updated! Please sign in with your new credentials.'
          : resetMode === 'EMAIL'
          ? 'Admin login email updated! Please sign in with your new email.'
          : 'Admin security PIN updated! Please sign in with your new PIN.',
    });
    clearAdminSessionCookie(response);
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to complete reset right now. Please try again.' },
      { status: 500 }
    );
  }
}
