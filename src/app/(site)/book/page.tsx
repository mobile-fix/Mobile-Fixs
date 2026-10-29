import type { Metadata } from "next";
import { Suspense } from "react";

import { BookingWizard } from "@/components/booking/BookingWizard";
import { Icon } from "@/components/icons";
import { LoadingBlock } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Book a Phone Repair",
  description:
    "Book a phone repair in six steps: choose your device and fault, pick how you want it repaired, and confirm your slot.",
  path: "/book",
  // A booking form has no search value and its URLs are user-specific.
  noindex: true,
});

export default function BookPage() {
  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Book a repair" }]} />

        <div className="mt-6 max-w-2xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Book your repair
          </h1>
          <p className="mt-3 text-lg text-ink-muted">
            Six short steps. We confirm the cost with you before any work, and nothing is charged
            until the repair is done.
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-subtle">
            <Icon name="lock" size={14} />
            Your details are used only to complete this repair.
          </p>
        </div>

        <div className="mt-10">
          {/* useSearchParams needs a Suspense boundary so the shell can stream. */}
          <Suspense fallback={<LoadingBlock label="Loading booking form" className="max-w-2xl" />}>
            <BookingWizard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
