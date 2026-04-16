import Link from 'next/link';
import { StartupKit } from '@/types';

export default function StartupKitCard({ kit }: { kit: StartupKit }) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e] p-6 text-white">
        <h3 className="text-xl font-bold mb-1">{kit.title}</h3>
        <p className="text-orange-300 text-sm">Starting from ₹{kit.startingPrice.toLocaleString('en-IN')}</p>
      </div>
      <div className="p-5">
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{kit.description}</p>
        <ul className="space-y-2 mb-5">
          {kit.includedServices.slice(0, 4).map((service, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{service}</span>
            </li>
          ))}
          {kit.includedServices.length > 4 && (
            <li className="text-sm text-gray-500">+ {kit.includedServices.length - 4} more services</li>
          )}
        </ul>
        <Link href={`/startup?kit=${kit._id}`} className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition">Start Your Business</Link>
      </div>
    </div>
  );
}
