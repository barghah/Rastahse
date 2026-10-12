"use client";

import { useState, useTransition, useMemo } from "react";
import { saveDeliverySettings } from "@/actions/delivery";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  created_at: string;
  email: string;
  phone: string | null;
  status: string;
  total: number;
  items: unknown;
  shipping_address: unknown;
  tracking_number: string | null;
}

interface Props {
  orders: Order[];
  initialActiveDays: number[];
  nextDates: string[]; // ISO date strings from server
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Orders that need to go out in the next batch */
const READY_STATUSES = ["paid", "processing"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAddr(order: Order) {
  return order.shipping_address as {
    name?: string;
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
}

function getItems(order: Order): Array<{ name?: string; qty?: number; price?: number }> {
  return Array.isArray(order.items) ? order.items as Array<{ name?: string; qty?: number; price?: number }> : [];
}

// Compute next dispatch date >= given date for the active days list
function computeNextDispatch(activeDays: number[], fromDate: Date): Date | null {
  if (activeDays.length === 0) return null;
  const cursor = new Date(fromDate);
  cursor.setDate(cursor.getDate() + 1);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    if (activeDays.includes(cursor.getDay())) return new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

function getNextNDates(activeDays: number[], count = 4): Date[] {
  const results: Date[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate());
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; results.length < count && i < 60; i++) {
    if (activeDays.includes(cursor.getDay())) results.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return results;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// ─── Print Manifest ────────────────────────────────────────────────────────────

function printManifest(orders: Order[], dispatchDate: string) {
  const rows = orders.map((o) => {
    const addr = getAddr(o);
    const items = getItems(o);
    return `
      <tr>
        <td>#${o.id.slice(0, 8).toUpperCase()}</td>
        <td>${addr?.name ?? "Guest"}</td>
        <td>${addr?.line1 ?? ""}, ${addr?.city ?? ""} – ${addr?.pincode ?? ""}</td>
        <td>${o.phone ?? o.email}</td>
        <td>${items.map(i => `${i.name} ×${i.qty ?? 1}`).join("<br/>")}</td>
        <td>₹${Number(o.total).toLocaleString("en-IN")}</td>
        <td>${o.tracking_number ?? "—"}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Dispatch Manifest – ${dispatchDate}</title>
  <style>
    body { font-family: 'Courier New', monospace; font-size: 11px; color: #111; padding: 24px; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    h2 { font-size: 12px; color: #555; margin-bottom: 20px; font-weight: normal; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #f5f5f0; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #ddd; }
    td { padding: 7px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
    tr:nth-child(even) td { background: #fafaf8; }
    .footer { margin-top: 32px; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
  </style>
</head>
<body>
  <h1>RASTAH से — Dispatch Manifest</h1>
  <h2>Dispatch Date: ${dispatchDate} &nbsp;|&nbsp; ${orders.length} order${orders.length !== 1 ? "s" : ""} to dispatch</h2>
  <table>
    <thead>
      <tr>
        <th>Order ID</th><th>Customer</th><th>Address</th><th>Contact</th><th>Items</th><th>Total</th><th>Tracking</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    Printed from Rastah Admin · ${new Date().toLocaleString("en-IN")} · Total: ₹${orders.reduce((s, o) => s + Number(o.total), 0).toLocaleString("en-IN")}
  </div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeliveryScheduleManager({ orders, initialActiveDays }: Props) {
  const [activeDays, setActiveDays] = useState<number[]>(initialActiveDays);
  const [isPending, startTransition] = useTransition();
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number>(0); // index into upcomingDates

  // Toggle a day
  function toggleDay(day: number) {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
    setSaveMsg(null);
  }

  // Save to Supabase
  function handleSave() {
    startTransition(async () => {
      const res = await saveDeliverySettings(activeDays);
      setSaveMsg(res.success ? "✓ Dispatch days saved" : (res.error ?? "Failed to save"));
    });
  }

  // Compute next 4 dispatch dates from current activeDays
  const upcomingDates = useMemo(() => getNextNDates(activeDays, 4), [activeDays]);

  // Group ready orders by their upcoming batch
  // Each order's batch = the next dispatch date after its created_at
  const batchGroups = useMemo(() => {
    return upcomingDates.map((batchDate) => {
      const batchOrders = orders.filter((o) => {
        if (!READY_STATUSES.includes(o.status)) return false;
        const orderDate = new Date(o.created_at);
        const nextDispatch = computeNextDispatch(activeDays, orderDate);
        if (!nextDispatch) return false;
        return isSameDay(nextDispatch, batchDate);
      });
      return { date: batchDate, orders: batchOrders };
    });
  }, [orders, upcomingDates, activeDays]);

  // All unassigned ready orders (no active days set, or order too old)
  const readyOrders = useMemo(
    () => orders.filter((o) => READY_STATUSES.includes(o.status)),
    [orders]
  );

  const currentBatch = batchGroups[selectedBatch];

  return (
    <div className="space-y-6">
      {/* ── Delivery Days Config ── */}
      <div className="bg-paper rounded-[20px] border border-brand shadow-soft p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-label text-sm text-ink font-semibold tracking-tight">
              Dispatch Day Schedule
            </h2>
            <p className="font-body text-xs text-ink/45 mt-0.5">
              Select the days your store dispatches orders. These define delivery batches.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="shrink-0 px-4 py-2 bg-berry hover:bg-[#580118] text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Day Toggles */}
        <div className="flex flex-wrap gap-2">
          {DAY_NAMES.map((name, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`flex flex-col items-center px-3.5 py-2.5 rounded-[12px] font-label text-[10.5px] transition-all cursor-pointer border font-medium min-w-[56px] ${
                activeDays.includes(i)
                  ? "bg-berry text-paper border-berry shadow-xs"
                  : "bg-surface text-ink/60 border-brand hover:border-ink/30 hover:text-ink"
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest opacity-70">{DAY_SHORT[i]}</span>
              <span className="mt-0.5">{activeDays.includes(i) ? "✓" : "○"}</span>
            </button>
          ))}
        </div>

        {saveMsg && (
          <p className={`font-body text-xs font-medium ${saveMsg.startsWith("✓") ? "text-emerald-700" : "text-red-600"}`}>
            {saveMsg}
          </p>
        )}

        {/* Next dates preview */}
        {upcomingDates.length > 0 && (
          <div className="pt-2 border-t border-brand/60">
            <p className="font-label text-[9.5px] text-ink/40 uppercase tracking-widest mb-2">
              Upcoming dispatch dates
            </p>
            <div className="flex flex-wrap gap-2">
              {upcomingDates.map((d, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-surface border border-brand font-label text-[10px] text-ink/60"
                >
                  {formatDateShort(d)}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeDays.length === 0 && (
          <p className="font-body text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-[10px] px-3 py-2">
            ⚠️ No dispatch days selected. The storefront will not show a dispatch date.
          </p>
        )}
      </div>

      {/* ── Batch Selector ── */}
      {upcomingDates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-label text-sm text-ink font-semibold tracking-tight">
              Dispatch Batches
            </h2>
            <p className="font-body text-xs text-ink/40">
              {readyOrders.length} order{readyOrders.length !== 1 ? "s" : ""} awaiting dispatch
            </p>
          </div>

          {/* Batch tabs */}
          <div className="flex flex-wrap gap-2">
            {batchGroups.map((bg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedBatch(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-label text-[10.5px] transition-all cursor-pointer border ${
                  selectedBatch === i
                    ? "bg-ink text-paper border-ink shadow-xs"
                    : "bg-paper text-ink/60 border-brand hover:border-ink/30 hover:text-ink"
                }`}
              >
                <span className="uppercase tracking-wider">
                  {i === 0 ? "Next — " : ""}{formatDateShort(bg.date)}
                </span>
                {bg.orders.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full font-semibold text-[9px] ${
                    selectedBatch === i ? "bg-paper/20 text-paper" : "bg-berry/10 text-berry"
                  }`}>
                    {bg.orders.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Batch Detail */}
          {currentBatch && (
            <div className="bg-paper rounded-[20px] border border-brand shadow-soft overflow-hidden">
              {/* Batch Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand bg-surface/40">
                <div>
                  <p className="font-label text-xs text-ink/45 uppercase tracking-wider">
                    Dispatch Batch
                  </p>
                  <p className="font-body text-sm text-ink font-medium mt-0.5">
                    {formatDate(currentBatch.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label text-[10px] text-ink/50">
                    {currentBatch.orders.length} order{currentBatch.orders.length !== 1 ? "s" : ""}
                    {currentBatch.orders.length > 0 && (
                      <> · ₹{currentBatch.orders.reduce((s, o) => s + Number(o.total), 0).toLocaleString("en-IN")}</>
                    )}
                  </span>
                  {currentBatch.orders.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        printManifest(currentBatch.orders, formatDate(currentBatch.date))
                      }
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-ink hover:bg-ink/80 text-paper font-label text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                    >
                      <span>🖨️</span>
                      <span>Print Manifest</span>
                    </button>
                  )}
                </div>
              </div>

              {currentBatch.orders.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-body text-sm text-ink/35">No orders scheduled for this batch yet.</p>
                  <p className="font-body text-xs text-ink/25 mt-1">
                    Orders marked &quot;Paid&quot; or &quot;Processing&quot; after{" "}
                    {selectedBatch === 0 ? "now" : formatDateShort(batchGroups[selectedBatch - 1]?.date ?? currentBatch.date)}{" "}
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px]">
                    <thead>
                      <tr className="border-b border-brand/50">
                        {["Order", "Customer", "Address", "Contact", "Items", "Total", "Tracking"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left font-label text-[9.5px] text-ink/40 uppercase tracking-wider font-semibold whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand/40">
                      {currentBatch.orders.map((order) => {
                        const addr = getAddr(order);
                        const items = getItems(order);
                        return (
                          <tr key={order.id} className="hover:bg-surface/30 transition-colors">
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-[11px] text-berry font-semibold">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-body text-xs text-ink font-medium">
                                {addr?.name ?? "Guest"}
                              </p>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-body text-[11px] text-ink/60 max-w-[160px]">
                                {addr?.line1}, {addr?.city}
                              </p>
                              <p className="font-label text-[9.5px] text-ink/35 uppercase tracking-wider">
                                {addr?.pincode} · {addr?.state}
                              </p>
                            </td>
                            <td className="px-4 py-3.5 font-body text-[11px] text-ink/55">
                              {order.phone ?? order.email}
                            </td>
                            <td className="px-4 py-3.5">
                              {items.map((item, j) => (
                                <p key={j} className="font-body text-[11px] text-ink/70 whitespace-nowrap">
                                  {item.name} <span className="text-ink/40">×{item.qty ?? 1}</span>
                                </p>
                              ))}
                            </td>
                            <td className="px-4 py-3.5 font-label text-xs text-ink font-semibold whitespace-nowrap">
                              ₹{Number(order.total).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3.5">
                              {order.tracking_number ? (
                                <span className="font-mono text-[10px] text-ink/60">
                                  {order.tracking_number}
                                </span>
                              ) : (
                                <span className="font-body text-[10px] text-ink/30">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── No days configured ── */}
      {activeDays.length === 0 && (
        <div className="rounded-[18px] p-10 text-center bg-paper border border-dashed border-brand">
          <p className="font-body text-sm text-ink/40">
            Select at least one dispatch day above to see batch groupings.
          </p>
        </div>
      )}
    </div>
  );
}
