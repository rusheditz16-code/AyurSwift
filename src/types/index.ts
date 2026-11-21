export type ProductCategory = 
  | 'Joint & Muscle Pain'
  | 'Digestion & Acidity'
  | 'Immunity & Cold'
  | 'Skin & Hair'
  | 'Daily Wellness'
  | 'Liver & Detox';

export type BrandName = 
  | 'Dabur'
  | 'Zandu'
  | 'Himalaya'
  | 'Baidyanath'
  | 'Patanjali'
  | 'Dr. Ortho'
  | 'Moov'
  | 'Hamdard'
  | 'Vicco'
  | 'Charak'
  | 'Other';

export interface Product {
  id: string;
  name: string;
  brand: BrandName | string;
  category: ProductCategory | string;
  manufacturer: string;           // e.g. 'Dabur India Ltd.'
  form: 'Oil' | 'Tablets' | 'Churna' | 'Syrup' | 'Balm' | 'Gel' | 'Husk' | 'Capsules' | 'Spray';
  packSize: string;               // e.g. '25g Jar', '100ml Bottle', '60 Tablets'
  agencyCostPrice: number;        // Wholesale agency purchase price with GST
  mrp: number;                    // Maximum Retail Price
  sellingPrice: number;           // Storefront customer price (with savings)
  stockQuantity: number;          // Real-time home dark store stock
  isLive: boolean;                // Merchant visibility switch
  rating?: number;                // Optional — only shown when backed by real customer reviews
  reviewCount?: number;           // Optional — only shown when backed by real customer reviews
  imageUrl?: string;
  images?: string[];              // Multiple packshot views (front, back, label, side)
  indications: string;            // Bullet point benefits
  dosage: string;                 // Dosage instructions
  composition: string;            // Key Ayurvedic herbs/ingredients
  safetyAdvice?: string;          // e.g. 'Store in cool dry place, keep away from direct sunlight'
  badgeText?: string;             // e.g. 'Classical Oil', '40+ Herbs'
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type DeliveryType = 'RAPIDO_CITY' | 'COURIER_OUTSIDE';

export type PaymentMethod = 'COD' | 'UPI';

export type OrderStatus = 'NEW' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItemSummary {
  productId: string;
  name: string;
  brand: string;
  packSize: string;
  quantity: number;
  mrp?: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;                     // e.g. '#AS-1001'
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  deliveryAddress: string;
  city: string;
  pincode: string;
  landmark?: string;
  items: OrderItemSummary[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PENDING' | 'PAID' | 'VERIFIED';
  orderStatus: OrderStatus;
  rapidoCopied: boolean;
  utrNumber?: string;
  courierTracking?: string;
  adminNote?: string;
  createdAt: string;
}

export interface MerchantSettings {
  storeName: string;
  tagline: string;
  merchantWhatsApp: string;       // WhatsApp number with country code, e.g. '919876543210'
  merchantUpiId: string;          // e.g. 'ayurswift@okhdfcbank'
  merchantUpiName: string;        // Name on UPI account
  cityDeliveryFee: number;        // Flat ₹35
  cityFreeDeliveryAbove: number;  // Free above ₹499
  courierDeliveryFee: number;     // Flat ₹60
  adminEmail?: string;            // Display email for admin portal
}
