import { getAccountingData, getStockProducts } from "@/actions/accounting";
import { ReceiveStockForm, SettlePayablesButton } from "@/components/admin/ReceiveStockForm";

export const metadata = { title: "Accounting — Rastah Admin" };
export const dynamic = "force-dynamic";

const inr = (n: number) =>
  `${n < 0 ? "−" : ""}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const CATEGORY_LABEL: Record<string, string> = {
  inventory_purchase: "Inventory purchase",
  sales_revenue: "Sales revenue",
  shipping_expense: "Shipping expense",
  vendor_payable: "Vendor payable",
  customer_receivable: "Customer receivable",
};

export default async function AdminAccountingPage() {
  const [data, products] = await Promise.all([getAccountingData(), getStockProducts()]);

  const cards = [
    { title: "Total Receivables", value: inr(data.totalReceivables), sub: `${data.receivableOrders} unpaid / COD order${data.receivableOrders === 1 ? "" : "s"}`, tone: "text-amber-700" },
    { title: "Total Payables", value: inr(data.totalPayables), sub: "Owed to suppliers", tone: "text-red-700", extra: <SettlePayablesButton amount={data.totalPayables} /> },
    { title: "Net Cashflow", value: inr(data.netCashflow), sub: `${inr(data.totalCredit)} in − ${inr(data.totalDebit)} out`, tone: data.netCashflow >= 0 ? "text-emerald-700" : "text-red-700" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="font-label text-xl sm:text-2xl text-ink font-semibold tracking-tight">Accounting</h1>
        <p className="font-body text-xs text-ink/50 mt-1">
          Double-entry ledger synced with inventory purchases and delivered orders.
        </p>
      </div>

      {data.tableMissing && (
        <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-4 font-body text-xs text-amber-900">
          The <code>accounting_entries</code> table doesn&apos;t exist yet. Open{" "}
          <code>supabase/migrations/20241012_accounting_entries.sql</code>, copy its contents into the Supabase SQL Editor, and run it.
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="bg-paper rounded-[20px] border border-brand shadow-soft p-5">
            <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider font-semibold">{c.title}</p>
            <p className={`font-label text-2xl font-semibold mt-2 ${c.tone}`}>{c.value}</p>
            <p className="font-body text-[11px] text-ink/50 mt-1">{c.sub}</p>
            {c.extra}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1">
          <ReceiveStockForm products={products} />
        </div>

        <div className="lg:col-span-2 bg-paper rounded-[20px] border border-brand shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-brand">
            <h2 className="font-label text-sm text-ink font-semibold">Transaction Ledger</h2>
            <p className="font-body text-xs text-ink/50 mt-0.5">Latest {data.ledger.length} entries</p>
          </div>

          {data.ledger.length === 0 ? (
            <p className="p-10 text-center font-body text-sm text-ink/40">
              No entries yet. Add stock or mark an order Delivered to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-brand bg-surface/40">
                    {["Date", "Type", "Category", "Amount", "Reference"].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-label text-[10px] text-ink/45 uppercase tracking-wider font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.ledger.map((e) => (
                    <tr key={e.id} className="border-b border-brand/60 last:border-0 hover:bg-surface/30">
                      <td className="px-4 py-3 font-body text-xs text-ink/70 whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-label text-[9.5px] uppercase tracking-wider font-semibold border ${e.type === "credit" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-ink/80 whitespace-nowrap">{CATEGORY_LABEL[e.category] ?? e.category}</td>
                      <td className={`px-4 py-3 font-label text-xs font-semibold whitespace-nowrap ${e.type === "credit" ? "text-emerald-700" : "text-red-700"}`}>
                        {e.type === "credit" ? "+" : "−"}{inr(e.amount)}
                      </td>
                      <td className="px-4 py-3 font-body text-[11px] text-ink/55 max-w-[260px]">
                        <p className="truncate" title={e.notes ?? ""}>{e.notes ?? "—"}</p>
                        {e.reference_id && <p className="font-mono text-[10px] text-ink/35">{e.reference_id.slice(0, 8)}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
