'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, Order, MerchantSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/initialData';
import { InvoiceModal } from '@/components/InvoiceModal';
import { AdminAuthPortal } from '@/components/admin/AdminAuthPortal';
import { AdminSidebar, AdminTab } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab';
import { AdminDispatchTab } from '@/components/admin/AdminDispatchTab';
import { AdminInventoryTab } from '@/components/admin/AdminInventoryTab';
import { AdminProductDrawer } from '@/components/admin/AdminProductDrawer';
import { AdminCreateOrderModal } from '@/components/admin/AdminCreateOrderModal';
import { AdminSettingsTab } from '@/components/admin/AdminSettingsTab';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredOrders,
  saveStoredOrders,
  getStoredSettings,
  saveStoredSettings,
  resetToInitialProducts,
  formatRapidoDropText,
  generateSmartAdminWhatsAppUrl,
  syncProductToServer,
  deleteProductOnServer,
  fetchLiveCatalogFromServer,
  exportOrdersToCsv,
  getIstDateKey,
} from '@/lib/store';

/**
 * Verifies real image file magic bytes (PNG, JPEG, WebP only — rejects SVG/HTML/scripts).
 */
async function hasValidImageMagicBytes(file: File): Promise<boolean> {
  const allowedMimes = new Set(['image/png', 'image/jpeg', 'image/webp']);
  if (!allowedMimes.has(file.type)) return false;

  const headerBuf = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(headerBuf);
  if (bytes.length < 12) return false;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  // JPEG: FF D8 FF
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  // WebP: RIFF....WEBP
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  return isPng || isJpeg || isWebp;
}

const DEFAULT_NEW_PROD: Partial<Product> = {
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
  indications: '',
  dosage: 'Apply or take as directed on pack',
  composition: 'Ayurvedic Botanical Extracts',
  imageUrl: '',
};

export function AdminDashboard() {
  // Auth state (verified strictly by server HttpOnly session cookie)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [openAuthInResetMode, setOpenAuthInResetMode] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Shell & Theme state
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Core data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<MerchantSettings>(DEFAULT_SETTINGS);

  // Inventory filters & SKU Drawer
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProd, setNewProd] = useState<Partial<Product>>(DEFAULT_NEW_PROD);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [resetToast, setResetToast] = useState(false);

  // Dispatch state & live sync
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [newOrderBanner, setNewOrderBanner] = useState<Order | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [orderDateFilter, setOrderDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM'>('ALL');
  const [orderCustomDate, setOrderCustomDate] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | Order['orderStatus']>('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Settings & Billing & Modals
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [selectedBillOrder, setSelectedBillOrder] = useState<Order | null>(null);
  const [billFormat, setBillFormat] = useState<'A4' | 'THERMAL'>('A4');
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [actionToast, setActionToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const prevOrderCountRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setActionToast({ type, text });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setActionToast(null), 2800);
  }, []);

  // Initial load + theme + server-verified session check
  useEffect(() => {
    setProducts(getStoredProducts());
    const localOrders = getStoredOrders();
    setOrders(localOrders);
    prevOrderCountRef.current = localOrders.length;
    setSettings(getStoredSettings());

    try {
      if (localStorage.getItem('ayurswift_admin_theme') === 'dark') {
        setDark(true);
      }
      // Clean up any legacy client-side auth flags
      sessionStorage.removeItem('ayurswift_admin_session');
      sessionStorage.removeItem('ayurswift_admin_email');
    } catch {}

    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {});
  }, []);

  // Global Ctrl+K / Cmd+K shortcut to focus command search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ayurswift_admin_theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  // Polite Web Audio API chime on new incoming order
  const playNewOrderSound = () => {
    try {
      const AudioCtx =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  const refreshOrders = useCallback(async () => {
    setIsRefreshingOrders(true);
    try {
      const res = await fetch('/api/orders?limit=100');
      if (res.status === 401 || res.status === 403) {
        setIsAuthenticated(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          const serverOrders = [...(data.orders as Order[])].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          if (prevOrderCountRef.current > 0 && serverOrders.length > prevOrderCountRef.current) {
            setNewOrderBanner(serverOrders[0]);
            playNewOrderSound();
          }
          prevOrderCountRef.current = serverOrders.length;
          setOrders(serverOrders);
          saveStoredOrders(serverOrders);
        }
      }
    } catch {
      // Ignore transient refresh error
    } finally {
      setIsRefreshingOrders(false);
    }
  }, []);

  // Load orders & products when authenticated + visibility-aware 10s polling (pauses in hidden tabs)
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshOrders();
    fetchLiveCatalogFromServer(true)
      .then((liveProds) => {
        if (liveProds && liveProds.length > 0) {
          setProducts(liveProds);
        }
      })
      .catch(() => {});
    if (!isLiveSync) return;

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        refreshOrders();
      }
    }, 10000);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        refreshOrders();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated, isLiveSync, refreshOrders]);

  // Lockout countdown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => setLockoutSeconds((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Server-Verified Admin Auth (HttpOnly signed session cookie + server rate limit)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          pin: pinInput.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        setAuthError(null);
        setPinInput('');
        return;
      }

      if (res.status === 429 && typeof data.retryAfterSec === 'number') {
        setLockoutSeconds(data.retryAfterSec);
      }
      setAuthError(data.error || 'Invalid email address or security PIN. Access denied.');
    } catch {
      setAuthError('Unable to reach authentication server. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {}
    setIsAuthenticated(false);
    setEmailInput('');
    setPinInput('');
    setAuthError(null);
  };

  // Global search syncs into active view cleanly
  const handleGlobalSearch = (val: string) => {
    setGlobalSearch(val);
    if (val.trim().toUpperCase().startsWith('#AS') || /^\d{5,}$/.test(val.trim())) {
      setActiveTab('DISPATCH');
      setOrderSearchQuery(val);
    } else if (activeTab === 'DISPATCH') {
      setOrderSearchQuery(val);
    } else {
      setSearchFilter(val);
      if (val.trim() && activeTab !== 'INVENTORY') {
        setActiveTab('INVENTORY');
      }
    }
  };

  // Inventory actions
  const handleStockChange = (productId: string, delta: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stockQuantity + delta);
        const isLive = newStock === 0 ? false : p.isLive;
        const item = { ...p, stockQuantity: newStock, isLive };
        syncProductToServer(item);
        return item;
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
  };

  const handleToggleLive = (productId: string) => {
    const updated = products.map((p) => {
      if (p.id === productId && p.stockQuantity > 0) {
        const item = { ...p, isLive: !p.isLive };
        syncProductToServer(item);
        return item;
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
  };

  const handleOpenAddDrawer = () => {
    setEditingProductId(null);
    setNewProd(DEFAULT_NEW_PROD);
    setUploadedImages([]);
    setImageUrlInput('');
    setShowAddDrawer(true);
  };

  const handleOpenEditDrawer = (product: Product) => {
    setEditingProductId(product.id);
    setNewProd({ ...product });
    const existing =
      product.images && product.images.length > 0
        ? [...product.images]
        : product.imageUrl
        ? [product.imageUrl]
        : [];
    setUploadedImages(existing);
    setImageUrlInput('');
    setShowAddDrawer(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Remove this medicine SKU from the dark-store catalog?')) {
      const updated = products.filter((p) => p.id !== productId);
      setProducts(updated);
      saveStoredProducts(updated);
      deleteProductOnServer(productId);
    }
  };

  const handleMultipleImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.size > 3 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 3MB limit.`);
        continue;
      }
      const validImage = await hasValidImageMagicBytes(file);
      if (!validImage) {
        alert(`Rejected ${file.name}: only genuine PNG, JPG, or WebP images are allowed (SVG/HTML blocked).`);
        continue;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result && /^data:image\/(png|jpeg|webp);base64,/.test(result)) {
          setUploadedImages((prev) => (prev.includes(result) ? prev : [...prev, result]));
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        alert('Only secure https:// image URLs are allowed.');
        return;
      }
    } catch {
      alert('Please enter a valid https:// image URL.');
      return;
    }
    setUploadedImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
    setImageUrlInput('');
  };

  const handleSetPrimaryImage = (index: number) => {
    setUploadedImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  };

  const handleRemoveImageAtIndex = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.packSize) {
      alert('Please fill in medicine name and pack size.');
      return;
    }

    const finalImages = uploadedImages.filter(Boolean);
    const primaryImageUrl = finalImages[0] || newProd.imageUrl || undefined;

    if (editingProductId) {
      const updated = products.map((p) => {
        if (p.id === editingProductId) {
          const item: Product = {
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
            isLive: (Number(newProd.stockQuantity) || 0) > 0 ? newProd.isLive ?? true : false,
            indications: newProd.indications || p.indications,
            dosage: newProd.dosage || p.dosage,
            composition: newProd.composition || p.composition,
            imageUrl: primaryImageUrl,
            images: finalImages.length > 0 ? finalImages : undefined,
          };
          syncProductToServer(item);
          return item;
        }
        return p;
      });
      setProducts(updated);
      saveStoredProducts(updated);
    } else {
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
      syncProductToServer(created);
    }

    setShowAddDrawer(false);
    setEditingProductId(null);
  };

  const handleResetCatalog = () => {
    if (
      confirm(
        'Reset catalog to the verified authentic Ayurvedic medicines with real stock? Custom edits will be replaced.'
      )
    ) {
      setProducts(resetToInitialProducts());
      setResetToast(true);
      setTimeout(() => setResetToast(false), 2500);
    }
  };

  // Shared authenticated order mutation helper with rollback + user feedback
  const commitOrderUpdate = async (
    orderId: string,
    patch: Partial<Order>,
    apiPayload: Record<string, unknown>,
    successMsg: string
  ): Promise<boolean> => {
    const previousOrders = orders;
    const optimistic = orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o));
    setOrders(optimistic);
    saveStoredOrders(optimistic);

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...apiPayload }),
      });

      if (res.status === 401 || res.status === 403) {
        setOrders(previousOrders);
        saveStoredOrders(previousOrders);
        setIsAuthenticated(false);
        setAuthError('Your admin session expired. Please sign in again.');
        return false;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setOrders(previousOrders);
        saveStoredOrders(previousOrders);
        showToast('error', data.error || 'Server rejected order update.');
        return false;
      }

      if (data.order) {
        const synced = optimistic.map((o) => (o.id === orderId ? (data.order as Order) : o));
        setOrders(synced);
        saveStoredOrders(synced);
      }

      showToast('success', successMsg);
      return true;
    } catch {
      setOrders(previousOrders);
      saveStoredOrders(previousOrders);
      showToast('error', 'Network error updating order. Changes reverted.');
      return false;
    }
  };

  // Dispatch actions (authenticated automatically via HttpOnly session cookie)
  const handleCopyForRapido = async (order: Order) => {
    navigator.clipboard.writeText(formatRapidoDropText(order));
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 2500);
    await commitOrderUpdate(
      order.id,
      { rapidoCopied: true, orderStatus: 'DISPATCHED' },
      { rapidoCopied: true, orderStatus: 'DISPATCHED' },
      `Rapido address copied & ${order.id} marked Dispatched`
    );
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    await commitOrderUpdate(
      orderId,
      { orderStatus: status },
      { orderStatus: status },
      `${orderId} updated to ${status}`
    );
  };

  const handleTogglePaymentVerified = async (orderId: string) => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) return;
    const nextStatus: Order['paymentStatus'] =
      existing.paymentStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
    await commitOrderUpdate(
      orderId,
      { paymentStatus: nextStatus },
      { paymentStatus: nextStatus },
      nextStatus === 'VERIFIED'
        ? `${orderId} payment marked Verified`
        : `${orderId} payment set back to Pending`
    );
  };

  const handleVerifyAndPack = async (orderId: string) => {
    await commitOrderUpdate(
      orderId,
      { paymentStatus: 'VERIFIED', orderStatus: 'PACKED' },
      { paymentStatus: 'VERIFIED', orderStatus: 'PACKED' },
      `${orderId} payment verified & marked Packed`
    );
  };

  const handleSaveOrderLogistics = async (
    orderId: string,
    courierTracking: string,
    adminNote: string
  ): Promise<boolean> => {
    return commitOrderUpdate(
      orderId,
      {
        courierTracking: courierTracking.trim() || undefined,
        adminNote: adminNote.trim() || undefined,
      },
      {
        courierTracking: courierTracking.trim(),
        adminNote: adminNote.trim(),
      },
      `Saved tracking & note for ${orderId}`
    );
  };

  const handleWhatsAppCustomer = (order: Order) => {
    window.open(generateSmartAdminWhatsAppUrl(order), '_blank');
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Delete order ${orderId}? This cannot be undone.`)) return;
    const previousOrders = orders;
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    saveStoredOrders(updated);
    prevOrderCountRef.current = updated.length;

    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
      });
      if (res.status === 401 || res.status === 403) {
        setOrders(previousOrders);
        saveStoredOrders(previousOrders);
        setIsAuthenticated(false);
        setAuthError('Your admin session expired. Please sign in again.');
        return;
      }
      if (!res.ok) {
        setOrders(previousOrders);
        saveStoredOrders(previousOrders);
        showToast('error', 'Failed to delete order from server.');
        return;
      }
      showToast('success', `Order ${orderId} deleted`);
    } catch {
      setOrders(previousOrders);
      saveStoredOrders(previousOrders);
      showToast('error', 'Network error deleting order.');
    }
  };

  const handleExportCsv = (ordersToExport: Order[]) => {
    const blob = new Blob([exportOrdersToCsv(ordersToExport)], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const tag =
      orderDateFilter === 'TODAY'
        ? 'today'
        : orderDateFilter === 'YESTERDAY'
        ? 'yesterday'
        : orderDateFilter === 'CUSTOM'
        ? orderCustomDate
        : 'all';
    link.setAttribute('download', `ayurswift_orders_${tag}_${getIstDateKey()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenBill = (order: Order, format: 'A4' | 'THERMAL' = 'A4') => {
    setSelectedBillOrder(order);
    setBillFormat(format);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSettings(settings);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2200);
  };

  if (!isAuthenticated) {
    return (
      <AdminAuthPortal
        emailInput={emailInput}
        onEmailChange={setEmailInput}
        pinInput={pinInput}
        onPinChange={setPinInput}
        showPassword={showPassword}
        onToggleShowPassword={() => setShowPassword((v) => !v)}
        authError={authError}
        lockoutSeconds={lockoutSeconds}
        onSubmit={handleAuthSubmit}
        dark={dark}
        initialResetOpen={openAuthInResetMode}
      />
    );
  }

  const newOrdersCount = orders.filter((o) => o.orderStatus === 'NEW').length;
  const lowStockCount = products.filter((p) => p.stockQuantity <= 5).length;

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors ${
        dark ? 'bg-[#090D16] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        newOrdersCount={newOrdersCount}
        lowStockCount={lowStockCount}
        totalProductsCount={products.length}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onLogout={handleLogout}
        dark={dark}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar
          activeTab={activeTab}
          globalSearch={globalSearch}
          onGlobalSearchChange={handleGlobalSearch}
          searchInputRef={searchInputRef}
          isLiveSync={isLiveSync}
          onToggleLiveSync={() => setIsLiveSync((s) => !s)}
          isRefreshing={isRefreshingOrders}
          onRefresh={refreshOrders}
          onOpenAddSku={handleOpenAddDrawer}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          dark={dark}
          onToggleDark={toggleDark}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {activeTab === 'OVERVIEW' && (
            <AdminOverviewTab
              products={products}
              orders={orders}
              onQuickRestock={handleStockChange}
              onJumpToDispatch={(status) => {
                if (status) setOrderStatusFilter(status);
                setActiveTab('DISPATCH');
              }}
              onJumpToTab={setActiveTab}
              onOpenBill={handleOpenBill}
              dark={dark}
            />
          )}

          {activeTab === 'DISPATCH' && (
            <AdminDispatchTab
              orders={orders}
              newOrderBanner={newOrderBanner}
              onDismissBanner={() => setNewOrderBanner(null)}
              orderDateFilter={orderDateFilter}
              onDateFilterChange={setOrderDateFilter}
              orderCustomDate={orderCustomDate}
              onCustomDateChange={setOrderCustomDate}
              orderStatusFilter={orderStatusFilter}
              onStatusFilterChange={setOrderStatusFilter}
              orderSearchQuery={orderSearchQuery}
              onOrderSearchChange={setOrderSearchQuery}
              copiedOrderId={copiedOrderId}
              onCopyForRapido={handleCopyForRapido}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onTogglePaymentVerified={handleTogglePaymentVerified}
              onVerifyAndPack={handleVerifyAndPack}
              onSaveOrderLogistics={handleSaveOrderLogistics}
              onOpenCreateOrder={() => setShowCreateOrderModal(true)}
              onWhatsAppCustomer={handleWhatsAppCustomer}
              onOpenBill={handleOpenBill}
              onDeleteOrder={handleDeleteOrder}
              onExportCsv={handleExportCsv}
              dark={dark}
            />
          )}

          {activeTab === 'INVENTORY' && (
            <AdminInventoryTab
              products={products}
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              onStockChange={handleStockChange}
              onToggleLive={handleToggleLive}
              onOpenEdit={handleOpenEditDrawer}
              onDeleteProduct={handleDeleteProduct}
              onResetCatalog={handleResetCatalog}
              resetToast={resetToast}
              dark={dark}
            />
          )}

          {activeTab === 'SETTINGS' && (
            <AdminSettingsTab
              settings={settings}
              onChangeSettings={setSettings}
              onSaveSettings={handleSaveSettings}
              onOpenCredentialReset={async () => {
                setOpenAuthInResetMode(true);
                await handleLogout();
              }}
              savedToast={settingsSavedToast}
              dark={dark}
            />
          )}
        </main>
      </div>

      <AdminProductDrawer
        isOpen={showAddDrawer}
        editingProductId={editingProductId}
        newProd={newProd}
        onChangeProd={setNewProd}
        uploadedImages={uploadedImages}
        imageUrlInput={imageUrlInput}
        onImageUrlInputChange={setImageUrlInput}
        fileInputRef={fileInputRef}
        onMultipleImageFiles={handleMultipleImageFiles}
        onAddImageUrl={handleAddImageUrl}
        onSetPrimaryImage={handleSetPrimaryImage}
        onRemoveImage={handleRemoveImageAtIndex}
        onSubmit={handleSaveProductSubmit}
        onClose={() => setShowAddDrawer(false)}
        dark={dark}
      />

      <InvoiceModal
        order={selectedBillOrder}
        isOpen={Boolean(selectedBillOrder)}
        onClose={() => setSelectedBillOrder(null)}
        initialFormat={billFormat}
        settings={settings}
      />

      <AdminCreateOrderModal
        isOpen={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
        products={products}
        settings={settings}
        onOrderCreated={(newOrder) => {
          const updated = [newOrder, ...orders.filter((o) => o.id !== newOrder.id)];
          setOrders(updated);
          saveStoredOrders(updated);
          prevOrderCountRef.current = updated.length;
          showToast('success', `Phone order ${newOrder.id} added to queue`);
        }}
        onPrintBill={(ord) => handleOpenBill(ord, 'A4')}
        dark={dark}
      />

      {actionToast && (
        <div
          className={`fixed bottom-5 right-5 z-80 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-extrabold flex items-center gap-2 border animate-fade-in ${
            actionToast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-950 text-white border-slate-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              actionToast.type === 'error' ? 'bg-amber-300' : 'bg-emerald-400'
            }`}
          />
          <span>{actionToast.text}</span>
        </div>
      )}
    </div>
  );
}
