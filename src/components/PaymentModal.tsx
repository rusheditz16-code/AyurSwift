'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Smartphone,
  MessageCircle,
  X,
  Receipt,
  Banknote,
  ShieldCheck,
} from 'lucide-react';
import { Order, MerchantSettings } from '@/types';
import { generateUpiUri, generateWhatsAppOrderUrl } from '@/lib/store';
import { InvoiceModal } from '@/components/InvoiceModal';

interface PaymentModalProps {
  order: Order | null;
  onClose: () => void;
  settings: MerchantSettings;
}

export function PaymentModal({ order, onClose, settings }: PaymentModalProps) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showInvoice) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [order, showInvoice, onClose]);

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

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-modal-pop my-auto">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-[#0A6B19] to-[#0C831F] text-white p-6 text-center relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close confirmation"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 bg-white text-[#0C831F] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg animate-badge-pop">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>

          <span className="inline-block bg-white/15 text-emerald-50 font-mono font-bold text-xs px-3 py-0.5 rounded-full border border-white/20 mb-1.5">
            Order {order.id}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Order Received!</h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-xs mx-auto leading-relaxed">
            Our dark store is verifying stock &amp; preparing your pack for rapid dispatch.
          </p>
        </div>

        <div className="p-5 space-y-4 bg-[#F8FAFC]">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-3.5 text-xs space-y-2 border border-gray-200/80 shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Status</span>
              <span className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border border-amber-200">
                Awaiting Store Confirmation
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Customer</span>
              <span className="font-bold text-gray-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between text-gray-600 gap-4">
              <span className="shrink-0">Deliver to</span>
              <span className="font-semibold text-gray-900 text-right truncate">
                {order.deliveryAddress}, {order.city}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-100 pt-2">
              <span className="font-bold text-gray-700">Total Payable</span>
              <span className="font-extrabold text-lg text-[#0C831F] tabular-nums">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

          {/* Payment Box */}
          {order.paymentMethod === 'UPI' ? (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 text-center space-y-3 shadow-2xs">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-gray-900">
                <QrCode className="w-4 h-4 text-[#0C831F]" />
                <span>Scan &amp; Pay via Any UPI App (₹0 Fee)</span>
              </div>

              <div className="inline-block p-2.5 bg-white rounded-2xl border-2 border-[#0C831F]/20 shadow-xs">
                <img
                  src={qrImageUrl}
                  alt={`UPI QR for ${settings.merchantUpiId}`}
                  className="w-44 h-44 mx-auto rounded-lg object-contain"
                />
                <div className="mt-1.5 text-[10px] text-gray-500 font-bold">
                  GPay • PhonePe • Paytm • FamPay • BHIM
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <div className="text-left bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                  <span className="text-[9.5px] text-gray-500 block font-bold uppercase">
                    UPI ID
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-900">
                    {settings.merchantUpiId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="text-xs bg-gray-900 hover:bg-gray-800 text-white font-bold px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href = upiUri;
                }}
                className="w-full bg-[#ECFDF3] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#0C831F] font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Tap to Pay ₹{order.totalAmount} in UPI App</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Banknote className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-amber-950 text-sm">
                Cash on Delivery Selected
              </h3>
              <p className="text-xs text-amber-800">
                Please keep exact cash of <strong className="tabular-nums">₹{order.totalAmount}</strong> ready for the Rapido rider.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => window.open(whatsAppUrl, '_blank')}
              className="w-full bg-[#0C831F] hover:bg-[#096B19] text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#0C831F]/25 transition-all active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm &amp; Send on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowInvoice(true)}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-gray-200 transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-[#0C831F]" />
              <span>View &amp; Print Official Bill</span>
            </button>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-white rounded-xl border border-gray-200/80 text-[10.5px] text-gray-500 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#0C831F] shrink-0 mt-0.5" />
            <span>
              You can track or cancel this order anytime from <strong>Orders</strong> before dark-store packing starts.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Done &amp; Return to Store
          </button>
        </div>
      </div>

      <InvoiceModal
        order={order}
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        settings={settings}
        initialFormat="A4"
      />
    </div>
  );
}
