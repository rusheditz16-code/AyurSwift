'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, X, Check, Zap, Truck, Search } from 'lucide-react';
import { DeliveryType } from '@/types';

export interface LocationInfo {
  area: string;
  city: string;
  pincode: string;
  dispatchType: DeliveryType;
  estimate: string;
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
}

const BHAVNAGAR_AREAS = [
  { area: 'Waghawadi Road', pincode: '364002' },
  { area: 'Ghogha Circle / Nilambag', pincode: '364001' },
  { area: 'Subhashnagar / Bharatnagar', pincode: '364001' },
  { area: 'Chitra GIDC / Nari Road', pincode: '364004' },
  { area: 'Kaliyabid / Victoria Park', pincode: '364002' },
  { area: 'Kalanala / Station Road', pincode: '364001' },
  { area: 'Sardarnagar / Takhteshwar', pincode: '364002' },
  { area: 'Bhavnagar City (Central)', pincode: '364001' },
];

export function LocationModal({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}: LocationModalProps) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredAreas = BHAVNAGAR_AREAS.filter(
    (item) =>
      item.area.toLowerCase().includes(search.toLowerCase()) ||
      item.pincode.includes(search)
  );

  return (
    <div
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200 animate-sheet-up sm:animate-modal-pop"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF3] border border-[#BBF7D0] text-[#0C831F] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-950 text-base">
                Change Delivery Location
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                See exact delivery time &amp; charges for your area
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close location selector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3.5 border-b border-gray-100 bg-[#F8FAFC]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Bhavnagar locality or pincode..."
              className="w-full pl-10 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15 font-medium"
            />
          </div>
        </div>

        {/* Areas List */}
        <div className="p-3 max-h-80 overflow-y-auto thin-scrollbar space-y-3">
          <div className="space-y-1">
            <div className="text-[10.5px] font-extrabold text-gray-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Bhavnagar 30–45 Min Express</span>
            </div>

            {filteredAreas.map((item) => {
              const isSelected =
                currentLocation.dispatchType === 'RAPIDO_CITY' &&
                currentLocation.area === item.area;

              return (
                <button
                  key={item.area}
                  type="button"
                  onClick={() => {
                    onSelectLocation({
                      area: item.area,
                      city: 'Bhavnagar',
                      pincode: item.pincode,
                      dispatchType: 'RAPIDO_CITY',
                      estimate: 'Local Express Delivery (30–45 mins)',
                    });
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#ECFDF3] text-[#0A5C16] font-bold border-[#BBF7D0]'
                      : 'border-transparent hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-[#0C831F]' : 'bg-gray-300'
                      }`}
                    />
                    <span className="font-semibold">{item.area}</span>
                    <span className="text-[10.5px] text-gray-400 font-mono">
                      {item.pincode}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#0C831F]" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-1">
            <div className="text-[10.5px] font-extrabold text-gray-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#0C831F]" />
              <span>Outside Bhavnagar (All India)</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onSelectLocation({
                  area: 'Rest of India',
                  city: 'All India',
                  pincode: 'Other',
                  dispatchType: 'COURIER_OUTSIDE',
                  estimate: 'Courier Dispatch (2–4 Days)',
                });
                onClose();
              }}
              className={`w-full text-left px-3 py-3 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                currentLocation.dispatchType === 'COURIER_OUTSIDE'
                  ? 'bg-[#ECFDF3] text-[#0A5C16] font-bold border-[#0C831F]'
                  : 'border-gray-200/80 hover:bg-gray-50 text-gray-800'
              }`}
            >
              <div>
                <div className="font-bold text-gray-900">All Other Cities &amp; Towns</div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Tracked Courier (DTDC / Speed Post) • 100% Prepaid UPI
                </div>
              </div>
              {currentLocation.dispatchType === 'COURIER_OUTSIDE' && (
                <Check className="w-4 h-4 text-[#0C831F] shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#F8FAFC] border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Active: <strong className="text-gray-900">{currentLocation.area}</strong>
          </span>
          <span className="text-[11px] text-[#0C831F] font-extrabold">
            {currentLocation.dispatchType === 'RAPIDO_CITY' ? '⚡ 30–45 Mins' : '📦 2–4 Days'}
          </span>
        </div>
      </div>
    </div>
  );
}
