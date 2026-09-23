'use client';
import React, { useState } from 'react';
import type { CartItem, PromoCode } from '@/lib/types';
import ProductIcon from '@/components/ui/ProductIcon';
import { ShoppingCart, X, Trash2 } from 'lucide-react';

interface CartModalProps {
  open?: boolean;
  cart: CartItem[];
  subtotal: number;
  finalTotal: number;
  discountAmount: number;
  activeDiscountPercent?: number;
  appliedPromoCode?: string;
  activePromo?: PromoCode | null;
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onApplyPromo: (code: string) => { success: boolean; message: string } | boolean;
  onCheckout: () => void;
  showToast: (msg: string) => void;
}

export default function CartModal({
  open = true,
  cart,
  subtotal,
  finalTotal,
  discountAmount,
  activeDiscountPercent = 0,
  appliedPromoCode = '',
  activePromo,
  onClose,
  onUpdateQuantity,
  onRemove,
  onApplyPromo,
  onCheckout,
  showToast,
}: CartModalProps) {
  const [promoInput, setPromoInput] = useState('');

  if (!open) return null;

  const effectiveDiscountPercent = activeDiscountPercent || activePromo?.discount || 0;

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const res = onApplyPromo(promoInput.trim());
    if (typeof res === 'object' && res !== null) {
      if (res.success) {
        showToast(res.message);
        setPromoInput('');
      } else {
        showToast(res.message);
      }
    } else if (res) {
      showToast('✓ Kode voucher berhasil digunakan!');
      setPromoInput('');
    } else {
      showToast('❌ Kode promo tidak valid atau syarat belanja belum terpenuhi.');
    }
  };

  const isEmpty = cart.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[#140509] border border-rose-950/80 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[92vh] modal-pop-in text-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-rose-950/70 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-rose-500" />
            <h3 className="text-sm font-black text-white">Keranjang Belanja</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60">
              {cart.length} Item
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-rose-950/60 flex items-center justify-center text-rose-400/70 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {isEmpty ? (
            <div className="text-center py-10 sm:py-12 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-950/50 border border-rose-900/60 flex items-center justify-center text-rose-400 shadow-inner">
                <ShoppingCart size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-white">Keranjang Belanja Masih Kosong</h3>
                <p className="text-xs text-rose-200/60 max-w-xs mx-auto">Yuk pilih layanan Joki CDID, Blox Fruits, atau Robux &amp; Gamepass impianmu!</p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-red-950/60 transition"
              >
                Mulai Belanja 🚀
              </button>
            </div>
          ) : (
            cart.map(item => {
              const itemSubtotal = item.price * item.quantity;
              return (
                <div key={item.id} className="p-3 sm:p-3.5 rounded-2xl border border-rose-950/80 bg-[#19060d]/80 hover:bg-[#200812] hover:border-rose-700/60 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#0e0306] border border-rose-950/80 flex items-center justify-center shrink-0 shadow-sm overflow-hidden relative">
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
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wide">{item.categoryLabel}</span>
                        {item.variantName && (
                          <span className="text-[9px] font-bold text-rose-300 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-800/60">{item.variantName}</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate mt-0.5">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold text-rose-300/50">@ {item.formattedPrice}</span>
                        <span className="text-xs font-black text-rose-400">Rp {itemSubtotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-950/60">
                    {/* Stepper */}
                    <div className="inline-flex items-center gap-2 bg-[#120408] border border-rose-900/60 rounded-full px-2 py-0.5 shadow-sm">
                      <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-5 h-5 rounded-full hover:bg-rose-950 flex items-center justify-center text-xs font-bold text-rose-300 transition cursor-pointer">-</button>
                      <span className="text-xs font-bold w-4 text-center text-white">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-5 h-5 rounded-full hover:bg-rose-950 flex items-center justify-center text-xs font-bold text-rose-300 transition cursor-pointer">+</button>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="text-rose-400/60 hover:text-red-400 p-1.5 rounded-lg hover:bg-rose-950/50 transition cursor-pointer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="border-t border-rose-950/70 p-4 sm:p-5 space-y-3 shrink-0 bg-[#16050b]/90">
            {/* Promo code */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Kode Voucher (misal: KILAT15)"
                value={promoInput}
                onChange={e => setPromoInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-rose-900/60 bg-[#1d0710] text-white placeholder-rose-300/40 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500"
              />
              <button
                onClick={handleApplyPromo}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition whitespace-nowrap cursor-pointer"
              >
                Pakai
              </button>
            </div>

            {/* Summary */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-rose-200/70">
                <span>Subtotal</span>
                <span className="font-semibold text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Diskon ({effectiveDiscountPercent}%{appliedPromoCode ? ` - ${appliedPromoCode}` : ''})</span>
                  <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white pt-1.5 border-t border-rose-950/70">
                <span>Total Bayar</span>
                <span className="text-rose-400">Rp {finalTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-md shadow-red-950/60 hover:shadow-lg transition cursor-pointer"
            >
              Lanjut ke Pembayaran →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
