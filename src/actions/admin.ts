"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/supabase";

/**
 * Verify the current user is an admin.
 * Call at the top of every admin server action.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/admin/login");
  return { user, admin };
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const { admin } = await requireAdmin();

  const [orders, messages] = await Promise.all([
    admin.from("orders").select("id, status, total"),
    admin.from("contact_messages").select("id, replied"),
  ]);

  const allOrders = orders.data ?? [];
  const totalRevenue = allOrders
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((sum, o) => sum + Number(o.total), 0);

  return {
    totalOrders: allOrders.length,
    totalRevenue,
    pendingOrders: allOrders.filter((o) => o.status === "pending").length,
    unreadMessages: (messages.data ?? []).filter((m) => !m.replied).length,
  };
}

// ─── Orders ─────────────────────────────────────────────────────────────────────
export async function getAdminOrders(statusFilter?: string) {
  const { admin } = await requireAdmin();

  let query = admin
    .from("orders")
    .select("id, created_at, email, phone, status, total, items, shipping_address, tracking_number, razorpay_order_id")
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    // @ts-expect-error — dynamic status filter
    query = query.eq("status", statusFilter);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getAdminOrder(id: string) {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function updateOrderStatus(
  id: string,
  status: string,
  trackingNumber?: string
) {
  const { admin } = await requireAdmin();
  type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
  const update: OrderUpdate = { status: status as OrderUpdate["status"] };
  if (trackingNumber !== undefined) update.tracking_number = trackingNumber;

  const { error } = await admin.from("orders").update(update).eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Product Overrides ────────────────────────────────────────────────────────
export async function getProductOverrides(): Promise<
  Record<string, { price_override?: number; description_override?: string; in_stock: boolean }>
> {
  const { admin } = await requireAdmin();
  const { data } = await admin.from("product_overrides").select("*");
  if (!data) return {};
  return Object.fromEntries(
    data.map((row) => [
      row.product_id,
      {
        price_override: row.price_override ?? undefined,
        description_override: row.description_override ?? undefined,
        in_stock: row.in_stock,
      },
    ])
  );
}

export async function upsertProductOverride(
  productId: string,
  overrides: { price_override?: number; description_override?: string; in_stock?: boolean }
) {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("product_overrides").upsert(
    {
      product_id: productId,
      ...overrides,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" }
  );
  if (error) throw new Error(error.message);
}

// ─── Contact Messages ─────────────────────────────────────────────────────────
export async function getContactMessages() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function markMessageReplied(id: string) {
  const { admin } = await requireAdmin();
  await admin.from("contact_messages").update({ replied: true }).eq("id", id);
}
