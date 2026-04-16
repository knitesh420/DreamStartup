import api from "@/lib/api";

export const wishlistService = {
  getWishlist: () => api.get("/wishlist"),

  addToWishlist: (productId: string) =>
    api.post("/wishlist/add", { productId }),

  removeFromWishlist: (productId: string) =>
    api.delete(`/wishlist/remove/${productId}`),

  isInWishlist: (productId: string) => api.get(`/wishlist/check/${productId}`),
};
