'use client';
import React, { useState } from 'react';
import type { PromoCode } from '@/lib/types';

interface PromosTabProps {
  adminPromos: PromoCode[];
  onToggle: (code: string) => void;
  onAdd: (promo: PromoCode) => void;
  onDelete: (code: string) => void;
  onClearAll?: () => void;
  showToast: (msg: string) => void;
}

export default function PromosTab({ adminPromos, onToggle, onAdd, onDelete, onClearAll, showToast }: PromosTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount: '', minSpend: '0' });

  function handleAdd() {
    if (!form.code || !form.discount) { showToast('Lengkapi kode dan besaran diskon'); return; }
    const newPromo: PromoCode = {
      code: form.code.toUpperCase(),
      discount: parseInt(form.discount),
      minSpend: parseInt(form.minSpend) || 0,
      active: true,
      usage: 0,
    };
    onAdd(newPromo);
    setForm({ code: '', discount: '', minSpend: '0' });
    setShowForm(false);
    showToast(`✓ Kode promo ${newPromo.code} berhasil ditambahkan`);
  }

  function handleDelete(code: string) {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus kode promo "${code}"?`);
      if (!confirmed) return;
    }
    onDelete(code);
    showToast(`✓ Kode promo ${code} berhasil dihapus.`);
  }

  function handleClearAll() {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Apakah Anda yakin ingin menghapus SEMUA (${adminPromos.length}) voucher promo? Tindakan ini tidak dapat dibatalkan.`
      );
      if (!confirmed) return;
    }
    if (onClearAll) {
      onClearAll();
      showToast('✓ Seluruh kode promo berhasil dihapus.');
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">Manajemen Voucher & Promo</h3>
          <p className="text-[11px] text-slate-400">{adminPromos.filter(p => p.active).length} voucher aktif tersedia untuk pelanggan</p>
        </div>
        <div className="flex items-center gap-2">
          {adminPromos.length > 0 && onClearAll && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Hapus Semua
            </button>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            + Tambah Kode Promo
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
          <h4 className="text-xs font-black text-slate-800">Tambah Kode Promo Baru</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Kode Voucher *</label>
              <input
                type="text"
                placeholder="Contoh: PROMO20"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Diskon (%) *</label>
              <input
                type="number"
                placeholder="Contoh: 15"
                min="1"
                max="100"
                value={form.discount}
                onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Min. Belanja (Rp)</label>
              <input
                type="number"
                placeholder="0 = tanpa minimum"
                value={form.minSpend}
                onChange={e => setForm(f => ({ ...f, minSpend: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer">Simpan Promo</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold transition cursor-pointer hover:bg-slate-50">Batal</button>
          </div>
        </div>
      )}

      {/* Promo list */}
      {adminPromos.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            🏷️
          </div>
          <h4 className="text-sm font-bold text-slate-800">Belum Ada Voucher / Kode Promo</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Tidak ada kode promo bawaan. Anda dapat membuat voucher baru untuk memberikan diskon bagi pelanggan toko.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            + Buat Promo Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {adminPromos.map(promo => (
            <div key={promo.code} className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-200 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0 border border-amber-100">🏷️</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">{promo.code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${promo.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                      {promo.active ? '● Aktif' : '○ Nonaktif'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                    <span className="font-bold text-purple-700">{promo.discount}% Diskon</span>
                    {(promo.minSpend ?? 0) > 0 && <span>• Min. Rp {(promo.minSpend ?? 0).toLocaleString('id-ID')}</span>}
                    <span>• {promo.usage ?? 0}x Digunakan</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => { onToggle(promo.code); showToast(`Promo ${promo.code} ${promo.active ? 'dinonaktifkan' : 'diaktifkan'}`); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${promo.active ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  {promo.active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  onClick={() => handleDelete(promo.code)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
