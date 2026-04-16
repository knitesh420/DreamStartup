'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiFilter,
  FiSave,
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
} from 'react-icons/fi';

import { exportToExcel } from '@/utils/exportExcel';
import { adminService } from '@/services/admin.service';
import StatusBadge from '@/components/common/StatusBadge';
import Loader from '@/components/common/Loader';
import { useAuth } from '@/context/AuthContext';
import { ServiceProviderProfile, User } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Profession = 'carpenter' | 'electrician' | 'plumber';

interface RowState {
  isApproved: boolean;
  commissionRate: string;
  saving: boolean;
  saved: boolean;
  error: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFESSIONS: Profession[] = ['carpenter', 'electrician', 'plumber'];
const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function providerUser(provider: ServiceProviderProfile): User | null {
  if (typeof provider.user === 'object' && provider.user !== null) {
    return provider.user as User;
  }
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProvidersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [providers, setProviders] = useState<ServiceProviderProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [professionFilter, setProfessionFilter] = useState<string>('all');
  const [approvedFilter, setApprovedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page };
      if (professionFilter !== 'all') params.profession = professionFilter;
      if (approvedFilter !== 'all') params.approved = approvedFilter;

      const res = await adminService.getProviders(params);
      const raw = res.data;
      const list: ServiceProviderProfile[] =
        raw?.data?.providers ?? raw?.data ?? raw?.providers ?? [];
      const totalCount: number = raw?.data?.total ?? raw?.total ?? list.length;
      const totalPages: number =
        raw?.data?.pages ?? raw?.pages ?? Math.ceil(totalCount / PAGE_SIZE);

      setProviders(list);
      setTotal(totalCount);
      setPages(totalPages || 1);

      const initial: Record<string, RowState> = {};
      list.forEach((p) => {
        if (!rowStates[p._id]) {
          initial[p._id] = {
            isApproved: p.isApproved,
            commissionRate: String(p.commissionRate ?? ''),
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
      setError('Failed to load service providers. Please try again.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, professionFilter, approvedFilter]);

  useEffect(() => {
    if (user?.role === 'admin') fetchProviders();
  }, [fetchProviders, user]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    if (providers.length === 0) return;
    const data = providers.map((p) => {
      const pUser = providerUser(p);
      return {
        Name: pUser?.name || '',
        Email: pUser?.email || '',
        Phone: pUser?.phone || '',
        Profession: p.profession,
        Experience: p.experienceYears ?? '',
        City: (p.user as { city?: string })?.city || '',
        'Commission Rate': p.commissionRate ?? '',
        Approved: p.isApproved ? 'Yes' : 'No',
      };
    });
    exportToExcel(data, 'service-providers');
  };

  function updateRowState(id: string, patch: Partial<RowState>) {
    setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleSave(provider: ServiceProviderProfile) {
    const rs = rowStates[provider._id];
    if (!rs) return;

    const commissionNum = parseFloat(rs.commissionRate);
    if (isNaN(commissionNum) || commissionNum < 0 || commissionNum > 100) {
      updateRowState(provider._id, {
        error: 'Commission must be a number between 0 and 100.',
      });
      return;
    }

    updateRowState(provider._id, { saving: true, saved: false, error: '' });
    try {
      await adminService.approveProvider(provider._id, {
        isApproved: rs.isApproved,
        commissionRate: commissionNum,
      });
      updateRowState(provider._id, { saving: false, saved: true });
      setProviders((prev) =>
        prev.map((p) =>
          p._id === provider._id
            ? { ...p, isApproved: rs.isApproved, commissionRate: commissionNum }
            : p
        )
      );
      setTimeout(() => updateRowState(provider._id, { saved: false }), 2500);
    } catch {
      updateRowState(provider._id, {
        saving: false,
        error: 'Failed to save. Try again.',
      });
    }
  }

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
            Service Providers
          </h1>
          <p className="mt-1 text-blue-300">
            Approve providers, override commission rates, and manage listings.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <FiFilter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filter:</span>

          {/* Profession */}
          <select
            value={professionFilter}
            onChange={(e) => { setProfessionFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          >
            <option value="all">All Professions</option>
            {PROFESSIONS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          {/* Approval status */}
          <select
            value={approvedFilter}
            onChange={(e) => { setApprovedFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          >
            <option value="all">All Approval States</option>
            <option value="true">Approved</option>
            <option value="false">Not Approved</option>
          </select>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {total} provider{total !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={handleExport}
              disabled={providers.length === 0}
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
        {!loading && !error && providers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <FiUser size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-gray-500">No providers found</p>
            <p className="mt-1 text-sm text-gray-400">
              Try adjusting the filters above.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && providers.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Provider',
                      'Phone',
                      'Profession',
                      'Experience',
                      'Service Areas',
                      'Approval',
                      'Commission %',
                      'Actions',
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
                  {providers.map((provider) => {
                    const rs = rowStates[provider._id];
                    const pUser = providerUser(provider);
                    return (
                      <tr
                        key={provider._id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* Provider Name */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[#1e3a5f]">
                            {pUser?.name ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {pUser?.email ?? ''}
                          </p>
                        </td>

                        {/* Phone */}
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {pUser?.phone ?? '—'}
                        </td>

                        {/* Profession */}
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="inline-flex items-center rounded-full bg-[#1e3a5f]/10 px-2.5 py-1 text-xs font-medium capitalize text-[#1e3a5f]">
                            {provider.profession}
                          </span>
                        </td>

                        {/* Experience */}
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {provider.experienceYears}{' '}
                          {provider.experienceYears === 1 ? 'yr' : 'yrs'}
                        </td>

                        {/* Service Areas */}
                        <td className="px-5 py-4 max-w-[180px]">
                          <p className="line-clamp-2 text-sm text-gray-600">
                            {provider.serviceAreas?.join(', ') || '—'}
                          </p>
                        </td>

                        {/* Approval status + toggle buttons */}
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <StatusBadge
                              status={
                                (rs?.isApproved ?? provider.isApproved)
                                  ? 'approved'
                                  : 'rejected'
                              }
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() =>
                                  rs && updateRowState(provider._id, {
                                    isApproved: true,
                                    saved: false,
                                  })
                                }
                                disabled={rs?.isApproved === true}
                                className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <FiCheckCircle size={11} />
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  rs && updateRowState(provider._id, {
                                    isApproved: false,
                                    saved: false,
                                  })
                                }
                                disabled={rs?.isApproved === false}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <FiXCircle size={11} />
                                Reject
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Commission Rate Input */}
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={rs?.commissionRate ?? provider.commissionRate}
                              onChange={(e) =>
                                rs &&
                                updateRowState(provider._id, {
                                  commissionRate: e.target.value,
                                  saved: false,
                                  error: '',
                                })
                              }
                              className="w-20 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            />
                            <span className="text-sm text-gray-400">%</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleSave(provider)}
                              disabled={rs?.saving}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                            >
                              {rs?.saving ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              ) : (
                                <FiSave size={12} />
                              )}
                              {rs?.saving ? 'Saving…' : 'Save'}
                            </button>
                            {rs?.saved && (
                              <span className="text-xs font-medium text-green-600">
                                Saved!
                              </span>
                            )}
                            {rs?.error && (
                              <span className="max-w-[140px] text-xs text-red-500">
                                {rs.error}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
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
