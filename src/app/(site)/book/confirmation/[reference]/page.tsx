import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Alert, Badge, Card } from "@/components/ui/primitives";
import { CopyButton } from "@/components/site/CopyButton";
import { PrintButton } from "@/components/site/PrintButton";
import { SERVICE_TYPE_META } from "@/lib/constants";
import { formatDuration, formatWarranty } from "@/lib/money";
import { formatDate, formatPhone } from "@/lib/utils";
import { contactConfig, telHref, whatsappHref } from "@/lib/config";
import { getBookingByReference } from "@/server/services/booking.service";
import { NotFoundError } from "@/lib/errors";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  robots: { index: false, follow: false },
};

/** Confirmation pages are per-customer and must never be cached or prerendered. */
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  let booking;
  try {
    booking = await getBookingByReference(decodeURIComponent(reference).toUpperCase());
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const serviceMeta = SERVICE_TYPE_META[booking.serviceType];

  const nextSteps = [
    {
      icon: "message" as const,
      title: "We confirm your slot",
      body: `We will contact you by ${booking.customer.preferredContact.toLowerCase()} to confirm the exact time.`,
    },
    {
      icon: serviceMeta.iconKey as never,
      title: serviceMeta.label,
      body:
        booking.serviceType === "STORE_VISIT"
          ? // Legacy bookings only; customers can no longer choose this option.
            "We will confirm the details of your visit with you directly."
          : booking.serviceType === "PICKUP_DELIVERY"
            ? "Pickup and drop are free. Back up anything important before we collect your device."
            : "The visit is free. Have the device charged if possible, and back up anything important before our technician arrives.",
    },
    {
      icon: "diagnostic" as const,
      title: "Free diagnosis before any work",
      body: "We confirm the fault and the cost with you. Nothing is opened until you approve it.",
    },
    {
      icon: "search" as const,
      title: "Track it any time",
      body: `Use repair ID ${booking.reference} and your phone number on the Track Repair page to see live progress.`,
    },
  ];

  return (
    <div className="pb-20 pt-10">
      <div className="container-page max-w-4xl">
        {/* Success banner */}
        <div className="animate-fade-up text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 text-success-600 ring-1 ring-success-100 dark:bg-success-900/40 dark:text-success-300 dark:ring-success-700">
            <Icon name="check-circle" size={34} />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Booking confirmed
          </h1>
          <p className="measure mx-auto mt-3 text-lg text-ink-muted">
            Thanks {booking.customer.fullName.split(" ")[0]} — your repair is booked. We have sent
            the details to your preferred contact method.
          </p>
        </div>

        {/* Repair ID */}
        <Card className="mt-8 overflow-hidden">
          <div className="flex flex-col items-center gap-4 bg-brand-950 px-6 py-7 text-center dark:bg-brand-900 sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                Your repair ID
              </p>
              <p className="tabular mt-1 font-display text-3xl font-bold tracking-tight text-white">
                {booking.reference}
              </p>
              <p className="mt-1.5 text-sm text-white/70">
                Keep this. You need it with your phone number to track the repair.
              </p>
            </div>
            <div className="flex gap-2">
              <CopyButton value={booking.reference} label="Copy repair ID" />
              <PrintButton />
            </div>
          </div>

          {/* Details grid */}
          <dl className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
            <Detail label="Device" value={`${booking.device.brandName} ${booking.device.modelName}`} />
            <Detail
              label="Service type"
              value={serviceMeta.label}
              hint={serviceMeta.highlight}
            />
            <Detail
              label="Appointment"
              value={booking.appointment ? formatDate(booking.appointment.scheduledFor) : "To be confirmed"}
              hint={booking.appointment?.slotLabel}
            />
            <Detail
              label="Estimated time"
              value={formatDuration(booking.estimatedDurationMinutes)}
              hint={`${formatWarranty(Math.min(...booking.items.map((item) => item.warrantyMonths)))} on parts fitted`}
            />
            <Detail
              label="Contact"
              value={`+91 ${formatPhone(booking.customer.phone)}`}
              hint={booking.customer.email ?? undefined}
            />
            {booking.address.line ? (
              <Detail
                label="Address"
                value={booking.address.line}
                hint={[booking.address.city, booking.address.postalCode].filter(Boolean).join(" ")}
              />
            ) : (
              <Detail label="Location" value="To be confirmed with you" />
            )}
          </dl>

          {/* Line items */}
          <div className="border-t border-line px-6 py-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
              Repairs booked
            </h2>
            <ul className="mt-3 space-y-3">
              {booking.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{item.serviceName}</p>
                    <p className="mt-0.5 text-xs text-ink-subtle">
                      {item.partGradeLabel} · {formatWarranty(item.warrantyMonths)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-line bg-sunken px-6 py-5">
            <p className="text-sm text-ink-muted">
              Cost confirmed with you after a free diagnosis.
            </p>
            <Badge tone="success" icon="lock">
              Payable after repair
            </Badge>
          </div>
        </Card>

        <Alert tone="info" className="mt-6">
          We tell you the cost after diagnosis and you decide before any work starts. You are never
          charged for a repair you did not approve. Questions? Message us on WhatsApp.
        </Alert>

        {/* Next steps */}
        <section className="mt-12" aria-labelledby="next-steps">
          <h2 id="next-steps" className="font-display text-xl font-bold text-ink">
            What happens next
          </h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2">
            {nextSteps.map((entry, index) => (
              <li key={entry.title} className="flex gap-4 rounded-xl border border-line bg-surface p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                  <Icon name={entry.icon} size={19} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-0.5 font-semibold text-ink">{entry.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{entry.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Actions */}
        <div className="no-print mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={`/track?ref=${booking.reference}`} size="lg" iconRight="arrow-right">
            Track this repair
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="lg">
            Back to home
          </ButtonLink>
        </div>

        <div className="no-print mt-8 rounded-xl border border-line bg-surface p-5">
          <h2 className="font-display text-base font-bold text-ink">Need to change something?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Rescheduling and cancellation are free. Quote repair ID{" "}
            <span className="font-mono font-semibold text-ink">{booking.reference}</span>.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={telHref}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sunken"
            >
              <Icon name="phone" size={15} />
              {contactConfig.phone}
            </a>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sunken"
              >
                <Icon name="whatsapp" size={15} />
                WhatsApp
              </a>
            ) : null}
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sunken"
            >
              <Icon name="mail" size={15} />
              Contact form
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
      {hint ? <dd className="mt-0.5 text-sm text-ink-muted">{hint}</dd> : null}
    </div>
  );
}
