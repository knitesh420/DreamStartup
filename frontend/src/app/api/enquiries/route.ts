import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import Enquiry from '@/models/Enquiry.model';

// POST /api/enquiries  (public)
export const POST = withDB(async (req: NextRequest) => {
  const body = await req.json();
  const enquiry = await Enquiry.create(body);
  return ok(enquiry, 'Enquiry submitted', 201);
});
