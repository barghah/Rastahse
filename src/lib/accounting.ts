/**
 * Accounting ledger helpers (server-only, NOT server actions).
 * They take an already-authorised admin Supabase client so they can be reused
 * from other server actions (e.g. order completion, product creation).
 *
 * All ledger amounts are in RUPEES. Orders / db_products store paise.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type EntryType = "debit" | "credit";
export type EntryCategory =
  | "inventory_purchase"
  | "sales_revenue"
  | "shipping_expense"
  | "packaging_expense"
  | "marketing_expense"
  | "operational_expense"
  | "other_expense"
  | "vendor_payable"
  | "customer_receivable";

export interface NewEntry {
  type: EntryType;
  category: EntryCategory;
  amount: number;
  reference_id?: string | null;
  notes?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;

export async function insertEntries(
  admin: Client,
  entries: NewEntry[]
): Promise<{ success: boolean; error?: string }> {
  const rows = entries.filter((e) => e.amount > 0);
  if (rows.length === 0) return { success: true };
  const { error } = await admin.from("accounting_entries").insert(
    rows.map((e) => ({
      type: e.type,
      category: e.category,
      amount: Math.round(e.amount * 100) / 100,
      reference_id: e.reference_id ?? null,
      notes: e.notes ?? null,
    }))
  );
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Record the purchase of inventory stock: debit inventory_purchase.
 * If bought on credit, also log an outstanding vendor_payable (credit).
 */
export async function recordInventoryPurchase(
  admin: Client,
  opts: {
    productId: string;
    productLabel: string;
    qty: number;
    unitCost: number; // rupees
    onCredit?: boolean;
    vendor?: string;
  }
) {
  const total = opts.qty * opts.unitCost;
  const note = `Stock +${opts.qty} × ₹${opts.unitCost} — ${opts.productLabel}${
    opts.vendor ? ` (vendor: ${opts.vendor})` : ""
  }`;
  const entries: NewEntry[] = [
    { type: "debit", category: "inventory_purchase", amount: total, reference_id: opts.productId, notes: note },
  ];
  if (opts.onCredit) {
    entries.push({
      type: "credit",
      category: "vendor_payable",
      amount: total,
      reference_id: opts.productId,
      notes: `Owed to supplier — ${note}`,
    });
  }
  return insertEntries(admin, entries);
}

interface OrderItem {
  product_id?: string;
  id?: string;
  sku?: string;
  qty?: number;
  quantity?: number;
}

/**
 * When an order is completed (delivered): credit sales_revenue and reduce stock.
 * Idempotent — if a sales_revenue entry already exists for the order, nothing happens,
 * so re-saving a delivered order never double counts revenue or stock.
 */
export async function recordOrderCompletion(
  admin: Client,
  orderId: string
): Promise<{ recorded: boolean; error?: string }> {
  const { data: existing } = await admin
    .from("accounting_entries")
    .select("id")
    .eq("category", "sales_revenue")
    .eq("reference_id", orderId)
    .limit(1);
  if (existing && existing.length > 0) return { recorded: false };

  const { data: order, error } = await admin
    .from("orders")
    .select("id, total, items")
    .eq("id", orderId)
    .single();
  if (error || !order) return { recorded: false, error: error?.message ?? "Order not found" };

  const items = (Array.isArray(order.items) ? order.items : []) as OrderItem[];
  const res = await insertEntries(admin, [
    {
      type: "credit",
      category: "sales_revenue",
      amount: Number(order.total || 0) / 100,
      reference_id: orderId,
      notes: `Order ${String(orderId).slice(0, 8).toUpperCase()} delivered`,
    },
  ]);
  if (!res.success) return { recorded: false, error: res.error };

  // Reduce remaining stock for admin-managed (db_products) items
  for (const it of items) {
    const key = it.product_id ?? it.id ?? it.sku;
    const qty = Number(it.qty ?? it.quantity ?? 0);
    if (!key || qty <= 0) continue;
    await decrementStock(admin, String(key), qty);
  }
  return { recorded: true };
}

async function decrementStock(admin: Client, key: string, qty: number) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  const { data } = await admin
    .from("db_products")
    .select("id, stock")
    .eq(isUuid ? "id" : "sku", key)
    .maybeSingle();
  if (!data) return; // static catalog item — no numeric stock tracked
  await admin
    .from("db_products")
    .update({ stock: Math.max(0, Number(data.stock) - qty), updated_at: new Date().toISOString() })
    .eq("id", data.id);
}
