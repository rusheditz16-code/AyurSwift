'use client';

import React, { useState } from 'react';
import { X, Zap, Plus, Check, PhoneCall, ArrowRight } from 'lucide-react';
import { Product, CartItem, MerchantSettings } from '@/types';

interface QuickBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  cart: CartItem[];
  onAddToCart: (p: Product) => void;
  onOpenCart: () => void;
  settings: MerchantSettings;
}

export function QuickBuyModal({
  isOpen,
  onClose,
  products,
  cart,
  onAddToCart,
  onOpenCart,
  settings,
}: QuickBuyModalProps) {
  const [typedList, setTypedList] = useState('');
  const [sentWhatsapp, setSentWhatsapp] = useState(false);

  if (!isOpen) return null;

  const quickItems = products
    .filter((p) => p.isLive && p.stockQuantity > 0)
    .slice(0, 5);

  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = cart.reduce((acc, i) => acc + i.product.sellingPrice * i.quantity, 0);

  const handleSendCustomList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedList.trim()) return;

    const message = encodeURIComponent(
      `Hello AyurSwift! I want to order the following medicines:\n\n${typedList.trim()}\n\nPlease confirm availability and dispatch via Rapido in Bhavnagar.`
    );
    window.open(`https://wa.me/${settings.merchantWhatsApp}?text=${message}`, '_blank');
    setSentWhatsapp(true);
    setTimeout(() => {
      setSentWhatsapp(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f8f3] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#d6ddce] animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#d6ddce] flex items-center justify-between bg-[#e9efdf]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1d5a3e] text-white flex items-center justify-center shadow-2xs">
              <Zap className="w-5 h-5 fill-[#c86326] text-[#c86326]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-[#143d29] text-base">Quick Buy &amp; Fast Order</h3>
                <span className="bg-[#c86326] text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Express
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Add top remedies in 1-tap or submit your handwritten list via WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors shadow-2xs border border-[#d6ddce]"
            aria-label="Close Quick Buy"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-5">
          {/* Section 1: Fast-Tap Top Essentials */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>⚡ Top In-Stock Essentials (1-Tap Add)</span>
              <span className="text-[11px] text-[#1d5a3e] font-semibold">Ready in Bhavnagar</span>
            </h4>

            <div className="space-y-2">
              {quickItems.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const qty = inCart ? inCart.quantity : 0;

                return (
                  <div
                    key={product.id}
                    className="p-2.5 rounded-2xl border border-[#d6ddce] bg-white flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {product.name}
                        </span>
                        <span className="text-[10px] text-gray-500 shrink-0 font-medium">
                          ({product.packSize})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="font-bold text-gray-900">
                          ₹{product.sellingPrice}
                        </span>
                        <span className="text-[10px] text-gray-400 line-through">
                          MRP ₹{product.mrp}
                        </span>
                        <span className="text-[10px] text-[#c86326] font-bold">
                          {Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)}% OFF
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onAddToCart(product)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                        qty > 0
                          ? 'bg-[#1d5a3e] text-white'
                          : 'bg-white border border-[#1d5a3e] text-[#1d5a3e] hover:bg-[#e9efdf]'
                      }`}
                    >
                      {qty > 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{qty} Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Quick WhatsApp List Form */}
          <div className="pt-2 border-t border-[#d6ddce]">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#1d5a3e]" />
              <span>Or Order Any Remedy via WhatsApp</span>
            </h4>
            <p className="text-xs text-gray-500 mb-2.5">
              Have a doctor’s slip or specific brand in mind? Type names below:
            </p>

            <form onSubmit={handleSendCustomList} className="space-y-2">
              <textarea
                value={typedList}
                onChange={(e) => setTypedList(e.target.value)}
                placeholder="Example: 1x Zandu Balm, 2x Pudin Hara, 1x Liv.52 Tablets..."
                rows={3}
                className="w-full text-xs p-3 border border-[#d6ddce] rounded-xl focus:outline-none focus:border-[#1d5a3e] focus:ring-1 focus:ring-[#1d5a3e] bg-white"
              />
              <button
                type="submit"
                className="w-full bg-[#1d5a3e] hover:bg-[#143d29] text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
              >
                <span>💬</span>
                <span>{sentWhatsapp ? 'Opening WhatsApp...' : 'Send List to WhatsApp Desk'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Sticky Footer: Cart shortcut */}
        {cartCount > 0 && (
          <div className="p-3 bg-[#e9efdf] border-t border-[#d6ddce] flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-[#143d29]">
                {cartCount} item{cartCount > 1 ? 's' : ''} in basket
              </span>
              <span className="text-[#1d5a3e] ml-1.5 font-bold">₹{cartTotal}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="bg-[#1d5a3e] hover:bg-[#143d29] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>View Basket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
