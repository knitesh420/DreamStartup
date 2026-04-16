import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Review from '@/models/Review.model';

// PUT /api/reviews/review/:id
export const PUT = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  const { id } = ctx!.params;
  const { rating, comment } = await req.json();

  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.user.toString() !== authUser.id && authUser.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }

  review.rating = Number(rating) || review.rating;
  review.comment = comment || review.comment;
  await review.save();
  await review.populate('user', 'name profileImage');
  return ok(review, 'Review updated');
});

// DELETE /api/reviews/review/:id
export const DELETE = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  const { id } = ctx!.params;

  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.user.toString() !== authUser.id && authUser.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }

  await Review.findByIdAndDelete(id);
  return ok(null, 'Review deleted');
});
