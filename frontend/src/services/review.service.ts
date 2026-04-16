import api from '@/lib/api';

export const reviewService = {
  getProductReviews: (productId: string) =>
    api.get(`/reviews/${productId}`),

  createReview: (productId: string, data: { rating: number; comment: string }) =>
    api.post(`/reviews/${productId}`, data),

  updateReview: (reviewId: string, data: { rating: number; comment: string }) =>
    api.put(`/reviews/review/${reviewId}`, data),

  deleteReview: (reviewId: string) =>
    api.delete(`/reviews/review/${reviewId}`),
};
