"use client";

import { useEffect, useState } from "react";

function formatDispatchDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * DispatchNotice — fetches next dispatch dates from /api/dispatch-dates
 * and shows an amber notice box on the checkout page.
 */
export function DispatchNotice() {
  const [dates, setDates] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/dispatch-dates")
      .then((r) => r.json())
      .then((body: { dates: string[] }) => {
        if (body.dates?.length > 0) {
          setDates(body.dates);
          setTimeout(() => setVisible(true), 80);
        }
      })
      .catch(() => {/* silently fail */});
  }, []);

  if (dates.length === 0) return null;

  const [next, after] = dates;

  return (
    <div
      className={`rounded-[14px] border border-amber-200/80 bg-amber-50/70 px-4 py-3 flex items-start gap-3 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      <span className="text-base mt-0.5 shrink-0">📦</span>
      <div className="min-w-0">
        <p className="font-label text-[11px] text-amber-900 font-semibold uppercase tracking-wider">
          Estimated Dispatch
        </p>
        <p className="font-body text-xs text-amber-800 mt-0.5 leading-relaxed">
          Orders placed now will be dispatched on{" "}
          <strong className="font-semibold">{formatDispatchDate(next)}</strong>.
          {after && (
            <>
              {" "}Next batch: <strong className="font-semibold">{formatDispatchDate(after)}</strong>.
            </>
          )}
        </p>
        <p className="font-body text-[10.5px] text-amber-700/55 mt-1">
          Delivery takes 3–7 days after dispatch.
        </p>
      </div>
    </div>
  );
}

