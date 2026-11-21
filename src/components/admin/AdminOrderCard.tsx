'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Receipt,
  Printer,
  Copy,
  Check,
  MessageCircle,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Truck,
  StickyNote,
} from 'lucide-react';
import { Order } from '@/types';

interface AdminOrderCardProps {
  order: Order;
  viewMode: 'KANBAN' | 'LIST';
  nextStatus?: Order['orderStatus'];
  nextLabel?: string;
  copiedOrderId: string | null;
  onCopyForRapido: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
  onTogglePaymentVerified: (orderId: string) => void;
  onVerifyAndPack: (orderId: string) => void;
  onSaveOrderLogistics: (
    orderId: string,
    courierTracking: string,
    adminNote: string
  ) => Promise<boolean>;
  onWhatsAppCustomer: (order: Order) => void;
  onOpenBill: (order: Order, format?: 'A4' | 'THERMAL') => void;
  onDeleteOrder: (orderId: string) => void;
  dark: boolean;
}

function getElapsedLabel(createdAt: string): { label: string; mins: number } {
  const diffMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return { label: 'Just now', mins: 0 };
  if (mins < 60) return { label: `${mins}m ago`, mins };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `${hrs}h ago`, mins };
  return { label: `${Math.floor(hrs / 24)}d ago`, mins };
}

export function AdminOrderCard({
  order,
  viewMode,
  nextStatus,
  nextLabel,
  copiedOrderId,
  onCopyForRapido,
  onUpdateOrderStatus,
  onTogglePaymentVerified,
  onVerifyAndPack,
  onSaveOrderLogistics,
  onWhatsAppCustomer,
  onOpenBill,
  onDeleteOrder,
  dark,
}: AdminOrderCardProps) {
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [isLogisticsOpen, setIsLogisticsOpen] = useState(false);
  const [trackingDraft, setTrackingDraft] = useState(order.courierTracking || '');
  const [noteDraft, setNoteDraft] = useState(order.adminNote || '');
  const [isSavingLogistics, setIsSavingLogistics] = useState(false);

  useEffect(() => {
    setTrackingDraft(order.courierTracking || '');
    setNoteDraft(order.adminNote || '');
  }, [order.courierTracking, order.adminNote]);

  const isCopied = copiedOrderId === order.id;
  const isRapido = order.deliveryType === 'RAPIDO_CITY';
  const elapsed = getElapsedLabel(order.createdAt);
  const isUrgent = order.orderStatus === 'NEW' && elapsed.mins >= 15;

  const cardBg = dark
    ? 'bg-[#111827] border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs';
  const subSurface = dark
    ? 'bg-slate-900/90 border-slate-800'
    : 'bg-slate-50 border-slate-200/70';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  const paymentSummaryLabel =
    order.paymentMethod === 'COD'
      ? `Collect Cash (COD)`
      : order.paymentStatus === 'VERIFIED' || order.paymentStatus === 'PAID'
      ? `✓ Paid (UPI)`
      : `Awaiting UPI`;

  const handleSaveLogisticsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingLogistics) return;
    setIsSavingLogistics(true);
    try {
      const ok = await onSaveOrderLogistics(order.id, trackingDraft, noteDraft);
      if (ok) setIsLogisticsOpen(false);
    } finally {
      setIsSavingLogistics(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-3.5 space-y-3 transition-all ${
        isUrgent
          ? dark
            ? 'bg-[#111827] border-rose-500/60 shadow-md shadow-rose-950/30'
            : 'bg-white border-rose-300 shadow-sm'
          : cardBg
      }`}
    >
      {/* Top Row: ID + Badges + SLA Timer */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/15">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            {order.id}
          </span>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              isRapido
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-blue-500/15 text-blue-500'
            }`}
          >
            {isRapido ? '⚡ Rapido' : '📦 Courier'}
          </span>
          <button
            type="button"
            onClick={() => onTogglePaymentVerified(order.id)}
            title="Click to toggle UPI payment verification"
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full cursor-pointer transition-all active:scale-95 border ${
              order.paymentStatus === 'VERIFIED' || order.paymentStatus === 'PAID'
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/35'
                : 'bg-amber-500/15 text-amber-500 border-amber-500/35 hover:bg-emerald-500/15 hover:text-emerald-500'
            }`}
          >
            {order.paymentStatus === 'VERIFIED' || order.paymentStatus === 'PAID'
              ? '✓ UPI Verified'
              : `${order.paymentMethod} Pending`}
          </button>
        </div>

        <span
          className={`text-[10.5px] font-bold flex items-center gap-1 shrink-0 tabular-nums ${
            isUrgent ? 'text-rose-500' : muted
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>{elapsed.label}</span>
        </span>
      </div>

      {/* Customer Submitted UTR Reference Badge */}
      {order.utrNumber && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px]">
          <span className="font-bold text-emerald-500 truncate font-mono">
            UTR: {order.utrNumber}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(order.utrNumber!);
              setCopiedUtr(true);
              setTimeout(() => setCopiedUtr(false), 1600);
            }}
            className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-600 text-white shrink-0 inline-flex items-center gap-1 cursor-pointer"
          >
            {copiedUtr ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
            <span>{copiedUtr ? 'Copied' : 'Copy UTR'}</span>
          </button>
        </div>
      )}

      {/* Customer Info */}
      <div className="text-xs space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <strong className="font-extrabold truncate">{order.customerName}</strong>
          <a
            href={`tel:${order.customerPhone}`}
            className="text-emerald-500 font-bold hover:underline shrink-0 tabular-nums"
          >
            {order.customerPhone}
          </a>
        </div>
        <p className={`text-[11px] leading-snug line-clamp-2 ${muted}`}>
          {order.deliveryAddress}
          {order.landmark ? `, Near ${order.landmark}` : ''}, {order.city} - {order.pincode}
        </p>
      </div>

      {/* Saved Tracking / Internal Note Badges */}
      {(order.courierTracking || order.adminNote) && (
        <div className="space-y-1 text-[10.5px]">
          {order.courierTracking && (
            <div className="flex items-center gap-1.5 text-blue-500 font-semibold">
              <Truck className="w-3 h-3 shrink-0" />
              <span className="truncate">{order.courierTracking}</span>
            </div>
          )}
          {order.adminNote && (
            <div className={`flex items-center gap-1.5 font-medium ${muted}`}>
              <StickyNote className="w-3 h-3 shrink-0" />
              <span className="truncate">{order.adminNote}</span>
            </div>
          )}
        </div>
      )}

      {/* Items Box */}
      <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${subSurface}`}>
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between gap-2">
            <span className="truncate">
              <strong>{item.quantity}x</strong> {item.name} ({item.packSize})
            </span>
            <span className="font-bold tabular-nums shrink-0">₹{item.totalPrice}</span>
          </div>
        ))}
        <div className="pt-1.5 mt-1 border-t border-slate-500/15 flex items-center justify-between font-extrabold text-xs">
          <span
            className={
              order.paymentStatus === 'VERIFIED' || order.paymentStatus === 'PAID'
                ? 'text-emerald-500'
                : order.paymentMethod === 'COD'
                ? 'text-amber-500'
                : muted
            }
          >
            {paymentSummaryLabel}
          </span>
          <span className="text-emerald-500 tabular-nums text-sm">₹{order.totalAmount}</span>
        </div>
      </div>

      {/* Collapsible Rider / Courier Tracking & Note Editor */}
      <div>
        <button
          type="button"
          onClick={() => setIsLogisticsOpen((v) => !v)}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[10.5px] font-bold transition-colors cursor-pointer ${
            dark
              ? 'border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-800'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Truck className="w-3 h-3 text-emerald-500" />
            <span>
              {order.courierTracking ? 'Edit Rider / Tracking & Note' : 'Add Rider / Tracking & Note'}
            </span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${isLogisticsOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isLogisticsOpen && (
          <form
            onSubmit={handleSaveLogisticsSubmit}
            className={`mt-2 p-2.5 rounded-xl border space-y-2 ${subSurface}`}
          >
            <div>
              <label className={`block text-[10px] font-bold mb-1 ${muted}`}>
                Rider Name/Phone or Courier AWB (shown to customer)
              </label>
              <input
                type="text"
                maxLength={120}
                value={trackingDraft}
                onChange={(e) => setTrackingDraft(e.target.value)}
                placeholder="e.g. Rapido Suresh 98765xxxx / DTDC AWB123"
                className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] border focus:outline-none focus:border-[#0C831F] ${
                  dark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-bold mb-1 ${muted}`}>
                Internal Store Note (Admin only)
              </label>
              <input
                type="text"
                maxLength={250}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Private packing/call note..."
                className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] border focus:outline-none focus:border-[#0C831F] ${
                  dark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsLogisticsOpen(false)}
                className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold border border-slate-500/20 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingLogistics}
                className="px-3 py-1 rounded-lg bg-[#0C831F] hover:bg-[#096B19] text-white text-[10.5px] font-extrabold cursor-pointer disabled:opacity-50"
              >
                {isSavingLogistics ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="space-y-2">
        {/* 1-Tap Verify UPI & Pack for NEW pending UPI orders */}
        {order.orderStatus === 'NEW' &&
          order.paymentMethod === 'UPI' &&
          order.paymentStatus === 'PENDING' && (
            <button
              type="button"
              onClick={() => onVerifyAndPack(order.id)}
              className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify UPI &amp; Pack</span>
            </button>
          )}

        <div className="flex items-center gap-1.5">
          {nextStatus && nextLabel ? (
            <button
              type="button"
              onClick={() => onUpdateOrderStatus(order.id, nextStatus)}
              className="flex-1 py-2 px-2.5 rounded-xl bg-[#0C831F] hover:bg-[#096B19] text-white text-[11.5px] font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <span>{nextLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <select
              value={order.orderStatus}
              onChange={(e) =>
                onUpdateOrderStatus(order.id, e.target.value as Order['orderStatus'])
              }
              className={`flex-1 text-xs rounded-xl px-2.5 py-2 font-bold border focus:outline-none cursor-pointer ${
                dark
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="NEW">New</option>
              <option value="PACKED">Packed</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}

          <button
            type="button"
            onClick={() => onCopyForRapido(order)}
            title="1-Click Copy Drop Details for Rapido"
            className={`py-2 px-2.5 rounded-xl text-[11.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer active:scale-95 border ${
              isCopied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : dark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Rapido'}</span>
          </button>
        </div>

        {/* Secondary Row */}
        <div className="flex items-center justify-between gap-1 pt-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onWhatsAppCustomer(order)}
              title="Send Stage-Aware WhatsApp Update"
              className={`px-2 py-1 rounded-lg border text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                dark
                  ? 'border-slate-800 bg-slate-900 text-emerald-400 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenBill(order, 'A4')}
              title="Print Standard A4 Bill"
              className={`px-2 py-1 rounded-lg border text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                dark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Receipt className="w-3 h-3" />
              <span>A4</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenBill(order, 'THERMAL')}
              title="Print 80mm Thermal POS Slip"
              className={`px-2 py-1 rounded-lg border text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                dark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Printer className="w-3 h-3" />
              <span>POS</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {viewMode === 'KANBAN' && (
              <select
                value={order.orderStatus}
                onChange={(e) =>
                  onUpdateOrderStatus(order.id, e.target.value as Order['orderStatus'])
                }
                aria-label="Change status"
                className={`text-[10.5px] rounded-lg px-1.5 py-1 font-bold border cursor-pointer focus:outline-none ${
                  dark
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="NEW">New</option>
                <option value="PACKED">Packed</option>
                <option value="DISPATCHED">Sent</option>
                <option value="DELIVERED">Done</option>
                <option value="CANCELLED">Cancel</option>
              </select>
            )}

            <button
              type="button"
              onClick={() => onDeleteOrder(order.id)}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
              title="Delete order"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
