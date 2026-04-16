import api from '@/lib/api';

export const cartService = {
  getCart: () => api.get('/cart'),

  addToCart: (productId: string, quantity: number) =>
    api.post('/cart/add', { productId, quantity }),

  updateCart: (productId: string, quantity: number) =>
    api.put('/cart/update', { productId, quantity }),

  removeFromCart: (productId: string) =>
    api.delete(`/cart/remove/${productId}`),

  clearCart: () => api.delete('/cart/clear'),
};
