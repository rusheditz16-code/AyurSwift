'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ProductShelf } from '@/components/ProductShelf';
import { CategoryFilter, SortKey } from '@/components/CategoryFilter';
import { CartDrawer } from '@/components/CartDrawer';
import { PaymentModal } from '@/components/PaymentModal';
import { MedicineDetailModal } from '@/components/MedicineDetailModal';
import { LocationModal, LocationInfo } from '@/components/LocationModal';
import { QuickBuyModal } from '@/components/QuickBuyModal';
import { MobileFilterDrawer } from '@/components/MobileFilterDrawer';
import { AccountModal } from '@/components/AccountModal';
import { OrderTrackingModal } from '@/components/OrderTrackingModal';
import { HeroAnimatedShowcase } from '@/components/HeroAnimatedShowcase';
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
  getStoredSettings,
  placeOrderOnServer,
  fetchLiveCatalogFromServer,
} from '@/lib/store';
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS } from '@/lib/initialData';
import {
  Zap,
  ShieldCheck,
  ShoppingCart,
  ArrowRight,
  PhoneCall,
  Home,
  LayoutGrid,
  Package,
  User,
  Lock,
  Sparkles,
  Activity,
  Leaf,
  HeartPulse,
  Droplets,
  ShieldPlus,
  QrCode,
  CheckCircle2,
  MessageCircle,
  Search,
} from 'lucide-react';

const DEFAULT_LOCATION: LocationInfo = {
  area: 'Bhavnagar City',
  city: 'Bhavnagar',
  pincode: '364001',
  dispatchType: 'RAPIDO_CITY',
  estimate: 'Local Express Delivery (30–45 mins)',
};

const CATEGORY_CARDS = [
  {
    id: 'Joint & Muscle Pain',
    title: 'Joint & Pain',
    sub: 'Balms & classical oils',
    icon: Activity,
    bg: 'bg-emerald-50',
    iconColor: 'text-[#0C831F]',
    border: 'border-emerald-200/70',
  },
  {
    id: 'Digestion & Acidity',
    title: 'Digestion',
    sub: 'Churna, husk & pearls',
    icon: Leaf,
    bg: 'bg-teal-50',
    iconColor: 'text-teal-700',
    border: 'border-teal-200/70',
  },
  {
    id: 'Immunity & Cold',
    title: 'Immunity',
    sub: 'Chyawanprash & syrups',
    icon: ShieldPlus,
    bg: 'bg-amber-50',
    iconColor: 'text-amber-700',
    border: 'border-amber-200/70',
  },
  {
    id: 'Skin & Hair',
    title: 'Skin & Hair',
    sub: 'Aloe gels & almond oil',
    icon: Sparkles,
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    border: 'border-rose-200/70',
  },
  {
    id: 'Daily Wellness',
    title: 'Daily Wellness',
    sub: 'Vitality & herbal tonics',
    icon: HeartPulse,
    bg: 'bg-sky-50',
    iconColor: 'text-sky-700',
    border: 'border-sky-200/70',
  },
  {
    id: 'Liver & Detox',
    title: 'Liver & Detox',
    sub: 'Liv.52 & liver care',
    icon: Droplets,
    bg: 'bg-violet-50',
    iconColor: 'text-violet-700',
    border: 'border-violet-200/70',
  },
];

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<MerchantSettings>(DEFAULT_SETTINGS);

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

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState('ALL');
  const [selectedDispatch, setSelectedDispatch] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('FEATURED');

  // WhatsApp callback
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackSent, setCallbackSent] = useState(false);

  const catalogRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastText(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastText(null), 2600);
  };

  useEffect(() => {
    setProducts(getStoredProducts());
    setSettings(getStoredSettings());
    fetchLiveCatalogFromServer(false)
      .then((liveProds) => {
        if (liveProds && liveProds.length > 0) {
          setProducts(liveProds);
          // Refresh product snapshots inside any existing session cart so prices & max qty stay live
          const liveMap = new Map(liveProds.map((p) => [p.id, p]));
          setCart((prev) => {
            if (prev.length === 0) return prev;
            const refreshed = prev
              .map((item) => {
                const fresh = liveMap.get(item.product.id);
                if (!fresh || !fresh.isLive || fresh.stockQuantity <= 0) return null;
                return {
                  product: fresh,
                  quantity: Math.min(item.quantity, fresh.stockQuantity),
                };
              })
              .filter((x): x is CartItem => x !== null);
            try {
              sessionStorage.setItem('ayurswift_cart', JSON.stringify(refreshed));
            } catch {}
            return refreshed;
          });
        }
      })
      .catch(() => {});
    try {
      const savedCart = sessionStorage.getItem('ayurswift_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
      const savedLoc = sessionStorage.getItem('ayurswift_location');
      if (savedLoc) setCurrentLocation(JSON.parse(savedLoc));
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
    showToast(`Delivery updated to ${loc.area}`);
  };

  // In-stock live products only (strict availability guarantee)
  const inStockProducts = useMemo(
    () => products.filter((p) => p.isLive && p.stockQuantity > 0),
    [products]
  );

  const availableCategories = useMemo(
    () => Array.from(new Set(inStockProducts.map((p) => p.category))),
    [inStockProducts]
  );

  const availableBrands = useMemo(
    () => Array.from(new Set(inStockProducts.map((p) => p.brand))),
    [inStockProducts]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    inStockProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [inStockProducts]);

  // Curated Quick-Commerce Shelves
  const fastReliefShelf = useMemo(
    () =>
      [...inStockProducts]
        .filter((p) => p.category === 'Joint & Muscle Pain' || p.reviewCount >= 1500)
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 8),
    [inStockProducts]
  );

  const topDealsShelf = useMemo(
    () =>
      [...inStockProducts]
        .sort((a, b) => (b.mrp - b.sellingPrice) / b.mrp - (a.mrp - a.sellingPrice) / a.mrp)
        .slice(0, 8),
    [inStockProducts]
  );

  const dailyCareShelf = useMemo(
    () =>
      [...inStockProducts]
        .filter(
          (p) =>
            p.category === 'Digestion & Acidity' ||
            p.category === 'Immunity & Cold' ||
            p.category === 'Liver & Detox' ||
            p.category === 'Daily Wellness'
        )
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8),
    [inStockProducts]
  );

  const isFilterActive =
    selectedCategory !== 'ALL' ||
    selectedBrand !== 'ALL' ||
    selectedPriceRange !== 'ALL' ||
    selectedDispatch !== 'ALL' ||
    searchQuery.trim().length > 0;

  const activeFilterCount =
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedBrand !== 'ALL' ? 1 : 0) +
    (selectedPriceRange !== 'ALL' ? 1 : 0) +
    (selectedDispatch !== 'ALL' ? 1 : 0);

  const filteredProducts = useMemo(() => {
    const result = inStockProducts.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return false;
      if (selectedPriceRange === 'UNDER_100' && p.sellingPrice >= 100) return false;
      if (
        selectedPriceRange === '100_TO_200' &&
        (p.sellingPrice < 100 || p.sellingPrice > 200)
      ) {
        return false;
      }
      if (selectedPriceRange === 'ABOVE_200' && p.sellingPrice <= 200) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.indications.toLowerCase().includes(q) ||
          (p.composition && p.composition.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });

    switch (sortBy) {
      case 'PRICE_ASC':
        result.sort((a, b) => a.sellingPrice - b.sellingPrice);
        break;
      case 'PRICE_DESC':
        result.sort((a, b) => b.sellingPrice - a.sellingPrice);
        break;
      case 'DISCOUNT_DESC':
        result.sort(
          (a, b) => (b.mrp - b.sellingPrice) / b.mrp - (a.mrp - a.sellingPrice) / a.mrp
        );
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
    inStockProducts,
    selectedCategory,
    selectedBrand,
    selectedPriceRange,
    searchQuery,
    sortBy,
  ]);

  // Cart totals
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, item) => acc + item.product.sellingPrice * item.quantity,
    0
  );
  const cartTotalMrp = cart.reduce((acc, item) => acc + item.product.mrp * item.quantity, 0);
  const cartSavings = Math.max(0, cartTotalMrp - cartSubtotal);

  const handleAddToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    let updated: CartItem[];
    if (existing) {
      if (existing.quantity >= product.stockQuantity) {
        showToast('Maximum order quantity reached for this item');
        return;
      }
      updated = cart.map((item) =>
        item.product.id === product.id
          ? { product, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updated = [...cart, { product, quantity: 1 }];
    }
    saveCart(updated);
    showToast(`Added ${product.name}`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      saveCart(cart.filter((item) => item.product.id !== productId));
    } else {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const finalQty = Math.min(quantity, product.stockQuantity);
      saveCart(
        cart.map((item) =>
          item.product.id === productId ? { product, quantity: finalQty } : item
        )
      );
    }
  };

  const handleReorder = (items: { productId: string; quantity: number }[]) => {
    const updated = [...cart];
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
    showToast('Previous items loaded into cart');
  };

  const handleClearCart = () => saveCart([]);

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedBrand('ALL');
    setSelectedPriceRange('ALL');
    setSelectedDispatch('ALL');
    setSearchQuery('');
    setSortBy('FEATURED');
  };

  const scrollToCatalog = () => {
    if (typeof window === 'undefined' || !catalogRef.current) return;
    const offset = catalogRef.current.getBoundingClientRect().top + window.pageYOffset - 86;
    window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
  };

  const handlePlaceOrder = async (orderData: {
    customerName: string;
    customerPhone: string;
    deliveryType: DeliveryType;
    deliveryAddress: string;
    city: string;
    pincode: string;
    landmark?: string;
    paymentMethod: PaymentMethod;
    website?: string;
  }) => {
    const order = await placeOrderOnServer({
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryType: orderData.deliveryType,
      deliveryAddress: orderData.deliveryAddress,
      city: orderData.city,
      pincode: orderData.pincode,
      landmark: orderData.landmark,
      paymentMethod: orderData.paymentMethod,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      website: orderData.website,
    });

    setIsCartOpen(false);
    setActiveOrder(order);
    handleClearCart();
  };

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackPhone.trim()) return;
    const clean = callbackPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello AyurSwift! I want to order Ayurvedic medicines via WhatsApp. My phone number is: ${clean}.`
    );
    window.open(`https://wa.me/${settings.merchantWhatsApp}?text=${message}`, '_blank');
    setCallbackSent(true);
    setTimeout(() => setCallbackSent(false), 3500);
  };

  const isLocal = currentLocation.dispatchType !== 'COURIER_OUTSIDE';

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-gray-900 flex flex-col font-sans pb-28 md:pb-12">
      {/* 1. Blinkit-Style App Header */}
      <Header
        cart={cart}
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
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
        selectedBrand={selectedBrand}
        onSelectBrand={(brand) => {
          setSelectedBrand(brand);
          scrollToCatalog();
        }}
        currentLocation={currentLocation}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenQuickBuyModal={() => setIsQuickBuyModalOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        products={products}
        onSelectProduct={(p) => setSelectedMedicineDetails(p)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-5 pt-4 sm:pt-5 flex-1 w-full space-y-6 sm:space-y-8">
        {/* 2. Full-Width Animated Quick-Commerce Hero (hidden while actively searching) */}
        {!searchQuery.trim() && (
          <section>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A6B19] via-[#0C831F] to-[#15803D] text-white p-5 sm:p-7 shadow-lg shadow-[#0C831F]/15 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
              {/* Subtle geometric rings */}
              <div className="pointer-events-none absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/10 blur-xl" />
              <div className="pointer-events-none absolute right-10 -bottom-16 w-40 h-40 rounded-full bg-amber-400/15 blur-xl" />

              {/* Left Column: Core Promise & Primary Actions */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4 relative z-10">
                <div className="space-y-2.5">
                  <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-xs border border-white/20 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-50">
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>
                      {isLocal
                        ? `30–45 Min Rapido Dispatch in ${currentLocation.area}`
                        : 'All-India Tracked Express Courier (2–4 Days)'}
                    </span>
                  </div>

                  <h1 className="font-extrabold text-2xl sm:text-3xl lg:text-[34px] tracking-tight leading-[1.15]">
                    Authentic Ayurveda,
                    <br />
                    <span className="text-amber-300">at your door in 30 mins.</span>
                  </h1>

                  <p className="text-xs sm:text-sm text-emerald-50/90 leading-relaxed font-medium max-w-lg">
                    100% genuine Dabur, Zandu, Himalaya &amp; Baidyanath essentials packed fresh from our Bhavnagar dark store.{' '}
                    {isLocal && (
                      <strong className="text-white">
                        Free delivery above ₹{settings.cityFreeDeliveryAbove}.
                      </strong>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 relative z-10">
                  <button
                    type="button"
                    onClick={scrollToCatalog}
                    className="bg-white hover:bg-emerald-50 text-[#0A5C16] font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Shop All Remedies</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQuickBuyModalOpen(true)}
                    className="bg-white/15 hover:bg-white/22 text-white border border-white/25 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>Quick Buy List</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Blinkit + JioMart Animated Showcase */}
              <div className="lg:col-span-7 relative z-10 min-w-0">
                <HeroAnimatedShowcase
                  products={products}
                  onAddToCart={handleAddToCart}
                  onSelectProduct={(p) => setSelectedMedicineDetails(p)}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    scrollToCatalog();
                  }}
                  onSelectBrand={(brand) => {
                    setSelectedBrand(brand);
                    scrollToCatalog();
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* 3. Shop by Health Concern — 6 Clean Medallion Tiles */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base sm:text-lg text-gray-950 tracking-tight">
              Shop by Health Concern
            </h2>
            {selectedCategory !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className="text-xs font-bold text-[#0C831F] hover:underline cursor-pointer"
              >
                Show All
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
            {CATEGORY_CARDS.map((cat) => {
              const Icon = cat.icon;
              const count = categoryCounts[cat.id] || 0;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(isSelected ? 'ALL' : cat.id);
                    scrollToCatalog();
                  }}
                  aria-pressed={isSelected}
                  className={`group p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? 'bg-[#ECFDF3] border-[#0C831F] ring-2 ring-[#0C831F]/25 shadow-sm'
                      : 'bg-white border-gray-200/85 hover:border-[#0C831F]/45 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl ${cat.bg} border ${cat.border} ${cat.iconColor} flex items-center justify-center transition-transform group-hover:scale-105`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-[#0C831F] shrink-0" />
                    ) : (
                      count > 0 && (
                        <span className="text-[10px] font-extrabold text-gray-400 tabular-nums">
                          {count}
                        </span>
                      )
                    )}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-gray-950 line-clamp-1">
                      {cat.title}
                    </div>
                    <div className="text-[10.5px] text-gray-500 line-clamp-1 mt-0.5 hidden sm:block">
                      {cat.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Curated Quick-Commerce Horizontal Shelves (Default Browse Mode) */}
        {!isFilterActive && (
          <div className="space-y-7">
            <ProductShelf
              title="Fast Relief in 30 Mins"
              subtitle="Most ordered pain balms, oils & rapid household remedies"
              badge="⚡ Bestsellers"
              products={fastReliefShelf}
              cart={cart}
              dispatchType={currentLocation.dispatchType}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onViewDetails={(p) => setSelectedMedicineDetails(p)}
              onSeeAll={() => {
                setSelectedCategory('Joint & Muscle Pain');
                scrollToCatalog();
              }}
            />

            <ProductShelf
              title="Top Value Deals"
              subtitle="Highest savings on genuine MRP Ayurvedic packs"
              badge="🏷️ Max Savings"
              products={topDealsShelf}
              cart={cart}
              dispatchType={currentLocation.dispatchType}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onViewDetails={(p) => setSelectedMedicineDetails(p)}
              onSeeAll={() => {
                setSortBy('DISCOUNT_DESC');
                scrollToCatalog();
              }}
            />

            <ProductShelf
              title="Daily Immunity, Digestion & Detox"
              subtitle="Trusted everyday churna, Chyawanprash & liver essentials"
              products={dailyCareShelf}
              cart={cart}
              dispatchType={currentLocation.dispatchType}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onViewDetails={(p) => setSelectedMedicineDetails(p)}
              onSeeAll={() => {
                setSelectedCategory('Digestion & Acidity');
                scrollToCatalog();
              }}
            />
          </div>
        )}

        {/* 5. Sticky Quick-Commerce Filter Bar & Dense Catalog Grid */}
        <section ref={catalogRef} className="scroll-mt-20 space-y-4 pt-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-gray-950 tracking-tight">
                {searchQuery.trim()
                  ? `Search results for "${searchQuery}"`
                  : selectedCategory !== 'ALL'
                  ? selectedCategory
                  : 'All In-Stock Remedies'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium tabular-nums">
                {filteredProducts.length} verified Ayurvedic{' '}
                {filteredProducts.length === 1 ? 'product' : 'products'} ready for dispatch
              </p>
            </div>
          </div>

          <CategoryFilter
            categories={availableCategories}
            brands={availableBrands}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            selectedPriceRange={selectedPriceRange}
            onSelectPriceRange={setSelectedPriceRange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            activeFilterCount={activeFilterCount}
            onResetFilters={handleResetFilters}
            onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
            resultCount={filteredProducts.length}
          />

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-gray-950 text-base">
                No matching in-stock medicines found
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try clearing a filter or send us your medicine name on WhatsApp via Quick Buy.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Reset All Filters
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickBuyModalOpen(true)}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Request on WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product) => {
                const qty = cart.find((i) => i.product.id === product.id)?.quantity ?? 0;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={qty}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onViewDetails={(p) => setSelectedMedicineDetails(p)}
                    dispatchType={currentLocation.dispatchType}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* 6. Clean WhatsApp Assistance Card */}
        <section className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF3] border border-[#BBF7D0] text-[#0C831F] flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-950">
                Looking for a specific Ayurvedic remedy?
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Message our Bhavnagar dark store desk directly on WhatsApp for instant availability.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCallbackSubmit}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto"
          >
            <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus-within:bg-white focus-within:border-[#0C831F] focus-within:ring-2 focus-within:ring-[#0C831F]/15 text-xs text-gray-900 flex-1 sm:w-56">
              <PhoneCall className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
              <span className="font-bold text-gray-500 mr-1">+91</span>
              <input
                type="tel"
                value={callbackPhone}
                onChange={(e) => setCallbackPhone(e.target.value)}
                placeholder="10-digit mobile"
                maxLength={10}
                required
                className="w-full focus:outline-none text-xs bg-transparent font-medium"
                aria-label="Mobile number for WhatsApp order"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0C831F] hover:bg-[#096B19] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
            >
              {callbackSent ? 'Opening WhatsApp...' : 'Order on WhatsApp'}
            </button>
          </form>
        </section>
      </main>

      {/* 7. Sleek Floating Quick-Commerce Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-[68px] md:bottom-5 inset-x-0 z-40 px-3 sm:px-4 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#0C831F] hover:bg-[#096B19] text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl shadow-[#0C831F]/35 flex items-center justify-between gap-3 transition-all active:scale-[0.99] cursor-pointer animate-modal-pop"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Stacked mini thumbnails */}
                <div className="flex items-center -space-x-2 shrink-0">
                  {cart.slice(0, 3).map((item) => (
                    <div
                      key={item.product.id}
                      className="w-9 h-9 rounded-xl bg-white border-2 border-[#0C831F] p-1 flex items-center justify-center overflow-hidden shadow-xs"
                    >
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ShoppingCart className="w-4 h-4 text-[#0C831F]" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm sm:text-base tabular-nums">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'} • ₹{cartSubtotal}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-100 font-semibold truncate">
                    {cartSavings > 0
                      ? `You're saving ₹${cartSavings} on this order`
                      : 'Ready for 30-min dispatch'}
                  </div>
                </div>
              </div>

              <div className="bg-white/15 hover:bg-white/20 px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-1 shrink-0">
                <span>View Cart</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 8. Mobile Fixed Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 py-1.5 px-3 flex justify-around items-center md:hidden shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
      >
        <button
          type="button"
          onClick={() => {
            handleResetFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center text-[10.5px] font-bold min-w-[60px] py-1 rounded-xl transition-colors cursor-pointer ${
            !isFilterActive ? 'text-[#0C831F]' : 'text-gray-500'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => {
            scrollToCatalog();
            setIsMobileFilterOpen(true);
          }}
          className={`flex flex-col items-center justify-center text-[10.5px] font-bold min-w-[60px] py-1 rounded-xl transition-colors cursor-pointer ${
            isFilterActive ? 'text-[#0C831F]' : 'text-gray-500'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span>Categories</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOrderTrackingOpen(true)}
          className="flex flex-col items-center justify-center text-[10.5px] font-bold text-gray-500 hover:text-[#0C831F] min-w-[60px] py-1 rounded-xl transition-colors cursor-pointer"
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Orders</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAccountModalOpen(true)}
          className="flex flex-col items-center justify-center text-[10.5px] font-bold text-gray-500 hover:text-[#0C831F] min-w-[60px] py-1 rounded-xl transition-colors cursor-pointer"
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Account</span>
        </button>
      </nav>

      {/* 9. Clean Minimal Footer */}
      <footer className="mt-12 bg-white border-t border-gray-200 py-7 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 text-center sm:text-left">
            <img
              src="/ayurswift-logo.png"
              alt="AyurSwift"
              className="h-7 w-auto object-contain"
            />
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span className="font-medium text-gray-500">
              Authentic Ayurveda &amp; Primary Health — Bhavnagar Dark Store
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-semibold">
            <Link href="/privacy" className="hover:text-[#0C831F]">
              Privacy Policy
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/terms" className="hover:text-[#0C831F]">
              Terms &amp; Refunds
            </Link>
            <span className="text-gray-300">•</span>
            <a href="mailto:ayurswift.care@gmail.com" className="hover:text-[#0C831F]">
              ayurswift.care@gmail.com
            </a>
            <span className="text-gray-300">•</span>
            <a
              href={`https://wa.me/${settings.merchantWhatsApp.replace(/\D/g, '')}?text=Hi%20AyurSwift,%20I%20have%20an%20inquiry.`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#0C831F]"
            >
              +91 96247 66242
            </a>
            <span className="text-gray-300">•</span>
            <Link
              href="/admin"
              className="text-[#0C831F] hover:text-[#096B19] font-extrabold inline-flex items-center gap-1"
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
        products={products}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
        settings={settings}
        defaultDeliveryType={currentLocation.dispatchType}
      />

      <PaymentModal
        order={activeOrder}
        onClose={() => setActiveOrder(null)}
        settings={settings}
        onTrackOrder={() => {
          setActiveOrder(null);
          setIsOrderTrackingOpen(true);
        }}
        onOrderUpdated={(updated) => setActiveOrder(updated)}
      />

      <MedicineDetailModal
        product={selectedMedicineDetails}
        onClose={() => setSelectedMedicineDetails(null)}
        quantityInCart={
          selectedMedicineDetails
            ? cart.find((i) => i.product.id === selectedMedicineDetails.id)?.quantity ?? 0
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
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          scrollToCatalog();
        }}
        selectedBrand={selectedBrand}
        onSelectBrand={(b) => {
          setSelectedBrand(b);
          scrollToCatalog();
        }}
        selectedPriceRange={selectedPriceRange}
        onSelectPriceRange={setSelectedPriceRange}
        selectedDispatch={selectedDispatch}
        onSelectDispatch={setSelectedDispatch}
        availableCategories={availableCategories}
        availableBrands={availableBrands}
        onResetFilters={handleResetFilters}
        totalFilteredCount={filteredProducts.length}
      />

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

      {/* Top Centered Ephemeral Toast */}
      {toastText && (
        <div className="fixed top-20 left-1/2 z-80 bg-gray-950 text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-bold flex items-center gap-2 animate-toast-in pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastText}</span>
        </div>
      )}
    </div>
  );
}
