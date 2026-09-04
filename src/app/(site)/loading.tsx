import { Skeleton } from "@/components/ui/primitives";

/**
 * Route-level loading UI for the public site.
 *
 * Mirrors the usual page rhythm — heading, lede, content grid — so the layout
 * does not shift when the real content arrives.
 */
export default function SiteLoading() {
  return (
    <div className="container-page py-12" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading page</span>

      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-6 h-11 w-3/4 max-w-xl" />
      <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-5 w-2/3 max-w-xl" />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
