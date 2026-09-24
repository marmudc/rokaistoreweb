'use client';
import React, { useState, useEffect } from 'react';
import { heroThemes } from '@/lib/storeData';
import {
  subscribeToHeroSettings,
  saveHeroSettingsToFirestore,
  subscribeToStoreSettings,
  defaultCategoriesList,
} from '@/lib/firebaseSync';
import type { HeroSlide, Category } from '@/lib/types';
import { Plus, Trash2, Edit3, X, Sparkles, Eye, Layers } from 'lucide-react';

interface HeroSettingsTabProps {
  showToast: (msg: string) => void;
}

const tagIconOptions = [
  { value: 'sparkles', label: '✨ Sparkles' },
  { value: 'gamepad-2', label: '🎮 Gamepad' },
  { value: 'cpu', label: '⚡ CPU/Tech' },
  { value: 'flame', label: '🔥 Flame' },
  { value: 'star', label: '⭐ Star' },
  { value: 'tag', label: '🏷️ Voucher/Tag' },
  { value: 'crown', label: '👑 Crown/VIP' },
  { value: 'gift', label: '🎁 Gift/Hadiah' },
];

const tagIconMap: Record<string, string> = {
  sparkles: '✨',
  'gamepad-2': '🎮',
  cpu: '⚡',
  flame: '🔥',
  star: '⭐',
  tag: '🏷️',
  crown: '👑',
  gift: '🎁',
};

export default function HeroSettingsTab({ showToast }: HeroSettingsTabProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategoriesList);
  const [theme, setTheme] = useState('cyber');
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  // Modal tambah slide baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSlide, setNewSlide] = useState<Omit<HeroSlide, 'id'>>({
    tag: 'PROMO KHUSUS',
    tagIcon: 'sparkles',
    title: 'Penawaran Spesial Hari Ini',
    subtitle: 'Layanan cepat dan terpercaya dengan garansi transaksi 100% aman.',
    primaryCta: 'Lihat Layanan',
    secondaryCta: 'Konsultasi WhatsApp',
    categoryFilter: 'all',
  });

  // Real-time sync with Cloud Firestore settings/hero & store settings
  useEffect(() => {
    const unsubHero = subscribeToHeroSettings((data) => {
      setSlides(data.slides || []);
      if (data.theme) setTheme(data.theme);
    });
    const unsubSettings = subscribeToStoreSettings((s) => {
      if (s.categories && s.categories.length > 0) {
        setCategories(s.categories);
      }
    });
    return () => {
      unsubHero();
      unsubSettings();
    };
  }, []);

  const activeSlide = slides[activeSlideIdx] || slides[0];
  const themeObj = heroThemes.find(t => t.id === theme) ?? heroThemes[0];

  function updateActiveSlide(field: keyof HeroSlide, value: string | number) {
    setSlides(prev => prev.map((s, i) => i === activeSlideIdx ? { ...s, [field]: value } : s));
  }

  // Buka modal tambah slide
  function handleOpenAddModal() {
    setNewSlide({
      tag: 'PROMO SPESIAL',
      tagIcon: 'sparkles',
      title: 'Layanan Game & Digital Terpercaya',
      subtitle: 'Proses instan di bawah 5 menit dan garansi keamanan 100%.',
      primaryCta: 'Eksplor Sekarang',
      secondaryCta: 'Hubungi Kami',
      categoryFilter: 'all',
    });
    setIsAddModalOpen(true);
  }

  // Simpan slide baru dari modal
  async function handleAddSlide() {
    if (!newSlide.title.trim()) {
      showToast('⚠️ Judul hero banner tidak boleh kosong.');
      return;
    }

    const createdSlide: HeroSlide = {
      id: Date.now(),
      tag: newSlide.tag.trim().toUpperCase() || 'PROMO',
      tagIcon: newSlide.tagIcon || 'sparkles',
      title: newSlide.title.trim(),
      subtitle: newSlide.subtitle.trim(),
      primaryCta: newSlide.primaryCta.trim() || 'Lihat Layanan',
      secondaryCta: newSlide.secondaryCta.trim() || 'Konsultasi',
      categoryFilter: newSlide.categoryFilter || 'all',
    };

    const updatedSlides = [...slides, createdSlide];
    setSlides(updatedSlides);
    setActiveSlideIdx(updatedSlides.length - 1);
    setIsAddModalOpen(false);

    try {
      await saveHeroSettingsToFirestore(updatedSlides, theme);
      showToast(`✓ Slide baru "${createdSlide.title}" berhasil ditambahkan & disimpan!`);
    } catch (err) {
      console.error('Failed to save new slide:', err);
      showToast(`❌ Gagal menyimpan ke Firestore: ${(err as Error).message}`);
    }
  }

  // Hapus slide yang sedang aktif
  async function handleDeleteSlide(idx: number) {
    const targetSlide = slides[idx];
    if (!targetSlide) return;

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus Slide ${idx + 1} ("${targetSlide.title}")?`);
      if (!confirmed) return;
    }

    const updated = slides.filter((_, i) => i !== idx);
    setSlides(updated);
    setActiveSlideIdx(Math.max(0, idx - 1));

    try {
      await saveHeroSettingsToFirestore(updated, theme);
      showToast(`✓ Slide ${idx + 1} berhasil dihapus.`);
    } catch (err) {
      console.error('Failed to delete slide:', err);
      showToast(`❌ Gagal menghapus slide: ${(err as Error).message}`);
    }
  }

  // Hapus seluruh slide hero
  async function handleClearAllSlides() {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Apakah Anda yakin ingin menghapus SEMUA (${slides.length}) slide hero banner? Banner akan kembali ke tampilan default toko.`
      );
      if (!confirmed) return;
    }

    setSlides([]);
    setActiveSlideIdx(0);

    try {
      await saveHeroSettingsToFirestore([], theme);
      showToast('✓ Seluruh slide hero berhasil dikosongkan.');
    } catch (err) {
      console.error('Failed to clear slides:', err);
      showToast(`❌ Gagal mengosongkan slide: ${(err as Error).message}`);
    }
  }

  // Simpan perubahan ke Firestore
  async function handleSaveSettings() {
    try {
      await saveHeroSettingsToFirestore(slides, theme);
      showToast('✓ Pengaturan Hero Banner berhasil disimpan ke Cloud Firestore!');
    } catch (err) {
      console.error('Failed to save hero settings:', err);
      showToast(`❌ Gagal menyimpan pengaturan: ${(err as Error).message}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151923] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-soft">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-100">Pengaturan Hero Banner</h3>
            <span className="text-[10px] font-bold text-rose-400 bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-900/60">
              {slides.length} Slide Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kustomisasi konten slide promosi, tema warna gradien, dan pratinjau real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {slides.length > 0 && (
            <button
              onClick={handleClearAllSlides}
              className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Hapus Semua</span>
            </button>
          )}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Tambah Slide Baru</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Editor */}
        <div className="space-y-4">
          {slides.length === 0 ? (
            /* Empty State */
            <div className="p-8 text-center bg-[#151923] rounded-2xl border border-slate-800 shadow-soft space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-950/40 text-rose-400 border border-rose-900/40 flex items-center justify-center">
                <Layers size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Belum Ada Slide Hero Khusus</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Data hero banner saat ini bersih. Halaman utama menggunakan tampilan default toko yang elegan. Tambahkan slide untuk membuat banner promosi kustom.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-red-950/60 transition cursor-pointer mt-1"
              >
                <Plus size={14} />
                <span>Tambah Slide Hero Pertama</span>
              </button>
            </div>
          ) : (
            <>
              {/* Slide Switcher */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {slides.map((s, i) => (
                  <button
                    key={s.id || i}
                    onClick={() => setActiveSlideIdx(i)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeSlideIdx === i
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/60'
                        : 'bg-[#151923] border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{tagIconMap[s.tagIcon] ?? '✨'}</span>
                    <span>Slide {i + 1}</span>
                    <span className="text-[10px] opacity-75">({s.tag || 'Slide'})</span>
                  </button>
                ))}
                <button
                  onClick={handleOpenAddModal}
                  className="px-3 py-2 rounded-xl border border-dashed border-rose-800/80 text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                  title="Tambah Slide Baru"
                >
                  <Plus size={14} />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Form fields for Active Slide */}
              {activeSlide && (
                <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-[#151923] border border-slate-800 shadow-soft">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                      <Edit3 size={13} className="text-rose-400" />
                      <span>Edit Slide {activeSlideIdx + 1}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteSlide(activeSlideIdx)}
                      className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Hapus Slide Ini</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ikon Tag</label>
                      <select
                        value={activeSlide.tagIcon}
                        onChange={e => updateActiveSlide('tagIcon', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                      >
                        {tagIconOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-[#151923] text-slate-100">{opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teks Tag/Pill</label>
                      <input
                        type="text"
                        value={activeSlide.tag}
                        onChange={e => updateActiveSlide('tag', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 uppercase"
                        placeholder="GAMING SERVICE"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judul Hero</label>
                    <input
                      type="text"
                      value={activeSlide.title}
                      onChange={e => updateActiveSlide('title', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                      placeholder="Judul besar hero banner"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subjudul</label>
                    <textarea
                      value={activeSlide.subtitle}
                      onChange={e => updateActiveSlide('subtitle', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none"
                      placeholder="Deskripsi singkat layanan..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teks CTA Utama</label>
                      <input
                        type="text"
                        value={activeSlide.primaryCta}
                        onChange={e => updateActiveSlide('primaryCta', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                        placeholder="Lihat Produk"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Filter Kategori CTA</label>
                      <select
                        value={activeSlide.categoryFilter}
                        onChange={e => updateActiveSlide('categoryFilter', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                      >
                        <option value="all" className="bg-[#151923] text-slate-100">Semua Kategori</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-[#151923] text-slate-100">
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teks CTA Sekunder</label>
                    <input
                      type="text"
                      value={activeSlide.secondaryCta}
                      onChange={e => updateActiveSlide('secondaryCta', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                      placeholder="Konsultasi WhatsApp"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Theme Selector */}
          <div className="p-4 rounded-2xl bg-[#151923] border border-slate-800 shadow-soft space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tema Gradien Banner</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {heroThemes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                    theme === t.id ? 'border-rose-500 ring-2 ring-rose-500/30 bg-[#1c2130]' : 'border-slate-800 bg-[#0e1118] hover:border-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${t.previewColor} shrink-0 shadow-sm`} />
                  <span className={`text-[11px] font-bold text-left leading-tight ${theme === t.id ? 'text-rose-300' : 'text-slate-300'}`}>{t.name}</span>
                  {theme === t.id && <span className="ml-auto text-rose-400 font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveSettings}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>💾 Simpan Pengaturan Hero Banner</span>
          </button>
        </div>

        {/* RIGHT: Live Preview */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Eye size={13} className="text-rose-400" />
            <span>✦ Pratinjau Real-time</span>
          </div>

          <div className={`bg-gradient-to-r ${themeObj.bgClass} rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden shadow-lg transition-all duration-300`}>
            {/* Blob decorations */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 pointer-events-none" />

            <div className="relative z-10">
              {slides.length === 0 ? (
                /* Default welcome preview when 0 slides */
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 px-2.5 py-1 rounded-full">
                    <span className="text-sm">✨</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/90">OFFICIAL STORE</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black leading-tight drop-shadow-sm">
                    Selamat Datang di Toko Kami.
                  </h2>
                  <p className="text-white/80 text-[11px] leading-relaxed max-w-xs">
                    Pusat layanan game, setup teknis, dan aset digital terpercaya. Transaksi aman &amp; terpercaya dengan garansi 100%.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 font-bold text-[11px] shadow">
                      Lihat Katalog Layanan
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white font-bold text-[11px]">
                      Konsultasi WhatsApp
                    </span>
                  </div>
                  <div className="pt-2 text-[9px] text-white/60 italic">
                    * Tampilan default toko saat belum ada slide kustom yang dibuat.
                  </div>
                </div>
              ) : (
                /* Active slide preview */
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 px-2.5 py-1 rounded-full">
                    <span className="text-sm">{tagIconMap[activeSlide?.tagIcon] ?? '✨'}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/90">{activeSlide?.tag || 'TAG LABEL'}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black leading-tight drop-shadow-sm">
                    {activeSlide?.title || 'Judul Hero Banner'}
                  </h2>
                  <p className="text-white/80 text-[11px] leading-relaxed max-w-xs">
                    {activeSlide?.subtitle || 'Deskripsi singkat layanan unggulan...'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 font-bold text-[11px] shadow">
                      {activeSlide?.primaryCta || 'CTA Utama'}
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white font-bold text-[11px]">
                      {activeSlide?.secondaryCta || 'CTA Sekunder'}
                    </span>
                  </div>
                  {/* Dots */}
                  {slides.length > 1 && (
                    <div className="flex items-center gap-2 pt-2">
                      {slides.map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-full transition-all ${
                            i === activeSlideIdx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            Pratinjau akan berubah seketika saat Anda mengedit formulir atau memilih tema di sebelah kiri.
          </p>
        </div>
      </div>

      {/* MODAL TAMBAH SLIDE BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#151923] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden modal-pop-in">
            <div className="p-5 sm:p-6 space-y-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-900/40 flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-100">Tambah Slide Hero Baru</h4>
                    <p className="text-[10px] text-slate-400">Buat banner promosi atau layanan unggulan baru</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ikon Tag *</label>
                    <select
                      value={newSlide.tagIcon}
                      onChange={e => setNewSlide(prev => ({ ...prev, tagIcon: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    >
                      {tagIconOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-[#151923] text-slate-100">{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teks Tag/Pill *</label>
                    <input
                      type="text"
                      value={newSlide.tag}
                      onChange={e => setNewSlide(prev => ({ ...prev, tag: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 uppercase"
                      placeholder="PROMO KHUSUS"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judul Hero Banner *</label>
                  <input
                    type="text"
                    value={newSlide.title}
                    onChange={e => setNewSlide(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    placeholder="Contoh: Diskon Top Up Game CDID 50%"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subjudul / Deskripsi *</label>
                  <textarea
                    value={newSlide.subtitle}
                    onChange={e => setNewSlide(prev => ({ ...prev, subtitle: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none"
                    placeholder="Deskripsi singkat yang menarik perhatian pengunjung..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teks CTA Utama</label>
                    <input
                      type="text"
                      value={newSlide.primaryCta}
                      onChange={e => setNewSlide(prev => ({ ...prev, primaryCta: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                      placeholder="Lihat Produk"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Filter Kategori CTA</label>
                    <select
                      value={newSlide.categoryFilter}
                      onChange={e => setNewSlide(prev => ({ ...prev, categoryFilter: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    >
                      <option value="all" className="bg-[#151923] text-slate-100">Semua Kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#151923] text-slate-100">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teks CTA Sekunder</label>
                  <input
                    type="text"
                    value={newSlide.secondaryCta}
                    onChange={e => setNewSlide(prev => ({ ...prev, secondaryCta: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    placeholder="Konsultasi WhatsApp"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer"
                >
                  Simpan Slide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
