import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Order from '@/models/Order.model';

// GET /api/orders/:id
export const GET = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  const { id } = ctx!.params;

  const order = await Order.findById(id).populate('user', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderUser = order.user as any;
  if (orderUser._id.toString() !== authUser.id && authUser.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }

  return ok(order, 'Order details');
});
