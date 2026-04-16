'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { productService } from '@/services/product.service';
import ProductCard from '@/components/common/ProductCard';
import Loader from '@/components/common/Loader';
import { Product } from '@/types';

const CATEGORIES = ['Furniture Hardware', 'Sanitary', 'Electrical', 'Home Decor'];
const PRODUCTS_PER_PAGE = 12;

interface Filters {
  categories: string[];
  minPrice: string;
  maxPrice: string;
  brand: string;
  featured: boolean;
}

export default function ShopPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    categories: initialCategory ? [initialCategory] : [],
    minPrice: '',
    maxPrice: '',
    brand: '',
    featured: false,
  });

  const [pendingFilters, setPendingFilters] = useState<Filters>({
    categories: initialCategory ? [initialCategory] : [],
    minPrice: '',
    maxPrice: '',
    brand: '',
    featured: false,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.categories.length === 1) params.category = filters.categories[0];
      if (filters.minPrice) params.minPrice = Number(filters.minPrice);
      if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
      if (filters.brand) params.brand = filters.brand;
      if (filters.featured) params.featured = true;

      const res = await productService.getProducts(params);
      const data = res.data?.data;

      // Handle both paginated and flat array responses
      if (Array.isArray(data)) {
        setProducts(data);
        setTotalPages(1);
        setTotalProducts(data.length);
      } else {
        const productKey = Object.keys(data).find(
          (k) => k !== 'total' && k !== 'page' && k !== 'pages'
        );
        const list: Product[] = productKey ? (data[productKey] as Product[]) : [];
        setProducts(list);
        setTotalPages(data.pages ?? 1);
        setTotalProducts(data.total ?? list.length);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync URL category param → filters when URL changes externally
  useEffect(() => {
    const urlCat = searchParams.get('category') || '';
    if (urlCat && !filters.categories.includes(urlCat)) {
      setFilters((prev) => ({ ...prev, categories: [urlCat] }));
      setPendingFilters((prev) => ({ ...prev, categories: [urlCat] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const toggleCategory = (cat: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const applyFilters = () => {
    setFilters(pendingFilters);
    setCurrentPage(1);
    setSidebarOpen(false);

    // Update URL param if exactly one category selected
    const params = new URLSearchParams(searchParams.toString());
    if (pendingFilters.categories.length === 1) {
      params.set('category', pendingFilters.categories[0]);
    } else {
      params.delete('category');
    }
    router.replace(`/shop?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    const reset: Filters = { categories: [], minPrice: '', maxPrice: '', brand: '', featured: false };
    setFilters(reset);
    setPendingFilters(reset);
    setCurrentPage(1);
    router.replace('/shop', { scroll: false });
  };

  const activeFilterCount =
    filters.categories.length +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.brand ? 1 : 0) +
    (filters.featured ? 1 : 0);

  const pageNumbers = (): number[] => {
    const pages: number[] = [];
    const delta = 2;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  };

  const FilterPanel = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={
        mobile
          ? 'w-full'
          : 'w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 h-fit sticky top-20'
      }
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-[#1e3a5f] dark:text-blue-300">Filters</h2>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-orange-500 hover:text-orange-700 font-medium underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={pendingFilters.categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-orange-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-[#1e3a5f] dark:group-hover:text-blue-300 transition">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Price Range (₹)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={pendingFilters.minPrice}
            onChange={(e) => setPendingFilters((p) => ({ ...p, minPrice: e.target.value }))}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            min={0}
          />
          <input
            type="number"
            placeholder="Max"
            value={pendingFilters.maxPrice}
            onChange={(e) => setPendingFilters((p) => ({ ...p, maxPrice: e.target.value }))}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            min={0}
          />
        </div>
      </div>

      {/* Brand */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Brand</h3>
        <input
          type="text"
          placeholder="Search brand..."
          value={pendingFilters.brand}
          onChange={(e) => setPendingFilters((p) => ({ ...p, brand: e.target.value }))}
          className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        />
      </div>

      {/* Featured Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setPendingFilters((p) => ({ ...p, featured: !p.featured }))}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${pendingFilters.featured ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
              }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${pendingFilters.featured ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured only</span>
        </label>
      </div>

      <button
        onClick={applyFilters}
        className="w-full bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-semibold py-2.5 rounded-lg transition text-sm"
      >
        Apply Filters
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="relative bg-[#1e3a5f] text-white py-16 px-4 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[2px] z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/90 to-transparent z-10" />
          <img src="https://www.the-future-of-commerce.com/wp-content/uploads/2020/01/thumbnail-d771a7f4e38fcf7614f297ea6c90f497-1200x370.jpeg" alt="Shop Background" className="w-full h-full object-cover opacity-80" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-block border border-white/20 bg-white/10 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 shadow-sm">
            B2B Marketplace
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow-md tracking-tight">Shop Wholesale Products</h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl drop-shadow-sm font-light">
            Equip your business with top-quality materials. Best prices for bulk orders.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="relative mb-6">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search products by name, brand, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FiX size={18} />
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Loading...' : `${totalProducts} products found`}
          </p>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm font-medium text-[#1e3a5f] dark:text-blue-300 shadow-sm"
          >
            <FiFilter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-orange-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Pills (desktop) */}
        {activeFilterCount > 0 && (
          <div className="hidden md:flex flex-wrap gap-2 mb-4">
            {filters.categories.map((cat) => (
              <span
                key={cat}
                className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium px-3 py-1 rounded-full"
              >
                {cat}
                <button
                  onClick={() => {
                    const updated = { ...filters, categories: filters.categories.filter((c) => c !== cat) };
                    setFilters(updated);
                    setPendingFilters(updated);
                    setCurrentPage(1);
                  }}
                >
                  <FiX size={12} />
                </button>
              </span>
            ))}
            {filters.featured && (
              <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full">
                Featured
                <button
                  onClick={() => {
                    const updated = { ...filters, featured: false };
                    setFilters(updated);
                    setPendingFilters(updated);
                  }}
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full">
                ₹{filters.minPrice || '0'} – ₹{filters.maxPrice || '∞'}
                <button
                  onClick={() => {
                    const updated = { ...filters, minPrice: '', maxPrice: '' };
                    setFilters(updated);
                    setPendingFilters(updated);
                  }}
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            {filters.brand && (
              <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full">
                Brand: {filters.brand}
                <button
                  onClick={() => {
                    const updated = { ...filters, brand: '' };
                    setFilters(updated);
                    setPendingFilters(updated);
                  }}
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Layout: sidebar + grid */}
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <FilterPanel />
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            <div className="hidden md:flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {loading ? 'Loading products...' : `${totalProducts} product${totalProducts !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {loading ? (
              <Loader />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <FiSearch size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No products found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Try adjusting your search or filters to find what you are looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-orange-500 hover:text-orange-700 underline font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <FiChevronLeft size={16} />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {currentPage > 3 && (
                        <>
                          <button
                            onClick={() => setCurrentPage(1)}
                            className="w-9 h-9 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          >
                            1
                          </button>
                          {currentPage > 4 && (
                            <span className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                              …
                            </span>
                          )}
                        </>
                      )}

                      {pageNumbers().map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium border transition ${num === currentPage
                              ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                          {num}
                        </button>
                      ))}

                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && (
                            <span className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                              …
                            </span>
                          )}
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-9 h-9 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative ml-auto w-80 max-w-full h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <span className="font-semibold text-[#1e3a5f] dark:text-blue-300 text-base">Filter Products</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <FiX size={22} />
              </button>
            </div>
            <div className="p-5 flex-1">
              <FilterPanel mobile />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
