"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Product } from "@/types";
import { wishlistService } from "@/services/wishlist.service";
import { useAuth } from "@/context/AuthContext";

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  const imageUrl = product.images?.[0] || "";

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
  }, [product._id, user]);

  const checkWishlistStatus = async () => {
    try {
      const response = await wishlistService.isInWishlist(product._id);
      setIsInWishlist(response.data.isInWishlist);
    } catch (error) {
      console.error("Failed to check wishlist status:", error);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(product._id);
      } else {
        await wishlistService.addToWishlist(product._id);
      }
      setIsInWishlist(!isInWishlist);
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const priceRange =
    product.minPrice === product.maxPrice
      ? `₹${product.minPrice.toLocaleString("en-IN")}`
      : `₹${product.minPrice.toLocaleString("en-IN")}–${product.maxPrice.toLocaleString("en-IN")}`;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative p-4">
        <div className="relative h-40 sm:h-44 bg-white dark:bg-gray-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-300 text-sm">
              No Image
            </div>
          )}
        </div>

        <div className="absolute left-4 top-4 flex flex-col gap-1">
          {product.featured && (
            <span className="inline-flex items-center justify-center h-5 px-2 rounded-md bg-gray-800 text-white text-[10px] font-bold">
              RECOMMENDED
            </span>
          )}
        </div>

        <button
          onClick={handleWishlistToggle}
          disabled={loading}
          className="absolute right-4 top-4 p-2 rounded-full bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
          title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isInWishlist ? (
            <svg
              className="w-5 h-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="px-4 pb-4">
        <Link href={`/shop/${product._id}`} className="block">
          <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2 min-h-[2.25rem]">
            {product.title}
          </h3>
        </Link>

        <div className="mt-2 text-[10px] font-semibold tracking-wide text-green-600">
          {product.stock > 0 ? "IN STOCK" : "OUT OF STOCK"}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-extrabold text-[#d51243]">
            {priceRange}
          </span>
        </div>

        <div className="mt-1 text-[10px] font-semibold text-gray-500">
          MOQ: {product.moq} units
        </div>

        <div className="mt-3">
          <Link
            href={`/shop/${product._id}`}
            className="inline-flex items-center justify-center w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-[#233a95] dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
