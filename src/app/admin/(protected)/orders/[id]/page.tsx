import { notFound } from "next/navigation";
import { getAdminOrderDetail } from "@/actions/orders-admin";
import { OrderDetailManage } from "@/components/admin/OrderDetailManage";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="p-8 text-ink/50 font-body text-sm">
        Supabase not configured. Add environment variables to view orders.
      </div>
    );
  }

  const data = await getAdminOrderDetail(id);
  if (!data || !data.order) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <OrderDetailManage data={data} />
    </div>
  );
}
