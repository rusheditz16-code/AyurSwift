'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Smartphone,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-[#0a0e0c] text-white rounded-3xl shadow-2xl border border-white/[0.1] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Success Header (Digital Gravity Glow) */}
        <div className="bg-gradient-to-b from-[#141d18] to-[#0a0e0c] p-6 text-white text-center border-b border-white/[0.08]">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="inline-block bg-emerald-500 text-black font-black text-[11px] px-3.5 py-0.5 rounded-full mb-1.5 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
            ORDER BOOKED {order.id}
          </span>
          <h2 className="text-xl font-black tracking-tight">Ready for Home Dispatch!</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {order.deliveryType === 'RAPIDO_CITY'
              ? '⚡ 30–45 Mins Rapido Bike Parcel'
              : '📦 Courier Dispatch in 2–4 Days'}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Order Snapshot */}
          <div className="bg-white/[0.03] rounded-2xl p-4 text-xs space-y-2 border border-white/[0.06]">
            <div className="flex justify-between text-gray-400">
              <span>Customer:</span>
              <span className="font-bold text-white">{order.customerName}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Drop Location:</span>
              <span className="font-semibold text-white text-right truncate max-w-[200px]">
                {order.deliveryAddress}, {order.city}
              </span>
            </div>
            <div className="flex justify-between text-gray-400 border-t border-white/[0.08] pt-2">
              <span>Payable Total:</span>
              <span className="font-black text-xl text-emerald-400">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

          {/* UPI Section */}
          {order.paymentMethod === 'UPI' ? (
            <div className="space-y-3 text-center">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-4">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300 mb-2.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Scan with Any UPI App (₹0 Fees)</span>
                </div>

                {/* Scannable Universal QR */}
                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg">
                  <img
                    src={qrImageUrl}
                    alt={`UPI QR Code for ${order.id}`}
                    className="w-44 h-44 mx-auto object-contain"
                  />
                </div>

                {/* Supported Apps Badges */}
                <div className="flex items-center justify-center gap-2 mt-2.5 text-[10px] text-gray-300 font-semibold">
                  <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">GPay</span>
                  <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">PhonePe</span>
                  <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">Paytm</span>
                  <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">BHIM</span>
                  <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">CRED</span>
                </div>

                {/* Mobile Intent Button */}
                <div className="mt-3.5">
                  <button
                    onClick={handleOpenUpiApp}
                    className="w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 text-black font-black py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-98 transition-all"
                  >
                    <Smartphone className="w-4 h-4 text-black" />
                    <span>Pay ₹{order.totalAmount} on GPay / PhonePe / Paytm</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Merchant UPI ID display with Copy */}
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-400">
                  <span>UPI ID:</span>
                  <code className="bg-black/60 px-2 py-0.5 rounded-md border border-white/10 font-mono font-bold text-emerald-300 text-xs">
                    {settings.merchantUpiId}
                  </code>
                  <button
                    onClick={handleCopyUpi}
                    className="p-1 hover:bg-white/[0.08] rounded text-emerald-400 transition-colors"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center space-y-1">
              <div className="text-amber-300 font-black text-sm">
                💵 Cash on Delivery Selected
              </div>
              <p className="text-xs text-amber-200/90">
                Please hand <strong>₹{order.totalAmount}</strong> cash to the Rapido parcel bike rider upon arrival.
              </p>
            </div>
          )}

          {/* 1-Click WhatsApp Trigger */}
          <div className="space-y-1.5">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Confirm & Dispatch on WhatsApp</span>
            </button>
            <p className="text-[10px] text-center text-gray-500">
              Sends your order details directly to our dark store fulfillment team.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-gray-500 hover:text-white font-bold transition-colors"
          >
            ← Back to Storefront
          </button>
        </div>
      </div>
    </div>
  );
}
