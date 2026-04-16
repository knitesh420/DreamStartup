'use client';

import { useEffect, useState, useCallback } from 'react';
import { FiDownload } from 'react-icons/fi';
import { adminService } from '@/services/admin.service';
import { exportToExcel } from '@/utils/exportExcel';
import StatusBadge from '@/components/common/StatusBadge';
import Loader from '@/components/common/Loader';

// ─── Types ───────────────────────────────────────────────────────────────────

type EnquiryType = 'bulk_order' | 'startup' | 'general';

interface Enquiry {
  _id: string;
  name: string;
  phone: string;
  email: string;
  type: EnquiryType;
  message: string;
  productRef?: { _id: string; name: string } | null;
  kitRef?: { _id: string; name: string } | null;
  isResolved: boolean;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  pages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function truncate(text: string, max = 60) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

const TYPE_COLORS: Record<EnquiryType, string> = {
  bulk_order: 'bg-purple-100 text-purple-800',
  startup: 'bg-blue-100 text-blue-800',
  general: 'bg-gray-100 text-gray-700',
};

function TypeBadge({ type }: { type: EnquiryType }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${TYPE_COLORS[type] || 'bg-gray-100 text-gray-700'}`}
    >
      {type.replace('_', ' ')}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterResolved, setFilterResolved] = useState<string>('');
  const [page, setPage] = useState(1);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (filterType) params.type = filterType;
      if (filterResolved !== '') params.resolved = filterResolved;

      const res = await adminService.getEnquiries(params);
      const raw = res.data?.data ?? res.data;
      setEnquiries(raw?.enquiries ?? raw?.data ?? []);
      setMeta({
        total: raw?.total ?? 0,
        page: raw?.page ?? page,
        pages: raw?.pages ?? 1,
      });
    } catch (err) {
      console.error('Failed to fetch enquiries', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterResolved]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // ── Toggle resolved ────────────────────────────────────────────────────────

  const handleToggleResolved = async (enquiry: Enquiry) => {
    setToggling(enquiry._id);
    try {
      await adminService.updateEnquiry(enquiry._id, { isResolved: !enquiry.isResolved });
      setEnquiries((prev) =>
        prev.map((e) =>
          e._id === enquiry._id ? { ...e, isResolved: !e.isResolved } : e
        )
      );
    } catch (err) {
      console.error('Failed to update enquiry', err);
    } finally {
      setToggling(null);
    }
  };

  // ── Expand row ─────────────────────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Filter change helpers ──────────────────────────────────────────────────

  const handleFilterType = (val: string) => {
    setFilterType(val);
    setPage(1);
  };

  const handleFilterResolved = (val: string) => {
    setFilterResolved(val);
    setPage(1);
  };

  const handleExport = () => {
    if (enquiries.length === 0) return;
    const data = enquiries.map((e) => ({
      Name: e.name,
      Phone: e.phone,
      Email: e.email,
      Type: e.type,
      Message: e.message,
      Reference: e.productRef?.name ?? e.kitRef?.name ?? '',
      Status: e.isResolved ? 'Resolved' : 'Pending',
      Date: new Date(e.createdAt).toLocaleDateString('en-IN'),
    }));
    exportToExcel(data, 'enquiries');
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white px-6 py-5 shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">Enquiries</h1>
        <p className="text-sm text-blue-200 mt-0.5">
          Manage all customer and startup enquiries
        </p>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterType}
            onChange={(e) => handleFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          >
            <option value="">All Types</option>
            <option value="bulk_order">Bulk Order</option>
            <option value="startup">Startup</option>
            <option value="general">General</option>
          </select>

          <select
            value={filterResolved}
            onChange={(e) => handleFilterResolved(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          >
            <option value="">All Status</option>
            <option value="false">Pending</option>
            <option value="true">Resolved</option>
          </select>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {meta.total} enquir{meta.total !== 1 ? 'ies' : 'y'} found
            </span>
            <button
              onClick={handleExport}
              disabled={enquiries.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 disabled:opacity-40"
            >
              <FiDownload size={16} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <Loader />
        ) : enquiries.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            No enquiries found for the selected filters.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#1e3a5f] text-white text-left">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Message</th>
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enquiries.map((enq) => {
                    const isExpanded = expandedRows.has(enq._id);
                    const ref = enq.productRef?.name ?? enq.kitRef?.name ?? '—';
                    return (
                      <>
                        <tr
                          key={enq._id}
                          className={`hover:bg-gray-50 transition-colors ${enq.isResolved ? 'opacity-70' : ''}`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                            {enq.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {enq.phone}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap max-w-[160px] truncate">
                            {enq.email}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <TypeBadge type={enq.type} />
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[220px]">
                            <span className="cursor-default">
                              {isExpanded ? enq.message : truncate(enq.message)}
                            </span>
                            {enq.message.length > 60 && (
                              <button
                                onClick={() => toggleExpand(enq._id)}
                                className="ml-1 text-orange-500 font-medium hover:underline text-xs"
                              >
                                {isExpanded ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                            {ref}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={enq.isResolved ? 'resolved' : 'pending'} />
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                            {formatDate(enq.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleResolved(enq)}
                              disabled={toggling === enq._id}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                enq.isResolved
                                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  : 'bg-orange-500 text-white hover:bg-orange-600'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {toggling === enq._id
                                ? 'Saving…'
                                : enq.isResolved
                                ? 'Mark Pending'
                                : 'Mark Resolved'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isExpanded && (
                          <tr key={`${enq._id}-expanded`} className="bg-blue-50">
                            <td colSpan={9} className="px-6 py-4">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                <span className="font-semibold text-[#1e3a5f]">
                                  Full Message:{' '}
                                </span>
                                {enq.message}
                              </p>
                              {(enq.productRef || enq.kitRef) && (
                                <p className="mt-1 text-xs text-gray-500">
                                  <span className="font-semibold">
                                    {enq.productRef ? 'Product' : 'Kit'}:{' '}
                                  </span>
                                  {enq.productRef?.name ?? enq.kitRef?.name} (
                                  {enq.productRef?._id ?? enq.kitRef?._id})
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Page {meta.page} of {meta.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: meta.pages }, (_, i) => i + 1)
                    .filter(
                      (p) => p === 1 || p === meta.pages || Math.abs(p - page) <= 1
                    )
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1.5 text-xs text-gray-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item as number)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            page === item
                              ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                              : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                    disabled={page >= meta.pages}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
