import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Product from '@/models/Product.model';
import { saveUploadedImages } from '@/lib/uploadImage';

// GET /api/products
export const GET = withDB(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const search = searchParams.get('search');
  const featured = searchParams.get('featured');
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 12);
  const sort = searchParams.get('sort') || '-createdAt';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { isActive: true };
  if (category) filter.category = category;
  if (brand) filter.brand = new RegExp(brand, 'i');
  if (featured === 'true') filter.featured = true;
  if (minPrice) filter.minPrice = { $gte: Number(minPrice) };
  if (maxPrice) filter.maxPrice = { $lte: Number(maxPrice) };
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return ok({ products, total, page, pages: Math.ceil(total / limit) }, 'Products fetched');
});

// POST /api/products  (admin only)
export const POST = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const contentType = req.headers.get('content-type') || '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: Record<string, any>;

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    body = Object.fromEntries(formData.entries()) as Record<string, string>;
    if (typeof body.bulkPricingTiers === 'string') {
      body.bulkPricingTiers = JSON.parse(body.bulkPricingTiers);
    }
    // Save uploaded image files to public/uploads and store the paths
    const imageFiles = formData.getAll('images').filter((v): v is File => v instanceof File && v.size > 0);
    if (imageFiles.length > 0) {
      body.images = await saveUploadedImages(imageFiles);
    } else {
      delete body.images;
    }
  } else {
    body = await req.json();
  }

  if (!body.title || !body.description || !body.category) {
    throw new ApiError(400, 'title, description, and category are required');
  }

  body.createdBy = authUser.id;
  const product = await Product.create(body);
  return ok(product, 'Product created', 201);
});
