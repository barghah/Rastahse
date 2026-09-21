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
      <div className="p-8 text-white/40 font-body text-sm">
        Supabase not configured. Add env vars to view orders.
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
    <div className="p-6 sm:p-8 space-y-8 max-w-3xl">
      {/* Back */}
      <Link href="/admin/orders" className="font-label text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-wider">
        ← All Orders
      </Link>

      <div>
        <h1 className="font-label text-xl text-white/90 font-light">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <p className="font-body text-xs text-white/30 mt-1">
          Placed {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Customer details */}
        <div
          className="rounded-[14px] p-5 border space-y-2"
          style={{ backgroundColor: "#1c1917", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <p className="font-label text-[10px] text-white/30 uppercase tracking-wider mb-3">Customer</p>
          <p className="font-body text-sm text-white/80">{addr?.name ?? "—"}</p>
          {order.email && <p className="font-body text-xs text-white/40">{order.email}</p>}
          {order.phone && <p className="font-body text-xs text-white/40">📱 {order.phone}</p>}
        </div>

        {/* Shipping address */}
        <div
          className="rounded-[14px] p-5 border space-y-1"
          style={{ backgroundColor: "#1c1917", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <p className="font-label text-[10px] text-white/30 uppercase tracking-wider mb-3">Shipping Address</p>
          {addr?.line1 && <p className="font-body text-xs text-white/60">{addr.line1}</p>}
          {addr?.line2 && <p className="font-body text-xs text-white/60">{addr.line2}</p>}
          {(addr?.city || addr?.state) && (
            <p className="font-body text-xs text-white/60">
              {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Order items */}
      <div
        className="rounded-[14px] border overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="px-5 py-3" style={{ backgroundColor: "#1c1917" }}>
          <p className="font-label text-[10px] text-white/30 uppercase tracking-wider">Items</p>
        </div>
        {(items as Array<{ name?: string; qty?: number; price?: number; image?: string }>).map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", backgroundColor: idx % 2 === 0 ? "#161412" : "#1a1815" }}
          >
            <div>
              <p className="font-body text-sm text-white/75">{item.name ?? "—"}</p>
              {item.qty && item.qty > 1 && (
                <p className="font-body text-xs text-white/35">Qty: {item.qty}</p>
              )}
            </div>
            <p className="font-label text-xs text-white/60">
              ₹{((item.price ?? 0) * (item.qty ?? 1)).toLocaleString("en-IN")}
            </p>
          </div>
        ))}
        <div
          className="flex justify-between px-5 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#1c1917" }}
        >
          <p className="font-label text-xs text-white/40">Subtotal</p>
          <p className="font-label text-xs text-white/60">₹{Number(order.subtotal).toLocaleString("en-IN")}</p>
        </div>
        {Number(order.shipping_fee) > 0 && (
          <div
            className="flex justify-between px-5 py-2"
            style={{ backgroundColor: "#1c1917" }}
          >
            <p className="font-label text-xs text-white/40">Shipping</p>
            <p className="font-label text-xs text-white/60">₹{Number(order.shipping_fee).toLocaleString("en-IN")}</p>
          </div>
        )}
        <div
          className="flex justify-between px-5 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#1a1917" }}
        >
          <p className="font-label text-sm text-white/80 font-medium">Total</p>
          <p className="font-label text-sm text-white/90 font-medium">₹{Number(order.total).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Razorpay info */}
      {order.razorpay_order_id && (
        <div
          className="rounded-[14px] p-5 border"
          style={{ backgroundColor: "#1c1917", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <p className="font-label text-[10px] text-white/30 uppercase tracking-wider mb-2">Payment</p>
          <p className="font-body text-xs text-white/50">Razorpay Order: <span className="text-white/70">{order.razorpay_order_id}</span></p>
          {order.razorpay_payment_id && (
            <p className="font-body text-xs text-white/50 mt-1">Payment ID: <span className="text-white/70">{order.razorpay_payment_id}</span></p>
          )}
        </div>
      )}

      {/* Status update form — client component */}
      <OrderStatusForm
        orderId={order.id}
        currentStatus={order.status}
        currentTracking={order.tracking_number ?? ""}
      />
    </div>
  );
}
