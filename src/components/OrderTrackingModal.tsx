'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Package,
  Truck,
  Search,
  Loader2,
  MessageCircle,
  Receipt,
  RotateCcw,
  Zap,
  Ban,
} from 'lucide-react';
import { Order, MerchantSettings } from '@/types';
import { InvoiceModal } from '@/components/InvoiceModal';
import {
  getStoredOrders,
  saveStoredOrders,
  lookupOrdersCrossDevice,
  syncOrderStatuses,
} from '@/lib/store';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MerchantSettings;
  onReorder: (items: { productId: string; quantity: number }[]) => void;
}

const TIMELINE_STEPS = ['NEW', 'PACKED', 'DISPATCHED', 'DELIVERED'] as const;
const STEP_LABELS: Record<(typeof TIMELINE_STEPS)[number], string> = {
  NEW: 'Placed',
  PACKED: 'Packed',
  DISPATCHED: 'On the way',
  DELIVERED: 'Delivered',
};

export function OrderTrackingModal({
  isOpen,
  onClose,
  settings,
  onReorder,
}: OrderTrackingModalProps) {
  const [searchId, setSearchId] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [viewingBillOrder, setViewingBillOrder] = useState<Order | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setOrders(getStoredOrders());
    syncOrderStatuses().then((updated) => {
      if (updated && updated.length > 0) setOrders(updated);
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !viewingBillOrder) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, viewingBillOrder, onClose]);

  const handlePerformLookup = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) {
      setSearchStatus(null);
      setOrders(getStoredOrders());
      return;
    }

    setIsSearching(true);
    setSearchStatus('Searching live store dispatch database...');
    try {
      const results = await lookupOrdersCrossDevice(clean);
      if (results && results.length > 0) {
        setOrders((prev) => {
          const map = new Map<string, Order>();
          prev.forEach((o) => map.set(o.id, o));
          results.forEach((o: Order) => map.set(o.id, o));
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setSearchStatus(`Found ${results.length} order(s) for "${clean}"`);
      } else {
        const localMatches = getStoredOrders().filter(
          (o) =>
            o.id.toLowerCase().includes(clean.toLowerCase()) ||
            o.customerPhone.includes(clean.replace(/\D/g, ''))
        );
        setSearchStatus(
          localMatches.length > 0
            ? `Found ${localMatches.length} order(s) on this device`
            : `No orders found matching "${clean}".`
        );
      }
    } catch {
      setSearchStatus('Lookup completed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchId(val);
    setSearchStatus(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.trim().length >= 4) {
      searchTimeoutRef.current = setTimeout(() => handlePerformLookup(val), 450);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm(`Cancel Order ${orderId}?`)) return;
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, orderStatus: 'CANCELLED' as const } : o
    );
    setOrders(updated);
    saveStoredOrders(updated);
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderStatus: 'CANCELLED' }),
      });
    } catch {}
  };

  if (!isOpen) return null;

  const filteredOrders = searchId.trim()
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(searchId.toLowerCase().trim()) ||
          o.customerPhone.includes(searchId.replace(/\D/g, ''))
      )
    : orders;

  const merchantPhoneClean = (settings.merchantWhatsApp || '919624766242').replace(/\D/g, '');

  return (
    <div
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 animate-sheet-up sm:animate-modal-pop flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF3] border border-[#BBF7D0] text-[#0C831F] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-950 text-base">Live Order Tracking</h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Real-time dark-store packing &amp; Rapido dispatch updates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
            aria-label="Close tracking"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto thin-scrollbar flex-1 bg-[#F8FAFC]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePerformLookup(searchId);
            }}
            className="space-y-1.5"
          >
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Order ID (#AS-1001) or 10-digit phone..."
                className="w-full pl-10 pr-24 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15 font-medium"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 px-3.5 py-1.5 bg-[#0C831F] hover:bg-[#096B19] text-white font-bold rounded-lg text-[11px] cursor-pointer disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Track'}
              </button>
            </div>
            {searchStatus && (
              <div className="text-[11px] text-[#0C831F] font-semibold px-1">{searchStatus}</div>
            )}
          </form>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF3] text-[#0C831F] flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm text-gray-950">No Orders Yet</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Place an order or search with your phone number to view live dispatch progress.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isCancelled = order.orderStatus === 'CANCELLED';
                const activeIdx = TIMELINE_STEPS.indexOf(
                  order.orderStatus as (typeof TIMELINE_STEPS)[number]
                );

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-200/90 p-3.5 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
                      <span className="font-mono font-extrabold text-xs bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0] px-2 py-0.5 rounded-lg">
                        {order.id}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isCancelled
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : order.orderStatus === 'DELIVERED'
                            ? 'bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0]'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>

                    {!isCancelled && (
                      <div className="grid grid-cols-4 gap-1.5">
                        {TIMELINE_STEPS.map((step, idx) => {
                          const done = idx <= activeIdx;
                          return (
                            <div key={step} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full ${
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

                    <div className="bg-[#F8FAFC] rounded-xl p-2.5 border border-gray-100 space-y-1 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-gray-700">
                          <span className="truncate pr-2">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-bold text-gray-900 tabular-nums">
                            ₹{item.totalPrice}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200/70 pt-1.5 flex items-center justify-between font-extrabold">
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          {order.deliveryType === 'RAPIDO_CITY' ? (
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                          ) : (
                            <Truck className="w-3 h-3 text-[#0C831F]" />
                          )}
                          <span>{order.paymentMethod}</span>
                        </span>
                        <span className="text-sm text-[#0C831F] tabular-nums">
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingBillOrder(order)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#0C831F]" />
                        <span>Bill</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onReorder(
                            order.items.map((i) => ({
                              productId: i.productId,
                              quantity: i.quantity,
                            }))
                          );
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#ECFDF3] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#0C831F] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>

                      <a
                        href={`https://wa.me/${merchantPhoneClean}?text=${encodeURIComponent(
                          `Hi AyurSwift! Tracking inquiry for Order ${order.id}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-[11px] flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Support</span>
                      </a>

                      {order.orderStatus === 'NEW' && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order.id)}
                          className="ml-auto px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <InvoiceModal
        order={viewingBillOrder}
        isOpen={Boolean(viewingBillOrder)}
        onClose={() => setViewingBillOrder(null)}
        settings={settings}
        initialFormat="A4"
      />
    </div>
  );
}
