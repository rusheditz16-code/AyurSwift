'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProductCard } from '@/components/ProductCard';
import { CartDrawer } from '@/components/CartDrawer';
import { PaymentModal } from '@/components/PaymentModal';
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
} from 'lucide-react';

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<MerchantSettings>(getStoredSettings());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  useEffect(() => {
    setProducts(getStoredProducts());
    setSettings(getStoredSettings());

    // Load cart from sessionStorage if available
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

  // Extract unique categories and brands from live products
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
      // Rule 1: Must be in stock and marked live
      if (!p.isLive || p.stockQuantity <= 0) return false;

      // Rule 2: Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;

      // Rule 3: Brand filter
      if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) return false;

      // Rule 4: Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(query);
        const matchBrand = p.brand.toLowerCase().includes(query);
        const matchCategory = p.category.toLowerCase().includes(query);
        const matchIndications = p.indications.toLowerCase().includes(query);
        if (!matchName && !matchBrand && !matchCategory && !matchIndications) {
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

  // Place Order Handler
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

    // Save order
    const updatedOrders = [order, ...existingOrders];
    saveStoredOrders(updatedOrders);

    // Close cart drawer & open payment modal
    setIsCartOpen(false);
    setActiveOrder(order);
    handleClearCart();
  };

  return (
    <div className="min-h-screen bg-[#FBFDFB] flex flex-col font-sans">
      {/* Header */}
      <Header
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-6 flex-1 w-full space-y-6">
        {/* Hero Trust Banner (Quick-Commerce + Ayurvedic Dark Store) */}
        <div className="relative rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-7 shadow-lg overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-amber-300 text-xs font-bold tracking-wide">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              <span>AyurSwift Micro-Fulfillment Dark Store</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Genuine Ayurveda & Primary OTC,
              <br />
              <span className="text-emerald-300">Delivered Swiftly to Your Doorstep.</span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              100% authentic medicines procured directly from wholesale agencies with GST billing. Stocked safely at home for lightning-fast <strong>30–45 minute Rapido parcel delivery</strong> in-city, or reliable courier all across India.
            </p>

            {/* Micro Trust Points */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] sm:text-xs text-emerald-200 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Only In-Stock Items Shown
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 1-Click WhatsApp Order
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> ₹0 Payment Fees (Direct UPI)
              </span>
            </div>
          </div>
        </div>

        {/* Categories, Brands & Search Filter */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100/80 shadow-xs">
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

        {/* Live Catalog Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-gray-900 tracking-tight flex items-center gap-2">
                <span>Available in Home Stock</span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {filteredProducts.length} items
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Strict Availability Guarantee: Zero out-of-stock items displayed.
              </p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl">
                🔍
              </div>
              <h3 className="font-bold text-gray-800 text-sm">No items found</h3>
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
            <div className="bg-emerald-800 text-white p-3 sm:p-3.5 rounded-2xl shadow-xl border border-emerald-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
              {/* Left Cart Counter & Price */}
              <div className="flex items-center gap-3">
                <div className="relative bg-emerald-950/60 p-2 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-amber-300" />
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-emerald-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-sm sm:text-base">
                      ₹{cartSubtotal}
                    </span>
                    {cartSavings > 0 && (
                      <span className="text-[11px] text-amber-200 font-semibold">
                        (Saved ₹{cartSavings})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-200 block">
                    {cartCount} medicine{cartCount === 1 ? '' : 's'} added
                  </span>
                </div>
              </div>

              {/* Right Checkout Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="bg-amber-400 hover:bg-amber-500 text-emerald-950 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <span>View Cart & Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-emerald-100 py-6 text-center text-xs text-gray-500 space-y-2">
        <div className="flex items-center justify-center gap-1.5 font-bold text-gray-700">
          <span>AyurSwift 🌿⚡</span>
          <span>•</span>
          <span>Target: ayurswift.in</span>
        </div>
        <p className="text-[11px] text-gray-400 max-w-md mx-auto">
          Home micro-fulfillment dark store for authentic Ayurvedic & primary OTC healthcare. Zero middleman fees, rapid Rapido dispatch, direct UPI payment.
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
    </div>
  );
}
