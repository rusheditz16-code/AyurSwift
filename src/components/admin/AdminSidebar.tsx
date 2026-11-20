'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Zap,
  Package,
  Settings,
  Store,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export type AdminTab = 'OVERVIEW' | 'DISPATCH' | 'INVENTORY' | 'SETTINGS';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  newOrdersCount: number;
  lowStockCount: number;
  totalProductsCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
  dark: boolean;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  newOrdersCount,
  lowStockCount,
  totalProductsCount,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onLogout,
  dark,
}: AdminSidebarProps) {
  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeType?: 'danger' | 'warn' | 'neutral';
  }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'DISPATCH',
      label: 'Live Dispatch',
      icon: Zap,
      badge: newOrdersCount > 0 ? newOrdersCount : undefined,
      badgeType: 'danger',
    },
    {
      id: 'INVENTORY',
      label: 'Inventory',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : totalProductsCount,
      badgeType: lowStockCount > 0 ? 'warn' : 'neutral',
    },
    { id: 'SETTINGS', label: 'Store Settings', icon: Settings },
  ];

  const renderSidebarContent = (isMobile = false) => (
    <div
      className={`h-full flex flex-col justify-between select-none ${
        dark
          ? 'bg-[#111827] border-r border-slate-800 text-slate-200'
          : 'bg-white border-r border-slate-200/90 text-slate-800'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div
          className={`h-16 px-4 flex items-center justify-between border-b ${
            dark ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={collapsed && !isMobile ? '/ayurswift-icon.png' : '/ayurswift-logo.png'}
              alt="AyurSwift"
              className={collapsed && !isMobile ? 'h-8 w-8 object-contain' : 'h-7 w-auto object-contain'}
            />
            {(!collapsed || isMobile) && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0] shrink-0">
                Hub
              </span>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                dark
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'
              }`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (isMobile) onCloseMobile();
                }}
                title={collapsed && !isMobile ? item.label : undefined}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? dark
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0] shadow-2xs'
                    : dark
                    ? 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 border border-transparent'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active
                        ? dark
                          ? 'text-emerald-400'
                          : 'text-[#0C831F]'
                        : 'text-slate-400'
                    }`}
                  />
                  {(!collapsed || isMobile) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {item.badge !== undefined && (!collapsed || isMobile) && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full tabular-nums shrink-0 ${
                      item.badgeType === 'danger'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : item.badgeType === 'warn'
                        ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                        : dark
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utilities */}
      <div
        className={`p-3 border-t space-y-1.5 ${
          dark ? 'border-slate-800' : 'border-slate-100'
        }`}
      >
        {(!collapsed || isMobile) && (
          <div
            className={`px-3 py-2 rounded-xl text-[11px] mb-2 ${
              dark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200/70'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bhavnagar Dark Store</span>
            </div>
            <div className={`text-[10px] font-mono mt-0.5 truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              ayurswift.care@gmail.com
            </div>
          </div>
        )}

        <Link
          href="/"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            dark
              ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
          }`}
          title="View Live Storefront"
        >
          <Store className="w-4 h-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Live Storefront</span>}
        </Link>

        <button
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            dark
              ? 'text-rose-400 hover:bg-rose-500/10'
              : 'text-rose-600 hover:bg-rose-50'
          }`}
          title="Secure Logout"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block sticky top-0 h-screen shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-70 lg:hidden bg-slate-950/60 backdrop-blur-xs flex animate-fade-in"
          onClick={onCloseMobile}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-68 max-w-[82vw] h-full animate-drawer-left shadow-2xl"
          >
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
