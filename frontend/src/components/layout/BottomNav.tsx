'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiShoppingBag, FiStar, FiPackage, FiUser } from 'react-icons/fi';

const navItems = [
  { href: '/', icon: FiHome, label: 'Home' },
  { href: '/shop', icon: FiShoppingBag, label: 'Shop' },
  { href: '/startup', icon: FiStar, label: 'Startup' },
  { href: '/dashboard/orders', icon: FiPackage, label: 'Orders' },
  { href: '/dashboard/profile', icon: FiUser, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive ? 'text-orange-500' : 'text-gray-500 dark:text-gray-300'}`}>
              <item.icon size={20} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
