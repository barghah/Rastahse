import { getAdminOrders } from "@/actions/admin";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  pending:    "text-amber-400 bg-amber-400/10",
  paid:       "text-blue-400 bg-blue-400/10",
  processing: "text-purple-400 bg-purple-400/10",
  shipped:    "text-indigo-400 bg-indigo-400/10",
  delivered:  "text-emerald-400 bg-emerald-400/10",
  cancelled:  "text-red-400 bg-red-400/10",
  refunded:   "text-gray-400 bg-gray-400/10",
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
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="font-label text-xl text-white/90 font-light tracking-wide">Orders</h1>
        <p className="font-body text-xs text-white/30 mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""} {statusFilter !== "all" ? `· ${statusFilter}` : ""}</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-full font-label text-[10px] uppercase tracking-wider transition-all ${
              statusFilter === s
                ? "bg-berry text-white"
                : "text-white/35 hover:text-white/60 border border-white/10 hover:border-white/20"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Orders table */}
      {orders.length === 0 ? (
        <div
          className="rounded-[14px] p-10 text-center border"
          style={{ backgroundColor: "#1c1917", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <p className="font-body text-sm text-white/30">No orders found.</p>
        </div>
      ) : (
        <div
          className="rounded-[14px] border overflow-x-auto"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ backgroundColor: "#1c1917" }}>
                {["Order", "Customer", "Items", "Total", "Status", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-label text-[10px] text-white/30 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const badge = STATUS_BADGE[order.status] ?? "text-white/40 bg-white/5";
                const addr = order.shipping_address as { name?: string; city?: string } | null;
                const items = Array.isArray(order.items) ? order.items : [];

                return (
                  <tr
                    key={order.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? "#161412" : "#1a1815",
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <td className="px-4 py-3 font-label text-[11px] text-berry whitespace-nowrap">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-xs text-white/70">{addr?.name ?? "—"}</p>
                      <p className="font-body text-[10px] text-white/30">{order.phone ?? order.email ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-white/40">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 font-label text-xs text-white/80 whitespace-nowrap">
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full font-label text-[10px] capitalize ${badge}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-white/35 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-label text-[10px] text-white/30 hover:text-berry transition-colors"
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
