'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  Lock,
  PhoneCall,
  MapPin,
  Clock,
  ShieldCheck,
  ExternalLink,
  Package,
  FileText,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { MerchantSettings } from '@/types';
import { LocationInfo } from '@/components/LocationModal';
import { getStoredOrders } from '@/lib/store';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MerchantSettings;
  currentLocation: LocationInfo;
  onOpenLocationModal: () => void;
  onOpenOrderTracking: () => void;
  onOpenPrescriptionModal: () => void;
}

export function AccountModal({
  isOpen,
  onClose,
  settings,
  currentLocation,
  onOpenLocationModal,
  onOpenOrderTracking,
  onOpenPrescriptionModal,
}: AccountModalProps) {
  if (!isOpen) return null;

  const orders = getStoredOrders();
  const latestOrder = orders[0] || null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f8f3] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-[#d6ddce] animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#d6ddce] bg-[#e9efdf] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#1d5a3e] uppercase">
              AyurSwift Bhavnagar
            </span>
            <h3 className="text-lg font-serif font-bold text-[#143d29]">Store &amp; Account</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors shadow-2xs border border-[#d6ddce]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5 text-xs text-gray-700 overflow-y-auto flex-1">
          {/* Active Order Snapshot */}
          {latestOrder ? (
            <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#1d5a3e]" />
                  <span>Latest Order</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e9efdf] text-[#143d29]">
                  {latestOrder.id} • {latestOrder.orderStatus}
                </span>
              </div>
              <p className="text-[11px] text-gray-600">
                {latestOrder.items.length} items • Total: <strong>₹{latestOrder.totalAmount}</strong>
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenOrderTracking();
                }}
                className="w-full bg-[#e9efdf] hover:bg-[#dfe7d2] text-[#143d29] font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Truck className="w-3.5 h-3.5 text-[#1d5a3e]" />
                <span>Track Live Rapido Dispatch</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenOrderTracking();
              }}
              className="w-full bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs flex items-center justify-between hover:border-[#1d5a3e] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#e9efdf] text-[#1d5a3e] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#143d29]">Order History &amp; Tracking</div>
                  <div className="text-[10.5px] text-[#526359]">View past orders &amp; status</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#718277]" />
            </button>
          )}

          {/* Quick Prescription Upload Shortcut */}
          <button
            onClick={() => {
              onClose();
              onOpenPrescriptionModal();
            }}
            className="w-full bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs flex items-center justify-between hover:border-[#1d5a3e] transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#e9efdf] text-[#1d5a3e] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[#143d29]">Upload Prescription / Slip</div>
                <div className="text-[10.5px] text-[#526359]">Instant WhatsApp order in 30 mins</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#718277]" />
          </button>

          {/* Delivery Location card */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Current Delivery Area
              </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenLocationModal();
                }}
                className="text-[11px] font-bold text-[#1d5a3e] hover:underline"
              >
                Change
              </button>
            </div>
            <div className="flex items-center gap-2 text-gray-900">
              <MapPin className="w-4 h-4 text-[#1d5a3e] shrink-0" />
              <div>
                <div className="font-bold">{currentLocation.area}</div>
                <div className="text-[11px] text-[#1d5a3e] font-semibold">{currentLocation.estimate}</div>
              </div>
            </div>
          </div>

          {/* Quick Ordering & Support */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs space-y-2.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Direct Assistance
            </span>
            <a
              href={`https://wa.me/${settings.merchantWhatsApp.replace(/\D/g, '')}?text=Hello%20AyurSwift,%20I%20need%20help%20with%20an%20order.`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#e9efdf] hover:bg-[#dfe7d2] text-[#143d29] font-bold transition-colors"
            >
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#1d5a3e]" />
                <div>
                  <div className="font-bold">WhatsApp / Call Desk</div>
                  <div className="text-[10px] text-[#526359]">+91 96247 66242</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
            </a>

            <div className="flex items-center gap-2 text-[11px] text-gray-600 pt-1">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Dispatch hours: 9:00 AM – 9:30 PM (Daily)</span>
            </div>
          </div>

          {/* Merchant Admin Portal Link */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Store Administration
            </span>
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:border-[#1d5a3e] transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-800 font-semibold">
                <Lock className="w-4 h-4 text-gray-500" />
                <span>Merchant Hub (Inventory &amp; Orders)</span>
              </div>
              <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded">
                PIN
              </span>
            </Link>
          </div>

          {/* Note */}
          <div className="flex items-center gap-2 text-[10.5px] text-gray-500 px-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1d5a3e] shrink-0" />
            <span>AyurSwift Home Dark Store • Bhavnagar, Gujarat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
