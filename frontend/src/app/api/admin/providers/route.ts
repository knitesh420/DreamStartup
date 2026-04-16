import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import ServiceProviderProfile from '@/models/ServiceProviderProfile.model';

// GET /api/admin/providers
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const { searchParams } = new URL(req.url);
  const profession = searchParams.get('profession');
  const approved = searchParams.get('approved');
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (profession) filter.profession = profession;
  if (approved !== undefined && approved !== null) filter.isApproved = approved === 'true';

  const skip = (page - 1) * limit;
  const [providers, total] = await Promise.all([
    ServiceProviderProfile.find(filter)
      .populate('user', 'name email phone city')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    ServiceProviderProfile.countDocuments(filter),
  ]);

  return ok({ providers, total, page, pages: Math.ceil(total / limit) }, 'All providers');
});
