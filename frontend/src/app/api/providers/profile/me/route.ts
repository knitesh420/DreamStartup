import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import ServiceProviderProfile from '@/models/ServiceProviderProfile.model';

// GET /api/providers/profile/me
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  const profile = await ServiceProviderProfile.findOne({ user: authUser.id }).populate(
    'user',
    'name email phone'
  );
  if (!profile) throw new ApiError(404, 'Profile not found');
  return ok(profile, 'Provider profile');
});

// PUT /api/providers/profile/me
export const PUT = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  const { profession, experienceYears, serviceAreas, skills, available } = await req.json();
  const profile = await ServiceProviderProfile.findOneAndUpdate(
    { user: authUser.id },
    { profession, experienceYears, serviceAreas, skills, available },
    { new: true, runValidators: true }
  );
  if (!profile) throw new ApiError(404, 'Profile not found');
  return ok(profile, 'Profile updated');
});
