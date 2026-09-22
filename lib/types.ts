// ==========================================
// FABLEMART — TypeScript Type Definitions
// ==========================================

export interface StoreInfo {
  name: string;
  subtitle: string;
  whatsappNumber: string;
  qrisImage: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  category: string;
  categoryLabel: string;
  categoryBadgeColor: string;
  title: string;
  price: number;
  formattedPrice: string;
  rating: number;
  sales: string;
  iconType: string;
  description: string;
  features: string[];
  variants: ProductVariant[];
  image?: string;
}

export interface Category {
  id: string;
  label: string;
  badgeColor?: string;
}

export interface HeroSlide {
  id: number;
  tag: string;
  tagIcon: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  categoryFilter: string;
}

export interface HeroTheme {
  id: string;
  name: string;
  bgClass: string;
  previewColor: string;
  glowColor: string;
}

export interface ValueProp {
  icon: string;
  color: string;
  bgClass: string;
  title: string;
  description: string;
}

export interface LiveTransaction {
  user: string;
  action: string;
  item: string;
  category: string;
  amount: string;
  time: string;
  avatarBg: string;
  badgeColor: string;
}

export interface ProofItem {
  id: string;
  title: string;
  customer: string;
  status: string;
  category: string;
  type: string;
  details: string;
  rating: number;
  gradient?: string;
  bgPattern?: string;
  image?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Cart & Orders
export interface CartItem {
  id: string;
  baseId: string;
  title: string;
  variantId: string | null;
  variantName: string | null;
  categoryLabel: string;
  iconType: string;
  price: number;
  formattedPrice: string;
  quantity: number;
  image?: string;
}

export type OrderStatus = 'in_progress' | 'pending' | 'completed' | 'queued' | 'issue' | 'unpaid';
export type TwoFAType = 'email' | 'device' | 'whatsapp';
export type PaymentConfirmationType = 'unique_code' | 'proof_photo';

export interface UserOrder {
  id: string;
  date: string;
  product: string;
  variantName: string;
  categoryLabel: string;
  iconType: string;
  amount: number;
  formattedPrice: string;
  quantity: number;
  status: OrderStatus;
  statusTitle: string;
  statusBadgeColor: string;
  statusPulseColor: string;
  currentStep: number;
  estimatedTime: string;
  customerNote: string;
  securityNotice: string;
  inGameId: string;
  gamePassword?: string;
  has2FA?: boolean;
  twoFAType?: TwoFAType;
  paymentConfirmationType?: PaymentConfirmationType;
  paymentUniqueCode?: string;
  paymentProofImage?: string;
  paymentRejected?: boolean;
  issueReason?: string;
}

export type AdminOrderStatus =
  | 'Menunggu Konfirmasi'
  | 'Menunggu Verifikasi'
  | 'Antrian'
  | 'Dalam Proses'
  | 'Diproses'
  | 'Selesai'
  | 'Kendala'
  | 'Dibatalkan'
  | 'Belum Dibayar';

export interface AdminOrder {
  id: string;
  customer: string;
  customerEmail?: string;
  phone: string;
  product: string;
  variant?: string;
  variantName?: string;
  amount: number;
  date: string;
  status: AdminOrderStatus;
  payment: string;
  inGameId?: string;
  gamePassword?: string;
  has2FA?: boolean;
  twoFAType?: TwoFAType;
  agreedToTerms?: boolean;
  paymentConfirmationType?: PaymentConfirmationType;
  paymentUniqueCode?: string;
  paymentProofImage?: string;
  paymentRejected?: boolean;
  issueReason?: string;
  quantity?: number;
  category?: string;
  createdAt?: any;
  updatedAt?: any;
  userId?: string;
}

export interface PromoCode {
  code: string;
  discount: number;
  minSpend: number;
  status?: string;
  active?: boolean;
  usage?: number;
  usedCount?: number;
}

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  subtitle: string;
  qrisImage?: string;
  categories?: Category[];
}

export type NotificationType = 'order' | 'promo' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  type: NotificationType;
  linkAction?: 'open_orders' | 'open_cart' | 'view_promo' | 'none';
  orderId?: string;
  promoCode?: string;
}

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  photoURL?: string;
  defaultInGameId: string;
  role?: 'customer' | 'admin';
  phone?: string;
  provider?: string;
  soundEnabled?: boolean;
  isGuestAutoCreated?: boolean;
  googleLinked?: boolean;
  createdAt?: any;
  updatedAt?: any;
}
