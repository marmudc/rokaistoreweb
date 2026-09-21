'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { subscribeToProofGallery } from '@/lib/firebaseSync';
import type { ProofItem } from '@/lib/types';
import { ShieldCheck, Star } from 'lucide-react';

interface ProofGalleryProps {
  initialLimit?: number;
}

export default function ProofGallery({ initialLimit = 4 }: ProofGalleryProps) {
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [limit, setLimit] = useState<number>(initialLimit);

  // Real-time listener for Firestore proofs collection
  useEffect(() => {
    const unsub = subscribeToProofGallery((items) => {
      setProofs(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    proofs.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return [
      { id: 'all', label: 'Semua' },
      ...Array.from(cats).map((c) => ({ id: c, label: c })),
    ];
  }, [proofs]);

  const filtered = useMemo(() => {
    let list = proofs;
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    return list.slice(0, limit);
  }, [proofs, selectedCategory, limit]);

  if (loading || proofs.length === 0) {
    return null;
  }

  let imageCounter = 0;

  return (
    <div className="space-y-4">
      {/* Header with limitation & filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Bukti Transaksi Nyata</h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Terverifikasi</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Semua pesanan diverifikasi langsung oleh tim FableMart ({filtered.length} dari {proofs.length} bukti ditampilkan)
          </p>
        </div>

        {/* Category Filter Pills (Limitation Control) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {filtered.map((proof) => {
          const hasImage = Boolean(proof.image);
          let isLcpCandidate = false;
          if (hasImage) {
            imageCounter++;
            if (imageCounter === 1) {
              isLcpCandidate = true;
            }
          }

          return (
            <div
              key={proof.id}
              className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 overflow-hidden shadow-soft card-hover-effect flex flex-col group"
            >
              {/* Image Container */}
              <div className="h-28 sm:h-36 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                {proof.image ? (
                  <Image
                    src={proof.image}
                    alt={proof.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
                    priority={isLcpCandidate}
                    loading={isLcpCandidate ? 'eager' : 'lazy'}
                    className="object-cover group-hover:scale-105 transition duration-500 opacity-85"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-950 p-3 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] font-mono text-indigo-400">ORDER-SUCCESS</span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400">{proof.category}</span>
                    </div>
                    <div className="text-center py-1 sm:py-2">
                      <span className="text-sm sm:text-base font-black text-white tracking-wider truncate block">
                        {proof.title}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-emerald-400 block font-semibold">
                        + Transaksi Berhasil
                      </span>
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-slate-500 font-mono text-right">
                      VERIFIED TRANSAKSI
                    </div>
                  </div>
                )}
                <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] sm:text-[10px] font-bold shadow-sm backdrop-blur-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {proof.status}
                </span>
              </div>

              {/* Info */}
              <div className="p-2.5 sm:p-3.5 space-y-0.5 sm:space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{proof.title}</h4>
                  <div className="flex items-center text-amber-400 shrink-0">
                    {Array.from({ length: proof.rating || 5 }).map((_, i) => (
                      <Star key={i} size={10} className="fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Pesanan oleh: <span className="font-semibold text-purple-600">{proof.customer}</span>
                </p>
                <p className="text-[10px] text-slate-400 line-clamp-1">{proof.details}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
