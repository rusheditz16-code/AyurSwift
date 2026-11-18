'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  PhoneCall,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { MerchantSettings } from '@/types';
import { LocationInfo } from '@/components/LocationModal';

interface PrescriptionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MerchantSettings;
  currentLocation: LocationInfo;
}

export function PrescriptionUploadModal({
  isOpen,
  onClose,
  settings,
  currentLocation,
}: PrescriptionUploadModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [medicineNotes, setMedicineNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Please upload an image smaller than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) {
      alert('Please enter your WhatsApp mobile number.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    const cleanWhatsApp = settings.merchantWhatsApp.replace(/\D/g, '');

    const message = `🌿 *New Prescription / Quick Slip Order - AyurSwift*
━━━━━━━━━━━━━━━━━━
*Customer Name:* ${customerName.trim() || 'Valued Customer'}
*Phone Number:* ${cleanPhone}
*Delivery Area:* ${currentLocation.area} (${currentLocation.estimate})

*Medicines / Doctor Instructions:*
${medicineNotes.trim() ? medicineNotes.trim() : 'Prescription slip image attached'}

${imagePreview ? '📷 _Prescription image captured - sending in chat_' : ''}
━━━━━━━━━━━━━━━━━━
_Please verify stock at Bhavnagar dark store & confirm Rapido dispatch!_`;

    window.open(`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(message)}`, '_blank');

    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f8f3] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#d6ddce] animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#d6ddce] flex items-center justify-between bg-[#e9efdf] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1d5a3e] text-white flex items-center justify-center shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#143d29] text-base">
                Order via Prescription / Slip
              </h3>
              <p className="text-[11px] text-[#1d5a3e] font-semibold">
                30–45 Mins Rapido delivery across Bhavnagar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors shadow-2xs border border-[#d6ddce]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Slip Upload Area */}
          <div className="space-y-1.5">
            <span className="font-bold text-[#143d29] block">
              1. Upload Photo of Prescription or Written Medicine Slip
            </span>

            {imagePreview ? (
              <div className="relative bg-white rounded-2xl border border-[#d6ddce] p-3 flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Prescription Preview"
                  className="w-16 h-16 object-cover rounded-xl border border-[#d6ddce]"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#143d29] truncate flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1d5a3e]" />
                    <span>Slip Photo Attached</span>
                  </div>
                  <div className="text-[10px] text-[#526359]">
                    Our pharmacist will review dosage and prepare items
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#d6ddce] hover:border-[#1d5a3e] bg-white rounded-2xl p-5 text-center cursor-pointer transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#e9efdf] text-[#1d5a3e] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="font-bold text-xs text-[#143d29]">
                  Take Photo or Upload Slip
                </p>
                <p className="text-[10.5px] text-[#526359] mt-0.5">
                  Doctor prescription, handwritten list, or previous bottle photo (PNG, JPG)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Or Type Medicine Names */}
          <div className="space-y-1">
            <label className="font-bold text-[#143d29] block">
              2. Or Type Medicines Required (Optional)
            </label>
            <textarea
              rows={3}
              value={medicineNotes}
              onChange={(e) => setMedicineNotes(e.target.value)}
              placeholder="e.g. Zandu Balm 25g, Dabur Pudin Hara 1 strip, Baidyanath Mahanarayan Tel 100ml..."
              className="w-full p-2.5 text-xs bg-white border border-[#d6ddce] rounded-xl text-[#143d29] placeholder:text-[#718277] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
            />
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-[#d6ddce]">
            <span className="font-bold text-[#143d29] block">
              3. Delivery Contact Information
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-[#526359] mb-0.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Nilesh Shah"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-lg text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#526359] mb-0.5">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit number"
                  maxLength={10}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#f8f8f3] border border-[#d6ddce] rounded-lg text-[#143d29] focus:outline-none focus:ring-1 focus:ring-[#1d5a3e]"
                  required
                />
              </div>
            </div>

            <div className="p-2 bg-[#e9efdf] rounded-xl flex items-center gap-2 text-[11px] text-[#143d29]">
              <Zap className="w-3.5 h-3.5 text-[#c86326] fill-[#c86326] shrink-0" />
              <span>
                Dispatching to: <strong>{currentLocation.area}</strong> ({currentLocation.estimate})
              </span>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-2 gap-2 text-[10.5px] text-[#526359]">
            <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-[#d6ddce]">
              <ShieldCheck className="w-4 h-4 text-[#1d5a3e] shrink-0" />
              <span>Agency Invoiced GST Stock</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-[#d6ddce]">
              <Clock className="w-4 h-4 text-[#1d5a3e] shrink-0" />
              <span>Rapido Rider in 30–45m</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              className="w-full bg-[#1d5a3e] hover:bg-[#143d29] text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Send Slip via WhatsApp (Instant Dispatch)</span>
            </button>
            {isSent && (
              <p className="text-center text-xs font-bold text-[#1d5a3e] mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Prescription sent! Dark store team connecting...
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
