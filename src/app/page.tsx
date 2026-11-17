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
    <div className="min-h-screen bg-[#F8FAF9] text-gray-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 w-full space-y-4 sm:space-y-5">
        {/* Clean, Fast Quick-Commerce Hero Banner (Blinkit / Zepto Style) */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-amber-300 text-[11px] font-bold">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>AyurSwift Micro-Fulfillment Dark Store</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-snug">
              Genuine Ayurveda & Primary OTC Medicines,
              <br />
              <span className="text-emerald-200">Delivered in 30–45 Mins via Rapido.</span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              100% authentic remedies procured from wholesale agency distributors with GST invoices. Stocked safely at home for lightning-fast 30–45 min bike delivery in-city, or reliable courier all across India.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-emerald-100">
              <div className="bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-700/60 flex items-center gap-1.5 text-white font-semibold">
                <QrCode className="w-3.5 h-3.5 text-amber-300" />
                <span>Carry-bag flyer customer? Orders dispatch in 10 mins!</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Only In-Stock Shown
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> Zero Fee Direct UPI
              </span>
            </div>
          </div>
        </div>

        {/* 4 Clean Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-2.5 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">100% Genuine</div>
              <div className="text-[10px] text-gray-500">GST Wholesale Stock</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-2.5 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">30-45m Rapido</div>
              <div className="text-[10px] text-gray-500">Rapid Bike Dispatch</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-2.5 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Verified Stock</div>
              <div className="text-[10px] text-gray-500">Zero Out-Of-Stock Clutter</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-2.5 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">₹0 Gateway Fee</div>
              <div className="text-[10px] text-gray-500">Direct Bank UPI QR</div>
            </div>
          </div>
        </div>

        {/* Clean Filter Rail */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
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
        </div>

        {/* Product Catalog Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-gray-900">
                Available In Home Stock
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {filteredProducts.length} medicines
              </span>
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:inline">
              Strict Availability Guarantee
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-2">
              <div className="text-3xl">🔍</div>
              <h3 className="font-bold text-gray-800 text-sm">No stocked medicines found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No currently stocked products match your filter. Try changing health concern or searching for another remedy.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedBrand('ALL');
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
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
      </main>

      {/* Floating Zepto / Blinkit Bottom Sticky Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-black/20 via-black/5 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="bg-emerald-900 text-white p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-250">
              <div className="flex items-center gap-3">
                <div className="relative bg-emerald-800 p-2 rounded-xl">
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
                  <span className="text-[10px] text-emerald-200 block">
                    {cartCount} medicine{cartCount === 1 ? '' : 's'} ready for dispatch
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-black text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <span>View Cart & Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Footer */}
      <footer className="mt-14 bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500 space-y-1.5">
        <div className="flex items-center justify-center gap-2 font-bold text-gray-800 text-sm">
          <span>AyurSwift 🌿⚡</span>
          <span>•</span>
          <span className="text-emerald-700">ayurswift.in</span>
        </div>
        <p className="text-[11px] text-gray-400 max-w-md mx-auto">
          Home micro-fulfillment dark store for authentic Ayurvedic & primary OTC medicines. Dispatched via Rapido Parcel & Speed Post.
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
