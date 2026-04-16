import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Cart from '@/models/Cart.model';

// PUT /api/cart/update
export const PUT = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  const { productId, quantity } = await req.json();

  const cart = await Cart.findOne({ user: authUser.id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
  if (itemIndex === -1) throw new ApiError(404, 'Item not in cart');

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  cart.calculateTotal();
  await cart.save();
  return ok(cart, 'Cart updated');
});
