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
  'Minecraft Forge 1.20',
  'Figma UI Kit',
  'Valorant Radiant',
  'Tech Support',
  'Lainnya',
];

const TYPE_OPTIONS = [
  { value: 'receipt', label: 'Tanda Terima / Struk' },
  { value: 'server', label: 'Server & Hosting' },
  { value: 'design', label: 'Desain UI/UX' },
  { value: 'art', label: 'Aset Visual / Thumbnail' },
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
    setFormDetails('Transaksi sukses terkirim dan diverifikasi oleh admin FableMart.');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-soft">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900">Manajemen Bukti Transaksi</h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>{proofs.length} Bukti Aktif</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kelola foto struk, serah terima akun, dan hasil layanan yang ditampilkan di etalase toko
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-105 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shrink-0"
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
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Proofs Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-soft">
          <p className="text-xs font-bold text-slate-500">Memuat bukti transaksi dari Firestore...</p>
        </div>
      ) : filteredProofs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-soft space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">Belum Ada Bukti Transaksi</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tambahkan foto hasil joki, struk transfer QRIS, atau tangkapan layar server untuk meyakinkan pembeli.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
          >
            + Tambah Bukti Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProofs.map((proof) => (
            <div
              key={proof.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden hover:border-purple-300 transition duration-200 flex flex-col group"
            >
              {/* Image Preview Container */}
              <div className="h-36 bg-slate-900 relative overflow-hidden flex items-center justify-center">
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
                  <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-950 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400">
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
                <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-sm">
                  {proof.category}
                </span>
              </div>

              {/* Info Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {proof.title}
                    </h4>
                    <div className="flex items-center text-amber-400 shrink-0">
                      {Array.from({ length: proof.rating || 5 }).map((_, i) => (
                        <Star key={i} size={11} className="fill-current" />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Pelanggan: <span className="font-bold text-purple-700">{proof.customer}</span>
                  </p>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {proof.details}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(proof)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProof(proof.id, proof.title)}
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden modal-pop-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingProof ? 'Edit Bukti Transaksi' : 'Tambah Bukti Transaksi'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingProof ? 'Perbarui data testimoni/bukti transaksi' : 'Masukkan rincian bukti transaksi baru'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProof} className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Judul Transaksi / Layanan *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Joki 100 Juta CDID, Setup Modded 120+ Mods"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nama / Inisial Pelanggan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    placeholder="Contoh: Dimas P. atau A***i"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Kategori Layanan
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Status Pengerjaan
                  </label>
                  <input
                    type="text"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    placeholder="Selesai, Terkirim, Terverifikasi"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Rating Pelanggan
                  </label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-bold text-amber-600"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Bintang)</option>
                    <option value={3}>⭐⭐⭐ (3 Bintang)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  URL / Link Gambar Struk atau Hasil
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... atau link gambar online"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Bisa dikosongkan jika ingin menggunakan tampilan kartu struk digital default.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Catatan / Keterangan Serah Terima
                </label>
                <textarea
                  rows={2}
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="Deskripsi singkat serah terima aset atau joki..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
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
