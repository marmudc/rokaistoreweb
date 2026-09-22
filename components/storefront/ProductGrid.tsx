'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { categories } from '@/lib/storeData';
import { subscribeToProducts } from '@/lib/firebaseSync';
import type { Product } from '@/lib/types';
import ProductIcon from '@/components/ui/ProductIcon';
import { Search, X } from 'lucide-react';

interface ProductGridProps {
  onOpenProduct: (product: Product) => void;
  initialCategory?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function ProductGrid({
  onOpenProduct,
  initialCategory = 'all',
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}: ProductGridProps) {
  const [currentCategory, setCurrentCategory] = useState(initialCategory);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync category when initialCategory prop changes (e.g. from Hero Banner CTA click)
  useEffect(() => {
    if (initialCategory) {
      setCurrentCategory(initialCategory);
    }
  }, [initialCategory]);

  // Real-time sync with Cloud Firestore products collection
  useEffect(() => {
    const unsub = subscribeToProducts((prods) => {
      setAllProducts(prods);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = (val: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
  };

  const filtered = useMemo(() => {
    let result = allProducts;
    if (currentCategory !== 'all') {
      result = result.filter(p => p.category === currentCategory);
    }
    if (activeSearchQuery.trim()) {
      const q = activeSearchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allProducts, currentCategory, activeSearchQuery]);

  return (
    <div id="products-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">Katalog Layanan</h2>
          <p className="text-[11px] text-slate-400 font-medium">
            {loading ? 'Memuat layanan dari Cloud Firestore...' : `${allProducts.length} layanan tersedia dengan jaminan keamanan transaksi`}
          </p>
        </div>
        {/* Search */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari layanan..."
            value={activeSearchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent w-48 sm:w-56 transition"
          />
          {activeSearchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2 text-slate-400 hover:text-slate-600"
              aria-label="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-4 sm:mb-5 overflow-x-auto no-scrollbar pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCurrentCategory(cat.id)}
            className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full transition-all duration-200 text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
              currentCategory === cat.id
                ? 'bg-purple-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <button
          onClick={() => { setCurrentCategory('all'); handleSearchChange(''); }}
          className="ml-auto text-[11px] text-purple-600 font-bold hover:underline whitespace-nowrap"
        >
          Lihat Semua
        </button>
      </div>

      {/* Product Grid / Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3 shadow-soft animate-shimmer"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-200/70" />
                <div className="w-16 h-5 rounded-full bg-slate-200/70" />
              </div>
              <div className="space-y-2 pt-1">
                <div className="w-3/4 h-4 rounded-md bg-slate-200/80" />
                <div className="w-full h-3 rounded bg-slate-100" />
                <div className="w-2/3 h-3 rounded bg-slate-100" />
              </div>
              <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between">
                <div className="w-20 h-4 rounded bg-slate-200/80" />
                <div className="w-8 h-8 rounded-xl bg-slate-200/70" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
            <Search size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Produk Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500">Coba kata kunci lain atau pilih kategori berbeda</p>
          <button
            onClick={() => { setCurrentCategory('all'); handleSearchChange(''); }}
            className="px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filtered.map(item => {
            const hasVariants = item.variants && item.variants.length > 1;
            const minPrice = hasVariants ? Math.min(...item.variants.map(v => v.price)) : item.price;
            const minFormattedPrice = hasVariants ? `Rp ${minPrice.toLocaleString('id-ID')}` : item.formattedPrice;

            return (
              <article
                key={item.id}
                onClick={() => onOpenProduct(item)}
                className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-200/80 shadow-soft card-hover-effect flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Image / Icon box */}
                  <div className="w-full h-24 sm:h-32 bg-slate-50/90 group-hover:bg-purple-50/40 rounded-lg sm:rounded-xl border border-slate-100 flex items-center justify-center relative overflow-hidden transition duration-300">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <ProductIcon type={item.iconType} />
                    )}
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-white/95 text-slate-800 text-[11px] font-bold shadow-md">
                        Pilih Varian &amp; Detail
                      </span>
                    </div>
                  </div>

                  {/* Category & variant badge */}
                  <div className="mt-2 sm:mt-3 flex items-center justify-between gap-1.5 flex-wrap">
                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${item.categoryBadgeColor} uppercase tracking-wider`}>
                      {item.categoryLabel}
                    </span>
                    {hasVariants && (
                      <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/80 flex items-center gap-1">
                        <svg className="w-2.5 h-2.5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                        {item.variants.length} Varian
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-purple-600 transition-colors line-clamp-2 mt-1 sm:mt-1.5 leading-snug min-h-[32px] sm:min-h-[38px]">
                    {item.title}
                  </h3>
                </div>

                {/* Price & Rating */}
                <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-0">
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 block">{hasVariants ? 'Mulai dari' : 'Harga'}</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">{minFormattedPrice}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 justify-between sm:justify-end">
                    <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[11px] sm:text-xs">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{item.rating}</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{item.sales}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
