import type { Metadata } from "next";

import { Icon } from "@/components/icons";
import { AreaMap } from "@/components/site/AreaMap";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import {
  AREA_LINE,
  BUSINESS,
  NO_COUNTER_LINE,
  businessTelHref,
} from "@/config/business";
import { whatsappChatHref } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Where We Cover in West Delhi — Doorstep Phone Repair Area",
  description:
    "MyMobiFix works from Paschim Vihar, Delhi 110045 and covers PIN codes 110045, 110041, 110063 and 110087 and the rest of West Delhi. No walk-in shop — at-home visits or free pickup.",
  path: "/service-area",
});

/**
 * Coverage page. PIN codes and named areas are shown as two separate lists,
 * deliberately not grouped against each other: the owner has not mapped which
 * area sits under which PIN, and a guessed grouping would be wrong somewhere.
 */
export default function ServiceAreaPage() {
  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Service area" }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Where we cover in {BUSINESS.region}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{AREA_LINE}</p>
          <p className="mt-3 leading-relaxed text-ink-muted">{NO_COUNTER_LINE}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/book" size="lg" iconRight="arrow-right">
              Book a repair
            </ButtonLink>
            <ButtonLink
              href={whatsappChatHref("Hi MyMobiFix, do you cover my area? My PIN code is ")}
              external
              variant="outline"
              size="md"
              iconLeft="whatsapp"
            >
              WhatsApp
            </ButtonLink>
          </div>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-3" aria-label="Coverage">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-bold text-ink">PIN codes we cover</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {BUSINESS.servicePins.map((pin) => (
                <li
                  key={pin}
                  className="tabular rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-ink"
                >
                  {pin}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-muted">
              And the rest of {BUSINESS.region}. Outside these? Message us your PIN code and we will
              tell you straight away whether we can reach you.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-bold text-ink">Areas we cover</h2>
            <ul className="mt-4 space-y-2">
              {BUSINESS.serviceAreas.map((area) => (
                <li key={area} className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Icon name="map-pin" size={15} className="text-brand-600 dark:text-accent-400" />
                  {area}
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm text-ink-muted">
                <Icon name="map-pin" size={15} className="text-ink-subtle" />
                Rest of {BUSINESS.region}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-bold text-ink">When we come out</h2>
            <p className="mt-4 text-sm font-semibold text-ink">{BUSINESS.hours}</p>
            <p className="mt-1 text-sm text-ink-muted">Closed on Sundays. Book a two-hour slot.</p>
            <a
              href={businessTelHref}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline dark:text-accent-300"
            >
              <Icon name="phone" size={15} />
              {BUSINESS.phone}
            </a>
          </div>
        </section>

        <AreaMap className="mt-10" />

        <section className="mt-12 text-center">
          <h2 className="font-display text-2xl font-bold text-ink">In the area? Book a slot</h2>
          <p className="measure mx-auto mt-2 text-ink-muted">
            A technician comes to your home or office, or we collect the phone and bring it back.
            Both are free.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/book" size="lg" iconRight="arrow-right">
              Book a repair
            </ButtonLink>
            <ButtonLink href={whatsappChatHref()} external variant="outline" size="md" iconLeft="whatsapp">
              WhatsApp
            </ButtonLink>
          </div>
        </section>
      </div>
    </div>
  );
}
