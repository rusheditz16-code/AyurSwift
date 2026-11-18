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
    <div className="fixed inset-0 z-70 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-[#f8f8f3] text-[#1c2e24] h-full flex flex-col shadow-2xl border-l border-[#d6ddce] animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 border-b border-[#d6ddce] flex items-center justify-between bg-[#e9efdf]">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-lg text-[#143d29]">Your Basket</h2>
            <span className="bg-[#1d5a3e]/10 text-[#1d5a3e] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#1d5a3e]/20">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close basket"
            className="p-1.5 rounded-full hover:bg-black/5 text-[#526359] hover:text-[#143d29] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-[#e9efdf] text-[#1d5a3e] rounded-full flex items-center justify-center mx-auto text-3xl border border-[#d6ddce]">
                🌿
              </div>
              <h3 className="font-serif font-bold text-[#143d29] text-base">Your basket is empty</h3>
              <p className="text-xs text-[#526359] max-w-xs mx-auto">
                Explore authentic Ayurvedic medicines and everyday wellness remedies.
              </p>
            </div>
          ) : (
            <>
              {/* Free In-City Delivery Progress Bar */}
              {deliveryType === 'RAPIDO_CITY' && (
                <div className="bg-[#e9efdf] border border-[#d6ddce] rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#143d29] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-[#c86326] text-[#c86326]" />
                      {amountToFreeDelivery === 0 ? (
                        <span>Unlocked: <strong>FREE local delivery</strong></span>
                      ) : (
                        <span>Add <strong>₹{amountToFreeDelivery}</strong> more for <strong>FREE local delivery</strong></span>
                      )}
                    </span>
                    <span className="text-[11px] font-semibold text-[#1d5a3e]">
                      ₹{subtotal} / ₹{settings.cityFreeDeliveryAbove}
                    </span>
                  </div>
                  <div className="w-full bg-[#d6ddce] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#1d5a3e] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${freeDeliveryPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#526359] px-1">
                  <span>ITEMS IN BASKET</span>
                  <button
                    onClick={onClearCart}
                    className="text-[11px] text-[#c86326] hover:text-[#a84f1b] font-medium"
                  >
                    Clear All
                  </button>
                </div>

                <div className="divide-y divide-[#e9efdf] border border-[#d6ddce] rounded-xl bg-white shadow-2xs overflow-hidden">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-[#143d29] truncate">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#526359] mt-0.5">
                          <span className="font-semibold text-[#1d5a3e]">{item.product.brand}</span>
                          <span>•</span>
                          <span>{item.product.packSize}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="font-bold text-xs sm:text-sm text-[#143d29]">
                            ₹{item.product.sellingPrice * item.quantity}
                          </span>
                          <span className="text-[10px] text-[#718277]">
                            (₹{item.product.sellingPrice} each)
                          </span>
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center bg-[#f8f8f3] rounded-lg overflow-hidden border border-[#d6ddce] shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          aria-label={`Decrease ${item.product.name} quantity`}
                          className="px-2 py-1 hover:bg-[#e9efdf] text-[#143d29] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-xs min-w-[20px] text-center text-[#143d29]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          aria-label={`Increase ${item.product.name} quantity`}
                          className="px-2 py-1 hover:bg-[#e9efdf] text-[#143d29] transition-colors"
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
                <span className="text-xs font-semibold text-[#526359] uppercase tracking-wider px-1">
                  Delivery Destination
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('RAPIDO_CITY')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      deliveryType === 'RAPIDO_CITY'
                        ? 'border-[#1d5a3e] bg-[#e9efdf] ring-1 ring-[#1d5a3e]'
                        : 'border-[#d6ddce] bg-white hover:bg-[#f8f8f3]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#143d29] flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-[#c86326] text-[#c86326]" /> Local Delivery
                      </span>
                      {deliveryType === 'RAPIDO_CITY' && (
                        <CheckCircle2 className="w-4 h-4 text-[#1d5a3e]" />
                      )}
                    </div>
                    <div className="text-[11px] text-[#1d5a3e] font-semibold mt-1">
                      30–45 Mins Express
                    </div>
                    <div className="text-[10px] text-[#526359] mt-0.5">
                      {subtotal >= settings.cityFreeDeliveryAbove ? 'FREE' : `₹${settings.cityDeliveryFee}`} • COD or UPI
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('COURIER_OUTSIDE')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      deliveryType === 'COURIER_OUTSIDE'
                        ? 'border-[#1d5a3e] bg-[#e9efdf] ring-1 ring-[#1d5a3e]'
                        : 'border-[#d6ddce] bg-white hover:bg-[#f8f8f3]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#143d29] flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-[#1d5a3e]" /> Rest of India
                      </span>
                      {deliveryType === 'COURIER_OUTSIDE' && (
                        <CheckCircle2 className="w-4 h-4 text-[#1d5a3e]" />
                      )}
                    </div>
                    <div className="text-[11px] text-[#1d5a3e] font-semibold mt-1">
                      2–4 Days (Courier)
                    </div>
                    <div className="text-[10px] text-[#526359] mt-0.5">
                      ₹{settings.courierDeliveryFee} • Prepaid UPI Only
                    </div>
                  </button>
                </div>
              </div>

              {/* Delivery Details Form */}
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-2.5">
                <span className="text-xs font-semibold text-[#526359] uppercase tracking-wider px-1 block">
                  Delivery Address & Contact
                </span>

                <div className="bg-white border border-[#d6ddce] p-3.5 rounded-xl space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#526359] mb-0.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full px-2.5 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-lg text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#526359] mb-0.5">
                        WhatsApp Mobile *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10-digit number"
                        maxLength={10}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-lg text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#526359] mb-0.5">
                      House / Flat / Street Address *
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. 102, Shivalik Flat, Kaliyabid Road"
                      className="w-full px-2.5 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-lg text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#526359] mb-0.5">
                        Landmark
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="Near Temple"
                        className="w-full px-2.5 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-lg text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#526359] mb-0.5">
                        City *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Bhavnagar"
                        className="w-full px-2.5 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-lg text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#526359] mb-0.5">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="364001"
                        maxLength={6}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-lg text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Option */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-[#526359] uppercase tracking-wider px-1 block">
                    Payment Method
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMethod === 'UPI'
                          ? 'border-[#1d5a3e] bg-[#e9efdf] ring-1 ring-[#1d5a3e]'
                          : 'border-[#d6ddce] bg-white hover:bg-[#f8f8f3]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#143d29]">
                        📱 Direct Bank UPI
                      </div>
                      <div className="text-[10px] text-[#1d5a3e] font-semibold mt-0.5">
                        Zero Gateway Cut • GPay / PhonePe
                      </div>
                    </button>

                    {deliveryType === 'RAPIDO_CITY' ? (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          paymentMethod === 'COD'
                            ? 'border-[#1d5a3e] bg-[#e9efdf] ring-1 ring-[#1d5a3e]'
                            : 'border-[#d6ddce] bg-white hover:bg-[#f8f8f3]'
                        }`}
                      >
                        <div className="font-bold text-xs text-[#143d29]">
                          💵 Cash on Delivery
                        </div>
                        <div className="text-[10px] text-[#526359] mt-0.5">
                          Pay rider upon drop
                        </div>
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl border border-[#d6ddce] bg-[#f8f8f3] opacity-60 text-left">
                        <div className="font-semibold text-xs text-[#718277]">
                          💵 COD Disabled
                        </div>
                        <div className="text-[10px] text-[#718277] mt-0.5">
                          Prepaid only for courier
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
              </form>

              {/* Bill Details */}
              <div className="bg-white border border-[#d6ddce] rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#526359]">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-[#143d29]">₹{subtotal}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-[#1d5a3e] font-semibold">
                    <span>MRP Discount</span>
                    <span>-₹{totalSavings}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#526359]">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-[#143d29]">
                    {deliveryFee === 0 ? (
                      <span className="text-[#1d5a3e] font-black">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="border-t border-[#e9efdf] pt-2 flex justify-between text-sm font-bold text-[#143d29]">
                  <span className="font-serif text-base">To Pay</span>
                  <span className="text-base text-[#1d5a3e]">₹{grandTotal}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Sticky Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#d6ddce] bg-[#f8f8f3] space-y-2">
            <button
              type="submit"
              form="checkout-form"
              className="w-full bg-[#1d5a3e] hover:bg-[#143d29] text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-colors active:scale-98"
            >
              <span>Place Order • ₹{grandTotal}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-center text-[#526359]">
              Generates Order ID & opens WhatsApp confirmation + Zero-Fee direct UPI QR
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
