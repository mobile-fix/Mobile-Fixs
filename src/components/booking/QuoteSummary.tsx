"use client";

import { Icon } from "@/components/icons";
import { Alert, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { whatsappChatHref, whatsappDisplay } from "@/lib/config";
import { SERVICE_TYPE_META, type ServiceType } from "@/lib/constants";
import { formatDuration, formatWarranty } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Quote } from "./types";

/**
 * Repair summary panel.
 *
 * Shows the device, each chosen repair, how long it takes and the warranty.
 * Prices are not published on the site: the cost is agreed with the customer
 * after diagnosis, and the panel points to WhatsApp for anyone who wants it
 * before booking.
 */
export function QuoteSummary({
  quote,
  loading,
  error,
  onRetry,
  serviceType,
  footer,
  compact = false,
  className,
}: {
  quote: Quote | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  serviceType: ServiceType;
  footer?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  if (error) {
    return (
      <div className={cn("surface-card p-5", className)}>
        <Alert
          tone="danger"
          title="Summary unavailable"
          live
          action={
            onRetry ? (
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      </div>
    );
  }

  if (!quote && !loading) {
    return (
      <div className={cn("surface-card p-6 text-center", className)}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sunken text-ink-subtle">
          <Icon name="wrench" size={22} />
        </span>
        <p className="mt-3 font-display text-base font-bold text-ink">Your repair appears here</p>
        <p className="measure-tight mx-auto mt-1 text-sm text-ink-muted">
          Pick your device and the repair you need to see the repair time and warranty.
        </p>
      </div>
    );
  }

  const feeMeta = SERVICE_TYPE_META[serviceType];

  return (
    <div
      className={cn("surface-card overflow-hidden", className)}
      // The summary changes as the user edits their basket; announce it politely.
      aria-live="polite"
      aria-busy={loading}
    >
      <div className="border-b border-line bg-sunken px-5 py-3.5">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink">
          <Icon name="wrench" size={15} />
          Your repair
        </h3>
      </div>

      {loading && !quote ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-9 w-1/2" />
        </div>
      ) : quote ? (
        <>
          <div className={cn("px-5", compact ? "py-4" : "py-5")}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Device</p>
            <p className="font-display text-base font-bold text-ink">
              {quote.brand.name} {quote.model.name}
            </p>

            <ul className="mt-4 space-y-3">
              {quote.lines.map((line) => (
                <li key={`${line.serviceId}-${line.partGrade}`} className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{line.serviceName}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-subtle">
                      <span>{line.partGradeLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatWarranty(line.warrantyMonths)}</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-ink-subtle">{formatDuration(line.durationMinutes)}</p>
                </li>
              ))}
            </ul>
          </div>

          <dl className="space-y-2 border-t border-line bg-sunken px-5 py-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-ink-muted">
                <Icon name="map-pin" size={14} />
                How
              </dt>
              <dd className="font-semibold text-ink">{feeMeta.label}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-ink-muted">
                <Icon name="clock" size={14} />
                Estimated time
              </dt>
              <dd className="font-semibold text-ink">{formatDuration(quote.estimatedDurationMinutes)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-ink-muted">
                <Icon name="shield-check" size={14} />
                Warranty
              </dt>
              <dd className="font-semibold text-ink">{formatWarranty(quote.warrantyMonths)}</dd>
            </div>
          </dl>

          <div className="border-t border-line px-5 py-4">
            <p className="flex gap-2 text-xs leading-relaxed text-ink-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              <span>
                We confirm the cost with you after a free diagnosis, and nothing is repaired until you
                approve it. Want it sooner?{" "}
                <a
                  href={whatsappChatHref(
                    `Hi MyMobiFix, what will it cost to repair my ${quote.brand.name} ${quote.model.name}? I need: ${quote.lines
                      .map((line) => line.serviceName)
                      .join(", ")}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-success-700 underline underline-offset-2 dark:text-success-300"
                >
                  Ask on WhatsApp {whatsappDisplay}
                </a>
                .
              </span>
            </p>
          </div>

          {footer ? <div className="border-t border-line p-5">{footer}</div> : null}
        </>
      ) : null}
    </div>
  );
}
