"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Alert, Card, EmptyState, Skeleton, StatusBadge } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/Pagination";
import { Input, Select } from "@/components/ui/form";
import { api, ApiClientError, queryString } from "@/lib/api-client";
import {
  REPAIR_STATUSES,
  SERVICE_TYPES,
  SERVICE_TYPE_META,
  STATUS_META,
  type RepairStatus,
} from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { cn, formatPhone, formatRelative, formatShortDate } from "@/lib/utils";

/**
 * Booking management table.
 *
 * Server-side filtering, sorting and pagination — the admin can have tens of
 * thousands of bookings, so nothing is filtered in the browser. Filter state
 * lives in the URL so a filtered view can be bookmarked or shared with a
 * colleague.
 */

type BookingRow = {
  id: string;
  reference: string;
  status: RepairStatus;
  statusLabel: string;
  serviceType: string;
  serviceTypeLabel: string;
  deviceLabel: string;
  services: string[];
  customerName: string;
  customerPhone: string;
  total: number;
  technicianName: string | null;
  scheduledFor: string | null;
  slotLabel: string | null;
  createdAt: string;
};

type BookingListResult = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: BookingRow[];
};

export function BookingsTable({ initialStatus = "ALL" }: { initialStatus?: string }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [serviceType, setServiceType] = useState("ALL");
  const [sort, setSort] = useState<"newest" | "oldest" | "value">("newest");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<BookingListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const query = queryString({
      status,
      serviceType,
      search: debouncedSearch || undefined,
      sort,
      page,
      pageSize: 20,
    });

    api
      .get<BookingListResult>(`/api/admin/bookings${query}`, controller.signal)
      .then(setResult)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setResult(null);
        setError(cause instanceof ApiClientError ? cause.message : "Could not load bookings.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [status, serviceType, debouncedSearch, sort, page, reloadKey]);

  const activeFilters = useMemo(
    () => [status !== "ALL", serviceType !== "ALL", Boolean(debouncedSearch)].filter(Boolean).length,
    [status, serviceType, debouncedSearch],
  );

  const clearFilters = () => {
    setStatus("ALL");
    setServiceType("ALL");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label htmlFor="booking-search" className="sr-only">
              Search bookings
            </label>
            <Input
              id="booking-search"
              type="search"
              iconLeft="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Repair ID, customer, phone, device…"
              autoComplete="off"
            />
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="booking-status" className="sr-only">
              Filter by status
            </label>
            <Select
              id="booking-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>
              {REPAIR_STATUSES.map((entry) => (
                <option key={entry} value={entry}>
                  {STATUS_META[entry].label}
                </option>
              ))}
            </Select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="booking-type" className="sr-only">
              Filter by service type
            </label>
            <Select
              id="booking-type"
              value={serviceType}
              onChange={(event) => {
                setServiceType(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All types</option>
              {SERVICE_TYPES.map((entry) => (
                <option key={entry} value={entry}>
                  {SERVICE_TYPE_META[entry].label}
                </option>
              ))}
            </Select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="booking-sort" className="sr-only">
              Sort bookings
            </label>
            <Select
              id="booking-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="value">Highest value</option>
            </Select>
          </div>
        </div>

        {activeFilters > 0 ? (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
            <p className="text-sm text-ink-subtle">
              {activeFilters} filter{activeFilters === 1 ? "" : "s"} active
            </p>
            <Button variant="ghost" size="sm" iconLeft="close" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Quick status chips */}
      <div className="scroll-x hide-scrollbar flex gap-2 pb-1">
        {(["ALL", "BOOKING_RECEIVED", "DIAGNOSIS", "REPAIR_IN_PROGRESS", "QUALITY_CHECK", "READY_FOR_PICKUP", "COMPLETED"] as const).map(
          (entry) => {
            const active = status === entry;
            return (
              <button
                key={entry}
                type="button"
                onClick={() => {
                  setStatus(entry);
                  setPage(1);
                }}
                aria-pressed={active}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200",
                  active
                    ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500"
                    : "border-line text-ink-muted hover:border-brand-300 hover:text-ink",
                )}
              >
                {entry === "ALL" ? "All" : STATUS_META[entry].label}
              </button>
            );
          },
        )}
      </div>

      {/* Results */}
      {error ? (
        <Alert
          tone="danger"
          title="Could not load bookings"
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
          <span className="sr-only">Loading bookings</span>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <>
          {/* Desktop table */}
          <Card className={cn("hidden overflow-hidden transition-opacity lg:block", loading && "opacity-60")}>
            <div className="scroll-x">
              <table className="w-full min-w-[64rem] text-sm">
                <caption className="sr-only">Bookings</caption>
                <thead>
                  <tr className="border-b border-line bg-sunken text-left">
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Repair ID</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Device</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Customer</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Appointment</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Technician</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-ink">Total</th>
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {result.items.map((booking) => (
                    <tr key={booking.id} className="transition-colors hover:bg-sunken">
                      <th scope="row" className="px-4 py-3.5 text-left">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="tabular font-mono text-xs font-bold text-brand-700 hover:underline dark:text-accent-300"
                        >
                          {booking.reference}
                        </Link>
                        <span className="mt-0.5 block text-xs font-normal text-ink-subtle">
                          {formatRelative(booking.createdAt)}
                        </span>
                      </th>
                      <td className="px-4 py-3.5">
                        <span className="block font-medium text-ink">{booking.deviceLabel}</span>
                        <span className="block truncate text-xs text-ink-subtle">
                          {booking.services.join(", ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block text-ink">{booking.customerName}</span>
                        <span className="tabular block text-xs text-ink-subtle">
                          {formatPhone(booking.customerPhone)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {booking.scheduledFor ? (
                          <>
                            <span className="block text-ink">
                              {formatShortDate(booking.scheduledFor)}
                            </span>
                            <span className="block text-xs text-ink-subtle">{booking.slotLabel}</span>
                          </>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-ink-muted">
                        {booking.technicianName ?? (
                          <span className="text-ink-subtle">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={booking.status} size="sm" />
                      </td>
                      <td className="tabular px-4 py-3.5 text-right font-semibold text-ink">
                        {formatMoney(booking.total)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          aria-label={`Open booking ${booking.reference}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-line hover:text-ink"
                        >
                          <Icon name="chevron-right" size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards — a table squeezed onto a phone is unusable. */}
          <ul className={cn("space-y-3 lg:hidden", loading && "opacity-60")}>
            {result.items.map((booking) => (
              <li key={booking.id}>
                <Link href={`/admin/bookings/${booking.id}`} className="block">
                  <Card interactive className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-brand-700 dark:text-accent-300">
                          {booking.reference}
                        </p>
                        <p className="mt-1 font-semibold text-ink">{booking.deviceLabel}</p>
                        <p className="mt-0.5 truncate text-sm text-ink-muted">
                          {booking.services.join(", ")}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} size="sm" />
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3 text-xs">
                      <div>
                        <dt className="text-ink-subtle">Customer</dt>
                        <dd className="mt-0.5 truncate font-medium text-ink">
                          {booking.customerName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-subtle">Appointment</dt>
                        <dd className="mt-0.5 font-medium text-ink">
                          {booking.scheduledFor ? formatShortDate(booking.scheduledFor) : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-subtle">Technician</dt>
                        <dd className="mt-0.5 truncate font-medium text-ink">
                          {booking.technicianName ?? "Unassigned"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-subtle">Total</dt>
                        <dd className="tabular mt-0.5 font-bold text-ink">
                          {formatMoney(booking.total)}
                        </dd>
                      </div>
                    </dl>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            onPageChange={(next) => {
              setPage(next);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            itemLabel="bookings"
          />
        </>
      ) : (
        <EmptyState
          icon="inbox"
          title={activeFilters > 0 ? "No bookings match those filters" : "No bookings yet"}
          description={
            activeFilters > 0
              ? "Try a different status or clear the filters to see everything."
              : "Bookings appear here as soon as customers confirm them on the website."
          }
          action={
            activeFilters > 0 ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
