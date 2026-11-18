'use client';

import React, { useState } from 'react';
import {
  X,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  PhoneCall,
  Search,
  RefreshCw,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Order, MerchantSettings, Product } from '@/types';
import { getStoredOrders } from '@/lib/store';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MerchantSettings;
  onReorder: (items: { productId: string; quantity: number }[]) => void;
}

export function OrderTrackingModal({
  isOpen,
  onClose,
  settings,
  onReorder,
}: OrderTrackingModalProps) {
  const [searchId, setSearchId] = useState('');
  const orders = getStoredOrders();

  if (!isOpen) return null;

  const filteredOrders = searchId.trim()
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(searchId.toLowerCase()) ||
          o.customerPhone.includes(searchId)
      )
    : orders;

  const latestOrder = filteredOrders[0] || null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f8f3] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#d6ddce] animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#d6ddce] flex items-center justify-between bg-[#e9efdf] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1d5a3e] text-white flex items-center justify-center shadow-2xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#143d29] text-base">
                Track Order &amp; History
              </h3>
              <p className="text-[11px] text-[#1d5a3e] font-semibold">
                Live dispatch updates from Bhavnagar dark store
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors shadow-2xs border border-[#d6ddce]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Search by Order ID */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#718277] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Search by Order ID (e.g. #AS-1001) or Phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-white rounded-2xl border border-[#d6ddce] p-6">
              <div className="w-12 h-12 bg-[#e9efdf] text-[#1d5a3e] rounded-full flex items-center justify-center mx-auto text-2xl">
                📦
              </div>
              <h4 className="font-serif font-bold text-sm text-[#143d29]">No Orders Found</h4>
              <p className="text-xs text-[#526359] max-w-xs mx-auto">
                Orders placed from this browser appear here automatically with live tracking status.
              </p>
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
                    {/* Order summary header */}
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
                        <div className="text-[10px] text-[#526359] mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-sm text-[#143d29]">
                          ₹{order.totalAmount}
                        </div>
                        <div className="text-[10px] text-[#526359]">
                          {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Direct UPI'}
                        </div>
                      </div>
                    </div>

                    {/* Blinkit-style Live Tracking Timeline */}
                    <div className="p-3 bg-[#f8f8f3] rounded-xl border border-[#d6ddce] space-y-2.5">
                      <div className="text-[10.5px] font-bold text-[#143d29] uppercase tracking-wider">
                        Live Fulfillment Status
                      </div>

                      <div className="grid grid-cols-3 gap-1 relative text-center">
                        {/* Step 1: Placed */}
                        <div className="space-y-1">
                          <div className="w-7 h-7 mx-auto rounded-full bg-[#1d5a3e] text-white flex items-center justify-center shadow-2xs">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="text-[10px] font-bold text-[#143d29]">Order Placed</div>
                          <div className="text-[8.5px] text-[#526359]">Verified Stock</div>
                        </div>

                        {/* Step 2: Dispatched */}
                        <div className="space-y-1">
                          <div
                            className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center shadow-2xs ${
                              isDispatched
                                ? 'bg-[#1d5a3e] text-white'
                                : 'bg-[#e9efdf] text-[#526359]'
                            }`}
                          >
                            <Truck className="w-4 h-4" />
                          </div>
                          <div className="text-[10px] font-bold text-[#143d29]">
                            {isRapido ? 'Rapido Rider' : 'Courier Sent'}
                          </div>
                          <div className="text-[8.5px] text-[#526359]">
                            {isDispatched ? 'On the way' : 'Packing at Dark Store'}
                          </div>
                        </div>

                        {/* Step 3: Delivered */}
                        <div className="space-y-1">
                          <div
                            className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center shadow-2xs ${
                              isDelivered
                                ? 'bg-[#1d5a3e] text-white'
                                : 'bg-[#e9efdf] text-[#526359]'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="text-[10px] font-bold text-[#143d29]">Delivered</div>
                          <div className="text-[8.5px] text-[#526359]">
                            {isDelivered ? 'Drop Complete' : 'Estimated 30-45m'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
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
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-[#e9efdf]">
                      <div className="text-[10.5px] text-[#526359] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#1d5a3e] shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {order.deliveryAddress}, {order.city}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${settings.merchantWhatsApp}?text=Hi%20AyurSwift,%20I%20am%20checking%20status%20for%20order%20${order.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] font-bold text-[#1d5a3e] hover:bg-[#e9efdf] rounded-lg border border-[#d6ddce] flex items-center gap-1 transition-colors"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>WhatsApp Support</span>
                        </a>

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
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#1d5a3e] hover:bg-[#143d29] rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
