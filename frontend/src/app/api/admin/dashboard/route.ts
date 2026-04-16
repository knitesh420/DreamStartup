import { NextRequest } from 'next/server';
import { withDB, ok } from '@/lib/routeHandler';
import { getAuthUser, requireRole } from '@/lib/auth';
import User from '@/models/User.model';
import Product from '@/models/Product.model';
import Order from '@/models/Order.model';
import StartupApplication from '@/models/StartupApplication.model';
import ServiceProviderProfile from '@/models/ServiceProviderProfile.model';
import Enquiry from '@/models/Enquiry.model';

// GET /api/admin/dashboard
export const GET = withDB(async (req: NextRequest) => {
  const authUser = getAuthUser(req);
  requireRole(authUser, 'admin');

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalStartupApplications,
    totalProviders,
    pendingEnquiries,
    revenueResult,
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    StartupApplication.countDocuments(),
    ServiceProviderProfile.countDocuments(),
    Enquiry.countDocuments({ isResolved: false }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  return ok(
    {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      totalStartupApplications,
      totalProviders,
      pendingEnquiries,
    },
    'Dashboard stats'
  );
});
