'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { CartDrawer } from '@/components/CartDrawer';
import { PaymentModal } from '@/components/PaymentModal';
import { MedicineDetailModal } from '@/components/MedicineDetailModal';
import { LocationModal, LocationInfo } from '@/components/LocationModal';
import { QuickBuyModal } from '@/components/QuickBuyModal';
import { MobileFilterDrawer } from '@/components/MobileFilterDrawer';
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
  Truck,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

const DEFAULT_LOCATION: LocationInfo = {
  area: 'Bhavnagar 364001',
  city: 'Bhavnagar',
  pincode: '364001',
  dispatchType: 'RAPIDO_CITY',
  estimate: '30–45m Rapido',
};

type SortKey = 'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'DISCOUNT_DESC' | 'RATING_DESC';

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<MerchantSettings>(getStoredSettings());

  // Navigation & Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isQuickBuyModalOpen, setIsQuickBuyModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedMedicineDetails, setSelectedMedicineDetails] = useState<Product | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo>(DEFAULT_LOCATION);

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
        // Keep order or sort top review count
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
      `Hello AyurSwift! I want to order medicines via call/WhatsApp. My phone number is: ${clean}. Please dispatch my order in Bhavnagar.`
    );
    window.open(`https://wa.me/${settings.merchantWhatsApp}?text=${message}`, '_blank');
    setCallbackSent(true);
    setTimeout(() => setCallbackSent(false), 4000);
  };

  const scrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Top 4 Bestsellers for the Homepage showcase
  const bestSellers = useMemo(() => {
    return products
      .filter((p) => p.isLive && p.stockQuantity > 0)
      .slice(0, 4);
  }, [products]);

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-gray-900 flex flex-col font-sans">
      {/* 1. Header (Reference 1: Clear pharmacy header) */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex-1 w-full space-y-6 sm:space-y-8">
        {/* ============================================================== */}
        {/* HOMEPAGE SECTION (Reference 1 Layout: Tata 1mg inspired)      */}
        {/* ============================================================== */}

        {/* 2. Prominent Promotional Hero Banner */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* Main Hero Card */}
          <div className="md:col-span-8 rounded-3xl bg-gradient-to-br from-[#0c6b66] via-[#10847e] to-[#044e4a] text-white p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            {/* Subtle background circular glow */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold backdrop-blur-xs">
                <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>Bhavnagar Home Dark Store • 30–45 Mins Express</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
                Genuine Ayurveda &amp; Primary OTC Medicines,
                <br />
                <span className="text-emerald-200">Delivered Swiftly to Your Door.</span>
              </h1>

              <p className="text-xs sm:text-sm text-emerald-50/90 leading-relaxed font-normal">
                Authentic remedies procured directly from wholesale agencies with official GST billing.
                Dispatched in 30–45 mins across Bhavnagar via Rapido bike parcel, or fast all-India courier.
              </p>
            </div>

            {/* Clear Primary Call to Action */}
            <div className="relative z-10 pt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={scrollToCatalog}
                className="bg-white hover:bg-emerald-50 text-[#0c6b66] font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span>Shop In-Stock Medicines</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsQuickBuyModalOpen(true)}
                className="bg-black/25 hover:bg-black/35 text-white border border-white/25 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl flex items-center gap-2 transition-all backdrop-blur-xs"
              >
                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>Quick Buy</span>
              </button>
            </div>
          </div>

          {/* Secondary Hero Card: Rapido Instant Bike Dispatch */}
          <div className="md:col-span-4 rounded-3xl bg-gradient-to-br from-[#EBF5FB] via-[#E1F0FA] to-[#D4E8F8] border border-[#B9D8F1] text-gray-900 p-5 sm:p-6 flex flex-col justify-between shadow-2xs relative overflow-hidden">
            <div className="space-y-2">
              <span className="inline-block text-[10px] font-black bg-[#10847e] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ⚡ RAPIDO PARCEL
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#003B71] tracking-tight leading-snug">
                Bhavnagar 30–45 Min Bike Delivery
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Have a carry-bag flyer or urgent headache/cold need? Orders pack from home stock in 10 minutes.
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <div className="p-2.5 bg-white/90 rounded-xl border border-blue-100 flex items-center gap-2.5 shadow-2xs">
                <span className="text-2xl">🛵</span>
                <div className="text-[11px] leading-tight text-gray-700">
                  <strong>Delivering to:</strong> {currentLocation.area}
                </div>
              </div>

              <a
                href={`https://wa.me/${settings.merchantWhatsApp}?text=Hi%20AyurSwift,%20I%20want%20to%20place%20a%20quick%20medicine%20order.`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#003B71] hover:bg-[#00284D] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <span>💬 Order on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* 3. Offer & Trust Strip (4 Pillars) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10847e] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-gray-900 leading-tight">
                30–45 Mins In-City
              </div>
              <div className="text-[10.5px] text-gray-500 mt-0.5">
                Rapido parcel in Bhavnagar
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-gray-900 leading-tight">
                100% Genuine Stock
              </div>
              <div className="text-[10.5px] text-gray-500 mt-0.5">
                Agency GST billed medicines
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-gray-900 leading-tight">
                Zero Gateway Cuts
              </div>
              <div className="text-[10.5px] text-gray-500 mt-0.5">
                Direct UPI (₹0 extra fee)
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-gray-900 leading-tight">
                All-India Courier
              </div>
              <div className="text-[10.5px] text-gray-500 mt-0.5">
                Secure bubble-wrapped boxes
              </div>
            </div>
          </div>
        </section>

        {/* 4. Service Benefit Strip (AyurSwift Care - Free Delivery Above ₹499) */}
        <section className="bg-gradient-to-r from-[#FFF4E5] to-[#FFF9F0] border border-[#FFE0B2] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E65100] text-white flex items-center justify-center text-xl shrink-0 font-black shadow-2xs">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#E65100] text-white text-[10px] font-black px-2 py-0.5 rounded">
                  AyurSwift Care
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                  Free Express Delivery on Orders Above ₹{settings.cityFreeDeliveryAbove}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Only in-stock remedies shown • Zero out-of-stock confusion • 100% verified batches.
              </p>
            </div>
          </div>

          <button
            onClick={scrollToCatalog}
            className="bg-[#5D4037] hover:bg-[#4E342E] text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            Explore Catalog
          </button>
        </section>

        {/* 5. Health-Concern Categories (Reference 1: Circular / Card Categories) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>Shop by Health Concerns</span>
              <span className="text-xs font-normal text-gray-500">
                (Click any category to filter catalog)
              </span>
            </h2>
            {selectedCategory !== 'ALL' && (
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="text-xs font-bold text-[#10847e] hover:underline"
              >
                Show All
              </button>
            )}
          </div>

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
                id: 'Daily Wellness',
                title: 'Daily Wellness',
                sub: 'Liv.52, Vitality & Care',
                icon: '✨',
                color: 'bg-purple-50 text-purple-800 border-purple-200',
              },
              {
                id: 'Skin & Hair',
                title: 'Skin & Hair',
                sub: 'Aloe Vera & Almond Oils',
                icon: '💆',
                color: 'bg-rose-50 text-rose-800 border-rose-200',
              },
            ].map((concern) => {
              const isSelected = selectedCategory === concern.id;
              return (
                <button
                  key={concern.id}
                  onClick={() => {
                    setSelectedCategory(concern.id);
                    scrollToCatalog();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all hover:shadow-sm cursor-pointer ${
                    isSelected
                      ? 'border-[#10847e] bg-emerald-50/50 ring-2 ring-[#10847e]'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-2xl mb-2 border border-gray-100">
                    {concern.icon}
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-gray-900 line-clamp-1">
                    {concern.title}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                    {concern.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 6. Trending Bestsellers Row (Quick 1-Tap Add) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Trending Daily Bestsellers</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Fast-relief herbal formulations most frequently ordered in Bhavnagar
              </p>
            </div>
            <button
              onClick={scrollToCatalog}
              className="text-xs font-bold text-[#10847e] hover:underline"
            >
              View Full Catalog ({products.filter((p) => p.isLive && p.stockQuantity > 0).length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {bestSellers.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              return (
                <ProductCard
                  key={`featured-${product.id}`}
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
        {/* MEDICINE CATALOG SECTION (Reference 2: TrueMeds inspired)       */}
        {/* ============================================================== */}
        <div ref={catalogRef} className="pt-6 border-t border-gray-200">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="text-xs text-gray-400 mb-3 flex items-center gap-1.5 font-medium"
          >
            <span
              className="hover:text-gray-700 cursor-pointer"
              onClick={handleResetFilters}
            >
              Home
            </span>
            <span>/</span>
            <span
              className="hover:text-gray-700 cursor-pointer"
              onClick={() => setSelectedCategory('ALL')}
            >
              Medicines
            </span>
            <span>/</span>
            <span className="text-[#10847e] font-extrabold">
              {selectedCategory === 'ALL' ? 'All In-Stock Medicines' : selectedCategory}
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* DESKTOP FILTER SIDEBAR (Reference 2: Visible left box) */}
            <aside
              className="hidden lg:block w-64 bg-white rounded-2xl border border-gray-200 p-4 shrink-0 space-y-5 shadow-2xs sticky top-28"
              aria-label="Product filters"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#10847e]" />
                  <span>Filters</span>
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-[#10847e] hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Category Filter */}
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
                      name="desktop_category"
                      checked={selectedCategory === 'ALL'}
                      onChange={() => setSelectedCategory('ALL')}
                      className="accent-[#10847e] w-3.5 h-3.5"
                    />
                    <span
                      className={
                        selectedCategory === 'ALL'
                          ? 'font-bold text-[#10847e]'
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
                        className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="desktop_category"
                          checked={selectedCategory === cat}
                          onChange={() => setSelectedCategory(cat)}
                          className="accent-[#10847e] w-3.5 h-3.5"
                        />
                        <span
                          className={
                            selectedCategory === cat
                              ? 'font-bold text-[#10847e]'
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

                <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto pr-1">
                  <label
                    onClick={() => setSelectedBrand('ALL')}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="desktop_brand"
                      checked={selectedBrand === 'ALL'}
                      onChange={() => setSelectedBrand('ALL')}
                      className="accent-[#10847e] w-3.5 h-3.5"
                    />
                    <span
                      className={
                        selectedBrand === 'ALL'
                          ? 'font-bold text-[#10847e]'
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
                      className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="desktop_brand"
                        checked={selectedBrand === brand}
                        onChange={() => setSelectedBrand(brand)}
                        className="accent-[#10847e] w-3.5 h-3.5"
                      />
                      <span
                        className={
                          selectedBrand === brand
                            ? 'font-bold text-[#10847e]'
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
                <span className="font-bold text-gray-900 block">Price Range</span>
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
                      className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="desktop_price"
                        checked={selectedPriceRange === r.id}
                        onChange={() => setSelectedPriceRange(r.id)}
                        className="accent-[#10847e] w-3.5 h-3.5"
                      />
                      <span
                        className={
                          selectedPriceRange === r.id
                            ? 'font-bold text-[#10847e]'
                            : 'text-gray-700'
                        }
                      >
                        {r.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dispatch Info Box */}
              <div className="border-t border-gray-100 pt-3.5 space-y-2 text-xs">
                <span className="font-bold text-gray-900 block">Dispatch Guarantee</span>
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1 text-[11px] text-emerald-950">
                  <div className="font-extrabold flex items-center gap-1 text-[#10847e]">
                    <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>30–45 Mins Rapido Parcel</span>
                  </div>
                  <p className="text-gray-600 text-[10.5px]">
                    Dispatched from home dark store in Bhavnagar.
                  </p>
                </div>
              </div>
            </aside>

            {/* MAIN CATALOG FEED */}
            <div className="flex-1 w-full space-y-4">
              {/* Heading, Result Count & Sort Bar */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                    {selectedCategory === 'ALL'
                      ? 'Ayurvedic & Primary Health OTC Medicines'
                      : selectedCategory}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Strict Availability: Showing {filteredProducts.length} in-stock medicines
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Mobile Filters Toggle Button */}
                  <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#10847e]" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="bg-[#10847e] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Sort Control Dropdown */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-500 font-medium hidden md:inline">Sort by:</span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortKey)}
                        className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#10847e] cursor-pointer"
                        aria-label="Sort products"
                      >
                        <option value="FEATURED">Featured &amp; Bestselling</option>
                        <option value="PRICE_ASC">Price: Low to High</option>
                        <option value="PRICE_DESC">Price: High to Low</option>
                        <option value="DISCOUNT_DESC">Highest Discount %</option>
                        <option value="RATING_DESC">Top Customer Rating</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Grid (Multi-Column: 2 cols on mobile, 3 on tablet, 4 on desktop) */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3 shadow-2xs">
                  <div className="text-4xl">🔍</div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    No matching medicines found
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Try adjusting your category or brand filters, or clear search terms to view all stocked remedies.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="bg-[#10847e] hover:bg-[#0c6b66] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs"
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
        </div>

        {/* 7. Persistent Order by Call / WhatsApp Strip (Reference 1 Bottom Section) */}
        <section className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10847e] flex items-center justify-center shrink-0 shadow-2xs">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base text-gray-900">
                Order Medicines via Call / WhatsApp
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Have a prescription or carry-bag flyer? Enter phone number for instant Rapido bike dispatch.
              </div>
            </div>
          </div>

          <form
            onSubmit={handleCallbackSubmit}
            className="flex flex-wrap items-center gap-2 w-full md:w-auto"
          >
            <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 bg-white text-xs text-gray-800 w-full sm:w-auto focus-within:border-[#10847e]">
              <span className="font-bold text-gray-500 mr-1.5">🇮🇳 +91</span>
              <input
                type="tel"
                value={callbackPhone}
                onChange={(e) => setCallbackPhone(e.target.value)}
                placeholder="Enter 10-digit mobile"
                maxLength={10}
                className="w-40 focus:outline-none text-xs"
                required
                aria-label="Phone number for call/WhatsApp order"
              />
            </div>
            <button
              type="submit"
              className="bg-[#E54B38] hover:bg-[#D43D2A] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 active:scale-95"
            >
              {callbackSent ? 'Opening WhatsApp...' : 'Get Instant WhatsApp Order'}
            </button>
          </form>
        </section>
      </main>

      {/* Floating Zepto / Blinkit Bottom Sticky Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-black/20 via-black/5 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="bg-[#10847e] text-white p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-3">
                <div className="relative bg-[#0c6b66] p-2 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-amber-300" />
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-gray-900 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-sm sm:text-base">₹{cartSubtotal}</span>
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
                <span>View Cart &amp; Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent WhatsApp Floating Button on Mobile */}
      <a
        href={`https://wa.me/${settings.merchantWhatsApp}?text=Hi%20AyurSwift,%20I%20need%20quick%20medicine%20assistance.`}
        target="_blank"
        rel="noreferrer"
        className={`fixed bottom-20 right-4 z-30 sm:hidden bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90 ${
          cartCount > 0 ? 'bottom-24' : 'bottom-6'
        }`}
        aria-label="Chat on WhatsApp"
      >
        <PhoneCall className="w-5 h-5" />
      </a>

      {/* Footer */}
      <footer className="mt-14 bg-white border-t border-gray-200 py-10 text-xs text-gray-500 space-y-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <span className="text-[#10847e]">AyurSwift 🌿⚡</span>
            <span className="text-gray-300">•</span>
            <span>Bhavnagar Dark Store</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-gray-500">
            <span>⚡ Bhavnagar 30-45m Rapido Parcel</span>
            <span>•</span>
            <span>📦 All-India Courier</span>
            <span>•</span>
            <span>🛡️ 100% Agency Sourced with GST Invoices</span>
            <span>•</span>
            <span>📱 Direct Bank UPI</span>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 text-center max-w-xl mx-auto">
          AyurSwift operates as a home-based micro-fulfillment dark store for authentic Ayurvedic &amp; primary OTC medicines.
        </p>
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
    </div>
  );
}
