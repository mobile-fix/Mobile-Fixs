"use client";

import { Icon } from "@/components/icons";
import { Alert, Badge, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { SERVICE_TYPE_META, type ServiceType } from "@/lib/constants";
import { formatDuration, formatMoney, formatWarranty } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Quote } from "./types";

/**
 * Quote summary panel.
 *
 * Shows the full breakdown — every line, the service fee, the total — because
 * hidden pricing is the single biggest trust failure in this category. Estimated
 * lines are labelled explicitly rather than presented as firm prices.
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
          title="Price unavailable"
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
          <Icon name="tag" size={22} />
        </span>
        <p className="mt-3 font-display text-base font-bold text-ink">Your estimate appears here</p>
        <p className="measure-tight mx-auto mt-1 text-sm text-ink-muted">
          Pick your device and the repair you need to see an exact price, repair time and warranty.
        </p>
      </div>
    );
  }

  const feeMeta = SERVICE_TYPE_META[serviceType];

  return (
    <div
      className={cn("surface-card overflow-hidden", className)}
      // The total changes as the user edits their basket; announce it politely.
      aria-live="polite"
      aria-busy={loading}
    >
      <div className="border-b border-line bg-sunken px-5 py-3.5">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink">
          <Icon name="tag" size={15} />
          Your estimate
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
                      {line.isEstimate ? (
                        <Badge tone="warning" size="sm">
                          Estimate
                        </Badge>
                      ) : null}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular text-sm font-bold text-ink">
                      {line.unitPrice === 0 ? "Free" : formatMoney(line.unitPrice)}
                    </p>
                    {line.compareAtPrice ? (
                      <p className="tabular text-xs text-ink-subtle line-through">
                        {formatMoney(line.compareAtPrice)}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="tabular font-semibold text-ink">{formatMoney(quote.subtotal)}</dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">
                {feeMeta.label} fee
                {quote.serviceFee === 0 ? (
                  <span className="ml-1.5 text-xs font-semibold text-success-700 dark:text-success-500">
                    Free
                  </span>
                ) : null}
              </dt>
              <dd className="tabular font-semibold text-ink">
                {quote.serviceFee === 0 ? "₹0" : formatMoney(quote.serviceFee)}
              </dd>
            </div>

            {quote.discount > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-success-700 dark:text-success-500">Discount</dt>
                <dd className="tabular font-semibold text-success-700 dark:text-success-500">
                  −{formatMoney(quote.discount)}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="flex items-end justify-between gap-4 border-t border-line bg-sunken px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                Estimated total
              </p>
              <p className="tabular font-display text-3xl font-bold text-ink">
                {formatMoney(quote.total)}
              </p>
            </div>
            <div className="text-right text-xs text-ink-muted">
              <p className="flex items-center justify-end gap-1.5">
                <Icon name="clock" size={13} />
                {formatDuration(quote.estimatedDurationMinutes)}
              </p>
              <p className="mt-1 flex items-center justify-end gap-1.5">
                <Icon name="shield-check" size={13} />
                {formatWarranty(quote.warrantyMonths)}
              </p>
            </div>
          </div>

          {quote.containsEstimate ? (
            <div className="border-t border-line px-5 py-3">
              <p className="flex gap-2 text-xs leading-relaxed text-ink-muted">
                <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                <span>
                  One or more prices are indicative because we have not yet priced this exact model.
                  We confirm the final cost free of charge after diagnosis, and you approve it before
                  any work starts.
                </span>
              </p>
            </div>
          ) : null}

          {footer ? <div className="border-t border-line p-5">{footer}</div> : null}
        </>
      ) : null}
    </div>
  );
}
