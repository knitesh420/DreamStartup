"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiShoppingBag,
  FiFileText,
  FiHeart,
  FiUser,
  FiArrowRight,
  FiPackage,
} from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services/order.service";
import StatusBadge from "@/components/common/StatusBadge";
import Loader from "@/components/common/Loader";
import { Order } from "@/types";

// ─── Stat card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  href: string;
  accent?: boolean;
}

function StatCard({ icon: Icon, label, value, href, accent }: StatCardProps) {
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-4 rounded-2xl border p-6 transition hover:shadow-md ${
        accent
          ? "border-orange-200 bg-orange-50 hover:border-orange-400 dark:border-orange-700 dark:bg-orange-900/30"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#1e3a5f]/40"
      }`}
    >
      <div
        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${
          accent ? "bg-orange-500/20" : "bg-[#1e3a5f]/10"
        }`}
      >
        <Icon
          size={22}
          className={accent ? "text-orange-500" : "text-[#1e3a5f]"}
        />
      </div>

      <div>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {value}
        </p>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-300">
          {label}
        </p>
      </div>

      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold ${
          accent
            ? "text-orange-500 group-hover:text-orange-600"
            : "text-[#1e3a5f] group-hover:text-[#2d5a8e]"
        }`}
      >
        View <FiArrowRight size={12} />
      </span>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Fetch recent orders
  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const res = await orderService.getMyOrders();
        const raw = res.data;
        let list: Order[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (Array.isArray(raw?.data?.orders)) list = raw.data.orders;
        setOrders(list);
      } catch {
        setOrdersError("Unable to load recent orders.");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) return null;

  const recentOrders = orders.slice(0, 5);
  const savedCount = user.savedProducts?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-medium text-blue-200">Dashboard</p>
          <h1 className="mt-1 text-3xl font-extrabold text-white">
            Welcome, {user.name}
          </h1>
          <p className="mt-1 text-blue-300">
            Here&apos;s an overview of your account activity.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        {/* ── Stat Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatCard
            icon={FiShoppingBag}
            label="My Orders"
            value={orders.length}
            href="/dashboard/orders"
          />
          <StatCard
            icon={FiFileText}
            label="My Applications"
            value="—"
            href="/dashboard/applications"
            accent
          />
          <StatCard
            icon={FiHeart}
            label="Saved Products"
            value={savedCount}
            href="/dashboard/wishlist"
          />
          <StatCard
            icon={FiUser}
            label="Profile"
            value="Edit"
            href="/dashboard/profile"
          />
        </div>

        {/* ── Recent Orders ────────────────────────────────────────────────── */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1e3a5f]">Recent Orders</h2>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-600"
            >
              View All <FiArrowRight size={14} />
            </Link>
          </div>

          {ordersLoading && <Loader />}

          {ordersError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-6 text-center text-red-600 text-sm">
              {ordersError}
            </div>
          )}

          {!ordersLoading && !ordersError && recentOrders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-14 text-center">
              <FiPackage size={40} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 dark:text-gray-300 font-medium">
                No orders yet
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Start shopping to place your first order.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d5a8e]"
              >
                Browse Products <FiArrowRight size={14} />
              </Link>
            </div>
          )}

          {!ordersLoading && !ordersError && recentOrders.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {["Order #", "Date", "Items", "Total", "Status"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#1e3a5f]">
                          #{order.orderNumber}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "items"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-800 dark:text-gray-100">
                          ₹{order.totalAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <StatusBadge status={order.orderStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
