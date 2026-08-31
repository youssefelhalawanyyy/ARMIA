'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  UploadCloud,
  X,
  Check,
  Languages,
  Sparkles,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { getProducts, saveProduct, deleteProduct } from '@/lib/productService';
import { compressImage } from '@/lib/imageUtils';
import { getCategories, DEFAULT_CATEGORIES } from '@/lib/categoryService';
import { Product, ProductColor, CategoryType, Category } from '@/types';
import { useToast } from '@/context/ToastContext';

const PRESET_COLORS: ProductColor[] = [
  { name: 'Oatmeal Beige', nameArabic: 'بيج كشمير', hex: '#DCC9A6' },
  { name: 'Warm Taupe', nameArabic: 'بني دافئ', hex: '#B67355' },
  { name: 'Midnight Black', nameArabic: 'أسود ملكي', hex: '#1F1F1F' },
  { name: 'Alabaster White', nameArabic: 'أبيض عاجي', hex: '#F6F3EE' },
  { name: 'Pure White', nameArabic: 'أبيض ناصع', hex: '#FFFFFF' },
  { name: 'Terracotta Rust', nameArabic: 'تيراكوتا برونزي', hex: '#9E5D41' },
  { name: 'Espresso Charcoal', nameArabic: 'رمادي إسبريسو', hex: '#2A2A2A' },
  { name: 'Champagne Silk', nameArabic: 'حرير شامبين', hex: '#EDE3CF' },
  { name: 'Sage Green', nameArabic: 'أخضر ميرمية', hex: '#8A9A86' },
  { name: 'Dusty Rose', nameArabic: 'وردي كلاسيكي', hex: '#C28B82' },
];

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Free Size'];

export default function AdminProductsPage() {
  const { success, error, info } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLangTab, setModalLangTab] = useState<'en' | 'ar'>('en');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State (English & Common)
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CategoryType>('dresses');
  const [formPrice, setFormPrice] = useState<number>(450);
  const [formDiscountPrice, setFormDiscountPrice] = useState<number | undefined>(undefined);
  const [formStock, setFormStock] = useState<number>(25);
  const [formDescription, setFormDescription] = useState('');
  const [formFabric, setFormFabric] = useState('100% Premium Organic Linen');
  const [formFit, setFormFit] = useState('Relaxed Tailored Fit');
  const [formCare, setFormCare] = useState('Dry clean recommended');
  const [formOrigin, setFormOrigin] = useState('Handcrafted in Egypt');
  const [formModelInfo, setFormModelInfo] = useState('Model is 174cm wearing size S');
  const [formColors, setFormColors] = useState<ProductColor[]>([]);
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L']);
  const [formImageUrls, setFormImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State (Arabic)
  const [formNameArabic, setFormNameArabic] = useState('');
  const [formDescriptionArabic, setFormDescriptionArabic] = useState('');
  const [formFabricArabic, setFormFabricArabic] = useState('');
  const [formFitArabic, setFormFitArabic] = useState('');
  const [formCareArabic, setFormCareArabic] = useState('');
  const [formOriginArabic, setFormOriginArabic] = useState('صنع بأيدي مصرية محترفة في القاهرة');
  const [formModelInfoArabic, setFormModelInfoArabic] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts('all');
      setProducts(data);
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getProducts('all'), getCategories()])
      .then(([prods, cats]) => {
        if (isMounted) {
          setProducts(prods);
          if (cats && cats.length > 0) setAvailableCategories(cats);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching admin products or categories:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setModalLangTab('en');
    setFormName('');
    setFormCategory('dresses');
    setFormPrice(450);
    setFormDiscountPrice(undefined);
    setFormStock(25);
    setFormDescription('An exquisite silhouette crafted with precision and timeless elegance.');
    setFormFabric('100% Premium Organic Linen');
    setFormFit('Relaxed Tailored Fit');
    setFormCare('Dry clean or gentle hand wash');
    setFormOrigin('Handcrafted in Egypt');
    setFormModelInfo('Model is 174cm wearing size S');
    setFormColors([PRESET_COLORS[0], PRESET_COLORS[2]]);
    setFormSizes(['S', 'M', 'L']);
    setFormImageUrls(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900']);

    // Reset Arabic fields with defaults
    setFormNameArabic('');
    setFormDescriptionArabic('');
    setFormFabricArabic('كتان فرنسي عضوي طبيعي 100%');
    setFormFitArabic('قصّة عصرية مريحة مع تفصيل متقن');
    setFormCareArabic('تنظيف جاف أو غسيل يدوي لطيف بالماء البارد');
    setFormOriginArabic('صنع بأيدي مصرية محترفة في القاهرة');
    setFormModelInfoArabic('العارضة ترتدي مقاس S بطول 174 سم');

    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setModalLangTab('en');
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormPrice(prod.price);
    setFormDiscountPrice(prod.discountPrice);
    setFormStock(prod.stockQuantity);
    setFormDescription(prod.description || '');
    setFormFabric(prod.specs?.fabric || '');
    setFormFit(prod.specs?.fit || '');
    setFormCare(prod.specs?.care || '');
    setFormOrigin(prod.specs?.origin || 'Handcrafted in Egypt');
    setFormModelInfo(prod.specs?.modelInfo || '');
    setFormColors(prod.colors || []);
    setFormSizes(prod.sizes || []);
    setFormImageUrls(prod.imageUrls || []);

    // Load Arabic fields
    setFormNameArabic(prod.nameArabic || '');
    setFormDescriptionArabic(prod.descriptionArabic || '');
    setFormFabricArabic(prod.specs?.fabricArabic || '');
    setFormFitArabic(prod.specs?.fitArabic || '');
    setFormCareArabic(prod.specs?.careArabic || '');
    setFormOriginArabic(prod.specs?.originArabic || 'صنع في مصر');
    setFormModelInfoArabic(prod.specs?.modelInfoArabic || '');

    setModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { blob, dataUrl } = await compressImage(file, 1200, 1600, 0.82);

      const uploadWithTimeout = async (): Promise<string> => {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
        const snap = await uploadBytes(storageRef, blob);
        return await getDownloadURL(snap.ref);
      };

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout')), 2500)
      );

      try {
        const storageUrl = await Promise.race([uploadWithTimeout(), timeoutPromise]);
        setFormImageUrls((prev) => [...prev, storageUrl]);
        success('Image optimized & uploaded to Storage', 'Instant Upload');
      } catch {
        setFormImageUrls((prev) => [...prev, dataUrl]);
        success('Image optimized & attached instantly', 'Instant Upload');
      }
    } catch (err: unknown) {
      console.warn('Image processing notice:', err);
      const localUrl = URL.createObjectURL(file);
      setFormImageUrls((prev) => [...prev, localUrl]);
      info('Image preview attached');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setFormImageUrls((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleColor = (color: ProductColor) => {
    setFormColors((prev) => {
      const exists = prev.some((c) => c.name === color.name);
      if (exists) {
        return prev.filter((c) => c.name !== color.name);
      } else {
        return [...prev, color];
      }
    });
  };

  const toggleSize = (size: string) => {
    setFormSizes((prev) => {
      if (prev.includes(size)) {
        return prev.filter((s) => s !== size);
      } else {
        return [...prev, size];
      }
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      error('English product name is required');
      return;
    }
    if (formImageUrls.length === 0) {
      error('Please provide at least 1 product image');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Product> = {
        name: formName.trim().toUpperCase(),
        nameArabic: formNameArabic.trim() || undefined,
        category: formCategory,
        price: Number(formPrice),
        discountPrice: formDiscountPrice ? Number(formDiscountPrice) : undefined,
        stockQuantity: Number(formStock),
        description: formDescription.trim(),
        descriptionArabic: formDescriptionArabic.trim() || undefined,
        specs: {
          fabric: formFabric.trim(),
          fabricArabic: formFabricArabic.trim() || undefined,
          fit: formFit.trim(),
          fitArabic: formFitArabic.trim() || undefined,
          care: formCare.trim(),
          careArabic: formCareArabic.trim() || undefined,
          origin: formOrigin.trim(),
          originArabic: formOriginArabic.trim() || undefined,
          modelInfo: formModelInfo.trim(),
          modelInfoArabic: formModelInfoArabic.trim() || undefined,
        },
        colors: formColors.length > 0 ? formColors : [PRESET_COLORS[0]],
        sizes: formSizes.length > 0 ? formSizes : ['Standard'],
        imageUrls: formImageUrls,
        isNewArrival: formCategory === 'new-in' || Boolean(editingProduct?.isNewArrival),
        featured: true,
      };

      if (editingProduct) {
        payload.id = editingProduct.id;
      }

      await saveProduct(payload);
      success(
        `Product "${formName}" ${editingProduct ? 'updated' : 'created'} successfully with bilingual details!`,
        'Catalog Updated'
      );
      setModalOpen(false);
      await loadProducts();
    } catch (err: unknown) {
      console.error('Error saving product:', err);
      const e = err as { message?: string };
      error('Failed to save product: ' + (e.message || 'Error occurred'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (prodId: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the catalog?`)) {
      try {
        await deleteProduct(prodId);
        success(`Product "${name}" has been deleted`, 'Deleted');
        setProducts((prev) => prev.filter((p) => p.id !== prodId));
      } catch (err: unknown) {
        console.error('Delete error:', err);
        const e = err as { message?: string };
        error('Failed to delete product: ' + (e.message || 'Error occurred'));
      }
    }
  };

  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      prod.name.toLowerCase().includes(q) ||
      (prod.nameArabic && prod.nameArabic.includes(q)) ||
      prod.category.toLowerCase().includes(q) ||
      prod.description.toLowerCase().includes(q) ||
      (prod.descriptionArabic && prod.descriptionArabic.includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B67355]">
            Inventory & Bilingual Catalog Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Products & Collections
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans mt-0.5">
            Add or edit products with bilingual English & Arabic titles, descriptions, and fabric specs.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-[#B67355] text-white px-5 py-2.5 text-xs font-sans uppercase font-bold tracking-wider hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all shadow-lg rounded"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Piece</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#141414] border border-[#333333] p-4 flex flex-col md:flex-row gap-4 items-center justify-between rounded-xl">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8E8A85] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name (English or Arabic)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1F1F1F] border border-[#333333] text-white pl-9 pr-4 py-2 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#DCC9A6] text-[#1F1F1F] font-bold'
                : 'bg-[#1F1F1F] text-[#8E8A85] border border-[#333333] hover:text-white'
            }`}
          >
            All ({products.length})
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
                selectedCategory === cat.slug
                  ? 'bg-[#DCC9A6] text-[#1F1F1F] font-bold'
                  : 'bg-[#1F1F1F] text-[#8E8A85] border border-[#333333] hover:text-white'
              }`}
            >
              {cat.name} ({cat.nameArabic})
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#141414] border border-[#333333] overflow-hidden rounded-xl">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#8E8A85] font-sans">Loading Catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-[#8E8A85] mx-auto" />
            <h3 className="font-serif text-lg font-bold text-white">No products found</h3>
            <p className="text-xs text-[#8E8A85]">
              {searchQuery ? 'Try adjusting your search query or category filter' : 'Your catalog is empty'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-[#333333] bg-[#1F1F1F] text-[#8E8A85] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Item & Bilingual Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price (EGP)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Colors & Sizes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#1A1A1A] transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 bg-[#1F1F1F] shrink-0 border border-[#333333] overflow-hidden rounded">
                          <Image
                            src={prod.imageUrls[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'}
                            alt={prod.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-serif text-sm font-bold text-white">{prod.name}</p>
                            {prod.nameArabic && (
                              <span className="text-[11px] text-[#DCC9A6] font-sans" dir="rtl">
                                ({prod.nameArabic})
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8E8A85] truncate max-w-xs mt-0.5">
                            {prod.specs?.fabric || prod.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-[#141414] text-[#DCC9A6] px-2.5 py-1 text-[10px] font-bold uppercase border border-[#333333] rounded">
                        {prod.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-serif text-sm font-bold text-white">
                          EGP {(prod.discountPrice || prod.price).toFixed(2)}
                        </span>
                        {prod.discountPrice && (
                          <span className="text-[10px] text-[#8E8A85] line-through">
                            EGP {prod.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          prod.stockQuantity < 10
                            ? 'text-red-400'
                            : prod.stockQuantity < 20
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {prod.stockQuantity} units
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 mb-1">
                        {prod.colors?.map((c) => (
                          <span
                            key={c.name}
                            className="w-3 h-3 rounded-full border border-black/40"
                            style={{ backgroundColor: c.hex }}
                            title={`${c.name} ${c.nameArabic ? `(${c.nameArabic})` : ''}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#8E8A85]">
                        {prod.sizes?.join(', ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 text-[#DCC9A6] hover:text-white bg-[#141414] border border-[#333333] hover:border-[#DCC9A6] transition-colors rounded"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="p-1.5 text-red-400 hover:text-red-300 bg-[#141414] border border-[#333333] hover:border-red-500 transition-colors rounded"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT BILINGUAL PRODUCT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-[#1F1F1F] border border-[#333333] p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto space-y-6 rounded-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#B67355] font-bold">
                  Bilingual Boutique Catalog Editor
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  {editingProduct ? `Edit "${editingProduct.name}"` : 'Add New Boutique Piece'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#8E8A85] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BILINGUAL LANGUAGE TABS */}
            <div className="flex border-b border-[#333333] bg-[#141414] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setModalLangTab('en')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-sans font-bold uppercase tracking-wider rounded transition-all ${
                  modalLangTab === 'en'
                    ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow'
                    : 'text-[#8E8A85] hover:text-white'
                }`}
              >
                <span>🇬🇧 English Details</span>
              </button>
              <button
                type="button"
                onClick={() => setModalLangTab('ar')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-sans font-bold uppercase tracking-wider rounded transition-all ${
                  modalLangTab === 'ar'
                    ? 'bg-[#B67355] text-white shadow'
                    : 'text-[#8E8A85] hover:text-white'
                }`}
              >
                <span>🇪🇬 التفاصيل باللغة العربية (Arabic)</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="space-y-6">
              
              {/* TAB 1: ENGLISH DETAILS */}
              {modalLangTab === 'en' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Basic English Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-1 font-semibold">
                        Product Name (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. LINEN SET, PLEATED DRESS"
                        className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-1 font-semibold">
                        Category *
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded"
                      >
                        {availableCategories.map((cat) => (
                          <option key={cat.id} value={cat.slug}>
                            {cat.name} ({cat.nameArabic})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-1 font-semibold">
                        Stock Quantity (Units) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={formStock}
                        onChange={(e) => setFormStock(Number(e.target.value))}
                        className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-1 font-semibold">
                        Base Price (EGP) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        step={10}
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-1 font-semibold">
                        Discounted Price (EGP - Optional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={formDiscountPrice || ''}
                        onChange={(e) =>
                          setFormDiscountPrice(e.target.value ? Number(e.target.value) : undefined)
                        }
                        placeholder="e.g. 420.00"
                        className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded"
                      />
                    </div>
                  </div>

                  {/* English Description */}
                  <div>
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-1 font-semibold">
                      Product Description (English) *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Elevate your daily elegance with our signature two-piece Linen Set..."
                      className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded"
                    />
                  </div>

                  {/* English Specifications */}
                  <div className="p-4 bg-[#141414] border border-[#333333] space-y-4 rounded-xl">
                    <h4 className="text-xs font-sans uppercase tracking-wider font-bold text-[#DCC9A6]">
                      Fabric & Fit Specifications (English)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#8E8A85] mb-1">Fabric Composition</label>
                        <input
                          type="text"
                          value={formFabric}
                          onChange={(e) => setFormFabric(e.target.value)}
                          placeholder="100% Organic French Linen"
                          className="w-full bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#8E8A85] mb-1">Fit & Silhouette</label>
                        <input
                          type="text"
                          value={formFit}
                          onChange={(e) => setFormFit(e.target.value)}
                          placeholder="Relaxed Tailored Silhouette"
                          className="w-full bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#8E8A85] mb-1">Care Instructions</label>
                        <input
                          type="text"
                          value={formCare}
                          onChange={(e) => setFormCare(e.target.value)}
                          placeholder="Dry clean or gentle hand wash cold"
                          className="w-full bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#8E8A85] mb-1">Model Info / Fit Guide</label>
                        <input
                          type="text"
                          value={formModelInfo}
                          onChange={(e) => setFormModelInfo(e.target.value)}
                          placeholder="Model is 174cm wearing size S"
                          className="w-full bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ARABIC DETAILS */}
              {modalLangTab === 'ar' && (
                <div className="space-y-5 animate-in fade-in duration-200" dir="rtl">
                  <div className="bg-[#B67355]/10 border border-[#B67355]/30 p-3 rounded-lg flex items-center gap-2 text-xs text-[#DCC9A6]">
                    <Sparkles className="w-4 h-4 text-[#B67355] shrink-0" />
                    <span>
                      أدخلي تفاصيل المنتج باللغة العربية لعرضها تلقائياً للعملاء عند اختيار اللغة العربية.
                    </span>
                  </div>

                  {/* Arabic Title */}
                  <div>
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-1 font-semibold">
                      اسم القطعة باللغة العربية
                    </label>
                    <input
                      type="text"
                      value={formNameArabic}
                      onChange={(e) => setFormNameArabic(e.target.value)}
                      placeholder="مثال: طقم كتان فاخر قطعتين، فستان ماكسي بليسيه كشمير"
                      className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded text-right"
                    />
                  </div>

                  {/* Arabic Description */}
                  <div>
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-1 font-semibold">
                      وصف وتفاصيل المنتج بالعربية
                    </label>
                    <textarea
                      rows={3}
                      value={formDescriptionArabic}
                      onChange={(e) => setFormDescriptionArabic(e.target.value)}
                      placeholder="اكتبي وصفاً جذاباً للقطعة وتفاصيل تصميمها وخامتها..."
                      className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded text-right"
                    />
                  </div>

                  {/* Arabic Specifications */}
                  <div className="p-4 bg-[#141414] border border-[#333333] space-y-4 rounded-xl">
                    <h4 className="text-xs font-sans uppercase tracking-wider font-bold text-[#DCC9A6]">
                      مواصفات الأقمشة والقصّة بالعربية
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#8E8A85] mb-1">الخامة والأقمشة</label>
                        <input
                          type="text"
                          value={formFabricArabic}
                          onChange={(e) => setFormFabricArabic(e.target.value)}
                          placeholder="كتان فرنسي طبيعي 100%"
                          className="w-full bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs rounded text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#8E8A85] mb-1">القصّة والمقاس</label>
                        <input
                          type="text"
                          value={formFitArabic}
                          onChange={(e) => setFormFitArabic(e.target.value)}
                          placeholder="قصّة عصرية مريحة مع بنطال واسع"
                          className="w-full bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs rounded text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#8E8A85] mb-1">إرشادات الغسيل والعناية</label>
                        <input
                          type="text"
                          value={formCareArabic}
                          onChange={(e) => setFormCareArabic(e.target.value)}
                          placeholder="تنظيف جاف أو غسيل يدوي بماء بارد"
                          className="w-full bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs rounded text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#8E8A85] mb-1">بلد الصنع والتفصيل</label>
                        <input
                          type="text"
                          value={formOriginArabic}
                          onChange={(e) => setFormOriginArabic(e.target.value)}
                          placeholder="صنع في مصر"
                          className="w-full bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs rounded text-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SHARED SECTION: Colors, Sizes, and Photos */}
              <div className="pt-4 border-t border-[#333333] space-y-5">
                {/* Colors Multi-Select with Arabic labels */}
                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-2 font-semibold">
                    Colors Available (Multi-Select)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => {
                      const isSelected = formColors.some((fc) => fc.name === c.name);
                      return (
                        <button
                          type="button"
                          key={c.name}
                          onClick={() => toggleColor(c)}
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-sans border rounded transition-all ${
                            isSelected
                              ? 'bg-[#B67355] text-white border-[#B67355]'
                              : 'bg-[#141414] text-[#8E8A85] border-[#333333] hover:border-[#DCC9A6]'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/40"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>
                            {c.name} {c.nameArabic ? `(${c.nameArabic})` : ''}
                          </span>
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizes Multi-Select */}
                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-2 font-semibold">
                    Sizes Available
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SIZES.map((size) => {
                      const isSelected = formSizes.includes(size);
                      return (
                        <button
                          type="button"
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`px-3.5 py-1.5 text-xs font-sans uppercase font-bold border rounded transition-all ${
                            isSelected
                              ? 'bg-[#B67355] text-white border-[#B67355]'
                              : 'bg-[#141414] text-[#8E8A85] border-[#333333] hover:border-[#DCC9A6]'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Image Upload & Management */}
                <div className="space-y-3">
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] font-semibold">
                    Product Photography (Storage Upload or Web URL)
                  </label>

                  {/* File Upload to Firebase Storage */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#141414] border border-[#333333] hover:border-[#DCC9A6] text-[#DCC9A6] px-4 py-2.5 text-xs font-sans cursor-pointer transition-colors rounded">
                      <UploadCloud className="w-4 h-4" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    <div className="flex-1 flex gap-2 w-full">
                      <input
                        type="url"
                        placeholder="Or paste direct image URL (https://...)"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="flex-1 bg-[#141414] border border-[#333333] text-white px-3 py-2 text-xs font-sans rounded"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="bg-[#333333] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] text-white px-4 py-2 text-xs font-sans uppercase font-semibold transition-colors rounded"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Image Previews */}
                  {formImageUrls.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pt-2">
                      {formImageUrls.map((url, i) => (
                        <div
                          key={i}
                          className="relative w-20 h-24 bg-[#141414] border border-[#333333] rounded overflow-hidden shrink-0 group"
                        >
                          <Image src={url} alt={`Upload ${i}`} fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="absolute top-1 right-1 bg-red-600/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#333333]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 text-xs uppercase font-sans tracking-wider border border-[#333333] text-[#8E8A85] hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#B67355] text-white px-8 py-2.5 text-xs font-sans uppercase font-bold tracking-wider hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all shadow-lg rounded disabled:opacity-50"
                >
                  {saving ? 'Saving Piece...' : editingProduct ? 'Save Bilingual Changes' : 'Publish to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
