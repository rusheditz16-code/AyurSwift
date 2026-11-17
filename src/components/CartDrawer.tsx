'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Zap,
  Package,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { CartItem, DeliveryType, PaymentMethod, MerchantSettings } from '@/types';

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

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('ayurswift_saved_address');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setCustomerName(parsed.customerName || '');
        setCustomerPhone(parsed.customerPhone || '');
        setDeliveryAddress(parsed.deliveryAddress || '');
        setLandmark(parsed.landmark || '');
        setCity(parsed.city || '');
        setPincode(parsed.pincode || '');
      }
    } catch {}
  }, []);

  if (!isOpen) return null;

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
  const amountToFreeDelivery = Math.max(0, settings.cityFreeDeliveryAbove - subtotal);
  const freeDeliveryPercent = Math.min(100, (subtotal / settings.cityFreeDeliveryAbove) * 100);

  const handleDeliveryTypeChange = (type: DeliveryType) => {
    setDeliveryType(type);
    if (type === 'COURIER_OUTSIDE') {
      setPaymentMethod('UPI');
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
      setFormError('Please enter your delivery street address.');
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

    try {
      localStorage.setItem(
        'ayurswift_saved_address',
        JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          deliveryAddress: deliveryAddress.trim(),
          landmark: landmark.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
        })
      );
    } catch {}

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white text-gray-900 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-base text-gray-900">Your Cart</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                🛒
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Your cart is empty</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Select medicines from the storefront to dispatch from our home dark store.
              </p>
            </div>
          ) : (
            <>
              {/* Free In-City Delivery Progress Bar */}
              {deliveryType === 'RAPIDO_CITY' && (
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {amountToFreeDelivery === 0 ? (
                        <span>You unlocked <strong>FREE 30-45m Rapido Delivery!</strong></span>
                      ) : (
                        <span>Add <strong>₹{amountToFreeDelivery}</strong> more for <strong>FREE Rapido delivery</strong></span>
                      )}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">
                      ₹{subtotal} / ₹{settings.cityFreeDeliveryAbove}
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${freeDeliveryPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1">
                  <span>ITEMS IN CART</span>
                  <button
                    onClick={onClearCart}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl bg-white shadow-2xs">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          <span className="font-semibold text-emerald-700">{item.product.brand}</span>
                          <span>•</span>
                          <span>{item.product.packSize}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="font-black text-xs sm:text-sm text-gray-900">
                            ₹{item.product.sellingPrice * item.quantity}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            (₹{item.product.sellingPrice} each)
                          </span>
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-gray-200 text-gray-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-black text-xs min-w-[20px] text-center text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-gray-200 text-gray-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Speed / Destination Option */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                  Select Delivery Option
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('RAPIDO_CITY')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      deliveryType === 'RAPIDO_CITY'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> In-City Express
                      </span>
                      {deliveryType === 'RAPIDO_CITY' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-800 font-bold mt-1">
                      30–45 Mins (Rapido)
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {subtotal >= settings.cityFreeDeliveryAbove ? 'FREE' : `₹${settings.cityDeliveryFee}`} • COD or UPI
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('COURIER_OUTSIDE')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      deliveryType === 'COURIER_OUTSIDE'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-blue-600" /> Outside City
                      </span>
                      {deliveryType === 'COURIER_OUTSIDE' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-[11px] text-blue-700 font-bold mt-1">
                      2–4 Days (Courier)
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      ₹{settings.courierDeliveryFee} • Prepaid UPI Only
                    </div>
                  </button>
                </div>
              </div>

              {/* Delivery Details Form */}
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-2.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 block">
                  Delivery Address & Contact
                </span>

                <div className="bg-gray-50/80 border border-gray-200 p-3.5 rounded-2xl space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                        WhatsApp Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10-digit number"
                        maxLength={10}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                      House / Flat / Street Address *
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Flat 302, Shivalik Residency, 80ft Road"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                        Landmark
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="Near Temple"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                        City *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Ahmedabad"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="380015"
                        maxLength={6}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Option */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 block">
                    Payment Method
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMethod === 'UPI'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-extrabold text-xs text-gray-900">
                        📱 Direct Bank UPI
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Zero Gateway Cut • GPay / PhonePe
                      </div>
                    </button>

                    {deliveryType === 'RAPIDO_CITY' ? (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          paymentMethod === 'COD'
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-gray-900">
                          💵 Cash on Delivery
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Pay rider upon drop
                        </div>
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-100 opacity-60 text-left">
                        <div className="font-bold text-xs text-gray-400">
                          💵 COD Disabled
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Prepaid only for courier
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
              </form>

              {/* Bill Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount Savings</span>
                    <span>-₹{totalSavings}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-gray-900">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-black">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-black text-gray-900">
                  <span>To Pay</span>
                  <span className="text-base text-emerald-700">₹{grandTotal}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Sticky Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white space-y-2">
            <button
              type="submit"
              form="checkout-form"
              className="w-full bg-[#10847e] hover:bg-[#0c6b66] text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <span>Place Order • ₹{grandTotal}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-center text-gray-400">
              Generates Order ID & opens WhatsApp confirmation + Zero-Fee UPI QR
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
