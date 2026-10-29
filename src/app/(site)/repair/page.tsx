import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/icons";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/primitives";
import { BRANDS_WITH_LOGO, getBrandContent, hasBrandLandingPage } from "@/lib/brand-content";
import { siteConfig, whatsappChatHref } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { listBrands } from "@/server/services/catalog.service";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Mobile Phone Repair by Brand — iPhone, Samsung, OnePlus & More",
  description:
    "Find your phone brand for repair: iPhone, Samsung, Google Pixel, OnePlus, Xiaomi, Vivo, Oppo, Realme and more. Doorstep pickup or in store. Quote on WhatsApp.",
  path: "/repair",
});

export default async function RepairHubPage() {
  const brands = (await listBrands()).filter((brand) => hasBrandLandingPage(brand.slug));

  const listSchema = {
    "@type": "ItemList",
    name: "Phone brands we repair",
    itemListElement: brands.map((brand, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${getBrandContent(brand.slug, brand.name).displayName} repair`,
      url: `${siteConfig.url}/repair/${brand.slug}`,
    })),
  };

  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <JsonLd data={listSchema} />

      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Repair" }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Mobile phone repair by brand
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Choose your phone&apos;s brand to see the models we repair and the faults we see most.
            We repair in store or collect your phone from your door. Message us on WhatsApp with
            your model and the problem and we will send you a quote.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={whatsappChatHref()} external size="lg" iconLeft="whatsapp">
              Get a quote on WhatsApp
            </ButtonLink>
            <ButtonLink href="/book" variant="outline" size="lg" iconRight="arrow-right">
              Book a repair
            </ButtonLink>
          </div>
        </header>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => {
            const { displayName } = getBrandContent(brand.slug, brand.name);
            return (
              <Card as="li" key={brand.id} interactive className="group flex items-center gap-4 p-5">
                <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-line bg-white p-3">
                  {brand.logoKey && BRANDS_WITH_LOGO.has(brand.logoKey) ? (
                    <img
                      src={`/logos/${brand.logoKey}.svg`}
                      alt=""
                      width={96}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className="h-6 w-auto max-w-full object-contain"
                    />
                  ) : (
                    <span aria-hidden="true" className="font-display text-xl font-bold text-slate-700">
                      {brand.name.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-bold text-ink">
                    <Link
                      href={`/repair/${brand.slug}`}
                      className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {displayName} repair
                    </Link>
                  </h2>
                  {brand.modelCount > 0 ? (
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {brand.modelCount} {brand.modelCount === 1 ? "model" : "models"} listed
                    </p>
                  ) : null}
                </span>
                <Icon
                  name="arrow-right"
                  size={16}
                  className="shrink-0 text-ink-subtle transition-colors group-hover:text-brand-700 dark:group-hover:text-accent-300"
                />
              </Card>
            );
          })}
        </ul>

        <p className="mt-10 max-w-3xl text-sm text-ink-muted">
          Not sure which repair you need?{" "}
          <Link
            href="/services"
            className="font-semibold text-brand-700 underline-offset-2 hover:underline dark:text-accent-300"
          >
            See all our repair services
          </Link>
          .
        </p>

        <p className="mt-6 max-w-3xl border-t border-line pt-5 text-xs leading-relaxed text-ink-subtle">
          All brand names are trademarks of their respective owners. MyMobiFix is an independent
          repair service and is not affiliated with or authorised by any of these brands.
        </p>
      </div>
    </div>
  );
}
