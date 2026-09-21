import { getAdminStats, getAdminOrders } from "@/actions/admin";
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

export default async function AdminDashboard() {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let stats = { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, unreadMessages: 0 };
  let recentOrders: Awaited<ReturnType<typeof getAdminOrders>> = [];

  if (hasSupabase) {
    [stats, recentOrders] = await Promise.all([
      getAdminStats(),
      getAdminOrders(),
    ]);
    recentOrders = recentOrders.slice(0, 5);
  }

  const statCards = [
    { label: "Total Orders",      value: stats.totalOrders,                                sub: "all time" },
    { label: "Revenue",           value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, sub: "excl. cancelled" },
    { label: "Pending Orders",    value: stats.pendingOrders,                              sub: "need fulfillment" },
    { label: "Inquiries",         value: stats.unreadMessages,                             sub: "contact form" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="font-label text-2xl text-ink font-medium tracking-tight">Dashboard Overview</h1>
        <p className="font-body text-xs text-ink/50 mt-1">Manage orders, inventory, and customer messages.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[18px] p-5 sm:p-6 bg-paper border border-brand shadow-soft"
          >
            <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider font-medium">{card.label}</p>
            <p className="font-label text-2xl sm:text-3xl text-ink font-semibold mt-2.5 tracking-tight">{card.value}</p>
            <p className="font-body text-[11px] text-ink/40 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-label text-xs text-ink/70 uppercase tracking-widest font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="font-label text-[10.5px] text-berry hover:text-[#580118] transition-colors font-medium">
            View All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-[18px] p-10 text-center bg-paper border border-brand shadow-soft">
            <p className="font-body text-sm text-ink/40">No orders recorded yet.</p>
          </div>
        ) : (
          <div className="rounded-[18px] bg-paper border border-brand overflow-hidden shadow-soft">
            <table className="w-full">
              <thead>
                <tr className="bg-surface/70 border-b border-brand">
                  {["Order ID", "Customer", "Total", "Status", "Date"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left font-label text-[10px] text-ink/50 uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/60">
                {recentOrders.map((order) => {
                  const badge = STATUS_BADGE[order.status] ?? "text-ink/60 bg-surface border border-brand";
                  const addr = order.shipping_address as { name?: string } | null;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-ink/70">
                        <Link href={`/admin/orders/${order.id}`} className="hover:text-berry underline underline-offset-2">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 font-body text-xs text-ink/80 font-medium">
                        {addr?.name ?? "Guest"}
                      </td>
                      <td className="px-5 py-3.5 font-label text-xs text-ink font-semibold">
                        ₹{order.total.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-label text-[9px] uppercase tracking-wider font-medium ${badge}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-body text-xs text-ink/45">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
