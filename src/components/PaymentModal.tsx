'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Zap,
  MessageCircle,
  Smartphone,
} from 'lucide-react';
import { Order, MerchantSettings } from '@/types';
import { generateUpiUri, generateWhatsAppOrderUrl } from '@/lib/store';

interface PaymentModalProps {
  order: Order | null;
  onClose: () => void;
  settings: MerchantSettings;
}

export function PaymentModal({ order, onClose, settings }: PaymentModalProps) {
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!order) return null;

  const upiUri = generateUpiUri({
    upiId: settings.merchantUpiId,
    payeeName: settings.merchantUpiName,
    amount: order.totalAmount,
    orderId: order.id,
  });

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    upiUri
  )}`;

  const whatsAppUrl = generateWhatsAppOrderUrl(order, settings.merchantWhatsApp);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleOpenUpiApp = () => {
    window.location.href = upiUri;
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsAppUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-5 text-white text-center">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-400/30">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <span className="inline-block bg-amber-400 text-emerald-950 font-black text-[11px] px-3 py-0.5 rounded-full mb-1">
            ORDER BOOKED {order.id}
          </span>
          <h2 className="text-xl font-black">Ready for Home Dispatch!</h2>
          <p className="text-xs text-emerald-200 mt-0.5">
            {order.deliveryType === 'RAPIDO_CITY'
              ? '⚡ 30–45 Mins Rapido Bike Delivery'
              : '📦 Courier Dispatch in 2–4 Days'}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Order Snapshot */}
          <div className="bg-gray-50 rounded-2xl p-3.5 text-xs space-y-1.5 border border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>Customer:</span>
              <span className="font-bold text-gray-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Drop Location:</span>
              <span className="font-semibold text-gray-900 text-right truncate max-w-[200px]">
                {order.deliveryAddress}, {order.city}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-1.5">
              <span>Payable Amount:</span>
              <span className="font-black text-lg text-emerald-950">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

          {/* If UPI Payment -> Show Dynamic QR & Intent Buttons */}
          {order.paymentMethod === 'UPI' ? (
            <div className="space-y-3 text-center">
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-3xl p-4">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-950 mb-2">
                  <QrCode className="w-4 h-4 text-emerald-700" />
                  <span>Scan with Any UPI App (₹0 Fees)</span>
                </div>

                {/* Scannable Universal QR */}
                <div className="bg-white p-2.5 rounded-2xl inline-block shadow-sm border border-emerald-100">
                  <img
                    src={qrImageUrl}
                    alt={`UPI QR Code for ${order.id}`}
                    className="w-44 h-44 mx-auto object-contain"
                  />
                </div>

                {/* Supported Apps Badges */}
                <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-gray-500 font-semibold">
                  <span className="bg-white px-2 py-0.5 rounded border border-gray-200">GPay</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-gray-200">PhonePe</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-gray-200">Paytm</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-gray-200">BHIM</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-gray-200">CRED</span>
                </div>

                {/* Direct App Launch Button for Mobile users */}
                <div className="mt-3">
                  <button
                    onClick={handleOpenUpiApp}
                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
                  >
                    <Smartphone className="w-4 h-4 text-amber-300" />
                    <span>Pay ₹{order.totalAmount} in GPay / PhonePe / Paytm</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Merchant UPI ID display with Copy */}
                <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-gray-600">
                  <span>UPI ID:</span>
                  <code className="bg-white px-2 py-0.5 rounded-md border border-gray-200 font-mono font-bold text-emerald-950 text-xs">
                    {settings.merchantUpiId}
                  </code>
                  <button
                    onClick={handleCopyUpi}
                    className="p-1 hover:bg-emerald-100 rounded text-emerald-800"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1">
              <div className="text-amber-950 font-black text-sm">
                💵 Cash on Delivery Selected
              </div>
              <p className="text-xs text-amber-900/90">
                Please hand <strong>₹{order.totalAmount}</strong> cash to the Rapido bike parcel rider upon arrival.
              </p>
            </div>
          )}

          {/* 1-Click WhatsApp Trigger */}
          <div className="space-y-1.5">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              <span>Confirm & Dispatch on WhatsApp</span>
            </button>
            <p className="text-[10px] text-center text-gray-400">
              Sends your order details directly to our dark store fulfillment team.
            </p>
          </div>

          {/* Back to store */}
          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-800 font-bold"
          >
            ← Back to Storefront
          </button>
        </div>
      </div>
    </div>
  );
}
