"use server";

import { cache } from "react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/supabase";

export interface ProductOverride {
  price_override?: number;
  description_override?: string;
  in_stock: boolean;
  is_hidden: boolean;
  is_deleted: boolean;
}

export interface AdminCustomer {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  isAdmin: boolean;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  city?: string | null;
}

/**
 * Verify the current user is an admin.
 * Run in AdminLayout to protect all admin routes.
 * Wrapped in React cache() so multiple invocations within the same request share the same check.
 */
export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/admin/login");
  return { user, admin };
});

// ─── Stats ─────────────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const admin = await createAdminClient();

  const [orders, messages, profiles] = await Promise.all([
    admin.from("orders").select("id, status, total"),
    admin.from("contact_messages").select("id, replied"),
    admin.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const allOrders = orders.data ?? [];
  const totalRevenue = allOrders
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  return {
    totalOrders: allOrders.length,
    totalRevenue,
    pendingOrders: allOrders.filter((o) => o.status === "pending").length,
    unreadMessages: (messages.data ?? []).filter((m) => !m.replied).length,
    totalCustomers: profiles.count ?? 0,
  };
}

// ─── Orders ─────────────────────────────────────────────────────────────────────
export async function getAdminOrders(statusFilter?: string) {
  const admin = await createAdminClient();

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
  const admin = await createAdminClient();
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await createAdminClient();
    type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
    const update: OrderUpdate = { status: status as OrderUpdate["status"] };
    if (trackingNumber !== undefined) update.tracking_number = trackingNumber;

    const { error } = await admin.from("orders").update(update).eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update order status" };
  }
}

// ─── Product Overrides (Hide / Delete / Stock / Price) ──────────────────────────
export async function getProductOverrides(): Promise<Record<string, ProductOverride>> {
  const admin = await createAdminClient();
  const { data, error } = await admin.from("product_overrides").select("*");
  if (error || !data) return {};

  return Object.fromEntries(
    data.map((row) => [
      row.product_id,
      {
        price_override: row.price_override ?? undefined,
        description_override: row.description_override ?? undefined,
        in_stock: row.in_stock ?? true,
        // Fallback gracefully if columns haven't been added yet
        is_hidden: Boolean(row.is_hidden),
        is_deleted: Boolean(row.is_deleted),
      },
    ])
  );
}

export async function upsertProductOverride(
  productId: string,
  overrides: {
    price_override?: number | null;
    description_override?: string | null;
    in_stock?: boolean;
    is_hidden?: boolean;
    is_deleted?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await createAdminClient();

    // 1. Attempt full upsert
    const { error } = await admin.from("product_overrides").upsert(
      {
        product_id: productId,
        ...overrides,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" }
    );

    if (error) {
      // If error is caused by missing is_hidden or is_deleted columns in user's Supabase DB
      const msg = error.message?.toLowerCase() || "";
      if (
        msg.includes("is_hidden") ||
        msg.includes("is_deleted") ||
        error.code === "PGRST204" ||
        error.code === "42703"
      ) {
        // Fallback: save price, description, in_stock only
        const { is_hidden, is_deleted, ...coreFields } = overrides;
        const { error: fallbackErr } = await admin.from("product_overrides").upsert(
          {
            product_id: productId,
            ...coreFields,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "product_id" }
        );

        if (fallbackErr) {
          return { success: false, error: fallbackErr.message };
        }

        return {
          success: true,
          error:
            "Price & stock saved! Note: Run the SQL in Supabase SQL editor (from schema_v2.sql) to add the 'is_hidden' column.",
        };
      }

      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save product override.",
    };
  }
}

export async function toggleProductVisibility(productId: string, isHidden: boolean) {
  return upsertProductOverride(productId, { is_hidden: isHidden });
}

export async function deleteProduct(productId: string) {
  return upsertProductOverride(productId, { is_deleted: true, is_hidden: true });
}

export async function restoreProduct(productId: string) {
  return upsertProductOverride(productId, { is_deleted: false, is_hidden: false });
}

export async function toggleProductStock(productId: string, inStock: boolean) {
  return upsertProductOverride(productId, { in_stock: inStock });
}

// ─── Customers / User Details ──────────────────────────────────────────────────
export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  const admin = await createAdminClient();

  // Fetch profiles and orders concurrently from Postgres (blazing fast ~50ms)
  const [profilesRes, ordersRes] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin
      .from("orders")
      .select("id, user_id, email, phone, total, created_at, status, shipping_address"),
  ]);

  const profiles = profilesRes.data ?? [];
  const orders = ordersRes.data ?? [];

  // Optionally attempt auth.admin.listUsers with a strict 400ms timeout
  // so the page NEVER lags or freezes waiting for the external auth daemon
  let authUsers: Array<{
    id: string;
    email?: string;
    phone?: string;
    created_at: string;
    last_sign_in_at?: string | null;
    user_metadata?: Record<string, any>;
  }> = [];

  try {
    const listPromise = admin.auth.admin.listUsers({ page: 1, perPage: 500 });
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 400));
    const result = await Promise.race([listPromise, timeoutPromise]);
    if (result && "data" in result && result.data?.users) {
      authUsers = result.data.users;
    }
  } catch {
    // Proceed with profiles & orders
  }

  // Create lookup maps
  const authMap = new Map(authUsers.map((u) => [u.id, u]));
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  // Aggregate orders by user_id and by email/phone
  const userOrders = new Map<string, typeof orders>();
  const emailOrders = new Map<string, typeof orders>();

  for (const o of orders) {
    if (o.user_id) {
      const list = userOrders.get(o.user_id) ?? [];
      list.push(o);
      userOrders.set(o.user_id, list);
    }
    if (o.email) {
      const em = o.email.toLowerCase().trim();
      const list = emailOrders.get(em) ?? [];
      list.push(o);
      emailOrders.set(em, list);
    }
  }

  // Build unified customer list
  const customers: AdminCustomer[] = [];
  const allUserIds = new Set([...authMap.keys(), ...profileMap.keys()]);

  for (const uid of allUserIds) {
    const authUser = authMap.get(uid);
    const profile = profileMap.get(uid);

    const email = authUser?.email ?? null;
    const phone = authUser?.phone ?? profile?.phone ?? null;
    const displayName =
      profile?.display_name ??
      authUser?.user_metadata?.display_name ??
      authUser?.user_metadata?.full_name ??
      null;

    // Find matching orders
    const matchedOrders =
      userOrders.get(uid) ?? (email ? emailOrders.get(email.toLowerCase().trim()) ?? [] : []);

    const validOrders = matchedOrders.filter(
      (o) => o.status !== "cancelled" && o.status !== "refunded"
    );
    const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    let lastOrderDate: string | null = null;
    let city: string | null = null;
    if (matchedOrders.length > 0) {
      const sorted = [...matchedOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      lastOrderDate = sorted[0].created_at;
      const addr = sorted[0].shipping_address as { city?: string } | null;
      city = addr?.city ?? null;
    }

    customers.push({
      id: uid,
      email,
      phone,
      displayName,
      createdAt: authUser?.created_at ?? profile?.created_at ?? new Date().toISOString(),
      lastSignInAt: authUser?.last_sign_in_at ?? null,
      isAdmin: Boolean(profile?.is_admin),
      orderCount: matchedOrders.length,
      totalSpent,
      lastOrderDate,
      city,
    });
  }

  // Also include any guest customers who made orders
  const guestEmails = new Set<string>();
  for (const o of orders) {
    if (!o.user_id && o.email) {
      const em = o.email.toLowerCase().trim();
      if (!guestEmails.has(em) && !customers.some((c) => c.email?.toLowerCase().trim() === em)) {
        guestEmails.add(em);
        const matched = emailOrders.get(em) ?? [o];
        const valid = matched.filter((x) => x.status !== "cancelled" && x.status !== "refunded");
        const totalSpent = valid.reduce((sum, x) => sum + Number(x.total || 0), 0);
        const addr = matched[0].shipping_address as { name?: string; city?: string } | null;

        customers.push({
          id: `guest-${matched[0].id}`,
          email: o.email,
          phone: o.phone ?? null,
          displayName: addr?.name ?? "Guest Customer",
          createdAt: matched[0].created_at,
          lastSignInAt: null,
          isAdmin: false,
          orderCount: matched.length,
          totalSpent,
          lastOrderDate: matched[0].created_at,
          city: addr?.city ?? null,
        });
      }
    }
  }

  // Sort: most orders first, then most recently created
  return customers.sort((a, b) => {
    if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ─── Contact Messages ─────────────────────────────────────────────────────────
export async function getContactMessages() {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function markMessageReplied(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("contact_messages").update({ replied: true }).eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to mark replied" };
  }
}
