'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Copy,
  Search,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X,
  Upload,
  Image as ImageIcon,
  Edit2,
  Trash2,
  RotateCcw,
  QrCode,
  Star,
  Images,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { Product, Order, MerchantSettings } from '@/types';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredOrders,
  saveStoredOrders,
  getStoredSettings,
  saveStoredSettings,
  resetToInitialProducts,
  formatRapidoDropText,
  syncProductToSupabase,
} from '@/lib/store';

const AUTHORIZED_GMAIL = 'rushirajdabhi16@gmail.com';
const DEFAULT_PIN = '1602';

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'RAPIDO' | 'SETTINGS'>('INVENTORY');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<MerchantSettings>(getStoredSettings());

  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [resetToast, setResetToast] = useState(false);

  // New / Edit Product Form state
  const defaultNewProd: Partial<Product> = {
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
    dosage: 'Apply or take as directed on pack',
    composition: 'Ayurvedic Botanical Extracts',
    imageUrl: '',
  };

  const [newProd, setNewProd] = useState<Partial<Product>>(defaultNewProd);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());
    const stored = getStoredSettings();
    setSettings(stored);

    // Fetch orders from server store to pick up orders placed across devices
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          const currentLocal = getStoredOrders();
          const map = new Map<string, Order>();
          currentLocal.forEach((o) => map.set(o.id, o));
          data.orders.forEach((o: Order) => map.set(o.id, o));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(merged);
          saveStoredOrders(merged);
        }
      })
      .catch(() => {});

    // Restore active browser session
    try {
      const sessionAuth = sessionStorage.getItem('ayurswift_admin_session');
      if (sessionAuth === 'authenticated') {
        setIsAuthenticated(true);
      }
    } catch {}
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Dual-Factor Authentication: Authorized Gmail AND Security PIN
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPin = pinInput.trim();
    const targetPin = settings.adminPin || DEFAULT_PIN;
    const targetEmail = (settings.adminEmail || AUTHORIZED_GMAIL).toLowerCase();

    const isEmailValid = cleanEmail === targetEmail;
    const isPinValid = cleanPin === targetPin;

    if (isEmailValid && isPinValid) {
      setIsAuthenticated(true);
      setAuthError(null);
      setFailedAttempts(0);
      try {
        sessionStorage.setItem('ayurswift_admin_session', 'authenticated');
        sessionStorage.setItem('ayurswift_admin_email', cleanEmail);
      } catch {}
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= 5) {
        setLockoutSeconds(30);
        setAuthError('Too many failed attempts. Security lockout active for 30 seconds.');
      } else {
        setAuthError('Invalid email address or security PIN. Access denied.');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmailInput('');
    setPinInput('');
    setAuthError(null);
    try {
      sessionStorage.removeItem('ayurswift_admin_session');
      sessionStorage.removeItem('ayurswift_admin_email');
    } catch {}
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

  // Open modal for Adding a new product
  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setNewProd(defaultNewProd);
    setUploadedImages([]);
    setImageUrlInput('');
    setShowAddModal(true);
  };

  // Open modal for Editing an existing product
  const handleOpenEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setNewProd({ ...product });
    const existing = product.images && product.images.length > 0
      ? [...product.images]
      : (product.imageUrl ? [product.imageUrl] : []);
    setUploadedImages(existing);
    setImageUrlInput('');
    setShowAddModal(true);
  };

  // Delete product
  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to remove this product from the dark store catalog?')) {
      const updated = products.filter((p) => p.id !== productId);
      setProducts(updated);
      saveStoredProducts(updated);
    }
  };

  // Handle multiple image uploads from file picker
  const handleMultipleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is larger than 5MB. Please choose a smaller image.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setUploadedImages((prev) => {
          if (prev.includes(result)) return prev;
          return [...prev, result];
        });
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  // Append image URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const url = imageUrlInput.trim();
    setUploadedImages((prev) => {
      if (prev.includes(url)) return prev;
      return [...prev, url];
    });
    setImageUrlInput('');
  };

  // Set selected image as cover (#1)
  const handleSetPrimaryImage = (index: number) => {
    setUploadedImages((prev) => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
  };

  // Remove individual image
  const handleRemoveImageAtIndex = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Save new or edited product
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.packSize) {
      alert('Please fill in product name and pack size.');
      return;
    }

    const finalImages = uploadedImages.filter(Boolean);
    const primaryImageUrl = finalImages[0] || newProd.imageUrl || undefined;

    if (editingProductId) {
      // Update existing
      const updated = products.map((p) => {
        if (p.id === editingProductId) {
          const updatedItem: Product = {
            ...p,
            name: newProd.name!,
            brand: newProd.brand || p.brand,
            category: newProd.category || p.category,
            manufacturer: newProd.manufacturer || p.manufacturer,
            form: (newProd.form as Product['form']) || p.form,
            packSize: newProd.packSize!,
            agencyCostPrice: Number(newProd.agencyCostPrice) || 0,
            mrp: Number(newProd.mrp) || 0,
            sellingPrice: Number(newProd.sellingPrice) || 0,
            stockQuantity: Number(newProd.stockQuantity) || 0,
            isLive: (Number(newProd.stockQuantity) || 0) > 0 ? (newProd.isLive ?? true) : false,
            indications: newProd.indications || p.indications,
            dosage: newProd.dosage || p.dosage,
            composition: newProd.composition || p.composition,
            imageUrl: primaryImageUrl,
            images: finalImages.length > 0 ? finalImages : undefined,
          };
          syncProductToSupabase(updatedItem);
          return updatedItem;
        }
        return p;
      });

      setProducts(updated);
      saveStoredProducts(updated);
    } else {
      // Create new
      const created: Product = {
        id: `sku-custom-${Date.now()}`,
        name: newProd.name!,
        brand: newProd.brand || 'Dabur',
        category: newProd.category || 'Joint & Muscle Pain',
        manufacturer: newProd.manufacturer || 'Ayurvedic Pharmacy',
        form: (newProd.form as Product['form']) || 'Balm',
        packSize: newProd.packSize!,
        agencyCostPrice: Number(newProd.agencyCostPrice) || 0,
        mrp: Number(newProd.mrp) || 0,
        sellingPrice: Number(newProd.sellingPrice) || 0,
        stockQuantity: Number(newProd.stockQuantity) || 0,
        isLive: (Number(newProd.stockQuantity) || 0) > 0,
        rating: 4.8,
        reviewCount: 1,
        indications: newProd.indications || 'Targeted Ayurvedic health remedy',
        dosage: newProd.dosage || 'As directed on pack',
        composition: newProd.composition || 'Herbal Ayurvedic Formulation',
        safetyAdvice: 'Store in a cool dry place away from sunlight.',
        imageUrl: primaryImageUrl,
        images: finalImages.length > 0 ? finalImages : undefined,
      };

      const updated = [created, ...products];
      setProducts(updated);
      saveStoredProducts(updated);
      syncProductToSupabase(created);
    }

    setShowAddModal(false);
    setEditingProductId(null);
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

    // Sync status change to server API for buyer live tracking
    fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, orderStatus: 'DISPATCHED' }),
    }).catch(() => {});

    setTimeout(() => {
      setCopiedOrderId(null);
    }, 2500);
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o));
    setOrders(updated);
    saveStoredOrders(updated);

    // Sync status change to server API for buyer live tracking
    fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, orderStatus: status }),
    }).catch(() => {});
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSettings(settings);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2000);
  };

  const handleResetCatalog = () => {
    if (confirm('Reset catalog to the verified 20 authentic Ayurvedic medicines with real stock? Custom modifications will be replaced.')) {
      const fresh = resetToInitialProducts();
      setProducts(fresh);
      setResetToast(true);
      setTimeout(() => setResetToast(false), 2500);
    }
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

  // Financial Calculations
  const totalStockUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalCostValuation = products.reduce((acc, p) => acc + p.agencyCostPrice * p.stockQuantity, 0);
  const totalSellingValuation = products.reduce((acc, p) => acc + p.sellingPrice * p.stockQuantity, 0);
  const totalPotentialProfit = totalSellingValuation - totalCostValuation;
  const overallMarginPercent =
    totalSellingValuation > 0 ? Math.round((totalPotentialProfit / totalSellingValuation) * 100) : 0;

  const liveCount = products.filter((p) => p.isLive && p.stockQuantity > 0).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  // Dual-Factor Security Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8f8f3] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white text-[#1c2e24] rounded-3xl p-6 sm:p-8 border border-[#d6ddce] shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-[#e9efdf] text-[#1d5a3e] rounded-2xl flex items-center justify-center mx-auto border border-[#d6ddce] shadow-2xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1d5a3e]/10 text-[#1d5a3e] text-[10.5px] font-bold border border-[#1d5a3e]/20">
              <Lock className="w-3 h-3" />
              <span>Admin Security Portal</span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#143d29]">
              AyurSwift Merchant Hub
            </h1>
            <p className="text-xs text-[#526359] max-w-xs mx-auto leading-relaxed">
              Two-factor verification required: Authorized Gmail account and 4-digit security PIN.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* 1. Gmail Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#143d29]">
                Authorized Gmail Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#526359]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter admin Gmail address"
                  autoFocus
                  required
                  disabled={lockoutSeconds > 0}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-xs text-[#143d29] focus:outline-none focus:ring-2 focus:ring-[#1d5a3e] font-medium"
                />
              </div>
              <p className="text-[10px] text-[#526359]">
                Enter the authorized administrator Gmail account.
              </p>
            </div>

            {/* 2. Security PIN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#143d29]">
                Security PIN *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#526359]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  required
                  disabled={lockoutSeconds > 0}
                  className="w-full pl-9 pr-10 py-2.5 bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-sm font-bold tracking-widest text-[#143d29] focus:outline-none focus:ring-2 focus:ring-[#1d5a3e]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#526359] hover:text-[#143d29] cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[#526359]">
                Both authorized Gmail and private 4-digit PIN are required.
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={lockoutSeconds > 0}
              className={`w-full font-bold py-3 rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 ${
                lockoutSeconds > 0
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-[#1d5a3e] hover:bg-[#143d29] text-white active:scale-98 cursor-pointer'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{lockoutSeconds > 0 ? `Locked for ${lockoutSeconds}s` : 'Verify & Unlock Dashboard'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-[#526359] hover:text-[#1d5a3e] inline-flex items-center gap-1 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f3] text-[#1c2e24] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-[#d6ddce] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-xl hover:bg-[#e9efdf] text-[#526359] hover:text-[#143d29] transition-colors"
              title="Return to Storefront"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-lg text-[#143d29]">AyurSwift</span>
                <span className="text-[10px] font-bold bg-[#e9efdf] text-[#1d5a3e] px-2 py-0.5 rounded-full border border-[#d6ddce]">
                  Dark Store Hub
                </span>
              </div>
              <p className="text-[10px] text-[#526359]">
                Bhavnagar Home Fulfillment • Rapido Bike Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Authenticated Admin Account Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f8f8f3] border border-[#d6ddce] text-xs text-[#143d29]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] font-medium">Admin: r•••16@gmail.com</span>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="bg-[#1d5a3e] hover:bg-[#143d29] text-white text-xs font-bold py-2 px-3 sm:px-4 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>

            {/* Secure Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 border border-[#d6ddce] transition-colors cursor-pointer"
              title="Secure Logout"
              aria-label="Secure Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 flex border-t border-[#d6ddce] text-xs font-bold">
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'INVENTORY'
                ? 'border-[#1d5a3e] text-[#1d5a3e]'
                : 'border-transparent text-[#526359] hover:text-[#143d29]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('RAPIDO')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'RAPIDO'
                ? 'border-[#1d5a3e] text-[#1d5a3e]'
                : 'border-transparent text-[#526359] hover:text-[#143d29]'
            }`}
          >
            <Zap className="w-4 h-4 fill-[#c86326] text-[#c86326]" />
            <span>Rapido Dispatch ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'SETTINGS'
                ? 'border-[#1d5a3e] text-[#1d5a3e]'
                : 'border-transparent text-[#526359] hover:text-[#143d29]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store Configuration</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-5 flex-1 w-full space-y-5">
        {/* TAB 1: INVENTORY & STOCK MANAGEMENT */}
        {activeTab === 'INVENTORY' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-[#d6ddce] shadow-2xs">
                <div className="text-[11px] font-bold text-[#526359] uppercase tracking-wider">
                  Total SKUs in Catalog
                </div>
                <div className="text-2xl font-serif font-black text-[#143d29] mt-1">
                  {products.length}
                </div>
                <div className="text-[10px] text-[#1d5a3e] mt-1 font-semibold">
                  {liveCount} Live in Store • {outOfStockCount} Out of Stock
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#d6ddce] shadow-2xs">
                <div className="text-[11px] font-bold text-[#526359] uppercase tracking-wider">
                  Total Units in Stock
                </div>
                <div className="text-2xl font-serif font-black text-[#143d29] mt-1">
                  {totalStockUnits}
                </div>
                <div className="text-[10px] text-[#526359] mt-1 font-medium">
                  Verified Physical Units on Shelf
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#d6ddce] shadow-2xs">
                <div className="text-[11px] font-bold text-[#526359] uppercase tracking-wider">
                  Wholesale Cost Value
                </div>
                <div className="text-2xl font-serif font-black text-[#143d29] mt-1">
                  ₹{totalCostValuation}
                </div>
                <div className="text-[10px] text-[#526359] mt-1 font-medium">
                  At Agency Invoiced GST Price
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#d6ddce] shadow-2xs">
                <div className="text-[11px] font-bold text-[#526359] uppercase tracking-wider">
                  Gross Realized Margin
                </div>
                <div className="text-2xl font-serif font-black text-[#1d5a3e] mt-1">
                  {overallMarginPercent}%
                </div>
                <div className="text-[10px] text-[#1d5a3e] mt-1 font-semibold">
                  +₹{totalPotentialProfit} Estimated Profit
                </div>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="bg-white p-3 rounded-2xl border border-[#d6ddce] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#718277] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search medicines, brand, category..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-[#143d29] placeholder:text-[#718277] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-[#143d29] font-medium focus:outline-none"
                >
                  <option value="ALL">All Categories ({products.length})</option>
                  <option value="Joint & Muscle Pain">Joint & Muscle Pain</option>
                  <option value="Digestion & Acidity">Digestion & Acidity</option>
                  <option value="Immunity & Cold">Immunity & Cold</option>
                  <option value="Skin & Hair">Skin & Hair</option>
                  <option value="Daily Wellness">Daily Wellness</option>
                </select>

                <button
                  onClick={handleResetCatalog}
                  className="px-3 py-1.5 text-xs font-semibold text-[#1d5a3e] hover:bg-[#e9efdf] rounded-xl border border-[#d6ddce] flex items-center gap-1.5 transition-colors"
                  title="Reset to 20 Verified Real Stock SKUs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Real Catalog</span>
                </button>
              </div>
            </div>

            {resetToast && (
              <div className="p-3 bg-[#e9efdf] border border-[#d6ddce] text-[#143d29] rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-[#1d5a3e]" />
                <span>Catalog successfully reset to verified 20 real Ayurvedic products with initial stock!</span>
              </div>
            )}

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border border-[#d6ddce] shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#e9efdf] border-b border-[#d6ddce] text-[#143d29] font-serif font-bold uppercase tracking-wider text-[10.5px]">
                    <tr>
                      <th className="py-3 px-3">Medicine & Brand</th>
                      <th className="py-3 px-2">Pack</th>
                      <th className="py-3 px-2 text-right">Cost</th>
                      <th className="py-3 px-2 text-right">MRP</th>
                      <th className="py-3 px-2 text-right">Sell</th>
                      <th className="py-3 px-2 text-right">Margin</th>
                      <th className="py-3 px-3 text-center">Stock</th>
                      <th className="py-3 px-3 text-center">Visibility</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9efdf]">
                    {filteredProducts.map((product) => {
                      const unitProfit = product.sellingPrice - product.agencyCostPrice;
                      const marginPercent =
                        product.sellingPrice > 0
                          ? Math.round((unitProfit / product.sellingPrice) * 100)
                          : 0;
                      const isOutOfStock = product.stockQuantity === 0;

                      return (
                        <tr
                          key={product.id}
                          className={`hover:bg-[#f8f8f3] transition-colors ${
                            isOutOfStock ? 'bg-amber-50/30 opacity-70' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="relative shrink-0">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-8 h-8 object-contain rounded border border-[#d6ddce] bg-[#f8f8f3] shrink-0 p-0.5"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded border border-[#d6ddce] bg-[#e9efdf] flex items-center justify-center text-[10px] text-[#1d5a3e] font-bold shrink-0">
                                    🌿
                                  </div>
                                )}
                                {product.images && product.images.length > 1 && (
                                  <span className="absolute -top-1 -right-1 bg-[#1d5a3e] text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-2xs" title={`${product.images.length} photos attached`}>
                                    {product.images.length}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-[#143d29] line-clamp-1">
                                  {product.name}
                                </div>
                                <div className="text-[10px] text-[#1d5a3e] font-semibold uppercase">
                                  {product.brand} • <span className="text-[#526359] font-normal">{product.category}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-2 text-[#526359] font-medium whitespace-nowrap">
                            {product.packSize}
                          </td>

                          <td className="py-2.5 px-2 text-right font-medium text-[#526359]">
                            ₹{product.agencyCostPrice}
                          </td>

                          <td className="py-2.5 px-2 text-right text-gray-400 line-through">
                            ₹{product.mrp}
                          </td>

                          <td className="py-2.5 px-2 text-right font-bold text-[#143d29]">
                            ₹{product.sellingPrice}
                          </td>

                          <td className="py-2.5 px-2 text-right">
                            <span className="font-bold text-[#1d5a3e]">
                              +₹{unitProfit}
                            </span>
                            <span className="block text-[10px] font-semibold text-[#1d5a3e]">
                              {marginPercent}%
                            </span>
                          </td>

                          {/* Quick Stepper */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center bg-[#f8f8f3] rounded-lg border border-[#d6ddce]">
                              <button
                                onClick={() => handleStockChange(product.id, -1)}
                                className="p-1 hover:bg-[#e9efdf] text-[#143d29] transition-colors"
                                title="Decrease Stock"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span
                                className={`px-2 font-bold text-xs min-w-[28px] ${
                                  product.stockQuantity === 0
                                    ? 'text-rose-600'
                                    : 'text-[#143d29]'
                                }`}
                              >
                                {product.stockQuantity}
                              </span>
                              <button
                                onClick={() => handleStockChange(product.id, 1)}
                                className="p-1 hover:bg-[#e9efdf] text-[#143d29] transition-colors"
                                title="Increase Stock"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Visibility */}
                          <td className="py-2.5 px-3 text-center">
                            {product.stockQuantity === 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">
                                ⚪ Hidden (Stock 0)
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleLive(product.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                  product.isLive
                                    ? 'bg-[#e9efdf] text-[#1d5a3e] hover:bg-[#dfe7d2]'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {product.isLive ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1d5a3e]" />
                                    Live
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

                          {/* Edit / Delete Actions */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(product)}
                                className="p-1.5 text-[#526359] hover:text-[#1d5a3e] hover:bg-[#e9efdf] rounded-lg transition-colors"
                                title="Edit Medicine Details & Image"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete SKU"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
            <div className="bg-[#e9efdf] border border-[#d6ddce] rounded-2xl p-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-[#c86326] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif font-bold text-[#143d29] text-sm">
                  Rapido Parcel 1-Tap Rider Dispatch
                </h3>
                <p className="text-xs text-[#526359] leading-relaxed mt-0.5">
                  Click <strong>&quot;1-Click Copy for Rapido&quot;</strong> on any in-city order. It formats the customer name, phone number, drop address, and COD/Prepaid info cleanly so you can paste it directly into the Rapido app to book a bike parcel pickup in seconds.
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#d6ddce] p-12 text-center space-y-2">
                <Truck className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="font-serif font-bold text-[#143d29] text-sm">No Orders Yet</h3>
                <p className="text-xs text-[#526359]">
                  When customers place orders from the storefront, they appear here instantly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => {
                  const isCopied = copiedOrderId === order.id;
                  const isRapido = order.deliveryType === 'RAPIDO_CITY';

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-[#d6ddce] p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#e9efdf] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs bg-[#e9efdf] text-[#1d5a3e] px-2 py-0.5 rounded-md">
                            {order.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isRapido
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {isRapido ? '⚡ Rapido 30-45m' : '📦 Courier'}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-gray-700">
                        <div>
                          <strong>{order.customerName}</strong> ({order.customerPhone})
                        </div>
                        <div className="text-gray-500 text-[11px] leading-tight">
                          {order.deliveryAddress}
                          {order.landmark ? `, Near ${order.landmark}` : ''}, {order.city} - {order.pincode}
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#f8f8f3] rounded-xl text-xs space-y-1 border border-[#d6ddce]">
                        <div className="text-[10.5px] font-bold text-[#526359] uppercase">Items to Pack:</div>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-gray-800">
                            <span>
                              {item.quantity}x {item.name} ({item.packSize})
                            </span>
                            <span className="font-bold">₹{item.totalPrice}</span>
                          </div>
                        ))}
                        <div className="border-t border-[#d6ddce] pt-1 flex justify-between font-bold text-gray-900 text-xs">
                          <span>Total to Collect:</span>
                          <span className="text-[#1d5a3e]">
                            ₹{order.totalAmount} ({order.paymentMethod})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => handleCopyForRapido(order)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                            isCopied
                              ? 'bg-emerald-700 text-white'
                              : 'bg-[#1d5a3e] hover:bg-[#143d29] text-white'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied for Rapido!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>1-Click Copy for Rapido</span>
                            </>
                          )}
                        </button>

                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleUpdateOrderStatus(order.id, e.target.value as Order['orderStatus'])
                          }
                          className="text-xs border border-[#d6ddce] rounded-xl px-2 py-2 bg-white text-gray-800 font-semibold focus:outline-none"
                        >
                          <option value="NEW">New</option>
                          <option value="PACKED">Packed</option>
                          <option value="DISPATCHED">Dispatched</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === 'SETTINGS' && (
          <div className="bg-white rounded-2xl border border-[#d6ddce] p-5 shadow-2xs max-w-xl mx-auto space-y-4">
            <div className="border-b border-[#e9efdf] pb-3">
              <h2 className="font-serif font-bold text-base text-[#143d29]">Storefront & UPI Settings</h2>
              <p className="text-xs text-[#526359] mt-0.5">
                Update payment destination and delivery charges
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#526359] mb-1">
                  Merchant WhatsApp Number (with country code, no +)
                </label>
                <input
                  type="text"
                  value={settings.merchantWhatsApp}
                  onChange={(e) =>
                    setSettings({ ...settings, merchantWhatsApp: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#526359] mb-1">
                    Store UPI ID
                  </label>
                  <input
                    type="text"
                    value={settings.merchantUpiId}
                    onChange={(e) =>
                      setSettings({ ...settings, merchantUpiId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526359] mb-1">
                    UPI Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={settings.merchantUpiName}
                    onChange={(e) =>
                      setSettings({ ...settings, merchantUpiName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Live UPI QR Code Card according to UPI ID */}
              <div className="bg-[#f8f8f3] border border-[#d6ddce] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#1d5a3e] text-white flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#143d29]">
                        Live UPI QR Code ({settings.merchantUpiId})
                      </h4>
                      <p className="text-[10.5px] text-[#526359]">
                        Auto-generated for Bharat QR &amp; NPCI UPI apps
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                    Active
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-[#d6ddce]">
                  <div className="bg-white p-2 rounded-xl border border-[#d6ddce] shadow-2xs shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(
                        `upi://pay?pa=${settings.merchantUpiId.trim()}&pn=${encodeURIComponent(
                          settings.merchantUpiName.trim() || 'AyurSwift'
                        )}&cu=INR&tn=AyurSwift%20Payment`
                      )}`}
                      alt={`UPI QR for ${settings.merchantUpiId}`}
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs text-center sm:text-left">
                    <div className="text-[11px] text-[#526359]">
                      Payee VPA: <strong className="font-mono text-[#1d5a3e] bg-[#f8f8f3] px-1.5 py-0.5 rounded border border-[#d6ddce]">{settings.merchantUpiId}</strong>
                    </div>
                    <div className="text-[11px] text-[#526359]">
                      Account Name: <strong className="text-gray-900">{settings.merchantUpiName}</strong>
                    </div>
                    <div className="text-[11px] text-[#526359]">
                      Connected WhatsApp: <strong className="text-gray-900">+{settings.merchantWhatsApp}</strong>
                    </div>
                    <p className="text-[10px] text-gray-400 pt-0.5">
                      Customers scan this exact QR with Google Pay, PhonePe, Paytm, or FamPay. Payments credit with zero fees.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#526359] mb-1">
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
                    className="w-full px-3 py-2 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526359] mb-1">
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
                    className="w-full px-3 py-2 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#526359] mb-1">
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
                    className="w-full px-3 py-2 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526359] mb-1">
                    Admin Security PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={settings.adminPin}
                    onChange={(e) =>
                      setSettings({ ...settings, adminPin: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e] font-mono font-bold tracking-wider"
                    required
                  />
                </div>
              </div>

              {/* Authorized Admin Notice Card */}
              <div className="bg-[#e9efdf] border border-[#d6ddce] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1d5a3e] text-white flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#143d29]">
                      Authorized Administrator Account
                    </div>
                    <div className="text-[11px] text-[#526359] font-mono">
                      r••••••••••16@gmail.com
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-[#1d5a3e] text-white px-2 py-0.5 rounded-full shadow-2xs">
                  Dual-Factor Protected
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-[#1d5a3e] hover:bg-[#143d29] text-white font-bold text-xs py-2 px-4 rounded-xl shadow-2xs transition-colors"
                >
                  Save Store Settings
                </button>
                {settingsSavedToast && (
                  <span className="text-xs font-bold text-[#1d5a3e] flex items-center gap-1">
                    <Check className="w-4 h-4" /> Settings updated!
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ADD / EDIT SKU MODAL WITH IMAGE UPLOAD */}
      {showAddModal && (
        <div className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#f8f8f3] rounded-3xl shadow-2xl border border-[#d6ddce] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#d6ddce] flex items-center justify-between bg-[#e9efdf] shrink-0">
              <h3 className="font-serif font-bold text-base text-[#143d29]">
                {editingProductId ? 'Edit Medicine SKU' : 'Add New Ayurvedic Medicine SKU'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors shadow-2xs border border-[#d6ddce]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scrollable */}
            <form onSubmit={handleSaveProductSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* Product Packshot Images Upload Section (Multiple Images Supported) */}
              <div className="space-y-2.5 bg-white rounded-2xl border border-[#d6ddce] p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-[#143d29]">
                      Product Packshot Images ({uploadedImages.length} attached)
                    </label>
                    <p className="text-[10.5px] text-[#526359]">
                      Upload multiple angles (front box, back label, ingredients). 1st photo is cover.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#1d5a3e] hover:bg-[#143d29] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Images</span>
                  </button>
                </div>

                {/* Multiple Images Gallery / Thumbnail Grid */}
                {uploadedImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {uploadedImages.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className="relative group bg-[#f8f8f3] rounded-xl border border-[#d6ddce] p-1.5 flex flex-col items-center justify-center aspect-square overflow-hidden"
                      >
                        <img
                          src={imgSrc}
                          alt={`Packshot angle ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                        {/* Cover / Star Badge */}
                        {idx === 0 ? (
                          <span className="absolute top-1 left-1 bg-[#1d5a3e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            ★ Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 bg-white/95 hover:bg-white text-[#143d29] text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs border border-[#d6ddce] transition-opacity cursor-pointer"
                            title="Set as Cover Image"
                          >
                            Set Cover
                          </button>
                        )}
                        {/* Remove Image Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImageAtIndex(idx)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-xs transition-opacity cursor-pointer"
                          title="Remove this photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/50 text-white px-1 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                    {/* Add more tile */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#d6ddce] hover:border-[#1d5a3e] bg-[#f8f8f3] rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-colors aspect-square text-center group"
                    >
                      <Plus className="w-5 h-5 text-[#526359] group-hover:text-[#1d5a3e]" />
                      <span className="text-[10px] font-bold text-[#526359] group-hover:text-[#1d5a3e] mt-0.5">
                        Add More
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#d6ddce] hover:border-[#1d5a3e] bg-[#f8f8f3] rounded-2xl p-4 text-center cursor-pointer transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#e9efdf] text-[#1d5a3e] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#143d29]">
                      Click to Select or Upload Product Images
                    </p>
                    <p className="text-[10.5px] text-[#526359] mt-0.5">
                      Select multiple images at once (PNG, JPG, WebP up to 5MB each)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleMultipleImageFiles}
                  className="hidden"
                />

                {/* Optional Direct URL Input */}
                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Or paste web image URL here..."
                    className="flex-1 px-3 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-xl text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 text-xs font-bold bg-[#e9efdf] hover:bg-[#dfe7d2] text-[#143d29] border border-[#d6ddce] rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    + Add URL
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#526359] mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder="e.g. Zandu Balm Ultra Fast Relief"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#526359] mb-1">
                    Brand
                  </label>
                  <select
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                  >
                    <option value="Dabur">Dabur</option>
                    <option value="Zandu">Zandu</option>
                    <option value="Himalaya">Himalaya</option>
                    <option value="Baidyanath">Baidyanath</option>
                    <option value="Patanjali">Patanjali</option>
                    <option value="Dr. Ortho">Dr. Ortho</option>
                    <option value="Vicco">Vicco</option>
                    <option value="Hamdard">Hamdard</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#526359] mb-1">
                    Category
                  </label>
                  <select
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                  >
                    <option value="Joint & Muscle Pain">Joint & Muscle Pain</option>
                    <option value="Digestion & Acidity">Digestion & Acidity</option>
                    <option value="Immunity & Cold">Immunity & Cold</option>
                    <option value="Skin & Hair">Skin & Hair</option>
                    <option value="Daily Wellness">Daily Wellness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#526359] mb-1">
                    Pack Size *
                  </label>
                  <input
                    type="text"
                    value={newProd.packSize}
                    onChange={(e) => setNewProd({ ...newProd, packSize: e.target.value })}
                    placeholder="e.g. 25g Jar, 100ml Bottle"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#526359] mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={newProd.form}
                    onChange={(e) => setNewProd({ ...newProd, form: e.target.value as Product['form'] })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                  >
                    <option value="Balm">Balm (Jar)</option>
                    <option value="Tablets">Tablets (Bottle)</option>
                    <option value="Syrup">Syrup (Bottle)</option>
                    <option value="Oil">Oil (Bottle)</option>
                    <option value="Churna">Churna (Tub)</option>
                    <option value="Capsules">Capsules (Blister)</option>
                    <option value="Gel">Gel (Tube)</option>
                    <option value="Husk">Husk (Box)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#526359] mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={newProd.manufacturer}
                    onChange={(e) => setNewProd({ ...newProd, manufacturer: e.target.value })}
                    placeholder="e.g. Dabur India Ltd."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29] focus:ring-1 focus:ring-[#1d5a3e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-[#d6ddce]">
                <div>
                  <label className="block text-[10px] font-bold text-[#526359] mb-0.5">
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
                    className="w-full px-2 py-1 text-xs border border-[#d6ddce] rounded-lg bg-[#f8f8f3]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#526359] mb-0.5">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={newProd.mrp}
                    onChange={(e) =>
                      setNewProd({ ...newProd, mrp: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 text-xs border border-[#d6ddce] rounded-lg bg-[#f8f8f3]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#526359] mb-0.5">
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
                    className="w-full px-2 py-1 text-xs border border-[#d6ddce] rounded-lg bg-[#f8f8f3]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#526359] mb-0.5">
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
                    className="w-full px-2 py-1 text-xs border border-[#d6ddce] rounded-lg bg-[#f8f8f3]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#526359] mb-1">
                  Primary Indications & Benefits
                </label>
                <input
                  type="text"
                  value={newProd.indications}
                  onChange={(e) => setNewProd({ ...newProd, indications: e.target.value })}
                  placeholder="e.g. Fast relief from tension headaches & body aches"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#526359] mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={newProd.dosage}
                    onChange={(e) => setNewProd({ ...newProd, dosage: e.target.value })}
                    placeholder="e.g. Apply 2-3 times daily"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#526359] mb-1">
                    Composition
                  </label>
                  <input
                    type="text"
                    value={newProd.composition}
                    onChange={(e) => setNewProd({ ...newProd, composition: e.target.value })}
                    placeholder="e.g. Mentha Satva, Gaultheria Oil"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#d6ddce]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#526359] hover:text-[#143d29]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1d5a3e] hover:bg-[#143d29] text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-colors"
                >
                  {editingProductId ? 'Update Medicine SKU' : 'Save New Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
