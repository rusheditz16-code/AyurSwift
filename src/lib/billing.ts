import { Order } from '@/types';

/**
 * Standard Indian Rupee Number to Words Converter
 * e.g., 420 -> "Four Hundred Twenty Rupees Only"
 * e.g., 1450 -> "One Thousand Four Hundred Fifty Rupees Only"
 */
export function numberToWordsINR(num: number): string {
  if (!num || num === 0) return 'Zero Rupees Only';

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

  const rounded = Math.round(num);
  let words = '';

  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const hundred = rounded % 1000;

  if (crore > 0) words += inWords(crore) + 'Crore ';
  if (lakh > 0) words += inWords(lakh) + 'Lakh ';
  if (thousand > 0) words += inWords(thousand) + 'Thousand ';
  if (hundred > 0) words += inWords(hundred);

  return `${words.trim()} Rupees Only`;
}

/**
 * AyurSwift Store & Billing Details
 * (Simplified retail billing without GST/FSSAI, no store address)
 */
export const PHARMACY_BILLING_INFO = {
  storeName: 'AyurSwift',
  tagline: 'Tradition Meets Speed',
  subTagline: 'Genuine Ayurveda & Everyday Health Quick Commerce',
  location: 'Bhavnagar, Gujarat',
  phone: '+91 96247 66242',
  whatsapp: '919624766242',
  email: 'rushirajdabhi16@gmail.com',
  upiId: '9624766242@fam',
  logoPath: '/ayurswift-logo.png',
};

/**
 * Generates formatted standard bill / cash memo number
 * e.g., BILL/2026/AS-1025
 */
export function formatInvoiceNumber(orderId: string, createdAt?: string): string {
  const cleanId = orderId.replace(/^#/, '');
  const date = createdAt ? new Date(createdAt) : new Date();
  const year = date.getFullYear();
  return `BILL/${year}/${cleanId}`;
}
