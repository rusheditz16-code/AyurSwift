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
  form:
    | 'Oil'
    | 'Tablets'
    | 'Churna'
    | 'Syrup'
    | 'Balm'
    | 'Gel'
    | 'Husk'
    | 'Capsules'
    | 'Spray'
    | 'Powder'
    | 'Soap'
    | 'Toothbrush'
    | 'Toothpaste'
    | 'Cream'
    | 'Drops'
    | 'Lotion'
    | string;
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
  hsnCode?: string;               // Optional HSN code for GST invoices (e.g. '30049011', '34011190')
  gstRate?: number;               // Optional GST slab % (0 | 5 | 12 | 18)
  batchNo?: string;               // Optional manufacturer Batch No.
  expiryDate?: string;            // Optional Expiry Date (e.g. '10/2028')
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type DeliveryType = 'RAPIDO_CITY' | 'COURIER_OUTSIDE';

export type PaymentMethod = 'COD' | 'UPI';

export type OrderStatus = 'NEW' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export type BillingMode = 'NON_GST' | 'GST';

export interface OrderItemSummary {
  productId: string;
  name: string;
  brand: string;
  packSize: string;
  quantity: number;
  mrp?: number;
  unitPrice: number;
  totalPrice: number;
  hsnCode?: string;
  gstRate?: number;
  batchNo?: string;
  expiryDate?: string;
}

export interface Order {
  id: string;                     // e.g. '#AS-7K4M9X2P'
  invoiceNumber?: string;         // Sequential legal bill number e.g. 'AS/26-27/0001'
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  deliverySlot?: string;          // e.g. '22 Nov 2026 • 9:00 AM – 10:00 AM'
  slotRescheduledCount?: number;  // 0 = original slot, 1+ = auto-moved to next slot because UPI was unpaid
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
  merchantWhatsApp: string;       // WhatsApp number with country code, e.g. '919624766242'
  merchantUpiId: string;          // e.g. '9624766242@fam'
  merchantUpiName: string;        // Name on UPI account
  cityDeliveryFee: number;        // Flat ₹35
  cityFreeDeliveryAbove: number;  // Free above ₹499
  courierDeliveryFee: number;     // Flat ₹60
  adminEmail?: string;            // Display email for admin portal
  // Dual Legal Billing & Statutory Fields (Non-GST Retail Cash Memo <-> Full GST Tax Invoice)
  billingMode?: BillingMode;      // 'NON_GST' (default) or 'GST' (CGST+SGST intra-state / IGST inter-state)
  legalBusinessName?: string;     // Registered firm/trade name on bills
  proprietorName?: string;        // Sole Proprietor name (optional)
  storeAddress?: string;          // Full Bhavnagar dispatch address printed on bills
  storeStateCode?: string;        // Supplier GST state code ('24' = Gujarat)
  gstin?: string;                 // 15-character GSTIN (required when billingMode === 'GST')
  defaultGstRate?: number;        // Default GST % when product doesn't specify one (default 12)
  udyamNumber?: string;           // Optional MSME Udyam Reg. No. (e.g. 'UDYAM-GJ-04-0000000')
  fssaiNumber?: string;           // Optional 14-digit FSSAI Lic. No.
  ayushLicenseNote?: string;      // Optional license/declaration line
  restrictCourierToGujarat?: boolean; // Optional guard to restrict courier to Gujarat PINs (36xxxx-39xxxx)
}
