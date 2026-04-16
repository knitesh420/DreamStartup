'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiFileText,
  FiArrowLeft,
  FiArrowRight,
  FiMapPin,
  FiBriefcase,
  FiMessageSquare,
} from 'react-icons/fi';

import { useAuth } from '@/context/AuthContext';
import { startupService } from '@/services/startup.service';
import StatusBadge from '@/components/common/StatusBadge';
import Loader from '@/components/common/Loader';
import { StartupApplication, StartupKit } from '@/types';

// ─── Application Card ─────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: StartupApplication }) {
  const kit = app.selectedKit as StartupKit;
  const kitName = typeof kit === 'object' && kit !== null ? kit.title : String(app.selectedKit);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#1e3a5f]">{kitName}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{app.fullName}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {/* Meta info */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <FiMapPin size={13} className="text-gray-400" />
          {app.city}, {app.state}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FiBriefcase size={13} className="text-gray-400" />
          {app.businessType}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FiFileText size={13} className="text-gray-400" />
          Submitted{' '}
          {new Date(app.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Admin notes */}
      {app.adminNotes && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <FiMessageSquare
            size={15}
            className="mt-0.5 flex-shrink-0 text-[#1e3a5f]"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1e3a5f]">
              Admin Note
            </p>
            <p className="mt-0.5 text-sm text-gray-700">{app.adminNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [applications, setApplications] = useState<StartupApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const res = await startupService.getMyApplications();
        const raw = res.data;
        let list: StartupApplication[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (Array.isArray(raw?.data?.applications)) list = raw.data.applications;
        // Newest first
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setApplications(list);
      } catch {
        setError('Unable to load applications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-blue-200 hover:text-white"
          >
            <FiArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-white">
            My Startup Applications
          </h1>
          <p className="mt-1 text-blue-300">
            Track the status of your startup kit applications.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading && <Loader />}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-6 text-center text-red-600 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
            <FiFileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold text-gray-600">
              No applications yet
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Explore our startup kits and submit your first application to get
              started.
            </p>
            <Link
              href="/startup"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-orange-200 transition hover:bg-orange-600"
            >
              Explore Startup Kits <FiArrowRight size={14} />
            </Link>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard key={app._id} app={app} />
            ))}

            <p className="pt-2 text-right text-xs text-gray-400">
              {applications.length} application
              {applications.length !== 1 ? 's' : ''} total
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
