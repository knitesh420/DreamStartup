'use client';

import { useEffect, useState } from 'react';
import {
  FiUsers,
  FiBox,
  FiShoppingCart,
  FiDollarSign,
  FiStar,
  FiTool,
  FiMail,
} from 'react-icons/fi';
import { adminService } from '@/services/admin.service';
import { DashboardStats } from '@/types';
import Loader from '@/components/common/Loader';

// ─── Stat card config ─────────────────────────────────────────────────────────

interface StatCardConfig {
  key: keyof DashboardStats;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  format?: (v: number) => string;
}

const STAT_CARDS: StatCardConfig[] = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    icon: FiUsers,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    key: 'totalProducts',
    label: 'Total Products',
    icon: FiBox,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    key: 'totalOrders',
    label: 'Total Orders',
    icon: FiShoppingCart,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    key: 'totalRevenue',
    label: 'Total Revenue',
    icon: FiDollarSign,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
    format: (v) =>
      '₹' +
      v.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
  },
  {
    key: 'totalStartupApplications',
    label: 'Startup Applications',
    icon: FiStar,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    key: 'totalProviders',
    label: 'Service Providers',
    icon: FiTool,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    key: 'pendingEnquiries',
    label: 'Pending Enquiries',
    icon: FiMail,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
  },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  config,
  value,
}: {
  config: StatCardConfig;
  value: number;
}) {
  const { label, icon: Icon, iconBg, iconColor, format } = config;
  const display = format ? format(value) : value.toLocaleString('en-IN');

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div
        className={[
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl',
          iconBg,
        ].join(' ')}
      >
        <Icon size={26} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-[#1e3a5f]">{display}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await adminService.getDashboard();
        // Handle possible envelope shapes: { data: stats } or { data: { data: stats } }
        const raw = res.data;
        const payload: DashboardStats =
          raw?.data && typeof raw.data === 'object' && 'totalUsers' in raw.data
            ? raw.data
            : raw?.data ?? raw;
        setStats(payload);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load dashboard stats.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your platform activity at a glance.
        </p>
      </div>

      {/* Loading */}
      {loading && <Loader />}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-600">
          {error}
        </div>
      )}

      {/* Stats grid */}
      {!loading && !error && stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {STAT_CARDS.map((config) => (
            <StatCard
              key={config.key}
              config={config}
              value={stats[config.key] ?? 0}
            />
          ))}
        </div>
      )}

      {/* Empty state (stats object present but all zeros) */}
      {!loading && !error && !stats && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-16 text-center text-gray-500">
          No dashboard data available.
        </div>
      )}
    </div>
  );
}
