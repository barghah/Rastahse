import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

/**
 * AccountPage — Customer account dashboard.
 * Server Component — checks session, fetches orders from Supabase.
 * Redirects to /auth/login if not logged in (also handled by middleware).
 */
export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("id", user.id)
    .single();

  // Fetch orders tied to this user (by user_id or phone via RLS policy)
  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, status, total, items, tracking_number, shipping_address")
    .order("created_at", { ascending: false });

  const displayPhone = profile?.phone ?? user.phone ?? "—";

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending:    { label: "Pending",    color: "text-amber-700 bg-amber-50 border-amber-200" },
    paid:       { label: "Paid",       color: "text-blue-700 bg-blue-50 border-blue-200" },
    processing: { label: "Processing", color: "text-purple-700 bg-purple-50 border-purple-200" },
    shipped:    { label: "Shipped",    color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    delivered:  { label: "Delivered",  color: "text-green-700 bg-green-50 border-green-200" },
    cancelled:  { label: "Cancelled",  color: "text-red-700 bg-red-50 border-red-200" },
    refunded:   { label: "Refunded",   color: "text-gray-700 bg-gray-50 border-gray-200" },
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Header */}
      <section className="bg-surface/60 border-b border-brand py-10 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-paper border border-brand flex items-center justify-center shadow-soft shrink-0">
            <Image
              src="/brand/logos/stone-only.png"
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 object-contain opacity-60"
              aria-hidden="true"
            />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="font-hand text-3xl sm:text-4xl text-ink">
              {profile?.display_name ? `Hello, ${profile.display_name}` : "My Rastah Account"}
            </h1>
            <p className="font-body text-xs text-ink/50 mt-1">
              {displayPhone !== "—" ? `📱 ${displayPhone}` : "Phone not linked"}
            </p>
          </div>
          <SignOutButton />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Orders Section */}
        <section aria-labelledby="orders-heading">
          <div className="flex items-center justify-between mb-5 pb-2 border-b border-brand">
            <div>
              <h2 id="orders-heading" className="font-hand text-2xl text-ink">My Orders</h2>
              <p className="font-label text-[10px] text-ink/40 uppercase tracking-wider mt-0.5">
                {orders?.length ?? 0} {orders?.length === 1 ? "order" : "orders"} placed
              </p>
            </div>
          </div>

          {!orders || orders.length === 0 ? (
            <div className="py-14 text-center bg-surface/50 rounded-[20px] border border-brand">
              <p className="font-body text-sm text-ink/60">No orders yet.</p>
              <p className="font-body text-xs text-ink/40 mt-1">
                Start shopping and your orders will appear here.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-block px-6 py-2.5 rounded-[10px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const badge = statusLabel[order.status] ?? { label: order.status, color: "text-ink/50 bg-surface border-brand" };
                const items = Array.isArray(order.items) ? order.items : [];
                const address = order.shipping_address as { name?: string; city?: string } | null;

                return (
                  <div
                    key={order.id}
                    className="bg-paper rounded-[16px] border border-brand p-5 space-y-3 shadow-card"
                  >
                    {/* Order header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-label text-[10px] text-ink/40 uppercase tracking-wider">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="font-body text-xs text-ink/50 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-label text-[10px] border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="font-label text-sm text-ink font-medium">
                          ₹{Number(order.total).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    {items.length > 0 && (
                      <div className="space-y-1.5">
                        {(items as Array<{ name?: string; qty?: number; price?: number }>).slice(0, 3).map((item, idx) => (
                          <p key={idx} className="font-body text-xs text-ink/65">
                            {item.name}
                            {item.qty && item.qty > 1 ? ` × ${item.qty}` : ""}
                          </p>
                        ))}
                        {items.length > 3 && (
                          <p className="font-body text-xs text-ink/40">
                            +{items.length - 3} more item{items.length - 3 !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Delivery address */}
                    {address?.name && (
                      <p className="font-body text-xs text-ink/40">
                        📍 Delivering to {address.name}{address.city ? `, ${address.city}` : ""}
                      </p>
                    )}

                    {/* Tracking */}
                    {order.tracking_number && (
                      <div className="pt-2 border-t border-brand">
                        <p className="font-label text-[10px] text-ink/40 uppercase tracking-wider">
                          Tracking Number
                        </p>
                        <p className="font-body text-sm text-berry font-medium mt-0.5">
                          {order.tracking_number}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
