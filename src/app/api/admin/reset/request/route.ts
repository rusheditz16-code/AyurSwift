import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  createAndStoreAdminOtp,
  getAllowedRecoveryEmails,
  getTrustedClientIp,
  isAuthorizedRecoveryEmail,
  logSecurityEvent,
  maskIpForLog,
  sanitizeText,
  verifySameOrigin,
} from '@/lib/serverSecurity';
import { isOtpEmailProviderConfigured, sendAdminOtpEmail } from '@/lib/serverEmail';

const OTP_REQ_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ALLOWED_PURPOSES = new Set<'PIN' | 'EMAIL' | 'BOTH'>(['PIN', 'EMAIL', 'BOTH']);

const GENERIC_SENT_MSG =
  'If that address is one of your authorized recovery Gmail accounts, a 6-digit OTP has been sent to your registered recovery emails (valid for 10 minutes).';

/**
 * POST /api/admin/reset/request
 * Generates a single-use 6-digit OTP and emails it STRICTLY to the locked 2-email recovery allowlist.
 * Never reveals whether an arbitrary email is registered (prevents enumeration).
 */
export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request);

  if (!verifySameOrigin(request)) {
    logSecurityEvent('admin_otp_csrf_blocked', { ip: maskIpForLog(ip) });
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  // Strict per-IP rate limit: max 3 OTP requests per 15 minutes
  const ipLimit = await checkRateLimit(`admin_otp_req_ip:${ip}`, 3, OTP_REQ_WINDOW_MS);
  if (!ipLimit.allowed) {
    logSecurityEvent('admin_otp_rate_limited', {
      scope: 'ip',
      ip: maskIpForLog(ip),
      retryAfterSec: ipLimit.retryAfterSec,
    });
    return NextResponse.json(
      {
        success: false,
        error: `Too many OTP requests. Please wait ${ipLimit.retryAfterSec} seconds before retrying.`,
        retryAfterSec: ipLimit.retryAfterSec,
      },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as { recoveryEmail?: unknown; purpose?: unknown };
    const recoveryEmail = sanitizeText(body?.recoveryEmail, 120).toLowerCase();
    const purpose =
      typeof body?.purpose === 'string' && ALLOWED_PURPOSES.has(body.purpose as 'PIN' | 'EMAIL' | 'BOTH')
        ? (body.purpose as 'PIN' | 'EMAIL' | 'BOTH')
        : 'PIN';

    if (!recoveryEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid recovery Gmail address.' },
        { status: 400 }
      );
    }

    // Check against the strictly locked 2-email recovery allowlist
    if (!isAuthorizedRecoveryEmail(recoveryEmail)) {
      logSecurityEvent('admin_otp_unauthorized_email', { ip: maskIpForLog(ip) });
      // Return generic success message without sending any email (no account enumeration)
      return NextResponse.json({
        success: true,
        message: GENERIC_SENT_MSG,
      });
    }

    // Global recovery throttle (max 5 valid OTP emails per 15 min across all IPs)
    const globalLimit = await checkRateLimit('admin_otp_req_global', 5, OTP_REQ_WINDOW_MS);
    if (!globalLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `OTP delivery limit reached. Please wait ${globalLimit.retryAfterSec} seconds.`,
        },
        { status: 429 }
      );
    }

    if (!isOtpEmailProviderConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'OTP email delivery is not configured yet. Add SMTP_USER and SMTP_PASS (Gmail App Password) in Vercel Environment Variables.',
        },
        { status: 503 }
      );
    }

    const { otp } = await createAndStoreAdminOtp(purpose);
    const recoveryRecipients = getAllowedRecoveryEmails();

    const emailRes = await sendAdminOtpEmail({
      recipients: recoveryRecipients,
      otp,
      purpose,
      maskedIp: maskIpForLog(ip),
    });

    if (!emailRes.sent) {
      logSecurityEvent('admin_otp_email_failed', { ip: maskIpForLog(ip), purpose });
      return NextResponse.json(
        {
          success: false,
          error: emailRes.error || 'Could not send OTP email right now. Please check email settings.',
        },
        { status: 502 }
      );
    }

    logSecurityEvent('admin_otp_sent', {
      purpose,
      recipientCount: recoveryRecipients.length,
      ip: maskIpForLog(ip),
    });

    return NextResponse.json({
      success: true,
      message: GENERIC_SENT_MSG,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to process OTP request right now.' },
      { status: 400 }
    );
  }
}
