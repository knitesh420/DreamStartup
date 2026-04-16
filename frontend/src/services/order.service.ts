import api from '@/lib/api';

export const orderService = {
  createOrder: (data: { shippingAddress: Record<string, string>; paymentMethod: string; notes?: string }) =>
    api.post('/orders', data),

  getMyOrders: () => api.get('/orders/my'),

  getOrder: (id: string) => api.get(`/orders/${id}`),
};
