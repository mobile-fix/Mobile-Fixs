import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Icon, serviceIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { formatDurationRange, formatWarranty } from "@/lib/money";
import { siteConfig, whatsappChatHref } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { areaServed, businessRef } from "@/lib/structured-data";
import { listServices } from "@/server/services/catalog.service";
import { JsonLd } from "@/components/site/JsonLd";

export const metadata: Metadata = pageMetadata({
  title: "Phone Repair Services — Screen, Battery, Charging & More",
  description:
    "Every phone repair we do — screen, battery, charging port, camera, speaker, water damage and software — with repair times and warranty. Quote on WhatsApp.",
  path: "/services",
});

export const revalidate = 300;

export default async function ServicesPage() {
  const services = await listServices();

  const structuredData = {
    "@type": "ItemList",
    name: "Mobile phone repair services",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: service.name,
        description: service.shortDescription,
        url: `${siteConfig.url}/services/${service.slug}`,
        serviceType: "Mobile Phone Repair",
        provider: businessRef,
        areaServed: areaServed(),
      },
    })),
  };

  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <JsonLd data={structuredData} />

      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Services" }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Mobile repair services
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Every repair we do, with how long it takes and how long it is covered. The cost depends
            on your phone — message us on WhatsApp with your model and the problem, and we will tell
            you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={whatsappChatHref()} external size="lg" iconLeft="whatsapp">
              Get a quote on WhatsApp
            </ButtonLink>
            <ButtonLink href="/book" variant="outline" size="lg" iconRight="arrow-right">
              Book a Repair
            </ButtonLink>
          </div>
        </header>

        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            return (
              <Card as="li" key={service.id} interactive className="group flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white dark:bg-brand-950/70 dark:text-brand-300">
                    <Icon name={serviceIcon(service.iconKey)} size={23} />
                  </span>
                </div>

                <h2 className="mt-4 font-display text-lg font-bold text-ink">
                  <Link
                    href={`/services/${service.slug}`}
                    className="after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    {service.name}
                  </Link>
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {service.shortDescription}
                </p>

                {service.symptoms.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                      Common symptoms
                    </p>
                    <ul className="mt-2 space-y-1">
                      {service.symptoms.slice(0, 3).map((symptom) => (
                        <li key={symptom} className="flex items-start gap-2 text-sm text-ink-muted">
                          <Icon
                            name="check"
                            size={13}
                            className="mt-1 shrink-0 text-brand-600 dark:text-brand-400"
                          />
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <dl className="mt-auto flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line pt-4 text-xs">
                  <div className="flex items-center gap-1.5 text-ink-subtle">
                    <Icon name="clock" size={12} />
                    <dt className="sr-only">Repair time</dt>
                    <dd>{formatDurationRange(service.defaultDurationMinutes)}</dd>
                  </div>
                  <div className="flex items-center gap-1.5 text-ink-subtle">
                    <Icon name="shield-check" size={12} />
                    <dt className="sr-only">Warranty</dt>
                    <dd>{formatWarranty(service.defaultWarrantyMonths)}</dd>
                  </div>
                </dl>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors group-hover:text-brand-800 dark:text-accent-300">
                  View details
                  <Icon name="arrow-right" size={14} />
                </span>
              </Card>
            );
          })}
        </ul>

        {/* Reassurance band */}
        <section className="mt-16" aria-labelledby="promise-heading">
          <SectionHeading
            eyebrow="Our promise"
            title={<span id="promise-heading">The same rules on every repair</span>}
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "diagnostic" as const,
                title: "Free diagnosis",
                body: "Always, whether or not you go ahead with the repair.",
              },
              {
                icon: "tag" as const,
                title: "Quote before work",
                body: "We never open a device before you have approved the cost.",
              },
              {
                icon: "shield-check" as const,
                title: "Warranty included",
                body: "3 to 12 months depending on the part grade you choose.",
              },
              {
                icon: "lock" as const,
                title: "No fix, no fee",
                body: "If we cannot repair it, you pay nothing at all.",
              },
            ].map((item) => (
              <li key={item.title} className="rounded-xl border border-line bg-surface p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300">
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
