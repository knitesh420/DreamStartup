import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ApiError } from './ApiError';

export interface JwtPayload {
  id: string;
  role: string;
}

/**
 * Extracts and verifies JWT from the Authorization header.
 * Returns decoded payload or throws ApiError.
 */
export function getAuthUser(req: NextRequest): JwtPayload {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorized. No token provided.');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    return decoded;
  } catch {
    throw new ApiError(401, 'Not authorized. Token is invalid or expired.');
  }
}

/**
 * Verifies the user has one of the allowed roles.
 */
export function requireRole(user: JwtPayload, ...roles: string[]): void {
  if (!roles.includes(user.role)) {
    throw new ApiError(403, `Role '${user.role}' is not authorized to access this route.`);
  }
}
