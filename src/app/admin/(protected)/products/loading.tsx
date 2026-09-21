export default function ProductsLoading() {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-56 bg-ink/10 rounded-lg" />
        <div className="h-4 w-64 bg-ink/5 rounded-md" />
      </div>

      {/* Search & Filter Bar skeleton */}
      <div className="bg-paper p-5 rounded-[20px] border border-brand shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 flex-1 bg-surface rounded-[12px]" />
          <div className="h-10 w-48 bg-surface rounded-[12px]" />
        </div>
        <div className="flex gap-2 pt-1 border-t border-brand/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-surface" />
          ))}
        </div>
      </div>

      {/* Product Cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 rounded-[18px] bg-paper border border-brand p-5 flex items-center justify-between gap-4 shadow-soft"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-[12px] bg-ink/10 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-44 bg-ink/10 rounded" />
                <div className="h-3 w-28 bg-ink/5 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 rounded-[10px] bg-surface" />
              <div className="h-8 w-20 rounded-[10px] bg-surface" />
              <div className="h-8 w-16 rounded-[10px] bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
