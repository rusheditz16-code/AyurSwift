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
  Clock,
} from 'lucide-react';
import { Order, MerchantSettings } from '@/types';
import {
  PHARMACY_BILLING_INFO,
  computeOrderBillingBreakdown,
  formatInvoiceNumber,
  getLegalPaymentStatusDisplay,
  numberToWordsINR,
} from '@/lib/billing';

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

  const invoiceNo = formatInvoiceNumber(order.id, order.createdAt, order.invoiceNumber);
  const billing = computeOrderBillingBreakdown(order, settings);
  const payDisplay = getLegalPaymentStatusDisplay(order);

  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const invoiceTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const totalInWords = numberToWordsINR(order.totalAmount);

  // Calculate gross MRP and savings when verified MRP > unitPrice
  const totalMrp = order.items.reduce((sum, item) => {
    const itemMrp = item.mrp && item.mrp > item.unitPrice ? item.mrp : item.unitPrice;
    return sum + itemMrp * item.quantity;
  }, 0);
  const totalSavings = Math.max(0, Number((totalMrp - order.subtotal).toFixed(2)));

  const helplineDisplay = settings?.merchantWhatsApp
    ? `+${settings.merchantWhatsApp.replace(/\D/g, '')}`
    : PHARMACY_BILLING_INFO.phone;
  const emailDisplay = settings?.adminEmail || PHARMACY_BILLING_INFO.email;
  const upiDisplay = settings?.merchantUpiId || PHARMACY_BILLING_INFO.upiId;

  // Trigger Native Clean Print
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Bill to Customer (works cleanly when customer phone is unmasked in Admin or customer's own session)
  const handleShareWhatsApp = () => {
    const rawDigits = order.customerPhone.replace(/\D/g, '');
    const waTarget =
      rawDigits.length >= 10 ? `https://wa.me/${rawDigits.length === 10 ? `91${rawDigits}` : rawDigits}` : 'https://wa.me/';

    const taxSummaryLine = billing.isGstInvoice
      ? billing.isIntraState
        ? `\nTaxable Value: ₹${billing.totalTaxableValue.toFixed(2)}\nCGST: ₹${billing.totalCgst.toFixed(2)} | SGST: ₹${billing.totalSgst.toFixed(2)}`
        : `\nTaxable Value: ₹${billing.totalTaxableValue.toFixed(2)}\nIGST (${billing.placeOfSupply.state}): ₹${billing.totalIgst.toFixed(2)}`
      : '\n(Inclusive of applicable taxes)';

    const message = encodeURIComponent(
      `🌿 *${billing.sellerLegalName} — ${billing.documentTitle}*\n` +
        (billing.isGstInvoice ? `GSTIN: ${billing.sellerGstin}\n` : '') +
        `Bill No: ${invoiceNo}\n` +
        `Order Ref: ${order.id}\n` +
        `Place of Supply: ${billing.placeOfSupply.state} (${billing.placeOfSupply.stateCode})\n` +
        (order.deliverySlot ? `Delivery Slot: ${order.deliverySlot}\n` : '') +
        `Date: ${invoiceDate} at ${invoiceTime}\n` +
        `Customer: ${order.customerName}\n\n` +
        `*Items:*\n` +
        order.items
          .map((i) => `• ${i.quantity}x ${i.name} (${i.packSize}) — ₹${i.totalPrice}`)
          .join('\n') +
        `\n\nItems Subtotal: ₹${order.subtotal}` +
        `\nDelivery: ${order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}` +
        taxSummaryLine +
        `\n*Grand Total: ₹${order.totalAmount}*` +
        `\nPayment Status: ${payDisplay.statusBadge}` +
        `\n\nStore Helpline: ${helplineDisplay}\nThank you for choosing AyurSwift!`
    );
    window.open(`${waTarget}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-90 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
        {/* NON-PRINTABLE TOP CONTROLS BAR */}
        <div className="no-print bg-[#1B2A21] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#121D16]">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-sm tracking-wide">
                  {billing.isGstInvoice ? 'GST Tax Invoice' : 'Retail Cash Memo'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-amber-200">
                  {billing.isGstInvoice
                    ? billing.isIntraState
                      ? 'Gujarat CGST+SGST'
                      : `Inter-State IGST (${billing.placeOfSupply.stateCode})`
                    : 'Non-GST Retail Mode'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                {invoiceNo} • Order {order.id}
              </p>
            </div>
          </div>

          {/* Format Selector & Actions */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Format Switcher */}
            <div className="bg-black/30 p-0.5 rounded-lg flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFormat('A4')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                  format === 'A4'
                    ? 'bg-white text-[#1B2A21] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Standard A4</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('THERMAL')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                  format === 'THERMAL'
                    ? 'bg-white text-[#1B2A21] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>3-Inch Thermal</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-[#0C831F] hover:bg-[#096B19] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Print document or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
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
              className="p-1.5 text-stone-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Close invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE BILL WRAPPER */}
        <div
          id="printable-bill-document"
          className="p-4 sm:p-7 bg-white overflow-y-auto max-h-[82vh] print:max-h-none print:p-0 print:overflow-visible"
        >
          {/* ======================================================== */}
          {/* FORMAT 1: STANDARD A4 DUAL LEGAL BILL (NON-GST / GST)    */}
          {/* ======================================================== */}
          {format === 'A4' && (
            <div className="max-w-[780px] mx-auto bg-white border border-gray-300 print:border-black p-5 sm:p-7 rounded-xl shadow-xs print:shadow-none text-gray-900 font-sans text-xs space-y-4">
              {/* 1. SELLER HEADER */}
              <div className="border-b-2 border-[#1B2A21] pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <img
                      src="/ayurswift-logo.png"
                      alt="AyurSwift"
                      className="h-10 sm:h-11 w-auto object-contain"
                    />
                    <div>
                      <div className="text-sm sm:text-base font-extrabold text-[#1B2A21] leading-tight">
                        {billing.sellerLegalName}
                      </div>
                      {billing.proprietorName && (
                        <div className="text-[11px] font-semibold text-gray-700">
                          Proprietor: {billing.proprietorName}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-700 font-medium pt-0.5">
                    {billing.sellerAddress}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-gray-600 pt-0.5">
                    <span>
                      Origin State: <strong>{billing.sellerState} ({billing.sellerStateCode})</strong>
                    </span>
                    {billing.isGstInvoice && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-950 font-mono font-bold">
                        GSTIN: {billing.sellerGstin}
                      </span>
                    )}
                    {billing.udyamNumber && (
                      <span className="font-mono">
                        Udyam: <strong>{billing.udyamNumber}</strong>
                      </span>
                    )}
                    {billing.fssaiNumber && (
                      <span className="font-mono">
                        FSSAI Lic: <strong>{billing.fssaiNumber}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] space-y-1 bg-[#F8F6F1] p-2.5 rounded-lg border border-stone-200 sm:min-w-[215px]">
                  <div className="font-bold text-xs text-[#1B2A21]">Customer Support &amp; Dispatch</div>
                  <div>
                    <span className="text-gray-500">Helpline / WhatsApp:</span>{' '}
                    <strong className="text-gray-900">{helplineDisplay}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{' '}
                    <strong className="text-gray-900">{emailDisplay}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">UPI VPA:</span>{' '}
                    <strong className="text-gray-900 font-mono">{upiDisplay}</strong>
                  </div>
                </div>
              </div>

              {/* 2. STATUTORY DOCUMENT BANNER */}
              <div className="bg-[#1B2A21] text-white py-1.5 px-4 rounded text-center uppercase tracking-widest font-bold text-xs print:bg-black">
                {billing.isGstInvoice
                  ? 'TAX INVOICE (ISSUED UNDER SECTION 31 OF CGST / IGST ACT)'
                  : 'RETAIL CASH MEMO / BILL OF SUPPLY'}
              </div>

              {/* 3. BUYER & BILL METADATA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-300 print:border-black rounded-lg p-3.5 bg-gray-50/50 print:bg-white text-[11px]">
                {/* Left: Customer & Place of Supply */}
                <div className="space-y-1 pr-0 sm:pr-3 border-b sm:border-b-0 sm:border-r border-gray-200 pb-3 sm:pb-0">
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    Billed To &amp; Shipped To:
                  </div>
                  <div className="text-sm font-bold text-[#1B2A21]">{order.customerName}</div>
                  <div>
                    <span className="text-gray-600">Mobile:</span>{' '}
                    <strong className="text-gray-900 font-mono">{order.customerPhone}</strong>
                  </div>
                  <div>
                    <span className="text-gray-600">Delivery Address:</span>{' '}
                    <span className="text-gray-900 font-medium">
                      {order.deliveryAddress}
                      {order.landmark ? `, Near ${order.landmark}` : ''}, {order.city} - {order.pincode}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Place of Supply:</span>{' '}
                    <strong className="text-gray-900">
                      {billing.placeOfSupply.state} (State Code: {billing.placeOfSupply.stateCode})
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-600">Dispatch Mode:</span>{' '}
                    <span className="font-semibold text-gray-800">
                      {order.deliveryType === 'RAPIDO_CITY'
                        ? 'Bhavnagar Scheduled Slot Delivery'
                        : 'Tracked Surface / Speed Courier'}
                    </span>
                  </div>
                  {order.deliverySlot && (
                    <div>
                      <span className="text-gray-600">Scheduled Slot:</span>{' '}
                      <strong className="text-[#1B2A21]">{order.deliverySlot}</strong>
                    </div>
                  )}
                </div>

                {/* Right: Invoice Metadata & Accurate Payment Status */}
                <div className="space-y-1 pl-0 sm:pl-2">
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    {billing.isGstInvoice ? 'Invoice Details:' : 'Cash Memo Details:'}
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">
                      {billing.isGstInvoice ? 'Invoice No:' : 'Bill No:'}
                    </span>
                    <strong className="text-gray-900 font-mono">{invoiceNo}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Order Ref:</span>
                    <strong className="text-[#1B2A21] font-mono">{order.id}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Date &amp; Time:</span>
                    <span className="text-gray-800">
                      {invoiceDate}, {invoiceTime}
                    </span>
                  </div>
                  {billing.isGstInvoice && (
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600">Supply Nature:</span>
                      <strong className="text-gray-900">
                        {billing.isIntraState
                          ? 'Intra-State (CGST + SGST)'
                          : 'Inter-State (IGST)'}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Payment Mode:</span>
                    <strong className="text-gray-900">
                      {order.paymentMethod === 'COD' ? 'CASH ON DELIVERY' : 'PREPAID UPI'}
                    </strong>
                  </div>
                  <div className="flex justify-between gap-2 items-center pt-0.5">
                    <span className="text-gray-600">Payment Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        payDisplay.isPaid
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {payDisplay.isPaid ? `✓ ${payDisplay.statusBadge}` : `⏳ ${payDisplay.statusBadge}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. ITEMISED PRODUCT TABLE (DUAL MODE: NON-GST vs FULL GST) */}
              <div className="border border-gray-300 print:border-black rounded-lg overflow-x-auto">
                {!billing.isGstInvoice ? (
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-gray-100 print:bg-gray-200 border-b border-gray-300 print:border-black font-bold text-gray-800">
                        <th className="py-2 px-2.5 w-8 text-center border-r border-gray-300">#</th>
                        <th className="py-2 px-2.5 border-r border-gray-300">Item Description</th>
                        <th className="py-2 px-2 border-r border-gray-300 text-center">Brand</th>
                        <th className="py-2 px-2 border-r border-gray-300 text-center">Pack</th>
                        <th className="py-2 px-2 border-r border-gray-300 text-center">Qty</th>
                        <th className="py-2 px-2.5 border-r border-gray-300 text-right">
                          Unit Rate (₹)
                        </th>
                        <th className="py-2 px-2.5 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billing.lines.map((ln, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 print:border-gray-300 hover:bg-gray-50/50"
                        >
                          <td className="py-2 px-2.5 text-center border-r border-gray-300 text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2.5 border-r border-gray-300 font-medium text-gray-900">
                            <div>{ln.item.name}</div>
                            {(ln.item.batchNo || ln.item.expiryDate) && (
                              <div className="text-[10px] text-gray-500 font-mono">
                                {ln.item.batchNo ? `Batch: ${ln.item.batchNo}` : ''}
                                {ln.item.batchNo && ln.item.expiryDate ? ' • ' : ''}
                                {ln.item.expiryDate ? `Exp: ${ln.item.expiryDate}` : ''}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 border-r border-gray-300 text-center text-gray-600">
                            {ln.item.brand || 'Ayurvedic'}
                          </td>
                          <td className="py-2 px-2 border-r border-gray-300 text-center text-gray-600">
                            {ln.item.packSize}
                          </td>
                          <td className="py-2 px-2 border-r border-gray-300 text-center font-bold text-gray-900">
                            {ln.item.quantity}
                          </td>
                          <td className="py-2 px-2.5 border-r border-gray-300 text-right font-mono text-gray-800">
                            ₹{ln.item.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-gray-900">
                            ₹{ln.lineTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse text-[10.5px]">
                    <thead>
                      <tr className="bg-gray-100 print:bg-gray-200 border-b border-gray-300 print:border-black font-bold text-gray-800">
                        <th className="py-2 px-2 w-7 text-center border-r border-gray-300">#</th>
                        <th className="py-2 px-2 border-r border-gray-300">Item Description</th>
                        <th className="py-2 px-1.5 border-r border-gray-300 text-center">HSN</th>
                        <th className="py-2 px-1.5 border-r border-gray-300 text-center">Qty</th>
                        <th className="py-2 px-2 border-r border-gray-300 text-right">
                          Taxable (₹)
                        </th>
                        {billing.isIntraState ? (
                          <>
                            <th className="py-2 px-2 border-r border-gray-300 text-right">
                              CGST
                            </th>
                            <th className="py-2 px-2 border-r border-gray-300 text-right">
                              SGST
                            </th>
                          </>
                        ) : (
                          <th className="py-2 px-2 border-r border-gray-300 text-right">
                            IGST
                          </th>
                        )}
                        <th className="py-2 px-2 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billing.lines.map((ln, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 print:border-gray-300 hover:bg-gray-50/50"
                        >
                          <td className="py-2 px-2 text-center border-r border-gray-300 text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2 border-r border-gray-300 font-medium text-gray-900">
                            <div>
                              {ln.item.name}{' '}
                              <span className="text-gray-500 font-normal">
                                ({ln.item.packSize})
                              </span>
                            </div>
                            {(ln.item.batchNo || ln.item.expiryDate) && (
                              <div className="text-[9.5px] text-gray-500 font-mono">
                                {ln.item.batchNo ? `Batch: ${ln.item.batchNo}` : ''}
                                {ln.item.batchNo && ln.item.expiryDate ? ' • ' : ''}
                                {ln.item.expiryDate ? `Exp: ${ln.item.expiryDate}` : ''}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-1.5 border-r border-gray-300 text-center font-mono text-gray-700">
                            {ln.hsnCode}
                          </td>
                          <td className="py-2 px-1.5 border-r border-gray-300 text-center font-bold text-gray-900">
                            {ln.item.quantity}
                          </td>
                          <td className="py-2 px-2 border-r border-gray-300 text-right font-mono text-gray-800">
                            {ln.taxableValue.toFixed(2)}
                          </td>
                          {billing.isIntraState ? (
                            <>
                              <td className="py-2 px-2 border-r border-gray-300 text-right font-mono text-gray-700">
                                {ln.cgstAmount.toFixed(2)}{' '}
                                <span className="text-[9px] text-gray-500">({ln.cgstRate}%)</span>
                              </td>
                              <td className="py-2 px-2 border-r border-gray-300 text-right font-mono text-gray-700">
                                {ln.sgstAmount.toFixed(2)}{' '}
                                <span className="text-[9px] text-gray-500">({ln.sgstRate}%)</span>
                              </td>
                            </>
                          ) : (
                            <td className="py-2 px-2 border-r border-gray-300 text-right font-mono text-gray-700">
                              {ln.igstAmount.toFixed(2)}{' '}
                              <span className="text-[9px] text-gray-500">({ln.igstRate}%)</span>
                            </td>
                          )}
                          <td className="py-2 px-2 text-right font-mono font-bold text-gray-900">
                            {ln.lineTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 4B. STATUTORY HSN / SAC TAX SUMMARY TABLE (GST MODE ONLY) */}
              {billing.isGstInvoice && billing.hsnSummary.length > 0 && (
                <div className="border border-gray-300 print:border-black rounded-lg overflow-hidden">
                  <div className="bg-gray-100 print:bg-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300">
                    HSN / SAC Tax Summary ({billing.isIntraState ? 'Intra-State Gujarat' : `Inter-State — ${billing.placeOfSupply.state}`})
                  </div>
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-gray-200 font-bold text-gray-700 bg-gray-50/80">
                        <th className="py-1.5 px-2.5 border-r border-gray-200">HSN / SAC</th>
                        <th className="py-1.5 px-2 border-r border-gray-200 text-center">GST Slab</th>
                        <th className="py-1.5 px-2.5 border-r border-gray-200 text-right">
                          Taxable Value (₹)
                        </th>
                        {billing.isIntraState ? (
                          <>
                            <th className="py-1.5 px-2.5 border-r border-gray-200 text-right">
                              CGST (₹)
                            </th>
                            <th className="py-1.5 px-2.5 border-r border-gray-200 text-right">
                              SGST (₹)
                            </th>
                          </>
                        ) : (
                          <th className="py-1.5 px-2.5 border-r border-gray-200 text-right">
                            IGST (₹)
                          </th>
                        )}
                        <th className="py-1.5 px-2.5 text-right">Total Tax (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billing.hsnSummary.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 font-mono">
                          <td className="py-1.5 px-2.5 border-r border-gray-200 font-semibold">
                            {row.hsnCode}
                            {row.hsnCode === '996812' ? ' (Delivery)' : ''}
                          </td>
                          <td className="py-1.5 px-2 border-r border-gray-200 text-center">
                            {row.gstRate}%
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-gray-200 text-right">
                            {row.taxableValue.toFixed(2)}
                          </td>
                          {billing.isIntraState ? (
                            <>
                              <td className="py-1.5 px-2.5 border-r border-gray-200 text-right">
                                {row.cgstAmount.toFixed(2)}
                              </td>
                              <td className="py-1.5 px-2.5 border-r border-gray-200 text-right">
                                {row.sgstAmount.toFixed(2)}
                              </td>
                            </>
                          ) : (
                            <td className="py-1.5 px-2.5 border-r border-gray-200 text-right">
                              {row.igstAmount.toFixed(2)}
                            </td>
                          )}
                          <td className="py-1.5 px-2.5 text-right font-bold">
                            {row.totalTax.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. TOTALS & PAYMENT RECONCILIATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {/* Left: Amount in Words & Legally Accurate Payment Box */}
                <div className="space-y-2.5">
                  <div className="bg-[#F8F6F1] border border-stone-200 rounded-lg p-3 text-[11px]">
                    <div className="text-[10px] uppercase font-bold text-gray-500">
                      Amount in Words:
                    </div>
                    <div className="font-bold text-[#1B2A21] italic mt-0.5">{totalInWords}</div>
                  </div>

                  <div
                    className={`rounded-lg p-2.5 text-[11px] border flex items-start gap-2 ${
                      payDisplay.isPaid
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    {payDisplay.isPaid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">{payDisplay.statusBadge}</div>
                      <div className="text-[10.5px] opacity-90">{payDisplay.detailLine}</div>
                    </div>
                  </div>
                </div>

                {/* Right: Financial Summary */}
                <div className="border border-gray-300 print:border-black rounded-lg p-3 space-y-1.5 text-xs bg-gray-50/50 print:bg-white">
                  {totalSavings > 0 && (
                    <>
                      <div className="flex justify-between text-gray-500 text-[11px]">
                        <span>Total MRP Value:</span>
                        <span className="font-mono line-through">₹{totalMrp.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-medium text-[11px]">
                        <span>Customer MRP Savings:</span>
                        <span className="font-mono">-₹{totalSavings.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {billing.isGstInvoice ? (
                    <>
                      <div className="flex justify-between text-gray-700">
                        <span>Total Taxable Value:</span>
                        <span className="font-mono">₹{billing.totalTaxableValue.toFixed(2)}</span>
                      </div>
                      {billing.isIntraState ? (
                        <>
                          <div className="flex justify-between text-gray-700">
                            <span>Add: CGST (Central Tax):</span>
                            <span className="font-mono">₹{billing.totalCgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-700">
                            <span>Add: SGST (Gujarat State Tax):</span>
                            <span className="font-mono">₹{billing.totalSgst.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-gray-700">
                          <span>Add: IGST (Inter-State Tax):</span>
                          <span className="font-mono">₹{billing.totalIgst.toFixed(2)}</span>
                        </div>
                      )}
                      {order.deliveryFee > 0 && (
                        <div className="flex justify-between text-gray-500 text-[10.5px]">
                          <span>(Includes Shipping &amp; Packing: ₹{order.deliveryFee})</span>
                          <span className="font-mono">SAC 996812</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-gray-700 font-medium">
                        <span>Items Subtotal:</span>
                        <span className="font-mono">₹{order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Delivery &amp; Packaging:</span>
                        <span className="font-mono">
                          {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee.toFixed(2)}`}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="border-t-2 border-gray-300 print:border-black pt-2 flex justify-between font-bold text-sm text-[#1B2A21]">
                    <span>Net Grand Total:</span>
                    <span className="text-base font-mono">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-right text-gray-500">
                    {billing.isGstInvoice
                      ? 'Tax back-calculated from MRP-inclusive retail prices • Reverse Charge: No'
                      : 'All prices inclusive of applicable taxes'}
                  </div>
                </div>
              </div>

              {/* 6. STATUTORY DECLARATIONS & AUTHORIZED SIGNATORY */}
              <div className="border-t border-gray-300 print:border-black pt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-[10px] text-gray-600">
                <div className="space-y-1 leading-relaxed">
                  <div className="font-bold uppercase tracking-wider text-gray-800">
                    Declarations &amp; Terms:
                  </div>
                  <div>
                    1. <strong>Genuine Supply:</strong> Sealed manufacturer-packed Ayurvedic &amp;
                    wellness goods sold in original retail packaging with intact MRP, Batch &amp;
                    Expiry.
                  </div>
                  <div>
                    2. <strong>Hygiene &amp; Returns:</strong> Opened health/personal care packages
                    are non-returnable; transit damage or wrong item must be reported within 24 hours.
                  </div>
                  {billing.ayushLicenseNote && <div>3. {billing.ayushLicenseNote}.</div>}
                  <div>Subject to Bhavnagar, Gujarat jurisdiction.</div>
                </div>

                <div className="text-right space-y-1.5">
                  <div className="inline-block border-2 border-[#1B2A21]/40 text-[#1B2A21] px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    {billing.isGstInvoice ? 'GST TAX INVOICE' : 'AUTHORIZED RETAIL BILL'}
                  </div>
                  <div className="text-gray-900 font-bold">For {billing.sellerLegalName}</div>
                  <div className="text-gray-500 text-[9px]">
                    Computer Generated Document • No Physical Signature Required
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* FORMAT 2: 3-INCH (80mm) THERMAL POS SLIP (DUAL MODE)      */}
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
                <div className="font-bold text-xs tracking-wide uppercase">
                  {billing.sellerLegalName}
                </div>
                <div className="text-[9.5px] text-gray-600">{billing.sellerAddress}</div>
                {billing.isGstInvoice && (
                  <div className="text-[10px] font-bold text-gray-900 mt-0.5">
                    GSTIN: {billing.sellerGstin}
                  </div>
                )}
                {billing.fssaiNumber && (
                  <div className="text-[9px] text-gray-600">FSSAI: {billing.fssaiNumber}</div>
                )}
                <div className="text-[9px] text-gray-500">Helpline: {helplineDisplay}</div>

                <div className="mt-2 py-0.5 bg-gray-100 border border-gray-300 font-bold text-[10.5px]">
                  {billing.isGstInvoice ? 'TAX INVOICE' : 'CASH MEMO'} #{invoiceNo}
                </div>
              </div>

              {/* Order & Customer Metadata */}
              <div className="space-y-0.5 text-[10px] leading-tight">
                <div>
                  <strong>Order Ref:</strong> {order.id}
                </div>
                <div>
                  <strong>Date:</strong> {invoiceDate} {invoiceTime}
                </div>
                {order.deliverySlot && (
                  <div>
                    <strong>Slot:</strong> {order.deliverySlot}
                  </div>
                )}
                <div>
                  <strong>Customer:</strong> {order.customerName} ({order.customerPhone})
                </div>
                <div>
                  <strong>Place of Supply:</strong> {billing.placeOfSupply.state} (
                  {billing.placeOfSupply.stateCode})
                </div>
                <div>
                  <strong>Address:</strong> {order.deliveryAddress}, {order.city} - {order.pincode}
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-b border-dashed border-gray-400 py-2 space-y-1">
                <div className="font-bold text-[10px] uppercase flex justify-between">
                  <span>ITEM</span>
                  <span>AMT (₹)</span>
                </div>
                {billing.lines.map((ln, idx) => (
                  <div key={idx} className="text-[10px]">
                    <div className="flex justify-between gap-2">
                      <span className="truncate max-w-[195px]">
                        {ln.item.quantity}x {ln.item.name}
                      </span>
                      <span className="font-bold shrink-0">₹{ln.lineTotal.toFixed(2)}</span>
                    </div>
                    {billing.isGstInvoice && (
                      <div className="text-[9px] text-gray-500">
                        HSN {ln.hsnCode} • GST {ln.gstRate}%
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="space-y-0.5 text-right text-[10.5px]">
                {billing.isGstInvoice ? (
                  <>
                    <div className="flex justify-between">
                      <span>Taxable Value:</span>
                      <span>₹{billing.totalTaxableValue.toFixed(2)}</span>
                    </div>
                    {billing.isIntraState ? (
                      <>
                        <div className="flex justify-between">
                          <span>CGST:</span>
                          <span>₹{billing.totalCgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST:</span>
                          <span>₹{billing.totalSgst.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span>IGST ({billing.placeOfSupply.stateCode}):</span>
                        <span>₹{billing.totalIgst.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span>₹{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery:</span>
                      <span>
                        {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-xs border-t border-dashed border-gray-400 pt-1 text-gray-900">
                  <span>GRAND TOTAL:</span>
                  <span>₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Accurate Payment Status Highlight */}
              <div
                className={`p-1.5 rounded text-center text-[10.5px] font-bold border ${
                  payDisplay.isPaid
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {payDisplay.statusBadge}
              </div>

              {/* Thermal Footer */}
              <div className="border-t border-dashed border-gray-400 pt-2 text-center text-[9px] text-gray-500 leading-tight">
                <p>Thank you for choosing {billing.sellerLegalName}!</p>
                <p>*** COMPUTER GENERATED BILL ***</p>
              </div>
            </div>
          )}
        </div>

        {/* NON-PRINTABLE BOTTOM BAR */}
        <div className="no-print bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0C831F]" />
            <span>
              {billing.isGstInvoice
                ? `GSTIN ${billing.sellerGstin} • Automatic CGST/SGST & Inter-State IGST`
                : 'Retail Cash Memo Mode • Switchable anytime in Admin → Settings'}
            </span>
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
