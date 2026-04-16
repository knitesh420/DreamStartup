import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Job from '@/models/Job.model';
import ServiceProviderProfile from '@/models/ServiceProviderProfile.model';

// GET /api/jobs/my
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  const profile = await ServiceProviderProfile.findOne({ user: authUser.id });
  if (!profile) throw new ApiError(404, 'Provider profile not found');

  const jobs = await Job.find({ provider: profile._id })
    .populate('customer', 'name phone')
    .sort('-createdAt');
  return ok(jobs, 'My jobs');
});
