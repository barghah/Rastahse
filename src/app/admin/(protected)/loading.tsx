import { BrandLoader } from "@/components/ui/BrandLoader";

export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Centered Pulsing Logo */}
      <div className="flex flex-col items-center justify-center py-8">
        <BrandLoader size="md" showWordmark={true} text="Syncing atelier archive…" />
      </div>

      {/* Metric / Filter cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-[18px] bg-paper border border-brand p-5 space-y-3 shadow-soft"
          >
            <div className="h-3 w-20 bg-ink/10 rounded" />
            <div className="h-6 w-28 bg-ink/15 rounded" />
          </div>
        ))}
      </div>

      {/* Content table skeleton */}
      <div className="rounded-[18px] bg-paper border border-brand p-6 shadow-soft space-y-4 animate-pulse">
        <div className="h-10 w-full bg-surface rounded-[12px]" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 w-full rounded-[14px] bg-surface/60 border border-brand/50 flex items-center px-4 gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-ink/10 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-40 bg-ink/10 rounded" />
              <div className="h-3 w-24 bg-ink/5 rounded" />
            </div>
            <div className="h-8 w-20 bg-ink/5 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
