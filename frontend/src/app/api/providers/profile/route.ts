import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import ServiceProviderProfile from '@/models/ServiceProviderProfile.model';

// POST /api/providers/profile  (vendor or admin)
export const POST = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'vendor', 'admin');

  const existing = await ServiceProviderProfile.findOne({ user: authUser.id });
  if (existing) throw new ApiError(400, 'Profile already exists');

  const body = await req.json();
  body.user = authUser.id;
  const profile = await ServiceProviderProfile.create(body);
  return ok(profile, 'Provider profile created', 201);
});
