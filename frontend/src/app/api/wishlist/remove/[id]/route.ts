import { NextRequest } from "next/server";
import { withDB, ok } from "@/lib/routeHandler";
import { getAuthUser } from "@/lib/auth";
import { ApiError } from "@/lib/ApiError";
import User from "@/models/User.model";

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/wishlist/remove/[id] - Remove product from wishlist
export const DELETE = withDB(async (req: NextRequest, ctx: Ctx) => {
  const authUser = getAuthUser(req);
  const { id: productId } = await ctx.params;

  console.log(
    "Removing from wishlist - userId:",
    authUser.id,
    "productId:",
    productId,
  );

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Find user and remove from savedProducts
  const user = await User.findById(authUser.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  console.log(
    "User current savedProducts before remove:",
    user.savedProducts.length,
  );

  // Remove product from savedProducts
  user.savedProducts = user.savedProducts.filter(
    (id) => id.toString() !== productId,
  );
  await user.save();

  console.log("User savedProducts after remove:", user.savedProducts.length);

  // Populate and return updated wishlist
  const updatedUser = await User.findById(authUser.id).populate(
    "savedProducts",
    "title slug images minPrice maxPrice brand category moq stock avgRating numReviews",
  );

  return ok(
    { items: updatedUser?.savedProducts || [] },
    "Product removed from wishlist successfully",
  );
});
