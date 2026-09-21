"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { AdminCustomer } from "@/actions/admin";

interface Props {
  customers: AdminCustomer[];
}

export function CustomerListTable({ customers }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "with_orders" | "admins">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (filterType === "with_orders" && c.orderCount === 0) return false;
      if (filterType === "admins" && !c.isAdmin) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.displayName?.toLowerCase().includes(q) ?? false;
        const matchesEmail = c.email?.toLowerCase().includes(q) ?? false;
        const matchesPhone = c.phone?.toLowerCase().includes(q) ?? false;
        const matchesCity = c.city?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCity) return false;
      }

      return true;
    });
  }, [customers, filterType, searchQuery]);

  return (
    <div className="space-y-4">
      {/* ── Search & Filter Controls ── */}
      <div className="bg-paper p-5 rounded-[20px] border border-brand shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, email, phone, or city…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-[12px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/35 transition-all"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 text-sm">
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/40 hover:text-ink cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3.5 py-1.5 rounded-full font-label text-[10.5px] uppercase tracking-wider transition-all font-medium cursor-pointer shrink-0 ${
              filterType === "all"
                ? "bg-berry text-paper shadow-xs"
                : "bg-surface/70 text-ink/70 hover:text-ink border border-brand hover:border-ink/20"
            }`}
          >
            All Accounts ({customers.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("with_orders")}
            className={`px-3.5 py-1.5 rounded-full font-label text-[10.5px] uppercase tracking-wider transition-all font-medium cursor-pointer shrink-0 ${
              filterType === "with_orders"
                ? "bg-berry text-paper shadow-xs"
                : "bg-surface/70 text-ink/70 hover:text-ink border border-brand hover:border-ink/20"
            }`}
          >
            With Orders ({customers.filter((c) => c.orderCount > 0).length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType("admins")}
            className={`px-3.5 py-1.5 rounded-full font-label text-[10.5px] uppercase tracking-wider transition-all font-medium cursor-pointer shrink-0 ${
              filterType === "admins"
                ? "bg-berry text-paper shadow-xs"
                : "bg-surface/70 text-ink/70 hover:text-ink border border-brand hover:border-ink/20"
            }`}
          >
            Admins ({customers.filter((c) => c.isAdmin).length})
          </button>
        </div>
      </div>

      {/* ── Customers Table ── */}
      {filtered.length === 0 ? (
        <div className="rounded-[18px] p-12 text-center bg-paper border border-brand shadow-soft">
          <p className="font-body text-sm text-ink/40">
            No customers match the current search or filters.
          </p>
        </div>
      ) : (
        <div className="rounded-[18px] bg-paper border border-brand overflow-x-auto shadow-soft">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-surface/70 border-b border-brand">
                {["Customer", "Contact Details", "Orders Placed", "Total Spent", "City / Region", "Last Active", "Joined"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-5 py-3.5 text-left font-label text-[10px] text-ink/50 uppercase tracking-wider whitespace-nowrap font-medium"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand/60">
              {filtered.map((customer) => {
                const initial = (customer.displayName?.[0] || customer.email?.[0] || "C").toUpperCase();

                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-surface/40 transition-colors"
                  >
                    {/* Customer */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-berry/10 border border-berry/20 text-berry font-label text-xs font-semibold flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-body text-xs text-ink font-semibold">
                              {customer.displayName || "Customer"}
                            </p>
                            {customer.isAdmin && (
                              <span className="px-1.5 py-0.5 rounded bg-berry text-paper font-label text-[8.5px] uppercase tracking-wider font-bold">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[10px] text-ink/35">
                            ID: {customer.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          className="font-body text-xs text-berry hover:underline block font-medium"
                        >
                          {customer.email}
                        </a>
                      ) : (
                        <span className="font-body text-xs text-ink/30">—</span>
                      )}
                      {customer.phone && (
                        <a
                          href={`tel:${customer.phone}`}
                          className="font-body text-[11px] text-ink/50 hover:text-ink block mt-0.5 font-mono"
                        >
                          📱 {customer.phone}
                        </a>
                      )}
                    </td>

                    {/* Orders Placed */}
                    <td className="px-5 py-4">
                      {customer.orderCount > 0 ? (
                        <Link
                          href={`/admin/orders`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-berry/10 text-berry border border-berry/20 font-label text-[10px] uppercase tracking-wider font-semibold hover:bg-berry/20 transition-colors"
                        >
                          {customer.orderCount} order{customer.orderCount !== 1 ? "s" : ""}
                        </Link>
                      ) : (
                        <span className="font-body text-xs text-ink/35">0 orders</span>
                      )}
                    </td>

                    {/* Total Spent */}
                    <td className="px-5 py-4 font-label text-xs text-ink font-semibold whitespace-nowrap">
                      {customer.totalSpent > 0 ? (
                        `₹${customer.totalSpent.toLocaleString("en-IN")}`
                      ) : (
                        <span className="text-ink/30 font-normal">₹0</span>
                      )}
                    </td>

                    {/* City */}
                    <td className="px-5 py-4 font-body text-xs text-ink/65 whitespace-nowrap">
                      {customer.city || "—"}
                    </td>

                    {/* Last Active */}
                    <td className="px-5 py-4 font-body text-xs text-ink/45 whitespace-nowrap">
                      {customer.lastSignInAt
                        ? new Date(customer.lastSignInAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : customer.lastOrderDate
                        ? `Ordered ${new Date(customer.lastOrderDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}`
                        : "—"}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 font-body text-xs text-ink/45 whitespace-nowrap">
                      {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
