import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Accordion } from "@/components/ui/Disclosure";
import { ButtonLink } from "@/components/ui/Button";
import { whatsappChatHref } from "@/lib/config";
import { Card } from "@/components/ui/primitives";
import { Icon } from "@/components/icons";
import { FAQS, FAQ_CATEGORIES, faqStructuredData } from "@/lib/faq";
import { JsonLd } from "@/components/site/JsonLd";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Phone Repair FAQs — Warranty, Timing & Doorstep Service",
  description:
    "Answers about phone repair times, warranty cover, doorstep and pickup repairs, part grades, what happens if a phone cannot be fixed, tracking and payment.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <JsonLd data={faqStructuredData()} />

      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "FAQ" }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            {FAQS.length} straight answers about how repairs, warranties, appointments and payment
            work. If yours is not here, ask us — we answer within one business day.
          </p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <div className="space-y-10">
              {FAQ_CATEGORIES.map((category) => {
                const entries = FAQS.filter((faq) => faq.category === category);
                if (entries.length === 0) return null;

                return (
                  <section key={category} id={category.toLowerCase()} className="scroll-mt-28">
                    <h2 className="font-display text-xl font-bold text-ink">{category}</h2>
                    <Accordion
                      className="mt-4"
                      allowMultiple
                      items={entries.map((faq) => ({
                        id: faq.id,
                        question: faq.question,
                        answer: <p>{faq.answer}</p>,
                      }))}
                    />
                  </section>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="space-y-5 lg:sticky lg:top-28">
              <nav aria-label="FAQ categories" className="rounded-xl border border-line bg-surface p-5">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                  Jump to
                </h2>
                <ul className="mt-3 space-y-1">
                  {FAQ_CATEGORIES.map((category) => {
                    const count = FAQS.filter((faq) => faq.category === category).length;
                    if (count === 0) return null;
                    return (
                      <li key={category}>
                        <a
                          href={`#${category.toLowerCase()}`}
                          className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
                        >
                          {category}
                          <span className="tabular rounded-full bg-sunken px-1.5 py-0.5 text-[11px] font-bold text-ink-subtle">
                            {count}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <Card className="p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                  <Icon name="message" size={19} />
                </span>
                <h2 className="mt-3.5 font-display text-base font-bold text-ink">
                  Still have a question?
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  Send it over and a technician will answer — not a script.
                </p>
                <ButtonLink href="/contact" size="sm" className="mt-4" iconRight="arrow-right">
                  Ask a question
                </ButtonLink>
              </Card>

              <Card className="p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300">
                  <Icon name="whatsapp" size={19} />
                </span>
                <h2 className="mt-3.5 font-display text-base font-bold text-ink">
                  Want to know the cost?
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  Send your phone model and the problem on WhatsApp and we will tell you.
                </p>
                <ButtonLink
                  href={whatsappChatHref()}
                  external
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  iconLeft="whatsapp"
                >
                  Chat on WhatsApp
                </ButtonLink>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
