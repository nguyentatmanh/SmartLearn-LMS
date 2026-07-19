export default function LoadingSkeleton({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'row' }) {
  if (type === 'row') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border overflow-hidden">
          <div className="aspect-[16/9] bg-muted/50 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
            <div className="h-5 w-3/4 bg-muted/60 rounded animate-pulse" />
            <div className="h-3 w-full bg-muted/40 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
