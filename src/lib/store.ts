'use client';

import { Product, Order, MerchantSettings, DeliveryType, PaymentMethod } from '@/types';
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS, isVerifiedProductImageUrl } from './initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'ayurswift_products_v3',
  ORDERS: 'ayurswift_orders_v1',
  SETTINGS: 'ayurswift_settings_v2',
  CART: 'ayurswift_cart_v1',
};

// Retrieve settings (automatically strips any legacy plain-text adminPin)
export function getStoredSettings(): MerchantSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const hasLegacyPin = 'adminPin' in parsed;
    const needsMigration =
      hasLegacyPin ||
      parsed.merchantUpiId === 'ayurswift@okhdfcbank' ||
      parsed.merchantWhatsApp === '919876543210' ||
      !parsed.adminEmail ||
      !parsed.merchantUpiId;

    const clean: MerchantSettings = {
      ...DEFAULT_SETTINGS,
      storeName: typeof parsed.storeName === 'string' ? parsed.storeName : DEFAULT_SETTINGS.storeName,
      tagline: typeof parsed.tagline === 'string' ? parsed.tagline : DEFAULT_SETTINGS.tagline,
      merchantWhatsApp:
        typeof parsed.merchantWhatsApp === 'string' && parsed.merchantWhatsApp !== '919876543210'
          ? parsed.merchantWhatsApp
          : DEFAULT_SETTINGS.merchantWhatsApp,
      merchantUpiId:
        typeof parsed.merchantUpiId === 'string' && parsed.merchantUpiId !== 'ayurswift@okhdfcbank'
          ? parsed.merchantUpiId
          : DEFAULT_SETTINGS.merchantUpiId,
      merchantUpiName:
        typeof parsed.merchantUpiName === 'string'
          ? parsed.merchantUpiName
          : DEFAULT_SETTINGS.merchantUpiName,
      cityDeliveryFee:
        typeof parsed.cityDeliveryFee === 'number'
          ? parsed.cityDeliveryFee
          : DEFAULT_SETTINGS.cityDeliveryFee,
      cityFreeDeliveryAbove:
        typeof parsed.cityFreeDeliveryAbove === 'number'
          ? parsed.cityFreeDeliveryAbove
          : DEFAULT_SETTINGS.cityFreeDeliveryAbove,
      courierDeliveryFee:
        typeof parsed.courierDeliveryFee === 'number'
          ? parsed.courierDeliveryFee
          : DEFAULT_SETTINGS.courierDeliveryFee,
      adminEmail:
        typeof parsed.adminEmail === 'string' && parsed.adminEmail
          ? parsed.adminEmail
          : DEFAULT_SETTINGS.adminEmail,
    };

    if (needsMigration) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(clean));
    }
    return clean;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: MerchantSettings) {
  if (typeof window === 'undefined') return;
  const { ...safeSettings } = settings;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(safeSettings));
}

// Retrieve cached products (respects explicit empty array [] after server sync)
export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const cleaned: Product[] = parsed.map((p: Product) => {
      const cleanImg = isVerifiedProductImageUrl(p.imageUrl) ? p.imageUrl : '';
      const cleanImages = Array.isArray(p.images)
        ? p.images.filter((u) => isVerifiedProductImageUrl(u))
        : [];
      const fixedBrand = p.id === 'prod-004' && p.brand === 'Other' ? 'Moov' : p.brand;
      const fixedForm = p.id === 'prod-004' && p.form === 'Oil' ? 'Spray' : p.form;
      const fixedCategory =
        p.id === 'prod-018' && p.category === 'Daily Wellness' ? 'Liver & Detox' : p.category;

      return {
        ...p,
        brand: fixedBrand,
        form: fixedForm,
        category: fixedCategory,
        imageUrl: cleanImg,
        images: cleanImages,
        rating: undefined,
        reviewCount: undefined,
      };
    });

    return cleaned;
  } catch {
    return [];
  }
}

export function saveStoredProducts(products: Product[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function resetToInitialProducts(): Product[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  }
  return INITIAL_PRODUCTS;
}

// Retrieve orders
export function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredOrders(orders: Order[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

export interface PlaceOrderPayload {
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  deliverySlotId?: string;
  deliverySlotDate?: string;
  deliveryAddress: string;
  city: string;
  pincode: string;
  landmark?: string;
  paymentMethod: PaymentMethod;
  items: { productId: string; quantity: number }[];
  website?: string; // honeypot field
}

/**
 * Places a new order strictly through the server API so prices, fees, stock,
 * and unpredictable random Order IDs are computed authoritatively on the server.
 */
export async function placeOrderOnServer(payload: PlaceOrderPayload): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    order?: Order;
    error?: string;
  };

  if (!res.ok || !data.success || !data.order) {
    throw new Error(data.error || 'Could not confirm your order on the server. Please try again.');
  }

  const existing = getStoredOrders();
  const next = [data.order, ...existing.filter((o) => o.id !== data.order!.id)];
  saveStoredOrders(next);
  return data.order;
}

// Cross-device order lookup by exact 10-digit phone number or exact Order ID
export async function lookupOrdersCrossDevice(query: string): Promise<Order[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const local = getStoredOrders();
  const digitsQ = cleanQ.replace(/\D/g, '');
  const cleanStrQ = cleanQ.toLowerCase().replace(/[^a-z0-9]/g, '');

  const localMatches = local.filter((o) => {
    const cleanId = o.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPhone = o.customerPhone.replace(/\D/g, '');
    return (
      (cleanStrQ.length >= 6 && cleanId === cleanStrQ) ||
      (digitsQ.length === 10 && cleanPhone.slice(-10) === digitsQ)
    );
  });

  try {
    const res = await fetch(`/api/orders?q=${encodeURIComponent(cleanQ)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        if (typeof window !== 'undefined') {
          const mergedMap = new Map<string, Order>();
          local.forEach((o) => mergedMap.set(o.id, o));
          data.orders.forEach((o: Order) => mergedMap.set(o.id, o));
          const merged = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(merged));
        }
        return data.orders;
      }
    }
  } catch {
    // Fallback cleanly to local matches
  }

  return localMatches;
}

// Check server for real-time status updates (orderStatus, paymentStatus, utrNumber, courierTracking)
export async function syncOrderStatuses(): Promise<Order[]> {
  const local = getStoredOrders();
  if (typeof window === 'undefined' || local.length === 0) return local;

  try {
    const ids = local.map((o) => o.id).filter(Boolean).slice(0, 20).join(',');
    if (!ids) return local;
    const res = await fetch(`/api/orders?ids=${encodeURIComponent(ids)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const serverMap = new Map<string, Order>();
        data.orders.forEach((o: Order) => serverMap.set(o.id, o));

        let changed = false;
        const updated = local.map((locOrder) => {
          const srv = serverMap.get(locOrder.id);
          if (
            srv &&
            (srv.orderStatus !== locOrder.orderStatus ||
              srv.paymentStatus !== locOrder.paymentStatus ||
              srv.courierTracking !== locOrder.courierTracking ||
              (srv.utrNumber && !locOrder.utrNumber))
          ) {
            changed = true;
            return {
              ...locOrder,
              orderStatus: srv.orderStatus,
              paymentStatus: srv.paymentStatus,
              courierTracking: srv.courierTracking ?? locOrder.courierTracking,
              utrNumber: locOrder.utrNumber || srv.utrNumber,
            };
          }
          return locOrder;
        });

        if (changed) {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          return updated;
        }
      }
    }
  } catch {}

  return local;
}

// Customer submits UPI UTR / transaction reference verified by matching 10-digit phone
export async function submitOrderUtr(
  orderId: string,
  customerPhone: string,
  utrNumber: string
): Promise<Order | null> {
  const cleanUtr = utrNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  if (cleanUtr.length < 6) {
    throw new Error('Please enter a valid 6+ character UPI Ref / UTR number.');
  }

  const res = await fetch('/api/orders', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      customerPhone,
      utrNumber: cleanUtr,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    order?: Order;
    error?: string;
  };

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Could not save UTR number. Please verify your mobile number.');
  }

  if (typeof window !== 'undefined') {
    const current = getStoredOrders();
    const updated = current.map((o) =>
      o.id === orderId ? { ...o, utrNumber: cleanUtr } : o
    );
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    return updated.find((o) => o.id === orderId) || data.order || null;
  }

  return data.order || null;
}

// Stage-aware smart WhatsApp notification link for Admin -> Customer
export function generateSmartAdminWhatsAppUrl(order: Order): string {
  const phoneDigits = order.customerPhone.replace(/\D/g, '');
  const cleanPhone = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

  let msg = '';
  const slotLine = order.deliverySlot ? `\n*Delivery Slot:* ${order.deliverySlot}` : '';
  if (order.orderStatus === 'DISPATCHED') {
    msg =
      `Hi ${order.customerName}! 🌿 Your AyurSwift order *${order.id}* is *Out for Delivery* via ${
        order.deliveryType === 'RAPIDO_CITY' ? 'Bhavnagar Local Delivery ⚡' : 'Express Courier 📦'
      }!` +
      slotLine +
      (order.courierTracking ? `\n\n*Rider / Tracking:* ${order.courierTracking}` : '') +
      `\nTrack live anytime at https://ayurswift.vercel.app`;
  } else if (order.orderStatus === 'DELIVERED') {
    msg = `Hi ${order.customerName}! 🌿 Your AyurSwift order *${order.id}* (₹${order.totalAmount}) has been *Delivered*. Thank you for choosing genuine Ayurveda! Order again anytime at https://ayurswift.vercel.app`;
  } else if (order.orderStatus === 'CANCELLED') {
    msg = `Hi ${order.customerName}, your AyurSwift order *${order.id}* has been *Cancelled* as requested. Any prepaid UPI amount will be refunded promptly. Helpline: +91 96247 66242.`;
  } else if (order.orderStatus === 'PACKED') {
    msg =
      `Hi ${order.customerName}! 🌿 Your AyurSwift order *${order.id}*` +
      (order.paymentStatus === 'VERIFIED' ? ' (UPI Payment Verified ✓)' : '') +
      ` is *Packed & Ready* at our Bhavnagar store!` +
      slotLine +
      `\nTrack live: https://ayurswift.vercel.app`;
  } else {
    msg =
      `Hi ${order.customerName}! 🌿 We have received your AyurSwift order *${order.id}* (₹${order.totalAmount}).` +
      slotLine +
      (order.paymentStatus === 'VERIFIED'
        ? '\nYour UPI payment is verified ✓ and we will pack it for your chosen slot.'
        : '\nOur store is verifying stock & payment for your chosen slot.') +
      `\nTrack live: https://ayurswift.vercel.app`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

// Format Rapido drop info in 1 tap for rider dispatch
export function formatRapidoDropText(order: Order): string {
  const cleanPhone = order.customerPhone.replace(/\D/g, '').slice(-10);
  const slotPart = order.deliverySlot ? `\nSlot: ${order.deliverySlot}` : '';
  return `Drop to: ${order.customerName}
Phone: ${cleanPhone}${slotPart}
Address: ${order.deliveryAddress}${order.landmark ? ', Landmark: ' + order.landmark : ''}, ${order.city} - ${order.pincode}
Order: ${order.id} | Collect: ${order.paymentMethod === 'COD' ? '₹' + order.totalAmount + ' (COD)' : 'PAID (UPI)'}`;
}

// Generate UPI Payment URI (Universal Bharat QR / UPI Intent standard)
export function generateUpiUri(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  orderId: string;
}): string {
  // UPI VPA must preserve the '@' symbol (e.g. 9624766242@fam) for NPCI and mobile scanners
  const cleanUpi = params.upiId.trim();
  const cleanName = encodeURIComponent(params.payeeName.trim() || 'AyurSwift');
  const cleanAmount = params.amount > 0 ? params.amount.toFixed(2) : '';
  const note = encodeURIComponent(`AyurSwift Order ${params.orderId}`);
  if (cleanAmount) {
    return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${note}`;
  }
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR&tn=${note}`;
}

// Format WhatsApp Order Message with direct intent link
export function generateWhatsAppOrderUrl(order: Order, merchantWhatsApp: string): string {
  let phone = merchantWhatsApp.replace(/\D/g, '');
  if (phone.length === 10) {
    phone = `91${phone}`;
  }
  const itemsText = order.items
    .map(i => `• ${i.name} (${i.packSize}) x ${i.quantity} = ₹${i.totalPrice}`)
    .join('\n');

  const deliveryTypeLabel = order.deliveryType === 'RAPIDO_CITY' 
    ? '🕒 Bhavnagar Slot Delivery' 
    : '📦 Outside-City (Speed Post / Courier)';

  const slotLine = order.deliverySlot ? `\n*Delivery Slot:* ${order.deliverySlot}` : '';

  const paymentLabel = order.paymentMethod === 'COD' 
    ? '💵 Cash on Delivery (COD)' 
    : '📱 100% Prepaid UPI';

  const message = `🌿 *New Order Placed - AyurSwift*
━━━━━━━━━━━━━━━━━━
*Order ID:* ${order.id}
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}

*Delivery Type:* ${deliveryTypeLabel}${slotLine}
*Delivery Address:*
${order.deliveryAddress}${order.landmark ? '\nLandmark: ' + order.landmark : ''}
${order.city} - ${order.pincode}

*Order Items:*
${itemsText}

*Subtotal:* ₹${order.subtotal}
*Delivery Fee:* ${order.deliveryFee === 0 ? 'FREE' : '₹' + order.deliveryFee}
*Total Payable:* ₹${order.totalAmount}
*Payment Method:* ${paymentLabel}
━━━━━━━━━━━━━━━━━━
_Please confirm dispatch time!_`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export interface ProductMutationResult {
  ok: boolean;
  status: number;
  error?: string;
  product?: Product;
  products?: Product[];
}

// Fetch authoritative live product catalog from Supabase via server endpoint (no browser/CDN cache)
export async function fetchLiveCatalogFromServer(isAdmin = false): Promise<Product[] | null> {
  try {
    const url = isAdmin
      ? `/api/admin/products?_t=${Date.now()}`
      : `/api/admin/products?public=1&_t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.success && Array.isArray(data.products)) {
      if (typeof window !== 'undefined') {
        saveStoredProducts(data.products);
      }
      return data.products as Product[];
    }
    return null;
  } catch {
    return null;
  }
}

// Sync product changes through authenticated server API with detailed error reporting
export async function syncProductToServer(product: Product): Promise<ProductMutationResult> {
  try {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(product),
    });
    if (res.status === 413) {
      return {
        ok: false,
        status: 413,
        error: 'Product images are too large to upload. Try fewer or smaller photos.',
      };
    }
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
      product?: Product;
    };
    if (!res.ok || !data.success) {
      return {
        ok: false,
        status: res.status,
        error: data.error || `Server error (${res.status}) while saving product.`,
      };
    }
    return { ok: true, status: res.status, product: data.product || product };
  } catch {
    return { ok: false, status: 0, error: 'Network error saving product to server.' };
  }
}

export async function deleteProductOnServer(productId: string): Promise<ProductMutationResult> {
  try {
    const res = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };
    if (!res.ok || !data.success) {
      return {
        ok: false,
        status: res.status,
        error: data.error || `Server error (${res.status}) while deleting product.`,
      };
    }
    return { ok: true, status: res.status };
  } catch {
    return { ok: false, status: 0, error: 'Network error deleting product from server.' };
  }
}

export async function restoreStarterCatalogOnServer(): Promise<ProductMutationResult> {
  try {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ action: 'SEED_STARTER' }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
      products?: Product[];
    };
    if (!res.ok || !data.success) {
      return {
        ok: false,
        status: res.status,
        error: data.error || 'Could not restore starter catalog on server.',
      };
    }
    if (typeof window !== 'undefined' && Array.isArray(data.products)) {
      saveStoredProducts(data.products);
    }
    return { ok: true, status: res.status, products: data.products };
  } catch {
    return { ok: false, status: 0, error: 'Network error restoring starter catalog.' };
  }
}

// -------------------------------------------------------------
// DAY-BY-DAY ORDER MANAGEMENT & BOOKKEEPING HELPERS
// -------------------------------------------------------------

export interface DayGroupedOrders {
  dateKey: string;          // 'YYYY-MM-DD'
  displayDate: string;      // e.g. 'Thursday, 19 Nov 2026'
  isToday: boolean;
  isYesterday: boolean;
  orders: Order[];
  totalRevenue: number;
  codAmount: number;
  upiAmount: number;
}

export function getIstDateKey(input: string | Date = new Date()): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  }
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
}

export function groupOrdersByDate(orders: Order[]): DayGroupedOrders[] {
  const groupsMap = new Map<string, Order[]>();

  const now = new Date();
  const todayStr = getIstDateKey(now);
  const yesterdayStr = getIstDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  orders.forEach((o) => {
    const dateKey = getIstDateKey(o.createdAt || new Date());
    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, []);
    }
    groupsMap.get(dateKey)!.push(o);
  });

  // Sort dates descending (newest day first)
  const sortedDateKeys = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));

  return sortedDateKeys.map((dateKey) => {
    const dayOrders = groupsMap.get(dateKey) || [];
    // Sort orders inside day descending
    dayOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const dateObj = new Date(`${dateKey}T12:00:00+05:30`);
    const displayDate = dateObj.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });

    const isToday = dateKey === todayStr;
    const isYesterday = dateKey === yesterdayStr;

    const totalRevenue = dayOrders.reduce((sum, o) => sum + (o.orderStatus !== 'CANCELLED' ? o.totalAmount : 0), 0);
    const codAmount = dayOrders
      .filter((o) => o.paymentMethod === 'COD' && o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const upiAmount = dayOrders
      .filter((o) => o.paymentMethod === 'UPI' && o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      dateKey,
      displayDate,
      isToday,
      isYesterday,
      orders: dayOrders,
      totalRevenue,
      codAmount,
      upiAmount,
    };
  });
}

export function getDailyOrderStats(orders: Order[], filterDateKey?: string) {
  const targetOrders = filterDateKey
    ? orders.filter((o) => getIstDateKey(o.createdAt || '') === filterDateKey)
    : orders;

  const validOrders = targetOrders.filter((o) => o.orderStatus !== 'CANCELLED');

  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const codAmount = validOrders
    .filter((o) => o.paymentMethod === 'COD')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const upiAmount = validOrders
    .filter((o) => o.paymentMethod === 'UPI')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const newCount = targetOrders.filter((o) => o.orderStatus === 'NEW').length;
  const packedCount = targetOrders.filter((o) => o.orderStatus === 'PACKED').length;
  const dispatchedCount = targetOrders.filter((o) => o.orderStatus === 'DISPATCHED').length;
  const deliveredCount = targetOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const cancelledCount = targetOrders.filter((o) => o.orderStatus === 'CANCELLED').length;

  return {
    totalOrders: targetOrders.length,
    validOrdersCount: validOrders.length,
    totalRevenue,
    codAmount,
    upiAmount,
    pendingActionCount: newCount + packedCount,
    newCount,
    packedCount,
    dispatchedCount,
    deliveredCount,
    cancelledCount,
  };
}

// 1-Click Export Orders to CSV (Spreadsheet / Excel format)
export function exportOrdersToCsv(orders: Order[]): string {
  const headers = [
    'Order ID',
    'Date',
    'Time',
    'Customer Name',
    'Customer Phone',
    'Delivery Type',
    'Delivery Slot',
    'Address',
    'Landmark',
    'City',
    'Pincode',
    'Items Summary',
    'Subtotal (INR)',
    'Delivery Fee (INR)',
    'Total Amount (INR)',
    'Payment Method',
    'Payment Status',
    'Order Status',
    'Rapido Copied',
    'UTR / Ref',
    'Tracking / Rider',
  ];

  const rows = orders.map((o) => {
    const d = new Date(o.createdAt);
    const dateStr = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const timeStr = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
    const itemsSummary = o.items
      .map((i) => `${i.quantity}x ${i.name} (${i.packSize})`)
      .join('; ');

    return [
      `"${o.id}"`,
      `"${dateStr}"`,
      `"${timeStr}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${o.customerPhone}"`,
      `"${o.deliveryType}"`,
      `"${(o.deliverySlot || '').replace(/"/g, '""')}"`,
      `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
      `"${(o.landmark || '').replace(/"/g, '""')}"`,
      `"${o.city}"`,
      `"${o.pincode}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      o.subtotal,
      o.deliveryFee,
      o.totalAmount,
      `"${o.paymentMethod}"`,
      `"${o.paymentStatus}"`,
      `"${o.orderStatus}"`,
      o.rapidoCopied ? 'YES' : 'NO',
      `"${(o.utrNumber || '').replace(/"/g, '""')}"`,
      `"${(o.courierTracking || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
