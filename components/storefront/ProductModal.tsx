'use client';
import React, { useState, useEffect } from 'react';
import type { Product, ProductVariant, CartItem } from '@/lib/types';
import { X } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
  onBuyNow: (item: Omit<CartItem, 'quantity'>) => void;
}

export default function ProductModal({ product, onClose, onAddToCart, onBuyNow }: ProductModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (product) {
      const def = product.variants?.find(v => v.isDefault) ?? product.variants?.[0] ?? null;
      setSelectedVariant(def);
    }
  }, [product]);

  if (!product) return null;

  const currentPrice = selectedVariant ? selectedVariant.formattedPrice : product.formattedPrice;

  function buildCartItem(): Omit<CartItem, 'quantity'> {
    return {
      id: selectedVariant ? `${product!.id}-${selectedVariant.id}` : product!.id,
      baseId: product!.id,
      title: product!.title,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      categoryLabel: product!.categoryLabel,
      iconType: product!.iconType,
      price: selectedVariant?.price ?? product!.price,
      formattedPrice: selectedVariant?.formattedPrice ?? product!.formattedPrice,
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] modal-pop-in">
        <div className="p-4 sm:p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <span className={`text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${product.categoryBadgeColor} uppercase tracking-wider`}>
              {product.categoryLabel}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
              <X size={18} />
            </button>
          </div>

          {/* Title & meta */}
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">{product.title}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-amber-500 font-bold">★ {product.rating}</span>
              <span>•</span>
              <span>{product.sales}</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">Stok Siap Kirim</span>
            </div>
          </div>

          {/* Description */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi Layanan</div>
            <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2.5 p-3 sm:p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100/80">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  <span>Pilihan Varian Paket:</span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-black text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200 shadow-sm">
                  {selectedVariant?.name ?? '-'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.variants.map(v => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`text-left p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-white text-purple-950 ring-2 ring-purple-500/20 shadow-sm'
                          : 'border-slate-200 bg-white/70 hover:border-purple-300 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-purple-950 font-black' : 'text-slate-800'}`}>{v.name}</div>
                        <div className="text-[11px] font-extrabold text-pink-600 mt-1">{v.formattedPrice}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-2">
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Keunggulan Paket:</div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Harga Varian Terpilih</span>
              <span className="text-xl sm:text-2xl font-black text-pink-600">{currentPrice}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onAddToCart(buildCartItem()); onClose(); }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold text-xs transition text-center cursor-pointer"
              >
                + Keranjang
              </button>
              <button
                onClick={() => { onAddToCart(buildCartItem()); onBuyNow(buildCartItem()); onClose(); }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition text-center cursor-pointer"
              >
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
