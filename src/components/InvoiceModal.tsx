'use client';

import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Receipt,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Phone,
  Calendar,
  Clock,
} from 'lucide-react';
import { Order, MerchantSettings } from '@/types';
import { PHARMACY_BILLING_INFO, formatInvoiceNumber, numberToWordsINR } from '@/lib/billing';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  settings?: MerchantSettings;
  initialFormat?: 'A4' | 'THERMAL';
}

export function InvoiceModal({
  order,
  isOpen,
  onClose,
  settings,
  initialFormat = 'A4',
}: InvoiceModalProps) {
  const [formatOverride, setFormatOverride] = useState<{
    orderId: string;
    format: 'A4' | 'THERMAL';
  } | null>(null);
  const format =
    order && formatOverride?.orderId === order.id ? formatOverride.format : initialFormat;
  const setFormat = (next: 'A4' | 'THERMAL') => {
    if (order) setFormatOverride({ orderId: order.id, format: next });
  };

  if (!isOpen || !order) return null;

  const invoiceNo = formatInvoiceNumber(order.id, order.createdAt);
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const invoiceTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const totalInWords = numberToWordsINR(order.totalAmount);

  // Calculate gross MRP and savings if applicable
  const totalMrp = order.items.reduce((sum, item) => {
    const itemMrp = item.mrp && item.mrp > item.unitPrice ? item.mrp : Math.round(item.unitPrice * 1.15);
    return sum + itemMrp * item.quantity;
  }, 0);
  const totalSavings = Math.max(0, totalMrp - order.subtotal);

  // Trigger Native Clean Print
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Bill to Customer
  const handleShareWhatsApp = () => {
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `🌿 *AyurSwift - Official Cash Memo / Bill*\n\n` +
      `Bill No: ${invoiceNo}\n` +
      `Order Ref: ${order.id}\n` +
      (order.deliverySlot ? `Delivery Slot: ${order.deliverySlot}\n` : '') +
      `Date: ${invoiceDate} at ${invoiceTime}\n` +
      `Customer: ${order.customerName}\n\n` +
      `*Items Ordered:*\n` +
      order.items.map((i) => `• ${i.quantity}x ${i.name} (${i.packSize}) - ₹${i.totalPrice}`).join('\n') +
      `\n\nSubtotal: ₹${order.subtotal}` +
      `\nDelivery: ₹${order.deliveryFee}` +
      `\n*Total Amount: ₹${order.totalAmount}*` +
      `\nPayment Mode: ${order.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '📱 Prepaid UPI'}` +
      `\n\nBhavnagar Store Helpline: +91 96247 66242\nThank you for choosing AyurSwift!`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-90 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
        
        {/* NON-PRINTABLE TOP CONTROLS BAR */}
        <div className="no-print bg-[#1d5a3e] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#143d29]">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-serif font-bold text-sm tracking-wide">
                AyurSwift Billing System
              </h3>
              <p className="text-[11px] text-emerald-100">
                Bill #{invoiceNo} • Order {order.id}
              </p>
            </div>
          </div>

          {/* Format Selector & Actions */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Format Switcher */}
            <div className="bg-[#143d29] p-0.5 rounded-lg flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFormat('A4')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                  format === 'A4'
                    ? 'bg-white text-[#143d29] shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Standard A4 Bill</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('THERMAL')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                  format === 'THERMAL'
                    ? 'bg-white text-[#143d29] shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>3-Inch Thermal POS Slip</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Print document or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill (Ctrl+P)</span>
            </button>

            {/* WhatsApp Customer */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              title="Share Bill via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Bill</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-[#143d29] rounded-lg transition-colors cursor-pointer"
              aria-label="Close invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE BILL WRAPPER */}
        <div id="printable-bill-document" className="p-4 sm:p-8 bg-white overflow-y-auto max-h-[82vh] print:max-h-none print:p-0 print:overflow-visible">
          
          {/* ======================================================== */}
          {/* FORMAT 1: STANDARD A4 CUSTOMER CASH MEMO / BILL          */}
          {/* ======================================================== */}
          {format === 'A4' && (
            <div className="max-w-[760px] mx-auto bg-white border border-gray-300 print:border-black p-6 sm:p-8 rounded-xl shadow-xs print:shadow-none text-gray-900 font-sans text-xs space-y-5">
              
              {/* 1. STORE HEADER WITH OFFICIAL BRAND LOGO */}
              <div className="border-b-2 border-[#1d5a3e] pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <img
                      src="/ayurswift-logo.png"
                      alt="AyurSwift - Tradition Meets Speed"
                      className="h-11 sm:h-12 w-auto object-contain"
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-[#143d29] mt-1">
                    Authentic Ayurveda &amp; Everyday Health Quick Delivery
                  </p>
                  <p className="text-[11px] text-gray-600">
                    Bhavnagar, Gujarat • Scheduled Daily Delivery Slots (9–11 AM &amp; 6–8 PM)
                  </p>
                </div>

                <div className="text-right text-[11px] space-y-1 bg-[#f8f8f3] p-2.5 rounded-lg border border-[#d6ddce] sm:min-w-[210px]">
                  <div className="font-bold text-xs text-[#143d29]">Store Contact Desk</div>
                  <div>
                    <span className="text-gray-500">Helpline / WhatsApp:</span>{' '}
                    <strong className="text-gray-800">{PHARMACY_BILLING_INFO.phone}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{' '}
                    <strong className="text-gray-800">{PHARMACY_BILLING_INFO.email}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Dispatch Hub:</span>{' '}
                    <strong className="text-gray-800">{PHARMACY_BILLING_INFO.location}</strong>
                  </div>
                </div>
              </div>

              {/* 2. BILL TITLE BANNER */}
              <div className="bg-[#1d5a3e] text-white py-1.5 px-4 rounded text-center uppercase tracking-widest font-bold text-xs print:bg-black">
                CUSTOMER RETAIL BILL / CASH MEMO
              </div>

              {/* 3. METADATA: BILL DETAILS & CUSTOMER DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-300 print:border-black rounded-lg p-3.5 bg-gray-50/50 print:bg-white text-[11px]">
                {/* Left: Customer Info */}
                <div className="space-y-1 pr-0 sm:pr-3 border-b sm:border-b-0 sm:border-r border-gray-200 pb-3 sm:pb-0">
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    Billed To &amp; Shipped To:
                  </div>
                  <div className="text-sm font-bold text-[#143d29]">{order.customerName}</div>
                  <div>
                    <span className="text-gray-600">Contact:</span>{' '}
                    <strong className="text-gray-900">{order.customerPhone}</strong>
                  </div>
                  <div>
                    <span className="text-gray-600">Delivery Address:</span>{' '}
                    <span className="text-gray-900 font-medium">
                      {order.deliveryAddress}
                      {order.landmark ? `, Near ${order.landmark}` : ''}, {order.city} - {order.pincode}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dispatch Mode:</span>{' '}
                    <span className="font-semibold text-gray-800">
                      {order.deliveryType === 'RAPIDO_CITY'
                        ? '🕒 Bhavnagar Scheduled Slot Delivery'
                        : '📦 Standard Surface Courier (All India)'}
                    </span>
                  </div>
                  {order.deliverySlot && (
                    <div>
                      <span className="text-gray-600">Delivery Slot:</span>{' '}
                      <strong className="text-[#143d29]">{order.deliverySlot}</strong>
                    </div>
                  )}
                </div>

                {/* Right: Bill Info */}
                <div className="space-y-1 pl-0 sm:pl-2">
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    Bill Information:
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bill Number:</span>
                    <strong className="text-gray-900 font-mono">{invoiceNo}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Reference:</span>
                    <strong className="text-[#1d5a3e] font-mono">{order.id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date &amp; Time:</span>
                    <span className="text-gray-800">{invoiceDate}, {invoiceTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Mode:</span>
                    <strong className={order.paymentMethod === 'COD' ? 'text-amber-800' : 'text-emerald-800'}>
                      {order.paymentMethod === 'COD' ? '💵 CASH ON DELIVERY' : '📱 PREPAID UPI'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="font-bold text-gray-800">
                      {order.paymentMethod === 'COD' ? '⚠️ PENDING COLLECTION' : '✅ VERIFIED & RECEIVED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. ITEMISED PRODUCT TABLE (WITHOUT HSN) */}
              <div className="border border-gray-300 print:border-black rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-gray-100 print:bg-gray-200 border-b border-gray-300 print:border-black font-bold text-gray-800">
                      <th className="py-2 px-2.5 w-8 text-center border-r border-gray-300">#</th>
                      <th className="py-2 px-2.5 border-r border-gray-300">Item Description</th>
                      <th className="py-2 px-2 border-r border-gray-300 text-center">Brand</th>
                      <th className="py-2 px-2 border-r border-gray-300 text-center">Pack Size</th>
                      <th className="py-2 px-2 border-r border-gray-300 text-center">Qty</th>
                      <th className="py-2 px-2.5 border-r border-gray-300 text-right">Unit Rate (₹)</th>
                      <th className="py-2 px-2.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 print:border-gray-300 hover:bg-gray-50/50">
                        <td className="py-2 px-2.5 text-center border-r border-gray-300 text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 border-r border-gray-300 font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="py-2 px-2 border-r border-gray-300 text-center text-gray-600">
                          {item.brand || 'Ayurvedic'}
                        </td>
                        <td className="py-2 px-2 border-r border-gray-300 text-center text-gray-600">
                          {item.packSize}
                        </td>
                        <td className="py-2 px-2 border-r border-gray-300 text-center font-bold text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-2.5 border-r border-gray-300 text-right font-mono text-gray-800">
                          ₹{item.unitPrice}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-gray-900">
                          ₹{item.totalPrice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 5. TOTALS & SUMMARY SECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {/* Left: Amount in Words & Reconciliation Note */}
                <div className="space-y-3">
                  <div className="bg-[#f8f8f3] border border-[#d6ddce] rounded-lg p-3 text-[11px]">
                    <div className="text-[10px] uppercase font-bold text-gray-500">Amount in Words:</div>
                    <div className="font-bold text-[#143d29] italic mt-0.5">{totalInWords}</div>
                  </div>

                  {order.paymentMethod === 'COD' ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900">
                      <strong>⚠️ Cash on Delivery Notice:</strong> Please collect exact cash of{' '}
                      <span className="font-bold text-base text-amber-900">₹{order.totalAmount}</span>{' '}
                      from the customer at the time of delivery.
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <strong>Prepaid UPI Order:</strong> Paid in full to{' '}
                        <code>{PHARMACY_BILLING_INFO.upiId}</code>. No cash to collect from customer.
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Net Calculation */}
                <div className="border border-gray-300 print:border-black rounded-lg p-3 space-y-1.5 text-xs bg-gray-50/50 print:bg-white">
                  {totalSavings > 0 && (
                    <>
                      <div className="flex justify-between text-gray-500 text-[11px]">
                        <span>Total MRP Value:</span>
                        <span className="font-mono line-through">₹{totalMrp}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-medium text-[11px]">
                        <span>AyurSwift Savings:</span>
                        <span className="font-mono">-₹{totalSavings}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-gray-700 font-medium">
                    <span>Items Subtotal:</span>
                    <span className="font-mono">₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Express Delivery &amp; Packaging:</span>
                    <span className="font-mono">
                      {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-300 print:border-black pt-2 flex justify-between font-bold text-sm text-[#143d29]">
                    <span>Net Grand Total:</span>
                    <span className="text-base font-mono">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* 6. STATUTORY DECLARATIONS & DIGITAL SIGNATURE */}
              <div className="border-t border-gray-300 print:border-black pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-[10px] text-gray-600">
                <div className="space-y-1 leading-relaxed">
                  <div className="font-bold uppercase tracking-wider text-gray-800">
                    Terms &amp; Disclaimers:
                  </div>
                  <div>
                    1. <strong>Authenticity:</strong> All items are 100% genuine Ayurvedic formulations sourced directly from authorized manufacturers.
                  </div>
                  <div>
                    2. <strong>Hygiene Notice:</strong> For hygiene and health safety, sealed packages cannot be returned once delivered and opened.
                  </div>
                  <div>
                    3. <strong>Storage:</strong> Keep all products stored in a cool, dry place away from direct sunlight.
                  </div>
                </div>

                <div className="text-right space-y-1.5">
                  <div className="inline-block border-2 border-emerald-800/40 text-emerald-800 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    🌿 AYURSWIFT • VERIFIED BILL
                  </div>
                  <div className="text-gray-800 font-semibold">For AyurSwift Quick Store</div>
                  <div className="text-gray-500 text-[9px]">
                    Computer Generated Retail Memo • No Physical Signature Required
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* FORMAT 2: 3-INCH (80mm) THERMAL POS SLIP                  */}
          {/* ======================================================== */}
          {format === 'THERMAL' && (
            <div className="max-w-[320px] mx-auto bg-white border border-gray-400 print:border-black p-4 rounded-lg shadow-xs print:shadow-none font-mono text-[11px] text-gray-900 space-y-2.5">
              
              {/* Thermal Header */}
              <div className="text-center border-b border-dashed border-gray-400 pb-2">
                <img
                  src="/ayurswift-logo.png"
                  alt="AyurSwift"
                  className="h-8 mx-auto object-contain mb-1"
                />
                <div className="font-bold text-xs tracking-wide">AYURSWIFT QUICK STORE</div>
                <div className="text-[10px] text-gray-600">Tradition Meets Speed</div>
                <div className="text-[9px] text-gray-500">Bhavnagar, Gujarat</div>
                <div className="text-[9px] text-gray-500">Helpline: +91 96247 66242 • {PHARMACY_BILLING_INFO.email}</div>
                
                <div className="mt-2 py-0.5 bg-gray-100 border border-gray-300 font-bold text-xs">
                  CASH MEMO #{invoiceNo}
                </div>
              </div>

              {/* Order & Customer Metadata */}
              <div className="space-y-0.5 text-[10px] leading-tight">
                <div><strong>Order ID:</strong> {order.id}</div>
                <div><strong>Date:</strong> {invoiceDate} {invoiceTime}</div>
                {order.deliverySlot && (
                  <div><strong>Slot:</strong> {order.deliverySlot}</div>
                )}
                <div><strong>Customer:</strong> {order.customerName}</div>
                <div><strong>Phone:</strong> {order.customerPhone}</div>
                <div><strong>Address:</strong> {order.deliveryAddress}{order.landmark ? `, Near ${order.landmark}` : ''}, {order.city} - {order.pincode}</div>
                <div><strong>Delivery:</strong> {order.deliveryType === 'RAPIDO_CITY' ? '⚡ Rapido City Bike' : '📦 Courier'}</div>
              </div>

              {/* Items Section */}
              <div className="border-t border-b border-dashed border-gray-400 py-2 space-y-1">
                <div className="font-bold text-[10px] uppercase flex justify-between">
                  <span>ITEM DESCRIPTION</span>
                  <span>AMT (₹)</span>
                </div>
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-[10.5px]">
                    <span className="truncate max-w-[190px]">
                      {i.quantity}x {i.name} ({i.packSize})
                    </span>
                    <span className="font-bold shrink-0">₹{i.totalPrice}</span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="space-y-0.5 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-400 pt-1 text-gray-900">
                  <span>TOTAL TO PAY:</span>
                  <span>₹{order.totalAmount}</span>
                </div>
              </div>

              {/* Payment Mode Highlight */}
              <div className={`p-1.5 rounded text-center text-xs font-bold border ${
                order.paymentMethod === 'COD'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                {order.paymentMethod === 'COD'
                  ? `💵 COLLECT CASH: ₹${order.totalAmount}`
                  : `📱 PREPAID UPI (PAID)`}
              </div>

              {/* Thermal Footer */}
              <div className="border-t border-dashed border-gray-400 pt-2 text-center text-[9px] text-gray-500 leading-tight">
                <p>Thank you for shopping at AyurSwift!</p>
                <p>WhatsApp: +91 96247 66242 | {PHARMACY_BILLING_INFO.email}</p>
                <p className="mt-1 font-bold text-gray-700">*** COMPUTER GENERATED CASH MEMO ***</p>
              </div>
            </div>
          )}
        </div>

        {/* NON-PRINTABLE BOTTOM BAR */}
        <div className="no-print bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>AyurSwift • Tradition Meets Speed • Genuine Ayurvedic Care</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
