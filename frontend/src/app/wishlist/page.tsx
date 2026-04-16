"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiHeart,
  FiShoppingCart,
  FiTrash2,
  FiArrowRight,
} from "react-icons/fi";
import { wishlistService } from "@/services/wishlist.service";
import { cartService } from "@/services/cart.service";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/common/Loader";
import { Product } from "@/types";

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Fetch wishlist items
  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const response = await wishlistService.getWishlist();
      const wishlistItems = response.data?.items || [];
      setItems(wishlistItems);
    } catch (err: unknown) {
      console.error("Error fetching wishlist:", err);
      setError("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Refetch wishlist when page comes into focus
  useEffect(() => {
    const handleFocus = () => {
      fetchWishlist();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchWishlist]);

  useEffect(() => setMounted(true), []);

  const removeItem = async (id: string) => {
    try {
      await wishlistService.removeFromWishlist(id);
      setItems(items.filter((item) => item._id !== id));
    } catch (err: unknown) {
      console.error("Error removing from wishlist:", err);
      setError("Failed to remove item from wishlist");
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const product = items.find((item) => item._id === productId);
      if (!product) return;

      // Add to cart with minimum order quantity
      await cartService.addToCart(productId, product.moq);
      // Optionally remove from wishlist after adding to cart
      // await removeItem(productId);

      // Show success feedback
      alert("Added to cart successfully!");
    } catch (err: unknown) {
      console.error("Error adding to cart:", err);
      setError("Failed to add item to cart");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#1e3a5f] py-24 px-4 overflow-hidden relative selection:bg-orange-500/30">
      <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-red-100/60 rounded-full blur-[100px] pointer-events-none" />

      {loading && <Loader />}

      <div
        className={`max-w-5xl mx-auto transition-all duration-1000 transform ${mounted && !loading ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
      >
        <div className="flex items-center justify-between gap-4 mb-12 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-2xl border border-red-100 shadow-sm">
              <FiHeart />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#1e3a5f] tracking-tight">
                Your Wishlist
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                {items.length} items saved
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchWishlist()}
            disabled={loading}
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-600 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-16 text-center shadow-lg relative z-10">
            <div className="w-24 h-24 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-red-300 text-4xl mx-auto mb-6">
              <FiHeart />
            </div>
            <h2 className="text-2xl font-extrabold text-[#1e3a5f] mb-3">
              Your wishlist is empty
            </h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Explore our catalog and save your favorite products here to easily
              find them later.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:ring-orange-500/20 text-white font-bold py-3 px-8 rounded-xl transition-all hover:-translate-y-1 shadow-md"
            >
              <span className="font-bold">Explore Products</span>{" "}
              <FiArrowRight className="stroke-[3px]" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {items.map((item, i) => (
              <div
                key={item._id}
                className="group relative transition-all duration-500 hover:-translate-y-2"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="relative h-full bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col shadow-[0_10px_30px_-15px_rgba(30,58,95,0.1)] hover:shadow-[0_20px_40px_-15px_rgba(30,58,95,0.2)] hover:border-orange-200 transition-all duration-300">
                  {/* Image placeholder */}
                  <Link
                    href={`/shop/${item._id}`}
                    className="w-full h-40 bg-slate-50 rounded-xl mb-6 relative overflow-hidden group-hover:bg-slate-100 border border-slate-100 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    {item.images && item.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                    )}
                  </Link>

                  <div className="flex-1 mb-4">
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
                      {item.brand}
                    </p>
                    <Link
                      href={`/shop/${item._id}`}
                      className="block hover:text-orange-500 transition-colors"
                    >
                      <h3 className="text-lg font-bold text-[#1e3a5f] leading-snug">
                        {item.title}
                      </h3>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xl font-extrabold text-[#1e3a5f]">
                        ₹{item.minPrice}
                      </span>
                      {item.maxPrice && item.maxPrice !== item.minPrice && (
                        <span className="text-xs text-slate-500">
                          to ₹{item.maxPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeItem(item._id)}
                        className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-100"
                        title="Remove from wishlist"
                      >
                        <FiTrash2 />
                      </button>
                      <button
                        onClick={() => addToCart(item._id)}
                        className="w-10 h-10 rounded-lg bg-blue-50 text-[#1e3a5f] flex items-center justify-center hover:bg-[#1e3a5f] hover:text-white transition-all border border-blue-100"
                        title="Add to Cart"
                      >
                        <FiShoppingCart />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
