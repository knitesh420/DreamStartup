import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import User from '@/models/User.model';

// GET /api/admin/users
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const search = searchParams.get('search');
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (role && role !== 'all') filter.role = role;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return ok({ users, total, page, pages: Math.ceil(total / limit) }, 'Users fetched');
});
