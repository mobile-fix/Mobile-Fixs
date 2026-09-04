import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Icon, serviceIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/primitives";
import { PART_GRADES, PART_GRADE_META, SERVICE_TYPES, SERVICE_TYPE_META } from "@/lib/constants";
import { formatDurationRange, formatMoney, formatWarranty } from "@/lib/money";
import { siteConfig } from "@/lib/config";
import { getServiceBySlug, listServices } from "@/server/services/catalog.service";
import { listPrices } from "@/server/services/catalog.service";
import { NotFoundError } from "@/lib/errors";


export const revalidate = 600;

/** Pre-render every service page at build time — they are a fixed, small set. */
export async function generateStaticParams() {
  const services = await listServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const service = await getServiceBySlug(slug);
    return {
      title: `${service.name} — Price, Time & Warranty`,
      description: `${service.shortDescription} ${service.description.slice(0, 110)}…`.slice(0, 158),
      alternates: { canonical: `/services/${service.slug}` },
      openGraph: {
        title: `${service.name} | MyMobiFix`,
        description: service.shortDescription,
        url: `${siteConfig.url}/services/${service.slug}`,
      },
    };
  } catch {
    return { title: "Service not found" };
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let service;
  try {
    service = await getServiceBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [allServices, priceSample] = await Promise.all([
    listServices(),
    listPrices({ serviceSlug: slug, page: 1, pageSize: 12 }),
  ]);

  // getServiceBySlug already decodes the JSON symptom list.
  const symptoms = service.symptoms;
  const relatedServices = allServices.filter((entry) => entry.slug !== slug).slice(0, 4);

  const prices = priceSample.items.map((item) => item.price).filter((price) => price > 0);
  const fromPrice = prices.length > 0 ? Math.min(...prices) : null;

  // A representative sample of devices, cheapest first, so the page shows real
  // numbers rather than a vague "prices vary".
  const samples = [...priceSample.items]
    .filter((item) => item.partGrade === "PREMIUM")
    .sort((a, b) => a.price - b.price)
    .slice(0, 8);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    serviceType: "Mobile Phone Repair",
    url: `${siteConfig.url}/services/${service.slug}`,
    provider: { "@type": "LocalBusiness", name: siteConfig.name, url: siteConfig.url },
    areaServed: { "@type": "Country", name: "India" },
    ...(fromPrice
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: fromPrice,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };

  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="container-page">
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: "/services", label: "Services" },
            { label: service.name },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Main */}
          <div className="lg:col-span-8">
            <header>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                <Icon name={serviceIcon(service.iconKey)} size={27} />
              </span>
              <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {service.name}
              </h1>
              <p className="measure mt-3 text-lg text-ink-muted">{service.shortDescription}</p>
            </header>

            <div className="measure mt-8 text-base leading-relaxed text-ink-muted">
              <p>{service.description}</p>
            </div>

            {symptoms.length > 0 ? (
              <section className="mt-10" aria-labelledby="symptoms-heading">
                <h2 id="symptoms-heading" className="font-display text-xl font-bold text-ink">
                  Signs you need this repair
                </h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {symptoms.map((symptom) => (
                    <li
                      key={symptom}
                      className="flex items-start gap-2.5 rounded-lg border border-line bg-surface p-3.5"
                    >
                      <Icon
                        name="alert-circle"
                        size={16}
                        className="mt-0.5 shrink-0 text-warning-600 dark:text-warning-500"
                      />
                      <span className="text-sm text-ink">{symptom}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Part grades */}
            <section className="mt-12" aria-labelledby="grades-heading">
              <h2 id="grades-heading" className="font-display text-xl font-bold text-ink">
                Choose your part quality
              </h2>
              <p className="measure mt-2 text-ink-muted">
                We tell you exactly what the difference is, then let you decide — instead of quietly
                fitting the cheapest option.
              </p>
              <ul className="mt-5 grid gap-4 sm:grid-cols-3">
                {PART_GRADES.map((grade) => {
                  const meta = PART_GRADE_META[grade];
                  const warranty = Math.max(
                    0,
                    Math.min(24, service.defaultWarrantyMonths + meta.warrantyBonusMonths),
                  );
                  return (
                    <li key={grade} className="rounded-xl border border-line bg-surface p-4">
                      <h3 className="font-display text-sm font-bold text-ink">{meta.label}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                        {meta.description}
                      </p>
                      <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-xs font-semibold text-ink">
                        <Icon name="shield-check" size={13} />
                        {formatWarranty(warranty)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Sample prices */}
            {samples.length > 0 ? (
              <section className="mt-12" aria-labelledby="prices-heading">
                <h2 id="prices-heading" className="font-display text-xl font-bold text-ink">
                  {service.name} prices by device
                </h2>
                <p className="mt-2 text-ink-muted">
                  Premium-grade pricing on a sample of devices. Search the full price list for yours.
                </p>

                <div className="scroll-x mt-5 rounded-xl border border-line">
                  <table className="w-full min-w-[34rem] text-sm">
                    <caption className="sr-only">
                      {service.name} prices for a sample of devices
                    </caption>
                    <thead>
                      <tr className="border-b border-line bg-sunken text-left">
                        <th scope="col" className="px-4 py-3 font-semibold text-ink">
                          Device
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold text-ink">
                          Time
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold text-ink">
                          Warranty
                        </th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold text-ink">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {samples.map((item) => (
                        <tr key={item.id} className="transition-colors hover:bg-sunken">
                          <th scope="row" className="px-4 py-3 text-left font-medium text-ink">
                            {item.brandName} {item.modelName}
                          </th>
                          <td className="px-4 py-3 text-ink-muted">
                            {formatDurationRange(item.durationMinutes)}
                          </td>
                          <td className="px-4 py-3 text-ink-muted">
                            {formatWarranty(item.warrantyMonths)}
                          </td>
                          <td className="tabular px-4 py-3 text-right font-bold text-ink">
                            {item.price === 0 ? "Free" : formatMoney(item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-3 text-sm text-ink-subtle">
                  Showing {samples.length} of {priceSample.total} priced combinations.{" "}
                  <Link
                    href={`/pricing?service=${service.slug}`}
                    className="font-semibold text-brand-700 underline underline-offset-4 dark:text-accent-300"
                  >
                    See all {service.name.toLowerCase()} prices
                  </Link>
                  .
                </p>
              </section>
            ) : null}

            {/* Service options */}
            <section className="mt-12" aria-labelledby="options-heading">
              <h2 id="options-heading" className="font-display text-xl font-bold text-ink">
                How you can have it done
              </h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-3">
                {SERVICE_TYPES.map((type) => {
                  const meta = SERVICE_TYPE_META[type];
                  return (
                    <li key={type} className="rounded-xl border border-line bg-surface p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sunken text-ink-muted">
                        <Icon name={meta.iconKey as never} size={19} />
                      </span>
                      <h3 className="mt-3 font-display text-sm font-bold text-ink">{meta.label}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                        {meta.description}
                      </p>
                      <p className="mt-2.5 text-xs font-semibold text-brand-700 dark:text-accent-300">
                        {meta.defaultFee === 0
                          ? "No extra fee"
                          : `+${formatMoney(meta.defaultFee)} convenience fee`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Card className="overflow-hidden">
                <div className="border-b border-line bg-sunken px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                    {service.name}
                  </p>
                  <p className="tabular mt-1 font-display text-3xl font-bold text-ink">
                    {fromPrice === null
                      ? "On request"
                      : fromPrice === 0
                        ? "Free"
                        : `from ${formatMoney(fromPrice)}`}
                  </p>
                </div>

                <dl className="space-y-3 px-5 py-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-ink-muted">
                      <Icon name="clock" size={15} />
                      Repair time
                    </dt>
                    <dd className="font-semibold text-ink">
                      {formatDurationRange(service.defaultDurationMinutes)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-ink-muted">
                      <Icon name="shield-check" size={15} />
                      Warranty
                    </dt>
                    <dd className="font-semibold text-ink">
                      {formatWarranty(service.defaultWarrantyMonths)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-ink-muted">
                      <Icon name="check-circle" size={15} />
                      Availability
                    </dt>
                    <dd>
                      <Badge tone="success" size="sm">
                        {priceSample.total > 0 ? "Bookable now" : "Enquire"}
                      </Badge>
                    </dd>
                  </div>
                </dl>

                <div className="border-t border-line p-5">
                  <ButtonLink href="/book" size="lg" fullWidth iconRight="arrow-right">
                    Get your exact price
                  </ButtonLink>
                  <p className="mt-2.5 text-center text-xs text-ink-subtle">
                    Free diagnostics · Pay after the repair
                  </p>
                </div>
              </Card>

              {relatedServices.length > 0 ? (
                <nav className="mt-6 rounded-xl border border-line bg-surface p-5" aria-label="Other services">
                  <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                    Other repairs
                  </h2>
                  <ul className="mt-3 space-y-1">
                    {relatedServices.map((related) => (
                      <li key={related.id}>
                        <Link
                          href={`/services/${related.slug}`}
                          className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon name={serviceIcon(related.iconKey)} size={16} />
                            {related.name}
                          </span>
                          <Icon name="chevron-right" size={14} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/services"
                    className="mt-3 inline-flex items-center gap-1.5 px-2.5 text-sm font-semibold text-brand-700 dark:text-accent-300"
                  >
                    All services
                    <Icon name="arrow-right" size={14} />
                  </Link>
                </nav>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
