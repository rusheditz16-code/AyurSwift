'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Zap,
  Package,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CartItem, DeliveryType, PaymentMethod, Order, MerchantSettings } from '@/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onPlaceOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    deliveryType: DeliveryType;
    deliveryAddress: string;
    city: string;
    pincode: string;
    landmark?: string;
    paymentMethod: PaymentMethod;
  }) => void;
  settings: MerchantSettings;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onClearCart,
  onPlaceOrder,
  settings,
}: CartDrawerProps) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('RAPIDO_CITY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  // Financial calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
  const totalMrp = cart.reduce((acc, item) => acc + item.product.mrp * item.quantity, 0);
  const totalSavings = totalMrp - subtotal;

  let deliveryFee = 0;
  if (deliveryType === 'RAPIDO_CITY') {
    deliveryFee = subtotal >= settings.cityFreeDeliveryAbove ? 0 : settings.cityDeliveryFee;
  } else {
    deliveryFee = settings.courierDeliveryFee;
  }

  const grandTotal = subtotal + deliveryFee;

  // Handle switching delivery type: If Courier, force UPI only
  const handleDeliveryTypeChange = (type: DeliveryType) => {
    setDeliveryType(type);
    if (type === 'COURIER_OUTSIDE') {
      setPaymentMethod('UPI'); // Strictly UPI for courier
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (cart.length === 0) {
      setFormError('Your cart is empty.');
      return;
    }

    if (!customerName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setFormError('Please enter your delivery street address / flat no.');
      return;
    }

    if (!city.trim()) {
      setFormError('Please enter your city.');
      return;
    }

    if (!pincode.trim() || pincode.length < 6) {
      setFormError('Please enter a valid 6-digit postal pincode.');
      return;
    }

    onPlaceOrder({
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      deliveryType,
      deliveryAddress: deliveryAddress.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      landmark: landmark.trim() || undefined,
      paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <div>
              <h2 className="font-bold text-base">Your AyurSwift Cart</h2>
              <p className="text-xs text-emerald-200">
                {cart.length} item{cart.length === 1 ? '' : 's'} ready for dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-100 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl">
                🛒
              </div>
              <h3 className="font-bold text-gray-800">Your cart is empty</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Explore our pure Ayurvedic medicines and add in-stock OTC remedies to your cart.
              </p>
            </div>
          ) : (
            <>
              {/* Savings Announcement */}
              {totalSavings > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>You are saving ₹{totalSavings} off wholesale retail MRP on this order!</span>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Medicines & Remedies ({cart.length})
                </div>
                {cart.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-emerald-200 transition-all gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase">
                        {product.brand}
                      </div>
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.packSize} • ₹{product.sellingPrice} each
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-2xs">
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-l-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 font-bold text-xs text-gray-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stockQuantity}
                        className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-r-lg disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="font-bold text-sm text-gray-900 text-right min-w-[50px]">
                      ₹{product.sellingPrice * quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Architecture Selection */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Select Delivery Mode (No Store Pickup)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* In-City Rapido */}
                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('RAPIDO_CITY')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      deliveryType === 'RAPIDO_CITY'
                        ? 'border-emerald-700 bg-emerald-50/70 ring-1 ring-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-950">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        In-City Rapid
                      </span>
                      <span className="text-[11px] font-extrabold text-emerald-800">
                        {subtotal >= settings.cityFreeDeliveryAbove
                          ? 'FREE'
                          : `₹${settings.cityDeliveryFee}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug">
                      Dispatched by Rapido bike rider in <strong>30–45 mins</strong> directly from home.
                    </p>
                    {subtotal < settings.cityFreeDeliveryAbove && (
                      <div className="text-[10px] text-amber-700 font-medium mt-1">
                        Add ₹{settings.cityFreeDeliveryAbove - subtotal} more for FREE Delivery!
                      </div>
                    )}
                  </button>

                  {/* Outside City Courier */}
                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('COURIER_OUTSIDE')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      deliveryType === 'COURIER_OUTSIDE'
                        ? 'border-emerald-700 bg-emerald-50/70 ring-1 ring-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-950">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        Outside City
                      </span>
                      <span className="text-[11px] font-extrabold text-gray-800">
                        ₹{settings.courierDeliveryFee}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug">
                      DTDC / Speed Post / Delhivery (<strong>2–4 days</strong>).
                    </p>
                    <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                      🔒 100% Prepaid UPI only
                    </div>
                  </button>
                </div>
              </div>

              {/* Delivery Details Form */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Customer & Drop Address
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        WhatsApp Mobile No. *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Complete House / Flat / Street Address *
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Flat 302, Green Heights, Opp. Shiva Temple, MG Road"
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-emerald-600 focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Landmark
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="Nearby spot"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="6-digit"
                        maxLength={6}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Payment Method
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>📱 UPI QR / Intent</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      GPay, PhonePe, Paytm (₹0 fee)
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={deliveryType === 'COURIER_OUTSIDE'}
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      deliveryType === 'COURIER_OUTSIDE'
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                        : paymentMethod === 'COD'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>💵 Cash on Delivery</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {deliveryType === 'COURIER_OUTSIDE'
                        ? 'Disabled for courier'
                        : 'Pay rider on delivery'}
                    </div>
                  </button>
                </div>

                {deliveryType === 'COURIER_OUTSIDE' && (
                  <p className="text-[10px] text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Outside-city parcels require 100% prepaid UPI to prevent return transit losses.
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Medicines Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-gray-900">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Retail MRP Discount</span>
                    <span>-₹{totalSavings}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-1.5 flex justify-between font-extrabold text-sm text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-emerald-900 text-base">₹{grandTotal}</span>
                </div>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleCheckoutSubmit}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span>Place Order • ₹{grandTotal}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              100% Authentic Ayurvedic OTC • Instant WhatsApp Confirmation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
