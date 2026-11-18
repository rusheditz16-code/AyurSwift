'use client';

import React, { useState } from 'react';
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
  ShieldAlert,
} from 'lucide-react';
import { MerchantSettings, Order } from '@/types';
import { LocationInfo } from '@/components/LocationModal';
import { getStoredOrders, saveStoredOrders } from '@/lib/store';

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

  React.useEffect(() => {
    if (isOpen) {
      setOrders(getStoredOrders());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredOrders = searchQuery.trim()
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customerPhone.includes(searchQuery.trim())
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

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f8f3] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#d6ddce] animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#d6ddce] bg-[#e9efdf] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#1d5a3e] uppercase">
              AyurSwift Account
            </span>
            <h3 className="text-lg font-serif font-bold text-[#143d29]">Orders &amp; Support</h3>
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
              {/* Search Bar for Cross-Device / Order ID Lookup */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#718277] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Track by Order ID (e.g. #AS-1001) or Mobile..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                />
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-10 text-center space-y-3 bg-white rounded-2xl border border-[#d6ddce] p-6 shadow-2xs">
                  <div className="w-12 h-12 bg-[#e9efdf] text-[#1d5a3e] rounded-full flex items-center justify-center mx-auto text-2xl">
                    📦
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#143d29]">No Orders Found</h4>
                  <p className="text-xs text-[#526359] max-w-xs mx-auto leading-relaxed">
                    {searchQuery
                      ? 'No order matches this ID or phone number. Check your order receipt or message our WhatsApp desk.'
                      : 'Orders placed from this device appear here automatically with live fulfillment updates.'}
                  </p>
                  <a
                    href={`https://wa.me/${settings.merchantWhatsApp.replace(/\D/g, '')}?text=Hi%20AyurSwift,%20I%20need%20help%20tracking%20my%20order.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1d5a3e] text-white font-bold rounded-xl text-xs hover:bg-[#143d29] transition-all shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>WhatsApp Order Helpdesk</span>
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const isRapido = order.deliveryType === 'RAPIDO_CITY';
                    const isDispatched = order.orderStatus === 'DISPATCHED' || order.orderStatus === 'DELIVERED';
                    const isDelivered = order.orderStatus === 'DELIVERED';

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
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#143d29]">
                                {order.orderStatus}
                              </span>
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
                              {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid Direct UPI'}
                            </div>
                          </div>
                        </div>

                        {/* Live Fulfillment Timeline */}
                        <div className="p-3 bg-[#f8f8f3] rounded-xl border border-[#d6ddce] space-y-2.5">
                          <div className="text-[10px] font-bold text-[#143d29] uppercase tracking-wider">
                            Live Fulfillment Status
                          </div>

                          <div className="grid grid-cols-3 gap-1 relative text-center">
                            {/* Step 1: Placed */}
                            <div className="space-y-1">
                              <div className="w-7 h-7 mx-auto rounded-full bg-[#1d5a3e] text-white flex items-center justify-center shadow-2xs">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div className="text-[10px] font-bold text-[#143d29]">Order Placed</div>
                              <div className="text-[9px] text-[#526359]">Stock Verified</div>
                            </div>

                            {/* Step 2: Dispatched */}
                            <div className="space-y-1">
                              <div
                                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center shadow-2xs ${
                                  isDispatched ? 'bg-[#1d5a3e] text-white' : 'bg-[#e9efdf] text-[#526359]'
                                }`}
                              >
                                <Truck className="w-4 h-4" />
                              </div>
                              <div className="text-[10px] font-bold text-[#143d29]">
                                {isRapido ? 'Local Express' : 'Courier Sent'}
                              </div>
                              <div className="text-[9px] text-[#526359]">
                                {isDispatched ? 'On the way' : 'Packing in Store'}
                              </div>
                            </div>

                            {/* Step 3: Delivered */}
                            <div className="space-y-1">
                              <div
                                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center shadow-2xs ${
                                  isDelivered ? 'bg-[#1d5a3e] text-white' : 'bg-[#e9efdf] text-[#526359]'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div className="text-[10px] font-bold text-[#143d29]">Delivered</div>
                              <div className="text-[9px] text-[#526359]">
                                {isDelivered ? 'Completed' : isRapido ? 'ETA 30–45m' : '2–4 Days'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Items Preview */}
                        <div className="space-y-1">
                          <div className="text-[10.5px] font-bold text-[#526359] uppercase">Items Ordered:</div>
                          <div className="divide-y divide-[#e9efdf] text-[11px]">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="py-1 flex justify-between">
                                <span className="text-gray-800">
                                  {item.quantity}x {item.name} ({item.packSize})
                                </span>
                                <span className="font-semibold text-gray-900">₹{item.totalPrice}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Address & Actions */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#e9efdf]">
                          <div className="text-[10.5px] text-[#526359] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#1d5a3e] shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {order.deliveryAddress}, {order.city}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/${settings.merchantWhatsApp.replace(/\D/g, '')}?text=Hi%20AyurSwift,%20please%20share%20live%20status%20for%20order%20${order.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-[11px] font-bold text-[#1d5a3e] hover:bg-[#e9efdf] rounded-lg border border-[#d6ddce] flex items-center gap-1 transition-colors"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>WhatsApp Status</span>
                            </a>

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
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#1d5a3e] hover:bg-[#143d29] rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
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
                  <strong className="text-[#143d29] block">100% Private Device Storage (DPDP Compliant)</strong>
                  Your orders remain safely stored on your device. We do not sell personal data, profile medical histories, or expose buyer lists to third-party ad platforms.
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
                    <div className="text-[11px] text-[#1d5a3e] font-semibold">{currentLocation.estimate}</div>
                  </div>
                </div>
              </div>

              {/* Quick Ordering & Support */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs space-y-2.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Direct Store Assistance
                </span>
                <a
                  href={`https://wa.me/${settings.merchantWhatsApp.replace(/\D/g, '')}?text=Hello%20AyurSwift,%20I%20need%20help%20with%20an%20order.`}
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
    </div>
  );
}