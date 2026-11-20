'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Zap,
  Package,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Plus,
  IndianRupee,
  ShoppingBag,
} from 'lucide-react';
import { Order, Product } from '@/types';
import { AdminTab } from '@/components/admin/AdminSidebar';

interface AdminOverviewTabProps {
  products: Product[];
  orders: Order[];
  onQuickRestock: (productId: string, delta: number) => void;
  onJumpToDispatch: (statusFilter?: 'ALL' | Order['orderStatus']) => void;
  onJumpToTab: (tab: AdminTab) => void;
  onOpenBill: (order: Order, format?: 'A4' | 'THERMAL') => void;
  dark: boolean;
}

export function AdminOverviewTab({
  products,
  orders,
  onQuickRestock,
  onJumpToDispatch,
  onJumpToTab,
  onOpenBill,
  dark,
}: AdminOverviewTabProps) {
  const [chartMetric, setChartMetric] = useState<'REVENUE' | 'ORDERS'>('REVENUE');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  // Core KPIs
  const metrics = useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    const validOrders = orders.filter((o) => o.orderStatus !== 'CANCELLED');
    const todayOrders = validOrders.filter((o) => (o.createdAt || '').startsWith(todayKey));

    const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalRevenue = validOrders.reduce((s, o) => s + o.totalAmount, 0);
    const codTotal = validOrders
      .filter((o) => o.paymentMethod === 'COD')
      .reduce((s, o) => s + o.totalAmount, 0);
    const upiTotal = validOrders
      .filter((o) => o.paymentMethod === 'UPI')
      .reduce((s, o) => s + o.totalAmount, 0);

    const newCount = orders.filter((o) => o.orderStatus === 'NEW').length;
    const packedCount = orders.filter((o) => o.orderStatus === 'PACKED').length;
    const dispatchedCount = orders.filter((o) => o.orderStatus === 'DISPATCHED').length;
    const deliveredCount = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
    const cancelledCount = orders.filter((o) => o.orderStatus === 'CANCELLED').length;

    const totalCostVal = products.reduce((s, p) => s + p.agencyCostPrice * p.stockQuantity, 0);
    const totalSellVal = products.reduce((s, p) => s + p.sellingPrice * p.stockQuantity, 0);
    const estProfit = totalSellVal - totalCostVal;
    const marginPct = totalSellVal > 0 ? Math.round((estProfit / totalSellVal) * 100) : 0;

    const liveSkus = products.filter((p) => p.isLive && p.stockQuantity > 0).length;
    const lowStockSkus = products
      .filter((p) => p.stockQuantity <= 5)
      .sort((a, b) => a.stockQuantity - b.stockQuantity);

    return {
      todayRevenue,
      todayCount: todayOrders.length,
      totalRevenue,
      codTotal,
      upiTotal,
      newCount,
      packedCount,
      dispatchedCount,
      deliveredCount,
      cancelledCount,
      estProfit,
      marginPct,
      liveSkus,
      lowStockSkus,
    };
  }, [orders, products]);

  // 7-day rolling chart series
  const last7Days = useMemo(() => {
    const days: {
      dateKey: string;
      label: string;
      revenue: number;
      count: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dayOrders = orders.filter(
        (o) => o.orderStatus !== 'CANCELLED' && (o.createdAt || '').startsWith(dateKey)
      );
      days.push({
        dateKey,
        label,
        revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
        count: dayOrders.length,
      });
    }
    return days;
  }, [orders]);

  const maxChartVal = Math.max(
    1,
    ...last7Days.map((d) => (chartMetric === 'REVENUE' ? d.revenue : d.count))
  );

  const cardBg = dark
    ? 'bg-[#111827] border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs';
  const mutedText = dark ? 'text-slate-400' : 'text-slate-500';

  const pipelineStages: {
    status: Order['orderStatus'];
    label: string;
    count: number;
    color: string;
  }[] = [
    { status: 'NEW', label: 'New', count: metrics.newCount, color: 'bg-rose-500' },
    { status: 'PACKED', label: 'Packed', count: metrics.packedCount, color: 'bg-amber-500' },
    { status: 'DISPATCHED', label: 'Dispatched', count: metrics.dispatchedCount, color: 'bg-blue-500' },
    { status: 'DELIVERED', label: 'Delivered', count: metrics.deliveredCount, color: 'bg-emerald-500' },
  ];

  const totalPipeline = Math.max(
    1,
    metrics.newCount + metrics.packedCount + metrics.dispatchedCount + metrics.deliveredCount
  );

  return (
    <div className="space-y-5">
      {/* 1. Executive KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className={`rounded-2xl border p-4 space-y-2 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums">
            ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className={`text-[11px] font-semibold flex items-center justify-between ${mutedText}`}>
            <span>Today: ₹{metrics.todayRevenue.toLocaleString('en-IN')}</span>
            <span className="text-emerald-500 font-bold">
              UPI ₹{metrics.upiTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onJumpToDispatch('NEW')}
          className={`rounded-2xl border p-4 space-y-2 text-left transition-all hover:border-rose-500/50 cursor-pointer ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
              Awaiting Dispatch
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums">
            {metrics.newCount + metrics.packedCount}
          </div>
          <div className="text-[11px] font-bold flex items-center justify-between">
            <span className="text-rose-500">{metrics.newCount} New</span>
            <span className="text-amber-500">{metrics.packedCount} Packed</span>
          </div>
        </button>

        <div className={`rounded-2xl border p-4 space-y-2 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
              Realized Margin
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums text-emerald-500">
            {metrics.marginPct}%
          </div>
          <div className={`text-[11px] font-semibold ${mutedText}`}>
            Est. shelf profit: <strong className={dark ? 'text-white' : 'text-slate-900'}>+₹{metrics.estProfit.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onJumpToTab('INVENTORY')}
          className={`rounded-2xl border p-4 space-y-2 text-left transition-all hover:border-amber-500/50 cursor-pointer ${cardBg}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
              Catalog Health
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tabular-nums">
            {metrics.liveSkus} <span className={`text-sm font-bold ${mutedText}`}>/ {products.length} Live</span>
          </div>
          <div className="text-[11px] font-bold text-amber-500">
            {metrics.lowStockSkus.length} SKU{metrics.lowStockSkus.length === 1 ? '' : 's'} at low/zero stock
          </div>
        </button>
      </div>

      {/* 2. Chart + Fulfillment Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Interactive 7-Day Bar Chart */}
        <div className={`lg:col-span-2 rounded-2xl border p-5 space-y-4 ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-sm">7-Day Performance</h3>
              <p className={`text-[11px] ${mutedText}`}>
                Hover any bar to inspect daily store volume
              </p>
            </div>
            <div
              className={`p-1 rounded-xl flex items-center text-[11px] font-bold ${
                dark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={() => setChartMetric('REVENUE')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'REVENUE'
                    ? dark
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white text-slate-950 shadow-2xs'
                    : mutedText
                }`}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('ORDERS')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'ORDERS'
                    ? dark
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white text-slate-950 shadow-2xs'
                    : mutedText
                }`}
              >
                Orders
              </button>
            </div>
          </div>

          {/* Interactive SVG/Flex Bar Chart */}
          <div className="h-52 pt-6 flex items-end justify-between gap-2 sm:gap-4 relative">
            {last7Days.map((day, idx) => {
              const val = chartMetric === 'REVENUE' ? day.revenue : day.count;
              const pct = Math.max(val > 0 ? 12 : 4, Math.round((val / maxChartVal) * 100));
              const isHovered = hoveredDayIdx === idx;

              return (
                <div
                  key={day.dateKey}
                  onMouseEnter={() => setHoveredDayIdx(idx)}
                  onMouseLeave={() => setHoveredDayIdx(null)}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-2 group relative cursor-pointer"
                >
                  {/* Floating Tooltip */}
                  {isHovered && (
                    <div
                      className={`absolute -top-5 z-10 px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap shadow-lg pointer-events-none tabular-nums ${
                        dark
                          ? 'bg-white text-slate-950'
                          : 'bg-slate-950 text-white'
                      }`}
                    >
                      {chartMetric === 'REVENUE'
                        ? `₹${day.revenue.toLocaleString('en-IN')}`
                        : `${day.count} order${day.count === 1 ? '' : 's'}`}
                    </div>
                  )}

                  <div className="w-full max-w-[44px] flex-1 flex items-end">
                    <div
                      style={{ height: `${pct}%` }}
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        val === 0
                          ? dark
                            ? 'bg-slate-800/80'
                            : 'bg-slate-100'
                          : idx === 6
                          ? 'bg-gradient-to-t from-[#0C831F] to-emerald-400 shadow-md shadow-emerald-500/20'
                          : isHovered
                          ? 'bg-[#0C831F]'
                          : dark
                          ? 'bg-emerald-500/45 group-hover:bg-emerald-500'
                          : 'bg-emerald-500/35 group-hover:bg-[#0C831F]'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      idx === 6
                        ? 'text-emerald-500'
                        : mutedText
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fulfillment Pipeline Breakdown */}
        <div className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 ${cardBg}`}>
          <div>
            <h3 className="font-extrabold text-sm">Fulfillment Funnel</h3>
            <p className={`text-[11px] ${mutedText}`}>
              Click any stage to jump straight into dispatch
            </p>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-3 rounded-full overflow-hidden flex gap-0.5 bg-slate-200/40">
            {pipelineStages.map((st) => (
              <div
                key={st.status}
                style={{ width: `${Math.round((st.count / totalPipeline) * 100)}%` }}
                className={`${st.color} transition-all duration-300`}
                title={`${st.label}: ${st.count}`}
              />
            ))}
          </div>

          <div className="space-y-2">
            {pipelineStages.map((st) => (
              <button
                key={st.status}
                type="button"
                onClick={() => onJumpToDispatch(st.status)}
                className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                  dark
                    ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                  <span>{st.label}</span>
                </span>
                <span className="tabular-nums font-extrabold">{st.count}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onJumpToDispatch('ALL')}
            className="w-full py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
          >
            <span>Open Live Dispatch Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Low-Stock Quick-Restock + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Alert & Quick Restock */}
        <div className={`rounded-2xl border p-5 space-y-3.5 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-sm">Low-Stock Quick Restock</h3>
            </div>
            <button
              type="button"
              onClick={() => onJumpToTab('INVENTORY')}
              className="text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
            >
              Manage All
            </button>
          </div>

          {metrics.lowStockSkus.length === 0 ? (
            <div className={`p-6 rounded-xl text-center text-xs ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
              <span className="font-bold text-emerald-500 block">All shelf stock is healthy!</span>
              <span className={mutedText}>Every SKU has more than 5 units in stock.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto thin-scrollbar pr-1">
              {metrics.lowStockSkus.slice(0, 6).map((sku) => (
                <div
                  key={sku.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    dark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50/80 border-slate-200/70'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{sku.name}</div>
                    <div className="text-[11px] flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`font-extrabold tabular-nums ${
                          sku.stockQuantity === 0 ? 'text-rose-500' : 'text-amber-500'
                        }`}
                      >
                        {sku.stockQuantity === 0
                          ? 'OUT OF STOCK'
                          : `${sku.stockQuantity} left`}
                      </span>
                      <span className={mutedText}>• {sku.packSize}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onQuickRestock(sku.id, 5)}
                      className="px-2.5 py-1 rounded-lg bg-[#ECFDF3] hover:bg-[#DCFCE7] text-[#0C831F] border border-[#BBF7D0] text-[11px] font-extrabold flex items-center gap-0.5 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>5</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickRestock(sku.id, 10)}
                      className="px-2.5 py-1 rounded-lg bg-[#0C831F] hover:bg-[#096B19] text-white text-[11px] font-extrabold flex items-center gap-0.5 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>10</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Incoming Orders */}
        <div className={`rounded-2xl border p-5 space-y-3.5 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
              <h3 className="font-extrabold text-sm">Recent Orders</h3>
            </div>
            <button
              type="button"
              onClick={() => onJumpToDispatch('ALL')}
              className="text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
            >
              View All ({orders.length})
            </button>
          </div>

          {orders.length === 0 ? (
            <div className={`p-6 rounded-xl text-center text-xs ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
              <span className={`font-semibold ${mutedText}`}>
                No orders yet. Storefront orders appear here live every 10 seconds.
              </span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto thin-scrollbar pr-1">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    dark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50/80 border-slate-200/70'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-extrabold text-emerald-500">
                        {order.id}
                      </span>
                      <span className="text-xs font-bold truncate">{order.customerName}</span>
                    </div>
                    <div className={`text-[11px] mt-0.5 ${mutedText}`}>
                      {order.items.length} item{order.items.length === 1 ? '' : 's'} •{' '}
                      <strong className={dark ? 'text-white' : 'text-slate-900'}>
                        ₹{order.totalAmount}
                      </strong>{' '}
                      ({order.paymentMethod})
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        order.orderStatus === 'NEW'
                          ? 'bg-rose-500/15 text-rose-500'
                          : order.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenBill(order, 'A4')}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        dark
                          ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                      title="Open Tax Bill"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
