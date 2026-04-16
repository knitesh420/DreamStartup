'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
/* eslint-disable @next/next/no-img-element */
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { cartService } from '@/services/cart.service';
import { orderService } from '@/services/order.service';
import { Cart, CartItem } from '@/types';

type PaymentMethod = 'cash' | 'online_on_call';

interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

function getImageSrc(images: string[] | undefined): string {
  if (!images || images.length === 0) return '/placeholder-product.png';
  const src = images[0];
  if (src.startsWith('http')) return src;
  return `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${src.startsWith('/') ? '' : '/'}${src}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login to continue.');
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Pre-fill phone from user profile
  useEffect(() => {
    if (user?.phone) {
      setShippingAddress((prev) => ({ ...prev, phone: user.phone }));
    }
  }, [user]);

  const fetchCart = useCallback(async () => {
    try {
      const res = await cartService.getCart();
      const cartData: Cart = res.data.data;
      if (!cartData || cartData.items.length === 0) {
        toast.error('Your cart is empty.');
        router.replace('/cart');
        return;
      }
      setCart(cartData);
    } catch {
      toast.error('Failed to load cart.');
      router.replace('/cart');
    } finally {
      setCartLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCart();
    }
  }, [authLoading, user, fetchCart]);

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const { address, city, state, pincode, phone } = shippingAddress;
    if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim() || !phone.trim()) {
      toast.error('Please fill in all shipping address fields.');
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      toast.error('Pincode must be exactly 6 digits.');
      return;
    }

    setSubmitting(true);
    try {
      await orderService.createOrder({
        shippingAddress: {
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          phone: phone.trim(),
        },
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      toast.success('Order placed successfully!');
      router.push('/dashboard/orders');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to place order. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Show loader while auth or cart is loading
  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !cart) return null;

  const subtotal = cart.items.reduce(
    (acc: number, item: CartItem) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1e3a5f] mb-6">Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Shipping + Payment */}
            <div className="flex-1 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  {/* Street address */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      rows={2}
                      required
                      value={shippingAddress.address}
                      onChange={(e) => handleAddressChange('address', e.target.value)}
                      placeholder="Flat/House No., Street, Area"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* City */}
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="city"
                        type="text"
                        required
                        value={shippingAddress.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="Mumbai"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label
                        htmlFor="state"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="state"
                        type="text"
                        required
                        value={shippingAddress.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        placeholder="Maharashtra"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Pincode */}
                    <div>
                      <label
                        htmlFor="pincode"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="pincode"
                        type="text"
                        required
                        inputMode="numeric"
                        maxLength={6}
                        value={shippingAddress.pincode}
                        onChange={(e) =>
                          handleAddressChange('pincode', e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="400001"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={shippingAddress.phone}
                        onChange={(e) => handleAddressChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">Payment Method</h2>
                <div className="space-y-3">
                  {(
                    [
                      {
                        value: 'cash',
                        label: 'Cash on Delivery',
                        description: 'Pay in cash when your order arrives.',
                      },
                      {
                        value: 'online_on_call',
                        label: 'Online on Call',
                        description: 'Our team will call to collect payment online.',
                      },
                    ] as { value: PaymentMethod; label: string; description: string }[]
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${
                        paymentMethod === option.value
                          ? 'border-[#1e3a5f] bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={() => setPaymentMethod(option.value)}
                        className="mt-0.5 accent-[#1e3a5f]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{option.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Order Notes{' '}
                  <span className="text-xs font-normal text-gray-400">(Optional)</span>
                </h2>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for your order…"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition resize-none"
                />
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-20">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">Order Summary</h2>

                {/* Items list */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {cart.items.map((item: CartItem) => (
                    <div
                      key={item.product._id}
                      className="flex items-center gap-3"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                        <img
                          src={getImageSrc(item.product.images)}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
                          {item.product.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-300">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 flex-shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

                {/* Totals */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">To be confirmed</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

                <div className="flex justify-between text-base font-bold text-gray-900 dark:text-gray-100">
                  <span>Total</span>
                  <span className="text-[#1e3a5f]">
                    ₹{(cart.totalAmount ?? subtotal).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Place Order */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-lg transition text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Placing Order…
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>

                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
                  By placing your order you agree to our terms and conditions.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
