"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/actions/admin";
import { recordInventoryPurchase, type NewEntry } from "@/lib/accounting";

export interface LedgerEntry {
  id: string;
  created_at: string;
  type: "debit" | "credit";
  category: string;
  amount: number;
  reference_id: string | null;
  notes: string | null;
}

export interface AccountingData {
  ledger: LedgerEntry[];
  totalReceivables: number;
  receivableOrders: number;
  totalPayables: number;
  totalCredit: number;
  totalDebit: number;
  netCashflow: number;
  tableMissing: boolean;
}

export interface StockProduct {
  id: string;
  sku: string;
  title: string;
  stock: number;
}

// Memo categories track money owed, not cash movement, so they are excluded from cashflow.
const MEMO_CATEGORIES = new Set(["vendor_payable", "customer_receivable"]);

export async function getAccountingData(): Promise<AccountingData> {
  await requireAdmin();
  const admin = await createAdminClient();

  const [ledgerRes, ordersRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from("accounting_entries") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000),
    admin.from("orders").select("id, status, total"),
  ]);

  const tableMissing = Boolean(ledgerRes.error);
  const ledger: LedgerEntry[] = (ledgerRes.data ?? []).map((e: LedgerEntry) => ({
    ...e,
    amount: Number(e.amount),
  }));

  // Receivables: orders placed but not yet paid (pending / COD awaiting collection)
  const pending = (ordersRes.data ?? []).filter((o) => o.status === "pending");
  const totalReceivables = pending.reduce((s, o) => s + Number(o.total || 0), 0) / 100;

  // Payables: supplier credit owed (credit vendor_payable) minus payments made (debit vendor_payable)
  const totalPayables = ledger
    .filter((e) => e.category === "vendor_payable")
    .reduce((s, e) => s + (e.type === "credit" ? e.amount : -e.amount), 0);

  const cash = ledger.filter((e) => !MEMO_CATEGORIES.has(e.category));
  const totalCredit = cash.filter((e) => e.type === "credit").reduce((s, e) => s + e.amount, 0);
  const totalDebit = cash.filter((e) => e.type === "debit").reduce((s, e) => s + e.amount, 0);

  return {
    ledger,
    totalReceivables,
    receivableOrders: pending.length,
    totalPayables: Math.max(0, totalPayables),
    totalCredit,
    totalDebit,
    netCashflow: totalCredit - totalDebit,
    tableMissing,
  };
}

export async function getStockProducts(): Promise<StockProduct[]> {
  await requireAdmin();
  try {
    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin.from("db_products") as any)
      .select("id, sku, title, stock")
      .order("title");
    return (data ?? []) as StockProduct[];
  } catch {
    return [];
  }
}

/** Add stock to a product and automatically debit the ledger at the given unit cost. */
export async function addInventoryStock(input: {
  productId: string;
  qty: number;
  unitCost: number; // rupees
  onCredit?: boolean;
  vendor?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!Number.isFinite(input.qty) || input.qty <= 0) return { success: false, error: "Quantity must be at least 1." };
    if (!Number.isFinite(input.unitCost) || input.unitCost < 0) return { success: false, error: "Enter a valid unit cost." };

    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product, error } = await (admin.from("db_products") as any)
      .select("id, sku, title, stock")
      .eq("id", input.productId)
      .single();
    if (error || !product) return { success: false, error: error?.message ?? "Product not found." };

    // Write the ledger first: if the table is missing we fail before touching stock.
    const ledger = await recordInventoryPurchase(admin, {
      productId: product.id,
      productLabel: `${product.sku} ${product.title}`,
      qty: input.qty,
      unitCost: input.unitCost,
      onCredit: input.onCredit,
      vendor: input.vendor?.trim() || undefined,
    });
    if (!ledger.success) return { success: false, error: `Ledger: ${ledger.error}` };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upErr } = await (admin.from("db_products") as any)
      .update({ stock: Number(product.stock) + input.qty, updated_at: new Date().toISOString() })
      .eq("id", product.id);
    if (upErr) return { success: false, error: upErr.message };

    revalidatePath("/admin/accounting");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to add stock." };
  }
}

/** Mark outstanding supplier payables as paid (debit vendor_payable). */
export async function settlePayables(amount: number): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!(amount > 0)) return { success: false, error: "Nothing to settle." };
    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from("accounting_entries") as any).insert([
      { type: "debit", category: "vendor_payable", amount, notes: "Supplier payables settled" },
    ]);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/accounting");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to settle." };
  }
}

export type ExpenseCategory =
  | "shipping_expense"
  | "packaging_expense"
  | "marketing_expense"
  | "operational_expense"
  | "other_expense";

/** Record general business expenses (shipping, packaging, marketing, operations, miscellaneous). */
export async function recordGeneralExpense(input: {
  category: ExpenseCategory;
  amount: number;
  notes: string;
  referenceId?: string;
  onCredit?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { success: false, error: "Enter a valid expense amount greater than 0." };
    }
    if (!input.notes || !input.notes.trim()) {
      return { success: false, error: "Please enter a description or note for this expense." };
    }

    const admin = await createAdminClient();
    const entries: NewEntry[] = [
      {
        type: "debit",
        category: input.category,
        amount: Math.round(input.amount * 100) / 100,
        reference_id: input.referenceId?.trim() || null,
        notes: input.notes.trim(),
      },
    ];

    if (input.onCredit) {
      entries.push({
        type: "credit",
        category: "vendor_payable",
        amount: Math.round(input.amount * 100) / 100,
        reference_id: input.referenceId?.trim() || null,
        notes: `Payable: ${input.notes.trim()}`,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from("accounting_entries") as any).insert(entries);

    if (error) {
      if (error.message?.includes("accounting_entries_category_check")) {
        return {
          success: false,
          error: "Database constraint: Run the updated SQL in Supabase SQL Editor to allow new expense categories.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/accounting");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to record expense." };
  }
}

