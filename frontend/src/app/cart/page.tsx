'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
/* eslint-disable @next/next/no-img-element */
import toast from 'react-hot-toast';
import { FiShield, FiTruck, FiTrash2 } from 'react-icons/fi';
import { cartService } from '@/services/cart.service';
import { Cart, CartItem } from '@/types';
import { useCart } from '@/context/CartContext';

function getImageSrc(images: string[] | undefined): string {
  if (!images || images.length === 0) return '/placeholder-product.png';
  const src = images[0];
  if (src.startsWith('http')) return src;
  return `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${src.startsWith('/') ? '' : '/'}${src}`;
}

export default function CartPage() {
  const router = useRouter();
  const { updateCountDirectly, refreshCart } = useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await cartService.getCart();
      setCart(res.data.data);
    } catch {
      toast.error('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(productId);
    try {
      const res = await cartService.updateCart(productId, newQty);
      setCart(res.data.data);
    } catch {
      toast.error('Could not update quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId: string, title: string) => {
    setUpdatingId(productId);
    try {
      const res = await cartService.removeFromCart(productId);
      setCart(res.data.data);
      updateCountDirectly(res.data.data.items?.length || 0);
      toast.success(`"${title}" removed from cart.`);
    } catch {
      toast.error('Could not remove item.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Clear all items from your cart?')) return;
    try {
      await cartService.clearCart();
      setCart(null);
      updateCountDirectly(0);
      toast.success('Cart cleared.');
    } catch {
      toast.error('Could not clear cart.');
    }
  };

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- Empty cart ---
  const isEmpty = !cart || cart.items.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col items-center justify-center gap-5 px-4 py-20">
        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center text-4xl">
          🛒
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-300 text-sm text-center max-w-xs leading-relaxed">
          Looks like you haven&apos;t added anything yet. Browse our wholesale products and start filling it up!
        </p>
        <Link
          href="/shop"
          className="mt-2 bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm shadow-md shadow-[#1e3a5f]/20"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce(
    (acc: number, item: CartItem) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-blue-200">
            Shopping Cart{' '}
            <span className="text-base font-normal text-gray-500 dark:text-gray-300">
              ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
          <button
            onClick={handleClearCart}
            className="inline-flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
          >
            <FiTrash2 size={14} />
            Clear cart
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {cart.items.map((item: CartItem, idx: number) => {
              const productId = item.product?._id || `unknown-${idx}`;
              const isUpdating = updatingId === productId;
              const itemSubtotal = item.price * item.quantity;

              return (
                <div
                  key={productId + '-' + idx}
                  className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-4 sm:p-5 flex gap-4 items-start"
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <img
                      src={getImageSrc(item.product?.images)}
                      alt={item.product?.title || 'Product Image'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {item.product?.title || 'Unknown Product'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                      Unit price: ₹{item.price.toLocaleString('en-IN')}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleUpdateQuantity(productId, item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                        className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition text-lg leading-none"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-10 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-800 dark:text-gray-100">
                        {isUpdating ? (
                          <span className="inline-block w-3 h-3 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(productId, item.quantity + 1)}
                        disabled={isUpdating}
                        className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition text-lg leading-none"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Subtotal + Remove */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <p className="text-sm sm:text-base font-bold text-[#1e3a5f] dark:text-blue-200">
                      ₹{itemSubtotal.toLocaleString('en-IN')}
                    </p>
                    <button
                      onClick={() => handleRemove(productId, item.product?.title || 'Unknown Product')}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1 text-xs text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-200 transition disabled:opacity-40"
                      aria-label="Remove item"
                    >
                      <FiTrash2 size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6 sticky top-20">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-gray-100">
                <span>Total</span>
                <span className="text-[#1e3a5f] dark:text-blue-200">
                  ₹{(cart.totalAmount ?? subtotal).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <FiShield size={14} className="text-green-600" />
                  Secure checkout experience
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <FiTruck size={14} className="text-orange-500" />
                  Shipping charges shown at checkout
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="mt-5 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition text-sm shadow-md shadow-orange-500/20"
              >
                Proceed to Checkout
              </button>

              <Link
                href="/shop"
                className="mt-3 block text-center text-sm text-[#1e3a5f] dark:text-blue-200 hover:underline"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
