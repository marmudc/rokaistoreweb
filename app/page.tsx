'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import Navbar from '@/components/storefront/Navbar';
import HeroSection from '@/components/storefront/HeroSection';
import LiveTicker from '@/components/storefront/LiveTicker';
import ProductGrid from '@/components/storefront/ProductGrid';
import ProductModal from '@/components/storefront/ProductModal';
import CartModal from '@/components/storefront/CartModal';
import CheckoutModal, { type CheckoutCustomerData } from '@/components/storefront/CheckoutModal';
import UserOrdersModal from '@/components/storefront/UserOrdersModal';
import AccountModal from '@/components/storefront/AccountModal';
import AuthModal from '@/components/storefront/AuthModal';
import AutoAccountModal from '@/components/storefront/AutoAccountModal';
import IssueAlertModal from '@/components/storefront/IssueAlertModal';
import ProofGallery from '@/components/storefront/ProofGallery';
import FAQAccordion from '@/components/storefront/FAQAccordion';
import Footer from '@/components/storefront/Footer';
import Toast from '@/components/ui/Toast';
import StorefrontLoader from '@/components/ui/StorefrontLoader';
import { useRole } from '@/hooks/useRole';
import { useCart } from '@/hooks/useCart';
import { useUserOrders } from '@/hooks/useUserOrders';
import { useToast } from '@/hooks/useToast';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { useAuth } from '@/context/AuthContext';
import type { Product, UserOrder, StoreSettings, AdminOrder } from '@/lib/types';
import type { UserOrdersFilter } from '@/components/storefront/UserOrdersModal';
import { storeInfo, valueProps } from '@/lib/storeData';
import { subscribeToStoreSettings, saveOrderToFirestore, defaultStoreSettings } from '@/lib/firebaseSync';
import { addNotification, playNotificationSound } from '@/lib/notifications';
import { ShieldCheck, Clock, MessageSquareText, AlertTriangle, ArrowRight } from 'lucide-react';

const valueIcons: Record<string, React.ReactNode> = {
  'shield-check': <ShieldCheck size={20} />,
  'clock': <Clock size={20} />,
  'message-square-text': <MessageSquareText size={20} />,
};

export default function StorefrontPage() {
  const { role, isAdmin } = useRole();
  const { user, userProfile, autoRegisterGuest } = useAuth();
  const { adminPromos } = useAdminOrders();
  const cart = useCart(adminPromos);
  const { userOrders, activeCount, addUserOrders, trackOrder } = useUserOrders();
  const { message: toastMessage, visible: toastVisible, showToast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState<UserOrdersFilter>('all');
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [autoAccountData, setAutoAccountData] = useState<{
    customerName: string;
    customerEmail: string;
    inGameId: string;
    orderId: string;
  } | null>(null);
  const [heroCategory, setHeroCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const productGridRef = useRef<HTMLDivElement>(null);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [activeIssueOrder, setActiveIssueOrder] = useState<UserOrder | null>(null);
  const [dismissedIssueIds, setDismissedIssueIds] = useState<string[]>([]);
  const prevOrderStatusesRef = useRef<Record<string, string>>({});
  const initialIssueAuditedRef = useRef(false);

  // Real-time store settings sync with Cloud Firestore & Initial Loading Animation
  useEffect(() => {
    const unsub = subscribeToStoreSettings((s) => {
      setStoreSettings(s);
    });

    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 750);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  // Monitor user orders for Kendala (issue) transitions and initial alerts
  useEffect(() => {
    if (userOrders.length === 0) return;

    userOrders.forEach((order) => {
      const prevStatus = prevOrderStatusesRef.current[order.id];
      if (prevStatus && prevStatus !== 'issue' && order.status === 'issue') {
        playNotificationSound();
        showToast(`⚠️ Pesanan #${order.id} mengalami kendala: "${order.issueReason || 'Data akun / 2FA'}"`);
        if (!dismissedIssueIds.includes(order.id)) {
          setActiveIssueOrder(order);
        }
      }
      prevOrderStatusesRef.current[order.id] = order.status;
    });

    if (!initialIssueAuditedRef.current) {
      initialIssueAuditedRef.current = true;
      const existingIssue = userOrders.find((o) => o.status === 'issue');
      if (existingIssue && !dismissedIssueIds.includes(existingIssue.id)) {
        setActiveIssueOrder(existingIssue);
      }
    }
  }, [userOrders, showToast, dismissedIssueIds]);

  const storeName = storeSettings.storeName;
  const waNumber = storeSettings.whatsappNumber;

  const handleOpenProduct = useCallback((p: Product) => setSelectedProduct(p), []);
  const handleCloseProduct = useCallback(() => setSelectedProduct(null), []);

  const handleHeroCategoryFilter = useCallback((cat: string) => {
    setHeroCategory(cat);
    setTimeout(() => {
      productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleCheckout = useCallback(() => {
    setCartOpen(false);
    setCheckoutOpen(true);
  }, []);

  const handleConfirmPaid = useCallback((data: CheckoutCustomerData) => {
    if (cart.cart.length === 0) return;

    // Fire confetti safely
    if (typeof window !== 'undefined') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    const {
      username,
      gamePassword,
      has2FA,
      twoFAType,
      phone,
      email,
      name,
      paymentConfirmationType,
      paymentUniqueCode,
      paymentProofImage,
    } = data;

    // Build order
    const orderNumber = `FM-${Math.floor(10000 + Math.random() * 90000)}`;
    const contactPhone = phone?.trim() || '-';
    const customerDisplayName = userProfile?.name || user?.displayName || name?.trim() || username || 'Pelanggan Online';
    const customerEmail = user?.email || userProfile?.email || email?.trim() || '';

    const adminOrderData: AdminOrder = {
      id: orderNumber,
      customer: customerDisplayName,
      customerEmail: customerEmail || undefined,
      phone: contactPhone,
      inGameId: username || 'Pelanggan Online',
      gamePassword: gamePassword || undefined,
      has2FA: has2FA,
      twoFAType: has2FA ? twoFAType : undefined,
      agreedToTerms: true,
      paymentConfirmationType,
      paymentUniqueCode: paymentUniqueCode || undefined,
      paymentProofImage: paymentProofImage || undefined,
      product: cart.cart.map(i => `${i.title} (${i.quantity}x)`).join(', '),
      variantName: cart.cart.map(i => i.variantName || 'Standar').join(', '),
      amount: cart.finalTotal,
      date: 'Baru Saja',
      status: 'Menunggu Konfirmasi',
      payment: paymentConfirmationType === 'proof_photo' ? 'QRIS (Bukti Transfer)' : 'QRIS (Kode Unik)',
    };

    // Save directly to Firestore
    saveOrderToFirestore(adminOrderData).catch(err => {
      console.error('Failed to save order to Firestore:', err);
    });

    // Build user orders
    const newUserOrders: UserOrder[] = cart.cart.map(item => ({
      id: orderNumber,
      date: 'Hari ini, Baru Saja',
      product: item.title,
      variantName: item.variantName || 'Paket Standar',
      categoryLabel: item.categoryLabel,
      iconType: item.iconType,
      amount: item.price * item.quantity,
      formattedPrice: `Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`,
      quantity: item.quantity,
      status: 'pending',
      statusTitle: 'Menunggu Konfirmasi Pembayaran',
      statusBadgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      statusPulseColor: 'bg-amber-500',
      currentStep: 1,
      estimatedTime: '~1-5 menit verifikasi',
      customerNote: `Bukti pembayaran telah terkirim ke admin untuk ID: ${username || 'Pelanggan Online'}. Menunggu konfirmasi admin untuk dimasukkan ke antrean pengerjaan.`,
      securityNotice: 'Data akun game Anda dienkripsi aman dan transaksi dijamin garansi uang kembali 100%.',
      inGameId: username || 'Pelanggan Online',
      gamePassword: gamePassword || undefined,
      has2FA: has2FA,
      twoFAType: has2FA ? twoFAType : undefined,
      paymentConfirmationType,
      paymentUniqueCode: paymentUniqueCode || undefined,
      paymentProofImage: paymentProofImage || undefined,
    }));

    addUserOrders(newUserOrders);
    cart.clearCart();
    showToast('Bukti pembayaran terkirim! Menunggu konfirmasi admin.');

    // Dispatch real-time notification
    addNotification({
      title: `Bukti Pembayaran #${orderNumber} Terkirim`,
      message: `Bukti pembayaran Anda (${cart.cart.map(i => i.title).join(', ')}) sedang diverifikasi admin. Pesanan akan otomatis masuk antrean segera setelah disetujui.`,
      type: 'order',
      linkAction: 'open_orders',
      orderId: orderNumber,
    });

    setCheckoutOpen(false);

    // If guest customer and provided email, auto-create guest record and prompt AutoAccountModal
    if (!user && customerEmail) {
      autoRegisterGuest(customerEmail, customerDisplayName, username, contactPhone).catch(err => {
        console.error('Failed autoRegisterGuest:', err);
      });

      setTimeout(() => {
        setAutoAccountData({
          customerName: customerDisplayName,
          customerEmail: customerEmail,
          inGameId: username,
          orderId: orderNumber,
        });
      }, 700);
    } else {
      setTimeout(() => {
        setOrdersFilter('pending');
        setFocusOrderId(orderNumber);
        setOrdersOpen(true);
      }, 800);
    }
  }, [cart, addUserOrders, showToast, user, userProfile, autoRegisterGuest]);

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <StorefrontLoader loading={initialLoading} storeName={storeName} />
      <Navbar
        storeName={storeName}
        cartCount={cart.totalCount}
        activeOrdersCount={activeCount}
        userOrdersCount={userOrders.length}
        hasIssueOrders={userOrders.some(o => o.status === 'issue')}
        issueOrdersCount={userOrders.filter(o => o.status === 'issue').length}
        role={role}
        isAdmin={isAdmin}
        onOpenCart={() => setCartOpen(true)}
        onOpenOrders={(filter, orderId) => {
          setOrdersFilter(filter || 'all');
          setFocusOrderId(orderId || null);
          setOrdersOpen(true);
        }}
        onOpenAccount={() => setAccountOpen(true)}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'login');
          setAuthModalOpen(true);
        }}
        showToast={showToast}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8 sm:space-y-12">
        {/* Kendala / Issue Order Alert Banner */}
        {userOrders.some(o => o.status === 'issue') && (
          <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white py-3 px-4 rounded-2xl shadow-xl border border-amber-400/40 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-300 ring-2 ring-rose-400/30">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-xs mt-0.5 sm:mt-0">
                <AlertTriangle size={20} className="text-amber-200 animate-bounce" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5">
                    <span>Perhatian: Pesanan Anda Mengalami Kendala Pengerjaan</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white border border-white/30">
                      Butuh Respon
                    </span>
                  </p>
                </div>
                <p className="text-[11px] sm:text-xs text-white/95 leading-relaxed">
                  {(() => {
                    const issueOrder = userOrders.find(o => o.status === 'issue');
                    return issueOrder?.issueReason
                      ? `Pesanan #${issueOrder.id}: "${issueOrder.issueReason}". Segera selesaikan kendala agar admin dapat melanjutkan pengerjaan.`
                      : 'Admin mendeteksi kendala pada data akun game atau verifikasi 2FA Anda. Segera hubungi admin agar pengerjaan dapat dilanjutkan.';
                  })()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
              <button
                onClick={() => {
                  const issueOrder = userOrders.find(o => o.status === 'issue');
                  setOrdersFilter('issue');
                  setFocusOrderId(issueOrder?.id || null);
                  setOrdersOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-black shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <span>Lihat Detail Kendala</span>
                <ArrowRight size={13} />
              </button>
              {(() => {
                const issueOrder = userOrders.find(o => o.status === 'issue');
                if (!issueOrder) return null;
                const cleanPhone = waNumber.replace(/[^0-9]/g, '');
                return (
                  <a
                    href={`https://wa.me/${cleanPhone}?text=Halo%20Admin%20FableMart,%20saya%20ingin%20konfirmasi%20kendala%20pada%20pesanan%20%23${issueOrder.id}%20(${encodeURIComponent(
                      issueOrder.product
                    )}).%20Kendala:%20${encodeURIComponent(issueOrder.issueReason || 'Mohon petunjuk kendala akun/2FA')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1.5"
                  >
                    <MessageSquareText size={13} />
                    <span>WhatsApp Admin</span>
                  </a>
                );
              })()}
            </div>
          </div>
        )}

        {/* Unpaid Order Alert Banner */}
        {userOrders.some(o => o.status === 'unpaid') && (
          <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white py-2.5 px-4 rounded-2xl shadow-lg border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-xs">
                <AlertTriangle size={18} className="text-amber-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black tracking-tight">
                  Perhatian: Bukti Pembayaran Tidak Sah &amp; Ditolak Admin
                </p>
                <p className="text-[11px] text-white/90 leading-tight truncate">
                  Terdapat pesanan yang dikembalikan ke status Belum Dibayar. Silakan lakukan pembayaran ulang.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setOrdersFilter('unpaid');
                setFocusOrderId(userOrders.find(o => o.status === 'unpaid')?.id || null);
                setOrdersOpen(true);
              }}
              className="px-4 py-1.5 rounded-xl bg-white text-rose-700 text-xs font-black shadow hover:bg-rose-50 transition cursor-pointer self-end sm:self-auto shrink-0 active:scale-95 flex items-center gap-1.5"
            >
              <span>Buka Pesanan &amp; Bayar Ulang</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Hero Banner */}
        <HeroSection
          onCategoryFilter={handleHeroCategoryFilter}
          whatsappNumber={waNumber}
        />

        {/* Value Props */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {valueProps.map(vp => (
            <div key={vp.title} className={`flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${vp.bgClass} text-center sm:text-left`}>
              <div className="shrink-0">{valueIcons[vp.icon]}</div>
              <div>
                <p className="text-xs font-black">{vp.title}</p>
                <p className="text-[10px] sm:text-[11px] opacity-80 mt-0.5 leading-snug">{vp.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Live Ticker */}
        <LiveTicker />

        {/* Product Grid */}
        <div ref={productGridRef} id="products-section">
          <ProductGrid
            onOpenProduct={handleOpenProduct}
            initialCategory={heroCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Proof Gallery */}
        <div id="proof-section">
          <ProofGallery storeName={storeName} />
        </div>

        {/* FAQ */}
        <div id="faq-section">
          <FAQAccordion storeName={storeName} />
        </div>
      </main>

      {/* Synchronized Storefront Footer */}
      <Footer
        storeName={storeName}
        storeSettings={storeSettings}
        onOpenOrders={() => {
          setOrdersFilter('all');
          setOrdersOpen(true);
        }}
        onOpenCart={() => setCartOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
      />

      {/* Modals */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={handleCloseProduct}
          onAddToCart={(item) => {
            cart.addToCart(item);
            showToast(`"${item.title}${item.variantName ? ` (${item.variantName})` : ''}" ditambahkan ke keranjang`);
          }}
          onBuyNow={() => {
            setCartOpen(true);
          }}
        />
      )}

      <CartModal
        open={cartOpen}
        cart={cart.cart}
        subtotal={cart.subtotal}
        discountAmount={cart.discountAmount}
        finalTotal={cart.finalTotal}
        activeDiscountPercent={cart.activeDiscountPercent}
        appliedPromoCode={cart.appliedPromoCode}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeFromCart}
        onApplyPromo={cart.applyPromo}
        onCheckout={handleCheckout}
        showToast={showToast}
      />

      <CheckoutModal
        open={checkoutOpen}
        finalTotal={cart.finalTotal}
        cart={cart.cart}
        discountAmount={cart.discountAmount}
        appliedPromoCode={cart.appliedPromoCode}
        whatsappNumber={waNumber}
        qrisImage={storeSettings.qrisImage || storeInfo.qrisImage}
        onClose={() => setCheckoutOpen(false)}
        onConfirmPaid={handleConfirmPaid}
      />

      <UserOrdersModal
        open={ordersOpen}
        userOrders={userOrders}
        onClose={() => {
          setOrdersOpen(false);
          setFocusOrderId(null);
        }}
        showToast={showToast}
        whatsappNumber={waNumber}
        qrisImage={storeSettings.qrisImage || storeInfo.qrisImage}
        initialFilter={ordersFilter}
        focusOrderId={focusOrderId}
        onTrackOrder={trackOrder}
      />

      <AccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        isAdmin={isAdmin}
        onOpenOrders={(filter) => {
          setAccountOpen(false);
          setOrdersFilter(filter || 'all');
          setFocusOrderId(null);
          setOrdersOpen(true);
        }}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'login');
          setAuthModalOpen(true);
        }}
        userOrdersCount={userOrders.length}
        activeOrdersCount={activeCount}
        cartCount={cart.totalCount}
        showToast={showToast}
      />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        showToast={showToast}
      />

      {autoAccountData && (
        <AutoAccountModal
          open={!!autoAccountData}
          onClose={() => setAutoAccountData(null)}
          customerName={autoAccountData.customerName}
          customerEmail={autoAccountData.customerEmail}
          inGameId={autoAccountData.inGameId}
          orderId={autoAccountData.orderId}
          onOpenOrders={() => {
            const oid = autoAccountData.orderId;
            setAutoAccountData(null);
            setOrdersFilter('in_progress');
            setFocusOrderId(oid);
            setOrdersOpen(true);
          }}
          showToast={showToast}
        />
      )}

      {activeIssueOrder && (
        <IssueAlertModal
          open={!!activeIssueOrder}
          order={activeIssueOrder}
          whatsappNumber={waNumber}
          onClose={() => {
            if (activeIssueOrder) {
              setDismissedIssueIds(prev => [...prev, activeIssueOrder.id]);
            }
            setActiveIssueOrder(null);
          }}
          onOpenOrders={(orderId) => {
            setActiveIssueOrder(null);
            setOrdersFilter('issue');
            setFocusOrderId(orderId);
            setOrdersOpen(true);
          }}
        />
      )}

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
