import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Icon, type IconName } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Alert, Card, SectionHeading } from "@/components/ui/primitives";
import { USES_DEMO_DATA, siteConfig, whatsappChatHref } from "@/lib/config";
import { getPublicStats } from "@/server/services/analytics.service";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Us — Independent Phone Repair, Done Transparently",
  description:
    "Why MyMobiFix exists: certified technicians, graded parts you choose yourself, a repair you can track end to end, and a real person on WhatsApp.",
  path: "/about",
});

export const revalidate = 600;

const VALUES: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "whatsapp",
    title: "Be easy to reach",
    body: "Message us on WhatsApp from anywhere with your phone model and a photo of the damage. A technician replies, not a bot, and you agree the cost before anything is opened.",
  },
  {
    icon: "eye",
    title: "Show the work",
    body: "At-home repairs happen in front of you, on your table. No back room, no “we will call you”, no wondering whether the part that went in matches the part you paid for.",
  },
  {
    icon: "package",
    title: "Grade parts honestly",
    body: "Original, premium and standard parts are all legitimate choices at different budgets. We explain the real difference in quality and warranty, and let you pick.",
  },
  {
    icon: "shield-check",
    title: "Stand behind it",
    body: "Every repair carries a warranty on both the part and the workmanship. Claims are handled at the same speed as the original job — not sent away for three weeks.",
  },
  {
    icon: "diagnostic",
    title: "Diagnose for free",
    body: "A diagnostic is how you find out what is wrong. Charging for that turns an honest assessment into a sales pitch, so we do not. You get a written report whether or not you proceed.",
  },
  {
    icon: "lock",
    title: "No fix, no fee",
    body: "If we cannot repair it, or the repair would cost more than the device is worth, we reassemble it, explain what we found and hand it back at no charge.",
  },
];

export default async function AboutPage() {
  const stats = await getPublicStats();

  const statItems: Array<{ value: string; label: string }> = [];
  if (stats.repairsCompleted > 0) {
    statItems.push({
      value: stats.repairsCompleted.toLocaleString("en-IN"),
      label: "Repairs completed",
    });
  }
  if (stats.averageRating && stats.reviewCount > 0) {
    statItems.push({
      value: `${stats.averageRating}/5`,
      label: `Average rating from ${stats.reviewCount} reviews`,
    });
  }
  if (stats.modelsSupported > 0) {
    statItems.push({ value: `${stats.modelsSupported}`, label: "Device models supported" });
  }
  if (stats.brandsSupported > 0) {
    statItems.push({ value: `${stats.brandsSupported}`, label: "Brands supported" });
  }

  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "About us" }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Repair, done transparently
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            {siteConfig.name} exists because phone repair has a trust problem, not a technical one.
            The skills are widely available. What is rare is agreeing the cost before work starts, seeing
            which part actually went into your device, and being able to check on progress without
            chasing anyone.
          </p>
        </header>

        {/* Numbers */}
        {/* Tiles with nothing real to report (a fresh database) are left out. */}
        {statItems.length > 0 ? (
          <dl className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {statItems.map((item) => (
              <Card key={item.label} className="p-5">
                <dd className="tabular font-display text-3xl font-bold text-ink">{item.value}</dd>
                <dt className="mt-1 text-sm leading-snug text-ink-muted">{item.label}</dt>
              </Card>
            ))}
          </dl>
        ) : null}

        {USES_DEMO_DATA && statItems.length > 0 ? (
          <Alert tone="warning" title="Demonstration data" className="mt-6">
            The figures above are drawn from the seeded sample database that ships with this
            deployment, not from a trading business. On a live installation they update
            automatically from real bookings and published reviews.
          </Alert>
        ) : null}

        {/* Values */}
        <section className="mt-20" aria-labelledby="values-heading">
          <SectionHeading
            align="left"
            eyebrow="How we work"
            title={<span id="values-heading">Six commitments we hold ourselves to</span>}
            description="These are operational rules, not marketing copy — each one is visible somewhere in the product."
          />

          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((value) => (
              <li key={value.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                  <Icon name={value.icon} size={20} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">{value.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{value.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Technicians */}
        <section className="mt-20" aria-labelledby="team-heading">
          <SectionHeading
            align="left"
            eyebrow="Our technicians"
            title={<span id="team-heading">Who actually touches your device</span>}
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-ink">Certification and training</h3>
              <p className="mt-2 leading-relaxed text-ink-muted">
                Every technician completes an internal certification covering micro-soldering,
                display assembly handling, adhesive and water-resistance re-sealing, battery safety
                and electrostatic discharge control before they work unsupervised. Certification is
                re-assessed annually and after any new device family is added to the catalogue.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "Supervised probation on live repairs before certification",
                  "Anti-static workstations and calibrated torque tools",
                  "Documented procedure per device family, not improvised",
                ].map((entry) => (
                  <li key={entry} className="flex items-start gap-2.5 text-sm text-ink-muted">
                    <Icon
                      name="badge-check"
                      size={15}
                      className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400"
                    />
                    {entry}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-ink">
                The 30-point quality check
              </h3>
              <p className="mt-2 leading-relaxed text-ink-muted">
                Nothing goes back to a customer without a full functional pass. We test what we
                touched and everything adjacent to it, because a screen replacement that leaves the
                proximity sensor dead is not a completed repair.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  "Display and touch across the full panel",
                  "Front and rear cameras, all lenses",
                  "Earpiece, loudspeaker, every microphone",
                  "Charging, fast charge and data transfer",
                  "Wi-Fi, mobile data, Bluetooth, NFC",
                  "Proximity, ambient light, gyroscope",
                  "Buttons, haptics and alert slider",
                  "Battery health and charge rate",
                ].map((entry) => (
                  <li key={entry} className="flex items-start gap-2 text-sm text-ink-muted">
                    <Icon
                      name="check"
                      size={14}
                      className="mt-1 shrink-0 text-success-600 dark:text-success-500"
                    />
                    {entry}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* Environment */}
        <section className="mt-20" aria-labelledby="environment-heading">
          <Card className="grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 text-success-700 dark:bg-success-900/40 dark:text-success-300">
                <Icon name="leaf" size={23} />
              </span>
              <h2 id="environment-heading" className="mt-4 font-display text-xl font-bold text-ink">
                Repair is the environmental option
              </h2>
              <p className="measure mt-2 leading-relaxed text-ink-muted">
                Manufacturing a new smartphone accounts for the large majority of its lifetime carbon
                footprint. Replacing a worn battery instead of a whole new handset is the single
                biggest thing most people can do about their device footprint. Every cell, display
                and board we remove goes to a certified e-waste processor rather than to landfill.
              </p>
            </div>
            <div className="lg:col-span-4">
              <ButtonLink href="/book" size="lg" fullWidth iconRight="arrow-right">
                Repair instead of replace
              </ButtonLink>
            </div>
          </Card>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <h2 className="font-display text-2xl font-bold text-ink">Ready when you are</h2>
          <p className="measure mx-auto mt-2 text-ink-muted">
            Book a repair online, or message a technician on WhatsApp first — both work.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/book" size="lg" iconRight="arrow-right">
              Book a repair
            </ButtonLink>
            <ButtonLink
              href={whatsappChatHref()}
              external
              variant="outline"
              size="lg"
              iconLeft="whatsapp"
            >
              Chat on WhatsApp
            </ButtonLink>
          </div>
        </section>
      </div>
    </div>
  );
}
