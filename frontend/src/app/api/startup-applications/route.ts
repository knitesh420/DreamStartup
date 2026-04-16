import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import StartupApplication from '@/models/StartupApplication.model';

// POST /api/startup-applications  (public or authenticated)
export const POST = withDB(async (req: NextRequest) => {
  const body = await req.json();

  // Optionally attach user if token is present (but don't require it)
  try {
    const { getAuthUser } = await import('@/lib/auth');
    const authUser = getAuthUser(req);
    if (authUser) body.user = authUser.id;
  } catch {
    // No token — anonymous submission is allowed
  }

  const application = await StartupApplication.create(body);
  return ok(application, 'Application submitted', 201);
});
