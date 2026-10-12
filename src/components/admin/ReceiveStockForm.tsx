"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addInventoryStock, settlePayables, type StockProduct } from "@/actions/accounting";

const input =
  "w-full px-3.5 py-2.5 rounded-[12px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all";
const label = "font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold";

export function ReceiveStockForm({ products }: { products: StockProduct[] }) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [vendor, setVendor] = useState("");
  const [onCredit, setOnCredit] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const total = (parseFloat(qty) || 0) * (parseFloat(unitCost) || 0);
  const selected = products.find((p) => p.id === productId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const q = parseInt(qty, 10);
    const c = parseFloat(unitCost);
    if (!q || q < 1) return setMsg({ ok: false, text: "Enter a quantity of at least 1." });
    if (isNaN(c) || c < 0) return setMsg({ ok: false, text: "Unit cost is required." });
    start(async () => {
      const res = await addInventoryStock({ productId, qty: q, unitCost: c, onCredit, vendor });
      if (!res.success) return setMsg({ ok: false, text: res.error ?? "Failed." });
      setMsg({ ok: true, text: `Added ${q} units · ledger debit ₹${(q * c).toLocaleString("en-IN")}` });
      setQty("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="bg-paper rounded-[20px] border border-brand shadow-soft p-5 space-y-4">
      <div>
        <h2 className="font-label text-sm text-ink font-semibold">Add Inventory Stock</h2>
        <p className="font-body text-xs text-ink/50 mt-0.5">
          Increases stock and posts a debit (inventory purchase) to the ledger.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="font-body text-xs text-ink/50">
          No admin-managed products yet. Add one from Products → Add New Product.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={label}>Product</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className={input}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.title} (stock {p.stock})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Quantity</label>
              <input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} className={input} placeholder="e.g. 20" />
            </div>
            <div>
              <label className={label}>Unit Cost (₹)</label>
              <input type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className={input} placeholder="e.g. 450" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Supplier <span className="text-ink/35 normal-case font-normal">(optional)</span></label>
              <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className={input} placeholder="Vendor name" />
            </div>
          </div>

          <label className="flex items-center gap-2 font-body text-xs text-ink/70 cursor-pointer">
            <input type="checkbox" checked={onCredit} onChange={(e) => setOnCredit(e.target.checked)} />
            Bought on credit — track as supplier payable
          </label>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="font-body text-xs text-ink/60">
              {selected && qty ? `New stock: ${selected.stock + (parseInt(qty, 10) || 0)} · ` : ""}
              Total cost <strong className="text-ink">₹{total.toLocaleString("en-IN")}</strong>
            </p>
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2.5 bg-berry text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all cursor-pointer font-semibold"
            >
              {pending ? "Saving…" : "Add Stock"}
            </button>
          </div>
        </>
      )}

      {msg && (
        <p className={`font-body text-xs font-medium ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>
      )}
    </form>
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
