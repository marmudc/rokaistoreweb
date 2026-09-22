'use client';
import React, { useState } from 'react';
import type { CartItem } from '@/lib/types';
import ProductIcon from '@/components/ui/ProductIcon';
import { X, ShoppingCart } from 'lucide-react';

interface CartModalProps {
  open: boolean;
  cart: CartItem[];
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  activeDiscountPercent: number;
  appliedPromoCode: string;
  onClose: () => void;
  onUpdateQuantity: (id: string, change: number) => void;
  onRemove: (id: string) => void;
  onApplyPromo: (code: string) => { success: boolean; message: string };
  onCheckout: () => void;
  showToast: (msg: string) => void;
}

export default function CartModal({
  open, cart, subtotal, discountAmount, finalTotal, activeDiscountPercent,
  onClose, onUpdateQuantity, onRemove, onApplyPromo, onCheckout, showToast
}: CartModalProps) {
  const [promoInput, setPromoInput] = useState('');

  if (!open) return null;

  const handleApplyPromo = () => {
    const result = onApplyPromo(promoInput);
    showToast(result.message);
    if (result.success) setPromoInput('');
  };

  const isEmpty = cart.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] modal-pop-in">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-purple-600" />
            <h3 className="text-sm font-black text-slate-900">Keranjang Belanja</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
              {cart.length} Item
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {isEmpty ? (
            <div className="text-center py-10 sm:py-12 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-pink-50 to-purple-50 border border-purple-100/60 flex items-center justify-center text-purple-400 shadow-inner">
                <ShoppingCart size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">Keranjang Belanja Masih Kosong</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Yuk pilih layanan Joki CDID, Blox Fruits, atau Robux &amp; Gamepass impianmu!</p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition"
              >
                Mulai Belanja 🚀
              </button>
            </div>
          ) : (
            cart.map(item => {
              const itemSubtotal = item.price * item.quantity;
              return (
                <div key={item.id} className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-purple-200 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden relative">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <ProductIcon type={item.iconType} className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wide">{item.categoryLabel}</span>
                        {item.variantName && (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">{item.variantName}</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold text-slate-400">@ {item.formattedPrice}</span>
                        <span className="text-xs font-extrabold text-pink-600">Rp {itemSubtotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Stepper */}
                    <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-2 py-0.5 shadow-sm">
                      <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 transition">-</button>
                      <span className="text-xs font-bold w-4 text-center text-slate-800">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 transition">+</button>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="border-t border-slate-100 p-4 sm:p-5 space-y-3 shrink-0">
            {/* Promo code */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Kode Voucher (misal: KILAT15)"
                value={promoInput}
                onChange={e => setPromoInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
              />
              <button
                onClick={handleApplyPromo}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition whitespace-nowrap"
              >
                Pakai
              </button>
            </div>

            {/* Summary */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Diskon ({activeDiscountPercent}%)</span>
                  <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-100">
                <span>Total Bayar</span>
                <span className="text-pink-600">Rp {finalTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition"
            >
              Lanjut ke Pembayaran →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
