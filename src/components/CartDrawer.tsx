'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Sparkles,
  Receipt,
  Smartphone,
  Trash2,
  Clock,
  CalendarDays,
} from 'lucide-react';
import {
  CartItem,
  DeliveryType,
  PaymentMethod,
  MerchantSettings,
  Product,
} from '@/types';
import { DELIVERY_PROMISE, isVerifiedProductImageUrl } from '@/lib/initialData';
import {
  DeliveryDayType,
  DeliverySlotId,
  getIstClock,
  getNextAvailableSlot,
  getSlotsForDay,
  getTomorrowIstDate,
  hasAnyAvailableSlotToday,
} from '@/lib/deliverySlots';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products?: Product[];
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onPlaceOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    deliveryType: DeliveryType;
    deliverySlotId?: string;
    deliverySlotDate?: string;
    deliveryAddress: string;
    city: string;
    pincode: string;
    landmark?: string;
    paymentMethod: PaymentMethod;
    website?: string;
  }) => Promise<void>;
  settings: MerchantSettings;
  defaultDeliveryType?: DeliveryType;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  products = [],
  onAddToCart,
  onUpdateQuantity,
  onClearCart,
  onPlaceOrder,
  settings,
  defaultDeliveryType = 'RAPIDO_CITY',
}: CartDrawerProps) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(defaultDeliveryType);
  const paymentMethod: PaymentMethod = 'UPI';
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bhavnagar');
  const [pincode, setPincode] = useState('364001');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [hasSavedProfile, setHasSavedProfile] = useState(false);

  // Live IST delivery slot state (populated strictly in useEffect to stay Next.js 16 prerender-safe)
  const [slotClockNow, setSlotClockNow] = useState<Date | null>(null);
  const [selectedSlotDay, setSelectedSlotDay] = useState<DeliveryDayType>('TODAY');
  const [selectedSlotId, setSelectedSlotId] = useState<DeliverySlotId>('09:00-10:00');

  useEffect(() => {
    setDeliveryType(defaultDeliveryType);
  }, [defaultDeliveryType]);

  // Refresh IST clock immediately when drawer opens and every 30s while open
  useEffect(() => {
    if (!isOpen) return;
    const syncClock = () => {
      const now = new Date();
      setSlotClockNow(now);
      setSelectedSlotDay((prevDay) => {
        const nextOverall = getNextAvailableSlot(now);
        if (prevDay === 'TODAY' && !hasAnyAvailableSlotToday(now)) {
          return nextOverall.dayType;
        }
        return prevDay;
      });
    };
    const now = new Date();
    const nextInit = getNextAvailableSlot(now);
    setSlotClockNow(now);
    setSelectedSlotDay(nextInit.dayType);
    setSelectedSlotId(nextInit.slot.id);
    const timer = setInterval(syncClock, 30_000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const todayClock = useMemo(
    () => (slotClockNow ? getIstClock(slotClockNow) : null),
    [slotClockNow]
  );
  const tomorrowDate = useMemo(
    () => (slotClockNow ? getTomorrowIstDate(slotClockNow) : null),
    [slotClockNow]
  );
  const todayHasOpenSlots = useMemo(
    () => (slotClockNow ? hasAnyAvailableSlotToday(slotClockNow) : true),
    [slotClockNow]
  );
  const daySlots = useMemo(
    () => (slotClockNow ? getSlotsForDay(selectedSlotDay, slotClockNow) : []),
    [selectedSlotDay, slotClockNow]
  );

  // Auto-advance selection whenever current chosen slot becomes in-progress or closed
  useEffect(() => {
    if (!slotClockNow || daySlots.length === 0) return;
    const activeChoice = daySlots.find((opt) => opt.slot.id === selectedSlotId);
    if (!activeChoice || !activeChoice.isSelectable) {
      const firstInSelectedDay = daySlots.find((opt) => opt.isSelectable);
      if (firstInSelectedDay) {
        setSelectedSlotId(firstInSelectedDay.slot.id);
      } else {
        const nextOverall = getNextAvailableSlot(slotClockNow);
        setSelectedSlotDay(nextOverall.dayType);
        setSelectedSlotId(nextOverall.slot.id);
      }
    }
  }, [daySlots, selectedSlotId, slotClockNow]);

  const activeSlotOption = useMemo(() => {
    if (!slotClockNow) return null;
    return (
      daySlots.find((opt) => opt.slot.id === selectedSlotId && opt.isSelectable) ||
      daySlots.find((opt) => opt.isSelectable) ||
      getSlotsForDay('TOMORROW', slotClockNow)[0]
    );
  }, [slotClockNow, daySlots, selectedSlotId]);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('ayurswift_saved_address');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setCustomerName(parsed.customerName || '');
        setCustomerPhone(parsed.customerPhone || '');
        setDeliveryAddress(parsed.deliveryAddress || '');
        setLandmark(parsed.landmark || '');
        setCity(parsed.city || 'Bhavnagar');
        setPincode(parsed.pincode || '');
        if (parsed.customerName || parsed.deliveryAddress) {
          setHasSavedProfile(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const upsellProducts = useMemo(() => {
    const inCartIds = new Set(cart.map((c) => c.product.id));
    return products
      .filter((p) => p.isLive && p.stockQuantity > 0 && !inCartIds.has(p.id))
      .slice(0, 6);
  }, [products, cart]);

  if (!isOpen) return null;

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
  const totalMrp = cart.reduce((acc, item) => acc + item.product.mrp * item.quantity, 0);
  const totalSavings = Math.max(0, totalMrp - subtotal);

  const deliveryFee =
    deliveryType === 'RAPIDO_CITY'
      ? subtotal >= settings.cityFreeDeliveryAbove
        ? 0
        : settings.cityDeliveryFee
      : settings.courierDeliveryFee;

  const grandTotal = subtotal + deliveryFee;
  const amountToFreeDelivery = Math.max(0, settings.cityFreeDeliveryAbove - subtotal);
  const freeDeliveryPercent = Math.min(100, (subtotal / settings.cityFreeDeliveryAbove) * 100);

  const handleDeliveryTypeChange = (type: DeliveryType) => {
    setDeliveryType(type);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
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
      setFormError('Please enter your complete street address.');
      return;
    }
    if (!city.trim()) {
      setFormError('Please enter your city.');
      return;
    }
    if (!pincode.trim() || pincode.replace(/\D/g, '').length < 6) {
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

    if (deliveryType === 'RAPIDO_CITY') {
      // Re-verify against real-time IST clock right at submit so a just-started slot cannot be submitted
      const freshNow = new Date();
      const freshSlots = getSlotsForDay(selectedSlotDay, freshNow);
      const chosenNow = freshSlots.find((opt) => opt.slot.id === selectedSlotId);
      if (!chosenNow || !chosenNow.isSelectable) {
        setSlotClockNow(freshNow);
        const next = getNextAvailableSlot(freshNow);
        setSelectedSlotDay(next.dayType);
        setSelectedSlotId(next.slot.id);
        setFormError(
          `That delivery slot just closed. We moved your selection to the next available slot (${next.shortText}) — please review and tap Place Order again.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onPlaceOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        deliveryType,
        ...(deliveryType === 'RAPIDO_CITY' && activeSlotOption
          ? {
              deliverySlotId: activeSlotOption.slot.id,
              deliverySlotDate: activeSlotOption.dateKey,
            }
          : {}),
        deliveryAddress: deliveryAddress.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        landmark: landmark.trim() || undefined,
        paymentMethod,
        website: honeypot,
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Could not place order right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 bg-slate-950/50 backdrop-blur-xs flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] bg-[#F5F7FA] text-gray-900 h-full flex flex-col shadow-2xl animate-drawer-right"
      >
        {/* Top Sticky Header */}
        <div className="px-4 py-3.5 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <h2
              id="cart-drawer-title"
              className="font-extrabold text-base sm:text-lg text-gray-950 tracking-tight"
            >
              My Cart
            </h2>
            {itemCount > 0 && (
              <span className="bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0] text-[11px] font-extrabold px-2 py-0.5 rounded-full tabular-nums">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-950 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-3.5 sm:p-4 space-y-3.5">
          {cart.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3 my-8">
              <div className="w-16 h-16 rounded-2xl bg-[#ECFDF3] text-[#0C831F] flex items-center justify-center mx-auto">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-gray-950 text-base">
                Your cart is empty
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Add authentic Ayurvedic remedies and everyday health essentials for {DELIVERY_PROMISE.localTimeShort} local delivery.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-1.5 bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>Start Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <form id="ayurswift-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-3.5">
              {/* Savings Banner */}
              {totalSavings > 0 && (
                <div className="bg-gradient-to-r from-[#ECFDF3] to-emerald-50 border border-[#BBF7D0] rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#0A5C16]">
                    <Sparkles className="w-4 h-4 text-[#0C831F] shrink-0" />
                    <span>Your total savings on this order</span>
                  </div>
                  <span className="font-extrabold text-[#0C831F] bg-white px-2.5 py-0.5 rounded-full border border-[#BBF7D0] tabular-nums">
                    ₹{totalSavings}
                  </span>
                </div>
              )}

              {/* Shipment Card: ETA + Free Delivery Progress + Items */}
              <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
                {/* Shipment Header */}
                <div className="px-3.5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-[#0C831F]" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-[13px] font-extrabold text-gray-950">
                        {deliveryType === 'RAPIDO_CITY' && activeSlotOption
                          ? `${activeSlotOption.dayType === 'TODAY' ? 'Today' : 'Tomorrow'} • ${activeSlotOption.slot.label}`
                          : 'Tracked Courier (2–4 days)'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        Shipment of {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Clear all items"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                {/* Free Delivery Progress (Local only) */}
                {deliveryType === 'RAPIDO_CITY' && (
                  <div className="px-3.5 py-2.5 bg-gray-50/80 border-b border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-gray-800 flex items-center gap-1.5">
                        {amountToFreeDelivery === 0 ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0C831F]" />
                            <span className="text-[#0C831F]">FREE local express delivery unlocked!</span>
                          </>
                        ) : (
                          <span>
                            Add <strong className="text-[#0C831F] tabular-nums">₹{amountToFreeDelivery}</strong> more for{' '}
                            <strong>FREE delivery</strong>
                          </span>
                        )}
                      </span>
                      <span className="text-[10.5px] font-bold text-gray-500 tabular-nums">
                        ₹{subtotal}/₹{settings.cityFreeDeliveryAbove}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0C831F] rounded-full transition-all duration-300"
                        style={{ width: `${freeDeliveryPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-3 flex items-center gap-3">
                      <div
                        className={`w-13 h-13 rounded-xl bg-[#F7FAF8] border border-gray-200/80 flex items-center justify-center shrink-0 overflow-hidden ${
                          isVerifiedProductImageUrl(item.product.imageUrl) ? 'p-0' : 'p-1'
                        }`}
                      >
                        {isVerifiedProductImageUrl(item.product.imageUrl) ? (
                          <img
                            src={item.product.imageUrl}
                            alt={`${item.product.name} (${item.product.packSize})`}
                            width={52}
                            height={52}
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <MedicinePackVisual product={item.product} compact className="w-full h-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-[13px] text-gray-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-gray-500 font-medium">
                          {item.product.packSize} • {item.product.brand}
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="font-extrabold text-xs sm:text-sm text-gray-950 tabular-nums">
                            ₹{item.product.sellingPrice * item.quantity}
                          </span>
                          {item.product.mrp > item.product.sellingPrice && (
                            <span className="text-[10.5px] text-gray-400 line-through tabular-nums">
                              ₹{item.product.mrp * item.quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="h-8 flex items-center bg-[#0C831F] text-white rounded-lg overflow-hidden shadow-2xs shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-full hover:bg-[#096B19] flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="min-w-[22px] text-center text-xs font-extrabold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="w-7 h-full hover:bg-[#096B19] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Before You Checkout — Impulse Add-on Rail */}
              {onAddToCart && upsellProducts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs text-gray-900">
                      Before you checkout
                    </h3>
                    <span className="text-[10.5px] font-bold text-[#0C831F]">
                      1-tap essentials
                    </span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-0.5">
                    {upsellProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="w-[126px] shrink-0 rounded-xl border border-gray-200/80 bg-[#F8FAFC] p-2 flex flex-col justify-between gap-1.5"
                      >
                        <div>
                          <div
                            className={`h-24 bg-[#F7FAF8] rounded-lg flex items-center justify-center border border-gray-100 mb-1.5 overflow-hidden ${
                              isVerifiedProductImageUrl(prod.imageUrl) ? 'p-0' : 'p-1'
                            }`}
                          >
                            {isVerifiedProductImageUrl(prod.imageUrl) ? (
                              <img
                                src={prod.imageUrl}
                                alt={`${prod.name} (${prod.packSize})`}
                                width={110}
                                height={96}
                                className="w-full h-full object-cover object-center"
                              />
                            ) : (
                              <MedicinePackVisual product={prod} compact className="w-full h-full" />
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-gray-900 line-clamp-2 leading-tight min-h-[26px]">
                            {prod.name}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">{prod.packSize}</div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-extrabold text-gray-950 tabular-nums">
                            ₹{prod.sellingPrice}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddToCart(prod)}
                            className="px-2.5 py-1 rounded-md border border-[#0C831F] bg-[#F2FBF4] hover:bg-[#0C831F] text-[#0C831F] hover:text-white text-[10px] font-extrabold transition-colors cursor-pointer active:scale-95"
                          >
                            ADD
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bill Details Card */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-900 pb-1">
                  <Receipt className="w-3.5 h-3.5 text-[#0C831F]" />
                  <span>Bill details</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Items total</span>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      {totalMrp > subtotal && (
                        <span className="text-gray-400 line-through text-[11px]">₹{totalMrp}</span>
                      )}
                      <span className="font-bold text-gray-900">₹{subtotal}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>
                      {deliveryType === 'RAPIDO_CITY' ? 'Delivery charge' : 'Courier shipping'}
                    </span>
                    <span className="font-bold tabular-nums">
                      {deliveryFee === 0 ? (
                        <span className="text-[#0C831F]">FREE</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between items-center font-extrabold text-sm text-gray-950">
                    <span>Grand total</span>
                    <span className="tabular-nums">₹{grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Mode Toggle */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 space-y-2.5 shadow-2xs">
                <div className="text-xs font-extrabold text-gray-900">Delivery mode</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('RAPIDO_CITY')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      deliveryType === 'RAPIDO_CITY'
                        ? 'border-[#0C831F] bg-[#ECFDF3] ring-1 ring-[#0C831F]'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-950">
                      <Clock className="w-3.5 h-3.5 text-[#0C831F]" />
                      <span>Bhavnagar Slots</span>
                    </div>
                    <div className="text-[10.5px] text-gray-600 mt-0.5">
                      Pick slot • {subtotal >= settings.cityFreeDeliveryAbove ? 'FREE' : `₹${settings.cityDeliveryFee}`} • Prepaid UPI
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('COURIER_OUTSIDE')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      deliveryType === 'COURIER_OUTSIDE'
                        ? 'border-[#0C831F] bg-[#ECFDF3] ring-1 ring-[#0C831F]'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-950">
                      <Package className="w-3.5 h-3.5 text-[#0C831F]" />
                      <span>All-India Courier</span>
                    </div>
                    <div className="text-[10.5px] text-gray-600 mt-0.5">
                      2–4 Days • ₹{settings.courierDeliveryFee} • UPI Only
                    </div>
                  </button>
                </div>

                {/* Scheduled Bhavnagar Delivery Slot Selector */}
                {deliveryType === 'RAPIDO_CITY' && (
                  <div className="pt-2.5 border-t border-gray-100 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-900">
                        <CalendarDays className="w-3.5 h-3.5 text-[#0C831F]" />
                        <span>Choose Delivery Slot</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">
                        Current slot locked • Next open
                      </span>
                    </div>

                    {/* Today / Tomorrow Switcher */}
                    <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        disabled={!todayHasOpenSlots}
                        onClick={() => setSelectedSlotDay('TODAY')}
                        className={`py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                          !todayHasOpenSlots
                            ? 'text-gray-400 cursor-not-allowed'
                            : selectedSlotDay === 'TODAY'
                            ? 'bg-white text-[#0C831F] shadow-2xs cursor-pointer'
                            : 'text-gray-600 hover:text-gray-900 cursor-pointer'
                        }`}
                      >
                        <span>Today{todayClock ? ` (${todayClock.shortDate})` : ''}</span>
                        {!todayHasOpenSlots && (
                          <span className="text-[9.5px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                            Closed
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSlotDay('TOMORROW')}
                        className={`py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                          selectedSlotDay === 'TOMORROW'
                            ? 'bg-white text-[#0C831F] shadow-2xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Tomorrow{tomorrowDate ? ` (${tomorrowDate.shortDate})` : ''}
                      </button>
                    </div>

                    {/* 4 Delivery Time Slot Cards */}
                    <div
                      className="grid grid-cols-2 gap-2"
                      role="radiogroup"
                      aria-label="Bhavnagar delivery time slots"
                    >
                      {daySlots.map((opt) => {
                        const isSelected =
                          opt.isSelectable && activeSlotOption?.slot.id === opt.slot.id;
                        return (
                          <button
                            key={`${opt.dayType}-${opt.slot.id}`}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            disabled={!opt.isSelectable}
                            onClick={() => setSelectedSlotId(opt.slot.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              !opt.isSelectable
                                ? 'bg-gray-50 border-gray-200/80 text-gray-400 cursor-not-allowed opacity-75'
                                : isSelected
                                ? 'bg-[#ECFDF3] border-[#0C831F] ring-1 ring-[#0C831F] text-gray-950 cursor-pointer shadow-2xs'
                                : 'bg-white border-gray-200 hover:border-[#0C831F]/60 hover:bg-emerald-50/30 text-gray-900 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[10px] font-extrabold uppercase tracking-wide ${
                                  !opt.isSelectable
                                    ? 'text-gray-400'
                                    : isSelected
                                    ? 'text-[#0C831F]'
                                    : 'text-gray-500'
                                }`}
                              >
                                {opt.slot.period}
                              </span>
                              {isSelected ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#0C831F] shrink-0" />
                              ) : opt.isNextAvailable ? (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-[#0A5C16]">
                                  Next
                                </span>
                              ) : opt.status === 'IN_PROGRESS' ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  Active • Closed
                                </span>
                              ) : opt.status === 'PASSED' ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                                  Passed
                                </span>
                              ) : null}
                            </div>
                            <div
                              className={`text-xs font-extrabold mt-1 tabular-nums ${
                                !opt.isSelectable ? 'line-through text-gray-400' : ''
                              }`}
                            >
                              {opt.slot.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[10.5px] text-gray-500 leading-snug">
                      An ongoing slot cannot be booked so we have dedicated time to verify stock and pack your order before dispatch.
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Details Form */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-900">
                    <MapPin className="w-3.5 h-3.5 text-[#0C831F]" />
                    <span>Delivery address</span>
                  </div>
                  {hasSavedProfile && (
                    <span className="text-[10px] font-bold text-[#0C831F] bg-[#ECFDF3] px-2 py-0.5 rounded-full">
                      Saved address loaded
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="checkout-name" className="sr-only">
                      Full name
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      aria-label="Full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full name *"
                      required
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-phone" className="sr-only">
                      10-digit mobile number
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      aria-label="10-digit mobile number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile *"
                      maxLength={12}
                      required
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-address" className="sr-only">
                    Delivery street address and locality
                  </label>
                  <textarea
                    id="checkout-address"
                    aria-label="Delivery street address and locality"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House / Flat no., Building, Street, Locality *"
                    rows={2}
                    required
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15 resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-landmark" className="sr-only">
                    Nearby landmark (optional)
                  </label>
                  <input
                    id="checkout-landmark"
                    type="text"
                    aria-label="Nearby landmark (optional)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Nearby landmark (optional)"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="checkout-city" className="sr-only">
                      City
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      aria-label="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City *"
                      required
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-pincode" className="sr-only">
                      6-digit pincode
                    </label>
                    <input
                      id="checkout-pincode"
                      type="text"
                      aria-label="6-digit pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="6-digit pincode *"
                      maxLength={6}
                      required
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Card — Direct UPI Instructions (Where Customers Need Them) */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-gray-900">Payment method</div>
                  <span className="text-[10px] font-extrabold text-[#0A5C16] bg-[#ECFDF3] border border-[#BBF7D0] px-2 py-0.5 rounded-full">
                    Prepaid UPI • ₹0 Gateway Fee
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-[#0C831F] bg-[#ECFDF3]/70 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0C831F] text-white flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-gray-950">
                      Direct UPI (GPay, PhonePe, Paytm &amp; BHIM)
                    </div>
                    <p className="text-[11px] text-gray-700 mt-0.5 leading-snug">
                      Scan the UPI QR code or tap to open your UPI app on the next step. Stock is checked before order confirmation, and you can share the QR if paying for family.
                    </p>
                  </div>
                </div>

                {formError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Hidden anti-bot honeypot field */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                <div className="flex items-center gap-1.5 text-[10.5px] text-gray-500 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0C831F] shrink-0" />
                  <span>
                    18+ India orders • By ordering you agree to our{' '}
                    <Link href="/privacy" className="text-[#0C831F] font-semibold underline">
                      Privacy Policy
                    </Link>{' '}
                    &amp;{' '}
                    <Link href="/terms" className="text-[#0C831F] font-semibold underline">
                      Terms
                    </Link>
                  </span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Sticky Bottom Proceed Bar */}
        {cart.length > 0 && (
          <div className="p-3.5 bg-white border-t border-gray-200 shrink-0 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
            <button
              type="submit"
              form="ayurswift-checkout-form"
              disabled={isSubmitting}
              className="w-full bg-[#0C831F] hover:bg-[#096B19] disabled:opacity-60 text-white rounded-2xl px-4 py-3 flex items-center justify-between transition-all shadow-lg shadow-[#0C831F]/25 active:scale-[0.98] cursor-pointer"
            >
              <div className="text-left leading-tight">
                <div className="text-base font-extrabold tabular-nums">₹{grandTotal}</div>
                <div className="text-[10px] font-semibold text-emerald-100 uppercase tracking-wider">
                  TOTAL ({paymentMethod})
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-extrabold text-sm">
                <span>{isSubmitting ? 'Confirming...' : 'Place Order'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
