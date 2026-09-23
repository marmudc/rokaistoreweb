'use client';
import React, { useState } from 'react';
import type { Product, ProductVariant, CartItem } from '@/lib/types';
import { X, Check } from 'lucide-react';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onBuyNow: (item: CartItem) => void;
}

export default function ProductModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}: ProductModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants?.[0]
  );

  const currentPrice = selectedVariant ? selectedVariant.formattedPrice : product.formattedPrice;
  const currentNumericPrice = selectedVariant ? selectedVariant.price : product.price;

  const buildCartItem = (): CartItem => {
    return {
      id: `${product.id}-${selectedVariant?.id ?? 'default'}`,
      baseId: product.id,
      title: product.title,
      price: currentNumericPrice,
      formattedPrice: currentPrice,
      quantity: 1,
      variantName: selectedVariant?.name ?? null,
      variantId: selectedVariant?.id ?? null,
      categoryLabel: product.categoryLabel,
      iconType: product.iconType,
      image: product.image,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-[#140509] border border-rose-950/80 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-y-auto max-h-[92vh] modal-pop-in text-slate-100">
        <div className="p-4 sm:p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <span className={`text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-800/60 bg-rose-950/60 text-rose-300 uppercase tracking-wider`}>
              {product.categoryLabel}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-rose-950/60 flex items-center justify-center text-rose-400/70 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Product Image Banner */}
          {product.image && (
            <div className="w-full h-40 sm:h-52 rounded-2xl overflow-hidden border border-rose-950/80 bg-[#0e0306] relative shadow-inner">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Title & meta */}
          <div>
            <h2 className="text-base sm:text-lg font-black text-white leading-snug">{product.title}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs text-rose-300/60">
              <span className="flex items-center gap-1 text-amber-400 font-bold">★ {product.rating}</span>
              <span>•</span>
              <span>{product.sales}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Stok Siap Kirim</span>
            </div>
          </div>

          {/* Description */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#1a070e]/80 border border-rose-950/70">
            <div className="text-[10px] sm:text-[11px] font-bold text-rose-300/60 uppercase tracking-wider mb-1.5">Deskripsi Layanan</div>
            <p className="text-xs text-rose-100/80 leading-relaxed">{product.description}</p>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2.5 p-3 sm:p-3.5 rounded-2xl bg-[#1d0811]/90 border border-rose-900/60">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-rose-300 uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  <span>Pilihan Varian Paket:</span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-black text-rose-300 bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-800/60 shadow-sm">
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
                          ? 'border-rose-500 bg-rose-950/90 text-white ring-2 ring-rose-500/30 shadow-sm'
                          : 'border-rose-950/80 bg-[#16060c] hover:border-rose-800/80 text-rose-200/80 hover:bg-[#1f0912]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-white font-black' : 'text-slate-200'}`}>{v.name}</div>
                        <div className="text-[11px] font-extrabold text-rose-400 mt-1">{v.formattedPrice}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-rose-500 bg-rose-600 text-white' : 'border-rose-900/60 bg-[#140509]'}`}>
                        {isSelected && (
                          <Check size={10} className="stroke-[3]" />
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
            <div className="text-[10px] sm:text-[11px] font-bold text-rose-300/60 uppercase tracking-wider">Keunggulan Paket:</div>
            <ul className="space-y-1.5 text-xs text-rose-100/80">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-rose-950/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-rose-300/50 block font-medium">Harga Varian Terpilih</span>
              <span className="text-xl sm:text-2xl font-black text-rose-400">{currentPrice}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onAddToCart(buildCartItem()); onClose(); }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full border border-rose-800/60 hover:bg-rose-950/60 text-rose-300 font-bold text-xs transition text-center cursor-pointer"
              >
                + Keranjang
              </button>
              <button
                onClick={() => { onAddToCart(buildCartItem()); onBuyNow(buildCartItem()); onClose(); }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-red-950/60 hover:shadow-lg transition text-center cursor-pointer"
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
