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
      try {
        await updateOrderStatus(orderId, status, tracking);
        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update order.");
      }
    });
  }

  return (
    <div
      className="rounded-[14px] p-6 border"
      style={{ backgroundColor: "#1c1917", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <p className="font-label text-[10px] text-white/30 uppercase tracking-wider mb-4">Update Order</p>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Status select */}
        <div>
          <label className="font-label text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-3 rounded-[10px] font-body text-sm text-white/80 bg-white/5 border border-white/10 outline-none focus:border-white/25 transition-colors capitalize"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-[#1c1917] capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Tracking number */}
        <div>
          <label className="font-label text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">
            Tracking Number <span className="text-white/20 normal-case">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. SR1234567890"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            className="w-full px-3 py-3 rounded-[10px] font-body text-sm text-white/80 bg-white/5 border border-white/10 outline-none focus:border-white/25 placeholder:text-white/20 transition-colors"
          />
        </div>

        {success && (
          <p className="font-body text-xs text-emerald-400">✓ Order updated successfully.</p>
        )}
        {error && (
          <p className="font-body text-xs text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-berry text-paper font-label text-[10px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all duration-200 active:scale-[0.98]"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
