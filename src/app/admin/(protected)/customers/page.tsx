import { getAdminCustomers } from "@/actions/admin";
import { CustomerListTable } from "@/components/admin/CustomerListTable";

export default async function AdminCustomersPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const customers = hasSupabase ? await getAdminCustomers() : [];

  const totalBuyers = customers.filter((c) => c.orderCount > 0).length;
  const totalLTV = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderVal = totalBuyers > 0 ? Math.round(totalLTV / totalBuyers) : 0;

  const statCards = [
    { label: "Total Customers", value: customers.length, sub: "all accounts & guests" },
    { label: "Active Buyers", value: totalBuyers, sub: "placed at least 1 order" },
    { label: "Total Customer Spend", value: `₹${totalLTV.toLocaleString("en-IN")}`, sub: "completed orders" },
    { label: "Avg Spend / Buyer", value: `₹${avgOrderVal.toLocaleString("en-IN")}`, sub: "average customer LTV" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="font-label text-2xl text-ink font-semibold tracking-tight">
          Customer Directory & Accounts
        </h1>
        <p className="font-body text-xs text-ink/50 mt-1">
          View registered customer profiles, contact info, total orders placed, and lifetime spend.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[18px] p-5 sm:p-6 bg-paper border border-brand shadow-soft"
          >
            <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider font-semibold">
              {card.label}
            </p>
            <p className="font-label text-2xl sm:text-3xl text-ink font-semibold mt-2.5 tracking-tight">
              {card.value}
            </p>
            <p className="font-body text-[11px] text-ink/40 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Customer Directory Table */}
      <CustomerListTable customers={customers} />
    </div>
  );
}
