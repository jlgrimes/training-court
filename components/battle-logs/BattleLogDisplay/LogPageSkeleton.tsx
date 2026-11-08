import { Skeleton } from "@/components/ui/skeleton";

// Mirrors LogPageClient's layout so the page doesn't jump when the log arrives.
export function LogPageSkeleton() {
  return (
    <div aria-busy="true" className="flex-1 flex flex-col w-full h-full sm:max-w-2xl mx-auto gap-2 p-4">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-evenly w-full">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-36" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="flex flex-col gap-4 mt-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
