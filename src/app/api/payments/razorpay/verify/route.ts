import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/payments/razorpay/verify
 * Verifies Razorpay Checkout signature (HMAC-SHA256) and marks the order paymentStatus = VERIFIED.
 */
export async function POST(request: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay secret is not configured.' },
        { status: 503 }
      );
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing required Razorpay verification fields.' },
        { status: 400 }
      );
    }

    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid =
      expectedSig.length === String(razorpay_signature).length &&
      crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(String(razorpay_signature)));

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature.' },
        { status: 400 }
      );
    }

    // Update Supabase order payment_status = VERIFIED
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('orders')
        .update({
          payment_status: 'VERIFIED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderId,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment verification failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
