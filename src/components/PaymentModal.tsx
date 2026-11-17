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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Success Header */}
        <div className="bg-emerald-50 p-6 text-center border-b border-emerald-100">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="inline-block bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-0.5 rounded-full mb-1">
            Order {order.id}
          </span>
          <h2 className="text-xl font-black text-gray-900">Order Confirmed!</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            {order.deliveryType === 'RAPIDO_CITY'
              ? '⚡ 30–45 Mins Rapido Parcel In-City'
              : '📦 Courier Dispatch in 2–4 Days'}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Order Summary Box */}
          <div className="bg-gray-50 rounded-2xl p-3.5 text-xs space-y-1.5 border border-gray-200">
            <div className="flex justify-between text-gray-600">
              <span>Customer:</span>
              <span className="font-bold text-gray-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Address:</span>
              <span className="font-semibold text-gray-900 text-right truncate max-w-[200px]">
                {order.deliveryAddress}, {order.city}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-1.5">
              <span>Total Amount:</span>
              <span className="font-black text-base text-emerald-700">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

          {/* UPI Section */}
          {order.paymentMethod === 'UPI' ? (
            <div className="space-y-3 text-center">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
                  <QrCode className="w-4 h-4 text-emerald-700" />
                  <span>Scan & Pay via Any UPI App</span>
                </div>

                <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-gray-200">
                  <img
                    src={qrImageUrl}
                    alt="UPI Payment QR"
                    className="w-44 h-44 mx-auto rounded-lg"
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                    {settings.merchantUpiId}
                  </span>
                  <button
                    onClick={handleCopyUpi}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1.5 rounded-lg transition-colors flex items-center gap-1"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Mobile 1-Tap UPI Intent Button */}
                <div className="mt-3">
                  <button
                    onClick={handleOpenUpiApp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Pay ₹{order.totalAmount} directly on PhonePe / GPay</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1">
              <span className="text-2xl">💵</span>
              <h3 className="font-bold text-amber-900 text-xs">
                Cash on Delivery (COD) Selected
              </h3>
              <p className="text-[11px] text-amber-800">
                Please keep exact cash of <strong>₹{order.totalAmount}</strong> ready for the Rapido bike rider.
              </p>
            </div>
          )}

          {/* 1-Click WhatsApp Order Confirmation */}
          <div className="space-y-2">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm & Send Order via WhatsApp</span>
            </button>
            <p className="text-[10px] text-gray-500 text-center">
              Sends pre-filled order receipt & drop address directly to merchant WhatsApp
            </p>
          </div>

          {/* Close */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
