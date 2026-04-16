import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import CommissionSetting from '@/models/CommissionSetting.model';

// PUT /api/admin/commissions/:id
export const PUT = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const { id } = ctx!.params;
  const body = await req.json();

  const commission = await CommissionSetting.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!commission) throw new ApiError(404, 'Commission setting not found');
  return ok(commission, 'Commission setting updated');
});
