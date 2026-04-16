import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Order from '@/models/Order.model';

// PUT /api/admin/orders/:id/status
export const PUT = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const { id } = ctx!.params;
  const { orderStatus, paymentStatus, notes } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};
  if (orderStatus) update.orderStatus = orderStatus;
  if (paymentStatus) update.paymentStatus = paymentStatus;
  if (notes) update.notes = notes;

  const order = await Order.findByIdAndUpdate(id, update, { new: true });
  if (!order) throw new ApiError(404, 'Order not found');
  return ok(order, 'Order status updated');
});
