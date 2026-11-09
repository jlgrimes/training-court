import { Skeleton } from "@/components/ui/skeleton";

// Mirrors TournamentContainerClient's layout so the page doesn't jump when the data arrives.
export function TournamentPageSkeleton() {
  return (
    <div aria-busy="true" className="w-full flex justify-center px-4 sm:px-8">
      <div className="w-full max-w-xl flex flex-col flex-1 gap-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-7 w-12" />
        </div>
        <div className="flex flex-col gap-1 mt-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
