import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import CommissionSetting from '@/models/CommissionSetting.model';

// GET /api/admin/commissions
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const commissions = await CommissionSetting.find();
  return ok(commissions, 'Commission settings');
});

// POST /api/admin/commissions
export const POST = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const body = await req.json();
  const existing = await CommissionSetting.findOne({ profession: body.profession });
  if (existing) throw new ApiError(400, 'Commission setting already exists for this profession');

  const commission = await CommissionSetting.create(body);
  return ok(commission, 'Commission setting created', 201);
});
