'use client';

import { Product, Order, MerchantSettings, CartItem } from '@/types';
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS } from './initialData';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  PRODUCTS: 'ayurswift_products_v2', // Updated key for real product catalog
  ORDERS: 'ayurswift_orders_v1',
  SETTINGS: 'ayurswift_settings_v1',
  CART: 'ayurswift_cart_v1',
};

// Retrieve settings
export function getStoredSettings(): MerchantSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
  const cleanUpi = encodeURIComponent(params.upiId.trim());
  const cleanName = encodeURIComponent(params.payeeName.trim() || 'AyurSwift');
  const cleanAmount = params.amount.toFixed(2);
  const note = encodeURIComponent(`Order ${params.orderId} - AyurSwift`);
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${note}`;
}

// Format WhatsApp Order Message with direct intent link
export function generateWhatsAppOrderUrl(order: Order, merchantWhatsApp: string): string {
  const phone = merchantWhatsApp.replace(/\D/g, '');
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
