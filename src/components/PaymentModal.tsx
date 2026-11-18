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
  X,
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

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
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
    <div className="fixed inset-0 z-70 overflow-y-auto bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-[#f8f8f3] text-[#1c2e24] rounded-2xl shadow-2xl border border-[#d6ddce] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Success Header */}
        <div className="bg-[#e9efdf] p-6 text-center border-b border-[#d6ddce] relative">
          <button
            onClick={onClose}
            aria-label="Close window"
            className="absolute top-3.5 right-3.5 p-1 rounded-full text-[#526359] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-[#1d5a3e] text-white rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="inline-block bg-[#1d5a3e]/10 text-[#1d5a3e] font-semibold text-xs px-3 py-0.5 rounded-full mb-1 border border-[#1d5a3e]/20">
            Order #{order.id}
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#143d29]">Order Placed!</h2>
          <p className="text-xs text-[#526359] mt-0.5">
            {order.deliveryType === 'RAPIDO_CITY'
              ? '⚡ 30–45 Mins Rapido Delivery • Bhavnagar Store'
              : '📦 Courier Dispatch in 2–4 Days • All India'}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Order Summary Box */}
          <div className="bg-white rounded-xl p-3.5 text-xs space-y-1.5 border border-[#d6ddce]">
            <div className="flex justify-between text-[#526359]">
              <span>Customer:</span>
              <span className="font-bold text-[#143d29]">{order.customerName}</span>
            </div>
            <div className="flex justify-between text-[#526359]">
              <span>Delivery Address:</span>
              <span className="font-medium text-[#143d29] text-right truncate max-w-[200px]">
                {order.deliveryAddress}, {order.city}
              </span>
            </div>
            <div className="flex justify-between text-[#526359] border-t border-[#e9efdf] pt-1.5">
              <span>Total Payable:</span>
              <span className="font-bold text-base text-[#1d5a3e]">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

          {/* UPI Section */}
          {order.paymentMethod === 'UPI' ? (
            <div className="space-y-3 text-center">
              <div className="bg-[#e9efdf] border border-[#d6ddce] rounded-xl p-4">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#143d29] mb-2.5">
                  <QrCode className="w-4 h-4 text-[#1d5a3e]" />
                  <span>Scan & Pay via Any UPI App (Zero Fee)</span>
                </div>

                <div className="inline-block p-2 bg-white rounded-xl shadow-2xs border border-[#d6ddce]">
                  <img
                    src={qrImageUrl}
                    alt="UPI Payment QR"
                    className="w-44 h-44 mx-auto rounded-lg"
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-center gap-2">
                  <span className="text-xs font-mono font-semibold text-[#143d29] bg-white px-2.5 py-1 rounded-lg border border-[#d6ddce]">
                    {settings.merchantUpiId}
                  </span>
                  <button
                    onClick={handleCopyUpi}
                    className="text-xs bg-[#1d5a3e] hover:bg-[#143d29] text-white font-medium p-1.5 rounded-lg transition-colors flex items-center gap-1"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Mobile 1-Tap UPI Intent Button */}
                <div className="mt-3">
                  <button
                    onClick={handleOpenUpiApp}
                    className="w-full bg-[#1d5a3e] hover:bg-[#143d29] text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Pay ₹{order.totalAmount} on PhonePe / GPay / Paytm</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#e9efdf] border border-[#d6ddce] rounded-xl p-4 text-center space-y-1">
              <span className="text-2xl">💵</span>
              <h3 className="font-serif font-bold text-[#143d29] text-sm">
                Cash on Delivery (COD) Selected
              </h3>
              <p className="text-[11px] text-[#526359]">
                Please keep exact cash of <strong>₹{order.totalAmount}</strong> ready for the Rapido delivery rider.
              </p>
            </div>
          )}

          {/* 1-Click WhatsApp Order Confirmation */}
          <div className="space-y-1.5">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-[#1d5a3e] hover:bg-[#143d29] text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-transform active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm & Send Order via WhatsApp</span>
            </button>
            <p className="text-[10px] text-[#526359] text-center">
              Sends receipt and dispatch request directly to the store team
            </p>
          </div>

          {/* Close */}
          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-1.5 text-xs font-semibold text-[#526359] hover:text-[#143d29] transition-colors"
            >
              Done & Return to Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
