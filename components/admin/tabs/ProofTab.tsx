'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  subscribeToProofGallery,
  saveProofToFirestore,
  deleteProofFromFirestore,
} from '@/lib/firebaseSync';
import type { ProofItem } from '@/lib/types';
import {
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  Star,
  Search,
  ExternalLink,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';

interface ProofTabProps {
  showToast: (msg: string) => void;
}

const CATEGORY_OPTIONS = [
  'Roblox CDID',
  'Blox Fruits',
  'Robux & Gamepass',
  'Joki Akun Roblox',
  'Lainnya',
];

const TYPE_OPTIONS = [
  { value: 'receipt', label: 'Tanda Terima / Struk' },
  { value: 'cdid', label: 'Trade Mobil / Uang CDID' },
  { value: 'bloxfruits', label: 'Item / Raid Blox Fruits' },
  { value: 'robux', label: 'Transfer Robux & Gamepass' },
  { value: 'joki', label: 'Pengerjaan Joki Akun' },
];

export default function ProofTab({ showToast }: ProofTabProps) {
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProof, setEditingProof] = useState<ProofItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCustomer, setFormCustomer] = useState('');
  const [formCategory, setFormCategory] = useState('Roblox CDID');
  const [formStatus, setFormStatus] = useState('Selesai');
  const [formRating, setFormRating] = useState<number>(5);
  const [formType, setFormType] = useState('receipt');
  const [formImage, setFormImage] = useState('');
  const [formDetails, setFormDetails] = useState('');

  // Real-time listener for Firestore proofs collection
  useEffect(() => {
    const unsub = subscribeToProofGallery((items) => {
      setProofs(items);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingProof(null);
    setFormTitle('');
    setFormCustomer('');
    setFormCategory('Roblox CDID');
    setFormStatus('Selesai');
    setFormRating(5);
    setFormType('receipt');
    setFormImage('');
    setFormDetails('Transaksi sukses terkirim dan diverifikasi oleh admin Rokai Store.');
    setIsModalOpen(true);
  };

  const openEditModal = (proof: ProofItem) => {
    setEditingProof(proof);
    setFormTitle(proof.title);
    setFormCustomer(proof.customer);
    setFormCategory(proof.category);
    setFormStatus(proof.status);
    setFormRating(proof.rating || 5);
    setFormType(proof.type || 'receipt');
    setFormImage(proof.image || '');
    setFormDetails(proof.details);
    setIsModalOpen(true);
  };

  const handleSaveProof = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showToast('⚠️ Judul bukti transaksi tidak boleh kosong!');
      return;
    }
    if (!formCustomer.trim()) {
      showToast('⚠️ Nama / inisial pelanggan tidak boleh kosong!');
      return;
    }

    const proofData: ProofItem = {
      id: editingProof ? editingProof.id : `proof-${Date.now()}`,
      title: formTitle.trim(),
      customer: formCustomer.trim(),
      category: formCategory,
      status: formStatus.trim() || 'Selesai',
      rating: Number(formRating) || 5,
      type: formType,
      image: formImage.trim() || undefined,
      details: formDetails.trim(),
    };

    try {
      await saveProofToFirestore(proofData);
      setIsModalOpen(false);
      showToast(
        editingProof
          ? `✓ Bukti transaksi "${proofData.title}" berhasil diperbarui!`
          : `✓ Bukti transaksi baru "${proofData.title}" berhasil ditambahkan!`
      );
    } catch {
      showToast('❌ Gagal menyimpan bukti transaksi ke Firestore.');
    }
  };

  const handleDeleteProof = async (id: string, title: string) => {
    if (typeof window !== 'undefined') {
      const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus bukti transaksi "${title}"?`);
      if (!confirmDelete) return;
    }

    try {
      await deleteProofFromFirestore(id);
      showToast(`✓ Bukti transaksi "${title}" berhasil dihapus.`);
    } catch {
      showToast('❌ Gagal menghapus bukti transaksi.');
    }
  };

  const filteredProofs = useMemo(() => {
    return proofs.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !searchFilter.trim() ||
        p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.customer.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.details.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [proofs, selectedCategory, searchFilter]);

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151923] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-100">Manajemen Bukti Transaksi</h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>{proofs.length} Bukti Aktif</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kelola foto struk, serah terima akun, dan hasil layanan yang ditampilkan di etalase toko
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shrink-0"
        >
          <Plus size={16} />
          <span>Tambah Bukti Transaksi</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari bukti transaksi atau nama pelanggan..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-800 bg-[#151923] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {['all', ...CATEGORY_OPTIONS].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/60'
                  : 'bg-[#1c2130] border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Proofs Grid */}
      {loading ? (
        <div className="p-12 text-center bg-[#151923] rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-400">Memuat bukti transaksi dari Firestore...</p>
        </div>
      ) : filteredProofs.length === 0 ? (
        <div className="p-12 text-center bg-[#151923] rounded-2xl border border-slate-800 shadow-sm space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/60 text-rose-400 flex items-center justify-center border border-rose-800/60">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-200">Belum Ada Bukti Transaksi</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tambahkan foto hasil joki, struk transfer QRIS, atau tangkapan layar server untuk meyakinkan pembeli.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer"
          >
            + Tambah Bukti Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProofs.map((proof) => (
            <div
              key={proof.id}
              className="bg-[#151923] rounded-2xl border border-slate-800 shadow-soft overflow-hidden hover:border-slate-700 transition duration-200 flex flex-col group"
            >
              {/* Image Preview Container */}
              <div className="h-36 bg-[#0e1118] relative overflow-hidden flex items-center justify-center border-b border-slate-800">
                {proof.image ? (
                  <img
                    src={proof.image}
                    alt={proof.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 to-[#0e1118] p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono text-rose-400">
                      <span>ORDER-PROOF</span>
                      <span className="text-slate-400">{proof.category}</span>
                    </div>
                    <div className="text-center py-2">
                      <span className="text-base font-black text-white">{proof.title}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono text-right">
                      VERIFIED TRANSAKSI
                    </div>
                  </div>
                )}
                <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold shadow-sm backdrop-blur-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {proof.status}
                </span>
                <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-200 border border-slate-700 text-[10px] font-bold backdrop-blur-sm">
                  {proof.category}
                </span>
              </div>

              {/* Info Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-100 truncate">
                      {proof.title}
                    </h4>
                    <div className="flex items-center text-amber-400 shrink-0">
                      {Array.from({ length: proof.rating || 5 }).map((_, i) => (
                        <Star key={i} size={11} className="fill-current" />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Pelanggan: <span className="font-bold text-rose-400">{proof.customer}</span>
                  </p>

                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-[#1c2130] p-2.5 rounded-xl border border-slate-800">
                    {proof.details}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(proof)}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#1c2130] hover:bg-slate-750 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProof(proof.id, proof.title)}
                    className="px-3 py-1.5 rounded-lg border border-red-900/50 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit Proof */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#151923] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-800 overflow-hidden modal-pop-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-900/40 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100">
                    {editingProof ? 'Edit Bukti Transaksi' : 'Tambah Bukti Transaksi'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingProof ? 'Perbarui data testimoni/bukti transaksi' : 'Masukkan rincian bukti transaksi baru'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProof} className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Judul Transaksi / Layanan *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Joki 100 Juta CDID, Setup Modded 120+ Mods"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0e1118] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Nama / Inisial Pelanggan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    placeholder="Contoh: Dimas P. atau A***i"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0e1118] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Kategori Layanan
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0e1118] border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c} className="bg-[#151923] text-slate-100">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Status Pengerjaan
                  </label>
                  <input
                    type="text"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    placeholder="Selesai, Terkirim, Terverifikasi"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0e1118] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Rating Pelanggan
                  </label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0e1118] border border-slate-700 text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  >
                    <option value={5} className="bg-[#151923] text-amber-400">⭐⭐⭐⭐⭐ (5 Bintang)</option>
                    <option value={4} className="bg-[#151923] text-amber-400">⭐⭐⭐⭐ (4 Bintang)</option>
                    <option value={3} className="bg-[#151923] text-amber-400">⭐⭐⭐ (3 Bintang)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  URL / Link Gambar Struk atau Hasil
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... atau link gambar online"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0e1118] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Bisa dikosongkan jika ingin menggunakan tampilan kartu struk digital default.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Catatan / Keterangan Serah Terima
                </label>
                <textarea
                  rows={2}
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="Deskripsi singkat serah terima aset atau joki..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0e1118] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer"
                >
                  {editingProof ? 'Simpan Perubahan' : 'Tambah Bukti'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
