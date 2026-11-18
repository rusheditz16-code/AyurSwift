'use client';

import React from 'react';
import Link from 'next/link';
import { X, Lock, PhoneCall, MapPin, Clock, ShieldCheck, ExternalLink, HelpCircle } from 'lucide-react';
import { MerchantSettings } from '@/types';
import { LocationInfo } from '@/components/LocationModal';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MerchantSettings;
  currentLocation: LocationInfo;
  onOpenLocationModal: () => void;
}

export function AccountModal({
  isOpen,
  onClose,
  settings,
  currentLocation,
  onOpenLocationModal,
}: AccountModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f8f3] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-[#d6ddce] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#d6ddce] bg-[#e9efdf] flex items-center justify-between">
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
        <div className="p-5 space-y-4 text-xs text-gray-700">
          {/* Location status card */}
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
                <div className="text-[11px] text-emerald-800">{currentLocation.estimate}</div>
              </div>
            </div>
          </div>

          {/* Quick Ordering & Support */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#d6ddce] shadow-2xs space-y-2.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Direct Assistance
            </span>
            <a
              href={`https://wa.me/${settings.merchantWhatsApp}?text=Hello%20AyurSwift,%20I%20need%20help%20with%20an%20order.`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#e9efdf] hover:bg-[#dfe7d2] text-[#143d29] font-bold transition-colors"
            >
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#1d5a3e]" />
                <span>WhatsApp / Call Desk</span>
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
          <div className="flex items-center gap-2 text-[10.5px] text-gray-500 px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1d5a3e] shrink-0" />
            <span>AyurSwift Home Dark Store • Bhavnagar, Gujarat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
