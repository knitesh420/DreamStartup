import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Cart from '@/models/Cart.model';
import Product from '@/models/Product.model';

// POST /api/cart/add
export const POST = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  const { productId, quantity } = await req.json();

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (quantity < product.moq) throw new ApiError(400, `Minimum order quantity is ${product.moq}`);

  let price = product.minPrice;
  if (product.bulkPricingTiers && product.bulkPricingTiers.length > 0) {
    const tier = product.bulkPricingTiers.find(
      (t) => quantity >= t.minQty && (!t.maxQty || quantity <= t.maxQty)
    );
    if (tier) price = tier.price;
  }

  let cart = await Cart.findOne({ user: authUser.id });
  if (!cart) cart = new Cart({ user: authUser.id, items: [] });

  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
  if (itemIndex > -1) {
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = price;
  } else {
    cart.items.push({ product: productId, quantity, price, moqApplied: quantity >= product.moq });
  }

  cart.calculateTotal();
  await cart.save();
  await cart.populate('items.product', 'title images minPrice maxPrice moq stock');
  return ok(cart, 'Cart updated');
});
