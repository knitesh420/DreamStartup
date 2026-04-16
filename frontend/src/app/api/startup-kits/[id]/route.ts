import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import StartupKit from '@/models/StartupKit.model';

// GET /api/startup-kits/:id  (public)
export const GET = withDB(async (_req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const { id } = ctx!.params;
  const kit = await StartupKit.findById(id);
  if (!kit) throw new ApiError(404, 'Startup kit not found');
  return ok(kit, 'Startup kit details');
});

// PUT /api/startup-kits/:id  (admin)
export const PUT = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');
  const { id } = ctx!.params;
  const body = await req.json();
  const kit = await StartupKit.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!kit) throw new ApiError(404, 'Startup kit not found');
  return ok(kit, 'Startup kit updated');
});

// DELETE /api/startup-kits/:id  (admin)
export const DELETE = withDB(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');
  const { id } = ctx!.params;
  const kit = await StartupKit.findByIdAndDelete(id);
  if (!kit) throw new ApiError(404, 'Startup kit not found');
  return ok(null, 'Startup kit deleted');
});
