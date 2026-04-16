import { NextRequest } from "next/server";
import { withDB, ok } from "@/lib/routeHandler";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User.model";
import Product from "@/models/Product.model";

// GET /api/wishlist - Fetch user's wishlist
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);

  console.log("Fetching wishlist for user:", authUser.id);

  const user = await User.findById(authUser.id);
  console.log("User found:", !!user);
  console.log("User raw savedProducts array:", user?.savedProducts);

  const populatedUser = await User.findById(authUser.id).populate(
    "savedProducts",
    "title slug images minPrice maxPrice brand category moq stock avgRating numReviews",
  );

  console.log(
    "Populated saved products count:",
    populatedUser?.savedProducts?.length,
  );
  console.log(
    "Populated products:",
    populatedUser?.savedProducts?.map((p: any) => ({
      id: p._id,
      title: p.title,
    })),
  );

  if (!populatedUser) {
    return ok({ items: [] }, "Wishlist fetched");
  }

  return ok(
    { items: populatedUser.savedProducts || [] },
    "Wishlist fetched successfully",
  );
});
