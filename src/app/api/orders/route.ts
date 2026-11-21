import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { DeliveryType, Order, PaymentMethod, Product } from '@/types';
type OrderItem = Order['items'][number];
import { DEFAULT_SETTINGS, INITIAL_PRODUCTS } from '@/lib/initialData';
import {
  checkRateLimit,
  generateSecureOrderId,
  getSupabaseAdminClient,
  getTrustedClientIp,
  logSecurityEvent,
  maskIpForLog,
  normalizeIndianPhone,
  sanitizeText,
  verifyAdminSession,
  verifySameOrigin,
  verifyTurnstileIfConfigured,
} from '@/lib/serverSecurity';

const ALLOWED_ORDER_STATUSES = new Set<Order['orderStatus']>([
  'NEW',
  'PACKED',
  'DISPATCHED',
  'DELIVERED',
  'CANCELLED',
]);

const ALLOWED_PAYMENT_STATUSES = new Set<Order['paymentStatus']>(['PENDING', 'VERIFIED']);
const ALLOWED_DELIVERY_TYPES = new Set<DeliveryType>(['RAPIDO_CITY', 'COURIER_OUTSIDE']);
const ALLOWED_PAYMENT_METHODS = new Set<PaymentMethod>(['UPI', 'COD']);

interface PublicOrderView extends Omit<Order, 'rapidoCopied' | 'adminNote'> {
  rapidoCopied: false;
  adminNote?: undefined;
}

/**
 * Customer Privacy Masking (India DPDP Act Compliance)
 * Masks phone, street address, landmark, full UTR, and strips internal dispatch/admin fields.
 */
function maskOrderForPublic(order: Order): PublicOrderView {
  const cleanPhone = order.customerPhone.replace(/\D/g, '');
  const maskedPhone =
    cleanPhone.length >= 6
      ? `${cleanPhone.slice(0, 2)}••••••${cleanPhone.slice(-2)}`
      : '••••••••••';

  let maskedAddress = order.deliveryAddress;
  if (maskedAddress !== '[REDACTED]') {
    const parts = order.deliveryAddress.split(',');
    if (parts.length > 1) {
      maskedAddress = `••••, ${parts.slice(1).join(',').trim()}`;
    } else if (order.deliveryAddress.length > 8) {
      maskedAddress = `•••• ${order.deliveryAddress.slice(6)}`;
    }
  }

  let maskedUtr: string | undefined = order.utrNumber;
  if (order.utrNumber) {
    const cleanUtr = order.utrNumber.replace(/[^a-zA-Z0-9]/g, '');
    maskedUtr = cleanUtr.length >= 6 ? `••••${cleanUtr.slice(-4)}` : '••••';
  }

  return {
    ...order,
    customerPhone: maskedPhone,
    deliveryAddress: maskedAddress,
    landmark: order.landmark ? '••••' : undefined,
    utrNumber: maskedUtr,
    courierTracking: order.courierTracking,
    adminNote: undefined,
    rapidoCopied: false,
  };
}

let memoryOrders: Order[] = [];

function getStorageFilePath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join(os.tmpdir(), 'ayurswift_orders_store.json');
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
  } catch {
    // Ignore corrupt local file fallback
  }
  return [];
}

function saveOrdersToFile(orders: Order[]): void {
  try {
    const filePath = getStorageFilePath();
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8');
  } catch {
    // Ignore read-only disk fallback
  }
}

function mapDbRowToOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id || ''),
    customerName: String(row.customer_name || ''),
    customerPhone: String(row.customer_phone || ''),
    deliveryType: (row.delivery_type as DeliveryType) || 'RAPIDO_CITY',
    deliveryAddress: String(row.delivery_address || ''),
    city: String(row.city || ''),
    pincode: String(row.pincode || ''),
    landmark: row.landmark ? String(row.landmark) : '',
    items: Array.isArray(row.items) ? (row.items as OrderItem[]) : [],
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paymentMethod: (row.payment_method as PaymentMethod) || 'UPI',
    paymentStatus: (row.payment_status as Order['paymentStatus']) || 'PENDING',
    orderStatus: (row.order_status as Order['orderStatus']) || 'NEW',
    rapidoCopied: Boolean(row.rapido_copied),
    utrNumber: row.utr_number ? String(row.utr_number) : undefined,
    courierTracking: row.courier_tracking ? String(row.courier_tracking) : undefined,
    adminNote: row.admin_note ? String(row.admin_note) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

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
    utr_number: order.utrNumber || null,
    courier_tracking: order.courierTracking || null,
    admin_note: order.adminNote || null,
    created_at: order.createdAt,
    updated_at: new Date().toISOString(),
  };
}

async function loadAllOrders(): Promise<Order[]> {
  const diskOrders = loadOrdersFromFile();
  const allOrdersMap = new Map<string, Order>();

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!error && Array.isArray(dbOrders)) {
        dbOrders.forEach((row) => {
          const ord = mapDbRowToOrder(row as Record<string, unknown>);
          if (ord.id) allOrdersMap.set(ord.id, ord);
        });
      }
    } catch {
      // Fallback safely to memory/disk
    }
  }

  [...memoryOrders, ...diskOrders].forEach((o) => {
    if (o && o.id && !allOrdersMap.has(o.id)) {
      allOrdersMap.set(o.id, o);
    }
  });

  const sorted = Array.from(allOrdersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  memoryOrders = sorted;
  return sorted;
}

/**
 * Loads authoritative product catalog on the server for price & stock verification.
 */
async function loadServerCatalog(): Promise<Map<string, Product>> {
  const catalog = new Map<string, Product>();
  INITIAL_PRODUCTS.forEach((p) => catalog.set(p.id, p));

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && Array.isArray(data)) {
        data.forEach((row: Record<string, unknown>) => {
          const id = String(row.id || '');
          if (!id) return;
          const base = catalog.get(id);
          catalog.set(id, {
            id,
            name: String(row.name || base?.name || ''),
            brand: String(row.brand || base?.brand || ''),
            category: String(row.category || base?.category || ''),
            manufacturer: String(row.manufacturer || base?.manufacturer || ''),
            form: (row.form as Product['form']) || base?.form || 'Tablet',
            packSize: String(row.pack_size || base?.packSize || ''),
            agencyCostPrice: Number(row.agency_cost_price ?? base?.agencyCostPrice ?? 0),
            mrp: Number(row.mrp ?? base?.mrp ?? 0),
            sellingPrice: Number(row.selling_price ?? base?.sellingPrice ?? 0),
            stockQuantity: Number(row.stock_quantity ?? base?.stockQuantity ?? 0),
            isLive: Boolean(row.is_live ?? base?.isLive ?? false),
            rating: base?.rating ?? 4.8,
            reviewCount: base?.reviewCount ?? 100,
            indications: String(row.indications || base?.indications || ''),
            dosage: String(row.dosage || base?.dosage || ''),
            composition: String(row.composition || base?.composition || ''),
            imageUrl: row.image_url ? String(row.image_url) : base?.imageUrl,
          });
        });
      }
    } catch {
      // Fallback cleanly to built-in catalog if DB read fails
    }
  }

  return catalog;
}

function normalizeOrderIdForCompare(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * GET /api/orders
 * - Verified admin cookie: returns paginated full order ledger (?limit=50&offset=0).
 * - Public lookup: requires exact full Order ID (?q=#AS-XXXXXXXX) or exact 10-digit phone,
 *   or exact ID list (?ids=...), always masked and capped.
 */
export async function GET(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = await checkRateLimit(`orders_get:${ip}`, 40, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again in 1 minute.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = sanitizeText(searchParams.get('q'), 64);
  const idsParam = sanitizeText(searchParams.get('ids'), 600);
  const limitParam = Number(searchParams.get('limit') || 50);
  const offsetParam = Number(searchParams.get('offset') || 0);
  const adminSession = verifyAdminSession(request);
  const isAdmin = Boolean(adminSession);

  const allOrders = await loadAllOrders();

  // 1. Authorized Admin: paginated unmasked ledger
  if (isAdmin && !q && !idsParam) {
    const safeLimit = Math.min(Math.max(1, Math.floor(limitParam || 50)), 100);
    const safeOffset = Math.max(0, Math.floor(offsetParam || 0));
    const page = allOrders.slice(safeOffset, safeOffset + safeLimit);
    return NextResponse.json({
      success: true,
      count: page.length,
      total: allOrders.length,
      limit: safeLimit,
      offset: safeOffset,
      orders: page,
    });
  }

  // 2. Client Status Sync by exact Order IDs (?ids=#AS-XXXX,#AS-YYYY)
  if (idsParam) {
    const requestedIds = idsParam
      .split(',')
      .map(normalizeOrderIdForCompare)
      .filter((id) => id.length >= 6)
      .slice(0, 20);

    const idSet = new Set(requestedIds);
    const matched = allOrders.filter((o) => idSet.has(normalizeOrderIdForCompare(o.id)));
    const safeOrders = isAdmin ? matched : matched.map(maskOrderForPublic);

    return NextResponse.json({
      success: true,
      count: safeOrders.length,
      orders: safeOrders,
    });
  }

  // 3. Unauthenticated unscoped ledger query: BLOCKED
  if (!q) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Merchant sign-in required to query order ledger.',
      },
      { status: 403 }
    );
  }

  // 4. Strict Exact Lookup (NO partial/substring matching!)
  const cleanIdQuery = normalizeOrderIdForCompare(q);
  const phoneQuery = normalizeIndianPhone(q);

  const matches = allOrders.filter((order) => {
    const cleanOrderId = normalizeOrderIdForCompare(order.id);
    const orderPhone = normalizeIndianPhone(order.customerPhone);

    // Exact full Order ID match only (min 6 alphanumeric chars e.g. as1001 or as7k4m9x2p)
    if (cleanIdQuery.length >= 6 && cleanOrderId === cleanIdQuery) {
      return true;
    }

    // Exact 10-digit Indian mobile match
    if (phoneQuery && orderPhone === phoneQuery) {
      return true;
    }

    return false;
  });

  const capped = matches.slice(0, 20);
  const returnedOrders = isAdmin ? capped : capped.map(maskOrderForPublic);

  return NextResponse.json({
    success: true,
    count: returnedOrders.length,
    orders: returnedOrders,
  });
}

/**
 * POST /api/orders
 * Creates a single new customer order with 100% server-verified pricing,
 * strict input validation, bot check, and random unpredictable Order ID.
 */
export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = await checkRateLimit(`orders_post:${ip}`, 15, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Order submission limit reached. Please wait a minute.' },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    // Reject arrays or non-object payloads
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order request format.' },
        { status: 400 }
      );
    }

    const adminSession = verifyAdminSession(request);
    const isAdmin = Boolean(adminSession && verifySameOrigin(request));

    // Bot protection: hidden honeypot field must remain blank
    const honeypot = sanitizeText(body.website ?? body._hp, 100);
    if (honeypot) {
      logSecurityEvent('order_bot_honeypot_triggered', { ip: maskIpForLog(ip) });
      return NextResponse.json(
        { success: false, error: 'Order validation failed.' },
        { status: 400 }
      );
    }

    // Optional Cloudflare Turnstile verification (active if TURNSTILE_SECRET_KEY is configured, skipped for verified admin manual orders)
    if (!isAdmin) {
      const turnstileOk = await verifyTurnstileIfConfigured(body.turnstileToken, ip);
      if (!turnstileOk) {
        logSecurityEvent('order_bot_turnstile_failed', { ip: maskIpForLog(ip) });
        return NextResponse.json(
          { success: false, error: 'Bot verification failed. Please retry.' },
          { status: 400 }
        );
      }
    }

    // Strict input validation (allowlisted fields only)
    const customerName = sanitizeText(body.customerName, 80);
    const customerPhone = normalizeIndianPhone(body.customerPhone);
    const deliveryType = body.deliveryType as DeliveryType;
    const deliveryAddress = sanitizeText(body.deliveryAddress, 250);
    const city = sanitizeText(body.city, 60);
    const pincodeRaw = sanitizeText(body.pincode, 10).replace(/\D/g, '');
    const landmark = body.landmark ? sanitizeText(body.landmark, 100) : undefined;
    const paymentMethod = body.paymentMethod as PaymentMethod;
    const rawItems = body.items;

    if (customerName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid customer name.' },
        { status: 400 }
      );
    }
    if (!customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }
    if (!ALLOWED_DELIVERY_TYPES.has(deliveryType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid delivery option selected.' },
        { status: 400 }
      );
    }
    if (deliveryAddress.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Please enter a complete delivery address.' },
        { status: 400 }
      );
    }
    if (city.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid city.' },
        { status: 400 }
      );
    }
    if (!/^\d{6}$/.test(pincodeRaw)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 6-digit pincode.' },
        { status: 400 }
      );
    }
    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method.' },
        { status: 400 }
      );
    }
    if (deliveryType === 'COURIER_OUTSIDE' && paymentMethod === 'COD') {
      return NextResponse.json(
        { success: false, error: 'Outside-city courier orders require prepaid UPI payment.' },
        { status: 400 }
      );
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 30) {
      return NextResponse.json(
        { success: false, error: 'Order must contain between 1 and 30 valid items.' },
        { status: 400 }
      );
    }

    // Server-side authoritative pricing & stock check
    const catalog = await loadServerCatalog();
    const verifiedItems: OrderItem[] = [];
    let subtotal = 0;

    for (const rawItem of rawItems) {
      if (!rawItem || typeof rawItem !== 'object') {
        return NextResponse.json(
          { success: false, error: 'Invalid item in order.' },
          { status: 400 }
        );
      }

      const itemObj = rawItem as Record<string, unknown>;
      const productId = sanitizeText(itemObj.productId, 64);
      const qty = Number(itemObj.quantity);

      if (!productId || !Number.isInteger(qty) || qty < 1 || qty > 20) {
        return NextResponse.json(
          { success: false, error: 'Each item must have an integer quantity between 1 and 20.' },
          { status: 400 }
        );
      }

      const product = catalog.get(productId);
      if (!product || !product.isLive || product.stockQuantity <= 0) {
        return NextResponse.json(
          { success: false, error: 'One or more requested items are currently unavailable.' },
          { status: 400 }
        );
      }

      if (qty > product.stockQuantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Requested quantity for ${product.name} exceeds available store stock.`,
          },
          { status: 400 }
        );
      }

      const unitPrice = product.sellingPrice;
      const totalPrice = Number((unitPrice * qty).toFixed(2));
      subtotal = Number((subtotal + totalPrice).toFixed(2));

      verifiedItems.push({
        productId: product.id,
        name: product.name,
        brand: product.brand,
        packSize: product.packSize,
        quantity: qty,
        mrp: product.mrp,
        unitPrice,
        totalPrice,
      });
    }

    const deliveryFee =
      deliveryType === 'RAPIDO_CITY'
        ? subtotal >= DEFAULT_SETTINGS.cityFreeDeliveryAbove
          ? 0
          : DEFAULT_SETTINGS.cityDeliveryFee
        : DEFAULT_SETTINGS.courierDeliveryFee;

    const totalAmount = Number((subtotal + deliveryFee).toFixed(2));

    const adminNote = isAdmin && body.adminNote ? sanitizeText(body.adminNote, 250) : undefined;

    // Server always generates random unpredictable ID and forces initial statuses
    const newOrder: Order = {
      id: generateSecureOrderId(),
      customerName,
      customerPhone,
      deliveryType,
      deliveryAddress,
      city,
      pincode: pincodeRaw,
      landmark,
      items: verifiedItems,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'NEW',
      rapidoCopied: false,
      ...(adminNote ? { adminNote } : {}),
      createdAt: new Date().toISOString(),
    };

    // Persist to Supabase via server-only service_role key & decrement live stock
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error: dbErr } = await supabase
        .from('orders')
        .insert(mapOrderToDbRow(newOrder));
      if (dbErr) {
        console.warn('Supabase insert error in POST /api/orders');
      } else {
        for (const item of verifiedItems) {
          const prod = catalog.get(item.productId);
          if (prod) {
            const nextStock = Math.max(0, prod.stockQuantity - item.quantity);
            await supabase
              .from('products')
              .update({
                stock_quantity: nextStock,
                is_live: nextStock > 0 ? prod.isLive : false,
                updated_at: new Date().toISOString(),
              })
              .eq('id', prod.id);
          }
        }
      }
    }

    // Update memory + local file store
    const currentOrders = loadOrdersFromFile();
    const updated = [newOrder, ...currentOrders.filter((o) => o.id !== newOrder.id)];
    memoryOrders = updated;
    saveOrdersToFile(updated);

    logSecurityEvent(isAdmin ? 'admin_manual_order_created' : 'order_created', {
      orderId: newOrder.id,
      totalAmount: newOrder.totalAmount,
      paymentMethod: newOrder.paymentMethod,
      ip: maskIpForLog(ip),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Order recorded securely',
        order: newOrder,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to process order right now. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders
 * - Admin (verified HttpOnly cookie + Same-Origin): updates orderStatus, paymentStatus,
 *   courierTracking, adminNote, utrNumber, and rapidoCopied atomically.
 * - Customer (unauthenticated, verified by matching 10-digit phone):
 *   ONLY allows cancelling a NEW order OR submitting a UPI UTR reference on a UPI order.
 */
export async function PUT(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = await checkRateLimit(`orders_put:${ip}`, 25, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as {
      orderId?: unknown;
      orderStatus?: unknown;
      paymentStatus?: unknown;
      customerPhone?: unknown;
      utrNumber?: unknown;
      courierTracking?: unknown;
      adminNote?: unknown;
      rapidoCopied?: unknown;
    };

    const orderId = sanitizeText(body?.orderId, 32);
    const orderStatus =
      typeof body?.orderStatus === 'string'
        ? (body.orderStatus as Order['orderStatus'])
        : undefined;
    const paymentStatus =
      typeof body?.paymentStatus === 'string'
        ? (body.paymentStatus as Order['paymentStatus'])
        : undefined;

    const hasUtr = typeof body?.utrNumber === 'string';
    const cleanUtr = hasUtr
      ? String(body.utrNumber).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
      : undefined;

    const hasCourierTracking = typeof body?.courierTracking === 'string';
    const cleanCourierTracking = hasCourierTracking
      ? sanitizeText(body.courierTracking, 120)
      : undefined;

    const hasAdminNote = typeof body?.adminNote === 'string';
    const cleanAdminNote = hasAdminNote ? sanitizeText(body.adminNote, 250) : undefined;

    const hasRapidoCopied = typeof body?.rapidoCopied === 'boolean';
    const rapidoCopiedVal = hasRapidoCopied ? Boolean(body.rapidoCopied) : undefined;

    if (
      !orderId ||
      (!orderStatus &&
        !paymentStatus &&
        !hasUtr &&
        !hasCourierTracking &&
        !hasAdminNote &&
        !hasRapidoCopied)
    ) {
      return NextResponse.json(
        { success: false, error: 'Valid orderId and at least one update field are required.' },
        { status: 400 }
      );
    }

    if (orderStatus && !ALLOWED_ORDER_STATUSES.has(orderStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid orderStatus value.' },
        { status: 400 }
      );
    }
    if (paymentStatus && !ALLOWED_PAYMENT_STATUSES.has(paymentStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid paymentStatus value.' },
        { status: 400 }
      );
    }

    const adminSession = verifyAdminSession(request);
    const isAdmin = Boolean(adminSession);

    if (isAdmin && !verifySameOrigin(request)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request origin.' },
        { status: 403 }
      );
    }

    const allOrders = await loadAllOrders();
    const existing = allOrders.find((o) => o.id === orderId);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    if (!isAdmin) {
      if (paymentStatus || hasCourierTracking || hasAdminNote || hasRapidoCopied) {
        return NextResponse.json(
          { success: false, error: 'Only administrators can update fulfillment, tracking, or payment verification.' },
          { status: 403 }
        );
      }

      if (orderStatus && orderStatus !== 'CANCELLED') {
        return NextResponse.json(
          { success: false, error: 'Only administrators can update order dispatch stages.' },
          { status: 403 }
        );
      }

      if (orderStatus !== 'CANCELLED' && !hasUtr) {
        return NextResponse.json(
          { success: false, error: 'Only administrators can perform that update.' },
          { status: 403 }
        );
      }

      // Ownership verification: caller must prove matching 10-digit phone
      const suppliedPhone = normalizeIndianPhone(body?.customerPhone);
      const storedPhone = normalizeIndianPhone(existing.customerPhone);
      if (!suppliedPhone || !storedPhone || suppliedPhone !== storedPhone) {
        logSecurityEvent('order_customer_ownership_denied', {
          orderId,
          ip: maskIpForLog(ip),
        });
        return NextResponse.json(
          { success: false, error: 'Registered phone verification required to update this order.' },
          { status: 403 }
        );
      }

      if (orderStatus === 'CANCELLED' && existing.orderStatus !== 'NEW') {
        return NextResponse.json(
          { success: false, error: 'Order is already packed or dispatched and cannot be cancelled.' },
          { status: 400 }
        );
      }

      if (hasUtr) {
        if (existing.paymentMethod !== 'UPI' || existing.orderStatus === 'CANCELLED') {
          return NextResponse.json(
            { success: false, error: 'UTR can only be submitted for active UPI orders.' },
            { status: 400 }
          );
        }
        if (!cleanUtr || cleanUtr.length < 6 || cleanUtr.length > 32) {
          return NextResponse.json(
            { success: false, error: 'Please enter a valid 6 to 32 character alphanumeric UPI Ref / UTR.' },
            { status: 400 }
          );
        }
      }
    }

    const updatedOrder: Order = {
      ...existing,
      ...(orderStatus ? { orderStatus } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(hasUtr ? { utrNumber: cleanUtr || undefined } : {}),
      ...(hasCourierTracking ? { courierTracking: cleanCourierTracking || undefined } : {}),
      ...(hasAdminNote ? { adminNote: cleanAdminNote || undefined } : {}),
      ...(hasRapidoCopied ? { rapidoCopied: rapidoCopiedVal } : {}),
    };

    const updatedOrders = allOrders.map((o) => (o.id === orderId ? updatedOrder : o));
    memoryOrders = updatedOrders;
    saveOrdersToFile(updatedOrders);

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const dbPatch: Record<string, string | boolean | null> = {
        updated_at: new Date().toISOString(),
      };
      if (orderStatus) dbPatch.order_status = orderStatus;
      if (paymentStatus) dbPatch.payment_status = paymentStatus;
      if (hasUtr) dbPatch.utr_number = cleanUtr || null;
      if (hasCourierTracking) dbPatch.courier_tracking = cleanCourierTracking || null;
      if (hasAdminNote) dbPatch.admin_note = cleanAdminNote || null;
      if (hasRapidoCopied) dbPatch.rapido_copied = Boolean(rapidoCopiedVal);

      const { error: dbErr } = await supabase
        .from('orders')
        .update(dbPatch)
        .eq('id', orderId);
      if (dbErr) {
        console.warn('Supabase update error in PUT /api/orders');
      }

      // Restore stock in Supabase when transitioning to CANCELLED from a non-cancelled state
      if (existing.orderStatus !== 'CANCELLED' && orderStatus === 'CANCELLED') {
        const catalog = await loadServerCatalog();
        for (const item of existing.items) {
          const prod = catalog.get(item.productId);
          if (prod) {
            const restoredStock = prod.stockQuantity + item.quantity;
            await supabase
              .from('products')
              .update({
                stock_quantity: restoredStock,
                is_live: restoredStock > 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', prod.id);
          }
        }
      }
    }

    const eventType = isAdmin
      ? 'admin_order_updated'
      : orderStatus === 'CANCELLED'
      ? 'customer_order_cancelled'
      : 'customer_utr_submitted';

    logSecurityEvent(eventType, {
      orderId,
      orderStatus: updatedOrder.orderStatus,
      paymentStatus: updatedOrder.paymentStatus,
      ip: maskIpForLog(ip),
    });

    return NextResponse.json({
      success: true,
      orderId,
      orderStatus: updatedOrder.orderStatus,
      paymentStatus: updatedOrder.paymentStatus,
      order: isAdmin ? updatedOrder : maskOrderForPublic(updatedOrder),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to update order right now.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders?id=...
 * Admin only: Removes an order (verified HttpOnly cookie + Same-Origin).
 */
export async function DELETE(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const rl = await checkRateLimit(`orders_delete:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests.' },
      { status: 429 }
    );
  }

  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const adminSession = verifyAdminSession(request);
  if (!adminSession) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 403 }
    );
  }

  try {
    const orderId = sanitizeText(new URL(request.url).searchParams.get('id'), 32);
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'id query parameter required.' },
        { status: 400 }
      );
    }

    const currentOrders = await loadAllOrders();
    const updated = currentOrders.filter((o) => o.id !== orderId);
    memoryOrders = updated;
    saveOrdersToFile(updated);

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error: dbErr } = await supabase.from('orders').delete().eq('id', orderId);
      if (dbErr) {
        console.warn('Supabase delete error in DELETE /api/orders');
      }
    }

    logSecurityEvent('admin_order_deleted', {
      orderId,
      ip: maskIpForLog(ip),
    });

    return NextResponse.json({
      success: true,
      message: 'Order removed securely.',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to delete order right now.' },
      { status: 500 }
    );
  }
}
