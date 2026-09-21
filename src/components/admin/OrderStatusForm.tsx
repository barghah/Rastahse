"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/admin";

const STATUSES = [
  "pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded",
];

interface Props {
  orderId: string;
  currentStatus: string;
  currentTracking: string;
}

/**
 * OrderStatusForm — client form to update order status and tracking number.
 */
export function OrderStatusForm({ orderId, currentStatus, currentTracking }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(currentTracking);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft">
      <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider mb-4 font-semibold">Update Order</p>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Status select */}
        <div>
          <label className="font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-1.5 font-medium">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-[12px] font-body text-sm text-ink bg-surface/50 border border-brand outline-none focus:border-berry focus:bg-paper transition-all capitalize"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
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
          className="px-6 py-2.5 bg-berry text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
