import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/payments/razorpay/webhook
 * Receives Razorpay server-to-server webhooks (payment.captured / order.paid),
 * verifies x-razorpay-signature, and automatically marks the AyurSwift order VERIFIED.
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { success: false, error: 'RAZORPAY_WEBHOOK_SECRET is not configured.' },
        { status: 503 }
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const isValid =
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event?.event || '';

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const orderId: string | undefined =
        event?.payload?.payment?.entity?.notes?.ayurswift_order_id ||
        event?.payload?.order?.entity?.notes?.ayurswift_order_id ||
        event?.payload?.order?.entity?.receipt;

      if (orderId) {
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
      }
    }

    return NextResponse.json({ success: true, received: eventType });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook processing failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
