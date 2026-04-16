import Link from 'next/link';
import { FiTool, FiDroplet, FiZap, FiHome } from 'react-icons/fi';

const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'Furniture Hardware': FiTool,
  'Sanitary': FiDroplet,
  'Electrical': FiZap,
  'Home Decor': FiHome,
};

export default function CategoryCard({ name, count }: { name: string; count?: number }) {
  const Icon = icons[name] || FiTool;
  return (
    <Link href={`/shop?category=${encodeURIComponent(name)}`} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-center group hover:-translate-y-1">
      <div className="w-16 h-16 mx-auto mb-3 bg-orange-50 rounded-full flex items-center justify-center group-hover:bg-orange-100 transition">
        <Icon size={28} className="text-orange-500" />
      </div>
      <h3 className="font-semibold text-gray-800 text-sm">{name}</h3>
      {count !== undefined && <p className="text-xs text-gray-500 mt-1">{count} Products</p>}
    </Link>
  );
}
