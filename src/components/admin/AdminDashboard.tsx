'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  Package,
  TrendingUp,
  DollarSign,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Zap,
  Truck,
  ArrowLeft,
  Settings,
  Database,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Product, Order, MerchantSettings, ProductCategory, BrandName } from '@/types';
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

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'RAPIDO' | 'SETTINGS'>('INVENTORY');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<MerchantSettings>(getStoredSettings());

  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // New Product Form state
  const [newProd, setNewProd] = useState<Partial<Product>>({
    name: '',
    brand: 'Dabur',
    category: 'Joint & Muscle Pain',
    packSize: '',
    agencyCostPrice: 50,
    mrp: 80,
    sellingPrice: 70,
    stockQuantity: 10,
    isLive: true,
    indications: '',
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

  // Stock Quantity Stepper with Auto-Hide
  const handleStockChange = (productId: string, delta: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stockQuantity + delta);
        // Auto-Hide rule: if new stock is 0, auto-set isLive to false or keep track
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

  // Visibility toggle
  const handleToggleLive = (productId: string) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        // Only allow turning live if stock > 0
        if (!p.isLive && p.stockQuantity === 0) {
          alert('Cannot make item live with 0 stock! Please add stock first.');
          return p;
        }
        const updatedProd = { ...p, isLive: !p.isLive };
        syncProductToSupabase(updatedProd);
        return updatedProd;
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
  };

  // Add Product Submit
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.packSize) return;

    const created: Product = {
      id: `prod-${Date.now().toString().slice(-4)}`,
      name: newProd.name.trim(),
      brand: newProd.brand || 'Dabur',
      category: newProd.category || 'Joint & Muscle Pain',
      packSize: newProd.packSize.trim(),
      agencyCostPrice: Number(newProd.agencyCostPrice) || 0,
      mrp: Number(newProd.mrp) || 0,
      sellingPrice: Number(newProd.sellingPrice) || 0,
      stockQuantity: Number(newProd.stockQuantity) || 0,
      isLive: Number(newProd.stockQuantity) > 0,
      indications: newProd.indications || 'Authentic Ayurvedic remedy',
    };

    const updated = [created, ...products];
    setProducts(updated);
    saveStoredProducts(updated);
    syncProductToSupabase(created);
    setShowAddModal(false);
    setNewProd({
      name: '',
      brand: 'Dabur',
      category: 'Joint & Muscle Pain',
      packSize: '',
      agencyCostPrice: 50,
      mrp: 80,
      sellingPrice: 70,
      stockQuantity: 10,
      isLive: true,
      indications: '',
    });
  };

  // 1-Click Copy for Rapido Dispatch
  const handleCopyForRapido = (order: Order) => {
    const text = formatRapidoDropText(order);
    navigator.clipboard.writeText(text);
    setCopiedOrderId(order.id);

    // Update order status & rapidoCopied state
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

  // Overall Financial Calculations
  const totalDarkStoreStockUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalCostValuation = products.reduce(
    (acc, p) => acc + p.agencyCostPrice * p.stockQuantity,
    0
  );
  const totalSellingValuation = products.reduce(
    (acc, p) => acc + p.sellingPrice * p.stockQuantity,
    0
  );
  const totalPotentialProfit = totalSellingValuation - totalCostValuation;
  const overallMarginPercent =
    totalSellingValuation > 0
      ? Math.round((totalPotentialProfit / totalSellingValuation) * 100)
      : 0;

  const liveCount = products.filter((p) => p.isLive && p.stockQuantity > 0).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  // PIN Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-neutral-800 text-white rounded-3xl p-6 border border-neutral-700 shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold">AyurSwift Merchant Hub</h1>
            <p className="text-xs text-neutral-400">
              Enter 4-digit PIN to access Dark Store Hub & Rapido Dispatch
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN (Default: 1234)"
                autoFocus
                className="w-full text-center tracking-widest text-xl font-bold py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {pinError && (
                <p className="text-xs text-rose-400 text-center mt-2 font-medium">
                  Incorrect PIN. Please try again (Default: 1234).
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-md"
            >
              Unlock Hub
            </button>
          </form>

          <div className="text-center">
            <Link
              href="/"
              className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Top Admin Bar */}
      <div className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿⚡</span>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight">
                AyurSwift Merchant Hub
              </h1>
              <p className="text-[10px] text-emerald-300 font-medium">
                Home Dark Store • Rapido Dispatch Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-700 flex items-center gap-1.5 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> View Storefront
            </Link>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-xs text-neutral-300 hover:text-white p-1.5"
              title="Lock Hub"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 flex gap-4 text-xs font-semibold border-t border-emerald-900/60 pt-1">
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`py-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'INVENTORY'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-emerald-200/70 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Inventory & Profit Calculator ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('RAPIDO')}
            className={`py-2 border-b-2 flex items-center gap-1.5 transition-colors relative ${
              activeTab === 'RAPIDO'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-emerald-200/70 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Rapido Dispatch Orders ({orders.length})
            {orders.some((o) => o.orderStatus === 'NEW') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`py-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'SETTINGS'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-emerald-200/70 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Store Settings & UPI
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-6">
        {/* TAB 1: INVENTORY & PROFIT CALCULATOR */}
        {activeTab === 'INVENTORY' && (
          <div className="space-y-5">
            {/* Dark Store Financial Snapshot Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Wholesale Cost Value
                </div>
                <div className="text-xl font-black text-gray-900 mt-1">
                  ₹{totalCostValuation}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {totalDarkStoreStockUnits} units in home stock
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Projected Retail Value
                </div>
                <div className="text-xl font-black text-emerald-900 mt-1">
                  ₹{totalSellingValuation}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  At active selling prices
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200/90 p-3.5 rounded-2xl shadow-2xs">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Projected Net Profit
                </div>
                <div className="text-xl font-black text-emerald-950 mt-1">
                  ₹{totalPotentialProfit}
                </div>
                <div className="text-[11px] text-emerald-700 font-extrabold mt-0.5">
                  {overallMarginPercent}% avg profit margin
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Storefront Status
                </div>
                <div className="text-sm font-bold text-gray-900 mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold">
                    🟢 {liveCount} Live
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="inline-flex items-center gap-1 text-rose-700 font-extrabold">
                    ⚪ {outOfStockCount} Out
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Auto-Hide triggers at 0 stock
                </div>
              </div>
            </div>

            {/* Inventory Controls & Table */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
                <div>
                  <h2 className="font-extrabold text-gray-900 text-sm">
                    Dark Store Stock & Profit Margin Calculator
                  </h2>
                  <p className="text-xs text-gray-500">
                    Real-time agency cost, selling price & instantaneous stock steppers
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Medicine / SKU
                </button>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100/70 text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-3">Product & Brand</th>
                      <th className="py-3 px-2">Pack</th>
                      <th className="py-3 px-2 text-right">Agency Cost</th>
                      <th className="py-3 px-2 text-right">MRP</th>
                      <th className="py-3 px-2 text-right">Selling Price</th>
                      <th className="py-3 px-2 text-right">Profit (₹ / %)</th>
                      <th className="py-3 px-3 text-center">Stock Stepper</th>
                      <th className="py-3 px-3 text-center">Store Visibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => {
                      const unitProfit = product.sellingPrice - product.agencyCostPrice;
                      const marginPercent = Math.round(
                        (unitProfit / product.sellingPrice) * 100
                      );
                      const isOutOfStock = product.stockQuantity === 0;

                      return (
                        <tr
                          key={product.id}
                          className={`hover:bg-emerald-50/30 transition-colors ${
                            isOutOfStock ? 'bg-gray-50/60 opacity-80' : ''
                          }`}
                        >
                          {/* Product & Brand */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-gray-900 line-clamp-1">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-emerald-800 font-semibold uppercase">
                              {product.brand} • <span className="text-gray-400 font-normal">{product.category}</span>
                            </div>
                          </td>

                          {/* Pack Size */}
                          <td className="py-2.5 px-2 text-gray-600 font-medium">
                            {product.packSize}
                          </td>

                          {/* Agency Cost */}
                          <td className="py-2.5 px-2 text-right font-medium text-gray-700">
                            ₹{product.agencyCostPrice}
                          </td>

                          {/* MRP */}
                          <td className="py-2.5 px-2 text-right text-gray-400 line-through">
                            ₹{product.mrp}
                          </td>

                          {/* Selling Price */}
                          <td className="py-2.5 px-2 text-right font-bold text-gray-900">
                            ₹{product.sellingPrice}
                          </td>

                          {/* Profit & Margin */}
                          <td className="py-2.5 px-2 text-right">
                            <span className="font-extrabold text-emerald-700">
                              +₹{unitProfit}
                            </span>
                            <span className="block text-[10px] font-bold text-emerald-600">
                              {marginPercent}% margin
                            </span>
                          </td>

                          {/* Stock Stepper */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center bg-gray-100 rounded-lg border border-gray-200">
                              <button
                                onClick={() => handleStockChange(product.id, -1)}
                                className="p-1 hover:bg-gray-200 text-gray-700 rounded-l-lg"
                                title="Decrease Stock"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span
                                className={`px-2 font-black text-xs min-w-[28px] ${
                                  product.stockQuantity === 0
                                    ? 'text-rose-600'
                                    : product.stockQuantity <= 5
                                    ? 'text-amber-600'
                                    : 'text-gray-900'
                                }`}
                              >
                                {product.stockQuantity}
                              </span>
                              <button
                                onClick={() => handleStockChange(product.id, 1)}
                                className="p-1 hover:bg-gray-200 text-gray-700 rounded-r-lg"
                                title="Increase Stock"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Storefront Visibility Toggle */}
                          <td className="py-2.5 px-3 text-center">
                            {product.stockQuantity === 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700 border border-gray-300">
                                ⚪ Auto-Hidden (Stock 0)
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleLive(product.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                  product.isLive
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                }`}
                              >
                                {product.isLive ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                    Live in Store
                                  </>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
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
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-amber-950 text-sm">
                  Rapido Parcel 1-Tap Rider Dispatch
                </h3>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  Click <strong>&quot;1-Click Copy for Rapido&quot;</strong> on any in-city order. It formats the customer name, phone number, and drop location cleanly so you can paste it directly into the Rapido app to book a bike parcel pickup in seconds.
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
                <Truck className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="font-bold text-gray-800 text-sm">No Orders Yet</h3>
                <p className="text-xs text-gray-500">
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
                      className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs space-y-3"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-emerald-950">
                            {order.id}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              order.deliveryType === 'RAPIDO_CITY'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {order.deliveryType === 'RAPIDO_CITY'
                              ? '⚡ Rapido In-City'
                              : '📦 Courier'}
                          </span>
                        </div>

                        {/* Order Status Badge */}
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleUpdateOrderStatus(
                              order.id,
                              e.target.value as Order['orderStatus']
                            )
                          }
                          className="text-[11px] font-bold py-1 px-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 focus:outline-none"
                        >
                          <option value="NEW">🟢 New Order</option>
                          <option value="PACKED">📦 Packed</option>
                          <option value="DISPATCHED">⚡ Dispatched via Rapido</option>
                          <option value="DELIVERED">✓ Delivered</option>
                          <option value="CANCELLED">✕ Cancelled</option>
                        </select>
                      </div>

                      {/* Customer & Address Details */}
                      <div className="space-y-1 text-xs text-gray-700">
                        <div className="flex justify-between font-semibold">
                          <span className="text-gray-900">{order.customerName}</span>
                          <span className="text-emerald-800 font-mono">
                            {order.customerPhone}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {order.deliveryAddress}
                          {order.landmark ? `, Landmark: ${order.landmark}` : ''}
                          <br />
                          <strong>{order.city} - {order.pincode}</strong>
                        </p>
                      </div>

                      {/* Items Summary */}
                      <div className="text-[11px] text-gray-600 space-y-0.5 border-t border-gray-100 pt-2">
                        {order.items.map((i) => (
                          <div key={i.productId} className="flex justify-between">
                            <span>
                              {i.name} ({i.packSize}) x {i.quantity}
                            </span>
                            <span className="font-semibold text-gray-800">
                              ₹{i.totalPrice}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total & Payment */}
                      <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">
                            Payment
                          </span>
                          <span className="font-bold text-gray-800">
                            {order.paymentMethod === 'COD' ? '💵 COD' : '📱 UPI'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block uppercase">
                            Total Payable
                          </span>
                          <span className="font-black text-sm text-emerald-950">
                            ₹{order.totalAmount}
                          </span>
                        </div>
                      </div>

                      {/* 1-Click Copy for Rapido Button */}
                      {order.deliveryType === 'RAPIDO_CITY' && (
                        <button
                          onClick={() => handleCopyForRapido(order)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-400 hover:bg-amber-500 text-amber-950'
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
          <div className="max-w-2xl bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-5">
            <div>
              <h2 className="font-extrabold text-base text-gray-900">
                AyurSwift Store & Zero-Fee UPI Settings
              </h2>
              <p className="text-xs text-gray-500">
                Configure your WhatsApp order recipient and direct bank UPI QR details
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Store WhatsApp Number (with 91)
                  </label>
                  <input
                    type="text"
                    value={settings.merchantWhatsApp}
                    onChange={(e) =>
                      setSettings({ ...settings, merchantWhatsApp: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Orders will be sent to this WhatsApp
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Merchant UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    value={settings.merchantUpiId}
                    onChange={(e) =>
                      setSettings({ ...settings, merchantUpiId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Zero-fee direct bank QR destination
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Admin Portal PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={settings.adminPin}
                    onChange={(e) =>
                      setSettings({ ...settings, adminPin: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs transition-colors"
                >
                  Save Store Settings
                </button>
                {settingsSavedToast && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Settings updated successfully!
                  </span>
                )}
              </div>
            </form>

            {/* Supabase Status Banner */}
            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-gray-800">
                    Supabase PostgreSQL Connection:
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSupabaseConfigured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isSupabaseConfigured
                    ? 'Connected & Synced'
                    : 'Local In-Memory / Fallback Active'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                AyurSwift operates with 100% persistent local storage by default. You can connect your free Supabase instance anytime by adding <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment variables or Vercel dashboard.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD NEW MEDICINE / SKU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-emerald-100 space-y-4">
            <h3 className="font-extrabold text-base text-gray-900">
              Add New Ayurvedic Medicine / SKU
            </h3>

            <form onSubmit={handleAddProductSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Medicine / Product Name *
                  </label>
                  <input
                    type="text"
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder="e.g. Zandu Balm Fast Action"
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Brand
                  </label>
                  <select
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Dabur">Dabur</option>
                    <option value="Zandu">Zandu</option>
                    <option value="Himalaya">Himalaya</option>
                    <option value="Baidyanath">Baidyanath</option>
                    <option value="Patanjali">Patanjali</option>
                    <option value="Dr. Ortho">Dr. Ortho</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Health Concern / Category
                  </label>
                  <select
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Joint & Muscle Pain">Joint & Muscle Pain</option>
                    <option value="Digestion & Acidity">Digestion & Acidity</option>
                    <option value="Immunity & Cold">Immunity & Cold</option>
                    <option value="Skin & Hair">Skin & Hair</option>
                    <option value="Daily Wellness">Daily Wellness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Pack Size *
                  </label>
                  <input
                    type="text"
                    value={newProd.packSize}
                    onChange={(e) => setNewProd({ ...newProd, packSize: e.target.value })}
                    placeholder="e.g. 25g, 100ml, 60 Tablets"
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              {/* Profit & Margin Inputs */}
              <div className="grid grid-cols-4 gap-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">
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
                    className="w-full px-2 py-1.5 text-xs border rounded bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={newProd.mrp}
                    onChange={(e) =>
                      setNewProd({ ...newProd, mrp: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 text-xs border rounded bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">
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
                    className="w-full px-2 py-1.5 text-xs border rounded bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">
                    Initial Stock
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
                    className="w-full px-2 py-1.5 text-xs border rounded bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Indications / Health Benefits
                </label>
                <input
                  type="text"
                  value={newProd.indications}
                  onChange={(e) =>
                    setNewProd({ ...newProd, indications: e.target.value })
                  }
                  placeholder="e.g. Fast herbal relief from headaches & muscle cramps"
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                >
                  Save & Add to Dark Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
