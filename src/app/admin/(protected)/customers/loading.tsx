export default function CustomersLoading() {
  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-64 bg-ink/10 rounded-lg" />
        <div className="h-4 w-96 bg-ink/5 rounded-md" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-[18px] bg-paper border border-brand p-5 shadow-soft space-y-3">
            <div className="h-3 w-24 bg-ink/10 rounded" />
            <div className="h-7 w-20 bg-ink/15 rounded" />
            <div className="h-3 w-32 bg-ink/5 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-paper p-5 rounded-[20px] border border-brand shadow-soft space-y-4">
        <div className="h-10 w-full sm:w-80 bg-surface rounded-[12px]" />
        <div className="divide-y divide-brand/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-ink/10" />
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-ink/10 rounded" />
                  <div className="h-3 w-20 bg-ink/5 rounded" />
                </div>
              </div>
              <div className="h-4 w-36 bg-ink/5 rounded" />
              <div className="h-6 w-16 bg-ink/10 rounded-full" />
              <div className="h-4 w-20 bg-ink/10 rounded" />
              <div className="h-4 w-24 bg-ink/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
