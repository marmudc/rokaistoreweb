'use client';
import React, { useState, useEffect } from 'react';
import { subscribeToStoreSettings, saveStoreSettingsToFirestore, defaultStoreSettings } from '@/lib/firebaseSync';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ShieldCheck, Crown, UserCheck } from 'lucide-react';
import type { StoreSettings } from '@/lib/types';

interface SettingsTabProps {
  showToast: (msg: string) => void;
}

export default function SettingsTab({ showToast }: SettingsTabProps) {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoting, setPromoting] = useState(false);

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

  async function handlePromoteSelf() {
    if (!auth.currentUser) {
      showToast('⚠️ Anda belum login ke akun pengguna di website ini.');
      return;
    }
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { role: 'admin' });
      showToast(`👑 Akun ${auth.currentUser.email} berhasil dijadikan Super Admin permanen di Firestore!`);
    } catch (err: any) {
      showToast('Gagal mengubah role: ' + (err.message || 'Error'));
    }
  }

  async function handlePromoteEmail() {
    if (!promoteEmail.trim()) return;
    setPromoting(true);
    try {
      const target = promoteEmail.trim().toLowerCase();
      const q = query(collection(db, 'users'), where('email', '==', target));
      const snap = await getDocs(q);
      if (snap.empty) {
        showToast(`❌ Akun dengan email "${promoteEmail}" belum terdaftar di database.`);
      } else {
        for (const docSnap of snap.docs) {
          await updateDoc(docSnap.ref, { role: 'admin' });
        }
        showToast(`👑 Berhasil! Akun "${promoteEmail}" kini telah dijadikan Super Admin permanen.`);
        setPromoteEmail('');
      }
    } catch (err: any) {
      showToast('Gagal mempromosikan akun: ' + (err.message || 'Error'));
    } finally {
      setPromoting(false);
    }
  }

  const currentEmail = auth.currentUser?.email;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-black text-slate-900">Pengaturan Toko &amp; Hak Akses</h3>
        <p className="text-[11px] text-slate-400">Konfigurasi identitas toko, kontak, dan hak akses Super Admin FableMart</p>
      </div>

      {/* Admin Role Management Card */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30 shadow-inner">
            <Crown size={20} className="text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">Manajemen Super Admin</h4>
            <p className="text-[11px] text-purple-200/80">Jadikan akun Anda atau staf sebagai Admin permanen</p>
          </div>
        </div>

        {/* Current user promotion */}
        <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-200">Akun login saat ini:</span>
            <span className="font-mono font-bold text-white">
              {currentEmail || '(Belum login di Storefront)'}
            </span>
          </div>
          {currentEmail ? (
            <button
              type="button"
              onClick={handlePromoteSelf}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-98"
            >
              <Crown size={14} />
              <span>Jadikan Akun Ini Super Admin Permanen</span>
            </button>
          ) : (
            <p className="text-[10px] text-amber-200/90 leading-tight">
              💡 Tip: Masuk/Login terlebih dahulu di halaman utama (Storefront), lalu klik tombol di atas untuk otomatis mengangkat akun Anda jadi Super Admin.
            </p>
          )}
        </div>

        {/* Promote by Email */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">
            Jadikan Email Lain Sebagai Super Admin
          </label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder="nama@gmail.com"
              value={promoteEmail}
              onChange={e => setPromoteEmail(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
            />
            <button
              type="button"
              disabled={promoting || !promoteEmail.trim()}
              onClick={handlePromoteEmail}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <UserCheck size={14} />
              <span>{promoting ? 'Proses...' : 'Jadikan Admin'}</span>
            </button>
          </div>
          <p className="text-[10px] text-purple-300/70">
            Akun dengan email ini akan langsung mendapatkan lencana 👑 ADMIN dan akses dashboard penuh.
          </p>
        </div>
      </div>

      {/* Store Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
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
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">URL / Link Gambar QRIS Pembayaran</label>
          <input
            type="url"
            value={settings.qrisImage || ''}
            onChange={e => setSettings(s => ({ ...s, qrisImage: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            placeholder="https://... URL gambar QRIS toko Anda"
          />
          <p className="text-[10px] text-slate-400 mt-1">Gambar ini akan otomatis ditampilkan di jendela checkout pelanggan.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
          💾 Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
