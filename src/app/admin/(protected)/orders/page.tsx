import { getAdminOrdersList } from "@/actions/orders-admin";
import { OrdersManager } from "@/components/admin/OrdersManager";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    payment?: string;
    delivery?: string;
    needs_approval?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const query = await searchParams;

  const result = await getAdminOrdersList({
    page: query.page ? parseInt(query.page, 10) : 1,
    search: query.search,
    paymentFilter: query.payment,
    deliveryFilter: query.delivery,
    quickApprovalOnly: query.needs_approval === "true",
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-label text-xl sm:text-2xl text-ink font-semibold tracking-tight">
            Orders Management
          </h1>
          <p className="font-body text-xs text-ink/50 mt-1">
            {result.totalCount} active order{result.totalCount !== 1 ? "s" : ""} · Search, filter by payment or delivery stage, and book via Shiprocket
          </p>
        </div>
      </div>

      <OrdersManager initialData={result} searchParams={query} />
    </div>
  );
}
