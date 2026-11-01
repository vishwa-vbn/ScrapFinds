interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700/60 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm flex flex-col">
      <div className="aspect-[4/3] w-full bg-gray-200 dark:bg-gray-700/60 animate-pulse" />
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
