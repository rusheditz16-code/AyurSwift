'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { CartDrawer } from '@/components/CartDrawer';
import { PaymentModal } from '@/components/PaymentModal';
import { MedicineDetailModal } from '@/components/MedicineDetailModal';
import { Product, CartItem, Order, DeliveryType, PaymentMethod, MerchantSettings } from '@/types';
import {
  getStoredProducts,
  getStoredOrders,
  saveStoredOrders,
  getStoredSettings,
  generateNextOrderId,
} from '@/lib/store';
import { INITIAL_PRODUCTS } from '@/lib/initialData';
import {
  Zap,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Package,
  QrCode,
  CheckCircle,
  FileCheck2,
  ChevronRight,
  Filter,
  PhoneCall,
  X,
} from 'lucide-react';

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<MerchantSettings>(getStoredSettings());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedMedicineDetails, setSelectedMedicineDetails] = useState<Product | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  // Phone callback input for Tata 1mg bottom strip
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackSuccess, setCallbackSuccess] = useState(false);

  useEffect(() => {
    setProducts(getStoredProducts());
    setSettings(getStoredSettings());

    try {
      const savedCart = sessionStorage.getItem('ayurswift_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch {}
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      sessionStorage.setItem('ayurswift_cart', JSON.stringify(newCart));
    } catch {}
  };

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.isLive && p.stockQuantity > 0) {
        cats.add(p.category);
      }
    });
    return Array.from(cats);
  }, [products]);

  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => {
      if (p.isLive && p.stockQuantity > 0) {
        brands.add(p.brand);
      }
    });
    return Array.from(brands);
  }, [products]);

  // STRICT AVAILABILITY GUARANTEE:
  // Customers ONLY see items currently in stock at home (stockQuantity > 0 and isLive === true)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isLive || p.stockQuantity <= 0) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(query);
        const matchBrand = p.brand.toLowerCase().includes(query);
        const matchCategory = p.category.toLowerCase().includes(query);
        const matchIndications = p.indications.toLowerCase().includes(query);
        const matchComposition = p.composition?.toLowerCase().includes(query);
        if (!matchName && !matchBrand && !matchCategory && !matchIndications && !matchComposition) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, selectedBrand, searchQuery]);

  // Cart calculations
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, item) => acc + item.product.sellingPrice * item.quantity,
    0
  );
  const cartTotalMrp = cart.reduce(
    (acc, item) => acc + item.product.mrp * item.quantity,
    0
  );
  const cartSavings = cartTotalMrp - cartSubtotal;

  // Cart actions
  const handleAddToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    let updated: CartItem[];
    if (existing) {
      if (existing.quantity >= product.stockQuantity) return;
      updated = cart.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updated = [...cart, { product, quantity: 1 }];
    }
    saveCart(updated);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      const updated = cart.filter((item) => item.product.id !== productId);
      saveCart(updated);
    } else {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const finalQty = Math.min(quantity, product.stockQuantity);
      const updated = cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: finalQty } : item
      );
      saveCart(updated);
    }
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const handlePlaceOrder = (orderData: {
    customerName: string;
    customerPhone: string;
    deliveryType: DeliveryType;
    deliveryAddress: string;
    city: string;
    pincode: string;
    landmark?: string;
    paymentMethod: PaymentMethod;
  }) => {
    const existingOrders = getStoredOrders();
    const orderId = generateNextOrderId(existingOrders);

    let deliveryFee = 0;
    if (orderData.deliveryType === 'RAPIDO_CITY') {
      deliveryFee =
        cartSubtotal >= settings.cityFreeDeliveryAbove ? 0 : settings.cityDeliveryFee;
    } else {
      deliveryFee = settings.courierDeliveryFee;
    }

    const order: Order = {
      id: orderId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryType: orderData.deliveryType,
      deliveryAddress: orderData.deliveryAddress,
      city: orderData.city,
      pincode: orderData.pincode,
      landmark: orderData.landmark,
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        brand: item.product.brand,
        packSize: item.product.packSize,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        totalPrice: item.product.sellingPrice * item.quantity,
      })),
      subtotal: cartSubtotal,
      deliveryFee,
      totalAmount: cartSubtotal + deliveryFee,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'NEW',
      rapidoCopied: false,
      createdAt: new Date().toISOString(),
    };

    const updatedOrders = [order, ...existingOrders];
    saveStoredOrders(updatedOrders);

    setIsCartOpen(false);
    setActiveOrder(order);
    handleClearCart();
  };

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackPhone) return;
    const clean = callbackPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello AyurSwift! I want to order medicines via call/WhatsApp. My phone number is: ${clean}. Please dispatch my order.`
    );
    window.open(`https://wa.me/${settings.merchantWhatsApp}?text=${message}`, '_blank');
    setCallbackSuccess(true);
    setTimeout(() => setCallbackSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans">
      {/* 1. Tata 1mg + Truemeds Header Navigation */}
      <Header
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex-1 w-full space-y-6">
        {/* 2. Tata 1mg Exact Hero Promo Banners (Dual Carousel Cards from Image 1) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Banner 1: Dark Blue Health Checkup / Ayurvedic Protection */}
          <div className="rounded-2xl bg-gradient-to-r from-[#003B71] to-[#005B96] text-white p-5 sm:p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-2 z-10 max-w-[65%]">
              <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Home Dark Store
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                Prioritize Your Health &amp; Stay Ahead of Pain
              </h2>
              <p className="text-xs text-blue-100">
                Enjoy <strong>up to 25% off</strong> on genuine Ayurvedic &amp; primary OTC medicines.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setSelectedCategory('Joint & Muscle Pain')}
                  className="bg-white text-[#003B71] hover:bg-blue-50 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                  <span>Explore Pain Care</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual element */}
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center text-5xl shrink-0 group-hover:scale-105 transition-transform">
              🌿
            </div>
          </div>

          {/* Banner 2: Sky Blue Tata 1mg Festive Essentials / 30-45m Rapido */}
          <div className="rounded-2xl bg-gradient-to-r from-[#EBF5FB] via-[#E1F0FA] to-[#D6EAF8] border border-[#B9D8F1] text-gray-900 p-5 sm:p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="space-y-2 z-10 max-w-[65%]">
              <span className="text-[10px] font-extrabold bg-[#10847e] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ⚡ 30–45 Mins Express
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#003B71] tracking-tight leading-snug">
                Dispatched via Rapido Bike Directly from Home
              </h2>
              <p className="text-xs text-gray-600">
                100% genuine wholesale agency billed remedies delivered right to your doorstep.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual element */}
            <div className="w-28 h-28 rounded-2xl bg-white/80 border border-[#B9D8F1] flex flex-col items-center justify-center p-2 shadow-xs shrink-0">
              <span className="text-3xl">⚡🚴</span>
              <span className="text-[10px] font-black text-[#10847e] mt-1 uppercase">Rapido Bike</span>
            </div>
          </div>
        </section>

        {/* 3. Tata 1mg Exact Care Plan / Membership Strip (From Image 1) */}
        <section className="bg-[#FFF4E5] border border-[#FFE0B2] rounded-2xl p-4 sm:p-4.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E65100] text-white flex items-center justify-center text-xl shrink-0 font-black">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#E65100] text-white text-[10px] font-black px-2 py-0.5 rounded">
                  AyurSwift Care
                </span>
                <span className="text-xs font-bold text-gray-800">
                  Free Express Delivery on Orders Above ₹{settings.cityFreeDeliveryAbove}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Zero payment gateway commission cuts • 100% direct bank UPI • Zero out-of-stock clutter.
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/${settings.merchantWhatsApp}?text=Hi%20AyurSwift,%20I%20want%20to%20know%20more%20about%20your%20home%20delivery%20and%20stock.`}
            target="_blank"
            rel="noreferrer"
            className="bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            Know More
          </a>
        </section>

        {/* 4. "Shop by health concerns" (Circular Categories Row from Image 1) */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
            Shop by Health Concerns
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              {
                id: 'Joint & Muscle Pain',
                title: 'Joint & Muscle Pain',
                sub: 'Balms, Sprays & Oils',
                icon: '🦵',
                color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              },
              {
                id: 'Digestion & Acidity',
                title: 'Digestion & Acidity',
                sub: 'Pearls, Churna & Husk',
                icon: '🍃',
                color: 'bg-amber-50 text-amber-800 border-amber-200',
              },
              {
                id: 'Immunity & Cold',
                title: 'Immunity & Cold',
                sub: 'Chyawanprash & Syrups',
                icon: '🍯',
                color: 'bg-blue-50 text-blue-800 border-blue-200',
              },
              {
                id: 'Liver & Vital Organs',
                title: 'Liver & Vital Organs',
                sub: 'Liv.52 & Herbal Care',
                icon: '🩺',
                color: 'bg-purple-50 text-purple-800 border-purple-200',
              },
              {
                id: 'Daily Wellness',
                title: 'Daily Wellness',
                sub: 'Natural Supplements',
                icon: '✨',
                color: 'bg-rose-50 text-rose-800 border-rose-200',
              },
            ].map((concern) => (
              <button
                key={concern.id}
                onClick={() => setSelectedCategory(concern.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all hover:shadow-sm ${
                  selectedCategory === concern.id
                    ? 'border-[#10847e] bg-[#F2F9F9] ring-2 ring-[#10847e]'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-2xl mb-2 border border-gray-100">
                  {concern.icon}
                </div>
                <div className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-1">
                  {concern.title}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                  {concern.sub}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 5. Truemeds Exact Two-Column Architecture (Filters Sidebar + 4-Column Grid from Image 2) */}
        <section className="pt-2">
          {/* Breadcrumbs (Truemeds style) */}
          <div className="text-xs text-gray-400 mb-3 flex items-center gap-1.5 font-medium">
            <span className="hover:text-gray-700 cursor-pointer" onClick={() => setSelectedCategory('ALL')}>
              Home
            </span>
            <span>/</span>
            <span className="hover:text-gray-700 cursor-pointer" onClick={() => setSelectedCategory('ALL')}>
              Categories
            </span>
            <span>/</span>
            <span className="text-[#10847e] font-semibold">
              {selectedCategory === 'ALL' ? 'All Medicines' : selectedCategory}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* LEFT SIDEBAR: FILTERS (Exact Truemeds Left Box) */}
            <aside className="w-full lg:w-64 bg-white rounded-2xl border border-gray-200 p-4 shrink-0 space-y-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-[#10847e]" />
                  <span>Filters</span>
                </h3>
                {(selectedCategory !== 'ALL' || selectedBrand !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSelectedBrand('ALL');
                      setSearchQuery('');
                    }}
                    className="text-xs font-bold text-[#10847e] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Filter Group */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                  <span>Category</span>
                  {selectedCategory !== 'ALL' && (
                    <button
                      onClick={() => setSelectedCategory('ALL')}
                      className="text-[11px] text-[#10847e] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <label
                    onClick={() => setSelectedCategory('ALL')}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="category_filter"
                      checked={selectedCategory === 'ALL'}
                      onChange={() => setSelectedCategory('ALL')}
                      className="accent-[#10847e] w-3.5 h-3.5"
                    />
                    <span className={selectedCategory === 'ALL' ? 'font-bold text-[#10847e]' : 'text-gray-700'}>
                      All Categories ({products.filter((p) => p.isLive && p.stockQuantity > 0).length})
                    </span>
                  </label>

                  {availableCategories.map((cat) => {
                    const count = products.filter((p) => p.isLive && p.stockQuantity > 0 && p.category === cat).length;
                    return (
                      <label
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="category_filter"
                          checked={selectedCategory === cat}
                          onChange={() => setSelectedCategory(cat)}
                          className="accent-[#10847e] w-3.5 h-3.5"
                        />
                        <span className={selectedCategory === cat ? 'font-bold text-[#10847e]' : 'text-gray-700'}>
                          {cat} ({count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Brands Filter Group */}
              <div className="space-y-2 border-t border-gray-100 pt-3.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                  <span>Brands</span>
                  {selectedBrand !== 'ALL' && (
                    <button
                      onClick={() => setSelectedBrand('ALL')}
                      className="text-[11px] text-[#10847e] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                  <label
                    onClick={() => setSelectedBrand('ALL')}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="brand_filter"
                      checked={selectedBrand === 'ALL'}
                      onChange={() => setSelectedBrand('ALL')}
                      className="accent-[#10847e] w-3.5 h-3.5"
                    />
                    <span className={selectedBrand === 'ALL' ? 'font-bold text-[#10847e]' : 'text-gray-700'}>
                      All Brands
                    </span>
                  </label>

                  {availableBrands.map((brand) => (
                    <label
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="brand_filter"
                        checked={selectedBrand === brand}
                        onChange={() => setSelectedBrand(brand)}
                        className="accent-[#10847e] w-3.5 h-3.5"
                      />
                      <span className={selectedBrand === brand ? 'font-bold text-[#10847e]' : 'text-gray-700'}>
                        {brand}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Guarantee Checkbox */}
              <div className="border-t border-gray-100 pt-3.5 space-y-2 text-xs">
                <span className="font-bold text-gray-900 block">Dispatch Speed</span>
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1 text-[11px] text-emerald-900">
                  <div className="font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>30–45 Mins Rapido Parcel</span>
                  </div>
                  <p className="text-gray-600 text-[10.5px]">
                    Direct home dark store fulfillment. Zero queue delay.
                  </p>
                </div>
              </div>
            </aside>

            {/* RIGHT MAIN CATALOG GRID (Exact Truemeds Product Feed) */}
            <div className="flex-1 w-full space-y-4">
              {/* Category Title & Count (Truemeds style) */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                    {selectedCategory === 'ALL'
                      ? 'Ayurvedic & Primary Health OTC Medicines'
                      : selectedCategory}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Strict Availability Guarantee: Only currently stocked remedies in home dark store are displayed.
                  </p>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredProducts.length} medicines in stock
                </span>
              </div>

              {/* Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
                  <div className="text-4xl">🔍</div>
                  <h3 className="font-bold text-gray-800 text-sm">No stocked medicines found</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    No currently stocked products match your filter. Try clearing filters or searching for another remedy.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                      setSelectedBrand('ALL');
                    }}
                    className="text-xs font-bold text-[#10847e] hover:underline"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredProducts.map((product) => {
                    const itemInCart = cart.find((i) => i.product.id === product.id);
                    const quantityInCart = itemInCart ? itemInCart.quantity : 0;

                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        quantityInCart={quantityInCart}
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onViewDetails={(p) => setSelectedMedicineDetails(p)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 6. Tata 1mg Exact "Order Medicines on Call / WhatsApp" Strip (From Image 1) */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10847e] flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-gray-900">
                Order Medicines on Call / WhatsApp
              </div>
              <div className="text-xs text-gray-500">
                Call/Message us directly or get an immediate Rapido bike dispatch
              </div>
            </div>
          </div>

          <form onSubmit={handleCallbackSubmit} className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 bg-white text-xs text-gray-700 w-full sm:w-auto">
              <span className="font-bold text-gray-500 mr-1.5">🇮🇳 +91</span>
              <input
                type="tel"
                value={callbackPhone}
                onChange={(e) => setCallbackPhone(e.target.value)}
                placeholder="Enter Phone Number"
                maxLength={10}
                className="w-40 focus:outline-none text-xs"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-[#E54B38] hover:bg-[#D43D2A] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 active:scale-95"
            >
              Get a Call / WhatsApp Order
            </button>
          </form>
        </section>
      </main>

      {/* Floating Zepto / Blinkit Bottom Sticky Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-black/20 via-black/5 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="bg-[#10847e] text-white p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-250">
              <div className="flex items-center gap-3">
                <div className="relative bg-[#0c6b66] p-2 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-amber-300" />
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-gray-900 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-sm sm:text-base">
                      ₹{cartSubtotal}
                    </span>
                    {cartSavings > 0 && (
                      <span className="text-[11px] text-amber-300 font-bold">
                        (Saved ₹{cartSavings})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-100 block">
                    {cartCount} medicine{cartCount === 1 ? '' : 's'} ready for Rapido dispatch
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <span>View Cart &amp; Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tata 1mg / Truemeds Clean Clinical Footer */}
      <footer className="mt-14 bg-white border-t border-gray-200 py-10 text-xs text-gray-500 space-y-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <span className="text-[#10847e]">AyurSwift 🌿⚡</span>
            <span className="text-gray-300">•</span>
            <span>ayurswift.in</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-gray-500">
            <span>⚡ In-City 30-45m Rapido Parcel</span>
            <span>•</span>
            <span>📦 All-India Speed Post &amp; Courier</span>
            <span>•</span>
            <span>🛡️ 100% Genuine Wholesale Agency Stock</span>
            <span>•</span>
            <span>📱 Direct Bank UPI (₹0 Commission)</span>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 text-center max-w-xl mx-auto">
          AyurSwift operates as a home-based micro-fulfillment dark store for authentic Ayurvedic &amp; primary OTC medicines with verified GST billing.
        </p>
      </footer>

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
        settings={settings}
      />

      {/* UPI QR & WhatsApp Order Confirmation Modal */}
      <PaymentModal
        order={activeOrder}
        onClose={() => setActiveOrder(null)}
        settings={settings}
      />

      {/* Medicine Quick-View Modal */}
      <MedicineDetailModal
        product={selectedMedicineDetails}
        onClose={() => setSelectedMedicineDetails(null)}
        quantityInCart={
          selectedMedicineDetails
            ? cart.find((i) => i.product.id === selectedMedicineDetails.id)?.quantity || 0
            : 0
        }
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  );
}
