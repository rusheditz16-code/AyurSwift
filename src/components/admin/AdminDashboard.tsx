'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  Package,
  TrendingUp,
  Plus,
  Minus,
  Check,
  Zap,
  Truck,
  ArrowLeft,
  Settings,
  Database,
  Copy,
  Search,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  DollarSign,
  AlertCircle,
  X,
} from 'lucide-react';
import { Product, Order, MerchantSettings } from '@/types';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredOrders,
  saveStoredOrders,
  getStoredSettings,
  saveStoredSettings,
  formatRapidoDropText,
  syncProductToSupabase,
} from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'RAPIDO' | 'SETTINGS'>('INVENTORY');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<MerchantSettings>(getStoredSettings());

  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // New Product Form state
  const [newProd, setNewProd] = useState<Partial<Product>>({
    name: '',
    brand: 'Dabur',
    category: 'Joint & Muscle Pain',
    manufacturer: 'Dabur India Ltd.',
    form: 'Balm',
    packSize: '',
    agencyCostPrice: 50,
    mrp: 80,
    sellingPrice: 70,
    stockQuantity: 10,
    isLive: true,
    rating: 4.8,
    reviewCount: 100,
    indications: '',
    dosage: 'Apply or take as directed',
    composition: 'Ayurvedic Botanical Extracts',
  });

  useEffect(() => {
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());
    setSettings(getStoredSettings());
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === settings.adminPin || pinInput === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Stock Quantity Stepper with Auto-Hide Guarantee
  const handleStockChange = (productId: string, delta: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stockQuantity + delta);
        const isLive = newStock === 0 ? false : p.isLive;
        const updatedProd = { ...p, stockQuantity: newStock, isLive };
        syncProductToSupabase(updatedProd);
        return updatedProd;
      }
      return p;
    });

    setProducts(updated);
    saveStoredProducts(updated);
  };

  // Toggle Live Storefront Visibility
  const handleToggleLive = (productId: string) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        // Can only be made live if stock > 0
        if (p.stockQuantity <= 0) return p;
        const updatedProd = { ...p, isLive: !p.isLive };
        syncProductToSupabase(updatedProd);
        return updatedProd;
      }
      return p;
    });

    setProducts(updated);
    saveStoredProducts(updated);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.packSize) return;

    const created: Product = {
      id: `sku-custom-${Date.now()}`,
      name: newProd.name,
      brand: newProd.brand || 'Dabur',
      category: newProd.category || 'Joint & Muscle Pain',
      manufacturer: newProd.manufacturer || 'Ayurvedic Pharmacy',
      form: (newProd.form as Product['form']) || 'Balm',
      packSize: newProd.packSize,
      agencyCostPrice: Number(newProd.agencyCostPrice) || 0,
      mrp: Number(newProd.mrp) || 0,
      sellingPrice: Number(newProd.sellingPrice) || 0,
      stockQuantity: Number(newProd.stockQuantity) || 0,
      isLive: (Number(newProd.stockQuantity) || 0) > 0,
      rating: 4.8,
      reviewCount: 1,
      indications: newProd.indications || 'Ayurvedic health remedy',
      dosage: newProd.dosage || 'As directed on pack',
      composition: newProd.composition || 'Herbal Ayurvedic Formulation',
      safetyAdvice: 'Store in a cool dry place away from sunlight.',
    };

    const updated = [created, ...products];
    setProducts(updated);
    saveStoredProducts(updated);
    syncProductToSupabase(created);
    setShowAddModal(false);
  };

  const handleCopyForRapido = (order: Order) => {
    const text = formatRapidoDropText(order);
    navigator.clipboard.writeText(text);
    setCopiedOrderId(order.id);

    const updatedOrders = orders.map((o) =>
      o.id === order.id ? { ...o, rapidoCopied: true, orderStatus: 'DISPATCHED' as const } : o
    );
    setOrders(updatedOrders);
    saveStoredOrders(updatedOrders);

    setTimeout(() => {
      setCopiedOrderId(null);
    }, 2500);
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o));
    setOrders(updated);
    saveStoredOrders(updated);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSettings(settings);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2000);
  };

  // Filtered inventory
  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Overall Financial Calculations
  const totalStockUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalCostValuation = products.reduce((acc, p) => acc + p.agencyCostPrice * p.stockQuantity, 0);
  const totalSellingValuation = products.reduce((acc, p) => acc + p.sellingPrice * p.stockQuantity, 0);
  const totalPotentialProfit = totalSellingValuation - totalCostValuation;
  const overallMarginPercent =
    totalSellingValuation > 0 ? Math.round((totalPotentialProfit / totalSellingValuation) * 100) : 0;

  const liveCount = products.filter((p) => p.isLive && p.stockQuantity > 0).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  // PIN Authentication Screen (Digital Gravity Dark Luxury Theme)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060908] text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(16,185,129,0.12)_0%,transparent_70%)] blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm glass-card border border-white/[0.08] bg-[#0b100d]/90 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">AyurSwift Merchant Hub</h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Enter 4-digit PIN to access dark store inventory & Rapido dispatch controls
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                autoFocus
                className="w-full text-center tracking-[0.4em] text-2xl font-black py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-neutral-700 placeholder:tracking-widest"
              />
              {pinError && (
                <p className="text-xs text-rose-400 text-center mt-2.5 font-medium flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Incorrect PIN. (Default: 1234)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-black py-3 rounded-2xl text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] active:scale-98"
            >
              Unlock Hub
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-neutral-400 hover:text-emerald-300 inline-flex items-center gap-1.5 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060908] text-white flex flex-col font-sans relative selection:bg-emerald-500/30 selection:text-emerald-200 pb-20">
      {/* Background glow elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.04)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Top Admin Bar (Digital Gravity Dark Glass Aesthetic) */}
      <header className="sticky top-0 z-30 glass-panel border-b border-white/[0.08] bg-[#060908]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌿⚡</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base tracking-tight text-white">
                  AyurSwift Merchant Hub
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Admin Active
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium">
                Home Dark Store • Rapido Rider Dispatch Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 px-3 py-1.5 rounded-xl border border-white/[0.08] flex items-center gap-1.5 font-bold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" /> Storefront
            </Link>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-xs text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.05] transition-colors"
              title="Lock Hub"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 flex gap-6 text-xs font-bold border-t border-white/[0.04] pt-1">
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`py-2.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'INVENTORY'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Inventory & Profit ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('RAPIDO')}
            className={`py-2.5 border-b-2 flex items-center gap-2 transition-all relative ${
              activeTab === 'RAPIDO'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Rapido Dispatch Feed ({orders.length})
            {orders.some((o) => o.orderStatus === 'NEW') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`py-2.5 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'SETTINGS'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            UPI & Store Settings
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6 space-y-6 w-full flex-1">
        {/* TAB 1: INVENTORY & PROFIT CALCULATOR */}
        {activeTab === 'INVENTORY' && (
          <div className="space-y-6">
            {/* Financial Snapshot Bar (Digital Gravity Dark Glass Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-card border border-white/[0.08] bg-white/[0.02] p-4 rounded-2xl shadow-lg">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Wholesale Procurement Cost
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  ₹{totalCostValuation}
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  {totalStockUnits} units in home dark store
                </div>
              </div>

              <div className="glass-card border border-white/[0.08] bg-white/[0.02] p-4 rounded-2xl shadow-lg">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Retail Selling Value
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                  ₹{totalSellingValuation}
                </div>
                <div className="text-[10px] text-emerald-300/80 font-medium mt-1">
                  At active customer pricing
                </div>
              </div>

              <div className="glass-card border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="text-[10px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Projected Net Profit
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  +₹{totalPotentialProfit}
                </div>
                <div className="text-[11px] text-emerald-400 font-extrabold mt-1">
                  {overallMarginPercent}% avg profit margin
                </div>
              </div>

              <div className="glass-card border border-white/[0.08] bg-white/[0.02] p-4 rounded-2xl shadow-lg">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Storefront Status
                </div>
                <div className="text-sm font-bold text-white mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-black">
                    🟢 {liveCount} Live
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="inline-flex items-center gap-1 text-rose-400 font-black">
                    ⚪ {outOfStockCount} Out
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  Strict Auto-Hide at 0 stock
                </div>
              </div>
            </div>

            {/* Inventory Controls Bar */}
            <div className="glass-panel rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search inventory SKU or brand..."
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add New Medicine
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
                    <tr>
                      <th className="py-3 px-3.5">Medicine & Brand</th>
                      <th className="py-3 px-2">Pack Form</th>
                      <th className="py-3 px-2 text-right">Agency Cost</th>
                      <th className="py-3 px-2 text-right">MRP</th>
                      <th className="py-3 px-2 text-right">Sell Price</th>
                      <th className="py-3 px-2 text-right">Profit (₹ / %)</th>
                      <th className="py-3 px-3 text-center">Stock Stepper</th>
                      <th className="py-3 px-3 text-center">Storefront View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredProducts.map((product) => {
                      const unitProfit = product.sellingPrice - product.agencyCostPrice;
                      const marginPercent = Math.round(
                        (unitProfit / product.sellingPrice) * 100
                      );
                      const isOutOfStock = product.stockQuantity === 0;

                      return (
                        <tr
                          key={product.id}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            isOutOfStock ? 'bg-black/30 opacity-60' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-white line-clamp-1">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-bold uppercase mt-0.5">
                              {product.brand} • <span className="text-neutral-400 font-normal">{product.category}</span>
                            </div>
                          </td>

                          <td className="py-3 px-2 text-neutral-300 font-medium">
                            {product.packSize}
                          </td>

                          <td className="py-3 px-2 text-right font-medium text-neutral-300">
                            ₹{product.agencyCostPrice}
                          </td>

                          <td className="py-3 px-2 text-right text-neutral-400 line-through">
                            ₹{product.mrp}
                          </td>

                          <td className="py-3 px-2 text-right font-black text-emerald-300">
                            ₹{product.sellingPrice}
                          </td>

                          <td className="py-3 px-2 text-right">
                            <span className="font-black text-emerald-400">
                              +₹{unitProfit}
                            </span>
                            <span className="block text-[10px] font-bold text-emerald-500">
                              {marginPercent}% margin
                            </span>
                          </td>

                          {/* Quick Stepper */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center bg-black/40 rounded-xl border border-white/10 p-0.5">
                              <button
                                onClick={() => handleStockChange(product.id, -1)}
                                className="p-1 hover:bg-white/10 rounded-lg text-neutral-300 hover:text-white transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span
                                className={`px-2.5 font-black text-xs min-w-[28px] ${
                                  product.stockQuantity === 0
                                    ? 'text-rose-400'
                                    : 'text-white'
                                }`}
                              >
                                {product.stockQuantity}
                              </span>
                              <button
                                onClick={() => handleStockChange(product.id, 1)}
                                className="p-1 hover:bg-white/10 rounded-lg text-neutral-300 hover:text-white transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Visibility */}
                          <td className="py-3 px-3 text-center">
                            {product.stockQuantity === 0 ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                                ⚪ Auto-Hidden (Stock 0)
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleLive(product.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                                  product.isLive
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                                    : 'bg-white/[0.04] text-neutral-400 border border-white/10 hover:bg-white/[0.08]'
                                }`}
                              >
                                {product.isLive ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    Live in Store
                                  </>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                                    Hidden
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RAPIDO DISPATCH TOOL */}
        {activeTab === 'RAPIDO' && (
          <div className="space-y-4">
            <div className="glass-card border border-amber-500/30 bg-amber-500/10 rounded-3xl p-5 flex items-start gap-3.5 shadow-lg">
              <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-amber-300 text-sm">
                  Rapido Parcel 1-Tap Rider Dispatch
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mt-0.5">
                  Click <strong>&quot;1-Click Copy for Rapido&quot;</strong> on any in-city order. It formats the customer name, phone number, drop address, and COD/Prepaid info cleanly so you can paste it directly into the Rapido app to book a bike parcel pickup in seconds.
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="glass-card rounded-3xl border border-white/[0.08] bg-white/[0.02] p-12 text-center space-y-2">
                <Truck className="w-12 h-12 text-neutral-600 mx-auto" />
                <h3 className="font-bold text-white text-sm">No Orders Yet</h3>
                <p className="text-xs text-neutral-400">
                  When customers place orders from the storefront, they appear here instantly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => {
                  const isCopied = copiedOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="glass-card rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-lg space-y-3.5"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-emerald-400">
                            {order.id}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              order.deliveryType === 'RAPIDO_CITY'
                                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                                : 'bg-blue-400/15 text-blue-300 border border-blue-400/30'
                            }`}
                          >
                            {order.deliveryType === 'RAPIDO_CITY'
                              ? '⚡ Rapido In-City'
                              : '📦 Courier'}
                          </span>
                        </div>

                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleUpdateOrderStatus(
                              order.id,
                              e.target.value as Order['orderStatus']
                            )
                          }
                          className="text-[11px] font-bold py-1 px-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                        >
                          <option value="NEW" className="bg-neutral-900 text-white">🟢 New Order</option>
                          <option value="PACKED" className="bg-neutral-900 text-white">📦 Packed</option>
                          <option value="DISPATCHED" className="bg-neutral-900 text-white">⚡ Dispatched</option>
                          <option value="DELIVERED" className="bg-neutral-900 text-white">✓ Delivered</option>
                          <option value="CANCELLED" className="bg-neutral-900 text-white">✕ Cancelled</option>
                        </select>
                      </div>

                      {/* Customer Details */}
                      <div className="space-y-1.5 text-xs text-neutral-300">
                        <div className="flex justify-between font-bold">
                          <span className="text-white">{order.customerName}</span>
                          <span className="text-emerald-400 font-mono">
                            {order.customerPhone}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 bg-black/40 p-3 rounded-xl border border-white/[0.06] leading-relaxed">
                          {order.deliveryAddress}
                          {order.landmark ? `, Landmark: ${order.landmark}` : ''}
                          <br />
                          <strong className="text-white">{order.city} - {order.pincode}</strong>
                        </p>
                      </div>

                      {/* Items */}
                      <div className="text-[11px] text-neutral-400 space-y-1 border-t border-white/[0.06] pt-2.5">
                        {order.items.map((i) => (
                          <div key={i.productId} className="flex justify-between">
                            <span>
                              {i.name} ({i.packSize}) x {i.quantity}
                            </span>
                            <span className="font-bold text-white">
                              ₹{i.totalPrice}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-400 block uppercase">
                            Payment
                          </span>
                          <span className="font-bold text-white">
                            {order.paymentMethod === 'COD' ? '💵 COD' : '📱 UPI'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 block uppercase">
                            Total Payable
                          </span>
                          <span className="font-black text-sm text-emerald-400">
                            ₹{order.totalAmount}
                          </span>
                        </div>
                      </div>

                      {/* 1-Click Copy for Rapido Button */}
                      {order.deliveryType === 'RAPIDO_CITY' && (
                        <button
                          onClick={() => handleCopyForRapido(order)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>✓ Copied Drop Info for Rapido!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>1-Click Copy for Rapido App</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SETTINGS & UPI */}
        {activeTab === 'SETTINGS' && (
          <div className="max-w-2xl glass-card rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7 shadow-xl space-y-6">
            <div>
              <h2 className="font-black text-base text-white">
                AyurSwift Store & Direct UPI Configuration
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Direct bank settlement via UPI QR (zero transaction fees)
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Store WhatsApp Number (with 91)
                  </label>
                  <input
                    type="text"
                    value={settings.merchantWhatsApp}
                    onChange={(e) =>
                      setSettings({ ...settings, merchantWhatsApp: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Merchant UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    value={settings.merchantUpiId}
                    onChange={(e) =>
                      setSettings({ ...settings, merchantUpiId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    In-City Rapid Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.cityDeliveryFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        cityDeliveryFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Free In-City Delivery Above (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.cityFreeDeliveryAbove}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        cityFreeDeliveryAbove: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Outside-City Courier Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.courierDeliveryFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        courierDeliveryFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Admin Portal PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={settings.adminPin}
                    onChange={(e) =>
                      setSettings({ ...settings, adminPin: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-black text-xs py-2.5 px-5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  Save Store Settings
                </button>
                {settingsSavedToast && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Settings updated successfully!
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ADD SKU MODAL (Digital Gravity Dark Glass Style) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card border border-white/[0.1] bg-[#0c120f]/95 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-black text-base text-white">
                Add New Ayurvedic Medicine / SKU
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder="e.g. Zandu Balm Fast Relief"
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Brand
                  </label>
                  <select
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Dabur" className="bg-neutral-900">Dabur</option>
                    <option value="Zandu" className="bg-neutral-900">Zandu</option>
                    <option value="Himalaya" className="bg-neutral-900">Himalaya</option>
                    <option value="Baidyanath" className="bg-neutral-900">Baidyanath</option>
                    <option value="Patanjali" className="bg-neutral-900">Patanjali</option>
                    <option value="Dr. Ortho" className="bg-neutral-900">Dr. Ortho</option>
                    <option value="Other" className="bg-neutral-900">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={newProd.form}
                    onChange={(e) => setNewProd({ ...newProd, form: e.target.value as Product['form'] })}
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Balm" className="bg-neutral-900">Balm (Jar)</option>
                    <option value="Tablets" className="bg-neutral-900">Tablets (Bottle)</option>
                    <option value="Syrup" className="bg-neutral-900">Syrup (Bottle)</option>
                    <option value="Oil" className="bg-neutral-900">Oil (Bottle)</option>
                    <option value="Churna" className="bg-neutral-900">Churna (Tub)</option>
                    <option value="Capsules" className="bg-neutral-900">Capsules (Blister)</option>
                    <option value="Gel" className="bg-neutral-900">Gel (Tube)</option>
                    <option value="Husk" className="bg-neutral-900">Husk (Box)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Pack Size *
                  </label>
                  <input
                    type="text"
                    value={newProd.packSize}
                    onChange={(e) => setNewProd({ ...newProd, packSize: e.target.value })}
                    placeholder="e.g. 25g Jar, 100ml Bottle"
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    Agency Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={newProd.agencyCostPrice}
                    onChange={(e) =>
                      setNewProd({
                        ...newProd,
                        agencyCostPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={newProd.mrp}
                    onChange={(e) =>
                      setNewProd({ ...newProd, mrp: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    Sell Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newProd.sellingPrice}
                    onChange={(e) =>
                      setNewProd({
                        ...newProd,
                        sellingPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newProd.stockQuantity}
                    onChange={(e) =>
                      setNewProd({
                        ...newProd,
                        stockQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs bg-black/50 border border-white/10 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  Clinical Indications / Benefits
                </label>
                <input
                  type="text"
                  value={newProd.indications}
                  onChange={(e) => setNewProd({ ...newProd, indications: e.target.value })}
                  placeholder="e.g. Fast relief from headaches & body ache"
                  className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-black text-xs px-5 py-2 rounded-xl shadow-md"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
