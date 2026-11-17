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
  ArrowRight,
  MessageCircle,
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

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white text-center">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-300">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="inline-block bg-amber-400 text-emerald-950 font-black text-xs px-2.5 py-0.5 rounded-full mb-1">
            ORDER INITIATED {order.id}
          </span>
          <h2 className="text-xl font-extrabold">Order Received!</h2>
          <p className="text-xs text-emerald-100 mt-0.5">
            {order.deliveryType === 'RAPIDO_CITY'
              ? '⚡ 30–45 Mins Rapido Home Dispatch'
              : '📦 Courier Dispatch in 2–4 Days'}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Order Snapshot */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>Customer:</span>
              <span className="font-bold text-gray-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery To:</span>
              <span className="font-medium text-gray-900 text-right truncate max-w-[220px]">
                {order.deliveryAddress}, {order.city}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-1">
              <span>Total Payable:</span>
              <span className="font-extrabold text-base text-emerald-900">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

          {/* If UPI Payment -> Show Dynamic QR & Intent Buttons */}
          {order.paymentMethod === 'UPI' ? (
            <div className="space-y-3.5 text-center">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-950 mb-2">
                  <QrCode className="w-4 h-4 text-emerald-700" />
                  <span>Scan to Pay ₹{order.totalAmount} (Zero Fees)</span>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-2.5 rounded-xl inline-block shadow-xs border border-emerald-100">
                  <img
                    src={qrImageUrl}
                    alt={`UPI QR Code for ${order.id}`}
                    className="w-48 h-48 mx-auto object-contain"
                  />
                </div>

                {/* Direct App Launch Button for Mobile users */}
                <div className="mt-3">
                  <button
                    onClick={handleOpenUpiApp}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Tap to Pay on GPay / PhonePe / Paytm</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Merchant UPI ID display with Copy */}
                <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-gray-600">
                  <span>UPI ID:</span>
                  <code className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono font-semibold text-emerald-900">
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
              <div className="text-amber-900 font-bold text-sm">
                💵 Cash on Delivery Selected
              </div>
              <p className="text-xs text-amber-800">
                Please keep exact change of <strong>₹{order.totalAmount}</strong> ready for the Rapido bike rider.
              </p>
            </div>
          )}

          {/* 1-Click WhatsApp Trigger */}
          <div className="space-y-2">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-3 px-4 rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Send Order to WhatsApp (1-Click)</span>
            </button>
            <p className="text-[11px] text-center text-gray-500">
              Sends your order items, delivery address & payment confirmation directly to our dark store WhatsApp.
            </p>
          </div>

          {/* Done / Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-800 font-semibold"
          >
            Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
