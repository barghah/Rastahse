"use server";

import { cache } from "react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/supabase";
import { recordOrderCompletion, recordInventoryPurchase } from "@/lib/accounting";

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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  try {
    const admin = await createAdminClient();
    type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
    const update: OrderUpdate = { status: status as OrderUpdate["status"] };
    if (trackingNumber !== undefined) update.tracking_number = trackingNumber;

    const { error } = await admin.from("orders").update(update).eq("id", id);
    if (error) return { success: false, error: error.message };

    // Order completed → credit sales revenue + reduce stock (idempotent)
    if (status === "delivered") {
      const res = await recordOrderCompletion(admin, id);
      if (res.error) {
        return { success: true, error: `Order saved, but ledger sync failed: ${res.error}` };
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update order status" };
  }
}

// ─── Product Overrides (Hide / Delete / Stock / Price) ──────────────────────────
export async function getProductOverrides(): Promise<Record<string, ProductOverride>> {
  await requireAdmin();
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
  await requireAdmin();
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
        const coreFields = { ...overrides };
        delete coreFields.is_hidden;
        delete coreFields.is_deleted;
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

    revalidatePath("/admin/products");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save product override.",
    };
  }
}

export async function toggleProductVisibility(productId: string, isHidden: boolean) {
  await requireAdmin();
  return upsertProductOverride(productId, { is_hidden: isHidden });
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  return upsertProductOverride(productId, { is_deleted: true, is_hidden: true });
}

export async function restoreProduct(productId: string) {
  await requireAdmin();
  return upsertProductOverride(productId, { is_deleted: false, is_hidden: false });
}

export async function toggleProductStock(productId: string, inStock: boolean) {
  await requireAdmin();
  return upsertProductOverride(productId, { in_stock: inStock });
}

// ─── Customers / User Details ──────────────────────────────────────────────────
export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  await requireAdmin();
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
    user_metadata?: Record<string, string | undefined>;
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
  await requireAdmin();
  const admin = await createAdminClient();
  const { data } = await admin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function markMessageReplied(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("contact_messages").update({ replied: true }).eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to mark replied" };
  }
}

// ─── Product Creation (Admin-managed Supabase products) ────────────────────────

export interface CreateProductInput {
  sku: string;
  title: string;
  category: string;
  price: number; // in paise
  stock: number;
  description: string;
  tags: string[];
  imageUrls: string[];
  /** Cost per unit in rupees. When stock > 0 this debits the accounting ledger. */
  unitCost?: number;
}

export async function createProduct(
  input: CreateProductInput
): Promise<{ success: boolean; error?: string; id?: string }> {
  await requireAdmin();
  try {
    const admin = await createAdminClient();

    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80);

    const images = input.imageUrls.map((url, i) => ({
      url,
      alt: `${input.title} – image ${i + 1}`,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from("db_products") as any).insert({
      sku: input.sku,
      title: input.title,
      slug: `${slug}-${Date.now()}`,
      category: input.category,
      price: input.price,
      stock: input.stock,
      description: input.description || null,
      tags: input.tags,
      images: images,
      is_visible: true,
      created_at: new Date().toISOString(),
    }).select("id").single();

    if (error) return { success: false, error: error.message };

    const newId: string | undefined = data?.id;
    if (newId && input.stock > 0 && (input.unitCost ?? 0) > 0) {
      const led = await recordInventoryPurchase(admin, {
        productId: newId,
        productLabel: `${input.sku} ${input.title}`,
        qty: input.stock,
        unitCost: input.unitCost!,
      });
      if (!led.success) {
        return { success: true, id: newId, error: `Product saved, but ledger entry failed: ${led.error}` };
      }
    }
    revalidatePath("/admin/products");
    revalidatePath("/admin/accounting");
    return { success: true, id: newId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create product.",
    };
  }
}

export async function uploadProductImage(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  await requireAdmin();
  try {
    const admin = await createAdminClient();
    const file = formData.get("file") as File | null;
    const sku = (formData.get("sku") as string) || "product";

    if (!file) return { success: false, error: "No file provided." };

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const safeSku = sku.replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase();
    const path = `${safeSku}/${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await admin.storage
      .from("product-images")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: urlData } = admin.storage
      .from("product-images")
      .getPublicUrl(path);

    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}

export async function updateProductImages(
  productId: string,
  images: Array<{ url: string; alt?: string }>,
  productTitle: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const admin = await createAdminClient();
    const payload = images.map((img, i) => ({
      url: img.url,
      alt: img.alt || `${productTitle} – image ${i + 1}`,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from("db_products") as any)
      .update({ images: payload })
      .eq("id", productId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update images.",
    };
  }
}

export interface DbProduct {
  id: string;
  sku: string;
  title: string;
  slug: string;
  category: string;
  price: number;
  stock: number;
  description: string | null;
  tags: string[];
  images: Array<{ url: string; alt: string }>;
  is_visible: boolean;
  created_at: string;
}

export async function getDbProducts(): Promise<DbProduct[]> {
  await requireAdmin();
  try {
    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from("db_products") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as DbProduct[];
  } catch {
    return [];
  }
}

