import { NextRequest } from "next/server";
import { withDB, ok } from "@/lib/routeHandler";
import { getAuthUser } from "@/lib/auth";
import Cart from "@/models/Cart.model";
import Product from "@/models/Product.model";

// GET /api/cart
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  let cart = await Cart.findOne({ user: authUser.id }).populate(
    "items.product",
    "title images minPrice maxPrice moq stock",
  );
  if (!cart) return ok({ items: [], totalAmount: 0 }, "Cart fetched");
  return ok(cart, "Cart fetched");
});
