'use client';

import { Product, Order, MerchantSettings, CartItem } from '@/types';
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS } from './initialData';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  PRODUCTS: 'ayurswift_products_v3', // Updated key for multiple image support & real catalog
  ORDERS: 'ayurswift_orders_v1',
  SETTINGS: 'ayurswift_settings_v2', // Updated key for real WhatsApp (9624766242) & UPI (9624766242@fam)
  CART: 'ayurswift_cart_v1',
};

// Retrieve settings
export function getStoredSettings(): MerchantSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    // If old demo whatsapp, old upi, or old pin is detected, automatically migrate to user's real details
    if (
      parsed.merchantUpiId === 'ayurswift@okhdfcbank' ||
      parsed.merchantWhatsApp === '919876543210' ||
      parsed.adminPin === '1234' ||
      !parsed.adminEmail ||
      !parsed.merchantUpiId
    ) {
      const updated: MerchantSettings = {
        ...parsed,
        adminPin: DEFAULT_SETTINGS.adminPin,
        adminEmail: DEFAULT_SETTINGS.adminEmail,
        merchantWhatsApp: DEFAULT_SETTINGS.merchantWhatsApp,
        merchantUpiId: DEFAULT_SETTINGS.merchantUpiId,
        merchantUpiName: DEFAULT_SETTINGS.merchantUpiName,
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: MerchantSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Retrieve products (with fallback to INITIAL_PRODUCTS)
export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
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
  // 1. Asynchronously sync to server API for cross-device visibility
  try {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders),
    }).catch(() => {});
  } catch {}

  // 2. Asynchronously sync to Supabase database if configured
  if (isSupabaseConfigured && supabase) {
    orders.forEach((o) => {
      syncOrderToSupabase(o).catch(() => {});
    });
  }
}

// Sync individual order to Supabase PostgreSQL database
export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('orders').upsert({
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
    });
    if (error) {
      console.warn('Supabase order upsert note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase order sync error:', err);
    return false;
  }
}

// Fetch orders directly from Supabase PostgreSQL database
export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch orders notice:', error.message);
      return null;
    }

    if (Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => ({
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
      }));
    }
  } catch (err) {
    console.error('Supabase fetch orders error:', err);
  }
  return null;
}

// Cross-device order lookup by 10-digit phone number or Order ID (e.g. #AS-1001)
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
      cleanId.includes(cleanStrQ) ||
      cleanStrQ.includes(cleanId) ||
      (digitsQ.length >= 4 && cleanPhone.includes(digitsQ))
    );
  });

  try {
    const res = await fetch(`/api/orders?q=${encodeURIComponent(cleanQ)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        // Automatically pin discovered orders to local device storage
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
  } catch (err) {
    console.error('Server order lookup error:', err);
  }

  return localMatches;
}

// Check server for real-time status updates (e.g. PACKED, DISPATCHED, DELIVERED)
export async function syncOrderStatuses(): Promise<Order[]> {
  const local = getStoredOrders();
  if (typeof window === 'undefined' || local.length === 0) return local;

  try {
    const ids = local.map((o) => o.id).filter(Boolean).join(',');
    const res = await fetch(`/api/orders?ids=${encodeURIComponent(ids)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const serverMap = new Map<string, Order>();
        data.orders.forEach((o: Order) => serverMap.set(o.id, o));

        let changed = false;
        const updated = local.map((locOrder) => {
          const srv = serverMap.get(locOrder.id);
          if (srv && srv.orderStatus !== locOrder.orderStatus) {
            changed = true;
            return { ...locOrder, orderStatus: srv.orderStatus };
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

// Generate human-friendly sequential order ID
export function generateNextOrderId(existingOrders: Order[]): string {
  const currentCount = existingOrders.length;
  const num = 1001 + currentCount;
  return `#AS-${num}`;
}

// Format Rapido drop info in 1 tap for rider dispatch
export function formatRapidoDropText(order: Order): string {
  const cleanPhone = order.customerPhone.replace(/\D/g, '').slice(-10);
  return `Drop to: ${order.customerName}
Phone: ${cleanPhone}
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
    ? '⚡ Rapid In-City (Rapido 30-45m)' 
    : '📦 Outside-City (Speed Post / Courier)';

  const paymentLabel = order.paymentMethod === 'COD' 
    ? '💵 Cash on Delivery (COD)' 
    : '📱 100% Prepaid UPI';

  const message = `🌿 *New Order Placed - AyurSwift*
━━━━━━━━━━━━━━━━━━
*Order ID:* ${order.id}
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}

*Delivery Type:* ${deliveryTypeLabel}
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

// Asynchronously sync product stock to Supabase if configured
export async function syncProductToSupabase(product: Product) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('products').upsert({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      pack_size: product.packSize,
      agency_cost_price: product.agencyCostPrice,
      mrp: product.mrp,
      selling_price: product.sellingPrice,
      stock_quantity: product.stockQuantity,
      is_live: product.isLive,
      image_url: product.imageUrl,
      indications: product.indications,
      dosage: product.dosage,
      composition: product.composition,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Supabase product sync error:', err);
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

export function groupOrdersByDate(orders: Order[]): DayGroupedOrders[] {
  const groupsMap = new Map<string, Order[]>();

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  orders.forEach((o) => {
    const dateKey = (o.createdAt || new Date().toISOString()).split('T')[0];
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

    const dateObj = new Date(`${dateKey}T12:00:00Z`);
    const displayDate = dateObj.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
    ? orders.filter((o) => (o.createdAt || '').startsWith(filterDateKey))
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
  ];

  const rows = orders.map((o) => {
    const d = new Date(o.createdAt);
    const dateStr = d.toLocaleDateString('en-IN');
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
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
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
