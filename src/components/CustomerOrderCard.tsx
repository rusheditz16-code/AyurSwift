'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Truck,
  Zap,
  Receipt,
  RotateCcw,
  MessageCircle,
  Ban,
  QrCode,
  Smartphone,
  Loader2,
  PackageCheck,
} from 'lucide-react';
import { MerchantSettings, Order } from '@/types';
import { generateUpiUri, submitOrderUtr } from '@/lib/store';

interface CustomerOrderCardProps {
  order: Order;
  settings: MerchantSettings;
  merchantPhoneClean: string;
  onViewBill: (order: Order) => void;
  onReorder?: (items: { productId: string; quantity: number }[]) => void;
  onCancelOrder: (orderId: string) => void;
  onOrderUpdated: (updated: Order) => void;
}

const TIMELINE_STEPS = ['NEW', 'PACKED', 'DISPATCHED', 'DELIVERED'] as const;
const STEP_LABELS: Record<(typeof TIMELINE_STEPS)[number], string> = {
  NEW: 'Placed',
  PACKED: 'Packed',
  DISPATCHED: 'On the way',
  DELIVERED: 'Delivered',
};

function getStageSummary(order: Order): string {
  if (order.orderStatus === 'CANCELLED') {
    return 'Order cancelled — any prepaid UPI amount is refunded promptly.';
  }
  if (order.orderStatus === 'DELIVERED') {
    return 'Delivered safely! Keep your official bill for future reference.';
  }
  if (order.orderStatus === 'DISPATCHED') {
    return order.deliveryType === 'RAPIDO_CITY'
      ? 'Out for delivery via Rapido Parcel rider.'
      : 'Dispatched via Express Courier.';
  }
  if (order.orderStatus === 'PACKED') {
    return 'Packed & sealed fresh — assigning rider/dispatch shortly.';
  }
  if (order.paymentMethod === 'UPI' && order.paymentStatus === 'PENDING') {
    return order.utrNumber
      ? 'UTR received — store is verifying payment & stock.'
      : 'Order placed — awaiting UPI payment / UTR confirmation & store verification.';
  }
  return 'Order placed — awaiting dark-store verification.';
}

export function CustomerOrderCard({
  order,
  settings,
  merchantPhoneClean,
  onViewBill,
  onReorder,
  onCancelOrder,
  onOrderUpdated,
}: CustomerOrderCardProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showPayPanel, setShowPayPanel] = useState(false);
  const [utrInput, setUtrInput] = useState(
    order.utrNumber && !order.utrNumber.includes('•') ? order.utrNumber : ''
  );
  const [verifyPhone, setVerifyPhone] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrFeedback, setUtrFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const isCancelled = order.orderStatus === 'CANCELLED';
  const activeStepIdx = TIMELINE_STEPS.indexOf(
    order.orderStatus as (typeof TIMELINE_STEPS)[number]
  );

  const hasUnmaskedPhone = order.customerPhone.replace(/\D/g, '').length === 10;

  const upiUri = generateUpiUri({
    upiId: settings.merchantUpiId,
    payeeName: settings.merchantUpiName,
    amount: order.totalAmount,
    orderId: order.id,
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingUtr) return;
    setUtrFeedback(null);

    const phoneToSend = hasUnmaskedPhone
      ? order.customerPhone.replace(/\D/g, '')
      : verifyPhone.replace(/\D/g, '').slice(-10);

    if (phoneToSend.length !== 10) {
      setUtrFeedback({
        type: 'err',
        text: 'Enter your registered 10-digit mobile number to confirm ownership.',
      });
      return;
    }

    setIsSubmittingUtr(true);
    try {
      const updated = await submitOrderUtr(order.id, phoneToSend, utrInput);
      onOrderUpdated(
        updated || {
          ...order,
          utrNumber: utrInput.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32),
        }
      );
      setUtrFeedback({ type: 'ok', text: 'UTR saved & sent to dark store!' });
      setTimeout(() => setShowPayPanel(false), 1200);
    } catch (err) {
      setUtrFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save UTR right now.',
      });
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 space-y-3 shadow-2xs">
      {/* Header Row: Copyable ID + Timestamp + Payment & Order Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyId}
            title="Copy Order ID"
            className="font-mono font-extrabold text-xs bg-[#ECFDF3] hover:bg-[#DCFCE7] text-[#0C831F] border border-[#BBF7D0] px-2 py-0.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{order.id}</span>
            {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-70" />}
          </button>
          <span className="text-[11px] text-gray-500 font-medium">
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              timeZone: 'Asia/Kolkata',
            })}{' '}
            •{' '}
            {new Date(order.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Kolkata',
            })}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              order.paymentStatus === 'VERIFIED' || order.paymentStatus === 'PAID'
                ? 'bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0]'
                : order.paymentMethod === 'COD'
                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {order.paymentStatus === 'VERIFIED' || order.paymentStatus === 'PAID'
              ? '✓ Payment Verified'
              : order.paymentMethod === 'COD'
              ? 'COD on Delivery'
              : order.utrNumber
              ? 'UPI UTR Sent'
              : 'UPI Pending'}
          </span>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              isCancelled
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : order.orderStatus === 'DELIVERED'
                ? 'bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0]'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
          >
            {order.orderStatus}
          </span>
        </div>
      </div>

      {/* Clear Stage Explanation */}
      <div
        className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border ${
          isCancelled
            ? 'bg-rose-50/70 border-rose-200/80 text-rose-800'
            : order.orderStatus === 'DELIVERED'
            ? 'bg-[#ECFDF3]/80 border-[#BBF7D0] text-[#0C831F]'
            : 'bg-slate-50 border-gray-200/70 text-gray-700'
        }`}
      >
        {getStageSummary(order)}
      </div>

      {/* Visual 4-Step Progress Bar */}
      {!isCancelled && (
        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
          {TIMELINE_STEPS.map((step, idx) => {
            const done = idx <= activeStepIdx;
            return (
              <div key={step} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    done ? 'bg-[#0C831F]' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`text-[10px] font-bold text-center ${
                    done ? 'text-[#0C831F]' : 'text-gray-400'
                  }`}
                >
                  {STEP_LABELS[step]}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Highlighted Live Rider / Courier Tracking Info (saved by Admin) */}
      {order.courierTracking && !isCancelled && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-blue-950">
          <PackageCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-extrabold text-blue-900">Rider / Tracking Details</div>
            <div className="font-semibold mt-0.5 select-all">{order.courierTracking}</div>
          </div>
        </div>
      )}

      {/* Pending UPI Payment / UTR Inline Helper */}
      {order.paymentMethod === 'UPI' &&
        order.paymentStatus === 'PENDING' &&
        !isCancelled && (
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  {order.utrNumber
                    ? `UTR Submitted (${order.utrNumber})`
                    : `Pay ₹${order.totalAmount} via UPI & submit UTR`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPayPanel((v) => !v)}
                className="px-2.5 py-1 rounded-lg bg-amber-900 hover:bg-amber-950 text-white font-bold text-[10.5px] shrink-0 cursor-pointer"
              >
                {showPayPanel ? 'Hide' : order.utrNumber ? 'Update UTR' : 'Pay / Enter UTR'}
              </button>
            </div>

            {showPayPanel && (
              <form onSubmit={handleSubmitUtr} className="space-y-2 pt-1 border-t border-amber-200/80">
                <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-amber-200/80">
                  <span className="text-[11px] font-mono font-bold text-gray-900 truncate">
                    {settings.merchantUpiId}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(settings.merchantUpiId);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 1800);
                      }}
                      className="px-2 py-1 rounded bg-gray-900 text-white text-[10px] font-bold cursor-pointer"
                    >
                      {copiedUpi ? 'Copied' : 'Copy UPI'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = upiUri;
                      }}
                      className="px-2 py-1 rounded bg-[#0C831F] text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>Pay App</span>
                    </button>
                  </div>
                </div>

                {!hasUnmaskedPhone && (
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={verifyPhone}
                    onChange={(e) => setVerifyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Confirm 10-digit order mobile number"
                    required
                    className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0C831F]"
                  />
                )}

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    placeholder="Enter UPI UTR / Ref ID (min 6 chars)"
                    required
                    className="flex-1 px-2.5 py-1.5 text-[11px] font-mono bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0C831F]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingUtr}
                    className="px-3 py-1.5 rounded-lg bg-[#0C831F] hover:bg-[#096B19] text-white text-[11px] font-extrabold shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    {isSubmittingUtr ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span>Submit UTR</span>
                    )}
                  </button>
                </div>

                {utrFeedback && (
                  <div
                    className={`text-[10.5px] font-bold ${
                      utrFeedback.type === 'ok' ? 'text-[#0C831F]' : 'text-rose-700'
                    }`}
                  >
                    {utrFeedback.text}
                  </div>
                )}
              </form>
            )}
          </div>
        )}

      {/* Items Preview */}
      <div className="bg-[#F8FAFC] rounded-xl p-2.5 border border-gray-100 space-y-1 text-xs">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-[11.5px] text-gray-700">
            <span className="truncate pr-2">
              {item.quantity}x {item.name} ({item.packSize})
            </span>
            <span className="font-bold text-gray-900 tabular-nums shrink-0">
              ₹{item.totalPrice}
            </span>
          </div>
        ))}
        <div className="border-t border-gray-200/70 pt-1.5 mt-1 flex items-center justify-between font-extrabold text-gray-950">
          <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
            {order.deliveryType === 'RAPIDO_CITY' ? (
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            ) : (
              <Truck className="w-3 h-3 text-[#0C831F]" />
            )}
            <span>{order.paymentMethod}</span>
          </span>
          <span className="text-sm text-[#0C831F] tabular-nums">₹{order.totalAmount}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onViewBill(order)}
          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
        >
          <Receipt className="w-3.5 h-3.5 text-[#0C831F]" />
          <span>Bill</span>
        </button>

        {onReorder && (
          <button
            type="button"
            onClick={() =>
              onReorder(
                order.items.map((i) => ({
                  productId: i.productId,
                  quantity: i.quantity,
                }))
              )
            }
            className="px-2.5 py-1.5 rounded-lg bg-[#ECFDF3] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#0C831F] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reorder</span>
          </button>
        )}

        <a
          href={`https://wa.me/${merchantPhoneClean}?text=${encodeURIComponent(
            `Hi AyurSwift! Tracking inquiry for Order ${order.id}.`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-[11px] flex items-center gap-1"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Help</span>
        </a>

        {order.orderStatus === 'NEW' && (
          <button
            type="button"
            onClick={() => onCancelOrder(order.id)}
            className="ml-auto px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <Ban className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        )}
      </div>
    </div>
  );
}
