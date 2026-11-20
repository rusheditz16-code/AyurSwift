'use client';

import React, { useState, useEffect } from 'react';
import { X, Zap, Plus, Check, PhoneCall, ArrowRight, MessageCircle } from 'lucide-react';
import { Product, CartItem, MerchantSettings } from '@/types';
import { MedicinePackVisual } from '@/components/MedicinePackVisual';

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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickItems = products
    .filter((p) => p.isLive && p.stockQuantity > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 6);

  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = cart.reduce((acc, i) => acc + i.product.sellingPrice * i.quantity, 0);

  const handleSendCustomList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedList.trim()) return;

    const message = encodeURIComponent(
      `Hello AyurSwift! I want to order the following medicines:\n\n${typedList.trim()}\n\nPlease confirm availability and delivery.`
    );
    window.open(`https://wa.me/${settings.merchantWhatsApp}?text=${message}`, '_blank');
    setSentWhatsapp(true);
    setTimeout(() => {
      setSentWhatsapp(false);
      onClose();
    }, 2200);
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 animate-sheet-up sm:animate-modal-pop flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-950 text-base">Quick Buy Express</h3>
                <span className="bg-[#ECFDF3] text-[#0C831F] border border-[#BBF7D0] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  30 Mins
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                1-tap top essentials or send a custom medicine list via WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Quick Buy"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto thin-scrollbar space-y-5 bg-[#F8FAFC]">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">
                ⚡ Top In-Stock Essentials
              </h4>
              <span className="text-[11px] text-[#0C831F] font-bold">Ready now</span>
            </div>

            <div className="space-y-2">
              {quickItems.map((product) => {
                const qty = cart.find((i) => i.product.id === product.id)?.quantity ?? 0;
                const discount = Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100);

                return (
                  <div
                    key={product.id}
                    className="p-2.5 rounded-2xl border border-gray-200/85 bg-white flex items-center justify-between gap-3 shadow-2xs hover:border-[#0C831F]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 p-1 flex items-center justify-center shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <MedicinePackVisual product={product} className="w-full h-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                          <span className="font-extrabold text-gray-950 tabular-nums">
                            ₹{product.sellingPrice}
                          </span>
                          {product.mrp > product.sellingPrice && (
                            <span className="text-[10px] text-gray-400 line-through tabular-nums">
                              ₹{product.mrp}
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="text-[10px] text-[#0C831F] font-extrabold">
                              {discount}% OFF
                            </span>
                          )}
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500 truncate">{product.packSize}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 active:scale-95 shrink-0 cursor-pointer ${
                        qty > 0
                          ? 'bg-[#0C831F] text-white'
                          : 'bg-[#F2FBF4] border border-[#0C831F] text-[#0C831F] hover:bg-[#0C831F] hover:text-white'
                      }`}
                    >
                      {qty > 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="tabular-nums">{qty}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>ADD</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Custom List */}
          <div className="bg-white rounded-2xl border border-gray-200/85 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-900">
              <PhoneCall className="w-3.5 h-3.5 text-[#0C831F]" />
              <span>Order Custom Medicine List via WhatsApp</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Need an item not listed here? Type medicine names &amp; quantities:
            </p>
            <form onSubmit={handleSendCustomList} className="space-y-2.5">
              <textarea
                value={typedList}
                onChange={(e) => setTypedList(e.target.value)}
                placeholder="e.g. 1x Zandu Balm 25g, 2x Pudin Hara Pearls, 1x Liv.52 Tablets..."
                rows={3}
                className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/15 resize-none"
              />
              <button
                type="submit"
                className="w-full bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-extrabold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{sentWhatsapp ? 'Opening WhatsApp...' : 'Send List to WhatsApp Desk'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Sticky Cart Shortcut */}
        {cartCount > 0 && (
          <div className="p-3.5 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
            <div className="text-xs">
              <span className="font-bold text-gray-600">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in cart •{' '}
              </span>
              <span className="font-extrabold text-gray-950 text-sm tabular-nums">
                ₹{cartTotal}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
