import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { ApiError } from '@/lib/ApiError';
import User from '@/models/User.model';

export const POST = withDB(async (req: NextRequest) => {
  const { name, email, phone, password, role } = await req.json();

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(400, 'Email already registered');

  const user = await User.create({ name, email, phone, password, role: role || 'customer' });
  const token = user.generateToken();

  return ok(
    { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
    'Registration successful',
    201
  );
});
