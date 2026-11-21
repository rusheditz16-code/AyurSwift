import nodemailer from 'nodemailer';

export interface SendOtpEmailParams {
  recipients: string[];
  otp: string;
  purpose: 'PIN' | 'EMAIL' | 'BOTH';
  maskedIp: string;
}

export function isOtpEmailProviderConfigured(): boolean {
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  return Boolean((smtpUser && smtpPass) || resendKey);
}

function getPurposeLabel(purpose: 'PIN' | 'EMAIL' | 'BOTH'): string {
  if (purpose === 'EMAIL') return 'Reset Admin Login Email';
  if (purpose === 'BOTH') return 'Reset Admin Email & Security PIN';
  return 'Reset Admin Security PIN';
}

/**
 * Sends a single-use 6-digit security OTP strictly to the authorized recovery Gmail addresses.
 * Supports free Gmail SMTP (App Password) or Resend API.
 */
export async function sendAdminOtpEmail({
  recipients,
  otp,
  purpose,
  maskedIp,
}: SendOtpEmailParams): Promise<{ sent: boolean; error?: string }> {
  if (!recipients || recipients.length === 0) {
    return { sent: false, error: 'No authorized recovery email addresses configured.' };
  }

  const actionLabel = getPurposeLabel(purpose);
  const subject = `AyurSwift Security OTP (${otp}) — ${actionLabel}`;
  const timeIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const textBody = [
    `AyurSwift Merchant Hub — Security Verification`,
    ``,
    `Action requested: ${actionLabel}`,
    `Your 6-digit One-Time Password (OTP): ${otp}`,
    ``,
    `This code expires in 10 minutes and can only be used once.`,
    `Request time (IST): ${timeIST}`,
    `Request IP: ${maskedIp}`,
    ``,
    `SECURITY WARNING: Never share this OTP with anyone. If you did not request this reset, ignore this email — your current admin email and PIN remain unchanged.`,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f8f3; padding: 24px; border-radius: 16px; border: 1px solid #d6ddce;">
      <div style="background: #1d5a3e; color: #ffffff; padding: 18px 20px; border-radius: 12px; text-align: center;">
        <div style="font-size: 18px; font-weight: 800; letter-spacing: 0.3px;">AyurSwift Merchant Hub</div>
        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">Admin Recovery Verification</div>
      </div>

      <div style="background: #ffffff; padding: 22px; border-radius: 12px; margin-top: 16px; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 10px; font-size: 14px; color: #1f2937;">
          A request was received to <strong>${actionLabel}</strong>.
        </p>
        <p style="margin: 0 0 16px; font-size: 13px; color: #4b5563;">
          Use the 6-digit OTP below to complete your reset. This code is sent strictly to your authorized recovery Gmail addresses only.
        </p>

        <div style="background: #ecfdf3; border: 2px dashed #0c831f; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #0c831f; font-weight: 700;">One-Time Security Code</div>
          <div style="font-size: 32px; font-family: monospace; font-weight: 800; letter-spacing: 8px; color: #143d29; margin-top: 6px;">${otp}</div>
          <div style="font-size: 11px; color: #4b5563; margin-top: 6px;">Valid for 10 minutes • Single use only</div>
        </div>

        <p style="margin: 12px 0 0; font-size: 11.5px; color: #6b7280; line-height: 1.5;">
          <strong>Time (IST):</strong> ${timeIST}<br/>
          <strong>IP:</strong> ${maskedIp}
        </p>
      </div>

      <p style="margin: 14px 4px 0; font-size: 11.5px; color: #991b1b; line-height: 1.5;">
        <strong>Did not request this?</strong> Do not share this OTP with anyone. You can safely ignore this message — no changes will be made without the code.
      </p>
    </div>
  `;

  // Option A: Gmail SMTP (Free via Google App Password — sends to multiple Gmail inboxes)
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"AyurSwift Security" <${smtpUser}>`,
        to: recipients.join(', '),
        subject,
        text: textBody,
        html: htmlBody,
      });

      return { sent: true };
    } catch {
      return { sent: false, error: 'Failed to send OTP email via SMTP. Check SMTP_USER and SMTP_PASS.' };
    }
  }

  // Option B: Resend HTTP API
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    try {
      const from = (process.env.RESEND_FROM || 'AyurSwift Security <onboarding@resend.dev>').trim();
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject,
          text: textBody,
          html: htmlBody,
        }),
      });
      if (!res.ok) {
        return { sent: false, error: 'Email provider rejected OTP dispatch.' };
      }
      return { sent: true };
    } catch {
      return { sent: false, error: 'Unable to reach email provider.' };
    }
  }

  return {
    sent: false,
    error: 'Email delivery is not configured yet. Set SMTP_USER & SMTP_PASS (Gmail App Password) in Vercel Environment Variables.',
  };
}
