import type { Metadata } from "next";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PriceExplorer } from "@/components/pricing/PriceExplorer";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Card, LoadingBlock } from "@/components/ui/primitives";
import { PART_GRADES, PART_GRADE_META } from "@/lib/constants";
import { listBrands, listServices } from "@/server/services/catalog.service";

export const metadata: Metadata = {
  title: "Repair Prices — Search Every Device & Service",
  description:
    "Search our full repair price list. Filter by brand, device and repair type for the exact price, repair time and warranty on every job.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Mobile Repair Prices | MyMobiFix",
    description:
      "The complete price book — every device, every repair, every part grade. No forms, no callbacks.",
  },
};

export const revalidate = 300;

export default async function PricingPage() {
  const [brands, services] = await Promise.all([listBrands(), listServices()]);

  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Pricing" }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Repair prices
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Our entire price book, in the open. Search {brands.length} brands and{" "}
            {services.length} repair types to find your exact price, repair time and warranty — no
            form, no callback, no haggling.
          </p>
        </header>

        {/* Part-grade explainer: the thing customers most need to understand
            before a price list makes sense. */}
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {PART_GRADES.map((grade) => {
            const meta = PART_GRADE_META[grade];
            return (
              <li key={grade} className="rounded-xl border border-line bg-surface p-4">
                <h2 className="font-display text-sm font-bold text-ink">{meta.label}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{meta.description}</p>
              </li>
            );
          })}
        </ul>

        <div className="mt-10">
          <Suspense fallback={<LoadingBlock label="Loading price list" />}>
            <PriceExplorer brands={brands} services={services} />
          </Suspense>
        </div>

        {/* Fallback for unlisted devices */}
        <Card className="mt-14 overflow-hidden">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300">
                <Icon name="search" size={23} />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-ink">
                Cannot find your device?
              </h2>
              <p className="measure mt-2 text-ink-muted">
                We repair far more devices than we have listed prices for. Tell us the model and the
                fault and we will price it manually, usually within one business day — or book a free
                diagnostic and we will identify it for you.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-4">
              <ButtonLink href="/contact" size="lg" fullWidth iconRight="arrow-right">
                Contact support
              </ButtonLink>
              <ButtonLink href="/book" variant="outline" size="lg" fullWidth iconLeft="diagnostic">
                Book a free diagnostic
              </ButtonLink>
            </div>
          </div>
        </Card>

        {/* Pricing promises */}
        <section className="mt-14" aria-labelledby="pricing-promise">
          <h2 id="pricing-promise" className="font-display text-xl font-bold text-ink">
            How our pricing works
          </h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "tag" as const,
                title: "The listed price is the price",
                body: "The quote you get online comes from the same pricing engine that produces your bill.",
              },
              {
                icon: "diagnostic" as const,
                title: "Confirmed after diagnosis",
                body: "If the fault turns out to be different, we tell you the revised price before starting.",
              },
              {
                icon: "truck" as const,
                title: "Doorstep fees shown separately",
                body: "Pickup and at-home fees are itemised in your quote, never folded into the repair price.",
              },
              {
                icon: "lock" as const,
                title: "Pay after the repair",
                body: "Nothing is charged up front. If we cannot fix it, you pay nothing at all.",
              },
            ].map((item) => (
              <li key={item.title} className="rounded-xl border border-line bg-surface p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                  <Icon name={item.icon} size={19} />
                </span>
                <h3 className="mt-3.5 font-display text-base font-bold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
