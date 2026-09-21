import type {
  StoreInfo, HeroSlide, HeroTheme, ValueProp,
  LiveTransaction, Category, Product, ProofItem, FAQItem
} from './types';

export const storeInfo: StoreInfo = {
  name: "FableMart.",
  subtitle: "Marketplace terpercaya untuk kebutuhan Joki CDID, Setup Modded Server, dan aset desain UI/UX. Transaksi aman, proses instan.",
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
  { id: "roblox", label: "Roblox CDID" },
  { id: "minecraft", label: "Minecraft & Web" },
  { id: "design", label: "Desain & Visual" }
];

export const products: Product[] = [];

export const proofGallery: ProofItem[] = [];

export const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    question: "Bagaimana cara serah terima uang di Roblox CDID?",
    answer: "Serah terima uang CDID diproses langsung di dalam game melalui metode trade mobil resmi. Setelah Anda menyelesaikan pemesanan, Admin akan memberikan link Private Server CDID dan melakukan trade mobil berisi nominal uang sesuai pesanan. Cara ini terbukti 100% aman dan anti-banned karena terhitung transaksi legal in-game."
  },
  {
    id: "faq-2",
    question: "Apakah setup server Modded Minecraft sudah termasuk hosting web?",
    answer: "Layanan setup server berfokus pada konfigurasi software server, instalasi modpack (Forge/Fabric), optimasi tick-rate TPS 20, konfigurasi plugin proteksi, serta linking domain ke server Anda. Jika Anda belum memiliki VPS atau hosting Minecraft, Admin kami siap merekomendasikan hosting partner murah mulai Rp 25.000/bulan."
  },
  {
    id: "faq-3",
    question: "Berapa lama proses pembuatan thumbnail YouTube Shorts?",
    answer: "Estimasi pengerjaan thumbnail reguler dan Shorts berkisar antara 1 hingga 3 jam setelah materi teks, screenshot karakter, atau ide tema kami terima. Anda mendapatkan garansi 3x revisi minor gratis sampai puas."
  },
  {
    id: "faq-4",
    question: "Apakah optimasi Windows & Android menggunakan remote access?",
    answer: "Benar, proses optimasi dipandu secara transparan menggunakan aplikasi remote AnyDesk atau TeamViewer terenkripsi. Anda dapat mengawasi layar komputer Anda secara real-time. Kami hanya melakukan debloat service background yang tidak penting dan tuning latency tanpa menyentuh file personal Anda."
  }
];
