import { NextRequest } from "next/server";
import { withDB, ok } from "@/lib/routeHandler";
import { getAuthUser } from "@/lib/auth";
import { ApiError } from "@/lib/ApiError";
import User from "@/models/User.model";
import Product from "@/models/Product.model";
import mongoose from "mongoose";

// POST /api/wishlist/add - Add product to wishlist
export const POST = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  const { productId } = await req.json();

  console.log(
    "Adding to wishlist - userId:",
    authUser.id,
    "productId:",
    productId,
  );

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Find user and add to savedProducts if not already there
  const user = await User.findById(authUser.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  console.log("User current savedProducts:", user.savedProducts.length);

  // Check if product is already in wishlist (compare ObjectIds as strings)
  const isAlreadyInWishlist = user.savedProducts.some(
    (id) => id.toString() === productId,
  );

  if (isAlreadyInWishlist) {
    console.log("Product already in wishlist");
    // Return updated wishlist without adding
    const updatedUser = await User.findById(authUser.id).populate(
      "savedProducts",
      "title slug images minPrice maxPrice brand category moq stock avgRating numReviews",
    );
    return ok(
      { items: updatedUser?.savedProducts || [] },
      "Product already in wishlist",
    );
  }

  // Add product to wishlist
  const objectId = new mongoose.Types.ObjectId(productId);
  console.log("Adding ObjectId:", objectId.toString());
  user.savedProducts.push(objectId);
  console.log("savedProducts array before save:", user.savedProducts);

  const saveResult = await user.save();
  console.log("User save successful:", !!saveResult);
  console.log("User savedProducts after save from object:", user.savedProducts);

  // Populate and return updated wishlist
  const updatedUser = await User.findById(authUser.id).populate(
    "savedProducts",
    "title slug images minPrice maxPrice brand category moq stock avgRating numReviews",
  );

  console.log(
    "Updated user savedProducts after populate:",
    updatedUser?.savedProducts?.length,
  );
  console.log(
    "Populated items:",
    updatedUser?.savedProducts?.map((p: any) => p._id),
  );

  return ok(
    { items: updatedUser?.savedProducts || [] },
    "Product added to wishlist successfully",
  );
});
