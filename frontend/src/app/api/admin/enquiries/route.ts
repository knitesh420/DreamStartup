import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import Enquiry from '@/models/Enquiry.model';

// GET /api/admin/enquiries
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const resolved = searchParams.get('resolved');
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (type) filter.type = type;
  if (resolved !== undefined && resolved !== null) filter.isResolved = resolved === 'true';

  const skip = (page - 1) * limit;
  const [enquiries, total] = await Promise.all([
    Enquiry.find(filter)
      .populate('product', 'title')
      .populate('startupKit', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Enquiry.countDocuments(filter),
  ]);

  return ok({ enquiries, total, page, pages: Math.ceil(total / limit) }, 'Enquiries');
});
