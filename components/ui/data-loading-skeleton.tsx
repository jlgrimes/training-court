import { Skeleton } from './skeleton';

export function DataLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex w-full flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8 w-48" aria-hidden="true" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-lg border p-4" aria-hidden="true">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}
