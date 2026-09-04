import { Skeleton } from "@/components/ui/primitives";

/** Loading UI for admin pages — matches the header + stats + table rhythm. */
export default function AdminLoading() {
  return (
    <div className="space-y-8" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>

      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
