'use client';
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { FiShoppingCart, FiMenu, FiX, FiSearch, FiMoon, FiSun, FiArrowRight } from 'react-icons/fi';
import { productService } from '@/services/product.service';
import { Product } from '@/types';

const CATEGORIES = [
  { name: 'Furniture Hardware', icon: '🔩' },
  { name: 'Sanitary', icon: '🚿' },
  { name: 'Electrical', icon: '⚡' },
  { name: 'Home Decor', icon: '🏠' },
];

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

function getImageUrl(images?: string[]): string {
  if (!images || images.length === 0) return '';
  const src = images[0];
  if (src.startsWith('http')) return src;
  return `${API_BASE}${src.startsWith('/') ? '' : '/'}${src}`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Auto-close menu on route change
  useEffect(() => {
    setIsOpen(false);
    setShowSearch(false);
    setSearchQuery('');
  }, [pathname]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchRef.current && !searchRef.current.contains(e.target as Node) &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const fetchSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await productService.getProducts({ search: query.trim(), limit: 6 });
      const raw = res.data;
      let items: Product[] = [];
      if (Array.isArray(raw)) items = raw;
      else if (Array.isArray(raw?.data)) items = raw.data;
      else if (Array.isArray(raw?.data?.products)) items = raw.data.products;
      setSearchResults(items);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchSearch]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setShowSearch(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Wholesale', path: '/shop' },
    { name: 'Startup Kits', path: '/startup' },
    { name: 'Services', path: '/providers' },
    { name: 'Contact Us', path: '/contact' },
  ];

  // Search dropdown content (shared between desktop and mobile)
  const SearchDropdown = () => (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[70vh] overflow-y-auto">
      {/* Categories row */}
      {searchQuery.trim().length < 2 && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Browse Categories</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition text-sm font-medium text-gray-700 hover:text-blue-700"
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {searchLoading && searchQuery.trim().length >= 2 && (
        <div className="flex items-center justify-center py-8">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        </div>
      )}

      {/* Results */}
      {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length > 0 && (
        <div>
          <div className="px-4 pt-3 pb-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Products ({searchResults.length})
            </p>
          </div>
          {searchResults.map((product) => (
            <Link
              key={product._id}
              href={`/shop/${product._id}`}
              onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/60 transition"
            >
              <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {getImageUrl(product.images) ? (
                  <img
                    src={getImageUrl(product.images)}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    No img
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{product.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{product.category}</span>
                  <span className="text-sm font-bold text-[#d51243]">
                    {product.minPrice === product.maxPrice
                      ? `₹${product.minPrice.toLocaleString('en-IN')}`
                      : `₹${product.minPrice.toLocaleString('en-IN')}–${product.maxPrice.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* No results */}
      {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">No products found for &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}

      {/* Browse all link */}
      <div className="border-t border-gray-100 px-4 py-3">
        <Link
          href={searchQuery.trim().length >= 2 ? `/shop?search=${encodeURIComponent(searchQuery.trim())}` : '/shop'}
          onClick={() => { setShowSearch(false); setSearchQuery(''); }}
          className="flex items-center justify-between text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <span>Browse all products</span>
          <FiArrowRight size={16} />
        </Link>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-100/90 via-gray-50/95 to-slate-100/90 dark:from-gray-900/95 dark:via-[#0b1220]/95 dark:to-[#171010]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
      {/* Decorative gradient line at the top */}
      <div className="h-1 w-full bg-gradient-to-r from-[#1e3a5f] via-[#2bbef9] to-orange-500"></div>

      <div className="max-w-7xl mx-auto px-4 h-[5.5rem] flex items-center justify-between gap-4 lg:gap-8">

        {/* Left: Logo */}
        <Link href="/" className="flex items-center shrink-0 group">
          <img
            src="/logo.png.png"
            alt="DreamStartup"
            className="h-[4.5rem] w-auto object-contain group-hover:scale-[1.02] transition-transform duration-500 drop-shadow-sm"
          />
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`whitespace-nowrap px-3 2xl:px-4 py-2.5 rounded-full text-[14px] font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 text-[#2bbef9] shadow-sm border border-blue-100 dark:border-blue-900/30'
                    : 'text-[#1e3a5f]/80 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800 hover:text-orange-500 hover:shadow-sm'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-auto lg:ml-0">

          {/* Search Bar (Desktop) */}
          <div className="hidden xl:block relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" size={18} />
              <input
                type="text"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSearch(true)}
                className="w-[260px] 2xl:w-[340px] h-11 pl-12 pr-4 rounded-full bg-white/60 dark:bg-gray-800/60 border border-slate-200/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:border-[#2bbef9] dark:focus:border-[#2bbef9] focus:ring-4 focus:ring-[#2bbef9]/10 text-sm font-semibold text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none transition-all shadow-inner"
                autoComplete="off"
              />
            </form>

            {/* Desktop search dropdown */}
            {showSearch && (
              <div className="absolute top-full left-0 right-0 mt-3 w-[460px] z-50">
                <SearchDropdown />
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full text-slate-500 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 border border-slate-200/60 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:text-orange-500 dark:hover:text-orange-400 transition-all shadow-sm hover:shadow"
            title="Toggle Dark Mode"
          >
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>

          {/* Cart */}
          <Link href="/cart" className="relative flex items-center justify-center w-11 h-11 rounded-full text-[#1e3a5f] dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 border border-slate-200/60 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:text-orange-500 dark:hover:text-orange-400 transition-all shadow-sm hover:shadow">
            <FiShoppingCart size={20} />
            <span className="absolute top-0 right-0 -mr-1 -mt-1 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-[#d51243] to-red-500 text-white text-[10px] tracking-wider font-extrabold flex items-center justify-center shadow-md border-2 border-white dark:border-gray-900">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          </Link>

          {/* Auth */}
          <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-slate-200/60 dark:border-gray-700">
            {user ? (
               <div className="relative group">
                 <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#2bbef9] transition" type="button">
                   <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1e3a5f] to-[#2bbef9] text-white flex items-center justify-center shadow-md font-bold text-base border-2 border-white dark:border-gray-800">
                     {user.name?.charAt(0).toUpperCase()}
                   </div>
                 </button>
                 <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border border-gray-100 dark:border-gray-700 overflow-hidden transform origin-top-right group-hover:scale-100 scale-95">
                   <div className="px-5 py-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700/50">
                     <p className="text-[15px] font-extrabold text-gray-900 dark:text-white truncate">{user.name}</p>
                     <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.email}</p>
                   </div>
                   <div className="py-2.5">
                     <Link href={user.role === 'admin' ? '/admin' : user.role === 'vendor' ? '/provider/dashboard' : '/dashboard'} className="block px-5 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-[#2bbef9] text-sm font-semibold transition-colors">Dashboard</Link>
                     <Link href="/dashboard/profile" className="block px-5 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-[#2bbef9] text-sm font-semibold transition-colors">Profile</Link>
                     <Link href="/dashboard/orders" className="block px-5 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-[#2bbef9] text-sm font-semibold transition-colors">Orders</Link>
                     <Link href="/dashboard/wishlist" className="block px-5 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-[#2bbef9] text-sm font-semibold transition-colors">Wishlist</Link>
                   </div>
                   <div className="py-2.5 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                     <button onClick={logout} className="block w-full text-left px-5 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 text-[#d51243] text-sm font-bold transition-colors">Logout Account</button>
                   </div>
                 </div>
               </div>
            ) : (
              <>
                <Link href="/login" className="text-[15px] font-bold text-[#1e3a5f] dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors px-1">Login</Link>
                <Link href="/register" className="text-sm font-extrabold tracking-wide text-white bg-gradient-to-r from-[#2bbef9] to-[#1e3a5f] hover:from-[#1fb2e8] hover:to-[#16304f] shadow-lg shadow-blue-500/20 px-8 py-3 rounded-full transition-all hover:scale-[1.02] border border-white/10">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden flex items-center justify-center w-11 h-11 text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 rounded-full border border-slate-200/60 dark:border-gray-700 transition-colors shadow-sm">
            {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden absolute w-full bg-white shadow-2xl border-t border-gray-100 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[600px] opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}>
        <div className="px-5 py-6 space-y-4">
          {/* Mobile Search */}
          <div className="relative xl:hidden mb-6" ref={mobileSearchRef}>
            <form onSubmit={handleSearchSubmit}>
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSearch(true)}
                className="w-full h-12 pl-11 pr-4 rounded-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 text-base font-medium outline-none transition-all"
                autoComplete="off"
              />
            </form>

            {/* Mobile search dropdown */}
            {showSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50">
                <SearchDropdown />
              </div>
            )}
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block py-3 px-4 rounded-xl text-base font-bold transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {!user && (
            <div className="pt-6 mt-2 border-t border-gray-100 flex flex-col gap-3">
               <Link href="/login" onClick={() => setIsOpen(false)} className="w-full py-3.5 text-center font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Log In</Link>
               <Link href="/register" onClick={() => setIsOpen(false)} className="w-full py-3.5 text-center font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors">Create Account</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
