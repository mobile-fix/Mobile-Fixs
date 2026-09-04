import type { Metadata } from "next";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { TrackForm } from "@/components/track/TrackForm";
import { LoadingBlock } from "@/components/ui/primitives";
import { STATUS_FLOW, STATUS_META } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Track Your Repair",
  description:
    "Check your repair status live. Enter your repair ID and phone number to see every stage from booking received through diagnosis to ready for collection.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Track repair" }]} />

        <div className="mt-6 max-w-2xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Track your repair
          </h1>
          <p className="mt-3 text-lg text-ink-muted">
            No app, no account, no chasing anyone for an update. Your repair ID and phone number show
            you exactly where your device is.
          </p>
        </div>

        <div className="mt-10">
          <Suspense fallback={<LoadingBlock label="Loading tracker" className="max-w-md" />}>
            <TrackForm />
          </Suspense>
        </div>

        {/* Stage reference — useful context and good for search intent. */}
        <section className="mt-16 border-t border-line pt-10" aria-labelledby="stages-heading">
          <h2 id="stages-heading" className="font-display text-xl font-bold text-ink">
            What each stage means
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_FLOW.map((status, index) => (
              <li key={status} className="rounded-xl border border-line bg-surface p-4">
                <span className="tabular text-xs font-bold text-ink-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 font-display text-sm font-bold text-ink">
                  {STATUS_META[status].label}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {STATUS_META[status].description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
