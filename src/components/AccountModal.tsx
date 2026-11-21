'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  Lock,
  PhoneCall,
  MapPin,
  ShieldCheck,
  Package,
  Search,
  CheckCircle2,
  Trash2,
  Loader2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { MerchantSettings, Order } from '@/types';
import { LocationInfo } from '@/components/LocationModal';
import { InvoiceModal } from '@/components/InvoiceModal';
import { CustomerOrderCard } from '@/components/CustomerOrderCard';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedLabel, setLastSyncedLabel] = useState('just now');
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [accountBillOrder, setAccountBillOrder] = useState<Order | null>(null);
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

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        handleManualRefresh();
      }
    }, 15000);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !accountBillOrder) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, accountBillOrder, onClose, handleManualRefresh]);

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
    const target = orders.find((o) => o.id === orderId);
    const confirmed = window.confirm(
      `Cancel Order ${orderId}?\n\nAs this order has not yet been packed by our Bhavnagar dark store, it will be cancelled immediately.`
    );
    if (!confirmed) return;

    let phoneToVerify = (target?.customerPhone || '').replace(/\D/g, '');
    if (phoneToVerify.length !== 10) {
      const entered = window.prompt(
        'For your security, please enter the 10-digit mobile number used for this order:'
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

  const handleRequestServerErasure = async () => {
    const orderId = window.prompt(
      'Enter the exact Order ID of your delivered/cancelled order to erase your personal details from our servers (e.g. #AS-7K4M9X2P):'
    );
    if (!orderId || !orderId.trim()) return;
    const phone = window.prompt(
      'Enter the 10-digit mobile number used for that order to verify ownership:'
    );
    if (!phone || !phone.trim()) return;

    try {
      const res = await fetch('/api/privacy/erase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId.trim(),
          customerPhone: phone.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        window.alert(data.error || 'Unable to erase data for that order.');
        return;
      }
      window.alert(data.message || 'Personal details erased from our servers.');
    } catch {
      window.alert('Network error while submitting erasure request.');
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
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium px-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live • Updated {lastSyncedLabel}</span>
                </span>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="text-[#0C831F] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Lookup Form */}
              <form onSubmit={handleSearchSubmit} className="space-y-1.5">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Order ID (#AS-7K4M9X2P) or 10-digit mobile..."
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
                    Orders you place appear here with live dispatch tracking. You can also search by your full Order ID or 10-digit phone number from any device.
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
                      onViewBill={(ord) => setAccountBillOrder(ord)}
                      onReorder={
                        onReorder
                          ? (items) => {
                              onReorder(items);
                              onClose();
                            }
                          : undefined
                      }
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

                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-gray-950">Server Data Erasure (DPDP)</div>
                    <div className="text-[11px] text-gray-500">
                      Erase your name, phone &amp; address from a completed order
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestServerErasure}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] shrink-0 cursor-pointer"
                  >
                    Erase Data
                  </button>
                </div>

                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-3 font-semibold">
                    <Link href="/privacy" onClick={onClose} className="text-[#0C831F] hover:underline">
                      Privacy Policy
                    </Link>
                    <Link href="/terms" onClick={onClose} className="text-[#0C831F] hover:underline">
                      Terms &amp; Refunds
                    </Link>
                  </div>
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0C831F] hover:underline"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Merchant Hub</span>
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
