'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  subscribeToProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  deleteAllProductsFromFirestore,
  subscribeToStoreSettings,
  saveStoreSettingsToFirestore,
  defaultCategoriesList,
  defaultStoreSettings,
} from '@/lib/firebaseSync';
import { addNotification } from '@/lib/notifications';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Product, ProductVariant, Category, StoreSettings } from '@/lib/types';
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
  Tag,
} from 'lucide-react';

interface ProductsTabProps {
  showToast: (msg: string) => void;
}

export default function ProductsTab({ showToast }: ProductsTabProps) {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>(defaultCategoriesList);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryOptions = useMemo(() => {
    const list: { value: string; label: string; badgeColor: string }[] = [];
    const seen = new Set<string>();

    // 1. From storeSettings categories
    categories.forEach(c => {
      const val = c.id.toLowerCase();
      if (!seen.has(val)) {
        seen.add(val);
        list.push({
          value: c.id,
          label: c.label,
          badgeColor: c.badgeColor || 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
        });
      }
    });

    // 2. Also incorporate categories present across existing products in catalog
    catalog.forEach(p => {
      const pCat = (p.category || '').toLowerCase();
      const pLabel = p.categoryLabel || p.category;
      if (pCat && !seen.has(pCat)) {
        seen.add(pCat);
        list.push({
          value: p.category,
          label: pLabel,
          badgeColor: p.categoryBadgeColor || 'bg-slate-50 text-slate-700 border-slate-200/60',
        });
      }
    });

    return list;
  }, [categories, catalog]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('cdid');
  const [formCategoryLabel, setFormCategoryLabel] = useState('Roblox CDID');
  const [formCategoryBadgeColor, setFormCategoryBadgeColor] = useState('bg-indigo-50 text-indigo-700 border-indigo-200/60');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
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
      setLoading(false);
    });
    const unsubSettings = subscribeToStoreSettings((settings) => {
      setStoreSettings(settings);
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
    const defaultCat = categoryOptions[0] || {
      value: 'cdid',
      label: 'Roblox CDID',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    };
    setFormCategory(defaultCat.value);
    setFormCategoryLabel(defaultCat.label);
    setFormCategoryBadgeColor(defaultCat.badgeColor);
    setIsCustomCategory(false);
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

    // Smart match category against categoryOptions (case-insensitive check on id or label)
    const pCatLower = (product.category || '').toLowerCase();
    const pLabelLower = (product.categoryLabel || '').toLowerCase();
    const matched = categoryOptions.find(
      c => c.value.toLowerCase() === pCatLower ||
           c.label.toLowerCase() === pCatLower ||
           c.label.toLowerCase() === pLabelLower ||
           c.value.toLowerCase() === pLabelLower
    );

    const initialCatValue = matched ? matched.value : (product.category || 'cdid');
    const initialCatLabel = product.categoryLabel || matched?.label || product.category || 'Roblox';
    const initialBadgeColor = product.categoryBadgeColor || matched?.badgeColor || 'bg-indigo-50 text-indigo-700 border-indigo-200/60';

    setFormCategory(initialCatValue);
    setFormCategoryLabel(initialCatLabel);
    setFormCategoryBadgeColor(initialBadgeColor);
    setIsCustomCategory(!matched);

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

  const handleSelectCategory = (catValue: string) => {
    if (catValue === '__custom__') {
      setIsCustomCategory(true);
      return;
    }
    setIsCustomCategory(false);
    setFormCategory(catValue);
    const found = categoryOptions.find(c => c.value === catValue);
    if (found) {
      setFormCategoryLabel(found.label);
      setFormCategoryBadgeColor(found.badgeColor);
    }
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

    const finalLabel = formCategoryLabel.trim() || 'Roblox';
    let finalCatValue = formCategory.trim();
    if (!finalCatValue || isCustomCategory) {
      finalCatValue = finalLabel.toLowerCase().replace(/[^a-z0-9]/g, '') || 'roblox';
    }
    const finalBadgeColor = formCategoryBadgeColor || 'bg-indigo-50 text-indigo-700 border-indigo-200/60';

    // Auto-sync / auto-register to storeSettings categories if not already present
    const existingCat = categories.find(
      c => c.id.toLowerCase() === finalCatValue.toLowerCase() ||
           c.label.toLowerCase() === finalLabel.toLowerCase()
    );
    if (!existingCat) {
      const newRegisteredCat: Category = {
        id: finalCatValue,
        label: finalLabel,
        badgeColor: finalBadgeColor,
      };
      const updatedCategoriesList = [...categories, newRegisteredCat];
      setCategories(updatedCategoriesList);
      const updatedSettings: StoreSettings = {
        ...storeSettings,
        categories: updatedCategoriesList,
      };
      saveStoreSettingsToFirestore(updatedSettings).catch(err => {
        console.error('Failed to sync new category to store settings:', err);
      });
    }

    const iconType =
      finalCatValue.includes('cdid')
        ? 'car'
        : finalCatValue.includes('bloxfruits') || finalCatValue.includes('sword')
        ? 'sword'
        : finalCatValue.includes('robux') || finalCatValue.includes('coin')
        ? 'coin'
        : 'gamepad';

    if (editingProduct) {
      // EDIT existing product
      const updatedList = catalog.map(p => {
        if (p.id === editingProduct.id) {
          const updated: Product = {
            ...p,
            title: formTitle.trim(),
            category: finalCatValue,
            categoryLabel: finalLabel,
            categoryBadgeColor: finalBadgeColor,
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
      showToast(`✓ Layanan "${formTitle.trim()}" (${finalLabel}) berhasil diperbarui!`);
    } else {
      // ADD new product
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        title: formTitle.trim(),
        category: finalCatValue,
        categoryLabel: finalLabel,
        categoryBadgeColor: finalBadgeColor,
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
      showToast(`✓ Layanan baru "${newProduct.title}" (${finalLabel}) berhasil ditambahkan!`);

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
      const matchCat =
        selectedCategory === 'all' ||
        p.category === selectedCategory ||
        (p.categoryLabel && p.categoryLabel.toLowerCase() === selectedCategory.toLowerCase());
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151923] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-100">Katalog Layanan &amp; Varian</h3>
            <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800/60">
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
              className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/60 text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
              title="Hapus seluruh layanan di katalog"
            >
              <Trash2 size={14} />
              <span>Hapus Semua</span>
            </button>
          )}
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer flex items-center gap-1.5"
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
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/60'
                : 'bg-[#1c2130] border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Semua ({catalog.length})
          </button>
          {categoryOptions.map(cat => {
            const count = catalog.filter(
              p => p.category === cat.value ||
                   (p.categoryLabel && p.categoryLabel.toLowerCase() === cat.label.toLowerCase())
            ).length;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/60'
                    : 'bg-[#1c2130] border border-slate-800 text-slate-300 hover:bg-slate-800'
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
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-800 bg-[#151923] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="p-4 rounded-2xl bg-[#151923] border border-slate-800 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/4 bg-slate-800 rounded" />
                  <div className="h-3 w-1/3 bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="h-9 bg-slate-800/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : catalog.length === 0 ? (
        <div className="p-12 text-center bg-[#151923] rounded-2xl border border-slate-800 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/60 text-rose-400 flex items-center justify-center border border-rose-800/60">
            <Layers size={28} />
          </div>
          <h4 className="text-sm font-bold text-slate-200">Katalog Masih Bersih &amp; Kosong</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Tidak ada data bawaan. Anda dapat mulai menambahkan produk atau layanan baru yang siap dipesan oleh pelanggan.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-md shadow-red-950/60 hover:from-red-500 hover:to-rose-500 transition cursor-pointer mt-2"
          >
            <Plus size={14} />
            <span>Tambah Layanan Pertama</span>
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-8 text-center bg-[#151923] rounded-2xl border border-slate-800 space-y-2">
          <p className="text-sm font-bold text-slate-200">Tidak ada layanan yang sesuai</p>
          <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau kategori filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              className="bg-[#151923] rounded-2xl border border-slate-800 shadow-sm p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition duration-200 group text-slate-100"
            >
              <div>
                {/* Header card: Icon, Badge, Actions */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-xl bg-[#1c2130] border border-slate-800 flex items-center justify-center shrink-0 text-slate-300 overflow-hidden relative shadow-xs">
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
                      <h4 className="text-xs sm:text-sm font-black text-slate-100 line-clamp-1 mt-0.5">
                        {p.title}
                      </h4>
                    </div>
                  </div>

                  {/* Actions (Edit & Delete) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(p)}
                      title="Edit Layanan & Varian"
                      className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-[#1c2130] hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.title)}
                      title="Hapus Layanan"
                      className="p-1.5 rounded-lg border border-slate-800 hover:border-red-800/80 bg-[#1c2130] hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                  {p.description || 'Tidak ada deskripsi.'}
                </p>

                {/* Variants Preview */}
                <div className="p-2.5 rounded-xl bg-[#1c2130] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span className="flex items-center gap-1">
                      <Layers size={11} className="text-rose-400" />
                      <span>{p.variants?.length ?? 0} Varian Tersedia:</span>
                    </span>
                    <span className="text-rose-400 font-black">{p.formattedPrice} (Mulai dari)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto no-scrollbar">
                    {p.variants?.map(v => (
                      <span
                        key={v.id}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                          v.isDefault
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800/60 font-bold'
                            : 'bg-[#151923] text-slate-300 border-slate-800 font-medium'
                        }`}
                      >
                        <span>{v.name}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-rose-400 font-semibold">{v.formattedPrice}</span>
                        {v.isDefault && <span className="text-[8px] bg-rose-600 text-white px-1 rounded-sm">DEF</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Rating: <strong className="text-amber-400">★ {p.rating}</strong></span>
                <span>Terjual: <strong className="text-slate-300">{p.sales}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full sm:max-w-2xl bg-[#151923] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] modal-pop-in border border-slate-800 text-slate-100">
            <div className="p-5 sm:p-6 space-y-5">

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-950/80 text-rose-400 flex items-center justify-center border border-rose-800/60">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-100">
                      {editingProduct ? `Edit Layanan: ${editingProduct.title}` : 'Tambah Layanan Baru'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Atur rincian layanan dan opsi varian harga</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Basic Fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Nama Layanan / Judul *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Contoh: 100 Juta Uang CDID / Buah Dough Blox Fruits / 1000 Robux"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-[#0e1118] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold text-white placeholder-slate-500"
                  />
                </div>

                {/* Category & categoryLabel Section */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1c2130] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <label className="text-[10px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag size={13} className="text-rose-400" />
                        <span>Kategori &amp; Label Layanan *</span>
                      </label>
                      <p className="text-[10px] text-slate-400">
                        Pilih kategori dari pengaturan toko atau tentukan label tampilan khusus.
                      </p>
                    </div>

                    {/* Live Badge Preview */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Pratinjau:</span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${formCategoryBadgeColor} uppercase tracking-wider shadow-xs`}>
                        {formCategoryLabel || 'LABEL KATEGORI'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Pilihan Kategori
                      </label>
                      <select
                        value={isCustomCategory ? '__custom__' : formCategory}
                        onChange={e => handleSelectCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-[#0e1118] font-semibold text-white"
                      >
                        {categoryOptions.map(c => (
                          <option key={c.value} value={c.value} className="bg-[#151923] text-white">
                            {c.label} ({c.value})
                          </option>
                        ))}
                        <option value="__custom__" className="bg-[#151923] text-white">+ Buat Kategori / Label Khusus...</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Teks Label Kategori (categoryLabel) *
                      </label>
                      <input
                        type="text"
                        value={formCategoryLabel}
                        onChange={e => {
                          const val = e.target.value;
                          setFormCategoryLabel(val);
                          if (isCustomCategory) {
                            const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
                            setFormCategory(slug || 'custom');
                          }
                        }}
                        placeholder="Contoh: Roblox CDID, Blox Fruits, Pet Simulator"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-[#0e1118] font-bold text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  {/* If custom category mode is on, allow choosing badge color */}
                  {isCustomCategory && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5 animate-in fade-in duration-200">
                      <label className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                        Pilih Palet Warna Lencana:
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { name: 'Indigo', class: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60' },
                          { name: 'Amber', class: 'bg-amber-950/80 text-amber-300 border-amber-800/60' },
                          { name: 'Emerald', class: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' },
                          { name: 'Purple', class: 'bg-purple-950/80 text-purple-300 border-purple-800/60' },
                          { name: 'Sky', class: 'bg-sky-950/80 text-sky-300 border-sky-800/60' },
                          { name: 'Rose', class: 'bg-rose-950/80 text-rose-300 border-rose-800/60' },
                        ].map(pal => (
                          <button
                            key={pal.name}
                            type="button"
                            onClick={() => setFormCategoryBadgeColor(pal.class)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${pal.class} ${
                              formCategoryBadgeColor === pal.class ? 'ring-2 ring-rose-500 scale-105' : 'opacity-70 hover:opacity-100'
                            }`}
                          >
                            {pal.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Harga Dasar Referensi
                    </label>
                    <div className="px-3.5 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] font-black text-rose-400">
                      {formVariants.find(v => v.isDefault)?.formattedPrice || 'Otomatis dari varian default'}
                    </div>
                  </div>
                </div>

                {/* Image Section (Upload Sendiri vs URL Umum) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1c2130] border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon size={13} className="text-rose-400" />
                        <span>Foto / Gambar Produk</span>
                        <span className="text-[9px] text-slate-400 font-normal lowercase">(opsional)</span>
                      </label>
                      <p className="text-[10px] text-slate-400">
                        Unggah langsung dari perangkat atau masukkan tautan URL gambar umum.
                      </p>
                    </div>

                    {/* Mode Toggle Pills */}
                    <div className="inline-flex p-0.5 rounded-xl bg-[#12151e] border border-slate-800 text-xs font-bold shrink-0">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                          imageInputMode === 'upload'
                            ? 'bg-[#1c2130] text-rose-300 shadow-xs font-bold border border-slate-700'
                            : 'text-slate-400 hover:text-white'
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
                            ? 'bg-[#1c2130] text-rose-300 shadow-xs font-bold border border-slate-700'
                            : 'text-slate-400 hover:text-white'
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
                            ? 'border-rose-500/50 bg-rose-950/20'
                            : 'border-slate-700 hover:border-rose-500 hover:bg-rose-950/20 bg-[#151923]'
                        }`}
                      >
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 size={24} className="animate-spin text-rose-400" />
                            <p className="text-xs font-bold text-rose-300">Mengompresi &amp; mengunggah gambar...</p>
                            <p className="text-[10px] text-slate-400">Harap tunggu beberapa saat</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-rose-950/80 text-rose-400 flex items-center justify-center border border-rose-800/60 shadow-xs">
                              <Upload size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-200">
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
                          className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-white font-mono placeholder-slate-500"
                        />
                        {formImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormImage('');
                              setImageLoadError(false);
                            }}
                            className="absolute right-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
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
                    <div className="p-3 rounded-xl bg-[#151923] border border-slate-800 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Check size={12} className="text-emerald-400" />
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
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            Ganti Gambar
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormImage('');
                              setImageLoadError(false);
                            }}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 size={11} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>

                      <div className="relative w-full h-36 sm:h-44 rounded-lg bg-black/50 border border-slate-800 overflow-hidden flex items-center justify-center">
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
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-amber-950/90 text-amber-200">
                            <AlertTriangle size={20} className="text-amber-400 mb-1" />
                            <p className="text-xs font-bold">Gambar Tidak Dapat Dimuat</p>
                            <p className="text-[10px] text-amber-300 mt-0.5">
                              Pastikan URL valid dan berkas gambar dapat diakses secara publik.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Deskripsi Layanan
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Deskripsi singkat cara kerja dan spesifikasi layanan..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700 bg-[#0e1118] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none text-white leading-relaxed placeholder-slate-500"
                  />
                </div>

                {/* Features Tag Input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Fitur &amp; Keunggulan Layanan
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Contoh: Garansi Uang Kembali 100%"
                      value={formNewFeature}
                      onChange={e => setFormNewFeature(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 font-bold text-xs transition cursor-pointer border border-rose-800/60"
                    >
                      + Tambah
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formFeatures.map((feat, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#1c2130] text-slate-200 border border-slate-800 text-[11px] font-medium flex items-center gap-1.5">
                        <span>{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-red-400 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* VARIANTS EDITOR */}
              <div className="p-4 rounded-2xl bg-[#171a26] border border-purple-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                      <Layers size={14} className="text-purple-400" />
                      <span>Daftar Varian Layanan ({formVariants.length})</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">Pilih salah satu varian sebagai harga default.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer flex items-center gap-1"
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
                          ? 'bg-[#11141d] border-rose-800/80 ring-1 ring-rose-500/20 shadow-xs'
                          : 'bg-[#11141d] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Default Radio */}
                      <button
                        type="button"
                        onClick={() => handleUpdateVariant(variant.id, 'isDefault', true)}
                        className="flex items-center gap-1.5 text-left shrink-0 cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          variant.isDefault ? 'border-rose-600 bg-rose-600' : 'border-slate-600 bg-[#0e1118]'
                        }`}>
                          {variant.isDefault && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={`text-[10px] font-bold ${variant.isDefault ? 'text-rose-400' : 'text-slate-400'}`}>
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
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 bg-[#0e1118] text-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold placeholder-slate-500"
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
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 bg-[#0e1118] focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono font-bold text-rose-400"
                        />
                      </div>

                      {/* Delete Variant */}
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(variant.id)}
                        disabled={formVariants.length <= 1}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition cursor-pointer self-end sm:self-auto ${
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
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black transition shadow-md shadow-red-950/60 cursor-pointer"
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

