import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payments/razorpay/create-order
 * Creates a Razorpay Order for automatic UPI/card payment verification.
 * Gracefully returns { configured: false } when RAZORPAY_KEY_ID / SECRET are not set yet.
 */
export async function POST(request: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Razorpay is not configured yet. Using Direct Zero-Fee UPI QR.',
      });
    }

    const { orderId, amount } = await request.json();
    if (!orderId || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid orderId and amount (INR) are required.' },
        { status: 400 }
      );
    }

    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // paise
        currency: 'INR',
        receipt: String(orderId).slice(0, 40),
        notes: {
          ayurswift_order_id: String(orderId),
        },
      }),
    });

    const data = await rzpRes.json();
    if (!rzpRes.ok) {
      return NextResponse.json(
        { success: false, error: data?.error?.description || 'Razorpay order creation failed' },
        { status: rzpRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      configured: true,
      keyId,
      razorpayOrderId: data.id,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create Razorpay order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
