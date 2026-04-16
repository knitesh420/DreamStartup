import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Enquiry from '@/models/Enquiry.model';

// PUT /api/admin/enquiries/:id
export const PUT = withDB(async (req: NextRequest, ctx?: { params: Promise<{ id: string }> }) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const { id } = await ctx!.params;
  const { isResolved } = await req.json();

  const enquiry = await Enquiry.findByIdAndUpdate(id, { isResolved }, { new: true });
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');
  return ok(enquiry, 'Enquiry updated');
});
