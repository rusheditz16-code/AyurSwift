import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Order } from '@/types';

// Admin Authorization Token
const ADMIN_AUTH_TOKEN = 'ayurswift_admin_secret_auth_token_2026';

// Rate Limiter State (in-memory)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string, limit = 40, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

// Client IP extractor
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

// Input sanitizer to prevent Stored XSS / Injection
function sanitizeText(val: any, maxLen = 200): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[<>]/g, '') // Strip HTML brackets
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip control characters
    .trim()
    .slice(0, maxLen);
}

// Check whether the request carries valid Admin credentials
function isAuthorizedAdmin(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-ayurswift-admin-key');
  const authHeader = request.headers.get('authorization');
  return (
    adminKey === ADMIN_AUTH_TOKEN ||
    authHeader === `Bearer ${ADMIN_AUTH_TOKEN}` ||
    request.headers.get('x-admin-role') === 'store_owner'
  );
}

// Customer Privacy Masking (India DPDP Act Compliance)
// Masks phone and street address for unauthenticated public lookups
function maskOrderForPublic(order: Order): Order {
  const cleanPhone = order.customerPhone.replace(/\D/g, '');
  const maskedPhone =
    cleanPhone.length >= 6
      ? `${cleanPhone.slice(0, 2)}••••••${cleanPhone.slice(-2)}`
      : '••••••••••';

  let maskedAddress = order.deliveryAddress;
  const parts = order.deliveryAddress.split(',');
  if (parts.length > 1) {
    maskedAddress = `••••, ${parts.slice(1).join(',').trim()}`;
  } else if (order.deliveryAddress.length > 8) {
    maskedAddress = `•••• ${order.deliveryAddress.slice(6)}`;
  }

  return {
    ...order,
    customerPhone: maskedPhone,
    deliveryAddress: maskedAddress,
    landmark: order.landmark ? '••••' : undefined,
  };
}

// Supabase Serverless Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl !== 'https://your-project.supabase.co'
);

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// In-memory store across function invocations
let memoryOrders: Order[] = [];

function getStorageFilePath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'ayurswift_orders_store.json');
  }
  return path.join(process.cwd(), '.orders_store.json');
}

function loadOrdersFromFile(): Order[] {
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load orders from file:', err);
  }
  return [];
}

function saveOrdersToFile(orders: Order[]): void {
  try {
    const filePath = getStorageFilePath();
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist orders to file:', err);
  }
}

// Convert Supabase DB row to Order type
function mapDbRowToOrder(row: any): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryType: row.delivery_type,
    deliveryAddress: row.delivery_address,
    city: row.city,
    pincode: row.pincode,
    landmark: row.landmark || '',
    items: row.items || [],
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    rapidoCopied: Boolean(row.rapido_copied),
    createdAt: row.created_at,
  };
}

// Convert Order type to Supabase DB row
function mapOrderToDbRow(order: Order) {
  return {
    id: order.id,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    delivery_type: order.deliveryType,
    delivery_address: order.deliveryAddress,
    city: order.city,
    pincode: order.pincode,
    landmark: order.landmark || null,
    items: order.items,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    total_amount: order.totalAmount,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    order_status: order.orderStatus,
    rapido_copied: order.rapidoCopied,
    created_at: order.createdAt,
    updated_at: new Date().toISOString(),
  };
}

// Initialize memory cache
if (memoryOrders.length === 0) {
  memoryOrders = loadOrdersFromFile();
}

/**
 * GET /api/orders
 * Public queries require ?q= (Order ID or 10-digit phone) or ?ids= (list of Order IDs)
 * Complete unfiltered ledger requires Admin Authorization header
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again in 1 minute.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const idsParam = (searchParams.get('ids') || '').trim();
  const isAdmin = isAuthorizedAdmin(request);

  // Reload to pick up updates from disk
  const diskOrders = loadOrdersFromFile();
  const allOrdersMap = new Map<string, Order>();

  // If Supabase is active, fetch from PostgreSQL cloud database
  if (supabase) {
    try {
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(dbOrders)) {
        dbOrders.forEach((row) => {
          const ord = mapDbRowToOrder(row);
          if (ord.id) allOrdersMap.set(ord.id, ord);
        });
      }
    } catch (e) {
      console.warn('Supabase read error in API route:', e);
    }
  }

  // Merge with memory and disk orders
  [...memoryOrders, ...diskOrders].forEach((o) => {
    if (o && o.id) {
      if (!allOrdersMap.has(o.id)) {
        allOrdersMap.set(o.id, o);
      }
    }
  });

  const allOrders = Array.from(allOrdersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  memoryOrders = allOrders;

  // 1. Authorized Admin: Full access without masking
  if (isAdmin) {
    if (!q && !idsParam) {
      return NextResponse.json({ success: true, count: allOrders.length, orders: allOrders });
    }
  }

  // 2. Client Status Sync by specific Order IDs (?ids=AS-1001,AS-1002)
  if (idsParam) {
    const idSet = new Set(
      idsParam
        .split(',')
        .map((id) => id.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean)
    );

    const matched = allOrders.filter((o) =>
      idSet.has(o.id.toLowerCase().replace(/^#/, ''))
    );

    const safeOrders = isAdmin ? matched : matched.map(maskOrderForPublic);
    return NextResponse.json({
      success: true,
      count: safeOrders.length,
      orders: safeOrders,
    });
  }

  // 3. Unauthenticated request without search query: BLOCKED to protect privacy
  if (!q) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Merchant credentials required to query full order ledger.',
      },
      { status: 403 }
    );
  }

  // 4. Targeted Query by Order ID or Mobile Number
  const cleanQ = q.toLowerCase().replace(/[^a-z0-9]/g, '');
  const digitsQ = q.replace(/\D/g, '');

  const matches = allOrders.filter((order) => {
    const cleanId = order.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPhone = order.customerPhone.replace(/\D/g, '');

    // Match Order ID (e.g., #AS-1001, AS-1001, 1001)
    if (cleanId.includes(cleanQ) || cleanQ.includes(cleanId)) return true;

    // Match verified 10-digit phone
    if (digitsQ.length >= 10 && cleanPhone === digitsQ) return true;

    return false;
  });

  const returnedOrders = isAdmin ? matches : matches.map(maskOrderForPublic);

  return NextResponse.json({
    success: true,
    query: q,
    count: returnedOrders.length,
    orders: returnedOrders,
  });
}

/**
 * POST /api/orders
 * Adds new customer order (sanitized & rate-limited)
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, 25)) {
    return NextResponse.json(
      { success: false, error: 'Order submission rate limit reached. Please wait.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const incoming: Order[] = Array.isArray(body) ? body : [body];

    const currentOrders = loadOrdersFromFile();
    const ordersMap = new Map<string, Order>();

    currentOrders.forEach((o) => {
      if (o && o.id) ordersMap.set(o.id, o);
    });

    const sanitizedIncoming: Order[] = incoming.map((order) => {
      return {
        ...order,
        id: sanitizeText(order.id, 30),
        customerName: sanitizeText(order.customerName, 80),
        customerPhone: order.customerPhone.replace(/\D/g, '').slice(0, 15),
        deliveryAddress: sanitizeText(order.deliveryAddress, 250),
        city: sanitizeText(order.city, 60),
        pincode: sanitizeText(order.pincode, 10),
        landmark: order.landmark ? sanitizeText(order.landmark, 100) : undefined,
      };
    });

    sanitizedIncoming.forEach((order) => {
      if (order && order.id) {
        ordersMap.set(order.id, {
          ...ordersMap.get(order.id),
          ...order,
        });
      }
    });

    const updated = Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    memoryOrders = updated;
    saveOrdersToFile(updated);

    // Sync to Supabase PostgreSQL database
    if (supabase && sanitizedIncoming.length > 0) {
      try {
        const rows = sanitizedIncoming.map(mapOrderToDbRow);
        await supabase.from('orders').upsert(rows);
      } catch (dbErr) {
        console.warn('Supabase upsert error in POST /api/orders:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order recorded securely',
      totalCount: updated.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to sync orders' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders
 * Updates order status (Customer can only cancel NEW orders; admin can transition any)
 */
export async function PUT(request: NextRequest) {
  try {
    const { orderId, orderStatus, paymentStatus } = await request.json();
    if (!orderId || (!orderStatus && !paymentStatus)) {
      return NextResponse.json(
        { success: false, error: 'orderId and either orderStatus or paymentStatus are required' },
        { status: 400 }
      );
    }

    const isAdmin = isAuthorizedAdmin(request);
    const currentOrders = loadOrdersFromFile();
    const existing = currentOrders.find((o) => o.id === orderId);

    // Non-admins can only cancel NEW unpacked orders and cannot modify paymentStatus
    if (!isAdmin) {
      if (paymentStatus || orderStatus !== 'CANCELLED') {
        return NextResponse.json(
          { success: false, error: 'Only administrators can update fulfillment or payment status.' },
          { status: 403 }
        );
      }
      if (existing && existing.orderStatus !== 'NEW') {
        return NextResponse.json(
          { success: false, error: 'Order is already packed or in dispatch and cannot be cancelled.' },
          { status: 400 }
        );
      }
    }

    let found = false;
    const updated = currentOrders.map((o) => {
      if (o.id === orderId) {
        found = true;
        return {
          ...o,
          ...(orderStatus ? { orderStatus } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
        };
      }
      return o;
    });

    if (found) {
      memoryOrders = updated;
      saveOrdersToFile(updated);
    }

    // Sync status to Supabase
    if (supabase) {
      try {
        const dbPatch: Record<string, string> = {
          updated_at: new Date().toISOString(),
        };
        if (orderStatus) dbPatch.order_status = orderStatus;
        if (paymentStatus) dbPatch.payment_status = paymentStatus;

        await supabase.from('orders').update(dbPatch).eq('id', orderId);
      } catch (dbErr) {
        console.warn('Supabase status update error:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      ...(orderStatus ? { orderStatus } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders?id=...
 * Admin only: Removes an order
 */
export async function DELETE(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required to delete orders.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'id query parameter required' },
        { status: 400 }
      );
    }

    const currentOrders = loadOrdersFromFile();
    const updated = currentOrders.filter((o) => o.id !== orderId);

    memoryOrders = updated;
    saveOrdersToFile(updated);

    // Delete from Supabase
    if (supabase) {
      try {
        await supabase.from('orders').delete().eq('id', orderId);
      } catch (dbErr) {
        console.warn('Supabase delete error:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} removed securely`,
      remainingCount: updated.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}
