'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Lock,
  PhoneCall,
  MapPin,
  Clock,
  ShieldCheck,
  Package,
  Truck,
  ArrowRight,
  Search,
  CheckCircle2,
  RefreshCw,
  Calendar,
  ExternalLink,
  Trash2,
  Loader2,
  MessageCircle,
  AlertCircle,
  Receipt,
  Printer,
  FileText,
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

  // Sync orders and check for real-time status updates on open
  useEffect(() => {
    if (isOpen) {
      const local = getStoredOrders();
      setOrders(local);

      // Fetch live status changes (e.g. PACKED, DISPATCHED, DELIVERED) from server
      syncOrderStatuses().then((updated) => {
        if (updated && updated.length > 0) {
          setOrders(updated);
        }
      });
    }
  }, [isOpen]);

  // Cross-device server lookup handler
  const handlePerformLookup = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) {
      setSearchStatus(null);
      setOrders(getStoredOrders());
      return;
    }

    setIsSearching(true);
    setSearchStatus('Searching store dispatch database...');

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
        const local = getStoredOrders();
        const localMatches = local.filter(
          (o) =>
            o.id.toLowerCase().includes(clean.toLowerCase()) ||
            o.customerPhone.includes(clean)
        );
        if (localMatches.length > 0) {
          setSearchStatus(`Found ${localMatches.length} order(s) on this device`);
        } else {
          setSearchStatus(`No orders found matching "${clean}".`);
        }
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

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce server search if 4+ digits/chars entered
    if (val.trim().length >= 4) {
      searchTimeoutRef.current = setTimeout(() => {
        handlePerformLookup(val);
      }, 500);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
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
      `Cancel Order ${orderId}?\n\nAs this order is in "Order Placed" status and has not yet been packed by our Bhavnagar dark store, cancellation is permitted and your order will be cancelled immediately.`
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
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f8f3] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#d6ddce] animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#d6ddce] bg-[#e9efdf] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/ayurswift-logo.png"
              alt="AyurSwift"
              className="h-8 w-auto object-contain"
            />
            <div className="border-l border-[#d6ddce] pl-2.5">
              <span className="text-[10px] font-bold tracking-widest text-[#1d5a3e] uppercase block">
                Account &amp; Orders
              </span>
              <h3 className="text-base font-serif font-bold text-[#143d29] leading-tight">Live Dispatch Desk</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors shadow-2xs border border-[#d6ddce] cursor-pointer"
            aria-label="Close Account Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#d6ddce] bg-white px-4 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('TRACKING')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'TRACKING'
                ? 'border-[#1d5a3e] text-[#1d5a3e]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>My Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SETTINGS'
                ? 'border-[#1d5a3e] text-[#1d5a3e]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Store &amp; Privacy</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs text-gray-700 overflow-y-auto flex-1">
          {activeTab === 'TRACKING' ? (
            <div className="space-y-4">
              {/* Cross-Device Phone / Order ID Lookup Bar */}
              <form onSubmit={handleSearchSubmit} className="space-y-1.5">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-[#718277] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Enter 10-digit mobile or Order ID (#AS-1001)..."
                    className="w-full pl-9 pr-20 py-2.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e] shadow-2xs placeholder:text-gray-400 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-16 p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      title="Clear Search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-1.5 px-3 py-1.5 bg-[#1d5a3e] hover:bg-[#143d29] text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {isSearching ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span>Track</span>
                    )}
                  </button>
                </div>

                {searchStatus && (
                  <div className="text-[10.5px] text-[#1d5a3e] font-semibold px-1 flex items-center gap-1">
                    {isSearching && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
                    <span>{searchStatus}</span>
                  </div>
                )}
              </form>

              {filteredOrders.length === 0 ? (
                <div className="py-8 text-center space-y-3 bg-white rounded-2xl border border-[#d6ddce] p-6 shadow-2xs">
                  <div className="w-12 h-12 bg-[#e9efdf] text-[#1d5a3e] rounded-full flex items-center justify-center mx-auto text-2xl">
                    📦
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#143d29]">No Orders Found</h4>
                  <p className="text-xs text-[#526359] max-w-xs mx-auto leading-relaxed">
                    {searchQuery
                      ? 'No order matches this ID or mobile number. If you placed an order from another phone or browser, try your 10-digit number.'
                      : 'Orders placed on this device are automatically pinned here with live status updates.'}
                  </p>
                  <a
                    href={`https://wa.me/${merchantPhoneClean}?text=${encodeURIComponent(
                      searchQuery
                        ? `Hi AyurSwift, please share live dispatch status for Order / Phone: ${searchQuery}`
                        : 'Hi AyurSwift, please share live dispatch status for my order.'
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1d5a3e] text-white font-bold rounded-xl text-xs hover:bg-[#143d29] transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Track via WhatsApp Desk</span>
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const isRapido = order.deliveryType === 'RAPIDO_CITY';
                    const status = order.orderStatus; // 'NEW' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'

                    // 4-Stage Blinkit/Zepto Timeline Definition
                    const stages = [
                      {
                        key: 'ORDER_PLACED',
                        label: 'Order Placed',
                        sub: 'Verified Stock',
                        icon: CheckCircle2,
                        isDone: true,
                        isCurrent: status === 'NEW',
                      },
                      {
                        key: 'DARK_STORE_PACKING',
                        label: 'Dark Store Packing',
                        sub:
                          status === 'NEW'
                            ? 'Packing in Queue'
                            : 'Packed & Sanitized',
                        icon: Package,
                        isDone:
                          status === 'PACKED' ||
                          status === 'DISPATCHED' ||
                          status === 'DELIVERED',
                        isCurrent: status === 'PACKED',
                      },
                      {
                        key: 'RIDER_DISPATCHED',
                        label: isRapido ? 'Rider Dispatched' : 'Courier Dispatched',
                        sub: isRapido
                          ? status === 'DISPATCHED'
                            ? 'On Rapido Bike'
                            : 'Rapido Express'
                          : 'In Courier Transit',
                        icon: Truck,
                        isDone:
                          status === 'DISPATCHED' || status === 'DELIVERED',
                        isCurrent: status === 'DISPATCHED',
                      },
                      {
                        key: 'DELIVERED',
                        label: 'Delivered',
                        sub:
                          status === 'DELIVERED'
                            ? 'Handed Over'
                            : isRapido
                            ? 'ETA 30–45m'
                            : 'ETA 2–4 Days',
                        icon: CheckCircle2,
                        isDone: status === 'DELIVERED',
                        isCurrent: status === 'DELIVERED',
                      },
                    ];

                    const waTrackMessage = `Hi AyurSwift, please share live dispatch status for Order ${order.id}`;
                    const waTrackUrl = `https://wa.me/${merchantPhoneClean}?text=${encodeURIComponent(
                      waTrackMessage
                    )}`;

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-[#d6ddce] p-4 shadow-2xs space-y-3.5"
                      >
                        {/* Summary Header */}
                        <div className="flex items-center justify-between border-b border-[#e9efdf] pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs bg-[#e9efdf] text-[#1d5a3e] px-2 py-0.5 rounded-md">
                                {order.id}
                              </span>
                              <button
                                onClick={() => setAccountBillOrder(order)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1d5a3e]/10 text-[#1d5a3e] hover:bg-[#1d5a3e]/20 border border-[#1d5a3e]/20 flex items-center gap-1 transition-colors cursor-pointer"
                                title="View and Print Official Tax Invoice"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Print Bill</span>
                              </button>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  status === 'DELIVERED'
                                    ? 'bg-emerald-100 text-[#143d29]'
                                    : status === 'DISPATCHED'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-[#e9efdf] text-[#1d5a3e]'
                                }`}
                              >
                                {status === 'NEW'
                                  ? 'PACKING'
                                  : status === 'PACKED'
                                  ? 'READY'
                                  : status}
                              </span>
                              {isRapido && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  ⚡ 30–45m
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-[#526359] mt-1 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(order.createdAt).toLocaleDateString()} at{' '}
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-sm text-[#143d29]">
                              ₹{order.totalAmount}
                            </div>
                            <div className="text-[10px] text-[#526359]">
                              {order.paymentMethod === 'COD'
                                ? 'Cash on Delivery'
                                : 'Prepaid Direct UPI'}
                            </div>
                          </div>
                        </div>

                        {/* 4-Step Blinkit/Zepto Live Fulfillment Timeline */}
                        <div className="p-3.5 bg-[#f8f8f3] rounded-xl border border-[#d6ddce] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] font-bold text-[#143d29] uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#1d5a3e] animate-pulse" />
                              <span>Live Fulfillment Timeline</span>
                            </div>
                            <span className="text-[10px] text-[#526359] font-medium">
                              Bhavnagar Dark Store
                            </span>
                          </div>

                          {/* 4 Steps Grid */}
                          <div className="grid grid-cols-4 gap-1 relative text-center pt-1">
                            {/* Connecting line */}
                            <div className="absolute top-4.5 left-[12%] right-[12%] h-[2px] bg-[#d6ddce] -z-0">
                              <div
                                className="h-full bg-[#1d5a3e] transition-all duration-300"
                                style={{
                                  width:
                                    status === 'DELIVERED'
                                      ? '100%'
                                      : status === 'DISPATCHED'
                                      ? '66%'
                                      : status === 'PACKED'
                                      ? '33%'
                                      : '0%',
                                }}
                              />
                            </div>

                            {stages.map((stage) => {
                              const StageIcon = stage.icon;
                              return (
                                <div
                                  key={stage.key}
                                  className="relative z-10 flex flex-col items-center"
                                >
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                      stage.isDone
                                        ? 'bg-[#1d5a3e] text-white shadow-2xs'
                                        : 'bg-white text-gray-400 border border-[#d6ddce]'
                                    } ${
                                      stage.isCurrent
                                        ? 'ring-2 ring-[#1d5a3e] ring-offset-2 ring-offset-[#f8f8f3]'
                                        : ''
                                    }`}
                                  >
                                    <StageIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="mt-1 text-[9.5px] font-bold text-[#143d29] leading-tight line-clamp-1">
                                    {stage.label}
                                  </div>
                                  <div className="text-[8px] text-[#526359] leading-tight mt-0.5 line-clamp-1">
                                    {stage.sub}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Items Preview */}
                        <div className="space-y-1">
                          <div className="text-[10.5px] font-bold text-[#526359] uppercase">
                            Items Ordered:
                          </div>
                          <div className="divide-y divide-[#e9efdf] text-[11px]">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="py-1 flex justify-between">
                                <span className="text-gray-800">
                                  {item.quantity}x {item.name} ({item.packSize})
                                </span>
                                <span className="font-semibold text-gray-900">
                                  ₹{item.totalPrice}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Cancellation & Hygiene Status Block */}
                        {status === 'NEW' && (
                          <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/90 px-3 py-2 rounded-xl text-[10.5px]">
                            <span className="text-amber-900 font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Order Placed • <strong>Free cancellation available</strong> before dark store packing</span>
                            </span>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-rose-700 hover:text-rose-900 font-bold px-2 py-0.5 rounded-md bg-rose-100 hover:bg-rose-200 transition-colors cursor-pointer text-[10px] shrink-0 ml-2"
                              title="Cancel order before packing begins"
                            >
                              Cancel Order
                            </button>
                          </div>
                        )}

                        {status === 'PACKED' && (
                          <div className="flex items-center gap-1.5 bg-[#e9efdf] border border-[#d6ddce] px-3 py-1.5 rounded-xl text-[10.5px] text-[#143d29]">
                            <Lock className="w-3.5 h-3.5 text-[#1d5a3e] shrink-0" />
                            <span>
                              <strong>Order Packed &amp; Sealed:</strong> Cancellation closed to maintain Ayurvedic hygiene &amp; medication safety.
                            </span>
                          </div>
                        )}

                        {status === 'DISPATCHED' && (
                          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-[10.5px] text-blue-900">
                            <Truck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>
                              <strong>Dispatched via {isRapido ? 'Rapido Bike' : 'Courier'}:</strong> On the way. Cancellation closed.
                            </span>
                          </div>
                        )}

                        {status === 'CANCELLED' && (
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-[10.5px] text-rose-800 font-bold">
                            <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Order Cancelled • Stock returned to dark store</span>
                          </div>
                        )}

                        {/* Address & 1-Tap WhatsApp Desk Action */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-[#e9efdf]">
                          <div className="text-[10.5px] text-[#526359] flex items-center gap-1 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-[#1d5a3e] shrink-0" />
                            <span className="truncate">
                              {order.deliveryAddress}, {order.city}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* View & Print Bill */}
                            <button
                              onClick={() => setAccountBillOrder(order)}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-[#1d5a3e] bg-[#e9efdf] hover:bg-[#d6ddce] rounded-xl border border-[#1d5a3e]/30 flex items-center gap-1 transition-colors cursor-pointer"
                              title="View and Print Standard Tax Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print Bill</span>
                            </button>

                            {/* 1-Tap WhatsApp Live Status Desk */}
                            <a
                              href={waTrackUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 text-[11px] font-bold text-white bg-[#1d5a3e] hover:bg-[#143d29] rounded-xl flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                              title="Ask live ETA and rider dispatch on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Track via WhatsApp Desk</span>
                            </a>

                            {status === 'NEW' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Cancel order before packing begins"
                              >
                                <X className="w-3 h-3" />
                                <span>Cancel</span>
                              </button>
                            )}

                            {onReorder && (
                              <button
                                onClick={() => {
                                  onReorder(
                                    order.items.map((i) => ({
                                      productId: i.productId,
                                      quantity: i.quantity,
                                    }))
                                  );
                                  onClose();
                                }}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-[#1d5a3e] hover:bg-[#e9efdf] rounded-xl border border-[#d6ddce] flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Reorder</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Data Safety & Privacy Reassurance Card */}
              <div className="p-3 bg-[#e9efdf] rounded-2xl border border-[#d6ddce] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1d5a3e] shrink-0 mt-0.5" />
                <div className="text-[11px] text-gray-700 leading-relaxed">
                  <strong className="text-[#143d29] block">
                    100% Private Device Storage (DPDP Compliant)
                  </strong>
                  Your orders remain safely stored on your device. Zero Google login required, no third-party tracking, and your health purchases are never exposed or profiled.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Delivery Location card */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Current Delivery Area
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenLocationModal();
                    }}
                    className="text-[11px] font-bold text-[#1d5a3e] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                <div className="flex items-center gap-2 text-gray-900">
                  <MapPin className="w-4 h-4 text-[#1d5a3e] shrink-0" />
                  <div>
                    <div className="font-bold">{currentLocation.area}</div>
                    <div className="text-[11px] text-[#1d5a3e] font-semibold">
                      {currentLocation.estimate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Ordering & Support */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs space-y-2.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Direct Store Assistance
                </span>
                <a
                  href={`https://wa.me/${merchantPhoneClean}?text=${encodeURIComponent(
                    'Hello AyurSwift, I need help with an order.'
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#e9efdf] hover:bg-[#dfe7d2] text-[#143d29] font-bold transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-[#1d5a3e]" />
                    <div>
                      <div className="font-bold">WhatsApp / Call Desk</div>
                      <div className="text-[10px] text-[#526359]">+91 96247 66242</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                </a>

                <div className="flex items-center gap-2 text-[11px] text-gray-600 pt-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Fulfillment hours: 9:00 AM – 9:30 PM (Daily)</span>
                </div>
              </div>

              {/* Order Cancellation & Hygiene Policy */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#c86326]" />
                  <span className="text-[11px] font-bold text-[#143d29] uppercase tracking-wider">
                    Cancellation &amp; Hygiene Policy
                  </span>
                </div>
                <div className="text-[11px] text-gray-700 space-y-2 leading-relaxed">
                  <div className="flex items-start gap-2 bg-[#f8f8f3] p-2 rounded-xl border border-[#d6ddce]">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#1d5a3e] flex items-center justify-center shrink-0 font-bold text-xs">✓</span>
                    <div>
                      <strong className="text-[#143d29] block">Before Packing (Allowed):</strong>
                      You can cancel your order for free with 1 tap from the &quot;My Orders&quot; tab while it is in the <em>&quot;Order Placed&quot;</em> queue.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-[#f8f8f3] p-2 rounded-xl border border-[#d6ddce]">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold text-xs">✕</span>
                    <div>
                      <strong className="text-[#143d29] block">After Packing / Dispatched (Strictly Closed):</strong>
                      Once medicines are picked, sanitized, and sealed in tamper-evident packaging at our Bhavnagar dark store, cancellations cannot be accepted to prevent Ayurvedic medicine contamination and health violations.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-[#f8f8f3] p-2 rounded-xl border border-[#d6ddce]">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs">₹</span>
                    <div>
                      <strong className="text-[#143d29] block">Prepaid UPI Refunds:</strong>
                      If a prepaid UPI order is cancelled before packing, a 100% refund is initiated back to your original UPI account within 2–4 hours.
                    </div>
                  </div>
                </div>
              </div>

              {/* Data & Privacy Control */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs space-y-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Data Protection &amp; Privacy
                </span>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  AyurSwift adheres to strict data minimization. You can clear your cached device address and order records at any time.
                </p>
                {orders.length > 0 && (
                  <button
                    onClick={handleClearLocalData}
                    className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1.5 pt-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Device History</span>
                  </button>
                )}
              </div>

              {/* Merchant Admin Portal Link */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Store Administration
                </span>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:border-[#1d5a3e] transition-colors"
                >
                  <div className="flex items-center gap-2 text-gray-800 font-semibold">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span>Merchant Hub (Inventory &amp; Orders)</span>
                  </div>
                  <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded">
                    PIN
                  </span>
                </Link>
              </div>

              {/* Note */}
              <div className="flex items-center gap-2 text-[10.5px] text-gray-500 px-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1d5a3e] shrink-0" />
                <span>AyurSwift Home Dark Store • Bhavnagar, Gujarat</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Tax Invoice & Bill Modal */}
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
