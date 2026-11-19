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
  // Asynchronously sync to server API for cross-device visibility
  try {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders),
    }).catch(() => {});
  } catch {}
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
    const res = await fetch('/api/orders');
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
