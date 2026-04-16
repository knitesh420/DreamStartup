import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import Cart from '@/models/Cart.model';

// DELETE /api/cart/clear
export const DELETE = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  await Cart.findOneAndDelete({ user: authUser.id });
  return ok(null, 'Cart cleared');
});
