import type {
  StoreInfo, HeroSlide, HeroTheme, ValueProp,
  LiveTransaction, Category, Product, ProofItem, FAQItem
} from './types';

export const storeInfo: StoreInfo = {
  name: "Rokai Store",
  subtitle: "Marketplace profesional untuk kebutuhan Roblox. Transaksi aman, legal, dan proses instan.",
  whatsappNumber: "6281234567890",
  qrisImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80"
};

export const heroSlides: HeroSlide[] = [];

export const heroThemes: HeroTheme[] = [
  {
    id: "cyber",
    name: "Cyber Pink-Purple (Default)",
    bgClass: "from-pink-600 via-purple-700 to-indigo-900",
    previewColor: "bg-gradient-to-r from-pink-500 to-purple-600",
    glowColor: "from-pink-400 to-purple-400"
  },
  {
    id: "emerald",
    name: "Neon Emerald Gamer",
    bgClass: "from-emerald-600 via-teal-700 to-slate-950",
    previewColor: "bg-gradient-to-r from-emerald-500 to-teal-600",
    glowColor: "from-emerald-400 to-teal-400"
  },
  {
    id: "sunset",
    name: "Sunset Blaze Rose & Amber",
    bgClass: "from-amber-500 via-rose-600 to-purple-900",
    previewColor: "bg-gradient-to-r from-amber-500 to-rose-600",
    glowColor: "from-amber-400 to-rose-400"
  },
  {
    id: "midnight",
    name: "Midnight Deep Ocean",
    bgClass: "from-sky-600 via-blue-800 to-slate-950",
    previewColor: "bg-gradient-to-r from-sky-500 to-blue-700",
    glowColor: "from-sky-400 to-blue-500"
  },
  {
    id: "obsidian",
    name: "Obsidian Royal Gold",
    bgClass: "from-slate-950 via-purple-950 to-amber-800",
    previewColor: "bg-gradient-to-r from-slate-900 to-amber-600",
    glowColor: "from-amber-400 to-purple-500"
  }
];

export const valueProps: ValueProp[] = [
  {
    icon: "shield-check",
    color: "emerald",
    bgClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    title: "Transaksi Sukses",
    description: "99.87% pesanan selesai tanpa kendala"
  },
  {
    icon: "clock",
    color: "sky",
    bgClass: "bg-sky-50 text-sky-600 border-sky-100",
    title: "Pengiriman Instan",
    description: "Gamepass & Saluran dikirim < 5 menit"
  },
  {
    icon: "message-square-text",
    color: "purple",
    bgClass: "bg-purple-50 text-purple-600 border-purple-100",
    title: "Support Konsultasi",
    description: "Bantuan teknis untuk kendala pemesanan"
  }
];

export const liveTransactions: LiveTransaction[] = [];

export const categories: Category[] = [
  { id: "all", label: "Semua" },
  { id: "cdid", label: "Roblox CDID", badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/60" },
  { id: "bloxfruits", label: "Blox Fruits", badgeColor: "bg-amber-50 text-amber-700 border-amber-200/60" },
  { id: "robux", label: "Robux & Gamepass", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
  { id: "joki", label: "Joki & Akun", badgeColor: "bg-purple-50 text-purple-700 border-purple-200/60" },
  { id: "roblox", label: "Lainnya", badgeColor: "bg-sky-50 text-sky-700 border-sky-200/60" }
];

export const products: Product[] = [];

export const proofGallery: ProofItem[] = [];

export const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    question: "Bagaimana cara serah terima uang di Roblox CDID?",
    answer: "Serah terima uang CDID diproses langsung di dalam game melalui metode trade mobil resmi. Setelah Anda menyelesaikan pemesanan, Admin/Joki resmi kami akan memberikan tautan Private Server CDID dan melakukan trade mobil berisi nominal uang sesuai pesanan. Cara ini terbukti 100% aman dan anti-banned karena terhitung transaksi legal in-game."
  },
  {
    id: "faq-2",
    question: "Bagaimana sistem pengiriman Robux & Gamepass Roblox?",
    answer: "Pengiriman Robux dan Gamepass dilakukan secara resmi melalui metode Group Payout Roblox atau pembelian Gamepass yang sudah Anda buat di profil Roblox Anda. Proses instan, 100% legal, dan bebas risiko banned karena menggunakan saldo resmi."
  },
  {
    id: "faq-3",
    question: "Bagaimana proses pengerjaan joki di game Blox Fruits?",
    answer: "Pengerjaan joki Blox Fruits (Leveling, Mastery, Raid, V4 Awakening, hingga Godhuman) dikerjakan langsung oleh joki profesional berpengalaman tanpa menggunakan script cheat berbahaya. Fitur 2FA akun Anda (Email/WhatsApp) tetap aktif dan aman saat verifikasi login."
  },
  {
    id: "faq-4",
    question: "Apakah data akun Roblox saya aman selama proses joki?",
    answer: "Keamanan privasi Anda adalah prioritas utama. Data login akun Roblox Anda disimpan secara terenkripsi dan hanya diakses oleh Admin selama waktu pengerjaan. Setelah pesanan selesai, kami sarankan Anda untuk mengganti password akun Roblox Anda demi kenyamanan bersama."
  }
];
