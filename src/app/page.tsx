'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
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
import {
  Zap,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Clock,
  Package,
  QrCode,
  CheckCircle,
  Truck,
  FileCheck2,
  Lock,
  Flame,
} from 'lucide-react';

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<MerchantSettings>(getStoredSettings());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedMedicineDetails, setSelectedMedicineDetails] = useState<Product | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

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

  return (
    <div className="min-h-screen bg-[#060908] text-white flex flex-col font-sans relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Digital Gravity Ambient Glowing Mesh Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.14)_0%,rgba(16,185,129,0.03)_50%,transparent_75%)] blur-2xl" />
        <div className="absolute top-[35%] -left-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(20,184,166,0.08)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(245,158,11,0.05)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Header */}
      <Header
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
      />

      {/* Main Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-5 sm:py-7 flex-1 w-full space-y-6">
        {/* Digital Gravity Style Hero Showcase */}
        <section className="relative rounded-3xl p-6 sm:p-9 glass-card border border-white/[0.08] bg-gradient-to-br from-white/[0.05] via-[#09110d] to-[#050807] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          {/* Subtle Ambient Backlight */}
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold tracking-wide backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] sm:text-xs">AyurSwift Micro-Fulfillment Dark Store</span>
              <span className="text-white/30">•</span>
              <span className="text-amber-400 font-extrabold text-[11px]">30-45m Dispatch</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12]">
              Genuine Ayurveda & Primary Health,{' '}
              <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
                Delivered Swiftly to Your Doorstep.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal max-w-2xl">
              100% genuine OTC healthcare remedies procured from authorized pharmaceutical wholesale agencies with verified GST invoicing. Stored under strict temperature-controlled dark store conditions for instantaneous <strong>30–45 minute Rapido bike dispatch</strong> in-city, or pan-India courier delivery.
            </p>

            {/* Carry-Bag Flyer Scan Cue & Trust Points */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-neutral-300">
              <div className="bg-white/[0.04] border border-amber-400/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-amber-300 font-bold backdrop-blur-md">
                <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Flyer customer? Orders pack & dispatch within 10 mins!</span>
              </div>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Only In-Stock Items Shown
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> ₹0 Payment Fees (Direct UPI)
              </span>
            </div>
          </div>
        </section>

        {/* Digital Gravity Clinical Trust Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card border border-white/[0.08] bg-white/[0.02] hover:border-emerald-500/40 p-3.5 rounded-2xl transition-all duration-300 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white leading-tight">100% Genuine</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">GST Wholesale Billed</div>
            </div>
          </div>

          <div className="glass-card border border-white/[0.08] bg-white/[0.02] hover:border-amber-500/40 p-3.5 rounded-2xl transition-all duration-300 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <div className="text-xs font-black text-white leading-tight">30-45m Rapido</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Instant Home Dispatch</div>
            </div>
          </div>

          <div className="glass-card border border-white/[0.08] bg-white/[0.02] hover:border-teal-500/40 p-3.5 rounded-2xl transition-all duration-300 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white leading-tight">Strict In-Stock</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Zero Out-Of-Stock Clutter</div>
            </div>
          </div>

          <div className="glass-card border border-white/[0.08] bg-white/[0.02] hover:border-emerald-500/40 p-3.5 rounded-2xl transition-all duration-300 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white leading-tight">₹0 Gateway Cut</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">100% Direct Bank UPI</div>
            </div>
          </div>
        </section>

        {/* Categories, Brands & Search Filter Container */}
        <section className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/[0.08] bg-white/[0.02] shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <CategoryFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            categories={availableCategories}
            brands={availableBrands}
          />
        </section>

        {/* Live Catalog Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                <span>Available In Home Dark Store</span>
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  {filteredProducts.length} medicines
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Strict Availability Guarantee: Only in-stock Ayurvedic remedies are displayed.
              </p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="glass-card rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl">
                🔍
              </div>
              <h3 className="font-bold text-white text-sm">No stocked medicines found</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No currently stocked products match your filter. Try changing the health concern or searching for another remedy.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedBrand('ALL');
                }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline transition-colors"
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
        </section>
      </main>

      {/* Floating Zepto / Blinkit Bottom Sticky Cart Bar (Digital Gravity Dark Luxury Theme) */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="bg-[#0e1612]/95 backdrop-blur-xl text-white p-3 sm:p-3.5 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-emerald-500/30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center gap-3">
                <div className="relative bg-emerald-500/15 border border-emerald-500/30 p-2.5 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-neutral-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-sm sm:text-base text-white">
                      ₹{cartSubtotal}
                    </span>
                    {cartSavings > 0 && (
                      <span className="text-[11px] text-amber-300 font-bold">
                        (Saved ₹{cartSavings})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-400 block">
                    {cartCount} medicine{cartCount === 1 ? '' : 's'} ready for dispatch
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
              >
                <span>View Cart & Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Gravity Dark Footer */}
      <footer className="relative z-10 mt-16 bg-[#040605] border-t border-white/[0.06] py-10 text-center text-xs text-neutral-500 space-y-3">
        <div className="flex items-center justify-center gap-2 font-black text-white text-sm">
          <span className="text-emerald-400">AyurSwift 🌿⚡</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-300">ayurswift.in</span>
        </div>
        <p className="text-[11px] text-neutral-400 max-w-md mx-auto leading-relaxed">
          Home micro-fulfillment dark store for authentic Ayurvedic & primary OTC medicines. Dispatched via Rapido Parcel & Speed Post. Zero transaction fees via direct UPI.
        </p>
        <div className="flex items-center justify-center gap-4 text-[10px] text-neutral-500 pt-2">
          <span>⚡ Rapido 30-45m Express</span>
          <span>•</span>
          <span>🛡️ Verified Home Inventory</span>
          <span>•</span>
          <span>₹0 Gateway Cut</span>
        </div>
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
