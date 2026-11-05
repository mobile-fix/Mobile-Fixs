import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icons";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { NotASupportLine } from "@/components/site/NotASupportLine";
import { ServicePromises } from "@/components/site/ServicePromises";
import { ButtonLink } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Disclosure";
import { BUSINESS, businessTelHref, fullAddress } from "@/config/business";
import { CITIES, CITY_SLUGS, DEVICE_GRID, PARTS, type PartKey } from "@/lib/city-pages";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { areaServed, businessRef } from "@/lib/structured-data";

/**
 * Shared template for /screen-repair/[city], /battery-repair/[city] and
 * /phone-repair/[city]. Each route file is three lines that pick a part.
 *
 * Only cities listed in CITIES render; any other slug is a 404 (the routes set
 * `dynamicParams = false`), so no thin page exists for a city we do not serve.
 */

export function cityStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

export function cityMetadata(partKey: PartKey, citySlug: string): Metadata {
  const city = CITIES[citySlug];
  const part = PARTS[partKey];
  if (!city) return { title: "Not found", robots: { index: false, follow: false } };

  // "Phone part" → "Phone Part" in the title; the H1 keeps sentence case.
  const titlePart = part.part.replace(/\b\w/g, (letter) => letter.toUpperCase());

  return pageMetadata({
    title: `${titlePart} Replacement in ${city.name} | Doorstep, Same Day | ${siteConfig.name}`,
    absoluteTitle: true,
    description: part.metaDescription,
    path: `/${part.routeSegment}/${city.slug}`,
  });
}

export function CityPartPage({ partKey, citySlug }: { partKey: PartKey; citySlug: string }) {
  const city = CITIES[citySlug];
  if (!city) notFound();
  const part = PARTS[partKey];
  const path = `/${part.routeSegment}/${city.slug}`;
  const heading = `${part.part} replacement in ${city.name} — at your door`;

  const serviceSchema = {
    "@type": "Service",
    name: `${part.part} replacement in ${city.name}`,
    serviceType: part.serviceType,
    description: part.intro[0],
    url: `${siteConfig.url}${path}`,
    provider: businessRef,
    areaServed: areaServed(),
  };

  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: part.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  // The LocalBusiness entity itself is emitted by the site layout on every
  // page; the Service here points at it through `provider: { @id }`.
  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <JsonLd data={{ "@graph": [serviceSchema, faqSchema] }} />

      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: heading }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {heading}
          </h1>
          <div className="measure mt-4 space-y-3 text-lg leading-relaxed text-ink-muted">
            {part.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/book" size="lg" iconRight="arrow-right">
              Book a repair
            </ButtonLink>
            <ButtonLink href={businessTelHref} variant="outline" size="lg" iconLeft="phone">
              Call {BUSINESS.phone}
            </ButtonLink>
          </div>
        </header>

        {/* Price, time, warranty */}
        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: "tag" as const, label: "Price", value: part.priceBand, note: "Firm price for your exact model, agreed before anything is opened." },
            { icon: "clock" as const, label: "Turnaround", value: part.turnaround, note: null },
            { icon: "shield-check" as const, label: "Warranty", value: part.warranty, note: null },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-line bg-surface p-5">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-subtle">
                <Icon name={item.icon} size={14} />
                {item.label}
              </dt>
              <dd className="mt-2 font-display text-lg font-bold leading-snug text-ink">{item.value}</dd>
              {item.note ? <dd className="mt-1 text-sm text-ink-muted">{item.note}</dd> : null}
            </div>
          ))}
        </dl>

        <ServicePromises className="mt-8" />

        <NotASupportLine className="mt-14" />

        {/* Device grid */}
        <section className="mt-14" aria-labelledby="devices-heading">
          <h2 id="devices-heading" className="font-display text-2xl font-bold text-ink">
            Phones we work on in {city.name}
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {DEVICE_GRID.map((brand) => (
              <li key={brand.slug}>
                <Link
                  href={`/repair/${brand.slug}`}
                  className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-surface p-3 text-sm font-semibold text-ink transition-colors hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/60"
                >
                  {brand.logo ? (
                    <img
                      src={`/logos/${brand.slug}.svg`}
                      alt=""
                      width={80}
                      height={24}
                      decoding="async"
                      loading="lazy"
                      className="h-5 w-auto max-w-full object-contain dark:invert"
                    />
                  ) : null}
                  {brand.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {part.serviceLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-semibold text-brand-700 underline-offset-4 hover:underline dark:text-accent-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Where and when */}
        <section className="mt-14 grid gap-6 lg:grid-cols-2" aria-labelledby="area-heading">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 id="area-heading" className="font-display text-xl font-bold text-ink">
              Areas we cover
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {BUSINESS.serviceAreas.map((area) => (
                <li
                  key={area}
                  className="rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-ink-muted"
                >
                  {area}
                </li>
              ))}
              <li className="rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-ink-muted">
                Rest of Delhi NCR
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-xl font-bold text-ink">{BUSINESS.tradingName}</h2>
            <address className="mt-3 space-y-1.5 text-sm not-italic leading-relaxed text-ink-muted">
              <span className="block">{BUSINESS.legalName}</span>
              <span className="block">{fullAddress}</span>
              <span className="block">{BUSINESS.hours}</span>
              <span className="block">
                <a href={businessTelHref} className="font-semibold text-ink hover:underline">
                  {BUSINESS.phone}
                </a>
              </span>
            </address>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="/book" size="md" iconRight="arrow-right">
                Book a repair
              </ButtonLink>
              <ButtonLink href={businessTelHref} variant="outline" size="md" iconLeft="phone">
                Call
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-14 max-w-3xl" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-2xl font-bold text-ink">
            {part.part} replacement questions
          </h2>
          <Accordion
            className="mt-6"
            items={part.faqs.map((faq, index) => ({
              id: `faq-${index}`,
              question: faq.question,
              answer: <p className="text-sm leading-relaxed text-ink-muted">{faq.answer}</p>,
            }))}
          />
        </section>
      </div>
    </div>
  );
}
