'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  subscribeToProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  deleteAllProductsFromFirestore,
  subscribeToStoreSettings,
  defaultCategoriesList,
} from '@/lib/firebaseSync';
import { addNotification } from '@/lib/notifications';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Product, ProductVariant, Category } from '@/lib/types';
import ProductIcon from '@/components/ui/ProductIcon';
import {
  Edit3,
  Trash2,
  Plus,
  X,
  Check,
  Search,
  AlertTriangle,
  Layers,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface ProductsTabProps {
  showToast: (msg: string) => void;
}

export default function ProductsTab({ showToast }: ProductsTabProps) {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategoriesList);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryOptions = useMemo(() => {
    return categories.map(c => ({
      value: c.id,
      label: c.label,
      badgeColor: c.badgeColor || 'bg-slate-50 text-slate-700 border-slate-200/60',
    }));
  }, [categories]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('cdid');
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [formNewFeature, setFormNewFeature] = useState('');
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);

  // Image states (Upload vs URL)
  const [formImage, setFormImage] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time sync with Cloud Firestore products collection and store settings
  useEffect(() => {
    const unsub = subscribeToProducts((prods) => {
      setCatalog(prods);
    });
    const unsubSettings = subscribeToStoreSettings((settings) => {
      if (settings.categories && settings.categories.length > 0) {
        setCategories(settings.categories);
      }
    });
    return () => {
      unsub();
      unsubSettings();
    };
  }, []);

  // Compress image on canvas for blazing fast loading (<100KB)
  const compressImage = (file: File, maxDim = 1000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
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

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('❌ Harap pilih file gambar yang valid (PNG, JPG, atau WEBP).');
      return;
    }

    setUploadingImage(true);
    setImageLoadError(false);
    try {
      const compressedDataUrl = await compressImage(file, 1000);
      let finalUrl = compressedDataUrl;

      // Attempt upload to Firebase Storage
      try {
        const response = await fetch(compressedDataUrl);
        const blob = await response.blob();
        const filename = `products/prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, blob, {
          contentType: 'image/jpeg',
        });
        finalUrl = await getDownloadURL(snapshot.ref);
      } catch (storageErr) {
        console.warn('Firebase Storage not reachable, storing compressed data URL directly:', storageErr);
      }

      setFormImage(finalUrl);
      showToast('✓ Gambar produk berhasil diunggah!');
    } catch (err: any) {
      console.error('Failed to process image:', err);
      showToast('❌ Gagal memproses gambar: ' + (err.message || 'Error'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Open modal for adding a new product
  const openAddModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormCategory(categoryOptions[0]?.value || 'cdid');
    setFormDescription('Layanan resmi Roblox, pengerjaan cepat, dan garansi transaksi 100% aman.');
    setFormFeatures(['Proses Cepat & Terpercaya', 'Garansi Uang Kembali']);
    setFormNewFeature('');
    setFormImage('');
    setImageInputMode('upload');
    setImageLoadError(false);
    setFormVariants([
      {
        id: `var-${Date.now()}-1`,
        name: 'Paket Standar',
        price: 25000,
        formattedPrice: 'Rp 25.000',
        isDefault: true,
      },
    ]);
    setIsModalOpen(true);
  };

  // Open modal for editing an existing product
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormTitle(product.title);
    setFormCategory(product.category);
    setFormDescription(product.description || '');
    setFormFeatures(product.features ? [...product.features] : []);
    setFormNewFeature('');
    setFormImage(product.image || '');
    setImageInputMode(product.image?.startsWith('http') && !product.image.includes('firebasestorage') ? 'url' : 'upload');
    setImageLoadError(false);
    setFormVariants(
      product.variants && product.variants.length > 0
        ? product.variants.map(v => ({ ...v }))
        : [
            {
              id: `var-${Date.now()}-1`,
              name: 'Paket Standar',
              price: product.price,
              formattedPrice: product.formattedPrice,
              isDefault: true,
            },
          ]
    );
    setIsModalOpen(true);
  };

  // Feature list handlers
  const handleAddFeature = () => {
    if (!formNewFeature.trim()) return;
    setFormFeatures(prev => [...prev, formNewFeature.trim()]);
    setFormNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    setFormFeatures(prev => prev.filter((_, i) => i !== index));
  };

  // Variant list handlers
  const handleAddVariant = () => {
    const defaultVarPrice = formVariants.length > 0 ? formVariants[0].price : 25000;
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `Varian Paket ${formVariants.length + 1}`,
      price: defaultVarPrice,
      formattedPrice: `Rp ${defaultVarPrice.toLocaleString('id-ID')}`,
      isDefault: formVariants.length === 0,
    };
    setFormVariants(prev => [...prev, newVariant]);
  };

  const handleUpdateVariant = (
    id: string,
    field: 'name' | 'price' | 'isDefault',
    value: string | number | boolean
  ) => {
    setFormVariants(prev =>
      prev.map(v => {
        if (field === 'isDefault') {
          return { ...v, isDefault: v.id === id };
        }
        if (v.id === id) {
          if (field === 'price') {
            const numeric = typeof value === 'number' ? value : parseInt(String(value).replace(/\D/g, '') || '0');
            return {
              ...v,
              price: numeric,
              formattedPrice: `Rp ${numeric.toLocaleString('id-ID')}`,
            };
          }
          if (field === 'name') {
            return {
              ...v,
              name: String(value),
            };
          }
        }
        return v;
      })
    );
  };

  const handleRemoveVariant = (id: string) => {
    if (formVariants.length <= 1) {
      showToast('⚠️ Produk harus memiliki minimal 1 varian layanan.');
      return;
    }
    setFormVariants(prev => {
      const filtered = prev.filter(v => v.id !== id);
      // Ensure there is always one default variant
      if (!filtered.some(v => v.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  // Save changes (Add or Edit)
  const handleSaveProduct = () => {
    if (!formTitle.trim()) {
      showToast('⚠️ Nama layanan tidak boleh kosong.');
      return;
    }
    if (formVariants.length === 0) {
      showToast('⚠️ Minimal tambahkan 1 varian.');
      return;
    }

    const defaultVar = formVariants.find(v => v.isDefault) || formVariants[0];
    const cat = categoryOptions.find(c => c.value === formCategory) || categoryOptions[0] || {
      value: formCategory,
      label: formCategory,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    };

    const iconType =
      formCategory === 'cdid' || formCategory === 'roblox'
        ? 'car'
        : formCategory === 'bloxfruits'
        ? 'sword'
        : formCategory === 'robux'
        ? 'coin'
        : 'gamepad';

    if (editingProduct) {
      // EDIT existing product
      const updatedList = catalog.map(p => {
        if (p.id === editingProduct.id) {
          const updated: Product = {
            ...p,
            title: formTitle.trim(),
            category: formCategory,
            categoryLabel: cat.label,
            categoryBadgeColor: cat.badgeColor,
            price: defaultVar.price,
            formattedPrice: defaultVar.formattedPrice,
            description: formDescription.trim(),
            features: formFeatures,
            variants: formVariants,
            iconType: p.iconType || iconType,
            image: formImage.trim() || undefined,
          };
          // Directly save to Firestore
          saveProductToFirestore(updated).catch(err => console.error('Failed to update product:', err));
          return updated;
        }
        return p;
      });

      setCatalog(updatedList);
      setIsModalOpen(false);
      showToast(`✓ Layanan "${formTitle.trim()}" berhasil diperbarui!`);
    } else {
      // ADD new product
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        categoryLabel: cat.label,
        categoryBadgeColor: cat.badgeColor,
        price: defaultVar.price,
        formattedPrice: defaultVar.formattedPrice,
        rating: 5.0,
        sales: '0 Terjual',
        iconType,
        description: formDescription.trim(),
        features: formFeatures,
        variants: formVariants,
        image: formImage.trim() || undefined,
      };

      setCatalog([newProduct, ...catalog]);
      setIsModalOpen(false);
      showToast(`✓ Layanan baru "${newProduct.title}" berhasil ditambahkan!`);

      // Directly save to Firestore
      saveProductToFirestore(newProduct).catch(err => console.error('Failed to save new product:', err));

      // Dispatch notification
      addNotification({
        title: `Layanan Baru: ${newProduct.title}`,
        message: `Layanan baru "${newProduct.title}" (${newProduct.categoryLabel}) kini tersedia di etalase mulai ${newProduct.formattedPrice}.`,
        type: 'system',
        linkAction: 'none',
      });
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, title: string) => {
    if (typeof window !== 'undefined') {
      const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus layanan "${title}" dari katalog?`);
      if (!confirmDelete) return;
    }

    try {
      await deleteProductFromFirestore(id);
      setCatalog(prev => prev.filter(p => p.id !== id));
      showToast(`✓ Layanan "${title}" berhasil dihapus.`);
    } catch (err) {
      console.error('Failed to delete product:', err);
      showToast(`❌ Gagal menghapus layanan: ${(err as Error).message}`);
    }
  };

  // Clear all products
  const handleClearAllProducts = async () => {
    if (typeof window !== 'undefined') {
      const confirmClear = window.confirm(
        `Apakah Anda yakin ingin MENGHAPUS SEMUA (${catalog.length}) layanan dari katalog? Tindakan ini tidak dapat dibatalkan.`
      );
      if (!confirmClear) return;
    }

    try {
      await deleteAllProductsFromFirestore();
      setCatalog([]);
      showToast('✓ Seluruh layanan berhasil dihapus dari database.');
    } catch (err) {
      console.error('Failed to clear catalog:', err);
      showToast(`❌ Gagal mengosongkan katalog: ${(err as Error).message}`);
    }
  };

  // Filtered products for display
  const filteredProducts = useMemo(() => {
    return catalog.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !searchFilter.trim() ||
        p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.variants?.some(v => v.name.toLowerCase().includes(searchFilter.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [catalog, selectedCategory, searchFilter]);

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-soft">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900">Katalog Layanan &amp; Varian</h3>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              {catalog.length} Total Layanan
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kelola judul, kategori, deskripsi, dan seluruh daftar varian harga layanan etalase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {catalog.length > 0 && (
            <button
              onClick={handleClearAllProducts}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
              title="Hapus seluruh layanan di katalog"
            >
              <Trash2 size={14} />
              <span>Hapus Semua</span>
            </button>
          )}
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Tambah Layanan Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua ({catalog.length})
          </button>
          {categoryOptions.map(cat => {
            const count = catalog.filter(p => p.category === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.value
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari layanan atau varian..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Product List */}
      {catalog.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers size={28} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Katalog Masih Bersih &amp; Kosong</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Tidak ada data bawaan. Anda dapat mulai menambahkan produk atau layanan baru yang siap dipesan oleh pelanggan.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-sm hover:shadow transition cursor-pointer mt-2"
          >
            <Plus size={14} />
            <span>Tambah Layanan Pertama</span>
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <p className="text-sm font-bold text-slate-700">Tidak ada layanan yang sesuai</p>
          <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau kategori filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-4 flex flex-col justify-between gap-3 hover:border-purple-300 transition duration-200 group"
            >
              <div>
                {/* Header card: Icon, Badge, Actions */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-700 overflow-hidden relative shadow-xs">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <ProductIcon type={p.iconType} className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${p.categoryBadgeColor} uppercase tracking-wider`}>
                        {p.categoryLabel}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1 mt-0.5">
                        {p.title}
                      </h4>
                    </div>
                  </div>

                  {/* Actions (Edit & Delete) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(p)}
                      title="Edit Layanan & Varian"
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition cursor-pointer"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.title)}
                      title="Hapus Layanan"
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                  {p.description || 'Tidak ada deskripsi.'}
                </p>

                {/* Variants Preview */}
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span className="flex items-center gap-1">
                      <Layers size={11} className="text-purple-600" />
                      <span>{p.variants?.length ?? 0} Varian Tersedia:</span>
                    </span>
                    <span className="text-pink-600 font-black">{p.formattedPrice} (Mulai dari)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto no-scrollbar">
                    {p.variants?.map(v => (
                      <span
                        key={v.id}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                          v.isDefault
                            ? 'bg-purple-100/80 text-purple-800 border-purple-200 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 font-medium'
                        }`}
                      >
                        <span>{v.name}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-pink-600 font-semibold">{v.formattedPrice}</span>
                        {v.isDefault && <span className="text-[8px] bg-purple-600 text-white px-1 rounded-sm">DEF</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Rating: <strong className="text-amber-500">★ {p.rating}</strong></span>
                <span>Terjual: <strong className="text-slate-600">{p.sales}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] modal-pop-in">
            <div className="p-5 sm:p-6 space-y-5">

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      {editingProduct ? `Edit Layanan: ${editingProduct.title}` : 'Tambah Layanan Baru'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Atur rincian layanan dan opsi varian harga</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Basic Fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nama Layanan / Judul *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Contoh: 100 Juta Uang CDID / Buah Dough Blox Fruits / 1000 Robux"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Kategori
                    </label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-semibold"
                    >
                      {categoryOptions.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Harga Dasar Referensi
                    </label>
                    <div className="px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-black text-pink-600">
                      {formVariants.find(v => v.isDefault)?.formattedPrice || 'Otomatis dari varian default'}
                    </div>
                  </div>
                </div>

                {/* Image Section (Upload Sendiri vs URL Umum) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon size={13} className="text-purple-600" />
                        <span>Foto / Gambar Produk</span>
                        <span className="text-[9px] text-slate-400 font-normal lowercase">(opsional)</span>
                      </label>
                      <p className="text-[10px] text-slate-400">
                        Unggah langsung dari perangkat atau masukkan tautan URL gambar umum.
                      </p>
                    </div>

                    {/* Mode Toggle Pills */}
                    <div className="inline-flex p-0.5 rounded-xl bg-slate-200/70 text-xs font-bold shrink-0">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                          imageInputMode === 'upload'
                            ? 'bg-white text-purple-700 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Upload size={12} />
                        <span>Upload Sendiri</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                          imageInputMode === 'url'
                            ? 'bg-white text-purple-700 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <LinkIcon size={12} />
                        <span>URL Umum</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Upload Sendiri */}
                  {imageInputMode === 'upload' && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                      <div
                        onClick={() => !uploadingImage && fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
                          uploadingImage
                            ? 'border-purple-300 bg-purple-50/50'
                            : 'border-slate-200 hover:border-purple-400 hover:bg-purple-50/20 bg-white'
                        }`}
                      >
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 size={24} className="animate-spin text-purple-600" />
                            <p className="text-xs font-bold text-purple-700">Mengompresi &amp; mengunggah gambar...</p>
                            <p className="text-[10px] text-slate-400">Harap tunggu beberapa saat</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                              <Upload size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                Klik untuk memilih gambar dari galeri / perangkat
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Format PNG, JPG, atau WEBP. Otomatis dikompresi agar pembeli dapat membuka toko dengan cepat.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode 2: URL Gambar Umum */}
                  {imageInputMode === 'url' && (
                    <div className="space-y-1.5">
                      <div className="relative flex items-center">
                        <LinkIcon size={13} className="absolute left-3 text-slate-400" />
                        <input
                          type="url"
                          value={formImage}
                          onChange={(e) => {
                            setFormImage(e.target.value);
                            setImageLoadError(false);
                          }}
                          placeholder="https://images.unsplash.com/... atau https://i.imgur.com/..."
                          className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-slate-700 font-mono"
                        />
                        {formImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormImage('');
                              setImageLoadError(false);
                            }}
                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Tempelkan link gambar langsung dari internet (Unsplash, Imgur, Discord CDN, web hosting, dll).
                      </p>
                    </div>
                  )}

                  {/* Image Preview Box */}
                  {formImage && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Check size={12} className="text-emerald-600" />
                          <span>Pratinjau Gambar Terpasang</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (imageInputMode === 'upload') {
                                fileInputRef.current?.click();
                              } else {
                                setFormImage('');
                              }
                            }}
                            className="text-[10px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
                          >
                            Ganti Gambar
                          </button>
                          <span className="text-slate-200">•</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormImage('');
                              setImageLoadError(false);
                            }}
                            className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 size={11} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>

                      <div className="relative w-full h-36 sm:h-44 rounded-lg bg-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center">
                        <img
                          src={formImage}
                          alt="Pratinjau Produk"
                          className={`w-full h-full object-cover transition-opacity duration-200 ${
                            imageLoadError ? 'opacity-0' : 'opacity-100'
                          }`}
                          onLoad={() => setImageLoadError(false)}
                          onError={() => setImageLoadError(true)}
                        />
                        {imageLoadError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-amber-50/95 text-amber-800">
                            <AlertTriangle size={20} className="text-amber-600 mb-1" />
                            <p className="text-xs font-bold">Gambar Tidak Dapat Dimuat</p>
                            <p className="text-[10px] text-amber-700 mt-0.5">
                              Pastikan URL valid dan berkas gambar dapat diakses secara publik.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Deskripsi Layanan
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Deskripsi singkat cara kerja dan spesifikasi layanan..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none text-slate-700 leading-relaxed"
                  />
                </div>

                {/* Features Tag Input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Fitur &amp; Keunggulan Layanan
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Contoh: Garansi Uang Kembali 100%"
                      value={formNewFeature}
                      onChange={e => setFormNewFeature(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition cursor-pointer"
                    >
                      + Tambah
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formFeatures.map((feat, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1.5">
                        <span>{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* VARIANTS EDITOR */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 to-pink-50/40 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Layers size={14} className="text-purple-600" />
                      <span>Daftar Varian Layanan ({formVariants.length})</span>
                    </h4>
                    <p className="text-[10px] text-slate-500">Pilih salah satu varian sebagai harga default.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Tambah Varian</span>
                  </button>
                </div>

                {/* Variant list */}
                <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                  {formVariants.map((variant, vIdx) => (
                    <div
                      key={variant.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 ${
                        variant.isDefault
                          ? 'bg-white border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
                          : 'bg-white/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Default Radio */}
                      <button
                        type="button"
                        onClick={() => handleUpdateVariant(variant.id, 'isDefault', true)}
                        className="flex items-center gap-1.5 text-left shrink-0 cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          variant.isDefault ? 'border-purple-600 bg-purple-600' : 'border-slate-300 bg-white'
                        }`}>
                          {variant.isDefault && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={`text-[10px] font-bold ${variant.isDefault ? 'text-purple-700' : 'text-slate-400'}`}>
                          {variant.isDefault ? 'Default' : 'Set Default'}
                        </span>
                      </button>

                      {/* Variant Name Input */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={e => handleUpdateVariant(variant.id, 'name', e.target.value)}
                          placeholder="Nama varian (cth: 100 Juta)"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-400 font-bold text-slate-800"
                        />
                      </div>

                      {/* Variant Price Input */}
                      <div className="w-full sm:w-36 flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={e => handleUpdateVariant(variant.id, 'price', e.target.value)}
                          placeholder="Harga"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-400 font-mono font-bold text-pink-600"
                        />
                      </div>

                      {/* Delete Variant */}
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(variant.id)}
                        disabled={formVariants.length <= 1}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer self-end sm:self-auto ${
                          formVariants.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Hapus varian"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black transition shadow-sm cursor-pointer"
                >
                  💾 Simpan Perubahan
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

