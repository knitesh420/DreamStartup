import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import ServiceProviderProfile from '@/models/ServiceProviderProfile.model';

// PUT /api/admin/providers/:id/approve
export const PUT = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const { id } = ctx!.params;
  const { isApproved, commissionRate } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};
  if (isApproved !== undefined) update.isApproved = isApproved;
  if (commissionRate !== undefined) update.commissionRate = commissionRate;

  const profile = await ServiceProviderProfile.findByIdAndUpdate(id, update, { new: true });
  if (!profile) throw new ApiError(404, 'Provider not found');
  return ok(profile, 'Provider updated');
});
