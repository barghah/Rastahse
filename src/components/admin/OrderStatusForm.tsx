"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/admin";

// Maps a single status to its payment + delivery meaning
const STATUS_MEANING: Record<string, { payment: string; delivery: string; payClass: string; delClass: string }> = {
  pending:    { payment: "Pending",   delivery: "Pre-processing",  payClass: "bg-amber-50 text-amber-800 border-amber-200",    delClass: "bg-amber-50 text-amber-800 border-amber-200" },
  paid:       { payment: "Paid",      delivery: "Pre-processing",  payClass: "bg-blue-50 text-blue-800 border-blue-200",       delClass: "bg-amber-50 text-amber-800 border-amber-200" },
  processing: { payment: "Paid",      delivery: "Pre-processing",  payClass: "bg-blue-50 text-blue-800 border-blue-200",       delClass: "bg-purple-50 text-purple-800 border-purple-200" },
  shipped:    { payment: "Paid",      delivery: "Out for Delivery",payClass: "bg-blue-50 text-blue-800 border-blue-200",       delClass: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  delivered:  { payment: "Paid",      delivery: "Delivered",       payClass: "bg-blue-50 text-blue-800 border-blue-200",       delClass: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  cancelled:  { payment: "Cancelled", delivery: "Cancelled",       payClass: "bg-red-50 text-red-800 border-red-200",          delClass: "bg-red-50 text-red-800 border-red-200" },
  refunded:   { payment: "Refunded",  delivery: "Cancelled",       payClass: "bg-stone-100 text-stone-700 border-stone-200",   delClass: "bg-red-50 text-red-800 border-red-200" },
};

const STATUS_GROUPS = [
  {
    label: "💳 Payment",
    options: [
      { value: "pending",  label: "Pending — awaiting payment" },
      { value: "paid",     label: "Paid — payment received" },
      { value: "refunded", label: "Refunded — payment returned" },
    ],
  },
  {
    label: "📦 Fulfillment",
    options: [
      { value: "processing", label: "Processing — preparing order" },
      { value: "shipped",    label: "Shipped — out for delivery" },
      { value: "delivered",  label: "Delivered — order received" },
    ],
  },
  {
    label: "❌ Resolution",
    options: [
      { value: "cancelled", label: "Cancelled — order cancelled" },
    ],
  },
];

interface Props {
  orderId: string;
  currentStatus: string;
  currentTracking: string;
}

export function OrderStatusForm({ orderId, currentStatus, currentTracking }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(currentTracking);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const meaning = STATUS_MEANING[status] ?? STATUS_MEANING.pending;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await updateOrderStatus(orderId, status, tracking);
      if (!res.success) {
        setError(res.error || "Failed to update order.");
      } else {
        setSuccess(true);
        if (res.error) setError(res.error);
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft space-y-5">
      <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider font-semibold">
        Update Order Status
      </p>

      {/* Current Status Badges */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-label text-[9px] text-ink/35 uppercase tracking-widest">Payment</span>
          <span className={`inline-block px-3 py-1.5 rounded-full font-label text-[10px] uppercase tracking-wider font-semibold border ${meaning.payClass}`}>
            {meaning.payment}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-label text-[9px] text-ink/35 uppercase tracking-widest">Delivery</span>
          <span className={`inline-block px-3 py-1.5 rounded-full font-label text-[10px] uppercase tracking-wider font-semibold border ${meaning.delClass}`}>
            {meaning.delivery}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Status select with grouped options */}
        <div>
          <label className="font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-1.5 font-medium">
            Set New Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-[12px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper transition-all"
          >
            {STATUS_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Tracking number */}
        <div>
          <label className="font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-1.5 font-medium">
            Tracking Number <span className="text-ink/35 normal-case font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. SR1234567890"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-[12px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
          />
        </div>

        {success && (
          <p className="font-body text-xs text-emerald-700 font-medium">✓ Order updated successfully.</p>
        )}
        {error && (
          <p className="font-body text-xs text-red-600 font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-2.5 bg-berry text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

