'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className="flex-1 pb-16 md:pb-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">{children}</main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <BottomNav />}
    </>
  );
}
