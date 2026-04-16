import { NextRequest } from "next/server";
import { withDB, ok } from "@/lib/routeHandler";
import { getAuthUser, requireRole } from "@/lib/auth";
import { ApiError } from "@/lib/ApiError";
import Product from "@/models/Product.model";
import { saveUploadedImages } from "@/lib/uploadImage";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/products/:id
export const GET = withDB(async (_req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");
  return ok(product, "Product details");
});

// PUT /api/products/:id  (admin)
export const PUT = withDB(async (req: NextRequest, ctx: Ctx) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, "admin");

  const { id } = await ctx.params;
  const contentType = req.headers.get("content-type") || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: Record<string, any>;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    body = Object.fromEntries(formData.entries()) as Record<string, string>;
    if (typeof body.bulkPricingTiers === "string") {
      body.bulkPricingTiers = JSON.parse(body.bulkPricingTiers);
    }
    // Save newly uploaded image files; if none provided, keep existing images untouched
    const imageFiles = formData
      .getAll("images")
      .filter((v): v is File => v instanceof File && v.size > 0);
    if (imageFiles.length > 0) {
      body.images = await saveUploadedImages(imageFiles);
    } else {
      delete body.images;
    }
  } else {
    body = await req.json();
  }

  const product = await Product.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, "Product not found");
  return ok(product, "Product updated");
});

// DELETE /api/products/:id  (admin)
export const DELETE = withDB(async (req: NextRequest, ctx: Ctx) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, "admin");

  const { id } = await ctx.params;
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new ApiError(404, "Product not found");
  return ok(null, "Product deleted");
});

export type { Ctx };
