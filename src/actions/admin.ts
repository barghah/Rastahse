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
 * Wrapped in React cache() so multiple calls in the same request share the same check.
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
  const { admin } = await requireAdmin();

  const [orders, messages, profiles] = await Promise.all([
    admin.from("orders").select("id, status, total"),
    admin.from("contact_messages").select("id, replied"),
    admin.from("profiles").select("id", { count: "exact", head: true }),
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
    totalCustomers: profiles.count ?? 0,
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

// ─── Product Overrides (Hide / Delete / Stock / Price) ──────────────────────────
export async function getProductOverrides(): Promise<Record<string, ProductOverride>> {
  const { admin } = await requireAdmin();
  const { data } = await admin.from("product_overrides").select("*");
  if (!data) return {};
  return Object.fromEntries(
    data.map((row) => [
      row.product_id,
      {
        price_override: row.price_override ?? undefined,
        description_override: row.description_override ?? undefined,
        in_stock: row.in_stock ?? true,
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
  const { admin } = await requireAdmin();

  // Fetch profiles and orders concurrently
  const [profilesRes, ordersRes] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin
      .from("orders")
      .select("id, user_id, email, phone, total, created_at, status, shipping_address"),
  ]);

  const profiles = profilesRes.data ?? [];
  const orders = ordersRes.data ?? [];

  // Try fetching Supabase Auth users list if service role allows
  let authUsers: Array<{
    id: string;
    email?: string;
    phone?: string;
    created_at: string;
    last_sign_in_at?: string | null;
    user_metadata?: Record<string, any>;
  }> = [];

  try {
    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authData?.users) {
      authUsers = authData.users;
    }
  } catch {
    // Graceful fallback to profiles table
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

