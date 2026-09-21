import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminOrder } from "@/actions/admin";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="p-8 text-ink/50 font-body text-sm">
        Supabase not configured. Add environment variables to view orders.
      </div>
    );
  }

  const order = await getAdminOrder(id);
  if (!order) notFound();

  const addr = order.shipping_address as {
    name?: string; email?: string; phone?: string;
    line1?: string; line2?: string; city?: string; state?: string; pincode?: string;
  } | null;

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-4xl">
      {/* Back navigation */}
      <Link href="/admin/orders" className="inline-flex items-center gap-1 font-label text-[10.5px] text-ink/50 hover:text-berry transition-colors uppercase tracking-wider font-medium">
        ← Back to All Orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand">
        <div>
          <h1 className="font-label text-2xl text-ink font-semibold tracking-tight">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="font-body text-xs text-ink/50 mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Customer details */}
        <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft space-y-2">
          <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider mb-3 font-semibold">Customer</p>
          <p className="font-body text-sm text-ink font-medium">{addr?.name ?? "Guest Customer"}</p>
          {order.email && <p className="font-body text-xs text-ink/60">✉️ {order.email}</p>}
          {order.phone && <p className="font-body text-xs text-ink/60">📱 {order.phone}</p>}
        </div>

        {/* Shipping address */}
        <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft space-y-1">
          <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider mb-3 font-semibold">Shipping Address</p>
          {addr?.line1 && <p className="font-body text-xs text-ink/75">{addr.line1}</p>}
          {addr?.line2 && <p className="font-body text-xs text-ink/75">{addr.line2}</p>}
          {(addr?.city || addr?.state) && (
            <p className="font-body text-xs text-ink/60 mt-1 font-medium">
              {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Order items */}
      <div className="rounded-[18px] bg-paper border border-brand overflow-hidden shadow-soft">
        <div className="px-6 py-4 bg-surface/70 border-b border-brand">
          <p className="font-label text-[10.5px] text-ink/50 uppercase tracking-wider font-semibold">Items in Order</p>
        </div>
        <div className="divide-y divide-brand/60">
          {(items as Array<{ name?: string; qty?: number; price?: number; image?: string }>).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface/30 transition-colors"
            >
              <div>
                <p className="font-body text-sm text-ink font-medium">{item.name ?? "Handcrafted Object"}</p>
                {item.qty && item.qty > 1 && (
                  <p className="font-body text-xs text-ink/45 mt-0.5">Quantity: {item.qty}</p>
                )}
              </div>
              <p className="font-label text-xs text-ink font-semibold">
                ₹{((item.price ?? 0) * (item.qty ?? 1)).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-surface/40 p-6 space-y-2 border-t border-brand">
          <div className="flex justify-between text-xs text-ink/60">
            <span className="font-body">Subtotal</span>
            <span className="font-label font-medium">₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
          </div>
          {Number(order.shipping_fee) > 0 && (
            <div className="flex justify-between text-xs text-ink/60">
              <span className="font-body">Shipping</span>
              <span className="font-label font-medium">₹{Number(order.shipping_fee).toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-ink pt-2 border-t border-brand font-semibold">
            <span>Total Paid</span>
            <span className="font-label">₹{Number(order.total).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Razorpay info */}
      {order.razorpay_order_id && (
        <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft">
          <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider mb-2 font-semibold">Payment Details</p>
          <p className="font-body text-xs text-ink/60">Razorpay Order: <span className="font-mono text-ink font-medium">{order.razorpay_order_id}</span></p>
          {order.razorpay_payment_id && (
            <p className="font-body text-xs text-ink/60 mt-1">Payment ID: <span className="font-mono text-ink font-medium">{order.razorpay_payment_id}</span></p>
          )}
        </div>
      )}

      {/* Status update form */}
      <OrderStatusForm
        orderId={order.id}
        currentStatus={order.status}
        currentTracking={order.tracking_number ?? ""}
      />
    </div>
  );
}
