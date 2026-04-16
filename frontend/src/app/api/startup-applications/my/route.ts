import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import StartupApplication from '@/models/StartupApplication.model';

// GET /api/startup-applications/my
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  const apps = await StartupApplication.find({ user: authUser.id })
    .populate('selectedKit', 'title')
    .sort('-createdAt');
  return ok(apps, 'My applications');
});
