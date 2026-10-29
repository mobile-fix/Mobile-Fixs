import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Icon, serviceIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Disclosure";
import { Card } from "@/components/ui/primitives";
import {
  BRANDS_WITH_LOGO,
  brandTitle,
  getBrandContent,
  hasBrandLandingPage,
} from "@/lib/brand-content";
import { siteConfig, whatsappChatHref } from "@/lib/config";
import { pageMetadata, truncate } from "@/lib/seo";
import { areaServed, businessRef } from "@/lib/structured-data";
import { listBrands, listModels, listServices } from "@/server/services/catalog.service";

export const revalidate = 600;

/** Pre-render a page for every brand that has one — the set is small and fixed. */
export async function generateStaticParams() {
  const brands = await listBrands();
  return brands.filter((brand) => hasBrandLandingPage(brand.slug)).map((brand) => ({ brand: brand.slug }));
}

/** One lookup shared by generateMetadata and the page within a single request. */
const loadBrand = cache(async (slug: string) => {
  if (!hasBrandLandingPage(slug)) return null;
  const brands = await listBrands();
  return brands.find((entry) => entry.slug === slug) ?? null;
});

/** "iPhone repair" / "Samsung phone repair" — never "iPhone phone repair". */
function serviceName(displayName: string) {
  return /phone/i.test(displayName) ? `${displayName} repair` : `${displayName} phone repair`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: slug } = await params;
  const brand = await loadBrand(slug);
  if (!brand) return { title: "Brand not found", robots: { index: false, follow: false } };

  const content = getBrandContent(brand.slug, brand.name);

  return pageMetadata({
    title: brandTitle(content),
    description: truncate(
      `${content.displayName} repair at your doorstep with pickup and drop, or in store. Screen, battery, charging port and water damage fixes. Get a quote on WhatsApp.`,
    ),
    path: `/repair/${brand.slug}`,
  });
}

export default async function BrandRepairPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: slug } = await params;
  const brand = await loadBrand(slug);
  if (!brand) notFound();

  const [models, services, allBrands] = await Promise.all([
    listModels({ brandSlug: brand.slug, limit: 100 }),
    listServices(),
    listBrands(),
  ]);

  const content = getBrandContent(brand.slug, brand.name);
  const name = serviceName(content.displayName);
  const otherBrands = allBrands.filter(
    (entry) => entry.slug !== brand.slug && hasBrandLandingPage(entry.slug),
  );

  const whatsappHref = whatsappChatHref(
    `Hi MyMobiFix, I need a repair for my ${content.displayName} phone. Model: `,
  );

  const serviceSchema = {
    "@type": "Service",
    name,
    serviceType: "Mobile Phone Repair",
    description: truncate(content.intro.join(" "), 300),
    url: `${siteConfig.url}/repair/${brand.slug}`,
    provider: businessRef,
    areaServed: areaServed(),
  };

  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />

      <div className="container-page">
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: "/repair", label: "Repair" },
            { label: content.displayName },
          ]}
        />

        <header className="mt-6 max-w-3xl">
          {brand.logoKey && BRANDS_WITH_LOGO.has(brand.logoKey) ? (
            <span className="flex h-16 w-28 items-center justify-center rounded-2xl border border-line bg-white p-3">
              <img
                src={`/logos/${brand.logoKey}.svg`}
                alt=""
                width={110}
                height={32}
                decoding="async"
                className="h-7 w-auto max-w-full object-contain"
              />
            </span>
          ) : null}
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {content.displayName} repair, at your door or in store
          </h1>

          <div className="measure mt-4 space-y-3 text-lg leading-relaxed text-ink-muted">
            {content.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={whatsappHref} external size="lg" iconLeft="whatsapp">
              Get a quote on WhatsApp
            </ButtonLink>
            <ButtonLink href="/book" variant="outline" size="lg" iconRight="arrow-right">
              Book a repair
            </ButtonLink>
          </div>
          <p className="mt-3 text-sm text-ink-subtle">
            Visit our store, or have us collect and return your phone. Send your model and the
            problem and we reply with a quote.
          </p>
        </header>

        {/* Models */}
        {models.length > 0 ? (
          <section className="mt-14" aria-labelledby="models-heading">
            <h2 id="models-heading" className="font-display text-2xl font-bold text-ink">
              {content.displayName} models we repair
            </h2>
            <p className="measure mt-2 text-ink-muted">
              Pick your model to start a booking. If yours is not listed, message us on WhatsApp
              and we will tell you whether we can help.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((model) => (
                <li key={model.id}>
                  <Link
                    href={`/book?model=${encodeURIComponent(model.id)}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand-400 hover:bg-brand-50 dark:hover:border-brand-500 dark:hover:bg-brand-950/60"
                  >
                    <span>
                      <span className="block font-display text-base font-bold text-ink">
                        {model.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-subtle">
                        {model.releaseYear} · Book a repair
                      </span>
                    </span>
                    <Icon
                      name="chevron-right"
                      size={16}
                      className="shrink-0 text-ink-subtle transition-colors group-hover:text-brand-700 dark:group-hover:text-accent-300"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Services */}
        {services.length > 0 ? (
          <section className="mt-14" aria-labelledby="services-heading">
            <h2 id="services-heading" className="font-display text-2xl font-bold text-ink">
              {content.displayName} repairs we do
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card as="li" key={service.id} interactive className="group flex flex-col p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white dark:bg-brand-950/70 dark:text-brand-300">
                    <Icon name={serviceIcon(service.iconKey)} size={21} />
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold text-ink">
                    <Link
                      href={`/services/${service.slug}`}
                      className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {content.displayName} {service.name.toLowerCase()}
                    </Link>
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {service.shortDescription}
                  </p>
                </Card>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Common faults */}
        <section className="mt-14 max-w-3xl" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-2xl font-bold text-ink">
            {content.displayName} repair questions
          </h2>
          <Accordion
            className="mt-6"
            items={content.faqs.map((faq, index) => ({
              id: `faq-${index}`,
              question: faq.question,
              answer: <p className="text-sm leading-relaxed text-ink-muted">{faq.answer}</p>,
            }))}
          />
        </section>

        {/* Other brands — keeps every landing page two clicks from the others. */}
        {otherBrands.length > 0 ? (
          <nav className="mt-14" aria-label="Other brands we repair">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
              Other brands we repair
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {otherBrands.map((other) => (
                <li key={other.id}>
                  <Link
                    href={`/repair/${other.slug}`}
                    className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink-muted transition-colors hover:border-brand-400 hover:text-ink"
                  >
                    {other.name} repair
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <p className="mt-12 max-w-3xl border-t border-line pt-5 text-xs leading-relaxed text-ink-subtle">
          {content.trademarkName} is a trademark of its owner. MyMobiFix is an independent repair
          service and is not affiliated with or authorised by {content.trademarkName}.
        </p>
      </div>
    </div>
  );
}
