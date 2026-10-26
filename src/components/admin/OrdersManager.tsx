"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { seedDemoOrdersAction } from "@/actions/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  created_at: string;
  email: string;
  phone: string | null;
  status: string;
  total: number;
  items: unknown[];
  shipping_address: unknown;
  tracking_number: string | null;
  razorpay_order_id: string | null;
}

interface Props {
  orders: Order[];
}

// ─── Status Classification ────────────────────────────────────────────────────
// We derive TWO logical statuses from the single `status` field:
// Payment Status: pending | paid | cod | refunded
// Delivery Stage: preprocessing | shipped | delivered | cancelled

const PAYMENT_STATUS: Record<string, { label: string; classes: string }> = {
  pending:    { label: "Pending",   classes: "bg-amber-50  text-amber-800  border-amber-200/80" },
  paid:       { label: "Paid",      classes: "bg-blue-50   text-blue-800   border-blue-200/80" },
  cod:        { label: "COD",       classes: "bg-violet-50 text-violet-800 border-violet-200" },
  refunded:   { label: "Refunded",  classes: "bg-stone-100 text-stone-700  border-stone-200" },
  processing: { label: "Paid",      classes: "bg-blue-50   text-blue-800   border-blue-200/80" },
  shipped:    { label: "Paid",      classes: "bg-blue-50   text-blue-800   border-blue-200/80" },
  delivered:  { label: "Paid",      classes: "bg-blue-50   text-blue-800   border-blue-200/80" },
  cancelled:  { label: "Cancelled", classes: "bg-red-50    text-red-800    border-red-200/80" },
};

const DELIVERY_STATUS: Record<string, { label: string; classes: string }> = {
  pending:    { label: "Pre-processing", classes: "bg-amber-50    text-amber-800    border-amber-200/80" },
  paid:       { label: "Pre-processing", classes: "bg-amber-50    text-amber-800    border-amber-200/80" },
  cod:        { label: "Pre-processing", classes: "bg-amber-50    text-amber-800    border-amber-200/80" },
  processing: { label: "Pre-processing", classes: "bg-purple-50   text-purple-800   border-purple-200" },
  shipped:    { label: "Out for Delivery",classes: "bg-indigo-50   text-indigo-800   border-indigo-200" },
  delivered:  { label: "Delivered",      classes: "bg-emerald-50  text-emerald-800  border-emerald-200" },
  cancelled:  { label: "Cancelled",      classes: "bg-red-50      text-red-800      border-red-200/80" },
  refunded:   { label: "Cancelled",      classes: "bg-red-50      text-red-800      border-red-200/80" },
};

// Payment filter groups
type PaymentFilter = "all" | "paid" | "pending" | "cod" | "refunded";
const PAYMENT_FILTERS: { key: PaymentFilter; label: string; statuses: string[] }[] = [
  { key: "all",      label: "All",       statuses: [] },
  { key: "paid",     label: "Paid",      statuses: ["paid", "processing", "shipped", "delivered"] },
  { key: "pending",  label: "Pending",   statuses: ["pending"] },
  { key: "cod",      label: "COD",       statuses: ["cod"] },
  { key: "refunded", label: "Refunded",  statuses: ["refunded"] },
];

// Delivery filter groups
type DeliveryFilter = "all" | "preprocessing" | "shipped" | "delivered" | "cancelled";
const DELIVERY_FILTERS: { key: DeliveryFilter; label: string; statuses: string[] }[] = [
  { key: "all",           label: "All",               statuses: [] },
  { key: "preprocessing", label: "Pre-processing",    statuses: ["pending", "paid", "cod", "processing"] },
  { key: "shipped",       label: "Out for Delivery",  statuses: ["shipped"] },
  { key: "delivered",     label: "Delivered",         statuses: ["delivered"] },
  { key: "cancelled",     label: "Cancelled",         statuses: ["cancelled", "refunded"] },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function getAddr(order: Order): { name?: string; city?: string } | null {
  return order.shipping_address as { name?: string; city?: string } | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersManager({ orders }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("all");
  const [isSeeding, startSeed] = useTransition();

  function handleSeedDemoOrders() {
    startSeed(async () => {
      await seedDemoOrdersAction();
      router.refresh();
    });
  }

  const filtered = useMemo(() => {
    let result = orders;

    // Payment filter
    const pf = PAYMENT_FILTERS.find((f) => f.key === paymentFilter);
    if (pf && pf.statuses.length > 0) {
      result = result.filter((o) => pf.statuses.includes(o.status));
    }

    // Delivery filter
    const df = DELIVERY_FILTERS.find((f) => f.key === deliveryFilter);
    if (df && df.statuses.length > 0) {
      result = result.filter((o) => df.statuses.includes(o.status));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((o) => {
        const addr = getAddr(o);
        const name = addr?.name?.toLowerCase() ?? "";
        const city = addr?.city?.toLowerCase() ?? "";
        const id = o.id.toLowerCase();
        const email = o.email?.toLowerCase() ?? "";
        const phone = o.phone ?? "";
        const tracking = o.tracking_number?.toLowerCase() ?? "";
        const razorpay = o.razorpay_order_id?.toLowerCase() ?? "";
        return (
          id.includes(q) ||
          name.includes(q) ||
          city.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          tracking.includes(q) ||
          razorpay.includes(q)
        );
      });
    }

    return result;
  }, [orders, search, paymentFilter, deliveryFilter]);

  return (
    <div className="space-y-5">
      {/* ── Search ── */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35 text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Order ID, customer name, phone, email, or tracking number…"
          className="w-full pl-11 pr-10 py-3 rounded-[14px] font-body text-sm text-ink bg-paper border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 shadow-soft transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink text-xs p-1 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Filter Groups ── */}
      <div className="bg-paper rounded-[18px] border border-brand shadow-soft p-4 space-y-3">
        {/* Payment Status */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-label text-[9.5px] text-ink/40 uppercase tracking-widest font-semibold w-20 shrink-0">
            Payment
          </span>
          {PAYMENT_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setPaymentFilter(f.key)}
              className={`px-3 py-1.5 rounded-full font-label text-[10px] uppercase tracking-wider transition-all font-medium cursor-pointer border ${
                paymentFilter === f.key
                  ? "bg-blue-700 text-paper border-blue-700 shadow-xs"
                  : "bg-surface/60 text-ink/60 border-brand hover:text-ink hover:border-ink/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-brand/60" />

        {/* Delivery Stage */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-label text-[9.5px] text-ink/40 uppercase tracking-widest font-semibold w-20 shrink-0">
            Delivery
          </span>
          {DELIVERY_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setDeliveryFilter(f.key)}
              className={`px-3 py-1.5 rounded-full font-label text-[10px] uppercase tracking-wider transition-all font-medium cursor-pointer border ${
                deliveryFilter === f.key
                  ? "bg-emerald-700 text-paper border-emerald-700 shadow-xs"
                  : "bg-surface/60 text-ink/60 border-brand hover:text-ink hover:border-ink/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reset */}
        {(paymentFilter !== "all" || deliveryFilter !== "all" || search) && (
          <div className="flex justify-end border-t border-brand/60 pt-2">
            <button
              type="button"
              onClick={() => {
                setPaymentFilter("all");
                setDeliveryFilter("all");
                setSearch("");
              }}
              className="font-label text-[10px] text-berry hover:underline uppercase tracking-wider cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Count & Quick Seed ── */}
      <div className="flex items-center justify-between px-1">
        <p className="font-body text-xs text-ink/45">
          Showing <strong className="text-ink font-semibold">{filtered.length}</strong> of{" "}
          <strong className="text-ink font-semibold">{orders.length}</strong> orders
        </p>

        <button
          type="button"
          onClick={handleSeedDemoOrders}
          disabled={isSeeding}
          className="font-label text-[10px] text-berry hover:text-[#580118] uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-40"
        >
          {isSeeding ? "Loading Demo Orders…" : "✨ Reload Demo Orders"}
        </button>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="rounded-[18px] p-12 text-center bg-paper border border-brand shadow-soft space-y-3">
          <p className="font-body text-sm text-ink/40">No orders match the current filters.</p>
          {search ? (
            <p className="font-body text-xs text-ink/30 mt-1">
              Try searching by a different term.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleSeedDemoOrders}
              disabled={isSeeding}
              className="mt-2 px-4 py-2 rounded-[10px] bg-berry text-paper font-label text-[10.5px] uppercase tracking-wider font-semibold shadow-xs hover:bg-[#580118] disabled:opacity-50 cursor-pointer"
            >
              {isSeeding ? "Seeding Orders…" : "✨ Load Sample Staging Orders"}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-[18px] bg-paper border border-brand overflow-x-auto shadow-soft">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-surface/70 border-b border-brand">
                {["Order", "Customer", "Items", "Total", "Payment", "Delivery", "Date", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left font-label text-[9.5px] text-ink/45 uppercase tracking-wider whitespace-nowrap font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand/50">
              {filtered.map((order) => {
                const addr = getAddr(order);
                const items = Array.isArray(order.items) ? order.items : [];
                const payBadge = PAYMENT_STATUS[order.status] ?? PAYMENT_STATUS.pending;
                const delBadge = DELIVERY_STATUS[order.status] ?? DELIVERY_STATUS.pending;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-surface/40 transition-colors group"
                  >
                    {/* Order ID */}
                    <td className="px-4 py-4">
                      <span className="font-mono text-[11px] text-berry font-semibold">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      {order.tracking_number && (
                        <p className="font-mono text-[9.5px] text-ink/35 mt-0.5 truncate max-w-[80px]">
                          {order.tracking_number}
                        </p>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <p className="font-body text-xs text-ink font-medium leading-snug">
                        {addr?.name ?? "Guest"}
                      </p>
                      <p className="font-body text-[11px] text-ink/40 mt-0.5">
                        {order.phone ?? order.email ?? "—"}
                      </p>
                      {addr?.city && (
                        <p className="font-label text-[9.5px] text-ink/30 uppercase tracking-wider mt-0.5">
                          {addr.city}
                        </p>
                      )}
                    </td>

                    {/* Items */}
                    <td className="px-4 py-4 font-body text-xs text-ink/55">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-4 font-label text-xs text-ink font-semibold whitespace-nowrap">
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </td>

                    {/* Payment Status Badge */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-label text-[9px] uppercase tracking-wider font-semibold border ${payBadge.classes}`}
                      >
                        {payBadge.label}
                      </span>
                    </td>

                    {/* Delivery Stage Badge */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-label text-[9px] uppercase tracking-wider font-semibold border ${delBadge.classes}`}
                      >
                        {delBadge.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 font-body text-[11px] text-ink/45 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-label text-[10.5px] text-berry hover:text-[#580118] font-medium transition-colors group-hover:underline"
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
      )}
    </div>
  );
}
