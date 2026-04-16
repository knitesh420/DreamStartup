import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Review from '@/models/Review.model';
import Product from '@/models/Product.model';

// GET /api/reviews/:productId
export const GET = withDB(async (_req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const { productId } = ctx!.params;
  const reviews = await Review.find({ product: productId })
    .populate('user', 'name profileImage')
    .sort('-createdAt');
  return ok(reviews, 'Reviews fetched');
});

// POST /api/reviews/:productId  (authenticated)
export const POST = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  const { productId } = ctx!.params;
  const { rating, comment } = await req.json();

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await Review.findOne({ product: productId, user: authUser.id });
  if (existing) throw new ApiError(400, 'You have already reviewed this product');

  const review = await Review.create({
    product: productId,
    user: authUser.id,
    rating: Number(rating),
    comment,
  });
  await review.populate('user', 'name profileImage');
  return ok(review, 'Review submitted', 201);
});
