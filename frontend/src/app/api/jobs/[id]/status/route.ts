import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import { ApiError } from '@/lib/ApiError';
import Job from '@/models/Job.model';
import ServiceProviderProfile from '@/models/ServiceProviderProfile.model';

// PUT /api/jobs/:id/status
export const PUT = withDB(async (req: NextRequest, ctx?: { params: Promise<{ id: string }> }) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'vendor', 'admin');

  const { id } = await ctx!.params;
  const { status } = await req.json();

  const job = await Job.findById(id);
  if (!job) throw new ApiError(404, 'Job not found');

  job.status = status;
  if (status === 'completed') {
    const provider = await ServiceProviderProfile.findById(job.provider);
    if (provider) {
      job.commissionAmount = (job.earningsAmount * provider.commissionRate) / 100;
      provider.earnings += job.earningsAmount - job.commissionAmount;
      await provider.save();
    }
  }
  await job.save();
  return ok(job, 'Job status updated');
});
