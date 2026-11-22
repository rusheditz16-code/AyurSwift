import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Order } from '@/types';
import {
  checkRateLimit,
  getSupabaseAdminClient,
  getTrustedClientIp,
  isRequestBodyTooLarge,
  logSecurityEvent,
  maskIpForLog,
  normalizeIndianPhone,
  sanitizeText,
  verifySameOrigin,
} from '@/lib/serverSecurity';

function getStorageFilePath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join(os.tmpdir(), 'ayurswift_orders_store.json');
  }
  return path.join(process.cwd(), '.orders_store.json');
}

/**
 * POST /api/privacy/erase
 * India DPDP Act customer data erasure / anonymization endpoint.
 * Requires exact Order ID + matching 10-digit customer phone.
 * Anonymizes personal details (name, phone, address, landmark) on completed/cancelled orders
 * while retaining non-personal billing totals for statutory bookkeeping.
 */
export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = await checkRateLimit(`privacy_erase:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  if (isRequestBodyTooLarge(request, 4_096)) {
    return NextResponse.json(
      { success: false, error: 'Request payload too large.' },
      { status: 413 }
    );
  }

  try {
    const body = (await request.json()) as { orderId?: unknown; customerPhone?: unknown };
    const orderId = sanitizeText(body?.orderId, 32);
    const phone = normalizeIndianPhone(body?.customerPhone);

    if (!orderId || !phone) {
      return NextResponse.json(
        { success: false, error: 'Exact Order ID and 10-digit registered mobile number are required.' },
        { status: 400 }
      );
    }

    let matched = false;
    let blockedActive = false;

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data: row } = await supabase
        .from('orders')
        .select('id, customer_phone, order_status')
        .eq('id', orderId)
        .maybeSingle();

      if (row) {
        const storedPhone = normalizeIndianPhone(String(row.customer_phone || ''));
        if (storedPhone !== phone) {
          return NextResponse.json(
            { success: false, error: 'Order ID and phone number did not match.' },
            { status: 403 }
          );
        }
        if (row.order_status !== 'DELIVERED' && row.order_status !== 'CANCELLED') {
          blockedActive = true;
        } else {
          await supabase
            .from('orders')
            .update({
              customer_name: '[REDACTED]',
              customer_phone: '0000000000',
              delivery_address: '[REDACTED]',
              landmark: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
          matched = true;
        }
      }
    }

    // Also anonymize local file fallback if present
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(parsed)) {
        const updated = (parsed as Order[]).map((o) => {
          if (o.id !== orderId) return o;
          const storedPhone = normalizeIndianPhone(o.customerPhone);
          if (storedPhone !== phone) return o;
          if (o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED') {
            blockedActive = true;
            return o;
          }
          matched = true;
          return {
            ...o,
            customerName: '[REDACTED]',
            customerPhone: '0000000000',
            deliveryAddress: '[REDACTED]',
            landmark: undefined,
          };
        });
        if (matched) {
          fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
        }
      }
    }

    if (blockedActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Active orders cannot be erased until delivered or cancelled.',
        },
        { status: 409 }
      );
    }

    if (!matched) {
      return NextResponse.json(
        { success: false, error: 'No matching completed/cancelled order found for that ID and phone.' },
        { status: 404 }
      );
    }

    logSecurityEvent('order_pii_erased', {
      orderId,
      ip: maskIpForLog(ip),
    });

    return NextResponse.json({
      success: true,
      message: 'Your personal details for this order have been erased from our servers.',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to process data erasure request.' },
      { status: 500 }
    );
  }
}
