import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ContactForm } from "@/components/contact/ContactForm";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Alert, Card } from "@/components/ui/primitives";
import {
  contactConfig,
  displayAddress,
  integrations,
  telHref,
  whatsappChatHref,
  whatsappHref,
} from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us — WhatsApp, Call or Email for a Repair Quote",
  description:
    "Get in touch with MyMobiFix. Call or message us on WhatsApp about a phone repair quote, an unlisted device, or a warranty claim.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Contact" }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Contact us
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Questions about a repair, the cost of fixing your phone, or a warranty claim — here is
            every way to reach us.
          </p>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Form */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          {/* Contact channels */}
          <aside className="space-y-5 lg:col-span-5">
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink">Talk to us directly</h2>

              <ul className="mt-5 space-y-4">
                <li>
                  <a
                    href={telHref}
                    className="group flex items-start gap-3.5 rounded-lg p-2 -m-2 transition-colors hover:bg-sunken"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                      <Icon name="phone" size={18} />
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wide text-ink-subtle">
                        Phone
                      </span>
                      <span className="block font-semibold text-ink group-hover:text-brand-700 dark:group-hover:text-accent-300">
                        {contactConfig.phone}
                      </span>
                      <span className="block text-sm text-ink-muted">
                        Fastest for anything urgent
                      </span>
                    </span>
                  </a>
                </li>

                <li>
                  <a
                    href={`mailto:${contactConfig.email}`}
                    className="group flex items-start gap-3.5 rounded-lg p-2 -m-2 transition-colors hover:bg-sunken"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                      <Icon name="mail" size={18} />
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wide text-ink-subtle">
                        Email
                      </span>
                      <span className="block break-all font-semibold text-ink group-hover:text-brand-700 dark:group-hover:text-accent-300">
                        {contactConfig.email}
                      </span>
                      <span className="block text-sm text-ink-muted">
                        Replies within one business day
                      </span>
                    </span>
                  </a>
                </li>

                {whatsappHref ? (
                  <li>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3.5 rounded-lg p-2 -m-2 transition-colors hover:bg-sunken"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-700 dark:bg-success-900/40 dark:text-success-300">
                        <Icon name="whatsapp" size={18} />
                      </span>
                      <span>
                        <span className="block text-xs font-bold uppercase tracking-wide text-ink-subtle">
                          WhatsApp
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-ink group-hover:text-success-700">
                          Start a chat
                          <Icon name="arrow-up-right" size={13} />
                        </span>
                        <span className="block text-sm text-ink-muted">
                          Send a photo of the damage
                        </span>
                      </span>
                    </a>
                  </li>
                ) : null}

                <li className="flex items-start gap-3.5 p-2 -m-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                    <Icon name="clock" size={18} />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-ink-subtle">
                      Opening hours
                    </span>
                    <span className="block font-semibold text-ink">{contactConfig.hours}</span>
                    <span className="block text-sm text-ink-muted">Closed on Sundays</span>
                  </span>
                </li>

                {/* Only shown once a real address is configured. */}
                {displayAddress ? (
                  <li className="flex items-start gap-3.5 p-2 -m-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                      <Icon name="map-pin" size={18} />
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wide text-ink-subtle">
                        Service centre
                      </span>
                      <span className="block font-semibold text-ink">{displayAddress}</span>
                    </span>
                  </li>
                ) : null}
              </ul>
            </Card>

            {/* Urgent repair */}
            <Card className="border-accent-200 bg-accent-50 p-6 dark:border-accent-800 dark:bg-accent-950/40">
              <div className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-brand-950">
                  <Icon name="zap" size={19} />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-ink">
                    Need it fixed today?
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    Same-day slots are usually available with 90 minutes notice. Book online for the
                    fastest confirmation, or call and we will find you the earliest window.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <ButtonLink href="/book" size="sm" iconRight="arrow-right">
                      Book now
                    </ButtonLink>
                    <a
                      href={telHref}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-sunken"
                    >
                      <Icon name="phone" size={14} />
                      Call now
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Map — a live embed when configured, otherwise a pointer to WhatsApp. */}
            {integrations.maps ? (
              <Card className="overflow-hidden">
                <div className="border-b border-line px-5 py-3.5">
                  <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                    Find us
                  </h2>
                </div>
                <iframe
                  src={contactConfig.mapsEmbedUrl}
                  title={
                    displayAddress
                      ? `Map showing the ${displayAddress} service centre`
                      : "Map showing the service centre"
                  }
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-[4/3] w-full border-0"
                />
              </Card>
            ) : whatsappHref ? (
              <Card className="p-6">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-700 dark:bg-success-900/40 dark:text-success-300">
                    <Icon name="map-pin" size={18} />
                  </span>
                  <div>
                    <h2 className="font-display text-base font-bold text-ink">Need directions?</h2>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      Message us on WhatsApp for directions to us, or to arrange a pickup or
                      at-home visit instead.
                    </p>
                    <div className="mt-4">
                      <ButtonLink
                        href={whatsappChatHref("Hi MyMobiFix, can you share directions to your store?")}
                        external
                        size="sm"
                        iconLeft="whatsapp"
                      >
                        Message us on WhatsApp
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            <Alert tone="info">
              Tracking an existing repair? You do not need to contact us —{" "}
              <a
                href="/track"
                className="font-semibold underline underline-offset-4"
              >
                check the status online
              </a>{" "}
              with your repair ID and phone number.
            </Alert>
          </aside>
        </div>
      </div>
    </div>
  );
}
