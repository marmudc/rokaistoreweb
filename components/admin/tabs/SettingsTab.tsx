'use client';
import React, { useState, useEffect, useRef } from 'react';
import { subscribeToStoreSettings, saveStoreSettingsToFirestore, defaultStoreSettings } from '@/lib/firebaseSync';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ShieldCheck, Upload, Trash2, QrCode, RefreshCw, Tag, Plus } from 'lucide-react';
import type { StoreSettings, Category } from '@/lib/types';

const BADGE_COLOR_PALETTES = [
  { label: 'Indigo', class: 'bg-indigo-50 text-indigo-700 border-indigo-200/60' },
  { label: 'Amber', class: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  { label: 'Emerald', class: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  { label: 'Purple', class: 'bg-purple-50 text-purple-700 border-purple-200/60' },
  { label: 'Sky', class: 'bg-sky-50 text-sky-700 border-sky-200/60' },
  { label: 'Rose', class: 'bg-rose-50 text-rose-700 border-rose-200/60' },
];

interface SettingsTabProps {
  showToast: (msg: string) => void;
}

export default function SettingsTab({ showToast }: SettingsTabProps) {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [uploading, setUploading] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(BADGE_COLOR_PALETTES[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time sync with Cloud Firestore settings/store
  useEffect(() => {
    const unsub = subscribeToStoreSettings((s) => {
      setSettings(s);
    });
    return () => unsub();
  }, []);

  async function handleSave() {
    await saveStoreSettingsToFirestore(settings);
    showToast('✓ Pengaturan toko berhasil disimpan ke Cloud Firestore!');
  }

  // Category label management handlers
  const handleAddCategory = () => {
    const trimmed = newCategoryLabel.trim();
    if (!trimmed) {
      showToast('⚠️ Nama label kategori tidak boleh kosong.');
      return;
    }
    const currentCats = settings.categories || [];
    if (currentCats.some(c => c.label.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`⚠️ Kategori "${trimmed}" sudah terdaftar.`);
      return;
    }

    // Generate safe slug ID
    let baseId = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!baseId) baseId = `cat-${Date.now()}`;
    let finalId = baseId;
    let counter = 1;
    while (currentCats.some(c => c.id === finalId)) {
      finalId = `${baseId}-${counter}`;
      counter++;
    }

    const newCat: Category = {
      id: finalId,
      label: trimmed,
      badgeColor: newCategoryColor.class,
    };

    const updatedCategories = [...currentCats, newCat];
    const updatedSettings = { ...settings, categories: updatedCategories };
    setSettings(updatedSettings);
    saveStoreSettingsToFirestore(updatedSettings).catch(err => {
      console.error('Failed to save category to Firestore:', err);
    });
    setNewCategoryLabel('');
    // Cycle to next color for convenience
    const nextColorIdx = (BADGE_COLOR_PALETTES.findIndex(p => p.class === newCategoryColor.class) + 1) % BADGE_COLOR_PALETTES.length;
    setNewCategoryColor(BADGE_COLOR_PALETTES[nextColorIdx]);
    showToast(`✓ Label kategori "${trimmed}" berhasil ditambahkan & disinkronkan!`);
  };

  const handleDeleteCategory = (catId: string, catLabel: string) => {
    const currentCats = settings.categories || [];
    if (currentCats.length <= 1) {
      showToast('⚠️ Minimal harus ada 1 kategori yang tersisa.');
      return;
    }
    if (typeof window !== 'undefined') {
      const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus label kategori "${catLabel}"?`);
      if (!confirmDelete) return;
    }
    const updated = currentCats.filter(c => c.id !== catId);
    const updatedSettings = { ...settings, categories: updated };
    setSettings(updatedSettings);
    saveStoreSettingsToFirestore(updatedSettings).catch(err => {
      console.error('Failed to delete category from Firestore:', err);
    });
    showToast(`✓ Label kategori "${catLabel}" berhasil dihapus & disinkronkan!`);
  };

  // Compress image on canvas so it loads instantly for buyers (<100KB)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('❌ Harap pilih file gambar (PNG, JPG, atau WEBP).');
      return;
    }

    setUploading(true);
    try {
      // 1. Optimize image locally first
      const compressedDataUrl = await compressImage(file);
      let finalUrl = compressedDataUrl;

      // 2. Try uploading to Firebase Storage if active
      try {
        const response = await fetch(compressedDataUrl);
        const blob = await response.blob();
        const storageRef = ref(storage, `branding/qris_${Date.now()}.jpg`);
        const snapshot = await uploadBytes(storageRef, blob, {
          contentType: 'image/jpeg',
        });
        finalUrl = await getDownloadURL(snapshot.ref);
      } catch (storageErr) {
        console.warn('Firebase Storage not available, using compressed Data URL directly:', storageErr);
      }

      setSettings(s => ({ ...s, qrisImage: finalUrl }));
      showToast('✓ Foto QRIS berhasil diunggah! Klik "Simpan Pengaturan" untuk menerapkan.');
    } catch (err: any) {
      console.error('Failed to process QRIS image:', err);
      showToast('❌ Gagal memproses gambar: ' + (err.message || 'Error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-black text-slate-900">Pengaturan Toko &amp; Hak Akses</h3>
        <p className="text-[11px] text-slate-400">Konfigurasi identitas toko, kontak, dan hak akses Super Admin FableMart</p>
      </div>

      {/* Store Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-5">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nama Toko</label>
          <input
            type="text"
            value={settings.storeName}
            onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-semibold"
            placeholder="Nama toko Anda"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nomor WhatsApp CS</label>
          <div className="flex items-center gap-2">
            <span className="px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-500">+</span>
            <input
              type="text"
              value={settings.whatsappNumber}
              onChange={e => setSettings(s => ({ ...s, whatsappNumber: e.target.value.replace(/\D/g, '') }))}
              className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              placeholder="6281234567890 (dengan kode negara)"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Format: 62xxxxxxxxxx (tanpa + atau spasi)</p>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tagline / Subtitle Toko</label>
          <textarea
            value={settings.subtitle}
            onChange={e => setSettings(s => ({ ...s, subtitle: e.target.value }))}
            rows={3}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white resize-none leading-relaxed"
            placeholder="Tagline utama toko Anda..."
          />
        </div>

        {/* Category Label Management Section */}
        <div className="pt-4 border-t border-slate-100 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                <Tag size={14} className="text-purple-600" />
                <span>Label Kategori Layanan (Category Label)</span>
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Kelola kategori layanan toko. Kategori ini otomatis muncul di tab filter etalase dan pilihan produk admin.
              </p>
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 shrink-0">
              {(settings.categories || []).length} Kategori Aktif
            </span>
          </div>

          {/* Existing Categories List */}
          <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 min-h-[52px] items-center">
            {(!settings.categories || settings.categories.length === 0) ? (
              <span className="text-xs text-slate-400 italic">Belum ada label kategori. Tambahkan di bawah.</span>
            ) : (
              settings.categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs ${cat.badgeColor || 'bg-white text-slate-700 border-slate-200'}`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-60 font-mono">({cat.id})</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id, cat.label)}
                    className="ml-1 p-0.5 rounded-md hover:bg-black/10 text-slate-400 hover:text-red-600 transition cursor-pointer"
                    title={`Hapus kategori "${cat.label}"`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Category Form */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-bold text-slate-700 block">Tambah Label Kategori Baru</span>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                value={newCategoryLabel}
                onChange={e => setNewCategoryLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                placeholder="Contoh: Pet Simulator 99, Fisch, Anime Defenders..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-semibold text-slate-800"
              />

              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 active:scale-95"
              >
                <Plus size={14} />
                <span>Tambah Kategori</span>
              </button>
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Warna Label (Badge Color)</span>
              <div className="flex items-center gap-2 flex-wrap">
                {BADGE_COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.label}
                    type="button"
                    onClick={() => setNewCategoryColor(palette)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${palette.class} ${newCategoryColor.class === palette.class ? 'ring-2 ring-purple-500 font-bold' : 'opacity-80 hover:opacity-100'}`}
                  >
                    <span>{palette.label}</span>
                    {newCategoryColor.class === palette.class && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* QRIS Upload Section */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <QrCode size={14} className="text-purple-600" />
              <span>Foto QRIS Pembayaran Toko (Unggah Gambar)</span>
            </label>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Unggah foto barcode QRIS (dari BCA, GoPay, OVO, Dana, ShopeePay, dll). Foto akan langsung ditampilkan di jendela pembayaran checkout pelanggan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            {/* Preview Box */}
            <div className="relative w-36 h-36 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-xs group">
              {settings.qrisImage ? (
                <>
                  <img
                    src={settings.qrisImage}
                    alt="QRIS Preview"
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 bg-white rounded-lg text-slate-700 hover:text-purple-600 transition shadow cursor-pointer"
                      title="Ganti Foto"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, qrisImage: '' }))}
                      className="p-1.5 bg-white rounded-lg text-slate-700 hover:text-red-600 transition shadow cursor-pointer"
                      title="Hapus Foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-3">
                  <QrCode size={36} className="mx-auto text-slate-300 mb-1" />
                  <span className="text-[9px] font-semibold text-slate-400 block">Belum ada QRIS</span>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-60 active:scale-95"
                >
                  {uploading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  <span>{uploading ? 'Mengunggah & Mengompres...' : settings.qrisImage ? 'Ganti Foto QRIS' : 'Pilih Foto QRIS'}</span>
                </button>

                {settings.qrisImage && (
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, qrisImage: '' }))}
                    className="px-3 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Mendukung <strong>PNG, JPG, WEBP</strong>. Foto otomatis dioptimalkan agar ringan (&lt;100KB) dan tajam saat pelanggan checkout.
              </p>

              {/* Advanced option: URL link */}
              <details className="text-[10px] text-slate-400 pt-1">
                <summary className="cursor-pointer hover:text-slate-600 font-semibold">
                  Atau masukkan URL / Link gambar eksternal
                </summary>
                <div className="mt-2">
                  <input
                    type="url"
                    value={settings.qrisImage || ''}
                    onChange={e => setSettings(s => ({ ...s, qrisImage: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-mono"
                    placeholder="https://... URL gambar QRIS eksternal"
                  />
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md cursor-pointer active:scale-95"
        >
          💾 Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
