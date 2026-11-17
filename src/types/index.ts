export type ProductCategory = 
  | 'Joint & Muscle Pain'
  | 'Digestion & Acidity'
  | 'Immunity & Cold'
  | 'Skin & Hair'
  | 'Daily Wellness'
  | 'Respiratory Care';

export type BrandName = 
  | 'Dabur'
  | 'Zandu'
  | 'Himalaya'
  | 'Baidyanath'
  | 'Patanjali'
  | 'Dr. Ortho'
  | 'Hamdard'
  | 'Vicco'
  | 'Other';

export interface Product {
  id: string;
  name: string;
  brand: BrandName | string;
  category: ProductCategory | string;
  packSize: string;               // e.g. '25g', '100ml', '60 Tablets'
  agencyCostPrice: number;        // Wholesale price from agency with GST
  mrp: number;                    // Maximum Retail Price
  sellingPrice: number;           // Storefront customer price (with savings)
  stockQuantity: number;          // Real-time home dark store stock
  isLive: boolean;                // Merchant visibility switch
  imageUrl?: string;
  indications: string;            // Bullet point indication / benefits
  dosage?: string;                // e.g. '1 tablet twice daily' or 'apply gently'
  composition?: string;           // Key Ayurvedic herbs/ingredients
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
  createdAt: string;
}

export interface MerchantSettings {
  storeName: string;
  tagline: string;
  merchantWhatsApp: string;       // WhatsApp number with country code, e.g. '919876543210'
  merchantUpiId: string;          // e.g. 'ayurswift@okaxis'
  merchantUpiName: string;        // Name on UPI account
  cityDeliveryFee: number;        // Flat ₹35
  cityFreeDeliveryAbove: number;  // Free above ₹499
  courierDeliveryFee: number;     // Flat ₹60
  adminPin: string;               // Default '1234'
}
