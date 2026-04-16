import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Cart from '@/models/Cart.model';

// DELETE /api/cart/remove/:productId
export const DELETE = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  const { productId } = ctx!.params;

  const cart = await Cart.findOne({ user: authUser.id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  cart.calculateTotal();
  await cart.save();
  return ok(cart, 'Item removed');
});
