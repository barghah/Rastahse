"use server";

import { cache } from "react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";

export async function purgeCatalogCache() {
  try {
    revalidateTag("products", "default");
    revalidateTag("categories", "default");
  } catch {
    // Ignore outside request scope
  }
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  revalidatePath("/");
}
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

export async function adminSignInAction(input: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const email = input.email?.trim();
    const password = input.password;

    if (!email || !password) {
      return { success: false, error: "Please enter both email and password." };
    }

    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data?.user) {
      return { success: false, error: authError?.message || "Invalid email or password." };
    }

    // Verify admin role in profiles table using service role client
    const admin = await createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Access denied. This account does not have admin privileges.",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Authentication failed.",
    };
  }
}

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

    // Stock state synchronization
    if (status === "cancelled") {
      try {
        const { data: ord } = await admin.from("orders").select("items").eq("id", id).single();
        if (ord?.items && Array.isArray(ord.items)) {
          const isUUID = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || "");
          const toRelease = (ord.items as any[])
            .map((it) => ({
              variant_id: isUUID(it.variantId || it.variant_id) ? (it.variantId || it.variant_id) : null,
              qty: it.quantity || it.qty || 1,
            }))
            .filter((x): x is { variant_id: string; qty: number } => Boolean(x.variant_id));

          if (toRelease.length > 0) {
            await admin.rpc("release_stock", {
              p_order_id: id,
              p_items_json: toRelease,
              p_actor: "admin_cancellation",
            });
          }
        }
      } catch (err) {
        console.warn("[updateOrderStatus] release_stock warning:", err);
      }
    } else if (status === "delivered") {
      try {
        const { data: ord } = await admin.from("orders").select("items").eq("id", id).single();
        if (ord?.items && Array.isArray(ord.items)) {
          const isUUID = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || "");
          const toComplete = (ord.items as any[])
            .map((it) => ({
              variant_id: isUUID(it.variantId || it.variant_id) ? (it.variantId || it.variant_id) : null,
              qty: it.quantity || it.qty || 1,
            }))
            .filter((x): x is { variant_id: string; qty: number } => Boolean(x.variant_id));

          if (toComplete.length > 0) {
            await admin.rpc("complete_stock", {
              p_order_id: id,
              p_items_json: toComplete,
              p_actor: "admin_delivered",
            });
          }
        }
      } catch (err) {
        console.warn("[updateOrderStatus] complete_stock warning:", err);
      }

      // Order completed → credit sales revenue + reduce stock (idempotent)
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

    // 1. Attempt full upsert into overrides
    const { error } = await admin.from("product_overrides").upsert(
      {
        product_id: productId,
        ...overrides,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" }
    );

    // 2. Synchronize directly into products table
    const prodUpdates: any = {};
    if (overrides.price_override !== undefined && overrides.price_override !== null) {
      prodUpdates.base_price = Math.round(overrides.price_override * 100);
    }
    if (overrides.description_override !== undefined && overrides.description_override !== null) {
      prodUpdates.description = overrides.description_override;
      prodUpdates.story = overrides.description_override;
    }
    if (overrides.is_hidden !== undefined) {
      prodUpdates.is_hidden = overrides.is_hidden;
    }
    if (overrides.is_deleted !== undefined) {
      prodUpdates.is_deleted = overrides.is_deleted;
    }
    if (Object.keys(prodUpdates).length > 0) {
      await admin.from("products").update(prodUpdates).eq("id", productId);
    }

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

    purgeCatalogCache();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save product override.",
    };
  }
}

export async function toggleProductVisibility(productId: string, isHidden: boolean) {
  const { admin } = await requireAdmin();
  try {
    const { error } = await admin.from("products").update({ is_hidden: isHidden }).eq("id", productId);
    if (error) {
      return upsertProductOverride(productId, { is_hidden: isHidden });
    }
    purgeCatalogCache();
    return { success: true };
  } catch {
    return upsertProductOverride(productId, { is_hidden: isHidden });
  }
}

export async function deleteProduct(productId: string) {
  const { admin } = await requireAdmin();
  try {
    const { error } = await admin.from("products").update({ is_deleted: true, is_hidden: true }).eq("id", productId);
    if (error) {
      return upsertProductOverride(productId, { is_deleted: true, is_hidden: true });
    }
    purgeCatalogCache();
    return { success: true };
  } catch {
    return upsertProductOverride(productId, { is_deleted: true, is_hidden: true });
  }
}

export async function restoreProduct(productId: string) {
  const { admin } = await requireAdmin();
  try {
    const { error } = await admin.from("products").update({ is_deleted: false, is_hidden: false }).eq("id", productId);
    if (error) {
      return upsertProductOverride(productId, { is_deleted: false, is_hidden: false });
    }
    purgeCatalogCache();
    return { success: true };
  } catch {
    return upsertProductOverride(productId, { is_deleted: false, is_hidden: false });
  }
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
export async function seedDemoOrdersAction(): Promise<{ success: boolean; count?: number; error?: string }> {
  const { admin } = await requireAdmin();
  try {
    const demoOrders = [
      {
        id: "46f97fc3-1122-4a55-8899-aabbccddeeff",
        email: "rohan.verma@example.com",
        phone: "+91 98765 43210",
        status: "paid" as const,
        items: [
          { id: "prod_002", name: "Koodai Bag", price: 185000, qty: 1, image: "http://localhost:8000/storage/v1/object/public/product-media/products/p2_koodai-bag.jpeg" },
          { id: "prod_003", name: "Hand-Bound Leather Journal", price: 145000, qty: 1, image: "http://localhost:8000/storage/v1/object/public/product-media/products/p3_leather-journal.jpeg" }
        ],
        subtotal: 3300,
        shipping_fee: 0,
        total: 3300,
        shipping_address: { name: "Rohan Verma", line1: "Flat 402, Shanti Niketan", line2: "100ft Road, Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038" },
        razorpay_order_id: "order_OXYZ12345678",
        razorpay_payment_id: "pay_PXYZ87654321",
        notes: "Please leave package with building security if unattended."
      },
      {
        id: "7a9b11c2-3344-4b66-9900-ccddeeff0011",
        email: "meera.nambiar@example.com",
        phone: "+91 98451 22334",
        status: "pending" as const,
        items: [
          { id: "prod_030", name: "Hand-Thrown Ceramic Dinner Plate", price: 185000, qty: 1, image: "http://localhost:8000/storage/v1/object/public/product-media/products/p30_ceramic-dinner-plate.jpeg" }
        ],
        subtotal: 1850,
        shipping_fee: 150,
        total: 2000,
        shipping_address: { name: "Meera Nambiar", line1: "House No. 12, Panampilly Nagar", city: "Kochi", state: "Kerala", pincode: "682036" },
        notes: "Cash on Delivery order — please confirm before dispatch."
      },
      {
        id: "88df4201-5566-4c77-aa11-ddeeff001122",
        email: "priya.sharma@example.com",
        phone: "+91 97112 33445",
        status: "shipped" as const,
        items: [
          { id: "prod_016", name: "Indo-Persian Embroidered Silk Bandana", price: 240000, qty: 2, image: "http://localhost:8000/storage/v1/object/public/product-media/products/p16_embroidered-bandana.jpeg" }
        ],
        subtotal: 4800,
        shipping_fee: 0,
        total: 4800,
        shipping_address: { name: "Priya Sharma", line1: "B-14, Sea Face Apartments", city: "Mumbai", state: "Maharashtra", pincode: "400050" },
        razorpay_order_id: "order_OMUM99887766",
        razorpay_payment_id: "pay_PMUM66778899",
        tracking_number: "SR-98721455IN",
        notes: "Gift wrapped for anniversary."
      },
      {
        id: "31b99a04-7788-4d88-bb22-eeff00112233",
        email: "arjun.kapoor@example.com",
        phone: "+91 99100 88776",
        status: "delivered" as const,
        items: [
          { id: "prod_023", name: "Authentic Handspun Pashmina Shawl", price: 850000, qty: 1, image: "http://localhost:8000/storage/v1/object/public/product-media/products/p23_pashmina-shawl.png" }
        ],
        subtotal: 8500,
        shipping_fee: 0,
        total: 8500,
        shipping_address: { name: "Arjun Kapoor", line1: "45, Golf Links", city: "New Delhi", state: "Delhi", pincode: "110003" },
        razorpay_order_id: "order_ODEL55443322",
        razorpay_payment_id: "pay_PDEL22334455",
        tracking_number: "SR-55441122IN",
        notes: "Delivered to recipient."
      },
      {
        id: "12c09881-9900-4e99-cc33-ff0011223344",
        email: "vikram.das@example.com",
        phone: "+91 94330 11223",
        status: "cancelled" as const,
        items: [
          { id: "prod_021", name: "Kerala Aranmula Hand Mirror", price: 210000, qty: 1, image: "http://localhost:8000/storage/v1/object/public/product-media/products/p21_hand-mirror.png" }
        ],
        subtotal: 2100,
        shipping_fee: 150,
        total: 2250,
        shipping_address: { name: "Vikram Das", line1: "18/2, Ballygunge Circular Rd", city: "Kolkata", state: "West Bengal", pincode: "700019" },
        razorpay_order_id: "order_OKOL11223344",
        razorpay_payment_id: "pay_PKOL44332211",
        notes: "Customer requested cancellation before courier dispatch."
      }
    ];

    for (const ord of demoOrders) {
      await admin.from("orders").upsert({
        ...ord,
        items: ord.items as any,
        shipping_address: ord.shipping_address as any,
      }, { onConflict: "id" });
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true, count: demoOrders.length };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to seed demo orders" };
  }
}

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
  story?: string;
  curatorNote?: string;
  origin?: string;
  artisanName?: string;
  weightGrams?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  tags: string[];
  imageUrls: string[];
  /** Cost per unit in rupees. When stock > 0 this debits the accounting ledger. */
  unitCost?: number;
}

export async function createProduct(
  input: CreateProductInput
): Promise<{ success: boolean; error?: string; id?: string }> {
  const { user, admin } = await requireAdmin();
  try {
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80);

    // Look up category_id
    const { data: catData } = await admin
      .from("categories")
      .select("id")
      .eq("slug", input.category.toLowerCase().trim())
      .maybeSingle();

    const newId = `prod_${Date.now()}`;
    const cleanSku = input.sku.trim().toUpperCase();

    // 1. Insert into products
    const { error: prodErr } = await admin.from("products").insert({
      id: newId,
      sku: cleanSku,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      name: input.title.trim(),
      description: input.description || "",
      story: input.story || input.description || "",
      curator_note: input.curatorNote || null,
      origin: input.origin || null,
      artisan_name: input.artisanName || null,
      weight_grams: input.weightGrams || null,
      length_cm: input.lengthCm || null,
      breadth_cm: input.breadthCm || null,
      height_cm: input.heightCm || null,
      category_id: catData?.id ?? null,
      base_price: input.price,
      cost_price: input.unitCost ? Math.round(input.unitCost * 100) : null,
      tags: input.tags || [],
      status: "active",
      is_curated: false,
      is_one_of_one: false,
      is_hidden: false,
      is_deleted: false,
    });

    if (prodErr) return { success: false, error: prodErr.message };

    // 2. Insert variant
    const { data: varData, error: varErr } = await admin
      .from("product_variants")
      .insert({
        product_id: newId,
        sku: `${cleanSku}-001`,
        variant_name: "Standard",
        total_stock: input.stock || 0,
        withheld_stock: 0,
        low_stock_threshold: 2,
        weight_grams: input.weightGrams || null,
      })
      .select("id")
      .single();

    if (varErr) return { success: false, error: varErr.message };

    // 3. Insert images into product_images
    if (input.imageUrls && input.imageUrls.length > 0) {
      for (let i = 0; i < input.imageUrls.length; i++) {
        await admin.from("product_images").insert({
          product_id: newId,
          url: input.imageUrls[i],
          alt_text: `${input.title} – ${i + 1}`,
          sort_order: i,
          is_primary: i === 0,
        });
      }
    }

    // 4. Initial stock movement audit
    if (input.stock > 0 && varData) {
      await admin.from("stock_movements").insert({
        variant_id: varData.id,
        delta_total: input.stock,
        delta_withheld: 0,
        reason: "initial",
        actor: user?.id ?? "admin",
        note: `Initial stock creation for ${cleanSku}`,
      });
    }

    // Optional accounting ledger sync
    if (input.stock > 0 && (input.unitCost ?? 0) > 0) {
      try {
        await recordInventoryPurchase(admin, {
          productId: newId,
          productLabel: `${cleanSku} ${input.title}`,
          qty: input.stock,
          unitCost: input.unitCost!,
        });
      } catch (err) {
        console.warn("[accounting] recordInventoryPurchase warning:", err);
      }
    }

    purgeCatalogCache();
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
    const path = `products/${safeSku}-${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await admin.storage
      .from("product-media")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: urlData } = admin.storage
      .from("product-media")
      .getPublicUrl(path);

    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}

export async function adjustProductStock(input: {
  variantId: string;
  qty: number;
  reason: "initial" | "manual_adjustment" | "order_reserved" | "order_released" | "order_delivered" | "return_restocked" | "rto_restocked" | "write_off";
  note?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { user, admin } = await requireAdmin();
  try {
    const { error } = await admin.rpc("restock_variant", {
      p_variant_id: input.variantId,
      p_qty: input.qty,
      p_reason: input.reason,
      p_actor: user?.id ?? "admin",
      p_note: input.note ?? undefined,
    });

    if (error) {
      // Fallback: direct adjustment if rpc constraint checks
      const { data: v } = await admin
        .from("product_variants")
        .select("total_stock")
        .eq("id", input.variantId)
        .single();

      if (v) {
        const nextTotal = Math.max(0, v.total_stock + input.qty);
        await admin
          .from("product_variants")
          .update({ total_stock: nextTotal })
          .eq("id", input.variantId);

        await admin.from("stock_movements").insert({
          variant_id: input.variantId,
          delta_total: input.qty,
          delta_withheld: 0,
          reason: input.reason,
          actor: user?.id ?? "admin",
          note: input.note ?? "Manual stock adjustment",
        });
      }
    }

    purgeCatalogCache();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to adjust stock.",
    };
  }
}

export async function updateProductName(
  productId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const clean = title.trim();
    if (!clean) return { success: false, error: "Product name cannot be empty." };

    const admin = await createAdminClient();
    const { error } = await admin
      .from("products")
      .update({ name: clean })
      .eq("id", productId);
    if (error) return { success: false, error: error.message };

    purgeCatalogCache();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to rename product.",
    };
  }
}

export interface UpdateProductDetailsInput {
  productId: string;
  name?: string;
  description?: string;
  story?: string;
  curatorNote?: string;
  origin?: string;
  artisanName?: string;
  tags?: string[];
  weightGrams?: number | null;
  lengthCm?: number | null;
  breadthCm?: number | null;
  heightCm?: number | null;
}

export async function updateProductDetailsAction(
  input: UpdateProductDetailsInput
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const admin = await createAdminClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.description !== undefined) updatePayload.description = input.description.trim();
    if (input.story !== undefined) updatePayload.story = input.story.trim();
    if (input.curatorNote !== undefined) updatePayload.curator_note = input.curatorNote.trim() || null;
    if (input.origin !== undefined) updatePayload.origin = input.origin.trim() || null;
    if (input.artisanName !== undefined) updatePayload.artisan_name = input.artisanName.trim() || null;
    if (input.tags !== undefined) updatePayload.tags = input.tags;
    if (input.weightGrams !== undefined) updatePayload.weight_grams = input.weightGrams;
    if (input.lengthCm !== undefined) updatePayload.length_cm = input.lengthCm;
    if (input.breadthCm !== undefined) updatePayload.breadth_cm = input.breadthCm;
    if (input.heightCm !== undefined) updatePayload.height_cm = input.heightCm;

    const { error } = await admin
      .from("products")
      .update(updatePayload as any)
      .eq("id", input.productId);

    if (error) return { success: false, error: error.message };

    if (input.weightGrams !== undefined) {
      await admin
        .from("product_variants")
        .update({ weight_grams: input.weightGrams })
        .eq("product_id", input.productId);
    }

    purgeCatalogCache();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update product details",
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
    
    // 1. Delete existing images from product_images table
    await admin.from("product_images").delete().eq("product_id", productId);

    // 2. Insert updated images with ordering and primary flag
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await admin.from("product_images").insert({
          product_id: productId,
          url: images[i].url,
          alt_text: images[i].alt || `${productTitle} – ${i + 1}`,
          sort_order: i,
          is_primary: i === 0,
        });
      }
    }

    purgeCatalogCache();
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

// ─── Direct Stock Count Override ──────────────────────────────────────────────

export async function overrideProductStockAction(input: {
  productId: string;
  variantId?: string;
  newStock: number;
  note?: string;
}): Promise<{ success: boolean; error?: string; availableStock?: number }> {
  const { user, admin } = await requireAdmin();
  try {
    const targetStock = Math.max(0, Math.floor(input.newStock));

    // Find variant
    let variantQuery = admin.from("product_variants").select("id, total_stock, withheld_stock");
    if (input.variantId) {
      variantQuery = variantQuery.eq("id", input.variantId);
    } else {
      variantQuery = variantQuery.eq("product_id", input.productId).limit(1);
    }

    const { data: vRow, error: vErr } = await variantQuery.maybeSingle();
    if (vErr || !vRow) return { success: false, error: "Product variant not found." };

    const currentTotal = vRow.total_stock;
    const delta = targetStock - currentTotal;

    // Direct update
    const { error: updErr } = await admin
      .from("product_variants")
      .update({ total_stock: targetStock })
      .eq("id", vRow.id);

    if (updErr) return { success: false, error: updErr.message };

    // Audit in stock_movements
    if (delta !== 0) {
      await admin.from("stock_movements").insert({
        variant_id: vRow.id,
        delta_total: delta,
        delta_withheld: 0,
        reason: "manual_adjustment",
        actor: user?.id || "admin",
        note: input.note || `Stock count set to ${targetStock} (was ${currentTotal})`,
      });
    }

    purgeCatalogCache();
    const available = Math.max(0, targetStock - vRow.withheld_stock);
    return { success: true, availableStock: available };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to override stock." };
  }
}

// ─── Three-Tier Pricing & Offer Management ───────────────────────────────────

export interface UpdatePricingInput {
  productId: string;
  costPrice?: number;    // in Rupees
  regularPrice: number;  // in Rupees (standard selling price)
  offerPrice?: number;   // in Rupees (promotional price)
  note?: string;
}

export async function updateProductPricingAction(
  input: UpdatePricingInput
): Promise<{ success: boolean; error?: string }> {
  const { user, admin } = await requireAdmin();

  try {
    const regPaise = Math.round(input.regularPrice * 100);
    const costPaise = input.costPrice !== undefined ? Math.round(input.costPrice * 100) : null;
    const offerPaise = input.offerPrice !== undefined && input.offerPrice > 0
      ? Math.round(input.offerPrice * 100)
      : null;

    // If an offer price is specified and lower than regular price:
    // base_price = offerPrice (what buyer pays)
    // compare_price = regularPrice (strikethrough on storefront)
    let basePrice = regPaise;
    let comparePrice: number | null = null;

    if (offerPaise !== null && offerPaise < regPaise) {
      basePrice = offerPaise;
      comparePrice = regPaise;
    }

    const { error: prodErr } = await admin
      .from("products")
      .update({
        base_price: basePrice,
        compare_price: comparePrice,
        cost_price: costPaise,
      })
      .eq("id", input.productId);

    if (prodErr) return { success: false, error: prodErr.message };

    // Record immutable audit entry in product_price_history
    await admin.from("product_price_history").insert({
      product_id: input.productId,
      cost_price: costPaise,
      regular_price: regPaise,
      offer_price: offerPaise,
      note: input.note || (offerPaise ? `Offer set to ₹${input.offerPrice}` : "Pricing updated"),
    });

    purgeCatalogCache();
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update pricing." };
  }
}

// ─── Price History Query ──────────────────────────────────────────────────────

export async function getProductPriceHistoryAction(productId: string) {
  const { admin } = await requireAdmin();

  const { data, error } = await admin
    .from("product_price_history")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

