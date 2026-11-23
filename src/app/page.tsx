'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
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
import { MedicinePackVisual } from '@/components/MedicinePackVisual';
import { ConsentBanner } from '@/components/ConsentBanner';
import {
  Product,
  CartItem,
  Order,
  DeliveryType,
  PaymentMethod,
  MerchantSettings,
} from '@/types';
import {
  CATALOG_SYNC_CHANNEL,
  getStoredProducts,
  getStoredSettings,
  placeOrderOnServer,
  fetchLiveCatalogFromServer,
} from '@/lib/store';
import {
  DEFAULT_SETTINGS,
  DELIVERY_PROMISE,
  isVerifiedProductImageUrl,
} from '@/lib/initialData';
import { getNextAvailableSlot } from '@/lib/deliverySlots';
import {
  Zap,
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
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Search,
  Truck,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const DEFAULT_LOCATION: LocationInfo = {
  area: 'Bhavnagar City',
  city: 'Bhavnagar',
  pincode: '364001',
  dispatchType: 'RAPIDO_CITY',
  estimate: `Scheduled Slot Delivery (${DELIVERY_PROMISE.localSlotsSummary})`,
};

const CATEGORY_CARDS = [
  {
    id: 'Joint & Muscle Pain',
    title: 'Joint & Pain',
    sub: 'Balms, oils & sprays',
    icon: Activity,
    bg: 'bg-emerald-50',
    iconColor: 'text-[#0C831F]',
    border: 'border-emerald-200/80',
  },
  {
    id: 'Digestion & Acidity',
    title: 'Digestion',
    sub: 'Churna, husk & pearls',
    icon: Leaf,
    bg: 'bg-teal-50',
    iconColor: 'text-teal-700',
    border: 'border-teal-200/80',
  },
  {
    id: 'Immunity & Cold',
    title: 'Immunity',
    sub: 'Chyawanprash & syrups',
    icon: ShieldPlus,
    bg: 'bg-amber-50',
    iconColor: 'text-amber-700',
    border: 'border-amber-200/80',
  },
  {
    id: 'Skin & Hair',
    title: 'Skin & Hair',
    sub: 'Aloe gel, paste & oil',
    icon: Sparkles,
    bg: 'bg-rose-50',
    iconColor: 'text-rose-700',
    border: 'border-rose-200/80',
  },
  {
    id: 'Liver & Detox',
    title: 'Liver & Detox',
    sub: 'Liv.52 & liver support',
    icon: Droplets,
    bg: 'bg-cyan-50',
    iconColor: 'text-cyan-700',
    border: 'border-cyan-200/80',
  },
  {
    id: 'Daily Wellness',
    title: 'Daily Wellness',
    sub: 'Revitalizers & churna',
    icon: HeartPulse,
    bg: 'bg-sky-50',
    iconColor: 'text-sky-700',
    border: 'border-sky-200/80',
  },
];

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
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
  const [nextSlotShort, setNextSlotShort] = useState<string>(DELIVERY_PROMISE.localTimeShort);

  useEffect(() => {
    const refreshNextSlot = () => setNextSlotShort(getNextAvailableSlot(new Date()).shortText);
    refreshNextSlot();
    const timer = setInterval(refreshNextSlot, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState('ALL');
  const [selectedDispatch, setSelectedDispatch] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('FEATURED');

  // WhatsApp callback form
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [callbackSent, setCallbackSent] = useState(false);

  const catalogRef = useRef<HTMLElement>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastText(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastText(null), 2600);
  }, []);

  const syncLiveCatalog = useCallback(async (silent = false, forceFresh = false) => {
    if (!silent) setIsLoadingCatalog(true);
    setCatalogError(null);
    try {
      const liveProds = await fetchLiveCatalogFromServer(false, forceFresh);
      if (liveProds !== null) {
        setProducts(liveProds);
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
      } else if (!silent) {
        setCatalogError('Live inventory could not refresh right now. Please tap Retry.');
      }
    } catch {
      if (!silent) {
        setCatalogError('Live inventory could not refresh right now. Please tap Retry.');
      }
    } finally {
      if (!silent) setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    const cached = getStoredProducts();
    if (cached.length > 0) {
      setProducts(cached);
    }
    setSettings(getStoredSettings());
    try {
      const savedCart = sessionStorage.getItem('ayurswift_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
      const savedLoc = sessionStorage.getItem('ayurswift_location');
      if (savedLoc) setCurrentLocation(JSON.parse(savedLoc));
    } catch {}
    syncLiveCatalog(false, false);

    // High-scale sync strategy (0 DB load at 1k-2k shoppers + ~0s owner updates):
    // 1. Same-browser instant BroadcastChannel + localStorage ping -> bypasses CDN for ~0s Admin->Storefront feedback
    // 2. Cross-device background refresh every 30s against Vercel Edge CDN /api/catalog (0 DB hits!)
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel(CATALOG_SYNC_CHANNEL);
        bc.onmessage = () => {
          syncLiveCatalog(true, true);
        };
      }
    } catch {}

    const onFocus = () => syncLiveCatalog(true, false);
    const onVisibility = () => {
      if (!document.hidden) syncLiveCatalog(true, false);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ayurswift_catalog_ping' || e.key === 'ayurswift_products_v3') {
        syncLiveCatalog(true, true);
      }
    };

    const cdnRefreshPoll = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      syncLiveCatalog(true, false);
    }, 30_000);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(cdnRefreshPoll);
      try {
        bc?.close();
      } catch {}
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, [syncLiveCatalog]);

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

  // Dispatch filter previews local vs courier delivery estimates cleanly without overwriting saved location on Reset
  const handleSelectDispatchFilter = (mode: string) => {
    setSelectedDispatch(mode);
  };

  // In-stock live products only
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

  // Show Health Concern tiles for every live category (preset + custom categories created in Admin)
  const visibleCategoryCards = useMemo(() => {
    const presetCards = CATEGORY_CARDS.filter((c) => (categoryCounts[c.id] || 0) > 0);
    const presetIds = new Set(CATEGORY_CARDS.map((c) => c.id));
    const customThemes = [
      { icon: Leaf, bg: 'bg-emerald-50', iconColor: 'text-[#0C831F]', border: 'border-emerald-200/80' },
      { icon: Sparkles, bg: 'bg-teal-50', iconColor: 'text-teal-700', border: 'border-teal-200/80' },
      { icon: ShieldPlus, bg: 'bg-amber-50', iconColor: 'text-amber-700', border: 'border-amber-200/80' },
      { icon: HeartPulse, bg: 'bg-cyan-50', iconColor: 'text-cyan-700', border: 'border-cyan-200/80' },
    ];
    const customCards = availableCategories
      .filter((cat) => !presetIds.has(cat) && (categoryCounts[cat] || 0) > 0)
      .map((cat, idx) => {
        const theme = customThemes[idx % customThemes.length];
        return {
          id: cat,
          title: cat,
          sub: 'Ayurvedic essentials',
          ...theme,
        };
      });
    return [...presetCards, ...customCards];
  }, [availableCategories, categoryCounts]);

  // Single focused 4-card Featured Savings row (1 highest-discount item per distinct category, zero repetition)
  const featuredSavingsPicks = useMemo(() => {
    const sorted = [...inStockProducts].sort((a, b) => {
      const discA = a.mrp > 0 ? (a.mrp - a.sellingPrice) / a.mrp : 0;
      const discB = b.mrp > 0 ? (b.mrp - b.sellingPrice) / b.mrp : 0;
      return discB - discA;
    });
    const seenCat = new Set<string>();
    const diverse: Product[] = [];
    for (const p of sorted) {
      if (!seenCat.has(p.category)) {
        seenCat.add(p.category);
        diverse.push(p);
      }
      if (diverse.length >= 4) break;
    }
    return diverse;
  }, [inStockProducts]);

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

  const activeDispatchType: DeliveryType =
    selectedDispatch === 'RAPIDO_CITY' || selectedDispatch === 'COURIER_OUTSIDE'
      ? selectedDispatch
      : currentLocation.dispatchType;

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
          (p.composition && p.composition.toLowerCase().includes(q)) ||
          (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
          (p.packSize && p.packSize.toLowerCase().includes(q)) ||
          (p.form && p.form.toLowerCase().includes(q)) ||
          (p.badgeText && p.badgeText.toLowerCase().includes(q));
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
        result.sort((a, b) => {
          const discA = a.mrp > 0 ? (a.mrp - a.sellingPrice) / a.mrp : 0;
          const discB = b.mrp > 0 ? (b.mrp - b.sellingPrice) / b.mrp : 0;
          return discB - discA;
        });
        break;
      case 'NAME_ASC':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'FEATURED':
      default:
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
    const offset = catalogRef.current.getBoundingClientRect().top + window.pageYOffset - 120;
    window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
  };

  const handlePlaceOrder = async (orderData: {
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
    idempotencyKey?: string;
    guardToken?: string;
    guardSolution?: string;
    website?: string;
  }) => {
    const order = await placeOrderOnServer({
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryType: orderData.deliveryType,
      deliverySlotId: orderData.deliverySlotId,
      deliverySlotDate: orderData.deliverySlotDate,
      deliveryAddress: orderData.deliveryAddress,
      city: orderData.city,
      pincode: orderData.pincode,
      landmark: orderData.landmark,
      paymentMethod: orderData.paymentMethod,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      idempotencyKey: orderData.idempotencyKey,
      guardToken: orderData.guardToken,
      guardSolution: orderData.guardSolution,
      website: orderData.website,
    });

    setIsCartOpen(false);
    setActiveOrder(order);
    handleClearCart();
    syncLiveCatalog(true, true);
  };

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = callbackPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setCallbackError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setCallbackError(null);
    const message = encodeURIComponent(
      `Hello AyurSwift! I want to order Ayurvedic medicines via WhatsApp. My phone number is: ${clean}.`
    );
    window.open(`https://wa.me/${settings.merchantWhatsApp}?text=${message}`, '_blank');
    setCallbackSent(true);
    setTimeout(() => setCallbackSent(false), 3500);
  };

  const isLocal = activeDispatchType !== 'COURIER_OUTSIDE';

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-gray-900 flex flex-col font-sans pb-28 md:pb-12">
      {/* 1. Compact Header + Clearly Separated Category Navigation Bar */}
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
        availableCategories={availableCategories}
        currentLocation={currentLocation}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenQuickBuyModal={() => setIsQuickBuyModalOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        products={products}
        onSelectProduct={(p) => setSelectedMedicineDetails(p)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-5 pt-4 sm:pt-6 flex-1 w-full space-y-7 sm:space-y-9">
        {/* Catalog Sync Error Banner (if server sync failed) */}
        {catalogError && (
          <div
            role="status"
            className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">{catalogError}</span>
            </div>
            <button
              type="button"
              onClick={() => syncLiveCatalog(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 font-bold text-amber-950 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 2. Editorial Home Hero — Warm Sandalwood & Deep Apothecary Espresso (hidden while actively filtering/searching) */}
        {!isFilterActive && (
          <section aria-label="AyurSwift store highlights">
            <div className="relative overflow-hidden rounded-2xl bg-[#F4EDE1] border border-[#E5DAC6] text-[#181B18] p-5 sm:p-7 lg:p-8 shadow-[0_1px_2px_rgba(24,24,20,0.04)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Core Promise & Primary Actions */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-5 relative z-10">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 bg-white border border-[#DFD3BE] px-3 py-1 rounded-full text-[11px] font-bold text-[#1F2421] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                    {isLocal ? (
                      <span className="w-2 h-2 rounded-full bg-[#15803D] shrink-0" aria-hidden="true" />
                    ) : (
                      <Truck className="w-3.5 h-3.5 text-[#9A3412]" aria-hidden="true" />
                    )}
                    <span>
                      {isLocal
                        ? `Next Slot: ${nextSlotShort} • ${currentLocation.area}`
                        : `All-India Tracked Courier (${DELIVERY_PROMISE.courierTimeShort})`}
                    </span>
                  </div>

                  <h1 className="font-extrabold text-2xl sm:text-3xl lg:text-[34px] text-[#181B18] tracking-[-0.025em] leading-[1.13]">
                    Authentic Ayurvedic &amp; OTC Essentials,{' '}
                    <span className="text-[#9A3412]">
                      {isLocal
                        ? 'delivered in your chosen slot.'
                        : `delivered in ${DELIVERY_PROMISE.courierTimeShort}.`}
                    </span>
                  </h1>

                  <p className="text-xs sm:text-sm text-[#4A463E] leading-relaxed font-medium max-w-lg">
                    Genuine Ayurvedic &amp; wellness essentials dispatched from our Bhavnagar store.{' '}
                    {isLocal ? (
                      <strong className="text-[#181B18] font-bold">
                        Daily slots: {DELIVERY_PROMISE.localSlotsSummary} • ₹{settings.cityDeliveryFee} (Free above ₹{settings.cityFreeDeliveryAbove}).
                      </strong>
                    ) : (
                      <strong className="text-[#181B18] font-bold">
                        Flat ₹{settings.courierDeliveryFee} tracked All-India courier.
                      </strong>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 relative z-10">
                  <button
                    type="button"
                    onClick={scrollToCatalog}
                    className="bg-[#1B2A21] hover:bg-[#121D17] text-[#FAF8F4] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Browse All Remedies</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQuickBuyModalOpen(true)}
                    className="bg-white hover:bg-[#FAF7F0] text-[#181B18] border border-[#D8CCB7] font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#9A3412]" aria-hidden="true" />
                    <span>Quick Buy / WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Brand Filter + Featured Value Spotlight */}
              <div className="lg:col-span-7 relative z-10 min-w-0">
                <HeroAnimatedShowcase
                  products={products}
                  onAddToCart={handleAddToCart}
                  onSelectProduct={(p) => setSelectedMedicineDetails(p)}
                  onSelectBrand={(brand) => {
                    setSelectedBrand(brand);
                    scrollToCatalog();
                  }}
                  onOpenQuickBuy={() => setIsQuickBuyModalOpen(true)}
                />
              </div>
            </div>
          </section>
        )}

        {/* 3. Compact Horizontal Trust & Delivery Strip (No Oversized Cards, Zero Truncation) */}
        {!isFilterActive && (
          <section aria-label="Delivery and order verification summary">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="px-4 py-3 flex items-center gap-3 text-left hover:bg-emerald-50/50 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[#0C831F] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-gray-950 leading-tight">
                    Bhavnagar Slots ({DELIVERY_PROMISE.localSlotsSummary})
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                    Next: {nextSlotShort} • ₹{settings.cityDeliveryFee} (Free above ₹{settings.cityFreeDeliveryAbove})
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectDispatchFilter('COURIER_OUTSIDE');
                  scrollToCatalog();
                }}
                className="px-4 py-3 flex items-center gap-3 text-left hover:bg-teal-50/50 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-gray-950 leading-tight">
                    All-India Courier ({DELIVERY_PROMISE.courierTimeShort})
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                    Flat ₹{settings.courierDeliveryFee} tracked parcel
                  </p>
                </div>
              </button>

              <div className="px-4 py-3 flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[#0C831F] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-gray-950 leading-tight">
                    Stock Checked Before Confirmation
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                    Direct UPI (₹0 gateway fee)
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. Shop by Health Concern — Focused Shortcut Cards (Only Active Categories) */}
        {!isFilterActive && visibleCategoryCards.length > 0 && (
          <section aria-labelledby="health-concern-heading" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="health-concern-heading"
                  className="font-extrabold text-lg sm:text-xl text-gray-950 tracking-tight"
                >
                  Shop by Health Concern
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Jump directly to verified OTC categories ready for dispatch
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {visibleCategoryCards.map((cat) => {
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
                    className={`group p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#ECFDF3] border-[#0C831F] ring-2 ring-[#0C831F]/25 shadow-sm'
                        : 'bg-white border-gray-200/90 hover:border-[#0C831F]/50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${cat.bg} border ${cat.border} ${cat.iconColor} flex items-center justify-center transition-transform group-hover:scale-105`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-[#0C831F] shrink-0" />
                      ) : (
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md tabular-nums">
                          {count}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs sm:text-[13px] text-gray-950 line-clamp-1">
                        {cat.title}
                      </div>
                      <div className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">
                        {cat.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Single Focused Featured Savings Row (1 Top Deal per Distinct Category) */}
        {!isFilterActive && featuredSavingsPicks.length > 0 && (
          <section aria-labelledby="featured-savings-heading" className="space-y-3.5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2
                  id="featured-savings-heading"
                  className="font-extrabold text-lg sm:text-xl text-gray-950 tracking-tight"
                >
                  Top Savings Across Categories
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Highest verified MRP discounts across pain relief, digestion, immunity &amp; wellness
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSortBy('DISCOUNT_DESC');
                  scrollToCatalog();
                }}
                className="text-xs sm:text-sm font-bold text-[#0C831F] hover:text-[#096B19] inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Sort all by discount</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {featuredSavingsPicks.map((product) => {
                const qty = cart.find((i) => i.product.id === product.id)?.quantity ?? 0;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={qty}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onViewDetails={(p) => setSelectedMedicineDetails(p)}
                    dispatchType={activeDispatchType}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* 6. Filtered Medicine Catalog with Breadcrumb, Heading, Count, Filters & 4-Col Grid */}
        <section
          ref={catalogRef}
          aria-labelledby="catalog-section-heading"
          className="scroll-mt-28 space-y-4 pt-2"
        >
          {/* Breadcrumb + Heading + Count */}
          <div className="space-y-1.5">
            <nav aria-label="Catalog breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold flex-wrap">
              <button
                type="button"
                onClick={handleResetFilters}
                className="hover:text-[#0C831F] cursor-pointer rounded"
              >
                Home
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedBrand('ALL');
                  setSearchQuery('');
                }}
                className={`cursor-pointer rounded ${
                  selectedCategory === 'ALL' && selectedBrand === 'ALL' && !searchQuery.trim()
                    ? 'text-gray-900 font-bold'
                    : 'hover:text-[#0C831F]'
                }`}
              >
                All Remedies
              </button>
              {selectedCategory !== 'ALL' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  <span className="text-[#0C831F] font-bold">{selectedCategory}</span>
                </>
              )}
              {selectedBrand !== 'ALL' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  <span className="text-[#0F766E] font-bold">{selectedBrand}</span>
                </>
              )}
            </nav>

            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2
                  id="catalog-section-heading"
                  className="font-extrabold text-xl sm:text-2xl text-gray-950 tracking-tight"
                >
                  {searchQuery.trim()
                    ? `Search results for "${searchQuery}"`
                    : selectedCategory !== 'ALL'
                    ? selectedCategory
                    : selectedBrand !== 'ALL'
                    ? `${selectedBrand} Remedies`
                    : 'Complete Ayurvedic & OTC Catalog'}
                </h2>
                <p className="text-xs sm:text-[13px] text-gray-600 mt-0.5 font-medium tabular-nums">
                  Showing <strong className="text-gray-950">{filteredProducts.length}</strong> of{' '}
                  <strong className="text-gray-950">{inStockProducts.length}</strong> in-stock remedies •{' '}
                  {isLocal
                    ? `Est. ${DELIVERY_PROMISE.localTimeShort} in ${currentLocation.area}`
                    : `Est. ${DELIVERY_PROMISE.courierTimeShort} All-India courier`}
                </p>
              </div>
            </div>
          </div>

          <CategoryFilter
            categories={availableCategories}
            brands={availableBrands}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            selectedPriceRange={selectedPriceRange}
            onSelectPriceRange={setSelectedPriceRange}
            selectedDispatch={selectedDispatch}
            onSelectDispatch={handleSelectDispatchFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            activeFilterCount={activeFilterCount}
            onResetFilters={handleResetFilters}
            onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
            resultCount={filteredProducts.length}
            totalCount={inStockProducts.length}
          />

          {/* Loading Skeleton (only if products array is empty during initial fetch) */}
          {isLoadingCatalog && products.length === 0 ? (
            <div
              aria-busy="true"
              aria-label="Loading remedies"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/5] bg-gray-100" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-3 w-1/3 bg-gray-200 rounded" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    <div className="h-8 w-full bg-gray-100 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-gray-950 text-base">
                {inStockProducts.length === 0
                  ? 'Store catalog is being updated'
                  : 'No matching in-stock medicines found'}
              </h3>
              <p className="text-xs text-gray-600 max-w-sm mx-auto">
                {inStockProducts.length === 0
                  ? 'New Ayurvedic products are being added right now. Need something urgently? Send your list directly on WhatsApp.'
                  : 'Try clearing a filter or send your medicine name to our Bhavnagar desk via Quick Buy.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {inStockProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsQuickBuyModalOpen(true)}
                  className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Request on WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
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
                    dispatchType={activeDispatchType}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* 7. WhatsApp & Call Ordering Desk */}
        <section
          aria-labelledby="whatsapp-assist-heading"
          className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF3] border border-[#BBF7D0] text-[#0C831F] flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="whatsapp-assist-heading"
                className="font-extrabold text-sm sm:text-base text-gray-950"
              >
                Need help finding a specific Ayurvedic remedy?
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Message our Bhavnagar desk on WhatsApp or call{' '}
                <a
                  href={`tel:+${settings.merchantWhatsApp.replace(/\D/g, '')}`}
                  className="font-bold text-[#0C831F] hover:underline"
                >
                  +91 96247 66242
                </a>{' '}
                for instant stock check.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCallbackSubmit}
            noValidate
            className="flex flex-col gap-1.5 w-full lg:w-auto"
          >
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <label htmlFor="whatsapp-callback-phone" className="sr-only">
                Your 10-digit Indian mobile number for WhatsApp order
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus-within:bg-white focus-within:border-[#0C831F] focus-within:ring-2 focus-within:ring-[#0C831F]/15 text-xs text-gray-900 flex-1 sm:w-56">
                <PhoneCall className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" aria-hidden="true" />
                <span className="font-bold text-gray-600 mr-1">+91</span>
                <input
                  id="whatsapp-callback-phone"
                  type="tel"
                  inputMode="numeric"
                  aria-label="10-digit Indian mobile number for WhatsApp order"
                  value={callbackPhone}
                  onChange={(e) => {
                    setCallbackPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    if (callbackError) setCallbackError(null);
                  }}
                  placeholder="10-digit mobile"
                  maxLength={10}
                  required
                  className="w-full focus:outline-none text-xs bg-transparent font-medium"
                />
              </div>
              <button
                type="submit"
                className="bg-[#0C831F] hover:bg-[#096B19] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
              >
                {callbackSent ? 'Opening WhatsApp...' : 'Order on WhatsApp'}
              </button>
            </div>
            {callbackError && (
              <p role="alert" className="text-[11px] font-semibold text-rose-700">
                {callbackError}
              </p>
            )}
          </form>
        </section>
      </main>

      {/* 8. Floating Quick-Commerce Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-[68px] md:bottom-5 inset-x-0 z-40 px-3 sm:px-4 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#0C831F] hover:bg-[#096B19] text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl shadow-[#0C831F]/35 flex items-center justify-between gap-3 transition-all active:scale-[0.99] cursor-pointer animate-modal-pop"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center -space-x-2 shrink-0">
                  {cart.slice(0, 3).map((item) => (
                    <div
                      key={item.product.id}
                      className="w-9 h-9 rounded-xl bg-white border-2 border-[#0C831F] p-0.5 flex items-center justify-center overflow-hidden shadow-xs"
                    >
                      {isVerifiedProductImageUrl(item.product.imageUrl) ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <MedicinePackVisual product={item.product} compact className="w-full h-full" />
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
                      ? `Saving ₹${cartSavings} on MRP`
                      : isLocal
                      ? `Estimated ${DELIVERY_PROMISE.localTimeShort} local dispatch`
                      : `Estimated ${DELIVERY_PROMISE.courierTimeShort} courier dispatch`}
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

      {/* 9. Mobile Fixed Bottom Navigation */}
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
            !isFilterActive ? 'text-[#0C831F]' : 'text-gray-600'
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
            isFilterActive ? 'text-[#0C831F]' : 'text-gray-600'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span>Filters</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOrderTrackingOpen(true)}
          className="flex flex-col items-center justify-center text-[10.5px] font-bold text-gray-600 hover:text-[#0C831F] min-w-[60px] py-1 rounded-xl transition-colors cursor-pointer"
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Orders</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAccountModalOpen(true)}
          className="flex flex-col items-center justify-center text-[10.5px] font-bold text-gray-600 hover:text-[#0C831F] min-w-[60px] py-1 rounded-xl transition-colors cursor-pointer"
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Account</span>
        </button>
      </nav>

      {/* 10. Clean Minimal Footer */}
      <footer className="mt-12 bg-white border-t border-gray-200 py-7 text-xs text-gray-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 text-center sm:text-left">
            <img
              src="/ayurswift-logo.png"
              alt="AyurSwift"
              width={112}
              height={28}
              className="h-7 w-auto object-contain"
            />
            <span className="text-gray-300 hidden sm:inline" aria-hidden="true">•</span>
            <span className="font-medium text-gray-600">
              Authentic Ayurvedic &amp; OTC Pharmacy — Bhavnagar Store
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-semibold">
            <Link href="/privacy" className="hover:text-[#0C831F]">
              Privacy Policy
            </Link>
            <span className="text-gray-300" aria-hidden="true">•</span>
            <Link href="/terms" className="hover:text-[#0C831F]">
              Terms &amp; Refunds
            </Link>
            <span className="text-gray-300" aria-hidden="true">•</span>
            <a href="mailto:ayurswift.care@gmail.com" className="hover:text-[#0C831F]">
              ayurswift.care@gmail.com
            </a>
            <span className="text-gray-300" aria-hidden="true">•</span>
            <a
              href={`https://wa.me/${settings.merchantWhatsApp.replace(/\D/g, '')}?text=Hi%20AyurSwift,%20I%20have%20an%20inquiry.`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#0C831F]"
            >
              +91 96247 66242
            </a>
            <span className="text-gray-300" aria-hidden="true">•</span>
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
        defaultDeliveryType={activeDispatchType}
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
        dispatchType={activeDispatchType}
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
        onSelectDispatch={handleSelectDispatchFilter}
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

      {/* Non-blocking Smart DPDP Privacy Policy & Essential Security Cookie Banner */}
      <ConsentBanner />

      {/* Ephemeral Accessible Status Toast */}
      {toastText && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 z-80 bg-gray-950 text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-bold flex items-center gap-2 animate-toast-in pointer-events-none"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastText}</span>
        </div>
      )}
    </div>
  );
}
