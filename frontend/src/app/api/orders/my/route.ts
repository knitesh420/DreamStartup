import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import Order from '@/models/Order.model';

// GET /api/orders/my
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  const orders = await Order.find({ user: authUser.id }).sort('-createdAt');
  return ok(orders, 'My orders');
});
