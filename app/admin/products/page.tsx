'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Palette,
  Layers,
  Grid,
  RotateCcw,
  Sliders,
  CheckCheck,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { getProducts, saveProduct, deleteProduct } from '@/lib/productService';
import { compressImage } from '@/lib/imageUtils';
import { getCategories, DEFAULT_CATEGORIES } from '@/lib/categoryService';
import { Product, ProductColor, CategoryType, Category, ProductVariant } from '@/types';
import { useToast } from '@/context/ToastContext';

export const PRESET_COLORS: ProductColor[] = [
  // Luxury Neutrals
  { name: 'Oatmeal Beige', nameArabic: 'بيج كشمير', hex: '#DCC9A6' },
  { name: 'Warm Taupe', nameArabic: 'بني دافئ', hex: '#B67355' },
  { name: 'Midnight Black', nameArabic: 'أسود ملكي', hex: '#1F1F1F' },
  { name: 'Pure White', nameArabic: 'أبيض ناصع', hex: '#FFFFFF' },
  { name: 'Alabaster Ivory', nameArabic: 'أبيض عاجي', hex: '#F6F3EE' },
  { name: 'Sand Dune', nameArabic: 'رملي صحراوي', hex: '#C2B280' },
  { name: 'Vanilla Cream', nameArabic: 'فانيلا كريمي', hex: '#FDFBF7' },
  { name: 'Espresso Charcoal', nameArabic: 'رمادي إسبريسو', hex: '#2A2A2A' },
  { name: 'Slate Smoke', nameArabic: 'رمادي دخاني', hex: '#708090' },
  // Haute Couture & Jewels
  { name: 'Emerald Green', nameArabic: 'أخضر زمردي', hex: '#097969' },
  { name: 'Royal Navy', nameArabic: 'كحلي ملكي', hex: '#002366' },
  { name: 'Burgundy Wine', nameArabic: 'نبيتي بورغندي', hex: '#800020' },
  { name: 'Terracotta Rust', nameArabic: 'تيراكوتا برونزي', hex: '#9E5D41' },
  { name: 'Plum Violet', nameArabic: 'بنفسجي داكن', hex: '#581845' },
  { name: 'Burnt Ochre', nameArabic: 'أوكر خردلي', hex: '#CC7722' },
  { name: 'Ruby Crimson', nameArabic: 'أحمر ياقوتي', hex: '#9B111E' },
  { name: 'Deep Teal', nameArabic: 'بترولي ملكي', hex: '#005F73' },
  { name: 'Olive Green', nameArabic: 'أخضر زيتوني', hex: '#556B2F' },
  // Pastels & Soft Hues
  { name: 'Sage Green', nameArabic: 'أخضر ميرمية', hex: '#8A9A86' },
  { name: 'Dusty Rose', nameArabic: 'وردي كلاسيكي', hex: '#C28B82' },
  { name: 'Sky Powder Blue', nameArabic: 'أزرق سماوي', hex: '#87CEEB' },
  { name: 'Lavender Mist', nameArabic: 'لافندر ناعم', hex: '#E6E6FA' },
  { name: 'Butter Cream', nameArabic: 'أصفر زبدة', hex: '#FFFDD0' },
  { name: 'Soft Mint', nameArabic: 'نعناعي فاتح', hex: '#98FF98' },
  // Metallics & Silks
  { name: 'Champagne Gold', nameArabic: 'حرير شامبين', hex: '#EDE3CF' },
  { name: 'Silver Satin', nameArabic: 'فضي ساتان', hex: '#C0C0C0' },
  { name: 'Rose Gold', nameArabic: 'روز جولد', hex: '#B76E79' },
];

export const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

export default function AdminProductsPage() {
  const { success, error, info } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOutOfStock, setShowOutOfStock] = useState(false);

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
  const [formDescription, setFormDescription] = useState('');
  const [formFabric, setFormFabric] = useState('100% Premium Organic Linen');
  const [formFit, setFormFit] = useState('Relaxed Tailored Fit');
  const [formCare, setFormCare] = useState('Dry clean recommended');
  const [formOrigin, setFormOrigin] = useState('Handcrafted in Egypt');
  const [formModelInfo, setFormModelInfo] = useState('Model is 174cm wearing size S');
  const [formColors, setFormColors] = useState<ProductColor[]>([]);
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L']);
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [formImageUrls, setFormImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Custom Color Creator State
  const [customColorName, setCustomColorName] = useState('');
  const [customColorNameArabic, setCustomColorNameArabic] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#B67355');
  const [showCustomColorForm, setShowCustomColorForm] = useState(false);
  const [savedCustomColors, setSavedCustomColors] = useState<ProductColor[]>([]);

  // Custom Size Creator State
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [showCustomSizeForm, setShowCustomSizeForm] = useState(false);

  // Form State (Arabic)
  const [formNameArabic, setFormNameArabic] = useState('');
  const [formDescriptionArabic, setFormDescriptionArabic] = useState('');
  const [formFabricArabic, setFormFabricArabic] = useState('');
  const [formFitArabic, setFormFitArabic] = useState('');
  const [formCareArabic, setFormCareArabic] = useState('');
  const [formOriginArabic, setFormOriginArabic] = useState('صنع بأيدي مصرية محترفة في القاهرة');
  const [formModelInfoArabic, setFormModelInfoArabic] = useState('');

  // Load custom colors from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('armia_custom_colors');
      if (stored) {
        setSavedCustomColors(JSON.parse(stored));
      }
    } catch {}
  }, []);

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

  // Compute Total Stock dynamically from Variants
  const totalStockQuantity = useMemo(() => {
    if (!formVariants || formVariants.length === 0) return 0;
    return formVariants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
  }, [formVariants]);

  // Synchronize variants when formColors or formSizes change
  const syncVariants = useCallback((colors: ProductColor[], sizes: string[], currentVars: ProductVariant[]) => {
    const newVars: ProductVariant[] = [];
    colors.forEach((c) => {
      sizes.forEach((s) => {
        const existing = currentVars.find((v) => v.color === c.name && v.size === s);
        newVars.push({
          color: c.name,
          size: s,
          quantity: existing !== undefined ? existing.quantity : 5,
        });
      });
    });
    return newVars;
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setModalLangTab('en');
    setFormName('');
    setFormCategory('dresses');
    setFormPrice(450);
    setFormDiscountPrice(undefined);
    setFormDescription('An exquisite silhouette crafted with precision and timeless elegance.');
    setFormFabric('100% Premium Organic Linen');
    setFormFit('Relaxed Tailored Fit');
    setFormCare('Dry clean or gentle hand wash');
    setFormOrigin('Handcrafted in Egypt');
    setFormModelInfo('Model is 174cm wearing size S');

    const defaultColors = [PRESET_COLORS[0], PRESET_COLORS[2]];
    const defaultSizes = ['S', 'M', 'L'];
    setFormColors(defaultColors);
    setFormSizes(defaultSizes);
    setFormVariants(syncVariants(defaultColors, defaultSizes, []));
    setFormImageUrls(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900']);

    // Reset Arabic fields with defaults
    setFormNameArabic('');
    setFormDescriptionArabic('');
    setFormFabricArabic('كتان فرنسي عضوي طبيعي 100%');
    setFormFitArabic('قصّة عصرية مريحة مع تفصيل متقن');
    setFormCareArabic('تنظيف جاف أو غسيل يدوي لطيف بالماء البارد');
    setFormOriginArabic('صنع بأيدي مصرية محترفة في القاهرة');
    setFormModelInfoArabic('العارضة ترتدي مقاس S بطول 174 سم');

    setShowCustomColorForm(false);
    setShowCustomSizeForm(false);
    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setModalLangTab('en');
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormPrice(prod.price);
    setFormDiscountPrice(prod.discountPrice);
    setFormDescription(prod.description || '');
    setFormFabric(prod.specs?.fabric || '');
    setFormFit(prod.specs?.fit || '');
    setFormCare(prod.specs?.care || '');
    setFormOrigin(prod.specs?.origin || 'Handcrafted in Egypt');
    setFormModelInfo(prod.specs?.modelInfo || '');

    const colors = prod.colors && prod.colors.length > 0 ? prod.colors : [PRESET_COLORS[0]];
    const sizes = prod.sizes && prod.sizes.length > 0 ? prod.sizes : ['Standard'];
    setFormColors(colors);
    setFormSizes(sizes);

    if (prod.variants && prod.variants.length > 0) {
      setFormVariants(prod.variants);
    } else {
      // Create initial variants with distributed stock
      setFormVariants(syncVariants(colors, sizes, []));
    }

    setFormImageUrls(prod.imageUrls || []);

    // Load Arabic fields
    setFormNameArabic(prod.nameArabic || '');
    setFormDescriptionArabic(prod.descriptionArabic || '');
    setFormFabricArabic(prod.specs?.fabricArabic || '');
    setFormFitArabic(prod.specs?.fitArabic || '');
    setFormCareArabic(prod.specs?.careArabic || '');
    setFormOriginArabic(prod.specs?.originArabic || 'صنع في مصر');
    setFormModelInfoArabic(prod.specs?.modelInfoArabic || '');

    setShowCustomColorForm(false);
    setShowCustomSizeForm(false);
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

  // Color Toggling with Variant Sync
  const toggleColor = (color: ProductColor) => {
    let nextColors: ProductColor[];
    if (formColors.some((c) => c.name === color.name)) {
      if (formColors.length <= 1) {
        error('A product must have at least 1 color.');
        return;
      }
      nextColors = formColors.filter((c) => c.name !== color.name);
    } else {
      nextColors = [...formColors, color];
    }
    setFormColors(nextColors);
    setFormVariants((prev) => syncVariants(nextColors, formSizes, prev));
  };

  // Select All Preset Colors
  const handleSelectAllColors = () => {
    const combined = [...PRESET_COLORS, ...savedCustomColors];
    setFormColors(combined);
    setFormVariants((prev) => syncVariants(combined, formSizes, prev));
    info('Selected all available colors in palette');
  };

  // Size Toggling with Variant Sync
  const toggleSize = (size: string) => {
    let nextSizes: string[];
    if (formSizes.includes(size)) {
      if (formSizes.length <= 1) {
        error('A product must have at least 1 size.');
        return;
      }
      nextSizes = formSizes.filter((s) => s !== size);
    } else {
      nextSizes = [...formSizes, size];
    }
    setFormSizes(nextSizes);
    setFormVariants((prev) => syncVariants(formColors, nextSizes, prev));
  };

  // Add Custom Color
  const handleAddCustomColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customColorName.trim()) {
      error('Please enter English color name (e.g. Emerald Satin)');
      return;
    }

    const newColor: ProductColor = {
      name: customColorName.trim(),
      nameArabic: customColorNameArabic.trim() || undefined,
      hex: customColorHex,
    };

    // Save to persistent custom colors list
    const updatedCustom = [...savedCustomColors.filter((c) => c.name !== newColor.name), newColor];
    setSavedCustomColors(updatedCustom);
    try {
      localStorage.setItem('armia_custom_colors', JSON.stringify(updatedCustom));
    } catch {}

    // Add to active product colors
    const nextColors = [...formColors.filter((c) => c.name !== newColor.name), newColor];
    setFormColors(nextColors);
    setFormVariants((prev) => syncVariants(nextColors, formSizes, prev));

    setCustomColorName('');
    setCustomColorNameArabic('');
    setShowCustomColorForm(false);
    success(`Custom color "${newColor.name}" added to product!`, 'Color Added');
  };

  // Add Custom Size
  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    const sizeName = customSizeInput.trim().toUpperCase();
    if (!sizeName) return;

    if (!formSizes.includes(sizeName)) {
      const nextSizes = [...formSizes, sizeName];
      setFormSizes(nextSizes);
      setFormVariants((prev) => syncVariants(formColors, nextSizes, prev));
    }
    setCustomSizeInput('');
    setShowCustomSizeForm(false);
    success(`Size "${sizeName}" added!`, 'Size Added');
  };

  // Variant Quantity Change
  const handleVariantQtyChange = (colorName: string, sizeName: string, qty: number) => {
    setFormVariants((prev) => {
      const idx = prev.findIndex((v) => v.color === colorName && v.size === sizeName);
      const updated = [...prev];
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], quantity: Math.max(0, qty) };
      } else {
        updated.push({ color: colorName, size: sizeName, quantity: Math.max(0, qty) });
      }
      return updated;
    });
  };

  // Bulk Quantity Fill
  const handleBulkFill = (qty: number) => {
    setFormVariants((prev) =>
      prev.map((v) => ({
        ...v,
        quantity: Math.max(0, qty),
      }))
    );
    info(`All variants set to ${qty} units`);
  };

  // Row (Color) Fill
  const handleRowFill = (colorName: string, qty: number) => {
    setFormVariants((prev) =>
      prev.map((v) => (v.color === colorName ? { ...v, quantity: Math.max(0, qty) } : v))
    );
    info(`All sizes for "${colorName}" set to ${qty} units`);
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
        category: formCategory,
        price: Number(formPrice),
        stockQuantity: totalStockQuantity,
        description: formDescription.trim(),
        colors: formColors.length > 0 ? formColors : [PRESET_COLORS[0]],
        sizes: formSizes.length > 0 ? formSizes : ['Standard'],
        variants: formVariants,
        imageUrls: formImageUrls,
        isNewArrival: formCategory === 'new-in' || Boolean(editingProduct?.isNewArrival),
        featured: true,
        specs: {
          fabric: formFabric.trim() || 'Premium Haute Couture Fabric',
          fit: formFit.trim() || 'Tailored Elegance',
          care: formCare.trim() || 'Dry Clean or Delicate Cold Wash',
          origin: formOrigin.trim() || 'Handcrafted in Egypt',
          modelInfo: formModelInfo.trim() || 'Model wearing Size S',
          ...(formFabricArabic.trim() ? { fabricArabic: formFabricArabic.trim() } : {}),
          ...(formFitArabic.trim() ? { fitArabic: formFitArabic.trim() } : {}),
          ...(formCareArabic.trim() ? { careArabic: formCareArabic.trim() } : {}),
          ...(formOriginArabic.trim() ? { originArabic: formOriginArabic.trim() } : {}),
          ...(formModelInfoArabic.trim() ? { modelInfoArabic: formModelInfoArabic.trim() } : {}),
        },
        ...(formNameArabic.trim() ? { nameArabic: formNameArabic.trim() } : {}),
        ...(formDescriptionArabic.trim() ? { descriptionArabic: formDescriptionArabic.trim() } : {}),
        ...(formDiscountPrice ? { discountPrice: Number(formDiscountPrice) } : {}),
      };

      if (editingProduct) {
        payload.id = editingProduct.id;
      }

      await saveProduct(payload);
      success(
        `Product "${formName}" ${editingProduct ? 'updated' : 'created'} successfully with ${formColors.length} colors, ${formSizes.length} sizes, and ${totalStockQuantity} total units!`,
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
        error('Failed to delete product from database');
      }
    }
  };

  const getProductStock = useCallback((p: Product): number => {
    if (typeof p.stockQuantity === 'number') return p.stockQuantity;
    if (p.variants && p.variants.length > 0) {
      return p.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
    }
    return 0;
  }, []);

  const inStockCount = useMemo(() => {
    return products.filter((p) => getProductStock(p) > 0).length;
  }, [products, getProductStock]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => getProductStock(p) <= 0).length;
  }, [products, getProductStock]);

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameArabic && p.nameArabic.includes(searchQuery)) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const stock = getProductStock(p);
    const matchStock = showOutOfStock ? stock <= 0 : stock > 0;

    return matchCat && matchSearch && matchStock;
  });

  const allAvailableColors = useMemo(() => {
    const names = new Set(PRESET_COLORS.map((c) => c.name));
    const customFiltered = savedCustomColors.filter((c) => !names.has(c.name));
    return [...PRESET_COLORS, ...customFiltered];
  }, [savedCustomColors]);

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-6">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#B67355]">
            Atelier Inventory & Catalog
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Product Management (CRUD)
          </h1>
          <p className="text-xs text-[#8E8A85] mt-1">
            Create and manage luxury items with multi-color palettes, custom color creator, and size-by-color stock matrix.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-[#DCC9A6] hover:bg-white text-[#1F1F1F] px-5 py-2.5 text-xs uppercase tracking-wider font-bold transition-all shadow-lg active:scale-95 rounded"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#1F1F1F] border border-[#333333] p-4 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#B67355] text-white'
                : 'text-[#8E8A85] hover:text-white bg-[#141414]'
            }`}
          >
            All Products ({showOutOfStock ? outOfStockCount : inStockCount})
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-[#B67355] text-white'
                  : 'text-[#8E8A85] hover:text-white bg-[#141414]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end flex-wrap">
          {/* Out of Stock Check Toggle Button */}
          <button
            type="button"
            onClick={() => setShowOutOfStock(!showOutOfStock)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none ${
              showOutOfStock
                ? 'bg-red-950/70 border-red-700 text-red-200 shadow-sm'
                : 'bg-[#141414] border-[#333333] text-[#DCC9A6] hover:border-[#DCC9A6]/60 hover:text-white'
            }`}
            title="Check to show out of stock items, uncheck to show items with available quantities as normal"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                showOutOfStock
                  ? 'bg-red-500 border-red-400 text-white'
                  : 'border-[#666666] bg-[#1F1F1F]'
              }`}
            >
              {showOutOfStock && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>
              {showOutOfStock ? 'Showing Out of Stock' : 'Show Out of Stock'}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                showOutOfStock
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-black text-[#8E8A85] border border-[#333333]'
              }`}
            >
              {showOutOfStock ? `${outOfStockCount} items` : `${inStockCount} in stock`}
            </span>
          </button>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8A85]" />
            <input
              type="text"
              placeholder="Search products or colors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#333333] text-white pl-9 pr-3 py-1.5 text-xs rounded focus:outline-none focus:border-[#DCC9A6]"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#1F1F1F] border border-[#333333] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#DCC9A6]">
            <div className="w-8 h-8 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs uppercase tracking-wider">Loading Inventory Catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-[#8E8A85] space-y-2">
            <Package className="w-8 h-8 mx-auto text-[#555555]" />
            <p className="text-xs font-serif text-white">
              {showOutOfStock
                ? 'No out-of-stock products found. All items currently have inventory available!'
                : 'No products found matching criteria.'}
            </p>
            {showOutOfStock && (
              <button
                type="button"
                onClick={() => setShowOutOfStock(false)}
                className="mt-2 text-xs text-[#DCC9A6] underline hover:text-white"
              >
                Uncheck to show products with available quantities ({inStockCount} in stock)
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#141414] text-[10px] uppercase tracking-wider text-[#DCC9A6] border-b border-[#333333]">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price (EGP)</th>
                  <th className="py-3 px-4">Total Stock</th>
                  <th className="py-3 px-4">Colors</th>
                  <th className="py-3 px-4">Sizes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2B2B]">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 bg-black rounded shrink-0 overflow-hidden border border-[#333333]">
                          {prod.imageUrls && prod.imageUrls.length > 0 ? (
                            <Image src={prod.imageUrls[0]} alt={prod.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#555555]">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate">{prod.name}</span>
                          {prod.nameArabic && (
                            <span className="text-[11px] text-[#DCC9A6] block truncate font-sans" dir="rtl">
                              {prod.nameArabic}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#8E8A85] uppercase tracking-wider text-[11px]">
                      {prod.category}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {prod.discountPrice ? (
                        <div className="flex flex-col">
                          <span className="text-emerald-400 font-bold">EGP {prod.discountPrice.toLocaleString()}</span>
                          <span className="text-[10px] text-[#8E8A85] line-through">EGP {prod.price.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-white font-bold">EGP {prod.price.toLocaleString()}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        prod.stockQuantity > 5
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : prod.stockQuantity > 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {prod.stockQuantity} pcs
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {prod.colors?.slice(0, 4).map((c) => (
                          <span
                            key={c.name}
                            className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                            style={{ backgroundColor: c.hex }}
                            title={`${c.name} (${c.nameArabic || ''})`}
                          />
                        ))}
                        {prod.colors && prod.colors.length > 4 && (
                          <span className="text-[10px] text-[#8E8A85]">+{prod.colors.length - 4}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-[#A0A0A0]">
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
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-[#1F1F1F] border border-[#333333] p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto space-y-6 rounded-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#B67355] font-bold">
                  Bilingual Boutique Catalog & Inventory Matrix
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

                    <div>
                      <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] mb-1 font-semibold">
                        Computed Total Stock
                      </label>
                      <div className="w-full bg-[#141414] border border-[#333333] px-3.5 py-2.5 text-xs font-mono text-emerald-400 font-bold rounded flex items-center justify-between">
                        <span>{totalStockQuantity} Units Total</span>
                        <span className="text-[10px] text-[#8E8A85] font-normal">(Auto-calculated from matrix)</span>
                      </div>
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

              {/* SHARED SECTION: COLORS, SIZES, AND INVENTORY MATRIX */}
              <div className="pt-4 border-t border-[#333333] space-y-6">
                
                {/* 1. COLORS PALETTE & CUSTOM COLOR CREATOR */}
                <div className="space-y-3 bg-[#141414] p-4 rounded-xl border border-[#333333]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#DCC9A6]" />
                      <label className="text-xs font-sans uppercase tracking-wider text-white font-bold">
                        1. Select Colors ({formColors.length} selected)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllColors}
                        className="text-[11px] text-[#DCC9A6] hover:text-white underline font-semibold transition-colors"
                      >
                        Select All Palette
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCustomColorForm(!showCustomColorForm)}
                        className="bg-[#B67355] hover:bg-[#A35C3E] text-white px-3 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Extra Color</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Color Creator Modal / Form */}
                  {showCustomColorForm && (
                    <div className="bg-[#1C1C1C] border border-[#DCC9A6]/40 p-3.5 rounded-xl space-y-3 animate-scaleUp">
                      <span className="text-[10px] uppercase font-bold text-[#DCC9A6] tracking-wider block">
                        🎨 Create Bespoke Atelier Color:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="flex items-center gap-2 bg-[#141414] p-1 rounded border border-[#333333]">
                          <input
                            type="color"
                            value={customColorHex}
                            onChange={(e) => setCustomColorHex(e.target.value)}
                            className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={customColorHex}
                            onChange={(e) => setCustomColorHex(e.target.value)}
                            className="w-20 bg-transparent text-xs font-mono text-white outline-none"
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="Color Name (EN) e.g. Emerald Silk"
                          value={customColorName}
                          onChange={(e) => setCustomColorName(e.target.value)}
                          className="bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[#DCC9A6]"
                        />

                        <input
                          type="text"
                          dir="rtl"
                          placeholder="اسم اللون (عربي) مثال: حرير زمردي"
                          value={customColorNameArabic}
                          onChange={(e) => setCustomColorNameArabic(e.target.value)}
                          className="bg-[#141414] border border-[#333333] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[#DCC9A6] text-right"
                        />

                        <button
                          type="button"
                          onClick={handleAddCustomColor}
                          className="bg-[#DCC9A6] text-[#1F1F1F] hover:bg-white font-bold text-xs py-1.5 px-3 rounded transition-colors"
                        >
                          Save & Add to Product
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Multi-Select Color Swatches Grid */}
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {allAvailableColors.map((c) => {
                      const isSelected = formColors.some((fc) => fc.name === c.name);
                      return (
                        <button
                          type="button"
                          key={c.name}
                          onClick={() => toggleColor(c)}
                          className={`flex items-center gap-2 px-2.5 py-1 text-xs border rounded-lg transition-all ${
                            isSelected
                              ? 'bg-[#B67355] text-white border-[#B67355] shadow-sm font-semibold'
                              : 'bg-[#1C1C1C] text-[#8E8A85] border-[#2A2A2A] hover:border-[#444444]'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                          {c.nameArabic && <span className="text-[10px] opacity-75">({c.nameArabic})</span>}
                          {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SIZES PALETTE & CUSTOM SIZE CREATOR */}
                <div className="space-y-3 bg-[#141414] p-4 rounded-xl border border-[#333333]">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#DCC9A6]" />
                      <label className="text-xs font-sans uppercase tracking-wider text-white font-bold">
                        2. Select Sizes ({formSizes.length} selected)
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCustomSizeForm(!showCustomSizeForm)}
                      className="bg-[#2A2A2A] hover:bg-[#333333] text-[#DCC9A6] px-3 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Size</span>
                    </button>
                  </div>

                  {showCustomSizeForm && (
                    <div className="flex gap-2 animate-scaleUp">
                      <input
                        type="text"
                        placeholder="e.g. 4XL, BESPOKE, PETITE..."
                        value={customSizeInput}
                        onChange={(e) => setCustomSizeInput(e.target.value)}
                        className="bg-[#1C1C1C] border border-[#333333] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[#DCC9A6]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSize}
                        className="bg-[#DCC9A6] text-[#1F1F1F] font-bold px-4 py-1.5 rounded text-xs"
                      >
                        Add Size
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {PRESET_SIZES.map((size) => {
                      const isSelected = formSizes.includes(size);
                      return (
                        <button
                          type="button"
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border rounded-lg transition-all ${
                            isSelected
                              ? 'bg-[#B67355] text-white border-[#B67355] shadow-sm'
                              : 'bg-[#1C1C1C] text-[#8E8A85] border-[#2A2A2A] hover:border-[#444444]'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. ADVANCED INVENTORY MATRIX (QUANTITY PER COLOR & PER SIZE) */}
                <div className="space-y-4 bg-[#141414] p-4 rounded-xl border-2 border-[#DCC9A6]/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Grid className="w-4 h-4 text-[#DCC9A6]" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          3. Advanced Inventory Matrix (Stock per Color & Size)
                        </h4>
                      </div>
                      <span className="text-[11px] text-[#8E8A85] mt-0.5 block">
                        Set precise inventory for every color & size combination. Total stock sums to <strong>{totalStockQuantity} units</strong>.
                      </span>
                    </div>

                    {/* Bulk Quick Fill Actions */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[10px] uppercase text-[#8E8A85] font-semibold mr-1">⚡ Quick Set:</span>
                      <button
                        type="button"
                        onClick={() => handleBulkFill(10)}
                        className="bg-[#242424] hover:bg-[#B67355] text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors"
                      >
                        All = 10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkFill(5)}
                        className="bg-[#242424] hover:bg-[#B67355] text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors"
                      >
                        All = 5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkFill(0)}
                        className="bg-[#242424] hover:bg-red-600 text-[#8E8A85] hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors"
                      >
                        Clear (0)
                      </button>
                    </div>
                  </div>

                  {/* Matrix Table */}
                  <div className="overflow-x-auto rounded-lg border border-[#2B2B2B]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#1C1C1C] text-[10px] uppercase tracking-wider text-[#DCC9A6] border-b border-[#333333]">
                        <tr>
                          <th className="p-2.5 min-w-[140px]">Color</th>
                          {formSizes.map((s) => (
                            <th key={s} className="p-2.5 text-center min-w-[70px]">
                              Size {s}
                            </th>
                          ))}
                          <th className="p-2.5 text-center min-w-[80px]">Color Total</th>
                          <th className="p-2.5 text-right min-w-[100px]">Fill Row</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262626]">
                        {formColors.map((color) => {
                          const rowTotal = formSizes.reduce((sum, s) => {
                            const v = formVariants.find((x) => x.color === color.name && x.size === s);
                            return sum + (v ? Number(v.quantity) || 0 : 0);
                          }, 0);

                          return (
                            <tr key={color.name} className="hover:bg-[#181818] transition-colors">
                              <td className="p-2.5 font-medium flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/40 shrink-0"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span className="text-white text-xs">{color.name}</span>
                              </td>

                              {formSizes.map((size) => {
                                const variant = formVariants.find(
                                  (x) => x.color === color.name && x.size === size
                                );
                                const qty = variant !== undefined ? variant.quantity : 0;

                                return (
                                  <td key={size} className="p-2 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      value={qty}
                                      onChange={(e) =>
                                        handleVariantQtyChange(color.name, size, Number(e.target.value))
                                      }
                                      className={`w-16 text-center font-mono py-1 px-1.5 rounded text-xs font-bold border outline-none transition-colors ${
                                        qty > 0
                                          ? 'bg-[#141414] border-[#333333] text-emerald-400 focus:border-[#DCC9A6]'
                                          : 'bg-[#141414] border-red-900/40 text-red-400 focus:border-red-500'
                                      }`}
                                    />
                                  </td>
                                );
                              })}

                              <td className="p-2.5 text-center font-mono font-bold text-white">
                                {rowTotal} pcs
                              </td>

                              <td className="p-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRowFill(color.name, 5)}
                                    className="px-2 py-0.5 bg-[#222222] hover:bg-[#333333] text-[#A0A0A0] hover:text-white rounded text-[10px]"
                                    title="Set this color's sizes to 5"
                                  >
                                    5
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRowFill(color.name, 10)}
                                    className="px-2 py-0.5 bg-[#222222] hover:bg-[#333333] text-[#A0A0A0] hover:text-white rounded text-[10px]"
                                    title="Set this color's sizes to 10"
                                  >
                                    10
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. PRODUCT IMAGES */}
                <div className="space-y-3 bg-[#141414] p-4 rounded-xl border border-[#333333]">
                  <label className="block text-xs font-sans uppercase tracking-wider text-[#DCC9A6] font-bold">
                    4. Product Photography (Upload or URL)
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1F1F1F] border border-[#333333] hover:border-[#DCC9A6] text-[#DCC9A6] px-4 py-2.5 text-xs font-sans cursor-pointer transition-colors rounded">
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
                        className="flex-1 bg-[#1F1F1F] border border-[#333333] text-white px-3 py-2 text-xs font-sans rounded"
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
