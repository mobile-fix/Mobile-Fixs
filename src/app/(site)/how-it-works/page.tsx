import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Icon, type IconName } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { SERVICE_TYPES, SERVICE_TYPE_META, STATUS_FLOW, STATUS_META } from "@/lib/constants";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "How It Works — From Broken Phone to Fixed in 4 Steps",
  description:
    "How a MyMobiFix repair works: choose your device and repair, book a store visit, pickup or at-home slot, then track every stage until your phone is back.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS: Array<{
  number: string;
  title: string;
  icon: IconName;
  body: string;
  detail: string[];
}> = [
  {
    number: "01",
    title: "Choose your device",
    icon: "device",
    body: "Search by model name or number, or browse by brand. We list 57 models across 11 brands, and if yours is not there you can pick “Other” and we identify it during diagnosis.",
    detail: [
      "Type-ahead search matches model names, aliases and model codes",
      "No account or personal details needed at this stage",
      "Unlisted devices still get a manual quote",
    ],
  },
  {
    number: "02",
    title: "Select your repair",
    icon: "wrench",
    body: "Pick the fault. You see how long the repair takes and how long it is covered, plus your choice of original, premium or standard parts. For the cost, message us on WhatsApp.",
    detail: [
      "Cost agreed with you before any work starts",
      "Compare part grades side by side before deciding",
      "Add up to four repairs to a single visit",
    ],
  },
  {
    number: "03",
    title: "Book your appointment",
    icon: "calendar",
    body: "Choose a store visit, doorstep pickup or an at-home repair, then pick a two-hour window up to three weeks ahead. Slots show live availability, so you never book a time that is already full.",
    detail: [
      "Live slot capacity — no double bookings",
      "Same-day slots available with 90 minutes notice",
      "Free to reschedule or cancel at any point",
    ],
  },
  {
    number: "04",
    title: "Get your phone fixed",
    icon: "check-circle",
    body: "A certified technician does the work and runs a 30-point quality check. Track each stage online with your repair ID, then pay only once the device is back in your hands and working.",
    detail: [
      "Free diagnosis and a firm quote before anything is opened",
      "30-point functional check before handover",
      "Warranty starts the day you get the device back",
    ],
  },
];

export default function HowItWorksPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to book a mobile phone repair with MyMobiFix",
    description:
      "Four steps from a broken phone to a repaired one: choose your device, select the repair, book an appointment, and get it fixed.",
    totalTime: "PT2H",
    step: STEPS.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.body,
      url: `${siteConfig.url}/how-it-works#step-${index + 1}`,
    })),
  };

  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "How it works" }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            How it works
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Four steps, no surprises, and the cost agreed with you before anyone opens your device. Here
            is exactly what happens from the moment you land on this site.
          </p>
        </header>

        {/* Steps */}
        <ol className="mt-14 space-y-6">
          {STEPS.map((step, index) => (
            <li key={step.number} id={`step-${index + 1}`} className="scroll-mt-28">
              <Card className="grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:gap-8">
                <div className="lg:col-span-1">
                  <span className="font-display text-4xl font-bold text-line-strong">
                    {step.number}
                  </span>
                </div>

                <div className="lg:col-span-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-950 text-white dark:bg-brand-700">
                      <Icon name={step.icon} size={21} />
                    </span>
                    <h2 className="font-display text-xl font-bold text-ink">{step.title}</h2>
                  </div>
                  <p className="mt-4 leading-relaxed text-ink-muted">{step.body}</p>
                </div>

                <div className="lg:col-span-4">
                  <ul className="space-y-2.5 rounded-xl border border-line bg-sunken p-4">
                    {step.detail.map((entry) => (
                      <li key={entry} className="flex items-start gap-2.5 text-sm text-ink-muted">
                        <Icon
                          name="check-circle"
                          size={15}
                          className="mt-0.5 shrink-0 text-success-600 dark:text-success-500"
                        />
                        {entry}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </li>
          ))}
        </ol>

        {/* Service options */}
        <section className="mt-20" aria-labelledby="options-heading">
          <SectionHeading
            eyebrow="Your options"
            title={<span id="options-heading">Three ways to have it repaired</span>}
            description="Same technicians, same parts, same warranty. Only the convenience changes."
          />

          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
            {SERVICE_TYPES.map((type) => {
              const meta = SERVICE_TYPE_META[type];
              return (
                <Card as="li" key={type} className="flex flex-col p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300">
                    <Icon name={meta.iconKey as IconName} size={23} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{meta.label}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                    {meta.description}
                  </p>
                </Card>
              );
            })}
          </ul>
        </section>

        {/* Repair pipeline */}
        <section className="mt-20" aria-labelledby="pipeline-heading">
          <SectionHeading
            eyebrow="While we have your device"
            title={<span id="pipeline-heading">Every stage, visible to you</span>}
            description="Your repair moves through seven tracked stages. You can see which one it is at, at any time, with just your repair ID and phone number."
          />

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_FLOW.map((status, index) => (
              <li
                key={status}
                className="relative rounded-xl border border-line bg-surface p-5"
              >
                <span className="tabular text-xs font-bold text-ink-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1.5 font-display text-base font-bold text-ink">
                  {STATUS_META[status].label}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {STATUS_META[status].description}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/book" size="lg" iconRight="arrow-right">
              Start your booking
            </ButtonLink>
            <ButtonLink href="/track" variant="outline" size="lg" iconLeft="search">
              Track an existing repair
            </ButtonLink>
          </div>
        </section>
      </div>
    </div>
  );
}
