'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiFilter,
  FiSave,
  FiPackage,
  FiFileText,
} from 'react-icons/fi';

import { exportToExcel } from '@/utils/exportExcel';
import { adminService } from '@/services/admin.service';
import StatusBadge from '@/components/common/StatusBadge';
import Loader from '@/components/common/Loader';
import { useAuth } from '@/context/AuthContext';
import { Order, OrderItem } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminOrder extends Omit<Order, 'user'> {
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface RowState {
  orderStatus: Order['orderStatus'];
  paymentStatus: Order['paymentStatus'];
  saving: boolean;
  saved: boolean;
  error: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUSES: Order['orderStatus'][] = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
];

const PAYMENT_STATUSES: Order['paymentStatus'][] = ['pending', 'paid', 'failed'];

const PAGE_SIZE = 10;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SelectField<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

function generateInvoice(order: AdminOrder) {
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const addr = order.shippingAddress;

  const itemRows = order.items.map((item, i) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${item.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">₹${item.price.toLocaleString('en-IN')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">₹${(item.quantity * item.price).toLocaleString('en-IN')}</td>
    </tr>`
  ).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><title>Invoice - ${order.orderNumber}</title>
<style>
  body { font-family: Arial, sans-serif; margin:0; padding:40px; color:#333; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; border-bottom:3px solid #1e3a5f; padding-bottom:20px; }
  .logo { font-size:24px; font-weight:800; color:#1e3a5f; }
  .logo span { color:#f97316; }
  .invoice-title { font-size:28px; font-weight:800; color:#1e3a5f; text-align:right; }
  .invoice-meta { text-align:right; font-size:13px; color:#666; margin-top:5px; }
  .section { margin-bottom:25px; }
  .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#999; margin-bottom:8px; }
  .address { font-size:13px; line-height:1.7; }
  table { width:100%; border-collapse:collapse; margin-top:10px; }
  th { background:#1e3a5f; color:#fff; padding:10px 12px; text-align:left; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
  th:first-child { border-radius:6px 0 0 0; }
  th:last-child { border-radius:0 6px 0 0; text-align:right; }
  th:nth-child(3), th:nth-child(4) { text-align:center; }
  td { font-size:13px; }
  .total-row td { border-top:2px solid #1e3a5f; font-size:16px; font-weight:800; padding:14px 12px; }
  .footer { margin-top:40px; text-align:center; font-size:12px; color:#999; border-top:1px solid #eee; padding-top:20px; }
  .status { display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; }
  .badge-row { display:flex; gap:10px; margin-top:10px; }
  @media print { body { padding:20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Dream<span>Startup</span></div>
      <div style="font-size:11px;color:#999;margin-top:2px">B2B Wholesale Platform</div>
    </div>
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-meta">
        <strong>#${order.orderNumber}</strong><br/>
        Date: ${invoiceDate}
      </div>
    </div>
  </div>

  <div style="display:flex;gap:40px;margin-bottom:25px;">
    <div class="section" style="flex:1">
      <div class="section-title">Bill To</div>
      <div class="address">
        <strong>${order.user?.name || '—'}</strong><br/>
        ${order.user?.email || ''}<br/>
        ${order.user?.phone || ''}
      </div>
    </div>
    <div class="section" style="flex:1">
      <div class="section-title">Ship To</div>
      <div class="address">
        ${addr.address}<br/>
        ${addr.city}, ${addr.state} — ${addr.pincode}<br/>
        Phone: ${addr.phone}
      </div>
    </div>
    <div class="section" style="flex:1">
      <div class="section-title">Details</div>
      <div class="address">
        <strong>Payment:</strong> ${order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online / On Call'}<br/>
        <strong>Order Status:</strong> ${order.orderStatus}<br/>
        <strong>Payment Status:</strong> ${order.paymentStatus}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:50px">#</th>
        <th>Item</th>
        <th style="text-align:center;width:80px">Qty</th>
        <th style="text-align:center;width:100px">Price</th>
        <th style="text-align:right;width:120px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="total-row">
        <td colspan="4" style="text-align:right;padding-right:12px">Grand Total</td>
        <td style="text-align:right;color:#1e3a5f">₹${order.totalAmount.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  ${order.notes ? `<div style="margin-top:20px;padding:12px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:13px"><strong style="color:#ea580c">Note:</strong> ${order.notes}</div>` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>DreamStartup — Apka Sapna, Humara Sahayog</p>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

function ExpandedOrderRow({ order }: { order: AdminOrder }) {
  return (
    <div className="bg-[#1e3a5f]/[0.03] px-6 py-5">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Items */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Order Items
          </h4>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {order.items.map((item: OrderItem, idx: number) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image.startsWith('http') ? item.image : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${item.image.startsWith('/') ? '' : '/'}${item.image}`}
                    alt={item.title}
                    className="h-10 w-10 rounded-lg object-cover border border-gray-100"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <FiPackage size={16} className="text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity} &times; ₹{item.price.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold text-[#1e3a5f]">
                  ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Shipping Address
          </h4>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-700 space-y-1">
            <p className="font-medium text-gray-800">{order.user?.name}</p>
            <p>{order.shippingAddress.address}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
              {order.shippingAddress.pincode}
            </p>
            <p className="mt-1 font-medium text-[#1e3a5f]">
              {order.shippingAddress.phone}
            </p>
          </div>

          {order.notes && (
            <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm text-gray-700">
              <span className="font-semibold text-orange-600">Note: </span>
              {order.notes}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => generateInvoice(order)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16304f] active:scale-95"
        >
          <FiFileText size={16} />
          Download Invoice
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminService.getOrders(params);
      const raw = res.data;
      const list: AdminOrder[] =
        raw?.data?.orders ?? raw?.data ?? raw?.orders ?? [];
      const totalCount: number = raw?.data?.total ?? raw?.total ?? list.length;
      const totalPages: number = raw?.data?.pages ?? raw?.pages ?? Math.ceil(totalCount / PAGE_SIZE);

      setOrders(list);
      setTotal(totalCount);
      setPages(totalPages || 1);

      // Initialise row states for new orders
      const initial: Record<string, RowState> = {};
      list.forEach((o) => {
        if (!rowStates[o._id]) {
          initial[o._id] = {
            orderStatus: o.orderStatus,
            paymentStatus: o.paymentStatus,
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
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  useEffect(() => {
    if (user?.role === 'admin') fetchOrders();
  }, [fetchOrders, user]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateRowState(id: string, patch: Partial<RowState>) {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  async function handleSave(order: AdminOrder) {
    const rs = rowStates[order._id];
    if (!rs) return;
    updateRowState(order._id, { saving: true, saved: false, error: '' });
    try {
      await adminService.updateOrderStatus(order._id, {
        orderStatus: rs.orderStatus,
        paymentStatus: rs.paymentStatus,
      });
      updateRowState(order._id, { saving: false, saved: true });
      // Refresh order in list
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id
            ? { ...o, orderStatus: rs.orderStatus, paymentStatus: rs.paymentStatus }
            : o
        )
      );
      setTimeout(() => updateRowState(order._id, { saved: false }), 2500);
    } catch {
      updateRowState(order._id, {
        saving: false,
        error: 'Failed to update. Try again.',
      });
    }
  }

  const handleExport = () => {
    if (orders.length === 0) return;
    const data = orders.map((o) => ({
      'Order #': o.orderNumber,
      Customer: o.user?.name || '',
      Email: o.user?.email || '',
      Phone: o.user?.phone || '',
      Items: o.items.length,
      Total: o.totalAmount,
      'Order Status': o.orderStatus,
      'Payment Status': o.paymentStatus,
      Date: new Date(o.createdAt).toLocaleDateString('en-IN'),
    }));
    exportToExcel(data, 'orders');
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
          <h1 className="mt-1 text-3xl font-extrabold text-white">Orders</h1>
          <p className="mt-1 text-blue-300">
            Manage and update order and payment statuses.
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
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {total} order{total !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={handleExport}
              disabled={orders.length === 0}
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
        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <FiPackage size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-gray-500">No orders found</p>
            <p className="mt-1 text-sm text-gray-400">
              Try changing the status filter.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && orders.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Order #',
                      'Customer',
                      'Items',
                      'Total',
                      'Order Status',
                      'Payment Status',
                      'Date',
                      'Actions',
                      '',
                    ].map((h, i) => (
                      <th
                        key={h || i}
                        className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const rs = rowStates[order._id];
                    const isExpanded = expandedRows.has(order._id);
                    return (
                      <React.Fragment key={order._id}>
                        <tr
                          className={`transition ${isExpanded ? 'bg-[#1e3a5f]/[0.03]' : 'hover:bg-gray-50'}`}
                        >
                          {/* Order # */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#1e3a5f]">
                            #{order.orderNumber}
                          </td>

                          {/* Customer */}
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-gray-800">
                              {order.user?.name ?? '—'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {order.user?.phone ?? order.user?.email ?? ''}
                            </p>
                          </td>

                          {/* Items count */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                            {order.items.length}{' '}
                            {order.items.length === 1 ? 'item' : 'items'}
                          </td>

                          {/* Total */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-800">
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </td>

                          {/* Order Status Dropdown */}
                          <td className="whitespace-nowrap px-5 py-4">
                            {rs ? (
                              <SelectField
                                label=""
                                value={rs.orderStatus}
                                options={ORDER_STATUSES}
                                onChange={(v) =>
                                  updateRowState(order._id, {
                                    orderStatus: v,
                                    saved: false,
                                  })
                                }
                              />
                            ) : (
                              <StatusBadge status={order.orderStatus} />
                            )}
                          </td>

                          {/* Payment Status Dropdown */}
                          <td className="whitespace-nowrap px-5 py-4">
                            {rs ? (
                              <SelectField
                                label=""
                                value={rs.paymentStatus}
                                options={PAYMENT_STATUSES}
                                onChange={(v) =>
                                  updateRowState(order._id, {
                                    paymentStatus: v,
                                    saved: false,
                                  })
                                }
                              />
                            ) : (
                              <StatusBadge status={order.paymentStatus} />
                            )}
                          </td>

                          {/* Date */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Save */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleSave(order)}
                                disabled={rs?.saving}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2d5a8e] disabled:opacity-60"
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
                                <span className="text-xs text-red-500">
                                  {rs.error}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Expand toggle */}
                          <td className="whitespace-nowrap px-4 py-4">
                            <button
                              onClick={() => toggleRow(order._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
                            >
                              {isExpanded ? (
                                <FiChevronUp size={14} />
                              ) : (
                                <FiChevronDown size={14} />
                              )}
                              {isExpanded ? 'Collapse' : 'Details'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isExpanded && (
                          <tr key={`${order._id}-expanded`}>
                            <td colSpan={9} className="p-0">
                              <ExpandedOrderRow order={order} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
