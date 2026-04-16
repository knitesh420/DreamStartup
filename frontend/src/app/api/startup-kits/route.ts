import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import StartupKit from '@/models/StartupKit.model';

// GET /api/startup-kits  (public)
export const GET = withDB(async () => {
  const kits = await StartupKit.find({ isActive: true });
  return ok(kits, 'Startup kits');
});

// POST /api/startup-kits  (admin)
export const POST = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');
  const body = await req.json();
  const kit = await StartupKit.create(body);
  return ok(kit, 'Startup kit created', 201);
});
