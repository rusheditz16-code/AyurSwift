'use client';

import React, { useState } from 'react';
import {
  Bell,
  X,
  Download,
  Calendar,
  Search,
  Clock,
  Receipt,
  Printer,
  Copy,
  Check,
  MessageCircle,
  Trash2,
  Columns3,
  List,
  ArrowRight,
  Package,
} from 'lucide-react';
import { Order } from '@/types';
import { groupOrdersByDate, getDailyOrderStats } from '@/lib/store';

interface AdminDispatchTabProps {
  orders: Order[];
  newOrderBanner: Order | null;
  onDismissBanner: () => void;
  orderDateFilter: 'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM';
  onDateFilterChange: (f: 'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM') => void;
  orderCustomDate: string;
  onCustomDateChange: (d: string) => void;
  orderStatusFilter: 'ALL' | Order['orderStatus'];
  onStatusFilterChange: (s: 'ALL' | Order['orderStatus']) => void;
  orderSearchQuery: string;
  onOrderSearchChange: (q: string) => void;
  copiedOrderId: string | null;
  onCopyForRapido: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
  onWhatsAppCustomer: (order: Order) => void;
  onOpenBill: (order: Order, format?: 'A4' | 'THERMAL') => void;
  onDeleteOrder: (orderId: string) => void;
  onExportCsv: (ordersToExport: Order[]) => void;
  dark: boolean;
}

function getElapsedLabel(createdAt: string): { label: string; mins: number } {
  const diffMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return { label: 'Just now', mins: 0 };
  if (mins < 60) return { label: `${mins}m ago`, mins };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `${hrs}h ago`, mins };
  return { label: `${Math.floor(hrs / 24)}d ago`, mins };
}

const KANBAN_COLUMNS: {
  status: Order['orderStatus'];
  title: string;
  dotColor: string;
  nextStatus?: Order['orderStatus'];
  nextLabel?: string;
}[] = [
  {
    status: 'NEW',
    title: 'New Orders',
    dotColor: 'bg-rose-500',
    nextStatus: 'PACKED',
    nextLabel: 'Mark Packed',
  },
  {
    status: 'PACKED',
    title: 'Packed & Ready',
    dotColor: 'bg-amber-500',
    nextStatus: 'DISPATCHED',
    nextLabel: 'Mark Dispatched',
  },
  {
    status: 'DISPATCHED',
    title: 'Out for Delivery',
    dotColor: 'bg-blue-500',
    nextStatus: 'DELIVERED',
    nextLabel: 'Mark Delivered',
  },
  {
    status: 'DELIVERED',
    title: 'Delivered',
    dotColor: 'bg-emerald-500',
  },
];

export function AdminDispatchTab({
  orders,
  newOrderBanner,
  onDismissBanner,
  orderDateFilter,
  onDateFilterChange,
  orderCustomDate,
  onCustomDateChange,
  orderStatusFilter,
  onStatusFilterChange,
  orderSearchQuery,
  onOrderSearchChange,
  copiedOrderId,
  onCopyForRapido,
  onUpdateOrderStatus,
  onWhatsAppCustomer,
  onOpenBill,
  onDeleteOrder,
  onExportCsv,
  dark,
}: AdminDispatchTabProps) {
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const effectiveDateKey =
    orderDateFilter === 'TODAY'
      ? todayStr
      : orderDateFilter === 'YESTERDAY'
      ? yesterdayStr
      : orderDateFilter === 'CUSTOM'
      ? orderCustomDate
      : undefined;

  const filteredOrders = orders.filter((o) => {
    if (effectiveDateKey && (o.createdAt || '').split('T')[0] !== effectiveDateKey) return false;
    if (orderStatusFilter !== 'ALL' && o.orderStatus !== orderStatusFilter) return false;
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const match =
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.city.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const dayGroups = groupOrdersByDate(filteredOrders);
  const dailyStats = getDailyOrderStats(orders, effectiveDateKey);
  const todayCount = orders.filter((o) => (o.createdAt || '').startsWith(todayStr)).length;
  const yesterdayCount = orders.filter((o) => (o.createdAt || '').startsWith(yesterdayStr)).length;

  const cardBg = dark
    ? 'bg-[#111827] border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs';
  const subSurface = dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200/70';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  const renderOrderCard = (order: Order, nextStatus?: Order['orderStatus'], nextLabel?: string) => {
    const isCopied = copiedOrderId === order.id;
    const isRapido = order.deliveryType === 'RAPIDO_CITY';
    const elapsed = getElapsedLabel(order.createdAt);
    const isUrgent = order.orderStatus === 'NEW' && elapsed.mins >= 15;

    return (
      <div
        key={order.id}
        className={`rounded-2xl border p-3.5 space-y-3 transition-all ${
          isUrgent
            ? dark
              ? 'bg-[#111827] border-rose-500/60 shadow-md shadow-rose-950/30'
              : 'bg-white border-rose-300 shadow-sm'
            : cardBg
        }`}
      >
        {/* Top Row: ID + Badges + SLA Timer */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/15">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              {order.id}
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                isRapido
                  ? 'bg-amber-500/15 text-amber-500'
                  : 'bg-blue-500/15 text-blue-500'
              }`}
            >
              {isRapido ? '⚡ Rapido' : '📦 Courier'}
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                order.paymentMethod === 'COD'
                  ? 'bg-orange-500/15 text-orange-500'
                  : 'bg-emerald-500/15 text-emerald-500'
              }`}
            >
              {order.paymentMethod}
            </span>
          </div>

          <span
            className={`text-[10.5px] font-bold flex items-center gap-1 shrink-0 tabular-nums ${
              isUrgent ? 'text-rose-500' : muted
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{elapsed.label}</span>
          </span>
        </div>

        {/* Customer Info */}
        <div className="text-xs space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <strong className="font-extrabold truncate">{order.customerName}</strong>
            <a
              href={`tel:${order.customerPhone}`}
              className="text-emerald-500 font-bold hover:underline shrink-0 tabular-nums"
            >
              {order.customerPhone}
            </a>
          </div>
          <p className={`text-[11px] leading-snug line-clamp-2 ${muted}`}>
            {order.deliveryAddress}
            {order.landmark ? `, Near ${order.landmark}` : ''}, {order.city} - {order.pincode}
          </p>
        </div>

        {/* Items Box */}
        <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${subSurface}`}>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-2">
              <span className="truncate">
                <strong>{item.quantity}x</strong> {item.name} ({item.packSize})
              </span>
              <span className="font-bold tabular-nums shrink-0">₹{item.totalPrice}</span>
            </div>
          ))}
          <div className="pt-1.5 mt-1 border-t border-slate-500/15 flex items-center justify-between font-extrabold text-xs">
            <span className={muted}>Collect ({order.paymentMethod})</span>
            <span className="text-emerald-500 tabular-nums text-sm">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            {nextStatus && nextLabel ? (
              <button
                type="button"
                onClick={() => onUpdateOrderStatus(order.id, nextStatus)}
                className="flex-1 py-2 px-2.5 rounded-xl bg-[#0C831F] hover:bg-[#096B19] text-white text-[11.5px] font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <span>{nextLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <select
                value={order.orderStatus}
                onChange={(e) =>
                  onUpdateOrderStatus(order.id, e.target.value as Order['orderStatus'])
                }
                className={`flex-1 text-xs rounded-xl px-2.5 py-2 font-bold border focus:outline-none cursor-pointer ${
                  dark
                    ? 'bg-slate-900 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="NEW">New</option>
                <option value="PACKED">Packed</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            )}

            <button
              type="button"
              onClick={() => onCopyForRapido(order)}
              title="1-Click Copy Drop Details for Rapido"
              className={`py-2 px-2.5 rounded-xl text-[11.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer active:scale-95 border ${
                isCopied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : dark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Rapido'}</span>
            </button>
          </div>

          {/* Secondary Row */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onWhatsAppCustomer(order)}
                title="WhatsApp Customer"
                className={`px-2 py-1 rounded-lg border text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  dark
                    ? 'border-slate-800 bg-slate-900 text-emerald-400 hover:bg-slate-800'
                    : 'border-slate-200 bg-white text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenBill(order, 'A4')}
                title="Print Standard A4 Bill"
                className={`px-2 py-1 rounded-lg border text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  dark
                    ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Receipt className="w-3 h-3" />
                <span>A4</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenBill(order, 'THERMAL')}
                title="Print 80mm Thermal POS Slip"
                className={`px-2 py-1 rounded-lg border text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  dark
                    ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Printer className="w-3 h-3" />
                <span>POS</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              {viewMode === 'KANBAN' && (
                <select
                  value={order.orderStatus}
                  onChange={(e) =>
                    onUpdateOrderStatus(order.id, e.target.value as Order['orderStatus'])
                  }
                  aria-label="Change status"
                  className={`text-[10.5px] rounded-lg px-1.5 py-1 font-bold border cursor-pointer focus:outline-none ${
                    dark
                      ? 'bg-slate-900 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="NEW">New</option>
                  <option value="PACKED">Packed</option>
                  <option value="DISPATCHED">Sent</option>
                  <option value="DELIVERED">Done</option>
                  <option value="CANCELLED">Cancel</option>
                </select>
              )}

              <button
                type="button"
                onClick={() => onDeleteOrder(order.id)}
                className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                title="Delete order"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Live New Order Banner */}
      {newOrderBanner && (
        <div className="bg-[#0C831F] text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-modal-pop">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-extrabold flex items-center gap-2">
                <span>New Incoming Order!</span>
                <span className="bg-white/20 px-2 py-0.5 rounded font-mono text-[10.5px]">
                  {newOrderBanner.id}
                </span>
              </div>
              <div className="text-[11px] text-emerald-100">
                {newOrderBanner.customerName} • {newOrderBanner.items.length} items (₹
                {newOrderBanner.totalAmount}) •{' '}
                {newOrderBanner.deliveryType === 'RAPIDO_CITY' ? '⚡ Rapido' : '📦 Courier'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onOrderSearchChange(newOrderBanner.id);
                onDismissBanner();
              }}
              className="px-3 py-1.5 bg-white text-[#0A5C16] text-xs font-extrabold rounded-xl cursor-pointer"
            >
              Inspect
            </button>
            <button
              type="button"
              onClick={onDismissBanner}
              className="p-1.5 text-emerald-100 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Compact Daily Financial KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: effectiveDateKey ? 'Selected Day Rev' : 'All-Time Revenue',
            value: `₹${dailyStats.totalRevenue.toLocaleString('en-IN')}`,
            sub: `${dailyStats.validOrdersCount} active orders`,
            accent: 'text-emerald-500',
          },
          {
            label: 'Total Orders',
            value: `${dailyStats.totalOrders}`,
            sub: effectiveDateKey ? 'Filtered day' : 'All records',
            accent: dark ? 'text-white' : 'text-slate-950',
          },
          {
            label: 'COD to Collect',
            value: `₹${dailyStats.codAmount.toLocaleString('en-IN')}`,
            sub: 'Cash via riders',
            accent: 'text-amber-500',
          },
          {
            label: 'Prepaid UPI',
            value: `₹${dailyStats.upiAmount.toLocaleString('en-IN')}`,
            sub: 'Zero-fee direct',
            accent: 'text-emerald-500',
          },
          {
            label: 'Pending Action',
            value: `${dailyStats.pendingActionCount}`,
            sub: `${dailyStats.newCount} New • ${dailyStats.packedCount} Packed`,
            accent: 'text-rose-500',
          },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-3.5 ${cardBg}`}>
            <div className={`text-[10px] font-extrabold uppercase tracking-wider ${muted}`}>
              {kpi.label}
            </div>
            <div className={`text-xl font-extrabold tabular-nums mt-0.5 ${kpi.accent}`}>
              {kpi.value}
            </div>
            <div className={`text-[10.5px] font-medium mt-0.5 ${muted}`}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters & View Mode Toolbar */}
      <div className={`rounded-2xl border p-3.5 space-y-3 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Date Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: `All (${orders.length})` },
                { id: 'TODAY', label: `Today (${todayCount})` },
                { id: 'YESTERDAY', label: `Yesterday (${yesterdayCount})` },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onDateFilterChange(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  orderDateFilter === d.id
                    ? 'bg-[#0C831F] text-white shadow-2xs'
                    : dark
                    ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {d.label}
              </button>
            ))}

            <input
              type="date"
              value={orderCustomDate}
              onChange={(e) => {
                onCustomDateChange(e.target.value);
                onDateFilterChange(e.target.value ? 'CUSTOM' : 'ALL');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border focus:outline-none ${
                dark
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          {/* Right: Kanban/List Toggle + Export CSV */}
          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded-xl flex items-center text-xs font-bold ${
                dark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('KANBAN')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'KANBAN'
                    ? dark
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white text-slate-950 shadow-2xs'
                    : muted
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'LIST'
                    ? dark
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white text-slate-950 shadow-2xs'
                    : muted
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Day List</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onExportCsv(filteredOrders)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                dark
                  ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Status Chips + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-500/10">
          <div className="flex flex-wrap items-center gap-1">
            {(['ALL', 'NEW', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onStatusFilterChange(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    orderStatusFilter === st
                      ? dark
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-900 text-white'
                      : dark
                      ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {st === 'ALL'
                    ? `All (${dailyStats.totalOrders})`
                    : st === 'NEW'
                    ? `New (${dailyStats.newCount})`
                    : st === 'PACKED'
                    ? `Packed (${dailyStats.packedCount})`
                    : st === 'DISPATCHED'
                    ? `Sent (${dailyStats.dispatchedCount})`
                    : st === 'DELIVERED'
                    ? `Done (${dailyStats.deliveredCount})`
                    : `Cancelled (${dailyStats.cancelledCount})`}
                </button>
              )
            )}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={orderSearchQuery}
              onChange={(e) => onOrderSearchChange(e.target.value)}
              placeholder="Filter Order ID, name, phone..."
              className={`w-full pl-8 pr-7 py-1.5 rounded-xl text-xs font-medium border focus:outline-none focus:border-[#0C831F] ${
                dark
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
              }`}
            />
            {orderSearchQuery && (
              <button
                type="button"
                onClick={() => onOrderSearchChange('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Dispatch Body */}
      {filteredOrders.length === 0 ? (
        <div className={`rounded-2xl border p-12 text-center space-y-2.5 ${cardBg}`}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm">No Matching Orders</h3>
          <p className={`text-xs max-w-sm mx-auto ${muted}`}>
            Try clearing your date/status filter or wait for incoming storefront orders (auto-syncing every 10s).
          </p>
        </div>
      ) : viewMode === 'KANBAN' && orderStatusFilter === 'ALL' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.orderStatus === col.status);
            return (
              <div
                key={col.status}
                className={`rounded-2xl border p-3 space-y-3 ${
                  dark
                    ? 'bg-slate-900/55 border-slate-800'
                    : 'bg-slate-100/70 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider">
                      {col.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full tabular-nums ${
                      dark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {colOrders.length}
                  </span>
                </div>

                {colOrders.length === 0 ? (
                  <div
                    className={`rounded-xl border border-dashed p-6 text-center text-[11px] font-semibold ${
                      dark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    Queue empty
                  </div>
                ) : (
                  <div className="space-y-3">
                    {colOrders.map((order) =>
                      renderOrderCard(order, col.nextStatus, col.nextLabel)
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-5">
          {dayGroups.map((group) => (
            <div key={group.dateKey} className="space-y-3">
              <div
                className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border ${subSurface}`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span className="font-extrabold text-xs sm:text-sm">
                    {group.isToday ? 'Today — ' : group.isYesterday ? 'Yesterday — ' : ''}
                    {group.displayDate}
                  </span>
                  <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                    {group.orders.length} {group.orders.length === 1 ? 'order' : 'orders'}
                  </span>
                </div>

                <div className={`flex items-center gap-3 text-xs font-semibold tabular-nums ${muted}`}>
                  <span>
                    Total: <strong className={dark ? 'text-white' : 'text-slate-900'}>₹{group.totalRevenue}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    COD: <strong className="text-amber-500">₹{group.codAmount}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    UPI: <strong className="text-emerald-500">₹{group.upiAmount}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {group.orders.map((order) => {
                  const col = KANBAN_COLUMNS.find((c) => c.status === order.orderStatus);
                  return renderOrderCard(order, col?.nextStatus, col?.nextLabel);
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
