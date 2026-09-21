export default function AdminLoading() {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-ink/10 rounded-lg" />
        <div className="h-4 w-72 bg-ink/5 rounded-md" />
      </div>

      {/* Metric / Filter cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Content table / list skeleton */}
      <div className="rounded-[18px] bg-paper border border-brand p-6 shadow-soft space-y-4">
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
