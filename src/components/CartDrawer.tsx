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
  Sparkles,
  MapPin,
  Check,
} from 'lucide-react';
import { CartItem, DeliveryType, PaymentMethod, MerchantSettings } from '@/types';
import { MedicinePackVisual } from './MedicinePackVisual';

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

  // Load saved customer profile if available
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
      setFormError('Please enter your delivery street address / house no.');
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

    // Save address for convenience next time
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/65 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center text-base">
              🛒
            </div>
            <div>
              <h2 className="font-extrabold text-base">Order Cart ({cart.length})</h2>
              <p className="text-[11px] text-emerald-300">
                Home Dark Store • Fast Micro-Fulfillment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-900 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl">
                🌿
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Your medicine cart is empty</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Select from our authentic Ayurvedic OTC products to dispatch quickly from home stock.
              </p>
            </div>
          ) : (
            <>
              {/* Free Rapid Delivery Progress Indicator (In-City) */}
              {deliveryType === 'RAPIDO_CITY' && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {amountToFreeDelivery === 0 ? (
                        <span className="text-emerald-800 font-extrabold">
                          🎉 FREE Rapid In-City Delivery Unlocked!
                        </span>
                      ) : (
                        <span>
                          Add <strong>₹{amountToFreeDelivery}</strong> more for <strong>FREE Delivery</strong>
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-black text-emerald-800">
                      ₹{subtotal} / ₹{settings.cityFreeDeliveryAbove}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-700 transition-all duration-300"
                      style={{ width: `${freeDeliveryPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Medicines & Quantities
                </div>
                {cart.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-emerald-200 transition-all gap-3"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center shrink-0">
                      <MedicinePackVisual product={product} className="w-10 h-10" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-black text-emerald-800 uppercase">
                        {product.brand}
                      </div>
                      <div className="font-bold text-xs text-gray-900 truncate">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {product.packSize} • ₹{product.sellingPrice}
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-2xs">
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="p-1 hover:bg-gray-100 text-gray-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-black text-xs text-gray-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stockQuantity}
                        className="p-1 hover:bg-gray-100 text-gray-700 disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="font-black text-xs text-gray-900 text-right min-w-[50px]">
                      ₹{product.sellingPrice * quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Choice Selector */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Delivery Mode (No Store Pickup)
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('RAPIDO_CITY')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      deliveryType === 'RAPIDO_CITY'
                        ? 'border-emerald-800 bg-emerald-50/70 ring-1 ring-emerald-800'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-emerald-950 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        In-City Rapid
                      </span>
                      <span className="text-[11px] font-black text-emerald-800">
                        {subtotal >= settings.cityFreeDeliveryAbove
                          ? 'FREE'
                          : `₹${settings.cityDeliveryFee}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-tight">
                      <strong>30–45 mins</strong> via Rapido Parcel bike from home stock.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('COURIER_OUTSIDE')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      deliveryType === 'COURIER_OUTSIDE'
                        ? 'border-emerald-800 bg-emerald-50/70 ring-1 ring-emerald-800'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-emerald-950 flex items-center gap-1">
                        <Package className="w-3 h-3 text-blue-600" />
                        Outside City
                      </span>
                      <span className="text-[11px] font-black text-gray-900">
                        ₹{settings.courierDeliveryFee}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-tight">
                      <strong>2–4 days</strong> via Speed Post / DTDC (Prepaid only).
                    </p>
                  </button>
                </div>
              </div>

              {/* Delivery Address Form */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Customer & Address</span>
                  <span className="text-emerald-700 font-medium normal-case flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Auto-saved
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ramesh Patel"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                        WhatsApp Mobile No. *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10-digit number"
                        maxLength={10}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                      Street Address / House No. *
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Flat 302, Green Heights, Opp. Temple, Station Road"
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-1 focus:ring-emerald-700 focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                        Landmark
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="Near landmark"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Pincode"
                        maxLength={6}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Payment Mode
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-800'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">📱 Zero-Fee UPI</div>
                    <div className="text-[10px] text-gray-500">GPay, PhonePe, Paytm</div>
                  </button>

                  <button
                    type="button"
                    disabled={deliveryType === 'COURIER_OUTSIDE'}
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      deliveryType === 'COURIER_OUTSIDE'
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200'
                        : paymentMethod === 'COD'
                        ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-800'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">💵 Cash on Delivery</div>
                    <div className="text-[10px] text-gray-500">
                      {deliveryType === 'COURIER_OUTSIDE' ? 'UPI only for courier' : 'Pay bike rider'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Bill Details Breakdown */}
              <div className="bg-gray-50 rounded-2xl p-3.5 space-y-1.5 text-xs border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Medicines Total</span>
                  <span className="font-semibold text-gray-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Rapid Delivery Partner Fee</span>
                  <span className="font-bold text-gray-900">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tamper-Proof Medicine Bagging</span>
                  <span className="text-emerald-700 font-bold">FREE (₹0)</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Retail MRP Discount</span>
                    <span>-₹{totalSavings}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-sm text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-emerald-950 text-base">₹{grandTotal}</span>
                </div>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Checkout Trigger */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleCheckoutSubmit}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span>Place Order • ₹{grandTotal}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              100% Genuine Ayurvedic OTC • Instant WhatsApp Confirmation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
