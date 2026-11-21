'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Search,
  PhoneCall,
  Loader2,
  CheckCircle2,
  Printer,
  Zap,
  Package,
} from 'lucide-react';
import { DeliveryType, MerchantSettings, Order, PaymentMethod, Product } from '@/types';

interface AdminCreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: MerchantSettings;
  onOrderCreated: (order: Order) => void;
  onPrintBill: (order: Order) => void;
  dark: boolean;
}

export function AdminCreateOrderModal({
  isOpen,
  onClose,
  products,
  settings,
  onOrderCreated,
  onPrintBill,
  dark,
}: AdminCreateOrderModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('RAPIDO_CITY');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState('Bhavnagar');
  const [pincode, setPincode] = useState('364001');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [adminNote, setAdminNote] = useState('WhatsApp / Phone order');
  const [skuSearch, setSkuSearch] = useState('');
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const availableProducts = useMemo(() => {
    const q = skuSearch.trim().toLowerCase();
    return products
      .filter((p) => p.isLive && p.stockQuantity > 0)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [products, skuSearch]);

  const selectedItems = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return Object.entries(selectedQty)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ product: map.get(id), qty }))
      .filter((x): x is { product: Product; qty: number } => Boolean(x.product));
  }, [selectedQty, products]);

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.qty,
    0
  );
  const deliveryFee =
    selectedItems.length === 0
      ? 0
      : deliveryType === 'RAPIDO_CITY'
      ? subtotal >= settings.cityFreeDeliveryAbove
        ? 0
        : settings.cityDeliveryFee
      : settings.courierDeliveryFee;
  const estimatedTotal = subtotal + deliveryFee;

  if (!isOpen) return null;

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryType('RAPIDO_CITY');
    setDeliveryAddress('');
    setCity('Bhavnagar');
    setPincode('364001');
    setPaymentMethod('UPI');
    setAdminNote('WhatsApp / Phone order');
    setSkuSearch('');
    setSelectedQty({});
    setErrorMsg(null);
    setCreatedOrder(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChangeDelivery = (nextType: DeliveryType) => {
    setDeliveryType(nextType);
    if (nextType === 'COURIER_OUTSIDE' && paymentMethod === 'COD') {
      setPaymentMethod('UPI');
    }
  };

  const adjustQty = (product: Product, delta: number) => {
    setSelectedQty((prev) => {
      const curr = prev[product.id] || 0;
      const next = Math.max(0, Math.min(Math.min(20, product.stockQuantity), curr + delta));
      const copy = { ...prev };
      if (next === 0) delete copy[product.id];
      else copy[product.id] = next;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (selectedItems.length === 0) {
      setErrorMsg('Select at least 1 medicine SKU to create the order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.replace(/\D/g, '').slice(-10),
          deliveryType,
          deliveryAddress: deliveryAddress.trim(),
          city: city.trim(),
          pincode: pincode.replace(/\D/g, '').slice(0, 6),
          paymentMethod,
          adminNote: adminNote.trim() || undefined,
          items: selectedItems.map((i) => ({
            productId: i.product.id,
            quantity: i.qty,
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        order?: Order;
        error?: string;
      };

      if (!res.ok || !data.success || !data.order) {
        setErrorMsg(data.error || 'Could not create order. Please check all fields.');
        return;
      }

      setCreatedOrder(data.order);
      onOrderCreated(data.order);
    } catch {
      setErrorMsg('Network error creating order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const surface = dark
    ? 'bg-[#111827] border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const inputCls = `w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:border-[#0C831F] ${
    dark
      ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400'
  }`;
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className="fixed inset-0 z-70 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${surface}`}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-500/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0] flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Log Phone / WhatsApp Order
              </h3>
              <p className={`text-[11px] ${muted}`}>
                Authoritative server pricing, live stock deduction &amp; instant invoice
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-500/10 hover:bg-slate-500/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdOrder ? (
          <div className="p-6 space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="font-mono font-extrabold text-sm text-[#0C831F]">
                Order {createdOrder.id} Created!
              </div>
              <p className={`text-xs ${muted}`}>
                {createdOrder.customerName} • ₹{createdOrder.totalAmount} ({createdOrder.paymentMethod})
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onPrintBill(createdOrder);
                  handleClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Bill</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-xs font-bold cursor-pointer"
              >
                Create Another Order
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-500/20 text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto thin-scrollbar p-5 space-y-4">
            {/* Customer & Delivery Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">10-Digit Mobile *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  required
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold mb-1">Delivery Address *</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House/Flat no, Street, Society..."
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">6-Digit Pincode *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className={inputCls}
                />
              </div>
            </div>

            {/* Delivery Type & Payment Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold mb-1">Delivery Channel</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleChangeDelivery('RAPIDO_CITY')}
                    className={`p-2 rounded-xl border text-left text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                      deliveryType === 'RAPIDO_CITY'
                        ? 'border-[#0C831F] bg-[#ECFDF3] text-[#0C831F]'
                        : 'border-slate-500/20'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Rapido City</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeDelivery('COURIER_OUTSIDE')}
                    className={`p-2 rounded-xl border text-left text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                      deliveryType === 'COURIER_OUTSIDE'
                        ? 'border-[#0C831F] bg-[#ECFDF3] text-[#0C831F]'
                        : 'border-slate-500/20'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Courier</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Payment Mode</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-2 rounded-xl border text-center text-[11px] font-bold cursor-pointer ${
                      paymentMethod === 'UPI'
                        ? 'border-[#0C831F] bg-[#ECFDF3] text-[#0C831F]'
                        : 'border-slate-500/20'
                    }`}
                  >
                    Prepaid UPI
                  </button>
                  <button
                    type="button"
                    disabled={deliveryType === 'COURIER_OUTSIDE'}
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-2 rounded-xl border text-center text-[11px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      paymentMethod === 'COD'
                        ? 'border-[#0C831F] bg-[#ECFDF3] text-[#0C831F]'
                        : 'border-slate-500/20'
                    }`}
                  >
                    Cash (COD)
                  </button>
                </div>
              </div>
            </div>

            {/* Product Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold">
                  Select Medicines ({selectedItems.length} selected)
                </label>
                <div className="relative w-52">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                  <input
                    type="text"
                    value={skuSearch}
                    onChange={(e) => setSkuSearch(e.target.value)}
                    placeholder="Filter medicines..."
                    className="w-full pl-8 pr-2.5 py-1 text-[11px] rounded-lg border border-slate-500/25 bg-transparent focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
              </div>

              <div className="max-h-44 overflow-y-auto thin-scrollbar rounded-xl border border-slate-500/20 divide-y divide-slate-500/10">
                {availableProducts.map((p) => {
                  const qty = selectedQty[p.id] || 0;
                  return (
                    <div
                      key={p.id}
                      className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">{p.name}</div>
                        <div className={`text-[10.5px] ${muted}`}>
                          {p.packSize} • ₹{p.sellingPrice} • Stock: {p.stockQuantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => adjustQty(p, -1)}
                          className="w-6 h-6 rounded-md border border-slate-500/25 flex items-center justify-center hover:bg-slate-500/10 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-extrabold tabular-nums">{qty}</span>
                        <button
                          type="button"
                          onClick={() => adjustQty(p, 1)}
                          className="w-6 h-6 rounded-md bg-[#0C831F] text-white flex items-center justify-center hover:bg-[#096B19] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Internal Note */}
            <div>
              <label className="block text-[11px] font-bold mb-1">
                Internal Merchant Note (Admin Only)
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. Confirmed on call, deliver after 6 PM"
                className={inputCls}
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Footer Totals + Submit */}
            <div className="pt-2 border-t border-slate-500/15 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs">
                <span className={muted}>Subtotal ₹{subtotal} + Delivery ₹{deliveryFee} = </span>
                <strong className="text-base text-[#0C831F] tabular-nums">
                  ₹{estimatedTotal}
                </strong>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#096B19] disabled:opacity-60 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Creating Order...' : 'Create Order'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
