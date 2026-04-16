import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import StartupApplication from '@/models/StartupApplication.model';

// GET /api/admin/startup-applications
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [applications, total] = await Promise.all([
    StartupApplication.find(filter)
      .populate('selectedKit', 'title')
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    StartupApplication.countDocuments(filter),
  ]);

  return ok({ applications, total, page, pages: Math.ceil(total / limit) }, 'All applications');
});
