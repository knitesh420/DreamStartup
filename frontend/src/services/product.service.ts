import api from '@/lib/api';

export const productService = {
  getProducts: (params?: Record<string, string | number | boolean>) =>
    api.get('/products', { params }),

  getProduct: (id: string) =>
    api.get(`/products/${id}`),

  createProduct: (data: FormData) =>
    api.post('/products', data),

  updateProduct: (id: string, data: FormData) =>
    api.put(`/products/${id}`, data),

  deleteProduct: (id: string) =>
    api.delete(`/products/${id}`),
};
