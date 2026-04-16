import { NextRequest } from "next/server";
import { withDB, ok } from "@/lib/routeHandler";
import { getAuthUser } from "@/lib/auth";
import { ApiError } from "@/lib/ApiError";
import User from "@/models/User.model";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/wishlist/check/[id] - Check if product is in wishlist
export const GET = withDB(async (req: NextRequest, ctx: Ctx) => {
  const authUser = getAuthUser(req);
  const { id: productId } = await ctx.params;

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const user = await User.findById(authUser.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isInWishlist = user.savedProducts.some(
    (id) => id.toString() === productId,
  );

  return ok({ isInWishlist }, "Wishlist check completed");
});
