import { BrandLoader } from "@/components/ui/BrandLoader";

export default function OrdersLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header with pulsing logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-52 bg-ink/10 rounded-lg" />
          <div className="h-4 w-40 bg-ink/5 rounded-md" />
        </div>
        <div className="shrink-0 flex items-center justify-center">
          <BrandLoader size="sm" text="Loading orders…" />
        </div>
      </div>

      {/* Filter pills skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-paper border border-brand shrink-0" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-[18px] bg-paper border border-brand overflow-hidden shadow-soft animate-pulse">
        <div className="h-12 bg-surface border-b border-brand" />
        <div className="divide-y divide-brand/60">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 px-5 flex items-center justify-between gap-4">
              <div className="h-4 w-24 bg-ink/10 rounded" />
              <div className="h-4 w-32 bg-ink/10 rounded" />
              <div className="h-4 w-16 bg-ink/5 rounded" />
              <div className="h-4 w-20 bg-ink/10 rounded" />
              <div className="h-6 w-20 bg-ink/10 rounded-full" />
              <div className="h-4 w-24 bg-ink/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
