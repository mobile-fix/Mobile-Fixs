"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Alert, Badge, Card, EmptyState, Skeleton, StatusBadge } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/Pagination";
import { Input } from "@/components/ui/form";
import { api, ApiClientError, queryString } from "@/lib/api-client";
import type { RepairStatus } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { cn, formatPhone, formatRelative } from "@/lib/utils";

type CustomerRow = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  city: string | null;
  preferredContact: string;
  totalBookings: number;
  lifetimeValue: number;
  lastBookingAt: string | null;
  currentRepair: {
    reference: string;
    status: RepairStatus;
    statusLabel: string;
    deviceLabel: string;
  } | null;
  createdAt: string;
};

type CustomerListResult = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: CustomerRow[];
};

/** Customer directory with server-side search and pagination. */
export function CustomersTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<CustomerListResult | null>(null);
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

    api
      .get<CustomerListResult>(
        `/api/admin/customers${queryString({ search: debouncedSearch || undefined, page, pageSize: 20 })}`,
        controller.signal,
      )
      .then(setResult)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setResult(null);
        setError(cause instanceof ApiClientError ? cause.message : "Could not load customers.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, page, reloadKey]);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <Input
          id="customer-search"
          type="search"
          iconLeft="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, phone or email…"
          autoComplete="off"
        />
      </Card>

      {error ? (
        <Alert
          tone="danger"
          title="Could not load customers"
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
          <span className="sr-only">Loading customers</span>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <>
          <Card className={cn("hidden overflow-hidden lg:block", loading && "opacity-60")}>
            <div className="scroll-x">
              <table className="w-full min-w-[56rem] text-sm">
                <caption className="sr-only">Customers</caption>
                <thead>
                  <tr className="border-b border-line bg-sunken text-left">
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Customer</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Contact</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Current repair</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-ink">Repairs</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-ink">Lifetime value</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {result.items.map((customer) => (
                    <tr key={customer.id} className="transition-colors hover:bg-sunken">
                      <th scope="row" className="px-4 py-3.5 text-left">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="font-semibold text-brand-700 hover:underline dark:text-accent-300"
                        >
                          {customer.fullName}
                        </Link>
                        <span className="mt-0.5 block text-xs font-normal text-ink-subtle">
                          {customer.city ?? "—"} · joined {formatRelative(customer.createdAt)}
                        </span>
                      </th>
                      <td className="px-4 py-3.5">
                        <span className="tabular block text-ink">
                          {formatPhone(customer.phone)}
                        </span>
                        <span className="block truncate text-xs text-ink-subtle">
                          {customer.email ?? "No email"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {customer.currentRepair ? (
                          <>
                            <StatusBadge status={customer.currentRepair.status} size="sm" />
                            <span className="mt-1 block text-xs text-ink-subtle">
                              {customer.currentRepair.deviceLabel}
                            </span>
                          </>
                        ) : (
                          <span className="text-ink-subtle">None active</span>
                        )}
                      </td>
                      <td className="tabular px-4 py-3.5 text-right text-ink">
                        {customer.totalBookings}
                      </td>
                      <td className="tabular px-4 py-3.5 text-right font-semibold text-ink">
                        {formatMoney(customer.lifetimeValue)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          aria-label={`Open ${customer.fullName}`}
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

          <ul className={cn("space-y-3 lg:hidden", loading && "opacity-60")}>
            {result.items.map((customer) => (
              <li key={customer.id}>
                <Link href={`/admin/customers/${customer.id}`} className="block">
                  <Card interactive className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{customer.fullName}</p>
                        <p className="tabular mt-0.5 text-sm text-ink-muted">
                          {formatPhone(customer.phone)}
                        </p>
                      </div>
                      {customer.currentRepair ? (
                        <StatusBadge status={customer.currentRepair.status} size="sm" />
                      ) : (
                        <Badge tone="neutral" size="sm">
                          No active repair
                        </Badge>
                      )}
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-4 border-t border-line pt-3 text-xs">
                      <div>
                        <dt className="text-ink-subtle">Repairs</dt>
                        <dd className="tabular mt-0.5 font-semibold text-ink">
                          {customer.totalBookings}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-subtle">Lifetime value</dt>
                        <dd className="tabular mt-0.5 font-semibold text-ink">
                          {formatMoney(customer.lifetimeValue)}
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
            itemLabel="customers"
          />
        </>
      ) : (
        <EmptyState
          icon="users"
          title={debouncedSearch ? "No customers matched" : "No customers yet"}
          description={
            debouncedSearch
              ? `Nothing found for "${debouncedSearch}". Try a phone number or part of a name.`
              : "Customer records are created automatically the first time somebody books a repair."
          }
          action={
            debouncedSearch ? (
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
