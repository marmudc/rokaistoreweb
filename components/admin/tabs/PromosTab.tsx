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
          <h3 className="text-sm font-black text-slate-100">Manajemen Voucher &amp; Promo</h3>
          <p className="text-[11px] text-slate-400">{adminPromos.filter(p => p.active).length} voucher aktif tersedia untuk pelanggan</p>
        </div>
        <div className="flex items-center gap-2">
          {adminPromos.length > 0 && onClearAll && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/60 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Hapus Semua
            </button>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer"
          >
            + Tambah Kode Promo
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#1c2130] border border-slate-800 space-y-3 text-slate-100">
          <h4 className="text-xs font-black text-slate-200">Tambah Kode Promo Baru</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kode Voucher *</label>
              <input
                type="text"
                placeholder="Contoh: PROMO20"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Diskon (%) *</label>
              <input
                type="number"
                placeholder="Contoh: 15"
                min="1"
                max="100"
                value={form.discount}
                onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Min. Belanja (Rp)</label>
              <input
                type="number"
                placeholder="0 = tanpa minimum"
                value={form.minSpend}
                onChange={e => setForm(f => ({ ...f, minSpend: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer">Simpan Promo</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-slate-800 bg-[#151923] text-slate-400 text-xs font-bold transition cursor-pointer hover:bg-slate-800 hover:text-slate-200">Batal</button>
          </div>
        </div>
      )}

      {/* Promo list */}
      {adminPromos.length === 0 ? (
        <div className="p-10 text-center bg-[#151923] rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-950/60 text-rose-400 flex items-center justify-center text-xl border border-rose-800/60">
            🏷️
          </div>
          <h4 className="text-sm font-bold text-slate-200">Belum Ada Voucher / Kode Promo</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Tidak ada kode promo bawaan. Anda dapat membuat voucher baru untuk memberikan diskon bagi pelanggan toko.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-red-950/60 transition cursor-pointer"
          >
            + Buat Promo Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {adminPromos.map(promo => (
            <div key={promo.code} className="bg-[#151923] rounded-2xl border border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center text-lg shrink-0 border border-amber-800/60">🏷️</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-rose-400 bg-[#0e1118] px-2.5 py-0.5 rounded-lg border border-slate-800">{promo.code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${promo.active ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-[#1c2130] text-slate-400 border border-slate-800'}`}>
                      {promo.active ? '● Aktif' : '○ Nonaktif'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span className="font-bold text-rose-400">{promo.discount}% Diskon</span>
                    {(promo.minSpend ?? 0) > 0 && <span>• Min. Rp {(promo.minSpend ?? 0).toLocaleString('id-ID')}</span>}
                    <span>• {promo.usage ?? 0}x Digunakan</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => { onToggle(promo.code); showToast(`Promo ${promo.code} ${promo.active ? 'dinonaktifkan' : 'diaktifkan'}`); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${promo.active ? 'border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-900/40' : 'border-emerald-800/60 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50'}`}
                >
                  {promo.active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  onClick={() => handleDelete(promo.code)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-800 bg-[#1c2130] text-slate-400 hover:bg-slate-800 hover:text-white"
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
