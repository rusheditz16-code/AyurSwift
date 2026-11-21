'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Package, Search, Loader2, RefreshCw } from 'lucide-react';
import { Order, MerchantSettings } from '@/types';
import { InvoiceModal } from '@/components/InvoiceModal';
import { CustomerOrderCard } from '@/components/CustomerOrderCard';
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

export function OrderTrackingModal({
  isOpen,
  onClose,
  settings,
  onReorder,
}: OrderTrackingModalProps) {
  const [searchId, setSearchId] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedLabel, setLastSyncedLabel] = useState('just now');
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [viewingBillOrder, setViewingBillOrder] = useState<Order | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const updated = await syncOrderStatuses();
      setOrders(updated);
      setLastSyncedLabel(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata',
        })
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setOrders(getStoredOrders());
    handleManualRefresh();

    // Visibility-aware 15s live auto-refresh while open
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        handleManualRefresh();
      }
    }, 15000);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !viewingBillOrder) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, viewingBillOrder, onClose, handleManualRefresh]);

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
    const target = orders.find((o) => o.id === orderId);
    if (!window.confirm(`Cancel Order ${orderId}?`)) return;

    let phoneToVerify = (target?.customerPhone || '').replace(/\D/g, '');
    if (phoneToVerify.length !== 10) {
      const entered = window.prompt(
        'For your security, enter the 10-digit mobile number used for this order:'
      );
      if (!entered) return;
      phoneToVerify = entered.replace(/\D/g, '').slice(-10);
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderStatus: 'CANCELLED',
          customerPhone: phoneToVerify,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        window.alert(data.error || 'Could not cancel order. Please verify your mobile number.');
        return;
      }

      const updated = orders.map((o) =>
        o.id === orderId ? { ...o, orderStatus: 'CANCELLED' as const } : o
      );
      setOrders(updated);
      saveStoredOrders(updated);
    } catch {
      window.alert('Network error while cancelling order. Please try again.');
    }
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
              <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live • Updated {lastSyncedLabel}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-2.5 py-1.5 rounded-full bg-[#ECFDF3] hover:bg-[#DCFCE7] text-[#0C831F] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Refresh live status"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
              aria-label="Close tracking"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
                placeholder="Order ID (#AS-7K4M9X2P) or 10-digit mobile..."
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
                Place an order or search with your full Order ID or 10-digit phone number to view live dispatch progress.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <CustomerOrderCard
                  key={order.id}
                  order={order}
                  settings={settings}
                  merchantPhoneClean={merchantPhoneClean}
                  onViewBill={(ord) => setViewingBillOrder(ord)}
                  onReorder={(items) => {
                    onReorder(items);
                    onClose();
                  }}
                  onCancelOrder={handleCancelOrder}
                  onOrderUpdated={(updatedOrder) => {
                    setOrders((prev) =>
                      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                    );
                  }}
                />
              ))}
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
