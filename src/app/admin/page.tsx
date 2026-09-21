import { getAdminStats, getAdminOrders } from "@/actions/admin";
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

export default async function AdminDashboard() {
  // In dev without env vars, show placeholder UI
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
    { label: "Total Orders",      value: stats.totalOrders,                              sub: "all time" },
    { label: "Revenue",           value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, sub: "excl. cancelled" },
    { label: "Pending Orders",    value: stats.pendingOrders,                            sub: "need attention" },
    { label: "Unread Messages",   value: stats.unreadMessages,                           sub: "contact form" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div>
        <h1 className="font-label text-xl text-white/90 font-light tracking-wide">Dashboard</h1>
        <p className="font-body text-xs text-white/30 mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[14px] p-5 border"
            style={{ backgroundColor: "#1c1917", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <p className="font-label text-[10px] text-white/35 uppercase tracking-wider">{card.label}</p>
            <p className="font-label text-2xl text-white/90 font-medium mt-2">{card.value}</p>
            <p className="font-body text-[10px] text-white/25 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-label text-sm text-white/60 uppercase tracking-wider">Recent Orders</h2>
          <Link href="/admin/orders" className="font-label text-[10px] text-berry hover:text-white/50 transition-colors">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div
            className="rounded-[14px] p-8 text-center border"
            style={{ backgroundColor: "#1c1917", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <p className="font-body text-sm text-white/30">No orders yet.</p>
          </div>
        ) : (
          <div
            className="rounded-[14px] border overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#1c1917" }}>
                  {["Order ID", "Customer", "Total", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-label text-[10px] text-white/30 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => {
                  const badge = STATUS_BADGE[order.status] ?? "text-white/40 bg-white/5";
                  const addr = order.shipping_address as { name?: string } | null;
                  return (
                    <tr
                      key={order.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? "#161412" : "#1a1815",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-label text-[11px] text-berry hover:text-white transition-colors">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-white/60">
                        {addr?.name ?? order.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-label text-xs text-white/80">
                        ₹{Number(order.total).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-label text-[10px] capitalize ${badge}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-white/35">
                        {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
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
