'use client';

import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const filteredAreas = BHAVNAGAR_AREAS.filter((item) =>
    item.area.toLowerCase().includes(search.toLowerCase()) ||
    item.pincode.includes(search)
  );

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f8f3] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#d6ddce] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#d6ddce] flex items-center justify-between bg-[#e9efdf]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1d5a3e] text-white flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#143d29] text-base">
                Delivery Location
              </h3>
              <p className="text-[11px] text-[#1d5a3e] font-semibold">
                Select your area for local express or courier dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors shadow-2xs border border-[#d6ddce]"
            aria-label="Close location selector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#d6ddce] bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Bhavnagar locality or pincode..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#d6ddce] rounded-xl focus:outline-none focus:border-[#1d5a3e] focus:ring-1 focus:ring-[#1d5a3e]"
            />
          </div>
        </div>

        {/* Options */}
        <div className="p-3 max-h-72 overflow-y-auto space-y-1.5 divide-y divide-gray-100">
          <div className="pb-1">
            <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#c86326] fill-[#c86326]" />
              <span>Local Express Delivery (Bhavnagar)</span>
            </div>

            {filteredAreas.map((item) => {
              const isSelected =
                currentLocation.dispatchType === 'RAPIDO_CITY' &&
                currentLocation.area === item.area;

              return (
                <button
                  key={item.area}
                  onClick={() => {
                    onSelectLocation({
                      area: item.area,
                      city: 'Bhavnagar',
                      pincode: item.pincode,
                      dispatchType: 'RAPIDO_CITY',
                      estimate: '30–45m Rapido',
                    });
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#e9efdf] text-[#143d29] font-bold border border-[#d6ddce]'
                      : 'hover:bg-white text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1d5a3e]" />
                    <span>{item.area}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ({item.pincode})
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#1d5a3e]" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
              <Truck className="w-3 h-3 text-blue-600" />
              <span>Outside Bhavnagar / All-India</span>
            </div>

            <button
              onClick={() => {
                onSelectLocation({
                  area: 'Outside Bhavnagar (Rest of India)',
                  city: 'All India',
                  pincode: 'Other',
                  dispatchType: 'COURIER_OUTSIDE',
                  estimate: '2–4 Days Courier',
                });
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                currentLocation.dispatchType === 'COURIER_OUTSIDE'
                  ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                  : 'hover:bg-white text-gray-800'
              }`}
            >
              <div>
                <div className="font-semibold">All Other Cities &amp; Towns</div>
                <div className="text-[10px] text-gray-500">
                  Shipped via Speed Post / DTDC in bubble-wrapped boxes
                </div>
              </div>
              {currentLocation.dispatchType === 'COURIER_OUTSIDE' && (
                <Check className="w-4 h-4 text-blue-700" />
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#e9efdf] border-t border-[#d6ddce] flex items-center justify-between text-xs text-gray-600">
          <span>Active: <strong className="text-[#143d29]">{currentLocation.area}</strong></span>
          <span className="text-[11px] text-[#1d5a3e] font-bold">{currentLocation.estimate}</span>
        </div>
      </div>
    </div>
  );
}
