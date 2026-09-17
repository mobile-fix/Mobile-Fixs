"use client";

import { useEffect, useState } from "react";

import { Icon, serviceIcon } from "@/components/icons";
import { Alert, Badge, EmptyState, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { api, ApiClientError } from "@/lib/api-client";
import { formatDurationRange, formatWarranty } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BasketItem, RepairCatalogue, RepairServiceOption } from "./types";
import type { PartGrade } from "@/lib/constants";

/**
 * Repair selection.
 *
 * Each repair shows its time, warranty and availability. Prices are not shown
 * on the site — the cost is agreed with the customer after diagnosis or over
 * WhatsApp. Part-grade options expand inline only for the repair being
 * configured, so the list stays scannable.
 */

export function RepairSelector({
  modelId,
  basket,
  onChange,
  onCatalogueLoaded,
}: {
  modelId: string;
  basket: BasketItem[];
  onChange: (items: BasketItem[]) => void;
  onCatalogueLoaded?: (catalogue: RepairCatalogue) => void;
}) {
  const [catalogue, setCatalogue] = useState<RepairCatalogue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .get<RepairCatalogue>(`/api/catalog/repairs?modelId=${encodeURIComponent(modelId)}`, controller.signal)
      .then((data) => {
        setCatalogue(data);
        onCatalogueLoaded?.(data);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setCatalogue(null);
        setError(
          cause instanceof ApiClientError ? cause.message : "Could not load repairs for this device.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // `onCatalogueLoaded` is intentionally excluded: callers pass an inline
    // function, and including it would refetch on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId, reloadKey]);

  const selectedFor = (serviceId: string) =>
    basket.find((item) => item.serviceId === serviceId) ?? null;

  const toggleService = (service: RepairServiceOption) => {
    const existing = selectedFor(service.id);
    if (existing) {
      onChange(basket.filter((item) => item.serviceId !== service.id));
      setExpandedId(null);
      return;
    }

    if (basket.length >= 4) return;

    // Default to the mid option (usually Premium) — the one most customers pick.
    const preferred =
      service.options.find((option) => option.partGrade === "PREMIUM") ?? service.options[0];
    if (!preferred) return;

    onChange([...basket, { serviceId: service.id, partGrade: preferred.partGrade }]);
    // Reveal the grade choices so the default is visible, not hidden.
    if (service.options.length > 1) setExpandedId(service.id);
  };

  const setGrade = (serviceId: string, partGrade: PartGrade) => {
    onChange(
      basket.map((item) => (item.serviceId === serviceId ? { ...item, partGrade } : item)),
    );
  };

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading available repairs</span>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        tone="danger"
        title="Could not load repairs"
        live
        action={
          <Button size="sm" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!catalogue || catalogue.services.length === 0) {
    return (
      <EmptyState
        icon="wrench"
        title="No repairs listed for this device"
        description="We can still help — message us on WhatsApp with your phone model and the problem."
        action={
          <Button variant="outline" onClick={() => window.location.assign("/contact")}>
            Contact support
          </Button>
        }
      />
    );
  }

  const atLimit = basket.length >= 4;

  return (
    <div className="space-y-3">
      {atLimit ? (
        <Alert tone="info" live>
          You have selected the maximum of 4 repairs for one visit. Remove one to add another, or
          call us to arrange a larger job.
        </Alert>
      ) : null}

      <ul className="space-y-3">
        {catalogue.services.map((service) => {
          const selection = selectedFor(service.id);
          const isSelected = Boolean(selection);
          const isExpanded = expandedId === service.id;
          // Before selection, preview the grade that clicking "Select" will
          // actually choose — otherwise the time and warranty would jump on selection.
          const activeOption =
            service.options.find((option) => option.partGrade === selection?.partGrade) ??
            service.options.find((option) => option.partGrade === "PREMIUM") ??
            service.options[0] ??
            null;
          const unavailable = !service.available;
          const blocked = !isSelected && atLimit;

          return (
            <li key={service.id}>
              <div
                className={cn(
                  "rounded-xl border-2 transition-[border-color,background-color,box-shadow] duration-200",
                  isSelected
                    ? "border-brand-600 bg-brand-50/70 shadow-md dark:border-brand-500 dark:bg-brand-950/50"
                    : "border-line bg-surface",
                  unavailable && "opacity-60",
                )}
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isSelected ? "bg-brand-700 text-white" : "bg-sunken text-brand-700 dark:text-brand-300",
                    )}
                  >
                    <Icon name={serviceIcon(service.iconKey)} size={23} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-ink">{service.name}</h3>
                      {unavailable ? (
                        <Badge tone="neutral" size="sm">
                          Not available for this device
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm leading-snug text-ink-muted">
                      {service.shortDescription}
                    </p>

                    {activeOption ? (
                      <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-subtle">
                        <div className="flex items-center gap-1.5">
                          <Icon name="clock" size={13} />
                          <dt className="sr-only">Repair time</dt>
                          <dd>{formatDurationRange(activeOption.durationMinutes)}</dd>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Icon name="shield-check" size={13} />
                          <dt className="sr-only">Warranty</dt>
                          <dd>{formatWarranty(activeOption.warrantyMonths)}</dd>
                        </div>
                        {service.options.length > 1 ? (
                          <div className="flex items-center gap-1.5">
                            <Icon name="tag" size={13} />
                            <dt className="sr-only">Options</dt>
                            <dd>
                              {service.options.length} part{" "}
                              {service.options.length === 1 ? "option" : "options"}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
                    <Button
                      variant={isSelected ? "secondary" : "outline"}
                      size="sm"
                      iconLeft={isSelected ? "check" : "plus"}
                      disabled={unavailable || blocked}
                      onClick={() => toggleService(service)}
                      aria-label={
                        isSelected ? `Remove ${service.name}` : `Select ${service.name}`
                      }
                    >
                      {isSelected ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>

                {/* Part-grade chooser */}
                {isSelected && service.options.length > 1 ? (
                  <div className="border-t border-brand-200 px-4 pb-4 pt-3 dark:border-brand-800 sm:px-5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : service.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`grades-${service.id}`}
                      className="flex w-full items-center justify-between gap-3 text-sm font-semibold text-brand-800 dark:text-brand-200"
                    >
                      <span className="flex items-center gap-2">
                        <Icon name="tag" size={14} />
                        Part quality: {activeOption?.partGradeLabel}
                      </span>
                      <Icon
                        name="chevron-down"
                        size={16}
                        className={cn("transition-transform duration-200", isExpanded && "rotate-180")}
                      />
                    </button>

                    <div id={`grades-${service.id}`} hidden={!isExpanded} className="mt-3">
                      <fieldset>
                        <legend className="sr-only">Choose part quality for {service.name}</legend>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {service.options.map((option) => {
                            const checked = option.partGrade === selection?.partGrade;
                            return (
                              <label
                                key={option.id}
                                className={cn(
                                  "flex cursor-pointer flex-col gap-1 rounded-lg border-2 p-3 transition-colors duration-200",
                                  checked
                                    ? "border-brand-600 bg-surface dark:border-brand-400"
                                    : "border-line bg-surface/60 hover:border-brand-300",
                                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
                                )}
                              >
                                <input
                                  type="radio"
                                  name={`grade-${service.id}`}
                                  value={option.partGrade}
                                  checked={checked}
                                  onChange={() => setGrade(service.id, option.partGrade)}
                                  className="sr-only"
                                />
                                <span className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-ink">
                                    {option.partGradeLabel}
                                  </span>
                                  {checked ? (
                                    <Icon
                                      name="check-circle"
                                      size={15}
                                      className="text-brand-600 dark:text-brand-400"
                                    />
                                  ) : null}
                                </span>
                                <span className="text-[11px] leading-snug text-ink-subtle">
                                  {option.partGradeDescription} · {formatWarranty(option.warrantyMonths)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>

                      {activeOption?.notes ? (
                        <p className="mt-2 text-xs text-ink-subtle">{activeOption.notes}</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
