"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addInventoryStock,
  recordGeneralExpense,
  settlePayables,
  type StockProduct,
  type ExpenseCategory,
} from "@/actions/accounting";

const input =
  "w-full px-3.5 py-2.5 rounded-[12px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all";
const label = "font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold";

const EXPENSE_CATEGORIES: Array<{ value: ExpenseCategory; label: string; icon: string }> = [
  { value: "shipping_expense",   label: "Shipping & Delivery",     icon: "🚚" },
  { value: "packaging_expense",  label: "Packaging & Supplies",    icon: "📦" },
  { value: "marketing_expense",  label: "Marketing & Photography", icon: "📣" },
  { value: "operational_expense",label: "Operations & Utilities",  icon: "⚙️" },
  { value: "other_expense",      label: "Other Expense",           icon: "🧾" },
];

export function ReceiveStockForm({ products }: { products: StockProduct[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"stock" | "expense">("stock");

  // ── Stock State ──
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [vendor, setVendor] = useState("");
  const [stockOnCredit, setStockOnCredit] = useState(false);
  const [stockMsg, setStockMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [stockPending, startStock] = useTransition();

  const totalStockCost = (parseFloat(qty) || 0) * (parseFloat(unitCost) || 0);

  // Product search: filters the dropdown by name or SKU
  const [search, setSearch] = useState("");
  const needle = search.trim().toLowerCase();
  const filteredProducts = needle
    ? products.filter(
        (p) => p.title.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle)
      )
    : products;
  // If the chosen product is filtered out, fall back to the first match
  const effectiveProductId = filteredProducts.some((p) => p.id === productId)
    ? productId
    : filteredProducts[0]?.id ?? "";
  const selectedProduct = products.find((p) => p.id === effectiveProductId);

  // ── Expense State ──
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("other_expense");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseRef, setExpenseRef] = useState("");
  const [expenseOnCredit, setExpenseOnCredit] = useState(false);
  const [expenseMsg, setExpenseMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [expensePending, startExpense] = useTransition();

  function handleStockSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStockMsg(null);
    const q = parseInt(qty, 10);
    const c = parseFloat(unitCost);
    if (!effectiveProductId) return setStockMsg({ ok: false, text: "Select a product first." });
    if (!q || q < 1) return setStockMsg({ ok: false, text: "Enter a quantity of at least 1." });
    if (isNaN(c) || c < 0) return setStockMsg({ ok: false, text: "Unit cost is required." });

    startStock(async () => {
      const res = await addInventoryStock({
        productId: effectiveProductId,
        qty: q,
        unitCost: c,
        onCredit: stockOnCredit,
        vendor,
      });
      if (!res.success) return setStockMsg({ ok: false, text: res.error ?? "Failed to save stock." });
      setStockMsg({ ok: true, text: `✓ Added ${q} units · Debit ₹${(q * c).toLocaleString("en-IN")}` });
      setQty("");
      router.refresh();
    });
  }

  function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setExpenseMsg(null);
    const amt = parseFloat(expenseAmount);
    if (!amt || amt <= 0) return setExpenseMsg({ ok: false, text: "Enter a valid amount." });
    if (!expenseNotes.trim()) return setExpenseMsg({ ok: false, text: "Please enter a description for the expense." });

    startExpense(async () => {
      const res = await recordGeneralExpense({
        category: expenseCategory,
        amount: amt,
        notes: expenseNotes,
        referenceId: expenseRef,
        onCredit: expenseOnCredit,
      });

      if (!res.success) {
        return setExpenseMsg({ ok: false, text: res.error ?? "Failed to record expense." });
      }

      setExpenseMsg({
        ok: true,
        text: `✓ Recorded ₹${amt.toLocaleString("en-IN")} ${EXPENSE_CATEGORIES.find((c) => c.value === expenseCategory)?.label}`,
      });
      setExpenseAmount("");
      setExpenseNotes("");
      setExpenseRef("");
      setExpenseOnCredit(false);
      router.refresh();
    });
  }

  return (
    <div className="bg-paper rounded-[20px] border border-brand shadow-soft p-5 space-y-4">
      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-1.5 p-1 bg-surface/70 rounded-[14px] border border-brand/60">
        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`flex-1 py-1.5 px-3 rounded-[10px] font-label text-[10.5px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
            activeTab === "stock"
              ? "bg-paper text-berry shadow-xs border border-brand/40"
              : "text-ink/60 hover:text-ink"
          }`}
        >
          📦 Add Stock
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("expense")}
          className={`flex-1 py-1.5 px-3 rounded-[10px] font-label text-[10.5px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
            activeTab === "expense"
              ? "bg-paper text-berry shadow-xs border border-brand/40"
              : "text-ink/60 hover:text-ink"
          }`}
        >
          💸 Other Expense
        </button>
      </div>

      {/* ── TAB 1: ADD INVENTORY STOCK ── */}
      {activeTab === "stock" && (
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div>
            <h2 className="font-label text-sm text-ink font-semibold">Add Inventory Stock</h2>
            <p className="font-body text-xs text-ink/50 mt-0.5">
              Increases stock and posts a debit (inventory purchase) to the ledger.
            </p>
          </div>

          {products.length === 0 ? (
            <p className="font-body text-xs text-ink/50 py-3">
              No admin-managed products yet. Add one from Products → Add New Product.
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={label}>Product</label>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`${input} mb-2`}
                    placeholder="Search by name or SKU…"
                  />
                  {filteredProducts.length === 0 ? (
                    <p className="font-body text-xs text-red-600 py-1">
                      No products match &ldquo;{search}&rdquo;.
                    </p>
                  ) : (
                    <select
                      value={effectiveProductId}
                      onChange={(e) => setProductId(e.target.value)}
                      className={input}
                    >
                      {filteredProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.title} (stock {p.stock})
                        </option>
                      ))}
                    </select>
                  )}
                  {needle && filteredProducts.length > 0 && (
                    <p className="font-body text-[11px] text-ink/45 mt-1">
                      {filteredProducts.length} of {products.length} products
                    </p>
                  )}
                </div>
                <div>
                  <label className={label}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className={input}
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <label className={label}>Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className={input}
                    placeholder="e.g. 450"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>
                    Supplier <span className="text-ink/35 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className={input}
                    placeholder="Vendor name"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 font-body text-xs text-ink/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stockOnCredit}
                  onChange={(e) => setStockOnCredit(e.target.checked)}
                />
                Bought on credit — track as supplier payable
              </label>

              <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-brand/50">
                <p className="font-body text-xs text-ink/60">
                  {selectedProduct && qty ? `New stock: ${selectedProduct.stock + (parseInt(qty, 10) || 0)} · ` : ""}
                  Total: <strong className="text-ink">₹{totalStockCost.toLocaleString("en-IN")}</strong>
                </p>
                <button
                  type="submit"
                  disabled={stockPending}
                  className="px-5 py-2.5 bg-berry text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all cursor-pointer font-semibold shadow-xs"
                >
                  {stockPending ? "Saving…" : "Add Stock"}
                </button>
              </div>
            </>
          )}

          {stockMsg && (
            <p className={`font-body text-xs font-medium ${stockMsg.ok ? "text-emerald-700" : "text-red-600"}`}>
              {stockMsg.text}
            </p>
          )}
        </form>
      )}

      {/* ── TAB 2: RECORD OTHER EXPENSE ── */}
      {activeTab === "expense" && (
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div>
            <h2 className="font-label text-sm text-ink font-semibold">Record Business Expense</h2>
            <p className="font-body text-xs text-ink/50 mt-0.5">
              Logs a debit entry in the accounting ledger and updates net cashflow.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className={label}>Expense Category</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                className={input}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Amount (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className={input}
                  placeholder="e.g. 1200"
                  required
                />
              </div>

              <div>
                <label className={label}>
                  Bill / Invoice # <span className="text-ink/35 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={expenseRef}
                  onChange={(e) => setExpenseRef(e.target.value)}
                  className={input}
                  placeholder="e.g. INV-8821"
                />
              </div>
            </div>

            <div>
              <label className={label}>Description / Notes</label>
              <textarea
                rows={2}
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className={`${input} resize-none`}
                placeholder="e.g. 50 Corrugated shipping boxes + tape from vendor"
                required
              />
            </div>

            <label className="flex items-center gap-2 font-body text-xs text-ink/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={expenseOnCredit}
                onChange={(e) => setExpenseOnCredit(e.target.checked)}
              />
              Unpaid / On credit — track as supplier payable
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-brand/50">
            <p className="font-body text-xs text-ink/60">
              {expenseAmount ? (
                <>
                  Total Debit: <strong className="text-ink">₹{Number(expenseAmount).toLocaleString("en-IN")}</strong>
                </>
              ) : (
                "Debit to cashflow"
              )}
            </p>
            <button
              type="submit"
              disabled={expensePending}
              className="px-5 py-2.5 bg-berry text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all cursor-pointer font-semibold shadow-xs"
            >
              {expensePending ? "Recording…" : "Record Expense"}
            </button>
          </div>

          {expenseMsg && (
            <p className={`font-body text-xs font-medium ${expenseMsg.ok ? "text-emerald-700" : "text-red-600"}`}>
              {expenseMsg.text}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export function SettlePayablesButton({ amount }: { amount: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (amount <= 0) return null;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Mark ₹${amount.toLocaleString("en-IN")} of supplier payables as paid?`)) return;
        start(async () => {
          await settlePayables(amount);
          router.refresh();
        });
      }}
      className="mt-2 font-label text-[10px] text-berry uppercase tracking-wider font-semibold hover:underline disabled:opacity-50 cursor-pointer"
    >
      {pending ? "Settling…" : "Mark all paid"}
    </button>
  );
}
