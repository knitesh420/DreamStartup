import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import Job from '@/models/Job.model';

// GET /api/admin/jobs
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('provider')
      .populate('customer', 'name phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  return ok({ jobs, total, page, pages: Math.ceil(total / limit) }, 'All jobs');
});

// POST /api/admin/jobs
export const POST = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const body = await req.json();
  const job = await Job.create(body);
  return ok(job, 'Job created', 201);
});
