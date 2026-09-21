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
import ProofGallery from '@/components/storefront/ProofGallery';
import FAQAccordion from '@/components/storefront/FAQAccordion';
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
import { addNotification } from '@/lib/notifications';
import { ShieldCheck, Clock, MessageSquareText } from 'lucide-react';

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
      status: 'Diproses',
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
      status: 'in_progress',
      statusTitle: 'Sedang Dikerjakan Joki / Admin',
      statusBadgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      statusPulseColor: 'bg-sky-500',
      currentStep: 3,
      estimatedTime: '~5-15 menit',
      customerNote: `Pesanan sedang diproses untuk ID: ${username || 'Pelanggan Online'}`,
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
    showToast('Pesanan berhasil dibuat! Admin segera memproses akun Anda.');

    // Dispatch real-time notification
    addNotification({
      title: `Pesanan Baru #${orderNumber} Dibuat`,
      message: `Pesanan Anda (${cart.cart.map(i => i.title).join(', ')}) berhasil dibuat dan sedang diproses admin/joki.`,
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
        setOrdersFilter('in_progress');
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
        <div ref={productGridRef}>
          <ProductGrid
            onOpenProduct={handleOpenProduct}
            initialCategory={heroCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Proof Gallery */}
        <ProofGallery />

        {/* FAQ */}
        <FAQAccordion />
      </main>

      {/* Footer */}
      <footer className="mt-12 sm:mt-16 border-t border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-xs">F</span>
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">{storeName}</p>
                <p className="text-[10px] text-slate-400">Marketplace Gaming &amp; Creative Assets</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition font-medium">WhatsApp CS</a>
              <span className="text-slate-200">•</span>
              <span>© 2026 FableMart.</span>
            </div>
          </div>
        </div>
      </footer>

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

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
