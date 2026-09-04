import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icons";
import { Card, EmptyState, StatTile, StatusBadge } from "@/components/ui/primitives";
import { requirePermission } from "@/lib/auth";
import { CONTACT_METHOD_LABEL, type ContactMethod } from "@/lib/constants";
import { NotFoundError } from "@/lib/errors";
import { formatMoney } from "@/lib/money";
import { formatDate, formatPhone, formatRelative } from "@/lib/utils";
import { getCustomerById } from "@/server/services/customer.service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const customer = await getCustomerById(id);
    return { title: customer.fullName };
  } catch {
    return { title: "Customer" };
  }
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("customers:read");
  const { id } = await params;

  let customer;
  try {
    customer = await getCustomerById(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <Icon name="arrow-left" size={15} />
        Back to customers
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {customer.fullName}
          </h1>
          <p className="mt-1.5 text-ink-muted">
            Customer since {formatDate(customer.createdAt)}
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Total bookings"
          value={customer.stats.totalBookings}
          icon="list"
          tone="brand"
        />
        <StatTile
          label="Completed repairs"
          value={customer.stats.completedBookings}
          icon="check-circle"
          tone="success"
        />
        <StatTile
          label="Lifetime value"
          value={formatMoney(customer.stats.lifetimeValue)}
          icon="rupee"
          tone="accent"
          hint="completed repairs only"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Contact details */}
        <Card className="p-5 xl:col-span-4">
          <h2 className="font-display text-base font-bold text-ink">Contact details</h2>
          <dl className="mt-4 space-y-3.5 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">Phone</dt>
              <dd className="tabular mt-0.5">
                <a
                  href={`tel:+91${customer.phone}`}
                  className="font-semibold text-brand-700 hover:underline dark:text-accent-300"
                >
                  +91 {formatPhone(customer.phone)}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">Email</dt>
              <dd className="mt-0.5">
                {customer.email ? (
                  <a
                    href={`mailto:${customer.email}`}
                    className="break-all font-semibold text-brand-700 hover:underline dark:text-accent-300"
                  >
                    {customer.email}
                  </a>
                ) : (
                  <span className="text-ink-subtle">Not provided</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                Preferred contact
              </dt>
              <dd className="mt-0.5 text-ink">
                {CONTACT_METHOD_LABEL[customer.preferredContact as ContactMethod] ??
                  customer.preferredContact}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">Address</dt>
              <dd className="mt-0.5 text-ink">
                {customer.addressLine ? (
                  <>
                    {customer.addressLine}
                    <br />
                    {[customer.city, customer.state, customer.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </>
                ) : (
                  <span className="text-ink-subtle">Not provided</span>
                )}
              </dd>
            </div>
            {customer.notes ? (
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                  Internal notes
                </dt>
                <dd className="mt-0.5 text-ink-muted">{customer.notes}</dd>
              </div>
            ) : null}
          </dl>
        </Card>

        {/* Repair history */}
        <div className="xl:col-span-8">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-5 py-3.5">
              <h2 className="font-display text-base font-bold text-ink">Repair history</h2>
            </div>

            {customer.bookings.length === 0 ? (
              <EmptyState
                icon="inbox"
                title="No repairs yet"
                className="m-4 border-0 bg-transparent py-10"
              />
            ) : (
              <ul className="divide-y divide-line">
                {customer.bookings.map((booking) => (
                  <li key={booking.id}>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-sunken"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-700 dark:text-accent-300">
                            {booking.reference}
                          </span>
                          <StatusBadge status={booking.status} size="sm" />
                        </div>
                        <p className="mt-1 font-semibold text-ink">{booking.deviceLabel}</p>
                        <p className="mt-0.5 truncate text-sm text-ink-muted">
                          {booking.services.join(", ")}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-subtle">
                          {formatRelative(booking.createdAt)}
                          {booking.scheduledFor
                            ? ` · appointment ${formatDate(booking.scheduledFor)}`
                            : ""}
                        </p>
                      </div>

                      <span className="tabular shrink-0 font-semibold text-ink">
                        {formatMoney(booking.total)}
                      </span>
                      <Icon name="chevron-right" size={16} className="shrink-0 text-ink-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
