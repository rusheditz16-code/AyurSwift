import { MerchantSettings, Order, OrderItemSummary } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/initialData';

export interface IndianStateInfo {
  state: string;
  stateCode: string; // Official 2-digit GST State Code (e.g. '24' for Gujarat)
  isGujarat: boolean;
}

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

export function isValidIndianGstin(gstin?: string | null): boolean {
  if (!gstin) return false;
  return GSTIN_REGEX.test(gstin.trim());
}

export function isGujaratPincode(pincode?: string | null): boolean {
  if (!pincode) return false;
  const clean = pincode.replace(/\D/g, '');
  if (clean.length !== 6) return false;
  const p2 = Number(clean.slice(0, 2));
  const p3 = Number(clean.slice(0, 3));
  // Note: 396210-396220 is Daman & Diu (UT 26), rest of 36xxxx-39xxxx is Gujarat (24)
  if (p3 === 396 && clean.startsWith('3962')) return false;
  return p2 >= 36 && p2 <= 39;
}

/**
 * Resolves official Indian State Name & 2-digit GST State Code from any 6-digit PIN code.
 * Used for statutory "Place of Supply" and automatic CGST+SGST (Intra-State) vs IGST (Inter-State) split.
 */
export function resolveIndianStateFromPincode(pincode?: string | null): IndianStateInfo {
  const clean = (pincode || '').replace(/\D/g, '');
  if (clean.length !== 6) {
    return { state: 'Gujarat', stateCode: '24', isGujarat: true };
  }

  const p2 = Number(clean.slice(0, 2));
  const p3 = Number(clean.slice(0, 3));

  // Sub-circle exceptions first
  if (p3 === 403) return { state: 'Goa', stateCode: '30', isGujarat: false };
  if (clean.startsWith('3962')) {
    return { state: 'Dadra & Nagar Haveli and Daman & Diu', stateCode: '26', isGujarat: false };
  }
  if (clean.startsWith('39619') || clean.startsWith('39623') || clean.startsWith('39624')) {
    return { state: 'Dadra & Nagar Haveli and Daman & Diu', stateCode: '26', isGujarat: false };
  }
  if (p3 === 160) return { state: 'Chandigarh', stateCode: '04', isGujarat: false };
  if (p3 === 605) return { state: 'Puducherry', stateCode: '34', isGujarat: false };
  if (p3 === 682) return { state: 'Lakshadweep', stateCode: '31', isGujarat: false };
  if (p3 === 744) return { state: 'Andaman & Nicobar Islands', stateCode: '35', isGujarat: false };
  if (p3 === 737) return { state: 'Sikkim', stateCode: '11', isGujarat: false };
  if (p3 === 194) return { state: 'Ladakh', stateCode: '38', isGujarat: false };
  if ((p3 >= 246 && p3 <= 249) || p3 === 244 || p3 === 262 || p3 === 263) {
    return { state: 'Uttarakhand', stateCode: '05', isGujarat: false };
  }
  if ((p3 >= 814 && p3 <= 835) || p3 === 813) {
    return { state: 'Jharkhand', stateCode: '20', isGujarat: false };
  }
  if (p3 === 790 || p3 === 791 || p3 === 792) {
    return { state: 'Arunachal Pradesh', stateCode: '12', isGujarat: false };
  }
  if (p3 === 793 || p3 === 794) {
    return { state: 'Meghalaya', stateCode: '17', isGujarat: false };
  }
  if (p3 === 795) return { state: 'Manipur', stateCode: '14', isGujarat: false };
  if (p3 === 796) return { state: 'Mizoram', stateCode: '15', isGujarat: false };
  if (p3 === 797 || p3 === 798) return { state: 'Nagaland', stateCode: '13', isGujarat: false };
  if (p3 === 799) return { state: 'Tripura', stateCode: '16', isGujarat: false };

  // Standard 2-digit postal circles
  if (p2 === 11) return { state: 'Delhi', stateCode: '07', isGujarat: false };
  if (p2 === 12 || p2 === 13) return { state: 'Haryana', stateCode: '06', isGujarat: false };
  if (p2 >= 14 && p2 <= 16) return { state: 'Punjab', stateCode: '03', isGujarat: false };
  if (p2 === 17) return { state: 'Himachal Pradesh', stateCode: '02', isGujarat: false };
  if (p2 === 18 || p2 === 19) return { state: 'Jammu & Kashmir', stateCode: '01', isGujarat: false };
  if (p2 >= 20 && p2 <= 28) return { state: 'Uttar Pradesh', stateCode: '09', isGujarat: false };
  if (p2 >= 30 && p2 <= 34) return { state: 'Rajasthan', stateCode: '08', isGujarat: false };
  if (p2 >= 36 && p2 <= 39) return { state: 'Gujarat', stateCode: '24', isGujarat: true };
  if (p2 >= 40 && p2 <= 44) return { state: 'Maharashtra', stateCode: '27', isGujarat: false };
  if (p2 >= 45 && p2 <= 48) return { state: 'Madhya Pradesh', stateCode: '23', isGujarat: false };
  if (p2 === 49) return { state: 'Chhattisgarh', stateCode: '22', isGujarat: false };
  if (p2 === 50) return { state: 'Telangana', stateCode: '36', isGujarat: false };
  if (p2 >= 51 && p2 <= 53) return { state: 'Andhra Pradesh', stateCode: '37', isGujarat: false };
  if (p2 >= 56 && p2 <= 59) return { state: 'Karnataka', stateCode: '29', isGujarat: false };
  if (p2 >= 60 && p2 <= 64) return { state: 'Tamil Nadu', stateCode: '33', isGujarat: false };
  if (p2 >= 67 && p2 <= 69) return { state: 'Kerala', stateCode: '32', isGujarat: false };
  if (p2 >= 70 && p2 <= 74) return { state: 'West Bengal', stateCode: '19', isGujarat: false };
  if (p2 >= 75 && p2 <= 77) return { state: 'Odisha', stateCode: '21', isGujarat: false };
  if (p2 === 78) return { state: 'Assam', stateCode: '18', isGujarat: false };
  if (p2 >= 80 && p2 <= 85) return { state: 'Bihar', stateCode: '10', isGujarat: false };

  return { state: 'India', stateCode: '97', isGujarat: false };
}

/**
 * Standard Indian Rupee Number to Words Converter (supports Rupees + Paise)
 */
export function numberToWordsINR(num: number): string {
  if (!num || num <= 0) return 'Zero Rupees Only';

  const a = [
    '',
    'One ',
    'Two ',
    'Three ',
    'Four ',
    'Five ',
    'Six ',
    'Seven ',
    'Eight ',
    'Nine ',
    'Ten ',
    'Eleven ',
    'Twelve ',
    'Thirteen ',
    'Fourteen ',
    'Fifteen ',
    'Sixteen ',
    'Seventeen ',
    'Eighteen ',
    'Nineteen ',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str;
  };

  const fixed = Math.round(num * 100);
  const rupees = Math.floor(fixed / 100);
  const paise = fixed % 100;

  let words = '';
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  if (crore > 0) words += inWords(crore) + 'Crore ';
  if (lakh > 0) words += inWords(lakh) + 'Lakh ';
  if (thousand > 0) words += inWords(thousand) + 'Thousand ';
  if (hundred > 0) words += inWords(hundred);

  const rupeePart = words.trim() ? `${words.trim()} Rupees` : 'Zero Rupees';
  if (paise > 0) {
    return `${rupeePart} and ${inWords(paise).trim()} Paise Only`;
  }
  return `${rupeePart} Only`;
}

export const PHARMACY_BILLING_INFO = {
  storeName: 'AyurSwift',
  tagline: 'Tradition Meets Speed',
  subTagline: 'Genuine Ayurveda & Everyday Health Quick Commerce',
  location: 'Bhavnagar, Gujarat',
  phone: '+91 96247 66242',
  whatsapp: '919624766242',
  email: 'ayurswift.care@gmail.com',
  upiId: '9624766242@fam',
  logoPath: '/ayurswift-logo.png',
};

/**
 * Returns the order's stored sequential legal invoice number (e.g. AS/26-27/0001),
 * or computes a deterministic Indian Financial Year fallback for legacy local orders.
 */
export function formatInvoiceNumber(
  orderId: string,
  createdAt?: string,
  storedInvoiceNumber?: string
): string {
  if (storedInvoiceNumber && storedInvoiceNumber.trim()) {
    return storedInvoiceNumber.trim();
  }
  const cleanId = orderId.replace(/^#/, '').slice(0, 8);
  const date = createdAt ? new Date(createdAt) : new Date();
  const yr = date.getFullYear();
  const mo = date.getMonth() + 1;
  const fyStart = (mo >= 4 ? yr : yr - 1) % 100;
  const fyEnd = (fyStart + 1) % 100;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `AS/${pad(fyStart)}-${pad(fyEnd)}/${cleanId}`;
}

export interface LegalPaymentDisplay {
  isPaid: boolean;
  statusBadge: string;
  detailLine: string;
}

/**
 * Legally accurate payment status display:
 * NEVER marks a UPI order as PAID unless paymentStatus is VERIFIED / PAID.
 */
export function getLegalPaymentStatusDisplay(order: Order): LegalPaymentDisplay {
  const isVerified = order.paymentStatus === 'VERIFIED' || order.paymentStatus === 'PAID';

  if (order.paymentMethod === 'COD') {
    if (isVerified || order.orderStatus === 'DELIVERED') {
      return {
        isPaid: true,
        statusBadge: 'PAID (CASH RECEIVED)',
        detailLine: `Cash of ₹${order.totalAmount} collected`,
      };
    }
    return {
      isPaid: false,
      statusBadge: 'UNPAID (COLLECT COD)',
      detailLine: `Collect ₹${order.totalAmount} cash at delivery`,
    };
  }

  // UPI
  if (isVerified) {
    return {
      isPaid: true,
      statusBadge: 'PAID & VERIFIED (UPI)',
      detailLine: order.utrNumber ? `Verified UPI Ref: ${order.utrNumber}` : 'Verified UPI Credit',
    };
  }

  return {
    isPaid: false,
    statusBadge: 'PAYMENT PENDING',
    detailLine: order.utrNumber
      ? `UTR Submitted (${order.utrNumber}) — Awaiting Verification`
      : 'Awaiting UPI Payment Confirmation',
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function inferDefaultHsnAndGst(
  item: Pick<OrderItemSummary, 'name' | 'hsnCode' | 'gstRate'>,
  defaultGstRate = 12
): { hsnCode: string; gstRate: number } {
  const explicitHsn = (item.hsnCode || '').trim();
  const explicitRate =
    typeof item.gstRate === 'number' && Number.isFinite(item.gstRate) && item.gstRate >= 0
      ? item.gstRate
      : undefined;

  const lower = item.name.toLowerCase();
  let inferredHsn = '30049011'; // Ayurvedic medicaments default
  let inferredRate = defaultGstRate;

  if (lower.includes('toothbrush')) {
    inferredHsn = '96032100';
    inferredRate = 18;
  } else if (lower.includes('toothpaste') || lower.includes('tooth powder') || lower.includes('dant')) {
    inferredHsn = '33061020';
    inferredRate = 18;
  } else if (lower.includes('soap') || lower.includes('face wash') || lower.includes('wash')) {
    inferredHsn = '34011190';
    inferredRate = 18;
  } else if (lower.includes('aloe') || lower.includes('gel') || lower.includes('cream') || lower.includes('lotion')) {
    inferredHsn = '33049990';
    inferredRate = 18;
  } else if (lower.includes('honey')) {
    inferredHsn = '04090000';
    inferredRate = 5;
  }

  return {
    hsnCode: explicitHsn || inferredHsn,
    gstRate: explicitRate !== undefined ? explicitRate : inferredRate,
  };
}

export interface ComputedInvoiceLine {
  item: OrderItemSummary;
  hsnCode: string;
  gstRate: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  lineTotal: number;
}

export interface HsnSummaryRow {
  hsnCode: string;
  gstRate: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export interface OrderBillingBreakdown {
  isGstInvoice: boolean;
  documentTitle: string;
  sellerLegalName: string;
  proprietorName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerState: string;
  sellerStateCode: string;
  udyamNumber: string;
  fssaiNumber: string;
  ayushLicenseNote: string;
  placeOfSupply: IndianStateInfo;
  isIntraState: boolean; // true = Gujarat CGST+SGST, false = Outside Gujarat IGST
  lines: ComputedInvoiceLine[];
  deliveryTaxable: number;
  deliveryTax: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTaxAmount: number;
  grandTotal: number;
  hsnSummary: HsnSummaryRow[];
}

/**
 * Dual Legal Billing Calculator:
 * - Mode 1 (NON_GST or no valid GSTIN): Clean Retail Cash Memo / Bill of Supply (0 tax split)
 * - Mode 2 (GST + valid 15-char GSTIN): Full CGST+SGST (Intra-State Gujarat) or IGST (Inter-State Outside Gujarat)
 *   back-calculated from MRP-inclusive selling prices so customer grandTotal never changes!
 */
export function computeOrderBillingBreakdown(
  order: Order,
  rawSettings?: MerchantSettings
): OrderBillingBreakdown {
  const s = { ...DEFAULT_SETTINGS, ...(rawSettings || {}) };
  const cleanGstin = (s.gstin || '').trim().toUpperCase();
  const isGstInvoice = s.billingMode === 'GST' && isValidIndianGstin(cleanGstin);

  const sellerStateCode = isGstInvoice ? cleanGstin.slice(0, 2) : s.storeStateCode || '24';
  const sellerState = sellerStateCode === '24' ? 'Gujarat' : 'India';
  const placeOfSupply = resolveIndianStateFromPincode(order.pincode);
  const isIntraState = placeOfSupply.stateCode === sellerStateCode;

  const defaultRate =
    typeof s.defaultGstRate === 'number' && Number.isFinite(s.defaultGstRate)
      ? s.defaultGstRate
      : 12;

  const lines: ComputedInvoiceLine[] = order.items.map((item) => {
    const { hsnCode, gstRate } = inferDefaultHsnAndGst(item, defaultRate);
    const lineTotal = round2(item.totalPrice);

    if (!isGstInvoice || gstRate <= 0) {
      return {
        item,
        hsnCode,
        gstRate: isGstInvoice ? gstRate : 0,
        taxableValue: lineTotal,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 0,
        igstAmount: 0,
        lineTotal,
      };
    }

    const taxableValue = round2(lineTotal / (1 + gstRate / 100));
    const totalLineTax = round2(lineTotal - taxableValue);

    if (isIntraState) {
      const halfRate = round2(gstRate / 2);
      const cgstAmount = round2(totalLineTax / 2);
      const sgstAmount = round2(totalLineTax - cgstAmount);
      return {
        item,
        hsnCode,
        gstRate,
        taxableValue,
        cgstRate: halfRate,
        cgstAmount,
        sgstRate: halfRate,
        sgstAmount,
        igstRate: 0,
        igstAmount: 0,
        lineTotal,
      };
    }

    return {
      item,
      hsnCode,
      gstRate,
      taxableValue,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: gstRate,
      igstAmount: totalLineTax,
      lineTotal,
    };
  });

  // Delivery / freight handling (composite supply follows principal item GST rate in GST mode)
  const principalRate = lines[0]?.gstRate ?? (isGstInvoice ? defaultRate : 0);
  const delFee = round2(order.deliveryFee || 0);
  let deliveryTaxable = delFee;
  let deliveryCgst = 0;
  let deliverySgst = 0;
  let deliveryIgst = 0;

  if (isGstInvoice && delFee > 0 && principalRate > 0) {
    deliveryTaxable = round2(delFee / (1 + principalRate / 100));
    const delTax = round2(delFee - deliveryTaxable);
    if (isIntraState) {
      deliveryCgst = round2(delTax / 2);
      deliverySgst = round2(delTax - deliveryCgst);
    } else {
      deliveryIgst = delTax;
    }
  }

  const hsnMap = new Map<string, HsnSummaryRow>();
  if (isGstInvoice) {
    for (const ln of lines) {
      const key = `${ln.hsnCode}:${ln.gstRate}`;
      const prev = hsnMap.get(key) || {
        hsnCode: ln.hsnCode,
        gstRate: ln.gstRate,
        taxableValue: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
      };
      prev.taxableValue = round2(prev.taxableValue + ln.taxableValue);
      prev.cgstAmount = round2(prev.cgstAmount + ln.cgstAmount);
      prev.sgstAmount = round2(prev.sgstAmount + ln.sgstAmount);
      prev.igstAmount = round2(prev.igstAmount + ln.igstAmount);
      prev.totalTax = round2(prev.cgstAmount + prev.sgstAmount + prev.igstAmount);
      hsnMap.set(key, prev);
    }

    if (delFee > 0) {
      const freightKey = `996812:${principalRate}`;
      const prev = hsnMap.get(freightKey) || {
        hsnCode: '996812',
        gstRate: principalRate,
        taxableValue: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
      };
      prev.taxableValue = round2(prev.taxableValue + deliveryTaxable);
      prev.cgstAmount = round2(prev.cgstAmount + deliveryCgst);
      prev.sgstAmount = round2(prev.sgstAmount + deliverySgst);
      prev.igstAmount = round2(prev.igstAmount + deliveryIgst);
      prev.totalTax = round2(prev.cgstAmount + prev.sgstAmount + prev.igstAmount);
      hsnMap.set(freightKey, prev);
    }
  }

  const totalTaxableValue = round2(
    lines.reduce((sSum, l) => sSum + l.taxableValue, 0) + deliveryTaxable
  );
  const totalCgst = round2(lines.reduce((sSum, l) => sSum + l.cgstAmount, 0) + deliveryCgst);
  const totalSgst = round2(lines.reduce((sSum, l) => sSum + l.sgstAmount, 0) + deliverySgst);
  const totalIgst = round2(lines.reduce((sSum, l) => sSum + l.igstAmount, 0) + deliveryIgst);
  const totalTaxAmount = round2(totalCgst + totalSgst + totalIgst);

  return {
    isGstInvoice,
    documentTitle: isGstInvoice ? 'TAX INVOICE' : 'RETAIL CASH MEMO / BILL OF SUPPLY',
    sellerLegalName: (s.legalBusinessName || s.storeName || 'AyurSwift').trim(),
    proprietorName: (s.proprietorName || '').trim(),
    sellerAddress: (
      s.storeAddress || 'Bhavnagar City, Dist. Bhavnagar, Gujarat - 364001'
    ).trim(),
    sellerGstin: isGstInvoice ? cleanGstin : '',
    sellerState,
    sellerStateCode,
    udyamNumber: (s.udyamNumber || '').trim(),
    fssaiNumber: (s.fssaiNumber || '').trim(),
    ayushLicenseNote: (s.ayushLicenseNote || '').trim(),
    placeOfSupply,
    isIntraState,
    lines,
    deliveryTaxable,
    deliveryTax: round2(deliveryCgst + deliverySgst + deliveryIgst),
    totalTaxableValue,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTaxAmount,
    grandTotal: round2(order.totalAmount),
    hsnSummary: Array.from(hsnMap.values()),
  };
}
