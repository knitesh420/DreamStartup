import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User.model';

// PUT /api/auth/profile
export const PUT = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  const { name, phone, address, city, state, pincode } = await req.json();
  const user = await User.findByIdAndUpdate(
    authUser.id,
    { name, phone, address, city, state, pincode },
    { new: true, runValidators: true }
  );
  return ok(user, 'Profile updated');
});
