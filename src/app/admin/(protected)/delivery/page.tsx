import { getAdminOrders } from "@/actions/admin";
import { getDeliverySettings } from "@/actions/delivery";
import { getNextDispatchDates } from "@/lib/dispatch";
import { DeliveryScheduleManager } from "@/components/admin/DeliveryScheduleManager";

export const metadata = { title: "Delivery Schedule — Rastah Admin" };

export default async function AdminDeliveryPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, settings] = await Promise.all([
    hasSupabase ? (getAdminOrders() as Promise<any[]>) : Promise.resolve([]),
    getDeliverySettings(),
  ]);

  const nextDates = getNextDispatchDates(settings.activeDays, 4).map((d) =>
    d.toISOString()
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="font-label text-xl sm:text-2xl text-ink font-semibold tracking-tight">
          Delivery Schedule
        </h1>
        <p className="font-body text-xs text-ink/50 mt-1">
          Configure dispatch days, view upcoming batches, and print packing manifests.
        </p>
      </div>

      <DeliveryScheduleManager
        orders={orders}
        initialActiveDays={settings.activeDays}
        nextDates={nextDates}
      />
    </div>
  );
}
