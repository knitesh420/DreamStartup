import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { ApiError } from '@/lib/ApiError';
import User from '@/models/User.model';

export const POST = withDB(async (req: NextRequest) => {
  const { email, password, loginType } = await req.json();

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials');

  if (loginType === 'admin' && user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. This login is for admin only.');
  }
  if (loginType === 'user' && user.role === 'admin') {
    throw new ApiError(403, 'Admin accounts must use the admin login page.');
  }

  const token = user.generateToken();
  return ok(
    { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
    'Login successful'
  );
});
