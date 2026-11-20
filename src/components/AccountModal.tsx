'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Lock,
  PhoneCall,
  MapPin,
  ShieldCheck,
  Package,
  Truck,
  Search,
  CheckCircle2,
  Trash2,
  Loader2,
  MessageCircle,
  Receipt,
  Mail,
  Zap,
  RotateCcw,
  Ban,
} from 'lucide-react';
import { MerchantSettings, Order } from '@/types';
import { LocationInfo } from '@/components/LocationModal';
import { InvoiceModal } from '@/components/InvoiceModal';
import {
  getStoredOrders,
  saveStoredOrders,
  lookupOrdersCrossDevice,
  syncOrderStatuses,
} from '@/lib/store';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MerchantSettings;
  currentLocation: LocationInfo;
  onOpenLocationModal: () => void;
  onOpenOrderTracking?: () => void;
  onReorder?: (items: { productId: string; quantity: number }[]) => void;
}

const TIMELINE_STEPS = ['NEW', 'PACKED', 'DISPATCHED', 'DELIVERED'] as const;
const STEP_LABELS: Record<(typeof TIMELINE_STEPS)[number], string> = {
  NEW: 'Placed',
  PACKED: 'Packed',
  DISPATCHED: 'On the way',
  DELIVERED: 'Delivered',
};

export function AccountModal({
  isOpen,
  onClose,
  settings,
  currentLocation,
  onOpenLocationModal,
  onReorder,
}: AccountModalProps) {
  const [activeTab, setActiveTab] = useState<'TRACKING' | 'SETTINGS'>('TRACKING');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [accountBillOrder, setAccountBillOrder] = useState<Order | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setOrders(getStoredOrders());
    syncOrderStatuses().then((updated) => {
      if (updated && updated.length > 0) setOrders(updated);
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !accountBillOrder) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, accountBillOrder, onClose]);

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
    setSearchQuery(val);
    setSearchStatus(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.trim().length >= 4) {
      searchTimeoutRef.current = setTimeout(() => handlePerformLookup(val), 450);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    handlePerformLookup(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchStatus(null);
    setOrders(getStoredOrders());
  };

  if (!isOpen) return null;

  const filteredOrders = searchQuery.trim()
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          o.customerPhone.includes(searchQuery.replace(/\D/g, ''))
      )
    : orders;

  const handleClearLocalData = () => {
    if (window.confirm('Clear order history and saved address from this device?')) {
      try {
        localStorage.removeItem('ayurswift_orders_v1');
        localStorage.removeItem('ayurswift_saved_address');
        setOrders([]);
      } catch {}
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = window.confirm(
      `Cancel Order ${orderId}?\n\nAs this order has not yet been packed by our Bhavnagar dark store, it will be cancelled immediately.`
    );
    if (!confirmed) return;

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
    } catch (err) {
      console.error('Failed to sync cancellation:', err);
    }
  };

  const merchantPhoneClean = (settings.merchantWhatsApp || '919624766242').replace(/\D/g, '');

  return (
    <div
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 animate-sheet-up sm:animate-modal-pop flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img src="/ayurswift-logo.png" alt="AyurSwift" className="h-8 w-auto object-contain" />
            <div className="border-l border-gray-200 pl-3">
              <span className="text-[10px] font-extrabold tracking-widest text-[#0C831F] uppercase block">
                My Account &amp; Orders
              </span>
              <h3 className="text-base font-extrabold text-gray-950 leading-tight">
                Live Dispatch Tracker
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Account Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-gray-100 shrink-0">
          <div className="grid grid-cols-2 bg-gray-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('TRACKING')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'TRACKING'
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-[#0C831F]" />
              <span>My Orders ({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SETTINGS')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'SETTINGS'
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#0C831F]" />
              <span>Store &amp; Privacy</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs text-gray-700 overflow-y-auto thin-scrollbar flex-1 bg-[#F8FAFC]">
          {activeTab === 'TRACKING' ? (
            <div className="space-y-3.5">
              {/* Lookup Form */}
              <form onSubmit={handleSearchSubmit} className="space-y-1.5">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Track by Order ID (#AS-1001) or 10-digit mobile..."
                    className="w-full pl-10 pr-24 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-18 p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-1.5 px-3.5 py-1.5 bg-[#0C831F] hover:bg-[#096B19] text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Track'}
                  </button>
                </div>
                {searchStatus && (
                  <div className="text-[11px] text-[#0C831F] font-semibold px-1 flex items-center gap-1.5">
                    {isSearching && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
                    <span>{searchStatus}</span>
                  </div>
                )}
              </form>

              {filteredOrders.length === 0 ? (
                <div className="py-10 text-center space-y-2.5 bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="w-12 h-12 bg-[#ECFDF3] text-[#0C831F] rounded-2xl flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-gray-950 text-sm">No Orders Found</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Orders you place appear here with live dispatch tracking. You can also search by your 10-digit phone number from any device.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const isCancelled = order.orderStatus === 'CANCELLED';
                    const activeStepIdx = TIMELINE_STEPS.indexOf(
                      order.orderStatus as (typeof TIMELINE_STEPS)[number]
                    );

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-gray-200/90 p-3.5 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0] px-2 py-0.5 rounded-lg">
                              {order.id}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}{' '}
                              •{' '}
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                order.paymentStatus === 'VERIFIED' || order.paymentStatus === 'PAID'
                                  ? 'bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0]'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {order.paymentStatus === 'VERIFIED' || order.paymentStatus === 'PAID'
                                ? '✓ Payment Verified'
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

                        {/* Items Preview */}
                        <div className="bg-[#F8FAFC] rounded-xl p-2.5 border border-gray-100 space-y-1">
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
                            <span className="text-sm text-[#0C831F] tabular-nums">
                              ₹{order.totalAmount}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAccountBillOrder(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-[#0C831F]" />
                            <span>Bill</span>
                          </button>

                          {onReorder && (
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
                          )}

                          <a
                            href={`https://wa.me/${merchantPhoneClean}?text=${encodeURIComponent(
                              `Hi AyurSwift! Regarding Order ${order.id} (${order.customerName}).`
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
          ) : (
            <div className="space-y-3">
              {/* Active Delivery Location */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ECFDF3] text-[#0C831F] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-gray-950">{currentLocation.area}</div>
                    <div className="text-[11px] text-gray-500">{currentLocation.estimate}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLocationModal();
                  }}
                  className="text-xs font-extrabold text-[#0C831F] hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Direct Support */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-4 space-y-2.5">
                <div className="font-extrabold text-gray-950">Bhavnagar Dark Store Desk</div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-[#0C831F]" />
                    <span>+91 96247 66242 (WhatsApp &amp; Helpline)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#0C831F]" />
                    <span>ayurswift.care@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0C831F]" />
                    <span>Direct Zero-Fee UPI: {settings.merchantUpiId}</span>
                  </div>
                </div>
              </div>

              {/* Privacy & Admin */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-gray-950">Device Storage</div>
                    <div className="text-[11px] text-gray-500">
                      Clear saved address &amp; local order cache
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearLocalData}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">Store Owner Portal</span>
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0C831F] hover:underline"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Open Merchant Hub</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <InvoiceModal
        order={accountBillOrder}
        isOpen={Boolean(accountBillOrder)}
        onClose={() => setAccountBillOrder(null)}
        settings={settings}
        initialFormat="A4"
      />
    </div>
  );
}
