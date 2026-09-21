import { getAdminOrders } from "@/actions/admin";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  pending:    "text-amber-800 bg-amber-50 border border-amber-200/80",
  paid:       "text-blue-800 bg-blue-50 border border-blue-200/80",
  processing: "text-purple-800 bg-purple-50 border border-purple-200/80",
  shipped:    "text-indigo-800 bg-indigo-50 border border-indigo-200/80",
  delivered:  "text-emerald-800 bg-emerald-50 border border-emerald-200/80",
  cancelled:  "text-red-800 bg-red-50 border border-red-200/80",
  refunded:   "text-stone-700 bg-stone-100 border border-stone-200",
};

const ALL_STATUSES = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statusFilter = status ?? "all";

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const orders = hasSupabase ? await getAdminOrders(statusFilter === "all" ? undefined : statusFilter) : [];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="font-label text-2xl text-ink font-medium tracking-tight">Orders Management</h1>
        <p className="font-body text-xs text-ink/50 mt-1">
          {orders.length} order{orders.length !== 1 ? "s" : ""} {statusFilter !== "all" ? `· ${statusFilter}` : ""}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`px-3.5 py-1.5 rounded-full font-label text-[10.5px] uppercase tracking-wider transition-all font-medium ${
              statusFilter === s
                ? "bg-berry text-paper shadow-xs"
                : "text-ink/60 hover:text-ink bg-paper border border-brand hover:border-ink/20"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Orders table */}
      {orders.length === 0 ? (
        <div className="rounded-[18px] p-12 text-center bg-paper border border-brand shadow-soft">
          <p className="font-body text-sm text-ink/40">No orders found in this category.</p>
        </div>
      ) : (
        <div className="rounded-[18px] bg-paper border border-brand overflow-x-auto shadow-soft">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-surface/70 border-b border-brand">
                {["Order", "Customer", "Items", "Total", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left font-label text-[10px] text-ink/50 uppercase tracking-wider whitespace-nowrap font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand/60">
              {orders.map((order) => {
                const badge = STATUS_BADGE[order.status] ?? "text-ink/60 bg-surface border border-brand";
                const addr = order.shipping_address as { name?: string; city?: string } | null;
                const items = Array.isArray(order.items) ? order.items : [];

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-surface/40 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-berry font-medium whitespace-nowrap">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-body text-xs text-ink font-medium">{addr?.name ?? "Guest"}</p>
                      <p className="font-body text-[11px] text-ink/45">{order.phone ?? order.email ?? "—"}</p>
                    </td>
                    <td className="px-5 py-4 font-body text-xs text-ink/60">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-4 font-label text-xs text-ink font-semibold whitespace-nowrap">
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full font-label text-[9.5px] uppercase tracking-wider font-medium ${badge}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-body text-xs text-ink/50 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-label text-[10.5px] text-berry hover:text-[#580118] font-medium transition-colors"
                      >
                        Manage Order →
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
