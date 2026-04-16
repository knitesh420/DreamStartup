import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import StartupApplication from '@/models/StartupApplication.model';

// PUT /api/admin/startup-applications/:id
export const PUT = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const { id } = ctx!.params;
  const { status, adminNotes } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};
  if (status) update.status = status;
  if (adminNotes !== undefined) update.adminNotes = adminNotes;

  const app = await StartupApplication.findByIdAndUpdate(id, update, { new: true });
  if (!app) throw new ApiError(404, 'Application not found');
  return ok(app, 'Application updated');
});
