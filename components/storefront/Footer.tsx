'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Lock,
  MessageSquare,
  Package,
  ShoppingCart,
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { StoreSettings } from '@/lib/types';

interface FooterProps {
  storeName: string;
  storeSettings: StoreSettings;
  onOpenOrders: () => void;
  onOpenCart: () => void;
  onOpenAccount?: () => void;
}

export default function Footer({
  storeName,
  storeSettings,
  onOpenOrders,
  onOpenCart,
  onOpenAccount,
}: FooterProps) {
  const [logoError, setLogoError] = useState(false);
  const cleanStoreName = storeName.replace(/\.$/, '');
  const currentYear = new Date().getFullYear();
  const whatsappNumber = storeSettings.whatsappNumber || '6281234567890';
  const subtitle =
    storeSettings.subtitle ||
    'Marketplace terpercaya untuk kebutuhan Joki CDID, Blox Fruits, Robux & Gamepass, serta Joki Akun Roblox. Transaksi aman, legal, proses instan & bergaransi 100%.';

  const scrollToSection = (id: string) => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
                  type="button"
                  onClick={() => scrollToSection('products-section')}
                  className="hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight size={13} className="text-slate-400" />
                  <span>Katalog Layanan &amp; Top Up</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenOrders}
                  className="hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight size={13} className="text-slate-400" />
                  <span>Lacak Pesanan Saya (Live Tracking)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight size={13} className="text-slate-400" />
                  <span>Keranjang Belanja Layanan</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('proof-section')}
                  className="hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight size={13} className="text-slate-400" />
                  <span>Galeri Bukti Transaksi Sukses</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('faq-section')}
                  className="hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight size={13} className="text-slate-400" />
                  <span>FAQ &amp; Cara Transaksi</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Payment Gateways (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Metode Pembayaran
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Menerima pembayaran resmi berbasis QRIS instan dari seluruh bank dan dompet digital di Indonesia:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['QRIS Instan', 'BCA', 'Mandiri', 'BRI', 'BNI', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'].map((method) => (
                <span
                  key={method}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200/80"
                >
                  {method}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/60 mt-2">
              <Sparkles size={13} className="text-emerald-600 shrink-0" />
              <span>Verifikasi otomatis murni berbasis web &amp; instan</span>
            </div>
          </div>

          {/* Col 4: Customer Care & Hours (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Bantuan &amp; Kontak
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">Jam Operasional:</span>
                  <span className="text-[11px] text-slate-500">24 Jam Non-Stop / Setiap Hari</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MessageSquare size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">Konsultasi CS:</span>
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Halo%20Admin%20${encodeURIComponent(
                      cleanStoreName
                    )},%20saya%20ingin%20konsultasi%20mengenai%20layanan%20toko.`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>WhatsApp CS</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Terms */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span>
              &copy; {currentYear} <strong>{cleanStoreName}</strong>. Seluruh hak cipta dilindungi undang-undang.
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => scrollToSection('faq-section')}
              className="hover:text-purple-600 transition cursor-pointer"
            >
              Syarat &amp; Ketentuan
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => scrollToSection('faq-section')}
              className="hover:text-purple-600 transition cursor-pointer"
            >
              Kebijakan Privasi
            </button>
            <span>•</span>
            <Link
              href="/admin"
              className="text-purple-600 hover:text-purple-800 font-bold transition flex items-center gap-1"
            >
              <span>Admin Panel</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
