import type { Metadata } from "next";
import Link from "next/link";

import { LandingHero } from "@/components/home/LandingHero";
import {
  CtaBand,
  HowItWorks,
  ServiceOptions,
  ServicesGrid,
  StatsBand,
  Testimonials,
  WhyUs,
} from "@/components/home/sections";
import { Accordion } from "@/components/ui/Disclosure";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/icons";
import { SectionHeading } from "@/components/ui/primitives";
import { contactConfig, telHref, whatsappChatHref, whatsappDisplay } from "@/lib/config";
import { FAQS, faqStructuredData } from "@/lib/faq";
import { JsonLd } from "@/components/site/JsonLd";
import { NotASupportLine } from "@/components/site/NotASupportLine";
import { ServicePromises } from "@/components/site/ServicePromises";
import { BUSINESS, fullAddress } from "@/config/business";
import { listServices } from "@/server/services/catalog.service";
import { getPublicStats } from "@/server/services/analytics.service";
import { listPublishedReviews } from "@/server/services/content.service";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Phone Screen & Battery Replacement at Your Door in Delhi",
  description:
    "Screen, battery and charging port replacement for iPhone, Samsung and Android, done in person at your Delhi address. Free pickup and drop, 3–12 month warranty.",
  path: "/",
});

/**
 * Homepage.
 *
 * Rendered on the server and revalidated periodically: the catalogue, reviews
 * and statistics change rarely, so the page is fast without going stale. The
 * page ships no client JavaScript of its own.
 */
export const revalidate = 300;

export default async function HomePage() {
  const [services, stats, reviews] = await Promise.all([
    listServices(),
    getPublicStats(),
    listPublishedReviews(6),
  ]);

  const homeFaqs = FAQS.slice(0, 6);

  return (
    <>
      <JsonLd data={faqStructuredData(homeFaqs)} />

      <LandingHero />

      <div className="container-page mt-12">
        <NotASupportLine />
      </div>

      <div className="container-page mt-8">
        <ServicePromises />
      </div>

      <StatsBand stats={stats} />

      {/* Contact — model and fault in, firm price and time out. */}
      <section id="whatsapp" className="scroll-mt-24 py-20 lg:py-24" aria-labelledby="whatsapp-heading">
        <div className="container-page">
          <div className="grid items-center gap-10 rounded-3xl border border-line bg-surface p-8 shadow-sm sm:p-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Delhi NCR only — we turn up in person"
                title={<span id="whatsapp-heading">Tell us the model and the fault</span>}
                description="Tell us your phone model and what is wrong, and add a photo if you can. A technician replies with a firm price and a time. You agree it before anything is opened."
              />
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/book" size="xl" iconRight="arrow-right">
                  Book a repair
                </ButtonLink>
                <ButtonLink href={whatsappChatHref()} external variant="outline" size="lg" iconLeft="whatsapp">
                  WhatsApp
                </ButtonLink>
              </div>
            </div>

            <ul className="space-y-4">
              {[
                { icon: "whatsapp" as const, title: "WhatsApp", body: whatsappDisplay, href: whatsappChatHref(), external: true },
                { icon: "phone" as const, title: "Call us", body: contactConfig.phone, href: telHref, external: false },
                { icon: "clock" as const, title: "Hours", body: BUSINESS.hours, href: null, external: false },
                { icon: "map-pin" as const, title: "Address", body: fullAddress, href: null, external: false },
              ].map((item) => {
                const content = (
                  <>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-700 dark:bg-success-900/40 dark:text-success-300">
                      <Icon name={item.icon} size={20} />
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wide text-ink-subtle">
                        {item.title}
                      </span>
                      <span className="tabular block font-display text-lg font-bold text-ink">
                        {item.body}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={item.title}>
                    {item.href ? (
                      <a
                        href={item.href}
                        {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="flex items-center gap-4 rounded-2xl border border-line p-4 transition-colors hover:bg-sunken"
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 rounded-2xl border border-line p-4">{content}</div>
                    )}
                  </li>
                );
              })}
              <li className="px-1 text-sm leading-relaxed text-ink-muted">
                Serving {BUSINESS.serviceAreas.join(", ")} and the rest of Delhi NCR.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <ServicesGrid services={services} />

      <HowItWorks />

      <ServiceOptions />

      <WhyUs />

      <Testimonials reviews={reviews} averageRating={stats.averageRating} />

      {/* FAQ preview */}
      <section className="border-t border-line bg-surface py-20 lg:py-24" aria-labelledby="faq-heading">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <SectionHeading
                align="left"
                eyebrow="Questions"
                title={<span id="faq-heading">Everything people ask before booking</span>}
                description="If your question is not here, ask us directly — we answer within one business day."
              />
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/faq" variant="outline" iconRight="arrow-right">
                  All questions
                </ButtonLink>
                <ButtonLink href="/contact" variant="ghost" iconRight="message">
                  Ask a question
                </ButtonLink>
              </div>
            </div>

            <div className="lg:col-span-8">
              <Accordion
                items={homeFaqs.map((faq) => ({
                  id: faq.id,
                  question: faq.question,
                  answer: <p>{faq.answer}</p>,
                }))}
                defaultOpenId={homeFaqs[0]?.id}
              />
              <p className="mt-4 text-sm text-ink-subtle">
                Looking for something specific?{" "}
                <Link
                  href="/faq"
                  className="font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800 dark:text-accent-300"
                >
                  Read all {FAQS.length} answers
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
