"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiShoppingCart,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiMinus,
  FiPlus,
  FiChevronUp,
  FiChevronDown,
  FiHeart,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { FiStar, FiTrash2 } from "react-icons/fi";
import { productService } from "@/services/product.service";
import { cartService } from "@/services/cart.service";
import { reviewService } from "@/services/review.service";
import { wishlistService } from "@/services/wishlist.service";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/common/Loader";
import { Product, BulkPricingTier, Review } from "@/types";

const WHATSAPP_NUMBER = "917372881290"; // Update with your actual WhatsApp business number

function resolveImage(src: string): string {
  return src || "";
}

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { refreshCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [thumbStart, setThumbStart] = useState(0);
  const [failedThumbs, setFailedThumbs] = useState<Record<number, boolean>>({});
  const [failedMain, setFailedMain] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

  const fetchReviews = async () => {
    try {
      const res = await reviewService.getProductReviews(id);
      setReviews(res.data?.data ?? []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getProduct(id);
        const data: Product = res.data?.data ?? res.data;
        if (!data?._id) {
          setNotFound(true);
        } else {
          setProduct(data);
          setQuantity(data.moq ?? 5);
          setActiveImage(0);
          setThumbStart(0);
          setFailedThumbs({});
          setFailedMain(false);

          // Check if product is in wishlist
          if (user) {
            try {
              const checkRes = await wishlistService.isInWishlist(data._id);
              setIsInWishlist(checkRes.data?.isInWishlist ?? false);
            } catch {
              setIsInWishlist(false);
            }
          }
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error("Failed to load product. Please try again.");
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    fetchReviews();
  }, [id, user]);

  const decrementQty = () => {
    setQuantity((prev) => Math.max(product?.moq ?? 5, prev - 1));
  };

  const incrementQty = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await cartService.addToCart(product._id, quantity);
      await refreshCart();
      toast.success(`${product.title} added to cart!`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      if (
        message?.toLowerCase().includes("login") ||
        message?.toLowerCase().includes("auth")
      ) {
        toast.error("Please login to add items to your cart.");
        router.push("/login");
      } else {
        toast.error(message ?? "Failed to add to cart. Please try again.");
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to manage your wishlist.");
      router.push("/login");
      return;
    }
    if (!product) return;

    setTogglingWishlist(true);
    try {
      if (isInWishlist) {
        console.log("Removing from wishlist:", product._id);
        await wishlistService.removeFromWishlist(product._id);
        toast.success("Removed from wishlist");
      } else {
        console.log("Adding to wishlist:", product._id);
        await wishlistService.addToWishlist(product._id);
        toast.success("Added to wishlist");
      }
      setIsInWishlist(!isInWishlist);
    } catch (err: unknown) {
      console.error("Wishlist update error:", err);
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message ?? "Failed to update wishlist.");
    } finally {
      setTogglingWishlist(false);
    }
  };

  const handleWhatsAppChat = () => {
    if (!product) return;
    const message = `Hi, I'm interested in ${product.title}.\n\nCategory: ${product.category}\nBrand: ${product.brand || "N/A"}\nQuantity: ${quantity} units\n\nPlease share more details and best pricing.`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error("Please write a review.");
      return;
    }
    if (!user) {
      toast.error("Please login to submit a review.");
      router.push("/login");
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewService.createReview(id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      toast.success("Review submitted!");
      setReviewComment("");
      setReviewRating(5);
      fetchReviews();
      // Refresh product to update avgRating
      const res = await productService.getProduct(id);
      setProduct(res.data?.data ?? res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to submit review.";
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await reviewService.deleteReview(reviewId);
      toast.success("Review deleted.");
      fetchReviews();
      const res = await productService.getProduct(id);
      setProduct(res.data?.data ?? res.data);
    } catch {
      toast.error("Failed to delete review.");
    }
  };

  // Determine price for current quantity from bulk tiers
  const effectivePrice = (): number => {
    if (!product) return 0;
    if (!product.bulkPricingTiers || product.bulkPricingTiers.length === 0) {
      return product.minPrice;
    }
    const sorted = [...product.bulkPricingTiers].sort(
      (a, b) => b.minQty - a.minQty,
    );
    const tier = sorted.find((t) => quantity >= t.minQty);
    return tier ? tier.price : product.minPrice;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-5">
          <FiAlertCircle size={36} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Product Not Found
        </h1>
        <p className="text-gray-500 dark:text-gray-300 mb-6 max-w-sm">
          The product you are looking for does not exist or may have been
          removed.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#162d4a] transition"
        >
          <FiArrowLeft size={18} />
          Back to Shop
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const hasImages = images.length > 0;
  const hasBulkTiers =
    product.bulkPricingTiers && product.bulkPricingTiers.length > 0;
  const hasSpecs =
    product.specifications && Object.keys(product.specifications).length > 0;
  const inStock = product.stock > 0;
  const price = effectivePrice();
  const sortedTiers = hasBulkTiers
    ? [...product.bulkPricingTiers].sort(
        (a: BulkPricingTier, b: BulkPricingTier) => a.minQty - b.minQty,
      )
    : [];
  const maxVisibleThumbs = 5;

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-gray-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-orange-500 transition">
              Home
            </Link>
            <span className="text-gray-300">&gt;</span>
            <Link href="/shop" className="hover:text-orange-500 transition">
              Shop
            </Link>
            <span className="text-gray-300">&gt;</span>
            <Link
              href={`/shop?category=${encodeURIComponent(product.category)}`}
              className="hover:text-orange-500 transition"
            >
              {product.category}
            </Link>
            <span className="text-gray-300">&gt;</span>
            <span className="text-gray-700 dark:text-gray-200 font-medium line-clamp-1 max-w-[250px]">
              {product.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ─── Main Product Card ─── */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* ─── LEFT: Image Gallery (Alibaba style) ─── */}
            <div className="lg:col-span-5 p-4 lg:p-6 flex gap-3">
              {/* Vertical Thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-col items-center gap-1 w-[68px] shrink-0">
                  {images.length > maxVisibleThumbs && (
                    <button
                      onClick={() => setThumbStart(Math.max(0, thumbStart - 1))}
                      disabled={thumbStart === 0}
                      className="w-full flex items-center justify-center py-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <FiChevronUp size={16} />
                    </button>
                  )}
                  {images
                    .slice(thumbStart, thumbStart + maxVisibleThumbs)
                    .map((img, idx) => {
                      const realIdx = thumbStart + idx;
                      return (
                        <button
                          key={realIdx}
                          onClick={() => {
                            setActiveImage(realIdx);
                            setFailedMain(false);
                          }}
                          onMouseEnter={() => {
                            setActiveImage(realIdx);
                            setFailedMain(false);
                          }}
                          className={`w-[64px] h-[64px] rounded border-2 overflow-hidden shrink-0 transition-all ${
                            activeImage === realIdx
                              ? "border-orange-500 shadow-md"
                              : "border-gray-200 dark:border-gray-600 hover:border-orange-300"
                          }`}
                        >
                          {failedThumbs[realIdx] ? (
                            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-400">
                              No image
                            </div>
                          ) : (
                            <img
                              src={resolveImage(img)}
                              alt={`${product.title} ${realIdx + 1}`}
                              className="w-full h-full object-cover"
                              onError={() => {
                                setFailedThumbs((prev) => ({
                                  ...prev,
                                  [realIdx]: true,
                                }));
                                if (activeImage === realIdx)
                                  setFailedMain(true);
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  {images.length > maxVisibleThumbs && (
                    <button
                      onClick={() =>
                        setThumbStart(
                          Math.min(
                            images.length - maxVisibleThumbs,
                            thumbStart + 1,
                          ),
                        )
                      }
                      disabled={thumbStart >= images.length - maxVisibleThumbs}
                      className="w-full flex items-center justify-center py-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <FiChevronDown size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Main Image */}
              <div className="flex-1 aspect-square bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex items-center justify-center relative">
                {hasImages && !failedMain ? (
                  <img
                    src={resolveImage(images[activeImage])}
                    alt={product.title}
                    className="w-full h-full object-contain p-4 transition-transform duration-300 hover:scale-[1.03]"
                    onError={() => setFailedMain(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-300 gap-3 p-8">
                    <FiPackage size={64} />
                    <span className="text-sm">
                      {hasImages
                        ? "Image failed to load"
                        : "No image available"}
                    </span>
                  </div>
                )}
                {/* Wishlist heart */}
                {product.featured && (
                  <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    FEATURED
                  </span>
                )}
              </div>
            </div>

            {/* ─── RIGHT: Product Info (Alibaba style) ─── */}
            <div className="lg:col-span-7 border-l-0 lg:border-l border-gray-200 dark:border-gray-700">
              {/* Title Section */}
              <div className="p-4 lg:p-6 pb-3">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-snug mb-2">
                  {product.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {inStock ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <FiCheckCircle size={12} /> In Stock ({product.stock}{" "}
                      units)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500">
                      <FiAlertCircle size={12} /> Out of Stock
                    </span>
                  )}
                  {product.brand && (
                    <span>
                      Brand:{" "}
                      <strong className="text-gray-700 dark:text-gray-200">
                        {product.brand}
                      </strong>
                    </span>
                  )}
                  <span>
                    Category:{" "}
                    <Link
                      href={`/shop?category=${encodeURIComponent(product.category)}`}
                      className="text-orange-500 hover:underline font-medium"
                    >
                      {product.category}
                    </Link>
                  </span>
                </div>
                {/* Rating summary */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        size={14}
                        className={
                          star <= Math.round(product.avgRating || 0)
                            ? "fill-orange-400 text-orange-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    {product.avgRating?.toFixed(1) || "0.0"}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({product.numReviews || 0} reviews)
                  </span>
                </div>
              </div>

              {/* ─── Pricing Tiers (Alibaba tab-style) ─── */}
              <div className="bg-orange-50/60 dark:bg-orange-900/10 border-y border-orange-100 dark:border-orange-900/30 px-4 lg:px-6 py-4">
                {hasBulkTiers ? (
                  <>
                    <div className="flex flex-wrap gap-0">
                      {sortedTiers.map((tier: BulkPricingTier, idx: number) => {
                        const isActive =
                          quantity >= tier.minQty &&
                          (tier.maxQty === undefined ||
                            quantity <= tier.maxQty);
                        return (
                          <div
                            key={idx}
                            className={`flex-1 min-w-[120px] px-4 py-3 text-center cursor-pointer border-b-2 transition-all ${
                              isActive
                                ? "border-orange-500 bg-white dark:bg-gray-800"
                                : "border-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            }`}
                            onClick={() => setQuantity(tier.minQty)}
                          >
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {tier.minQty}
                              {tier.maxQty ? `–${tier.maxQty}` : "+"} units
                            </div>
                            <div
                              className={`text-xl font-extrabold ${isActive ? "text-orange-600" : "text-gray-800 dark:text-gray-200"}`}
                            >
                              ₹{tier.price.toLocaleString("en-IN")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Price
                    </div>
                    <div className="text-2xl font-extrabold text-orange-600">
                      {product.minPrice === product.maxPrice
                        ? `₹${product.minPrice.toLocaleString("en-IN")}`
                        : `₹${product.minPrice.toLocaleString("en-IN")}–${product.maxPrice.toLocaleString("en-IN")}`}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity + MOQ */}
              <div className="px-4 lg:px-6 py-4 space-y-4">
                {/* MOQ Info */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    MOQ:{" "}
                    <strong className="text-gray-900 dark:text-white">
                      {product.moq} units
                    </strong>
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Unit Price:{" "}
                    <strong className="text-orange-600">
                      ₹{price.toLocaleString("en-IN")}
                    </strong>
                  </span>
                </div>

                {/* Quantity Selector */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-white dark:bg-gray-800">
                      <button
                        onClick={decrementQty}
                        disabled={quantity <= (product.moq ?? 5)}
                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition border-r border-gray-300 dark:border-gray-600"
                      >
                        <FiMinus size={14} />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        min={product.moq ?? 5}
                        step={1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= (product.moq ?? 5)) {
                            setQuantity(val);
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val) || val < (product.moq ?? 5)) {
                            setQuantity(product.moq ?? 5);
                          }
                        }}
                        className="w-20 text-center text-sm font-semibold text-gray-800 dark:text-gray-100 dark:bg-gray-800 border-0 focus:outline-none h-10"
                      />
                      <button
                        onClick={incrementQty}
                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition border-l border-gray-300 dark:border-gray-600"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total:{" "}
                      <strong className="text-gray-900 dark:text-white text-base">
                        ₹{(price * quantity).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Description (collapsed) */}
                {product.description && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>

              {/* ─── Action Buttons (Alibaba style) ─── */}
              <div className="px-4 lg:px-6 pb-5 pt-2 flex flex-col sm:flex-row gap-3">
                {/* Send Inquiry - Orange filled */}
                <Link
                  href={`/contact?product=${encodeURIComponent(product.title)}&productId=${product._id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-full transition text-sm shadow-md shadow-orange-500/20"
                >
                  <FiPackage size={18} />
                  Send inquiry
                </Link>

                {/* Chat Now - WhatsApp green */}
                <button
                  onClick={handleWhatsAppChat}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold py-3.5 px-6 rounded-full transition text-sm shadow-md shadow-green-500/20"
                >
                  <FaWhatsapp size={20} />
                  Chat now
                </button>
              </div>

              {/* Add to Cart - secondary */}
              <div className="px-4 lg:px-6 pb-5">
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || !inStock}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed font-semibold py-3 px-6 rounded-full transition text-sm"
                  >
                    {addingToCart ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiShoppingCart size={18} />
                    )}
                    {addingToCart ? "Adding..." : "Add to Cart"}
                  </button>

                  <button
                    onClick={handleToggleWishlist}
                    disabled={togglingWishlist}
                    title={
                      isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                    }
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full transition font-semibold border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isInWishlist
                        ? "border-red-500 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                        : "border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500 dark:border-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <FiHeart
                      size={18}
                      fill={isInWishlist ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                {!inStock && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-2 justify-center">
                    <FiAlertCircle size={12} />
                    Out of stock. You can still send an inquiry.
                  </p>
                )}
              </div>

              <div className="px-4 lg:px-6 pb-5">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-700/30 px-4 py-3 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-1">
                    <FiCheckCircle className="text-green-600" /> Verified
                    listing
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FiPackage className="text-orange-500" /> MOQ-based
                    wholesale pricing
                  </span>
                  <span>Fast response on inquiry</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Product Details Tabs ─── */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Specifications */}
          {hasSpecs && (
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                  Product Specifications
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {Object.entries(product.specifications!).map(([key, value]) => (
                  <div key={key} className="flex">
                    <div className="w-1/3 px-5 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/30 capitalize">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="w-2/3 px-5 py-3 text-sm text-gray-800 dark:text-gray-200">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Pricing Table */}
          {hasBulkTiers && (
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${!hasSpecs ? "lg:col-span-3" : ""}`}
            >
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                  Bulk Pricing
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedTiers.map((tier: BulkPricingTier, idx: number) => {
                  const savings = product.maxPrice - tier.price;
                  const isActive =
                    quantity >= tier.minQty &&
                    (tier.maxQty === undefined || quantity <= tier.maxQty);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-5 py-3 cursor-pointer transition ${
                        isActive
                          ? "bg-orange-50 dark:bg-orange-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                      onClick={() => setQuantity(tier.minQty)}
                    >
                      <div className="text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-100">
                          {tier.minQty}
                          {tier.maxQty ? `–${tier.maxQty}` : "+"} units
                        </span>
                        {isActive && (
                          <span className="ml-2 text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-orange-600">
                          ₹{tier.price.toLocaleString("en-IN")}
                        </div>
                        {savings > 0 && (
                          <div className="text-[11px] text-green-600">
                            Save ₹{savings.toLocaleString("en-IN")}/unit
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description card (if no specs) */}
          {!hasSpecs && product.description && (
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                  Product Description
                </h2>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Customer Reviews ─── */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
              Customer Reviews ({reviews.length})
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    size={14}
                    className={
                      star <= Math.round(product.avgRating || 0)
                        ? "fill-orange-400 text-orange-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {product.avgRating?.toFixed(1) || "0.0"}
              </span>
            </div>
          </div>

          {/* Write a review */}
          {user && user.role !== "admin" && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Write a Review
              </h3>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <FiStar
                      size={24}
                      className={`transition ${
                        star <= (hoverStar || reviewRating)
                          ? "fill-orange-400 text-orange-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  {reviewRating}/5
                </span>
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={3}
                maxLength={1000}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {reviewComment.length}/1000
                </span>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !reviewComment.trim()}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2 rounded-lg transition"
                >
                  {submittingReview ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          )}

          {!user && (
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <Link
                  href="/login"
                  className="text-orange-500 font-semibold hover:underline"
                >
                  Login
                </Link>{" "}
                to write a review.
              </p>
            </div>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No reviews yet. Be the first to review this product!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {reviews.map((review) => (
                <div key={review._id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold text-sm">
                        {review.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {review.user?.name || "User"}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              size={12}
                              className={
                                star <= review.rating
                                  ? "fill-orange-400 text-orange-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                          <span className="text-[11px] text-gray-400 ml-1">
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Delete button for own reviews or admin */}
                    {user &&
                      (user._id === review.user?._id ||
                        user.role === "admin") && (
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="text-gray-300 hover:text-red-500 transition p-1"
                          title="Delete review"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── CTA Banner ─── */}
        <div className="mt-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold mb-0.5">
              Need a custom quote or bulk deal?
            </h3>
            <p className="text-orange-100 text-sm">
              Contact our team for special pricing on large orders.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href={`/contact?product=${encodeURIComponent(product.title)}&productId=${product._id}`}
              className="flex items-center gap-2 bg-white text-orange-600 font-bold px-5 py-2.5 rounded-full transition text-sm hover:bg-orange-50"
            >
              Send Inquiry
            </Link>
            <button
              onClick={handleWhatsAppChat}
              className="flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-2.5 rounded-full transition text-sm hover:bg-[#1ebe57]"
            >
              <FaWhatsapp size={16} />
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
