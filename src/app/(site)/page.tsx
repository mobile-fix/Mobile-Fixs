import type { Metadata } from "next";
import Link from "next/link";

import { LandingHero } from "@/components/home/LandingHero";
import { RepairEstimator } from "@/components/home/RepairEstimator";
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
import { SectionHeading } from "@/components/ui/primitives";
import { FAQS, faqStructuredData } from "@/lib/faq";
import { listServices } from "@/server/services/catalog.service";
import { getStartingPrices } from "@/server/services/pricing.service";
import { getPublicStats } from "@/server/services/analytics.service";
import { listPublishedReviews } from "@/server/services/content.service";

export const metadata: Metadata = {
  title: "Mobile Phone Repair with Transparent Pricing & Warranty",
  description:
    "Book a phone repair with an exact price up front. Screen, battery, charging port and camera repairs by certified technicians, in store or at your door.",
  alternates: { canonical: "/" },
};

/**
 * Homepage.
 *
 * Rendered on the server and revalidated periodically: the catalogue, reviews
 * and statistics change rarely, so the page is fast without going stale. The
 * only client JavaScript is the estimator itself.
 */
export const revalidate = 300;

export default async function HomePage() {
  const [services, startingPrices, stats, reviews] = await Promise.all([
    listServices(),
    getStartingPrices(),
    getPublicStats(),
    listPublishedReviews(6),
  ]);

  const homeFaqs = FAQS.slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData(homeFaqs)) }}
      />

      <LandingHero />

      <StatsBand stats={stats} />

      {/* Estimator — the reason to stay on the page. */}
      <section id="estimator" className="scroll-mt-24 py-20 lg:py-24" aria-labelledby="estimator-heading">
        <div className="container-page">
          <SectionHeading
            eyebrow="Instant estimate"
            title={<span id="estimator-heading">What will my repair cost?</span>}
            description="Pick your device and the fault. You will see the exact price, how long it takes and what warranty it carries — before you give us a single detail about yourself."
          />
          <div className="mt-12">
            <RepairEstimator />
          </div>
        </div>
      </section>

      <ServicesGrid services={services} startingPrices={startingPrices} />

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
