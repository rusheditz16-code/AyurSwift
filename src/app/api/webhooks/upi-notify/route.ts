import { NextRequest, NextResponse } from 'next/server';
import {
  doesSenderMatchCustomerName,
  parseUpiCreditNotification,
} from '@/lib/upiNotificationParser';
import {
  checkMemoryRateLimit,
  getSupabaseAdminClient,
  getTrustedClientIp,
  getUpiWebhookSecret,
  isRequestBodyTooLarge,
  logSecurityEvent,
  maskIpForLog,
  sanitizeText,
  verifyAdminSession,
  verifySameOrigin,
  verifyUpiWebhookSecret,
} from '@/lib/serverSecurity';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * GET /api/webhooks/upi-notify
 * Admin-only: Returns the merchant's ready-to-use MacroDroid Webhook URL + recent received FamApp credits.
 */
export async function GET(request: NextRequest) {
  const admin = verifyAdminSession(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin sign-in required.' },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const secret = getUpiWebhookSecret();
  const origin = request.nextUrl.origin;
  const webhookUrl = secret
    ? `${origin}/api/webhooks/upi-notify?key=${secret}`
    : `${origin}/api/webhooks/upi-notify`;

  const supabase = getSupabaseAdminClient();
  let recentCredits: Array<Record<string, unknown>> = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('upi_webhook_credits')
        .select('txn_id, amount, sender_name, order_id_hint, matched_order_id, raw_summary, received_at')
        .order('received_at', { ascending: false })
        .limit(15);
      if (Array.isArray(data)) {
        recentCredits = data as Array<Record<string, unknown>>;
      }
    } catch {}
  }

  return NextResponse.json(
    {
      success: true,
      webhookUrl,
      webhookKey: secret || '',
      recentCredits,
    },
    { headers: NO_STORE_HEADERS }
  );
}

/**
 * POST /api/webhooks/upi-notify
 * Receives real-time Android push notifications from FamApp by Trio (via free MacroDroid)
 * or bank credit alerts, and automatically verifies matching PENDING UPI orders in Supabase.
 *
 * Accepts authentication via:
 *   1) Query param `?key=<webhookKey>`
 *   2) Header `x-webhook-key: <webhookKey>` or `Authorization: Bearer <webhookKey>`
 *   3) Verified Admin session cookie (for 1-click Live Test Simulator inside Admin Settings)
 */
export async function POST(request: NextRequest) {
  if (isRequestBodyTooLarge(request, 16_384)) {
    return NextResponse.json(
      { success: false, error: 'Payload too large.' },
      { status: 413, headers: NO_STORE_HEADERS }
    );
  }

  const ip = getTrustedClientIp(request);
  const rl = checkMemoryRateLimit(`upi_webhook:${ip}`, 45, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many webhook requests.' },
      { status: 429, headers: NO_STORE_HEADERS }
    );
  }

  const adminSession = verifyAdminSession(request);
  const isAdminTest = Boolean(adminSession && verifySameOrigin(request));

  const keyFromQuery = request.nextUrl.searchParams.get('key') || '';
  const keyFromHeader =
    request.headers.get('x-webhook-key') ||
    (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

  let rawBodyText = '';
  let bodyObj: Record<string, unknown> = {};
  try {
    rawBodyText = await request.text();
    if (rawBodyText.trim().startsWith('{')) {
      bodyObj = JSON.parse(rawBodyText) as Record<string, unknown>;
    } else if (rawBodyText.includes('=')) {
      const params = new URLSearchParams(rawBodyText);
      params.forEach((v, k) => {
        bodyObj[k] = v;
      });
    }
  } catch {}

  const keyFromBody = typeof bodyObj.key === 'string' ? bodyObj.key : '';
  const isKeyValid =
    verifyUpiWebhookSecret(keyFromQuery) ||
    verifyUpiWebhookSecret(keyFromHeader) ||
    verifyUpiWebhookSecret(keyFromBody);

  if (!isAdminTest && !isKeyValid) {
    logSecurityEvent('upi_webhook_unauthorized', { ip: maskIpForLog(ip) });
    return NextResponse.json(
      { success: false, error: 'Invalid webhook secret key.' },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  // Extract notification text from JSON (`text`, `notification`, `body`, `message`), query param, or raw body
  const candidateNotification =
    (typeof bodyObj.text === 'string' && bodyObj.text) ||
    (typeof bodyObj.notification === 'string' && bodyObj.notification) ||
    (typeof bodyObj.body === 'string' && bodyObj.body) ||
    (typeof bodyObj.message === 'string' && bodyObj.message) ||
    request.nextUrl.searchParams.get('text') ||
    rawBodyText;

  const parsed = parseUpiCreditNotification(String(candidateNotification || ''));
  if (!parsed) {
    return NextResponse.json(
      {
        success: false,
        ignored: true,
        error:
          'Notification did not match a valid incoming UPI rupee credit (e.g. "You received Rs.85.0 from ... with txn ID FMPIB...").',
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      {
        success: true,
        parsed,
        matchedOrderId: null,
        message: 'Parsed notification cleanly (Supabase not configured in offline mode).',
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  try {
    // 1. Check if this exact txnId was already processed and matched
    const { data: existingCredit } = await supabase
      .from('upi_webhook_credits')
      .select('txn_id, matched_order_id')
      .eq('txn_id', parsed.txnId)
      .maybeSingle();

    if (existingCredit?.matched_order_id) {
      return NextResponse.json(
        {
          success: true,
          deduplicated: true,
          parsed,
          matchedOrderId: String(existingCredit.matched_order_id),
          message: `Transaction ${parsed.txnId} already verified order ${existingCredit.matched_order_id}.`,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // 2. Search active PENDING UPI orders with matching total_amount from last 24h
    const since24hIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select(
        'id, customer_name, total_amount, payment_method, payment_status, order_status, utr_number, admin_note, created_at'
      )
      .eq('payment_method', 'UPI')
      .eq('payment_status', 'PENDING')
      .neq('order_status', 'CANCELLED')
      .eq('total_amount', parsed.amount)
      .gte('created_at', since24hIso)
      .order('created_at', { ascending: false })
      .limit(20);

    const candidates = Array.isArray(pendingOrders)
      ? (pendingOrders as Array<{
          id: string;
          customer_name: string;
          total_amount: number;
          utr_number: string | null;
          admin_note: string | null;
          created_at: string;
        }>)
      : [];

    let matchedOrder: (typeof candidates)[number] | undefined;
    let matchReason = '';

    // Engine A: Explicit Order ID hint in notification text
    if (parsed.orderIdHint) {
      matchedOrder = candidates.find(
        (o) => o.id.toUpperCase() === parsed.orderIdHint!.toUpperCase()
      );
      if (matchedOrder) matchReason = 'exact_order_id';
    }

    // Engine B: Customer already pasted the exact FamApp txnId / UTR
    if (!matchedOrder) {
      matchedOrder = candidates.find(
        (o) =>
          typeof o.utr_number === 'string' &&
          o.utr_number.toUpperCase().includes(parsed.txnId.toUpperCase())
      );
      if (matchedOrder) matchReason = 'exact_txn_id';
    }

    // Engine C: Unique active order for this exact ₹ amount placed within the last 45 minutes
    const nowMs = Date.now();
    const recent45mCandidates = candidates.filter(
      (o) => nowMs - new Date(o.created_at).getTime() <= 45 * 60 * 1000
    );

    if (!matchedOrder && recent45mCandidates.length === 1) {
      matchedOrder = recent45mCandidates[0];
      matchReason = 'unique_recent_amount';
    }

    // Engine D: Multiple orders with same ₹ amount -> disambiguate by FamApp sender name (e.g. DABHI MITALI)
    if (!matchedOrder && candidates.length > 1 && parsed.senderName) {
      const nameMatches = candidates.filter((o) =>
        doesSenderMatchCustomerName(parsed.senderName, o.customer_name)
      );
      if (nameMatches.length === 1) {
        matchedOrder = nameMatches[0];
        matchReason = 'sender_name_match';
      }
    }

    // Engine E: Multiple orders with same ₹ amount -> disambiguate if only 1 customer already pasted a UTR
    if (!matchedOrder && recent45mCandidates.length > 1) {
      const withUtr = recent45mCandidates.filter(
        (o) => typeof o.utr_number === 'string' && o.utr_number.trim().length >= 6
      );
      if (withUtr.length === 1) {
        matchedOrder = withUtr[0];
        matchReason = 'submitted_utr_amount_match';
      }
    }

    const nowIso = new Date().toISOString();

    if (matchedOrder) {
      const existingUtr = (matchedOrder.utr_number || '').trim();
      const combinedUtr = existingUtr
        ? existingUtr.toUpperCase().includes(parsed.txnId)
          ? existingUtr
          : `${existingUtr} • ${parsed.txnId}`
        : parsed.txnId;

      const autoNote = sanitizeText(
        `Auto-verified via FamApp: ${parsed.sanitizedSummary}`,
        240
      );
      const nextNote = matchedOrder.admin_note
        ? sanitizeText(`${matchedOrder.admin_note} | ${autoNote}`, 250)
        : autoNote;

      // Record credit first and mark order VERIFIED
      await supabase.from('upi_webhook_credits').upsert(
        {
          txn_id: parsed.txnId,
          amount: parsed.amount,
          sender_name: parsed.senderName,
          order_id_hint: parsed.orderIdHint,
          matched_order_id: matchedOrder.id,
          raw_summary: parsed.sanitizedSummary,
          received_at: nowIso,
        },
        { onConflict: 'txn_id' }
      );

      await supabase
        .from('orders')
        .update({
          payment_status: 'VERIFIED',
          utr_number: combinedUtr,
          admin_note: nextNote,
          updated_at: nowIso,
        })
        .eq('id', matchedOrder.id);

      logSecurityEvent('upi_webhook_order_auto_verified', {
        orderId: matchedOrder.id,
        txnId: parsed.txnId,
        amount: parsed.amount,
        matchReason,
      });

      return NextResponse.json(
        {
          success: true,
          autoVerified: true,
          matchReason,
          matchedOrderId: matchedOrder.id,
          parsed,
          message: `Order ${matchedOrder.id} (₹${parsed.amount}) automatically verified via FamApp (${parsed.txnId})!`,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // No single unambiguous order active right now -> store unmatched credit so UTR submit can claim it
    await supabase.from('upi_webhook_credits').upsert(
      {
        txn_id: parsed.txnId,
        amount: parsed.amount,
        sender_name: parsed.senderName,
        order_id_hint: parsed.orderIdHint,
        matched_order_id: null,
        raw_summary: parsed.sanitizedSummary,
        received_at: nowIso,
      },
      { onConflict: 'txn_id' }
    );

    logSecurityEvent('upi_webhook_credit_stored_unmatched', {
      txnId: parsed.txnId,
      amount: parsed.amount,
    });

    return NextResponse.json(
      {
        success: true,
        autoVerified: false,
        matchedOrderId: null,
        parsed,
        message: `Stored FamApp credit ₹${parsed.amount} (${parsed.txnId}). Will auto-verify when matching order / UTR arrives.`,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to process UPI notification webhook.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
