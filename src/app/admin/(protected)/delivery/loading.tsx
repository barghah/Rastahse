export default function DeliveryLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl animate-pulse">
      <div className="h-7 w-48 rounded-[10px] bg-ink/8" />
      <div className="h-4 w-72 rounded-[8px] bg-ink/6" />

      <div className="bg-paper rounded-[20px] border border-brand p-5 space-y-4">
        <div className="h-5 w-40 rounded-[8px] bg-ink/8" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-14 h-14 rounded-[12px] bg-ink/6" />
          ))}
        </div>
      </div>

      <div className="bg-paper rounded-[20px] border border-brand overflow-hidden">
        <div className="px-5 py-4 border-b border-brand bg-surface/40">
          <div className="h-5 w-56 rounded-[8px] bg-ink/8" />
        </div>
        <div className="divide-y divide-brand/50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-24 rounded-[6px] bg-ink/8" />
              <div className="h-4 w-32 rounded-[6px] bg-ink/6" />
              <div className="h-4 w-48 rounded-[6px] bg-ink/5" />
              <div className="h-4 w-20 rounded-[6px] bg-ink/6 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
