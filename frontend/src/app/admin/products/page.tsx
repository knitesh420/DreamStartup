'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiChevronLeft, FiChevronRight, FiSearch, FiDownload } from 'react-icons/fi';
import { productService } from '@/services/product.service';
import { exportToExcel } from '@/utils/exportExcel';
import { Product } from '@/types';
import Loader from '@/components/common/Loader';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Furniture Hardware',
  'Sanitary',
  'Electrical',
  'Home Decor',
] as const;

const LIMIT = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TierFormData {
  minQty: string;
  maxQty: string;
  price: string;
}

interface ProductFormData {
  title: string;
  description: string;
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  moq: string;
  stock: string;
  featured: boolean;
  images: FileList | null;
  bulkPricingTiers: TierFormData[];
}

const EMPTY_TIER: TierFormData = { minQty: '', maxQty: '', price: '' };

const EMPTY_FORM: ProductFormData = {
  title: '',
  description: '',
  category: '',
  brand: '',
  minPrice: '',
  maxPrice: '',
  moq: '',
  stock: '',
  featured: false,
  images: null,
  bulkPricingTiers: [{ ...EMPTY_TIER }],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFormData(data: ProductFormData): FormData {
  const fd = new FormData();
  fd.append('title', data.title.trim());
  fd.append('description', data.description.trim());
  fd.append('category', data.category);
  fd.append('brand', data.brand.trim());
  fd.append('minPrice', data.minPrice);
  fd.append('maxPrice', data.maxPrice);
  fd.append('moq', data.moq);
  fd.append('stock', data.stock);
  fd.append('featured', String(data.featured));
  // Send bulk pricing tiers as JSON
  const validTiers = data.bulkPricingTiers.filter(t => t.minQty && t.price);
  fd.append('bulkPricingTiers', JSON.stringify(validTiers.map(t => ({
    minQty: Number(t.minQty),
    maxQty: t.maxQty ? Number(t.maxQty) : undefined,
    price: Number(t.price),
  }))));
  if (data.images) {
    Array.from(data.images).forEach((file) => fd.append('images', file));
  }
  return fd;
}

function formatPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

// ─── Confirm dialog (simple) ──────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-base font-medium text-gray-800">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Modal Form ───────────────────────────────────────────────────────

function ProductModal({
  editProduct,
  onClose,
  onSaved,
}: {
  editProduct: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(editProduct);
  const [form, setForm] = useState<ProductFormData>(() =>
    editProduct
      ? {
          title: editProduct.title,
          description: editProduct.description,
          category: editProduct.category,
          brand: editProduct.brand,
          minPrice: String(editProduct.minPrice),
          maxPrice: String(editProduct.maxPrice),
          moq: String(editProduct.moq),
          stock: String(editProduct.stock),
          featured: editProduct.featured,
          images: null,
          bulkPricingTiers: editProduct.bulkPricingTiers?.length
            ? editProduct.bulkPricingTiers.map(t => ({
                minQty: String(t.minQty),
                maxQty: t.maxQty ? String(t.maxQty) : '',
                price: String(t.price),
              }))
            : [{ ...EMPTY_TIER }],
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    if (target.type === 'checkbox') {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
    } else if (target.type === 'file') {
      setForm((prev) => ({ ...prev, images: target.files }));
    } else {
      setForm((prev) => ({ ...prev, [target.name]: target.value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.minPrice || !form.maxPrice || !form.moq || !form.stock) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      setSaving(true);
      const fd = buildFormData(form);
      if (isEdit && editProduct) {
        await productService.updateProduct(editProduct._id, fd);
        toast.success('Product updated successfully!');
      } else {
        await productService.createProduct(fd);
        toast.success('Product created successfully!');
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (err as { response?: { data?: { message?: string } } }).response!.data!.message!
          : err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-[#1e3a5f]">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g. Stainless Steel Hinges Set"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Product description..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Brand</label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="e.g. HardwareKing"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>

            {/* Min Price */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Min Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="minPrice"
                value={form.minPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Max Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="maxPrice"
                value={form.maxPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>

            {/* MOQ */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                MOQ (min 5) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="moq"
                value={form.moq}
                onChange={handleChange}
                required
                min="5"
                placeholder="Minimum order quantity (min 5)"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                required
                min="0"
                placeholder="Available units"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>

            {/* ─── Bulk Pricing Tiers ─── */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bulk Pricing Tiers
              </label>
              <div className="space-y-2">
                {form.bulkPricingTiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min Qty"
                      value={tier.minQty}
                      min="1"
                      onChange={(e) => {
                        const tiers = [...form.bulkPricingTiers];
                        tiers[idx] = { ...tiers[idx], minQty: e.target.value };
                        setForm((prev) => ({ ...prev, bulkPricingTiers: tiers }));
                      }}
                      className="w-1/4 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
                    />
                    <input
                      type="number"
                      placeholder="Max Qty (optional)"
                      value={tier.maxQty}
                      min="1"
                      onChange={(e) => {
                        const tiers = [...form.bulkPricingTiers];
                        tiers[idx] = { ...tiers[idx], maxQty: e.target.value };
                        setForm((prev) => ({ ...prev, bulkPricingTiers: tiers }));
                      }}
                      className="w-1/4 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
                    />
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={tier.price}
                      min="0"
                      step="0.01"
                      onChange={(e) => {
                        const tiers = [...form.bulkPricingTiers];
                        tiers[idx] = { ...tiers[idx], price: e.target.value };
                        setForm((prev) => ({ ...prev, bulkPricingTiers: tiers }));
                      }}
                      className="w-1/4 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (form.bulkPricingTiers.length <= 1) return;
                        const tiers = form.bulkPricingTiers.filter((_, i) => i !== idx);
                        setForm((prev) => ({ ...prev, bulkPricingTiers: tiers }));
                      }}
                      disabled={form.bulkPricingTiers.length <= 1}
                      className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, bulkPricingTiers: [...prev.bulkPricingTiers, { ...EMPTY_TIER }] }))}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1e3a5f] hover:text-[#16304f] transition"
              >
                <FiPlus size={14} /> Add Tier
              </button>
            </div>

            {/* Featured */}
            <div className="flex items-center gap-3 self-end pb-2.5">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
                className="h-4 w-4 cursor-pointer accent-orange-500"
              />
              <label htmlFor="featured" className="cursor-pointer text-sm font-medium text-gray-700">
                Featured product
              </label>
            </div>

            {/* Images */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Images {!isEdit && <span className="text-red-500">*</span>}
              </label>

              {/* Show preview of existing image if editing and no new file selected */}
              {isEdit && editProduct?.images?.[0] && (!form.images || form.images.length === 0) && (
                <div className="mb-3 flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-2">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={editProduct.images[0]}
                      className="h-full w-full object-cover"
                      alt="Current"
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'; }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Current Image</span>
                </div>
              )}

              <div
                className="cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-200 px-4 py-6 text-center transition hover:border-[#1e3a5f]/50 bg-white"
                onClick={() => fileRef.current?.click()}
              >
                {form.images && form.images.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="flex gap-3 justify-center mb-3">
                      {Array.from(form.images).slice(0, 3).map((f, i) => (
                        <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                          <img src={URL.createObjectURL(f)} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <p className="text-[13px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                      {form.images.length} new file{form.images.length > 1 ? 's' : ''} ready to save
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-[#1e3a5f]">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    </div>
                    <p className="text-sm text-[#1e3a5f] font-bold mt-1">
                      Click to upload new images
                    </p>
                    <p className="text-xs text-gray-400">
                      Supports JPG, PNG, WebP
                    </p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  name="images"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#16304f] disabled:opacity-60"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : null}
              {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal / confirm
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (categoryFilter) params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await productService.getProducts(params);
      const raw = res.data;

      // Normalise API response shape
      let items: Product[] = [];
      let pages = 1;
      if (Array.isArray(raw)) {
        items = raw;
      } else if (Array.isArray(raw?.data)) {
        items = raw.data;
        pages = raw?.pages ?? 1;
      } else if (Array.isArray(raw?.data?.products)) {
        items = raw.data.products;
        pages = raw.data?.pages ?? 1;
      }
      setProducts(items);
      setTotalPages(pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load products.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, search]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditProduct(null);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await productService.deleteProduct(deleteTarget._id);
      toast.success(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      // If the page is now empty (and not the first page), go back one page
      if (products.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchProducts();
      }
    } catch {
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (products.length === 0) return;
    const data = products.map((p) => ({
      Title: p.title,
      Category: p.category,
      Brand: p.brand || '',
      'Min Price': p.minPrice,
      'Max Price': p.maxPrice,
      MOQ: p.moq,
      Stock: p.stock,
      Featured: p.featured ? 'Yes' : 'No',
    }));
    exportToExcel(data, 'products');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Products</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your wholesale product catalogue.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={products.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 disabled:opacity-40"
          >
            <FiDownload size={18} />
            Export Excel
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
          >
            <FiPlus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading && <Loader />}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-16 text-center text-gray-500">
          No products found.{' '}
          <button onClick={openAdd} className="font-semibold text-orange-500 hover:underline">
            Add the first one
          </button>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          {/* Table wrapper */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">Image</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Brand</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Price</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">MOQ</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Stock</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Featured</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="transition hover:bg-gray-50/60"
                  >
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80';
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300 text-xs">
                            No img
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Title */}
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate font-medium text-gray-800">{product.title}</p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-gray-600">{product.category}</td>

                    {/* Brand */}
                    <td className="px-4 py-3 text-gray-600">{product.brand || '—'}</td>

                    {/* Price */}
                    <td className="px-4 py-3 font-semibold text-[#1e3a5f]">
                      {product.minPrice === product.maxPrice
                        ? formatPrice(product.minPrice)
                        : `${formatPrice(product.minPrice)}–${formatPrice(product.maxPrice)}`}
                    </td>

                    {/* MOQ */}
                    <td className="px-4 py-3 text-gray-600">{product.moq}</td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'font-medium',
                          product.stock === 0
                            ? 'text-red-500'
                            : product.stock < 20
                            ? 'text-yellow-600'
                            : 'text-gray-700',
                        ].join(' ')}
                      >
                        {product.stock}
                      </span>
                    </td>

                    {/* Featured dot */}
                    <td className="px-4 py-3 text-center">
                      <span
                        title={product.featured ? 'Featured' : 'Not featured'}
                        className={[
                          'inline-block h-3 w-3 rounded-full',
                          product.featured ? 'bg-green-500' : 'bg-gray-300',
                        ].join(' ')}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          title="Edit"
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          title="Delete"
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft size={16} />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <ProductModal
          editProduct={editProduct}
          onClose={() => setShowModal(false)}
          onSaved={fetchProducts}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
