'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { CartDrawer } from '@/components/CartDrawer';
import { PaymentModal } from '@/components/PaymentModal';
import { MedicineDetailModal } from '@/components/MedicineDetailModal';
import { LocationModal, LocationInfo } from '@/components/LocationModal';
import { QuickBuyModal } from '@/components/QuickBuyModal';
import { MobileFilterDrawer } from '@/components/MobileFilterDrawer';
import { AccountModal } from '@/components/AccountModal';
import { OrderTrackingModal } from '@/components/OrderTrackingModal';
import {
  Product,
  CartItem,
  Order,
  DeliveryType,
  PaymentMethod,
  MerchantSettings,
} from '@/types';
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
  PhoneCall,
  CheckCircle,
  CheckCircle2,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Home,
  Compass,
  User,
  MapPin,
  Lock,
} from 'lucide-react';

const DEFAULT_LOCATION: LocationInfo = {
  area: 'Bhavnagar 364001',
  city: 'Bhavnagar',
  pincode: '364001',
  dispatchType: 'RAPIDO_CITY',
  estimate: '30–45m Rapido',
};

type SortKey = 'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'DISCOUNT_DESC' | 'RATING_DESC';

// The 4 Main Health Concern Tiles
const FOUR_MAIN_CONCERNS = [
  {
    id: 'Joint & Muscle Pain',
    title: 'Joint & Muscle Pain',
    sub: 'Balms, sprays & liniments',
    icon: '🦵',
  },
  {
    id: 'Digestion & Acidity',
    title: 'Digestion & Acidity',
    sub: 'Pearls, churna & psyllium husk',
    icon: '🍃',
  },
  {
    id: 'Immunity & Cold',
    title: 'Immunity & Cold',
    sub: 'Chyawanprash & herbal syrups',
    icon: '🍯',
  },
  {
    id: 'Skin & Hair',
    title: 'Skin & Hair',
    sub: 'Aloe vera gels & almond oils',
    icon: '💆',
  },
];

const COMPACT_BRANDS = ['Dabur', 'Zandu', 'Himalaya', 'Baidyanath'];

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<MerchantSettings>(getStoredSettings());

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isQuickBuyModalOpen, setIsQuickBuyModalOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedMedicineDetails, setSelectedMedicineDetails] = useState<Product | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [toastText, setToastText] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => setToastText(null), 3000);
  };

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState('ALL');
  const [selectedDispatch, setSelectedDispatch] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('FEATURED');

  // Callback form
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackSent, setCallbackSent] = useState(false);

  // Catalog anchor
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProducts(getStoredProducts());
    setSettings(getStoredSettings());

    try {
      const savedCart = sessionStorage.getItem('ayurswift_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedLoc = sessionStorage.getItem('ayurswift_location');
      if (savedLoc) {
        setCurrentLocation(JSON.parse(savedLoc));
      }
    } catch {}
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      sessionStorage.setItem('ayurswift_cart', JSON.stringify(newCart));
    } catch {}
  };

  const handleSelectLocation = (loc: LocationInfo) => {
    setCurrentLocation(loc);
    try {
      sessionStorage.setItem('ayurswift_location', JSON.stringify(loc));
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

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Strict in-stock only
      if (!p.isLive || p.stockQuantity <= 0) return false;

      // Category
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;

      // Brand
      if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return false;

      // Price Range
      if (selectedPriceRange === 'UNDER_100' && p.sellingPrice >= 100) return false;
      if (
        selectedPriceRange === '100_TO_200' &&
        (p.sellingPrice < 100 || p.sellingPrice > 200)
      ) {
        return false;
      }
      if (selectedPriceRange === 'ABOVE_200' && p.sellingPrice <= 200) return false;

      // Search Query
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

    // Sorting
    switch (sortBy) {
      case 'PRICE_ASC':
        result.sort((a, b) => a.sellingPrice - b.sellingPrice);
        break;
      case 'PRICE_DESC':
        result.sort((a, b) => b.sellingPrice - a.sellingPrice);
        break;
      case 'DISCOUNT_DESC':
        result.sort((a, b) => {
          const discA = (a.mrp - a.sellingPrice) / a.mrp;
          const discB = (b.mrp - b.sellingPrice) / b.mrp;
          return discB - discA;
        });
        break;
      case 'RATING_DESC':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'FEATURED':
      default:
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return result;
  }, [
    products,
    selectedCategory,
    selectedBrand,
    selectedPriceRange,
    searchQuery,
    sortBy,
  ]);

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
    showToast(`Added ${product.name} to basket`);
  };

  const handleReorder = (items: { productId: string; quantity: number }[]) => {
    let updated = [...cart];
    items.forEach(({ productId, quantity }) => {
      const product = products.find((p) => p.id === productId);
      if (product && product.stockQuantity > 0) {
        const existing = updated.find((i) => i.product.id === productId);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + quantity, product.stockQuantity);
        } else {
          updated.push({ product, quantity: Math.min(quantity, product.stockQuantity) });
        }
      }
    });
    saveCart(updated);
    setIsCartOpen(true);
    showToast('Items reloaded into your basket');
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

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedBrand('ALL');
    setSelectedPriceRange('ALL');
    setSelectedDispatch('ALL');
    setSearchQuery('');
  };

  const activeFilterCount =
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedBrand !== 'ALL' ? 1 : 0) +
    (selectedPriceRange !== 'ALL' ? 1 : 0) +
    (selectedDispatch !== 'ALL' ? 1 : 0);

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
    if (!callbackPhone.trim()) return;
    const clean = callbackPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello AyurSwift! I want to order medicines via call/WhatsApp. My phone number is: ${clean}. Please confirm dispatch in Bhavnagar.`
    );
    window.open(`https://wa.me/${settings.merchantWhatsApp}?text=${message}`, '_blank');
    setCallbackSent(true);
    setTimeout(() => setCallbackSent(false), 4000);
  };

  const scrollToCatalog = () => {
    if (typeof window === 'undefined') return;
    if (catalogRef.current) {
      const headerOffset = 150;
      const elementPosition = catalogRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      });
    }
  };

  // Top 4 Bestsellers for the dedicated row (Zandu Balm, Pudin Hara, Mahanarayan Tel, Liv.52)
  const bestsellerIds = ['prod-001', 'prod-006', 'prod-002', 'prod-018'];
  const bestsellerProducts = useMemo(() => {
    return products.filter(
      (p) => bestsellerIds.includes(p.id) && p.isLive && p.stockQuantity > 0
    );
  }, [products]);

  return (
    <div className="min-h-screen bg-[#f8f8f3] text-[#1c2820] flex flex-col font-sans pb-20 md:pb-0">
      {/* 1. Refined Header */}
      <Header
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim()) scrollToCatalog();
        }}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          scrollToCatalog();
        }}
        currentLocation={currentLocation}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenQuickBuyModal={() => setIsQuickBuyModalOpen(true)}
        products={products}
        onSelectProduct={(p) => setSelectedMedicineDetails(p)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 w-full space-y-6 sm:space-y-8">
        {/* ============================================================== */}
        {/* SIMPLE EDITORIAL HERO                                          */}
        {/* ============================================================== */}
        <section className="rounded-3xl bg-[#e9efdf] border border-[#d6ddce] p-6 sm:p-10 shadow-2xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3.5 max-w-xl z-10">
            <h1 className="font-serif font-bold text-2xl sm:text-4xl text-[#143d29] tracking-tight leading-tight">
              Authentic Ayurvedic Remedies,
              <br />
              <span className="text-[#1d5a3e]">Delivered Swiftly.</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
              Genuine herbal oils, pain balms, and daily health products sourced directly from trusted Ayurvedic houses.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={scrollToCatalog}
                className="bg-[#1d5a3e] hover:bg-[#143d29] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span>Shop products</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="bg-white hover:bg-gray-50 text-[#143d29] border border-[#d6ddce] font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#1d5a3e]" />
                <span>Check delivery</span>
              </button>
            </div>
          </div>

          {/* Tasteful Illustrated Wellness Still Life (Restrained botanical & apothecary art) */}
          <div className="w-full md:w-72 h-44 sm:h-52 bg-white/85 rounded-2xl border border-[#d6ddce] flex items-center justify-center p-4 relative shadow-2xs shrink-0 overflow-hidden">
            <svg
              className="w-full h-full max-w-[240px]"
              viewBox="0 0 200 150"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Ayurvedic mortar, herbal oil jar and botanical leaves still life"
            >
              {/* Soft decorative background circles */}
              <circle cx="100" cy="75" r="50" fill="#e9efdf" opacity="0.6" />
              <circle cx="140" cy="55" r="30" fill="#f8f8f3" />

              {/* Apothecary Medicated Oil Jar */}
              <rect x="110" y="55" width="42" height="60" rx="8" fill="#1d5a3e" />
              <rect x="120" y="44" width="22" height="12" rx="3" fill="#c86326" />
              <rect x="116" y="68" width="30" height="32" rx="4" fill="#ffffff" opacity="0.95" />
              <line x1="122" y1="78" x2="140" y2="78" stroke="#1d5a3e" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="124" y1="86" x2="138" y2="86" stroke="#c86326" strokeWidth="2" strokeLinecap="round" />

              {/* Traditional Mortar & Pestle */}
              <ellipse cx="65" cy="100" rx="36" ry="18" fill="#143d29" />
              <path d="M32 98 C34 116, 96 116, 98 98 Z" fill="#1d5a3e" />
              <ellipse cx="65" cy="98" rx="32" ry="12" fill="#dfe7d2" />
              {/* Pestle */}
              <rect x="74" y="62" width="10" height="42" rx="5" transform="rotate(24 74 62)" fill="#c86326" />

              {/* Botanical Ayurvedic Foliage */}
              <path
                d="M45 65 Q 40 40 60 48 Q 50 68 45 65 Z"
                fill="#2e7d32"
                opacity="0.8"
              />
              <path
                d="M72 45 Q 85 28 92 46 Q 80 58 72 45 Z"
                fill="#1d5a3e"
              />
              <path
                d="M148 42 Q 165 30 162 48 Q 148 56 148 42 Z"
                fill="#388e3c"
                opacity="0.7"
              />
            </svg>
          </div>
        </section>

        {/* ============================================================== */}
        {/* CONCISE DELIVERY INFORMATION BLOCK                             */}
        {/* ============================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white border border-[#d6ddce] rounded-2xl p-4 shadow-2xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#e9efdf] text-[#1d5a3e] flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-5 h-5 fill-[#c86326] text-[#c86326]" />
            </div>
            <div className="space-y-0.5">
              <div className="font-serif font-bold text-sm text-[#143d29]">
                Local Express Delivery
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                30–45 min doorstep delivery in Bhavnagar. ₹{settings.cityDeliveryFee} fee (Free for orders over ₹{settings.cityFreeDeliveryAbove}).
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#d6ddce] rounded-2xl p-4 shadow-2xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#e9efdf] text-[#1d5a3e] flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="w-5 h-5 text-[#1d5a3e]" />
            </div>
            <div className="space-y-0.5">
              <div className="font-serif font-bold text-sm text-[#143d29]">
                All-India Courier
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Carefully packed parcels dispatched nationwide for a flat ₹{settings.courierDeliveryFee}.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#d6ddce] rounded-2xl p-4 shadow-2xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#e9efdf] text-[#1d5a3e] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5 text-[#1d5a3e]" />
            </div>
            <div className="space-y-0.5">
              <div className="font-serif font-bold text-sm text-[#143d29]">
                100% Genuine Pharmacy Stock
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Direct authorized agency procurement with verified GST billing from India's trusted Ayurvedic houses.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* FOUR MAIN CONCERN TILES                                        */}
        {/* ============================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-base sm:text-lg text-[#143d29] tracking-tight">
              Shop by Health Concern
            </h2>
            {selectedCategory !== 'ALL' && (
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="text-xs font-bold text-[#1d5a3e] hover:underline"
              >
                View All Categories
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FOUR_MAIN_CONCERNS.map((concern) => {
              const isSelected = selectedCategory === concern.id;
              return (
                <button
                  key={concern.id}
                  onClick={() => {
                    setSelectedCategory(concern.id);
                    scrollToCatalog();
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all hover:shadow-sm cursor-pointer ${
                    isSelected
                      ? 'border-[#1d5a3e] bg-[#e9efdf] ring-2 ring-[#1d5a3e]'
                      : 'bg-white border-[#d6ddce] hover:border-[#1d5a3e]'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f8f8f3] border border-[#d6ddce] flex items-center justify-center text-xl mb-2.5">
                    {concern.icon}
                  </div>
                  <div className="font-serif font-bold text-xs sm:text-sm text-gray-900 line-clamp-1">
                    {concern.title}
                  </div>
                  <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">
                    {concern.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* COMPACT BRAND STRIP (Dabur, Zandu, Himalaya, Baidyanath)       */}
        {/* ============================================================== */}
        <section className="bg-white border border-[#d6ddce] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-serif font-bold text-[#143d29]">
              Featured Ayurvedic Houses:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {COMPACT_BRANDS.map((brand) => {
                const isSelected = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    onClick={() => {
                      setSelectedBrand(isSelected ? 'ALL' : brand);
                      scrollToCatalog();
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#1d5a3e] text-white border-[#1d5a3e] shadow-2xs'
                        : 'bg-[#f8f8f3] text-gray-700 border-[#d6ddce] hover:border-[#1d5a3e] hover:text-[#1d5a3e]'
                    }`}
                  >
                    {brand}
                  </button>
                );
              })}
              {selectedBrand !== 'ALL' && (
                <button
                  onClick={() => setSelectedBrand('ALL')}
                  className="text-[11px] font-bold text-[#1d5a3e] hover:underline px-1"
                >
                  Clear Brand
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* FEATURED REMEDIES (Featured Once)                              */}
        {/* ============================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-[#143d29] tracking-tight">
                Featured Remedies
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Popular Ayurvedic essentials ready for immediate dispatch
              </p>
            </div>
            <button
              onClick={scrollToCatalog}
              className="text-xs font-bold text-[#1d5a3e] hover:underline cursor-pointer"
            >
              Browse Complete Catalog ({products.filter((p) => p.isLive && p.stockQuantity > 0).length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {bestsellerProducts.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              return (
                <ProductCard
                  key={`bestseller-${product.id}`}
                  product={product}
                  quantityInCart={inCart ? inCart.quantity : 0}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onViewDetails={(p) => setSelectedMedicineDetails(p)}
                />
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* COMPLETE MEDICINE CATALOG (Reference 2: Filters & Grid)         */}
        {/* ============================================================== */}
        <div ref={catalogRef} className="pt-6 border-t border-[#d6ddce] scroll-mt-44 sm:scroll-mt-36">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="text-xs text-gray-500 mb-3 flex items-center gap-1.5 font-medium"
          >
            <span
              className="hover:text-gray-900 cursor-pointer"
              onClick={handleResetFilters}
            >
              Home
            </span>
            <span>/</span>
            <span
              className="hover:text-gray-900 cursor-pointer"
              onClick={() => setSelectedCategory('ALL')}
            >
              Medicines
            </span>
            <span>/</span>
            <span className="text-[#1d5a3e] font-bold">
              {selectedCategory === 'ALL' ? 'Complete Catalog' : selectedCategory}
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Desktop Left Filter Sidebar */}
            <aside
              className="hidden lg:block w-64 bg-white rounded-2xl border border-[#d6ddce] p-4 shrink-0 space-y-5 shadow-2xs sticky top-28"
              aria-label="Product filters"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h3 className="font-serif font-bold text-sm text-[#143d29] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#1d5a3e]" />
                  <span>Filters</span>
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-[#1d5a3e] hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Category</span>
                  {selectedCategory !== 'ALL' && (
                    <button
                      onClick={() => setSelectedCategory('ALL')}
                      className="text-[11px] text-[#1d5a3e] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <label
                    onClick={() => setSelectedCategory('ALL')}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-[#e9efdf] transition-colors"
                  >
                    <input
                      type="radio"
                      name="desktop_category"
                      checked={selectedCategory === 'ALL'}
                      onChange={() => setSelectedCategory('ALL')}
                      className="accent-[#1d5a3e] w-3.5 h-3.5"
                    />
                    <span
                      className={
                        selectedCategory === 'ALL'
                          ? 'font-bold text-[#1d5a3e]'
                          : 'text-gray-700'
                      }
                    >
                      All Categories ({products.filter((p) => p.isLive && p.stockQuantity > 0).length})
                    </span>
                  </label>

                  {availableCategories.map((cat) => {
                    const count = products.filter(
                      (p) => p.isLive && p.stockQuantity > 0 && p.category === cat
                    ).length;
                    return (
                      <label
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-[#e9efdf] transition-colors"
                      >
                        <input
                          type="radio"
                          name="desktop_category"
                          checked={selectedCategory === cat}
                          onChange={() => setSelectedCategory(cat)}
                          className="accent-[#1d5a3e] w-3.5 h-3.5"
                        />
                        <span
                          className={
                            selectedCategory === cat
                              ? 'font-bold text-[#1d5a3e]'
                              : 'text-gray-700'
                          }
                        >
                          {cat} ({count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Brands Filter */}
              <div className="space-y-2 border-t border-gray-100 pt-3.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Brand</span>
                  {selectedBrand !== 'ALL' && (
                    <button
                      onClick={() => setSelectedBrand('ALL')}
                      className="text-[11px] text-[#1d5a3e] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto pr-1">
                  <label
                    onClick={() => setSelectedBrand('ALL')}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-[#e9efdf]"
                  >
                    <input
                      type="radio"
                      name="desktop_brand"
                      checked={selectedBrand === 'ALL'}
                      onChange={() => setSelectedBrand('ALL')}
                      className="accent-[#1d5a3e] w-3.5 h-3.5"
                    />
                    <span
                      className={
                        selectedBrand === 'ALL'
                          ? 'font-bold text-[#1d5a3e]'
                          : 'text-gray-700'
                      }
                    >
                      All Brands
                    </span>
                  </label>

                  {availableBrands.map((brand) => (
                    <label
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-[#e9efdf]"
                    >
                      <input
                        type="radio"
                        name="desktop_brand"
                        checked={selectedBrand === brand}
                        onChange={() => setSelectedBrand(brand)}
                        className="accent-[#1d5a3e] w-3.5 h-3.5"
                      />
                      <span
                        className={
                          selectedBrand === brand
                            ? 'font-bold text-[#1d5a3e]'
                            : 'text-gray-700'
                        }
                      >
                        {brand}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2 border-t border-gray-100 pt-3.5 text-xs">
                <span className="font-bold text-gray-700 block">Price Range</span>
                <div className="space-y-1">
                  {[
                    { id: 'ALL', label: 'All Prices' },
                    { id: 'UNDER_100', label: 'Under ₹100' },
                    { id: '100_TO_200', label: '₹100 to ₹200' },
                    { id: 'ABOVE_200', label: 'Above ₹200' },
                  ].map((r) => (
                    <label
                      key={r.id}
                      onClick={() => setSelectedPriceRange(r.id)}
                      className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-[#e9efdf]"
                    >
                      <input
                        type="radio"
                        name="desktop_price"
                        checked={selectedPriceRange === r.id}
                        onChange={() => setSelectedPriceRange(r.id)}
                        className="accent-[#1d5a3e] w-3.5 h-3.5"
                      />
                      <span
                        className={
                          selectedPriceRange === r.id
                            ? 'font-bold text-[#1d5a3e]'
                            : 'text-gray-700'
                        }
                      >
                        {r.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Catalog Feed */}
            <div className="flex-1 w-full space-y-4">
              {/* Heading, Result Count & Sort Bar */}
              <div className="bg-white border border-[#d6ddce] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <h2 className="font-serif font-bold text-lg sm:text-xl text-[#143d29] tracking-tight">
                    {selectedCategory === 'ALL'
                      ? 'Complete In-Stock Catalog'
                      : selectedCategory}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Showing {filteredProducts.length} in-stock remedies
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Mobile Filters Trigger */}
                  <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[#e9efdf] hover:bg-[#dfe7d2] text-[#143d29] rounded-xl text-xs font-bold transition-colors border border-[#d6ddce]"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#1d5a3e]" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="bg-[#1d5a3e] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Sort Control */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-500 font-medium hidden md:inline">Sort:</span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortKey)}
                        className="appearance-none bg-[#f8f8f3] border border-[#d6ddce] rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#1d5a3e] cursor-pointer"
                        aria-label="Sort products"
                      >
                        <option value="FEATURED">Featured / Popular</option>
                        <option value="PRICE_ASC">Price: Low to High</option>
                        <option value="PRICE_DESC">Price: High to Low</option>
                        <option value="DISCOUNT_DESC">Highest Discount %</option>
                        <option value="RATING_DESC">Top Customer Reviews</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#d6ddce] p-10 text-center space-y-3 shadow-2xs">
                  <div className="text-3xl">🔍</div>
                  <h3 className="font-serif font-bold text-gray-900 text-base">
                    No matching medicines found
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Try adjusting your filters or clear your search to view all in-stock items.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="bg-[#1d5a3e] hover:bg-[#143d29] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
        </div>

        {/* ============================================================== */}
        {/* RESTRAINED ORDER BY CALL / WHATSAPP STRIP                      */}
        {/* ============================================================== */}
        <section className="bg-white border border-[#d6ddce] rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#e9efdf] text-[#1d5a3e] flex items-center justify-center shrink-0 shadow-2xs">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="font-serif font-bold text-sm sm:text-base text-[#143d29]">
                Order by Phone or WhatsApp
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                Looking for a specific Ayurvedic medicine? Enter your number for instant order support.
              </div>
            </div>
          </div>

          <form
            onSubmit={handleCallbackSubmit}
            className="flex flex-wrap items-center gap-2 w-full md:w-auto"
          >
            <div className="flex items-center border border-[#d6ddce] rounded-xl px-3 py-2 bg-[#f8f8f3] text-xs text-gray-800 w-full sm:w-auto focus-within:border-[#1d5a3e]">
              <span className="font-bold text-gray-500 mr-1.5">🇮🇳 +91</span>
              <input
                type="tel"
                value={callbackPhone}
                onChange={(e) => setCallbackPhone(e.target.value)}
                placeholder="Enter 10-digit mobile"
                maxLength={10}
                className="w-40 focus:outline-none text-xs bg-transparent"
                required
                aria-label="Phone number for call/WhatsApp order"
              />
            </div>
            <button
              type="submit"
              className="bg-[#1d5a3e] hover:bg-[#143d29] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 active:scale-95"
            >
              {callbackSent ? 'Opening WhatsApp...' : 'Submit WhatsApp Order'}
            </button>
          </form>
        </section>
      </main>

      {/* Floating Zepto / Blinkit Bottom Sticky Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 md:bottom-4 inset-x-0 z-40 p-3 sm:p-4 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="bg-[#1d5a3e] text-white p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-3">
                <div className="relative bg-[#143d29] p-2 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-[#f8f8f3]" />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#c86326] text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-sm sm:text-base">₹{cartSubtotal}</span>
                    {cartSavings > 0 && (
                      <span className="text-[11px] text-emerald-200 font-semibold">
                        (Saved ₹{cartSavings})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-100 block">
                    {cartCount} item{cartCount === 1 ? '' : 's'} in basket
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="bg-[#f8f8f3] hover:bg-white text-[#143d29] font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
              >
                <span>View Basket</span>
                <ArrowRight className="w-4 h-4 text-[#1d5a3e]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FIXED MOBILE BOTTOM NAVIGATION (Shop, Browse, Basket, Account) */}
      {/* ============================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-50 bg-[#f8f8f3]/95 backdrop-blur-md border-t border-[#d6ddce] py-1 px-4 flex justify-around items-center md:hidden shadow-lg touch-manipulation"
      >
        {/* 1. Shop */}
        <button
          type="button"
          onClick={() => {
            handleResetFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center text-center text-[10.5px] font-bold text-[#1d5a3e] active:scale-95 transition-transform min-w-[56px] min-h-[48px] p-1.5 cursor-pointer"
          aria-label="Shop Home"
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Shop</span>
        </button>

        {/* 2. Browse (Scrolls to Catalog & Opens Filter Drawer) */}
        <button
          type="button"
          onClick={() => {
            scrollToCatalog();
            setIsMobileFilterOpen(true);
          }}
          className="flex flex-col items-center justify-center text-center text-[10.5px] font-medium text-[#526359] hover:text-[#1d5a3e] active:scale-95 transition-transform min-w-[56px] min-h-[48px] p-1.5 cursor-pointer"
          aria-label="Browse Categories & Catalog"
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>Browse</span>
        </button>

        {/* 3. Basket (Opens Cart Drawer) */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center text-center text-[10.5px] font-medium text-[#526359] hover:text-[#1d5a3e] relative active:scale-95 transition-transform min-w-[56px] min-h-[48px] p-1.5 cursor-pointer"
          aria-label="View Basket"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#c86326] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span>Basket</span>
        </button>

        {/* 4. Account (Opens AccountModal) */}
        <button
          type="button"
          onClick={() => setIsAccountModalOpen(true)}
          className="flex flex-col items-center justify-center text-center text-[10.5px] font-medium text-[#526359] hover:text-[#1d5a3e] active:scale-95 transition-transform min-w-[56px] min-h-[48px] p-1.5 cursor-pointer"
          aria-label="Store & Account Help"
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Account</span>
        </button>
      </nav>

      {/* Concise Footer with Contact & Owner Access */}
      <footer className="mt-14 bg-white border-t border-[#d6ddce] py-8 text-xs text-gray-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span className="font-serif font-bold text-[#143d29] text-sm">
              AyurSwift 🌿⚡
            </span>
            <span className="text-[#a8b89e] hidden sm:inline">•</span>
            <span className="text-gray-500 text-[11.5px]">
              Authentic Ayurveda &amp; Everyday Health
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-[#526359]">
            <a
              href={`https://wa.me/${settings.merchantWhatsApp.replace(/\D/g, '')}?text=Hi%20AyurSwift,%20I%20have%20an%20inquiry.`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1d5a3e] font-medium"
            >
              WhatsApp: +91 96247 66242
            </a>
            <span className="text-[#d6ddce]">•</span>
            <span>Bhavnagar, Gujarat</span>
            <span className="text-[#d6ddce]">•</span>
            <Link
              href="/admin"
              className="text-[#1d5a3e] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              title="Store Owner & Admin Access"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Merchant Hub</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
        settings={settings}
      />

      <PaymentModal
        order={activeOrder}
        onClose={() => setActiveOrder(null)}
        settings={settings}
      />

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

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
      />

      <QuickBuyModal
        isOpen={isQuickBuyModalOpen}
        onClose={() => setIsQuickBuyModalOpen(false)}
        products={products}
        cart={cart}
        onAddToCart={handleAddToCart}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
      />

      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        products={products}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        selectedPriceRange={selectedPriceRange}
        onSelectPriceRange={setSelectedPriceRange}
        selectedDispatch={selectedDispatch}
        onSelectDispatch={setSelectedDispatch}
        availableCategories={availableCategories}
        availableBrands={availableBrands}
        onResetFilters={handleResetFilters}
        totalFilteredCount={filteredProducts.length}
      />

      {/* Floating Toast Notification */}
      {toastText && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] bg-[#143d29] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-150 border border-white/10 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastText}</span>
        </div>
      )}

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        settings={settings}
        currentLocation={currentLocation}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenOrderTracking={() => setIsOrderTrackingOpen(true)}
        onReorder={handleReorder}
      />

      <OrderTrackingModal
        isOpen={isOrderTrackingOpen}
        onClose={() => setIsOrderTrackingOpen(false)}
        settings={settings}
        onReorder={handleReorder}
      />
    </div>
  );
}
