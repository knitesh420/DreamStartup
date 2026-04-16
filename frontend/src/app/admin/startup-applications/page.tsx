'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiFilter,
  FiSave,
  FiFileText,
} from 'react-icons/fi';

import { exportToExcel } from '@/utils/exportExcel';
import { adminService } from '@/services/admin.service';
import StatusBadge from '@/components/common/StatusBadge';
import Loader from '@/components/common/Loader';
import { useAuth } from '@/context/AuthContext';
import { StartupApplication, StartupKit } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationStatus = StartupApplication['status'];

interface RowState {
  status: ApplicationStatus;
  adminNotes: string;
  saving: boolean;
  saved: boolean;
  error: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'pending',
  'contacted',
  'approved',
  'rejected',
  'completed',
];

const PAGE_SIZE = 10;

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-gray-800">{value}</dd>
    </div>
  );
}

function ExpandedApplicationRow({
  application,
  rowState,
  onStatusChange,
  onNotesChange,
  onSave,
}: {
  application: StartupApplication;
  rowState: RowState;
  onStatusChange: (v: ApplicationStatus) => void;
  onNotesChange: (v: string) => void;
  onSave: () => void;
}) {
  const kit =
    typeof application.selectedKit === 'object'
      ? (application.selectedKit as StartupKit)
      : null;

  return (
    <div className="grid gap-6 bg-[#1e3a5f]/[0.03] px-6 py-5 md:grid-cols-2">
      {/* Full Details */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Application Details
        </h4>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 space-y-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailItem label="Full Name" value={application.fullName} />
            <DetailItem label="Phone" value={application.phone} />
            <DetailItem label="Email" value={application.email} />
            <DetailItem label="City" value={application.city} />
            <DetailItem label="State" value={application.state} />
            <DetailItem label="Business Type" value={application.businessType} />
            <DetailItem label="Budget" value={application.budget} />
            <DetailItem
              label="Startup Kit"
              value={kit?.title ?? (application.selectedKit as string)}
            />
          </dl>
          {application.message && (
            <div className="border-t border-gray-100 pt-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Message
              </dt>
              <dd className="mt-1 text-sm text-gray-700">{application.message}</dd>
            </div>
          )}
        </div>
      </div>

      {/* Status Update + Notes */}
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Update Status
          </h4>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select
                value={rowState.status}
                onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                Admin Notes
              </label>
              <textarea
                rows={4}
                value={rowState.adminNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Add internal notes about this application…"
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm placeholder:text-gray-300 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onSave}
                disabled={rowState.saving}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {rowState.saving ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <FiSave size={14} />
                )}
                {rowState.saving ? 'Saving…' : 'Save Changes'}
              </button>
              {rowState.saved && (
                <span className="text-sm font-medium text-green-600">Saved!</span>
              )}
              {rowState.error && (
                <span className="text-sm text-red-500">{rowState.error}</span>
              )}
            </div>
          </div>
        </div>

        {/* Existing admin notes (read-only) */}
        {application.adminNotes && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-500 mb-1">
              Previous Notes
            </p>
            <p className="text-sm text-gray-700">{application.adminNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStartupApplicationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [applications, setApplications] = useState<StartupApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminService.getApplications(params);
      const raw = res.data;
      const list: StartupApplication[] =
        raw?.data?.applications ?? raw?.data ?? raw?.applications ?? [];
      const totalCount: number = raw?.data?.total ?? raw?.total ?? list.length;
      const totalPages: number =
        raw?.data?.pages ?? raw?.pages ?? Math.ceil(totalCount / PAGE_SIZE);

      setApplications(list);
      setTotal(totalCount);
      setPages(totalPages || 1);

      const initial: Record<string, RowState> = {};
      list.forEach((a) => {
        if (!rowStates[a._id]) {
          initial[a._id] = {
            status: a.status,
            adminNotes: a.adminNotes ?? '',
            saving: false,
            saved: false,
            error: '',
          };
        }
      });
      if (Object.keys(initial).length > 0) {
        setRowStates((prev) => ({ ...prev, ...initial }));
      }
    } catch {
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  useEffect(() => {
    if (user?.role === 'admin') fetchApplications();
  }, [fetchApplications, user]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateRowState(id: string, patch: Partial<RowState>) {
    setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleSave(application: StartupApplication) {
    const rs = rowStates[application._id];
    if (!rs) return;
    updateRowState(application._id, { saving: true, saved: false, error: '' });
    try {
      await adminService.updateApplication(application._id, {
        status: rs.status,
        adminNotes: rs.adminNotes,
      });
      updateRowState(application._id, { saving: false, saved: true });
      setApplications((prev) =>
        prev.map((a) =>
          a._id === application._id
            ? { ...a, status: rs.status, adminNotes: rs.adminNotes }
            : a
        )
      );
      setTimeout(() => updateRowState(application._id, { saved: false }), 2500);
    } catch {
      updateRowState(application._id, {
        saving: false,
        error: 'Failed to update. Try again.',
      });
    }
  }

  function kitName(app: StartupApplication): string {
    if (typeof app.selectedKit === 'object' && app.selectedKit !== null) {
      return (app.selectedKit as StartupKit).title;
    }
    return String(app.selectedKit ?? '—');
  }

  const handleExport = () => {
    if (applications.length === 0) return;
    const data = applications.map((app) => ({
      Name: app.fullName,
      Phone: app.phone,
      Email: app.email || '',
      City: app.city || '',
      State: app.state || '',
      'Selected Kit': kitName(app),
      'Investment Budget': app.budget || '',
      Status: app.status,
      'Admin Notes': app.adminNotes || '',
      Date: new Date(app.createdAt).toLocaleDateString('en-IN'),
    }));
    exportToExcel(data, 'startup-applications');
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-medium text-blue-200">Admin Panel</p>
          <h1 className="mt-1 text-3xl font-extrabold text-white">
            Startup Applications
          </h1>
          <p className="mt-1 text-blue-300">
            Review, update, and manage all startup kit applications.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <FiFilter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          >
            <option value="all">All Statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {total} application{total !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={handleExport}
              disabled={applications.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 disabled:opacity-40"
            >
              <FiDownload size={16} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Loader / Error */}
        {loading && <Loader />}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && applications.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <FiFileText size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-gray-500">No applications found</p>
            <p className="mt-1 text-sm text-gray-400">
              Try changing the status filter.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && applications.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Applicant',
                      'Phone',
                      'Email',
                      'Kit',
                      'Business Type',
                      'City',
                      'Status',
                      'Date',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.map((app) => {
                    const isExpanded = expandedRows.has(app._id);
                    const rs = rowStates[app._id];
                    return (
                      <>
                        <tr
                          key={app._id}
                          className={`transition ${isExpanded ? 'bg-[#1e3a5f]/[0.03]' : 'hover:bg-gray-50'}`}
                        >
                          {/* Applicant */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="text-sm font-semibold text-[#1e3a5f]">
                              {app.fullName}
                            </p>
                          </td>

                          {/* Phone */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                            {app.phone}
                          </td>

                          {/* Email */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                            {app.email}
                          </td>

                          {/* Kit */}
                          <td className="px-5 py-4 text-sm text-gray-700 max-w-[160px]">
                            <span className="line-clamp-2">{kitName(app)}</span>
                          </td>

                          {/* Business Type */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                            {app.businessType}
                          </td>

                          {/* City */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                            {app.city}
                          </td>

                          {/* Status Badge */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <StatusBadge
                              status={rs?.status ?? app.status}
                            />
                          </td>

                          {/* Date */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Expand toggle */}
                          <td className="whitespace-nowrap px-4 py-4">
                            <button
                              onClick={() => toggleRow(app._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
                            >
                              {isExpanded ? (
                                <FiChevronUp size={14} />
                              ) : (
                                <FiChevronDown size={14} />
                              )}
                              {isExpanded ? 'Collapse' : 'Review'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isExpanded && rs && (
                          <tr key={`${app._id}-expanded`}>
                            <td colSpan={9} className="p-0">
                              <ExpandedApplicationRow
                                application={app}
                                rowState={rs}
                                onStatusChange={(v) =>
                                  updateRowState(app._id, {
                                    status: v,
                                    saved: false,
                                  })
                                }
                                onNotesChange={(v) =>
                                  updateRowState(app._id, {
                                    adminNotes: v,
                                    saved: false,
                                  })
                                }
                                onSave={() => handleSave(app)}
                              />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f] disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  p === page
                    ? 'bg-[#1e3a5f] text-white shadow'
                    : 'border border-gray-200 text-gray-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
