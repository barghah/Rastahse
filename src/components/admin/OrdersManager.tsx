"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { seedDemoOrdersAction } from "@/actions/admin";
import type { AdminOrderSummary, AdminOrdersListResult } from "@/actions/orders-admin";
import type { DeliveryStatus, PaymentStatus } from "@/lib/shiprocket/types";

// ─── Status Visual Mappings ───────────────────────────────────────────────────

const PAYMENT_BADGES: Record<PaymentStatus, { label: string; classes: string }> = {
  paid: {
    label: "Paid",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  },
  cod: {
    label: "COD",
    classes: "bg-amber-50 text-amber-800 border-amber-200/80",
  },
  refunded: {
    label: "Refunded",
    classes: "bg-stone-100 text-stone-700 border-stone-200",
  },
  awaiting_payment: {
    label: "Awaiting Payment",
    classes: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
};

const DELIVERY_BADGES: Record<
  DeliveryStatus,
  { label: string; classes: string; pickupLabel?: string }
> = {
  waiting_approval: {
    label: "Waiting for approval",
    classes: "bg-amber-50 text-amber-900 border-amber-300 font-medium",
  },
  pending_dropoff: {
    label: "Pending drop-off",
    pickupLabel: "Pending pickup",
    classes: "bg-blue-50 text-blue-800 border-blue-200",
  },
  in_transit: {
    label: "In transit",
    classes: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  delivered: {
    label: "Delivered",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  retrying: {
    label: "Retrying (NDR)",
    classes: "bg-rose-50 text-rose-800 border-rose-300 font-medium animate-pulse",
  },
  returned: {
    label: "Returned",
    classes: "bg-rose-50 text-rose-800 border-rose-200",
  },
  return_in_transit: {
    label: "In transit (return)",
    classes: "bg-orange-50 text-orange-800 border-orange-200",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-stone-100 text-stone-600 border-stone-200",
  },
};

const PAYMENT_FILTERS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "cod", label: "COD" },
  { key: "refunded", label: "Refunded" },
];

const DELIVERY_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "waiting_approval", label: "Waiting for approval" },
  { key: "pending_dropoff", label: "Pending drop-off" },
  { key: "in_transit", label: "In transit" },
  { key: "delivered", label: "Delivered" },
  { key: "retrying", label: "Retrying (NDR)" },
  { key: "returned", label: "Returned" },
  { key: "return_in_transit", label: "In transit (return)" },
  { key: "cancelled", label: "Cancelled" },
];

interface Props {
  initialData: AdminOrdersListResult;
  searchParams: {
    page?: string;
    search?: string;
    payment?: string;
    delivery?: string;
    needs_approval?: string;
  };
}

export function OrdersManager({ initialData, searchParams: query }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchVal, setSearchVal] = useState(query.search || "");

  const activeNeedsApproval = query.needs_approval === "true";
  const activePayment = query.payment || "all";
  const activeDelivery = query.delivery || "all";
  const currentPage = initialData.page;

  function updateQuery(params: Record<string, string | null>) {
    const sp = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(params)) {
      if (v === null || v === "" || v === "all" || v === "false") {
        sp.delete(k);
      } else {
        sp.set(k, v);
      }
    }
    // Always reset to page 1 on filter changes unless changing page
    if (!("page" in params)) {
      sp.delete("page");
    }

    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery({ search: searchVal.trim() || null });
  }

  function handleQuickNeedsApproval() {
    if (activeNeedsApproval) {
      updateQuery({ needs_approval: null });
    } else {
      updateQuery({ needs_approval: "true", delivery: null, payment: null });
    }
  }

  function handleReloadDemoOrders() {
    startTransition(async () => {
      await seedDemoOrdersAction();
      router.refresh();
    });
  }

  const waitingCount = initialData.counts.waiting_approval;

  return (
    <div className="space-y-5">
      {/* ── Top Bar: Search & Quick "NEEDS APPROVAL" Filter ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search Order #, UUID, customer name, phone, email, AWB…"
            className="w-full pl-9 pr-20 py-2.5 rounded-[12px] bg-paper border border-brand font-body text-xs text-ink placeholder:text-ink/35 focus:outline-none focus:border-berry transition-colors shadow-2xs"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-xs">
            🔍
          </span>
          {searchVal && (
            <button
              type="button"
              onClick={() => {
                setSearchVal("");
                updateQuery({ search: null });
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink text-xs font-label"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-[8px] bg-surface font-label text-[10px] text-ink/70 hover:text-ink font-semibold uppercase tracking-wider"
          >
            Find
          </button>
        </form>

        {/* Quick Needs Approval Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleQuickNeedsApproval}
            className={`px-4 py-2.5 rounded-[12px] font-label text-[10.5px] uppercase tracking-wider font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
              activeNeedsApproval
                ? "bg-berry text-paper border-berry shadow-sm"
                : "bg-paper text-ink/75 border-brand hover:border-berry/60 hover:text-berry shadow-2xs"
            }`}
          >
            <span>🚨 Needs Approval</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                activeNeedsApproval
                  ? "bg-paper/25 text-paper"
                  : waitingCount > 0
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-surface text-ink/40"
              }`}
            >
              {waitingCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── Filter Rows (Payment & Delivery) ── */}
      <div className="rounded-[16px] p-4 bg-paper border border-brand shadow-soft space-y-3.5">
        {/* Payment filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-label text-[10px] text-ink/40 uppercase tracking-widest w-16 shrink-0">
            Payment:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PAYMENT_FILTERS.map((f) => {
              const count = f.key === "all" ? initialData.counts.all : (initialData.counts as any)[f.key] || 0;
              const active = activePayment === f.key && !activeNeedsApproval;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => updateQuery({ payment: f.key, needs_approval: null })}
                  className={`px-3 py-1 rounded-[9px] font-label text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer border ${
                    active
                      ? "bg-ink text-paper border-ink"
                      : "bg-surface/60 text-ink/60 border-brand/60 hover:border-brand hover:text-ink"
                  }`}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery filter */}
        <div className="flex items-center gap-2 flex-wrap pt-2.5 border-t border-brand/50">
          <span className="font-label text-[10px] text-ink/40 uppercase tracking-widest w-16 shrink-0">
            Delivery:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {DELIVERY_FILTERS.map((f) => {
              const count = f.key === "all" ? initialData.counts.all : (initialData.counts as any)[f.key] || 0;
              const active = activeDelivery === f.key && !activeNeedsApproval;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => updateQuery({ delivery: f.key, needs_approval: null })}
                  className={`px-3 py-1 rounded-[9px] font-label text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer border ${
                    active
                      ? "bg-berry text-paper border-berry"
                      : "bg-surface/60 text-ink/60 border-brand/60 hover:border-brand hover:text-ink"
                  }`}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Active Count & Seeder ── */}
      <div className="flex items-center justify-between px-1">
        <p className="font-body text-xs text-ink/45">
          Showing <strong className="text-ink font-semibold">{initialData.orders.length}</strong> of{" "}
          <strong className="text-ink font-semibold">{initialData.totalCount}</strong> matching order
          {initialData.totalCount !== 1 ? "s" : ""}
          {isPending && <span className="ml-2 text-berry animate-pulse">updating…</span>}
        </p>

        <button
          type="button"
          onClick={handleReloadDemoOrders}
          disabled={isPending}
          className="font-label text-[10px] text-berry hover:text-[#580118] uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-40"
        >
          {isPending ? "Syncing…" : "✨ Reload Sample Orders"}
        </button>
      </div>

      {/* ── Orders Table ── */}
      {initialData.orders.length === 0 ? (
        <div className="rounded-[18px] p-12 text-center bg-paper border border-brand shadow-soft space-y-3">
          <p className="font-body text-sm text-ink/45">No orders match the current criteria.</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => updateQuery({ search: null, payment: null, delivery: null, needs_approval: null })}
              className="px-4 py-2 rounded-[10px] bg-surface font-label text-[10px] uppercase tracking-wider font-semibold text-ink border border-brand hover:border-ink cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={handleReloadDemoOrders}
              className="px-4 py-2 rounded-[10px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider font-semibold hover:bg-[#580118] cursor-pointer"
            >
              ✨ Seed Sample Orders
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[18px] bg-paper border border-brand overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand bg-surface/70 font-label text-[9.5px] uppercase tracking-wider text-ink/45 font-semibold">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Delivery Stage &amp; Courier</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/60 font-body">
                {initialData.orders.map((order) => {
                  const shortId = order.id.slice(0, 8).toUpperCase();
                  const placedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const placedTime = new Date(order.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const payBadge = PAYMENT_BADGES[order.payment_status] || PAYMENT_BADGES.paid;
                  const delBadge = DELIVERY_BADGES[order.delivery_status] || DELIVERY_BADGES.waiting_approval;
                  const deliveryLabel =
                    order.delivery_status === "pending_dropoff" && order.handover_method === "pickup"
                      ? delBadge.pickupLabel || delBadge.label
                      : delBadge.label;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface/35 transition-colors group"
                    >
                      {/* Order info */}
                      <td className="py-3.5 px-4 font-body">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-xs text-ink font-semibold hover:text-berry transition-colors group-hover:underline flex items-center gap-1.5"
                        >
                          #{shortId}
                          {order.needs_attention && (
                            <span
                              title="Courier state requires attention"
                              className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping"
                            />
                          )}
                        </Link>
                        <p className="font-label text-[9.5px] text-ink/35 mt-0.5">
                          {placedDate} · {placedTime}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-ink truncate max-w-[170px]">
                          {order.shipping_address?.name || "Guest Customer"}
                        </p>
                        <p className="font-label text-[10px] text-ink/45 mt-0.5">
                          {order.shipping_address?.city || order.phone || order.email}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-ink truncate max-w-[180px]">
                          {order.items_summary}
                        </p>
                        <p className="font-label text-[9.5px] text-ink/35 mt-0.5">
                          {order.items_count} unit{order.items_count !== 1 ? "s" : ""}
                        </p>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-label text-xs font-semibold text-ink whitespace-nowrap">
                        ₹{order.total.toLocaleString("en-IN")}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-label text-[9.5px] uppercase tracking-wider font-semibold border ${payBadge.classes}`}
                        >
                          {payBadge.label}
                        </span>
                        <p className="font-label text-[8.5px] text-ink/35 mt-0.5 uppercase tracking-widest">
                          {order.payment_method === "cod" ? "COD" : "Razorpay"}
                        </p>
                      </td>

                      {/* Delivery */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-label text-[9.5px] uppercase tracking-wider font-semibold border ${delBadge.classes}`}
                        >
                          {deliveryLabel}
                        </span>

                        {/* Courier & AWB */}
                        {order.tracking_number ? (
                          <div className="mt-1 flex items-center gap-1.5 font-label text-[9.5px]">
                            <span className="text-ink/50 font-medium">
                              {order.courier_name || "Courier"}:
                            </span>
                            <a
                              href={`https://shiprocket.co/tracking/${order.tracking_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-berry font-semibold hover:underline"
                            >
                              {order.tracking_number} ↗
                            </a>
                          </div>
                        ) : order.fulfillment_mode === "local" ? (
                          <p className="font-label text-[9px] text-ink/40 mt-1 uppercase tracking-wider font-medium">
                            🚗 Local Hand Delivery
                          </p>
                        ) : null}
                      </td>

                      {/* Dates cell */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-label text-[9px] text-ink/50 space-y-0.5">
                        <div>
                          <span className="text-ink/30 uppercase tracking-widest mr-1">Placed:</span>
                          <span className="font-medium text-ink/70">{placedDate}</span>
                        </div>
                        <div>
                          <span className="text-ink/30 uppercase tracking-widest mr-1">Expected:</span>
                          <span className="font-medium text-ink/70">
                            {order.expected_delivery_date || "—"}
                          </span>
                        </div>
                        {order.delivered_at && (
                          <div>
                            <span className="text-emerald-700/60 uppercase tracking-widest mr-1">Delivered:</span>
                            <span className="font-medium text-emerald-800">
                              {new Date(order.delivered_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Manage */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-block px-3 py-1.5 rounded-[9px] bg-surface hover:bg-berry hover:text-paper font-label text-[10px] text-ink uppercase tracking-wider font-semibold transition-all border border-brand hover:border-berry shadow-2xs"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Server-side Pagination ── */}
          {initialData.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-brand bg-surface/30">
              <p className="font-label text-[10px] text-ink/50 uppercase tracking-wider">
                Page {currentPage} of {initialData.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isPending}
                  onClick={() => updateQuery({ page: String(currentPage - 1) })}
                  className="px-3 py-1.5 rounded-[8px] bg-paper border border-brand font-label text-[10px] uppercase tracking-wider font-semibold text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:border-ink cursor-pointer"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  disabled={currentPage >= initialData.totalPages || isPending}
                  onClick={() => updateQuery({ page: String(currentPage + 1) })}
                  className="px-3 py-1.5 rounded-[8px] bg-paper border border-brand font-label text-[10px] uppercase tracking-wider font-semibold text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:border-ink cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
