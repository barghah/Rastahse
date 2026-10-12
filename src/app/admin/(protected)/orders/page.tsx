import { getAdminOrders } from "@/actions/admin";
import { OrdersManager } from "@/components/admin/OrdersManager";

export default async function AdminOrdersPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Fetch ALL orders — client-side OrdersManager handles filtering
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = hasSupabase ? ((await getAdminOrders()) as any[]) : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-label text-xl sm:text-2xl text-ink font-semibold tracking-tight">
            Orders Management
          </h1>
          <p className="font-body text-xs text-ink/50 mt-1">
            {orders.length} total order{orders.length !== 1 ? "s" : ""} · Search, filter by payment or delivery stage
          </p>
        </div>
      </div>

      <OrdersManager orders={orders} />
    </div>
  );
}



