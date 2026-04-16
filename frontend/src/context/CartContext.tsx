'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartService } from '@/services/cart.service';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartCount: number;
  refreshCart: () => Promise<void>;
  updateCountDirectly: (count: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const { user, loading } = useAuth(); 

  const refreshCart = async () => {
    try {
      const res = await cartService.getCart();
      const cart = res.data?.data;
      if (cart && cart.items) {
        setCartCount(cart.items.length);
      } else {
        setCartCount(0);
      }
    } catch {
      setCartCount(0);
    }
  };

  const updateCountDirectly = (count: number) => {
    setCartCount(count);
  };

  useEffect(() => {
    // Attempt to load cart if user is authenticated
    if (!loading && user) refreshCart();
    else if (!loading && !user) setCartCount(0);
  }, [user, loading]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart, updateCountDirectly }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
