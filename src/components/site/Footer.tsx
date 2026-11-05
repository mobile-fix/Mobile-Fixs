import Link from "next/link";

import { Icon } from "@/components/icons";
import { AREA_LINE, BUSINESS, NON_AFFILIATION } from "@/config/business";
import { AreaBlock } from "./AreaBlock";
import { Logo } from "./Logo";
import {
  contactConfig,
  siteConfig,
  telHref,
  whatsappChatHref,
  whatsappDisplay,
  whatsappHref,
  USES_DEMO_DATA,
} from "@/lib/config";

/**
 * Site footer.
 *
 * Four navigable columns plus the contact block, then a legal strip. Every link
 * resolves to a real page — there are no placeholder anchors.
 */

const SERVICE_LINKS = [
  { href: "/services/screen-replacement", label: "Screen Replacement" },
  { href: "/services/battery-replacement", label: "Battery Replacement" },
  { href: "/services/charging-port-repair", label: "Charging Port Repair" },
  { href: "/services/back-glass-replacement", label: "Back Glass Repair" },
  { href: "/services/water-damage-treatment", label: "Water Damage" },
  { href: "/services", label: "All Services" },
];

// Brand hubs are real pages; "Any Other Phone" opens a WhatsApp chat so the
// customer only has to name the device.
const BRAND_LINKS = [
  { href: "/repair/apple", label: "iPhone Repair" },
  { href: "/repair/samsung", label: "Samsung Repair" },
  { href: "/repair/google", label: "Google Pixel Repair" },
  { href: "/repair/oneplus", label: "OnePlus Repair" },
  { href: "/repair/xiaomi", label: "Xiaomi Repair" },
  { href: "/repair", label: "All brands" },
  { href: whatsappChatHref("Hi MyMobiFix, I need a repair for my phone."), label: "Any Other Phone" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/service-area", label: "Service Area" },
  { href: "/track", label: "Track Your Repair" },
  { href: "/warranty", label: "Warranty Policy" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <BusinessStatement />

      <div className="container-page py-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Logo />
            <p className="measure-tight mt-4 text-sm leading-relaxed text-ink-muted">
              Warranty-backed mobile phone repair across Delhi. Choose free pickup and drop or a
              free at-home repair you can watch happen.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <li>
                <a
                  href={telHref}
                  className="flex items-center gap-2.5 text-ink-muted transition-colors hover:text-brand-700 dark:hover:text-accent-300"
                >
                  <Icon name="phone" size={16} className="text-brand-600 dark:text-accent-400" />
                  {contactConfig.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contactConfig.email}`}
                  className="flex items-center gap-2.5 text-ink-muted transition-colors hover:text-brand-700 dark:hover:text-accent-300"
                >
                  <Icon name="mail" size={16} className="text-brand-600 dark:text-accent-400" />
                  {contactConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-ink-muted">
                <Icon name="clock" size={16} className="mt-0.5 text-brand-600 dark:text-accent-400" />
                {contactConfig.hours}
              </li>
              <li className="flex items-start gap-2.5 text-ink-muted">
                <Icon name="map-pin" size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-accent-400" />
                <span className="measure-tight">{AREA_LINE}</span>
              </li>
            </ul>

            {whatsappHref ? (
              <a
                href={whatsappChatHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-success-100 bg-success-50 px-4 py-2.5 text-sm font-semibold text-success-700 transition-colors hover:bg-success-100 dark:border-success-700 dark:bg-success-900/40 dark:text-success-100"
              >
                <Icon name="whatsapp" size={17} />
                WhatsApp {whatsappDisplay}
                <Icon name="arrow-up-right" size={14} />
              </a>
            ) : null}
          </div>

          <FooterColumn title="Repairs" links={SERVICE_LINKS} className="lg:col-span-3" />
          <FooterColumn title="Repair by brand" links={BRAND_LINKS} className="lg:col-span-2" />
          <FooterColumn title="Company" links={COMPANY_LINKS} className="lg:col-span-3" />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-subtle">
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href="/terms" className="text-ink-subtle transition-colors hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="text-ink-subtle transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/warranty" className="text-ink-subtle transition-colors hover:text-ink">
              Warranty
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-ink-subtle transition-colors hover:text-ink"
            >
              <Icon name="lock" size={13} />
              Staff Login
            </Link>
          </div>
        </div>

        {USES_DEMO_DATA ? (
          <div className="container-page pb-6">
            <p className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-xs leading-relaxed text-warning-900 dark:border-warning-700 dark:bg-warning-900/30 dark:text-warning-100">
              <strong className="font-semibold">Demonstration deployment.</strong> Reviews, repair
              counts and contact details on this site are illustrative sample data seeded for
              evaluation, not the records of a trading business. Configure real values through the
              environment variables documented in <code className="font-mono">.env.example</code>.
            </p>
          </div>
        ) : null}
      </div>
    </footer>
  );
}

/**
 * Who the business is, on every page: name, area (no shopfront), hours, PIN
 * codes covered and the non-affiliation line. Ad reviewers and customers both look for this, so
 * it sits above the link columns rather than in the small print.
 */
function BusinessStatement() {
  return (
    <section aria-label="About this business" className="border-b border-line bg-sunken">
      <div className="container-page space-y-3 py-8 text-sm leading-relaxed text-ink-muted">
        <p className="measure">
          {`${BUSINESS.tradingName} is an independent phone repair company based in ${BUSINESS.locality}, ${BUSINESS.city}, operating since ${BUSINESS.founded}.`}{" "}
          We replace physical components in person — at the customer&rsquo;s address, or after a
          free pickup — across {BUSINESS.region}, and do not provide remote or online support,
          device unlocking or data recovery.
        </p>
        <AreaBlock className="space-y-0.5" />
        <p className="measure text-xs text-ink-subtle">
          {NON_AFFILIATION} {BUSINESS.tradingName} is not affiliated with, authorised by or endorsed
          by any of them.
        </p>
      </div>
    </section>
  );
}

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
  className?: string;
}) {
  return (
    <nav className={className} aria-label={title}>
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            {link.href.startsWith("https://") ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink-muted transition-colors hover:text-brand-700 dark:hover:text-accent-300"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-ink-muted transition-colors hover:text-brand-700 dark:hover:text-accent-300"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
