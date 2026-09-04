"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Icon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert, Badge, EmptyState, Skeleton } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/Pagination";
import { Field, Input, Select } from "@/components/ui/form";
import { api, ApiClientError, queryString } from "@/lib/api-client";
import { PART_GRADES, PART_GRADE_META, type PartGrade } from "@/lib/constants";
import { formatDurationRange, formatMoney, formatWarranty } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BrandOption } from "@/components/booking/types";

/**
 * Public price explorer.
 *
 * The reference site keeps pricing behind a separate booking app; this page puts
 * the whole price book on the open web — searchable, filterable and indexable.
 * Filters are reflected in the URL so a filtered view can be linked or shared.
 */

type PriceRow = {
  id: string;
  price: number;
  compareAtPrice: number | null;
  partGrade: PartGrade;
  durationMinutes: number;
  warrantyMonths: number;
  isAvailable: boolean;
  notes: string | null;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  serviceName: string;
  serviceSlug: string;
  serviceIconKey: string;
};

type PriceResult = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: PriceRow[];
};

type ServiceOption = { id: string; name: string; slug: string };

export function PriceExplorer({
  brands,
  services,
}: {
  brands: BrandOption[];
  services: ServiceOption[];
}) {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [service, setService] = useState("");
  const [partGrade, setPartGrade] = useState<PartGrade | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PriceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Seed filters from the URL so deep links from the footer and service pages
  // land pre-filtered.
  useEffect(() => {
    const urlBrand = searchParams.get("brand");
    const urlService = searchParams.get("service");
    const urlSearch = searchParams.get("q");
    if (urlBrand) setBrand(urlBrand);
    if (urlService) setService(urlService);
    if (urlSearch) {
      setSearch(urlSearch);
      setDebouncedSearch(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Keep the address bar in step with the filters, without adding a history
  // entry per keystroke.
  useEffect(() => {
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (service) params.set("service", service);
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (partGrade !== "ALL") params.set("grade", partGrade);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/pricing?${query}` : "/pricing");
  }, [brand, service, debouncedSearch, partGrade]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const query = queryString({
      brand: brand || undefined,
      service: service || undefined,
      search: debouncedSearch || undefined,
      partGrade: partGrade === "ALL" ? undefined : partGrade,
      page,
      pageSize: 20,
    });

    api
      .get<PriceResult>(`/api/pricing${query}`, controller.signal)
      .then(setResult)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setResult(null);
        setError(cause instanceof ApiClientError ? cause.message : "Could not load prices.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [brand, service, debouncedSearch, partGrade, page, reloadKey]);

  const activeFilterCount = useMemo(
    () =>
      [brand, service, debouncedSearch, partGrade !== "ALL" ? partGrade : ""].filter(Boolean).length,
    [brand, service, debouncedSearch, partGrade],
  );

  const clearFilters = () => {
    setBrand("");
    setService("");
    setSearch("");
    setDebouncedSearch("");
    setPartGrade("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Field label="Search device or repair" htmlFor="price-search" hideLabel>
              <Input
                id="price-search"
                type="search"
                iconLeft="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search: iPhone 15, Galaxy S24, screen…"
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="lg:col-span-3">
            <Field label="Brand" htmlFor="price-brand" hideLabel>
              <Select
                id="price-brand"
                value={brand}
                onChange={(event) => {
                  setBrand(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by brand"
              >
                <option value="">All brands</option>
                {brands.map((entry) => (
                  <option key={entry.id} value={entry.slug}>
                    {entry.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="lg:col-span-4">
            <Field label="Repair" htmlFor="price-service" hideLabel>
              <Select
                id="price-service"
                value={service}
                onChange={(event) => {
                  setService(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by repair type"
              >
                <option value="">All repairs</option>
                {services.map((entry) => (
                  <option key={entry.id} value={entry.slug}>
                    {entry.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div
            role="radiogroup"
            aria-label="Filter by part quality"
            className="flex flex-wrap items-center gap-1.5"
          >
            {(["ALL", ...PART_GRADES] as const).map((grade) => {
              const selected = partGrade === grade;
              return (
                <button
                  key={grade}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setPartGrade(grade);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
                    selected
                      ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500"
                      : "border-line text-ink-muted hover:border-brand-300 hover:text-ink",
                  )}
                >
                  {grade === "ALL" ? "All grades" : PART_GRADE_META[grade].label}
                </button>
              );
            })}
          </div>

          {activeFilterCount > 0 ? (
            <Button variant="ghost" size="sm" iconLeft="close" onClick={clearFilters}>
              Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Results */}
      {error ? (
        <Alert
          tone="danger"
          title="Could not load prices"
          live
          action={
            <Button size="sm" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : loading && !result ? (
        <div className="space-y-2" role="status" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading prices</span>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <>
          <div
            className={cn("scroll-x rounded-xl border border-line transition-opacity", loading && "opacity-60")}
            aria-busy={loading}
          >
            <table className="w-full min-w-[46rem] text-sm">
              <caption className="sr-only">Repair prices by device and service</caption>
              <thead>
                <tr className="border-b border-line bg-sunken text-left">
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">
                    Device
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">
                    Repair
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">
                    Part grade
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">
                    Time
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">
                    Warranty
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-ink">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.items.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-sunken">
                    <th scope="row" className="px-4 py-3.5 text-left">
                      <span className="block font-semibold text-ink">{row.modelName}</span>
                      <span className="text-xs text-ink-subtle">{row.brandName}</span>
                    </th>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/services/${row.serviceSlug}`}
                        className="text-ink-muted underline-offset-4 transition-colors hover:text-brand-700 hover:underline dark:hover:text-accent-300"
                      >
                        {row.serviceName}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        tone={
                          row.partGrade === "ORIGINAL"
                            ? "accent"
                            : row.partGrade === "PREMIUM"
                              ? "brand"
                              : "neutral"
                        }
                        size="sm"
                      >
                        {PART_GRADE_META[row.partGrade].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-ink-muted">
                      {formatDurationRange(row.durationMinutes)}
                    </td>
                    <td className="px-4 py-3.5 text-ink-muted">
                      {formatWarranty(row.warrantyMonths)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="tabular font-display text-base font-bold text-ink">
                        {row.price === 0 ? "Free" : formatMoney(row.price)}
                      </span>
                      {row.compareAtPrice ? (
                        <span className="tabular block text-xs text-ink-subtle line-through">
                          {formatMoney(row.compareAtPrice)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            onPageChange={(next) => {
              setPage(next);
              window.scrollTo({ top: 260, behavior: "smooth" });
            }}
            itemLabel="prices"
          />
        </>
      ) : (
        <EmptyState
          icon="search"
          title="No prices matched those filters"
          description="Try a different device or repair, or clear the filters. If your device is not listed at all, we can still quote it manually."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
              <ButtonLink href="/contact" iconRight="arrow-right">
                Ask for a custom quote
              </ButtonLink>
            </div>
          }
        />
      )}
    </div>
  );
}
