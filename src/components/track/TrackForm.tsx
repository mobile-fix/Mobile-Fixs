"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert, Badge, Card, StatusBadge } from "@/components/ui/primitives";
import { Field, Input, describedBy } from "@/components/ui/form";
import { api, ApiClientError } from "@/lib/api-client";
import { STATUS_META, type RepairStatus } from "@/lib/constants";
import { formatDuration, formatMoney, formatWarranty } from "@/lib/money";
import { cn, formatDate, formatDateTime, formatRelative } from "@/lib/utils";
import type { FieldErrors } from "@/lib/errors";
import { contactConfig, telHref } from "@/lib/config";

/**
 * Repair tracker.
 *
 * Requires both the repair ID and the phone number on the booking: a reference
 * alone reveals nothing, and a wrong pair returns one generic message so the
 * form cannot be used to enumerate valid references.
 */

type TrackingStep = {
  status: RepairStatus;
  label: string;
  description: string;
  state: "complete" | "current" | "upcoming";
  at: string | null;
  note: string | null;
};

type TrackingResult = {
  reference: string;
  status: RepairStatus;
  statusLabel: string;
  statusDescription: string;
  tone: string;
  isOffFlow: boolean;
  device: string;
  services: Array<{ name: string; warrantyMonths: number }>;
  serviceTypeLabel: string;
  total: number;
  estimatedDurationMinutes: number;
  bookedAt: string;
  completedAt: string | null;
  appointment: { scheduledFor: string; slotLabel: string } | null;
  progressPercent: number;
  steps: TrackingStep[];
  updates: Array<{ at: string; label: string; note: string | null }>;
  customerFirstName: string;
};

export function TrackForm() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // A confirmation page links here with the reference prefilled.
  useEffect(() => {
    const fromUrl = searchParams.get("ref");
    if (fromUrl) setReference(fromUrl.toUpperCase());
  }, [searchParams]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const localErrors: FieldErrors = {};
    if (!reference.trim()) localErrors.reference = ["Enter your repair ID."];
    if (!phone.trim()) localErrors.phone = ["Enter the phone number you booked with."];
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await api.post<{ repair: TrackingResult }>("/api/track", {
        reference: reference.trim().toUpperCase(),
        phone: phone.trim(),
      });
      setResult(data.repair);
    } catch (cause) {
      setResult(null);
      if (cause instanceof ApiClientError) {
        setError(cause.message);
        if (cause.fieldErrors) setFieldErrors(cause.fieldErrors);
      } else {
        setError("We could not look up that repair. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      {/* Lookup form */}
      <div className="lg:col-span-5">
        <Card className="p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-bold text-ink">Find your repair</h2>
          <p className="mt-1.5 text-sm text-ink-muted">
            Enter the repair ID from your confirmation and the phone number you booked with.
          </p>

          <form onSubmit={submit} noValidate className="mt-6 space-y-5">
            <Field
              label="Repair ID"
              htmlFor="reference"
              required
              hint="Looks like MMF-7K4Q2M"
              error={fieldErrors.reference}
            >
              <Input
                id="reference"
                value={reference}
                onChange={(event) => setReference(event.target.value.toUpperCase())}
                placeholder="MMF-7K4Q2M"
                autoComplete="off"
                spellCheck={false}
                hasError={Boolean(fieldErrors.reference)}
                aria-describedby={describedBy("reference", fieldErrors.reference, "Looks like MMF-7K4Q2M")}
                className="font-mono tracking-wider"
              />
            </Field>

            <Field label="Phone number" htmlFor="track-phone" required error={fieldErrors.phone}>
              <Input
                id="track-phone"
                type="tel"
                inputMode="numeric"
                prefix="+91"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="98765 43210"
                autoComplete="tel"
                hasError={Boolean(fieldErrors.phone)}
                aria-describedby={describedBy("track-phone", fieldErrors.phone)}
              />
            </Field>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={loading}
              loadingLabel="Looking up…"
              iconRight="search"
            >
              Track repair
            </Button>
          </form>

          {error ? (
            <Alert tone="danger" title="Repair not found" live className="mt-5">
              {error}
            </Alert>
          ) : null}

          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm font-semibold text-ink">Lost your repair ID?</p>
            <p className="mt-1 text-sm text-ink-muted">
              Call us with the phone number you booked with and we will find it.
            </p>
            <a
              href={telHref}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-accent-300"
            >
              <Icon name="phone" size={15} />
              {contactConfig.phone}
            </a>
          </div>
        </Card>
      </div>

      {/* Result */}
      <div className="lg:col-span-7">
        {result ? (
          <TrackingResultView result={result} />
        ) : (
          <Card className="flex h-full flex-col items-center justify-center p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sunken text-ink-subtle">
              <Icon name="search" size={26} />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">
              Your repair status appears here
            </h2>
            <p className="measure-tight mt-2 text-sm text-ink-muted">
              You will see exactly which stage your device is at, when each step happened and what
              is next — no account needed.
            </p>

            <ol className="mt-8 w-full max-w-xs space-y-2 text-left">
              {["Booking Received", "Diagnosis", "Repair In Progress", "Ready for Pickup"].map(
                (label, index) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-bold text-ink-subtle">
                      {index + 1}
                    </span>
                    <span className="text-sm text-ink-subtle">{label}</span>
                  </li>
                ),
              )}
            </ol>
          </Card>
        )}
      </div>
    </div>
  );
}

function TrackingResultView({ result }: { result: TrackingResult }) {
  return (
    <div className="animate-fade-up space-y-6">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="border-b border-line bg-sunken px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-subtle">Repair ID</p>
              <p className="tabular font-display text-2xl font-bold text-ink">{result.reference}</p>
              <p className="mt-1 text-sm text-ink-muted">{result.device}</p>
            </div>
            <StatusBadge status={result.status} />
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-ink">
            <span className="font-semibold">Hi {result.customerFirstName}.</span>{" "}
            {result.statusDescription}
          </p>

          {!result.isOffFlow ? (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                <span>Progress</span>
                <span className="tabular">{result.progressPercent}%</span>
              </div>
              <div
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-sunken"
                role="progressbar"
                aria-valuenow={result.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Repair progress"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-accent-500 transition-[width] duration-500"
                  style={{ width: `${Math.max(result.progressPercent, 4)}%` }}
                />
              </div>
            </div>
          ) : null}

          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">Repairs</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">
                {result.services.map((service) => service.name).join(", ")}
              </dd>
              <dd className="mt-0.5 text-xs text-ink-subtle">
                {formatWarranty(Math.min(...result.services.map((s) => s.warrantyMonths)))}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                Service type
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink">{result.serviceTypeLabel}</dd>
              <dd className="mt-0.5 text-xs text-ink-subtle">
                Approx. {formatDuration(result.estimatedDurationMinutes)} of work
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                Appointment
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink">
                {result.appointment ? formatDate(result.appointment.scheduledFor) : "To be confirmed"}
              </dd>
              {result.appointment ? (
                <dd className="mt-0.5 text-xs text-ink-subtle">{result.appointment.slotLabel}</dd>
              ) : null}
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                {result.completedAt ? "Total paid" : "Estimated total"}
              </dt>
              <dd className="tabular mt-1 text-sm font-semibold text-ink">
                {formatMoney(result.total)}
              </dd>
              <dd className="mt-0.5 text-xs text-ink-subtle">
                Booked {formatRelative(result.bookedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-ink">Repair timeline</h2>

        <ol className="mt-6">
          {result.steps.map((step, index) => {
            const isLast = index === result.steps.length - 1;
            return (
              <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Connector */}
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-[0.9375rem] top-8 h-[calc(100%-1rem)] w-0.5 rounded",
                      step.state === "complete" ? "bg-success-500" : "bg-line",
                    )}
                  />
                ) : null}

                <span
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    step.state === "complete" &&
                      "border-success-500 bg-success-500 text-white",
                    step.state === "current" &&
                      "animate-pulse-ring border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500",
                    step.state === "upcoming" && "border-line bg-surface text-ink-subtle",
                  )}
                >
                  {step.state === "complete" ? (
                    <Icon name="check" size={15} strokeWidth={3} />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        "font-display text-base font-bold",
                        step.state === "upcoming" ? "text-ink-subtle" : "text-ink",
                      )}
                    >
                      {step.label}
                    </h3>
                    {step.state === "current" ? (
                      <Badge tone="progress" size="sm">
                        Current stage
                      </Badge>
                    ) : null}
                  </div>

                  <p
                    className={cn(
                      "mt-1 text-sm leading-relaxed",
                      step.state === "upcoming" ? "text-ink-subtle" : "text-ink-muted",
                    )}
                  >
                    {step.description}
                  </p>

                  {step.note ? (
                    <p className="mt-2 rounded-lg border border-line bg-sunken px-3 py-2 text-sm text-ink-muted">
                      {step.note}
                    </p>
                  ) : null}

                  {step.at ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-subtle">
                      <Icon name="clock" size={12} />
                      {formatDateTime(step.at)}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>

        {result.isOffFlow ? (
          <Alert
            tone={result.status === "CANCELLED" ? "danger" : "warning"}
            title={STATUS_META[result.status].label}
            className="mt-4"
          >
            {result.statusDescription}
          </Alert>
        ) : null}
      </Card>

      {/* Update log */}
      {result.updates.length > 0 ? (
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink">Update history</h2>
          <ul className="mt-4 divide-y divide-line">
            {result.updates.map((update, index) => (
              <li key={`${update.at}-${index}`} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{update.label}</p>
                  {update.note ? (
                    <p className="mt-0.5 text-sm text-ink-muted">{update.note}</p>
                  ) : null}
                </div>
                <time
                  dateTime={update.at}
                  className="shrink-0 text-xs text-ink-subtle"
                  title={formatDateTime(update.at)}
                >
                  {formatRelative(update.at)}
                </time>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/contact" variant="outline" iconRight="message">
          Question about this repair?
        </ButtonLink>
        <ButtonLink href="/book" variant="ghost" iconRight="plus">
          Book another repair
        </ButtonLink>
      </div>
    </div>
  );
}
