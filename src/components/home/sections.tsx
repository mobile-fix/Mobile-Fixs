import Link from "next/link";

import { Icon, serviceIcon, type IconName } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, Card, SectionHeading, StarRating } from "@/components/ui/primitives";
import { SERVICE_TYPES, SERVICE_TYPE_META } from "@/lib/constants";
import { whatsappChatHref, whatsappDisplay } from "@/lib/config";
import { formatDurationRange, formatWarranty } from "@/lib/money";
import { formatRelative, pluralise } from "@/lib/utils";
import type { CatalogService } from "@/server/services/catalog.service";
import type { PublicStats } from "@/server/services/analytics.service";
import type { PublicReview } from "@/server/services/content.service";

/** Homepage sections. All server-rendered — no client JavaScript. */

// ── Stats band ──────────────────────────────────────────────────────────────

export function StatsBand({ stats }: { stats: PublicStats }) {
  const items = [
    {
      value: stats.repairsCompleted.toLocaleString("en-IN"),
      label: "Repairs completed",
      icon: "wrench" as IconName,
    },
    {
      value: stats.averageRating ? `${stats.averageRating}/5` : "—",
      label: `Average rating${stats.reviewCount ? ` · ${stats.reviewCount} reviews` : ""}`,
      icon: "star" as IconName,
    },
    {
      value: `${stats.modelsSupported}+`,
      label: `Devices supported across ${stats.brandsSupported} brands`,
      icon: "device" as IconName,
    },
    { value: "6–12 mo", label: "Warranty on every repair", icon: "shield-check" as IconName },
  ];

  return (
    <section className="border-y border-line bg-surface py-8">
      <div className="container-page">
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                <Icon name={item.icon} size={20} />
              </span>
              <div className="min-w-0">
                <dd className="tabular font-display text-xl font-bold leading-tight text-ink sm:text-2xl">
                  {item.value}
                </dd>
                <dt className="mt-0.5 text-xs leading-snug text-ink-muted">{item.label}</dt>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ── Services grid ───────────────────────────────────────────────────────────

export function ServicesGrid({ services }: { services: CatalogService[] }) {
  return (
    <section className="py-20 lg:py-24" aria-labelledby="services-heading">
      <div className="container-page">
        <SectionHeading
          eyebrow="Repairs we do"
          title={<span id="services-heading">Every common fault, fixed properly</span>}
          description="Every repair below shows how long it takes and how long it is covered. For the cost on your exact phone, send us a message on WhatsApp."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 9).map((service) => {
            return (
              <Card as="li" key={service.id} interactive className="group flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white dark:bg-brand-950/70 dark:text-brand-300">
                    <Icon name={serviceIcon(service.iconKey)} size={23} />
                  </span>
                </div>

                <h3 className="mt-4 font-display text-lg font-bold text-ink">
                  <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0">
                    {service.name}
                  </Link>
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">
                  {service.shortDescription}
                </p>

                <dl className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line pt-4 text-xs">
                  <div className="flex items-center gap-1.5 text-ink-subtle">
                    <Icon name="clock" size={12} />
                    <dt className="sr-only">Time</dt>
                    <dd>{formatDurationRange(service.defaultDurationMinutes)}</dd>
                  </div>
                  <div className="flex items-center gap-1.5 text-ink-subtle">
                    <Icon name="shield-check" size={12} />
                    <dt className="sr-only">Warranty</dt>
                    <dd>{formatWarranty(service.defaultWarrantyMonths)}</dd>
                  </div>
                </dl>
              </Card>
            );
          })}
        </ul>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/services" variant="outline" size="lg" iconRight="arrow-right">
            View all {services.length} services
          </ButtonLink>
          <ButtonLink href={whatsappChatHref()} external variant="ghost" size="lg" iconLeft="whatsapp">
            Ask on WhatsApp
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

// ── How it works ────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    title: "Choose your device",
    description:
      "Search 57+ models across 11 brands, or pick your brand and browse. Cannot find it? Choose “Other” and we identify it during diagnosis.",
    icon: "device" as IconName,
  },
  {
    number: "02",
    title: "Select your repair",
    description:
      "See the repair time and warranty for each fault, plus your choice of original, premium or standard parts. Questions? Ask us on WhatsApp.",
    icon: "wrench" as IconName,
  },
  {
    number: "03",
    title: "Book your appointment",
    description:
      "Pick a store visit, doorstep pickup or an at-home repair, choose a two-hour window, and confirm. No payment up front.",
    icon: "calendar" as IconName,
  },
  {
    number: "04",
    title: "Get your phone fixed",
    description:
      "A certified technician does the work and runs a 30-point check. Track every stage online and pay once you have your device back.",
    icon: "check-circle" as IconName,
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-line bg-surface py-20 lg:py-24" aria-labelledby="how-heading">
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title={<span id="how-heading">Four steps. No surprises.</span>}
          description="From broken screen to working phone, with the cost agreed with you before anyone opens your device."
        />

        <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, index) => (
            <li key={step.number} className="relative">
              {/* Connector line between steps on wide screens. */}
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[3.25rem] top-6 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-brand-200 to-transparent dark:from-brand-800 lg:block"
                />
              ) : null}

              <div className="relative flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-950 text-white shadow-md dark:bg-brand-700">
                  <Icon name={step.icon} size={22} />
                </span>
                <span className="font-display text-3xl font-bold text-line-strong">
                  {step.number}
                </span>
              </div>

              <h3 className="mt-5 font-display text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.description}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <ButtonLink href="/book" size="lg" iconRight="arrow-right">
            Start your booking
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

// ── Service options ─────────────────────────────────────────────────────────

export function ServiceOptions() {
  return (
    <section className="py-20 lg:py-24" aria-labelledby="options-heading">
      <div className="container-page">
        <SectionHeading
          eyebrow="Three ways to get fixed"
          title={<span id="options-heading">Come to us, or we come to you</span>}
          description="Same technicians, same parts, same warranty. Pick whichever suits you."
        />

        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {SERVICE_TYPES.map((type) => {
            const meta = SERVICE_TYPE_META[type];
            return (
              <Card as="li" key={type} interactive className="flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300">
                    <Icon name={meta.iconKey as IconName} size={23} />
                  </span>
                </div>

                <h3 className="mt-4 font-display text-lg font-bold text-ink">{meta.label}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  {meta.description}
                </p>

                <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-sm font-semibold text-brand-700 dark:text-accent-300">
                  <Icon name="sparkles" size={15} />
                  {meta.highlight}
                </p>
              </Card>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ── Why us ──────────────────────────────────────────────────────────────────

const DIFFERENTIATORS = [
  {
    icon: "whatsapp" as IconName,
    title: "Talk to a technician on WhatsApp",
    body: "Send a photo of the damage from anywhere and a real technician replies with what is wrong, what it will cost and how long it takes. You agree the cost before any work starts.",
  },
  {
    icon: "eye" as IconName,
    title: "Watch the repair happen",
    body: "Choose an at-home repair and the work is done in front of you on your own table. No back room, no swapped parts, no waiting to find out what was actually done.",
  },
  {
    icon: "shield-check" as IconName,
    title: "Warranty that is easy to claim",
    body: "Six to twelve months depending on the part grade you choose. Claims are handled at the same speed as the original repair — bring it in and we sort it.",
  },
  {
    icon: "diagnostic" as IconName,
    title: "Free 30-point diagnostic",
    body: "Not sure what is wrong? We run a full hardware and software check and give you a written report and a firm quote — free, whether or not you go ahead.",
  },
  {
    icon: "package" as IconName,
    title: "Parts you choose, graded honestly",
    body: "Original, premium or standard. We tell you exactly what the difference is in quality and warranty, then let you decide rather than deciding for you.",
  },
  {
    icon: "search" as IconName,
    title: "Track every stage online",
    body: "Booking received, diagnosis, repair, quality check, ready. Your repair ID and phone number are all you need — no app, no account, no chasing anyone for updates.",
  },
];

export function WhyUs() {
  return (
    <section
      className="border-y border-line bg-surface py-20 lg:py-24"
      aria-labelledby="why-heading"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="Why MyMobiFix"
          title={<span id="why-heading">Built to remove every reason to hesitate</span>}
          description="Most repair experiences fail on trust, not on technical skill. These are the things we fixed."
        />

        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DIFFERENTIATORS.map((item) => (
            <li key={item.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                <Icon name={item.icon} size={20} />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Testimonials ────────────────────────────────────────────────────────────

export function Testimonials({
  reviews,
  averageRating,
}: {
  reviews: PublicReview[];
  averageRating: number | null;
}) {
  if (reviews.length === 0) return null;

  return (
    <section className="py-20 lg:py-24" aria-labelledby="reviews-heading">
      <div className="container-page">
        <SectionHeading
          eyebrow="Customer reviews"
          title={<span id="reviews-heading">What people say after the repair</span>}
          description={
            averageRating
              ? `Averaging ${averageRating} out of 5 across ${pluralise(reviews.length, "published review")}.`
              : undefined
          }
        />

        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((review) => (
            <Card as="li" key={review.id} className="flex flex-col p-6">
              <div className="flex items-center justify-between gap-3">
                <StarRating rating={review.rating} size={15} />
                {review.isVerified ? (
                  <Badge tone="success" size="sm" icon="badge-check">
                    Verified repair
                  </Badge>
                ) : null}
              </div>

              {review.title ? (
                <h3 className="mt-3 font-display text-base font-bold text-ink">{review.title}</h3>
              ) : null}

              <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                {review.body}
              </blockquote>

              <footer className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4 text-xs">
                <span className="font-semibold text-ink">{review.authorName}</span>
                <span className="text-ink-subtle">
                  {review.deviceLabel ? `${review.deviceLabel} · ` : ""}
                  {formatRelative(review.createdAt)}
                </span>
              </footer>
            </Card>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Final CTA ───────────────────────────────────────────────────────────────

export function CtaBand() {
  return (
    <section className="py-20 lg:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-brand-950 px-6 py-14 text-center sm:px-12 lg:py-20 dark:bg-brand-900">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="grid-texture absolute inset-0 opacity-[0.18]" />
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Need a repair? Message us on WhatsApp
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75">
              Send your phone model and the problem to {whatsappDisplay}. We reply with the cost and
              the time it takes, or book a repair slot online right now.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/book" size="xl" iconRight="arrow-right">
                Book a Repair
              </ButtonLink>
              <ButtonLink
                href={whatsappChatHref()}
                external
                size="xl"
                variant="outline"
                iconLeft="whatsapp"
                className="border-white/25 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
              >
                Chat on WhatsApp
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
