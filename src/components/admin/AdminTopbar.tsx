'use client';

import React from 'react';
import {
  Menu,
  Search,
  RefreshCw,
  Plus,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { AdminTab } from '@/components/admin/AdminSidebar';

interface AdminTopbarProps {
  activeTab: AdminTab;
  globalSearch: string;
  onGlobalSearchChange: (v: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  isLiveSync: boolean;
  onToggleLiveSync: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenAddSku: () => void;
  onOpenMobileMenu: () => void;
  dark: boolean;
  onToggleDark: () => void;
}

const TAB_META: Record<AdminTab, { title: string; subtitle: string }> = {
  OVERVIEW: {
    title: 'Dark-Store Overview',
    subtitle: 'Real-time sales, dispatch SLA & stock health',
  },
  DISPATCH: {
    title: 'Live Dispatch & Orders',
    subtitle: 'Rapido bike dispatch queue, Kanban board & POS billing',
  },
  INVENTORY: {
    title: 'Inventory & Margins',
    subtitle: 'Real-time shelf quantities, live visibility & wholesale margins',
  },
  SETTINGS: {
    title: 'Store Configuration',
    subtitle: 'UPI VPA, delivery fees, WhatsApp & security PIN',
  },
};

export function AdminTopbar({
  activeTab,
  globalSearch,
  onGlobalSearchChange,
  searchInputRef,
  isLiveSync,
  onToggleLiveSync,
  isRefreshing,
  onRefresh,
  onOpenAddSku,
  onOpenMobileMenu,
  dark,
  onToggleDark,
}: AdminTopbarProps) {
  const meta = TAB_META[activeTab];

  return (
    <header
      className={`sticky top-0 z-30 h-16 px-4 sm:px-6 border-b backdrop-blur-md flex items-center justify-between gap-3 ${
        dark
          ? 'bg-[#090D16]/90 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200/90 text-slate-900'
      }`}
    >
      {/* Left: Hamburger + Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className={`lg:hidden p-2 rounded-xl border transition-colors cursor-pointer ${
            dark
              ? 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <h1 className="font-extrabold text-sm sm:text-base tracking-tight truncate">
            {meta.title}
          </h1>
          <p
            className={`text-[11px] hidden sm:block truncate ${
              dark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Center: Command Search (Ctrl+K) */}
      <div className="hidden md:flex flex-1 max-w-sm mx-2">
        <div
          className={`w-full relative flex items-center rounded-xl border transition-all ${
            dark
              ? 'bg-slate-900 border-slate-800 focus-within:border-emerald-500'
              : 'bg-slate-100/80 border-transparent focus-within:bg-white focus-within:border-[#0C831F] focus-within:ring-2 focus-within:ring-[#0C831F]/15'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 ml-3 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Quick search SKU, Order #AS, phone..."
            className="w-full py-2 px-2.5 text-xs bg-transparent focus:outline-none font-medium"
          />
          {globalSearch ? (
            <button
              type="button"
              onClick={() => onGlobalSearchChange('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd
              className={`mr-2.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                dark
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              Ctrl K
            </kbd>
          )}
        </div>
      </div>

      {/* Right: Sync Pulse, Refresh, Theme Toggle, + Add SKU */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleLiveSync}
          title="Toggle 10-second live order polling"
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
            isLiveSync
              ? dark
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-[#ECFDF3] border-[#BBF7D0] text-[#0C831F]'
              : dark
              ? 'bg-slate-900 border-slate-700 text-slate-400'
              : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveSync ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span>{isLiveSync ? 'Live 10s' : 'Paused'}</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Sync orders now"
          className={`p-2 rounded-xl border transition-colors cursor-pointer disabled:opacity-50 ${
            dark
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onToggleDark}
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle color theme"
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            dark
              ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950'
          }`}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onOpenAddSku}
          className="bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-extrabold px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shadow-[#0C831F]/25 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add SKU</span>
        </button>
      </div>
    </header>
  );
}
