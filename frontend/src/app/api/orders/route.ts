import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Order from '@/models/Order.model';
import Cart from '@/models/Cart.model';

// POST /api/orders
export const POST = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);

  const cart = await Cart.findOne({ user: authUser.id }).populate('items.product', 'title images');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty');

  const { shippingAddress, billingAddress, paymentMethod, notes } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = cart.items.map((item: any) => ({
    product: item.product._id,
    title: item.product.title,
    quantity: item.quantity,
    price: item.price,
    image: item.product.images?.[0] || '',
  }));

  const order = await Order.create({
    user: authUser.id,
    items,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod: paymentMethod || 'cash',
    totalAmount: cart.totalAmount,
    notes,
  });

  await Cart.findOneAndDelete({ user: authUser.id });
  return ok(order, 'Order placed successfully', 201);
});
