'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  FiGrid,
  FiBox,
  FiShoppingCart,
  FiStar,
  FiUsers,
  FiMail,
  FiPercent,
  FiMenu,
  FiX,
  FiLogOut,
  FiCommand,
  FiUser,
  FiSettings,
  FiChevronDown,
} from 'react-icons/fi';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard',             href: '/admin',                       icon: FiGrid        },
  { label: 'Products',              href: '/admin/products',              icon: FiBox         },
  { label: 'Orders',                href: '/admin/orders',                icon: FiShoppingCart },
  { label: 'Users',                 href: '/admin/users',                 icon: FiUser        },
  { label: 'Startup Applications',  href: '/admin/startup-applications',  icon: FiStar        },
  { label: 'Service Providers',     href: '/admin/providers',             icon: FiUsers       },
  { label: 'Enquiries',             href: '/admin/enquiries',             icon: FiMail        },
  { label: 'Commissions',           href: '/admin/commissions',           icon: FiPercent     },
] as const;

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose?: () => void;
}) {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <aside className="relative flex h-full flex-col bg-[#060913] text-slate-300 before:absolute before:inset-0 before:bg-gradient-to-b before:from-indigo-600/10 before:to-transparent before:pointer-events-none border-r border-white/5">
      {/* Logo / brand */}
      <div className="flex h-20 shrink-0 items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <FiCommand size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Dream<span className="text-indigo-400">Admin</span>
          </span>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <FiX size={20} />
          </button>
        )}
      </div>

      {/* User chip */}
      <div className="mx-4 mb-6 rounded-2xl bg-white/[0.02] border border-white/5 px-4 py-3 backdrop-blur-sm shadow-xl z-10 transition hover:bg-white/[0.04]">
        <p className="text-[11px] font-semibold text-indigo-400/80 uppercase tracking-widest mb-1">
          Administrator
        </p>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <p className="truncate text-sm font-medium text-slate-200">{user?.name ?? 'Super Admin'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 z-10">
        <ul className="space-y-1.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            // Exact match for /admin, prefix match for sub-routes
            const isActive =
              href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={[
                    'group relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                  ].join(' ')}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -mt-3 h-6 w-1 rounded-r-full bg-indigo-500" />
                  )}
                  <Icon
                    size={20}
                    className={[
                      'transition-colors duration-300',
                      isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                    ].join(' ')}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom spacer */}
      <div className="shrink-0 h-4" />
    </aside>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  // Auth guard
  useEffect(() => {
    if (isLoginPage) return;
    if (!loading) {
      if (!user) {
        router.replace('/admin/login');
      } else if (user.role !== 'admin') {
        router.replace('/');
      }
    }
  }, [user, loading, router, isLoginPage]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen && !isLoginPage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, isLoginPage]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  // While auth resolves, show a premium loading state
  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060913]">
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <div className="hidden w-[280px] shrink-0 lg:block shadow-2xl z-20">
        <Sidebar pathname={pathname} />
      </div>

      {/* ── Mobile Sidebar Overlay ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-50 h-full w-[280px] shadow-2xl transition-transform">
            <Sidebar pathname={pathname} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main Column ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Top bar (Glassmorphism) */}
        <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-white border-opacity-40 bg-white/70 px-6 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-4">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 lg:hidden"
              aria-label="Open menu"
            >
              <FiMenu size={24} />
            </button>

            {/* Title / Breadcrumb */}
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">Admin Panel</span>
              {pathname !== '/admin' && (
                <>
                  <span className="text-slate-300 hidden sm:block">/</span>
                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full shadow-sm capitalize">
                    {NAV_ITEMS.find(
                      (n) => n.href !== '/admin' && pathname.startsWith(n.href)
                    )?.label ?? ''}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Admin header actions — profile dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-100"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-800 leading-none">{user.name}</p>
                <p className="text-xs font-medium text-slate-500 leading-none mt-1.5">Super Admin</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-sm font-bold text-white shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <FiChevronDown size={16} className="text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 mt-1 w-56 origin-top-right scale-95 rounded-xl border border-gray-100 bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:scale-100 transition-all duration-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white">
                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
              </div>
              <div className="py-1.5">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <FiUser size={16} />
                  Profile
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <FiSettings size={16} />
                  Admin Dashboard
                </Link>
              </div>
              <div className="border-t border-gray-100 py-1.5">
                <button
                  onClick={() => { logout(); router.push('/admin/login'); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 sm:py-10 bg-[#F4F7FB]">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
