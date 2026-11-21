'use client';

import React, { useState } from 'react';
import {
  Bell,
  X,
  Download,
  Calendar,
  Search,
  Columns3,
  List,
  Package,
  Plus,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { Order } from '@/types';
import { AdminOrderCard } from '@/components/admin/AdminOrderCard';
import { groupOrdersByDate, getDailyOrderStats, getIstDateKey } from '@/lib/store';
import { DELIVERY_SLOTS } from '@/lib/deliverySlots';

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
  onTogglePaymentVerified: (orderId: string) => void;
  onVerifyAndPack: (orderId: string) => void;
  onSaveOrderLogistics: (
    orderId: string,
    courierTracking: string,
    adminNote: string
  ) => Promise<boolean>;
  onOpenCreateOrder: () => void;
  onWhatsAppCustomer: (order: Order) => void;
  onOpenBill: (order: Order, format?: 'A4' | 'THERMAL') => void;
  onDeleteOrder: (orderId: string) => void;
  onExportCsv: (ordersToExport: Order[]) => void;
  dark: boolean;
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
  onTogglePaymentVerified,
  onVerifyAndPack,
  onSaveOrderLogistics,
  onOpenCreateOrder,
  onWhatsAppCustomer,
  onOpenBill,
  onDeleteOrder,
  onExportCsv,
  dark,
}: AdminDispatchTabProps) {
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [slotFilter, setSlotFilter] = useState<string>('ALL');
  const [onlyUnverifiedUpi, setOnlyUnverifiedUpi] = useState(false);
  const [showCancelledDrawer, setShowCancelledDrawer] = useState(false);

  const now = new Date();
  const todayStr = getIstDateKey(now);
  const yesterdayStr = getIstDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  const effectiveDateKey =
    orderDateFilter === 'TODAY'
      ? todayStr
      : orderDateFilter === 'YESTERDAY'
      ? yesterdayStr
      : orderDateFilter === 'CUSTOM'
      ? orderCustomDate
      : undefined;

  const unverifiedUpiCount = orders.filter(
    (o) =>
      o.orderStatus !== 'CANCELLED' &&
      o.paymentMethod === 'UPI' &&
      o.paymentStatus === 'PENDING'
  ).length;

  const filteredOrders = orders.filter((o) => {
    if (effectiveDateKey && getIstDateKey(o.createdAt || '') !== effectiveDateKey) return false;
    if (orderStatusFilter !== 'ALL' && o.orderStatus !== orderStatusFilter) return false;
    if (slotFilter !== 'ALL') {
      if (slotFilter === 'COURIER') {
        if (o.deliveryType !== 'COURIER_OUTSIDE') return false;
      } else if (!(o.deliverySlot || '').includes(slotFilter)) {
        return false;
      }
    }
    if (
      onlyUnverifiedUpi &&
      !(o.orderStatus !== 'CANCELLED' && o.paymentMethod === 'UPI' && o.paymentStatus === 'PENDING')
    ) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const match =
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.city.toLowerCase().includes(q) ||
        (o.deliverySlot || '').toLowerCase().includes(q) ||
        (o.utrNumber || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const cancelledInView = filteredOrders.filter((o) => o.orderStatus === 'CANCELLED');
  const dayGroups = groupOrdersByDate(filteredOrders);
  const dailyStats = getDailyOrderStats(orders, effectiveDateKey);
  const todayCount = orders.filter((o) => getIstDateKey(o.createdAt || '') === todayStr).length;
  const yesterdayCount = orders.filter(
    (o) => getIstDateKey(o.createdAt || '') === yesterdayStr
  ).length;

  const cardBg = dark
    ? 'bg-[#111827] border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs';
  const subSurface = dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200/70';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

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
                {newOrderBanner.deliverySlot
                  ? `🕒 ${newOrderBanner.deliverySlot}`
                  : newOrderBanner.deliveryType === 'RAPIDO_CITY'
                  ? '🕒 Local Slot'
                  : '📦 Courier'}
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
            sub: effectiveDateKey ? 'Filtered day (IST)' : 'All records',
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
            sub: 'Direct bank credit',
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
          {/* Date Pills (IST-aligned) */}
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

          {/* Right: + Phone Order + Kanban/List Toggle + Export CSV */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenCreateOrder}
              className="px-3 py-1.5 rounded-xl bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-extrabold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Phone Order</span>
            </button>

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

        {/* Status Chips + Unverified UPI Filter + Search */}
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

            <button
              type="button"
              onClick={() => setOnlyUnverifiedUpi((v) => !v)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                onlyUnverifiedUpi
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-2xs'
                  : dark
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Unverified UPI ({unverifiedUpiCount})</span>
            </button>

            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
              aria-label="Filter orders by delivery slot"
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border focus:outline-none cursor-pointer ${
                slotFilter !== 'ALL'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : dark
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Delivery Slots</option>
              {DELIVERY_SLOTS.map((s) => (
                <option key={s.id} value={s.label}>
                  Slot: {s.label}
                </option>
              ))}
              <option value="COURIER">All-India Courier</option>
            </select>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={orderSearchQuery}
              onChange={(e) => onOrderSearchChange(e.target.value)}
              placeholder="Filter Order ID, name, phone, UTR..."
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
            Try clearing your date/status filter or click <strong>+ Phone Order</strong> to log an incoming WhatsApp order.
          </p>
        </div>
      ) : viewMode === 'KANBAN' && orderStatusFilter === 'ALL' ? (
        <div className="space-y-4">
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
                      {colOrders.map((order) => (
                        <AdminOrderCard
                          key={order.id}
                          order={order}
                          viewMode={viewMode}
                          nextStatus={col.nextStatus}
                          nextLabel={col.nextLabel}
                          copiedOrderId={copiedOrderId}
                          onCopyForRapido={onCopyForRapido}
                          onUpdateOrderStatus={onUpdateOrderStatus}
                          onTogglePaymentVerified={onTogglePaymentVerified}
                          onVerifyAndPack={onVerifyAndPack}
                          onSaveOrderLogistics={onSaveOrderLogistics}
                          onWhatsAppCustomer={onWhatsAppCustomer}
                          onOpenBill={onOpenBill}
                          onDeleteOrder={onDeleteOrder}
                          dark={dark}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Collapsible Cancelled Orders Drawer in Kanban View */}
          {cancelledInView.length > 0 && (
            <div className={`rounded-2xl border p-3.5 ${cardBg}`}>
              <button
                type="button"
                onClick={() => setShowCancelledDrawer((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-extrabold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Cancelled Orders ({cancelledInView.length})</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showCancelledDrawer ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showCancelledDrawer && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-3.5 mt-3 border-t border-slate-500/15">
                  {cancelledInView.map((order) => (
                    <AdminOrderCard
                      key={order.id}
                      order={order}
                      viewMode={viewMode}
                      copiedOrderId={copiedOrderId}
                      onCopyForRapido={onCopyForRapido}
                      onUpdateOrderStatus={onUpdateOrderStatus}
                      onTogglePaymentVerified={onTogglePaymentVerified}
                      onVerifyAndPack={onVerifyAndPack}
                      onSaveOrderLogistics={onSaveOrderLogistics}
                      onWhatsAppCustomer={onWhatsAppCustomer}
                      onOpenBill={onOpenBill}
                      onDeleteOrder={onDeleteOrder}
                      dark={dark}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
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
                  return (
                    <AdminOrderCard
                      key={order.id}
                      order={order}
                      viewMode={viewMode}
                      nextStatus={col?.nextStatus}
                      nextLabel={col?.nextLabel}
                      copiedOrderId={copiedOrderId}
                      onCopyForRapido={onCopyForRapido}
                      onUpdateOrderStatus={onUpdateOrderStatus}
                      onTogglePaymentVerified={onTogglePaymentVerified}
                      onVerifyAndPack={onVerifyAndPack}
                      onSaveOrderLogistics={onSaveOrderLogistics}
                      onWhatsAppCustomer={onWhatsAppCustomer}
                      onOpenBill={onOpenBill}
                      onDeleteOrder={onDeleteOrder}
                      dark={dark}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
